
import { environment } from '../../environment'
import { join } from "path"





const nodefolder = environment.GENERIC_NODE_DATA ?? __dirname

const typeFolder = join(__dirname, "_type")
export const serviceFolder = join(__dirname, "node-services")
export const zodScripts = join(typeFolder, "zod")

export const typeData = join(typeFolder, "nodetypes")


export const nodesFile = join(nodefolder, "nodes.json")
export const nodesContextFolder = join(nodefolder, "node-data")
export const deletedNodesDataFolder = join(nodesContextFolder, "deleted-node-data")
export const nodesDataFolder = join(nodesContextFolder, "nodes")

export const lastEventFile = join(nodefolder, "last-events.json")

export const lastEventTimesFile = join(nodefolder, "last-event-times.json")
