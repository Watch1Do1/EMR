/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AdminView } from './components/AdminView';
import { PatientChartView } from './components/PatientChartView';
import { PatientListView } from './components/PatientListView';
import { ScheduleView } from './components/ScheduleView';
import { Sidebar } from './components/Sidebar';
import { TasksView } from './components/TasksView';

function Dashboard() {
  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h2 className="text-3xl font-bold tracking-tight text-slate-900">Dashboard</h2>
      <p className="text-slate-500 mt-1">Daily overview and clinic statistics.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <StatCard title="Today's Appointments" value="12" subValue="3 completed" />
        <StatCard title="Unsigned Notes" value="4" subValue="2 urgent" />
        <StatCard title="Pending Lab Results" value="18" subValue="2 abnormal" />
      </div>
      
      <div className="mt-10 bg-white border border-slate-200 rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold mb-4">Upcoming Schedule</h3>
        <div className="space-y-4 text-sm">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex items-center gap-4 py-3 border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors cursor-pointer px-2 rounded-lg">
              <span className="text-slate-500 font-medium">09:00 AM</span>
              <div className="flex-1">
                <p className="font-semibold text-slate-900">Jane Doe</p>
                <p className="text-slate-500">Established Follow-up (Hypertension)</p>
              </div>
              <span className="px-2 py-1 bg-green-50 text-green-700 rounded-full text-xs font-semibold">Arrived</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, subValue }: { title: string; value: string; subValue: string }) {
  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{title}</p>
      <p className="text-3xl font-bold mt-2 text-slate-900">{value}</p>
      <p className="text-xs text-slate-400 mt-1">{subValue}</p>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex min-h-screen bg-slate-50 font-sans text-slate-900">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/patients" element={<PatientListView />} />
            <Route path="/patients/:id" element={<PatientChartView />} />
            <Route path="/schedule" element={<ScheduleView />} />
            <Route path="/tasks" element={<TasksView />} />
            <Route path="/admin" element={<AdminView />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
