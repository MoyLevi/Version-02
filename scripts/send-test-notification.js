import admin from "firebase-admin";

const APP_URL = process.env.APP_URL || "https://moylevi.github.io/Version-02/";
const TOKEN_COLLECTION = process.env.FCM_TOKEN_COLLECTION || "fcmTokens";
const DISABLE_INVALID_TOKENS = String(process.env.DISABLE_INVALID_TOKENS || "false").toLowerCase() === "true";
const CHUNK_SIZE = 500;

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

function isTokenInvalidError(error) {
  const code = String(error?.code || "");
  const message = String(error?.message || "");
  return (
    code === "messaging/registration-token-not-registered" ||
    code === "messaging/invalid-registration-token" ||
    code.includes("registration-token-not-registered") ||
    code.includes("invalid-registration-token") ||
    message.includes("registration-token-not-registered") ||
    message.includes("Requested entity was not found")
  );
}

async function getActiveTokenDocs(db) {
  const snapshot = await db.collection(TOKEN_COLLECTION).get();

  const docs = snapshot.docs
    .map(doc => {
      const data = doc.data() || {};
      const token = String(data.token || doc.id || "").trim();
      const enabled = data.enabled !== false; // acepta tokens viejos sin enabled=true
      return { id: doc.id, ref: doc.ref, token, enabled, data };
    })
    .filter(item => item.token && item.enabled);

  console.log(`Documentos en ${TOKEN_COLLECTION}: ${snapshot.size}`);
  console.log(`Tokens activos utilizables: ${docs.length}`);

  if (snapshot.size && !docs.length) {
    console.log("Hay documentos, pero todos están deshabilitados o sin token válido.");
  }

  return docs;
}

function chunk(array, size) {
  const chunks = [];
  for (let index = 0; index < array.length; index += size) {
    chunks.push(array.slice(index, index + size));
  }
  return chunks;
}

async function markInvalidTokens(db, invalidTokenDocs, reason) {
  if (!DISABLE_INVALID_TOKENS) {
    console.log(`Tokens inválidos detectados: ${invalidTokenDocs.length}. No se desactivan porque DISABLE_INVALID_TOKENS=false.`);
    return;
  }

  await Promise.all(invalidTokenDocs.map(item =>
    item.ref.set({
      enabled: false,
      disabledAt: admin.firestore.FieldValue.serverTimestamp(),
      disabledReason: reason
    }, { merge: true })
  ));

  console.log(`Tokens inválidos desactivados: ${invalidTokenDocs.length}`);
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
  const tokenDocs = await getActiveTokenDocs(db);

  if (!tokenDocs.length) {
    console.log("No hay tokens activos en Firestore. Abre la PWA, pulsa Activar avisos y vuelve a ejecutar esta prueba.");
    return;
  }

  const title = process.env.TEST_PUSH_TITLE || "🔔 Prueba Quiniela Mundial 2026";
  const body = process.env.TEST_PUSH_BODY || "Si ves esto, Firebase Push ya funciona correctamente.";
  const cleanAppUrl = APP_URL.replace(/\/$/, "");

  let successCount = 0;
  let failureCount = 0;
  const invalidTokenDocs = [];

  for (const group of chunk(tokenDocs, CHUNK_SIZE)) {
    const tokens = group.map(item => item.token);

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

    successCount += response.successCount;
    failureCount += response.failureCount;

    response.responses.forEach((item, index) => {
      const tokenDoc = group[index];
      const shortToken = `${tokenDoc.token.slice(0, 12)}...${tokenDoc.token.slice(-8)}`;

      if (!item.error) {
        console.log(`✅ Token ${shortToken}: enviado correctamente.`);
        return;
      }

      const code = item.error.code || "sin-codigo";
      const message = item.error.message || "";
      console.warn(`❌ Token ${shortToken}: ${code} ${message}`);

      if (isTokenInvalidError(item.error)) {
        invalidTokenDocs.push(tokenDoc);
      }
    });
  }

  console.log(`Push de prueba terminado. Éxitos: ${successCount}. Fallos: ${failureCount}.`);

  if (invalidTokenDocs.length) {
    await markInvalidTokens(db, invalidTokenDocs, "invalid-token-test-push");
  }
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
