import admin from "firebase-admin";

const APP_URL = process.env.APP_URL || "https://moylevi.github.io/Version-02/";
const TOKEN_COLLECTION = process.env.FCM_TOKEN_COLLECTION || "fcmTokens";

function getServiceAccount() {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error("Faltan secretos de Firebase. Usa FIREBASE_SERVICE_ACCOUNT_JSON o FIREBASE_PROJECT_ID/FIREBASE_CLIENT_EMAIL/FIREBASE_PRIVATE_KEY.");
  }

  return {
    project_id: projectId,
    client_email: clientEmail,
    private_key: privateKey
  };
}

async function getTokens(db) {
  const snapshot = await db.collection(TOKEN_COLLECTION).where("enabled", "==", true).get();
  return snapshot.docs
    .map(doc => doc.data()?.token || doc.id)
    .filter(Boolean);
}

async function main() {
  const serviceAccount = getServiceAccount();

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  }

  const db = admin.firestore();
  const messaging = admin.messaging();
  const tokens = await getTokens(db);

  console.log(`Tokens activos encontrados: ${tokens.length}`);

  if (!tokens.length) {
    console.log("No hay tokens activos en Firestore. Abre la PWA, acepta notificaciones y vuelve a ejecutar esta prueba.");
    return;
  }

  const title = process.env.TEST_PUSH_TITLE || "🔔 Prueba Quiniela Mundial 2026";
  const body = process.env.TEST_PUSH_BODY || "Si ves esto, Firebase Push ya funciona correctamente.";
  const cleanAppUrl = APP_URL.replace(/\/$/, "");

  const response = await messaging.sendEachForMulticast({
    tokens,
    notification: { title, body },
    data: {
      type: "test-push",
      title,
      body,
      url: APP_URL,
      sentAt: new Date().toISOString()
    },
    webpush: {
      fcmOptions: { link: APP_URL },
      notification: {
        icon: `${cleanAppUrl}/icons/icon-192.png`,
        badge: `${cleanAppUrl}/icons/icon-192.png`,
        tag: `quiniela-test-${Date.now()}`,
        renotify: true
      }
    }
  });

  console.log(`Push de prueba enviado. Éxitos: ${response.successCount}. Fallos: ${response.failureCount}.`);

  const invalidTokens = [];
  response.responses.forEach((item, index) => {
    if (!item.error) return;
    const code = item.error.code || "";
    console.warn(`Token ${index + 1} falló: ${code} ${item.error.message || ""}`);
    if (code.includes("registration-token-not-registered") || code.includes("invalid-registration-token")) {
      invalidTokens.push(tokens[index]);
    }
  });

  if (invalidTokens.length) {
    await Promise.all(invalidTokens.map(token =>
      db.collection(TOKEN_COLLECTION).doc(token).set({
        enabled: false,
        disabledAt: admin.firestore.FieldValue.serverTimestamp(),
        disabledReason: "invalid-token-test-push"
      }, { merge: true })
    ));
    console.log(`Tokens inválidos desactivados: ${invalidTokens.length}`);
  }
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
