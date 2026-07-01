import admin from "firebase-admin";
import Papa from "papaparse";
import { DateTime } from "luxon";

const KNOCKOUT_CSV_URL = process.env.KNOCKOUT_CSV_URL;
const APP_URL = process.env.APP_URL || "https://moylevi.github.io/Version-02/";
const TIME_ZONE = process.env.TIME_ZONE || "America/Mexico_City";
const MINUTES_BEFORE = Number(process.env.NOTIFICATION_MINUTES_BEFORE || 15);
const TOKEN_COLLECTION = process.env.FCM_TOKEN_COLLECTION || "fcmTokens";
const SENT_COLLECTION = process.env.SENT_NOTIFICATION_COLLECTION || "sentNotifications";

function getServiceAccount() {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    return JSON.parse(raw);
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error("Faltan secretos de Firebase: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL y FIREBASE_PRIVATE_KEY.");
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

async function fetchKnockoutRows() {
  if (!KNOCKOUT_CSV_URL) throw new Error("Falta KNOCKOUT_CSV_URL.");

  const response = await fetch(`${KNOCKOUT_CSV_URL}&_ts=${Date.now()}`, { cache: "no-store" });
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

async function getTokens(db) {
  const snapshot = await db.collection(TOKEN_COLLECTION).where("enabled", "==", true).get();
  return snapshot.docs
    .map(doc => doc.data()?.token || doc.id)
    .filter(Boolean);
}

function buildMessage(row, matchId, matchTime) {
  const local = normalize(row.Local) || normalize(row.Loc) || "Equipo local";
  const visitante = normalize(row.Visitante) || normalize(row.Visita) || normalize(row.Vis) || "Equipo visitante";
  const lugar = normalize(row.Lugar);
  const stage = normalize(row.Stage);
  const hora = matchTime.setZone(TIME_ZONE).toFormat("HH:mm");

  return {
    title: "⚽ Partido por comenzar",
    body: `${local} vs ${visitante} inicia en 15 minutos (${hora} CDMX).${lugar ? ` Sede: ${lugar}.` : ""}`,
    data: {
      type: "match-reminder",
      matchId,
      local,
      visitante,
      lugar,
      stage,
      url: APP_URL,
      title: "⚽ Partido por comenzar",
      body: `${local} vs ${visitante} inicia en 15 minutos.`
    }
  };
}

async function sendReminder(db, messaging, row, matchTime) {
  const matchId = getMatchId(row);
  if (!matchId) return { skipped: true, reason: "sin IDPartido" };

  const sentId = `${matchId}-${MINUTES_BEFORE}min`;
  const sentRef = db.collection(SENT_COLLECTION).doc(sentId);
  const sent = await sentRef.get();
  if (sent.exists) return { skipped: true, reason: "ya enviado", matchId };

  const tokens = await getTokens(db);
  if (!tokens.length) return { skipped: true, reason: "sin tokens", matchId };

  const message = buildMessage(row, matchId, matchTime);
  const response = await messaging.sendEachForMulticast({
    tokens,
    notification: {
      title: message.title,
      body: message.body
    },
    data: message.data,
    webpush: {
      fcmOptions: {
        link: APP_URL
      },
      notification: {
        icon: `${APP_URL.replace(/\/$/, "")}/icons/icon-192.png`,
        badge: `${APP_URL.replace(/\/$/, "")}/icons/icon-192.png`,
        tag: `quiniela-${sentId}`,
        renotify: true
      }
    }
  });

  const invalidTokens = [];
  response.responses.forEach((item, index) => {
    const code = item.error?.code || "";
    if (code.includes("registration-token-not-registered") || code.includes("invalid-registration-token")) {
      invalidTokens.push(tokens[index]);
    }
  });

  await Promise.all(invalidTokens.map(token =>
    db.collection(TOKEN_COLLECTION).doc(token).set({ enabled: false, disabledAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true })
  ));

  await sentRef.set({
    matchId,
    sentId,
    local: message.data.local,
    visitante: message.data.visitante,
    matchTime: matchTime.toISO(),
    sentAt: admin.firestore.FieldValue.serverTimestamp(),
    successCount: response.successCount,
    failureCount: response.failureCount,
    totalTokens: tokens.length
  });

  return { skipped: false, matchId, successCount: response.successCount, failureCount: response.failureCount };
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

  console.log(`Revisando ${rows.length} partidos Knockout. Ahora: ${now.toISO()}`);

  const candidates = rows
    .filter(isActiveMatch)
    .map(row => ({ row, matchTime: parseCdmxDate(row) }))
    .filter(item => item.matchTime)
    .filter(({ matchTime }) => {
      const notifyAt = matchTime.minus({ minutes: MINUTES_BEFORE });
      return now >= notifyAt && now < matchTime;
    });

  if (!candidates.length) {
    console.log("No hay partidos dentro de la ventana de notificación.");
    return;
  }

  for (const { row, matchTime } of candidates) {
    const result = await sendReminder(db, messaging, row, matchTime);
    console.log("Resultado:", result);
  }
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
