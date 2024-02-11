import { environment } from '../environment';
import { pick } from '../util/pick';
import { NotificationHandler } from './notification-handler';

describe("n", () => {


  it("notify", async () => {
    await new NotificationHandler({
      notification: {
        title: `EVENT`,
        body: "est",
        sound: pick(["hintnotification", "wronganswer"])
      }
    }, environment.serverip)
      .show({ send: console.log, close: () => { } } as any);
  })
})