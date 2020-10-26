
import { MessageHandling } from './services/message-handling';
import registration from './services/registration';
const express = require('express');
import { Express } from 'express';
import { ExpressWs } from '../express-ws-type';
import { NotificationHandler } from './services/notification-handler';

registration.register()
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
            let data = req.query.data;
            try {
                data = JSON.parse(data);
            } catch (e) {
                console.error(e);
            }
            if (data.notification) {
                new NotificationHandler(data).show(ws);
            }
        });

        app.listen(13579, '', () => {
            console.log('started server on localhost with port 13579');
        });
    });