import { CommonModule } from '@angular/common';
import type { OnInit } from '@angular/core';
import { Component, HostListener, inject } from '@angular/core';
import { createStateMachine } from '../utils/state-machine';
import { Vector2 } from '../wiring/util/vector';
import { PositionDirective } from './position.directive';
import { DropDataHandler } from './drop-data';
import { GenericNodesDataService } from './generic-node-data-service';
import { LineComponent } from './line/line.component';
import type { DropData } from './drop-data-types';
import { GenericNodeComponent } from './generic-node/generic-node.component';
import { v4 } from "uuid"
import { GenericOptionsComponent } from './generic-options/generic-options.component';
import { ActivatedRoute, Router } from '@angular/router';
import type { Connection, ElementNode, NodeData, NodeDefintion } from '../settings/interfaces';
import { logKibana } from '../global-error-handler';
import { filter, map, combineLatestWith, first, tap } from 'rxjs/operators';
import type { Observable } from 'rxjs';
import { BehaviorSubject, combineLatest } from 'rxjs';
import { Store } from '@ngrx/store';
import { backendActions } from './store/action';
import { selectNodeDefs, selectNodeData, selectNode, selectTouchMode } from './store/selectors';
import { LetModule } from '@ngrx/component';
import { isSameConnection } from './line/line-util';
import { ClipboardService } from './clipboard-service';
import type { ActiveElement } from './generic-setup-types';
import { BoundingBox } from '../wiring/util/bounding-box';

import { DblClickDirective } from "../utils/directive/dbl-click.directive"
import { MBDagOverDirective, MBDragStartDirective, MBDropDirective, type MBDragEvent } from "../utils/directive/drag-start.directive"
import { MatIconModule } from '@angular/material/icon';
import { TouchModeService } from './touchmode-service';


const dataHandler = new DropDataHandler<DropData>()


@Component({
  selector: 'app-generic-setup',
  templateUrl: './generic-setup.component.html',
  styleUrls: ['./generic-setup.component.scss'],
  providers: [ClipboardService, TouchModeService],
  imports: [
    CommonModule, PositionDirective, LineComponent, GenericNodeComponent, GenericOptionsComponent, LetModule,
    DblClickDirective, MBDragStartDirective, MBDropDirective, MBDagOverDirective, MatIconModule
  ],
  standalone: true
})
export class GenericSetupComponent implements OnInit {


  static pageInset = new Vector2(0, 0)
  zoom = 1;
  zoomTransform: Vector2

  readonly state = createStateMachine("initial", "dragging", "dragpreview", "move", "mousedragview").withData<{
    move: ElementNode,
    mousedragview: {
      startOffset: Vector2,
      mouseStart: Vector2
    }
  }>()

  readonly activeView$ = new BehaviorSubject<string | undefined>(undefined)

  readonly activeElements$ = new BehaviorSubject<Array<ActiveElement> | undefined>(undefined)
  readonly activeElement$ = this.activeElements$.pipe(
    map(elements => elements?.[0])

  )

  touchMode$ = this.store.select(selectTouchMode)

  private readonly storeNodeData$ = this.store.select(selectNodeData);
  private storeNodeDataBeh$ = new BehaviorSubject<NodeData | undefined>(undefined)

  public hasNodeDefs$ = this.store.select(selectNodeDefs)

  nodeData$ = this.storeNodeData$.pipe(
    filter(n => !!n),
    combineLatestWith(this.activeView$),
    map(([nodes, active]) => {
      const smallestXY = { x: Infinity, y: Infinity }

      for (const node of nodes.nodes) {
        if (node.position.x < smallestXY.x) {
          smallestXY.x = node.position.x
        }
        if (node.position.y < smallestXY.y) {
          smallestXY.y = node.position.y
        }
      }

      const smallestPosition = new Vector2(smallestXY)

      const nodePositions: Record<string, Vector2> = {}
      const filteredNodes: Array<ElementNode> = []
      const activeNodeSet = new Set()


      for (const node of nodes.nodes) {

        if (node.view !== active) {
          continue
        }
        activeNodeSet.add(node.uuid)
        filteredNodes.push(node)
        nodePositions[node.uuid] = new Vector2(node.position)//.added(new Vector2(100, 100).subtract(smallestPosition))
      }

      const activeConnections: Array<Connection> = []
      for (const con of nodes.connections) {

        if (!activeNodeSet.has(con.source.uuid) && !activeNodeSet.has(con.target?.uuid)) {
          continue
        }

        activeConnections.push(con)
      }

      return {
        nodes: {
          ...nodes,
          nodes: filteredNodes,
          connections: activeConnections
        },
        nodePositions
      }
    })
  )

  constructor(public connections: GenericNodesDataService, private router: Router, active: ActivatedRoute, private store: Store, private clipboardService: ClipboardService) {
    inject(TouchModeService)
    connections.loadGenericData();
    this.storeNodeData$.subscribe(this.storeNodeDataBeh$)
    combineLatest([
      active.queryParams as Observable<{ active?: string, view?: string }>,
      this.storeNodeData$.pipe(
        filter(d => !!d?.nodes?.length)
      )
    ]).pipe(first())
      .subscribe(([query, nodeData]) => {
        const activeNOde = query?.active
        if (activeNOde) {
          const newActive = nodeData.nodes.find(node => node.uuid === activeNOde)
          if (newActive) {
            this.activeElements$.next([{
              type: "node",
              node: newActive
            }])
          }
        }
        if (query.view) {
          this.activeView$.next(query.view)
        }
      })
  }

  ngOnInit() {
  }

  getTransform() {
    const zoomRounded = Math.round(100 * this.zoom) / 100
    return `scale(${zoomRounded})`
  }
  getDimensions() {
    return Math.floor(100 / this.zoom) + "%"
  }
  startDrag(evt: MBDragEvent, nodeDefinition: NodeDefintion) {
    dataHandler.setDropData(evt, "nodeDrag", true)
    dataHandler.setDropData(evt, "nodeDefinition", nodeDefinition)
    dataHandler.setDropData(evt, "dragOffset", evt.offsetPosition)
  }
  startDragUpdate(evt: MBDragEvent, dragNode: ElementNode) {
    //dataHandler.setDropData(evt, "node", dragNode)
    dataHandler.setDropData(evt, "dragOffset", evt.offsetPosition)

    this.state.setmove(dragNode)


    evt.stopPropagation()
  }
  dropAllowed(evt: MBDragEvent) {
    let isAllowed = true;

    if (!dataHandler.hasKey(evt, "dragOffset")) {
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


  convertVectorZoom(position: Vector2) {

    const zoomRounded = this.zoom

    return position.dividedBy(zoomRounded)
  }

  onscroll(ev: WheelEvent) {

    if (ev.deltaY) {
      if (ev.deltaY < 0) {
        this.zoom *= 1.05
      } else {
        this.zoom /= 1.05
      }
      this.zoomTransform = new Vector2(ev)
    }
    return false
  }
  async doubleClick(node: ElementNode) {
    if (node.type === "view") {
      this.activeView$.next(node.uuid)
      await this.router.navigate([], {
        queryParams: {
          view: node.uuid
        },
        queryParamsHandling: "merge"
      })
      this.setActiveNode(undefined)

    }
  }


  @HostListener("document:keyup", ["$event"])
  onKeyPress(ev: KeyboardEvent) {
    if (this.activeView$.value) {
      if (ev.key == "Escape") {
        this.viewUp();

      }
    }
    if (this.activeElements$.value?.length) {
      if (ev.key == "Delete") {
        const currentlyActive = this.activeElements$.value?.[0]
        if (currentlyActive?.type == "node") {
          this.activeElements$.next(undefined)

          this.store.dispatch(backendActions.deleteNode({ node: currentlyActive.node.uuid }))

          /* this.connections.nodeData.next({
             ... this.connections.nodeData.value,
             connections: this.connections.nodeData.value.connections
               .filter(con => con.source.uuid !== currentlyActive.node.uuid && con.target.uuid !== currentlyActive.node.uuid),
             nodes: this.connections.nodeData.value.nodes.filter(node => node !== currentlyActive.node)
           })*/

          // this.connections.store()
        } else if (currentlyActive?.type == "connection") {
          this.store.dispatch(backendActions.deleteConnection({ connection: currentlyActive.con }))
          /*this.connections.nodeData.next({
            ... this.connections.nodeData.value,
            connections: this.connections.nodeData.value.connections
              .filter(con => con !== currentlyActive.con),

          })*/

          this.activeElements$.next(undefined)
          //this.connections.store()
        }


      } else if (ev.key == "c") {
        if (ev.ctrlKey) {
          this.clipboardService.storeToClipboard(this.activeElements$.value)

        } else {
          const currentlyActive = this.activeElements$.value

          if (currentlyActive) {
            const oldToNewNodeMap: Record<string, string> = {}
            for (const activeItem of currentlyActive) {
              if (activeItem.type == "node") {
                const newNode: ElementNode = {
                  ...activeItem.node,
                  position: {
                    ...new Vector2(activeItem.node.position).added(new Vector2(20, 20))
                  },
                  uuid: v4()
                };
                oldToNewNodeMap[activeItem.node.uuid] = newNode.uuid
                if (currentlyActive.length === 1) {
                  this.setActiveNode(newNode, null)
                }
                this.store.dispatch(backendActions.addNode({ node: newNode }))
              }
            }

            for (const activeItem of currentlyActive) {
              if (activeItem.type == "connection") {
                //currently its assuming new stuff should be manually connected to old nodes
                if (oldToNewNodeMap[activeItem.con.source.uuid] && oldToNewNodeMap[activeItem.con.target.uuid]) {
                  const newNode: Connection = {
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
                  this.store.dispatch(backendActions.addConnection({ connection: newNode }))
                }


              }
            }
          }
        }

      } else if (ev.key == "x") {
        if (ev.ctrlKey) {
          this.clipboardService.storeToClipboard(this.activeElements$.value).then((activeelements) => {
            if (!activeelements) {
              return
            }
            for (const el of activeelements) {
              if (el.type == "node") {
                this.store.dispatch(backendActions.deleteNode({ node: el.node.uuid }))
              } else if (el.type === "connection") {
                this.store.dispatch(backendActions.deleteConnection({ connection: el.con }))
              }
            }
          })
        }
      }
    }
    if (ev.key == "v") {
      if (ev.ctrlKey) {
        this.clipboardService.loadFromClipboard(this.activeView$.value)

      }
    }
    if (ev.key === "d" || (ev.key == "i" && ev.ctrlKey)) {
      this.connections.debugMode.next(!this.connections.debugMode.value)
    }
  }


  viewUp() {
    if (this.activeView$.value) {
      this.store.select(selectNode(this.activeView$.value)).pipe(
        first()
      ).subscribe(currentView => {
        if (currentView) {
          this.router.navigate([], {
            queryParams: {
              view: currentView.view
            },
            queryParamsHandling: "merge"
          });
          this.activeView$.next(currentView.view);
        } else {
          this.router.navigate([], {
            queryParams: {
              view: null
            },
            queryParamsHandling: "merge"
          });
          this.activeView$.next(undefined);
        }
      });
    }
  }

  isInElements(elements: Array<ActiveElement> | null | undefined, node: ElementNode | Connection, typeMatch = false) {
    if (!elements) {
      return false
    }

    return elements.some(el => {
      if ("type" in node) {
        if (el.type == "node") {
          if (typeMatch) {
            return el.node.type === node.type
          }
          return el.node.uuid === node.uuid
        }
      } else {
        if (el.type == "connection") {
          return isSameConnection(el.con, node);
        }
      }
      return false
    })
  }

  mouseDragSTart(mousevent: MBDragEvent, el: HTMLElement) {

    this.state.setmousedragview({
      mouseStart: mousevent.position,
      startOffset: new Vector2(el.scrollLeft, el.scrollTop)
    })

  }
  mouseDragMove(mousevent: MouseEvent | TouchEvent, el: HTMLElement) {
    if (mousevent instanceof TouchEvent) {
      mousevent.preventDefault()
    }
    if (this.state.ismousedragview) {
      const movementDiff = new Vector2(mousevent).subtract(this.state.getmousedragview.mouseStart)
      const newSCroll = this.state.getmousedragview.startOffset.subtract(movementDiff)

      const backgroundEl = el.querySelector<HTMLElement>("#background-drop")
      if (!backgroundEl) {
        return
      }
      const contentDimensions = new BoundingBox(backgroundEl)
      const parentDimensions = new BoundingBox(el)

      if (newSCroll.y < 0) {
        //backgroundEl.style.minHeight = contentDimensions.getHeight() - newSCroll.y + "px"
      }
      if (newSCroll.x < 0) {
        //backgroundEl.style.minWidth = contentDimensions.getWidth() - newSCroll.x + "px"
      }
      const neededHeight = newSCroll.y + parentDimensions.getHeight();
      if (neededHeight > contentDimensions.getHeight()) {
        backgroundEl.style.minHeight = neededHeight - 12 + "px"
      }

      const neededWith = newSCroll.x + parentDimensions.getWidth();
      if (neededWith > contentDimensions.getWidth()) {
        backgroundEl.style.minWidth = neededWith - 12 + "px"
      }
      el.scrollTo({
        //behavior: "instant",
        left: newSCroll.x,
        top: newSCroll.y
      })
    }
  }

  mouseDragEnd(mousevent: MouseEvent, el: HTMLElement) {
    if (this.state.ismousedragview) {
      this.state.setinitial()
    }
  }
  setActiveNode(element: ElementNode | Connection | undefined, event: MouseEvent | undefined | null = undefined) {
    event?.stopPropagation()

    let queryParam: string | null = null
    if (element !== undefined) {
      let container: ActiveElement
      if ("type" in element) {
        container = { type: "node", node: element }
        queryParam = element.uuid
      } else {
        container = { type: "connection", con: element }
      }

      if (event?.ctrlKey) {
        const prev = this.activeElements$.value ?? []
        if (!prev.includes(container)) {
          this.activeElements$.next([...prev, container])
        }

      } else {
        this.activeElements$.next([container])
      }
    } else {
      this.activeElements$.next(undefined)
    }

    this.router.navigate([], {
      queryParams: {
        active: queryParam ?? null
      },
      queryParamsHandling: "merge"
    })
  }

  onDrop(evt: MBDragEvent, scrollElement: HTMLElement) {
    if (this.state.ismove) {
      const dragOffset = dataHandler.getDropData(evt, "dragOffset");
      if (!dragOffset) {
        return
      }
      const newPosition = this.convertVectorZoom(evt.position.subtract(GenericSetupComponent.pageInset)
        .subtract(new Vector2(dragOffset)).added(Vector2.fromStyles(scrollElement, "scroll")
        )
      );
      this.store.dispatch(backendActions.updatePosition({
        node: this.state.getmove.uuid,
        position: newPosition
      }))
      this.setActiveNode(this.state.getmove)
      this.state.setinitial()
      evt.stopPropagation()
      return
    }
    if (dataHandler.getDropData(evt, "connectionDrag")) {
      return
    }
    this.state.setinitial()

    const def = dataHandler.getDropData(evt, "nodeDefinition")
    if (!def) {
      logKibana("ERROR", "nodeDefinition not in dropdata")
      return
    }

    const dragOffset = dataHandler.getDropData(evt, "dragOffset");
    if (!dragOffset) {
      logKibana("ERROR", "dragOffset not in dropdata")
      return
    }
    const newNode: ElementNode = {
      position: evt.position
        .subtract(new Vector2(dragOffset))
        .subtract(GenericSetupComponent.pageInset),
      type: def.type,
      uuid: v4(),
      runtimeContext: {}
    };
    if (this.activeView$.value) {
      newNode.view = this.activeView$.value
    }
    this.setActiveNode(newNode)

    this.store.dispatch(backendActions.addNode({ node: newNode }))
  }

  nodeByUuid(_, node) {
    return node.uuid
  }
}
