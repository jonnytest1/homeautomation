import "./util/log-intercept"
import { NotificationData, NotificationHandler } from './services/notification-handler';
import registration from './services/registration';
import { config } from "dotenv"
import { ExpressWs } from 'express-hibernate-wrapper';
import { RepeatingAudio } from './services/repeating-audio-player';

import { TextReader } from './services/read-text';
import type { TransformationRes } from '../../server/src/models/connection-response';
import { TimerService } from "./services/timer-service"
import { parseArgsToEnv } from './services/args';
import { traceTransform } from './services/log-handler';
import { handleActionConfirmEvent, handleActionEvent, isActionEvent, isEvent } from './services/events/event-handler';
import { CalenderService } from './services/calendar-notify-service';
import { uidBlackList } from './services/calendar-uid-blacklist';
import { interceptLogs } from './util/log-intercept';
import { logKibana } from './util/log';
import { FritzBoxClient } from './services/virtual-clients/fritz-box-client';
parseArgsToEnv()

config({
  path: `${process.env.profile == "PROD" ? ".env.prod.env" : ".env"}`
});
interceptLogs()
//new SocketService(19999);




const express = require('express');
const serverIp = process.env.serverip || '192.168.178.54'
const listenOnPort = process.env.listenport || '12345'

const service = new CalenderService()
service.load(uidBlackList).then(() => {
  console.log("loaded calendars")
  service.timer()
})

RepeatingAudio.check()
const timerService = new TimerService(serverIp);
registration.register(serverIp, +listenOnPort)
  .then(() => {
    const fritzBoxClient = new FritzBoxClient()
    //fritzBoxClient.start()

    const app: ExpressWs = express();
    var expressWs = require('express-ws')(app);

    app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
      next();
    });
    app.use(express.json({ limit: '800mb' }));
    app.use(express.urlencoded());
    app.use(express.text());

    app.ws('/', async (ws, req) => {
      try {
        const data = JSON.parse(req.query.data as string) as TransformationRes;
        if (data.notification) {
          new NotificationHandler(data as NotificationData, serverIp).show(ws);
        } else {
          ws.close();
        }
        if (data.read) {
          await new TextReader(data.read).read();
        }
      } catch (e) {
        console.error(e);
      }
    });
    app.post('/log', async (req, res) => {
      try {
        const str = req.body as string;
        const now = new Date().toISOString();

        if (typeof str !== "string") {
          return res.send();
        }

        const transformed = await traceTransform(str);
        const indented = transformed.split("\n").map(l => new Array(now.length).fill(" ").join("") + l).join("\n")

        console.log(now + ": \n" + indented);
        res.send()
      } catch (e) {
        console.error(e);
      }
    });
    app.post('/action', (req, res) => {
      try {
        const evt = JSON.parse(req.body);
        if (isEvent.parse(evt) && isActionEvent.parse(evt)) {
          res.send(handleActionEvent(evt));
        }
        res.status(404).send()
      } catch (e) {
        console.error(e);
        res.status(500).send(JSON.stringify({ e, message: e.message, stack: e.stack }))
      }
    });

    app.post('/action/confirm', (req, res) => {
      try {
        const evt = JSON.parse(req.body);
        evt.type = "trigger-action"
        if (isEvent.parse(evt) && isActionEvent.parse(evt)) {
          res.send(handleActionConfirmEvent(evt));
        }
        res.status(404).send()
      } catch (e) {
        console.error(e);
        res.status(500).send(JSON.stringify({ e, message: e.message, stack: e.stack }))
      }
    });

    app.listen(+listenOnPort, '', () => {
      console.log(`started server on localhost with port ${listenOnPort}`);
    });
    timerService.timer();
  });




process.on("uncaughtException", e => {
  // handle
})


process.on("unhandledRejection", e => {
  logKibana("ERROR", "uncaughtException", e)
})