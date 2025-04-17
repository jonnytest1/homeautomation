import type { ConnectionFe, EventHistoryFe, FrontendToBackendEvents, GenericNodeEvents, ItemFe, NodeData, NodeDefintion, NodeEventTimes, ReceiverFe, ResponseData, SenderFe, SocketResponses, TimerFe, TransformFe } from './settings/interfaces';
import { environment } from '../environments/environment';
import { AbstractHttpService } from './utils/http-service';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import type { Observable } from 'rxjs';
import { BehaviorSubject, ReplaySubject, Subject } from 'rxjs';
import { map, switchMap, tap } from 'rxjs/operators';
import { v4 as uuid } from 'uuid';
import { ResolvablePromise } from './utils/resolvable-promise';
import { getDeviceData, logKibana } from './global-error-handler';


let ws: WebSocket;
let service: SettingsService;


const socketinstanceUuid = uuid()

let connectTimoeut = 10
let pendingEvents: Array<FrontendToBackendEvents> = []
function openWebsocket() {
  try {
    ws = new WebSocket(getRelativeWebsocketUrl());
    ws.onclose = () => {
      connectTimoeut += 100
      connectTimoeut *= 1.4
      connectTimoeut = Math.min(connectTimoeut, 30000)
      setTimeout(() => {
        openWebsocket()
      }, connectTimoeut);
    };
    ws.onmessage = (e) => {
      service?.onMessage(e);
    };
    ws.addEventListener("open", () => {
      connectTimoeut = 0
      Object.values(service.onSocketOpen ?? {}).forEach(cb => {
        cb(ws);
      })
    })
  } catch (e) {
    connectTimoeut += 100
    connectTimoeut *= 1.4
    connectTimoeut = Math.min(connectTimoeut, 30000)
    setTimeout(() => {
      openWebsocket()
    }, connectTimoeut)
  }


}

async function sendSocketEvent(evt: FrontendToBackendEvents) {
  pendingEvents.push(evt);
  while (ws.readyState !== ws.OPEN) {
    await ResolvablePromise.delayed(5)
  }
  pendingEvents = pendingEvents.filter(e => e !== evt)
  ws.send(JSON.stringify(evt))
}


function getRelativeWebsocketUrl() {
  const baseUri = new URL(environment.prefixPath || document.baseURI);
  baseUri.protocol = `ws${!environment.insecureWebsocket ? 's' : ''}://`;
  baseUri.pathname += 'rest/updates';
  baseUri.searchParams.set("instance", socketinstanceUuid)
  return baseUri.href;
}

@Injectable({ providedIn: 'root' })
export class SettingsService extends AbstractHttpService {
  private readonly timers: BehaviorSubject<Array<TimerFe>> = new BehaviorSubject([]);

  public timers$ = this.timers.asObservable();

  private readonly _receivers$ = new BehaviorSubject<Record<string, ReceiverFe>>({});
  readonly receivers$ = this._receivers$.asObservable();
  private readonly _senders$ = new BehaviorSubject<Array<SenderFe>>([]);
  readonly senders$ = this._senders$.asObservable();

  private readonly inventory = new BehaviorSubject<Array<ItemFe>>([]);

  public inventory$ = this.inventory.asObservable()

  public genericNodeEvents = new Subject<GenericNodeEvents>()
  public genericNodeSendingEvents = new Subject<FrontendToBackendEvents>()
  private websocket: WebSocket;
  onSocketOpen: Record<string, (websocket: WebSocket) => void> = {};

  constructor(http: HttpClient, router: Router) {
    super(http, router);


    this.onSocketOpen.initialize = s => {
      sendSocketEvent({
        type: "device-data",
        data: getDeviceData()
      })
      logKibana("INFO", "socket init")
    }
    openWebsocket();
    const pingEvent = {
      type: "ping"
    } as const;
    setInterval(() => {

      if (!pendingEvents.includes(pingEvent))
        sendSocketEvent(pingEvent)
    }, 20000)

    service = this;

    this.getSenders().toPromise().then(senders => {
      this.updateSenders(senders);
    });

    this.genericNodeSendingEvents.subscribe(ev => {
      sendSocketEvent(ev)
    })
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
    } else if (this.isType(messageEvent, 'inventoryUpdate')) {
      this.inventory.next(messageEvent.data)
    } else if (this.isType(messageEvent, 'receiverUpdate')) {
      this.updateReceiver(messageEvent.data);
    } else if (this.isType(messageEvent, 'genericNode')) {
      this.genericNodeEvents.next(messageEvent.data)
    } else if (this.isType(messageEvent, 'reload')) {
      location.reload()
    }
  }


  private updateReceiver(receiver: ReceiverFe) {
    const currentReceivers = { ...this._receivers$.value };
    currentReceivers[receiver.deviceKey] = receiver;
    this._receivers$.next(currentReceivers)


  }

  updateSenders(data: SenderFe[]) {
    if (!data) {
      return
    }
    const currentSenders = [...this._senders$.value];
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


    this._senders$.next(currentSenders);
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

  registerReceiver(rec: Omit<ReceiverFe, "events" | "actions" | "id">) {

    return this.post<SenderFe>(`${environment.prefixPath}rest/receiver`, {
      ...rec
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
  triggerAction(deviceKey: string, actionName: string) {
    return this.postForString(`${environment.prefixPath}rest/receiver/${deviceKey}/action/${encodeURIComponent(actionName)}/trigger`, {});
  }
  confirmAction(deviceKey: string, actionName: string) {
    return this.postForString(`${environment.prefixPath}rest/receiver/${deviceKey}/action/${actionName}/confirm`, {});
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


    return this.get<Array<ReceiverFe>>(environment.prefixPath + 'rest/receiver')
      .pipe(
        tap(receivers => {
          receivers.forEach(rec => {
            this.updateReceiver(rec);
          }),
            switchMap(() => this._receivers$
              .pipe(
                map(receivers => Object.values(receivers) as Array<ReceiverFe>)))
        }))
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
