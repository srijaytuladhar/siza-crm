import { query } from '../config/database.js';
import bcrypt from 'bcryptjs';

export const UserModel = {
  async findAll({ roleId, isActive, page = 1, limit = 20 } = {}) {
    let whereClause = 'WHERE 1=1';
    const params = [];

    if (roleId) {
      whereClause += ` AND u.role_id = ?`;
      params.push(roleId);
    }
    if (isActive !== undefined) {
      whereClause += ` AND u.is_active = ?`;
      params.push(isActive);
    }

    const offset = (page - 1) * limit;
    params.push(limit, offset);

    const res = await query(
      `SELECT u.*, r.name as role_name 
       FROM CRM_users u 
       LEFT JOIN CRM_roles r ON u.role_id = r.id 
       ${whereClause} 
       ORDER BY u.created_at DESC 
       LIMIT ? OFFSET ?`,
      params
    );

    const countRes = await query(
      `SELECT COUNT(*) AS count FROM CRM_users u ${whereClause}`,
      params.slice(0, -2)
    );

    return {
      users: res.rows,
      total: Number(countRes.rows[0].count),
      page,
      limit,
    };
  },

  async findById(id) {
    const res = await query(
      `SELECT u.*, r.name as role_name 
       FROM CRM_users u 
       LEFT JOIN CRM_roles r ON u.role_id = r.id 
       WHERE u.id = ?`,
      [id]
    );
    return res.rows[0];
  },

  async findByEmail(email) {
    const res = await query(
      `SELECT u.*, r.name as role_name 
       FROM CRM_users u 
       LEFT JOIN CRM_roles r ON u.role_id = r.id 
       WHERE u.email = ?`,
      [email]
    );
    return res.rows[0];
  },

  async create({ fullName, email, password, roleId, createdBy }) {
    const passwordHash = await bcrypt.hash(password, 10);
    const res = await query(
      `INSERT INTO CRM_users (full_name, email, password_hash, role_id, created_by)
       VALUES (?, ?, ?, ?, ?)`,
      [fullName, email, passwordHash, roleId, createdBy]
    );
    return this.findById(res.insertId);
  },

  async update(id, { fullName, email, roleId, isActive }) {
    const fields = [];
    const params = [];

    if (fullName !== undefined) {
      fields.push(`full_name = ?`);
      params.push(fullName);
    }
    if (email !== undefined) {
      fields.push(`email = ?`);
      params.push(email);
    }
    if (roleId !== undefined) {
      fields.push(`role_id = ?`);
      params.push(roleId);
    }
    if (isActive !== undefined) {
      fields.push(`is_active = ?`);
      params.push(isActive);
    }

    if (fields.length === 0) return null;

    fields.push(`updated_at = NOW()`);
    params.push(id);

    await query(`UPDATE CRM_users SET ${fields.join(', ')} WHERE id = ?`, params);
    return this.findById(id);
  },

  async updatePassword(id, newPassword) {
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await query(
      `UPDATE CRM_users SET password_hash = ?, updated_at = NOW() WHERE id = ?`,
      [passwordHash, id]
    );
    return { id };
  },

  async verifyPassword(user, password) {
    return bcrypt.compare(password, user.password_hash);
  },

  async delete(id) {
    const res = await query('DELETE FROM CRM_users WHERE id = ?', [id]);
    return res.affectedRows > 0 ? { id } : null;
  },
};