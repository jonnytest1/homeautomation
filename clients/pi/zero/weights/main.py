
import debugpy

from timing import sensor_listener
from smarthome import SmartHome, MqttConfig, DeviceConfig, FeatureTopics
from creds.creds import mqtt_pwd, mqtt_user, mqtt_server

from threading import Thread

try:
    debugpy.listen(("0.0.0.0", 5678))
    print("Waiting for debugger attach 5678")
except:
    debugpy.listen(("0.0.0.0", 5679))
    print("Waiting for debugger attach on fallback port 5679")
    pass

# debugpy.wait_for_client()
dev_cfg = DeviceConfig("weights", topic_prefixes={FeatureTopics.TELE})


mqtt_config = MqttConfig(password=mqtt_pwd, url=mqtt_server, user=mqtt_user)
smarthome = SmartHome(mqtt_config, dev_cfg)


sensor_thread = Thread(target=sensor_listener, args=[smarthome])
sensor_thread.start()

smarthome.serve_forever()
