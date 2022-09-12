import type { OnInit } from '@angular/core';
import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import type { Observable } from 'rxjs';
import { of } from 'rxjs';
import { map } from 'rxjs/operators';
import { SettingsService } from '../../../settings.service';
import type { SenderFe } from '../../interfaces';

@Component({
  templateUrl: './timers.component.html',
  styleUrls: ['./timers.component.less']
})
export class MobileTimersComponent implements OnInit {

  public sender$: Observable<SenderFe>

  constructor(private activeRoute: ActivatedRoute, private dataHolder: SettingsService, private router: Router) {
    const sender = this.router.getCurrentNavigation().extras?.state?.sender;
    if (!this.sender$) {
      this.sender$ = dataHolder.senders$.pipe(
        map(senders => senders.find(sender => sender.id === +this.activeRoute.snapshot.params.id)),
      )
    } else {
      this.sender$ = of(sender)
    }
  }

  ngOnInit() {
  }

}
