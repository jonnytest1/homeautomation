import { EventScheduler } from './src/services/event/event-scheduler';
import { logKibana } from './src/util/log';
import { startNodeRed } from './src/node-red/server';
import { environment } from './src/environment';
import { setDbInit } from './src/models/db-state';
import { hasLoaded$ } from './src/services/generic-node/generic-node-service';
import { updateDatabase } from 'hibernatets';
import { HttpRequest, initialize, ResponseCodeError } from 'express-hibernate-wrapper';
import NodeMediaServer from "node-media-server"
import BrowserToRtmpServer from "@api.video/browser-to-rtmp-server"
import http from 'http';
Error.stackTraceLimit = Infinity;
const fetch = require('node-fetch');
const https = require('https');
global.fetch = require('node-fetch');
console.log('server.ts iniz');


if (environment.setup) {
  require("./test/local-setup.ts")
}

updateDatabase(__dirname + '/src/models')
  .then(async () => {
    setDbInit()
    console.log("updated database")
    const redirected: string | null = null;
    await initialize(__dirname + '/src/resources', {
      errorCallback: (e) => {
        if (e instanceof ResponseCodeError) {
          logKibana("DEBUG", "response code error", e)
        } else {
          logKibana("ERROR", "error in request handling", e)
        }
      },
      prereesources: app => {
        app.use((req, res, next) => {
          res.header('Access-Control-Allow-Methods', '*');
          res.header("Service-Worker-Allowed", "/")
          next();
        });
        app.use((req, res, next) => {
          if (req.path == "/healthcheck") {
            if (!environment.SMARTHOME_DISABLED && !hasLoaded$.value) {
              return res.status(400).send("smarthome pending")
            }
            res.status(200).send("OK")
            return;
          }
          next();
        })
        app.use((req: HttpRequest, res, next) => {
          const forwardedFor = req.headers.http_x_forwarded_for;
          if ((!forwardedFor || typeof forwardedFor !== 'string' || !forwardedFor.startsWith('192.168.')) && environment.DEBUG !== "true") {
            res.header("ip check", "denied").status(403).send();
            return;
          }
          next();
        });
        /* app.post('/redirect', (req, res) => {
             if (redirected) {
                 redirected = null;
             } else {
                 redirected = `${req.headers.http_x_forwarded_for}:${req.query.port}`;
             }
             console.log(`redirect set to ${redirected}`);
             res.send();
         });*/
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
    console.log("initialized server")
    new EventScheduler().start();
    if (environment.REDIRECT) {
      console.log("set redirection")
      fetch("https://192.168.178.54/nodets/redirect?port=8080", {
        method: "POST",
        agent: new https.Agent({
          rejectUnauthorized: false
        })
      })
    }

    await startNodeRed()
    //tuyaSTuffs()

  }).catch(e => {
    logKibana("ERROR", "failed updating database or server start", e);
    setTimeout(() => {
      process.exit(1);
    }, 500)
  });

const nodeMediaServer = new NodeMediaServer({
  rtmp: {
    port: 11935,
    chunk_size: 60000,
    gop_cache: true,
    ping: 30,
    ping_timeout: 60,
  },

  http: {
    port: 8000,
    allow_origin: '*',
    mediaroot: environment.MEDIA_ROOT ?? "./media"

  },
  trans: {
    ffmpeg: environment.FFMPEG ?? "/usr/bin/ffmpeg",
    tasks: [{
      mp4: true,
      app: "live",

    }]
  }
})
nodeMediaServer.run();

const server = http.createServer();
const browserToRtmpSerrver = new BrowserToRtmpServer(server, {
  socketio: {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
      credentials: true,

    }
  },
  //@ts-expect-error
  ffmpegPath: environment.FFMPEG,

  hooks: {
    /*start: (socket, config) => {
      // for instance, you can here access the socket associated to the current request:
      // const token = socket.handshake.auth.token; // retrieve the auth token
      // ...
      const rtmpEndpoint = "rtmp://localhost:11935/live/abcd" // you can generate here the RTMP endpoint url according to your need:
      return {
        ...config,
        port: 11935,
        rtmp: rtmpEndpoint
      }
    }*/
  }
});
browserToRtmpSerrver.on("connection", (c) => {
  console.log(`New media connection uuid: ${c.uuid}`);
});
browserToRtmpSerrver.on('error', (error, streamId) => {
  console.error('[❌ RTMP Server Error]', streamId, error);
});
server.listen(21234);
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

process.on('unhandledRejection', function (err) {
  console.log(err);
  logKibana("ERROR", "uncaught promise reject", err);
})