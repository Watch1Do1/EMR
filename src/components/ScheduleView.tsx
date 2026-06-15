import { ChevronLeft, ChevronRight, Plus, Sparkles, Check, RotateCcw } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Appointment } from '../types';
import { cn } from '../lib/utils';
import { useNavigate } from 'react-router-dom';

const MOCK_APPOINTMENTS: Appointment[] = [
  { id: '1', patientId: '1', providerId: 'dr_smith', date: '2023-10-13', time: '09:00', duration: 30, type: 'Follow-up', status: 'checked-in', reasonForVisit: 'Hypertension management' },
  { id: '2', patientId: '2', providerId: 'dr_smith', date: '2023-10-13', time: '09:45', duration: 15, type: 'Quick Check', status: 'scheduled', reasonForVisit: 'Medication refill' },
  { id: '3', patientId: '3', providerId: 'dr_smith', date: '2023-10-13', time: '10:30', duration: 45, type: 'Initial Consult', status: 'scheduled', reasonForVisit: 'Right knee instability' },
];

export function ScheduleView() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const navigate = useNavigate();
  const [updateCounter, setUpdateCounter] = useState(0);
  const [resetState, setResetState] = useState<'idle' | 'confirming' | 'resetting'>('idle');

  const handleResetDemoData = (e: React.MouseEvent) => {
    e.stopPropagation();
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
      setUpdateCounter(prev => prev + 1);
      window.location.reload();
    }, 850);
  };

  useEffect(() => {
    // Seed Jane Doe (Patient 1) as completed by *default* only if the dashboard hasn't been explicitly cleared/reset
    if (!localStorage.getItem('demo_reset_active') && !localStorage.getItem('previsit_completed_1')) {
      localStorage.setItem('previsit_completed_1', 'true');
      localStorage.setItem('previsit_summary_1', "Follow-up Visit. Reason for visit: \"Hypertension management and routine prescription review\". PRIOR CONDITION CHANGES: \"Medical status is stable. Home BP logs checked (average 128/82 mmHg). No new symptoms. Confirmed continuing present active medications (Lisinopril 10mg & Metformin 500mg) and allergies (Penicillin hives reaction) without issues.\"");
      localStorage.setItem('previsit_type_1', 'Follow-up');
    }

    const handleStorageUpdate = () => {
      setUpdateCounter(prev => prev + 1);
    };

    window.addEventListener('storage', handleStorageUpdate);
    return () => window.removeEventListener('storage', handleStorageUpdate);
  }, []);

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Schedule</h2>
          <p className="text-slate-500 mt-1">Manage appointments and provider availability.</p>
        </div>
        <div className="flex items-center gap-4">
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
          <div className="flex items-center bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
            <button className="p-2 hover:bg-slate-50 border-r border-slate-200">
              <ChevronLeft size={18} />
            </button>
            <div className="px-4 py-2 font-bold text-sm text-slate-700">
              {currentDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </div>
            <button className="p-2 hover:bg-slate-50 border-l border-slate-200">
              <ChevronRight size={18} />
            </button>
          </div>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 shadow-sm transition-colors flex items-center gap-2">
            <Plus size={16} />
            New Appointment
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden text-sm">
        <div className="grid grid-cols-[100px_1fr] bg-slate-50 border-b border-slate-200 font-bold text-slate-500 uppercase tracking-wider text-[10px]">
          <div className="px-6 py-3 border-r border-slate-200">Time</div>
          <div className="px-6 py-3">Patient & Details</div>
        </div>

        <div className="divide-y divide-slate-100">
          {MOCK_APPOINTMENTS.map((apt) => {
            const isCompleted = localStorage.getItem(`previsit_completed_${apt.patientId}`) === 'true';
            const summaryText = localStorage.getItem(`previsit_summary_${apt.patientId}`);
            const visType = localStorage.getItem(`previsit_type_${apt.patientId}`) || apt.type;

            return (
              <div 
                key={apt.id} 
                className="grid grid-cols-[100px_1fr] hover:bg-slate-50 transition-colors cursor-pointer min-h-[90px]"
                onClick={() => navigate(`/patients/${apt.patientId}`)}
              >
                <div className="px-6 py-4 border-r border-slate-100 flex flex-col justify-center">
                  <p className="font-bold text-slate-900">{apt.time}</p>
                  <p className="text-[10px] text-slate-400 font-medium">{apt.duration} min</p>
                </div>
                <div className="px-6 py-4 flex flex-col justify-center gap-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-slate-900 text-base flex items-center gap-2">
                        Patient {apt.patientId === '1' ? 'Jane Doe' : apt.patientId === '2' ? 'John Smith' : 'Robert Johnson'}
                        {isCompleted && (
                          <span className="flex items-center gap-1 bg-indigo-100 text-indigo-700 text-[9px] font-bold px-2 py-0.5 rounded-full border border-indigo-200 uppercase tracking-tight select-none">
                            <Sparkles size={10} className="text-indigo-600 animate-pulse" />
                            AI Intake Complete
                          </span>
                        )}
                      </h4>
                      <p className="text-slate-500">{visType} • {apt.reasonForVisit}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={cn(
                        "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border",
                        apt.status === 'checked-in' ? "bg-green-50 text-green-700 border-green-200" : "bg-slate-100 text-slate-600 border-slate-200"
                      )}>
                        {apt.status}
                      </span>
                      <ChevronRight size={18} className="text-slate-300" />
                    </div>
                  </div>

                  {isCompleted && summaryText && (
                    <div className="bg-indigo-50/50 border border-indigo-100 rounded-lg p-2.5 text-slate-850 mt-1">
                      <div className="flex items-center gap-1 font-extrabold text-[9px] text-indigo-700 uppercase tracking-wide mb-1 select-none">
                        <Sparkles size={11} />
                        Completed Pre-visit Scribe Intake Digest
                      </div>
                      <p className="text-xs text-slate-650 leading-relaxed font-sans">
                        <span className="font-bold text-slate-800">Rooming Intake:</span> {summaryText}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          
          <div className="grid grid-cols-[100px_1fr] h-20 opacity-30">
            <div className="px-6 py-4 border-r border-slate-100 flex flex-col justify-center">
              <p className="font-bold text-slate-400 text-xs italic">Upcoming</p>
            </div>
            <div className="px-6 py-4 border-dashed border-2 border-slate-100 m-2 rounded-lg flex items-center justify-center text-slate-400 font-medium">
              Available Slot
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
