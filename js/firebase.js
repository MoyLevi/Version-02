// Firebase / FCM config pública para la PWA.
// No contiene claves privadas. Las claves de servidor van únicamente en GitHub Secrets.
(function () {
  window.QUINIELA_FIREBASE_CONFIG = {
    apiKey: "AIzaSyC66nMOwuwAZ-m2EIq6ckI8ktOmwIDF1p0",
    authDomain: "quiniela-mundial-2026-pwa.firebaseapp.com",
    projectId: "quiniela-mundial-2026-pwa",
    storageBucket: "quiniela-mundial-2026-pwa.firebasestorage.app",
    messagingSenderId: "467730515210",
    appId: "1:467730515210:web:ae987030b92167bf5f26f3",
    measurementId: "G-KL3SL8TDXD"
  };

  window.QUINIELA_FCM_VAPID_KEY = "BPV_IkDvQLAh6MIzXLv9oBW2D55hSgKJCRWFRL93m1sdF2iSt318OxmYg6BUdTPQwJ_0w9UeQrAUnAaozHVd674";
  window.QUINIELA_FCM_TOKEN_COLLECTION = "fcmTokens";

  if (!window.firebase?.apps) {
    console.warn("Firebase SDK no está disponible todavía.");
    return;
  }

  const app = firebase.apps.length
    ? firebase.app()
    : firebase.initializeApp(window.QUINIELA_FIREBASE_CONFIG);

  const messaging = firebase.messaging.isSupported?.()
    ? firebase.messaging()
    : null;

  const db = firebase.firestore();

  window.QuinielaFirebase = {
    app,
    messaging,
    db,
    tokenCollection: window.QUINIELA_FCM_TOKEN_COLLECTION,
    vapidKey: window.QUINIELA_FCM_VAPID_KEY
  };
})();
