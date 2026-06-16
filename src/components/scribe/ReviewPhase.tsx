import { 
    CheckCircle, 
    ClipboardCopy, 
    Printer
  } from 'lucide-react';
  import { Patient } from '../../types';
  import { ScreeningMessage } from './types';
  
  export interface ReviewPhaseProps {
    patient: Patient;
    getCompiledUnifiedNote: () => string;
    onImportHpi: (text: string) => void;
    detectedOrders: Array<{
      id: string;
      type: 'lab' | 'imaging' | 'referral' | 'medication';
      name: string;
      details: string;
      status: 'detected' | 'approved' | 'declined';
      snippet: string;
    }>;
    setScreeningStep: (step: number) => void;
    setSessionPhase: (phase: 'rooming' | 'transition' | 'visit' | 'review') => void;
    setScreeningMessages: (msgs: ScreeningMessage[]) => void;
    isFollowUp: boolean;
  }
  
  function formatDate(dateStr: string) {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch (e) {
      return dateStr;
    }
  }
  
  export function ReviewPhase({
    patient,
    getCompiledUnifiedNote,
    onImportHpi,
    detectedOrders,
    setScreeningStep,
    setSessionPhase,
    setScreeningMessages,
    isFollowUp,
  }: ReviewPhaseProps) {
    return (
      <div className="flex-1 flex flex-col justify-between">
        
        <div className="space-y-4">
          <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className="text-emerald-600 shrink-0" size={18} />
              <div>
                <p className="text-xs font-bold text-emerald-800">Complete Chart Note Prepared!</p>
                <p className="text-[10px] text-emerald-600 mt-0.5">Aggregated pre-visit screening history, clinician dialogues, and biomechanical orthopedic signs.</p>
              </div>
            </div>
            
            <button 
              type="button"
              onClick={() => {
                // Trigger fully unified copy to EMR notes
                onImportHpi(getCompiledUnifiedNote());
              }}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-650 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-sm transition-colors cursor-pointer select-none"
            >
              <ClipboardCopy size={13} />
              Import Narrative to EMR
            </button>
          </div>
  
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-inner font-mono text-xs bg-slate-50 p-4 leading-normal text-slate-705 h-[360px] overflow-y-auto">
            <pre className="whitespace-pre-wrap font-sans">{getCompiledUnifiedNote()}</pre>
          </div>
  
          {/* Discharge Booklet & Printable Requisition Folder */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-sm no-print">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-605 flex items-center justify-center">
                  <Printer size={16} />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900">Patient Checkout & Requisitions Bundle</h4>
                  <p className="text-[11px] text-slate-550">Persistently captured items from this clinical encounter, prepared for physical printing.</p>
                </div>
              </div>
              
              <button 
                type="button"
                onClick={() => window.print()}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer select-none"
              >
                <Printer size={13} />
                Print All Patient Leaflets
              </button>
            </div>
  
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Prescriptions */}
              <div className="border border-slate-150 rounded-lg p-3.5 bg-slate-50/50 space-y-2">
                <div className="flex justify-between items-center mb-1 select-none">
                  <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider bg-amber-50 px-2 py-0.5 rounded border border-amber-100 font-mono">Prescription Pad</span>
                  <span className="text-xs font-bold text-slate-700">{detectedOrders.filter(o => o.type === 'medication' && o.status === 'approved').length} Active</span>
                </div>
                
                <div className="space-y-1.5 max-h-[110px] overflow-y-auto font-sans animate-feed">
                  {detectedOrders.filter(o => o.type === 'medication' && o.status === 'approved').map(med => (
                    <div key={med.id} className="text-xs bg-white border border-slate-200/80 p-2 rounded">
                      <p className="font-bold text-slate-900">{med.name}</p>
                      <p className="text-[10px] text-slate-500 italic mt-0.5">{med.details}</p>
                    </div>
                  ))}
                  {detectedOrders.filter(o => o.type === 'medication' && o.status === 'approved').length === 0 && (
                    <p className="text-[11px] text-slate-400 italic text-center py-2 select-none">No medications ordered in Scribe during this visit.</p>
                  )}
                </div>
              </div>
  
              {/* Labs, Studies, & Referrals Booklet */}
              <div className="border border-slate-150 rounded-lg p-3.5 bg-slate-50/50 space-y-2">
                <div className="flex justify-between items-center mb-1 select-none">
                  <span className="text-[10px] font-bold text-blue-850 uppercase tracking-wider bg-blue-50 px-2 py-0.5 rounded border border-blue-105 font-mono">Orders & Referrals Booklet</span>
                  <span className="text-xs font-bold text-slate-700">{detectedOrders.filter(o => o.type !== 'medication' && o.status === 'approved').length} Active</span>
                </div>
                
                <div className="space-y-1.5 max-h-[110px] overflow-y-auto font-sans animate-feed">
                  {detectedOrders.filter(o => o.type !== 'medication' && o.status === 'approved').map(ord => (
                    <div key={ord.id} className="text-xs bg-white border border-slate-200/80 p-2 rounded">
                      <p className="font-bold text-slate-900">{ord.name}</p>
                      <span className="text-[8px] uppercase tracking-tight text-slate-400 font-bold">{ord.type} check</span>
                    </div>
                  ))}
                  {detectedOrders.filter(o => o.type !== 'medication' && o.status === 'approved').length === 0 && (
                    <p className="text-[11px] text-slate-400 italic text-center py-2 select-none">No labs, diagnostic scans or referrals ordered in Scribe.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
  
          {/* Print Layout Overlay for physical print output */}
          <div className="hidden print:block fixed inset-0 bg-white z-[9999] p-10 font-sans text-stone-900">
            <div className="text-center pb-6 border-b-2 border-slate-900">
              <h2 className="text-3xl font-extrabold tracking-tight">PATIENT LEAFLET & CARE INSTRUCTIONS</h2>
              <p className="text-sm font-mono mt-1 text-slate-500">Date: {new Date().toLocaleDateString()} • Metropolitan Med-Center</p>
            </div>
  
            <div className="grid grid-cols-2 gap-4 py-4 text-xs border-b border-slate-300">
              <div>
                <p className="font-bold uppercase text-[10px] text-slate-400 select-none">PATIENT DEMOGRAPHICS</p>
                <p className="text-sm font-bold mt-1 text-slate-950">{patient.lastName}, {patient.firstName}</p>
                <p>DOB: {formatDate(patient.dob)} • MRN: {patient.mrn}</p>
              </div>
              <div>
                <p className="font-bold uppercase text-[10px] text-slate-400 select-none">ORDERING PROVIDER</p>
                <p className="text-sm font-bold mt-1 text-slate-950">Dr. John Smith, MD</p>
                <p>Clinic: Orthopedic Rehab Group</p>
              </div>
            </div>
  
            {/* Medications list printed block */}
            <div className="py-4 border-b border-slate-200 text-slate-800">
              <h3 className="font-bold text-sm text-slate-950 mb-2 uppercase tracking-wide">💊 ACTIVE PRESCRIPTIONS AUTHORIZED TODAY</h3>
              <table className="w-full text-xs text-left text-slate-800">
                <thead className="bg-slate-50 text-slate-500 font-bold">
                  <tr>
                    <th className="py-2 border-b border-slate-200">Medicine Name</th>
                    <th className="py-2 border-b border-slate-200">Instruction & Dosage Details</th>
                    <th className="py-2 border-b border-slate-200">Refill Authorization</th>
                  </tr>
                </thead>
                <tbody>
                  {detectedOrders.filter(o => o.type === 'medication' && o.status === 'approved').map(med => (
                    <tr key={med.id} className="border-b border-slate-100">
                      <td className="py-2.5 font-bold text-slate-950">{med.name}</td>
                      <td className="py-2.5">{med.details}</td>
                      <td className="py-2.5 font-mono">Refills: 2 (Authorized)</td>
                    </tr>
                  ))}
                  {detectedOrders.filter(o => o.type === 'medication' && o.status === 'approved').length === 0 && (
                    <tr>
                      <td colSpan={3} className="py-4 text-center text-slate-400 italic">No direct outpatient medications written during this session.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
  
            {/* Studies Ordered printed block */}
            <div className="py-4 text-slate-800">
              <h3 className="font-bold text-sm text-slate-950 mb-2 uppercase tracking-wide font-sans">🔬 DIAGNOSTIC IMAGING, LABS & CONSULTING REFERRALS</h3>
              <table className="w-full text-xs text-left text-slate-800">
                <thead className="bg-slate-50 text-slate-500 font-bold">
                  <tr>
                    <th className="py-2 border-b border-slate-200">Clinical Order</th>
                    <th className="py-2 border-b border-slate-200">Type Category</th>
                    <th className="py-2 border-b border-slate-200">Indications / ICD-10 Code</th>
                  </tr>
                </thead>
                <tbody>
                  {detectedOrders.filter(o => o.type !== 'medication' && o.status === 'approved').map(ord => (
                    <tr key={ord.id} className="border-b border-slate-100">
                      <td className="py-2.5 font-bold text-slate-950">{ord.name}</td>
                      <td className="py-2.5 uppercase text-slate-500 text-[10px] font-mono">{ord.type}</td>
                      <td className="py-2.5 italic text-slate-600">{ord.details}</td>
                    </tr>
                  ))}
                  {detectedOrders.filter(o => o.type !== 'medication' && o.status === 'approved').length === 0 && (
                    <tr>
                      <td colSpan={3} className="py-4 text-center text-slate-400 italic">No secondary diagnostic testing orders completed during this session.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
  
            <div className="pt-20 text-xs flex justify-between items-end">
              <div>
                <div className="border-b border-slate-900 w-52 h-6" />
                <p className="mt-1 font-semibold text-slate-600">Clinician Signature Verification</p>
              </div>
              <div>
                <p className="text-right text-slate-400 text-[9px] font-mono">ENCOUNTER CODE: EMC-6512-AMB</p>
              </div>
            </div>
          </div>
        </div>
  
        <div className="mt-4 pt-4 border-t border-slate-150 flex justify-between items-center select-none bg-white">
          <button 
            type="button"
            onClick={() => {
              // Reset session sequence
              setScreeningStep(0);
              setSessionPhase('rooming');
              setScreeningMessages([
                {
                  sender: 'ai',
                  text: isFollowUp 
                    ? `Welcome back, ${patient.firstName}! It is so wonderful to see you again. I am Nurse Carey, and I'll be checking you in today. What is the main reason for your visit today?`
                    : `Hello there, ${patient.firstName}. I am Nurse Carey, and I'm so glad to assist with your check-in today. We want to take excellent care of you. What is the main reason for your visit today?`,
                  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                }
              ]);
            }}
            className="px-4 py-2 hover:bg-slate-100 text-slate-650 border border-slate-200 rounded-lg text-xs font-bold transition-colors cursor-pointer"
          >
            Restart Scribe Flow
          </button>
          
          <p className="text-[10px] text-slate-400">Locked with timestamp compliance. Secured with narrative-first integrity.</p>
        </div>
  
      </div>
    );
  }
  