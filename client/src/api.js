const API = import.meta.env.VITE_API_URL?.replace(/\/$/, "") || "http://localhost:8080";

export async function submit(payload) {
  const res = await fetch(`${API}/api/submit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  if (!data.ok) throw new Error(data.error || "Submit failed");
  return data;
}

export async function getPeriods(days = 30) {
  const res = await fetch(`${API}/api/periods?days=${encodeURIComponent(days)}`);
  const data = await res.json();
  if (!data.ok) throw new Error(data.error || "Failed to load periods");
  return data.rows;
}

export async function getStats({ period = "all", days = 30 } = {}) {
  const q = new URLSearchParams();
  if (period !== "all") q.set("period", String(period));
  q.set("days", String(days));
  const res = await fetch(`${API}/api/stats?${q.toString()}`);
  const data = await res.json();
  if (!data.ok) throw new Error(data.error || "Failed to load stats");
  return data;
}
