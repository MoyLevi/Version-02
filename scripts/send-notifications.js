import admin from "firebase-admin";
import Papa from "papaparse";
import { DateTime } from "luxon";

/**
 * Notificaciones automáticas Knockout - v4.2.8
 *
 * Ajustes rápidos:
 * - NOTIFICATION_MINUTES_BEFORE: minutos antes del partido. Ej. 15, 30, 60.
 * - NOTIFICATION_WINDOW_MINUTES: ventana de tolerancia. Ej. 5 significa:
 *   si MINUTOS_ANTES=15, enviará cuando falten entre 15 y 10 minutos.
 */
const KNOCKOUT_CSV_URL = process.env.KNOCKOUT_CSV_URL;
const APP_URL = process.env.APP_URL || "https://moylevi.github.io/Version-02/";
const TIME_ZONE = process.env.TIME_ZONE || "America/Mexico_City";

const MINUTOS_ANTES = Number(process.env.NOTIFICATION_MINUTES_BEFORE || 15);
const VENTANA_TOLERANCIA_MINUTOS = Number(process.env.NOTIFICATION_WINDOW_MINUTES || 5);

const TOKEN_COLLECTION = process.env.FCM_TOKEN_COLLECTION || "fcmTokens";
const SENT_COLLECTION = process.env.SENT_NOTIFICATION_COLLECTION || "sentNotifications";
const NOTIFICATION_TYPE = "match-reminder";

const MESSAGE_TEMPLATE = {
  title: "🏆 Mundial FIFA 2026",
  body: "⚽ {LOCAL} vs {VISITANTE}\n⏰ Comienza en {MINUTOS} minutos.\n📍 {LUGAR}\n🎯 ¡Aún estás a tiempo de registrar tus pronósticos!"
};

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

function normalize(value) {
  return String(value || "").trim();
}

function isActiveMatch(row) {
  const activo = normalize(row.Activo).toUpperCase();
  const status = normalize(row.Status).toLowerCase();
  return activo === "SI" && !status.includes("finalizado");
}

function getMatchId(row) {
  return normalize(row.IDPartido) || normalize(row.ID) || normalize(row.Num);
}

function parseCdmxDate(row) {
  const fechaHora = normalize(row.FechaHora);
  if (!fechaHora) return null;

  const date = DateTime.fromFormat(fechaHora, "yyyy-MM-dd HH:mm", { zone: TIME_ZONE });
  return date.isValid ? date : null;
}

function replaceTemplate(template, values) {
  return template.replace(/\{([A-Z_]+)\}/g, (_, key) => values[key] ?? "");
}

function getTeamNames(row) {
  const local = normalize(row.Local) || normalize(row.Loc) || "Equipo local";
  const visitante = normalize(row.Visitante) || normalize(row.Visita) || normalize(row.Vis) || "Equipo visitante";
  return { local, visitante };
}

function buildMessage(row, matchId, matchTime) {
  const { local, visitante } = getTeamNames(row);
  const lugar = normalize(row.Lugar) || "Sede por confirmar";
  const stage = normalize(row.Stage);
  const hora = matchTime.setZone(TIME_ZONE).toFormat("HH:mm");

  const values = {
    LOCAL: local,
    VISITANTE: visitante,
    LUGAR: lugar,
    STAGE: stage,
    HORA: hora,
    MINUTOS: String(MINUTOS_ANTES)
  };

  const title = replaceTemplate(MESSAGE_TEMPLATE.title, values);
  const body = replaceTemplate(MESSAGE_TEMPLATE.body, values);

  return {
    title,
    body,
    data: {
      type: NOTIFICATION_TYPE,
      matchId,
      local,
      visitante,
      lugar,
      stage,
      hora,
      minutosAntes: String(MINUTOS_ANTES),
      url: APP_URL,
      title,
      body
    }
  };
}

async function fetchKnockoutRows() {
  if (!KNOCKOUT_CSV_URL) throw new Error("Falta KNOCKOUT_CSV_URL.");

  const separator = KNOCKOUT_CSV_URL.includes("?") ? "&" : "?";
  const response = await fetch(`${KNOCKOUT_CSV_URL}${separator}_ts=${Date.now()}`, { cache: "no-store" });
  if (!response.ok) throw new Error(`No se pudo leer Knockout CSV: HTTP ${response.status}`);

  const csv = await response.text();
  const parsed = Papa.parse(csv, {
    header: true,
    skipEmptyLines: true,
    transformHeader: h => String(h || "").trim()
  });

  if (parsed.errors?.length) {
    console.warn("Advertencias al parsear CSV:", parsed.errors.slice(0, 3));
  }

  return parsed.data || [];
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

function chunk(array, size) {
  const chunks = [];
  for (let index = 0; index < array.length; index += size) {
    chunks.push(array.slice(index, index + size));
  }
  return chunks;
}

async function getActiveTokenDocs(db) {
  const snapshot = await db.collection(TOKEN_COLLECTION).get();
  const docs = snapshot.docs
    .map(doc => {
      const data = doc.data() || {};
      const token = String(data.token || doc.id || "").trim();
      const enabled = data.enabled !== false;
      return { id: doc.id, ref: doc.ref, token, enabled, data };
    })
    .filter(item => item.token && item.enabled);

  console.log(`[INFO] Documentos en ${TOKEN_COLLECTION}: ${snapshot.size}`);
  console.log(`[INFO] Tokens activos utilizables: ${docs.length}`);
  return docs;
}

function getSentId(matchId) {
  return `${NOTIFICATION_TYPE}-${matchId}-${MINUTOS_ANTES}min`;
}

function getMinutesUntil(matchTime, now) {
  return matchTime.diff(now, "minutes").minutes;
}

function isInsideNotificationWindow(matchTime, now) {
  const minutesUntil = getMinutesUntil(matchTime, now);
  return minutesUntil <= MINUTOS_ANTES && minutesUntil > (MINUTOS_ANTES - VENTANA_TOLERANCIA_MINUTOS);
}

async function disableInvalidTokens(invalidTokenDocs) {
  if (!invalidTokenDocs.length) return;

  await Promise.all(invalidTokenDocs.map(item =>
    item.ref.set({
      enabled: false,
      disabledAt: admin.firestore.FieldValue.serverTimestamp(),
      disabledReason: "invalid-token-match-reminder-v4.2.8"
    }, { merge: true })
  ));

  console.log(`[WARN] Tokens inválidos desactivados: ${invalidTokenDocs.length}`);
}

async function sendReminder(db, messaging, row, matchTime, now) {
  const matchId = getMatchId(row);
  if (!matchId) return { skipped: true, reason: "sin IDPartido" };

  const sentId = getSentId(matchId);
  const sentRef = db.collection(SENT_COLLECTION).doc(sentId);
  const sent = await sentRef.get();

  if (sent.exists) {
    return { skipped: true, reason: "ya enviado", matchId, sentId };
  }

  const tokenDocs = await getActiveTokenDocs(db);
  if (!tokenDocs.length) return { skipped: true, reason: "sin tokens", matchId, sentId };

  const message = buildMessage(row, matchId, matchTime);
  const cleanAppUrl = APP_URL.replace(/\/$/, "");
  const invalidTokenDocs = [];

  let successCount = 0;
  let failureCount = 0;

  console.log(`[INFO] Enviando: ${message.data.local} vs ${message.data.visitante}`);
  console.log(`[INFO] Partido CDMX: ${matchTime.toFormat("yyyy-MM-dd HH:mm")}`);
  console.log(`[INFO] Faltan aprox: ${Math.round(getMinutesUntil(matchTime, now))} minutos`);
  console.log(`[INFO] sentId: ${sentId}`);

  for (const group of chunk(tokenDocs, CHUNK_SIZE)) {
    const tokens = group.map(item => item.token);

    const response = await messaging.sendEachForMulticast({
      tokens,
      notification: {
        title: message.title,
        body: message.body
      },
      data: {
        ...message.data,
        sentId
      },
      webpush: {
        fcmOptions: {
          link: APP_URL
        },
        notification: {
          icon: `${cleanAppUrl}/icons/icon-192.png`,
          badge: `${cleanAppUrl}/icons/icon-192.png`,
          tag: `quiniela-${sentId}`,
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
        console.log(`[OK] Token ${shortToken}: enviado correctamente.`);
        return;
      }

      const code = item.error.code || "sin-codigo";
      const errorMessage = item.error.message || "";
      console.warn(`[ERROR] Token ${shortToken}: ${code} ${errorMessage}`);

      if (isTokenInvalidError(item.error)) {
        invalidTokenDocs.push(tokenDoc);
      }
    });
  }

  await disableInvalidTokens(invalidTokenDocs);

  await sentRef.set({
    type: NOTIFICATION_TYPE,
    matchId,
    sentId,
    minutesBefore: MINUTOS_ANTES,
    windowMinutes: VENTANA_TOLERANCIA_MINUTOS,
    local: message.data.local,
    visitante: message.data.visitante,
    lugar: message.data.lugar,
    stage: message.data.stage,
    matchTime: matchTime.toISO(),
    sentAt: admin.firestore.FieldValue.serverTimestamp(),
    successCount,
    failureCount,
    totalTokens: tokenDocs.length,
    invalidTokens: invalidTokenDocs.length
  });

  console.log(`[OK] Resumen ${matchId}: ${successCount} enviados, ${failureCount} fallidos, ${invalidTokenDocs.length} inválidos.`);
  return { skipped: false, matchId, sentId, successCount, failureCount, invalidTokens: invalidTokenDocs.length };
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
  const rows = await fetchKnockoutRows();
  const now = DateTime.now().setZone(TIME_ZONE);

  console.log(`[INFO] Hora actual CDMX: ${now.toFormat("yyyy-MM-dd HH:mm:ss")}`);
  console.log(`[INFO] Minutos antes configurados: ${MINUTOS_ANTES}`);
  console.log(`[INFO] Ventana de tolerancia: ${VENTANA_TOLERANCIA_MINUTOS} minutos`);
  console.log(`[INFO] Revisando ${rows.length} partidos Knockout...`);

  const activeRows = rows
    .filter(isActiveMatch)
    .map(row => ({ row, matchTime: parseCdmxDate(row) }))
    .filter(item => item.matchTime);

  console.log(`[INFO] Partidos activos con FechaHora válida: ${activeRows.length}`);

  const candidates = activeRows.filter(({ matchTime }) => isInsideNotificationWindow(matchTime, now));

  if (!candidates.length) {
    console.log(`[INFO] No hay partidos dentro de la ventana de notificación (${MINUTOS_ANTES} a ${MINUTOS_ANTES - VENTANA_TOLERANCIA_MINUTOS} minutos antes).`);

    const nextMatch = activeRows
      .filter(({ matchTime }) => matchTime > now)
      .sort((a, b) => a.matchTime.toMillis() - b.matchTime.toMillis())[0];

    if (nextMatch) {
      const { local, visitante } = getTeamNames(nextMatch.row);
      console.log(`[INFO] Próximo partido activo: ${local} vs ${visitante} | ${nextMatch.matchTime.toFormat("yyyy-MM-dd HH:mm")} CDMX | faltan ${Math.round(getMinutesUntil(nextMatch.matchTime, now))} minutos.`);
    }

    return;
  }

  console.log(`[INFO] Candidatos para notificar: ${candidates.length}`);

  for (const { row, matchTime } of candidates) {
    const result = await sendReminder(db, messaging, row, matchTime, now);
    console.log("[INFO] Resultado:", result);
  }
}

main().catch(error => {
  console.error("[FATAL]", error);
  process.exit(1);
});
