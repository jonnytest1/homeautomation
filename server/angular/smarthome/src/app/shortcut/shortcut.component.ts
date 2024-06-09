import type { OnInit } from '@angular/core';
import { HostListener, Component, Input } from '@angular/core';
import { ButtonComponent } from './button/button.component';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import type { ButtonConfig, Configs } from './shortcut-config';
import { ProgressComponent } from './progress/progress.component';
import { SettingsService } from '../settings.service';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { MatButtonModule } from '@angular/material/button';
import { map } from 'rxjs/operators';
import { jsonClone, jsonEquals } from '../utils/clone';
import type { ReceiverFe } from '../settings/interfaces';
import { BoundingBox } from '../wiring/util/bounding-box';
import { Vector2 } from '../wiring/util/vector';
import { createStateMachine } from '../utils/state-machine';
import { logKibana } from '../global-error-handler';
import { v4 as uuid } from 'uuid';
import { CaptureEventDirective } from '../utils/directive/capturing-event';
import { DiagramComponent } from './diagram/diagram.component';
import { GenericNodesDataService } from '../generic-setup/generic-node-data-service';
import { Observable, combineLatest } from 'rxjs';
import { ActionTemplateComponent } from './action-template/action-template.component';
import { ShortcutReceiver, type ShortcutAction } from './shortcut-types';
import { LongPressDirective } from '../utils/directive/longpress-directive';




@Component({
  selector: 'app-shortcut',
  templateUrl: './shortcut.component.html',
  styleUrls: ['./shortcut.component.less'],
  imports: [ButtonComponent, CommonModule, ProgressComponent,
    MatButtonModule, MatIconModule,
    CaptureEventDirective, DiagramComponent, ActionTemplateComponent, LongPressDirective],
  standalone: true
})
export class ShortcutComponent implements OnInit {


  public state = createStateMachine(
    "pressable", "adding", "edit", "addbackground", "pickingadd", "redrag")

  tempNodes: Array<Configs & { temp?: boolean }> | undefined = undefined;
  tempData: {
    receiver: ShortcutReceiver,
    action: ShortcutAction & {
      type?: Configs["type"]
    }
  } | undefined
  tempCursorPos: {
    x: number
    y: number
  } | undefined
  editingConfig: (Configs & { temp?: boolean; }) | undefined;

  configModeStart = -1
  editingStart = -1
  nodes: Array<Configs> = this.getNodes() ?? [
    {
      type: "button",
      receiver: "lamp-component",
      actionName: "off",
      displayText: "lamp off"
    }, {
      receiver: "lamp-component",
      type: "progress",
      percent: 56,
      subtitle: "subtitöle"
    }
  ]

  addingto?: ButtonConfig

  genDAtaActions$;

  receivers$: Observable<Array<ShortcutReceiver>> = combineLatest([
    this.settingsService.receivers$,
    this.genData.actionTriggers$
  ])
    .pipe(
      map(([rec, genData]): Array<ShortcutReceiver> => {
        if (!genData) {
          return Object.values(rec) as Array<ShortcutReceiver>
        }
        return [...Object.values(rec) as Array<ShortcutReceiver>, genData];
      })
    )
  constructor(private settingsService: SettingsService, private bottomSheet: MatBottomSheet, private genData: GenericNodesDataService) {

    genData.loadActionTriggers()
  }

  getNodes() {
    const nodes = localStorage.getItem("shortcutconfig");
    if (!nodes || nodes == "undefined") {
      return undefined
    }
    return JSON.parse(nodes)
  }




  ngOnInit() {
  }

  baseAction(config: Configs) {
    if (!this.state.ispressable) {
      return
    }
    if ("actionName" in config) {

      if ("confirm" in config && config.confirm) {
        config.confirm = false;
        this.settingsService.confirmAction(config.receiver, config.actionName)
          .subscribe();
      } else {
        this.settingsService.triggerAction(config.receiver, config.actionName)
          .subscribe(resp => {
            if (resp == "pending_confirmation") {
              (config as ButtonConfig).confirm = true;
            }
          });
      }




    }
  }

  addBackground(cfg: Configs) {
    if (cfg.type == "button") {
      this.addingto = cfg
      this.state.setaddbackground()
    }
  }

  configPressed(config: Configs, event) {
    window.oncontextmenu = function () {
      window.oncontextmenu = null;
      return false;
    }
    console.log(config);
    //event.srcEvent.preventDefault();
    //event.srcEvent.stopPropagation();
    this.state.setedit()
    this.configModeStart = Date.now();
    //event.srcEvent.stopImmediatePropagation();
  }
  configSwipe() {
    if (this.state.isedit) {
      return
    }
    this.state.setpickingadd()
    document.body.style.overscrollBehavior = "none"
  }

  dragNewActionStart(event: MouseEvent | TouchEvent, rec: ShortcutReceiver, action: ShortcutAction) {
    event.preventDefault()
    event.stopPropagation()
    if (this.state.isaddbackground) {

      this.addingto!.backgroundConfig = {
        type: "diagram",
        receiver: rec.deviceKey,
        actionName: "",
        uuid: uuid()
      }
      localStorage.setItem("shortcutconfig", JSON.stringify(this.nodes))
      this.state.setpressable()
      return
    }
    this.tempNodes = jsonClone(this.nodes);
    this.tempData = {
      receiver: rec,
      action: action
    }
    this.state.setadding()
  }
  dragNewActionOver() {


    console.log("dragover")
  }

  @HostListener("mouseup")
  drop() {
    if (this.state.isredrag) {
      this.redragDrop()
      return
    }

    if (!this.tempData) {
      return true;
    }
    this.tempCursorPos = undefined;

    console.log("drop")
    this.persistReloadTempNOdes()

    this.state.setpressable()
  }


  persistReloadTempNOdes() {
    if (!this.tempNodes) {
      return
    }
    this.tempNodes.forEach(t => {
      delete t.temp;
    })

    const newJsonData = JSON.stringify(this.tempNodes);

    localStorage.setItem("shortcutconfig", newJsonData)
    this.nodes = JSON.parse(localStorage.getItem("shortcutconfig") ?? "[]")
    this.tempData = undefined
    this.editingConfig = undefined;
    this.logNewState()
  }
  logNewState() {
    logKibana("INFO", {
      message: "newstateconfig",
      data: JSON.stringify(this.nodes)
    })
  }
  updatePosition(event: MouseEvent | TouchEvent, gridElement: HTMLDivElement) {
    if (!this.tempData && !this.editingConfig) {
      return;
    }

    if (!this.tempNodes) {
      return
    }

    const gridStyles = getComputedStyle(gridElement);

    const mouse = new Vector2(event);

    this.tempCursorPos = {
      x: mouse.x,
      y: mouse.y
    }
    const gridRect = new BoundingBox(gridElement);
    const rows = gridStyles.gridTemplateRows.split(" ").filter(r => r !== "0px");
    const columns = gridStyles.gridTemplateColumns.split(" ").filter(r => r !== "0px");

    const actionElements = [...gridElement.children]

    for (let i = 0; i < actionElements.length; i++) {
      const rect = new BoundingBox(actionElements[i] as HTMLElement)
      const node = this.tempNodes[i]

      if (node && rect.includes(mouse)) {
        if (!node.temp) {
          this.tempNodes.splice(i, 0, this.editingConfig ?? this.createConfig())
          if (this.editingConfig) {
            this.editingConfig.temp = true
          }
          for (let j = this.tempNodes.length - 1; j >= 0; j--) {
            if (this.tempNodes[j].temp && j !== i) {
              this.tempNodes.splice(j, 1);
            }
          }
        }
        return
      }
    }

    this.tempNodes.push(this.editingConfig ?? this.createConfig())
    if (this.editingConfig) {
      this.editingConfig.temp = true
    }
    for (let j = this.tempNodes.length - 2; j >= 0; j--) {
      if (this.tempNodes[j].temp) {
        this.tempNodes.splice(j, 1);
      }
    }

  }

  private createConfig(): Configs & { temp?: boolean; } {
    if (!this.tempData) {
      throw new Error("no tempdata")
    }
    return {
      actionName: this.tempData.action.name,
      uuid: uuid(),
      type: this.tempData.action.type ?? "button",
      displayText: this.tempData.action.displayText ?? this.tempData.action.name,
      receiver: this.tempData.receiver.deviceKey,
      temp: true
    } as Configs & { temp?: boolean; };
  }
  redrag(config: Configs, event: MouseEvent | TouchEvent) {
    if (this.state.isedit) {
      if (this.configModeStart > (Date.now() - (1000))) {
        return
      }
      this.editingStart = Date.now();
      this.editingConfig = config
      this.tempNodes = jsonClone(this.nodes).filter(c => !jsonEquals(c, this.editingConfig));
      this.state.setredrag()
      event.preventDefault()
      event.stopPropagation()
    }
  }

  redragDrop() {
    if (!this.state.isredrag) {
      return
    }
    if (this.editingStart > (Date.now() - (1000))) {
      return
    }
    this.persistReloadTempNOdes()
    this.state.setpressable()
  }
  removeCfg(config: Configs, evt) {
    this.tempNodes = undefined
    this.nodes = this.nodes.filter(t => !jsonEquals(t, config));
    localStorage.setItem("shortcutconfig", JSON.stringify(this.nodes))

    this.state.setpressable()
    this.logNewState()
  }
}



