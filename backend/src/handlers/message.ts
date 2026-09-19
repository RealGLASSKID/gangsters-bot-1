import { proto, WASocket } from "@whiskeysockets/baileys";
import { config } from "../config";
import { getCommand } from "../commands";
import {
  trackMessage,
  isOnCooldown,
  setCooldown,
  isMuted,
  addWarning,
  clearAfk,
  getAfk,
  muteUser,
  getCustomCommand,
  getSetting,
} from "../database";
import { CommandContext, GroupActions, GroupInfo, QuotedMessage, ReplyPayload } from "../types";
import { logger } from "../utils/logger";
import { fullRank } from "../ranking";
import {
  isFlooding,
  containsLink,
  containsBadWord,
  isRepeatedMessage,
  isCapsSpam,
  tooManyMentions,
} from "../moderation";
import { matchesAny, participantMatches, senderFromKey, splitPair } from "../utils/ids";
import { handleSopMediaSubmission } from "../commands/sopsubmit";

// Commands that owner can use in private chat
const DM_ALLOWED = new Set([
  "me", "whoami", "jid", "group", "gid", "groupid",
  "sop", "sopsubmit", "release",
  "addcmd", "delcmd", "listcmd", "cmds", "customcmds",
  "quickpoll", "qp", "poll",
  "welcome", "setwelcome", "goodbye", "setgoodbye",
  "banword", "moderation", "mod", "automod",
  "help", "games",
]);

const FREE_ANYWHERE = new Set(["me", "whoami", "jid", "group", "gid", "groupid"]);

function getBody(msg: proto.IWebMessageInfo): string {
  return (
    msg.message?.conversation ||
    msg.message?.extendedTextMessage?.text ||
    msg.message?.imageMessage?.caption ||
    msg.message?.videoMessage?.caption ||
    ""
  );
}

function quotedFrom(msg: proto.IWebMessageInfo): QuotedMessage | null {
  const ctxInfo =
    msg.message?.extendedTextMessage?.contextInfo ||
    msg.message?.imageMessage?.contextInfo ||
    msg.message?.videoMessage?.contextInfo ||
    msg.message?.documentMessage?.contextInfo ||
    msg.message?.audioMessage?.contextInfo ||
    msg.message?.stickerMessage?.contextInfo;
  const id = ctxInfo?.stanzaId;
  if (!id) return null;
  return {
    id,
    participant: ctxInfo.participant || null,
    fromMe: false,
  };
}

function mentionedFrom(msg: proto.IWebMessageInfo): string[] {
  return (
    msg.message?.extendedTextMessage?.contextInfo?.mentionedJid ||
    msg.message?.imageMessage?.contextInfo?.mentionedJid ||
    []
  );
}

async function findParticipant(
  sock: WASocket,
  remoteJid: string,
  jid: string
) {
  const meta = await sock.groupMetadata(remoteJid);
  return meta.participants.find((x) =>
    participantMatches(x as { id?: string; phoneNumber?: string; jid?: string; lid?: string }, {
      raw: jid,
      pn: jid.endsWith("@lid") ? null : jid,
      lid: jid.endsWith("@lid") ? jid : null,
      primary: jid,
    })
  );
}

function buildActions(sock: WASocket, remoteJid: string): GroupActions {
  const update = async (jid: string, action: "remove" | "promote" | "demote") => {
    try {
      await sock.groupParticipantsUpdate(remoteJid, [jid], action);
      return true;
    } catch {
      return false;
    }
  };

  return {
    kick: (jid) => update(jid, "remove"),
    promote: (jid) => update(jid, "promote"),
    demote: (jid) => update(jid, "demote"),
    async deleteMessage(quoted) {
      const botId = sock.user?.id || "";
      const norm = (j: string) => j.replace(/:\d+@/, "@").split("@")[0] || "";
      const part = quoted.participant || "";
      const isOwn = !!part && norm(part) === norm(botId);

      const attempts = isOwn
        ? [
            { fromMe: true as const },
            { fromMe: true as const, participant: part || undefined },
          ]
        : [
            { fromMe: false as const, participant: part || undefined },
            { fromMe: false as const },
            { fromMe: true as const },
          ];

      for (const attempt of attempts) {
        try {
          await sock.sendMessage(remoteJid, {
            delete: {
              remoteJid,
              fromMe: attempt.fromMe,
              id: quoted.id,
              ...(attempt.participant ? { participant: attempt.participant } : {}),
            },
          });
          return true;
        } catch {
          /* try next */
        }
      }
      return false;
    },
    async setSetting(setting) {
      try {
        await sock.groupSettingUpdate(remoteJid, setting);
        return true;
      } catch {
        return false;
      }
    },
    async setSubject(subject) {
      try {
        await sock.groupUpdateSubject(remoteJid, subject);
        return true;
      } catch {
        return false;
      }
    },
    async setDescription(desc) {
      try {
        await sock.groupUpdateDescription(remoteJid, desc);
        return true;
      } catch {
        return false;
      }
    },
    async isGroupAdmin(jid) {
      try {
        const p = await findParticipant(sock, remoteJid, jid);
        return !!(p && (p.admin === "admin" || p.admin === "superadmin"));
      } catch {
        return false;
      }
    },
    async getParticipants() {
      try {
        const meta = await sock.groupMetadata(remoteJid);
        return meta.participants.map((p) => p.id);
      } catch {
        return [];
      }
    },
    async getGroupInfo(): Promise<GroupInfo | null> {
      try {
        const meta = await sock.groupMetadata(remoteJid);
        const extra = meta as typeof meta & {
          addressingMode?: string;
          ownerPn?: string;
          desc?: string;
          restrict?: boolean;
          announce?: boolean;
          size?: number;
        };
        return {
          jid: meta.id,
          subject: meta.subject || "Untitled",
          desc: extra.desc || "",
          owner: meta.owner || null,
          ownerPn: extra.ownerPn || null,
          created: meta.creation || null,
          size: extra.size || meta.participants.length,
          restrict: !!extra.restrict,
          announce: !!extra.announce,
          addressingMode: extra.addressingMode || null,
          participants: meta.participants.map((p) => {
            const pair = splitPair(
              p.id,
              (p as { phoneNumber?: string; lid?: string }).phoneNumber ||
                (p as { lid?: string }).lid
            );
            return {
              id: p.id,
              pn: pair.pn,
              lid: pair.lid,
              admin: p.admin || null,
            };
          }),
        };
      } catch {
        return null;
      }
    },
  };
}

async function tryDelete(sock: WASocket, msg: proto.IWebMessageInfo, remoteJid: string) {
  try {
    await sock.sendMessage(remoteJid, {
      delete: {
        remoteJid,
        fromMe: false,
        id: msg.key.id || "",
        participant: msg.key.participant || undefined,
      },
    });
  } catch {
    /* bot is probably not a group admin */
  }
}

export async function handleMessage(msg: proto.IWebMessageInfo, sock: WASocket) {
  try {
    if (!msg.message || msg.key.fromMe) return;

    const remoteJid = msg.key.remoteJid;
    if (!remoteJid) return;

    const key = msg.key as proto.IMessageKey & {
      participantAlt?: string;
      participantPn?: string;
      participantLid?: string;
      senderPn?: string;
      senderLid?: string;
      remoteJidAlt?: string;
    };

    const sender = senderFromKey(key);
    if (!sender.primary) return;

    const from = sender.primary;
    const senderName = msg.pushName || "Unknown";
    const isGroup = remoteJid.endsWith("@g.us");
    const isConfiguredGroup = isGroup && remoteJid === config.groupJid;
    const isOwner = matchesAny(config.ownerJid, [sender.primary, sender.pn, sender.lid, sender.raw]);
    const botJid = sock.user?.id || (sock.user as { lid?: string } | undefined)?.lid || null;

    const body = getBody(msg);
    const prefixed = body.startsWith(config.prefix);
    const text = prefixed ? body.slice(config.prefix.length).trim() : "";
    const [cmdName, ...args] = text ? text.split(/\s+/) : [""];
    const cmdLower = cmdName.toLowerCase();
    const freeIdentity = prefixed && FREE_ANYWHERE.has(cmdLower);
    const isDm = !isGroup;
    const ownerDmAllowed = isDm && isOwner && (prefixed ? DM_ALLOWED.has(cmdLower) || /^\d+$/.test(cmdLower) : false);

    // Allow: configured group OR free identity OR owner using allowed DM commands
    if (!isConfiguredGroup && !freeIdentity && !ownerDmAllowed) {
      // Still allow owner media submissions for SOP in DM (handled below)
      const hasMedia = !!(msg.message?.imageMessage || msg.message?.videoMessage);
      const caption = (msg.message?.imageMessage?.caption || msg.message?.videoMessage?.caption || "").trim();
      const isSopCaption =
        /^(!?sop|smash\s*or\s*pass)/i.test(caption) ||
        /^smash\s*or\s*pass\s*[-:]/i.test(caption);
      if (!(isDm && isOwner && hasMedia && isSopCaption)) {
        return;
      }
    }

    if (isConfiguredGroup && !isOwner && (isMuted(from) || isMuted(sender.raw))) return;

    const sendText = async (payload: ReplyPayload) => {
      // Show "typing..." indicator like a real WhatsApp user
      try {
        await sock.sendPresenceUpdate("composing", remoteJid);
        // Small delay so the typing indicator is visible (1.0 – 1.8s)
        await new Promise((r) => setTimeout(r, 1000 + Math.random() * 800));
      } catch {
        /* ignore presence errors */
      }

      if (typeof payload === "string") {
        await sock.sendMessage(remoteJid, { text: payload });
      } else {
        await sock.sendMessage(remoteJid, { text: payload.text, mentions: payload.mentions });
      }

      // Stop typing indicator
      try {
        await sock.sendPresenceUpdate("paused", remoteJid);
      } catch {
        /* ignore */
      }
    };

    if (isConfiguredGroup && !body.toLowerCase().startsWith(config.prefix + "afk")) {
      const wasAfk =
        clearAfk(from) ||
        (sender.lid ? clearAfk(sender.lid) : null) ||
        (sender.pn ? clearAfk(sender.pn) : null);
      if (wasAfk) {
        const mins = Math.max(1, Math.round((Date.now() - wasAfk.since) / 60000));
        await sendText(
          `👋 Welcome back *${senderName}* (AFK ${mins}m)${wasAfk.reason ? `\nReason was: ${wasAfk.reason}` : ""}`
        );
      }
    }

    if (isConfiguredGroup) {
      const mentioned = mentionedFrom(msg);
      for (const jid of mentioned) {
        const afk = getAfk(jid);
        if (afk) {
          const mins = Math.max(1, Math.round((Date.now() - afk.since) / 60000));
          await sendText(`💤 That member is AFK (${mins}m)${afk.reason ? `: ${afk.reason}` : ""}`);
        }
      }
    }

    if (isConfiguredGroup && !isOwner && body) {
      const modOn = getSetting("mod_enabled", "1") === "1";

      if (modOn) {
        const mentioned = mentionedFrom(msg);
        const linksOn = getSetting("mod_links", "1") === "1";
        const badOn = getSetting("mod_badwords", "1") === "1";
        const mentionsOn = getSetting("mod_mentions", "1") === "1";
        const floodOn = getSetting("mod_flood", "1") === "1";
        const repeatOn = getSetting("mod_repeat", "1") === "1";
        const capsOn = getSetting("mod_caps", "1") === "1";

        if (floodOn && isFlooding(from)) {
          const count = addWarning(from, "message flood", "auto");
          await sendText(`⚠️ Flood detected. Warning ${count}/3 for ${senderName}`);
          if (count >= 3) {
            muteUser(from, "3 warnings (flood)", "auto", 3600);
            await sendText(`${senderName} muted for 1h (flood).`);
          }
          return;
        }

        if (repeatOn && isRepeatedMessage(from, body)) {
          const count = addWarning(from, "repeated messages", "auto");
          await tryDelete(sock, msg, remoteJid);
          await sendText(`🔁 Stop repeating the same message. Warning ${count}/3`);
          if (count >= 3) {
            muteUser(from, "3 warnings (spam)", "auto", 3600);
            await sendText(`${senderName} muted for 1h (spam).`);
          }
          return;
        }

        if (mentionsOn && tooManyMentions(mentioned)) {
          const count = addWarning(from, "excessive mentions", "auto");
          await tryDelete(sock, msg, remoteJid);
          await sendText(`📣 Too many mentions. Warning ${count}/3`);
          return;
        }

        if (capsOn && isCapsSpam(body)) {
          const count = addWarning(from, "caps spam", "auto");
          await tryDelete(sock, msg, remoteJid);
          await sendText(`🔠 Stop shouting (caps). Warning ${count}/3`);
          return;
        }

        if (linksOn && containsLink(body)) {
          const count = addWarning(from, "posted a link", "auto");
          await tryDelete(sock, msg, remoteJid);
          await sendText(`🔗 Links not allowed. Warning ${count}/3 for ${senderName}`);
          if (count >= 3) {
            muteUser(from, "3 warnings (links)", "auto", 3600);
            await sendText(`${senderName} muted for 1h (3 warnings).`);
          }
          return;
        }

        if (badOn && containsBadWord(body)) {
          const count = addWarning(from, "bad language", "auto");
          await tryDelete(sock, msg, remoteJid);
          await sendText(`🚫 Watch the language. Warning ${count}/3`);
          if (count >= 3) {
            muteUser(from, "3 warnings (language)", "auto", 3600);
            await sendText(`${senderName} muted for 1h (language).`);
          }
          return;
        }
      }
    }

    if (isConfiguredGroup) {
      const levelUp = trackMessage(from, senderName);
      if (levelUp?.leveledUp) {
        await sendText(
          `⬆️ *${senderName}* leveled up!\nLevel ${levelUp.oldLevel} → ${levelUp.newLevel}\nRank: ${fullRank(levelUp.newLevel)}`
        );
      }
    }

    // ===== Owner DM: media + SOP caption → save as pending =====
    if (isDm && isOwner) {
      const hasMedia = !!(msg.message?.imageMessage || msg.message?.videoMessage);
      const caption = (
        msg.message?.imageMessage?.caption ||
        msg.message?.videoMessage?.caption ||
        body ||
        ""
      ).trim();

      if (hasMedia) {
        // Extract name from caption: "!sop Prince" or "Smash or Pass - Prince"
        let targetName = "";
        const m1 = caption.match(/^!?sop\s+(.+)$/i);
        const m2 = caption.match(/^smash\s*or\s*pass\s*[-:]\s*(.+)$/i);
        if (m1) targetName = m1[1].trim();
        else if (m2) targetName = m2[1].trim();

        if (targetName) {
          await handleSopMediaSubmission(msg, sock, targetName, from, sendText);
          return;
        }
      }
    }

    // Bare number in DM or group from owner/admin → treat as release ID
    const bareNumber = text.match(/^(\d+)$/);
    if (bareNumber && (isOwner || (isConfiguredGroup && isOwner))) {
      const releaseCmd = getCommand("release");
      if (releaseCmd) {
        const ctxNum: CommandContext = {
          from,
          senderName,
          sender,
          botJid,
          isOwner,
          isAdmin: true,
          isGroup,
          groupJid: isGroup ? remoteJid : config.groupJid,
          args: [bareNumber[1]],
          body: bareNumber[1],
          mentionedJids: [],
          quoted: null,
          actions: isGroup ? buildActions(sock, remoteJid) : undefined,
        };
        await releaseCmd.execute(ctxNum, sendText);
        return;
      }
    }

    if (!prefixed || !text) return;

    // Built-in command?
    let command = getCommand(cmdName);

    // Custom command fallback
    if (!command) {
      const custom = getCustomCommand(cmdName);
      if (custom) {
        await sendText(custom);
        return;
      }
      return;
    }

    let isAdmin = isOwner;
    if (!isAdmin && isGroup) {
      try {
        const p = await findParticipant(sock, remoteJid, sender.primary);
        const matched =
          p ||
          (await findParticipant(sock, remoteJid, sender.raw)) ||
          (sender.lid ? await findParticipant(sock, remoteJid, sender.lid) : undefined);
        isAdmin = !!(matched && (matched.admin === "admin" || matched.admin === "superadmin"));
      } catch {
        /* ignore */
      }
    }

    // In DM only owner can run admin commands
    if (isDm && !isOwner) {
      await sendText("Owner only in private chat.");
      return;
    }

    if (command.ownerOnly && !isOwner) {
      await sendText("Owner only.");
      return;
    }
    if (command.adminOnly && !isAdmin) {
      await sendText("Admins only.");
      return;
    }
    if (command.cooldown && isOnCooldown(from, command.name)) {
      await sendText("Slow down.");
      return;
    }

    const ctx: CommandContext = {
      from,
      senderName,
      sender,
      botJid,
      isOwner,
      isAdmin,
      isGroup,
      groupJid: isGroup ? remoteJid : null,
      args,
      body: text,
      mentionedJids: mentionedFrom(msg),
      quoted: quotedFrom(msg),
      actions: isGroup ? buildActions(sock, remoteJid) : undefined,
    };

    await command.execute(ctx, sendText);
    if (command.cooldown) setCooldown(from, command.name, command.cooldown);
  } catch (err) {
    logger.error(err, "message handler");
  }
}
