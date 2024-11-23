from time import sleep
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


adapter = "WLAN 3"
disconnect(adapter)


matched = False

debugpy.wait_for_client()


def tasmotaplug(ip: str):

    devicename = "test"
    sleep(5)

    info = requests.get(f"http://{ip}/in")
    resptext = info.text

    #
    "1Hostname}2tasmota-F96DEC-3564}1}2"
    hostname = resptext.split("Hostname}2")[1].split("}1}2")[0]

    print(f"set devicename to tasmota-{devicename}")
    url = f"http://{ip}/wi?s1={wifissid}&p1={wifipwd}&save=&h=tasmota-{devicename}"
    requests.get(url, allow_redirects=False,)

    # => http://192.168.4.1/in? works pre wifi
    wifiworked = False
    while not wifiworked:
        sleep(1)
        print("wifi check")
        resp = requests.get(f"http://{hostname}", allow_redirects=False,)
        if resp.status_code == 200:
            wifiworked = True
    print("setting friendlyname (Other)")
    requests.get(
        f"http://{hostname}/co?b3=on&b1=on&dn=Tasmota&a0=mqtt_{devicename}&b2=0&save=")

    sleep(2)

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
