import * as admin from 'firebase-admin';

class FireBAseMessaging {
  private app: admin.app.App;

  constructor() {
    this.app = admin.initializeApp();

  }

  async sendNotification(token: string, payload: FireBaseMessagingPayload) {
    return this.app.messaging()
      .send({
        token: token,
        data: {
          data: JSON.stringify(payload)
        }
        /* notification: {
           body: payload.notification?.body,
           title: payload.notification?.title,
           imageUrl: payload.notification?.icon,
 
         }*/
      });
  }

}

export interface FireBaseMessagingPayload {
  notification?: admin.messaging.NotificationMessagePayload

  type?: string
  id?: string
}



export const firebasemessageing = new FireBAseMessaging();