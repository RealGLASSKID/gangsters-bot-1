import { Command } from "../types";
import { SHOP, getShopItem } from "../economy";
import { removeCoins, addItem, ensureUser } from "../database";

const shop: Command = {
  name: "shop",
  description: "View shop or buy an item",
  usage: "!shop [buy <item>]",
  cooldown: 5,
  async execute(ctx, reply) {
    const sub = ctx.args[0]?.toLowerCase();
    if (sub === "buy") {
      const itemId = ctx.args[1]?.toLowerCase();
      if (!itemId) { await reply("Usage: !shop buy <item>"); return; }
      const item = getShopItem(itemId);
      if (!item) { await reply("Item not found. Use !shop to see items."); return; }
      ensureUser(ctx.from, ctx.senderName);
      if (!removeCoins(ctx.from, item.price)) { await reply(`Not enough coins. Need ${item.price} GC.`); return; }
      addItem(ctx.from, item.id);
      await reply(`🛒 Bought *${item.name}* for ${item.price} GC`);
      return;
    }
    const lines = SHOP.map((i) => `• ${i.id} — ${i.name} (${i.price} GC)\n  ${i.description}`);
    await reply(`🏪 *Gang Shop*\n\n${lines.join("\n\n")}\n\nBuy: !shop buy <id>`);
  },
};
export default shop;
