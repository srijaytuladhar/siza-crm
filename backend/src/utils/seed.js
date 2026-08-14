import bcrypt from 'bcryptjs';
import { query, pool } from '../config/database.js';
import { RoleModel } from '../models/Role.js';
import { UserModel } from '../models/User.js';

const DEFAULT_ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL || 'admin@crm.local';
const DEFAULT_ADMIN_PASSWORD = process.env.SUPER_ADMIN_PASSWORD || 'admin12345';
const DEFAULT_ADMIN_NAME = process.env.SUPER_ADMIN_NAME || 'Super Admin';

export const seedDatabase = async () => {
  console.log('Seeding database...');

  let superAdminRole = await RoleModel.findByName('super_admin');
  if (!superAdminRole) {
    await query(`INSERT IGNORE INTO CRM_roles (name) VALUES ('super_admin')`);
    superAdminRole = await RoleModel.findByName('super_admin');
  }

  const existing = await UserModel.findByEmail(DEFAULT_ADMIN_EMAIL);
  if (existing) {
    console.log(`Super admin already exists (${DEFAULT_ADMIN_EMAIL}), skipping.`);
    return;
  }

  await UserModel.create({
    fullName: DEFAULT_ADMIN_NAME,
    email: DEFAULT_ADMIN_EMAIL,
    password: DEFAULT_ADMIN_PASSWORD,
    roleId: superAdminRole.id,
    createdBy: null,
  });

  console.log(`Created default super admin: ${DEFAULT_ADMIN_EMAIL} / ${DEFAULT_ADMIN_PASSWORD}`);
  console.log('Seeding completed.');
};

const isDirectRun = process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href;
if (isDirectRun) {
  try {
    await seedDatabase();
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}