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
    const nodeList = nodes.map(n => n.node)

    /* const nodeIds = new Set(nodes.map(n => n.nodeUuid))
 
     const nodeEntries = readdirSync(nodesDataFolder, { withFileTypes: true });
 
 
 
     for (const nodeEntry of nodeEntries) {
       if (nodeEntry.isFile()) {
         const file = join(nodesDataFolder, nodeEntry.name)
 
         if (!nodeIds.has(nodeEntry.name.split(".json")[0])) {
           const nodeFile = readFileSync(file, { encoding: "utf8" })
           const nodeData = JSON.parse(nodeFile) as ElementNode
 
           save(NodeEntry.from(nodeData), { db: backupPool, updateOnDuplicate: true })
           nodeList.push(nodeData)
         }
       }
     }
    */


    return nodeList


  } catch (e) {
    logKibana("ERROR", "failed laoding node data", e)
    throw e
  }
}
