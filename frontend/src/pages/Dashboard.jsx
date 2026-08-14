import React, { useEffect, useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import Spinner from '../components/Spinner';
import { ErrorAlert } from '../components/ui';
import { Card, StatCard } from '../components/ui';
import EmptyState from '../components/EmptyState';
import Badge from '../components/Badge';
import { TrendUpIcon, TrendDownIcon, WalletIcon, CubeIcon, ReceiptIcon, ClipboardIcon } from '../components/icons';
import { formatCurrency, formatDateTime, capitalize } from '../utils/format';

const AdminDashboard = () => {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/dashboard/stats')
      .then((res) => setData(res.data))
      .catch((err) => setError(err.response?.data?.error || 'Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;
  if (error) return <ErrorAlert message={error} />;
  if (!data) return null;

  const { billSummary, projectSummary, pettyCashUsage, pendingItemsCount, recentActivity, monthlyData } = data;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Income"
          value={formatCurrency(billSummary.income)}
          sub={`${billSummary.incomeCount} bills`}
          icon={TrendUpIcon}
          accent="text-green-600"
        />
        <StatCard
          label="Total Expense"
          value={formatCurrency(billSummary.expense)}
          sub={`${billSummary.expenseCount} bills`}
          icon={TrendDownIcon}
          accent="text-red-600"
        />
        <StatCard
          label="Net"
          value={formatCurrency(billSummary.net)}
          sub={billSummary.net >= 0 ? 'Profit' : 'Loss'}
          icon={WalletIcon}
          accent="text-primary-600"
        />
        <StatCard
          label="Pending Item Approvals"
          value={pendingItemsCount}
          icon={CubeIcon}
          accent="text-yellow-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-5">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Monthly Income vs Expense</h2>
          {monthlyData.length > 0 ? (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Legend />
                  <Bar dataKey="income" name="Income" fill="#16a34a" />
                  <Bar dataKey="expense" name="Expense" fill="#dc2626" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState title="No monthly data yet" description="Bills will appear here once recorded." />
          )}
        </Card>

        <Card className="p-5">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Project-wise Financial Summary</h2>
          {projectSummary.length > 0 ? (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={projectSummary}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Legend />
                  <Bar dataKey="income" name="Income" fill="#16a34a" />
                  <Bar dataKey="expense" name="Expense" fill="#dc2626" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState title="No project data yet" description="Assign bills to projects to see summaries." />
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-5">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Petty Cash Usage per User</h2>
          {pettyCashUsage.length > 0 ? (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={pettyCashUsage}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="userName" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Legend />
                  <Line type="monotone" dataKey="allocated" name="Allocated" stroke="#0284c7" />
                  <Line type="monotone" dataKey="spent" name="Spent" stroke="#dc2626" />
                  <Line type="monotone" dataKey="balance" name="Balance" stroke="#16a34a" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState title="No petty cash data yet" description="Allocate petty cash to users to track usage." />
          )}
        </Card>

        <Card className="p-5">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <ClipboardIcon className="w-5 h-5 mr-2 text-gray-400" />
            Recent Activity
          </h2>
          {recentActivity.length > 0 ? (
            <ul className="divide-y divide-gray-200 max-h-72 overflow-y-auto">
              {recentActivity.map((log) => (
                <li key={log.id} className="py-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-gray-800">{log.action}</span>
                    <span className="text-xs text-gray-400 whitespace-nowrap">{formatDateTime(log.created_at)}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {log.user_name || 'System'} · {log.entity_type || '—'}
                    {log.entity_id ? ` #${log.entity_id}` : ''}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="No activity yet" />
          )}
        </Card>
      </div>
    </div>
  );
};

const UserDashboard = () => {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/dashboard/user')
      .then((res) => setData(res.data))
      .catch((err) => setError(err.response?.data?.error || 'Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;
  if (error) return <ErrorAlert message={error} />;
  if (!data) return null;

  const { billSummary, balance, pendingItemsCount, recentItems, recentBills, recentExpenses } = data;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Petty Cash Balance" value={formatCurrency(balance.balance)} icon={WalletIcon} accent="text-green-600" />
        <StatCard label="Total Allocated" value={formatCurrency(balance.allocated)} icon={TrendUpIcon} accent="text-primary-600" />
        <StatCard label="Total Spent" value={formatCurrency(balance.spent)} icon={TrendDownIcon} accent="text-red-600" />
        <StatCard label="Pending Items" value={pendingItemsCount} icon={CubeIcon} accent="text-yellow-600" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="My Income" value={formatCurrency(billSummary.income)} icon={ReceiptIcon} accent="text-green-600" />
        <StatCard label="My Expense" value={formatCurrency(billSummary.expense)} icon={ReceiptIcon} accent="text-red-600" />
        <StatCard label="My Net" value={formatCurrency(billSummary.net)} icon={TrendUpIcon} accent="text-primary-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-5">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Items</h2>
          {recentItems.length > 0 ? (
            <ul className="divide-y divide-gray-200">
              {recentItems.map((item) => (
                <li key={item.id} className="py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{item.name}</p>
                    <p className="text-xs text-gray-500">
                      {item.project_name || 'No project'} · Qty {item.quantity}
                    </p>
                  </div>
                  <Badge status={item.status} />
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="No items yet" />
          )}
        </Card>

        <Card className="p-5">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Bills</h2>
          {recentBills.length > 0 ? (
            <ul className="divide-y divide-gray-200">
              {recentBills.map((bill) => (
                <li key={bill.id} className="py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{capitalize(bill.category)}</p>
                    <p className="text-xs text-gray-500">{bill.project_name || 'No project'}</p>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">{formatCurrency(bill.amount)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="No bills yet" />
          )}
        </Card>

        <Card className="p-5">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Petty Cash Expenses</h2>
          {recentExpenses.length > 0 ? (
            <ul className="divide-y divide-gray-200">
              {recentExpenses.map((expense) => (
                <li key={expense.id} className="py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{expense.description}</p>
                    <p className="text-xs text-gray-500">{formatDateTime(expense.spent_at)}</p>
                  </div>
                  <span className="text-sm font-semibold text-red-600">-{formatCurrency(expense.amount)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="No expenses yet" />
          )}
        </Card>
      </div>
    </div>
  );
};

export default function Dashboard() {
  const { isAdmin } = useAuth();
  return isAdmin ? <AdminDashboard /> : <UserDashboard />;
}
