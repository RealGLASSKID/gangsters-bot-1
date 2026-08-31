import express from "express";
import cors from "cors";
import helmet from "helmet";
import "./db/connection"; // runs schema migration on import
import "./bot/games/index"; // registers all games

import { healthRouter } from "./routes/health";
import { inboundRouter } from "./routes/inbound";
import { usersRouter } from "./routes/users";
import { gamesRouter } from "./routes/games";
import { sessionsRouter, messagesRouter } from "./routes/adminData";
import { requireDashboardKey } from "./middleware/dashboardAuth";
import { errorHandler } from "./middleware/errorHandler";

export const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

// Public (relay authenticates itself via webhook secret, checked inside the route)
app.use("/health", healthRouter);
app.use("/webhook", inboundRouter);

// Dashboard-only, all require the dashboard API key
app.use("/api/admin/users", requireDashboardKey, usersRouter);
app.use("/api/admin/games", requireDashboardKey, gamesRouter);
app.use("/api/admin/sessions", requireDashboardKey, sessionsRouter);
app.use("/api/admin/messages", requireDashboardKey, messagesRouter);

app.use(errorHandler);
