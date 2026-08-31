import { db } from "../db/connection";
import { config } from "../config";
import type { BotUser, Role } from "../types";

export function isHardcodedSuperAdmin(phone: string): boolean {
  return config.superAdminPhones.has(phone);
}

const selectUser = db.prepare<[string], BotUser>(`SELECT * FROM users WHERE phone = ?`);
const insertUser = db.prepare(`
  INSERT INTO users (phone, role, displayName, createdAt, lastSeenAt, banned)
  VALUES (@phone, @role, @displayName, @createdAt, @lastSeenAt, @banned)
`);
const touchLastSeen = db.prepare(`UPDATE users SET lastSeenAt = ? WHERE phone = ?`);
const updateRoleStmt = db.prepare(`UPDATE users SET role = ? WHERE phone = ?`);
const updateBannedStmt = db.prepare(`UPDATE users SET banned = ? WHERE phone = ?`);
const updateNameStmt = db.prepare(`UPDATE users SET displayName = ? WHERE phone = ?`);
const listUsersStmt = db.prepare<[], BotUser>(`SELECT * FROM users ORDER BY lastSeenAt DESC LIMIT 500`);

function withEffectiveRole(user: BotUser): BotUser {
  return isHardcodedSuperAdmin(user.phone) ? { ...user, role: "super_admin" } : user;
}

/** Look up a user, auto-creating them as "member" on first contact.
 * Hardcoded super-admins always resolve to super_admin regardless of the
 * stored row, so they show up correctly in the dashboard too. */
export function getOrCreateUser(phone: string): BotUser {
  const now = Date.now();
  const existing = selectUser.get(phone);

  if (existing) {
    touchLastSeen.run(now, phone);
    return withEffectiveRole({ ...existing, lastSeenAt: now });
  }

  const row: BotUser = {
    phone,
    role: isHardcodedSuperAdmin(phone) ? "super_admin" : "member",
    displayName: null,
    createdAt: now,
    lastSeenAt: now,
    banned: 0,
  };
  insertUser.run(row);
  return row;
}

export function getUser(phone: string): BotUser | null {
  const row = selectUser.get(phone);
  return row ? withEffectiveRole(row) : null;
}

export function listUsers(): BotUser[] {
  return listUsersStmt.all().map(withEffectiveRole);
}

/** Throws if attempting to demote a hardcoded super-admin — that set is
 * controlled by the SUPER_ADMIN_PHONES env var, not the dashboard. */
export function setUserRole(phone: string, role: Role): void {
  if (isHardcodedSuperAdmin(phone) && role !== "super_admin") {
    throw new Error(
      `${phone} is a hardcoded super-admin (SUPER_ADMIN_PHONES env var). Remove it from the env var to change its role.`
    );
  }
  const result = updateRoleStmt.run(role, phone);
  if (result.changes === 0) throw new Error(`No such user: ${phone}`);
}

export function setDisplayName(phone: string, displayName: string): void {
  const result = updateNameStmt.run(displayName, phone);
  if (result.changes === 0) throw new Error(`No such user: ${phone}`);
}

export function setUserBanned(phone: string, banned: boolean): void {
  const result = updateBannedStmt.run(banned ? 1 : 0, phone);
  if (result.changes === 0) throw new Error(`No such user: ${phone}`);
}

export function roleAtLeast(role: Role, minimum: Role): boolean {
  const order: Role[] = ["member", "admin", "super_admin"];
  return order.indexOf(role) >= order.indexOf(minimum);
}
