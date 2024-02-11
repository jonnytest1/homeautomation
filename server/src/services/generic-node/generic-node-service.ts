import { jsonSchemaProvider } from './node-services/json-schema';
import type { ConnectorDefintion, ElementNode, NodeData, NodeDefintion, PreparedNodeData, TypeImplementaiton } from './typing/generic-node-type';
import { mqttSub } from './node-services/mqtt-subscribe';

import { updateTypeSchema } from './generic-type.utils';
import { NodeEvent } from './node-event';
import type { NodeDefOptinos } from './typing/node-options';
import type { NodeEventData } from './typing/node-event-data';
import { logKibana } from '../../util/log';
import { BehaviorSubject } from "rxjs"
import { writeFileSync, readFileSync } from "fs"
import { join } from "path"



let connectorMap: PreparedNodeData["connectorMap"]
let targetConnectorMap: PreparedNodeData["targetConnectorMap"]

let nodeMap: PreparedNodeData["nodeMap"]


export const nodes = new BehaviorSubject<NodeData>({ connections: [], nodes: [], globals: {} })

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
      const typeImpl = typeImplementations[node.type]
      if (typeImpl) {
        const outgoingConnectons = nodes.value.connections
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
        })
        await typeImpl.nodeChanged?.(node as ElementNode<never>, prevNode as ElementNode<never>)
        updateTypeSchema(node, {
          connectorMap: connectorMap,
          targetConnectorMap,
          nodeMap: nodeMap,
          typeImpls: typeImplementations
        }).then(() => {
          nodes.next(nodes.value)
        })

        setTimeout(() => {
          nodes.next(data)

        }, 10)
      }
    }
  }

}



setNodes(JSON.parse(readFileSync(join(__dirname, "nodes.json"), { encoding: "utf8" })))

const typeImplementations: Record<string, TypeImplementaiton> = {}


export function addTypeImpl<C, G extends NodeDefOptinos, O extends NodeDefOptinos>(typeImpl: TypeImplementaiton<C, G, O>) {
  typeImplementations[typeImpl.nodeDefinition().type] = typeImpl as never
}

addTypeImpl(jsonSchemaProvider)
addTypeImpl(mqttSub)
require('./node-services/mqtt-publish.ts')
require('./node-services/map')
require('./node-services/key-binding')

export function getNodeDefintions(): Record<string, NodeDefintion> {
  const nodeDefs: Record<string, NodeDefintion> = {}
  for (const key in typeImplementations) {
    nodeDefs[key] = typeImplementations[key].nodeDefinition()
  }

  return nodeDefs;
}

async function processInput(data: { node: ElementNode, nodeinput: number | "*", data: NodeEvent }) {
  const typeimpl = typeImplementations[data.node.type]
  if (typeimpl) {
    data.node.runtimeContext.lastEventTime = Date.now()
    setNodes(nodes.value)
    try {
      const eventCopy = data.data.copy()
      await typeimpl.process(data.node as ElementNode<never>, data.data, {
        continue: (evt, index) => {
          data.node.runtimeContext.lastOutputEventTime = Date.now()
          setNodes(nodes.value)
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
            typeImpls: typeImplementations
          }).then(() => {
            nodes.next(nodes.value)
          })

        }
      })


      data.node.runtimeContext.lastEvent = eventCopy
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

