
import sys
import requests
sid = sys.argv[1]


resp = requests.post('http://fritz.box/data.lua',
                     headers={
                         "content-type": "application/x-www-form-urlencoded"
                     }, allow_redirects=False,
                     data=f"sid={sid}&page=wSet&xhrId=wlanDevices&no_sidrenew=1")
if resp.status_code != 200:
    print(f"ERROR: {resp.status_code}")
    exit(1)
print(resp.text)
