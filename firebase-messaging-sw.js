// Firebase Cloud Messaging service worker compatibility file.
//
// La app registra ./service-worker.js como service worker principal y ahí vive
// toda la lógica PWA + FCM. Este archivo existe para compatibilidad con Firebase,
// navegadores y pruebas que buscan el nombre estándar firebase-messaging-sw.js.
// No contiene claves privadas.

importScripts("./service-worker.js");
