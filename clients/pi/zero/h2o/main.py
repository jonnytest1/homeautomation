
from creds.env import mqtt_server, mqtt_user, mqtt_pwd
import paho.mqtt.client as mqtt
from paho.mqtt.enums import CallbackAPIVersion
import debugpy
from util.json import json_print
from gpios import connectionstatus

try:
    debugpy.listen(("0.0.0.0", 5678))
    print("Waiting for debugger attach 5678")
except:
    debugpy.listen(("0.0.0.0", 5679))
    print("Waiting for debugger attach on fallback port 5679")
    pass


from gpios import led, relay
from messagehandler import on_message
# debugpy.wait_for_client()
# actually jsut used as an indicator led
relay.off()
led.off()

mqttclient = mqtt.Client(CallbackAPIVersion.VERSION2)
mqttclient.username_pw_set(mqtt_user, mqtt_pwd)

errored = True
while errored:
    try:
        mqttclient.connect(mqtt_server, 1883, 60,)
        errored = False
    except OSError as e:
        errored = True


channel = 17


def on_connect(client, userdata, flags, rc, prop):
    connectionstatus.on()
    print("Connected with result code", rc)
    mqttclient.subscribe("cmnd/water-supply/#")

    mqttclient.publish("personal/discovery/water-supply/config", json_print(dict(
        t="water-supply",
        fn=[
            "water-supply"
        ],
        tp=[
            "tele", "cmnd"
        ],
        commands=[dict(name="refill", confirm=True), dict(name="stop")]
    )), retain=True)


mqttclient.on_connect = on_connect
# GPIO.setmode(GPIO.BOARD)


mqttclient.on_message = on_message

mqttclient.loop_forever()
