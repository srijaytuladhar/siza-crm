import { PettyCashModel } from '../models/PettyCash.js';
import { AuditLogModel } from '../models/AuditLog.js';
import { UserModel } from '../models/User.js';

export const PettyCashController = {
  async getAllocations(req, res) {
    try {
      const { userId, page, limit } = req.query;

      // Users can only see their own allocations
      let targetUserId = userId ? parseInt(userId) : undefined;
      if (req.user.roleName === 'user') {
        targetUserId = req.user.id;
      }

      const result = await PettyCashModel.getAllocations({
        userId: targetUserId,
        page: page ? parseInt(page) : 1,
        limit: limit ? parseInt(limit) : 20,
      });
      res.json(result);
    } catch (err) {
      console.error('Get allocations error:', err);
      res.status(500).json({ error: 'Failed to fetch allocations' });
    }
  },

  async getExpenses(req, res) {
    try {
      const { userId, page, limit } = req.query;

      let targetUserId = userId ? parseInt(userId) : undefined;
      if (req.user.roleName === 'user') {
        targetUserId = req.user.id;
      }

      const result = await PettyCashModel.getExpenses({
        userId: targetUserId,
        page: page ? parseInt(page) : 1,
        limit: limit ? parseInt(limit) : 20,
      });
      res.json(result);
    } catch (err) {
      console.error('Get expenses error:', err);
      res.status(500).json({ error: 'Failed to fetch expenses' });
    }
  },

  async getBalance(req, res) {
    try {
      const { userId } = req.query;

      let targetUserId = userId ? parseInt(userId) : req.user.id;
      if (req.user.roleName === 'user') {
        targetUserId = req.user.id;
      }

      const balance = await PettyCashModel.getBalance(targetUserId);
      res.json(balance);
    } catch (err) {
      console.error('Get balance error:', err);
      res.status(500).json({ error: 'Failed to fetch balance' });
    }
  },

  async allocate(req, res) {
    try {
      const { userId, amount, notes } = req.body;

      // Only admin/super_admin can allocate
      if (req.user.roleName === 'user') {
        return res.status(403).json({ error: 'Not authorized to allocate petty cash' });
      }

      const user = await UserModel.findById(userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const allocation = await PettyCashModel.allocate({
        userId,
        amount,
        assignedBy: req.user.id,
        notes,
      });

      await AuditLogModel.log({
        userId: req.user.id,
        action: 'ALLOCATE_PETTY_CASH',
        entityType: 'petty_cash_allocation',
        entityId: allocation.id,
        details: { userId, amount, notes },
      });

      res.status(201).json(allocation);
    } catch (err) {
      console.error('Allocate petty cash error:', err);
      res.status(500).json({ error: 'Failed to allocate petty cash' });
    }
  },

  async addExpense(req, res) {
    try {
      const { userId, amount, description } = req.body;

      let targetUserId = userId ? parseInt(userId) : req.user.id;
      if (req.user.roleName === 'user') {
        targetUserId = req.user.id;
      }

      // Check balance
      const balance = await PettyCashModel.getBalance(targetUserId);
      if (balance.balance < amount) {
        return res.status(400).json({ error: 'Insufficient petty cash balance' });
      }

      const expense = await PettyCashModel.addExpense({
        userId: targetUserId,
        amount,
        description,
      });

      await AuditLogModel.log({
        userId: req.user.id,
        action: 'ADD_PETTY_CASH_EXPENSE',
        entityType: 'petty_cash_expense',
        entityId: expense.id,
        details: { userId: targetUserId, amount, description },
      });

      res.status(201).json(expense);
    } catch (err) {
      console.error('Add expense error:', err);
      res.status(500).json({ error: 'Failed to add expense' });
    }
  },

  async deleteAllocation(req, res) {
    try {
      const { id } = req.params;

      if (req.user.roleName === 'user') {
        return res.status(403).json({ error: 'Not authorized' });
      }

      await PettyCashModel.deleteAllocation(parseInt(id));

      await AuditLogModel.log({
        userId: req.user.id,
        action: 'DELETE_PETTY_CASH_ALLOCATION',
        entityType: 'petty_cash_allocation',
        entityId: parseInt(id),
      });

      res.json({ message: 'Allocation deleted' });
    } catch (err) {
      console.error('Delete allocation error:', err);
      res.status(500).json({ error: 'Failed to delete allocation' });
    }
  },

  async deleteExpense(req, res) {
    try {
      const { id } = req.params;

      if (req.user.roleName === 'user') {
        return res.status(403).json({ error: 'Not authorized' });
      }

      await PettyCashModel.deleteExpense(parseInt(id));

      await AuditLogModel.log({
        userId: req.user.id,
        action: 'DELETE_PETTY_CASH_EXPENSE',
        entityType: 'petty_cash_expense',
        entityId: parseInt(id),
      });

      res.json({ message: 'Expense deleted' });
    } catch (err) {
      console.error('Delete expense error:', err);
      res.status(500).json({ error: 'Failed to delete expense' });
    }
  },
};