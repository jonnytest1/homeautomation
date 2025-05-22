import { environment } from './environment';
import { logKibana } from './util/log';
import NodeMediaServer from 'node-media-server';

process.on('uncaughtException', function (err) {
  console.log(err);
  logKibana("ERROR", "uncaught global exception", err);
})

process.on('unhandledRejection', function (err) {
  console.log(err);
  logKibana("ERROR", "uncaught promise reject", err);
})

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
console.log("node media server run")
nodeMediaServer.run();