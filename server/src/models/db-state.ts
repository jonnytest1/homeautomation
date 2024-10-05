import { setMariaDbPoolDefaults } from 'hibernatets/dbs/mariadb-base';

export let dbInitialited = false;
setMariaDbPoolDefaults({
  keepAliveDelay: 5000,
  idleTimeout: 560,
  maxAllowedPacket: 67108864
})

export function setDbInit() {
  dbInitialited = true
}