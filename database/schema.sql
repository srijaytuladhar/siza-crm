-- CRM Database Schema
-- ===================

-- Drop tables if they exist (for fresh migration)
DROP TABLE IF EXISTS CRM_audit_logs CASCADE;
DROP TABLE IF EXISTS CRM_bills CASCADE;
DROP TABLE IF EXISTS CRM_petty_cash_expenses CASCADE;
DROP TABLE IF EXISTS CRM_petty_cash_allocations CASCADE;
DROP TABLE IF EXISTS CRM_items CASCADE;
DROP TABLE IF EXISTS CRM_project_users CASCADE;
DROP TABLE IF EXISTS CRM_projects CASCADE;
DROP TABLE IF EXISTS CRM_users CASCADE;
DROP TABLE IF EXISTS CRM_roles CASCADE;

-- ============================================================
-- Users & Roles
-- ============================================================

CREATE TABLE CRM_roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL
);

INSERT INTO CRM_roles (name) VALUES ('super_admin'), ('admin'), ('user') ON CONFLICT DO NOTHING;

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

-- ============================================================
-- Projects
-- ============================================================

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

-- ============================================================
-- Items
-- ============================================================

CREATE TABLE CRM_items (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    quantity INT DEFAULT 0,
    unit_price NUMERIC(12,2),
    project_id INT REFERENCES CRM_projects(id),
    status VARCHAR(50) DEFAULT 'pending',
    created_by INT REFERENCES CRM_users(id),
    approved_by INT REFERENCES CRM_users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- Petty Cash
-- ============================================================

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

-- ============================================================
-- Bills (Income & Expense)
-- ============================================================

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

-- ============================================================
-- Audit Log
-- ============================================================

CREATE TABLE CRM_audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES CRM_users(id),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id INT,
    details JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);