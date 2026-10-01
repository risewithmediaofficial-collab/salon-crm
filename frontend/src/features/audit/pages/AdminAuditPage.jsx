import React, { useState, useEffect } from 'react';
import apiClient from '../../../services/apiClient.js';
import Card from '../../../components/common/Card.jsx';
import Table from '../../../components/common/Table.jsx';
import Pagination from '../../../components/common/Pagination.jsx';
import Skeleton from '../../../components/common/Skeleton.jsx';
import EmptyState from '../../../components/common/EmptyState.jsx';
import { History, ShieldAlert } from 'lucide-react';

export function AdminAuditPage() {
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [isLoading, setIsLoading] = useState(true);

  const loadAuditLogs = async (page = 1) => {
    setIsLoading(true);
    try {
      const res = await apiClient.get('/audit', { params: { page, limit: 20 } });
      setLogs(res.data || []);
      if (res.pagination) setPagination(res.pagination);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAuditLogs(1);
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-stone-900 tracking-tight">Security & Operational Audit Log</h1>
        <p className="text-xs text-stone-500 mt-0.5">
          Immutable audit record of administrative actions, pricing edits, booking status changes, and staff events
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="p-4 rounded-xl bg-white border border-stone-200">
              <Skeleton className="h-5 w-1/3 mb-2" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      ) : logs.length === 0 ? (
        <EmptyState
          icon={History}
          title="No audit entries recorded yet"
          description="System actions will be automatically catalogued here."
        />
      ) : (
        <div className="bg-white rounded-2xl border border-stone-200 shadow-soft overflow-hidden">
          <Table headers={['Timestamp', 'Action Type', 'Description', 'Performed By', 'Target Entity']}>
            {logs.map((log) => (
              <tr key={log._id} className="hover:bg-stone-50/50 transition-colors text-xs">
                <td className="px-5 py-3.5 font-mono text-[11px] text-stone-500 whitespace-nowrap">
                  {new Date(log.createdAt).toLocaleString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  })}
                </td>

                <td className="px-5 py-3.5 font-bold font-mono text-[11px] text-salon-800">
                  {log.action}
                </td>

                <td className="px-5 py-3.5 text-stone-800 max-w-md">
                  {log.description}
                </td>

                <td className="px-5 py-3.5 font-medium text-stone-700">
                  {log.performedBy?.name || 'System / Customer'}
                </td>

                <td className="px-5 py-3.5 text-stone-400 font-mono text-[11px]">
                  {log.entityType} {log.entityId ? `#${String(log.entityId).slice(-6)}` : ''}
                </td>
              </tr>
            ))}
          </Table>

          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            totalItems={pagination.total}
            pageSize={pagination.limit}
            onPageChange={(p) => loadAuditLogs(p)}
          />
        </div>
      )}
    </div>
  );
}

export default AdminAuditPage;
