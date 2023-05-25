import type { OnInit } from '@angular/core';
import { Input } from '@angular/core';
import { Component } from '@angular/core';
import { NgCircleProgressModule } from 'ng-circle-progress';
import { ProgressConfig } from '../shortcut-config';

@Component({
  selector: 'app-progress',
  templateUrl: './progress.component.html',
  styleUrls: ['./progress.component.less'], standalone: true,
  imports: [NgCircleProgressModule]
})
export class ProgressComponent implements OnInit {

  @Input()
  public config: ProgressConfig

  constructor() {}

  ngOnInit() {
  }

}
