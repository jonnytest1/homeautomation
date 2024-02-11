import { CommonModule } from '@angular/common';
import type { OnInit } from '@angular/core';
import { Component, HostListener } from '@angular/core';
import { createStateMachine } from '../utils/state-machine';
import { Vector2 } from '../wiring/util/vector';
import { PositionDirective } from './position.directive';
import { DropDataHandler } from './drop-data';
import { ConnectionLines } from './connection-lines';
import { LineComponent } from './line/line.component';
import type { DropData } from './drop-data-types';
import { GenericNodeComponent } from './generic-node/generic-node.component';
import { v4 } from "uuid"
import { GenericOptionsComponent } from './generic-options/generic-options.component';
import { ActivatedRoute, Router } from '@angular/router';
import type { ElementNode, NodeDefintion } from '../settings/interfaces';
import { logKibana } from '../global-error-handler';
import { filter } from 'rxjs/operators';
import { combineLatest } from 'rxjs';




const dataHandler = new DropDataHandler<DropData>()


@Component({
  selector: 'app-generic-setup',
  templateUrl: './generic-setup.component.html',
  styleUrls: ['./generic-setup.component.scss'],
  imports: [CommonModule, PositionDirective, LineComponent, GenericNodeComponent, GenericOptionsComponent],
  standalone: true
})
export class GenericSetupComponent implements OnInit {


  readonly state = createStateMachine("initial", "dragging", "dragpreview", "move").withData<{
    move: ElementNode
  }>()


  activeNode?: ElementNode

  constructor(public connections: ConnectionLines, private router: Router, private active: ActivatedRoute) {

    combineLatest([
      active.queryParams,
      connections.service.nodeData.pipe(
        filter(d => !!d)
      )
    ]).subscribe(([query, nodeData]) => {
      const activeNOde = query?.active
      if (activeNOde) {
        const newActive = nodeData.nodes.find(node => node.uuid === activeNOde)
        if (newActive) {
          this.activeNode = newActive
        }
      }
    })
  }

  ngOnInit() {
  }

  startDrag(evt: DragEvent, nodeDefinition: NodeDefintion) {
    dataHandler.setDropData(evt, "nodeDrag", true)
    dataHandler.setDropData(evt, "nodeDefinition", nodeDefinition)
    dataHandler.setDropData(evt, "dragOffset", { x: evt.offsetX, y: evt.offsetY })
  }
  startDragUpdate(evt: DragEvent, dragNode: ElementNode) {
    //dataHandler.setDropData(evt, "node", dragNode)
    dataHandler.setDropData(evt, "dragOffset", { x: evt.offsetX, y: evt.offsetY })

    this.state.setmove(dragNode)

  }
  dropAllowed(evt: DragEvent) {
    let isAllowed = true;

    if (![...evt.dataTransfer.items].find(i => i.type === "dragoffset")) {
      if (this.connections.pendingConnection) {
        this.connections.setTarget(evt)
      }
      isAllowed = false
    }
    if (isAllowed) {
      evt.preventDefault()
      //this.state.setdragpreview(new Vector2(evt))


    }
  }

  getNodeDefChecked(nodeDefs: Record<string, NodeDefintion>, type: string) {
    const nodeDef = nodeDefs[type]
    if (!nodeDef) {
      logKibana("ERROR", {
        message: "Missing node type",
        node_Type: type
      })
    }
    return nodeDef
  }

  @HostListener("document:keyup", ["$event"])
  onKeyPress(ev: KeyboardEvent) {

    if (this.activeNode) {
      if (ev.key == "Delete") {
        this.connections.service.nodeData.next({
          ... this.connections.service.nodeData.value,
          connections: this.connections.service.nodeData.value.connections
            .filter(con => con.source.uuid !== this.activeNode.uuid && con.target.uuid !== this.activeNode.uuid),
          nodes: this.connections.service.nodeData.value.nodes.filter(node => node !== this.activeNode)
        })

        this.activeNode = undefined
        this.connections.store()
      }
    }
  }

  setActiveNode(node: ElementNode | undefined) {
    this.activeNode = node
    this.router.navigate([], {
      queryParams: {
        active: this.activeNode?.uuid ?? null
      },
      queryParamsHandling: "merge"
    })
  }

  onDrop(evt: DragEvent) {
    if (this.state.ismove) {
      this.state.getmove.position = new Vector2(evt).subtract(new Vector2(dataHandler.getDropData(evt, "dragOffset")))
      this.connections.store(this.state.getmove.uuid)
      this.setActiveNode(this.state.getmove)
      this.state.setinitial()
      return
    }
    if (dataHandler.getDropData(evt, "connectionDrag")) {
      return
    }
    this.state.setinitial()

    const def = dataHandler.getDropData(evt, "nodeDefinition")
    const newNode: ElementNode = {
      position: new Vector2(evt).subtract(new Vector2(dataHandler.getDropData(evt, "dragOffset"))),
      type: def.type,
      uuid: v4(),
      runtimeContext: {}

    };
    this.setActiveNode(newNode)

    this.connections.service.nodeData.next({
      ... this.connections.service.nodeData.value,
      nodes: [...this.connections.service.nodeData.value.nodes, newNode]
    })

    this.connections.store(newNode.uuid)

  }

  nodeByUuid(_, node) {
    return node.uuid
  }
}
