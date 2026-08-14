import mysql from 'mysql2/promise';
import { config } from '../config/index.js';

export const pool = mysql.createPool({
  host: config.db.host,
  port: config.db.port,
  database: config.db.database,
  user: config.db.user,
  password: config.db.password,
  waitForConnections: true,
  connectionLimit: 20,
  queueLimit: 0,
  dateStrings: true,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle connection', err);
  process.exit(-1);
});

const translate = (text) => text.replace(/\$\d+/g, '?');

export const query = async (text, params = []) => {
  const start = Date.now();
  const [result] = await pool.query(translate(text), params);
  const duration = Date.now() - start;

  if (Array.isArray(result)) {
    console.log('Executed query', { text: text.substring(0, 100), duration, rows: result.length });
    return { rows: result };
  }

  console.log('Executed query', {
    text: text.substring(0, 100),
    duration,
    affectedRows: result.affectedRows,
  });

  return {
    insertId: result.insertId,
    affectedRows: result.affectedRows,
    changedRows: result.changedRows,
  };
};

export const getClient = async () => {
  return await pool.getConnection();
};