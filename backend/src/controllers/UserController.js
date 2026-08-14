import { UserModel } from '../models/User.js';
import { RoleModel } from '../models/Role.js';
import { AuditLogModel } from '../models/AuditLog.js';

export const UserController = {
  async list(req, res) {
    try {
      const { roleId, isActive, page, limit } = req.query;
      const result = await UserModel.findAll({
        roleId: roleId ? parseInt(roleId) : undefined,
        isActive: isActive !== undefined ? isActive === 'true' : undefined,
        page: page ? parseInt(page) : 1,
        limit: limit ? parseInt(limit) : 20,
      });
      res.json(result);
    } catch (err) {
      console.error('List users error:', err);
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  },

  async get(req, res) {
    try {
      const { id } = req.params;
      const user = await UserModel.findById(parseInt(id));
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      res.json(user);
    } catch (err) {
      console.error('Get user error:', err);
      res.status(500).json({ error: 'Failed to fetch user' });
    }
  },

  async create(req, res) {
    try {
      const { fullName, email, password, roleId } = req.body;

      const existingUser = await UserModel.findByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: 'Email already registered' });
      }

      const role = await RoleModel.findById(roleId);
      if (!role) {
        return res.status(400).json({ error: 'Invalid role' });
      }

      const user = await UserModel.create({
        fullName,
        email,
        password,
        roleId,
        createdBy: req.user.id,
      });

      await AuditLogModel.log({
        userId: req.user.id,
        action: 'CREATE_USER',
        entityType: 'user',
        entityId: user.id,
        details: { email, roleId },
      });

      res.status(201).json(user);
    } catch (err) {
      console.error('Create user error:', err);
      res.status(500).json({ error: 'Failed to create user' });
    }
  },

  async update(req, res) {
    try {
      const { id } = req.params;
      const { fullName, email, roleId, isActive } = req.body;

      const user = await UserModel.update(parseInt(id), { fullName, email, roleId, isActive });
      if (!user) {
        return res.status(404).json({ error: 'User not found or no changes' });
      }

      await AuditLogModel.log({
        userId: req.user.id,
        action: 'UPDATE_USER',
        entityType: 'user',
        entityId: parseInt(id),
        details: { fullName, email, roleId, isActive },
      });

      res.json(user);
    } catch (err) {
      console.error('Update user error:', err);
      res.status(500).json({ error: 'Failed to update user' });
    }
  },

  async updatePassword(req, res) {
    try {
      const { id } = req.params;
      const { currentPassword, newPassword } = req.body;

      const user = await UserModel.findById(parseInt(id));
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const isValid = await UserModel.verifyPassword(user, currentPassword);
      if (!isValid) {
        return res.status(400).json({ error: 'Current password is incorrect' });
      }

      await UserModel.updatePassword(parseInt(id), newPassword);

      await AuditLogModel.log({
        userId: req.user.id,
        action: 'UPDATE_PASSWORD',
        entityType: 'user',
        entityId: parseInt(id),
      });

      res.json({ message: 'Password updated successfully' });
    } catch (err) {
      console.error('Update password error:', err);
      res.status(500).json({ error: 'Failed to update password' });
    }
  },

  async delete(req, res) {
    try {
      const { id } = req.params;
      const userId = parseInt(id);

      if (userId === req.user.id) {
        return res.status(400).json({ error: 'Cannot delete yourself' });
      }

      const user = await UserModel.delete(userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      await AuditLogModel.log({
        userId: req.user.id,
        action: 'DELETE_USER',
        entityType: 'user',
        entityId: userId,
      });

      res.json({ message: 'User deleted successfully' });
    } catch (err) {
      console.error('Delete user error:', err);
      res.status(500).json({ error: 'Failed to delete user' });
    }
  },

  async getRoles(req, res) {
    try {
      const roles = await RoleModel.findAll();
      res.json(roles);
    } catch (err) {
      console.error('Get roles error:', err);
      res.status(500).json({ error: 'Failed to fetch roles' });
    }
  },
};