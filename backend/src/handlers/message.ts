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
import { CommandContext, GroupActions, GroupInfo } from "../types";
import { logger } from "../utils/logger";
import { rankTitle } from "../ranking";
import { isFlooding, containsLink, containsBadWord } from "../moderation";
import { matchesAny, participantMatches, senderFromKey, splitPair } from "../utils/ids";

type SendFn = (jid: string, content: { text: string }) => Promise<unknown>;

const FREE_ANYWHERE = new Set(["me", "whoami", "jid", "group", "gid", "groupid"]);

function getBody(msg: proto.IWebMessageInfo): string {
  return (
    msg.message?.conversation ||
    msg.message?.extendedTextMessage?.text ||
    msg.message?.imageMessage?.caption ||
    ""
  );
}

function buildActions(sock: WASocket, remoteJid: string): GroupActions {
  return {
    async kick(jid) {
      try {
        await sock.groupParticipantsUpdate(remoteJid, [jid], "remove");
        return true;
      } catch {
        return false;
      }
    },
    async isGroupAdmin(jid) {
      try {
        const meta = await sock.groupMetadata(remoteJid);
        const p = meta.participants.find((x) =>
          participantMatches(x as { id?: string; phoneNumber?: string; jid?: string; lid?: string }, {
            raw: jid,
            pn: jid.endsWith("@lid") ? null : jid,
            lid: jid.endsWith("@lid") ? jid : null,
            primary: jid,
          })
        );
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

export async function handleMessage(
  msg: proto.IWebMessageInfo,
  send: SendFn,
  sock: WASocket
) {
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

    const body = getBody(msg);
    const prefixed = body.startsWith(config.prefix);
    const text = prefixed ? body.slice(config.prefix.length).trim() : "";
    const [cmdName, ...args] = text ? text.split(/\s+/) : [""];
    const freeIdentity = prefixed && FREE_ANYWHERE.has(cmdName.toLowerCase());

    // Identity commands work in any chat so you can discover JID / LID / group id
    // before config is filled in. Everything else stays locked to the one group.
    if (!isConfiguredGroup && !freeIdentity) return;

    if (isConfiguredGroup && !isOwner && (isMuted(from) || isMuted(sender.raw))) return;

    if (isConfiguredGroup && !body.toLowerCase().startsWith(config.prefix + "afk")) {
      const wasAfk =
        clearAfk(from) ||
        (sender.lid ? clearAfk(sender.lid) : null) ||
        (sender.pn ? clearAfk(sender.pn) : null);
      if (wasAfk) {
        const mins = Math.max(1, Math.round((Date.now() - wasAfk.since) / 60000));
        await send(remoteJid, {
          text: `👋 Welcome back *${senderName}* (AFK ${mins}m)${wasAfk.reason ? `\nReason was: ${wasAfk.reason}` : ""}`,
        });
      }
    }

    if (isConfiguredGroup) {
      const mentioned = msg.message.extendedTextMessage?.contextInfo?.mentionedJid || [];
      for (const jid of mentioned) {
        const afk = getAfk(jid);
        if (afk) {
          const mins = Math.max(1, Math.round((Date.now() - afk.since) / 60000));
          await send(remoteJid, {
            text: `💤 That member is AFK (${mins}m)${afk.reason ? `: ${afk.reason}` : ""}`,
          });
        }
      }
    }

    if (isConfiguredGroup && !isOwner && body) {
      if (isFlooding(from)) {
        await send(remoteJid, { text: "⚠️ Flood detected — slow down." });
        return;
      }
      if (containsLink(body)) {
        const count = addWarning(from, "posted a link", "auto");
        await send(remoteJid, {
          text: `🔗 Links not allowed. Warning ${count}/3 for ${senderName}`,
        });
        if (count >= 3) {
          muteUser(from, "3 warnings (links)", "auto", 3600);
          await send(remoteJid, { text: `${senderName} muted for 1h (3 warnings).` });
        }
        return;
      }
      if (containsBadWord(body)) {
        const count = addWarning(from, "bad language", "auto");
        await send(remoteJid, { text: `🚫 Watch the language. Warning ${count}/3` });
        return;
      }
    }

    if (isConfiguredGroup) {
      const levelUp = trackMessage(from, senderName);
      if (levelUp?.leveledUp) {
        await send(remoteJid, {
          text: `⬆️ *${senderName}* leveled up!\nLevel ${levelUp.oldLevel} → ${levelUp.newLevel}\nRank: ${rankTitle(levelUp.newLevel)}`,
        });
      }
    }

    if (!prefixed || !text) return;

    const command = getCommand(cmdName);
    if (!command) return;

    let isAdmin = isOwner;
    if (!isAdmin && isGroup) {
      try {
        const meta = await sock.groupMetadata(remoteJid);
        const p = meta.participants.find((x) =>
          participantMatches(x as { id?: string; phoneNumber?: string; jid?: string; lid?: string }, sender)
        );
        isAdmin = !!(p && (p.admin === "admin" || p.admin === "superadmin"));
      } catch {
        /* ignore */
      }
    }

    if (command.ownerOnly && !isOwner) {
      await send(remoteJid, { text: "Owner only." });
      return;
    }
    if (command.adminOnly && !isAdmin) {
      await send(remoteJid, { text: "Admin only." });
      return;
    }
    if (command.cooldown && isOnCooldown(from, command.name)) {
      await send(remoteJid, { text: "Slow down." });
      return;
    }

    const ctx: CommandContext = {
      from,
      senderName,
      sender,
      isOwner,
      isAdmin,
      isGroup,
      groupJid: isGroup ? remoteJid : null,
      args,
      body: text,
      actions: isGroup ? buildActions(sock, remoteJid) : undefined,
    };

    await command.execute(ctx, (t) => send(remoteJid, { text: t }));
    if (command.cooldown) setCooldown(from, command.name, command.cooldown);
  } catch (err) {
    logger.error(err, "message handler");
  }
}
