# Bradbury Balance App (Roy-Hart Rams • Class of 2026)

Anonymous class screen-time + app-usage submissions with aggregate dashboards.
- **Frontend:** Vite + React
- **Backend:** Node + Express
- **Database:** Postgres (Render Managed Postgres)
- **Privacy:** No names/emails/IDs. Aggregates only. K-anonymity threshold for period-level views.

## Repo structure
- `/server` – Express API + Postgres schema + aggregation queries
- `/client` – Student UI + charts (Chart.js)

---

## Quick start (local)

### 1) Database
Have Postgres running locally and create a DB, e.g. `bradbury_balance`.

### 2) Server
```bash
cd server
cp .env.example .env
npm i
npm run db:init
npm run dev
```

### 3) Client
```bash
cd ../client
cp .env.example .env
npm i
npm run dev
```

Open the client URL shown in terminal.

---

## Deploy on Render (recommended)

### A) Create Postgres
1. Render Dashboard → **New** → **PostgreSQL**
2. Copy the **Internal Database URL** (for the server), and note: **DATABASE_URL**

### B) Deploy the API (Web Service)
1. Render → **New** → **Web Service** → connect GitHub repo
2. Root directory: `server`
3. Build command: `npm install && npm run build`
4. Start command: `npm start`
5. Environment variables:
   - `DATABASE_URL` = (from Render Postgres)
   - `K_ANON_MIN` = `8`
   - `ALLOWED_ORIGINS` = your client URL (or `*` temporarily while testing)

### C) Deploy the Client (Static Site)
1. Render → **New** → **Static Site**
2. Root directory: `client`
3. Build command: `npm install && npm run build`
4. Publish directory: `dist`
5. Environment variables:
   - `VITE_API_URL` = your API service URL, e.g. `https://bradbury-balance-api.onrender.com`

---

## Notes on anonymity & data quality
- No IP stored in DB.
- Basic rate-limit to reduce spam.
- Period stats are hidden until submissions >= `K_ANON_MIN` (default 8).
- Server normalizes screen-time values and rejects out-of-range values.

---

## Classroom usage idea
Run a baseline week, discuss, then re-run after a “Detox Friday” experiment and compare.
