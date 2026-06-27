(() => {
  const VERSION = "4.0.0";
  let deferredInstallPrompt = null;

  function isStandalone() {
    return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
  }

  function createPwaBar() {
    if (document.getElementById("pwaBar")) return;

    const bar = document.createElement("div");
    bar.id = "pwaBar";
    bar.className = "pwa-bar pwa-hidden";
    bar.innerHTML = `
      <div class="pwa-bar-text">
        <strong>Quiniela v${VERSION}</strong>
        <span id="pwaBarMsg">Lista para instalarse como app.</span>
      </div>
      <div class="pwa-bar-actions">
        <button type="button" id="pwaInstallBtn">Instalar app</button>
        <button type="button" id="pwaRefreshBtn" class="pwa-hidden">Actualizar</button>
        <button type="button" id="pwaCloseBtn" aria-label="Cerrar aviso">×</button>
      </div>
    `;
    document.body.appendChild(bar);

    document.getElementById("pwaCloseBtn")?.addEventListener("click", () => {
      bar.classList.add("pwa-hidden");
    });

    document.getElementById("pwaInstallBtn")?.addEventListener("click", async () => {
      if (!deferredInstallPrompt) return;
      deferredInstallPrompt.prompt();
      await deferredInstallPrompt.userChoice;
      deferredInstallPrompt = null;
      bar.classList.add("pwa-hidden");
    });

    document.getElementById("pwaRefreshBtn")?.addEventListener("click", () => {
      window.location.reload();
    });
  }

  function showInstallBar() {
    if (isStandalone()) return;
    createPwaBar();
    document.getElementById("pwaBarMsg").textContent = "Puedes instalarla en tu dispositivo como app.";
    document.getElementById("pwaInstallBtn")?.classList.remove("pwa-hidden");
    document.getElementById("pwaRefreshBtn")?.classList.add("pwa-hidden");
    document.getElementById("pwaBar")?.classList.remove("pwa-hidden");
  }

  function showUpdateBar() {
    createPwaBar();
    document.getElementById("pwaBarMsg").textContent = "Hay una nueva versión disponible.";
    document.getElementById("pwaInstallBtn")?.classList.add("pwa-hidden");
    document.getElementById("pwaRefreshBtn")?.classList.remove("pwa-hidden");
    document.getElementById("pwaBar")?.classList.remove("pwa-hidden");
  }

  window.addEventListener("beforeinstallprompt", event => {
    event.preventDefault();
    deferredInstallPrompt = event;
    showInstallBar();
  });

  window.addEventListener("appinstalled", () => {
    deferredInstallPrompt = null;
    document.getElementById("pwaBar")?.classList.add("pwa-hidden");
  });

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", async () => {
      try {
        const registration = await navigator.serviceWorker.register("./service-worker.js", { scope: "./" });

        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          if (!newWorker) return;
          newWorker.addEventListener("statechange", () => {
            if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
              showUpdateBar();
            }
          });
        });

        if (registration.waiting && navigator.serviceWorker.controller) {
          showUpdateBar();
        }
      } catch (error) {
        console.warn("No se pudo registrar el service worker:", error);
      }
    });
  }
})();
