import { ProjectModel } from '../models/Project.js';
import { AuditLogModel } from '../models/AuditLog.js';

export const ProjectController = {
  async list(req, res) {
    try {
      const { status, page, limit } = req.query;
      const result = await ProjectModel.findAll({
        status,
        page: page ? parseInt(page) : 1,
        limit: limit ? parseInt(limit) : 20,
      });
      res.json(result);
    } catch (err) {
      console.error('List projects error:', err);
      res.status(500).json({ error: 'Failed to fetch projects' });
    }
  },

  async get(req, res) {
    try {
      const { id } = req.params;
      const project = await ProjectModel.findById(parseInt(id));
      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }
      const users = await ProjectModel.findUsers(parseInt(id));
      res.json({ ...project, users });
    } catch (err) {
      console.error('Get project error:', err);
      res.status(500).json({ error: 'Failed to fetch project' });
    }
  },

  async create(req, res) {
    try {
      const { name, description, status } = req.body;
      const project = await ProjectModel.create({
        name,
        description,
        status,
        createdBy: req.user.id,
      });

      await AuditLogModel.log({
        userId: req.user.id,
        action: 'CREATE_PROJECT',
        entityType: 'project',
        entityId: project.id,
        details: { name, status },
      });

      res.status(201).json(project);
    } catch (err) {
      console.error('Create project error:', err);
      res.status(500).json({ error: 'Failed to create project' });
    }
  },

  async update(req, res) {
    try {
      const { id } = req.params;
      const { name, description, status } = req.body;

      const project = await ProjectModel.update(parseInt(id), { name, description, status });
      if (!project) {
        return res.status(404).json({ error: 'Project not found or no changes' });
      }

      await AuditLogModel.log({
        userId: req.user.id,
        action: 'UPDATE_PROJECT',
        entityType: 'project',
        entityId: parseInt(id),
        details: { name, description, status },
      });

      res.json(project);
    } catch (err) {
      console.error('Update project error:', err);
      res.status(500).json({ error: 'Failed to update project' });
    }
  },

  async assignUser(req, res) {
    try {
      const { id } = req.params;
      const { userId } = req.body;

      const assignment = await ProjectModel.assignUser(parseInt(id), userId);
      if (!assignment) {
        return res.status(400).json({ error: 'User already assigned or invalid' });
      }

      await AuditLogModel.log({
        userId: req.user.id,
        action: 'ASSIGN_USER_TO_PROJECT',
        entityType: 'project_user',
        entityId: assignment.id,
        details: { projectId: parseInt(id), userId },
      });

      res.status(201).json(assignment);
    } catch (err) {
      console.error('Assign user error:', err);
      res.status(500).json({ error: 'Failed to assign user' });
    }
  },

  async removeUser(req, res) {
    try {
      const { id, userId } = req.params;

      const result = await ProjectModel.removeUser(parseInt(id), parseInt(userId));
      if (!result) {
        return res.status(404).json({ error: 'Assignment not found' });
      }

      await AuditLogModel.log({
        userId: req.user.id,
        action: 'REMOVE_USER_FROM_PROJECT',
        entityType: 'project_user',
        entityId: result.id,
        details: { projectId: parseInt(id), userId: parseInt(userId) },
      });

      res.json({ message: 'User removed from project' });
    } catch (err) {
      console.error('Remove user error:', err);
      res.status(500).json({ error: 'Failed to remove user' });
    }
  },

  async delete(req, res) {
    try {
      const { id } = req.params;
      const project = await ProjectModel.delete(parseInt(id));
      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }

      await AuditLogModel.log({
        userId: req.user.id,
        action: 'DELETE_PROJECT',
        entityType: 'project',
        entityId: parseInt(id),
      });

      res.json({ message: 'Project deleted successfully' });
    } catch (err) {
      console.error('Delete project error:', err);
      res.status(500).json({ error: 'Failed to delete project' });
    }
  },
};