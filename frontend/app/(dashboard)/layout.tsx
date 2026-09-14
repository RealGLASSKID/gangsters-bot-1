"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { signOut } from "firebase/auth";
import { clientAuth } from "@/lib/firebase/client";
import { useAuth } from "@/lib/firebase/useAuth";

const NAV = [
  { href: "/dashboard", label: "Overview", icon: "◆" },
  { href: "/dashboard/users", label: "Users & Roles", icon: "◎" },
  { href: "/dashboard/games", label: "Games", icon: "▸" },
  { href: "/dashboard/messages", label: "Messages", icon: "✉" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  if (loading || !user) {
    return <div className="loading-screen">Loading dashboard…</div>;
  }

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="sidebar-logo">G</div>
          <div>
            <h1>Gangster Bot</h1>
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
  );
}
