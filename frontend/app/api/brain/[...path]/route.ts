import { NextRequest, NextResponse } from "next/server";

/**
 * The dashboard's browser code never talks to the brain directly — it
 * would need to know DASHBOARD_API_KEY, which must stay server-side.
 * Instead every /dashboard page calls this Next.js route (via
 * `authedFetch` in lib/firebase/useAuth.ts), which attaches the key and
 * forwards to the brain.
 *
 * This route trusts that the browser is a logged-in Firebase user for UX
 * purposes (the dashboard layout already redirects unauthenticated users
 * to /login), but does NOT re-verify the Firebase ID token server-side —
 * there's no Firebase Admin SDK in this app anymore. If you need real
 * per-human authorization at this boundary (not just "is someone logged
 * into the dashboard"), verify the token here with the Admin SDK, or add
 * a lightweight JWT check using Firebase's public JWKS instead of the
 * full Admin SDK.
 */

const BRAIN_URL = (process.env.BRAIN_URL || "http://localhost:3001").replace(/\/$/, "");
const DASHBOARD_API_KEY = process.env.DASHBOARD_API_KEY || "";

async function proxy(req: NextRequest, path: string[]) {
  if (!DASHBOARD_API_KEY) {
    return NextResponse.json(
      { success: false, error: { code: "MISCONFIGURED", message: "DASHBOARD_API_KEY not set on the dashboard server" } },
      { status: 500 }
    );
  }

  const targetUrl = `${BRAIN_URL}/api/admin/${path.join("/")}${req.nextUrl.search}`;
  const init: RequestInit = {
    method: req.method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${DASHBOARD_API_KEY}`,
    },
  };
  if (req.method !== "GET" && req.method !== "HEAD") {
    init.body = await req.text();
  }

  const res = await fetch(targetUrl, init);
  const body = await res.text();
  return new NextResponse(body, {
    status: res.status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxy(req, (await params).path);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxy(req, (await params).path);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxy(req, (await params).path);
}
