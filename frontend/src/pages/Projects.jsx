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
import { PlusIcon, PencilIcon, TrashIcon, BriefcaseIcon, UsersIcon } from '../components/icons';
import { formatDateTime, capitalize } from '../utils/format';

const projectStatuses = ['active', 'completed', 'on_hold', 'cancelled'];
const initialForm = { name: '', description: '', status: 'active' };

export default function Projects() {
  const { isAdmin } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit] = useState(10);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [allUsers, setAllUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('');

  const [deleting, setDeleting] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/projects', { params: { page, limit } });
      setProjects(res.data.projects);
      setTotal(res.data.total);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  }, [page, limit]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const openCreate = () => {
    setEditing(null);
    setForm(initialForm);
    setFormError('');
    setModalOpen(true);
  };

  const openEdit = (project) => {
    setEditing(project);
    setForm({ name: project.name, description: project.description || '', status: project.status });
    setFormError('');
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFormError('');
    try {
      if (editing) {
        await api.put(`/projects/${editing.id}`, form);
        setSuccess('Project updated');
      } else {
        await api.post('/projects', form);
        setSuccess('Project created');
      }
      setModalOpen(false);
      fetchProjects();
    } catch (err) {
      setFormError(err.response?.data?.error || 'Failed to save project');
    } finally {
      setSaving(false);
    }
  };

  const openDetail = async (project) => {
    setDetailLoading(true);
    setDetail({ ...project, users: [] });
    try {
      const res = await api.get(`/projects/${project.id}`);
      setDetail(res.data);
      const usersRes = await api.get('/users', { params: { limit: 100 } });
      setAllUsers(usersRes.data.users);
      setSelectedUserId('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load project');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedUserId) return;
    try {
      await api.post(`/projects/${detail.id}/users`, { userId: parseInt(selectedUserId) });
      setSuccess('User assigned to project');
      openDetail(detail);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to assign user');
    }
  };

  const handleRemoveUser = async (userId) => {
    try {
      await api.delete(`/projects/${detail.id}/users/${userId}`);
      setSuccess('User removed from project');
      openDetail(detail);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to remove user');
    }
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await api.delete(`/projects/${deleting.id}`);
      setSuccess('Project deleted');
      setDeleting(null);
      fetchProjects();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete project');
    } finally {
      setDeleteLoading(false);
    }
  };

  const assignedIds = (detail?.users || []).map((u) => u.id);
  const availableUsers = allUsers.filter((u) => !assignedIds.includes(u.id));

  return (
    <div>
      <PageHeader title="Projects" subtitle="Manage projects and assign team members" actionLabel={isAdmin ? 'Add Project' : undefined} onAction={isAdmin ? openCreate : undefined} actionIcon={isAdmin ? PlusIcon : undefined} />

      <ErrorAlert message={error} />
      {success && <div className="mb-4"><SuccessAlert message={success} /></div>}

      {loading ? (
        <Spinner />
      ) : projects.length === 0 ? (
        <Card><EmptyState title="No projects yet" description="Create a project to get started." icon={BriefcaseIcon} /></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {projects.map((project) => (
            <Card key={project.id} className="p-5 flex flex-col">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center shrink-0">
                    <BriefcaseIcon className="w-5 h-5 text-primary-600" />
                  </div>
                  <div className="min-w-0">
                    <button className="text-base font-semibold text-gray-900 hover:text-primary-600 text-left" onClick={() => openDetail(project)}>
                      {project.name}
                    </button>
                    <p className="text-xs text-gray-500">{formatDateTime(project.created_at)}</p>
                  </div>
                </div>
                <Badge status={project.status} />
              </div>
              {project.description && <p className="mt-3 text-sm text-gray-600 line-clamp-2">{project.description}</p>}
              <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                <p className="text-xs text-gray-500">By {project.created_by_name || '—'}</p>
                {isAdmin && (
                  <div className="flex space-x-2">
                    <Button variant="secondary" className="px-2.5 py-1.5" onClick={() => openEdit(project)}>
                      <PencilIcon className="w-4 h-4" />
                    </Button>
                    <Button variant="danger" className="px-2.5 py-1.5" onClick={() => setDeleting(project)}>
                      <TrashIcon className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      <div className="mt-4">
        <Pagination page={page} limit={limit} total={total} onPageChange={setPage} />
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Project' : 'Add Project'}>
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
          <div>
            <Label>Status</Label>
            <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              {projectStatuses.map((s) => (
                <option key={s} value={s}>{capitalize(s)}</option>
              ))}
            </Select>
          </div>
          <div className="flex justify-end space-x-3 pt-2">
            <Button variant="secondary" type="button" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Saving...' : editing ? 'Save Changes' : 'Create Project'}</Button>
          </div>
        </form>
      </Modal>

      <Modal open={!!detail} onClose={() => setDetail(null)} title={detail?.name} maxWidth="max-w-2xl">
        {detailLoading ? (
          <Spinner />
        ) : (
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <Badge status={detail?.status} />
              <span className="text-sm text-gray-500">Created {formatDateTime(detail?.created_at)}</span>
            </div>
            {detail?.description && <p className="text-sm text-gray-600">{detail.description}</p>}

            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                <UsersIcon className="w-4 h-4 mr-2 text-gray-400" />
                Assigned Users ({detail?.users?.length || 0})
              </h4>
              {(detail?.users || []).length === 0 ? (
                <p className="text-sm text-gray-500">No users assigned yet.</p>
              ) : (
                <ul className="divide-y divide-gray-200 border border-gray-200 rounded-lg">
                  {detail.users.map((user) => (
                    <li key={user.id} className="px-4 py-3 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{user.full_name}</p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge status={user.role_name}>{capitalize(user.role_name)}</Badge>
                        {isAdmin && (
                          <Button variant="danger" className="px-2 py-1 text-xs" onClick={() => handleRemoveUser(user.id)}>
                            Remove
                          </Button>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {isAdmin && (
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Assign User</h4>
                <div className="flex gap-3">
                  <Select value={selectedUserId} onChange={(e) => setSelectedUserId(e.target.value)} className="flex-1">
                    <option value="">Select a user...</option>
                    {availableUsers.map((u) => (
                      <option key={u.id} value={u.id}>{u.full_name} ({u.email})</option>
                    ))}
                  </Select>
                  <Button onClick={handleAssign} disabled={!selectedUserId}>Assign</Button>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        loading={deleteLoading}
        title="Delete project?"
        message={`Are you sure you want to delete ${deleting?.name}? Related assignments will also be removed.`}
        confirmLabel="Delete"
      />
    </div>
  );
}
