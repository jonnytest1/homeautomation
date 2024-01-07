import subprocess
from re import findall, DOTALL


def get_networks():
    process = subprocess.run(
        ['netsh', 'wlan', 'show', 'network'], capture_output=True)
    process.check_returncode()
    devicestr = process.stdout.decode("cp850")
    devicestr = devicestr.replace("\r", "")

    result: list[str] = findall(
        r"SSID \d+ : ([^ ]*)\n", devicestr, DOTALL)
    return result


def connect_to_network(network: str):
    # netsh wlan show interface
    process = subprocess.run(
        ['netsh', 'wlan', 'connect', f'ssid={network}', f"name=dfdfgdf24"], capture_output=True)
    process.check_returncode()
