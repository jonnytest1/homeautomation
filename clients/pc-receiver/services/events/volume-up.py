import win32api
from win32con import KEYEVENTF_EXTENDEDKEY, VK_VOLUME_UP


win32api.keybd_event(VK_VOLUME_UP, 0, KEYEVENTF_EXTENDEDKEY, 0)
