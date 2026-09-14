import admin from "firebase-admin";
import { dashboardConfig } from "../config";

let initTried = false;

function parseServiceAccount(): admin.ServiceAccount | null {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (raw) {
    try {
      return JSON.parse(raw) as admin.ServiceAccount;
    } catch {
      return null;
    }
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (projectId && clientEmail && privateKey) {
    return { projectId, clientEmail, privateKey };
  }
  return null;
}

export function initFirebaseAdmin(): boolean {
  if (admin.apps.length) return true;
  if (initTried) return admin.apps.length > 0;
  initTried = true;

  const creds = parseServiceAccount();
  if (!creds) return false;

  admin.initializeApp({ credential: admin.credential.cert(creds) });
  return true;
}

export function firebaseReady() {
  return initFirebaseAdmin();
}

export type AuthedUser = { uid: string; email: string | null };

export async function verifyIdToken(token: string): Promise<AuthedUser> {
  if (!initFirebaseAdmin()) {
    throw new Error("Firebase Admin is not configured");
  }
  const decoded = await admin.auth().verifyIdToken(token);
  const email = (decoded.email || "").toLowerCase() || null;

  if (dashboardConfig.adminEmails.length > 0) {
    if (!email || !dashboardConfig.adminEmails.includes(email)) {
      throw new Error("Email is not on the admin allowlist");
    }
  }

  return { uid: decoded.uid, email };
}
