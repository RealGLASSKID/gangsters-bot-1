import { api } from "@/lib/api";
import { Dashboard } from "@/components/Dashboard";

export const dynamic = "force-dynamic";

export default async function Home() {
  try {
    const [health, stats, xp, coins, rep, giveaway, commands] = await Promise.all([
      api.health(),
      api.stats(),
      api.xp(),
      api.coins(),
      api.rep(),
      api.giveaway(),
      api.commands(),
    ]);

    return (
      <Dashboard
        health={health}
        stats={stats}
        xp={xp}
        coins={coins}
        rep={rep}
        giveaway={giveaway}
        commands={commands}
      />
    );
  } catch {
    return (
      <div className="container">
        <header>
          <h1>GANGSTER BOT</h1>
        </header>
        <div className="error">
          Cannot reach API at{" "}
          <code>{process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}</code>
          <br />
          Start the backend first: <code>cd backend && npm run dev</code>
        </div>
      </div>
    );
  }
}
