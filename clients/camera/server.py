
# pip3 install pygame

import traceback
import sys
import socketserver
import http.server
import _thread
from camerahandler import CameraHandler
from customlogging import logKibana
import time
import requests
import json
sys.stdout = open("/home/pi/python/log.log", "a")

print("hello world")

PORT = 28080
SERVER_IP = 'https://192.168.178.54/nodets/'

cameraHandlerInstance = CameraHandler()


class CustomHandler(http.server.SimpleHTTPRequestHandler):

    def do_GET(self):
        self.handleRequest("GET")

    def handleRequest(self, method):
        postdata = None
        try:

            if self.headers['Content-Length'] != None:
                postdata = self.rfile.read(
                    int(self.headers['Content-Length'])).decode('utf-8')

            if self.headers['Content-Type'] == "application/json":
                print("parsing "+postdata+"to json")
                postdata = json.loads(postdata)

            response, mimetype = cameraHandlerInstance.trigger(postdata)

            if(response is None):
                self.send_response(204)
                self.end_headers()
            else:
                self.send_response(200)
                self.send_header('Content-type', mimetype)
                self.end_headers()
                self.wfile.write(str.encode(response))
        except Exception as e:
            logKibana("ERROR", "error in requset", e, args=dict(
                postdata=str(postdata)
            ))
            traceback.print_exc()

    def do_POST(self):
        self.handleRequest("POST")


def startServer():

    try:
        with socketserver.TCPServer(("", PORT), CustomHandler) as httpd:
            print("serving at port", PORT)
            try:
                httpd.serve_forever()
            except:
                print("clearing webserver")
                httpd.shutdown()
                httpd.socket.close()
    except OSError as e:
        if e.strerror == "Address already in use":
            print("Address already in use")
        else:
            print(type(e).__name__)
            print(e)


_thread.start_new_thread(startServer, tuple())

payload = {'deviceKey': 'camerapi',
           'port': str(PORT),
           'type': 'ip',
           'name': 'Camera Receiver🎥',
           'description': 'kitchen camera'}
headers = {'content-type': 'application/json'}
r = requests.post(SERVER_IP+"rest/receiver",
                  data=json.dumps(payload), verify=False, headers=headers)
print(r.text)
while True:
    cameraHandlerInstance.getImage()
    time.sleep(4/1000)
