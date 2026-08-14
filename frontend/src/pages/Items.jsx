import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import PageHeader from '../components/PageHeader';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import Pagination from '../components/Pagination';
import Spinner from '../components/Spinner';
import Badge from '../components/Badge';
import EmptyState from '../components/EmptyState';
import { Input, TextArea, Select, Label, Button, ErrorAlert, SuccessAlert, Card } from '../components/ui';
import { PlusIcon, PencilIcon, TrashIcon, CubeIcon, CheckIcon, XIcon, TagIcon } from '../components/icons';
import { formatDateTime, formatCurrency } from '../utils/format';

const initialForm = { name: '', description: '', quantity: 1, unitPrice: '', projectId: '' };
const statuses = ['', 'pending', 'approved', 'rejected'];

export default function Items() {
  const { isAdmin, user } = useAuth();
  const [items, setItems] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit] = useState(10);
  const [statusFilter, setStatusFilter] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const [deleting, setDeleting] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [typesItem, setTypesItem] = useState(null);
  const [itemTypes, setItemTypes] = useState([]);
  const [newTypeName, setNewTypeName] = useState('');
  const [typeSaving, setTypeSaving] = useState(false);
  const [typeError, setTypeError] = useState('');
  const [typeDeleting, setTypeDeleting] = useState(false);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit };
      if (statusFilter) params.status = statusFilter;
      const res = await api.get('/items', { params });
      setItems(res.data.items);
      setTotal(res.data.total);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load items');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, limit]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  useEffect(() => {
    api
      .get('/projects', { params: { limit: 100 } })
      .then((res) => setProjects(res.data.projects))
      .catch(() => {});
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(initialForm);
    setFormError('');
    setModalOpen(true);
  };

  const openEdit = (item) => {
    setEditing(item);
    setForm({
      name: item.name,
      description: item.description || '',
      quantity: item.quantity,
      unitPrice: item.unit_price != null ? String(item.unit_price) : '',
      projectId: item.project_id ? String(item.project_id) : '',
    });
    setFormError('');
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFormError('');
    try {
      const payload = {
        name: form.name,
        description: form.description,
        quantity: parseInt(form.quantity) || 0,
        unitPrice: form.unitPrice === '' ? undefined : parseFloat(form.unitPrice),
        projectId: form.projectId === '' ? undefined : parseInt(form.projectId),
      };
      if (editing) {
        await api.put(`/items/${editing.id}`, payload);
        setSuccess('Item updated');
      } else {
        await api.post('/items', payload);
        setSuccess('Item submitted for approval');
      }
      setModalOpen(false);
      fetchItems();
    } catch (err) {
      setFormError(err.response?.data?.error || 'Failed to save item');
    } finally {
      setSaving(false);
    }
  };

  const handleStatus = async (item, status) => {
    try {
      await api.put(`/items/${item.id}/status`, { status });
      setSuccess(`Item ${status}`);
      fetchItems();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update item status');
    }
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await api.delete(`/items/${deleting.id}`);
      setSuccess('Item deleted');
      setDeleting(null);
      fetchItems();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete item');
    } finally {
      setDeleteLoading(false);
    }
  };

  const openTypes = async (item) => {
    setTypesItem(item);
    setNewTypeName('');
    setTypeError('');
    setItemTypes([]);
    try {
      const res = await api.get(`/item-types/item/${item.id}`);
      setItemTypes(res.data);
    } catch (err) {
      setTypeError(err.response?.data?.error || 'Failed to load types');
    }
  };

  const handleAddType = async (e) => {
    e.preventDefault();
    if (!newTypeName.trim()) return;
    setTypeSaving(true);
    setTypeError('');
    try {
      await api.post('/item-types', { itemId: typesItem.id, name: newTypeName.trim() });
      setNewTypeName('');
      const res = await api.get(`/item-types/item/${typesItem.id}`);
      setItemTypes(res.data);
      setSuccess('Type added');
      fetchItems();
    } catch (err) {
      setTypeError(err.response?.data?.error || 'Failed to add type');
    } finally {
      setTypeSaving(false);
    }
  };

  const handleDeleteType = async (type) => {
    setTypeDeleting(true);
    setTypeError('');
    try {
      await api.delete(`/item-types/${type.id}`);
      const res = await api.get(`/item-types/item/${typesItem.id}`);
      setItemTypes(res.data);
      setSuccess('Type deleted');
      fetchItems();
    } catch (err) {
      setTypeError(err.response?.data?.error || 'Failed to delete type');
    } finally {
      setTypeDeleting(false);
    }
  };

  const canEdit = (item) => isAdmin || (item.status === 'pending' && item.created_by === user.id);
  const canDelete = (item) => isAdmin || item.status === 'pending';

  return (
    <div>
      <PageHeader title="Items" subtitle={isAdmin ? 'Review and approve item entries' : 'Submit items for approval'} actionLabel="Add Item" onAction={openCreate} actionIcon={PlusIcon} />

      <ErrorAlert message={error} />
      {success && <div className="mb-4"><SuccessAlert message={success} /></div>}

      <Card className="overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex items-center gap-2">
            <Label className="mb-0 text-sm">Status</Label>
            <Select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="w-40">
              {statuses.map((s) => (
                <option key={s} value={s}>{s ? s.charAt(0).toUpperCase() + s.slice(1) : 'All statuses'}</option>
              ))}
            </Select>
          </div>
          <p className="text-sm text-gray-500 sm:ml-auto">{total} item{total === 1 ? '' : 's'}</p>
        </div>

        {loading ? (
          <Spinner />
        ) : items.length === 0 ? (
          <EmptyState title="No items found" description="Submit an item entry to get started." icon={CubeIcon} />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Types</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Price</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  {!isAdmin && <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submitted</th>}
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-gray-900">{item.name}</p>
                      {item.description && <p className="text-xs text-gray-500 max-w-[240px] truncate">{item.description}</p>}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{item.type_names || '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{item.project_name || '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{item.quantity}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{item.unit_price != null ? formatCurrency(item.unit_price) : '—'}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {item.unit_price != null ? formatCurrency(item.quantity * item.unit_price) : '—'}
                    </td>
                    <td className="px-4 py-3"><Badge status={item.status} /></td>
                    {!isAdmin && <td className="px-4 py-3 text-sm text-gray-500">{formatDateTime(item.created_at)}</td>}
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <div className="flex justify-end space-x-1.5">
                        {isAdmin && (
                          <Button variant="secondary" className="px-2.5 py-1.5" title="Manage types" onClick={() => openTypes(item)}>
                            <TagIcon className="w-4 h-4" />
                          </Button>
                        )}
                        {isAdmin && item.status === 'pending' && (
                          <>
                            <Button variant="success" className="px-2.5 py-1.5" onClick={() => handleStatus(item, 'approved')}>
                              <CheckIcon className="w-4 h-4" />
                            </Button>
                            <Button variant="danger" className="px-2.5 py-1.5" onClick={() => handleStatus(item, 'rejected')}>
                              <XIcon className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                        {canEdit(item) && (
                          <Button variant="secondary" className="px-2.5 py-1.5" onClick={() => openEdit(item)}>
                            <PencilIcon className="w-4 h-4" />
                          </Button>
                        )}
                        {canDelete(item) && (
                          <Button variant="danger" className="px-2.5 py-1.5" onClick={() => setDeleting(item)}>
                            <TrashIcon className="w-4 h-4" />
                          </Button>
                        )}
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

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Item' : 'Add Item'}>
        <form onSubmit={handleSave} className="space-y-4">
          <ErrorAlert message={formError} />
          <div>
            <Label>Name</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required maxLength={150} />
          </div>
          <div>
            <Label>Description</Label>
            <TextArea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Quantity</Label>
              <Input type="number" min="0" step="1" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} required />
            </div>
            <div>
              <Label>Unit price</Label>
              <Input type="number" min="0" step="0.01" value={form.unitPrice} onChange={(e) => setForm({ ...form, unitPrice: e.target.value })} placeholder="0.00" />
            </div>
          </div>
          <div>
            <Label>Project</Label>
            <Select value={form.projectId} onChange={(e) => setForm({ ...form, projectId: e.target.value })}>
              <option value="">No project</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </Select>
          </div>
          {isAdmin && (
            <p className="text-xs text-gray-500">After saving, add types to this item using the tag icon in the actions column.</p>
          )}
          {editing && <p className="text-xs text-gray-500">Only pending items can be edited.</p>}
          <div className="flex justify-end space-x-3 pt-2">
            <Button variant="secondary" type="button" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Saving...' : editing ? 'Save Changes' : 'Submit Item'}</Button>
          </div>
        </form>
      </Modal>

      <Modal open={!!typesItem} onClose={() => setTypesItem(null)} title={typesItem ? `Types for "${typesItem.name}"` : 'Item Types'}>
        <div className="space-y-4">
          <ErrorAlert message={typeError} />
          <form onSubmit={handleAddType} className="flex items-end gap-2">
            <div className="flex-1">
              <Label>New type</Label>
              <Input
                value={newTypeName}
                onChange={(e) => setNewTypeName(e.target.value)}
                placeholder="e.g. Electronics, Hardware"
                maxLength={100}
                required
              />
            </div>
            <Button type="submit" disabled={typeSaving || !newTypeName.trim()}>{typeSaving ? 'Adding...' : 'Add'}</Button>
          </form>
          <div className="border-t border-gray-200 pt-3">
            {itemTypes.length === 0 ? (
              <p className="text-sm text-gray-500">No types for this item yet.</p>
            ) : (
              <ul className="divide-y divide-gray-100">
                {itemTypes.map((t) => (
                  <li key={t.id} className="flex items-center justify-between py-2">
                    <span className="text-sm font-medium text-gray-900">{t.name}</span>
                    <Button
                      variant="danger"
                      className="px-2.5 py-1.5"
                      onClick={() => handleDeleteType(t)}
                      disabled={typeDeleting}
                    >
                      <TrashIcon className="w-4 h-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        loading={deleteLoading}
        title="Delete item?"
        message={`Are you sure you want to delete "${deleting?.name}"?`}
        confirmLabel="Delete"
      />
    </div>
  );
}