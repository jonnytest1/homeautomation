import socket
import os
import json
import sys

from git import current_commit, get_changed_files

socket_path = '/var/run/dpl/c_dpl.sock'


if os.path.exists(socket_path):
    print("exists")


fam: socket.AddressFamily = socket.AF_UNIX  # type: ignore
client = socket.socket(fam, socket.SOCK_STREAM)

print(f"connecting to {socket_path}")
client.connect(socket_path)


diff_since = "HEAD~1"
commit_file = "/var/run/dpl/last_action/commit"
if os.path.exists(path=commit_file):
    f = open(commit_file, "r")
    diff_since = f.read()
    f.close()

print("diffing from "+diff_since)
changed_files = get_changed_files(diff_since)
print("git diff: ")
print(changed_files)
message = json.dumps(dict(type="deploy", files=changed_files))
client.sendall(message.encode())


buff: str = ""

while True:
    try:
        buff += client.recv(1024).decode()

        response_data = json.loads(buff)

        for line in response_data["logs"]:
            print(line)

        client.close()

        if "type" in response_data and response_data["type"] == "error":
            sys.exit(1)

        file = open(commit_file, "w")
        file.write(current_commit())
        file.close()

        break
    except json.JSONDecodeError as e:
        continue
