import { query } from '../config/database.js';

export const ProjectModel = {
  async findAll({ status, page = 1, limit = 20 } = {}) {
    let whereClause = 'WHERE 1=1';
    const params = [];

    if (status) {
      whereClause += ` AND p.status = ?`;
      params.push(status);
    }

    const offset = (page - 1) * limit;
    params.push(limit, offset);

    const res = await query(
      `SELECT p.*, u.full_name as created_by_name
       FROM CRM_projects p
       LEFT JOIN CRM_users u ON p.created_by = u.id
       ${whereClause}
       ORDER BY p.created_at DESC
       LIMIT ? OFFSET ?`,
      params
    );

    const countRes = await query(
      `SELECT COUNT(*) AS count FROM CRM_projects p ${whereClause}`,
      params.slice(0, -2)
    );

    return {
      projects: res.rows,
      total: Number(countRes.rows[0].count),
      page,
      limit,
    };
  },

  async findById(id) {
    const res = await query(
      `SELECT p.*, u.full_name as created_by_name
       FROM CRM_projects p
       LEFT JOIN CRM_users u ON p.created_by = u.id
       WHERE p.id = ?`,
      [id]
    );
    return res.rows[0];
  },

  async findUsers(projectId) {
    const res = await query(
      `SELECT u.*, pu.assigned_at
       FROM CRM_users u
       JOIN CRM_project_users pu ON u.id = pu.user_id
       WHERE pu.project_id = ?
       ORDER BY pu.assigned_at`,
      [projectId]
    );
    return res.rows;
  },

  async create({ name, description, status, createdBy }) {
    const res = await query(
      `INSERT INTO CRM_projects (name, description, status, created_by)
       VALUES (?, ?, ?, ?)`,
      [name, description, status || 'active', createdBy]
    );
    return this.findById(res.insertId);
  },

  async update(id, { name, description, status }) {
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
    if (status !== undefined) {
      fields.push(`status = ?`);
      params.push(status);
    }

    if (fields.length === 0) return null;

    fields.push(`updated_at = NOW()`);
    params.push(id);

    await query(`UPDATE CRM_projects SET ${fields.join(', ')} WHERE id = ?`, params);
    return this.findById(id);
  },

  async assignUser(projectId, userId) {
    const res = await query(
      `INSERT IGNORE INTO CRM_project_users (project_id, user_id)
       VALUES (?, ?)`,
      [projectId, userId]
    );
    if (res.affectedRows === 0) return null;
    return { id: res.insertId, project_id: projectId, user_id: userId };
  },

  async removeUser(projectId, userId) {
    const sel = await query(
      `SELECT id FROM CRM_project_users WHERE project_id = ? AND user_id = ?`,
      [projectId, userId]
    );
    if (!sel.rows[0]) return null;
    await query(`DELETE FROM CRM_project_users WHERE project_id = ? AND user_id = ?`, [
      projectId,
      userId,
    ]);
    return { id: sel.rows[0].id };
  },

  async delete(id) {
    const res = await query('DELETE FROM CRM_projects WHERE id = ?', [id]);
    return res.affectedRows > 0 ? { id } : null;
  },
};