import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import PageHeader from '../components/PageHeader';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import Spinner from '../components/Spinner';
import Badge from '../components/Badge';
import EmptyState from '../components/EmptyState';
import { Input, TextArea, Select, Label, Button, ErrorAlert, SuccessAlert, Card, StatCard } from '../components/ui';
import { PlusIcon, TrashIcon, WalletIcon, TrendUpIcon, TrendDownIcon } from '../components/icons';
import { formatCurrency, formatDateTime } from '../utils/format';

export default function PettyCash() {
  const { isAdmin, user } = useAuth();
  const [balance, setBalance] = useState(null);
  const [users, setUsers] = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [allocModal, setAllocModal] = useState(false);
  const [allocForm, setAllocForm] = useState({ userId: '', amount: '', notes: '' });
  const [allocSaving, setAllocSaving] = useState(false);
  const [allocError, setAllocError] = useState('');

  const [expModal, setExpModal] = useState(false);
  const [expForm, setExpForm] = useState({ userId: '', amount: '', description: '' });
  const [expSaving, setExpSaving] = useState(false);
  const [expError, setExpError] = useState('');

  const [deleting, setDeleting] = useState(null);
  const [deleteKind, setDeleteKind] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [balanceRes, allocRes, expRes] = await Promise.all([
        api.get('/petty-cash/balance'),
        api.get('/petty-cash/allocations', { params: { limit: 100 } }),
        api.get('/petty-cash/expenses', { params: { limit: 100 } }),
      ]);
      setBalance(balanceRes.data);
      setAllocations(allocRes.data.allocations);
      setExpenses(expRes.data.expenses);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load petty cash data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (isAdmin) {
      api
        .get('/users', { params: { limit: 100 } })
        .then((res) => setUsers(res.data.users))
        .catch(() => {});
    }
  }, [isAdmin]);

  const openAlloc = () => {
    setAllocForm({ userId: user?.roleName === 'user' ? String(user.id) : '', amount: '', notes: '' });
    setAllocError('');
    setAllocModal(true);
  };

  const handleAllocate = async (e) => {
    e.preventDefault();
    setAllocSaving(true);
    setAllocError('');
    try {
      await api.post('/petty-cash/allocate', {
        userId: parseInt(allocForm.userId),
        amount: parseFloat(allocForm.amount),
        notes: allocForm.notes,
      });
      setSuccess('Petty cash allocated');
      setAllocModal(false);
      fetchData();
    } catch (err) {
      setAllocError(err.response?.data?.error || 'Failed to allocate petty cash');
    } finally {
      setAllocSaving(false);
    }
  };

  const openExpense = () => {
    setExpForm({ userId: user?.roleName === 'user' ? String(user.id) : '', amount: '', description: '' });
    setExpError('');
    setExpModal(true);
  };

  const handleExpense = async (e) => {
    e.preventDefault();
    setExpSaving(true);
    setExpError('');
    try {
      await api.post('/petty-cash/expense', {
        userId: parseInt(expForm.userId),
        amount: parseFloat(expForm.amount),
        description: expForm.description,
      });
      setSuccess('Expense logged');
      setExpModal(false);
      fetchData();
    } catch (err) {
      setExpError(err.response?.data?.error || 'Failed to log expense');
    } finally {
      setExpSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      if (deleteKind === 'allocation') {
        await api.delete(`/petty-cash/allocations/${deleting.id}`);
      } else {
        await api.delete(`/petty-cash/expenses/${deleting.id}`);
      }
      setSuccess('Deleted');
      setDeleting(null);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Petty Cash"
        subtitle={isAdmin ? 'Allocate funds and track spending' : 'Track your petty cash balance'}
        actionLabel="Log Expense"
        onAction={openExpense}
        actionIcon={PlusIcon}
      />

      <ErrorAlert message={error} />
      {success && <div className="mb-4"><SuccessAlert message={success} /></div>}

      {loading ? (
        <Spinner />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <StatCard label="Allocated" value={formatCurrency(balance?.allocated)} icon={TrendUpIcon} accent="text-primary-600" />
            <StatCard label="Spent" value={formatCurrency(balance?.spent)} icon={TrendDownIcon} accent="text-red-600" />
            <StatCard label="Balance" value={formatCurrency(balance?.balance)} icon={WalletIcon} accent="text-green-600" />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-end gap-3 mb-4">
            {isAdmin && (
              <Button onClick={openAlloc}>
                <PlusIcon className="w-4 h-4 mr-2" />
                Allocate Petty Cash
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Allocations</h2>
                <span className="text-sm text-gray-500">{allocations.length}</span>
              </div>
              {allocations.length === 0 ? (
                <EmptyState title="No allocations yet" />
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                        <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                        <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">Assigned By</th>
                        <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                        {isAdmin && <th className="px-4 py-2.5 text-right"></th>}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {allocations.map((a) => (
                        <tr key={a.id}>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">{a.user_name}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{formatCurrency(a.amount)}</td>
                          <td className="px-4 py-3 text-sm text-gray-500">{a.assigned_by_name || '—'}</td>
                          <td className="px-4 py-3 text-sm text-gray-500">{formatDateTime(a.assigned_at)}</td>
                          {isAdmin && (
                            <td className="px-4 py-3 text-right">
                              <Button variant="danger" className="px-2 py-1.5" onClick={() => { setDeleting(a); setDeleteKind('allocation'); }}>
                                <TrashIcon className="w-4 h-4" />
                              </Button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>

            <Card className="overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Expenses</h2>
                <span className="text-sm text-gray-500">{expenses.length}</span>
              </div>
              {expenses.length === 0 ? (
                <EmptyState title="No expenses logged" />
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                        <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                        <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                        <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                        {isAdmin && <th className="px-4 py-2.5 text-right"></th>}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {expenses.map((exp) => (
                        <tr key={exp.id}>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">{exp.description}</td>
                          <td className="px-4 py-3 text-sm text-gray-500">{exp.user_name}</td>
                          <td className="px-4 py-3 text-sm text-red-600">-{formatCurrency(exp.amount)}</td>
                          <td className="px-4 py-3 text-sm text-gray-500">{formatDateTime(exp.spent_at)}</td>
                          {isAdmin && (
                            <td className="px-4 py-3 text-right">
                              <Button variant="danger" className="px-2 py-1.5" onClick={() => { setDeleting(exp); setDeleteKind('expense'); }}>
                                <TrashIcon className="w-4 h-4" />
                              </Button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </div>
        </>
      )}

      <Modal open={allocModal} onClose={() => setAllocModal(false)} title="Allocate Petty Cash">
        <form onSubmit={handleAllocate} className="space-y-4">
          <ErrorAlert message={allocError} />
          <div>
            <Label>User</Label>
            <Select value={allocForm.userId} onChange={(e) => setAllocForm({ ...allocForm, userId: e.target.value })} required>
              <option value="">Select user</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>{u.full_name} ({u.email})</option>
              ))}
            </Select>
          </div>
          <div>
            <Label>Amount</Label>
            <Input type="number" min="0.01" step="0.01" value={allocForm.amount} onChange={(e) => setAllocForm({ ...allocForm, amount: e.target.value })} required />
          </div>
          <div>
            <Label>Notes</Label>
            <TextArea value={allocForm.notes} onChange={(e) => setAllocForm({ ...allocForm, notes: e.target.value })} />
          </div>
          <div className="flex justify-end space-x-3 pt-2">
            <Button variant="secondary" type="button" onClick={() => setAllocModal(false)}>Cancel</Button>
            <Button type="submit" disabled={allocSaving}>{allocSaving ? 'Allocating...' : 'Allocate'}</Button>
          </div>
        </form>
      </Modal>

      <Modal open={expModal} onClose={() => setExpModal(false)} title="Log Petty Cash Expense">
        <form onSubmit={handleExpense} className="space-y-4">
          <ErrorAlert message={expError} />
          {isAdmin && (
            <div>
              <Label>User</Label>
              <Select value={expForm.userId} onChange={(e) => setExpForm({ ...expForm, userId: e.target.value })} required>
                <option value="">Select user</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>{u.full_name} ({u.email})</option>
                ))}
              </Select>
            </div>
          )}
          <div>
            <Label>Amount</Label>
            <Input type="number" min="0.01" step="0.01" value={expForm.amount} onChange={(e) => setExpForm({ ...expForm, amount: e.target.value })} required />
          </div>
          <div>
            <Label>Description</Label>
            <Input value={expForm.description} onChange={(e) => setExpForm({ ...expForm, description: e.target.value })} required />
          </div>
          <div className="flex justify-end space-x-3 pt-2">
            <Button variant="secondary" type="button" onClick={() => setExpModal(false)}>Cancel</Button>
            <Button type="submit" disabled={expSaving}>{expSaving ? 'Saving...' : 'Log Expense'}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        loading={deleteLoading}
        title="Delete record?"
        message="Are you sure you want to delete this record?"
        confirmLabel="Delete"
      />
    </div>
  );
}
