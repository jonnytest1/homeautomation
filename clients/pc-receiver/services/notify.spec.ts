import { environment } from '../environment';
import { pick } from '../util/pick';
import { NotificationHandler } from './notification-handler';

describe("n", () => {


  it("notify", async () => {
    debugger
    await new NotificationHandler({
      notification: {
        title: `EVENT`,
        body: "est",
        sound: pick(["red-alert_nuclear_buzzer-99741"])
      }
    }, environment.serverip)
      .show({ send: console.log, close: () => { } } as any);

    debugger
  })
})