import { query } from '../config/database.js';

export const AuditLogModel = {
  async log({ userId, action, entityType, entityId, details }) {
    const res = await query(
      `INSERT INTO CRM_audit_logs (user_id, action, entity_type, entity_id, details)
       VALUES (?, ?, ?, ?, ?)`,
      [userId, action, entityType, entityId, details ? JSON.stringify(details) : null]
    );
    return { id: res.insertId };
  },

  async findAll({ userId, entityType, entityId, action, startDate, endDate, page = 1, limit = 50 } = {}) {
    let whereClause = 'WHERE 1=1';
    const params = [];

    if (userId) {
      whereClause += ` AND al.user_id = ?`;
      params.push(userId);
    }
    if (entityType) {
      whereClause += ` AND al.entity_type = ?`;
      params.push(entityType);
    }
    if (entityId) {
      whereClause += ` AND al.entity_id = ?`;
      params.push(entityId);
    }
    if (action) {
      whereClause += ` AND al.action = ?`;
      params.push(action);
    }
    if (startDate) {
      whereClause += ` AND al.created_at >= ?`;
      params.push(startDate);
    }
    if (endDate) {
      whereClause += ` AND al.created_at <= ?`;
      params.push(endDate);
    }

    const offset = (page - 1) * limit;
    params.push(limit, offset);

    const res = await query(
      `SELECT al.*, u.full_name as user_name, u.email as user_email
       FROM CRM_audit_logs al
       LEFT JOIN CRM_users u ON al.user_id = u.id
       ${whereClause}
       ORDER BY al.created_at DESC
       LIMIT ? OFFSET ?`,
      params
    );

    const countRes = await query(
      `SELECT COUNT(*) AS count FROM CRM_audit_logs al ${whereClause}`,
      params.slice(0, -2)
    );

    return {
      logs: res.rows,
      total: Number(countRes.rows[0].count),
      page,
      limit,
    };
  },

  async getEntityHistory(entityType, entityId) {
    const res = await query(
      `SELECT al.*, u.full_name as user_name, u.email as user_email
       FROM CRM_audit_logs al
       LEFT JOIN CRM_users u ON al.user_id = u.id
       WHERE al.entity_type = ? AND al.entity_id = ?
       ORDER BY al.created_at DESC`,
      [entityType, entityId]
    );
    return res.rows;
  },
};