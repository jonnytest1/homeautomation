from djitellopy import Tello
# https://github.com/damiafuentes/DJITelloPy/blob/master/README.md
from cv2 import imshow
from cv2.typing import MatLike
from wifi import connect_to_network, get_networks

# while (True):
#    networks = get_networks()

#   for netowrk in networks:
#       if netowrk.startswith("TELLO"):
#          connect_to_network(netowrk)
#          break
#
# subprocess.check_output(
#   "netsh wlan connect ssid=YOUR-WIFI-SSID name=PROFILE-NAME")


tello = Tello()
tello.connect()

print(tello.get_battery())

tello.streamon()

img = tello.get_frame_read().frame
if img is not None:
    imshow("img", img)
# tello.connect()
# tello.takeoff()
# tello.move_up(100)
# tello.land()
