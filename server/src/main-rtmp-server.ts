import { environment } from './environment';
import BrowserToRtmpServer from '@api.video/browser-to-rtmp-server';
import http from 'http';
const server = http.createServer();


type Opts = ConstructorParameters<typeof BrowserToRtmpServer>["1"]

const browserToRtmpSerrver = new BrowserToRtmpServer(server, {
  socketio: {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
      credentials: true,

    }
  },
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
} as Opts);
browserToRtmpSerrver.on("connection", (c) => {
  console.log(`New media connection uuid: ${c.uuid}`);
});
browserToRtmpSerrver.on('error', (error, streamId) => {
  console.error('[❌ RTMP Server Error]', streamId, error);
});
console.log("rtmp server listen")
server.listen(21234);

