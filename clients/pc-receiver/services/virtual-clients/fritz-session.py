import sys
import hashlib
import time
import urllib.request
import urllib.parse
import xml.etree.ElementTree as ET
import requests

LOGIN_SID_ROUTE = "/login_sid.lua?version=2"


class LoginState:
    def __init__(self, challenge: str, blocktime: int):
        self.challenge = challenge
        self.blocktime = blocktime
        self.is_pbkdf2 = challenge.startswith("2$")


def get_sid(box_url: str, username: str, password: str):
    try:
        state = get_login_state(box_url)
    except Exception as ex:
        raise Exception("failed to get challenge") from ex

    if state.is_pbkdf2:
        print("PBKDF2 supported")
        challenge_response = calculate_pbkdf2_response(state.challenge,
                                                       password)
    else:
        print("Falling back to MD5")
        challenge_response = calculate_md5_response(state.challenge,
                                                    password)
    if state.blocktime > 0:
        print(f"Waiting for {state.blocktime} seconds...")
        time.sleep(state.blocktime)
    try:
        sid = send_response(box_url, username, challenge_response)
    except Exception as ex:
        raise Exception("failed to login") from ex
    if sid == "0000000000000000":
        raise Exception("wrong username or password")
    return sid


def get_login_state(box_url: str):
    url = box_url + LOGIN_SID_ROUTE
    http_response = urllib.request.urlopen(url)
    xml = ET.fromstring(http_response.read())
    # print(f"xml: {xml}")
    challenge_el = xml.find("Challenge")
    if challenge_el == None:
        raise Exception("missing Challenge element")
    challenge = challenge_el.text
    block_time_el = xml.find("BlockTime")
    if block_time_el == None:
        raise Exception("missing BlockTime element")
    block_time_text = block_time_el.text
    if block_time_text == None:
        raise Exception("missing BlockTime text")
    blocktime = int(block_time_text)
    if challenge == None:
        raise Exception("missing challenge text")
    return LoginState(challenge, blocktime)


def calculate_pbkdf2_response(challenge: str, password: str):
    challenge_parts = challenge.split("$")
    # Extract all necessary values encoded into the challenge
    iter1 = int(challenge_parts[1])
    salt1 = bytes.fromhex(challenge_parts[2])
    iter2 = int(challenge_parts[3])
    salt2 = bytes.fromhex(challenge_parts[4])
    # Hash twice, once with static salt...
    hash1 = hashlib.pbkdf2_hmac("sha256", password.encode(), salt1, iter1)
    # Once with dynamic salt.
    hash2 = hashlib.pbkdf2_hmac("sha256", hash1, salt2, iter2)
    return f"{challenge_parts[4]}${hash2.hex()}"


def calculate_md5_response(challenge: str, password: str):
    response = challenge + "-" + password
    # the legacy response needs utf_16_le encoding
    response = response.encode("utf_16_le")
    md5_sum = hashlib.md5()
    md5_sum.update(response)
    response = challenge + "-" + md5_sum.hexdigest()
    return response


def send_response(box_url: str, username: str, challenge_response: str):
    """ Send the response and return the parsed sid. raises an Exception on
   error """
    # Build response params
    post_data_dict = {"username": username, "response": challenge_response}
    post_data = urllib.parse.urlencode(post_data_dict).encode()
    headers = {"Content-Type": "application/x-www-form-urlencoded"}
    url = box_url + LOGIN_SID_ROUTE
    # Send response
    http_request = urllib.request.Request(url, post_data, headers)
    http_response = urllib.request.urlopen(http_request)
    # Parse SID from resulting XML.
    xml = ET.fromstring(http_response.read())
    sid_element = xml.find("SID")
    if (sid_element == None):
        raise Exception("missing sid element")
    return sid_element.text


def main():
    if len(sys.argv) < 4:
        print(f"Usage: {sys.argv[0]} http://fritz.box user pass")
        exit(1)
    url = sys.argv[1]
    username = sys.argv[2]
    password = sys.argv[3]
    sid = get_sid(url, username, password)
    print(f"Successful login for user: {username}")
    print(f"sid: {sid}")


if __name__ == "__main__":
    main()
