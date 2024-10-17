import { currentVersion, migrate } from './data-versioning';
import { initializeStore } from './generic-store/actions';
import { genericNodeDataStore } from './generic-store/reference';
import type { NodeData } from './typing/generic-node-type';
import { NodeContextData } from './models/node-backup';
import { NodeEntry } from './models/node-entry';
import { logKibana } from '../../util/log';
import { load, PsqlBase, type DataBaseBase } from 'hibernatets';



const backupPool = new PsqlBase({
  keepAlive: true
})
export function loadNodeData(pool: DataBaseBase) {


  const today = new Date()
  const todayStr = today.toISOString().split("T")[0]



  load(NodeContextData, {
    filter: `"id" =( SELECT MAX("id") FROM nodecontextdata )`,
    options: {
      first: true,
      db: backupPool
    }
  }).then(async (res) => {
    let data = res.data as NodeData

    const nodes = await loadNodeFiles();
    if (nodes.length > 0) {
      data.nodes = nodes
    }


    if (data.version !== currentVersion) {
      data = migrate(data)
    }

    genericNodeDataStore.dispatch(initializeStore({
      data
    }))
  })


}

async function loadNodeFiles() {

  try {

    const nodes = await load(NodeEntry, {
      options: {
        db: backupPool
      }
    })
    return nodes.map(n => n.node)


  } catch (e) {
    logKibana("ERROR", "failed laoding node data", e)
    throw e
  }
}
