import { currentVersion, migrate } from './data-versioning';
import { nodesDataFolder } from './generic-node-constants';
import { initializeStore } from './generic-store/actions';
import { genericNodeDataStore } from './generic-store/reference';
import type { NodeData } from './typing/generic-node-type';
import type { ElementNode } from './typing/element-node';
import { NodeContextData } from './models/node-backup';
import { NodeEntry } from './models/node-entry';
import { logKibana } from '../../util/log';
import { load, PsqlBase, save, type DataBaseBase } from 'hibernatets';
import { join } from "path"
import { readFileSync, readdirSync, mkdirSync } from "fs"



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
  }).then((res) => {
    let data = res.data as NodeData

    const nodes = loadNodeFiles();
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

function loadNodeFiles() {

  const nodes: Array<ElementNode> = []
  try {
    mkdirSync(nodesDataFolder, { recursive: true })
    const nodeEntries = readdirSync(nodesDataFolder, { withFileTypes: true });

    for (const nodeEntry of nodeEntries) {
      if (nodeEntry.isFile()) {
        const file = join(nodesDataFolder, nodeEntry.name)

        const nodeFile = readFileSync(file, { encoding: "utf8" })
        const nodeData = JSON.parse(nodeFile) as ElementNode
        nodes.push(nodeData)

        save(NodeEntry.from(nodeData), { db: backupPool, updateOnDuplicate: true })



      }
    }
    return nodes


  } catch (e) {
    logKibana("ERROR", "failed laoding node data", e)
    throw e
  }
}
