import { EventEmitter } from '@angular/core';
import type { OnChanges } from '@angular/core';
import { Output } from '@angular/core';
import { Input } from '@angular/core';
import { Component } from '@angular/core';
import { BaseComponent } from '../base/base.component';
import { ButtonConfig } from '../shortcut-config';
import type { ReceiverFe } from '../../settings/interfaces';
import { SettingsService } from '../../settings.service';
import { filter, map } from 'rxjs/operators';
import { of, type Observable } from 'rxjs';
import { CommonModule } from '@angular/common';
import { DiagramComponent } from '../diagram/diagram.component';

@Component({
  selector: 'app-button',
  templateUrl: './button.component.html',
  styleUrls: ['./button.component.less'],
  imports: [CommonModule, DiagramComponent],
  standalone: true
})
export class ButtonComponent extends BaseComponent implements OnChanges {

  @Input()
  public config: ButtonConfig


  receiver$: Observable<{ receiver: ReceiverFe, iconStr: string }>

  @Output()
  actionTrigger = new EventEmitter()

  constructor(private settings: SettingsService) {
    super();
  }

  buttonClick(btn: HTMLButtonElement) {
    this.actionTrigger.emit();

    btn.classList.add("clicked");

    setTimeout(() => {
      btn.classList.remove("clicked");
    }, 200)
  }


  getBackgroundColor(receiver: ReceiverFe) {

    if (this.config.confirm) {
      return "red";
    }
    return receiver.currentState == 'true' ? 'green' : 'gray'
  }

  ngOnChanges() {
    if (this.config.receiver === "generic-node") {
      this.receiver$ = of({
        receiver: {} as any,
        iconStr: undefined
      })
      return
    }
    this.receiver$ = this.settings.receivers$.pipe(
      filter(rec => !!rec[this.config.receiver]),
      map(receviers => {
        const reciever = receviers[this.config.receiver]
        const action = reciever.actions.find(action => action.name == this.config.actionName)

        return {
          receiver: reciever,
          iconStr: action?.icon ? `data:image/svg+xml;base64,${action.icon}` : undefined
        }
      }))
  }

}
