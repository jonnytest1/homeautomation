import * as admin from 'firebase-admin';

class FireBAseMessaging {
  private app: admin.app.App;

  constructor() {
    this.app = admin.initializeApp();

  }

  async sendTestNotification(token) {
    //const token = '';
    return this.app.messaging()
      .send({
        token: token,
        data: {
          message: 'test'
        },
        notification: {
          body: 'test',
        },
      });
  }
  async sendNotification(token, payload: FireBaseMessagingPayload) {
    return this.app.messaging()
      .send({
        token: token,
        data: {
          data: JSON.stringify(payload)
        },
        notification: payload.notification
      });
  }

}

export interface FireBaseMessagingPayload {
  notification?: admin.messaging.NotificationMessagePayload

  type?: string
  id?: string
}



export const firebasemessageing = new FireBAseMessaging();