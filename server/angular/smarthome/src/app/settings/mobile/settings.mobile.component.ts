import { SettingsService } from '../../settings.service';
import type { OnInit } from '@angular/core';
import { ChangeDetectorRef, Component } from '@angular/core';
import { filter, first } from 'rxjs/operators';
import { ActivatedRoute, Router } from '@angular/router';
import { AppComponent } from '../../app.component';


@Component({
  selector: 'app-settings',
  templateUrl: './settings.mobile.component.html',
  styleUrls: ['./settings.mobile.component.less']
})
export class SettingsMobileComponent implements OnInit {

  readonly tabs = [{
    title: 'Senders',
    items: []
  }, {
    title: 'Receivers',
    items: []
  }];

  currentIndex = 0;
  interval: NodeJS.Timeout;

  initialized = false

  constructor(private service: SettingsService, private cdr: ChangeDetectorRef,
    private router: Router,
    private activeRoute: ActivatedRoute,) {
    this.fetchData()
  }
  ngOnInit(): void {
    this.initialized = true
    AppComponent.isMobile()
      .pipe(filter(m => !m), first())
      .subscribe(() => {
        this.router.navigate(["/setup"])
      })
  }

  getRouterLink(index, id) {
    return `${this.tabs[index].title.toLowerCase()}/${id}`;
  }

  private fetchData() {

    this.service.senders$
      .subscribe(senders => {
        this.tabs[0].items = senders;
        if (this.initialized) {
          this.cdr.detectChanges();
        }
      })
    this.service.getReceivers()
      .subscribe(receivers => {
        this.tabs[1].items = receivers;
        if (this.initialized) {
          this.cdr.detectChanges();
        }
      })
  }

  left() {
    this.currentIndex--;
    this.currentIndex < 0 && (this.currentIndex = this.tabs.length - 1);
  }

  right() {
    this.currentIndex++;
    this.currentIndex > this.tabs.length - 1 && (this.currentIndex = 0);
  }

  setActive(item, $event) {

  }
}
