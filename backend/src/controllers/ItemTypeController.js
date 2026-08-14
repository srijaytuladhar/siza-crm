import { ItemTypeModel } from '../models/ItemType.js';
import { ItemModel } from '../models/Item.js';
import { AuditLogModel } from '../models/AuditLog.js';

export const ItemTypeController = {
  async list(req, res) {
    try {
      const types = await ItemTypeModel.findAll();
      res.json(types);
    } catch (err) {
      console.error('List item types error:', err);
      res.status(500).json({ error: 'Failed to fetch item types' });
    }
  },

  async listByItem(req, res) {
    try {
      const { itemId } = req.params;
      const types = await ItemTypeModel.findByItem(parseInt(itemId));
      res.json(types);
    } catch (err) {
      console.error('List item types error:', err);
      res.status(500).json({ error: 'Failed to fetch item types' });
    }
  },

  async create(req, res) {
    try {
      const { itemId, name } = req.body;

      const item = await ItemModel.findById(itemId);
      if (!item) {
        return res.status(404).json({ error: 'Item not found' });
      }

      const existing = await ItemTypeModel.findByNameForItem(itemId, name);
      if (existing) {
        return res.status(400).json({ error: 'This type already exists for this item' });
      }

      const type = await ItemTypeModel.create({ itemId, name, createdBy: req.user.id });

      await AuditLogModel.log({
        userId: req.user.id,
        action: 'CREATE_ITEM_TYPE',
        entityType: 'item_type',
        entityId: type.id,
        details: { itemId, name },
      });

      res.status(201).json(type);
    } catch (err) {
      console.error('Create item type error:', err);
      res.status(500).json({ error: 'Failed to create item type' });
    }
  },

  async delete(req, res) {
    try {
      const { id } = req.params;
      const result = await ItemTypeModel.delete(parseInt(id));
      if (!result) {
        return res.status(404).json({ error: 'Item type not found' });
      }

      await AuditLogModel.log({
        userId: req.user.id,
        action: 'DELETE_ITEM_TYPE',
        entityType: 'item_type',
        entityId: parseInt(id),
      });

      res.json({ message: 'Item type deleted' });
    } catch (err) {
      console.error('Delete item type error:', err);
      res.status(500).json({ error: 'Failed to delete item type' });
    }
  },
};