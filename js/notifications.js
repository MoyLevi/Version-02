// Capa pública mínima para notificaciones.
// Mantiene desacoplado el botón/UI de la lógica interna de js/pwa.js.
(function () {
  async function enable() {
    if (!window.QuinielaPWA?.enableNotifications) {
      throw new Error("QuinielaPWA todavía no está lista.");
    }
    return window.QuinielaPWA.enableNotifications();
  }

  async function refreshToken() {
    if (!window.QuinielaPWA?.registerFcmToken) {
      throw new Error("QuinielaPWA todavía no está lista.");
    }
    return window.QuinielaPWA.registerFcmToken();
  }

  window.QuinielaNotifications = {
    enable,
    refreshToken
  };
})();
