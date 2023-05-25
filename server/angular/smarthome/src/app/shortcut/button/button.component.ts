import { EventEmitter } from '@angular/core';
import type { OnChanges } from '@angular/core';
import { Output } from '@angular/core';
import { Input } from '@angular/core';
import { Component } from '@angular/core';
import { BaseComponent } from '../base/base.component';
import { ButtonConfig } from '../shortcut-config';
import type { ReceiverFe } from '../../settings/interfaces';
import { SettingsService } from '../../settings.service';
import { map } from 'rxjs/operators';
import type { Observable } from 'rxjs';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-button',
  templateUrl: './button.component.html',
  styleUrls: ['./button.component.less'],
  imports: [CommonModule],
  standalone: true
})
export class ButtonComponent extends BaseComponent implements OnChanges {

  @Input()
  public config: ButtonConfig


  receiver$: Observable<ReceiverFe>

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
    this.receiver$ = this.settings.receivers$.pipe(map(receviers => receviers[this.config.receiver]))
  }

}
