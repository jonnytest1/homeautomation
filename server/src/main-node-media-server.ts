import { environment } from './environment';
import NodeMediaServer from 'node-media-server';

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
debugger
nodeMediaServer.run();