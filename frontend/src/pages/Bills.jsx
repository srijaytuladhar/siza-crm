import React, { useEffect, useState, useCallback } from 'react';
import { api } from '../services/api';
import PageHeader from '../components/PageHeader';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import Pagination from '../components/Pagination';
import Spinner from '../components/Spinner';
import Badge from '../components/Badge';
import EmptyState from '../components/EmptyState';
import { Input, TextArea, Select, Label, Button, ErrorAlert, SuccessAlert, Card, StatCard } from '../components/ui';
import { PlusIcon, PencilIcon, TrashIcon, ReceiptIcon, TrendUpIcon, TrendDownIcon, WalletIcon } from '../components/icons';
import { formatCurrency, formatDate, capitalize } from '../utils/format';

const initialForm = { type: 'expense', amount: '', category: '', description: '', projectId: '', itemId: '', typeId: '', billDate: new Date().toISOString().substring(0, 10) };

export default function Bills() {
  const [bills, setBills] = useState([]);
  const [projects, setProjects] = useState([]);
  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit] = useState(10);
  const [typeFilter, setTypeFilter] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const [deleting, setDeleting] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchBills = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit };
      if (typeFilter) params.type = typeFilter;
      const res = await api.get('/bills', { params });
      setBills(res.data.bills);
      setTotal(res.data.total);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load bills');
    } finally {
      setLoading(false);
    }
  }, [page, typeFilter, limit]);

  useEffect(() => {
    fetchBills();
  }, [fetchBills]);

  useEffect(() => {
    api
      .get('/bills/summary')
      .then((res) => setSummary(res.data))
      .catch(() => {});
    api
      .get('/projects', { params: { limit: 100 } })
      .then((res) => setProjects(res.data.projects))
      .catch(() => {});
    api
      .get('/items', { params: { limit: 100 } })
      .then((res) => setItems(res.data.items))
      .catch(() => {});
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(initialForm);
    setFormError('');
    setModalOpen(true);
  };

  const openEdit = (bill) => {
    setEditing(bill);
    setForm({
      type: bill.type,
      amount: String(bill.amount),
      category: bill.category || '',
      description: bill.description || '',
      projectId: bill.project_id ? String(bill.project_id) : '',
      itemId: bill.item_id ? String(bill.item_id) : '',
      typeId: bill.type_id ? String(bill.type_id) : '',
      billDate: bill.bill_date ? String(bill.bill_date).substring(0, 10) : '',
    });
    setFormError('');
    setModalOpen(true);
  };

  const handleItemChange = (itemId) => {
    const selectedItem = items.find((i) => i.id === Number(itemId));
    const firstType = selectedItem?.types?.[0]?.id;
    setForm({
      ...form,
      itemId,
      typeId: firstType ? String(firstType) : '',
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFormError('');
    try {
      const payload = {
        type: form.type,
        amount: parseFloat(form.amount),
        category: form.category,
        description: form.description,
        projectId: parseInt(form.projectId),
        itemId: parseInt(form.itemId),
        typeId: parseInt(form.typeId),
        billDate: form.billDate,
      };
      if (editing) {
        await api.put(`/bills/${editing.id}`, payload);
        setSuccess('Bill updated');
      } else {
        await api.post('/bills', payload);
        setSuccess('Bill created');
      }
      setModalOpen(false);
      fetchBills();
      api.get('/bills/summary').then((res) => setSummary(res.data)).catch(() => {});
    } catch (err) {
      setFormError(err.response?.data?.error || 'Failed to save bill');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await api.delete(`/bills/${deleting.id}`);
      setSuccess('Bill deleted');
      setDeleting(null);
      fetchBills();
      api.get('/bills/summary').then((res) => setSummary(res.data)).catch(() => {});
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete bill');
    } finally {
      setDeleteLoading(false);
    }
  };

  const selectedItem = items.find((i) => i.id === Number(form.itemId));

  return (
    <div>
      <PageHeader title="Bills" subtitle="Record income and expenses" actionLabel="Add Bill" onAction={openCreate} actionIcon={PlusIcon} />

      <ErrorAlert message={error} />
      {success && <div className="mb-4"><SuccessAlert message={success} /></div>}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard label="Income" value={formatCurrency(summary?.income)} icon={TrendUpIcon} accent="text-green-600" />
        <StatCard label="Expense" value={formatCurrency(summary?.expense)} icon={TrendDownIcon} accent="text-red-600" />
        <StatCard label="Net" value={formatCurrency(summary?.net)} icon={WalletIcon} accent="text-primary-600" />
      </div>

      <Card className="overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex items-center gap-2">
            <Label className="mb-0 text-sm">Type</Label>
            <Select value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }} className="w-40">
              <option value="">All types</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </Select>
          </div>
          <p className="text-sm text-gray-500 sm:ml-auto">{total} bill{total === 1 ? '' : 's'}</p>
        </div>

        {loading ? (
          <Spinner />
        ) : bills.length === 0 ? (
          <EmptyState title="No bills found" description="Record an income or expense bill to get started." icon={ReceiptIcon} />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {bills.map((bill) => (
                  <tr key={bill.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">{formatDate(bill.bill_date)}</td>
                    <td className="px-4 py-3"><Badge status={bill.type}>{capitalize(bill.type)}</Badge></td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{bill.item_name || '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{bill.type_name || '—'}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{capitalize(bill.category)}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 max-w-[200px] truncate">{bill.description || '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{bill.project_name || '—'}</td>
                    <td className={`px-4 py-3 text-sm font-semibold ${bill.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                      {bill.type === 'income' ? '+' : '-'}{formatCurrency(bill.amount)}
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <div className="flex justify-end space-x-2">
                        <Button variant="secondary" className="px-2.5 py-1.5" onClick={() => openEdit(bill)}>
                          <PencilIcon className="w-4 h-4" />
                        </Button>
                        <Button variant="danger" className="px-2.5 py-1.5" onClick={() => setDeleting(bill)}>
                          <TrashIcon className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="px-4 pb-4">
          <Pagination page={page} limit={limit} total={total} onPageChange={setPage} />
        </div>
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Bill' : 'Add Bill'}>
        <form onSubmit={handleSave} className="space-y-4">
          <ErrorAlert message={formError} />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Type</Label>
              <Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </Select>
            </div>
            <div>
              <Label>Amount</Label>
              <Input type="number" min="0.01" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Category</Label>
              <Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} required />
            </div>
            <div>
              <Label>Bill date</Label>
              <Input type="date" value={form.billDate} onChange={(e) => setForm({ ...form, billDate: e.target.value })} required />
            </div>
          </div>
          <div>
            <Label>Description</Label>
            <TextArea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div>
            <Label>Project <span className="text-red-500">*</span></Label>
            <Select value={form.projectId} onChange={(e) => setForm({ ...form, projectId: e.target.value })} required>
              <option value="">Select project</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Item <span className="text-red-500">*</span></Label>
              <Select value={form.itemId} onChange={(e) => handleItemChange(e.target.value)} required>
                <option value="">Select item</option>
                {items.map((i) => (
                  <option key={i.id} value={i.id}>{i.name}{i.type_names ? ` (${i.type_names})` : ''}</option>
                ))}
              </Select>
            </div>
            <div>
              <Label>Item Type <span className="text-red-500">*</span></Label>
              <Select
                value={form.typeId}
                onChange={(e) => setForm({ ...form, typeId: e.target.value })}
                required
                disabled={!selectedItem || !selectedItem.types?.length}
              >
                <option value="">
                  {!selectedItem
                    ? 'Select an item first'
                    : selectedItem.types?.length
                      ? 'Select type'
                      : 'Item has no types assigned'}
                </option>
                {selectedItem?.types?.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </Select>
            </div>
          </div>
          <div className="flex justify-end space-x-3 pt-2">
            <Button variant="secondary" type="button" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Saving...' : editing ? 'Save Changes' : 'Create Bill'}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        loading={deleteLoading}
        title="Delete bill?"
        message={`Are you sure you want to delete this ${deleting?.type} bill of ${deleting ? formatCurrency(deleting.amount) : ''}?`}
        confirmLabel="Delete"
      />
    </div>
  );
}