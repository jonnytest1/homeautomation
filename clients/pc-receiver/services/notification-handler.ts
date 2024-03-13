import { Websocket } from 'express-hibernate-wrapper';
import { existsSync, promises } from 'fs';

import { fetchHttps } from '../util/request';
import { RepeatingAudio } from './repeating-audio-player';
import { FrontendSound } from './server-interfaces';
import notifier from 'node-notifier'


export interface NotificationData {
  notification: {
    sound: string,
    volume?: string | number
    title: string
    body?: string
  }
}

export class NotificationHandler {

  data: NotificationData;

  constructor(data: NotificationData, private serverIp) {
    this.data = data;

  }

  async show(ws: Websocket) {
    console.log(new Date().toLocaleString(), this.data.notification.title)
    let audioHandler: RepeatingAudio | undefined = undefined;
    if (this.data.notification.sound && typeof this.data.notification.sound === 'string') {
      if (this.data.notification.sound.match(/[^a-zA-Z0-9]/g)) {
        console.error("invalid sound string");
        return;
      }

      if (!existsSync(RepeatingAudio.prefixPath + this.data.notification.sound)) {
        const soundRequestUrl = new URL(`${this.serverIp}rest/auto/sound/bykey/${encodeURIComponent(this.data.notification.sound)}`);
        const response = await fetchHttps<Array<FrontendSound>>(soundRequestUrl.href)
        if (response.status != 200) {
          ws.send("failure getting sound");
          return;
        }
        const responseBlob = (await response.json())[0];
        if (responseBlob.bytes) {
          const charCodeArray: Array<number> = responseBlob.bytes.split(",")
            .map(c => +c)
          await promises.writeFile(RepeatingAudio.prefixPath + this.data.notification.sound, Uint8Array.from(charCodeArray))
        }
      }
      audioHandler = new RepeatingAudio(this.data.notification.sound, this.data.notification.volume)

    }

    /**
     * actinos dont work with appID
     */
    const actions = ['do1', 'do2'];

    if (!this.data.notification.body && this.data.notification.title) {
      this.data.notification.body = this.data.notification.title;
    }
    const timeout = 20
    notifier.notify({
      timeout: timeout,
      // appID: "smarthome",
      //
      //actions: actions,
      ...this.data.notification,
      message: this.data.notification.body,
      wait: true,
    }, (async (error, response: 'dismissed' | 'timeout' | (typeof actions[0]), metadata) => {
      console.log(`closing notification with ${response} timeout was ` + timeout);
      if (error) {
        console.error(error);
      } else {
        try {
          ws.send(response);
          ws.close();
        } catch (e) {
          console.error(e);
        }
      }
      if (response === "dismissed") {
        await new Promise(res => setTimeout(res, 2000))
      }
      audioHandler?.stop()
    }).bind(this));
  }
}

/**
 *
 * @see https://www.npmjs.com/package/node-notifier
 * {
    title: undefined,
    subtitle: undefined,
    message: undefined,
    sound: false, // Case Sensitive string for location of sound file, or use one of macOS' native sounds (see below)
    icon: 'Terminal Icon', // Absolute Path to Triggering Icon
    contentImage: undefined, // Absolute Path to Attached Image (Content Image)
    open: undefined, // URL to open on Click
    wait: false, // Wait for User Action against Notification or times out. Same as timeout = 5 seconds

    // New in latest version. See `example/macInput.js` for usage
    timeout: 5, // Takes precedence over wait if both are defined.
    closeLabel: undefined, // String. Label for cancel button
    actions: undefined, // String | Array<String>. Action label or list of labels in case of dropdown
    dropdownLabel: undefined, // String. Label to be used if multiple actions
    reply: false // Boolean. If notification should take input. Value passed as third argument in callback and event emitter.
  }
*/