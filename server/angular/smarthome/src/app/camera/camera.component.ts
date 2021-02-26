import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import flv from "flv.js";
import { v4 as uuid } from "uuid";
@Component({
  selector: 'app-camera',
  templateUrl: './camera.component.html',
  styleUrls: ['./camera.component.scss']
})
export class CameraComponent implements AfterViewInit, OnInit {

  videoId;
  streamName = "test";

  @ViewChild("videoElement")
  videoElement: ElementRef<HTMLVideoElement>

  constructor() { }

  ngOnInit() {
    this.videoId = "video_" + uuid().replace(/-/g, '');
  }
  ngAfterViewInit(): void {
    const flvPlayer = flv.createPlayer({
      type: 'flv',
      url: `https://192.168.178.54/live/${this.streamName}.flv`
    });
    flvPlayer.attachMediaElement(this.videoElement.nativeElement);
    flvPlayer.load();
    flvPlayer.play();
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
}
