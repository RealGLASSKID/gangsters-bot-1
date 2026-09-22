"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { signOut } from "firebase/auth";
import { clientAuth } from "@/lib/firebase/client";
import { useAuth } from "@/lib/firebase/useAuth";

const NAV = [
  { href: "/dashboard", label: "Overview", icon: "◆" },
  { href: "/dashboard/members", label: "Members", icon: "●" },
  { href: "/dashboard/rules", label: "Rules", icon: "§" },
  { href: "/dashboard/users", label: "Users & Roles", icon: "◎" },
  { href: "/dashboard/games", label: "Games", icon: "▸" },
  { href: "/dashboard/messages", label: "Messages", icon: "✉" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [welcome, setWelcome] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  useEffect(() => {
    if (!user) return;
    try {
      if (sessionStorage.getItem("gb_welcome") === "1") {
        sessionStorage.removeItem("gb_welcome");
        const name =
          user.displayName?.split(" ")[0] ||
          user.email?.split("@")[0] ||
          "boss";
        setWelcome(`Welcome back, ${name}. Sandra’s online — the gang’s in your hands. 🔥`);
        const t = setTimeout(() => setWelcome(null), 5500);
        return () => clearTimeout(t);
      }
    } catch {
      /* ignore */
    }
  }, [user]);

  if (loading || !user) {
    return (
      <div className="dash-shell">
        <div className="dash-bg" />
        <div className="dash-overlay" />
        <div className="loading-screen">Loading dashboard…</div>
      </div>
    );
  }

  return (
    <div className="dash-shell">
      <div className="dash-bg" />
      <div className="dash-overlay" />

      {welcome && (
        <div className="welcome-toast" role="status">
          <span className="welcome-toast-icon">👋</span>
          <p>{welcome}</p>
          <button type="button" aria-label="Dismiss" onClick={() => setWelcome(null)}>
            ×
          </button>
        </div>
      )}

      <div className="shell">
        <aside className="sidebar">
          <div className="sidebar-brand">
            <div className="sidebar-logo pulse-logo">S</div>
            <div>
              <h1>Sandra</h1>
              <p title={user.email || ""}>{user.email}</p>
            </div>
          </div>

          <nav className="sidebar-nav">
            {NAV.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`nav-link${active ? " active" : ""}`}
                >
                  <span className="nav-icon">{item.icon}</span>
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="sidebar-footer">
            <button className="btn-signout" onClick={() => signOut(clientAuth)}>
              Sign out
            </button>
          </div>
        </aside>

        <main className="main">{children}</main>
      </div>
    </div>
  );
}
