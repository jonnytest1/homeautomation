
import { NotificationHandler } from './services/notification-handler';
import registration from './services/registration';
import { config } from "dotenv"
import { ExpressWs } from 'express-hibernate-wrapper';
import { RepeatingAudio } from './services/repeating-audio-player';

import "./services/read-text"
import { TextReader } from './services/read-text';
import { TransformationRes } from '../../server/src/models/connection-response';
config();
const express = require('express');
const serverIp = process.env.serverip || '192.168.178.54'
const listenOnPort = process.env.listenport || '12345'

RepeatingAudio.check()
registration.register(serverIp, +listenOnPort)
    .then(() => {
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
                    new NotificationHandler(data, serverIp).show(ws);
                }
                if (data.read) {
                    new TextReader(data.read).read();
                }
            } catch (e) {
                console.error(e);
            }

        });

        app.listen(+listenOnPort, '', () => {
            console.log(`started server on localhost with port ${listenOnPort}`);
        });
    });

