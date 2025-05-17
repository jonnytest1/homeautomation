import { environment } from '../environment';
import { MariaDbBase, setMariaDbPoolDefaults } from 'hibernatets/dbs/mariadb-base';



export let dbInitialited = false;
setMariaDbPoolDefaults({
  keepAliveDelay: 1000,
  idleTimeout: 540,
  maxAllowedPacket: 67108864
})

export function setDbInit() {
  dbInitialited = true
}

if (!environment.DB_USER) {
  throw new Error("no database configuration in environment")
}

export const sharedPool = new MariaDbBase(undefined, {
  connectionLimit: 80,
  acquireTimeout: 20 * 1000,
  connectTimeout: 15 * 1000,




  keepAliveDelay: 5000,
  idleTimeout: 560,
  maxAllowedPacket: 67108864

})
