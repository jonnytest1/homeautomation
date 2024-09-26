import socket
import os

import debugpy

try:
    debugpy.listen(("0.0.0.0", 5678))
    print("Waiting for debugger attach 5678")
except:
    debugpy.listen(("0.0.0.0", 5679))
    print("Waiting for debugger attach on fallback port 5679")

debugpy.wait_for_client()


socket_path = '/var/run/c_dpl.sock'

client = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)


client.connect(socket_path)

message = 'Hello from the client!'
client.sendall(message.encode())

response = client.recv(1024)
print(f'Received response: {response.decode()}')

client.close()
