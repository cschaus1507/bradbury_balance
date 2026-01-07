import { pool } from "./db.js";

function kMin() {
  const k = parseInt(process.env.K_ANON_MIN || "8", 10);
  return Number.isFinite(k) ? k : 8;
}

/**
 * Returns aggregate stats. If period is provided, period-level stats
 * are only returned if count >= K_ANON_MIN.
 */
export async function getStats({ period = null, days = 30 } = {}) {
  const k = kMin();

  const where = [];
  const params = [];
  let idx = 1;

  // last N days window (default 30)
  where.push(`created_date >= CURRENT_DATE - ($${idx}::int)`);
  params.push(days);
  idx++;

  if (period != null) {
    where.push(`period = $${idx}`);
    params.push(period);
    idx++;
  }

  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

  // Count first for k-anon
  const countRes = await pool.query(
    `SELECT COUNT(*)::int AS n FROM submissions ${whereSql}`,
    params
  );
  const n = countRes.rows[0]?.n ?? 0;

  if (period != null && n < k) {
    return {
      ok: true,
      hidden: true,
      kMin: k,
      n,
      period
    };
  }

  // Core aggregates
  const aggRes = await pool.query(
    `
    SELECT
      COUNT(*)::int AS n,
      AVG(screen_minutes)::float AS avg_screen,
      PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY screen_minutes) AS median_screen,

      AVG(pickups)::float AS avg_pickups,
      AVG(notifications)::float AS avg_notifications,

      AVG(social_minutes)::float AS avg_social,
      AVG(entertainment_minutes)::float AS avg_entertainment,
      AVG(games_minutes)::float AS avg_games,
      AVG(productivity_minutes)::float AS avg_productivity,
      AVG(communication_minutes)::float AS avg_communication
    FROM submissions
    ${whereSql}
    `,
    params
  );

  // Histogram bins for screen time
  // Bins: 0-2, 2-4, 4-6, 6-8, 8+
  const binsRes = await pool.query(
    `
    SELECT
      SUM(CASE WHEN screen_minutes < 120 THEN 1 ELSE 0 END)::int AS b0_2,
      SUM(CASE WHEN screen_minutes >= 120 AND screen_minutes < 240 THEN 1 ELSE 0 END)::int AS b2_4,
      SUM(CASE WHEN screen_minutes >= 240 AND screen_minutes < 360 THEN 1 ELSE 0 END)::int AS b4_6,
      SUM(CASE WHEN screen_minutes >= 360 AND screen_minutes < 480 THEN 1 ELSE 0 END)::int AS b6_8,
      SUM(CASE WHEN screen_minutes >= 480 THEN 1 ELSE 0 END)::int AS b8p
    FROM submissions
    ${whereSql}
    `,
    params
  );

  // Top apps by mention frequency (and optional minutes when provided)
  const appsRes = await pool.query(
    `
    WITH apps AS (
      SELECT
        (elem->>'name') AS name,
        NULLIF((elem->>'minutes')::int, NULL) AS minutes
      FROM submissions s
      CROSS JOIN LATERAL jsonb_array_elements(COALESCE(s.top_apps, '[]'::jsonb)) AS elem
      ${whereSql}
    )
    SELECT
      name,
      COUNT(*)::int AS mentions,
      AVG(minutes)::float AS avg_minutes
    FROM apps
    WHERE name IS NOT NULL AND name <> ''
    GROUP BY name
    ORDER BY mentions DESC, avg_minutes DESC NULLS LAST
    LIMIT 10;
    `,
    params
  );

  return {
    ok: true,
    hidden: false,
    period,
    windowDays: days,
    ...aggRes.rows[0],
    histogram: binsRes.rows[0],
    topApps: appsRes.rows
  };
}

export async function getPeriodsSummary({ days = 30 } = {}) {
  const k = kMin();
  const res = await pool.query(
    `
    SELECT
      period,
      COUNT(*)::int AS n,
      AVG(screen_minutes)::float AS avg_screen
    FROM submissions
    WHERE created_date >= CURRENT_DATE - ($1::int)
    GROUP BY period
    ORDER BY period ASC;
    `,
    [days]
  );

  // Mark which periods are displayable by k-anon
  return res.rows.map(r => ({
    ...r,
    displayable: r.n >= k
  }));
}
