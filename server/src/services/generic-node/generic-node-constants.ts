
import { join } from "path"



const typeFolder = join(__dirname, "_type")

export const serviceFolder = join(__dirname, "node-services")
export const zodScripts = join(typeFolder, "zod")

export const typeData = join(typeFolder, "nodetypes")


export const nodesFile = join(__dirname, "nodes.json")

export const lastEventFile = join(__dirname, "last-events.json")

export const lastEventTimesFile = join(__dirname, "last-event-times.json")
