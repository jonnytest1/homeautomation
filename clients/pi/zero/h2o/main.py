
from creds.env import mqtt_server, mqtt_user, mqtt_pwd
import debugpy
from smarthome import SmartHome, MqttConfig, FeatureTopics, DeviceConfig, devgpios
from cmnd.relay import relay
from cmnd.refill import refillcmd
from cmnd.stopcmnd import stopcmd
try:
    debugpy.listen(("0.0.0.0", 5678))
    print("Waiting for debugger attach 5678")
except:
    debugpy.listen(("0.0.0.0", 5679))
    print("Waiting for debugger attach on fallback port 5679")

# debugpy.wait_for_client()
relay.off()
# actually jsut used as an indicator led
# devgpios.leds.connectionstatus.off()


device_config = DeviceConfig("water-supply", {
    FeatureTopics.COMMAND
}, commands=[
    # , confirm=True
    refillcmd,
    stopcmd
])


mqtt = MqttConfig(mqtt_server, mqtt_user, mqtt_pwd)
sm = SmartHome(mqtt, device_config)

sm.serve_forever()
