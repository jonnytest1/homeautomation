import RPi.GPIO as GPIO
import time
from dataclasses import dataclass
import debugpy
import paho.mqtt.client as mqtt
from env import mqtt_server
from json_print import json_print
import datetime
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


def get_time():
    return time.time()


@dataclass
class Cycle:
    uptime: float
    downtime: float


# bcm http://raspberrypi.ws/no-info
inPIN = 21

GPIO.setmode(GPIO.BCM)

GPIO.setup([inPIN], GPIO.IN)
upTimes: list[float] = [0]
downTimes: list[float] = [0]
smoothingWindowLength = 4

cycles: list[Cycle] = []
max_storage_length = 20


def my_callback1(channel):
    v = GPIO.input(inPIN)
    time = get_time()
    # GPIO.output(outPINS[0], v) # mirror input state to output state directly (forward servo value only) - don't set PWM then for this pin
    if (v == 0):
        downTimes.append(time)
        if len(downTimes) > smoothingWindowLength:
            del downTimes[0]
    else:
        cycles.append(
            Cycle(uptime=downTimes[-1]-upTimes[-1], downtime=time-downTimes[-1]))

        upTimes.append(time)
        if len(upTimes) > smoothingWindowLength:
            del upTimes[0]

    if len(cycles) > smoothingWindowLength:
        del cycles[0]


GPIO.add_event_detect(inPIN, GPIO.BOTH, callback=my_callback1)


def average():
    up_time = 0
    down_time = 0

    for cycle in cycles:
        up_time += cycle.uptime
        down_time += cycle.downtime

    amnt = len(cycles)
    avg_up = 1000 * up_time/amnt
    avg_down = 1000 * down_time/amnt
    return Cycle(uptime=avg_up, downtime=avg_down)


last_event = get_time()
try:
    while True:
        if len(cycles) > (smoothingWindowLength-1):
            ovl = cycles[-smoothingWindowLength:]  # output first pin PWM
            ov = average()
            cycle_duration = ov.uptime+ov.downtime
            missing_cycle = 1004-cycle_duration
            fixed_uptime = ov.uptime+missing_cycle
            cppm = (2000*(fixed_uptime+-2))/(fixed_uptime+ov.downtime-4)

            # print("cycle", ov.uptime+ov.downtime)
            print(cppm)
            if ((get_time()-last_event) > 10):
                print("publish")
                mqttclient.publish("tele/co2-scanner/SENSOR", json_print(dict(
                    co2_level=round(cppm),
                    timestamp=datetime.datetime.now().isoformat()
                )))
                last_event = get_time()
        time.sleep(0.2)
except KeyboardInterrupt:
    GPIO.cleanup()
