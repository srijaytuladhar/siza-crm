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
import { Input, Select, Label, Button, ErrorAlert, SuccessAlert } from '../components/ui';
import { PlusIcon, PencilIcon, TrashIcon, UsersIcon } from '../components/icons';
import { formatDateTime, capitalize } from '../utils/format';

const initialForm = { fullName: '', email: '', password: '', roleId: '' };

export default function Users() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit] = useState(10);
  const [roleFilter, setRoleFilter] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const [deleting, setDeleting] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit };
      if (roleFilter) params.roleId = roleFilter;
      const res = await api.get('/users', { params });
      setUsers(res.data.users);
      setTotal(res.data.total);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [page, roleFilter, limit]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    api
      .get('/users/roles')
      .then((res) => setRoles(res.data))
      .catch(() => {});
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(initialForm);
    setFormError('');
    setModalOpen(true);
  };

  const openEdit = (user) => {
    setEditing(user);
    setForm({ fullName: user.full_name, email: user.email, password: '', roleId: String(user.role_id) });
    setFormError('');
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFormError('');
    try {
      const payload = { fullName: form.fullName, email: form.email, roleId: parseInt(form.roleId) };
      if (!editing || form.password) payload.password = form.password;
      if (editing) {
        await api.put(`/users/${editing.id}`, payload);
        setSuccess('User updated successfully');
      } else {
        await api.post('/users', payload);
        setSuccess('User created successfully');
      }
      setModalOpen(false);
      fetchUsers();
    } catch (err) {
      const msg = err.response?.data?.error || (err.response?.data?.errors?.[0]?.msg) || 'Failed to save user';
      setFormError(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (user) => {
    try {
      await api.put(`/users/${user.id}`, { isActive: !user.is_active });
      setSuccess(user.is_active ? 'User deactivated' : 'User activated');
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update user');
    }
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await api.delete(`/users/${deleting.id}`);
      setSuccess('User deleted');
      setDeleting(null);
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete user');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div>
      <PageHeader title="Users" subtitle="Manage user accounts and roles" actionLabel="Add User" onAction={openCreate} actionIcon={PlusIcon} />

      <ErrorAlert message={error} />
      {success && <div className="mb-4"><SuccessAlert message={success} /></div>}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex items-center gap-2">
            <Label className="mb-0 text-sm">Role</Label>
            <Select value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }} className="w-40">
              <option value="">All roles</option>
              {roles.map((r) => (
                <option key={r.id} value={r.id}>{capitalize(r.name)}</option>
              ))}
            </Select>
          </div>
          <p className="text-sm text-gray-500 sm:ml-auto">{total} user{total === 1 ? '' : 's'}</p>
        </div>

        {loading ? (
          <Spinner />
        ) : users.length === 0 ? (
          <EmptyState title="No users found" description="Create a user to get started." icon={UsersIcon} />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{user.full_name}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{user.email}</td>
                    <td className="px-4 py-3"><Badge status={user.role_name}>{capitalize(user.role_name)}</Badge></td>
                    <td className="px-4 py-3"><Badge status={user.is_active ? 'active' : 'cancelled'}>{user.is_active ? 'Active' : 'Inactive'}</Badge></td>
                    <td className="px-4 py-3 text-sm text-gray-500">{formatDateTime(user.created_at)}</td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <div className="flex justify-end space-x-2">
                        <Button variant="secondary" className="px-2.5 py-1.5" onClick={() => openEdit(user)}>
                          <PencilIcon className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="secondary"
                          className="px-2.5 py-1.5"
                          onClick={() => handleToggleActive(user)}
                          disabled={user.id === currentUser.id}
                        >
                          {user.is_active ? 'Deactivate' : 'Activate'}
                        </Button>
                        <Button
                          variant="danger"
                          className="px-2.5 py-1.5"
                          onClick={() => setDeleting(user)}
                          disabled={user.id === currentUser.id}
                        >
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
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit User' : 'Add User'}>
        <form onSubmit={handleSave} className="space-y-4">
          <ErrorAlert message={formError} />
          <div>
            <Label>Full name</Label>
            <Input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} required minLength={2} maxLength={150} />
          </div>
          <div>
            <Label>Email</Label>
            <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          </div>
          <div>
            <Label>{editing ? 'Password (leave blank to keep current)' : 'Password'}</Label>
            <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required={!editing} minLength={6} />
          </div>
          <div>
            <Label>Role</Label>
            <Select value={form.roleId} onChange={(e) => setForm({ ...form, roleId: e.target.value })} required>
              <option value="">Select role</option>
              {roles.map((r) => (
                <option key={r.id} value={r.id}>{capitalize(r.name)}</option>
              ))}
            </Select>
          </div>
          <div className="flex justify-end space-x-3 pt-2">
            <Button variant="secondary" type="button" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Saving...' : editing ? 'Save Changes' : 'Create User'}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        loading={deleteLoading}
        title="Delete user?"
        message={`Are you sure you want to delete ${deleting?.full_name}? This action cannot be undone.`}
        confirmLabel="Delete"
      />
    </div>
  );
}
