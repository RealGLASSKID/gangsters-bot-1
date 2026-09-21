"use client";

import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";

function readConfig() {
  return {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
  };
}

export function isFirebaseConfigured(): boolean {
  const c = readConfig();
  return !!(c.apiKey && c.apiKey !== "undefined" && c.apiKey.length > 10 && c.projectId);
}

let _auth: Auth | null = null;

function getFirebaseApp(): FirebaseApp {
  if (getApps().length) return getApp();
  const config = readConfig();
  if (!config.apiKey || config.apiKey.length < 10) {
    // Avoid auth/invalid-api-key during next build / SSR
    throw new Error(
      "Firebase is not configured. Set NEXT_PUBLIC_FIREBASE_API_KEY (and related vars) in frontend/.env"
    );
  }
  return initializeApp(config);
}

/** Lazy auth — only initializes when actually used in the browser with a valid key. */
export function getClientAuth(): Auth {
  if (_auth) return _auth;
  _auth = getAuth(getFirebaseApp());
  return _auth;
}

/** Backward-compatible export used across the app */
export const clientAuth: Auth = new Proxy({} as Auth, {
  get(_target, prop, receiver) {
    const auth = getClientAuth();
    const value = Reflect.get(auth as object, prop, receiver);
    return typeof value === "function" ? value.bind(auth) : value;
  },
});
