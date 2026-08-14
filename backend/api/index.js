import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from '../src/config/index.js';

import authRoutes from '../src/routes/auth.js';
import userRoutes from '../src/routes/users.js';
import projectRoutes from '../src/routes/projects.js';
import itemRoutes from '../src/routes/items.js';
import itemTypeRoutes from '../src/routes/itemTypes.js';
import pettyCashRoutes from '../src/routes/pettyCash.js';
import billRoutes from '../src/routes/bills.js';
import dashboardRoutes from '../src/routes/dashboard.js';
import auditLogRoutes from '../src/routes/auditLogs.js';

const app = express();

app.use(helmet());
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3001',
  'https://siza-crm-ui.vercel.app',
  ...config.cors.origin.split(',').map((o) => o.trim()).filter(Boolean),
];

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    return cb(null, false);
  },
  credentials: true,
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/', (req, res) => {
  res.json({ message: 'CRM API is running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/item-types', itemTypeRoutes);
app.use('/api/petty-cash', pettyCashRoutes);
app.use('/api/bills', billRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/audit-logs', auditLogRoutes);

app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

export default app;
