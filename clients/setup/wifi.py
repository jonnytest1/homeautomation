import subprocess
from os.path import join, dirname
from time import sleep
from util.netshparser import parse_to_json
from wifiportal import set_captive_portal_detection


class NetworkItem:
    def __init__(self, data: dict, interface_ref: "NetworkInterface"):
        self.ssid: str = data["name"]
        self.interface = interface_ref

        self.max_strength = -1

        for key, bssi in data.items():
            key_str: str = key
            if key_str.startswith("BSSID"):
                signal = int(bssi["Signal"].replace("%", ""))
                if signal > self.max_strength:
                    self.max_strength = signal


class NetworkInterface:

    def __init__(self, data: dict):
        self.data = data
        self.interace_name: str = data["Schnittstellenname"]

        self.networks: list = []

        for key, value in self.data.items():
            self.networks.append(value)

    def get_networks(self):
        return [NetworkItem(n, self) for n in self.networks if isinstance(n, dict)]


def get_networks():
    process = subprocess.run(
        ['netsh', 'wlan', 'show', 'network', 'mode=bssid'], capture_output=True)
    process.check_returncode()
    devicestr = process.stdout.decode("cp850")
    results = parse_to_json(devicestr)

    if isinstance(results, dict):
        results = [results]

    return [NetworkInterface(r) for r in results]


def disconnect(interface: str):
    result = subprocess.run(
        ['netsh', 'wlan', 'disconnect', interface], capture_output=True, text=True)

    result.check_returncode()


def create_profile(net: NetworkItem, name: str = ""):

    profile_hex = ''.join(format(ord(char), 'X') for char in net.ssid)
    pwd = ""
    if name == "":
        name = net.ssid

    profile_xml = f"""<?xml version="1.0"?>
<WLANProfile xmlns="http://www.microsoft.com/networking/WLAN/profile/v1">
    <name>{name}</name>
    <SSIDConfig>
        <SSID>
            <hex>{profile_hex}</hex>
            <name>{net.ssid}</name>
        </SSID>
    </SSIDConfig>
    <connectionType>ESS</connectionType>
    <connectionMode>auto</connectionMode>
    <MSM>
        <security>
            <authEncryption>
                <authentication>open</authentication>
                <encryption>none</encryption>
                <useOneX>false</useOneX>
            </authEncryption>
        </security>
    </MSM>
</WLANProfile>
    """

    file_target = join(dirname(__file__), "profile.xml")
    with open(file_target, "w") as file:
        file.write(profile_xml)

    # ['netsh', 'wlan', 'add', "profile", f'filename="{cmd_safe_path}"', f"interface=\"{net.interface.interace_name}\""]
    cmd_safe_path = file_target
    process = subprocess.run(
        f'netsh wlan add profile filename="{cmd_safe_path}" interface="{net.interface.interace_name}"', capture_output=True, shell=True)

    stdout = process.stdout.decode("cp850")
    print(stdout)
    process.check_returncode()


def connect_to_network(network: NetworkItem):

    process = subprocess.run(
        ['netsh', 'wlan', 'show', "profile"], capture_output=True)
    process.check_returncode()

    decoded = process.stdout.decode("cp850")

    profilename = network.ssid

    if f": {profilename}" not in decoded:
        print("creating profile")
        create_profile(network, profilename)

    # set_captive_portal_detection(False)
    process = subprocess.run(
        f'netsh wlan connect name="{profilename}" interface="{network.interface.interace_name}"',
        capture_output=True, shell=True)

    decoded = process.stdout.decode("cp850")
    print(decoded)
    process.check_returncode()
    # set_captive_portal_detection(True)


def get_status(interface: NetworkInterface):

    process = subprocess.run(
        ['netsh', 'interface', 'ipv4', "show", "config", interface.interace_name], capture_output=True)

    stdout = process.stdout.decode("cp850")
    results = parse_to_json(stdout)
    if (isinstance(results, list)):
        raise Exception("unexpted type")
    return results
