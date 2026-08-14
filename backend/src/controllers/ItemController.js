import { ItemModel } from '../models/Item.js';
import { AuditLogModel } from '../models/AuditLog.js';

export const ItemController = {
  async list(req, res) {
    try {
      const { status, projectId, createdBy, page, limit } = req.query;

      // Users can only see their own items unless admin/super_admin
      let userCreatedBy = createdBy ? parseInt(createdBy) : undefined;
      if (req.user.roleName === 'user') {
        userCreatedBy = req.user.id;
      }

      const result = await ItemModel.findAll({
        status,
        projectId: projectId ? parseInt(projectId) : undefined,
        createdBy: userCreatedBy,
        page: page ? parseInt(page) : 1,
        limit: limit ? parseInt(limit) : 20,
      });
      res.json(result);
    } catch (err) {
      console.error('List items error:', err);
      res.status(500).json({ error: 'Failed to fetch items' });
    }
  },

  async get(req, res) {
    try {
      const { id } = req.params;
      const item = await ItemModel.findById(parseInt(id));
      if (!item) {
        return res.status(404).json({ error: 'Item not found' });
      }

      // Check permission
      if (req.user.roleName === 'user' && item.created_by !== req.user.id) {
        return res.status(403).json({ error: 'Not authorized to view this item' });
      }

      res.json(item);
    } catch (err) {
      console.error('Get item error:', err);
      res.status(500).json({ error: 'Failed to fetch item' });
    }
  },

  async create(req, res) {
    try {
      const { name, description, quantity, unitPrice, projectId } = req.body;

      const item = await ItemModel.create({
        name,
        description,
        quantity,
        unitPrice,
        projectId,
        createdBy: req.user.id,
      });

      await AuditLogModel.log({
        userId: req.user.id,
        action: 'CREATE_ITEM',
        entityType: 'item',
        entityId: item.id,
        details: { name, projectId, status: 'pending' },
      });

      res.status(201).json(item);
    } catch (err) {
      console.error('Create item error:', err);
      res.status(500).json({ error: 'Failed to create item' });
    }
  },

  async update(req, res) {
    try {
      const { id } = req.params;
      const { name, description, quantity, unitPrice, projectId } = req.body;

      // Check permission
      const existingItem = await ItemModel.findById(parseInt(id));
      if (!existingItem) {
        return res.status(404).json({ error: 'Item not found' });
      }
      if (req.user.roleName === 'user' && existingItem.created_by !== req.user.id) {
        return res.status(403).json({ error: 'Not authorized to update this item' });
      }
      if (existingItem.status !== 'pending') {
        return res.status(400).json({ error: 'Can only update pending items' });
      }

      const item = await ItemModel.update(parseInt(id), { name, description, quantity, unitPrice, projectId });
      if (!item) {
        return res.status(404).json({ error: 'Item not found or no changes' });
      }

      await AuditLogModel.log({
        userId: req.user.id,
        action: 'UPDATE_ITEM',
        entityType: 'item',
        entityId: parseInt(id),
        details: { name, description, quantity, unitPrice, projectId },
      });

      res.json(item);
    } catch (err) {
      console.error('Update item error:', err);
      res.status(500).json({ error: 'Failed to update item' });
    }
  },

  async updateStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      // Only admin/super_admin can approve/reject
      if (req.user.roleName === 'user') {
        return res.status(403).json({ error: 'Not authorized to change item status' });
      }

      const existingItem = await ItemModel.findById(parseInt(id));
      if (!existingItem) {
        return res.status(404).json({ error: 'Item not found' });
      }

      const item = await ItemModel.updateStatus(parseInt(id), status, req.user.id);
      if (!item) {
        return res.status(404).json({ error: 'Item not found' });
      }

      await AuditLogModel.log({
        userId: req.user.id,
        action: status.toUpperCase() + '_ITEM',
        entityType: 'item',
        entityId: parseInt(id),
        details: { previousStatus: existingItem.status, newStatus: status },
      });

      res.json(item);
    } catch (err) {
      console.error('Update item status error:', err);
      res.status(500).json({ error: 'Failed to update item status' });
    }
  },

  async delete(req, res) {
    try {
      const { id } = req.params;

      const existingItem = await ItemModel.findById(parseInt(id));
      if (!existingItem) {
        return res.status(404).json({ error: 'Item not found' });
      }
      if (req.user.roleName === 'user' && existingItem.created_by !== req.user.id) {
        return res.status(403).json({ error: 'Not authorized to delete this item' });
      }
      if (existingItem.status !== 'pending') {
        return res.status(400).json({ error: 'Can only delete pending items' });
      }

      await ItemModel.delete(parseInt(id));

      await AuditLogModel.log({
        userId: req.user.id,
        action: 'DELETE_ITEM',
        entityType: 'item',
        entityId: parseInt(id),
        details: { name: existingItem.name },
      });

      res.json({ message: 'Item deleted successfully' });
    } catch (err) {
      console.error('Delete item error:', err);
      res.status(500).json({ error: 'Failed to delete item' });
    }
  },
};