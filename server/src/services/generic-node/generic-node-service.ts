import type { ConnectorDefintion, ElementNode, NodeData, NodeDefintion, PreparedNodeData, TypeImplementaiton } from './typing/generic-node-type';

import { updateTypeSchema } from './generic-type.utils';
import { NodeEvent } from './node-event';
import type { NodeDefOptinos } from './typing/node-options';
import type { NodeEventData } from './typing/node-event-data';
import { setLastEvent, setLastEventInputTime, setLastEventOutputTime } from './last-event-service';
import { ElementNodeImpl } from './element-node';
import { serviceFolder } from './generic-node-constants';
import { logKibana } from '../../util/log';
import { environment } from '../../environment';
import { BehaviorSubject } from "rxjs"
import { watch } from "chokidar"
import { writeFileSync, readFileSync } from "fs"
import { join } from "path"


let connectorMap: PreparedNodeData["connectorMap"]
let targetConnectorMap: PreparedNodeData["targetConnectorMap"]

let nodeMap: PreparedNodeData["nodeMap"]


export const nodes = new BehaviorSubject<NodeData>({ connections: [], nodes: [], globals: {} })

export const typeImplementations = new BehaviorSubject<Record<string, TypeImplementaiton>>({})


export async function setNodes(data: NodeData, changedUuid?: string) {
  writeFileSync(join(__dirname, "nodes.json"), JSON.stringify(data, undefined, "   "))
  nodes.next(data)

  connectorMap = {}
  targetConnectorMap = {}
  for (const connector of nodes.value.connections) {
    if (connector.target) {
      connectorMap[connector.source.uuid] ??= []
      connectorMap[connector.source.uuid][connector.source.index] = connector.target

      targetConnectorMap[connector.target?.uuid] ??= []
      targetConnectorMap[connector.target.uuid][connector.target.index] = connector.source
    }

  }
  let prevNode: ElementNode | null = null
  if (changedUuid) {
    prevNode = nodeMap[changedUuid]
  }

  nodeMap = {}
  for (const node of nodes.value.nodes) {
    nodeMap[node.uuid] = node
  }

  if (changedUuid) {
    const node = nodeMap[changedUuid]
    if (node) {
      const typeImpl = typeImplementations.value[node.type]
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


        Object.setPrototypeOf(node, ElementNodeImpl.prototype)

        await typeImpl.nodeChanged?.(node as ElementNodeImpl<never>, prevNode as ElementNode<never>)
        updateTypeSchema(node, {
          connectorMap: connectorMap,
          targetConnectorMap,
          nodeMap: nodeMap,
          typeImpls: typeImplementations.value
        }).then(() => {
          nodes.next(nodes.value)
        })
      }
    }
  }

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
    })

}




setNodes(JSON.parse(readFileSync(join(__dirname, "nodes.json"), { encoding: "utf8" })))

export function addTypeImpl<C, G extends NodeDefOptinos, O extends NodeDefOptinos>(typeImpl: TypeImplementaiton<C, G, O>) {

  const currerntTypeImpls = typeImplementations.value
  const implementationType = typeImpl.nodeDefinition().type;
  typeImpl._file = loadingFile

  if (currerntTypeImpls[implementationType]?.unload) {
    currerntTypeImpls[implementationType]?.unload?.(nodes.value.nodes
      .filter(el => el.type === implementationType) as Array<ElementNode<never>>, nodes.value.globals as never)

  }
  currerntTypeImpls[implementationType] = typeImpl as never
  typeImplementations.next(currerntTypeImpls)

  typeImpl.initializeServer?.(nodes.value.nodes
    .filter(el => el.type === implementationType) as Array<ElementNode<never>>, nodes.value.globals as never)

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

async function processInput(data: { node: ElementNode, nodeinput: number | "*", data: NodeEvent }) {
  const typeimpl = typeImplementations.value[data.node.type]
  if (typeimpl) {
    setLastEventInputTime(data.node, Date.now())
    try {
      const eventCopy = data.data.copy()
      await typeimpl.process(data.node as ElementNode<never>, data.data, {
        continue: (evt, index) => {
          setLastEventOutputTime(data.node, Date.now())
          const nodeConnections = connectorMap[data.node.uuid]
          if (!nodeConnections) {
            return
          }
          let emittingConnectinos: Array<ConnectorDefintion> = []
          if (index !== undefined) {
            if (nodeConnections[index]) {
              emittingConnectinos.push(nodeConnections[index])
            }
          } else {
            emittingConnectinos = nodeConnections
          }

          for (const emittingCon of emittingConnectinos) {
            const nextNode = nodeMap[emittingCon.uuid]
            if (!nextNode) {
              logKibana("WARN", { message: "node not found", uuid: emittingCon.uuid })
              return
            }
            processInput({
              node: nextNode,
              nodeinput: emittingCon.index ?? "*",
              data: data.data
            })
          }
        },
        updateNode() {
          nodes.next(nodes.value)

          updateTypeSchema(data.node, {
            connectorMap: connectorMap,
            nodeMap: nodeMap,
            targetConnectorMap,
            typeImpls: typeImplementations.value
          }).then(() => {
            nodes.next(nodes.value)
          })

        }
      })


      setLastEvent(data.node, eventCopy)
    } catch (e) {
      logKibana("ERROR", {
        message: "error during process of node",
        nodetype: data.node.type,
        nodeid: nodeMap.uuid
      }, e)
    }
  } else {
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
          nodeinput: "*",
          data: event
        })
      }
    }
  }
}

