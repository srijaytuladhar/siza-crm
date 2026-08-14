import pg from 'pg';
import { config } from './index.js';

const { Pool } = pg;

const poolConfig = {
  host: config.db.host,
  port: config.db.port,
  database: config.db.database,
  user: config.db.user,
  password: config.db.password,
  connectionTimeoutMillis: 10000,
  max: 20,
};

if (config.db.connectionString) {
  Object.assign(poolConfig, {
    connectionString: config.db.connectionString,
  });
}

if (config.db.ssl) {
  poolConfig.ssl = { rejectUnauthorized: false };
}

export const pool = new Pool(poolConfig);

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

// Convert MySQL-style positional placeholders (? with $n) and MySQL idioms to Postgres.
const translate = (text) => {
  let paramIndex = 0;
  let inString = false;
  let out = '';

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];

    if (ch === "'" && (i === 0 || text[i - 1] !== '\\')) {
      inString = !inString;
      out += ch;
      continue;
    }

    if (ch === '?' && !inString) {
      paramIndex += 1;
      out += `$${paramIndex}`;
      continue;
    }

    out += ch;
  }

  let sql = out.replace(/\bINSERT\s+IGNORE\b/i, 'INSERT');

  if (/^\s*INSERT/i.test(sql)) {
    sql = sql.replace(/;\s*$/, '');
    if (!/\bON CONFLICT\b/i.test(sql)) {
      sql += ' ON CONFLICT DO NOTHING';
    }
    if (!/\bRETURNING\b/i.test(sql)) {
      sql += ' RETURNING *';
    }
  }

  return sql;
};

export const query = async (text, params = []) => {
  const start = Date.now();
  const sql = translate(text);
  const res = await pool.query(sql, params);
  const duration = Date.now() - start;

  if (Array.isArray(res.rows)) {
    console.log('Executed query', { text: sql.substring(0, 100), duration, rows: res.rows.length });
    return {
      rows: res.rows,
      insertId: res.rows[0] ? Number(res.rows[0].id ?? res.rows[0].insertId ?? 0) : undefined,
      affectedRows: res.rowCount,
    };
  }

  console.log('Executed query', {
    text: sql.substring(0, 100),
    duration,
    affectedRows: res.rowCount,
  });

  return {
    insertId: res.rows && res.rows[0] ? Number(res.rows[0].id ?? 0) : undefined,
    affectedRows: res.rowCount,
    changedRows: res.rowCount,
  };
};

export const getClient = async () => {
  return await pool.connect();
};
