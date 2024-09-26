import socket
import os

socket_path = '/var/run/dpl/c_dpl.sock'


if os.path.exists(socket_path):
    print("exists")


client = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)

print(f"connecting to {socket_path}")
client.connect(socket_path)

message = 'Hello from the client!'
client.sendall(message.encode())

response = client.recv(1024)
print(f'Received response: {response.decode()}')

client.close()
