# 29=>5 21=> 29
# 31 => 6 =>22

import sys
import time
from hx711 import HX711


dout = 5
pd_sck = 6

if False:
    dout = 21
    pd_sck = 22

hx = HX711(dout, pd_sck)


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


hx.reset()
'''
nothin ~ ~ 64 000
with 1.25kg ~82 000
with 2.5kg ~ 100 000


'''
hx.set_reference_unit(reference_unit=14.4)
hx.set_offset(37000)


# i think this resets to base 0
# hx.tare()


def cleanAndExit():
    print("Cleaning...")

    print("Bye!")
    sys.exit()


while True:
    try:
        # These three lines are usefull to debug wether to use MSB or LSB in the reading formats
        # for the first parameter of "hx.set_reading_format("LSB", "MSB")".
        # Comment the two lines "val = hx.get_weight(5)" and "print val" and uncomment these three lines to see what it prints.

        # np_arr8_string = hx.get_np_arr8_string()
        # binary_string = hx.get_binary_string()
        # print(binary_string + " " + np_arr8_string)

        # Prints the weight. Comment if you're debbuging the MSB and LSB issue.
        val = hx.get_value(5)
        print(f"val {val}")
        print(f"weight {hx.get_weight(5)}")
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
