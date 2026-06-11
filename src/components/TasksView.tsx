import { CheckCircle2, History, Info, FlaskConical, AlertCircle } from 'lucide-react';
import { useState } from 'react';
import { ClinicalOrder, OrderStatus, OrderType } from '../types';
import { cn, formatDateTime } from '../lib/utils';

const MOCK_ORDERS: ClinicalOrder[] = [
  {
    id: 'o1',
    patientId: '1',
    type: OrderType.LAB,
    description: 'Comprehensive Metabolic Panel',
    date: '2023-10-10T14:30:00Z',
    providerId: 'dr_smith',
    status: OrderStatus.RESULTED,
    result: {
      id: 'r1',
      orderId: 'o1',
      date: '2023-10-10T16:45:00Z',
      value: 'Glucose 115 (High), Creatinine 1.1',
      abnormal: true,
      flagged: true,
      reviewed: false,
    }
  },
  {
    id: 'o2',
    patientId: '1',
    type: OrderType.IMAGING,
    description: 'Chest X-Ray PA & Lateral',
    date: '2023-10-11T09:15:00Z',
    providerId: 'dr_smith',
    status: OrderStatus.ORDERED,
  },
];

export function TasksView() {
  const [filter, setFilter] = useState<'all' | 'pending' | 'abnormal'>('pending');

  const pendingResults = MOCK_ORDERS.filter(o => o.status === OrderStatus.RESULTED && !o.result?.reviewed);

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Clinical Tasks</h2>
          <p className="text-slate-500 mt-1">Review results and track pending orders.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase mb-1">Results to Review</p>
          <p className="text-2xl font-bold text-slate-900">{pendingResults.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase mb-1">Pending Orders</p>
          <p className="text-2xl font-bold text-slate-900">4</p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <header className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <h3 className="font-bold text-slate-800">Results Inbasket</h3>
          <div className="flex gap-2">
            <button 
              onClick={() => setFilter('pending')}
              className={cn("px-3 py-1 text-xs font-bold rounded-full border transition-colors", filter === 'pending' ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-white text-slate-500 border-slate-200")}
            >
              Pending
            </button>
            <button 
              onClick={() => setFilter('abnormal')}
              className={cn("px-3 py-1 text-xs font-bold rounded-full border transition-colors", filter === 'abnormal' ? "bg-red-50 text-red-700 border-red-200" : "bg-white text-slate-500 border-slate-200")}
            >
              Abnormal
            </button>
          </div>
        </header>

        <div className="divide-y divide-slate-100">
          {pendingResults.map(order => (
            <div key={order.id} className="p-6 hover:bg-slate-50 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex gap-4">
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                    order.result?.abnormal ? "bg-red-50 text-red-600" : "bg-blue-50 text-blue-600"
                  )}>
                    <FlaskConical size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">{order.description}</h4>
                    <p className="text-sm text-slate-500">Patient: Jane Doe (MRN-12345)</p>
                    <div className="mt-2 text-sm text-slate-700 font-medium bg-slate-100 p-2 rounded border border-slate-200">
                      {order.result?.value}
                    </div>
                    <div className="mt-3 flex items-center gap-4 text-xs text-slate-400">
                      <span className="flex items-center gap-1"><History size={12} /> Resulted {formatDateTime(order.result!.date)}</span>
                      {order.result?.abnormal && <span className="flex items-center gap-1 text-red-600 font-bold"><AlertCircle size={12} /> CRITICAL VALUE</span>}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="flex items-center gap-2 px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-white hover:text-slate-900 shadow-sm transition-colors">
                    <Info size={14} /> Details
                  </button>
                  <button className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 shadow-sm transition-colors">
                    <CheckCircle2 size={14} /> Acknowledge
                  </button>
                </div>
              </div>
            </div>
          ))}
          {pendingResults.length === 0 && (
            <div className="p-12 text-center text-slate-500">
              <CheckCircle2 size={48} className="mx-auto mb-4 text-green-500 opacity-20" />
              <p className="font-medium">All caught up! No results pending review.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
