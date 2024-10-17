
import { config } from 'dotenv';
import { join } from "path"
import { existsSync } from "fs"


function preloadEnv() {
  const envFile = join(__dirname, '..', ".env");
  if (existsSync(envFile)) {
    const env = config({
      path: envFile
    });
    if (env.error) {
      console.error(env.error)
    }
  } else {
    console.warn("no .env file")
  }
}
preloadEnv();
export const environment = process.env as {
  SKIP_NPM: string | number;
  TEMPORARY_DEPLOYMENT_NAME: string | number;
  WATCH_SERVICES: string;
  MQTT_SERVER: string
  MQTT_USER?: string;
  MQTT_PASSWORD?: string;
  REDIRECT: string
  DEBUG: string
  setup: string
  LOG_URL: string
  GENERIC_NODE_DATA: string
  LOG_SUFFIX: string

  DOCKER_CONTAINER_NAME: string
  SMARTHOME_DISABLED: string
}