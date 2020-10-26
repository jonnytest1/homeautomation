
import * as admin from 'firebase-admin';

class FireBAseMessaging {
    private app: admin.app.App;

    constructor() {
        this.app = admin.initializeApp();

    }

    async sendTestNotification(token) {

        //const token = '';
        return this.app.messaging()
            .sendToDevice(token, {
                data: {
                    message: 'est'
                },
                notification: {
                    body: 'test'
                }
            });
    }
    async sendNotification(token, payload: admin.messaging.NotificationMessagePayload) {
        return this.app.messaging()
            .sendToDevice(token, {
                notification: payload
            });
    }

}

export const firebasemessageing = new FireBAseMessaging();