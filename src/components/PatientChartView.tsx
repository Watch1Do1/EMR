import { 
  Activity, 
  ChevronRight, 
  Clock, 
  FileText, 
  FlaskConical, 
  History, 
  Layout, 
  Pill, 
  Plus, 
  Printer, 
  ShieldAlert, 
  Sparkles,
  User 
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { cn, formatDate } from '../lib/utils';
import { NoteType, Patient, ClinicalOrder, OrderType, OrderStatus, Medication } from '../types';
import { NoteEditor } from './NoteEditor';
import { ScribeCoPilot } from './ScribeCoPilot';
import { getPatientById, getVitals } from '../lib/dataStore';

const MOCK_PATIENTS: Record<string, Patient> = {
  '1': { 
    id: '1', 
    firstName: 'Jane', 
    lastName: 'Doe', 
    dob: '1985-05-12', 
    gender: 'female', 
    mrn: 'MRN-12345',
    problems: [
      { id: 'p1', code: 'I10', description: 'Essential hypertension', onsetDate: '2020-01-15', status: 'active' },
      { id: 'p2', code: 'E11.9', description: 'Type 2 diabetes mellitus without complications', onsetDate: '2021-06-20', status: 'active' }
    ],
    allergies: [
      { id: 'a1', substance: 'Penicillin', reaction: 'Hives', severity: 'moderate' }
    ],
    activeMeds: [
      { id: 'm1', name: 'Lisinopril', dosage: '10mg', route: 'Oral', frequency: 'Daily', prescribedBy: 'Dr. John Smith', startDate: '2020-01-20', status: 'active' },
      { id: 'm2', name: 'Metformin', dosage: '500mg', route: 'Oral', frequency: 'Twice daily', prescribedBy: 'Dr. John Smith', startDate: '2021-06-25', status: 'active' }
    ]
  },
  '2': { 
    id: '2', 
    firstName: 'John', 
    lastName: 'Smith', 
    dob: '1970-11-23', 
    gender: 'male', 
    mrn: 'MRN-67890',
    problems: [
      { id: 'p3', code: 'M25.561', description: 'Pain in right knee', onsetDate: '2023-05-10', status: 'active' },
      { id: 'p4', code: 'E78.2', description: 'Mixed hyperlipidemia', onsetDate: '2019-11-04', status: 'active' }
    ],
    allergies: [
      { id: 'a2', substance: 'Sulfa drugs', reaction: 'Skin rash', severity: 'mild' }
    ],
    activeMeds: [
      { id: 'm3', name: 'Lipitor', dosage: '20mg', route: 'Oral', frequency: 'At bedtime', prescribedBy: 'Dr. John Smith', startDate: '2019-11-10', status: 'active' }
    ]
  },
  '3': { 
    id: '3', 
    firstName: 'Robert', 
    lastName: 'Johnson', 
    dob: '1992-02-28', 
    gender: 'male', 
    mrn: 'MRN-54321',
    problems: [
      { id: 'p5', code: 'M25.361', description: 'Instability, right knee', onsetDate: '2023-10-01', status: 'active' }
    ],
    allergies: [],
    activeMeds: []
  }
};

type Tab = 'summary' | 'notes' | 'meds' | 'labs' | 'documents' | 'scribe';

export function PatientChartView() {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<Tab>('summary');
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [noteDraftContent, setNoteDraftContent] = useState('');
  const patient = getPatientById(id || '') || MOCK_PATIENTS[id || ''];

  const [activeMeds, setActiveMeds] = useState<Medication[]>(() => {
    if (!patient) return [];
    const saved = localStorage.getItem(`meds_${id}`);
    return saved ? JSON.parse(saved) : (patient.activeMeds || []);
  });

  const [orders, setOrders] = useState<ClinicalOrder[]>(() => {
    if (!patient) return [];
    const saved = localStorage.getItem(`orders_${id}`);
    if (saved) return JSON.parse(saved);
    return [
      {
        id: 'o1',
        patientId: id || '1',
        type: OrderType.LAB,
        description: 'Comprehensive Metabolic Panel (CMP)',
        date: '2023-10-10',
        providerId: 'dr_john_smith',
        status: OrderStatus.RESULTED,
      },
      {
        id: 'o2',
        patientId: id || '1',
        type: OrderType.LAB,
        description: 'Hemoglobin A1c',
        date: '2023-10-10',
        providerId: 'dr_john_smith',
        status: OrderStatus.RESULTED,
      }
    ];
  });

  useEffect(() => {
    if (id) {
      localStorage.setItem(`meds_${id}`, JSON.stringify(activeMeds));
    }
  }, [activeMeds, id]);

  useEffect(() => {
    if (id) {
      localStorage.setItem(`orders_${id}`, JSON.stringify(orders));
    }
  }, [orders, id]);

  if (!patient) {
    return <div className="p-8">Patient not found</div>;
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Patient Banner */}
      <header className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
              <User size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                {patient.lastName}, {patient.firstName}
              </h2>
              <div className="flex items-center gap-3 text-xs font-medium text-slate-500 mt-0.5">
                <span>DOB: {formatDate(patient.dob)}</span>
                <span className="w-1 h-1 rounded-full bg-slate-300" />
                <span className="capitalize">{patient.gender}</span>
                <span className="w-1 h-1 rounded-full bg-slate-300" />
                <span>MRN: {patient.mrn}</span>
              </div>
            </div>
          </div>
          
          <div className="h-10 w-px bg-slate-200" />
          
          <div className="flex flex-col gap-1">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Allergies</span>
            <div className="flex gap-2">
              {patient.allergies?.map(a => (
                <span key={a.id} className="bg-red-50 text-red-700 text-[10px] font-bold px-1.5 py-0.5 rounded border border-red-100 uppercase">
                  {a.substance} ({a.reaction})
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 no-print">
          <button 
            onClick={() => window.print()}
            className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600"
          >
            <Printer size={18} />
          </button>
          <button 
            onClick={() => {
              setActiveTab('notes');
              setIsEditingNote(true);
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 shadow-sm transition-colors"
          >
            New Encounter
          </button>
        </div>
      </header>

      {/* Tab Navigation */}
      <nav className="bg-white border-b border-slate-200 px-8 flex items-center gap-8 no-print">
        <TabButton icon={Layout} label="Summary" active={activeTab === 'summary'} onClick={() => { setActiveTab('summary'); setIsEditingNote(false); }} />
        <TabButton icon={Sparkles} label="AI Scribe Co-Pilot" active={activeTab === 'scribe'} onClick={() => { setActiveTab('scribe'); setIsEditingNote(false); }} />
        <TabButton icon={FileText} label="Notes" active={activeTab === 'notes'} onClick={() => setActiveTab('notes')} />
        <TabButton icon={Pill} label="Medications" active={activeTab === 'meds'} onClick={() => { setActiveTab('meds'); setIsEditingNote(false); }} />
        <TabButton icon={FlaskConical} label="Labs & Orders" active={activeTab === 'labs'} onClick={() => { setActiveTab('labs'); setIsEditingNote(false); }} />
        <TabButton icon={Clock} label="Timeline" active={activeTab === 'documents'} onClick={() => { setActiveTab('documents'); setIsEditingNote(false); }} />
      </nav>

      {/* Main Chart Area */}
      <div className="flex-1 overflow-auto bg-slate-50">
        <div className="max-w-7xl mx-auto p-8">
          {activeTab === 'summary' && !isEditingNote && <SummaryView patient={patient} activeMeds={activeMeds} />}
          {activeTab === 'meds' && !isEditingNote && <MedsView patient={patient} meds={activeMeds} setMeds={setActiveMeds} />}
          {activeTab === 'labs' && !isEditingNote && <LabsView patient={patient} orders={orders} setOrders={setOrders} />}
          {activeTab === 'scribe' && !isEditingNote && (
            <ScribeCoPilot 
              key={patient.id}
              patient={patient}
              onImportHpi={(hpiText) => {
                setNoteDraftContent(prev => prev ? prev + '\n\n' + hpiText : hpiText);
                setActiveTab('notes');
                setIsEditingNote(true);
              }}
              onImportExam={(examText) => {
                setNoteDraftContent(prev => prev ? prev + '\n\n' + examText : examText);
                setActiveTab('notes');
                setIsEditingNote(true);
              }}
              onAddMedication={(newMed) => {
                setActiveMeds(prev => [newMed, ...prev]);
              }}
              onAddOrder={(newOrder) => {
                setOrders(prev => [newOrder, ...prev]);
              }}
              activeMeds={activeMeds}
              orders={orders}
            />
          )}
          {activeTab === 'notes' && !isEditingNote && (
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-slate-800">Clinical Notes</h3>
                <button 
                  onClick={() => setIsEditingNote(true)}
                  className="flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-700 bg-white px-4 py-2 rounded-lg border border-blue-100 shadow-sm"
                >
                  <Plus size={16} />
                  New Note
                </button>
              </div>
              <ActivityItem 
                type="note" 
                title="Office Visit - Follow-up" 
                subtitle="Oct 12, 2023 • Dr. John Smith"
                content="Patient returns for follow-up of HTN and DM2. Currently stable on Lisinopril..."
              />
              <ActivityItem 
                type="note" 
                title="Initial Consultation" 
                subtitle="Jun 20, 2021 • Dr. John Smith"
                content="New patient referred for management of hyperglycemia..."
              />
            </div>
          )}
          {isEditingNote && (
            <NoteEditor 
              type={NoteType.FOLLOW_UP}
              initialContent={noteDraftContent}
              onSave={(content) => {
                console.log('Saved note:', content);
                setNoteDraftContent('');
                setIsEditingNote(false);
              }}
              onCancel={() => {
                setIsEditingNote(false);
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function TabButton({ icon: Icon, label, active, onClick }: { icon: any, label: string, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "py-4 px-1 flex items-center gap-2 text-sm font-medium border-b-2 transition-colors",
        active 
          ? "border-blue-600 text-blue-700" 
          : "border-transparent text-slate-500 hover:text-slate-800"
      )}
    >
      <Icon size={16} />
      {label}
    </button>
  );
}

function SummaryView({ patient, activeMeds }: { patient: Patient, activeMeds: Medication[] }) {
  const maVitals = getVitals(patient.id);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Column 1: Problems & Allergies */}
      <div className="lg:col-span-1 space-y-6">
        <Section title="Problem List" icon={ShieldAlert}>
          <div className="divide-y divide-slate-100">
            {patient.problems?.map(p => (
              <div key={p.id} className="py-2.5">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-slate-900">{p.description}</p>
                  <span className="text-[10px] font-mono text-slate-400">{p.code}</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-0.5">Diagnosed: {formatDate(p.onsetDate)}</p>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Active Vitals" icon={Activity}>
          {maVitals ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <VitalCard label="BP" value={maVitals.bloodPressure} unit="mmHg" />
                <VitalCard label="Pulse" value={maVitals.heartRate} unit="bpm" />
                <VitalCard label="Temp" value={maVitals.temperature} unit="°F" />
                <VitalCard label="Weight" value={maVitals.weight} unit="lbs" />
                <VitalCard label="SpO₂" value={maVitals.oxygenSat} unit="%" />
                <VitalCard label="Resp" value={maVitals.respiratoryRate} unit="rpm" />
              </div>
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[10px] text-slate-500">
                <p className="font-semibold text-slate-700">Recorded by:</p>
                <p>{maVitals.recordedBy} on {new Date(maVitals.recordedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <VitalCard label="BP" value="132/84" unit="mmHg" trend="up" />
                <VitalCard label="Pulse" value="72" unit="bpm" />
                <VitalCard label="Temp" value="98.6" unit="°F" />
                <VitalCard label="Weight" value="165" unit="lbs" />
              </div>
              <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-[10px] text-amber-800">
                ⚠️ <span className="font-semibold">Staff Note:</span> Awaiting newer clinical intake from Back Office / MA. Showing clinic baseline.
              </div>
            </div>
          )}
        </Section>
      </div>

      {/* Column 2: Medications & Orders */}
      <div className="lg:col-span-2 space-y-6">
        <Section title="Active Medications" icon={Pill}>
          <div className="divide-y divide-slate-100">
            {activeMeds.filter(m => m.status === 'active').map(m => (
              <div key={m.id} className="py-3 flex items-center justify-between hover:bg-slate-50 px-2 rounded-lg transition-colors">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{m.name} {m.dosage}</p>
                  <p className="text-xs text-slate-500">{m.frequency} via {m.route} • Started {formatDate(m.startDate)}</p>
                </div>
                <ChevronRight size={16} className="text-slate-300" />
              </div>
            ))}
            {activeMeds.filter(m => m.status === 'active').length === 0 && (
              <p className="text-xs text-slate-400 py-4 italic text-center">No active medications recorded.</p>
            )}
          </div>
        </Section>

        <Section title="Recent Activity" icon={History}>
          <div className="space-y-4">
            <ActivityItem 
              type="note" 
              title="Follow-up Visit Note" 
              subtitle="Dr. John Smith • Oct 12, 2023"
              content="Patient's hypertension is stable on Lisinopril. Weight counseling provided..."
            />
            <ActivityItem 
              type="lab" 
              title="Comprehensive Metabolic Panel" 
              subtitle="Resulted • Oct 10, 2023"
              status="abnormal"
            />
          </div>
        </Section>
      </div>
    </div>
  );
}

function MedsView({ 
  patient, 
  meds, 
  setMeds 
}: { 
  patient: Patient; 
  meds: Medication[]; 
  setMeds: React.Dispatch<React.SetStateAction<Medication[]>>;
}) {
  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDosage, setNewDosage] = useState('');
  const [newFreq, setNewFreq] = useState('Daily');
  const [newRoute, setNewRoute] = useState('Oral');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const newMed: Medication = {
      id: `m-${Date.now()}`,
      name: newName,
      dosage: newDosage || '1 tablet',
      route: newRoute,
      frequency: newFreq,
      startDate: new Date().toISOString().split('T')[0],
      prescribedBy: 'Dr. John Smith, MD',
      status: 'active'
    };

    setMeds(prev => [newMed, ...prev]);
    setNewName('');
    setNewDosage('');
    setShowForm(false);
  };

  const toggleDiscontinue = (id: string) => {
    setMeds(prev => prev.map(m => {
      if (m.id === id) {
        return { ...m, status: m.status === 'active' ? 'discontinued' : 'active' };
      }
      return m;
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-bold text-slate-800">Current Medications</h3>
          <p className="text-xs text-slate-500 mt-1">Durable patient drug record, synchronized with AI Ambient Scribe activity.</p>
        </div>
        <button 
          onClick={() => setShowForm(prev => !prev)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 shadow-sm transition-colors cursor-pointer"
        >
          <Plus size={16} />
          {showForm ? 'Cancel Form' : 'Prescribe New'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white border border-blue-100 p-5 rounded-xl shadow-sm space-y-4 max-w-lg">
          <h4 className="font-bold text-sm text-blue-900 flex items-center gap-1.5 pb-2 border-b border-slate-100 select-none">
            <Pill size={16} />
            Write Direct E-Prescription
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-tight mb-1">Medication Name</label>
              <input 
                type="text" 
                placeholder="e.g. Celebrex or Gabapentin" 
                value={newName} 
                onChange={e => setNewName(e.target.value)}
                className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 outline-none p-2.5 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500/20" 
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-tight mb-1">Dosage / Strength</label>
              <input 
                type="text" 
                placeholder="e.g. 200mg or 10mg" 
                value={newDosage} 
                onChange={e => setNewDosage(e.target.value)}
                className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 outline-none p-2.5 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500/20" 
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-tight mb-1">Administration Frequency</label>
              <select 
                value={newFreq} 
                onChange={e => setNewFreq(e.target.value)}
                className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 outline-none p-2.5 rounded-lg focus:bg-white focus:ring-2"
              >
                <option>Daily</option>
                <option>Twice daily</option>
                <option>Three times daily</option>
                <option>Every 6 hours as needed</option>
                <option>Once weekly</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-tight mb-1">Route</label>
              <select 
                value={newRoute} 
                onChange={e => setNewRoute(e.target.value)}
                className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 outline-none p-2.5 rounded-lg focus:bg-white focus:ring-2"
              >
                <option>Oral</option>
                <option>Subcutaneous</option>
                <option>Intravenous</option>
                <option>Topical</option>
                <option>Inhalation</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button 
              type="button" 
              onClick={() => setShowForm(false)} 
              className="px-3.5 py-2 text-xs font-bold text-slate-500 border border-slate-200 hover:bg-slate-50 rounded-lg transition"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2 rounded-lg transition"
            >
              Sign & Save Prescription
            </button>
          </div>
        </form>
      )}

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500 font-medium select-none">
            <tr>
              <th className="px-6 py-3 border-b border-slate-200 text-xs uppercase tracking-wider">Medication</th>
              <th className="px-6 py-3 border-b border-slate-200 text-xs uppercase tracking-wider">Dosage/Freq</th>
              <th className="px-6 py-3 border-b border-slate-200 text-xs uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 border-b border-slate-200 text-xs uppercase tracking-wider">Prescriber</th>
              <th className="px-6 py-3 border-b border-slate-200 text-right text-xs uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {meds.map(med => (
              <tr key={med.id} className="hover:bg-slate-50/75 transition-colors">
                <td className="px-6 py-4">
                  <p className="font-bold text-slate-950 text-sm">{med.name}</p>
                  <p className="text-[10px] text-slate-400 uppercase tracking-tight mt-0.5">{med.route}</p>
                </td>
                <td className="px-6 py-4 text-slate-600 font-medium">
                  {med.dosage} • {med.frequency}
                </td>
                <td className="px-6 py-4">
                  <span className={cn(
                    "px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border",
                    med.status === 'active' 
                      ? "bg-green-50 text-green-700 border-green-100" 
                      : med.status === 'discontinued'
                        ? "bg-red-50 text-red-700 border-red-100"
                        : "bg-amber-50 text-amber-700 border-amber-100"
                  )}>
                    {med.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-slate-500 text-xs">
                  {med.prescribedBy}
                  <p className="mt-0.5 font-mono text-[10px] text-slate-400">Started {formatDate(med.startDate)}</p>
                </td>
                <td className="px-6 py-4 text-right">
                  <button 
                    onClick={() => toggleDiscontinue(med.id)}
                    className={cn(
                      "font-bold text-xs hover:underline transition-colors",
                      med.status === 'active' ? "text-red-650 hover:text-red-700" : "text-green-650 hover:text-green-700"
                    )}
                  >
                    {med.status === 'active' ? "Discontinue" : "Re-activate"}
                  </button>
                </td>
              </tr>
            ))}
            {meds.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic">
                  No active or past medications found. Use the Scribe Co-Pilot or "Prescribe New" button to add medicines.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function LabsView({ 
  patient, 
  orders, 
  setOrders 
}: { 
  patient: Patient; 
  orders: ClinicalOrder[]; 
  setOrders: React.Dispatch<React.SetStateAction<ClinicalOrder[]>>;
}) {
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [selectedType, setSelectedType] = useState<OrderType>(OrderType.LAB);
  const [description, setDescription] = useState('');
  const [printingOrderId, setPrintingOrderId] = useState<string | null>(null);

  const handleCreateOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    const newOrder: ClinicalOrder = {
      id: `o-${Date.now()}`,
      patientId: patient.id,
      type: selectedType,
      description: description,
      date: new Date().toISOString().split('T')[0],
      providerId: 'dr_john_smith',
      status: OrderStatus.ORDERED
    };

    setOrders(prev => [newOrder, ...prev]);
    setDescription('');
    setShowOrderForm(false);
  };

  const handlePrint = (orderId: string) => {
    setPrintingOrderId(orderId);
    setTimeout(() => {
      window.print();
      setPrintingOrderId(null);
    }, 250);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center no-print">
        <div>
          <h3 className="text-xl font-bold text-slate-800">Labs & Clinical Orders</h3>
          <p className="text-xs text-slate-500 mt-1">Tracks and organizes physician orders for laboratory, medical imaging, and specialist referrals.</p>
        </div>
        <button 
          onClick={() => setShowOrderForm(prev => !prev)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 shadow-sm transition-colors cursor-pointer"
        >
          <Plus size={16} />
          {showOrderForm ? 'Cancel order' : 'Place Order'}
        </button>
      </div>

      {showOrderForm && (
        <form onSubmit={handleCreateOrder} className="bg-white border border-blue-100 p-5 rounded-xl shadow-sm space-y-4 max-w-lg no-print">
          <h4 className="font-bold text-sm text-blue-900 flex items-center gap-1.5 pb-2 border-b border-slate-100 italic select-none">
            <FlaskConical size={16} />
            Place Clinical Order
          </h4>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-tight mb-1">Order Category</label>
              <div className="grid grid-cols-3 gap-2">
                {(Object.keys(OrderType) as Array<keyof typeof OrderType>).map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSelectedType(OrderType[key])}
                    className={cn(
                      "p-2 text-xs font-bold border rounded-lg transition-all",
                      selectedType === OrderType[key]
                        ? "bg-blue-50 border-blue-600 text-blue-700 shadow-sm"
                        : "border-slate-200 text-slate-500 bg-slate-50/50 hover:bg-slate-50"
                    )}
                  >
                    {key}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-tight mb-1">Order Specification & Details</label>
              <input 
                type="text" 
                placeholder="e.g. MRI Right Knee, Hemoglobin A1c, or PT Referral" 
                value={description} 
                onChange={e => setDescription(e.target.value)}
                className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 outline-none p-2.5 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500/20" 
                required
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button 
              type="button" 
              onClick={() => setShowOrderForm(false)} 
              className="px-3.5 py-2 text-xs font-bold text-slate-500 border border-slate-200 hover:bg-slate-50 rounded-lg transition"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2 rounded-lg transition"
            >
              Authorize Order
            </button>
          </div>
        </form>
      )}

      {/* Printing Modal/Receipt Area - Rendered in a Clean Requisition Card layout. In normal screen it is hidden, during print media it shows up clean */}
      {printingOrderId && (
        <div className="hidden print:block fixed inset-0 bg-white z-[9999] p-10 font-sans">
          {(() => {
            const currentPrintObj = orders.find(o => o.id === printingOrderId);
            if (!currentPrintObj) return null;
            return (
              <div className="border-2 border-black p-8 rounded space-y-6">
                <div className="flex justify-between items-start border-b-2 border-slate-350 pb-4">
                  <div>
                    <h1 className="text-2xl font-bold tracking-tight">CLINICAL REQUISITION</h1>
                    <p className="text-sm font-mono text-slate-600">Order ID: {currentPrintObj.id}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-base">METROPOLITAN MED-CENTER</p>
                    <p className="text-xs text-slate-500">Suite 404, Hospital Drive</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 bg-slate-100 p-3 rounded text-xs">
                  <div>
                    <p className="font-mono text-slate-550 uppercase font-semibold">PATIENT INFORMATION</p>
                    <p className="font-bold text-sm text-slate-900">{patient.lastName}, {patient.firstName}</p>
                    <p className="mt-1">DOB: {formatDate(patient.dob)} • Gender: {patient.gender}</p>
                    <p>MRN: {patient.mrn}</p>
                  </div>
                  <div>
                    <p className="font-mono text-slate-550 uppercase font-semibold">PROVIDER & ORDER DETAILS</p>
                    <p className="font-bold text-sm text-slate-900">Dr. John Smith, MD</p>
                    <p className="mt-1">Authorized Date: {formatDate(currentPrintObj.date)}</p>
                    <p className="capitalize">Category: {currentPrintObj.type}</p>
                  </div>
                </div>

                <div className="border-t border-b border-black py-6 space-y-2">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">PROCEDURE / TEST ORDER REQUISITIONS</p>
                  <p className="text-lg font-bold text-slate-900">{currentPrintObj.description}</p>
                  <p className="text-xs italic text-slate-500 mt-2">Required Diagnosis Codes: M17.11 (Unilateral primary osteoarthritis, right knee), M23.51 (Chronic instability of right knee joint).</p>
                </div>

                <div className="flex justify-between items-end pt-12 text-xs">
                  <div>
                    <div className="border-b border-black w-48 h-8" />
                    <p className="mt-1 text-slate-500">Provider Signature & Credentials</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-slate-700">Digital ID Verification: MD-22129-SMITH</p>
                    <p className="text-slate-400 text-[10px]">Generated by Scribe Ambient Assistant</p>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Standard Orders Display list */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 no-print">
        {orders.map(order => (
          <div key={order.id} className="bg-white border border-slate-200 rounded-xl shadow-sm p-4 hover:border-blue-200 hover:shadow-md transition-all flex flex-col justify-between">
            <div className="flex items-start justify-between gap-2">
              <div className="flex gap-3">
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                  order.type === OrderType.LAB 
                    ? "bg-blue-50 text-blue-600" 
                    : order.type === OrderType.IMAGING
                      ? "bg-purple-50 text-purple-600"
                      : "bg-amber-50 text-amber-600"
                )}>
                  <FlaskConical size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-slate-950 text-sm leading-snug">{order.description}</h4>
                    <span className={cn(
                      "px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-tight shrink-0 border",
                      order.status === OrderStatus.RESULTED 
                        ? "bg-green-50 text-green-700 border-green-100" 
                        : "bg-blue-50 text-blue-700 border-blue-100"
                    )}>
                      {order.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">Ordered by {order.providerId === 'dr_john_smith' ? 'Dr. John Smith' : 'AI Assistant'} • {formatDate(order.date)}</p>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center">
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-400">
                {order.type}
              </span>
              <button 
                onClick={() => handlePrint(order.id)}
                className="flex items-center gap-1.5 text-xs font-bold text-indigo-650 hover:text-indigo-700 hover:underline border border-indigo-100 bg-indigo-50/50 px-2.5 py-1.5 rounded-lg cursor-pointer transition"
              >
                <Printer size={12} />
                Print Requisition Note
              </button>
            </div>
          </div>
        ))}
        {orders.length === 0 && (
          <div className="col-span-2 bg-white border border-slate-200 border-dashed rounded-xl p-12 text-center text-slate-400 italic">
            No active laboratories, diagnostic images, or physical referrals ordered for this clinical patient yet.
          </div>
        )}
      </div>
    </div>
  );
}

function Section({ title, icon: Icon, children }: { title: string, icon: any, children: React.ReactNode }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
        <Icon size={16} className="text-slate-400" />
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-600">{title}</h3>
      </div>
      <div className="p-4">
        {children}
      </div>
    </div>
  );
}

function VitalCard({ label, value, unit, trend }: { label: string, value: string, unit: string, trend?: 'up' | 'down' }) {
  const isNA = value === 'N/A';
  return (
    <div className={cn(
      "bg-slate-50 p-3 rounded-lg border border-slate-100 transition-all",
      isNA && "opacity-60 bg-slate-100/50 grayscale border-slate-200"
    )}>
      <p className="text-[10px] font-bold text-slate-400 uppercase">{label}</p>
      <div className="flex items-baseline gap-1 mt-1">
        <span className={cn("text-lg font-bold", isNA ? "text-slate-400 font-medium italic" : "text-slate-900")}>{value}</span>
        {!isNA && <span className="text-[10px] text-slate-500">{unit}</span>}
      </div>
    </div>
  );
}

function ActivityItem({ type, title, subtitle, content, status }: { type: 'note' | 'lab' | 'med', title: string, subtitle: string, content?: string, status?: 'abnormal' | 'normal' }) {
  return (
    <div className="flex gap-4 group">
      <div className="flex flex-col items-center">
        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 border border-slate-200 shrink-0">
          {type === 'note' && <FileText size={14} />}
          {type === 'lab' && <FlaskConical size={14} />}
          {type === 'med' && <Pill size={14} />}
        </div>
        <div className="w-px h-full bg-slate-200 group-last:hidden" />
      </div>
      <div className="flex-1 pb-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-bold text-slate-900">{title}</h4>
          {status === 'abnormal' && (
            <span className="text-[10px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded border border-red-100 uppercase">Abnormal</span>
          )}
        </div>
        <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
        {content && <p className="text-xs text-slate-600 mt-2 line-clamp-2 italic">"{content}"</p>}
      </div>
    </div>
  );
}
