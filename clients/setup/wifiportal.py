import subprocess
import winreg as reg

from util.adm import is_admin
REG_PATH = r"Software\\Policies\\Microsoft\\Windows\\WlanSvc"
REG_KEY = "AutoConnectToCaptivePortal"


def set_captive_portal_detection(enable: bool):

    if not is_admin():
        raise Exception("needs admin privileges to set registry")

    """Enable or disable captive portal detection by modifying the registry."""
    try:
        # Open the registry key for writing
        registry = reg.ConnectRegistry(None, reg.HKEY_LOCAL_MACHINE)
        try:
            reg_key = reg.OpenKey(
                registry, REG_PATH, 0, reg.KEY_WRITE)
        except FileNotFoundError:
            reg_key = reg.CreateKey(registry, REG_PATH)

        # Set the value for EnableCaptivePortalDetection
        reg.SetValueEx(reg_key, REG_KEY, 0, reg.REG_DWORD, 1 if enable else 0)

        # Close the registry key
        reg.CloseKey(reg_key)
        print("Captive Portal Detection has been",
              "enabled." if enable else "disabled.")
        apply_group_policy()
    except Exception as e:
        print(f"Failed to modify the registry: {e}")
        raise e


def apply_group_policy():
    """Apply the group policy changes."""
    try:
        subprocess.run(["gpupdate", "/force"], check=True)
        print("Group Policy updated successfully.")
    except subprocess.CalledProcessError as e:
        print(f"Failed to update group policy: {e}")
