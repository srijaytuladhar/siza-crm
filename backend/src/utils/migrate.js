import { query } from '../config/database.js';

const migrations = [
  `-- Users & Roles
CREATE TABLE IF NOT EXISTS CRM_roles (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS CRM_users (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role_id INT REFERENCES CRM_roles(id),
    is_active BOOLEAN DEFAULT TRUE,
    created_by INT REFERENCES CRM_users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);`,

  `-- Projects
CREATE TABLE IF NOT EXISTS CRM_projects (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'active',
    created_by INT REFERENCES CRM_users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS CRM_project_users (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    project_id INT REFERENCES CRM_projects(id) ON DELETE CASCADE,
    user_id INT REFERENCES CRM_users(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP DEFAULT NOW(),
    UNIQUE KEY uq_project_user (project_id, user_id)
);`,

  `-- Items
CREATE TABLE IF NOT EXISTS CRM_items (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
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

  `-- Petty Cash
CREATE TABLE IF NOT EXISTS CRM_petty_cash_allocations (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    user_id INT REFERENCES CRM_users(id),
    amount NUMERIC(12,2) NOT NULL,
    assigned_by INT REFERENCES CRM_users(id),
    assigned_at TIMESTAMP DEFAULT NOW(),
    notes TEXT
);

CREATE TABLE IF NOT EXISTS CRM_petty_cash_expenses (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    user_id INT REFERENCES CRM_users(id),
    amount NUMERIC(12,2) NOT NULL,
    description TEXT,
    spent_at TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW()
);`,

  `-- Bills (Income & Expense)
CREATE TABLE IF NOT EXISTS CRM_bills (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
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

  `-- Audit Log
CREATE TABLE IF NOT EXISTS CRM_audit_logs (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    user_id INT REFERENCES CRM_users(id),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id INT,
    details JSON,
    created_at TIMESTAMP DEFAULT NOW()
);`,

  `-- Insert default roles
INSERT IGNORE INTO CRM_roles (name) VALUES ('super_admin'), ('admin'), ('user');`,

  `-- Item Types (specific to an item)
CREATE TABLE IF NOT EXISTS CRM_item_types (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    item_id INT REFERENCES CRM_items(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    created_by INT REFERENCES CRM_users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE KEY uq_item_type (item_id, name)
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

const ensureColumn = async (table, column, definition) => {
  const res = await query(
    `SELECT COUNT(*) AS count FROM information_schema.COLUMNS
     WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ?`,
    [table, column]
  );
  if (Number(res.rows[0].count) === 0) {
    await query(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
    console.log(`Added column ${table}.${column}`);
  }
};

const dropColumn = async (table, column) => {
  const res = await query(
    `SELECT COUNT(*) AS count FROM information_schema.COLUMNS
     WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ?`,
    [table, column]
  );
  if (Number(res.rows[0].count) > 0) {
    await query(`ALTER TABLE ${table} DROP COLUMN ${column}`);
    console.log(`Dropped column ${table}.${column}`);
  }
};

const dropIndex = async (table, index) => {
  const res = await query(
    `SELECT COUNT(*) AS count FROM information_schema.statistics
     WHERE table_schema = DATABASE() AND table_name = ? AND index_name = ?`,
    [table, index]
  );
  if (Number(res.rows[0].count) > 0) {
    await query(`ALTER TABLE ${table} DROP INDEX ${index}`);
    console.log(`Dropped index ${table}.${index}`);
  }
};

const applySchemaPatches = async () => {
  // Item types are now specific to an item
  await ensureColumn('CRM_item_types', 'item_id', 'INT REFERENCES CRM_items(id) ON DELETE CASCADE');
  await ensureColumn('CRM_bills', 'item_id', 'INT REFERENCES CRM_items(id)');
  await ensureColumn('CRM_bills', 'type_id', 'INT REFERENCES CRM_item_types(id)');

  // Remove the old global UNIQUE on type name, enforce unique per (item_id, name)
  await dropIndex('CRM_item_types', 'name');
  const hasUnique = await query(
    `SELECT COUNT(*) AS count FROM information_schema.statistics
     WHERE table_schema = DATABASE() AND table_name = 'CRM_item_types' AND index_name = 'uq_item_type'`
  );
  if (Number(hasUnique.rows[0].count) === 0) {
    await query(`ALTER TABLE CRM_item_types ADD UNIQUE KEY uq_item_type (item_id, name)`);
    console.log('Added unique key CRM_item_types.uq_item_type');
  }

  // Items no longer store a single type_id; types live in CRM_item_types keyed by item_id
  await dropColumnWithForeignKeys('CRM_items', 'type_id');
};

const dropColumnWithForeignKeys = async (table, column) => {
  const res = await query(
    `SELECT CONSTRAINT_NAME FROM information_schema.KEY_COLUMN_USAGE
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ? AND REFERENCED_TABLE_NAME IS NOT NULL`,
    [table, column]
  );
  for (const row of res.rows) {
    await query(`ALTER TABLE ${table} DROP FOREIGN KEY ${row.CONSTRAINT_NAME}`);
    console.log(`Dropped foreign key ${table}.${row.CONSTRAINT_NAME}`);
  }
  await dropColumn(table, column);
};

const ensureIndexes = async () => {
  for (const [name, table, columns] of indexes) {
    const res = await query(
      `SELECT COUNT(*) AS count FROM information_schema.statistics
       WHERE table_schema = DATABASE() AND table_name = ? AND index_name = ?`,
      [table, name]
    );
    if (Number(res.rows[0].count) === 0) {
      await query(`CREATE INDEX ${name} ON ${table} (${columns})`);
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