import type { NodeDefOptinos, NodeDefToType } from '../typing/node-options';
import { connect } from 'mqtt';


export const globalMqttConfig = {
  mqtt_server: { type: "text" },
  mqtt_user: { type: "text" },
  mqtt_password: { type: "text" },
  mqtt_port: { type: "text" },
} satisfies NodeDefOptinos


export function getClient(global: NodeDefToType<typeof globalMqttConfig>) {
  if (global.mqtt_server?.startsWith("mqtt:")) {
    return connect(global.mqtt_server)
  }

  return connect({
    host: global.mqtt_server,
    port: global.mqtt_port ? +global.mqtt_port : 1883,
    username: global.mqtt_user,
    password: global.mqtt_password
  })
}