import { Command } from "../types";
import {
  createPoll,
  getPoll,
  markPollSent,
  markPollClosed,
  deletePoll,
  listPolls,
} from "../database";
import { getSocket } from "../bot";
import { config } from "../config";

const poll: Command = {
  name: "poll",
  description: "Full poll builder (create / send / list / view / close / delete)",
  usage: "!poll create | !poll send <id> | !poll list | ...",
  adminOnly: true,
  category: "admin",
  cooldown: 3,
  async execute(ctx, reply) {
    const sub = (ctx.args[0] || "").toLowerCase();
    const rest = ctx.args.slice(1).join(" ").trim();

    // ===== CREATE =====
    if (sub === "create") {
      // Support: !poll create Question? | Opt1 | Opt2 | Opt3
      const raw = ctx.body.replace(/^poll\s+create\s*/i, "").trim();
      if (!raw.includes("|")) {
        await reply(
          `📊 *POLL BUILDER*\n\n` +
            `Usage:\n` +
            `\`!poll create Question? | Option1 | Option2 | Option3\`\n\n` +
            `Example:\n` +
            `\`!poll create Who is the finest? | Prince | David | Joel\`\n\n` +
            `After creation you get an ID, then use:\n` +
            `\`!poll send <ID>\``
        );
        return;
      }

      const parts = raw.split("|").map((s) => s.trim()).filter(Boolean);
      if (parts.length < 3) {
        await reply("Need at least 1 question + 2 options.");
        return;
      }

      const question = parts[0];
      const options = parts.slice(1).slice(0, 12);

      const id = createPoll(question, options, "single", ctx.from);
      await reply(
        `✅ *POLL CREATED*\n\n` +
          `Poll ID: *GP-${id}*\n` +
          `Question: ${question}\n` +
          `Options: ${options.join(" | ")}\n\n` +
          `Use:\n\`!poll send ${id}\`\nto post it in the group.`
      );
      return;
    }

    // ===== SEND =====
    if (sub === "send") {
      const id = parseInt(rest || ctx.args[1] || "", 10);
      if (!id) {
        await reply("Usage: `!poll send <ID>`");
        return;
      }

      const p = getPoll(id);
      if (!p) {
        await reply(`No poll with ID *${id}*`);
        return;
      }
      if (p.closed) {
        await reply("This poll is closed.");
        return;
      }

      const options: string[] = JSON.parse(p.options);
      const sock = getSocket();
      if (!sock) {
        await reply("Bot is not connected.");
        return;
      }

      try {
        await sock.sendMessage(config.groupJid, {
          poll: {
            name: p.question,
            values: options,
            selectableCount: 1,
          },
        });
        markPollSent(id);
        await reply(`✅ Poll *GP-${id}* posted in the group.`);
      } catch (err) {
        await reply("Failed to post poll. Is the bot in the group?");
      }
      return;
    }

    // ===== LIST =====
    if (sub === "list") {
      const rows = listPolls(12);
      if (!rows.length) {
        await reply("No polls created yet.\nUse `!poll create ...`");
        return;
      }
      const lines = rows.map((r) => {
        const status = r.closed ? "🔒 closed" : r.sent ? "✅ sent" : "⏳ pending";
        return `• *GP-${r.id}* — ${r.question.slice(0, 40)}${r.question.length > 40 ? "…" : ""} (${status})`;
      });
      await reply(`📊 *POLLS*\n\n${lines.join("\n")}`);
      return;
    }

    // ===== VIEW =====
    if (sub === "view") {
      const id = parseInt(rest || ctx.args[1] || "", 10);
      if (!id) {
        await reply("Usage: `!poll view <ID>`");
        return;
      }
      const p = getPoll(id);
      if (!p) {
        await reply(`No poll with ID *${id}*`);
        return;
      }
      const options: string[] = JSON.parse(p.options);
      await reply(
        `📊 *POLL GP-${p.id}*\n\n` +
          `Question: ${p.question}\n` +
          `Options:\n${options.map((o, i) => `${i + 1}. ${o}`).join("\n")}\n\n` +
          `Status: ${p.closed ? "Closed" : p.sent ? "Sent" : "Pending"}\n` +
          `Created: ${p.created_at}`
      );
      return;
    }

    // ===== CLOSE =====
    if (sub === "close") {
      const id = parseInt(rest || ctx.args[1] || "", 10);
      if (!id) {
        await reply("Usage: `!poll close <ID>`");
        return;
      }
      const p = getPoll(id);
      if (!p) {
        await reply(`No poll with ID *${id}*`);
        return;
      }
      markPollClosed(id);
      await reply(`🔒 Poll *GP-${id}* marked as closed.`);
      return;
    }

    // ===== DELETE =====
    if (sub === "delete" || sub === "del") {
      const id = parseInt(rest || ctx.args[1] || "", 10);
      if (!id) {
        await reply("Usage: `!poll delete <ID>`");
        return;
      }
      const ok = deletePoll(id);
      if (!ok) {
        await reply(`No poll with ID *${id}*`);
        return;
      }
      await reply(`🗑️ Poll *GP-${id}* deleted.`);
      return;
    }

    // Help
    await reply(
      `📊 *POLL BUILDER*\n\n` +
        `\`!poll create Question? | Opt1 | Opt2 | Opt3\`\n` +
        `\`!poll send <ID>\`\n` +
        `\`!poll list\`\n` +
        `\`!poll view <ID>\`\n` +
        `\`!poll close <ID>\`\n` +
        `\`!poll delete <ID>\`\n\n` +
        `Quick version still works:\n` +
        `\`!quickpoll Question? | Opt1 | Opt2\``
    );
  },
};

export default poll;
