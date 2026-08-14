import { query } from '../config/database.js';

export const ItemTypeModel = {
  async findAll() {
    const res = await query(
      `SELECT t.*, i.name as item_name
       FROM CRM_item_types t
       LEFT JOIN CRM_items i ON t.item_id = i.id
       ORDER BY i.name, t.name`
    );
    return res.rows;
  },

  async findByItem(itemId) {
    const res = await query(
      'SELECT * FROM CRM_item_types WHERE item_id = ? ORDER BY name',
      [itemId]
    );
    return res.rows;
  },

  async findById(id) {
    const res = await query('SELECT * FROM CRM_item_types WHERE id = ?', [id]);
    return res.rows[0];
  },

  async findByNameForItem(itemId, name) {
    const res = await query(
      'SELECT * FROM CRM_item_types WHERE item_id = ? AND name = ?',
      [itemId, name]
    );
    return res.rows[0];
  },

  async create({ itemId, name, createdBy }) {
    const res = await query(
      'INSERT INTO CRM_item_types (item_id, name, created_by) VALUES (?, ?, ?)',
      [itemId, name, createdBy]
    );
    return this.findById(res.insertId);
  },

  async delete(id) {
    const res = await query('DELETE FROM CRM_item_types WHERE id = ?', [id]);
    return res.affectedRows > 0 ? { id } : null;
  },
};