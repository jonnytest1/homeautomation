import { inject, Injectable } from '@angular/core';
import { deleteToken, getToken, Messaging, onMessage } from '@angular/fire/messaging';
import { initializeApp } from "firebase/app";
import { getMessaging, } from "firebase/messaging/sw";
import { BehaviorSubject, lastValueFrom, Observable, tap } from 'rxjs';
import { filter, first, map } from 'rxjs/operators';
import { SettingsService } from './settings.service';
import { typedValues } from './utils/type-checker';
import { ResolvablePromise } from './utils/resolvable-promise';

@Injectable({
  providedIn: "root",
})
export class FireBaseService {


  private static scriptUrl = new URL("assets/firebase-messaging-sw.js", document.baseURI)

  private messaging = inject(Messaging);
  private settings = inject(SettingsService)
  message$ = new BehaviorSubject<unknown>(null);

  registration$ = new BehaviorSubject<ServiceWorkerRegistration>(null)

  constructor() {
    navigator.serviceWorker.getRegistration(FireBaseService.scriptUrl).then(reg => {
      if (reg) {
        this.registration$.next(reg)
        reg.update()
      } else {
        this.registration$.next(null)
      }
    })

    onMessage(this.messaging, (msg) => {
      this.message$.next(msg)
      console.log("firebase", msg)
    })
  }

  async getRegistrationId(registration: ServiceWorkerRegistration) {
    return new Promise<string>(res => {
      navigator.serviceWorker.addEventListener("message", message => {
        if (message.data.type === "instanceid") {
          res(message.data.payload)
        }
      }, { once: true })
      registration.active.postMessage({
        type: "instanceid"
      })
    })

  }

  deviceKey(registratinId: string) {
    return `web-${registratinId}`
  }

  async register() {
    // Retrieve an instance of Firebase Messaging so that it can handle background
    // messages.
    Notification.requestPermission().then(
      (notificationPermissions: NotificationPermission) => {
        if (notificationPermissions === "granted") {
          console.log("Granted");
        }
        if (notificationPermissions === "denied") {
          console.log("Denied");
        }
      });

    let registration = await navigator.serviceWorker.getRegistration(FireBaseService.scriptUrl)
    if (!registration) {
      registration = await navigator.serviceWorker.register(FireBaseService.scriptUrl, { type: "module", scope: "/" })
      this.registration$.next(registration)
      await ResolvablePromise.delayed(500);

    }

    const registrationId = await this.getRegistrationId(registration)

    this.settings.receivers$.pipe(
      map(r => typedValues(r)),
      filter(r => !!r.length),
      first(),
      map(receivers => {
        return receivers[this.deviceKey(registrationId)]
      })
    ).subscribe(async rec => {

      const token = await getToken(this.messaging, {
        // vapidKey: `an optional key generated on Firebase for your fcm tokens`,
        serviceWorkerRegistration: registration,
      })
      console.log('my fcm token', token);
      rec = await lastValueFrom(this.settings.registerReceiver({
        deviceKey: this.deviceKey(registrationId),
        firebaseToken: token,
        type: "firebase",
        name: "web receiver"
      }))

    })


  }


  async deleteToken() {
    // We can also delete fcm tokens, make sure to also update this on your firestore db if you are storing them as well
    await deleteToken(this.messaging);
  }

  async unregister() {
    await this.registration$.value.unregister()
  }
}