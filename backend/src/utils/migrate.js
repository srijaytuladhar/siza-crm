import { query } from '../config/database.js';

const migrations = [
  `CREATE TABLE IF NOT EXISTS CRM_roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS CRM_users (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role_id INT REFERENCES CRM_roles(id),
    is_active BOOLEAN DEFAULT TRUE,
    created_by INT REFERENCES CRM_users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);`,

  `CREATE TABLE IF NOT EXISTS CRM_projects (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'active',
    created_by INT REFERENCES CRM_users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS CRM_project_users (
    id SERIAL PRIMARY KEY,
    project_id INT REFERENCES CRM_projects(id) ON DELETE CASCADE,
    user_id INT REFERENCES CRM_users(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP DEFAULT NOW(),
    UNIQUE (project_id, user_id)
);`,

  `CREATE TABLE IF NOT EXISTS CRM_items (
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
);`,

  `CREATE TABLE IF NOT EXISTS CRM_petty_cash_allocations (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES CRM_users(id),
    amount NUMERIC(12,2) NOT NULL,
    assigned_by INT REFERENCES CRM_users(id),
    assigned_at TIMESTAMP DEFAULT NOW(),
    notes TEXT
);

CREATE TABLE IF NOT EXISTS CRM_petty_cash_expenses (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES CRM_users(id),
    amount NUMERIC(12,2) NOT NULL,
    description TEXT,
    spent_at TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW()
);`,

  `CREATE TABLE IF NOT EXISTS CRM_bills (
    id SERIAL PRIMARY KEY,
    type VARCHAR(20) NOT NULL,
    amount NUMERIC(12,2) NOT NULL,
    category VARCHAR(100),
    description TEXT,
    project_id INT REFERENCES CRM_projects(id),
    bill_date DATE NOT NULL,
    created_by INT REFERENCES CRM_users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);`,

  `CREATE TABLE IF NOT EXISTS CRM_audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES CRM_users(id),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id INT,
    details JSON,
    created_at TIMESTAMP DEFAULT NOW()
);`,

  `INSERT INTO CRM_roles (name) VALUES ('super_admin'), ('admin'), ('user') ON CONFLICT DO NOTHING;`,

  `CREATE TABLE IF NOT EXISTS CRM_item_types (
    id SERIAL PRIMARY KEY,
    item_id INT REFERENCES CRM_items(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    created_by INT REFERENCES CRM_users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE (item_id, name)
);`
];

const indexes = [
  ['idx_crm_users_email', 'CRM_users', 'email'],
  ['idx_crm_users_role', 'CRM_users', 'role_id'],
  ['idx_crm_projects_status', 'CRM_projects', 'status'],
  ['idx_crm_items_status', 'CRM_items', 'status'],
  ['idx_crm_items_project', 'CRM_items', 'project_id'],
  ['idx_crm_items_created_by', 'CRM_items', 'created_by'],
  ['idx_crm_petty_cash_user', 'CRM_petty_cash_allocations', 'user_id'],
  ['idx_crm_expenses_user', 'CRM_petty_cash_expenses', 'user_id'],
  ['idx_crm_bills_type', 'CRM_bills', 'type'],
  ['idx_crm_bills_project', 'CRM_bills', 'project_id'],
  ['idx_crm_bills_created_by', 'CRM_bills', 'created_by'],
  ['idx_crm_audit_user', 'CRM_audit_logs', 'user_id'],
  ['idx_crm_audit_entity', 'CRM_audit_logs', 'entity_type, entity_id'],
  ['idx_crm_audit_created', 'CRM_audit_logs', 'created_at'],
];

const columnExists = async (table, column) => {
  const res = await query(
    `SELECT COUNT(*) AS count FROM information_schema.COLUMNS
     WHERE table_schema = current_schema() AND table_name = ? AND column_name = ?`,
    [table, column]
  );
  return Number(res.rows[0].count) > 0;
};

const indexExists = async (index) => {
  const res = await query(
    `SELECT COUNT(*) AS count FROM pg_indexes WHERE indexname = ?`,
    [index]
  );
  return Number(res.rows[0].count) > 0;
};

const ensureColumn = async (table, column, definition) => {
  if (!(await columnExists(table, column))) {
    await query(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
    console.log(`Added column ${table}.${column}`);
  }
};

const dropColumn = async (table, column) => {
  if (await columnExists(table, column)) {
    await query(`ALTER TABLE ${table} DROP COLUMN ${column}`);
    console.log(`Dropped column ${table}.${column}`);
  }
};

const applySchemaPatches = async () => {
  await dropColumn('CRM_items', 'type_id');
};

const ensureIndexes = async () => {
  for (const [name, table, columns] of indexes) {
    if (!(await indexExists(name))) {
      await query(`CREATE INDEX IF NOT EXISTS ${name} ON ${table} (${columns})`);
      console.log(`Created index ${name}`);
    }
  }
};

export const runMigrations = async () => {
  console.log('Running migrations...');
  for (let i = 0; i < migrations.length; i++) {
    const statements = migrations[i]
      .split(';')
      .map((s) => s.trim())
      .filter(Boolean);
    try {
      for (const stmt of statements) {
        await query(stmt);
      }
      console.log(`Migration ${i + 1} completed`);
    } catch (err) {
      console.error(`Migration ${i + 1} failed:`, err.message);
      throw err;
    }
  }
  await applySchemaPatches();
  await ensureIndexes();
  console.log('All migrations completed successfully');
};

const isDirectRun = process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href;
if (isDirectRun) {
  try {
    await runMigrations();
  } catch (err) {
    console.error('Migration failed:', err);
    process.exitCode = 1;
  } finally {
    const { pool } = await import('../config/database.js');
    await pool.end();
  }
}
