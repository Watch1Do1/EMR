import { Shield, Eye, FileEdit, UserCircle } from 'lucide-react';
import { AuditLog } from '../types';
import { formatDateTime, cn } from '../lib/utils';

const MOCK_LOGS: AuditLog[] = [
  { id: 'l1', timestamp: '2023-10-12T10:15:00Z', userId: 'dr_smith', userEmail: 'drsmith@clinic.com', action: 'view', entityType: 'patient', entityId: '1', details: 'Viewed chart summary' },
  { id: 'l2', timestamp: '2023-10-12T10:30:00Z', userId: 'dr_smith', userEmail: 'drsmith@clinic.com', action: 'edit', entityType: 'note', entityId: 'n1', details: 'Created follow-up note' },
  { id: 'l3', timestamp: '2023-10-12T10:45:00Z', userId: 'dr_smith', userEmail: 'drsmith@clinic.com', action: 'sign', entityType: 'note', entityId: 'n1', details: 'Signed and finalized note' },
];

export function AdminView() {
  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">System Administration</h2>
          <p className="text-slate-500 mt-1">Audit logs, user management, and security settings.</p>
        </div>
        <div className="bg-slate-100 px-4 py-2 rounded-lg flex items-center gap-2 text-slate-600 text-sm font-medium">
          <Shield size={18} className="text-blue-600" />
          HIPAA Compliance Active
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <header className="px-6 py-4 border-b border-slate-200 bg-slate-50">
          <h3 className="font-bold text-slate-800">Security Audit Log</h3>
        </header>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 font-medium">
              <tr>
                <th className="px-6 py-3 border-b border-slate-200">Timestamp</th>
                <th className="px-6 py-3 border-b border-slate-200">User</th>
                <th className="px-6 py-3 border-b border-slate-200">Action</th>
                <th className="px-6 py-3 border-b border-slate-200">Context</th>
                <th className="px-6 py-3 border-b border-slate-200">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {MOCK_LOGS.map(log => (
                <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 text-slate-500 font-mono text-xs">
                    {formatDateTime(log.timestamp)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <UserCircle size={14} className="text-slate-400" />
                      <div>
                        <p className="font-medium text-slate-900">{log.userId}</p>
                        <p className="text-[10px] text-slate-400">{log.userEmail}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "flex items-center gap-1 w-fit px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                      log.action === 'sign' ? "bg-green-50 text-green-700 border border-green-100" :
                      log.action === 'edit' ? "bg-blue-50 text-blue-700 border border-blue-100" :
                      "bg-slate-100 text-slate-600 border border-slate-200"
                    )}>
                      {log.action === 'view' && <Eye size={10} />}
                      {log.action === 'edit' && <FileEdit size={10} />}
                      {log.action}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-slate-700 capitalize">{log.entityType} <span className="text-slate-400 text-[10px] font-mono">#{log.entityId}</span></p>
                  </td>
                  <td className="px-6 py-4 text-slate-500 italic text-xs">
                    {log.details}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
