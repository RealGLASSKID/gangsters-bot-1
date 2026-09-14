import { Command } from "../types";
import { addPendingSop } from "../database";
import path from "path";
import fs from "fs";
import { downloadMediaMessage, proto } from "@whiskeysockets/baileys";
import type { WASocket } from "@whiskeysockets/baileys";

const MEDIA_DIR = path.join(process.cwd(), "data", "sop_media");

const sopsubmit: Command = {
  name: "sopsubmit",
  description: "Submit Smash or Pass media from DM (owner/admin)",
  usage: "Send a video/photo with caption: !sop Name",
  aliases: ["sop"],
  category: "admin",
  cooldown: 3,
  async execute(ctx, reply) {
    // This command is mainly triggered when media is present.
    // The actual media handling is done in the message handler.
    // Here we just guide the user.
    await reply(
      `📸 *Smash or Pass Submit*\n\n` +
        `Send a *video or photo* in this private chat with caption:\n\n` +
        `\`!sop Prince\`\n\nor just:\n\`Smash or Pass - Prince\`\n\n` +
        `I will confirm and give you a number (e.g. 10).\n` +
        `Later type \`!10\` in the group (or here) to post it with a poll.`
    );
  },
};

export default sopsubmit;

/** Helper used by message handler when media + sop caption is received in DM */
export async function handleSopMediaSubmission(
  msg: proto.IWebMessageInfo,
  _sock: WASocket,
  targetName: string,
  submittedBy: string,
  reply: (text: string) => Promise<void>
) {
  try {
    fs.mkdirSync(MEDIA_DIR, { recursive: true });

    const buffer = (await downloadMediaMessage(
      msg as any,
      "buffer",
      {}
    )) as Buffer;
    if (!buffer || !Buffer.isBuffer(buffer)) {
      await reply("Could not download the media. Try again.");
      return;
    }

    const isVideo = !!(msg.message?.videoMessage);
    const ext = isVideo ? "mp4" : "jpg";
    const mediaType = isVideo ? "video" : "image";
    const fileName = `sop_${Date.now()}.${ext}`;
    const filePath = path.join(MEDIA_DIR, fileName);
    fs.writeFileSync(filePath, buffer);

    const id = addPendingSop(targetName, filePath, mediaType, null, submittedBy);

    await reply(
      `✅ *Smash or Pass saved*\n\n` +
        `Name: *${targetName}*\n` +
        `ID: *${id}*\n\n` +
        `When you are ready, type:\n\`!${id}\`\n\nin the group (or here) and I will post the media + poll.`
    );
  } catch (err) {
    console.error("SOP media error:", err);
    await reply("Failed to save the media. Please try again.");
  }
}
