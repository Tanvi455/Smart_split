# SplitSmart v2 💸
> Full-stack expense splitting app — React + Node.js + MongoDB

**SE ZG503 FSAD Assignment | v2 — MongoDB Edition**

---

## What's new in v2
- ✅ MongoDB + Mongoose (replaced in-memory arrays)
- ✅ Edit group (name, description, category) — creator only
- ✅ Edit expense (amount, description, category) — payer only
- ✅ Delete group with cascade delete of expenses — creator only
- ✅ Delete expense — payer only
- ✅ Role-based access control enforced on every route
- ✅ Toast alerts (success/error) throughout the UI
- ✅ Loading spinners on all async operations
- ✅ Buttons disabled during API calls (no double-submits)

---

## Tech Stack
| Layer     | Technology                        |
|-----------|-----------------------------------|
| Frontend  | React 18, React Router v6, Axios  |
| Backend   | Node.js 18+, Express 4            |
| Database  | MongoDB 7, Mongoose 8             |
| Auth      | JWT (jsonwebtoken), bcryptjs      |

---

## Prerequisites
- **Node.js v18+** — https://nodejs.org
- **MongoDB** — install locally from https://www.mongodb.com/try/download/community  
  OR use a free cloud instance at https://cloud.mongodb.com (MongoDB Atlas)

---

## Setup & Run

### Step 1 — Clone / extract the project
```
splitsmart/
├── backend/
└── frontend/
```

### Step 2 — Configure the backend
```bash
cd backend
cp .env.example .env        # then open .env and set your MONGO_URI if needed
npm install
```

Default `.env` values work if MongoDB is running locally on port 27017.

### Step 3 — Seed demo data (optional but recommended)
```bash
node src/seed.js
```

### Step 4 — Start the backend
```bash
npm run dev    # http://localhost:5000
```
You should see:
```
✅ MongoDB connected: mongodb://127.0.0.1:27017/splitsmart
🚀 SplitSmart API v2 running at http://localhost:5000
```

### Step 5 — Start the frontend (new terminal)
```bash
cd frontend
npm install
npm start      # http://localhost:3000
```

---

## Demo Accounts (after seeding)
| Email            | Password     |
|------------------|-------------|
| alice@demo.com   | password123  |
| bob@demo.com     | password123  |
| carol@demo.com   | password123  |
| dev@demo.com     | password123  |

Login as **Alice** — she has groups and expenses pre-loaded.

---

## API Endpoints
| Method | Endpoint                     | Auth | Description             |
|--------|------------------------------|------|-------------------------|
| POST   | /api/auth/register           | –    | Register                |
| POST   | /api/auth/login              | –    | Login → JWT             |
| GET    | /api/auth/me                 | ✅   | Current user            |
| GET    | /api/auth/users?q=           | ✅   | Search users            |
| GET    | /api/groups                  | ✅   | My groups               |
| POST   | /api/groups                  | ✅   | Create group            |
| GET    | /api/groups/:id              | ✅   | Group detail            |
| PUT    | /api/groups/:id              | ✅   | Edit (creator only)     |
| DELETE | /api/groups/:id              | ✅   | Delete (creator only)   |
| POST   | /api/groups/:id/members      | ✅   | Add member              |
| GET    | /api/groups/:id/balances     | ✅   | Balances + settlements  |
| GET    | /api/expenses                | ✅   | All my expenses         |
| POST   | /api/expenses                | ✅   | Add expense             |
| PUT    | /api/expenses/:id            | ✅   | Edit (payer only)       |
| DELETE | /api/expenses/:id            | ✅   | Delete (payer only)     |
| GET    | /api/settlements/summary     | ✅   | Net balance summary     |
| POST   | /api/settlements             | ✅   | Record payment          |

---

## Docs
- `docs/ARCHITECTURE.md` — How the 3 tiers connect
- `docs/AI_USAGE_REFLECTION.md` — AI usage log (1–2 pages)
- `docs/API_DOCUMENTATION.md` — Full API reference
- `docs/DB_SCHEMA.md` — MongoDB schema details
