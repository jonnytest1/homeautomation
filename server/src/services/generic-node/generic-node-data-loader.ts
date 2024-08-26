import { currentVersion, migrate } from './data-versioning';
import { nodesDataFolder, nodesFile } from './generic-node-constants';
import { initializeStore } from './generic-store/actions';
import { genericNodeDataStore } from './generic-store/reference';
import type { NodeData } from './typing/generic-node-type';
import type { ElementNode } from './typing/element-node';
import { logKibana } from '../../util/log';
import { join } from "path"
import { readFileSync, readdirSync, mkdirSync } from "fs"
export function loadNodeData() {




  let data = JSON.parse(readFileSync(nodesFile, { encoding: "utf8" })) as NodeData;

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
      }
    }
    return nodes


  } catch (e) {
    logKibana("ERROR", "failed laoding node data", e)
    throw e
  }
}
