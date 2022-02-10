import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import flv from 'flv.js';
import { v4 as uuid } from 'uuid';
@Component({
    selector: 'app-camera',
    templateUrl: './camera.component.html',
    styleUrls: ['./camera.component.scss']
})
export class CameraComponent implements AfterViewInit, OnInit, OnDestroy {

    videoId;
    streamName = 'test';

    @ViewChild('videoElement')
    videoElement: ElementRef<HTMLVideoElement>;


    player: flv.Player;
    constructor() {
        //
    }


    ngOnInit() {
        this.videoId = 'video_' + uuid().replace(/-/g, '');
    }
    ngAfterViewInit(): void {
        /* this.player = flv.createPlayer({
           type: 'flv',
           url: `https://192.168.178.54/live/${this.streamName}.flv`
         });
         this.player.attachMediaElement(this.videoElement.nativeElement);
         this.player.load();*/
        // flvPlayer.play();
        /*const flvjs = null;
        if (flvjs.isSupported()) {
          var videoElement = document.getElementById('videoElement');

          var flvPlayer = flvjs.createPlayer({
            type: 'flv',
            url: 'http://192.168.178.54:8000/live/kitchencam.flv'
          });
          flvPlayer.attachMediaElement(videoElement);
          flvPlayer.load();
          videoElement.onclick = () => {

            flvPlayer.play();
          }
        }*/
    }

    ngOnDestroy(): void {
        this.player?.detachMediaElement();
        this.player?.unload();
        this.player?.destroy();
    }
}
