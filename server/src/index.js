import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { pool } from "./db.js";
import { normalizeSubmission } from "./validation.js";
import { getStats, getPeriodsSummary } from "./stats.js";

const app = express();
const port = process.env.PORT || 8080;

const allowed = (process.env.ALLOWED_ORIGINS || "").split(",").map(s => s.trim()).filter(Boolean);
const corsOptions = {
  origin: (origin, cb) => {
    if (!origin) return cb(null, true); // curl / server-to-server
    if (allowed.includes("*")) return cb(null, true);
    if (allowed.length === 0) return cb(null, true);
    if (allowed.includes(origin)) return cb(null, true);
    return cb(new Error("Not allowed by CORS"));
  }
};

app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json({ limit: "100kb" }));

// Basic anti-spam
app.use("/api/", rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false
}));

app.get("/api/health", async (req, res) => {
  try {
    await pool.query("SELECT 1;");
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, error: "DB unavailable" });
  }
});

app.post("/api/submit", async (req, res) => {
  try {
    const v = normalizeSubmission(req.body);

    const q = `
      INSERT INTO submissions (
        period, device_type, timeframe, screen_minutes,
        pickups, notifications,
        social_minutes, entertainment_minutes, games_minutes, productivity_minutes, communication_minutes,
        top_apps, reflection_text
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
      RETURNING id, created_date;
    `;

    const params = [
      v.period,
      v.deviceType,
      v.timeframe,
      v.screenMinutes,
      v.pickups,
      v.notifications,
      v.socialMinutes,
      v.entertainmentMinutes,
      v.gamesMinutes,
      v.productivityMinutes,
      v.communicationMinutes,
      v.topApps ? JSON.stringify(v.topApps) : null,
      v.reflectionText
    ];

    const ins = await pool.query(q, params);

    res.json({ ok: true, ...ins.rows[0] });
  } catch (e) {
    res.status(400).json({ ok: false, error: e?.message || "Invalid submission" });
  }
});

app.get("/api/stats", async (req, res) => {
  try {
    const period = req.query.period ? parseInt(req.query.period, 10) : null;
    const days = req.query.days ? Math.max(1, Math.min(365, parseInt(req.query.days, 10))) : 30;

    const data = await getStats({ period: Number.isFinite(period) ? period : null, days });
    res.json(data);
  } catch (e) {
    res.status(400).json({ ok: false, error: e?.message || "Bad request" });
  }
});

app.get("/api/periods", async (req, res) => {
  try {
    const days = req.query.days ? Math.max(1, Math.min(365, parseInt(req.query.days, 10))) : 30;
    const rows = await getPeriodsSummary({ days });
    res.json({ ok: true, rows });
  } catch (e) {
    res.status(400).json({ ok: false, error: e?.message || "Bad request" });
  }
});

app.listen(port, () => {
  console.log(`Bradbury Balance API listening on :${port}`);
});
