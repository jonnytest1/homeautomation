import win32api
from win32con import KEYEVENTF_EXTENDEDKEY, VK_VOLUME_DOWN


win32api.keybd_event(VK_VOLUME_DOWN, 0, KEYEVENTF_EXTENDEDKEY, 0)