import type { Callbacks, Connection, ConnectorDefintion, ElementNode, NodeData, NodeDefintion, PreparedNodeData, TypeImplementaiton } from './typing/generic-node-type';

import { updateTypeSchema } from './generic-type.utils';
import { NodeEvent } from './node-event';
import type { NodeDefOptinos } from './typing/node-options';
import type { NodeEventData } from './typing/node-event-data';
import { setLastEvent, setLastEventInputTime, setLastEventOutputTime } from './last-event-service';
import { ElementNodeImpl, checkInvalidations } from './element-node';
import { nodesFile, serviceFolder } from './generic-node-constants';
import { init } from './validation/watcher';
import { logKibana } from '../../util/log';
import { environment } from '../../environment';
import { jsonClone } from '../../util/json-clone';
import { BehaviorSubject } from "rxjs"
import { watch } from "chokidar"
import { writeFileSync, readFileSync } from "fs"


let connectorMap: PreparedNodeData["connectorMap"]
let targetConnectorMap: PreparedNodeData["targetConnectorMap"]

let nodeMap: PreparedNodeData["nodeMap"]

export let skipEmit = false
export const nodes = new BehaviorSubject<NodeData>({ connections: [], nodes: [], globals: {} })

export const typeImplementations = new BehaviorSubject<Record<string, TypeImplementaiton>>({})



const hasLoaded$ = new BehaviorSubject(false)


export function writeNodes() {
  writeFileSync(nodesFile, JSON.stringify(nodes.value, undefined, "   "))
}

export async function addNode(node: ElementNode) {
  const typeImpl = typeImplementations.value[node.type]
  if (typeImpl) {
    node.runtimeContext ??= {}
    const nodeDef = typeImpl.nodeDefinition();
    node.runtimeContext.inputs = nodeDef.inputs
    node.runtimeContext.outputs = nodeDef.outputs
  }
  await updateNode(node.uuid, () => {
    nodes.value.nodes.push(node)
    nodeMap[node.uuid] = node
  })
  writeNodes()
}

export async function deleteNode(node: string) {
  await updateNode(node, () => {
    const nodeData = nodes.value
    if (nodeData) {
      nodeData.nodes = nodeData.nodes.filter(n => n.uuid !== node)
      nodeData.connections = nodeData.connections
        .filter(con => con.source.uuid !== node && con.target?.uuid !== node)

      delete nodeMap[node]
    }
  })
  writeNodes()
}

export async function addConnection(con: Connection) {
  await updateNode(con.source.uuid, () => {
    nodes.value.connections.push(con)

    if (con.target) {
      connectorMap[con.source.uuid] ??= []
      connectorMap[con.source.uuid][con.source.index] ??= []
      connectorMap[con.source.uuid][con.source.index].push(con.target)

      targetConnectorMap[con.target?.uuid] ??= []
      targetConnectorMap[con.target.uuid][con.target.index] ??= []
      targetConnectorMap[con.target.uuid][con.target.index]?.push(con.source)
    }
  })
  writeNodes()
}
function isSameConnection(conA: Connection, conB: Connection) {
  if (conA.source.uuid !== conB.source.uuid) {
    return false
  }
  if (conA.target!.uuid !== conB.target!.uuid) {
    return false
  }
  if (conA.source.index !== conB.source.index) {
    return false
  }
  if (conA.target!.index !== conB.target!.index) {
    return false
  }
  return true
}

export async function removeConnection(evtCon: Connection) {
  await updateNode(evtCon.source.uuid, () => {
    nodes.value.connections = nodes.value.connections.filter(con => !(isSameConnection(con, evtCon)))
    const connectorAr = connectorMap[evtCon.source.uuid]?.[evtCon.source.index]
    if (connectorAr) {
      connectorMap[evtCon.source.uuid][evtCon.source.index] = connectorAr.filter(targetCon =>
        (targetCon.uuid != evtCon.target?.uuid || targetCon.index !== evtCon.target.index))
    }
    if (evtCon.target) {
      const targetConAr = targetConnectorMap[evtCon.target.uuid]?.[evtCon.target?.index]
      if (targetConAr) {
        targetConnectorMap[evtCon.target.uuid][evtCon.target?.index] = targetConAr
          .filter(sourceCon => sourceCon.uuid !== evtCon.source.uuid || sourceCon.index !== evtCon.source.index)
      }
    }
  })
  writeNodes()
}

export async function setNodes(data: NodeData, changedUuid?: string) {
  nodes.next(data)
  writeNodes()
  connectorMap = {}
  targetConnectorMap = {}
  for (const connector of nodes.value.connections) {
    if (connector.target) {
      connectorMap[connector.source.uuid] ??= []
      connectorMap[connector.source.uuid][connector.source.index] ??= []
      connectorMap[connector.source.uuid][connector.source.index].push(connector.target)

      targetConnectorMap[connector.target?.uuid] ??= []
      targetConnectorMap[connector.target.uuid][connector.target.index] ??= []
      targetConnectorMap[connector.target.uuid][connector.target.index]?.push(connector.source)
    }

  }

  await updateNode(changedUuid, () => {
    nodeMap = {}
    for (const node of nodes.value.nodes) {
      nodeMap[node.uuid] = node
    }
  });

}

let loadingFile: string | undefined = undefined
if (environment.WATCH_SERVICES) {
  watch(serviceFolder, {})
    .on("add", e => {
      if (e.endsWith(".ts")) {
        loadingFile = e
        require(e)
        loadingFile = undefined
      }
    })
    .on("change", e => {
      if (e.endsWith(".ts")) {
        if (e in require.cache) {
          delete require.cache[e]
        }
        loadingFile = e
        require(e)
        loadingFile = undefined
        console.log("successfully loaded " + e)
      }
    }).on("ready", () => {
      hasLoaded$.next(true)
    })

}




setNodes(JSON.parse(readFileSync(nodesFile, { encoding: "utf8" })))
init()


export async function updateNode(changedUuid: string | undefined, changer: () => void) {
  let prevNode: ElementNode | null = null
  if (changedUuid && nodeMap[changedUuid]) {
    prevNode = jsonClone(nodeMap[changedUuid])
  }
  changer()

  if (changedUuid) {
    const node = nodeMap[changedUuid];
    if (node) {
      const typeImpl = typeImplementations.value[node.type];
      if (typeImpl) {
        /*  const outgoingConnectons = nodes.value.connections
          .filter(con => con.source?.uuid === node.uuid)
          .map(con => ({ ...con, node: nodeMap[con.target!.uuid] }))
        const incomingConnectons = nodes.value.connections
          .filter(con => con.target?.uuid === node.uuid)
          .map(con => ({ ...con, node: nodeMap[con.source.uuid] }))
        node.runtimeContext ??= {}
 
       Object.defineProperty(node.runtimeContext, "connections", {
           value: {
             incoming: incomingConnectons,
             outgoing: outgoingConnectons
           },
           enumerable: false,
         })*/
        Object.setPrototypeOf(node, ElementNodeImpl.prototype);

        checkInvalidations(typeImpl, node, prevNode);
        await typeImpl.nodeChanged?.(node as ElementNodeImpl<never>, prevNode as ElementNode<never>);
        updateTypeSchema(node, {
          connectorMap: connectorMap,
          targetConnectorMap,
          nodeMap: nodeMap,
          typeImpls: typeImplementations.value
        }).then(() => {
          nodes.next(nodes.value);
        }).catch(e => {
          logKibana("ERROR", {
            message: "error updating type schema",
            nodeUuid: node.uuid
          }, e)
        });
      }
    }
  }
}

export function addTypeImpl<C, G extends NodeDefOptinos, O extends NodeDefOptinos, P, S>(typeImpl: TypeImplementaiton<C, G, O, P, S>) {

  const currerntTypeImpls = typeImplementations.value
  const implementationType = typeImpl.nodeDefinition().type;
  typeImpl._file = loadingFile


  let elementNodes: Array<ElementNodeImpl<never>> | null = null




  if (currerntTypeImpls[implementationType]?.unload) {
    if (!elementNodes) {
      elementNodes = getElementNodes(implementationType);
    }
    currerntTypeImpls[implementationType]?.unload?.(elementNodes, nodes.value.globals as never)

  }
  currerntTypeImpls[implementationType] = typeImpl as never
  typeImplementations.next(currerntTypeImpls)


  if (typeImpl.initializeServer) {
    if (!elementNodes) {
      elementNodes = getElementNodes(implementationType);

    }
    typeImpl.initializeServer(elementNodes, nodes.value.globals as never)

  }

}
function getElementNodes(implementationType: string): ElementNodeImpl<never>[] {
  return nodes.value.nodes
    .filter(el => el.type === implementationType)
    .map(node => {
      return new ElementNodeImpl<never>(node as ElementNode<never>, createCallbacks(node))
    });
}

/*
addTypeImpl(jsonSchemaProvider)
addTypeImpl(mqttSub)*/
/*
require('./node-services/mqtt-publish.ts')
require('./node-services/map')
require('./node-services/key-binding')
require('./node-services/sender')
require('./node-services/filter')*/

export function getNodeDefintions(): Record<string, NodeDefintion> {
  const nodeDefs: Record<string, NodeDefintion> = {}
  for (const key in typeImplementations.value) {
    nodeDefs[key] = typeImplementations.value[key].nodeDefinition()
  }

  return nodeDefs;
}


function createCallbacks(node: ElementNode) {
  const nodeUuid = node.uuid
  return {
    continue: (evt, index) => {
      setLastEventOutputTime(node, Date.now())
      const nodeConnections = connectorMap[nodeUuid]
      if (!nodeConnections) {
        return
      }
      const emittingConnectinos: Array<ConnectorDefintion> = []
      if (index !== undefined) {
        if (nodeConnections[index]) {
          emittingConnectinos.push(...nodeConnections[index])
        }
      } else {
        emittingConnectinos.push(...Object.values(nodeConnections).flat())
      }
      for (const emittingCon of emittingConnectinos) {
        const nextNode = nodeMap[emittingCon.uuid]
        if (!nextNode) {
          logKibana("WARN", { message: "node not found", uuid: emittingCon.uuid })
          return
        }
        processInput({
          node: nextNode,
          nodeinput: emittingCon.index,
          data: evt
        })
      }
    },
    updateNode(frontendEmit = true) {
      skipEmit = !frontendEmit
      nodes.next(nodes.value)
      skipEmit = false
      updateTypeSchema(nodeMap[nodeUuid], {
        connectorMap: connectorMap,
        nodeMap: nodeMap,
        targetConnectorMap,
        typeImpls: typeImplementations.value
      }).then(() => {
        skipEmit = !frontendEmit
        nodes.next(nodes.value)
        skipEmit = false
      }).catch(e => {
        logKibana("ERROR", {
          message: "error updating type schema",
          nodeUuid
        }, e)
      })

    }
  } satisfies Callbacks
}


async function processInput(data: { node: ElementNode, nodeinput: number, data: NodeEvent }) {
  const typeimpl = typeImplementations.value[data.node.type]
  if (typeimpl) {
    setLastEventInputTime(data.node, Date.now())
    try {
      const eventCopy = data.data.copy()
      data.data.inputIndex = data.nodeinput
      await typeimpl.process(data.node as ElementNode<never>, data.data, createCallbacks(data.node))


      setLastEvent(data.node, eventCopy)
    } catch (e) {
      logKibana("ERROR", {
        message: "error during process of node",
        nodetype: data.node.type,
        nodeid: nodeMap.uuid
      }, e)
    }
  } else if (hasLoaded$.value) {
    logKibana("ERROR", { message: "missing node type implemenation", nodetype: data.node.type })
  }
}

export function emitEvent(type: string, data: NodeEventData) {
  if (nodes.value) {
    for (const node of nodes.value.nodes) {
      if (node.type == type) {

        const dataCopy = {
          ...data,
          globalConfig: nodes.value.globals
        }
        Object.defineProperty(dataCopy, "globalConfig", {
          value: nodes.value.globals,
          enumerable: false
        })

        const event = new NodeEvent(data, nodes.value.globals)

        processInput({
          node: node,
          nodeinput: 0,
          data: event
        })
      }
    }
  }
}

