import type { Sound } from './interface ';
import { OptionsService } from './options.service';
import type { OnInit } from '@angular/core';
import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { FireBaseService } from '../foreground-firebase-service';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { AsyncPipe } from '@angular/common';
@Component({
  selector: 'app-options',
  templateUrl: './options.component.html',
  styleUrls: ['./options.component.less'],
  standalone: true,
  imports: [MatButtonModule, MatIconModule, FormsModule, MatInputModule, AsyncPipe]
})
export class OptionsComponent implements OnInit {


  addingSound: Partial<Sound> = {};
  sounds: Array<Sound> = [];

  soundName: string;

  error: string;

  firebase = inject(FireBaseService)
  constructor(private optionsService: OptionsService,
    private cdr: ChangeDetectorRef,
    private domSanitizer: DomSanitizer) {

  }

  ngOnInit() {

    this.optionsService.getSounds().toPromise().then(sounds => {
      this.sounds = sounds.map(sound => {
        const charCodeArray = sound.bytes.split(',')
          .map(c => +c);
        const blob = new Blob([Uint8Array.from(charCodeArray)], { type: 'audio' });
        const sanitized = this.domSanitizer.bypassSecurityTrustUrl(URL.createObjectURL(blob));
        return { ...sound, url: sanitized };
      });
      this.cdr.markForCheck();
    });
  }
  onRemove(file) {
    //
  }

  addFile() {
    if (this.addingSound.key) {
      this.addingSound.key = this.addingSound.key.replace(/[^a-zA-Z0-9_-]/g, "")
    }
    if (!this.addingSound.key || this.sounds.some(sound => sound.key === this.addingSound.key)) {
      this.error = 'needs unique key';
      return;
    }
    const addingSound = this.addingSound as Sound;
    this.sounds.push(this.addingSound as Sound);

    this.addingSound.resolver.then(() => {
      this.optionsService.saveSound(addingSound).toPromise();
    });


    this.addingSound = {};
  }

  async linkDrop(evt) {
    const link: string = evt.dataTransfer.getData('text');
    if (!link?.length) {
      return
    }
    const urlName = new URL(link).pathname.split('/').pop();
    if (!this.addingSound.key) {
      this.addingSound.key = urlName.split('.')[0];
    }

    this.addingSound.resolver = new Promise(res => {
      fetch(link)
        .then(r => r.blob())
        .then(blob => this.readBytes(this.addingSound, blob))
        .then(res);
    });

    this.soundName = urlName;
    this.addingSound.url = link;
    evt.stopPropagation();
    evt.preventDefault();
  }
  onDrop(event) {
    if (event.dataTransfer.items.length === 1) {
      const fl: File = event.dataTransfer.items[0].getAsFile()
      this.addingSound.file = fl;
      this.soundName = fl.name;
      if (!this.addingSound.key) {
        this.addingSound.key = fl.name.split('.')[0];
        this.addingSound.url = this.domSanitizer.bypassSecurityTrustUrl(URL.createObjectURL(fl));
      }
      this.addingSound.resolver = this.readBytes(this.addingSound, fl);
      event.stopPropagation();
      event.preventDefault();

    }
  }

  private async readBytes(soundRef: Partial<Sound>, fl: Blob): Promise<void> {
    return new Promise(res => {
      const r = new FileReader();
      r.onload = () => {
        const result = new Uint8Array(r.result as ArrayBuffer);
        soundRef.bytes = result.join(',');
        res();
      };
      r.readAsArrayBuffer(fl);
    });
  }


  registerServiceWorker() {
    this.firebase.register();
  }

}
