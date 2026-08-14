import { query } from '../config/database.js';

const baseSelect = `i.*, p.name as project_name, u.full_name as created_by_name, a.full_name as approved_by_name`;

const attachTypes = async (items) => {
  const ids = items.map((i) => i.id);
  if (ids.length === 0) return;
  const res = await query(
    `SELECT item_id, id, name FROM CRM_item_types WHERE item_id IN (${ids.map(() => '?').join(',')}) ORDER BY name`,
    ids
  );
  const byItem = {};
  res.rows.forEach((t) => {
    (byItem[t.item_id] = byItem[t.item_id] || []).push({ id: t.id, name: t.name });
  });
  items.forEach((it) => {
    it.types = byItem[it.id] || [];
    it.type_names = it.types.map((t) => t.name).join(', ');
  });
};

export const ItemModel = {
  async findAll({ status, projectId, createdBy, page = 1, limit = 20 } = {}) {
    let whereClause = 'WHERE 1=1';
    const params = [];

    if (status) {
      whereClause += ` AND i.status = ?`;
      params.push(status);
    }
    if (projectId) {
      whereClause += ` AND i.project_id = ?`;
      params.push(projectId);
    }
    if (createdBy) {
      whereClause += ` AND i.created_by = ?`;
      params.push(createdBy);
    }

    const offset = (page - 1) * limit;
    params.push(limit, offset);

    const res = await query(
      `SELECT ${baseSelect}
       FROM CRM_items i
       LEFT JOIN CRM_projects p ON i.project_id = p.id
       LEFT JOIN CRM_users u ON i.created_by = u.id
       LEFT JOIN CRM_users a ON i.approved_by = a.id
       ${whereClause}
       ORDER BY i.created_at DESC
       LIMIT ? OFFSET ?`,
      params
    );

    const countRes = await query(
      `SELECT COUNT(*) AS count FROM CRM_items i ${whereClause}`,
      params.slice(0, -2)
    );

    await attachTypes(res.rows);

    return {
      items: res.rows,
      total: Number(countRes.rows[0].count),
      page,
      limit,
    };
  },

  async findById(id) {
    const res = await query(
      `SELECT ${baseSelect}
       FROM CRM_items i
       LEFT JOIN CRM_projects p ON i.project_id = p.id
       LEFT JOIN CRM_users u ON i.created_by = u.id
       LEFT JOIN CRM_users a ON i.approved_by = a.id
       WHERE i.id = ?`,
      [id]
    );
    const item = res.rows[0];
    if (item) await attachTypes([item]);
    return item;
  },

  async create({ name, description, quantity, unitPrice, projectId, createdBy }) {
    const res = await query(
      `INSERT INTO CRM_items (name, description, quantity, unit_price, project_id, created_by, status)
       VALUES (?, ?, ?, ?, ?, ?, 'pending')`,
      [name, description, quantity || 0, unitPrice, projectId, createdBy]
    );
    return this.findById(res.insertId);
  },

  async update(id, { name, description, quantity, unitPrice, projectId }) {
    const fields = [];
    const params = [];

    if (name !== undefined) {
      fields.push(`name = ?`);
      params.push(name);
    }
    if (description !== undefined) {
      fields.push(`description = ?`);
      params.push(description);
    }
    if (quantity !== undefined) {
      fields.push(`quantity = ?`);
      params.push(quantity);
    }
    if (unitPrice !== undefined) {
      fields.push(`unit_price = ?`);
      params.push(unitPrice);
    }
    if (projectId !== undefined) {
      fields.push(`project_id = ?`);
      params.push(projectId);
    }

    if (fields.length === 0) return null;

    fields.push(`updated_at = NOW()`);
    params.push(id);

    await query(`UPDATE CRM_items SET ${fields.join(', ')} WHERE id = ?`, params);
    return this.findById(id);
  },

  async updateStatus(id, status, approvedBy) {
    await query(`UPDATE CRM_items SET status = ?, approved_by = ?, updated_at = NOW() WHERE id = ?`, [
      status,
      approvedBy,
      id,
    ]);
    return this.findById(id);
  },

  async delete(id) {
    const res = await query('DELETE FROM CRM_items WHERE id = ?', [id]);
    return res.affectedRows > 0 ? { id } : null;
  },
};