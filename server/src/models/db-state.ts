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
export const sharedPool = new MariaDbBase(undefined, {
  connectionLimit: 30,

})
