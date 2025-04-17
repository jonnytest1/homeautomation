/// <reference path="./cdn.d.ts" />
/// <reference lib="webworker" />
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getMessaging } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-messaging-sw.js";
import { openDB } from "https://cdn.jsdelivr.net/npm/idb@7/+esm";

const firebaseApp = initializeApp({
  apiKey: "AIzaSyBBrBhwjzP0PiXIYIcVWgQz3zLBbmsuO7U",
  authDomain: "privateproject-jonny.firebaseapp.com",
  projectId: "privateproject-jonny",
  storageBucket: "",
  messagingSenderId: "90777757347",
  appId: "1:90777757347:web:a1fe4b223a627e505f4116",
});

//const messaging = getMessaging(firebaseApp,);

async function storeIfNotExists<T>(key: string, valueGen: () => T): Promise<Awaited<T>> {
  const db = await openDB('my-db', 1, {
    upgrade(db) {
      db.createObjectStore('store');
    },
  });

  const existing = await db.get('store', key);
  if (existing === undefined) {
    const val = await valueGen()
    await db.put('store', val, key);
    return val; // Value was stored
  }
  return existing; // Value already exists
}
const scope = self as unknown as ServiceWorkerGlobalScope;

let instanceId = storeIfNotExists('message', () => crypto.randomUUID());

scope.addEventListener("message", async (event) => {
  console.log("Received message in SW:", event.data);

  if (event.data?.type === "instanceid") {
    event.source?.postMessage({ type: "instanceid", payload: await instanceId });
  }
});

interface NotificationConfig {
  title: string
  body: string
  tag?: string

  data?: any

  dismissable?: boolean
}

let activeNotifications: Record<string, NotificationConfig> = {}

let activeNotificationTags: Record<string, Array<string>> = {}

async function keepAlive(tag: string) {
  while (true) {
    await new Promise(res => setTimeout(res, 4000))
    const currentTags = activeNotificationTags[tag]
    const notifications = await scope.registration.getNotifications({ tag: currentTags[currentTags.length - 1] });
    notifications.forEach(notification => notification.close());
    if (!activeNotifications[tag]) {
      break;
    }

    await triggerNotification(activeNotifications[tag])
  }
}


async function triggerNotification(not: NotificationConfig) {
  not.tag ??= crypto.randomUUID()
  const currentTag = crypto.randomUUID()
  activeNotificationTags[not.tag] ??= []
  activeNotificationTags[not.tag].push(currentTag)
  activeNotifications[not.tag] = not

  await scope.registration.showNotification(not.title, {
    body: not.body,
    icon: "/firebase-logo.png",
    data: not.data, // Optional custom payload
    requireInteraction: true,
    tag: currentTag,

  })

  await keepAlive(not.tag!)
}


scope.addEventListener("push", (event) => {
  if (!event.data) return;

  const notificationData = event.data.json();
  console.log("Push received:", notificationData);
  let notificaiton: NotificationConfig = notificationData.notification
  if (notificationData.data?.data) {
    try {
      const not = JSON.parse(notificationData.data?.data)
      if ("notification" in not && "title" in not.notification) {
        notificaiton = not.notification;
      }
    } catch (e) {

    }
  }
  event.waitUntil(triggerNotification(notificaiton));


});

scope.addEventListener("notificationclose", e => {

  for (const sourceTag in activeNotificationTags) {
    if (activeNotificationTags[sourceTag].includes(e.notification.tag)) {
      const config = activeNotifications[sourceTag]
      const backend = new URL("../../rest/receiver/notification", scope.registration.active?.scriptURL)
      if (config.dismissable !== false) {
        delete activeNotifications[sourceTag]
        delete activeNotificationTags[sourceTag]
      }
      break;
    }
  }


  debugger
})
scope.addEventListener("notificationclick", e => {
  debugger
})


