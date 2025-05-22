import { environment } from './environment';
import NodeMediaServer from 'node-media-server';
import { spawn, type ChildProcessWithoutNullStreams } from "child_process"
import { join } from 'path';

const ffmpegExe = environment.FFMPEG ?? "/usr/bin/ffmpeg";
const mediaFolder = environment.MEDIA_ROOT ?? "./media";
const mediaServerConfig: ConstructorParameters<typeof NodeMediaServer>[0] = {
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
    mediaroot: mediaFolder
  },
  trans: {
    ffmpeg: ffmpegExe,
    tasks: [{
      mp4: false,
      app: "live",
    }]
  }
};
const nodeMediaServer = new NodeMediaServer(mediaServerConfig)

const mkvMap: Record<string, ChildProcessWithoutNullStreams> = {}
nodeMediaServer.on('postPublish', (id, streamPath, args) => {



  const streamMatch = streamPath.match(/live\/(?<name>[a-z0-9]*)(\/|$)/);
  if (streamMatch?.groups?.name) {
    const inputStream = 'rtmp://127.0.0.1:' + mediaServerConfig.rtmp?.port + streamPath
    const now = new Date().toISOString().replace(/[:.]/g, "-");
    const out = join(mediaFolder, "live", streamMatch?.groups?.name, `stream_${streamMatch.groups.name}_${now}.mkv`)
    const ffmpegProcess = spawn(ffmpegExe, ["-i", inputStream, "-c", "copy", "-f", "matroska", out]);
    mkvMap[streamPath] = ffmpegProcess
    console.log("started mkv stream recording")

    ffmpegProcess.on('error', (e) => {
      console.error(e)
      debugger
    });

    ffmpegProcess.stdout.on('data', (data) => {
      console.warn(data.toString())
    });

    ffmpegProcess.stderr.on('data', (data) => {
      //console.error(data.toString())
    });

    ffmpegProcess.on('close', (code) => {

      console.log("closed ffmpeg" + code)
    });
  }





});
nodeMediaServer.on('donePublish', (id, path, args) => {
  mkvMap[path]?.kill()
  console.warn("publish done " + path)
});


nodeMediaServer.run();
console.log("node media server run")