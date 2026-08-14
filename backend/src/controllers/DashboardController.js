import { query } from '../config/database.js';
import { BillModel } from '../models/Bill.js';
import { PettyCashModel } from '../models/PettyCash.js';
import { ItemModel } from '../models/Item.js';
import { AuditLogModel } from '../models/AuditLog.js';

export const DashboardController = {
  async getStats(req, res) {
    try {
      // Only admin/super_admin can access dashboard
      if (req.user.roleName === 'user') {
        return res.status(403).json({ error: 'Not authorized' });
      }

      const { startDate, endDate } = req.query;

      // Get bill summary
      const billSummary = await BillModel.getSummary({ startDate, endDate });

      // Get project-wise summary
      const projectSummary = await BillModel.getProjectSummary({ startDate, endDate });

      // Get petty cash usage per user
      const pettyCashRes = await query(
        `SELECT u.id, u.full_name, u.email,
          COALESCE(SUM(pca.amount), 0) as allocated,
          COALESCE(SUM(pce.amount), 0) as spent
        FROM CRM_users u
        LEFT JOIN CRM_petty_cash_allocations pca ON u.id = pca.user_id
        LEFT JOIN CRM_petty_cash_expenses pce ON u.id = pce.user_id
        WHERE u.role_id = (SELECT id FROM CRM_roles WHERE name = 'user')
        GROUP BY u.id, u.full_name, u.email
        ORDER BY u.full_name`
      );

      const pettyCashUsage = pettyCashRes.rows.map(row => ({
        userId: row.id,
        userName: row.full_name,
        userEmail: row.email,
        allocated: parseFloat(row.allocated),
        spent: parseFloat(row.spent),
        balance: parseFloat(row.allocated) - parseFloat(row.spent),
      }));

      // Get pending items count
      const pendingItemsRes = await query(
        `SELECT COUNT(*) as count FROM CRM_items WHERE status = 'pending'`
      );
      const pendingItemsCount = parseInt(pendingItemsRes.rows[0].count);

      // Get recent activity (last 20 audit logs)
      const recentActivityRes = await query(
        `SELECT al.*, u.full_name as user_name, u.email as user_email
         FROM CRM_audit_logs al
         LEFT JOIN CRM_users u ON al.user_id = u.id
         ORDER BY al.created_at DESC
         LIMIT 20`
      );

      // Get monthly income/expense for charts (last 12 months)
      const monthlyRes = await query(
        `SELECT 
          DATE_FORMAT(bill_date, '%Y-%m-01') as month,
          type,
          COALESCE(SUM(amount), 0) as total
         FROM CRM_bills
         WHERE bill_date >= NOW() - INTERVAL 12 MONTH
         GROUP BY DATE_FORMAT(bill_date, '%Y-%m-01'), type
         ORDER BY month`
      );

      const monthlyData = {};
      monthlyRes.rows.forEach(row => {
        const monthKey = row.month.substring(0, 7);
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = { month: monthKey, income: 0, expense: 0 };
        }
        if (row.type === 'income') {
          monthlyData[monthKey].income = parseFloat(row.total);
        } else {
          monthlyData[monthKey].expense = parseFloat(row.total);
        }
      });

      res.json({
        billSummary,
        projectSummary,
        pettyCashUsage,
        pendingItemsCount,
        recentActivity: recentActivityRes.rows,
        monthlyData: Object.values(monthlyData),
      });
    } catch (err) {
      console.error('Dashboard stats error:', err);
      res.status(500).json({ error: 'Failed to fetch dashboard stats' });
    }
  },

  async getUserDashboard(req, res) {
    try {
      // User dashboard - only their own data
      const { startDate, endDate } = req.query;

      // Get user's bill summary
      const billSummary = await BillModel.getSummary({
        createdBy: req.user.id,
        startDate,
        endDate,
      });

      // Get user's petty cash balance
      const balance = await PettyCashModel.getBalance(req.user.id);

      // Get user's pending items
      const pendingItemsRes = await query(
        `SELECT COUNT(*) as count FROM CRM_items WHERE created_by = ? AND status = 'pending'`,
        [req.user.id]
      );
      const pendingItemsCount = parseInt(pendingItemsRes.rows[0].count);

      // Get user's recent items
      const recentItemsRes = await query(
        `SELECT i.*, p.name as project_name
         FROM CRM_items i
         LEFT JOIN CRM_projects p ON i.project_id = p.id
         WHERE i.created_by = ?
         ORDER BY i.created_at DESC
         LIMIT 10`,
        [req.user.id]
      );

      // Get user's recent bills
      const recentBillsRes = await query(
        `SELECT b.*, p.name as project_name
         FROM CRM_bills b
         LEFT JOIN CRM_projects p ON b.project_id = p.id
         WHERE b.created_by = ?
         ORDER BY b.created_at DESC
         LIMIT 10`,
        [req.user.id]
      );

      // Get user's recent expenses
      const recentExpensesRes = await query(
        `SELECT * FROM CRM_petty_cash_expenses
         WHERE user_id = ?
         ORDER BY spent_at DESC
         LIMIT 10`,
        [req.user.id]
      );

      res.json({
        billSummary,
        balance,
        pendingItemsCount,
        recentItems: recentItemsRes.rows,
        recentBills: recentBillsRes.rows,
        recentExpenses: recentExpensesRes.rows,
      });
    } catch (err) {
      console.error('User dashboard error:', err);
      res.status(500).json({ error: 'Failed to fetch user dashboard' });
    }
  },
};