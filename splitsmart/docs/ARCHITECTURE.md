# SplitSmart v2 — Architecture Explanation

## Overview

SplitSmart is a three-tier full-stack web application: a React frontend, a Node.js/Express REST API backend, and a MongoDB database. Each tier has a single responsibility and communicates with the next via well-defined interfaces.

---

## Tier 1 — React Frontend (Client)

The frontend is a Single Page Application (SPA) built with React 18 and React Router v6. The user's browser downloads the app once and all navigation happens client-side without full page reloads.

**Key pieces:**

- **Pages** (`/pages`) — Each route maps to a page component: Login, Register, Dashboard, GroupDetail, CreateGroup, AddExpense. Pages fetch their own data on mount using the API service.
- **AuthContext** — A React Context that holds the logged-in user's state globally. It reads the JWT token from `localStorage` on startup and exposes `login`, `register`, and `logout` methods.
- **ToastContext** — A lightweight notification system. Any component can call `addToast("message", "success"|"error")` and a toast appears in the corner automatically.
- **api.js (Axios)** — A centralized HTTP client. All API calls go through here. An Axios request interceptor automatically attaches the `Authorization: Bearer <token>` header to every request. A response interceptor catches 401 errors and redirects to `/login`.

**Data flow in the frontend:**
```
User action → Page component → api.js (Axios) → HTTP request to backend
                ↑                                        ↓
          setState() re-render ←───── JSON response ←───┘
```

---

## Tier 2 — Node.js + Express Backend (API Server)

The backend is a REST API server. It receives HTTP requests, applies business logic, and talks to the database. It is stateless — every request carries a JWT token so the server does not need sessions.

**Key pieces:**

- **server.js** — Entry point. Connects to MongoDB, then starts Express listening on port 5000.
- **Routes** (`/routes`) — Four route files handle the four main resources: `auth`, `groups`, `expenses`, `settlements`. Each file exports an Express Router.
- **authMiddleware** — A reusable function placed before any protected route. It extracts the JWT from the `Authorization` header, verifies it with `jsonwebtoken`, fetches the user from MongoDB, and attaches them to `req.user`.
- **Role-based access control (RBAC)** — Enforced inside routes: `if (group.createdBy !== req.user._id) return 403`. Only the creator can edit or delete their group. Only the expense payer can edit or delete their expense.

**Request lifecycle:**
```
HTTP Request
  → CORS middleware
  → JSON body parser
  → Router matches path & method
  → authMiddleware verifies JWT
  → Route handler runs business logic
  → Mongoose query to MongoDB
  → JSON response sent back
```

---

## Tier 3 — MongoDB + Mongoose (Database)

MongoDB stores all persistent data as JSON-like documents. Mongoose adds a schema layer on top, giving us type validation, default values, and model methods.

**Collections (Schemas):**

| Collection   | Purpose |
|-------------|---------|
| `users`     | Stores name, email, hashed password, avatar initials |
| `groups`    | Stores name, category, createdBy (ref → User), members array (ref → User) |
| `expenses`  | Stores amount, paidBy (ref → User), group (ref → Group), participants array with per-person shares |
| `settlements` | Records cash/UPI payments between two users |

Mongoose `populate()` is used to join related documents. For example, when fetching a group, we populate the `members` array to get full user objects instead of just IDs.

---

## How the three tiers connect

```
Browser (React)
      │  HTTP/JSON on port 3000 (dev proxy → 5000)
      ▼
Express API (Node.js) — port 5000
      │  Mongoose ODM
      ▼
MongoDB — port 27017
```

In development, the React app runs on port 3000 and the `"proxy": "http://localhost:5000"` setting in `package.json` forwards all `/api/*` requests to the backend. In production both would be behind a reverse proxy like Nginx.

---

## Security design

- Passwords are hashed with **bcryptjs** (10 salt rounds) before storage. Plain passwords are never saved.
- **JWT tokens** expire after 7 days. The secret key is set via environment variable (`JWT_SECRET`).
- The `User.toJSON()` method strips the `password` field before any user object is sent in a response.
- Route-level ownership checks prevent users from editing or deleting resources they did not create.
