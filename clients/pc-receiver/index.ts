import { ExpressWs } from '../../server/express-ws-type';
import { NotificationHandler } from './services/notification-handler';
import registration from './services/registration';
import { config } from "dotenv"
import { UrlService } from './services/url-service';
config();
const express = require('express');
const serverIp = process.env.serverip || '192.168.178.54'
const listenOnPort = process.env.listenport || '12345'



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
                const data = JSON.parse(req.query.data as string);
                if (data.notification) {
                    new NotificationHandler(data, serverIp).show(ws);
                }
                if (data.action && data.action == "openUrl") {
                    // new UrlService(data.data).open();
                }
            } catch (e) {
                console.error(e);
            }

        });

        app.listen(+listenOnPort, '', () => {
            console.log(`started server on localhost with port ${listenOnPort}`);
        });
    });

