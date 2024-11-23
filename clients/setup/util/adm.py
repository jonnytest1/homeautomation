import os
import sys
import ctypes


def is_admin():
    try:
        # Check if the script is being run as administrator
        return os.geteuid() == 0  # type: ignore # This works on Unix-like systems
    except AttributeError:
        # On Windows, use the ctypes method
        return ctypes.windll.shell32.IsUserAnAdmin() != 0


def run_as_admin():
    """Request to run the script with administrator privileges."""
    if sys.version_info[0] == 2:
        script = sys.argv[0]
        params = ' '.join(sys.argv[1:])
    else:
        script = sys.argv[0]
        params = ' '.join(sys.argv[1:])

    # Run the script again with elevated privileges
    ctypes.windll.shell32.ShellExecuteW(
        None, "runas", sys.executable, script + ' ' + params, None, 1)
