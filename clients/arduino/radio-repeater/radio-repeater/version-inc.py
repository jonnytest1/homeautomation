import os
import re
platformini = os.path.join(os.path.dirname(
    os.path.realpath('__file__')), "platformio.ini")

,
with open(platformini, 'r+') as platforminiFile:
    platforminiFileCt = platforminiFile.read()

    currentVsMatch = re.search(r'current_version=(\d*)', platforminiFileCt)
    if (currentVsMatch == None):
        raise Exception("no match")
    versionStr = currentVsMatch.group(1)
    version = int(versionStr)
    newVersion = version+1
    replacedIni = platforminiFileCt.replace(
        f"current_version={versionStr}", f"current_version={newVersion}")
    platforminiFile.seek(0)
    platforminiFile.write(replacedIni)
    platforminiFile.truncate()
