
import { config } from 'dotenv';
import { join } from "path"
const env = config({
  path: join(__dirname, '..', ".env")
});
if (env.error) {
  throw env.error;
}

export const environment = process.env as {
  WATCH_SERVICES: string;
  MQTT_SERVER: string
  REDIRECT: string
  DEBUG: string
  setup: string
  LOG_URL: string
}