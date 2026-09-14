"use client";

import { useEffect, useState } from "react";
import { api, type Cmd, type CoinRow, type Giveaway, type Health, type RepRow, type Stats, type XpRow } from "@/lib/api";
import { SessionPanel } from "./SessionPanel";

type Props = { token: string };

export function Dashboard({ token }: Props) {
  const [tab, setTab] = useState<"xp" | "coins" | "rep">("xp");
  const [health, setHealth] = useState<Health | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [xp, setXp] = useState<XpRow[]>([]);
  const [coins, setCoins] = useState<CoinRow[]>([]);
  const [rep, setRep] = useState<RepRow[]>([]);
  const [giveaway, setGiveaway] = useState<Giveaway>(null);
  const [commands, setCommands] = useState<Cmd[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [h, s, x, c, r, g, cmds] = await Promise.all([
          api.health(),
          api.stats(token),
          api.xp(token),
          api.coins(token),
          api.rep(token),
          api.giveaway(token),
          api.commands(token),
        ]);
        if (cancelled) return;
        setHealth(h);
        setStats(s);
        setXp(x);
        setCoins(c);
        setRep(r);
        setGiveaway(g);
        setCommands(cmds);
        setError("");
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "API error");
      }
    }
    void load();
    const id = setInterval(() => void load(), 15000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [token]);

  if (error && !stats) {
    return (
      <div className="container">
        <header>
          <h1>GANGSTER BOT</h1>
        </header>
        <div className="error">{error}</div>
      </div>
    );
  }

  return (
    <div className="container">
      <header>
        <h1>{health?.bot || "GANGSTER BOT"}</h1>
        <span className="badge">
          <span className={`dot ${health?.connected ? "on" : ""}`} />
          {health?.connected ? "Connected" : health?.status || "Disconnected"}
        </span>
      </header>

      <div className="grid">
        <div className="card">
          <h3>Members</h3>
          <div className="value">{stats?.members ?? "—"}</div>
        </div>
        <div className="card">
          <h3>Messages</h3>
          <div className="value">{stats?.totalMessages ?? "—"}</div>
        </div>
        <div className="card">
          <h3>Total GC</h3>
          <div className="value">{stats?.totalCoins ?? "—"}</div>
        </div>
      </div>

      <SessionPanel token={token} />

      {giveaway && (
        <div className="section">
          <h2>Active Giveaway</h2>
          <div className="card">
            <strong>{giveaway.prize}</strong>
            <p className="muted">
              {giveaway.entries} entries · ends {new Date(giveaway.endsAt).toLocaleString()}
            </p>
          </div>
        </div>
      )}

      <div className="section">
        <h2>Leaderboards</h2>
        <div className="tabs">
          <button className={`tab ${tab === "xp" ? "active" : ""}`} onClick={() => setTab("xp")}>
            XP
          </button>
          <button className={`tab ${tab === "coins" ? "active" : ""}`} onClick={() => setTab("coins")}>
            Coins
          </button>
          <button className={`tab ${tab === "rep" ? "active" : ""}`} onClick={() => setTab("rep")}>
            Rep
          </button>
        </div>

        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          {tab === "xp" && (
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Name</th>
                  <th>Level</th>
                  <th>XP</th>
                  <th>Msgs</th>
                </tr>
              </thead>
              <tbody>
                {xp.map((r, i) => (
                  <tr key={i}>
                    <td>{i + 1}</td>
                    <td>{r.name}</td>
                    <td>{r.level}</td>
                    <td>{r.xp}</td>
                    <td>{r.messages}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {tab === "coins" && (
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Name</th>
                  <th>Wallet</th>
                  <th>Bank</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {coins.map((r, i) => (
                  <tr key={i}>
                    <td>{i + 1}</td>
                    <td>{r.name}</td>
                    <td>{r.coins}</td>
                    <td>{r.bank}</td>
                    <td>{r.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {tab === "rep" && (
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Name</th>
                  <th>Rep</th>
                </tr>
              </thead>
              <tbody>
                {rep.map((r, i) => (
                  <tr key={i}>
                    <td>{i + 1}</td>
                    <td>{r.name}</td>
                    <td>{r.rep}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className="section">
        <h2>Commands ({commands.length})</h2>
        <div className="cmd-list">
          {commands.map((c) => (
            <div className="cmd" key={c.name}>
              <code>!{c.name}</code>
              <span className="muted">
                {c.description}
                {c.adminOnly ? " · admin" : ""}
                {c.ownerOnly ? " · owner" : ""}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
