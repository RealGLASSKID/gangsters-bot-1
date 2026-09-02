import { Command } from "../types";
import { getInventory } from "../database";
import { getShopItem } from "../economy";

const inventory: Command = {
  name: "inventory",
  description: "Show your items",
  cooldown: 5,
  async execute(ctx, reply) {
    const items = getInventory(ctx.from);
    if (items.length === 0) { await reply("Inventory empty. Visit !shop"); return; }
    const lines = items.map((i) => {
      const meta = getShopItem(i.item_id);
      return `• ${meta?.name || i.item_id} x${i.qty}`;
    });
    await reply(`🎒 *Inventory*\n\n${lines.join("\n")}`);
  },
};
export default inventory;
