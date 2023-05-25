import type { OnInit } from '@angular/core';
import { HostListener } from '@angular/core';
import { Component } from '@angular/core';
import { ButtonComponent } from './button/button.component';
import { CommonModule } from '@angular/common';
import type { Configs } from './shortcut-config';
import { ProgressComponent } from './progress/progress.component';
import { SettingsService } from '../settings.service';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { MatButtonModule } from '@angular/material/button';
import { map } from 'rxjs/operators';
import { jsonClone } from '../utils/clone';
import type { ReceiverFe } from '../settings/interfaces';
import { BoundingBox } from '../wiring/util/bounding-box';
import { Vector2 } from '../wiring/util/vector';

@Component({
  selector: 'app-shortcut',
  templateUrl: './shortcut.component.html',
  styleUrls: ['./shortcut.component.less'],
  imports: [ButtonComponent, CommonModule, ProgressComponent, MatButtonModule],
  standalone: true
})
export class ShortcutComponent implements OnInit {

  showActions = false;
  tempNodes: Array<Configs & { temp?: boolean }> | undefined = undefined;
  tempData: {
    receiver: ReceiverFe,
    action: ReceiverFe["actions"][number]
  }
  tempCursorPos: {
    x: number
    y: number
  }

  editingConfig: Configs;
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
  receivers$ = this.settingsService.receivers$.pipe(
    map(rec => Object.values(rec))
  )

  getNodes() {
    const nodes = localStorage.getItem("shortcutconfig");
    if (!nodes || nodes == "undefined") {
      return undefined
    }
    return JSON.parse(nodes)
  }


  constructor(private settingsService: SettingsService, private bottomSheet: MatBottomSheet) {}

  ngOnInit() {
  }

  baseAction(config: Configs) {
    if ("actionName" in config) {
      if (config.confirm) {
        config.confirm = false;
        this.settingsService.confirmAction(config.receiver, config.actionName)
          .subscribe();
      } else {
        this.settingsService.triggerAction(config.receiver, config.actionName)
          .subscribe(resp => {
            if (resp == "pending_confirmation") {
              config.confirm = true;
            }
          });
      }

    }
  }
  configPressed(config: Configs, event) {
    window.oncontextmenu = function () {
      window.oncontextmenu = undefined;
      return false;
    }
    console.log(config);
    event.srcEvent.preventDefault();
    event.srcEvent.stopPropagation();
    this.editingConfig = config;
  }
  configSwipe() {
    this.showActions = true;
  }

  dragNewActionStart(event, rec, action) {
    this.tempNodes = jsonClone(this.nodes);

    this.tempData = {
      receiver: rec,
      action: action
    }
  }
  dragNewActionOver() {


    console.log("dragover")
  }

  @HostListener("mouseup")
  drop() {
    if (!this.tempData) {
      return true;
    }
    this.tempCursorPos = undefined;

    console.log("drop")
    this.tempNodes.forEach(t => {
      delete t.temp;
    })
    localStorage.setItem("shortcutconfig", JSON.stringify(this.tempNodes))
    this.tempData = undefined
    this.nodes = JSON.parse(localStorage.getItem("shortcutconfig"))
    this.editingConfig = undefined;
  }

  updatePosition(event: MouseEvent, gridElement: HTMLDivElement) {
    if (!this.tempData) {
      return;
    }
    this.tempCursorPos = {
      x: event.x,
      y: event.y
    }

    const gridStyles = getComputedStyle(gridElement);

    const mouse = new Vector2(event);

    const gridRect = new BoundingBox(gridElement);
    const rows = gridStyles.gridTemplateRows.split(" ").filter(r => r !== "0px");
    const columns = gridStyles.gridTemplateColumns.split(" ").filter(r => r !== "0px");

    const actionElements = [...gridElement.children]

    for (let i = 0; i < actionElements.length; i++) {
      const rect = new BoundingBox(actionElements[i] as HTMLElement)
      const node = this.tempNodes[i]

      if (node && rect.includes(mouse)) {
        if (!node.temp) {
          this.tempNodes.splice(i, 0, this.createConfig())
          for (let j = this.tempNodes.length - 1; j >= 0; j--) {
            if (this.tempNodes[j].temp && j !== i) {
              this.tempNodes.splice(j, 1);
            }
          }
        }
        return
      }
    }

    this.tempNodes.push(this.createConfig())
    for (let j = this.tempNodes.length - 2; j >= 0; j--) {
      if (this.tempNodes[j].temp) {
        this.tempNodes.splice(j, 1);
      }
    }

  }

  private createConfig(): Configs & { temp?: boolean; } {
    return {
      actionName: this.tempData.action.name,
      type: "button",
      displayText: this.tempData.action.name,
      receiver: this.tempData.receiver.deviceKey,
      temp: true
    };
  }

  removeCfg(config: Configs) {
    this.nodes = this.nodes.filter(t => t !== config);
    localStorage.setItem("shortcutconfig", JSON.stringify(this.nodes))
  }
}
