

from dataclasses import dataclass
import datetime
import math
import sys
import time
from hx711 import HX711
import RPi.GPIO as GPIO

from weight_entry import WeightEntry
from calibration import offsetA, offsetB, scaleA, scaleB
dout = 5
pd_sck = 6

hx = HX711(dout, pd_sck)
'''
I've found out that, for some reason, the order of the bytes is not always the same between versions of python,
and the hx711 itself. I still need to figure out why.

If you're experiencing super random values, change these values to MSB or LSB until you get more stable values.
There is some code below to debug and log the order of the bits and the bytes.

The first parameter is the order in which the bytes are used to build the "long" value. The second paramter is
the order of the bits inside each byte. According to the HX711 Datasheet, the second parameter is MSB so you
shouldn't need to modify it.
'''
hx.set_reading_format("MSB", "MSB")

# tutorial https://tutorials-raspberrypi.de/raspberry-pi-waage-bauen-gewichtssensor-hx711/

# setup for gram (not too accurate)

ref_unit_a = 14.4
# if diff is too big make it bigger cause it gets divided
ref_unit_b = 4
hx.set_reference_unit_A(scaleA)
hx.set_reference_unit_B(scaleB)
hx.set_offset_A(offsetA)
# offset gets subtracted
hx.set_offset_B(offsetB)


def clean_and_exit():
    print("Cleaning...")
    GPIO.cleanup()
    print("Bye!")
    sys.exit()


def read_sensor_data(results: list[WeightEntry], telemetry_time_secs: int):
    result_max_livetime = datetime.timedelta(seconds=telemetry_time_secs)

    while True:
        try:
            # These three lines are usefull to debug wether to use MSB or LSB in the reading formats
            # for the first parameter of "hx.set_reading_format("LSB", "MSB")".
            # Comment the two lines "val = hx.get_weight(5)" and "print val" and uncomment these three lines to see what it prints.

            # Prints the weight. Comment if you're debbuging the MSB and LSB issue.
            val_a = hx.get_weight_A(1)
            val_b = hx.get_weight_B(1)
            # print(val)
            results.append(WeightEntry(
                math.floor(val_a),
                math.floor(val_b),
                datetime.datetime.now()))

            while results[0].timestamp+result_max_livetime < datetime.datetime.now():
                results.pop(0)

            print([val_a, val_b])

            # To get weight from both channels (if you have load cells hooked up
            # to both channel A and B), do something like this
            # val_A = hx.get_weight_A(5)
            # val_B = hx.get_weight_B(5)
            # print "A: %s  B: %s" % ( val_A, val_B )

        except (KeyboardInterrupt, SystemExit):
            clean_and_exit()
