
import debugpy

from timing import sensor_listener
from smarthome import SmartHome, MqttConfig, DeviceConfig, FeatureTopics
from creds.creds import mqtt_pwd, mqtt_user, mqtt_server

from threading import Thread

try:
    debugpy.listen(("0.0.0.0", 5678))
    print("debugger listening on 5678")
except:
    debugpy.listen(("0.0.0.0", 5679))
    print("debugger listening on  fallback port 5679")

# debugpy.wait_for_client()
dev_cfg = DeviceConfig("weights", topic_prefixes={FeatureTopics.TELE})


mqtt_config = MqttConfig(password=mqtt_pwd, url=mqtt_server, user=mqtt_user)
smarthome = SmartHome(mqtt_config, dev_cfg, with_gpio=True)


sensor_thread = Thread(target=sensor_listener, args=[smarthome], name="timing")
sensor_thread.start()

smarthome.serve_forever()
