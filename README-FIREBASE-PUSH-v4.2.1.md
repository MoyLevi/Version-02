# Quiniela Mundial 2026 — Firebase Push v4.2.4

Esta versión deja preparada la PWA para recibir notificaciones Push reales con Firebase Cloud Messaging y enviar avisos automáticos 15 minutos antes de cada partido activo en la hoja Knockout.

## Qué trae

- `service-worker.js` con caché PWA + Firebase Cloud Messaging en segundo plano.
- `firebase-messaging-sw.js` como archivo estándar de compatibilidad para FCM.
- `js/firebase.js` con configuración pública de Firebase.
- `js/pwa.js` con solicitud de permisos y registro del token FCM en Firestore.
- `js/notifications.js` como puente público para activar/refrescar notificaciones.
- `scripts/send-notifications.js` para leer Knockout y enviar avisos.
- `.github/workflows/notificaciones-knockout.yml` para correr automáticamente cada 5 minutos.

## Secretos requeridos en GitHub

En el repositorio:

Settings > Secrets and variables > Actions > New repository secret

Crear solo este secreto:

`FIREBASE_SERVICE_ACCOUNT_JSON`

Pega ahí el JSON completo nuevo de Firebase Service Account. No lo subas al repositorio.

## Firestore

Colecciones usadas:

- `fcmTokens`: tokens de dispositivos registrados.
- `sentNotifications`: control anti-duplicados para no mandar dos veces el mismo aviso.

Reglas recomendadas:

```txt
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /fcmTokens/{token} {
      allow create, update: if request.resource.data.token == token
        && request.resource.data.enabled == true;
      allow read, delete: if false;
    }

    match /sentNotifications/{docId} {
      allow read, write: if false;
    }
  }
}
```

## Prueba rápida

1. Sube esta versión a GitHub Pages de pruebas.
2. Abre la app desde Android/Chrome.
3. Pulsa **Activar avisos**.
4. Acepta el permiso del navegador.
5. En Firebase > Firestore debe aparecer un documento en `fcmTokens`.

Cuando aparezca el token, la app ya está lista para recibir Push reales.

## Producción

El workflow apunta a pruebas:

`https://moylevi.github.io/Version-02/`

Cuando pases a producción, cambia `APP_URL` en `.github/workflows/notificaciones-knockout.yml` a:

`https://moylevi.github.io/quiniela-mundial-2026/`
