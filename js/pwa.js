(() => {
  const APP_VERSION = "4.1.0";
  const VERSION_URL = `./version.json?ts=${Date.now()}`;
  const INSTALL_HELP_KEY = "quiniela-pwa-install-help-dismissed";
  const NOTIFICATION_KEY = "quiniela-pwa-local-notifications-enabled";
  const NOTIFIED_MATCHES_KEY = "quiniela-pwa-notified-matches";

  let deferredInstallPrompt = null;
  let swRegistration = null;
  let refreshing = false;
  let reminderTimer = null;

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

    document.getElementById("pwaCloseBtn")?.addEventListener("click", hidePanel);
    document.getElementById("pwaLaterBtn")?.addEventListener("click", () => {
      localStorage.setItem(INSTALL_HELP_KEY, "1");
      hidePanel();
    });
    document.getElementById("pwaInstallBtn")?.addEventListener("click", installApp);
    document.getElementById("pwaUpdateBtn")?.addEventListener("click", applyUpdate);
    document.getElementById("pwaNotifyBtn")?.addEventListener("click", enableNotifications);
  }

  function showPanel({ title, message, mode = "install", iosHelp = false, smallNote = "" }) {
    createPwaPanel();

    document.getElementById("pwaTitle").textContent = title;
    document.getElementById("pwaMessage").textContent = message;
    document.getElementById("pwaSmallNote").textContent = smallNote || "Las actualizaciones se aplican sin reinstalar la app.";

    document.getElementById("pwaInstallBtn")?.classList.toggle("pwa-hidden", mode !== "install" || !deferredInstallPrompt);
    document.getElementById("pwaUpdateBtn")?.classList.toggle("pwa-hidden", mode !== "update");
    document.getElementById("pwaIosHelp")?.classList.toggle("pwa-hidden", !iosHelp);
    document.getElementById("pwaPanel")?.classList.remove("pwa-hidden");
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
    if (swRegistration?.waiting) {
      swRegistration.waiting.postMessage({ type: "SKIP_WAITING" });
      return;
    }

    if (swRegistration) {
      await swRegistration.update();
    }

    window.location.reload();
  }

  function shouldShowInstallHelp() {
    return !isStandalone() && localStorage.getItem(INSTALL_HELP_KEY) !== "1";
  }

  function showInstallHelpIfNeeded() {
    if (!shouldShowInstallHelp()) return;

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
    }
  }

  async function checkForNewVersion() {
    try {
      const response = await fetch(VERSION_URL, { cache: "no-store" });
      if (!response.ok) return;
      const info = await response.json();

      if (info?.version && compareVersions(info.version, APP_VERSION) > 0) {
        showPanel({
          title: `Nueva versión ${info.version}`,
          message: "Ya hay una actualización lista. Puedes aplicarla sin reinstalar la app.",
          mode: "update",
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
      scheduleNextReminder();
      showPanel({
        title: "Avisos activados",
        message: "La app quedó preparada para avisarte antes de los partidos mientras esté activa o instalada.",
        mode: "manual",
        smallNote: "Para push reales aunque la app esté cerrada se conectará Firebase Cloud Messaging en una siguiente etapa."
      });
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
    if (refreshing) return;
    refreshing = true;
    window.location.reload();
  });

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", async () => {
      try {
        swRegistration = await navigator.serviceWorker.register("./service-worker.js", { scope: "./" });

        swRegistration.addEventListener("updatefound", () => {
          const newWorker = swRegistration.installing;
          if (!newWorker) return;

          newWorker.addEventListener("statechange", () => {
            if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
              showPanel({
                title: "Nueva versión lista",
                message: "Hay mejoras disponibles. Actualiza sin reinstalar la app.",
                mode: "update",
                smallNote: "La app se recargará una sola vez."
              });
            }
          });
        });

        if (swRegistration.waiting && navigator.serviceWorker.controller) {
          showPanel({
            title: "Nueva versión lista",
            message: "Hay mejoras disponibles. Actualiza sin reinstalar la app.",
            mode: "update",
            smallNote: "La app se recargará una sola vez."
          });
        }

        await swRegistration.update();
        await checkForNewVersion();
        setTimeout(showInstallHelpIfNeeded, 1400);
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
      setTimeout(showInstallHelpIfNeeded, 1400);
    });
  }

  window.QuinielaPWA = {
    version: APP_VERSION,
    checkForNewVersion,
    enableNotifications,
    scheduleNextReminder
  };
})();
