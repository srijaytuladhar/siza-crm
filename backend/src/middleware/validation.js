import { body, param, query, validationResult } from 'express-validator';

export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

export const authValidators = {
  login: [
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password').notEmpty().withMessage('Password required'),
    validate,
  ],
  register: [
    body('fullName').trim().isLength({ min: 2, max: 150 }).withMessage('Full name required (2-150 chars)'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('roleId').optional().isInt({ min: 1 }).withMessage('Valid role ID required'),
    validate,
  ],
};

export const userValidators = {
  create: [
    body('fullName').trim().isLength({ min: 2, max: 150 }).withMessage('Full name required (2-150 chars)'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('roleId').isInt({ min: 1 }).withMessage('Valid role ID required'),
    validate,
  ],
  update: [
    param('id').isInt({ min: 1 }).withMessage('Valid user ID required'),
    body('fullName').optional().trim().isLength({ min: 2, max: 150 }).withMessage('Full name 2-150 chars'),
    body('email').optional().isEmail().normalizeEmail().withMessage('Valid email required'),
    body('roleId').optional().isInt({ min: 1 }).withMessage('Valid role ID required'),
    body('isActive').optional().isBoolean().withMessage('isActive must be boolean'),
    validate,
  ],
  updatePassword: [
    param('id').isInt({ min: 1 }).withMessage('Valid user ID required'),
    body('currentPassword').notEmpty().withMessage('Current password required'),
    body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
    validate,
  ],
};

export const projectValidators = {
  create: [
    body('name').trim().isLength({ min: 1, max: 150 }).withMessage('Name required (1-150 chars)'),
    body('description').optional().trim(),
    body('status').optional().isIn(['active', 'completed', 'on_hold', 'cancelled']).withMessage('Invalid status'),
    validate,
  ],
  update: [
    param('id').isInt({ min: 1 }).withMessage('Valid project ID required'),
    body('name').optional().trim().isLength({ min: 1, max: 150 }).withMessage('Name 1-150 chars'),
    body('description').optional().trim(),
    body('status').optional().isIn(['active', 'completed', 'on_hold', 'cancelled']).withMessage('Invalid status'),
    validate,
  ],
  assignUser: [
    param('id').isInt({ min: 1 }).withMessage('Valid project ID required'),
    body('userId').isInt({ min: 1 }).withMessage('Valid user ID required'),
    validate,
  ],
};

export const itemValidators = {
  create: [
    body('name').trim().isLength({ min: 1, max: 150 }).withMessage('Name required (1-150 chars)'),
    body('description').optional().trim(),
    body('quantity').optional().isInt({ min: 0 }).withMessage('Quantity must be non-negative integer'),
    body('unitPrice').optional().isFloat({ min: 0 }).withMessage('Unit price must be non-negative'),
    body('projectId').optional().isInt({ min: 1 }).withMessage('Valid project ID required'),
    validate,
  ],
  update: [
    param('id').isInt({ min: 1 }).withMessage('Valid item ID required'),
    body('name').optional().trim().isLength({ min: 1, max: 150 }).withMessage('Name 1-150 chars'),
    body('description').optional().trim(),
    body('quantity').optional().isInt({ min: 0 }).withMessage('Quantity non-negative integer'),
    body('unitPrice').optional().isFloat({ min: 0 }).withMessage('Unit price non-negative'),
    body('projectId').optional().isInt({ min: 1 }).withMessage('Valid project ID required'),
    validate,
  ],
  updateStatus: [
    param('id').isInt({ min: 1 }).withMessage('Valid item ID required'),
    body('status').isIn(['pending', 'approved', 'rejected']).withMessage('Invalid status'),
    validate,
  ],
};

export const pettyCashValidators = {
  allocate: [
    body('userId').isInt({ min: 1 }).withMessage('Valid user ID required'),
    body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be positive'),
    body('notes').optional().trim(),
    validate,
  ],
  expense: [
    body('userId').isInt({ min: 1 }).withMessage('Valid user ID required'),
    body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be positive'),
    body('description').trim().notEmpty().withMessage('Description required'),
    validate,
  ],
};

export const billValidators = {
  create: [
    body('type').isIn(['income', 'expense']).withMessage('Type must be income or expense'),
    body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be positive'),
    body('category').trim().notEmpty().withMessage('Category required'),
    body('description').optional().trim(),
    body('projectId').isInt({ min: 1 }).withMessage('Project is required'),
    body('itemId').isInt({ min: 1 }).withMessage('Item is required'),
    body('typeId').isInt({ min: 1 }).withMessage('Item type is required'),
    body('billDate').isISO8601().withMessage('Valid date required (YYYY-MM-DD)'),
    validate,
  ],
  update: [
    param('id').isInt({ min: 1 }).withMessage('Valid bill ID required'),
    body('type').optional().isIn(['income', 'expense']).withMessage('Type must be income or expense'),
    body('amount').optional().isFloat({ min: 0.01 }).withMessage('Amount must be positive'),
    body('category').optional().trim().notEmpty().withMessage('Category required'),
    body('description').optional().trim(),
    body('projectId').optional().isInt({ min: 1 }).withMessage('Valid project ID required'),
    body('itemId').optional().isInt({ min: 1 }).withMessage('Valid item ID required'),
    body('typeId').optional().isInt({ min: 1 }).withMessage('Valid item type ID required'),
    body('billDate').optional().isISO8601().withMessage('Valid date required (YYYY-MM-DD)'),
    validate,
  ],
};

export const paginationValidators = {
  list: [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit 1-100'),
    validate,
  ],
};