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
} from "../database";
import { CommandContext, GroupActions, GroupInfo, QuotedMessage, ReplyPayload } from "../types";
import { logger } from "../utils/logger";
import { rankTitle } from "../ranking";
import { isFlooding, containsLink, containsBadWord } from "../moderation";
import { matchesAny, participantMatches, senderFromKey, splitPair } from "../utils/ids";

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
    msg.message?.videoMessage?.contextInfo;
  const id = ctxInfo?.stanzaId;
  if (!id) return null;
  return {
    id,
    participant: ctxInfo.participant || null,
    fromMe: !!ctxInfo.participant && ctxInfo.participant === (msg.key.participant || ""),
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
      const attempts = [
        { fromMe: quoted.fromMe, participant: quoted.participant || undefined },
        { fromMe: true, participant: undefined },
        { fromMe: false, participant: quoted.participant || undefined },
      ];
      for (const attempt of attempts) {
        try {
          await sock.sendMessage(remoteJid, {
            delete: {
              remoteJid,
              fromMe: attempt.fromMe,
              id: quoted.id,
              participant: attempt.participant,
            },
          });
          return true;
        } catch {
          /* try next shape */
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
    const freeIdentity = prefixed && FREE_ANYWHERE.has(cmdName.toLowerCase());

    if (!isConfiguredGroup && !freeIdentity) return;

    if (isConfiguredGroup && !isOwner && (isMuted(from) || isMuted(sender.raw))) return;

    const sendText = async (payload: ReplyPayload) => {
      if (typeof payload === "string") {
        await sock.sendMessage(remoteJid, { text: payload });
        return;
      }
      await sock.sendMessage(remoteJid, { text: payload.text, mentions: payload.mentions });
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
      if (isFlooding(from)) {
        await sendText("⚠️ Flood detected — slow down.");
        return;
      }
      if (containsLink(body)) {
        const count = addWarning(from, "posted a link", "auto");
        await tryDelete(sock, msg, remoteJid);
        await sendText(`🔗 Links not allowed. Warning ${count}/3 for ${senderName}`);
        if (count >= 3) {
          muteUser(from, "3 warnings (links)", "auto", 3600);
          await sendText(`${senderName} muted for 1h (3 warnings).`);
        }
        return;
      }
      if (containsBadWord(body)) {
        const count = addWarning(from, "bad language", "auto");
        await tryDelete(sock, msg, remoteJid);
        await sendText(`🚫 Watch the language. Warning ${count}/3`);
        return;
      }
    }

    if (isConfiguredGroup) {
      const levelUp = trackMessage(from, senderName);
      if (levelUp?.leveledUp) {
        await sendText(
          `⬆️ *${senderName}* leveled up!\nLevel ${levelUp.oldLevel} → ${levelUp.newLevel}\nRank: ${rankTitle(levelUp.newLevel)}`
        );
      }
    }

    if (!prefixed || !text) return;

    const command = getCommand(cmdName);
    if (!command) return;

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
