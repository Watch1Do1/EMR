import { Search, UserPlus, RotateCcw } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Patient } from '../types';
import { cn } from '../lib/utils';
import { getPatients, clearAllDataStore } from '../lib/dataStore';

export function PatientListView() {
  const [patients, setPatients] = useState<Patient[]>(() => getPatients());

  useEffect(() => {
    const handleUpdate = () => {
      setPatients(getPatients());
    };
    window.addEventListener('storage', handleUpdate);
    return () => window.removeEventListener('storage', handleUpdate);
  }, []);
  const [searchTerm, setSearchTerm] = useState('');
  const [genderFilter, setGenderFilter] = useState<'all' | 'female' | 'male'>('all');
  const [ageFilter, setAgeFilter] = useState<'all' | 'under35' | 'over35'>('all');
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

  const filteredPatients = patients.filter(p => {
    const matchesSearch = `${p.firstName} ${p.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.mrn.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGender = genderFilter === 'all' || p.gender === genderFilter;
    
    let matchesAge = true;
    if (p.dob) {
      const birthYear = new Date(p.dob).getFullYear();
      const age = new Date().getFullYear() - birthYear;
      if (ageFilter === 'under35') matchesAge = age < 35;
      if (ageFilter === 'over35') matchesAge = age >= 35;
    }
    
    return matchesSearch && matchesGender && matchesAge;
  });

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
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-lg px-3 py-1.5 flex-1 shadow-2xs">
            <Search size={16} className="text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="Search by name or MRN..."
              className="bg-transparent border-none text-sm w-full focus:outline-none focus:ring-0 p-0"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Gender:</span>
              <select
                id="filter_gender"
                value={genderFilter}
                onChange={(e) => setGenderFilter(e.target.value as any)}
                className="bg-white border border-slate-200 rounded-lg py-1 px-2.5 text-xs font-semibold text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-xs"
              >
                <option value="all">All Genders</option>
                <option value="female">Female</option>
                <option value="male">Male</option>
              </select>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Age Group:</span>
              <select
                id="filter_age"
                value={ageFilter}
                onChange={(e) => setAgeFilter(e.target.value as any)}
                className="bg-white border border-slate-200 rounded-lg py-1 px-2.5 text-xs font-semibold text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-xs"
              >
                <option value="all">All Ages</option>
                <option value="under35">Under 35</option>
                <option value="over35">35 & Older</option>
              </select>
            </div>
          </div>
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
