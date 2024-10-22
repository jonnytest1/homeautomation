import { creds } from './devices/matrix/creds'
import { matrixLed } from './devices/matrix/led'
import { main } from './devices/matrix/main'
import { propsContent } from './devices/matrix/prop'



const matrixCode = `
${creds}
${propsContent}
${matrixLed}

${main}`

export const files = [
  "led.h", "lib/prop.h", "creds.h", "mqtt_cred.h"
]

export const wiringLayout = [
  {
    "type": "Battery",
    "prov": {
      "type": "Wire",
      "connectedWire": {
        "type": "Esp32",
        "uuid": "8faa3d99-bfe9-4746-bdf5-7608c722ec28",
        "code": matrixCode,
        "ui": {
          "y": 230,
          "x": 470
        },
        "connections": {},
        "batteryCon": {
          "id": 9,
          "connection": {
            "type": "Wire",
            "connectedWire": "BatteryRef"
          }
        }
      }
    },
    "voltage": 5,
    "ui": {
      "y": 450,
      "x": 190
    },
    "enabled": false,
    "charge": 10000000000,
    "maxAmpere": 36000000000000
  }
]