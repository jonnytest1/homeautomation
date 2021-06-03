import { EventScheduler } from './src/services/event-scheduler';
import { logKibana } from './src/util/log';
import { updateDatabase } from 'hibernatets';
import { HttpRequest, initialize, ResponseCodeError } from 'express-hibernate-wrapper';
import { config } from 'dotenv';
const fetch = require('node-fetch');
const NodeMediaServer = require('node-media-server');
const https = require('https');

console.log('server.ts iniz');

const env = config({
    path: __dirname + '/.env'
});
if (env.error) {
    throw env.error;
}
updateDatabase(__dirname + '/src')
    .then(async () => {
        let redirected = null;
        await initialize(__dirname + '/src/resources', {
            errorCallback: (e) => {
                if (e instanceof ResponseCodeError) {
                    logKibana("DEBUG", "response code error", e)
                } else {
                    logKibana("ERROR", "error in request handling", e)
                }
            },
            prereesources: app => {
                app.use((req: HttpRequest, res, next) => {
                    const forwardedFor = req.headers.http_x_forwarded_for;
                    if ((!forwardedFor || typeof forwardedFor !== 'string' || !forwardedFor.startsWith('192.168.178')) && process.env.DEBUG !== "true") {
                        res.status(403).send();
                        return;
                    }
                    next();
                });
                app.post('/redirect', (req, res) => {
                    if (redirected) {
                        redirected = null;
                    } else {
                        redirected = `${req.headers.http_x_forwarded_for}:${req.query.port}`;
                    }
                    console.log(`redirect set to ${redirected}`);
                    res.send();
                });
                app.use((req, res, next) => {
                    if (redirected) {
                        const url = new URL(`${req.protocol}://${req.get('host')}${req.originalUrl}`);
                        url.host = redirected;
                        const body = req.headers['content-type'] ? JSON.stringify(req.body) : req.body
                        console.log(`redirecting to ${url.href} with ${req.method} - ${body}`)

                        fetch(url.href, {
                            method: req.method,
                            headers: {
                                'content-type': req.headers['content-type'] ? req.headers['content-type'] : undefined
                            },
                            body: body
                        })
                            .then(r => {
                                return r.text()
                                    .then(t => res.status(r.status)
                                        .send(t));
                            });

                    } else {
                        next();
                    }
                });
            },
            allowCors: true,
            public: __dirname + '/public'
        });
        new EventScheduler().start();
        if (process.env.REDIRECT) {
            console.log("set redirection")
            fetch("https://192.168.178.54/nodets/redirect?port=8080", {
                method: "POST",
                agent: new https.Agent({
                    rejectUnauthorized: false
                })
            })
        }
    });
const mediaServerConfig = {
    rtmp: {
        port: 11935,
        chunk_size: 60000,
        gop_cache: true,
        ping: 30,
        ping_timeout: 60
    },
    http: {
        port: 8000,
        allow_origin: '*'
    }
};
const nodeMediaServer = new NodeMediaServer(mediaServerConfig)
nodeMediaServer.run();
/*

app.get('/dbtest', async (req, res) => {
    res.send('helloo worl.d');
});
*/
process.on('SIGHUP', () => {
    console.log('sighup');
});

process.on('uncaughtException', function (err) {
    console.log(err);
    logKibana("ERROR", "uncaught global exception", err);
})
