import { config } from "dotenv"




const envFile = `${process.env.profile == "PROD" ? ".env.prod.env" : ".env"}`;
console.log("loading " + envFile)
config({
  path: envFile
});

export const environment = process.env as {
  CAL_URL: string
  serverip: string
  KEY_URL: string
  MQTT_SERVER: string
  HEATER_PLUG_POWER_CMD: string
  logfileprefix: string
  FRITZ_USER: string
  FRITZ_PWD: string
}

environment.serverip ??= '192.168.178.54'