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


# hx.reset()
'''

to calibrate get_weight(A|B):

nothin ~ ~ 64 000
with 1.25kg ~82 000
with 2.5kg ~ 100 000


with 2 and ref_unit=1
        A       B
 ~12kg 129028.0 35064.0
 ~18kg 177649.0 45143.0
  
  1st set scale(reference unit)  with a weight diff and then offset
  
  aiming for gram: 
      we have 
      diff should be 3000 (cause i have 2 weights which share)
        A: 177649-129028 = 48621
        B: 45143-35064 = 10079
        => 48621/3000 =16.207 for set_reference_unit_A
        => 10079/3000 =3.35 for set_reference_unit_B
      then restart
      now:
      
         ~18kg 169092 46967
         ~12kg 130932 34708
         
      then set to 0(no weighgt) and take the negative
      
      we got 
      2252.977108656753 2610.447
      
      so => -2252 as set_offset_Aand -2610 as set_offset_B
      
      
      
      
      9882- 6269 = 3613 at 3.38
      9110-5718 = 3392 at 3.6
      8410-5100 = 3310 at 3.8
'''

ref_unit_a = 14.4
# if diff is too big make it bigger cause it gets divided
ref_unit_b = 4
hx.set_reference_unit_A(ref_unit_a)
hx.set_reference_unit_B(ref_unit_b)
hx.set_offset_A(3500*ref_unit_a)
# offset gets subtracted
hx.set_offset_B(2200*ref_unit_b)


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
        val = hx.get_weight_A(5)
        valB = hx.get_weight_B(5)
        print(f"weight {val} {valB}")
       # print(f"weight {hx.get_weight_A(5)} {hx.get_weight_B(5)}")
        # To get weight from both channels (if you have load cells hooked up
        # to both channel A and B), do something like this
        # val_A = hx.get_weight_A(5)
        # val_B = hx.get_weight_B(5)
        # print "A: %s  B: %s" % ( val_A, val_B )

        # hx.power_down()
        # hx.power_up()
        time.sleep(0.1)

    except (KeyboardInterrupt, SystemExit):
        cleanAndExit()
