import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
} from "@whiskeysockets/baileys";
import qrcodeTerminal from "qrcode-terminal";
import QRCode from "qrcode";
import path from "path";
import fs from "fs";
import { Boom } from "@hapi/boom";
import { handleMessage } from "./handlers/message";
import { registerParticipantHandler } from "./handlers/participants";
import { logger } from "./utils/logger";
import { config } from "./config";
import { startScheduler } from "./scheduler";
import { SessionState, SessionStatus } from "./types";

const AUTH_DIR = path.join(process.cwd(), "data", "auth");

let sock: ReturnType<typeof makeWASocket> | null = null;
let connecting = false;
let schedulerStarted = false;
let relinkRequested = false;

const session: SessionState = {
  status: "idle",
  connected: false,
  qrDataUrl: null,
  user: null,
  lastError: null,
  updatedAt: Date.now(),
};

function setSession(patch: Partial<SessionState>) {
  Object.assign(session, patch, { updatedAt: Date.now() });
}

export function getSession(): SessionState {
  return { ...session };
}

export function getSocket() {
  return sock;
}

async function renderQr(qr: string) {
  try {
    const qrDataUrl = await QRCode.toDataURL(qr, { margin: 1, width: 320 });
    setSession({ status: "qr", connected: false, qrDataUrl, lastError: null });
  } catch (err) {
    logger.error(err, "qr render");
    setSession({ status: "qr", connected: false, lastError: "Could not render QR" });
  }
}

function wipeAuthDir() {
  try {
    fs.rmSync(AUTH_DIR, { recursive: true, force: true });
  } catch (err) {
    logger.error(err, "wipe auth");
  }
  fs.mkdirSync(AUTH_DIR, { recursive: true });
}

export async function startBot() {
  if (connecting) return;
  connecting = true;
  setSession({ status: "connecting", connected: false, lastError: null });

  try {
    fs.mkdirSync(AUTH_DIR, { recursive: true });
    const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
    const { version } = await fetchLatestBaileysVersion();

    sock = makeWASocket({
      version,
      auth: state,
      printQRInTerminal: false,
      logger,
      syncFullHistory: false,
      markOnlineOnConnect: false,
    });

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("connection.update", ({ connection, lastDisconnect, qr }) => {
      if (qr) {
        console.log("\nScan QR with the bot WhatsApp account:\n");
        qrcodeTerminal.generate(qr, { small: true });
        void renderQr(qr);
      }

      if (connection === "close") {
        const code = (lastDisconnect?.error as Boom)?.output?.statusCode;
        const loggedOut = code === DisconnectReason.loggedOut;
        connecting = false;
        sock = null;

        logger.warn(`Disconnected (${code}). Logged out: ${loggedOut}`);

        if (relinkRequested) {
          relinkRequested = false;
          wipeAuthDir();
          setSession({
            status: "connecting",
            connected: false,
            qrDataUrl: null,
            user: null,
            lastError: null,
          });
          setTimeout(() => void startBot(), 500);
          return;
        }

        if (loggedOut) {
          setSession({
            status: "logged_out",
            connected: false,
            qrDataUrl: null,
            user: null,
            lastError: "WhatsApp session ended. Relink from the dashboard.",
          });
          return;
        }

        setSession({
          status: "connecting",
          connected: false,
          user: null,
          lastError: `Disconnected (${code || "unknown"})`,
        });
        setTimeout(() => void startBot(), 3000);
      }

      if (connection === "open") {
        connecting = false;
        const user = sock?.user?.id || (sock?.user as { lid?: string } | undefined)?.lid || null;
        logger.info(`${config.botName} connected`);
        logger.info(`Group: ${config.groupJid}`);
        setSession({
          status: "connected",
          connected: true,
          qrDataUrl: null,
          user,
          lastError: null,
        });
        if (!schedulerStarted) {
          schedulerStarted = true;
          startScheduler();
        }
      }
    });

    registerParticipantHandler(sock);

    sock.ev.on("messages.upsert", async ({ messages, type }) => {
      if (type !== "notify" || !sock) return;
      for (const msg of messages) {
        await handleMessage(msg, sock);
      }
    });

    // Extra revoke path — silent log only (admin: !show)
    sock.ev.on("messages.update", async (updates) => {
      if (!sock) return;
      for (const u of updates) {
        try {
          if (u.update.message === null && u.key?.id && u.key.remoteJid) {
            const {
              getCachedMessage,
              deleteCachedMessage,
              logDeletedMessage,
            } = await import("./database");
            const { config: botConfig } = await import("./config");
            if (u.key.remoteJid !== botConfig.groupJid) continue;
            const cached = getCachedMessage(u.key.id, u.key.remoteJid);
            if (!cached?.body) continue;
            logDeletedMessage({
              msgId: u.key.id,
              remoteJid: u.key.remoteJid,
              senderJid: cached.sender_jid || "",
              senderName: cached.sender_name || "Unknown",
              body: cached.body,
            });
            deleteCachedMessage(u.key.id, u.key.remoteJid);
          }
        } catch {
          /* ignore */
        }
      }
    });
  } catch (err) {
    connecting = false;
    logger.error(err, "startBot failed");
    setSession({
      status: "error",
      connected: false,
      lastError: err instanceof Error ? err.message : "startBot failed",
    });
    setTimeout(() => void startBot(), 5000);
  }
}

export async function relinkWhatsApp(): Promise<SessionState> {
  logger.warn("Relink requested — wiping WhatsApp auth and showing a new QR");
  relinkRequested = true;
  setSession({
    status: "connecting",
    connected: false,
    qrDataUrl: null,
    user: null,
    lastError: null,
  });

  const current = sock;
  sock = null;

  if (current) {
    try {
      await current.logout();
    } catch {
      try {
        current.end(undefined);
      } catch {
        /* already closed */
      }
    }
  } else {
    relinkRequested = false;
    wipeAuthDir();
    connecting = false;
    await startBot();
  }

  return getSession();
}

export function sessionStatusLabel(status: SessionStatus): string {
  switch (status) {
    case "connected":
      return "Connected";
    case "qr":
      return "Scan QR";
    case "connecting":
      return "Connecting";
    case "logged_out":
      return "Logged out";
    case "error":
      return "Error";
    default:
      return "Idle";
  }
}