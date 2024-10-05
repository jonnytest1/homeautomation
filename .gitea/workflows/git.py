
import subprocess


def get_changed_files():
    process = subprocess.run(
        "git diff --name-only HEAD HEAD~1", shell=True, stdout=subprocess.PIPE)

    return process.stdout.decode().split('\n')
