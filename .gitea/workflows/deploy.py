import socket
import os

socket_path = '/var/run/c_dpl.sock'

client = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)


client.connect(socket_path)

message = 'Hello from the client!'
client.sendall(message.encode())

response = client.recv(1024)
print(f'Received response: {response.decode()}')

client.close()
