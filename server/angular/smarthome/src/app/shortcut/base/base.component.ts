import type { OnInit } from '@angular/core';
import { Component } from '@angular/core';




@Component({
  templateUrl: './base.component.html',
  styleUrls: ['./base.component.css']
})
export abstract class BaseComponent implements OnInit {



  constructor() {}

  ngOnInit() {
  }

}
