
import subprocess


def get_changed_files(to_parent: str):
    print(subprocess.run(args="pwd", shell=True).stdout)
    process = subprocess.run(
        f"git diff --name-only HEAD {to_parent}", shell=True, stdout=subprocess.PIPE)

    return process.stdout.decode().strip().split('\n')


def current_commit():
    process = subprocess.run(
        "git rev-parse HEAD", shell=True, stdout=subprocess.PIPE)

    return process.stdout.decode().strip()
