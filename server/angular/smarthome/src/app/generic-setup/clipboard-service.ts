import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { backendActions } from './store/action';
import type { ActiveElement } from './generic-setup-types';
import type { Connection, ElementNode } from '../settings/interfaces';
import { Vector2 } from '../wiring/util/vector';
import { jsonClone } from '../utils/clone';
import { v4 } from "uuid"
import { logKibana } from '../global-error-handler';
import { isFirefox } from "../utils/browser"
@Injectable()
export class ClipboardService {


  constructor(private store: Store) {

  }


  createActiveCopy(activeelements: Array<ActiveElement> | undefined) {
    if (!activeelements?.length) {
      return []
    }
    const oldToNewNodeMap: Record<string, string> = {}

    const copyList: Array<ActiveElement> = []
    for (const activeItem of activeelements) {
      if (activeItem.type == "node") {
        const newNode: ElementNode = {
          ...activeItem.node,
          position: {
            ...new Vector2(activeItem.node.position).added(new Vector2(20, 20))
          },
          uuid: v4()
        };
        oldToNewNodeMap[activeItem.node.uuid] = newNode.uuid
        copyList.push({ type: "node", node: newNode })
      }
    }

    for (const activeItem of activeelements) {
      if (activeItem.type == "connection") {
        //currently its assuming new stuff should be manually connected to old nodes
        if (oldToNewNodeMap[activeItem.con.source.uuid] && oldToNewNodeMap[activeItem.con.target.uuid]) {
          const newConnection: Connection = {
            source: {
              index: activeItem.con.source.index,
              uuid: oldToNewNodeMap[activeItem.con.source.uuid]
            },
            target: {
              index: activeItem.con.target.index,
              uuid: oldToNewNodeMap[activeItem.con.target.uuid]
            },
            uuid: v4()
          };
          copyList.push({ type: "connection", con: newConnection })
        }
      }
    }
    return jsonClone(copyList)
  }


  async getClipboard() {
    if (!isFirefox()) {
      const result = await navigator.permissions.query({
        name: "clipboard-read" as never
      })
      if (!(result.state === "granted" || result.state === "prompt")) {
        throw new Error("clipboard not granted")
      }
    }
    return navigator.clipboard.readText()
  }
  async writeClipboard(text: string) {
    if (!isFirefox()) {
      const result = await navigator.permissions.query({
        name: "clipboard-write" as never
      })
      if (!(result.state === "granted" || result.state === "prompt")) {
        throw new Error("clipboard not granted")
      }
    }
    return navigator.clipboard.writeText(text)
  }

  storeToClipboard(elements: ActiveElement[], pos: Vector2) {
    return this.writeClipboard(JSON.stringify({
      elements: this.createActiveCopy(elements),
      cursor: {
        x: pos.x,
        y: pos.y
      }
    })).then(e => {
      return elements
    }).catch(e => {
      debugger;
      logKibana("ERROR", "error copying to clipboard", e)
    })
  }

  loadFromClipboard(activeView: string | undefined, mousePos: Vector2 | null) {
    this.getClipboard().then(e => {
      const data = JSON.parse(e) as Array<ActiveElement> | { elements: Array<ActiveElement>, cursor: { x: number, y: number } }

      let ev = null
      let nodes: Array<ActiveElement>
      if (data instanceof Array) {
        nodes = data
      } else {
        nodes = data.elements
        ev = data.cursor
      }

      for (const node of nodes) {
        if (node.type == "node") {
          if (activeView) {
            node.node.view = activeView
          }
          if (ev && mousePos) {
            const pos = new Vector2(node.node.position)
              .subtract(new Vector2(ev))
              .added(mousePos)
            node.node.position = {
              x: pos.x,
              y: pos.y
            }
          }

          this.store.dispatch(backendActions.addNode(node))
        } else if (node.type == "connection") {
          this.store.dispatch(backendActions.addConnection({ connection: node.con }))
        }
      }
    }).catch(e => {
      debugger;
    })
  }

}