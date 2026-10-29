import makeWASocket, {
  DisconnectReason,
  fetchLatestBaileysVersion,
} from "@whiskeysockets/baileys";
import qrcodeTerminal from "qrcode-terminal";
import QRCode from "qrcode";
import { Boom } from "@hapi/boom";
import { handleMessage } from "./handlers/message";
import { registerParticipantHandler } from "./handlers/participants";
import { logger } from "./utils/logger";
import { config } from "./config";
import { startScheduler } from "./scheduler";
import { SessionState, SessionStatus } from "./types";
import { loadBaileysAuth, type BaileysAuth } from "./auth/baileysAuth";

let auth: BaileysAuth | null = null;

let sock: ReturnType<typeof makeWASocket> | null = null;
let connecting = false;
let schedulerStarted = false;
let sandraBackAnnounced = false;
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

async function wipeAuth() {
  try {
    await (auth ?? (await loadBaileysAuth())).clear();
  } catch (err) {
    logger.error(err, "wipe auth");
  }
  auth = null;
}

export async function startBot() {
  if (connecting) return;
  connecting = true;
  setSession({ status: "connecting", connected: false, lastError: null });

  try {
    auth = await loadBaileysAuth();
    const { state, saveCreds } = auth;
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

    sock.ev.on("connection.update", async ({ connection, lastDisconnect, qr }) => {
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
          await wipeAuth();
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

        // Auto-approve pending join requests (bot must be admin)
        void (async () => {
          try {
            const list =
              (await (sock as any).groupRequestParticipantsList?.(config.groupJid)) || [];
            const ids = list
              .map((p: { id?: string; jid?: string }) => p.id || p.jid)
              .filter(Boolean);
            if (ids.length) {
              await (sock as any).groupRequestParticipantsUpdate(
                config.groupJid,
                ids,
                "approve"
              );
              logger.info(`Auto-approved ${ids.length} join request(s)`);
            }
          } catch (err) {
            logger.warn({ err }, "auto-approve join requests skipped");
          }
        })();

        // One-time "Sandra is back" message per process
        if (!sandraBackAnnounced && config.groupJid) {
          sandraBackAnnounced = true;
          void (async () => {
            try {
              await new Promise((r) => setTimeout(r, 2500));
              await sock!.sendMessage(config.groupJid, {
                text:
                  `🔥 *Hey guys, it's me — Sandra* 👋\n\n` +
                  `I went quiet for a while… now I'm *back* 😎\n\n` +
                  `Who missed me? 🤭\n\n` +
                  `You can start earning *XP*, climb the *ranks*, play games, and keep the vibes alive.\n\n` +
                  `Type *!help* or *!games* to see what I can do.\n\n` +
                  `— *GANGSTER BOT / Sandra* 🔥`,
              });
              logger.info("Posted Sandra-is-back message to group");
            } catch (err) {
              logger.warn({ err }, "back message failed");
            }
          })();
        }
      }
    });

    registerParticipantHandler(sock);

    // Approve join requests as they come in (bot must be group admin)
    sock.ev.on("group-join-request" as any, async (event: any) => {
      try {
        const gid = event?.id || event?.groupJid || config.groupJid;
        if (gid !== config.groupJid) return;
        const participants =
          event?.participants ||
          (event?.participant ? [event.participant] : []);
        const ids = (participants as string[]).filter(Boolean);
        if (!ids.length) return;
        await (sock as any).groupRequestParticipantsUpdate(gid, ids, "approve");
        logger.info(`Approved join request(s): ${ids.join(", ")}`);
      } catch (err) {
        logger.warn({ err }, "group-join-request approve failed");
      }
    });


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
    await wipeAuth();
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