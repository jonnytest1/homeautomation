import socket
import os
import json

from git import get_changed_files

socket_path = '/var/run/dpl/c_dpl.sock'


if os.path.exists(socket_path):
    print("exists")


client = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)

print(f"connecting to {socket_path}")
client.connect(socket_path)

changed_files = get_changed_files()
print("git diff: ")
print(changed_files)
message = json.dumps(dict(type="deploy", files=changed_files))
client.sendall(message.encode())

response = client.recv(1024)
print(f'Received response: {response.decode()}')

client.close()
