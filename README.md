# CRM Application

Full-stack CRM web application built with React (frontend), Node.js + Express (backend), and PostgreSQL.

## Tech Stack

- **Frontend:** React 18, React Router, Recharts, Tailwind CSS, Vite
- **Backend:** Node.js, Express, JWT auth with role-based access control (RBAC)
- **Database:** PostgreSQL (`CRM_` prefixed tables)

## Roles

- **Super Admin** — full access, creates Admin accounts, system-level settings
- **Admin** — dashboard/analytics, create/edit projects, users, items, approve/reject item entries, allocate petty cash, edit all bills
- **User** — logistics, submit item entries (pending approval), log income/expense bills, view only their own entries and petty cash balance

## Project Structure

```
backend/          Express REST API
  src/
    config/       Server & DB configuration
    controllers/  Route handlers
    middleware/   JWT auth + validation
    models/       Data access layer
    routes/       API routes
    utils/        migrations & seed
frontend/         React app (Vite)
  src/
    components/   Shared UI components
    context/      AuthContext
    pages/        Feature pages
    services/     Axios API client
    utils/        Formatting helpers
database/
  schema.sql      Full SQL schema
```

## Setup

### 1. Database

Create a PostgreSQL database (default: `crm_db`), then copy and edit the backend env file:

```bash
cd backend
copy .env.example .env   # Windows
# edit DB_USER / DB_PASSWORD to match your PostgreSQL setup
```

### 2. Backend

```bash
cd backend
npm install
npm run migrate   # create tables
npm run seed      # create default super admin
npm run dev       # start server on http://localhost:3001
```

Default super admin (override in `.env`):

```
Email:    admin@crm.local
Password: admin12345
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev       # start app on http://localhost:5173
```

The Vite dev server proxies `/api` requests to the backend at `http://localhost:3001`.

## API Overview

| Module | Base path | Auth |
| --- | --- | --- |
| Auth | `/api/auth` (login, me, refresh) | public login |
| Users | `/api/users` | admin, super_admin |
| Projects | `/api/projects` | all authenticated (mutations: admin) |
| Items | `/api/items` | all authenticated (approve/reject: admin) |
| Petty Cash | `/api/petty-cash` | all authenticated (allocate: admin) |
| Bills | `/api/bills` | all authenticated |
| Dashboard | `/api/dashboard` | stats: admin, user: all |
| Audit Logs | `/api/audit-logs` | admin, super_admin |