from typing import Callable

import debugpy
import requests
from util.adm import is_admin, run_as_admin
from wifi import connect_to_network, disconnect, get_networks, get_status
from setupcreds.setupcreds import wifissid, wifipwd
if not is_admin():
    run_as_admin()
    exit()

try:
    debugpy.listen(("0.0.0.0", 5678))
    print("Waiting for debugger attach 5678")
except:
    debugpy.listen(("0.0.0.0", 5679))
    print("Waiting for debugger attach on fallback port 5679")

debugpy.wait_for_client()


adapter = "WLAN 3"
disconnect(adapter)


matched = False


def tasmotaplug(ip: str):
    url = f"http://{ip}/wi?s1={wifissid}&p1={wifipwd}&save="
    requests.get(url)
    pass


prefixmap: dict[str, Callable] = dict()
prefixmap["tasmota-"] = tasmotaplug

while not matched:
    interfaces = get_networks()
    for interface in interfaces:
        if interface.interace_name == adapter:
            for network in interface.get_networks():
                for key, val in prefixmap.items():
                    if network.ssid.startswith(key):
                        confirmation = input(f"connect to {network.ssid} [Y]n")
                        if confirmation == "y" or confirmation == "":
                            connect_to_network(network)
                            status = get_status(interface)
                            hostip = status['Standardgateway']
                            val(hostip)
                            print(status)
                print(network.ssid)
