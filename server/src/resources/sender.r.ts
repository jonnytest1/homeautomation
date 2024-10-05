
import { FrontendWebsocket } from './frontend-update';
import { BatteryLevel } from '../models/battery';
import { EventHistory } from '../models/event';
import { Sender } from '../models/sender';
import { Timer } from '../models/timer';
import { Transformation } from '../models/transformation';
import { logKibana } from '../util/log';
import { senderLoader } from '../services/sender-loader';
import { SenderTriggerService } from '../services/sender-trigger-service';
import { mqttConnection } from '../services/mqtt-api';
import { emitEvent } from '../services/generic-node/generic-node-service';
import { assign, loadOne, ResponseCodeError } from 'express-hibernate-wrapper';
import { MariaDbBase } from 'hibernatets/dbs/mariadb-base';
import { load, queries, save } from 'hibernatets';
import { Path, POST, HttpRequest, HttpResponse, GET } from 'express-hibernate-wrapper';

@Path('sender')
export class SenderResource {

  @POST({
    path: 'trigger'
  })
  async trigger(req: HttpRequest, res: HttpResponse) {
    console.log(`trigger request ${JSON.stringify(req.body)}`);

    emitEvent("sender", {
      payload: req.body,
      context: {
        deviceKey: req.body.deviceKey
      }
    })


    const sender = await loadOne(Sender, s => s.deviceKey = req.body.deviceKey, [], {
      deep: ['connections', 'receiver', "transformer", "transformation"],
      interceptArrayFunctions: true
    });
    try {
      const responses = await new SenderTriggerService(sender).trigger(req.body);
      if (responses.reduce<number>((a, b) => b.error ? b.error + a : a, 0) > 0) {
        res.status(500)
          .send();
      } else {
        let status = 200;
        const statusResponse = responses.find(res => res.status);

        if (statusResponse?.status) {
          status = statusResponse.status;
        }
        res.status(status).send(responses);
      }

    } catch (e) {
      if (e instanceof ResponseCodeError) {
        throw e;
      }
      console.error(e)
      logKibana('ERROR', { message: 'error in trigger', sender: sender.id, data: JSON.stringify(req.body) }, e);
      res.send();
    } finally {
      if (!req.body.testsend) {
        sender.events.push(new EventHistory(req.body));
        if (req.body.a_read1) {
          const batteryLevel = new BatteryLevel(req.body.a_read1, req.body.a_read2, req.body.a_read3);
          if (batteryLevel.level !== -1) {
            sender.batteryEntries.push(batteryLevel);
          }
        }
        queries(sender).then(() => FrontendWebsocket.updateSenders())
      }
    }
  }

  @GET({
    path: "eventkeys"
  })
  async getEventKeys(req: HttpRequest, res) {
    const eventKEys = await new MariaDbBase().selectQuery<{ evkey: string }>(
      `SELECT DISTINCT SUBSTRING_INDEX(SUBSTRING_INDEX(\`data\`,'message":"',-1),'"',1) as evkey
            FROM eventhistory 
            WHERE SENDER = ?`, [req.query.id])
    res.send(eventKEys.map(obj => obj.evkey));
  }

  @GET({
    path: ":senderid/timers"
  })
  async getTimers(req: HttpRequest, res) {
    res.send(await load(Timer, `alerted='false' AND timerClassId=? AND timerClassName='Sender'`, [+req.params.senderid]));
  }

  @POST({ path: '' })
  async register(req, res) {
    if (!req.body.deviceKey) {
      res.status(400)
        .send('missing deviceKey');
      return;
    }
    const existingSender = await load(Sender, s => s.deviceKey = req.body.deviceKey, [], {
      first: true,
      interceptArrayFunctions: true
    });
    if (existingSender) {
      if (req.body.a_read1) {
        const batteryLevel = new BatteryLevel(req.body.a_read1, req.body.a_read2, req.body.a_read3);
        if (batteryLevel.level !== -1) {
          existingSender.batteryEntries.push(batteryLevel);
        }
      }
      logKibana('INFO', `sender already exists with id ${req.body.deviceKey}`);
      res.status(409)
        .send(existingSender);
      return;
    }
    const sender = new Sender();
    sender.transformation.push(new Transformation())
    await assign(sender, req.body);
    await save(sender);
    FrontendWebsocket.updateSenders();
    res.send(sender);
  }


  @GET({
    path: ''
  })
  async getSenders(req, res: HttpResponse) {
    const senders = await senderLoader.loadSenders()

    const mqttSenders = mqttConnection.getDevices()
    res.send(senders);
  }
  @POST({
    path: ':senderid/transformation'
  })
  async addTransformation(req: HttpRequest, res: HttpResponse) {
    const sender = await load(Sender, s => s.id = +req.params.senderid, undefined, {
      first: true,
      interceptArrayFunctions: true
    });
    const transform = new Transformation()
    await assign(transform, req.body);
    sender.transformation.push(transform);
    await queries(sender);
    res.send(transform);
    FrontendWebsocket.updateSenders()
  }

  @GET({
    path: 'key'
  })

  async getKeys(req: HttpRequest, res: HttpResponse) {
    if (!req.query.itemRef) {
      return
    }
    const sender = await load(Sender, +req.query.itemRef, [], { first: true });
    res.send(sender.getContextKeys());
  }

}