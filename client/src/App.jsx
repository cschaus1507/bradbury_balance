import React, { useEffect, useMemo, useState } from "react";
import { Bar, Doughnut } from "react-chartjs-2";
import { getPeriods, getStats, submit } from "./api.js";
import { fmtMinutes } from "./charts.js";

const APP_LIST = [
  "TikTok","Instagram","Snapchat","YouTube","Netflix","Hulu","Disney+",
  "Spotify","Roblox","Minecraft","Discord","Messages/Texting","Safari/Chrome",
  "X/Twitter","Facebook","Reddit","Schoology","Google Classroom","Gmail",
  "Fortnite","Other"
];

function numberOrNull(v) {
  if (v === "" || v == null) return null;
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : null;
}

function minutesFromHM(h, m) {
  const hh = numberOrNull(h) ?? 0;
  const mm = numberOrNull(m) ?? 0;
  const total = (hh * 60) + mm;
  return Math.max(0, Math.min(1440, total));
}

export default function App() {
  const [tab, setTab] = useState("submit"); // submit | dashboard
  const [days, setDays] = useState(30);

  // form state
  const [period, setPeriod] = useState(1);
  const [deviceType, setDeviceType] = useState("iphone");
  const [timeframe, setTimeframe] = useState("7dayavg");
  const [h, setH] = useState("");
  const [m, setM] = useState("");
  const [pickups, setPickups] = useState("");
  const [notifications, setNotifications] = useState("");

  const [social, setSocial] = useState("");
  const [entertainment, setEntertainment] = useState("");
  const [games, setGames] = useState("");
  const [productivity, setProductivity] = useState("");
  const [communication, setCommunication] = useState("");

  const [top1, setTop1] = useState("TikTok");
  const [top2, setTop2] = useState("YouTube");
  const [top3, setTop3] = useState("Snapchat");

  const [reflection, setReflection] = useState("");
  const [submitMsg, setSubmitMsg] = useState(null);

  // dashboard state
  const [periods, setPeriods] = useState([]);
  const [dashPeriod, setDashPeriod] = useState("all");
  const [stats, setStatsState] = useState(null);
  const [dashErr, setDashErr] = useState(null);
  const [loading, setLoading] = useState(false);

  async function loadDashboard(p = dashPeriod, d = days) {
    setLoading(true);
    setDashErr(null);
    try {
      const [pRows, s] = await Promise.all([
        getPeriods(d),
        getStats({ period: p, days: d })
      ]);
      setPeriods(pRows);
      setStatsState(s);
    } catch (e) {
      setDashErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (tab === "dashboard") loadDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const screenMinutes = useMemo(() => minutesFromHM(h, m), [h, m]);

  async function onSubmit(e) {
    e.preventDefault();
    setSubmitMsg(null);

    const topApps = [
      { name: top1 },
      { name: top2 },
      { name: top3 }
    ].filter(x => x.name && x.name !== "");

    try {
      await submit({
        period: Number(period),
        deviceType,
        timeframe,
        screenMinutes,
        pickups: numberOrNull(pickups),
        notifications: numberOrNull(notifications),
        socialMinutes: numberOrNull(social),
        entertainmentMinutes: numberOrNull(entertainment),
        gamesMinutes: numberOrNull(games),
        productivityMinutes: numberOrNull(productivity),
        communicationMinutes: numberOrNull(communication),
        topApps,
        reflectionText: reflection.trim() ? reflection.trim() : null
      });

      setSubmitMsg({ ok: true, text: "Submitted. Thanks for contributing to the class mirror 👀" });

      // reset a few fields lightly (keep period)
      setH(""); setM("");
      setPickups(""); setNotifications("");
      setSocial(""); setEntertainment(""); setGames(""); setProductivity(""); setCommunication("");
      setReflection("");

      setTab("dashboard");
      await loadDashboard(dashPeriod, days);
    } catch (e2) {
      setSubmitMsg({ ok: false, text: e2.message });
    }
  }

  const histogramData = useMemo(() => {
    if (!stats || stats.hidden) return null;
    const h = stats.histogram || {};
    return {
      labels: ["0–2h","2–4h","4–6h","6–8h","8h+"],
      datasets: [
        {
          label: "Students",
          data: [h.b0_2, h.b2_4, h.b4_6, h.b6_8, h.b8p]
        }
      ]
    };
  }, [stats]);

  const categoriesData = useMemo(() => {
    if (!stats || stats.hidden) return null;

    const vals = [
      { k: "Social", v: stats.avg_social },
      { k: "Entertainment", v: stats.avg_entertainment },
      { k: "Games", v: stats.avg_games },
      { k: "Productivity", v: stats.avg_productivity },
      { k: "Communication", v: stats.avg_communication }
    ].map(x => ({ ...x, v: Math.max(0, Math.round(x.v || 0)) }));

    const total = vals.reduce((a,b) => a + b.v, 0);
    if (total === 0) return null;

    return {
      labels: vals.map(x => x.k),
      datasets: [{
        data: vals.map(x => x.v),
        // Bold, high-contrast colors for dark mode
        backgroundColor: [
          "#7C3AED", // Social (purple)
          "#F97316", // Entertainment (orange)
          "#22C55E", // Games (green)
          "#06B6D4", // Productivity (cyan)
          "#F43F5E"  // Communication (pink/red)
        ],
        borderColor: "rgba(255,255,255,0.25)",
        borderWidth: 2
      }]
    };
  }, [stats]);

  return (
    <div className="container">
      <div className="header">
        <div className="brand">
          <div className="badge">RH</div>
          <div className="title">
            <h1>Bradbury Balance App</h1>
            <p>
              Roy-Hart Rams • Class of 2026 — anonymous, aggregate screen-time snapshots to fuel our
              conversations about tech, attention, and authentic life (no names, no tracking).
            </p>
          </div>
        </div>

        <div style={{display:"flex", gap:10, alignItems:"center", flexWrap:"wrap"}}>
          <button className={`btn ${tab==="submit"?"primary":""}`} onClick={() => setTab("submit")}>Submit</button>
          <button className={`btn ${tab==="dashboard"?"primary":""}`} onClick={() => setTab("dashboard")}>Dashboard</button>
        </div>
      </div>

      <div className="tabs">
        <button className="btn ghost" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
          “The parlor walls” → our data mirror
        </button>
      </div>

      <div className="grid">
        <div className="card">
          <h2>Anonymous submission</h2>
          <p className="subtle">
            Use your phone settings (Screen Time / Digital Wellbeing). Approximate is fine.
            Please don’t submit anyone else’s data.
          </p>

          <div className="hr" />

          <form onSubmit={onSubmit}>
            <label>Class period</label>
            <select value={period} onChange={(e)=>setPeriod(e.target.value)}>
              {Array.from({length: 9}, (_,i)=>i+1).map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>

            <label>Device</label>
            <select value={deviceType} onChange={(e)=>setDeviceType(e.target.value)}>
              <option value="iphone">iPhone</option>
              <option value="android">Android</option>
              <option value="other">Other</option>
            </select>

            <label>Timeframe</label>
            <select value={timeframe} onChange={(e)=>setTimeframe(e.target.value)}>
              <option value="7dayavg">Last 7 days average</option>
              <option value="yesterday">Yesterday</option>
            </select>

            <label>Average daily screen time</label>
            <div className="row">
              <input inputMode="numeric" placeholder="Hours" value={h} onChange={(e)=>setH(e.target.value.replace(/\D/g,""))} />
              <input inputMode="numeric" placeholder="Minutes" value={m} onChange={(e)=>setM(e.target.value.replace(/\D/g,""))} />
            </div>
            <div className="small">We’ll convert this to total minutes.</div>

            <label>Pickups / unlocks (optional)</label>
            <input inputMode="numeric" placeholder="e.g., 95" value={pickups} onChange={(e)=>setPickups(e.target.value.replace(/\D/g,""))} />

            <label>Notifications per day (optional)</label>
            <input inputMode="numeric" placeholder="e.g., 120" value={notifications} onChange={(e)=>setNotifications(e.target.value.replace(/\D/g,""))} />

            <div className="hr" />
            <h2 style={{marginTop:0}}>Categories (optional)</h2>
            <p className="subtle">If your phone shows category minutes, enter them here (minutes per day).</p>

            <label>Social minutes</label>
            <input inputMode="numeric" placeholder="Minutes" value={social} onChange={(e)=>setSocial(e.target.value.replace(/\D/g,""))} />
            <label>Entertainment minutes</label>
            <input inputMode="numeric" placeholder="Minutes" value={entertainment} onChange={(e)=>setEntertainment(e.target.value.replace(/\D/g,""))} />
            <label>Games minutes</label>
            <input inputMode="numeric" placeholder="Minutes" value={games} onChange={(e)=>setGames(e.target.value.replace(/\D/g,""))} />
            <label>Productivity minutes</label>
            <input inputMode="numeric" placeholder="Minutes" value={productivity} onChange={(e)=>setProductivity(e.target.value.replace(/\D/g,""))} />
            <label>Communication minutes</label>
            <input inputMode="numeric" placeholder="Minutes" value={communication} onChange={(e)=>setCommunication(e.target.value.replace(/\D/g,""))} />

            <div className="hr" />
            <h2 style={{marginTop:0}}>Top apps (optional)</h2>
            <p className="subtle">Pick your top 3 apps by time (no minutes needed).</p>

            <label>Top app #1</label>
            <select value={top1} onChange={(e)=>setTop1(e.target.value)}>
              {APP_LIST.map(a => <option key={a} value={a}>{a}</option>)}
            </select>

            <label>Top app #2</label>
            <select value={top2} onChange={(e)=>setTop2(e.target.value)}>
              {APP_LIST.map(a => <option key={a} value={a}>{a}</option>)}
            </select>

            <label>Top app #3</label>
            <select value={top3} onChange={(e)=>setTop3(e.target.value)}>
              {APP_LIST.map(a => <option key={a} value={a}>{a}</option>)}
            </select>

            <label>One-sentence reflection (optional)</label>
            <textarea
              maxLength={240}
              placeholder='“Tech gives me…” / “Tech takes from me…”'
              value={reflection}
              onChange={(e)=>setReflection(e.target.value)}
            />

            <div className="hr" />

            <button className="btn primary" type="submit">Submit anonymously</button>

            {submitMsg && (
              <div style={{marginTop:12}} className="kanon">
                <b>{submitMsg.ok ? "✅" : "⚠️"}</b> {submitMsg.text}
              </div>
            )}

            <div className="footer">
              Privacy: we do not collect names/emails. Dashboard shows aggregate stats only.
            </div>
          </form>
        </div>

        <div className="card">
          <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", gap:12, flexWrap:"wrap"}}>
            <div>
              <h2>Class dashboard</h2>
              <p className="subtle">Averages + distributions (no individual submissions shown).</p>
            </div>

            <div style={{display:"flex", gap:10, alignItems:"center", flexWrap:"wrap"}}>
              <select value={dashPeriod} onChange={(e)=>setDashPeriod(e.target.value)}>
                <option value="all">All periods</option>
                {periods.map(p => (
                  <option key={p.period} value={p.period}>
                    Period {p.period}{p.displayable ? "" : " (hidden until enough data)"}
                  </option>
                ))}
              </select>

              <select value={days} onChange={(e)=>setDays(parseInt(e.target.value,10))}>
                <option value={7}>Last 7 days</option>
                <option value={30}>Last 30 days</option>
                <option value={90}>Last 90 days</option>
              </select>

              <button className="btn" onClick={() => loadDashboard(dashPeriod, days)}>Refresh</button>
            </div>
          </div>

          <div className="hr" />

          {loading && <p className="subtle">Loading…</p>}
          {dashErr && <div className="kanon">⚠️ {dashErr}</div>}

          {stats && stats.hidden && (
            <div className="kanon">
              <b>Period-level stats hidden</b><br/>
              Need at least <b>{stats.kMin}</b> submissions for this period to protect anonymity.
              Current: <b>{stats.n}</b>.
            </div>
          )}

          {stats && !stats.hidden && (
            <>
              <div className="statRow">
                <div className="stat">
                  <div className="k">Submissions (window)</div>
                  <div className="v">{stats.n}</div>
                </div>
                <div className="stat">
                  <div className="k">Avg screen time</div>
                  <div className="v">{fmtMinutes(stats.avg_screen)}</div>
                </div>
                <div className="stat">
                  <div className="k">Median screen time</div>
                  <div className="v">{fmtMinutes(stats.median_screen)}</div>
                </div>
              </div>

              <div className="statRow">
                <div className="stat">
                  <div className="k">Avg pickups/unlocks</div>
                  <div className="v">{stats.avg_pickups == null ? "—" : Math.round(stats.avg_pickups)}</div>
                </div>
                <div className="stat">
                  <div className="k">Avg notifications</div>
                  <div className="v">{stats.avg_notifications == null ? "—" : Math.round(stats.avg_notifications)}</div>
                </div>
                <div className="stat">
                  <div className="k">Window</div>
                  <div className="v">{stats.windowDays}d</div>
                </div>
              </div>

              <div className="hr" />

              {histogramData && (
                <>
                  <h2>Screen-time distribution</h2>
                  <p className="subtle">How many students fall into each range.</p>
                  <Bar
                    data={histogramData}
                    options={{
                      responsive: true,
                      plugins: {
                        legend: { display: false },
                        title: { display: false }
                      }
                    }}
                  />
                </>
              )}

              <div className="hr" />

              {categoriesData ? (
                <>
                  <h2>Average category minutes</h2>
                  <p className="subtle">Based on optional category entries.</p>
                  <div style={{maxWidth:520}}>
                    <Doughnut
                      data={categoriesData}
                      options={{
                        responsive: true,
                        plugins: {
                          legend: {
                            position: "bottom",
                            labels: {
                              color: "rgba(255,255,255,0.9)",
                              font: { size: 13, weight: "bold" }
                            }
                          }
                        }
                      }}
                    />
                  </div>
                </>
              ) : (
                <div className="kanon">
                  <b>Category chart</b><br/>
                  Not enough category data yet (optional fields). Once students submit it, this will appear.
                </div>
              )}

              <div className="hr" />

              <h2>Top apps (mentions)</h2>
              <p className="subtle">Most commonly listed in “Top 3 apps.”</p>

              {stats.topApps?.length ? (
                <div style={{overflowX:"auto"}}>
                  <table style={{width:"100%", borderCollapse:"collapse"}}>
                    <thead>
                      <tr>
                        <th style={{textAlign:"left", padding:"8px 6px"}}>App</th>
                        <th style={{textAlign:"right", padding:"8px 6px"}}>Mentions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.topApps.map((a) => (
                        <tr key={a.name} style={{borderTop:"1px solid rgba(255,255,255,.08)"}}>
                          <td style={{padding:"8px 6px"}}>{a.name}</td>
                          <td style={{padding:"8px 6px", textAlign:"right"}}>{a.mentions}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="kanon">No app data yet. Submit your “Top 3 apps” to populate this.</div>
              )}

              <div className="footer">
                Reminder: this is anonymous and aggregate. Use it to think, not to judge.
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
