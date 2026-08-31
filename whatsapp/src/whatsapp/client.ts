import { Client, LocalAuth } from "whatsapp-web.js";
import qrcode from "qrcode-terminal";
import { config } from "../config";
import { logger } from "../utils/logger";
import { WhatsAppStatus } from "../types";
import { forwardInboundToBackend } from "./forwardInboundToBackend";

class WhatsAppClient {
  private client: Client | null = null;
  private status: WhatsAppStatus = "initializing";
  private isReady = false;
  private initPromise: Promise<void> | null = null;

  getStatus(): WhatsAppStatus {
    return this.status;
  }

  isConnected(): boolean {
    return this.isReady && this.status === "ready";
  }

  /**
   * Initialize the WhatsApp client. Safe to call multiple times;
   * subsequent calls return the same initialization promise.
   */
  async initialize(): Promise<void> {
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = this._doInitialize();
    return this.initPromise;
  }

  private async _doInitialize(): Promise<void> {
    logger.info("Initializing WhatsApp client…");

    const sessionPath = config.whatsapp.sessionPath;
    logger.info(`Session data path: ${sessionPath}`);

    const puppeteerOptions: Record<string, unknown> = {
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--no-first-run",
        "--no-zygote",
        "--disable-gpu",
        "--single-process",
      ],
    };

    // Prefer system Chromium when running in Docker / Railway
    if (process.env.PUPPETEER_EXECUTABLE_PATH) {
      puppeteerOptions.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
    }

    this.client = new Client({
      authStrategy: new LocalAuth({
        dataPath: sessionPath,
        clientId: "gangster-bot",
      }),
      puppeteer: puppeteerOptions,
    });

    this.registerEventHandlers();

    try {
      await this.client.initialize();
    } catch (err) {
      this.status = "disconnected";
      this.isReady = false;
      logger.error("Failed to initialize WhatsApp client", err);
      // Do not throw – allow the HTTP server to keep running
      // so health checks and future reconnect attempts can work.
    }
  }

  private registerEventHandlers(): void {
    if (!this.client) return;

    this.client.on("qr", (qr: string) => {
      this.status = "qr";
      this.isReady = false;
      logger.info("QR code received – scan with WhatsApp to authenticate");
      // Print QR in terminal for easy local/Railway log viewing
      qrcode.generate(qr, { small: true });
    });

    this.client.on("authenticated", () => {
      this.status = "authenticated";
      logger.info("WhatsApp authenticated successfully");
    });

    this.client.on("auth_failure", (msg: string) => {
      this.status = "disconnected";
      this.isReady = false;
      logger.error("WhatsApp authentication failed", { msg });
    });

    this.client.on("ready", () => {
      this.status = "ready";
      this.isReady = true;
      logger.info("WhatsApp client is ready and connected");
    });

    this.client.on("disconnected", (reason: string) => {
      this.status = "disconnected";
      this.isReady = false;
      logger.warn("WhatsApp client disconnected", { reason });
      // Attempt soft recovery – LocalAuth will restore session on next init
    });

    this.client.on("change_state", (state: string) => {
      logger.debug("WhatsApp state changed", { state });
    });

    this.client.on("message", (msg) => {
      void this.handleIncoming(msg);
    });
  }

  private async resolvePhone(msg: {
    from: string;
    author?: string;
    _data?: Record<string, unknown>;
    getContact?: () => Promise<{
      number?: string;
      id?: { user?: string; _serialized?: string };
    }>;
  }): Promise<string | null> {
    const fromJid = String(msg.from || "");
    const data = (msg._data || {}) as Record<string, unknown>;
    const candidates = [
      typeof data.senderPn === "string" ? data.senderPn : "",
      typeof data.peer_recipientPn === "string" ? data.peer_recipientPn : "",
      typeof msg.author === "string" ? msg.author : "",
      fromJid,
    ];

    if (msg.getContact) {
      try {
        const contact = await msg.getContact();
        candidates.unshift(
          contact.number || "",
          contact.id?.user || "",
          contact.id?._serialized || "",
        );
      } catch (err) {
        logger.warn("Could not resolve WhatsApp contact from inbound", err);
      }
    }

    const cc = config.whatsapp.defaultCountryCode;
    for (const raw of candidates) {
      const user = String(raw)
        .replace(/@c\.us$/i, "")
        .replace(/@s\.whatsapp\.net$/i, "")
        .replace(/@lid$/i, "")
        .replace(/\D/g, "");
      if (!user) continue;
      // Already looks like a full international number (8-15 digits, no leading 0)
      if (/^\d{8,15}$/.test(user) && !user.startsWith("0")) return user;
      // Local format (leading 0) — normalize using the configured country code
      if (cc && user.startsWith("0") && user.length === 11) return `${cc}${user.slice(1)}`;
    }
    return null;
  }

  private async handleIncoming(msg: {
    from: string;
    author?: string;
    fromMe?: boolean;
    body?: string;
    isStatus?: boolean;
    hasQuotedMsg?: boolean;
    _data?: Record<string, unknown>;
    id?: { _serialized?: string; id?: string };
    getQuotedMessage?: () => Promise<{ id?: { _serialized?: string; id?: string } }>;
    getContact?: () => Promise<{
      number?: string;
      id?: { user?: string; _serialized?: string };
    }>;
  }): Promise<void> {
    if (msg.fromMe || msg.isStatus || !msg.body?.trim()) return;

    logger.info("WhatsApp inbound raw", {
      from: msg.from,
      hasQuotedMsg: Boolean(msg.hasQuotedMsg),
      body: msg.body.slice(0, 80),
      messageId: msg.id?._serialized || msg.id?.id || null,
    });

    const from = await this.resolvePhone(msg);
    if (!from) {
      logger.warn("Dropped inbound WhatsApp message — no phone on @lid payload", {
        from: msg.from,
      });
      return;
    }

    let replyToId: string | null = null;
    if (msg.hasQuotedMsg && msg.getQuotedMessage) {
      try {
        const quoted = await msg.getQuotedMessage();
        replyToId = quoted?.id?._serialized || quoted?.id?.id || null;
      } catch (err) {
        logger.warn("Could not read quoted WhatsApp message", err);
      }
    }
    const data = (msg._data || {}) as Record<string, unknown>;
    if (!replyToId) {
      replyToId =
        (typeof data.quotedStanzaID === "string" && data.quotedStanzaID) ||
        (typeof data.quotedMsgId === "string" && data.quotedMsgId) ||
        null;
    }

    const payload = {
      from,
      text: msg.body.trim(),
      messageId: msg.id?._serialized || msg.id?.id || null,
      replyToId,
    };

    try {
      await forwardInboundToBackend(payload);
      logger.info("Forwarded inbound WhatsApp message to backend", {
        from: from.slice(0, 4) + "****",
        replyToId,
        messageId: payload.messageId,
      });
    } catch (err) {
      logger.error("Failed to forward inbound WhatsApp message", err);
    }
  }

  /**
   * Send a text message to a phone number.
   * Phone number must be digits only with country code (no +).
   */
  async sendMessage(to: string, message: string): Promise<{ id: string }> {
    if (!this.client || !this.isReady) {
      throw new Error("WhatsApp client is not ready");
    }

    const numberId = await this.client.getNumberId(to);
    if (!numberId) {
      const error = new Error("This number is not on WhatsApp");
      error.name = "NotOnWhatsapp";
      throw error;
    }

    try {
      const result = await this.client.sendMessage(numberId._serialized, message);

      const id =
        result?.id?._serialized ?? result?.id?.id ?? `msg_${Date.now()}`;

      logger.info("Message sent", {
        to: to.slice(0, 4) + "****",
        messageId: id,
      });

      return { id: String(id) };
    } catch (err) {
      logger.error("Failed to send WhatsApp message", {
        to: to.slice(0, 4) + "****",
        error: err instanceof Error ? err.message : String(err),
      });
      throw err;
    }
  }

  /**
   * Delete a previously sent message.
   * @param messageId Serialized id from send (e.g. true_234…@c.us_ABC…)
   * @param everyone If true, delete for everyone (revoke); else delete for me only
   */
  async deleteMessage(
    messageId: string,
    everyone = true,
  ): Promise<{ id: string; deleted: boolean }> {
    if (!this.client || !this.isReady) {
      throw new Error("WhatsApp client is not ready");
    }

    const id = String(messageId || "").trim();
    if (!id) {
      const error = new Error("messageId is required");
      error.name = "InvalidMessageId";
      throw error;
    }

    try {
      const msg = await this.client.getMessageById(id);
      if (!msg) {
        const error = new Error("Message not found");
        error.name = "MessageNotFound";
        throw error;
      }

      // true = delete for everyone (revoke) when still within WhatsApp time window
      await msg.delete(everyone);

      logger.info("Message deleted", {
        messageId: id.slice(0, 24) + "…",
        everyone,
      });

      return { id, deleted: true };
    } catch (err) {
      if (
        err instanceof Error &&
        (err.name === "MessageNotFound" || err.name === "InvalidMessageId")
      ) {
        throw err;
      }
      logger.error("Failed to delete WhatsApp message", {
        messageId: id.slice(0, 24) + "…",
        error: err instanceof Error ? err.message : String(err),
      });
      throw err;
    }
  }

  /**
   * Gracefully destroy the client (for process shutdown).
   */
  async destroy(): Promise<void> {
    if (this.client) {
      try {
        await this.client.destroy();
        logger.info("WhatsApp client destroyed");
      } catch (err) {
        logger.warn("Error while destroying WhatsApp client", err);
      } finally {
        this.client = null;
        this.isReady = false;
        this.status = "disconnected";
        this.initPromise = null;
      }
    }
  }
}

// Singleton instance
export const whatsappClient = new WhatsAppClient();
