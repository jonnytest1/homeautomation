import type { SenderFe, TransformFe } from '../../interfaces';
import { SettingsService } from '../../../settings.service';
import type { OnInit } from '@angular/core';
import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import type { Observable } from 'rxjs';
import { filter, map, first, tap } from 'rxjs/operators';
import { AppComponent } from '../../../app.component';

@Component({
  selector: 'app-mobile-sender',
  templateUrl: './mobile-sender.component.html',
  styleUrls: ['./mobile-sender.component.less']
})
export class MobileSenderComponent implements OnInit {


  sender$: Observable<SenderFe>;


  transformer: TransformFe = {};

  currentTab = this.activeRoute.snapshot.queryParams.tabIndex ?? 0;
  constructor(private activeRoute: ActivatedRoute, private dataHolder: SettingsService, private router: Router,) {

    this.sender$ = dataHolder.senders$.pipe(
      map(senders => senders.find(sender => sender.id === +this.activeRoute.snapshot.params.id)),
      tap(sender => {
        this.transformer = sender?.transformation?.[0]
      })
    );
  }

  ngOnInit() {
    AppComponent.isMobile()
      .pipe(
        filter(m => !m),
        first())
      .subscribe(() => {
        this.router.navigate(["/setup"])
      })
  }

  indexChange(event: number) {
    this.currentTab = event;
    this.router.navigate([], {
      queryParams: {
        tabIndex: this.currentTab,
      },
      queryParamsHandling: "merge"
    })
  }

  async triggerTransformer(sender: SenderFe) {
    const dataObj: { [key: string]: unknown } = {
      deviceKey: sender.deviceKey
    };
    // if (!this.isManual()) {
    // dataObj.testsend = true
    //}
    if (sender.transformationAttribute && this.transformer) {
      dataObj[sender.transformationAttribute] = this.transformer.transformationKey;
    }

    await this.dataHolder.send(dataObj).toPromise();
    if (this.transformer && this.transformer.tsTransformation?.includes('delay')
      && this.transformer.tsTransformation.includes('promise')) {
      this.displayTimers(sender)
    }
  }
  displayTimers(sender: SenderFe) {
    this.router.navigate(["timers"], { relativeTo: this.activeRoute, state: { sender: sender } })
  }
}
