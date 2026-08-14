# CRM Build Prompt

Build a full-stack CRM web application for a company. It must work well on both desktop and mobile browsers (responsive design).

## Tech Stack
- Frontend: React JS (with React Router, Context API or Redux for state, Tailwind CSS for responsive styling)
- Backend: Node.js + Express (REST API)
- Database: SQL (PostgreSQL or MySQL — pick PostgreSQL unless I say otherwise)
- Auth: JWT-based authentication with role-based access control (RBAC)
- Mobile + web friendly: fully responsive layouts, mobile-first components, collapsible sidebar/nav for small screens

## User Roles

### Super Admin
- Full system access
- Can create/edit/delete Admin accounts
- All Admin permissions below, plus system-level settings

### Admin
- View reports and analytics dashboard
- Create items
- Edit everything (items, projects, users, entries)
- Create projects
- Create users and assign/edit user roles
- Assign petty cash to users
- Approve/reject item entries submitted by users

### User
- Logistics management
- Entry of items (status: pending approval by Admin)
- General item entries
- Enter income and expenses (as bills, with attached details/receipt reference)
- View only their own entries and assigned petty cash balance

## Core Features
1. **Authentication**: Login/logout, JWT session handling, role-based route protection (Super Admin / Admin / User dashboards differ)
2. **User Management** (Admin/Super Admin): create, edit, deactivate users; assign roles
3. **Projects**: create/edit projects, assign users to projects
4. **Items Module**:
   - Users submit item entries (pending status)
   - Admin approves/rejects with a status history/audit trail
5. **Petty Cash**:
   - Admin assigns petty cash amounts to users
   - Users log expenses against their petty cash balance
   - Running balance tracked per user
6. **Income & Expense (Bills)**:
   - Users log income/expense bills with amount, category, date, description, project reference
   - Admin can view/edit all bills
7. **Dashboard & Analytics** (Admin/Super Admin):
   - Total income vs expense (charts, e.g. using Recharts)
   - Petty cash usage per user
   - Pending item approvals count
   - Project-wise financial summary
   - Recent activity feed
8. **Audit Log**: track who created/edited/approved what and when

## Database Schema (SQL)

Please generate full `CREATE TABLE` statements. All table names use the `CRM_` prefix. Use this as the baseline schema — expand as needed with proper foreign keys, indexes, and constraints:

```sql
-- Users & Roles
CREATE TABLE CRM_roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL -- super_admin, admin, user
);

CREATE TABLE CRM_users (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role_id INT REFERENCES CRM_roles(id),
    is_active BOOLEAN DEFAULT TRUE,
    created_by INT REFERENCES CRM_users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Projects
CREATE TABLE CRM_projects (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'active',
    created_by INT REFERENCES CRM_users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE CRM_project_users (
    id SERIAL PRIMARY KEY,
    project_id INT REFERENCES CRM_projects(id) ON DELETE CASCADE,
    user_id INT REFERENCES CRM_users(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP DEFAULT NOW()
);

-- Items
CREATE TABLE CRM_items (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    quantity INT DEFAULT 0,
    unit_price NUMERIC(12,2),
    project_id INT REFERENCES CRM_projects(id),
    status VARCHAR(50) DEFAULT 'pending', -- pending, approved, rejected
    created_by INT REFERENCES CRM_users(id),
    approved_by INT REFERENCES CRM_users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Petty Cash
CREATE TABLE CRM_petty_cash_allocations (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES CRM_users(id),
    amount NUMERIC(12,2) NOT NULL,
    assigned_by INT REFERENCES CRM_users(id),
    assigned_at TIMESTAMP DEFAULT NOW(),
    notes TEXT
);

CREATE TABLE CRM_petty_cash_expenses (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES CRM_users(id),
    amount NUMERIC(12,2) NOT NULL,
    description TEXT,
    spent_at TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Bills (Income & Expense)
CREATE TABLE CRM_bills (
    id SERIAL PRIMARY KEY,
    type VARCHAR(20) NOT NULL, -- income, expense
    amount NUMERIC(12,2) NOT NULL,
    category VARCHAR(100),
    description TEXT,
    project_id INT REFERENCES CRM_projects(id),
    bill_date DATE NOT NULL,
    created_by INT REFERENCES CRM_users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Audit Log
CREATE TABLE CRM_audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES CRM_users(id),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id INT,
    details JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);
```

## Deliverables
1. Backend Express API with all routes (auth, users, projects, items, petty cash, bills, dashboard analytics) — role-protected middleware
2. React frontend with:
   - Login page
   - Role-based dashboards (Super Admin / Admin / User)
   - Responsive sidebar navigation (collapses to bottom nav or hamburger on mobile)
   - Analytics dashboard with charts (Recharts) for Admin/Super Admin
   - Item entry + approval workflow UI
   - Petty cash tracking UI
   - Income/expense bill entry forms
3. SQL migration files matching the schema above
4. `.env.example` for DB connection and JWT secret
5. README with setup instructions

## Instructions for Claude Code
Start by scaffolding the project structure (backend + frontend as separate folders or a monorepo — your choice, explain why). Set up the database schema and migrations first, then build the auth system, then build out each module one at a time (Users → Projects → Items → Petty Cash → Bills → Dashboard). After each module, briefly summarize what was built before moving to the next.
