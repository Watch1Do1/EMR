import { Search, UserPlus, RotateCcw } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Patient } from '../types';
import { cn } from '../lib/utils';

const MOCK_PATIENTS: Patient[] = [
  { id: '1', firstName: 'Jane', lastName: 'Doe', dob: '1985-05-12', gender: 'female', mrn: 'MRN-12345' },
  { id: '2', firstName: 'John', lastName: 'Smith', dob: '1970-11-23', gender: 'male', mrn: 'MRN-67890' },
  { id: '3', firstName: 'Robert', lastName: 'Johnson', dob: '1992-02-28', gender: 'male', mrn: 'MRN-54321' },
];

export function PatientListView() {
  const [searchTerm, setSearchTerm] = useState('');
  const [resetState, setResetState] = useState<'idle' | 'resetting'>('idle');
  const navigate = useNavigate();

  const handleResetDemoData = () => {
    setResetState('resetting');
    
    // Clean all possible pre-visit, meds, and orders keys from localStorage
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (
        key.startsWith('previsit_') || 
        key.startsWith('meds_') || 
        key.startsWith('orders_') ||
        key.startsWith('screening_') ||
        key.startsWith('session_phase_') ||
        key.startsWith('consult_transcript_') ||
        key.startsWith('detected_orders_') ||
        key.startsWith('is_video_active_') ||
        key.startsWith('active_detections_') ||
        key.startsWith('billing_queries_')
      )) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(k => localStorage.removeItem(k));
    
    // Remove the demo reset lock so Jane Doe's default seeded state re-initializes on load
    localStorage.removeItem('demo_reset_active');

    setTimeout(() => {
      setResetState('idle');
      window.location.reload();
    }, 850);
  };

  const filteredPatients = MOCK_PATIENTS.filter(p => 
    `${p.firstName} ${p.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.mrn.includes(searchTerm)
  );

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Patients</h2>
          <p className="text-slate-500 mt-1">Manage and access patient records.</p>
        </div>
         <div className="flex items-center gap-3">
          <button 
            onClick={handleResetDemoData}
            disabled={resetState === 'resetting'}
            className={cn(
              "flex items-center gap-2 border text-sm px-4 py-2 rounded-lg font-medium transition-all shadow-sm disabled:opacity-55",
              resetState === 'idle' 
                ? "border-slate-300 bg-white text-slate-700 hover:bg-slate-50 active:scale-[0.98]" 
                : "border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed"
            )}
          >
            <RotateCcw 
              size={16} 
              className={cn(
                "text-slate-500",
                resetState === 'resetting' && "animate-spin text-slate-400"
              )} 
            />
            {resetState === 'idle' ? "Reset Test Data" : "Resetting..."}
          </button>
          <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-sm">
            <UserPlus size={18} />
            Add Patient
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center gap-3">
          <Search size={18} className="text-slate-400" />
          <input
            type="text"
            placeholder="Search by name or MRN..."
            className="bg-transparent border-none focus:ring-0 text-sm flex-1"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 font-medium">
              <tr>
                <th className="px-6 py-3 border-b border-slate-200">Patient Name</th>
                <th className="px-6 py-3 border-b border-slate-200">DOB</th>
                <th className="px-6 py-3 border-b border-slate-200">Gender</th>
                <th className="px-6 py-3 border-b border-slate-200">MRN</th>
                <th className="px-6 py-3 border-b border-slate-200 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPatients.map((patient) => (
                <tr 
                  key={patient.id} 
                  className="hover:bg-slate-50 cursor-pointer transition-colors"
                  onClick={() => navigate(`/patients/${patient.id}`)}
                >
                  <td className="px-6 py-4 font-semibold text-slate-900">
                    {patient.lastName}, {patient.firstName}
                  </td>
                  <td className="px-6 py-4 text-slate-500">{patient.dob}</td>
                  <td className="px-6 py-4 text-slate-500 capitalize">{patient.gender}</td>
                  <td className="px-6 py-4 text-slate-500 font-mono text-xs">{patient.mrn}</td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-blue-600 font-medium hover:underline">View Chart</button>
                  </td>
                </tr>
              ))}
              {filteredPatients.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500 italic">
                    No patients found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
