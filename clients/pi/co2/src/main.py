import time
import debugpy
import paho.mqtt.client as mqtt
from env import mqtt_server
from json_print import json_print
import datetime
import serial
try:
    debugpy.listen(("0.0.0.0", 5688))
    print("Waiting for debugger attach")
except:
    debugpy.listen(("0.0.0.0", 5689))
    print("Waiting for debugger attach on fallback port 5679")
    pass

# debugpy.wait_for_client()
print("continuing")


mqttclient = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2)
mqttclient.connect(mqtt_server, 1883, 60)
mqttclient.loop_start()

mqttclient.publish("personal/discovery/co2-scanner/config", json_print(dict(
    t="co2-scanner",
    fn=[
        "co2-scanner"
    ],
    tp=[
        "tele"
    ],
    commands=[]
)), retain=True)


ser = serial.Serial("/dev/ttyS0", 9600)


def check_valid(packet: list[int]):
    checksum = 0
    checksum_packet = packet[8]
    for i in range(7):
        checksum += packet[i+1]
    checksum_neg = 255-checksum

    checksum_fin = (checksum_neg+1) % 256

    if checksum_packet != checksum_fin:
        raise Exception("invalid checksum")


def read_co2():
    resp = ser.write(
        bytearray([0xFF, 0x01, 0x86, 0x00, 0x00, 0x00, 0x00, 0x00, 0x79]))

    result = ser.read(9)
    res_list = list(result)
    check_valid(res_list)

    co2lv = res_list[2]*256+res_list[3]

    return co2lv


while True:
    try:
        co2 = read_co2()
        print("publish")
        mqttclient.publish("tele/co2-scanner/SENSOR", json_print(dict(
            co2_level=co2,
            timestamp=datetime.datetime.now().isoformat()
        )))
        time.sleep(5)
    except:

        pass
