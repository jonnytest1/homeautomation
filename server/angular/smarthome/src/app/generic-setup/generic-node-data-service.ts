import { Injectable } from '@angular/core';

import { BehaviorSubject } from 'rxjs';
import { SettingsService } from '../settings.service';
import type { ActionTriggersEvent, Connection, ConnectorDefintion, ElementNode, NodeData, NodeDefOptinos, NodeDefToType, NodeDefintion, NodeEventTimes } from '../settings/interfaces';
import { Store } from '@ngrx/store';
import { BackendActions, backendActions, setNodeData, updateNode, updateNodeDef } from './store/action';
import { logKibana } from '../global-error-handler';



export type PendingConnection = {
  source: ConnectorDefintion,
  target?: DragEvent
}


@Injectable({ providedIn: "root" })
export class GenericNodesDataService {


  //connections = new BehaviorSubject<Array<Connection>>([])

  debugMode = new BehaviorSubject<boolean>(false)

  pendingConnection = new BehaviorSubject<Connection | PendingConnection | undefined>(undefined)

  connectorMap: Record<string, { output: Array<HTMLElement>, input: Array<HTMLElement> }> = {}

  public nodeEventTimes: BehaviorSubject<NodeEventTimes | undefined> = new BehaviorSubject(undefined);

  public actionTriggers$ = new BehaviorSubject<ActionTriggersEvent["data"] | undefined>(undefined)

  constructor(private service: SettingsService, private ngrxStore: Store) {

    service.genericNodeEvents.subscribe(messageEvent => {
      if (messageEvent.type == 'nodeDefinitions') {
        ngrxStore.dispatch(updateNodeDef({
          data: messageEvent.data
        }))
      } else if (messageEvent.type == 'nodeData') {
        ngrxStore.dispatch(setNodeData({ data: messageEvent.data }))
      } else if (messageEvent.type == 'action-triggers') {
        this.actionTriggers$.next(messageEvent.data)
      } else if (messageEvent.type == 'lastEventTimes') {
        this.nodeEventTimes.next(messageEvent.data)
      } else if (messageEvent.type == 'nodeUpdate') {
        ngrxStore.dispatch(updateNode({ data: messageEvent.data }))

      } else if (messageEvent.type == 'store-reducer') {
        messageEvent.data.fromSocket = true
        ngrxStore.dispatch(messageEvent.data)
      } else {
        debugger
      }
    })
  }
  loadGenericData() {
    this.service.onSocketOpen.genericData = (ws) => {
      this.service.genericNodeSendingEvents.next({
        type: "generic-node-event",
        data: {
          type: "subscribe generic node"
        }
      })
    }
    this.service.genericNodeSendingEvents.next({
      type: "generic-node-event",
      data: {
        type: "load-node-data"
      }
    })
  }

  loadActionTriggers() {
    this.service.genericNodeSendingEvents.next({
      type: "generic-node-event",
      data: {
        type: "load-action-triggers"
      }
    })
  }

  public passBackendAction(action: BackendActions) {
    this.service.genericNodeSendingEvents.next({
      type: "generic-node-event",
      data: action
    })
  }

  registerConnection(uuid: string, type: "out" | "in", index, el: HTMLElement) {
    this.connectorMap[uuid] ??= {
      input: [], output: []
    }
    let ar: Array<HTMLElement>
    if (type == "in") {
      ar = this.connectorMap[uuid].input
    } else {
      ar = this.connectorMap[uuid].output
    }
    ar[index] = el
  }

  /* getInputConnections(nodeUuid: string) {
     const inputsConnections: Array<{ con: Connection, node: ElementNode }> = []
     const nodeData = this.nodeData.value
 
 
     for (const connection of nodeData.connections) {
       if (connection.target.uuid == nodeUuid) {
         inputsConnections.push({
           con: connection,
           node: nodeData.nodes.find(n => n.uuid === connection.source.uuid)
         })
       }
     }
     return inputsConnections
   }*/
  getConnectionElement(con: ConnectorDefintion, type: "out" | "in") {
    const nodeConnectors = this.connectorMap[con.uuid]
    if (!nodeConnectors) {
      return null
    }
    let ar: Array<HTMLElement>

    if (type == "in") {
      ar = nodeConnectors.input
    } else {
      ar = nodeConnectors.output
    }
    return ar[con.index]
  }

  addConnection(uuid: string, indx: number) {
    this.pendingConnection.next({
      source: {
        index: indx, uuid
      }
    })
  }
  setTarget(target: DragEvent) {
    if (this.pendingConnection.value) {
      this.pendingConnection.next({ ...this.pendingConnection.value, target: target })
    }
  }
  finalize(targetuuid: string, indx: number) {
    if (!this.pendingConnection.value) {
      logKibana("ERROR", "pending connecton doesnt exist")
      return
    }
    this.ngrxStore.dispatch(backendActions.addConnection({
      connection: {
        source: this.pendingConnection.value?.source,
        target: {
          uuid: targetuuid,
          index: indx
        }
      }
    }))
    /*this.nodeData.next({
      ...this.nodeData.value,
      connections: [...this.nodeData.value.connections,]
    })*/
    //this.store(this.pendingConnection.value.source.uuid)
    this.pendingConnection.next(undefined)
  }

  /* store(changedUuid?: string) {
     this.storeNodes(this.nodeData.value, changedUuid)
   }*/
  mergeGlobals(options: Partial<NodeDefToType<NodeDefOptinos>>) {

    this.ngrxStore.dispatch(backendActions.updateGlobals({ globals: options }))
    /* const newglobals = Object.assign({}, this.nodeData.value.globals ?? {}, options)
 
     this.nodeData.next({ ...this.nodeData.value, globals: newglobals })*/
  }


  storeNodes(nodes: NodeData, changedUuid?: string) {
    this.service.genericNodeSendingEvents.next({
      type: "generic-node-event",
      data: {
        type: "store-nodes",
        data: nodes,
        changedUuid
      }
    })
  }

}