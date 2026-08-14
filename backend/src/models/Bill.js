import { query } from '../config/database.js';

export const BillModel = {
  async findAll({ type, projectId, createdBy, startDate, endDate, page = 1, limit = 20 } = {}) {
    let whereClause = 'WHERE 1=1';
    const params = [];

    if (type) {
      whereClause += ` AND b.type = ?`;
      params.push(type);
    }
    if (projectId) {
      whereClause += ` AND b.project_id = ?`;
      params.push(projectId);
    }
    if (createdBy) {
      whereClause += ` AND b.created_by = ?`;
      params.push(createdBy);
    }
    if (startDate) {
      whereClause += ` AND b.bill_date >= ?`;
      params.push(startDate);
    }
    if (endDate) {
      whereClause += ` AND b.bill_date <= ?`;
      params.push(endDate);
    }

    const offset = (page - 1) * limit;
    params.push(limit, offset);

    const res = await query(
      `SELECT b.*, p.name as project_name, u.full_name as created_by_name, i.name as item_name, t.name as type_name
       FROM CRM_bills b
       LEFT JOIN CRM_projects p ON b.project_id = p.id
       LEFT JOIN CRM_users u ON b.created_by = u.id
       LEFT JOIN CRM_items i ON b.item_id = i.id
       LEFT JOIN CRM_item_types t ON b.type_id = t.id
       ${whereClause}
       ORDER BY b.bill_date DESC, b.created_at DESC
       LIMIT ? OFFSET ?`,
      params
    );

    const countRes = await query(
      `SELECT COUNT(*) AS count FROM CRM_bills b ${whereClause}`,
      params.slice(0, -2)
    );

    return {
      bills: res.rows,
      total: Number(countRes.rows[0].count),
      page,
      limit,
    };
  },

  async findById(id) {
    const res = await query(
      `SELECT b.*, p.name as project_name, u.full_name as created_by_name, i.name as item_name, t.name as type_name
       FROM CRM_bills b
       LEFT JOIN CRM_projects p ON b.project_id = p.id
       LEFT JOIN CRM_users u ON b.created_by = u.id
       LEFT JOIN CRM_items i ON b.item_id = i.id
       LEFT JOIN CRM_item_types t ON b.type_id = t.id
       WHERE b.id = ?`,
      [id]
    );
    return res.rows[0];
  },

  async create({ type, amount, category, description, projectId, itemId, typeId, billDate, createdBy }) {
    const res = await query(
      `INSERT INTO CRM_bills (type, amount, category, description, project_id, item_id, type_id, bill_date, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [type, amount, category, description, projectId, itemId, typeId, billDate, createdBy]
    );
    return this.findById(res.insertId);
  },

  async update(id, { type, amount, category, description, projectId, itemId, typeId, billDate }) {
    const fields = [];
    const params = [];

    if (type !== undefined) {
      fields.push(`type = ?`);
      params.push(type);
    }
    if (amount !== undefined) {
      fields.push(`amount = ?`);
      params.push(amount);
    }
    if (category !== undefined) {
      fields.push(`category = ?`);
      params.push(category);
    }
    if (description !== undefined) {
      fields.push(`description = ?`);
      params.push(description);
    }
    if (projectId !== undefined) {
      fields.push(`project_id = ?`);
      params.push(projectId);
    }
    if (itemId !== undefined) {
      fields.push(`item_id = ?`);
      params.push(itemId);
    }
    if (typeId !== undefined) {
      fields.push(`type_id = ?`);
      params.push(typeId);
    }
    if (billDate !== undefined) {
      fields.push(`bill_date = ?`);
      params.push(billDate);
    }

    if (fields.length === 0) return null;

    fields.push(`updated_at = NOW()`);
    params.push(id);

    await query(`UPDATE CRM_bills SET ${fields.join(', ')} WHERE id = ?`, params);
    return this.findById(id);
  },

  async delete(id) {
    const res = await query('DELETE FROM CRM_bills WHERE id = ?', [id]);
    return res.affectedRows > 0 ? { id } : null;
  },

  async getSummary({ projectId, createdBy, startDate, endDate } = {}) {
    let whereClause = 'WHERE 1=1';
    const params = [];

    if (projectId) {
      whereClause += ` AND project_id = ?`;
      params.push(projectId);
    }
    if (createdBy) {
      whereClause += ` AND created_by = ?`;
      params.push(createdBy);
    }
    if (startDate) {
      whereClause += ` AND bill_date >= ?`;
      params.push(startDate);
    }
    if (endDate) {
      whereClause += ` AND bill_date <= ?`;
      params.push(endDate);
    }

    const res = await query(
      `SELECT 
        type,
        COALESCE(SUM(amount), 0) as total_amount,
        COUNT(*) as count
       FROM CRM_bills
       ${whereClause}
       GROUP BY type`,
      params
    );

    const summary = { income: 0, expense: 0, incomeCount: 0, expenseCount: 0 };
    res.rows.forEach((row) => {
      if (row.type === 'income') {
        summary.income = parseFloat(row.total_amount);
        summary.incomeCount = Number(row.count);
      } else {
        summary.expense = parseFloat(row.total_amount);
        summary.expenseCount = Number(row.count);
      }
    });
    summary.net = summary.income - summary.expense;

    return summary;
  },

  async getProjectSummary({ startDate, endDate } = {}) {
    let whereClause = 'WHERE 1=1';
    const params = [];

    if (startDate) {
      whereClause += ` AND bill_date >= ?`;
      params.push(startDate);
    }
    if (endDate) {
      whereClause += ` AND bill_date <= ?`;
      params.push(endDate);
    }

    const res = await query(
      `SELECT 
        p.id as project_id,
        p.name as project_name,
        b.type,
        COALESCE(SUM(b.amount), 0) as total_amount
       FROM CRM_bills b
       LEFT JOIN CRM_projects p ON b.project_id = p.id
       ${whereClause}
       GROUP BY p.id, p.name, b.type
       ORDER BY p.name`,
      params
    );

    const projects = {};
    res.rows.forEach((row) => {
      if (!projects[row.project_id]) {
        projects[row.project_id] = {
          id: row.project_id,
          name: row.project_name,
          income: 0,
          expense: 0,
        };
      }
      if (row.type === 'income') {
        projects[row.project_id].income = parseFloat(row.total_amount);
      } else {
        projects[row.project_id].expense = parseFloat(row.total_amount);
      }
      projects[row.project_id].net = projects[row.project_id].income - projects[row.project_id].expense;
    });

    return Object.values(projects);
  },
};