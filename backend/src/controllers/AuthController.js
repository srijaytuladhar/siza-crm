import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { UserModel } from '../models/User.js';
import { RoleModel } from '../models/Role.js';
import { AuditLogModel } from '../models/AuditLog.js';

const generateToken = (user) => {
  return jwt.sign(
    { userId: user.id, email: user.email, roleId: user.role_id },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );
};

export const AuthController = {
  async login(req, res) {
    try {
      const { email, password } = req.body;
      const user = await UserModel.findByEmail(email);
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      if (!user.is_active) {
        return res.status(401).json({ error: 'Account is deactivated' });
      }
      const isValid = await UserModel.verifyPassword(user, password);
      if (!isValid) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const token = generateToken(user);
      await AuditLogModel.log({
        userId: user.id,
        action: 'LOGIN',
        entityType: 'user',
        entityId: user.id,
      });

      res.json({
        token,
        user: {
          id: user.id,
          fullName: user.full_name,
          email: user.email,
          roleId: user.role_id,
          roleName: user.role_name,
        },
      });
    } catch (err) {
      console.error('Login error:', err);
      res.status(500).json({ error: 'Login failed' });
    }
  },

  async register(req, res) {
    try {
      const { fullName, email, password, roleId } = req.body;

      const existingUser = await UserModel.findByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: 'Email already registered' });
      }

      const role = await RoleModel.findById(roleId || 3);
      if (!role) {
        return res.status(400).json({ error: 'Invalid role' });
      }

      const user = await UserModel.create({
        fullName,
        email,
        password,
        roleId: role.id,
        createdBy: req.user?.id,
      });

      await AuditLogModel.log({
        userId: req.user?.id,
        action: 'CREATE_USER',
        entityType: 'user',
        entityId: user.id,
        details: { email, roleId: role.id },
      });

      const token = generateToken(user);
      res.status(201).json({
        token,
        user: {
          id: user.id,
          fullName: user.full_name,
          email: user.email,
          roleId: user.role_id,
          roleName: role.name,
        },
      });
    } catch (err) {
      console.error('Register error:', err);
      res.status(500).json({ error: 'Registration failed' });
    }
  },

  async me(req, res) {
    try {
      const user = await UserModel.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      res.json({
        id: user.id,
        fullName: user.full_name,
        email: user.email,
        roleId: user.role_id,
        roleName: user.role_name,
        isActive: user.is_active,
      });
    } catch (err) {
      console.error('Me error:', err);
      res.status(500).json({ error: 'Failed to get user info' });
    }
  },

  async refresh(req, res) {
    try {
      const user = await UserModel.findById(req.user.id);
      if (!user || !user.is_active) {
        return res.status(401).json({ error: 'User not found or inactive' });
      }
      const token = generateToken(user);
      res.json({ token });
    } catch (err) {
      console.error('Refresh error:', err);
      res.status(500).json({ error: 'Token refresh failed' });
    }
  },
};