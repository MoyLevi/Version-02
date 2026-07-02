(() => {
  const APP_VERSION = "4.2.8";
  const VERSION_URL = `./version.json?ts=${Date.now()}`;
  const INSTALL_HELP_KEY = "quiniela-pwa-install-help-dismissed";
  const NOTIFICATION_KEY = "quiniela-pwa-local-notifications-enabled";
  const NOTIFIED_MATCHES_KEY = "quiniela-pwa-notified-matches";
  const NOTIFICATION_PROMPT_DISMISSED_KEY = "quiniela-pwa-notification-prompt-dismissed";
  const POST_UPDATE_NOTIFY_PROMPT_KEY = "quiniela-pwa-show-notifications-after-update";
  const UPDATE_RELOAD_KEY = "quiniela-pwa-update-reload-v4.2.8";
  const UPDATE_DISMISSED_VERSION_KEY = "quiniela-pwa-update-dismissed-version";
  const UPDATE_APPLIED_VERSION_KEY = "quiniela-pwa-update-applied-version";
  const PWA_MIGRATION_KEY = "quiniela-pwa-migration-v4.2.8";
  const FCM_TOKEN_KEY = "quiniela-fcm-token";
  const FCM_TOKEN_CONFIRMED_VERSION_KEY = "quiniela-fcm-token-confirmed-version";
  const FCM_REGISTERING_KEY = "quiniela-fcm-registering";

  let deferredInstallPrompt = null;
  let swRegistration = null;
  let refreshing = false;
  let reminderTimer = null;
  let activePanelMode = "";
  let activeUpdateVersion = "";

  function isStandalone() {
    return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
  }

  function isIOS() {
    return /iphone|ipad|ipod/i.test(navigator.userAgent || "");
  }

  function isSafariIOS() {
    return isIOS() && /safari/i.test(navigator.userAgent || "") && !/crios|fxios|edgios/i.test(navigator.userAgent || "");
  }

  function compareVersions(a, b) {
    const pa = String(a).split(".").map(n => parseInt(n, 10) || 0);
    const pb = String(b).split(".").map(n => parseInt(n, 10) || 0);
    const len = Math.max(pa.length, pb.length);
    for (let i = 0; i < len; i++) {
      if ((pa[i] || 0) > (pb[i] || 0)) return 1;
      if ((pa[i] || 0) < (pb[i] || 0)) return -1;
    }
    return 0;
  }

  function createPwaPanel() {
    if (document.getElementById("pwaPanel")) return;

    const panel = document.createElement("section");
    panel.id = "pwaPanel";
    panel.className = "pwa-panel pwa-hidden";
    panel.setAttribute("aria-live", "polite");
    panel.innerHTML = `
      <div class="pwa-panel-card">
        <button type="button" id="pwaCloseBtn" class="pwa-close" aria-label="Cerrar aviso">×</button>
        <div class="pwa-badge">PWA v${APP_VERSION}</div>
        <h2 id="pwaTitle">Instala la Quiniela</h2>
        <p id="pwaMessage">Accede más rápido desde tu dispositivo y recibe mejoras automáticas.</p>

        <div id="pwaIosHelp" class="pwa-ios-help pwa-hidden">
          <strong>En iPhone se instala desde Safari:</strong>
          <span>Compartir → Agregar a pantalla de inicio → Agregar.</span>
        </div>

        <div class="pwa-actions">
          <button type="button" id="pwaInstallBtn" class="pwa-primary">Instalar app</button>
          <button type="button" id="pwaUpdateBtn" class="pwa-primary pwa-hidden">Actualizar ahora</button>
          <button type="button" id="pwaNotifyBtn" class="pwa-secondary">Activar avisos</button>
          <button type="button" id="pwaLaterBtn" class="pwa-secondary">Después</button>
        </div>

        <p class="pwa-small" id="pwaSmallNote">Las actualizaciones se aplican sin reinstalar la app.</p>
      </div>
    `;
    document.body.appendChild(panel);

    document.getElementById("pwaCloseBtn")?.addEventListener("click", () => {
      dismissVisiblePanel();
      hidePanel();
    });
    document.getElementById("pwaLaterBtn")?.addEventListener("click", () => {
      dismissVisiblePanel();
      hidePanel();
    });
    document.getElementById("pwaInstallBtn")?.addEventListener("click", installApp);
    document.getElementById("pwaUpdateBtn")?.addEventListener("click", applyUpdate);
    document.getElementById("pwaNotifyBtn")?.addEventListener("click", enableNotifications);
  }

  function showPanel({ title, message, mode = "install", iosHelp = false, smallNote = "", updateVersion = "" }) {
    createPwaPanel();

    activePanelMode = mode;
    activeUpdateVersion = updateVersion || "";

    document.getElementById("pwaTitle").textContent = title;
    document.getElementById("pwaMessage").textContent = message;
    document.getElementById("pwaSmallNote").textContent = smallNote || "Las actualizaciones se aplican sin reinstalar la app.";

    document.getElementById("pwaInstallBtn")?.classList.toggle("pwa-hidden", mode !== "install" || !deferredInstallPrompt);
    document.getElementById("pwaUpdateBtn")?.classList.toggle("pwa-hidden", mode !== "update");
    document.getElementById("pwaNotifyBtn")?.classList.toggle("pwa-hidden", mode !== "notify");
    document.getElementById("pwaIosHelp")?.classList.toggle("pwa-hidden", !iosHelp);
    document.getElementById("pwaPanel")?.classList.remove("pwa-hidden");
  }

  function dismissVisiblePanel() {
    if (activePanelMode === "update" && activeUpdateVersion) {
      sessionStorage.setItem(UPDATE_DISMISSED_VERSION_KEY, activeUpdateVersion);
      return;
    }

    if (activePanelMode === "notify") {
      localStorage.setItem(NOTIFICATION_PROMPT_DISMISSED_KEY, "1");
      return;
    }

    localStorage.setItem(INSTALL_HELP_KEY, "1");
  }

  function dismissVisibleUpdate() {
    if (activePanelMode === "update" && activeUpdateVersion) {
      sessionStorage.setItem(UPDATE_DISMISSED_VERSION_KEY, activeUpdateVersion);
    }
  }

  function wasUpdateDismissed(version) {
    return sessionStorage.getItem(UPDATE_DISMISSED_VERSION_KEY) === String(version || "");
  }

  function markUpdateApplied(version) {
    const safeVersion = String(version || APP_VERSION);
    localStorage.setItem(UPDATE_APPLIED_VERSION_KEY, safeVersion);
    sessionStorage.setItem(UPDATE_APPLIED_VERSION_KEY, safeVersion);
  }

  function wasUpdateApplied(version) {
    const safeVersion = String(version || APP_VERSION);
    return localStorage.getItem(UPDATE_APPLIED_VERSION_KEY) === safeVersion ||
      sessionStorage.getItem(UPDATE_APPLIED_VERSION_KEY) === safeVersion;
  }

  function shouldShowUpdatePrompt(version) {
    const safeVersion = String(version || APP_VERSION);
    return !wasUpdateDismissed(safeVersion) && !wasUpdateApplied(safeVersion);
  }

  function hidePanel() {
    document.getElementById("pwaPanel")?.classList.add("pwa-hidden");
  }

  async function installApp() {
    if (!deferredInstallPrompt) {
      showPanel({
        title: "Instalación manual",
        message: isIOS() ? "En iPhone usa Safari y el botón Compartir." : "Usa el menú del navegador para instalar la app.",
        mode: "manual",
        iosHelp: isIOS(),
        smallNote: "En Android y PC Chrome suele mostrar la opción de instalación automáticamente."
      });
      return;
    }

    deferredInstallPrompt.prompt();
    await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
    hidePanel();
  }

  async function applyUpdate() {
    if (refreshing) return;

    refreshing = true;
    const versionBeingApplied = activeUpdateVersion || APP_VERSION;
    markUpdateApplied(versionBeingApplied);
    sessionStorage.setItem(UPDATE_RELOAD_KEY, "1");
    sessionStorage.setItem(POST_UPDATE_NOTIFY_PROMPT_KEY, "1");
    hidePanel();

    const btn = document.getElementById("pwaUpdateBtn");
    if (btn) {
      btn.disabled = true;
      btn.textContent = "Actualizando...";
    }

    try {
      if (swRegistration?.waiting) {
        swRegistration.waiting.postMessage({ type: "SKIP_WAITING" });
        return;
      }

      if (swRegistration) {
        await swRegistration.update();
      }
    } catch (error) {
      console.warn("No se pudo aplicar la actualización PWA:", error);
    }

    window.location.reload();
  }

  function shouldShowInstallHelp() {
    return !isStandalone() && localStorage.getItem(INSTALL_HELP_KEY) !== "1";
  }

  function showInstallHelpIfNeeded() {
    if (!shouldShowInstallHelp()) return;
    if (document.getElementById("pwaPanel") && !document.getElementById("pwaPanel").classList.contains("pwa-hidden")) return;

    if (deferredInstallPrompt) {
      showPanel({
        title: "Instala la Quiniela",
        message: "Ábrela como app, sin barra del navegador y con acceso directo desde tu pantalla.",
        mode: "install",
        smallNote: "Es gratis y no necesitas descargar nada desde una tienda."
      });
      return;
    }

    if (isIOS()) {
      showPanel({
        title: "Instala la Quiniela en iPhone",
        message: isSafariIOS() ? "Toca Compartir y después Agregar a pantalla de inicio." : "Abre esta página en Safari para poder agregarla a la pantalla de inicio.",
        mode: "manual",
        iosHelp: true,
        smallNote: "En iPhone la instalación se hace desde Safari."
      });
      return;
    }

    showPanel({
      title: "Instala la Quiniela",
      message: "Si Chrome no muestra el botón automático, usa el menú del navegador y elige Instalar app o Agregar a pantalla principal.",
      mode: "manual",
      smallNote: "Este aviso no bloquea la app. Puedes cerrarlo y seguir usando la quiniela."
    });
  }
  function shouldShowNotificationPrompt({ force = false } = {}) {
    if (!("Notification" in window)) return false;
    if (Notification.permission === "denied") return false;

    const dismissed = localStorage.getItem(NOTIFICATION_PROMPT_DISMISSED_KEY) === "1";
    const confirmedVersion = localStorage.getItem(FCM_TOKEN_CONFIRMED_VERSION_KEY);
    const hasToken = Boolean(localStorage.getItem(FCM_TOKEN_KEY));

    if (force) return true;
    if (dismissed) return false;

    // Si aún no se ha pedido permiso, mostramos el aviso normal.
    if (Notification.permission === "default") return true;

    // Si el permiso ya fue concedido pero no tenemos token confirmado para esta versión,
    // mostramos el botón para registrar/reparar avisos sin pedir permiso otra vez.
    if (Notification.permission === "granted") {
      return !hasToken || confirmedVersion !== APP_VERSION;
    }

    return false;
  }

  function showNotificationPromptIfNeeded({ force = false } = {}) {
    if (activePanelMode === "update") return false;
    if (!shouldShowNotificationPrompt({ force })) return false;

    if (force) {
      localStorage.removeItem(NOTIFICATION_PROMPT_DISMISSED_KEY);
    }

    const alreadyGranted = ("Notification" in window) && Notification.permission === "granted";

    showPanel({
      title: alreadyGranted ? "Reactivar avisos de partidos" : "Activa avisos de partidos",
      message: alreadyGranted
        ? "El permiso ya está concedido. Toca el botón para registrar este dispositivo nuevamente en Firebase."
        : "Te avisaremos 15 minutos antes de cada partido activo de la quiniela.",
      mode: "notify",
      smallNote: alreadyGranted
        ? "Esto repara tokens vencidos después de reinstalar o borrar datos."
        : "Puedes aceptar ahora o dejarlo para después. No se enviará spam, palabra de PWA decente."
    });
    return true;
  }

  function consumePostUpdateNotificationPrompt() {
    const shouldShow = sessionStorage.getItem(POST_UPDATE_NOTIFY_PROMPT_KEY) === "1";
    sessionStorage.removeItem(POST_UPDATE_NOTIFY_PROMPT_KEY);
    return shouldShow;
  }

  function runPwaMigration() {
    if (localStorage.getItem(PWA_MIGRATION_KEY) === "1") return;

    // v4.2.8: limpiamos banderas viejas que podían dejar al usuario en limbo:
    // sin prompt de instalación y sin prompt para reparar avisos.
    localStorage.removeItem(INSTALL_HELP_KEY);
    localStorage.removeItem(NOTIFICATION_PROMPT_DISMISSED_KEY);
    localStorage.removeItem("quiniela-pwa-update-reload-v4.2.4");

    // No borramos NOTIFICATION_KEY ni FCM_TOKEN_KEY: si el dispositivo está bien, se conserva.
    localStorage.setItem(PWA_MIGRATION_KEY, "1");
  }


  async function checkForNewVersion() {
    try {
      const response = await fetch(VERSION_URL, { cache: "no-store" });
      if (!response.ok) return;
      const info = await response.json();

      if (info?.version && compareVersions(info.version, APP_VERSION) > 0 && shouldShowUpdatePrompt(info.version)) {
        showPanel({
          title: `Nueva versión ${info.version}`,
          message: "Ya hay una actualización lista. Puedes aplicarla sin reinstalar la app.",
          mode: "update",
          updateVersion: info.version,
          smallNote: Array.isArray(info.notes) ? info.notes.slice(0, 2).join(" • ") : "Mejoras y correcciones disponibles."
        });
      }
    } catch (error) {
      console.warn("No se pudo revisar version.json:", error);
    }
  }

  function getNotifiedMatches() {
    try {
      return JSON.parse(localStorage.getItem(NOTIFIED_MATCHES_KEY) || "[]");
    } catch (_) {
      return [];
    }
  }

  function setNotifiedMatches(ids) {
    localStorage.setItem(NOTIFIED_MATCHES_KEY, JSON.stringify([...new Set(ids)].slice(-150)));
  }

  function parseMatchDate(partido) {
    const fecha = partido?.fecha || partido?.Fecha || "";
    const hora = partido?.hora || partido?.Hora || "";
    const fechaMatch = String(fecha).match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    const horaMatch = String(hora).match(/(\d{1,2}):(\d{2})/);

    if (!fechaMatch || !horaMatch) return null;

    const day = Number(fechaMatch[1]);
    const month = Number(fechaMatch[2]) - 1;
    const year = Number(fechaMatch[3]);
    const hour = Number(horaMatch[1]);
    const minute = Number(horaMatch[2]);

    const date = new Date(year, month, day, hour, minute, 0, 0);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  function getUpcomingMatches() {
    const base = [];
    if (Array.isArray(window.partidos)) base.push(...window.partidos);
    if (Array.isArray(window.knockout)) base.push(...window.knockout);
    if (Array.isArray(partidos)) base.push(...partidos);
    if (Array.isArray(knockout)) base.push(...knockout);

    const now = Date.now();
    return base
      .filter(p => !String(p.status || "").toLowerCase().includes("final"))
      .map(p => ({ ...p, fechaInicio: parseMatchDate(p) }))
      .filter(p => p.fechaInicio && p.fechaInicio.getTime() > now)
      .sort((a, b) => a.fechaInicio - b.fechaInicio);
  }

  async function showLocalNotification(title, body) {
    if (!("Notification" in window) || Notification.permission !== "granted") return;

    const options = {
      body,
      icon: "./icons/icon-192.png",
      badge: "./icons/icon-192.png",
      tag: "quiniela-partido",
      renotify: true
    };

    if (swRegistration?.showNotification) {
      await swRegistration.showNotification(title, options);
    } else {
      new Notification(title, options);
    }
  }


  function isFirebaseReady() {
    return Boolean(window.QuinielaFirebase?.messaging && window.QuinielaFirebase?.db);
  }

  async function saveFcmToken(token) {
    if (!token || !window.QuinielaFirebase?.db) return false;

    const db = window.QuinielaFirebase.db;
    const collection = window.QuinielaFirebase.tokenCollection || "fcmTokens";

    await db.collection(collection).doc(token).set({
      token,
      enabled: true,
      appVersion: APP_VERSION,
      platform: navigator.platform || "",
      userAgent: navigator.userAgent || "",
      language: navigator.language || "es-MX",
      pageUrl: location.href,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    localStorage.setItem("quiniela-fcm-token", token);
    return true;
  }

  function withTimeout(promise, ms, message) {
    let timer;
    const timeout = new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error(message || "Operación agotó el tiempo de espera.")), ms);
    });

    return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
  }

  async function registerFcmToken() {
    if (sessionStorage.getItem(FCM_REGISTERING_KEY) === "1") {
      console.info("Registro FCM ya en progreso; se evita llamada duplicada.");
      return localStorage.getItem(FCM_TOKEN_KEY) || "";
    }

    sessionStorage.setItem(FCM_REGISTERING_KEY, "1");

    try {
      if (!isFirebaseReady()) {
        throw new Error("Firebase Messaging o Firestore no está disponible.");
      }

      if (!swRegistration) {
        swRegistration = await navigator.serviceWorker.ready;
      }

      const messaging = window.QuinielaFirebase.messaging;
      const token = await withTimeout(
        messaging.getToken({
          vapidKey: window.QuinielaFirebase.vapidKey,
          serviceWorkerRegistration: swRegistration
        }),
        12000,
        "Firebase tardó demasiado en generar el token."
      );

      if (!token) {
        throw new Error("Firebase no regresó token para este dispositivo.");
      }

      await withTimeout(
        saveFcmToken(token),
        12000,
        "Firestore tardó demasiado en guardar el token."
      );

      localStorage.setItem(FCM_TOKEN_CONFIRMED_VERSION_KEY, APP_VERSION);

      if (!window.__quinielaFcmForegroundListener) {
        messaging.onMessage(payload => {
          const title = payload?.notification?.title || payload?.data?.title || "Quiniela Mundial 2026";
          const body = payload?.notification?.body || payload?.data?.body || "Nueva notificación disponible.";
          showLocalNotification(title, body);
        });
        window.__quinielaFcmForegroundListener = true;
      }

      return token;
    } finally {
      sessionStorage.removeItem(FCM_REGISTERING_KEY);
    }
  }

  function scheduleNextReminder() {
    clearTimeout(reminderTimer);

    if (localStorage.getItem(NOTIFICATION_KEY) !== "1") return;
    if (!("Notification" in window) || Notification.permission !== "granted") return;

    const notified = getNotifiedMatches();
    const upcoming = getUpcomingMatches();
    const next = upcoming.find(p => !notified.includes(String(p.id)));
    if (!next) return;

    const notifyAt = next.fechaInicio.getTime() - 15 * 60 * 1000;
    const delay = Math.max(0, notifyAt - Date.now());

    reminderTimer = setTimeout(async () => {
      const id = String(next.id);
      const local = next.local || next.Local || "Equipo local";
      const visita = next.visita || next.Visita || "Equipo visitante";
      await showLocalNotification("⚽ Partido por comenzar", `${local} vs ${visita} inicia en 15 minutos.`);
      setNotifiedMatches([...notified, id]);
      scheduleNextReminder();
    }, Math.min(delay, 24 * 60 * 60 * 1000));
  }

  async function enableNotifications() {
    if (!("Notification" in window)) {
      showPanel({
        title: "Avisos no disponibles",
        message: "Este navegador no permite notificaciones para esta app.",
        mode: "manual",
        smallNote: "En iPhone se requiere iOS compatible y que la app esté agregada a inicio."
      });
      return;
    }

    const permission = Notification.permission === "default"
      ? await Notification.requestPermission()
      : Notification.permission;

    if (permission === "granted") {
      localStorage.setItem(NOTIFICATION_KEY, "1");
      localStorage.removeItem(NOTIFICATION_PROMPT_DISMISSED_KEY);

      try {
        await registerFcmToken();
        scheduleNextReminder();
        showPanel({
          title: "Notificaciones Push activadas",
          message: "Este dispositivo ya quedó registrado para recibir avisos 15 minutos antes de los partidos.",
          mode: "manual",
          smallNote: "Los envíos automáticos se harán desde GitHub Actions leyendo la tabla Knockout."
        });
      } catch (error) {
        console.warn("No se pudo registrar FCM:", error);
        scheduleNextReminder();
        showPanel({
          title: "Avisos locales activados",
          message: "El permiso quedó activo, pero no se pudo registrar Firebase en este dispositivo.",
          mode: "manual",
          smallNote: "Revisa Firestore, los scripts de Firebase o prueba nuevamente después de publicar la versión."
        });
      }
    } else {
      showPanel({
        title: "Permiso no activado",
        message: "No se activaron las notificaciones. Puedes habilitarlas después desde el navegador o sistema.",
        mode: "manual",
        smallNote: "Sin permiso, la app no puede mostrar avisos."
      });
    }
  }

  window.addEventListener("beforeinstallprompt", event => {
    event.preventDefault();
    deferredInstallPrompt = event;
    showInstallHelpIfNeeded();
  });

  window.addEventListener("appinstalled", () => {
    deferredInstallPrompt = null;
    localStorage.setItem(INSTALL_HELP_KEY, "1");
    hidePanel();
  });

  navigator.serviceWorker?.addEventListener("controllerchange", () => {
    if (sessionStorage.getItem(UPDATE_RELOAD_KEY) !== "1") return;
    markUpdateApplied(activeUpdateVersion || APP_VERSION);
    sessionStorage.removeItem(UPDATE_RELOAD_KEY);
    window.location.reload();
  });

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", async () => {
      try {
        runPwaMigration();
        swRegistration = await navigator.serviceWorker.register("./service-worker.js", { scope: "./" });

        swRegistration.addEventListener("updatefound", () => {
          const newWorker = swRegistration.installing;
          if (!newWorker) return;

          newWorker.addEventListener("statechange", () => {
            if (newWorker.state === "installed" && navigator.serviceWorker.controller && shouldShowUpdatePrompt(APP_VERSION)) {
              showPanel({
                title: "Nueva versión lista",
                message: "Hay mejoras disponibles. Actualiza sin reinstalar la app.",
                mode: "update",
                updateVersion: APP_VERSION,
                smallNote: "La app se recargará una sola vez."
              });
            }
          });
        });

        if (swRegistration.waiting && navigator.serviceWorker.controller && shouldShowUpdatePrompt(APP_VERSION)) {
          showPanel({
            title: "Nueva versión lista",
            message: "Hay mejoras disponibles. Actualiza sin reinstalar la app.",
            mode: "update",
            updateVersion: APP_VERSION,
            smallNote: "La app se recargará una sola vez."
          });
        }

        await swRegistration.update();

        // Importante: no registramos Firebase automáticamente al cargar.
        // El token se registra/repara solo cuando el usuario toca "Activar avisos".
        // Así evitamos loops que puedan congelar la quiniela si FCM o Firestore fallan.

        const forceNotifyPromptAfterUpdate = consumePostUpdateNotificationPrompt();
        await checkForNewVersion();

        setTimeout(() => {
          if (forceNotifyPromptAfterUpdate) {
            showNotificationPromptIfNeeded({ force: true });
            return;
          }

          showNotificationPromptIfNeeded();
        }, 1200);

        setTimeout(showInstallHelpIfNeeded, 1800);
        setInterval(checkForNewVersion, 10 * 60 * 1000);
        setInterval(() => swRegistration?.update(), 15 * 60 * 1000);
        setTimeout(scheduleNextReminder, 3500);
        setInterval(scheduleNextReminder, 20 * 60 * 1000);
      } catch (error) {
        console.warn("No se pudo registrar el service worker:", error);
      }
    });
  } else {
    window.addEventListener("load", () => {
      runPwaMigration();
      setTimeout(showInstallHelpIfNeeded, 1400);
    });
  }

  window.QuinielaPWA = {
    version: APP_VERSION,
    checkForNewVersion,
    enableNotifications,
    registerFcmToken,
    scheduleNextReminder,
    showNotificationPromptIfNeeded
  };
})();
