import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
} from "@whiskeysockets/baileys";
import qrcode from "qrcode-terminal";
import path from "path";
import { Boom } from "@hapi/boom";
import { handleMessage } from "./handlers/message";
import { registerParticipantHandler } from "./handlers/participants";
import { logger } from "./utils/logger";
import { config } from "./config";
import { startScheduler } from "./scheduler";

const AUTH_DIR = path.join(process.cwd(), "data", "auth");

let sock: ReturnType<typeof makeWASocket> | null = null;
let connecting = false;
let schedulerStarted = false;

export async function startBot() {
  if (connecting) return;
  connecting = true;

  try {
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
        console.log("\nScan QR:\n");
        qrcode.generate(qr, { small: true });
      }

      if (connection === "close") {
        const code = (lastDisconnect?.error as Boom)?.output?.statusCode;
        const reconnect = code !== DisconnectReason.loggedOut;
        connecting = false;

        logger.warn(`Disconnected (${code}). Reconnect: ${reconnect}`);
        if (reconnect) setTimeout(startBot, 3000);
        else logger.error("Logged out. Delete data/auth and restart.");
      }

      if (connection === "open") {
        connecting = false;
        logger.info(`${config.botName} connected`);
        logger.info(`Group: ${config.groupJid}`);
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
        await handleMessage(
          msg,
          (jid, content) => sock!.sendMessage(jid, content),
          sock
        );
      }
    });
  } catch (err) {
    connecting = false;
    logger.error(err, "startBot failed");
    setTimeout(startBot, 5000);
  }
}

export function getSocket() {
  return sock;
}
