import { ConnectionFe, EventHistoryFe, ItemFe, ReceiverFe, ResponseData, SenderFe, SocketResponses, TimerFe, TransformFe } from './settings/interfaces';
import { environment } from '../environments/environment';
import { AbstractHttpService } from './utils/http-service';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { v4 as uuid } from 'uuid';


let ws: WebSocket;
let service: SettingsService;

function openWebsocket() {
  ws = new WebSocket(getRelativeWebsocketUrl());
  ws.onclose = () => {
    openWebsocket();
  };
  ws.onmessage = (e) => {
    service?.onMessage(e);
  };
}


function getRelativeWebsocketUrl() {
  const baseUri = new URL(environment.prefixPath || document.baseURI);
  baseUri.protocol = `ws${!environment.insecureWebsocket ? 's' : ''}://`;
  baseUri.pathname += 'rest/updates';
  return baseUri.href;
}

@Injectable({ providedIn: 'root' })
export class SettingsService extends AbstractHttpService {

  private readonly timers: BehaviorSubject<Array<TimerFe>> = new BehaviorSubject([]);

  public timers$ = this.timers.asObservable();


  readonly senders$ = new BehaviorSubject<Array<SenderFe>>([]);

  private readonly inventory = new BehaviorSubject<Array<ItemFe>>([]);

  public inventory$ = this.inventory
  private websocket: WebSocket;

  constructor(http: HttpClient, router: Router) {
    super(http, router);
    openWebsocket();
    service = this;

    this.getSenders().toPromise().then(senders => {
      this.updateSenders(senders);
    });
  }

  private isType<K extends keyof SocketResponses>(obj: ResponseData, key: K): obj is ResponseData<K> {
    return obj.type === key;
  }

  public onMessage(message: MessageEvent<string>) {
    const messageEvent: ResponseData = JSON.parse(message.data);
    if (this.isType(messageEvent, 'timerUpdate')) {
      this.timers.next(messageEvent.data);
    } else if (messageEvent.type === 'senderUpdate') {
      this.updateSenders(messageEvent.data as SenderFe[]);
    } else if (messageEvent.type == "inventoryUpdate") {
      this.inventory.next(messageEvent.data)
    }
  }
  updateSenders(data: SenderFe[]) {
    if (!data) {
      return
    }
    const currentSenders = [...this.senders$.value];
    data.forEach(sender => {
      let currentSender = currentSenders.find(cSender => cSender.id === sender.id);
      if (currentSender) {
        currentSender.batteryEntries = sender.batteryEntries;
        currentSender.events = sender.events;
        delete sender.events;
        delete sender.batteryEntries;
        Object.apply(currentSender, sender);
      } else {
        currentSender = sender;
        currentSenders.push(sender);
      }
      this.sort(currentSender.transformation, currentSender.events);
    });


    this.senders$.next(currentSenders);
  }

  sort(array: Array<TransformFe>, events: SenderFe['events']): Array<TransformFe> {
    array.sort((tr1, tr2) => {
      return this.getHistoryCount(tr2, events) - this.getHistoryCount(tr1, events);
    });
    return array;
  }

  getHistoryCount(transformer: TransformFe, events: SenderFe['events']) {
    transformer.historyCount = events?.filter((event: EventHistoryFe) => {
      if (!event.parsedData) {
        event.parsedData = JSON.parse(event.data);
      }
      return event.parsedData.message === transformer.transformationKey;
    }).length;
    return transformer.historyCount;
  }


  addConnection(deviceKey: string, receiverId: number) {
    return this.post<ConnectionFe>(`${environment.prefixPath}rest/connection`, {
      senderId: deviceKey,
      receiverId: receiverId
    });

  }

  addSender() {
    return this.post<SenderFe>(`${environment.prefixPath}rest/sender`, {
      type: 'manual',
      deviceKey: uuid()
    });
  }


  deleteSender(id: number) {
    return this.delete<SenderFe>(`${environment.prefixPath}rest/auto/sender?itemRef=${id}`);
  }

  createTransformer(el: TransformFe, senderId) {
    return this.post<TransformFe>(`${environment.prefixPath}rest/sender/${senderId}/transformation`, el);
  }

  getMissingSenderKeys(senderId: number) {
    return this.get<Array<string>>(`${environment.prefixPath}rest/transformation/keys/${senderId}`);
  }


  getSenders() {
    return this.get<Array<SenderFe>>(environment.prefixPath + 'rest/sender').pipe(
      map(senders =>
        senders.sort((s1, s2) => s1.id > s2.id ? 1 : -1)
      ),
      tap(senders => {
        const def = senders
          .filter(s => s.transformation.length)
          .map(s => s.transformation[0].definitionFile)[0];

        senders.forEach(s => {
          s.connections.
            filter(con => con.transformation)
            .forEach(c => {
              c.transformation.definitionFile = def;
            });
        });
      })
    );
  }

  getReceivers() {
    return this.get<Array<ReceiverFe>>(environment.prefixPath + 'rest/receiver');
  }
  getTitleKeys(id): Observable<string> {
    return this.get<Array<string>>(`${environment.prefixPath}rest/connection/key?itemRef=${id}`).pipe(
      map(keys => `context: ${keys.join(', ')}`)
    );
  }

  getSenderTitleKeys(id: number): Observable<string> {
    return this.get<Array<string>>(`${environment.prefixPath}rest/sender/key?itemRef=${id}`).pipe(
      map(keys => `context: ${keys.join(', ')}`)
    );
  }


  deleteConneciton(id: number) {
    return this.delete(`${environment.prefixPath}rest/connection?itemRef=${id}`);
  }


  send(obj) {
    return this.post<void>(environment.prefixPath + 'rest/sender/trigger', obj);
  }


  getWiringTemplates(): Observable<Array<{ name: string, content: string }>> {
    return this.get(environment.prefixPath + 'rest/wiring')
  }

}
