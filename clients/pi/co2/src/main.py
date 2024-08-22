from commands.beep import beepcmd
from smarthome import SmartHome, MqttConfig, DeviceConfig, FeatureTopics
import serial
from env import mqtt_server, mqtt_user, mqtt_pwd
import paho.mqtt.client as mqtt
import sys
import time
import debugpy

try:
    debugpy.listen(("0.0.0.0", 5688))
    print("Waiting for debugger attach")
except:
    debugpy.listen(("0.0.0.0", 5689))
    print("Waiting for debugger attach on fallback port 5689")
    pass

print("continuing")

mqtt = MqttConfig(mqtt_server, mqtt_user, mqtt_pwd)


device_config = DeviceConfig("co2-scanner", {
    FeatureTopics.TELE,
    FeatureTopics.COMMAND
}, commands=[
    beepcmd
])

smarthome = SmartHome(mqtt, device_config, with_gpio=False)

smarthome.start_serve()


ser = serial.Serial("/dev/ttyS0", 9600, timeout=5)


def check_valid(packet: list[int]):
    checksum = 0
    checksum_packet = packet[8]
    for i in range(7):
        checksum += packet[i+1]
    checksum_neg = 255-checksum

    checksum_fin = (checksum_neg+1) % 256

    if checksum_packet != checksum_fin:
        raise Exception("invalid checksum")


def read_co2():  # -> Any:
    resp = ser.write(
        bytearray([0xFF, 0x01, 0x86, 0x00, 0x00, 0x00, 0x00, 0x00, 0x79]))

    result = ser.read(9)
    if len(result) < 8:
        raise Exception("no response with 2 seconds")
    res_list = list(result)
    check_valid(res_list)

    co2lv = res_list[2]*256+res_list[3]

    return co2lv


while True:
    try:
        co2 = read_co2()
        print("publish")

        smarthome.update_telemetry(dict(
            co2_level=co2
        ))
        time.sleep(5)
    except KeyboardInterrupt:
        sys.exit(0)
    except Exception as e:
        print(e)

        pass
