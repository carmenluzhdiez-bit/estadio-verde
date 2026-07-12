// firebase-messaging-sw.js — Estadio Verde
// Ubicación en el repo: raíz (junto a index.html) o public/

importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyBgxVOk_OAh2XTouD9gLw5rycaNF-OWlnU",
  authDomain: "riego-estadio-espanol.firebaseapp.com",
  databaseURL: "https://riego-estadio-espanol-default-rtdb.firebaseio.com",
  projectId: "riego-estadio-espanol",
  storageBucket: "riego-estadio-espanol.firebasestorage.app",
  messagingSenderId: "972722300084",
  appId: "1:972722300084:web:0da9c37b416a050c3b63e1",
});

const messaging = firebase.messaging();

// Responder al GET_TOKEN desde la app
self.addEventListener("message", async (evt) => {
  if(evt.data?.type === "GET_TOKEN") {
    try {
      const token = await messaging.getToken({
        vapidKey: evt.data.vapidKey
      });
      // Devolver token a la app
      const clients = await self.clients.matchAll({ type: "window" });
      clients.forEach(c => c.postMessage({ type: "TOKEN", token }));
    } catch(e) {
      console.warn("SW getToken error:", e);
    }
  }
});

// Notificaciones en background (app cerrada)
messaging.onBackgroundMessage((payload) => {
  const { title, body, icon } = payload.notification || {};
  self.registration.showNotification(title || '🔔 Estadio Verde', {
    body: body || payload.data?.mensaje || '',
    icon: icon || '/estadio-verde/favicon.ico',
    badge: '/estadio-verde/favicon.ico',
    tag: payload.data?.tipo || 'alerta',
    data: payload.data,
    actions: [
      { action: 'abrir', title: 'Ver en la app' },
      { action: 'cerrar', title: 'Cerrar' }
    ]
  });
});

// Clic en notificación → abrir app
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if(event.action !== 'cerrar') {
    event.waitUntil(
      clients.openWindow('https://carmenluzhdiez-bit.github.io/estadio-verde/')
    );
  }
});
