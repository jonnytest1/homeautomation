

from dataclasses import dataclass
import datetime
import math
import sys
import time
from hx711 import HX711
import RPi.GPIO as GPIO

# 29=>5 21=> 29
# 31 => 6 =>22

# tutorial https://tutorials-raspberrypi.de/raspberry-pi-waage-bauen-gewichtssensor-hx711/
dout = 5
pd_sck = 6

if False:
    dout = 21
    pd_sck = 22

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


'''
# HOW TO CALCULATE THE REFFERENCE UNIT
1. Set the reference unit to 1 and make sure the offset value is set.
2. Load you sensor with 1kg or with anything you know exactly how much it weights.
3. Write down the 'long' value you're getting. Make sure you're getting somewhat consistent values.
    - This values might be in the order of millions, varying by hundreds or thousands and it's ok.
4. To get the wright in grams, calculate the reference unit using the following formula:
        
    referenceUnit = longValueWithOffset / 1000
        
In my case, the longValueWithOffset was around 114000 so my reference unit is 114,
because if I used the 114000, I'd be getting milligrams instead of grams.
'''
referenceUnit = 1
# hx.set_reference_unit(referenceUnit)
hx.set_reference_unit(1)


'''
nothin ~ 0
with 1.25kg ~18000
with 2.5kg ~ 34000


'''

hx.reset()

hx.set_reference_unit(reference_unit=14.4)
hx.set_offset(37000)

# tare resets to 0
# hx.tare()


# print("Tare done! Add weight now...")


def cleanAndExit():
    print("Cleaning...")
    GPIO.cleanup()
    print("Bye!")
    sys.exit()


@dataclass()
class WeightEntry:
    weight: float
    timestamp: datetime.datetime


results: list[WeightEntry] = []

while True:
    try:
        # These three lines are usefull to debug wether to use MSB or LSB in the reading formats
        # for the first parameter of "hx.set_reading_format("LSB", "MSB")".
        # Comment the two lines "val = hx.get_weight(5)" and "print val" and uncomment these three lines to see what it prints.

        # np_arr8_string = hx.get_np_arr8_string()
        # binary_string = hx.get_binary_string()
        # print binary_string + " " + np_arr8_string

        # Prints the weight. Comment if you're debbuging the MSB and LSB issue.
        val = hx.get_weight(3)
        # print(val)
        results.append(WeightEntry(math.floor(val), datetime.datetime.now()))

        while results[0].timestamp+datetime.timedelta(seconds=10) < datetime.datetime.now():
            results.pop(0)

        print([r.weight for r in results])
        # To get weight from both channels (if you have load cells hooked up
        # to both channel A and B), do something like this
        # val_A = hx.get_weight_A(5)
        # val_B = hx.get_weight_B(5)
        # print "A: %s  B: %s" % ( val_A, val_B )

        hx.power_down()
        hx.power_up()
        time.sleep(0.1)

    except (KeyboardInterrupt, SystemExit):
        cleanAndExit()
