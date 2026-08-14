import React, { useEffect, useState, useCallback } from 'react';
import { api } from '../services/api';
import PageHeader from '../components/PageHeader';
import Pagination from '../components/Pagination';
import Spinner from '../components/Spinner';
import Badge from '../components/Badge';
import EmptyState from '../components/EmptyState';
import { Input, Label, Button, ErrorAlert, Card } from '../components/ui';
import { ClipboardIcon } from '../components/icons';
import { formatDateTime, capitalize } from '../utils/format';

const entityTypes = ['', 'user', 'project', 'project_user', 'item', 'petty_cash_allocation', 'petty_cash_expense', 'bill'];

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit] = useState(20);
  const [actionFilter, setActionFilter] = useState('');
  const [entityFilter, setEntityFilter] = useState('');

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit };
      if (actionFilter) params.action = actionFilter;
      if (entityFilter) params.entityType = entityFilter;
      const res = await api.get('/audit-logs', { params });
      setLogs(res.data.logs);
      setTotal(res.data.total);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  }, [page, limit, actionFilter, entityFilter]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleFilter = (e) => {
    e.preventDefault();
    setPage(1);
    fetchLogs();
  };

  return (
    <div>
      <PageHeader title="Audit Logs" subtitle="Track who did what and when" />

      <ErrorAlert message={error} />

      <Card className="overflow-hidden">
        <form onSubmit={handleFilter} className="p-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex items-center gap-2">
            <Label className="mb-0 text-sm">Action</Label>
            <Input value={actionFilter} onChange={(e) => setActionFilter(e.target.value)} placeholder="e.g. CREATE_ITEM" className="w-56" />
          </div>
          <div className="flex items-center gap-2">
            <Label className="mb-0 text-sm">Entity</Label>
            <select
              className="w-48 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-primary-500"
              value={entityFilter}
              onChange={(e) => setEntityFilter(e.target.value)}
            >
              {entityTypes.map((t) => (
                <option key={t} value={t}>{t ? capitalize(t) : 'All entities'}</option>
              ))}
            </select>
          </div>
          <Button type="submit" className="sm:ml-auto">Filter</Button>
        </form>

        {loading ? (
          <Spinner />
        ) : logs.length === 0 ? (
          <EmptyState title="No audit logs found" icon={ClipboardIcon} />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Entity</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <Badge status={log.action.includes('DELETE') || log.action.includes('REJECT') ? 'rejected' : log.action.includes('APPROVE') ? 'approved' : 'active'}>
                        {log.action.replace(/_/g, ' ')}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">{log.user_name || 'System'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {capitalize(log.entity_type || '—')}
                      {log.entity_id ? ` #${log.entity_id}` : ''}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 max-w-[280px] truncate">
                      {log.details ? JSON.stringify(log.details) : '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">{formatDateTime(log.created_at)}</td>
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
    </div>
  );
}