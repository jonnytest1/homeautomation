import { BarcodeDetector } from "./barcode";
import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild } from '@angular/core';

@Component({
  selector: 'app-mobile-sender-scan',
  templateUrl: './mobile-sender-scan.component.html',
  styleUrls: ['./mobile-sender-scan.component.less']
})
export class MobileSenderScanComponent implements OnInit, AfterViewInit {

  @ViewChild("video")
  video: ElementRef<HTMLVideoElement>


  @ViewChild("range")
  range: ElementRef<HTMLInputElement>

  @ViewChild("canvas")
  canvas: ElementRef<HTMLCanvasElement>

  context: CanvasRenderingContext2D;
  detector: BarcodeDetector;

  min

  max

  step

  track: any;
  formt: any
  constructor(private cdr: ChangeDetectorRef) {
    BarcodeDetector.getSupportedFormats().then(formats => {
      this.formt = formats;
    })
  }
  setZoom(event) {
    this.track.applyConstraints({ advanced: [{ zoom: event.target.value }] });
  }

  count = 0;

  onFrame = () => {
    window.requestAnimationFrame(this.onFrame);
    this.context.drawImage(this.video.nativeElement, 0, 0);
    this.count++;

    if (this.count > 10) {
      this.count = 0;
      createImageBitmap(this.canvas.nativeElement).then(data => {

        new BarcodeDetector({ formats: this.formt }).detect(data)
          .then(barcodes => {
            barcodes.forEach(barcode => {
              return alert(`${barcode.format} - ${barcode.rawValue}`);
            });
          })
          .catch(err => {
            // debugger;
            console.log(err);
          })
      })
    }


  }

  ngOnInit() {
    navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false, })
      .then(async (media) => {
        this.video.nativeElement.srcObject = media;
        const settings = media.getVideoTracks()[0].getSettings();
        this.canvas.nativeElement.height = settings.height
        this.canvas.nativeElement.width = settings.width

        this.track = media.getVideoTracks()[0];

        const trackSettings = this.track.getCapabilities();
        this.min = trackSettings.zoom.min;
        this.max = trackSettings.zoom.max
        this.step = trackSettings.zoom.step

        this.cdr.detectChanges();
      })
    if ("BarcodeDetector" in window) {
      /// this.detector = new BarcodeDetector(this.formt);
    }

  }



  ngAfterViewInit(): void {
    this.context = this.canvas.nativeElement.getContext("2d");
    //if (this.detector) {
    this.onFrame();
    //}



  }

}
