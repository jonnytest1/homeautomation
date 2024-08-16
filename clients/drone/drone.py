import datetime
from time import sleep
from typing import Any, Union
from djitellopy import Tello
# https://github.com/damiafuentes/DJITelloPy/blob/master/README.md

from wifi import NetworkItem, connect_to_network, get_networks, get_status
from cv2 import imshow, imwrite

connected = False


tello_Id = "TELLO-E9"

status = get_status()
for interface_status in status:
    if interface_status["Status"] != "getrennt" and tello_Id in interface_status["SSID"]:
        connected = True
        print("already connected")

while (not connected):
    networks = get_networks()

    tellos: dict[str, list[NetworkItem]] = {}

    for network_interface in networks:
        for network in network_interface.get_networks():
            if network.ssid.startswith(tello_Id):
                print("got tello wifi")
                if network.ssid not in tellos:
                    tellos[network.ssid] = []
                tellos[network.ssid].append(network)

    for item in tellos.values():
        strongest: Union[NetworkItem, None] = None
        strength = -1
        for interface_con in item:
            if interface_con.max_strength > strength:
                strongest = interface_con
                strength = interface_con.max_strength

        if strongest is not None:
            print(
                f"connecting to {strongest.ssid} with {strongest.max_strength}%")
            connect_to_network(strongest)
            connected = True
    if connected:
        break
    # subprocess.check_output(
    #  "netsh wlan connect ssid=YOUR-WIFI-SSID name=PROFILE-NAME")


tello = Tello()


def connnect():
    e1: Union[Exception, None] = None
    for i in range(5):
        try:
            tello.connect()
            return
        except Exception as e:
            e1 = e
            print(e)
    if e1 is not None:
        raise e1
    raise Exception("no connection")


connnect()

print(f"battery: {tello.get_battery()}")

tello.streamon()
sleep(0.5)

frameread: Any
for i in range(10):
    try:
        frameread = tello.get_frame_read()
        break
    except Exception as e:
        if i == 8:
            raise e
        print(e)

while True:
    try:
        img = frameread.frame
        if img is not None:
            now = datetime.datetime.now().timestamp()
            imwrite(f"picture{now}.png", img)

    except Exception as e:
        print("err", e)
        pass
# tello.connect()
# tello.takeoff()
# tello.move_up(100)
# tello.land()
