import { Component, Input, OnInit } from '@angular/core';
import { ShortcutReceiver } from '../shortcut-types';

@Component({
  selector: 'app-action-template',
  templateUrl: './action-template.component.html',
  styleUrls: ['./action-template.component.scss'],
  standalone: true
})
export class ActionTemplateComponent implements OnInit {

  @Input()
  action: ShortcutReceiver["actions"][number]

  @Input()
  receiver: ShortcutReceiver


  constructor() {}

  ngOnInit() {
  }

}
