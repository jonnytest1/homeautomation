import { config } from "dotenv"
config({
  path: `${process.env.profile == "PROD" ? ".env.prod.env" : ".env"}`
});

export const environment = process.env as {
  CAL_URL: string
  serverip: string
  KEY_URL: string
}

environment.serverip ??= '192.168.178.54'