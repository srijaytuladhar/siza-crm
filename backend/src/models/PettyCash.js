import { query } from '../config/database.js';

export const PettyCashModel = {
  async getAllocations({ userId, page = 1, limit = 20 } = {}) {
    let whereClause = 'WHERE 1=1';
    const params = [];

    if (userId) {
      whereClause += ` AND pca.user_id = ?`;
      params.push(userId);
    }

    const offset = (page - 1) * limit;
    params.push(limit, offset);

    const res = await query(
      `SELECT pca.*, u.full_name as user_name, a.full_name as assigned_by_name
       FROM CRM_petty_cash_allocations pca
       LEFT JOIN CRM_users u ON pca.user_id = u.id
       LEFT JOIN CRM_users a ON pca.assigned_by = a.id
       ${whereClause}
       ORDER BY pca.assigned_at DESC
       LIMIT ? OFFSET ?`,
      params
    );

    const countRes = await query(
      `SELECT COUNT(*) AS count FROM CRM_petty_cash_allocations pca ${whereClause}`,
      params.slice(0, -2)
    );

    return {
      allocations: res.rows,
      total: Number(countRes.rows[0].count),
      page,
      limit,
    };
  },

  async getExpenses({ userId, page = 1, limit = 20 } = {}) {
    let whereClause = 'WHERE 1=1';
    const params = [];

    if (userId) {
      whereClause += ` AND pce.user_id = ?`;
      params.push(userId);
    }

    const offset = (page - 1) * limit;
    params.push(limit, offset);

    const res = await query(
      `SELECT pce.*, u.full_name as user_name
       FROM CRM_petty_cash_expenses pce
       LEFT JOIN CRM_users u ON pce.user_id = u.id
       ${whereClause}
       ORDER BY pce.spent_at DESC
       LIMIT ? OFFSET ?`,
      params
    );

    const countRes = await query(
      `SELECT COUNT(*) AS count FROM CRM_petty_cash_expenses pce ${whereClause}`,
      params.slice(0, -2)
    );

    return {
      expenses: res.rows,
      total: Number(countRes.rows[0].count),
      page,
      limit,
    };
  },

  async getBalance(userId) {
    const allocRes = await query(
      `SELECT COALESCE(SUM(amount), 0) as total_allocated FROM CRM_petty_cash_allocations WHERE user_id = ?`,
      [userId]
    );
    const expenseRes = await query(
      `SELECT COALESCE(SUM(amount), 0) as total_spent FROM CRM_petty_cash_expenses WHERE user_id = ?`,
      [userId]
    );

    return {
      allocated: parseFloat(allocRes.rows[0].total_allocated),
      spent: parseFloat(expenseRes.rows[0].total_spent),
      balance: parseFloat(allocRes.rows[0].total_allocated) - parseFloat(expenseRes.rows[0].total_spent),
    };
  },

  async allocate({ userId, amount, assignedBy, notes }) {
    const res = await query(
      `INSERT INTO CRM_petty_cash_allocations (user_id, amount, assigned_by, notes)
       VALUES (?, ?, ?, ?)`,
      [userId, amount, assignedBy, notes]
    );
    return this.findById('allocation', res.insertId);
  },

  async addExpense({ userId, amount, description }) {
    const res = await query(
      `INSERT INTO CRM_petty_cash_expenses (user_id, amount, description)
       VALUES (?, ?, ?)`,
      [userId, amount, description]
    );
    return this.findById('expense', res.insertId);
  },

  async findById(kind, id) {
    const table = kind === 'allocation' ? 'CRM_petty_cash_allocations' : 'CRM_petty_cash_expenses';
    const res = await query(`SELECT * FROM ${table} WHERE id = ?`, [id]);
    return res.rows[0];
  },

  async deleteAllocation(id) {
    const res = await query('DELETE FROM CRM_petty_cash_allocations WHERE id = ?', [id]);
    return res.affectedRows > 0 ? { id } : null;
  },

  async deleteExpense(id) {
    const res = await query('DELETE FROM CRM_petty_cash_expenses WHERE id = ?', [id]);
    return res.affectedRows > 0 ? { id } : null;
  },
};