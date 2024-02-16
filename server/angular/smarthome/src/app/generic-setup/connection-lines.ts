import { Injectable } from '@angular/core';

import { BehaviorSubject } from 'rxjs';
import { SettingsService } from '../settings.service';
import type { Connection, ConnectorDefintion, ElementNode } from '../settings/interfaces';



export type PendingConnection = {
  source: ConnectorDefintion, target: DragEvent
}


@Injectable({ providedIn: "root" })
export class ConnectionLines {

  //connections = new BehaviorSubject<Array<Connection>>([])

  debugMode = new BehaviorSubject<boolean>(false)

  pendingConnection = new BehaviorSubject<Connection | PendingConnection>(undefined)


  connectorMap: Record<string, { output: Array<HTMLElement>, input: Array<HTMLElement> }> = {}

  constructor(public service: SettingsService) {

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

  getInputConnections(nodeUuid: string) {
    const inputsConnections: Array<{ con: Connection, node: ElementNode }> = []
    const nodeData = this.service.nodeData.value


    for (const connection of nodeData.connections) {
      if (connection.target.uuid == nodeUuid) {
        inputsConnections.push({
          con: connection,
          node: nodeData.nodes.find(n => n.uuid === connection.source.uuid)
        })
      }
    }
    return inputsConnections
  }
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
    this.service.nodeData.next({
      ...this.service.nodeData.value,
      connections: [...this.service.nodeData.value.connections, {
        source: this.pendingConnection.value.source,
        target: {
          uuid: targetuuid,
          index: indx
        }
      }]
    })
    this.pendingConnection.next(undefined)
    this.store()
  }

  store(changedUuid?: string) {
    this.service.storeNodes(this.service.nodeData.value, changedUuid)
  }

}