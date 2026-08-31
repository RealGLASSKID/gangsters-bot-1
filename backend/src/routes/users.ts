import { Router } from "express";
import { z } from "zod";
import { listUsers, setUserRole, setUserBanned } from "../bot/users";

export const usersRouter = Router();

usersRouter.get("/", (_req, res) => {
  res.json({ success: true, data: listUsers() });
});

const patchSchema = z.object({
  phone: z.string().min(4),
  role: z.enum(["member", "admin", "super_admin"]).optional(),
  banned: z.boolean().optional(),
});

usersRouter.patch("/", (req, res) => {
  const parsed = patchSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, error: { code: "INVALID_BODY", message: parsed.error.message } });
    return;
  }
  const { phone, role, banned } = parsed.data;
  try {
    if (role) setUserRole(phone, role);
    if (banned !== undefined) setUserBanned(phone, banned);
    res.json({ success: true, data: { phone } });
  } catch (err) {
    res.status(400).json({ success: false, error: { code: "UPDATE_FAILED", message: (err as Error).message } });
  }
});
