

import os
import debugpy
import sys
import time
from hx711 import HX711
from weight_entry import WeightEntry
import datetime
import math
import statistics
dout = 5
pd_sck = 6
try:
    debugpy.listen(("0.0.0.0", 5678))
    print("debugger listening on 5678")
except:
    debugpy.listen(("0.0.0.0", 5679))
    print("debugger listening on  fallback port 5679")

debugpy.wait_for_client()
if False:
    dout = 21
    pd_sck = 22

hx = HX711(dout, pd_sck)

hx.reset()
hx.set_reading_format("MSB", "MSB")
ref_unit_a = 1
# if diff is too big make it bigger cause it gets divided
ref_unit_b = 1

offset_a = 0
offset_b = 0
hx.set_reference_unit_A(ref_unit_a)
time.sleep(0.5)
hx.set_reference_unit_B(ref_unit_b)
time.sleep(0.5)
# offset gets subtracted
hx.set_offset_A(offset_a)
time.sleep(0.5)
# offset gets subtracted
hx.set_offset_B(offset_b)
time.sleep(0.5)


def clean_exit():
    print("Cleaning...")

    print("Bye!")
    sys.exit()


def write_config():
    c_dir = os.path.dirname(os.path.realpath(__file__))
    with open(os.path.join(c_dir, "calibration.py"), "w") as file:
        file.write(f"""
# written by calibrate.py
scaleA = {ref_unit_a}
scaleB = {ref_unit_b}
offsetA = {offset_a}
offsetB = {offset_b}
""")


valhistoryprescale: list[WeightEntry] = []
valhistorypostadjust: list[WeightEntry] = []
valhistorypostscale: list[WeightEntry] = []

historylist = valhistoryprescale


loopindex = 0
weight = ""
totalweight = -1
while True:
    try:
        loopindex += 1

        val_a = hx.get_weight_A(5)
        val_b = hx.get_weight_B(5)

        historylist.append(WeightEntry(
            math.floor(val_a),
            math.floor(val_b),
            datetime.datetime.now()))

        print(f"weight {val_a} {val_b}")

        time.sleep(0.1)

        if (loopindex == 10):
            print("now remove or add an amount of weight and enter the weight (if you want gram specificty enter in grams)")
            weight = input("weight?")

            historylist = valhistorypostadjust
        if (loopindex == 20):
            avga = statistics.fmean([n.weight_a for n in valhistoryprescale])
            avgb = statistics.fmean([n.weight_b for n in valhistoryprescale])

            avgaadjusted = statistics.fmean(
                [n.weight_a for n in valhistorypostadjust])
            avgbadjusted = statistics.fmean(
                [n.weight_b for n in valhistorypostadjust])
            multiplier = -1
            if (avgaadjusted > avga and avgbadjusted > avgb):
                # added weights instead of removed
                multiplier = 1
            adjustedwieght = int(weight)*multiplier

            aDiff = avgaadjusted-avga
            bDiff = avgbadjusted-avgb

            ref_off_a = aDiff/adjustedwieght
            ref_off_b = bDiff/adjustedwieght

            ref_unit_a *= ref_off_a
            ref_unit_b *= ref_off_b
            hx.set_reference_unit_A(ref_unit_a)
            hx.set_reference_unit_B(ref_unit_b)

            print("whats the current total weight ?")
            totalweight = int(input("total weight?"))
            historylist = valhistorypostscale
        if (loopindex == 30):

            avgascaled = statistics.fmean(
                [n.weight_a for n in valhistorypostscale])
            avgbscaled = statistics.fmean(
                [n.weight_b for n in valhistorypostscale])
            # offset gets subtracted
            offset_a = (avgascaled-totalweight)*ref_unit_a
            offset_b = (avgbscaled-totalweight)*ref_unit_b

            hx.set_offset_A(offset_a)
            hx.set_offset_B(offset_b)
            print("test a bit with the weights to see if everything works ")
        if (loopindex > 30 and loopindex % 10 == 0):
            if ("y" == input("works like this ? y[n]")):
                print("writing config to ./calibration.py")
                write_config()
                exit(0)
    except (KeyboardInterrupt, SystemExit):
        clean_exit()
