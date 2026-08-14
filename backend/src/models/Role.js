import { query } from '../config/database.js';

export const RoleModel = {
  async findAll() {
    const res = await query('SELECT * FROM CRM_roles ORDER BY id');
    return res.rows;
  },

  async findById(id) {
    const res = await query('SELECT * FROM CRM_roles WHERE id = ?', [id]);
    return res.rows[0];
  },

  async findByName(name) {
    const res = await query('SELECT * FROM CRM_roles WHERE name = ?', [name]);
    return res.rows[0];
  },
};