import base64
from os import path
from esp_coredump import CoreDump
import argparse


parser = argparse.ArgumentParser(description='Example argparse script')
parser.add_argument('--dumpb64', type=str, help='dump file')
parser.add_argument('--elf', type=str, help='elf file')


args = parser.parse_args()


dumpb64:str = args.dumpb64

elf:str = args.elf


script_dir = path.dirname(path.abspath(__file__))
elffile=path.join(script_dir,"dump.elf")

with open(dumpb64, "rb") as f:
    encoded_data = f.read()
decoded_data = base64.b64decode(encoded_data)

with open(elffile, "wb") as f:
    f.write(decoded_data)
    
dmp = CoreDump(prog=elf, core=elffile,gdb="C:\\Users\\jonat.PCN\\.platformio\\packages\\toolchain-xtensa-esp32s3\\bin\\xtensa-esp32s3-elf-gdb.exe")
files = dmp.info_corefile()


print(files)
