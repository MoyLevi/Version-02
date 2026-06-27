# Quiniela Mundial 2026 - PWA v4.1.0

## Mejoras integradas

- Pantalla de instalación más elegante para Android, PC e iPhone.
- Instrucciones especiales para iPhone: Safari → Compartir → Agregar a pantalla de inicio.
- Archivo `version.json` para controlar versiones publicadas.
- Detección automática de nuevas versiones al abrir la app y cada 10 minutos.
- Actualización sin reinstalar: cuando hay nuevo service worker, se muestra el botón **Actualizar ahora**.
- Limpieza automática de cachés anteriores desde `service-worker.js`.
- Base de notificaciones preparada desde `js/pwa.js`.
- Recordatorios locales: la app puede pedir permiso y programar avisos 15 minutos antes de partidos próximos mientras la app esté activa/instalada.

## Importante sobre notificaciones push reales

GitHub Pages es hosting estático. Puede servir la PWA, pero no puede enviar notificaciones push programadas desde servidor por sí solo. Para push reales aunque la app esté cerrada por completo, la siguiente etapa debe conectar un servicio como Firebase Cloud Messaging.

## Cómo publicar cambios normales

```bash
git add -A
git commit -m "Actualiza PWA v4.1.0"
git push
```

## Cada vez que publiques una nueva versión

Actualiza estos lugares:

1. `version.json`
2. `service-worker.js` → `APP_VERSION` y rutas `?v=`
3. `index.html` → rutas `?v=`
4. `js/pwa.js` → `APP_VERSION`
5. `js/utils.js` → footer visible

Esto fuerza a los dispositivos instalados a detectar la nueva versión sin reinstalar la app.
