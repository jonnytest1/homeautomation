import type { OnDestroy, OnInit } from '@angular/core';
import { Component } from '@angular/core';
import { ReconnectingWebsocket } from '../utils/reconnecting-socket';
import { environment } from '../../environments/environment';
import { filter, map } from 'rxjs/operators';
import type { Observable, OperatorFunction } from 'rxjs';
import { Subject } from 'rxjs';


export function delayAtLeast<T>(delay: number): OperatorFunction<T, T> {
  const timedSubject: Subject<T> = new Subject()
  const quqeue = []

  return function (source$: Observable<T>): Observable<T> {
    source$.subscribe(value => {
      quqeue.push(value)
    })
    setInterval(() => {
      if (quqeue.length) {
        timedSubject.next(quqeue.shift())
      }
    }, delay)

    return timedSubject

    //return combineLatest([timer(delay), source$]).pipe(map(x => x[1]));
  }
}

@Component({
  selector: 'app-inputs',
  templateUrl: './inputs.component.html',
  styleUrls: ['./inputs.component.css']
})
export class InputsComponent implements OnInit, OnDestroy {

  keySocket = new ReconnectingWebsocket(environment.keySocket)

  keyMessages$ = this.keySocket.messages$.pipe(
    map(e => JSON.parse(e) as { data: Record<string, Array<string>>, type: "keys" }),
    filter(ev => !!ev.data && ev.type == "keys"),
    map(ev => ev.data),
    delayAtLeast(100)
  )

  constructor() {


  }


  ngOnInit() {
    //
  }

  ngOnDestroy(): void {
    this.keySocket.close()
  }

}
