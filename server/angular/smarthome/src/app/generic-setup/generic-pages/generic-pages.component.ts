import { Component, inject, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { selectNodeDefs } from '../store/selectors';
import { AsyncPipe, CommonModule, KeyValuePipe } from '@angular/common';
import { GenericTypeComponent } from '../generic-type/generic-type.component';
import { ActivatedRoute, Router, RouterOutlet } from '@angular/router';
import { first, map, switchMap } from 'rxjs/operators';
import { FormsModule } from '@angular/forms';
import { EMPTY } from 'rxjs';

@Component({
  selector: 'app-generic-pages',
  templateUrl: './generic-pages.component.html',
  styleUrls: ['./generic-pages.component.scss'],
  standalone: true,
  imports: [AsyncPipe, KeyValuePipe, RouterOutlet, FormsModule]
})
export class GenericPagesComponent {

  private store = inject(Store)
  private router = inject(Router)
  active = inject(ActivatedRoute)

  choice$ = this.active.url.pipe(switchMap(() => {
    return this.active.firstChild?.paramMap?.pipe(map(p => p.get('type'))) ?? EMPTY
  }))

  nodeDefs = this.store.select(selectNodeDefs)

  constructor() {
    if (!this.active.firstChild) {
      this.nodeDefs.pipe(first()).subscribe(defs => {
        const nodeDef = Object.values(defs).find(v => !!v.page)
        if (nodeDef) {
          this.navigate(nodeDef?.type)
        }

      })
    }
  }



  navigate(target: string) {

    this.router.navigate(['./' + target], { relativeTo: this.active })
  }

}
