import { config } from 'dotenv';
import { updateDatabase } from 'hibernatets';
import { initialize } from './express-wrapper';
//import * as express from 'express';

console.log('server.ts iniz');

const env = config({
    path: __dirname + '/.env'
});
if (env.error) {
    throw env.error;
}
console.log(env.parsed);

updateDatabase(__dirname + '/models')
    .then(() => {
        let redirected = null;
        initialize(__dirname + '/resources', {
            prereesources: app => {
                app.use((req, res, next) => {
                    res.header('Access-Control-Allow-Origin', '*');
                    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
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
                        fetch(url.href, {
                            method: req.method,
                            headers: {
                                'content-type': req.headers['content-type'] ? req.headers['content-type'] : undefined
                            },
                            body: req.body
                        })
                            .then(r => r.text()
                                .then(t => res.status(r.status)
                                    .send(t)));

                    } else {
                        next();
                    }
                });
            },
            allowCors: true,
            public: __dirname + '/public'
        });
    });

/*

app.get('/dbtest', async (req, res) => {
    res.send('helloo worl.d');
});
*/
process.on('SIGHUP', () => {
    console.log('sighup');
});
