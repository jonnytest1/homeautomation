import type {
  NullTypeSubject, TypeImplementaiton
} from './typing/generic-node-type';
import type { Callbacks } from './typing/node-callbacks';
import type { ElementNode } from './typing/element-node';

import { updateTypeSchema } from './generic-type.utils';
import type { NodeEvent } from './node-event';
import type { NodeDefOptinos } from './typing/node-options';
import type { NodeEventData } from './typing/node-event-data';
import { setLastEvent, setLastEventInputTime, setLastEventOutputTime } from './last-event-service';
import { ElementNodeImpl } from './element-node';
import { deletedNodesDataFolder, nodesContextFolder, nodesDataFolder } from './generic-node-constants';
import { init } from './validation/watcher';
import { genericNodeDataStore } from './generic-store/reference';
import { backendToFrontendStoreActions, initializeStore } from './generic-store/actions';
import { nodeDataSelector, nodeglobalsSelector, selectGlobals, selectNodeByUuid, selectNodesOfType, selectTargetConnectorForNodeUuid } from './generic-store/selectors';
import { forNodes, selectConnectionsFromContinue } from './generic-store/flow-selectors';
import { loadNodeData } from './generic-node-data-loader';
import { getLaodingFile, startHotRelaodingWatcher } from './hot-reloading';
import { createNodeEvent } from './generic-store/node-event-factory';
import { checkInvalidations } from './element-node-fnc';
import { registerGenericSocketHandler } from './socket/generic-node-socket-handler';
import { typeImplementations } from './type-implementations';
import { setSkip } from './emit-flag';
import { NodeContextData as DataBackup } from './models/node-backup';
import { logKibana } from '../../util/log';
import { environment } from '../../environment';
import { jsonClone } from '../../util/json-clone';
import type { Action } from '../../util/data-store/action';
import { BehaviorSubject, combineLatest, Subject, type Subscription } from "rxjs"
import { filter, skip } from "rxjs/operators"
import { PsqlBase, save, updateDatabase } from 'hibernatets';
import { writeFileSync } from "fs"
import { rename, mkdir } from "fs/promises"
import { join } from "path"



const hasLoaded$ = new BehaviorSubject(false)


let storeTimeout: NodeJS.Timeout | undefined
let lastStoreTime = -1


const backupPool = new PsqlBase({
  keepAlive: true
})
genericNodeDataStore.selectWithAction(nodeglobalsSelector)
  .pipe(filter(([d, action]) => !!d.connections.length && action !== "initialize node store"))
  .subscribe(([nodeData, a]) => {
    if (storeTimeout && lastStoreTime > (Date.now() - (1000 * 60))) {
      clearTimeout(storeTimeout)
    }
    storeTimeout = setTimeout(() => {
      console.log("writing connections and globals for " + a)

      save(DataBackup.from(nodeData), { updateOnDuplicate: true, db: backupPool })
      lastStoreTime = Date.now()
      storeTimeout = undefined
    }, 2000)
  })


setInterval(() => {
  const historyFile = join(nodesContextFolder, `nodes-history-${new Date().toISOString().split("T")[0]}.json`)

  writeFileSync(historyFile, JSON.stringify(genericNodeDataStore.getOnce(nodeDataSelector), undefined, "   "))
}, 1000 * 60 * 60 * 24)

declare global {
  var debugNode: (uuid: string) => void
  var debugNextCall: (uuid: string) => void
}


globalThis.debugNode = (uuid: string) => {
  const node = genericNodeDataStore.getOnce(selectNodeByUuid(uuid))

  console.log(node)
}

let debugActive: string | null = null

globalThis.debugNextCall = (uuid: string) => {
  debugActive = uuid
}


export function emitFromNode(nodeUuid: string, evt: NodeEvent, index?: number) {
  setLastEventOutputTime(nodeUuid, index ?? 0, Date.now())
  const emittingConnections = genericNodeDataStore.getOnce(selectConnectionsFromContinue({
    fromIndex: index,
    fromNode: nodeUuid
  }))

  for (const emittingCon of emittingConnections) {
    const nextNode = genericNodeDataStore.getOnce(selectNodeByUuid(emittingCon.uuid))
    if (!nextNode) {
      logKibana("WARN", { message: "node not found", uuid: emittingCon.uuid })
      return
    }
    processInput({
      node: nextNode,
      nodeinput: emittingCon.index,
      data: evt.clone()
    })
  }
}


if (environment.WATCH_SERVICES && !environment.SMARTHOME_DISABLED) {
  startHotRelaodingWatcher().then(() => {
    hasLoaded$.next(true)
  })

}

const subscriptionMap: Record<string, Subscription> = {}


genericNodeDataStore.addEffect(backendToFrontendStoreActions.updateInputSchema, (st, a) => {
  const connections = genericNodeDataStore.getOnce(selectTargetConnectorForNodeUuid(a.nodeUuid))

  if (connections) {
    connections[0].forEach(con => {
      const connectionNode = genericNodeDataStore.getOnce(selectNodeByUuid(con.source.uuid))

      const nodeTypeImpl = typeImplementations.value[connectionNode.type];

      if (!nodeTypeImpl) {
        logKibana("ERROR", "missing impl for type " + connectionNode.type)
      } else {
        nodeTypeImpl.targetConnectionTypeChanged?.(connectionNode, a.schema)
      }
    })
  }
})

genericNodeDataStore.addEffect(backendToFrontendStoreActions.addConnnection, (st, a) => {

  const target = genericNodeDataStore.getOnce(selectNodeByUuid(a.connection.target.uuid))
  const source = genericNodeDataStore.getOnce(selectNodeByUuid(a.connection.source.uuid))

  const nodeTypeImpl = typeImplementations.value[source.type];

  if (!nodeTypeImpl) {
    logKibana("ERROR", "missing impl for type " + source.type)
  } else {
    // need to merge other connections !!
    nodeTypeImpl.targetConnectionTypeChanged?.(source, target.runtimeContext.inputSchema)
  }
})

genericNodeDataStore.addEffect(backendToFrontendStoreActions.removeConnnection, (st, a) => {
  const source = genericNodeDataStore.getOnce(selectNodeByUuid(a.connection.source.uuid))

  const nodeTypeImpl = typeImplementations.value[source.type];

  if (!nodeTypeImpl) {
    logKibana("ERROR", "missing impl for type " + source.type)
  } else {
    nodeTypeImpl.targetConnectionTypeChanged?.(source, undefined)
  }
})

registerGenericSocketHandler()

forNodes({
  added(node, action) {
    let last: ElementNode | null = null
    if (action === initializeStore.type) {
      last = jsonClone(node)
    }
    let pendingCheck = false
    let lastNodeStore = -1;
    let lastNodeStoreTimeout: NodeJS.Timeout | undefined;

    let lastEmit = -1;

    const actions: Array<Action<string, unknown> | undefined> = []

    subscriptionMap[node.uuid] = combineLatest([
      genericNodeDataStore.selectWithCompleteAction(selectNodeByUuid(node.uuid)),
      genericNodeDataStore.select(selectTargetConnectorForNodeUuid(node.uuid))
    ])
      .pipe(
        skip(action === "initialize node store" ? 1 : 0),
      )
      .subscribe(async ([[node, updateAction], connwctions]) => {
        actions.push(updateAction)
        if (node) {
          lastEmit = Date.now()
          if (lastNodeStore && lastNodeStore > (Date.now() - (1000 * 60))) {
            clearTimeout(lastNodeStoreTimeout)
          }
          lastNodeStoreTimeout = setTimeout(() => {
            console.log(`writing node for ${updateAction?.type} ${node.uuid} ${node.type}`)

            const file = join(nodesDataFolder, node.uuid + ".json")
            writeFileSync(file, JSON.stringify(node, undefined, "   "))

            lastNodeStore = Date.now()
            lastNodeStoreTimeout = undefined
          }, 5000)

          if (pendingCheck) {
            return
          }
          const typeImpl = typeImplementations.value[node.type];
          if (typeImpl) {

            Object.setPrototypeOf(node, ElementNodeImpl.prototype);
            Object.assign(node, createCallbacks(node))
            console.log("running node check for " + node.uuid + " after " + updateAction?.type)
            pendingCheck = true
            try {
              checkInvalidations(typeImpl, node, last);
              actions.length = 0
              const nodeCpy = jsonClone(node)
              const passedNode = jsonClone(node)
              Object.setPrototypeOf(passedNode, ElementNodeImpl.prototype);
              Object.assign(passedNode, createCallbacks(passedNode))

              await typeImpl.nodeChanged?.(passedNode as ElementNodeImpl<never>, last);

              const nodeChanged = genericNodeDataStore.getOnce(selectNodeByUuid(node.uuid))
              if (!actions?.length) {
                genericNodeDataStore.dispatch(backendToFrontendStoreActions.updateNode({
                  newNode: passedNode
                }))
              } else if (JSON.stringify(nodeCpy) !== JSON.stringify(passedNode)) {
                debugger;
                logKibana("ERROR", "node changed with store update")
              }
              const preTypeEmmit = lastEmit;
              updateTypeSchema(nodeChanged, {
                typeImpls: typeImplementations.value
              })
                .then(() => {
                  if (preTypeEmmit === lastEmit) {
                    // if there was an update from the node in the store we assume the node doesnt need manual update
                    genericNodeDataStore.dispatch(backendToFrontendStoreActions.updateNode({
                      newNode: nodeChanged
                    }))
                  }

                })
                .catch(e => {
                  logKibana("ERROR", {
                    message: "error updating type schema",
                    nodeUuid: node.uuid
                  }, e)
                })
                .finally(() => {
                  pendingCheck = false
                  console.log("unsetting pending for " + node.uuid)
                });
            } catch (e) {
              pendingCheck = false
              console.log("unsetting pending error for " + node.uuid)
              logKibana("ERROR", {
                message: "error during node change",
                type: node.type,

                node: node.uuid
              }, e)

            }
          } else {
            logKibana("ERROR", {
              message: "missing type implementation for node",
              type: node.type
            })
          }
        }

        last = jsonClone(node)
      })
  },
  removed(node) {
    subscriptionMap[node]?.unsubscribe()
    const file = join(nodesDataFolder, node + ".json")
    const targetFile = join(deletedNodesDataFolder, node + ".json")
    mkdir(deletedNodesDataFolder, { recursive: true }).then(() => {
      rename(file, targetFile)
    })


  },
})
loadNodeData(backupPool)

init()
updateDatabase(__dirname + '/models', {
  dbPoolGEnerator: PsqlBase,
  modelDb: "public"
}).then(() => {
  console.log("updated db")
}).catch(e => {
  debugger
  throw e
})

export function addTypeImpl<C, G extends NodeDefOptinos, O extends NodeDefOptinos, P, S, TS extends NullTypeSubject>(typeImpl: TypeImplementaiton<C, G, O, P, S, TS>) {

  const currerntTypeImpls = typeImplementations.value
  const implementationType = typeImpl.nodeDefinition().type;
  typeImpl._file = getLaodingFile()



  if (typeImpl.messageSocket) {
    typeImpl._socket = new Subject()
    typeImpl.messageSocket(typeImpl._socket)
  }


  let elementNodes: Array<ElementNodeImpl<never>> | null = null




  const typeImplUpdate = currerntTypeImpls[implementationType];
  if (typeImplUpdate?.unload) {
    if (!elementNodes) {
      elementNodes = getElementNodes(implementationType);
    }
    const globals = genericNodeDataStore.getOnce(selectGlobals)
    currerntTypeImpls[implementationType]?.unload?.(elementNodes, globals as never)

  }
  currerntTypeImpls[implementationType] = typeImpl as never
  typeImplementations.next(currerntTypeImpls)


  if (typeImpl.initializeServer) {
    if (!elementNodes) {
      elementNodes = getElementNodes(implementationType);

    }
    const globals = genericNodeDataStore.getOnce(selectGlobals)
    typeImpl.initializeServer(elementNodes, globals as never)

  }

  if (typeImplUpdate) {
    reloadNodes(elementNodes, implementationType, currerntTypeImpls);
  }

  console.log(`added type implementaiton for ${implementationType}`)
  return {} as {
    server_context: S,
    opts: O
  }
}
async function reloadNodes(elementNodes: ElementNodeImpl<never, Partial<NodeDefOptinos>>[] | null, implementationType: string, currerntTypeImpls: Record<string, TypeImplementaiton>) {
  if (!elementNodes) {
    elementNodes = getElementNodes(implementationType);
  }

  for (const node of elementNodes) {
    await currerntTypeImpls[implementationType].nodeChanged?.(node, node);
    await updateTypeSchema(node, {
      typeImpls: typeImplementations.value
    });
  }
  return elementNodes;
}

function getElementNodes(implementationType: string): ElementNodeImpl<never>[] {
  return genericNodeDataStore.getOnce(selectNodesOfType(implementationType)).map(node => {
    return new ElementNodeImpl<never>(node as ElementNode<never>, createCallbacks(node))
  });
}

function createCallbacks(node: ElementNode) {
  const nodeUuid = node.uuid
  return {
    continue: (evt, index) => {

      emitFromNode(nodeUuid, evt.clone(), index)
    },
    updateNode(frontendEmit = true) {
      setSkip(!frontendEmit)
      genericNodeDataStore.dispatch(backendToFrontendStoreActions.updateNode({
        newNode: { ...node }
      }))
      setSkip(false)
    }
  } satisfies Callbacks
}


async function processInput(data: { node: ElementNode, nodeinput: number, data: NodeEvent }) {
  const typeimpl = typeImplementations.value[data.node.type]
  if (typeimpl) {
    setLastEventInputTime(data.node, data.nodeinput ?? 0, Date.now())
    try {
      const eventCopy = data.data.copy()
      data.data.inputIndex = data.nodeinput

      if (debugActive === data.node.uuid) {
        debugActive = null
        debugger
      }
      await typeimpl.process(data.node as ElementNode<never>, data.data, createCallbacks(data.node))


      setLastEvent(data.node, eventCopy)
    } catch (e) {
      logKibana("ERROR", {
        message: "error during process of node",
        nodetype: data.node.type,
        nodeid: data.node.uuid
      }, e)
    }
  } else if (hasLoaded$.value) {
    logKibana("ERROR", { message: "missing node type implemenation", nodetype: data.node.type })
  }
}


let eventIndex = 0

export function emitEvent(type: string, data: NodeEventData) {
  if (environment.SMARTHOME_DISABLED) {
    return
  }

  data.context.eventIndex = eventIndex++
  const nodes = genericNodeDataStore.getOnce(selectNodesOfType(type))
  nodes.forEach(node => {
    const event = createNodeEvent(data)

    const start = Date.now()
    processInput({
      node: node,
      nodeinput: 0,
      data: event
    }).then(() => {
      const end = Date.now()

      const duration = end - start;
      if (duration > 1000) {
        logKibana("ERROR", {
          message: "handled event",
          type,
          context: JSON.stringify(data.context),
          start,
          end,
          duration: duration
        })
      }

    })
  })
}

export const withSideEffects = true