import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { fileURLToPath } from 'url';
import { Sound } from './interface ';
import { OptionsService } from './options.service';
@Component({
  selector: 'app-options',
  templateUrl: './options.component.html',
  styleUrls: ['./options.component.less']
})
export class OptionsComponent implements OnInit {


  addingSound: Partial<Sound> = {};
  sounds: Array<Sound> = [];

  soundName: string

  error: string
  constructor(private optionsService: OptionsService,
    private cdr: ChangeDetectorRef,
    private domSanitizer: DomSanitizer) {

  }

  ngOnInit() {
    this.optionsService.getSounds().toPromise().then(sounds => {
      this.sounds = sounds.map(sound => {
        const charCodeArray = sound.bytes.split(",")
          .map(c => +c)
        const blob = new Blob([Uint8Array.from(charCodeArray)], { type: "audio" })
        const sanitized = this.domSanitizer.bypassSecurityTrustUrl(URL.createObjectURL(blob))
        return { ...sound, url: sanitized }
      });
      this.cdr.markForCheck();
    })
  }
  onRemove(file) {

  }

  addFile() {
    if (!this.addingSound.key || this.sounds.some(sound => sound.key == this.addingSound.key)) {
      this.error = "needs unique key"
      return;
    }
    const addingSound = this.addingSound as Sound;
    this.sounds.push(this.addingSound as Sound);

    this.addingSound.resolver.then(() => {
      this.optionsService.saveSound(addingSound).toPromise();
    })


    this.addingSound = {};
  }

  async linkDrop(evt) {
    const link: string = evt.dataTransfer.getData("text")
    const urlName = new URL(link).pathname.split('/').pop();
    if (!this.addingSound.key) {
      this.addingSound.key = urlName.split(".")[0];
    }

    this.addingSound.resolver = new Promise(res => {
      fetch(link)
        .then(r => r.blob())
        .then(blob => this.readBytes(this.addingSound, blob))
        .then(res)
    })

    this.soundName = urlName
    this.addingSound.url = link
    evt.stopPropagation();
    evt.preventDefault();
  }
  onDrop(event) {
    if (event.addedFiles.length == 1) {
      const fl: File = event.addedFiles[0]
      this.addingSound.file = fl;
      this.soundName = fl.name
      if (!this.addingSound.key) {
        this.addingSound.key = fl.name.split(".")[0]
        this.addingSound.url = this.domSanitizer.bypassSecurityTrustUrl(URL.createObjectURL(fl))
      }
      this.addingSound.resolver = this.readBytes(this.addingSound, fl);

    }
  }

  private async readBytes(soundRef: Partial<Sound>, fl: Blob): Promise<void> {
    return new Promise(res => {
      var r = new FileReader();
      r.onload = () => {
        const result = new Uint8Array(r.result as ArrayBuffer);
        soundRef.bytes = result.join(',');
        res();
      };
      r.readAsArrayBuffer(fl);
    });
  }
}
