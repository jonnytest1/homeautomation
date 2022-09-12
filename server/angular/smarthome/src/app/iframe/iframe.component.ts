import type { OnInit } from '@angular/core';
import { Component } from '@angular/core';
import type { SafeUrl } from '@angular/platform-browser';
import { DomSanitizer } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import type { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-iframe',
  templateUrl: './iframe.component.html',
  styleUrls: ['./iframe.component.less']
})
export class IframeComponent implements OnInit {

  url$: Observable<SafeUrl>

  constructor(route: ActivatedRoute, domSanitizer: DomSanitizer) {
    this.url$ = route.data
      .pipe(map(data => domSanitizer.bypassSecurityTrustResourceUrl(data.src)))
  }

  ngOnInit() {
  }

}
