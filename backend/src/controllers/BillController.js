import { BillModel } from '../models/Bill.js';
import { ItemTypeModel } from '../models/ItemType.js';
import { AuditLogModel } from '../models/AuditLog.js';

export const BillController = {
  async list(req, res) {
    try {
      const { type, projectId, createdBy, startDate, endDate, page, limit } = req.query;

      // Users can only see their own bills unless admin/super_admin
      let userCreatedBy = createdBy ? parseInt(createdBy) : undefined;
      if (req.user.roleName === 'user') {
        userCreatedBy = req.user.id;
      }

      const result = await BillModel.findAll({
        type,
        projectId: projectId ? parseInt(projectId) : undefined,
        createdBy: userCreatedBy,
        startDate,
        endDate,
        page: page ? parseInt(page) : 1,
        limit: limit ? parseInt(limit) : 20,
      });
      res.json(result);
    } catch (err) {
      console.error('List bills error:', err);
      res.status(500).json({ error: 'Failed to fetch bills' });
    }
  },

  async get(req, res) {
    try {
      const { id } = req.params;
      const bill = await BillModel.findById(parseInt(id));
      if (!bill) {
        return res.status(404).json({ error: 'Bill not found' });
      }

      if (req.user.roleName === 'user' && bill.created_by !== req.user.id) {
        return res.status(403).json({ error: 'Not authorized to view this bill' });
      }

      res.json(bill);
    } catch (err) {
      console.error('Get bill error:', err);
      res.status(500).json({ error: 'Failed to fetch bill' });
    }
  },

  async create(req, res) {
    try {
      const { type, amount, category, description, projectId, itemId, typeId, billDate } = req.body;

      const itemTypes = await ItemTypeModel.findByItem(itemId);
      if (!itemTypes.some((t) => t.id === Number(typeId))) {
        return res.status(400).json({ error: 'Selected type does not belong to the chosen item' });
      }

      const bill = await BillModel.create({
        type,
        amount,
        category,
        description,
        projectId,
        itemId,
        typeId,
        billDate,
        createdBy: req.user.id,
      });

      await AuditLogModel.log({
        userId: req.user.id,
        action: 'CREATE_BILL',
        entityType: 'bill',
        entityId: bill.id,
        details: { type, amount, category, projectId, itemId, typeId, billDate },
      });

      res.status(201).json(bill);
    } catch (err) {
      console.error('Create bill error:', err);
      res.status(500).json({ error: 'Failed to create bill' });
    }
  },

  async update(req, res) {
    try {
      const { id } = req.params;
      const { type, amount, category, description, projectId, itemId, typeId, billDate } = req.body;

      const existingBill = await BillModel.findById(parseInt(id));
      if (!existingBill) {
        return res.status(404).json({ error: 'Bill not found' });
      }

      if (req.user.roleName === 'user' && existingBill.created_by !== req.user.id) {
        return res.status(403).json({ error: 'Not authorized to update this bill' });
      }

      if (itemId && typeId) {
        const itemTypes = await ItemTypeModel.findByItem(itemId);
        if (!itemTypes.some((t) => t.id === Number(typeId))) {
          return res.status(400).json({ error: 'Selected type does not belong to the chosen item' });
        }
      }

      const bill = await BillModel.update(parseInt(id), { type, amount, category, description, projectId, itemId, typeId, billDate });
      if (!bill) {
        return res.status(404).json({ error: 'Bill not found or no changes' });
      }

      await AuditLogModel.log({
        userId: req.user.id,
        action: 'UPDATE_BILL',
        entityType: 'bill',
        entityId: parseInt(id),
        details: { type, amount, category, projectId, itemId, typeId, billDate },
      });

      res.json(bill);
    } catch (err) {
      console.error('Update bill error:', err);
      res.status(500).json({ error: 'Failed to update bill' });
    }
  },

  async delete(req, res) {
    try {
      const { id } = req.params;

      const existingBill = await BillModel.findById(parseInt(id));
      if (!existingBill) {
        return res.status(404).json({ error: 'Bill not found' });
      }

      if (req.user.roleName === 'user' && existingBill.created_by !== req.user.id) {
        return res.status(403).json({ error: 'Not authorized to delete this bill' });
      }

      await BillModel.delete(parseInt(id));

      await AuditLogModel.log({
        userId: req.user.id,
        action: 'DELETE_BILL',
        entityType: 'bill',
        entityId: parseInt(id),
        details: { type: existingBill.type, amount: existingBill.amount },
      });

      res.json({ message: 'Bill deleted successfully' });
    } catch (err) {
      console.error('Delete bill error:', err);
      res.status(500).json({ error: 'Failed to delete bill' });
    }
  },

  async getSummary(req, res) {
    try {
      const { projectId, startDate, endDate } = req.query;
      const summary = await BillModel.getSummary({
        projectId: projectId ? parseInt(projectId) : undefined,
        startDate,
        endDate,
      });
      res.json(summary);
    } catch (err) {
      console.error('Get summary error:', err);
      res.status(500).json({ error: 'Failed to fetch summary' });
    }
  },

  async getProjectSummary(req, res) {
    try {
      const { startDate, endDate } = req.query;
      const summary = await BillModel.getProjectSummary({ startDate, endDate });
      res.json(summary);
    } catch (err) {
      console.error('Get project summary error:', err);
      res.status(500).json({ error: 'Failed to fetch project summary' });
    }
  },
};