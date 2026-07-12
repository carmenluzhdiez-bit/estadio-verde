// firebase-messaging-sw.js
// Service Worker para notificaciones push — Estadio Verde
// Subir a: /public/firebase-messaging-sw.js en el repositorio

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

// Notificaciones en background (cuando la app está cerrada)
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

// Clic en la notificación → abrir la app
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.action === 'abrir' || !event.action) {
    event.waitUntil(
      clients.openWindow('https://carmenluzhdiez-bit.github.io/estadio-verde/')
    );
  }
});
