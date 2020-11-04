import { Websocket } from '../../../server/express-ws-type';
import { promises, existsSync } from "fs"
import { fetchHttps } from '../util/request';
const notifier = require('node-notifier');
var player = require('play-sound')({
    player: 'C:\\Program Files\\VideoLAN\\VLC\\vlc.exe',

});
export class NotificationHandler {

    audio;
    data: any;

    readonly prefixPath = 'D:\\Jonathan\\Projects\\node\\homeautomation\\clients\\pc-receiver\\services\\sounds\\';

    constructor(data, private serverIp) {
        this.data = data;

    }

    async show(ws: Websocket) {
        console.log(new Date(), this.data.notification.title)
        if (this.data.notification.sound && typeof this.data.notification.sound === 'string') {
            if (!existsSync(this.prefixPath + this.data.notification.sound)) {
                const response = await fetchHttps(`${this.serverIp}rest/auto/sound/bykey/${this.data.notification.sound}`)
                if (response.status != 200) {
                    ws.send("failure getting sound");
                    return;
                }
                const responseBlob = (await response.json())[0];
                const charCodeArray: Array<number> = responseBlob.bytes.split(",")
                    .map(c => +c)
                await promises.writeFile(this.prefixPath + this.data.notification.sound, Uint8Array.from(charCodeArray))
            }


            const args = ['--intf', 'dummy', '--no-loop', '--play-and-exit'];
            if (this.data.notification.volume) {
                args.push(`--mmdevice-volume=0.1`);
                args.push(`--directx-volume=0.1`);
                args.push(`--waveout-volume=0.1`);
                args.push(`--volume=10`);
            }

            this.audio = player.play(this.prefixPath + this.data.notification.sound, {
                'C:\\Program Files\\VideoLAN\\VLC\\vlc.exe': args
            }, (err) => {
                if (err) {
                    console.error(err);
                }
            });
            this.data.notification.sound = false;
        }

        const actions = ['do1', 'do2'];
        notifier.notify({
            timeout: 3,
            //
            actions: actions,
            ...this.data.notification
        }, (error, response: 'dismissed' | 'timeout' | (typeof actions[0]), metadata) => {
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
            this.audio.kill();
        });
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