import type { ReceiverData } from './receiver-data';
import type { EvaluatedData } from './evaluated-data';
import { Action } from './action';
import { ReceiverEvent } from './receiver-event';
import { firebasemessageing, FireBaseMessagingPayload } from '../services/firebasemessaging';
import ws, { WebsocketError } from '../services/websocketmessaging';
import { logKibana } from '../util/log';
import { autosaveable, settable } from 'express-hibernate-wrapper';
import { column, mapping, Mappings, primary, table } from 'hibernatets';
import { randomUUID } from "crypto"
const fetch = require('node-fetch');
@table()
@autosaveable
export class Receiver {

  @column()
  @settable
  deviceKey: string;

  @settable
  @column()
  firebaseToken: string | null;

  @primary()
  id;

  @settable
  @column()
  description: string;

  @settable
  @column()
  name: string;

  @settable
  @column()
  ip: string;

  @settable
  @column()
  currentState: number | boolean | string;
  /**
   * ip is deprecated
   */
  @settable
  @column()
  type: 'ip' | 'firebase' | 'ws' | "http";

  @settable
  @mapping(Mappings.OneToMany, Action, 'receiver')
  actions: Array<Action>


  @settable
  @mapping(Mappings.OneToMany, ReceiverEvent, 'receiver')
  events: Array<ReceiverEvent>

  constructor() {
    //
  }

  async send(data: ReceiverData | false): Promise<number | null> {
    if (!data) {
      return null;
    }
    const evaluatedData = await data.evaluate();

    switch (this.type) {
      case "ws":
        return this.sendForWebsocket(evaluatedData);
      case "firebase":
        return await this.sendForFirebase(evaluatedData);
      case "ip":
      case "http":
        return await this.sendForIp(evaluatedData);
      default:
        return 0;
    }




  }
  sendForIp(evaluatedData: EvaluatedData): number {
    fetch(`http://${this.ip}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(evaluatedData.data)
    }).then(async r => {
      if (r.status >= 399) {
        logKibana("ERROR", {
          message: "error sending request",
          status: r.status,
          body: await r.text()
        })
      }
    }).catch(e => {
      logKibana("ERROR", {
        message: "error in sending request",
        sender: this.name,
        sender_id: this.id,
        sender_type: this.type,
        data: JSON.stringify(evaluatedData.data)
      }, e);
    })
    return 0;
  }


  private sendForWebsocket(evaluatedDataObj: EvaluatedData): number {
    const evaluatedData = evaluatedDataObj.data
    console.log(`notification to ${this.ip} for ${evaluatedData.notification?.title}`)
    const ts = new Date().toISOString()
    ws.sendWebsocket(this.ip, evaluatedData)
      .then(response => {
        if (response === "dismissed") {
          if (evaluatedData.attributes && evaluatedData.attributes.messageId) {

            firebasemessageing.sendNotification(this.firebaseToken, {
              type: "removeNotification",
              id: evaluatedData.attributes.messageId
            });
          }
        }
      }).catch(e => {
        let errorLevel: "ERROR" | "WARN" = "ERROR"
        if (e instanceof WebsocketError && e.type === "connectFailed") {
          errorLevel = "WARN"
        }
        logKibana(errorLevel, {
          message: "failed connecting to websocket", ts,
          evluatedObj: evaluatedDataObj
        }, e)
      })
    return 0;
  }

  private async sendForFirebase(evaluatedDataObj: EvaluatedData): Promise<number> {
    const evaluatedData = evaluatedDataObj.data
    const firebaseData = evaluatedData as FireBaseMessagingPayload

    if (firebaseData.notification && !firebaseData.notification.tag) {
      firebaseData.notification.tag = randomUUID()
    }
    console.log(`sending push notification for ${this.name}`);
    if (this.firebaseToken == null) {
      console.debug("no firebase token")
      return 0
    }
    try {

      const response = await firebasemessageing.sendNotification(this.firebaseToken, firebaseData);
      /*if (!response) {
        logKibana('ERROR', {
          token: this.firebaseToken,
          name: this.name,
          message: 'error sending firebase to receiver',
          reason: JSON.stringify(response.results)
        });
      }*/

      //if (response.results[0]) {
      /* if (response.results[0].canonicalRegistrationToken) {
         logKibana("ERROR", {
           message: "this time there was a token in the response",
           token: response.results[0].canonicalRegistrationToken
         });
       }*/
      if (response) {
        evaluatedData.attributes = { ...evaluatedData.attributes, messageId: response };
      }
      //}
      return response ? 0 : 1;


    } catch (e) {
      if (e.code == 'messaging/registration-token-not-registered') {
        this.firebaseToken = null
        return 0
      }
      throw e;
    }
  }
}