import { Router } from "express";
import { z } from "zod";
import { listGameDefinitions, setGameEnabled, upsertGameDefinition } from "../bot/gameDefinitions";
import { listRegisteredGames } from "../bot/games/index";

export const gamesRouter = Router();

/**
 * Merges code-registered games with their DB enabled/disabled state,
 * auto-creating a row for any registered game that doesn't have one yet.
 */
gamesRouter.get("/", (_req, res) => {
  const registered = listRegisteredGames();
  const stored = listGameDefinitions();
  const storedById = new Map(stored.map((g) => [g.id, g]));

  const merged = registered.map((g) => {
    const existing = storedById.get(g.id);
    if (existing) return existing;
    upsertGameDefinition({ id: g.id, name: g.name, description: g.description, enabled: true });
    return { id: g.id, name: g.name, description: g.description, enabled: 1 as const, createdAt: Date.now() };
  });

  res.json({ success: true, data: merged });
});

const patchSchema = z.object({
  id: z.string().min(1),
  enabled: z.boolean(),
});

gamesRouter.patch("/", (req, res) => {
  const parsed = patchSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, error: { code: "INVALID_BODY", message: parsed.error.message } });
    return;
  }
  try {
    setGameEnabled(parsed.data.id, parsed.data.enabled);
    res.json({ success: true, data: parsed.data });
  } catch (err) {
    res.status(400).json({ success: false, error: { code: "UPDATE_FAILED", message: (err as Error).message } });
  }
});
