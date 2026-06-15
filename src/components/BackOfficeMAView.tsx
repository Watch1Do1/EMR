import React, { useState, useEffect } from 'react';
import { getPatients, getAppointments, getVitals, saveVitals, PatientVitals } from '../lib/dataStore';
import { Patient, Appointment } from '../types';
import { Activity, Heart, Thermometer, Sparkles, Check, Clipboard, Scale, CheckCircle2, User, Search, Play, Volume2, Info } from 'lucide-react';
import { cn } from '../lib/utils';

export function BackOfficeMAView() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);

  // Vitals form states
  const [bpSys, setBpSys] = useState('120');
  const [bpDia, setBpDia] = useState('80');
  const [heartRate, setHeartRate] = useState('72');
  const [temp, setTemp] = useState('98.6');
  const [respRate, setRespRate] = useState('16');
  const [o2Sat, setO2Sat] = useState('98');
  const [weight, setWeight] = useState('160');
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  // Vital active/inactive toggle states (X button support)
  const [bpActive, setBpActive] = useState(true);
  const [hrActive, setHrActive] = useState(true);
  const [tempActive, setTempActive] = useState(true);
  const [respActive, setRespActive] = useState(true);
  const [spo2Active, setSpo2Active] = useState(true);
  const [weightActive, setWeightActive] = useState(true);

  // Search filter
  const [search, setSearch] = useState('');

  const loadData = () => {
    setPatients(getPatients());
    setAppointments(getAppointments());
  };

  useEffect(() => {
    loadData();
    window.addEventListener('storage', loadData);
    return () => window.removeEventListener('storage', loadData);
  }, []);

  const selectedPatient = patients.find(p => p.id === selectedPatientId);
  const selectedVitals = selectedPatientId ? getVitals(selectedPatientId) : undefined;

  // Reactively fill inputs if vitals already exist for selected patient
  useEffect(() => {
    if (selectedPatientId) {
      const existing = getVitals(selectedPatientId);
      if (existing) {
        const hasBp = existing.bloodPressure !== 'N/A';
        setBpActive(hasBp);
        if (hasBp) {
          const [sys, dia] = existing.bloodPressure.split('/');
          setBpSys(sys || '120');
          setBpDia(dia || '80');
        } else {
          setBpSys('');
          setBpDia('');
        }

        const hasHr = existing.heartRate !== 'N/A';
        setHrActive(hasHr);
        setHeartRate(hasHr ? existing.heartRate : '');

        const hasTemp = existing.temperature !== 'N/A';
        setTempActive(hasTemp);
        setTemp(hasTemp ? existing.temperature : '');

        const hasResp = existing.respiratoryRate !== 'N/A';
        setRespActive(hasResp);
        setRespRate(hasResp ? existing.respiratoryRate : '');

        const hasSpo2 = existing.oxygenSat !== 'N/A';
        setSpo2Active(hasSpo2);
        setO2Sat(hasSpo2 ? existing.oxygenSat : '');

        const hasWeight = existing.weight !== 'N/A';
        setWeightActive(hasWeight);
        setWeight(hasWeight ? existing.weight : '');
      } else {
        // Reset to neat defaults
        setBpActive(true);
        setHrActive(true);
        setTempActive(true);
        setRespActive(true);
        setSpo2Active(true);
        setWeightActive(true);

        setBpSys('120');
        setBpDia('80');
        setHeartRate('72');
        setTemp('98.6');
        setRespRate('16');
        setO2Sat('98');
        setWeight('160');
      }
    }
  }, [selectedPatientId]);

  const handlePrepopulateNormal = () => {
    setBpActive(true);
    setHrActive(true);
    setTempActive(true);
    setRespActive(true);
    setSpo2Active(true);
    setWeightActive(true);

    setBpSys('118');
    setBpDia('76');
    setHeartRate('68');
    setTemp('98.4');
    setRespRate('14');
    setO2Sat('99');
    setWeight('152');
  };

  const handleSaveVitals = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientId) return;

    const vitalsPayload: PatientVitals = {
      bloodPressure: bpActive ? `${bpSys}/${bpDia}` : 'N/A',
      heartRate: hrActive ? heartRate : 'N/A',
      temperature: tempActive ? temp : 'N/A',
      respiratoryRate: respActive ? respRate : 'N/A',
      oxygenSat: spo2Active ? o2Sat : 'N/A',
      weight: weightActive ? weight : 'N/A',
      recordedAt: new Date().toISOString(),
      recordedBy: 'Carey Mills, MA'
    };

    saveVitals(selectedPatientId, vitalsPayload);
    setSaveSuccess(`Vitals written to EMR for ${selectedPatient?.firstName} ${selectedPatient?.lastName}`);
    
    setTimeout(() => {
      setSaveSuccess(null);
    }, 4500);
  };

  // Filter for patients checked-in (or generally any patient scheduled on 2026-06-15)
  const checkedInAppts = appointments.filter(apt => {
    const p = patients.find(pat => pat.id === apt.patientId);
    if (!p) return false;
    const matchesRole = apt.status === 'checked-in' || apt.status === 'scheduled';
    const matchesSearch = `${p.firstName} ${p.lastName}`.toLowerCase().includes(search.toLowerCase());
    return matchesRole && matchesSearch;
  });

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          🩺 Back Office Clinical Intake
        </h2>
        <p className="text-slate-500 mt-1">
          Review front-desk check-ins, record physical vitals, and track AI-assisted rooming.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Arrivals & Rooms List */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                <Clipboard size={16} className="text-blue-600" />
                Intake Worklist
              </h3>
              <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-0.5 rounded-full">
                {checkedInAppts.filter(a => a.status === 'checked-in').length} Arrived
              </span>
            </div>

            <div className="relative">
              <Search className="absolute left-2.5 top-2 text-slate-400" size={14} />
              <input
                type="text"
                placeholder="Find arrived patient..."
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 focus:outline-none text-xs"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
              {checkedInAppts.map((apt) => {
                const pat = patients.find(p => p.id === apt.patientId);
                if (!pat) return null;

                const hasVitals = !!getVitals(pat.id);
                const isSelected = pat.id === selectedPatientId;
                const isNurseCompleted = localStorage.getItem(`previsit_completed_${pat.id}`) === 'true';

                return (
                  <div
                    key={apt.id}
                    onClick={() => setSelectedPatientId(pat.id)}
                    className={cn(
                      "p-3.5 border rounded-lg cursor-pointer transition-all hover:shadow-xs",
                      isSelected 
                        ? "border-blue-550 bg-blue-50/50 shadow-sm" 
                        : "border-slate-200 bg-white hover:bg-slate-50/50"
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">
                          {pat.lastName}, {pat.firstName}
                        </h4>
                        <p className="text-[11px] text-slate-400 font-mono">MRN: {pat.mrn} • DOB: {pat.dob}</p>
                      </div>
                      <span className={cn(
                        "text-[9px] font-bold uppercase px-2 py-0.5 rounded-full select-none border",
                        apt.status === 'checked-in' 
                          ? "bg-amber-50 text-amber-700 border-amber-200" 
                          : "bg-slate-50 text-slate-400 border-slate-100"
                      )}>
                        {apt.status === 'checked-in' ? 'Arrived' : 'Scheduled'}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 mt-2 line-clamp-1 italic">
                      Reason: {apt.reasonForVisit}
                    </p>

                    <div className="flex items-center gap-2 mt-3 pt-2.5 border-t border-slate-100">
                      {hasVitals ? (
                        <span className="flex items-center gap-0.5 text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-150">
                          <Check size={11} /> Vitals Recorded
                        </span>
                      ) : (
                        <span className="flex items-center gap-0.5 text-[10px] text-rose-700 font-bold bg-rose-50 px-1.5 py-0.5 rounded border border-rose-150">
                          Needs Vitals
                        </span>
                      )}

                      {isNurseCompleted && (
                        <span className="flex items-center gap-0.5 text-[10px] text-indigo-700 font-bold bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-150">
                          <Sparkles size={10} /> Rooming Done
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}

              {checkedInAppts.length === 0 && (
                <p className="text-xs text-slate-400 text-center py-6 italic">No waiting clinic arrivals.</p>
              )}
            </div>
          </div>
        </div>

        {/* Vitals Entry Form & AI Intake Column */}
        <div className="lg:col-span-2 space-y-6">
          {selectedPatient ? (
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 space-y-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-150 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-700">
                    {selectedPatient.firstName[0]}{selectedPatient.lastName[0]}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-lg">
                      {selectedPatient.lastName}, {selectedPatient.firstName}
                    </h3>
                    <p className="text-xs text-slate-500">
                      DOB: {selectedPatient.dob} • MRN: {selectedPatient.mrn} • Sex: <span className="capitalize">{selectedPatient.gender}</span>
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handlePrepopulateNormal}
                  className="mt-3 md:mt-0 text-xs font-semibold text-blue-700 border border-blue-200 bg-blue-50/50 hover:bg-blue-100/50 px-3 py-1.5 rounded-lg transition-all"
                >
                  ⚡ Autofill Normal Ranges
                </button>
              </div>

              {saveSuccess && (
                <div className="p-3 bg-green-50 border border-green-200 text-green-800 rounded-lg text-xs font-semibold flex items-center gap-2 animate-fadeIn">
                  <Activity size={14} className="text-green-600 animate-pulse" />
                  <span>{saveSuccess}</span>
                </div>
              )}

              {/* Vitals Input Grid */}
              <form onSubmit={handleSaveVitals} className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                  {/* Blood Pressure */}
                  <div className={cn(
                    "p-4 rounded-xl border transition-all flex flex-col justify-between min-h-[112px]",
                    bpActive 
                      ? "bg-slate-50 border-slate-200" 
                      : "bg-slate-100/70 border-dashed border-slate-300 opacity-60"
                  )}>
                    <div className="flex items-center justify-between">
                      <div className={cn(
                        "flex items-center gap-1.5 font-bold text-xs uppercase tracking-wider",
                        bpActive ? "text-rose-700" : "text-slate-400"
                      )}>
                        <Heart size={14} />
                        <span>BP (Blood Pressure)</span>
                      </div>
                      {bpActive ? (
                        <button
                          id="btn_exclude_bp"
                          type="button"
                          onClick={() => setBpActive(false)}
                          className="w-5 h-5 rounded-full flex items-center justify-center hover:bg-rose-50 hover:text-rose-600 text-slate-400 text-[10px] font-bold transition-colors cursor-pointer"
                          title="Exclude Blood Pressure"
                        >
                          ✕
                        </button>
                      ) : (
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">N/A</span>
                      )}
                    </div>
                    
                    {bpActive ? (
                      <div className="flex items-center gap-2 mt-2">
                        <input
                          id="input_bp_sys"
                          type="number"
                          required
                          className="w-16 bg-white border border-slate-250 rounded-lg px-2 py-1 text-center font-bold text-slate-800 focus:outline-none"
                          value={bpSys}
                          onChange={(e) => setBpSys(e.target.value)}
                          placeholder="Sys"
                        />
                        <span className="text-slate-400 font-semibold">/</span>
                        <input
                          id="input_bp_dia"
                          type="number"
                          required
                          className="w-16 bg-white border border-slate-250 rounded-lg px-2 py-1 text-center font-bold text-slate-800 focus:outline-none"
                          value={bpDia}
                          onChange={(e) => setBpDia(e.target.value)}
                          placeholder="Dia"
                        />
                        <span className="text-[10px] text-slate-400 font-medium">mmHg</span>
                      </div>
                    ) : (
                      <div className="mt-2">
                        <button
                          id="btn_include_bp"
                          type="button"
                          onClick={() => setBpActive(true)}
                          className="text-[11px] text-blue-600 hover:text-blue-800 font-bold"
                        >
                          + Restore BP
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Heart Rate */}
                  <div className={cn(
                    "p-4 rounded-xl border transition-all flex flex-col justify-between min-h-[112px]",
                    hrActive 
                      ? "bg-slate-50 border-slate-200" 
                      : "bg-slate-100/70 border-dashed border-slate-300 opacity-60"
                  )}>
                    <div className="flex items-center justify-between">
                      <div className={cn(
                        "flex items-center gap-1.5 font-bold text-xs uppercase tracking-wider",
                        hrActive ? "text-rose-650" : "text-slate-400"
                      )}>
                        <Activity size={14} />
                        <span>Heart Rate</span>
                      </div>
                      {hrActive ? (
                        <button
                          id="btn_exclude_hr"
                          type="button"
                          onClick={() => setHrActive(false)}
                          className="w-5 h-5 rounded-full flex items-center justify-center hover:bg-rose-50 hover:text-rose-600 text-slate-400 text-[10px] font-bold transition-colors cursor-pointer"
                          title="Exclude Heart Rate"
                        >
                          ✕
                        </button>
                      ) : (
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">N/A</span>
                      )}
                    </div>

                    {hrActive ? (
                      <div className="flex items-center gap-2 mt-2">
                        <input
                          id="input_heart_rate"
                          type="number"
                          required
                          className="w-20 bg-white border border-slate-250 rounded-lg px-2 py-1 text-center font-bold text-slate-800 focus:outline-none"
                          value={heartRate}
                          onChange={(e) => setHeartRate(e.target.value)}
                        />
                        <span className="text-[10px] text-slate-400 font-medium">bpm</span>
                      </div>
                    ) : (
                      <div className="mt-2">
                        <button
                          id="btn_include_hr"
                          type="button"
                          onClick={() => setHrActive(true)}
                          className="text-[11px] text-blue-600 hover:text-blue-800 font-bold"
                        >
                          + Restore Pulse
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Temperature */}
                  <div className={cn(
                    "p-4 rounded-xl border transition-all flex flex-col justify-between min-h-[112px]",
                    tempActive 
                      ? "bg-slate-50 border-slate-200" 
                      : "bg-slate-100/70 border-dashed border-slate-300 opacity-60"
                  )}>
                    <div className="flex items-center justify-between">
                      <div className={cn(
                        "flex items-center gap-1.5 font-bold text-xs uppercase tracking-wider",
                        tempActive ? "text-amber-600" : "text-slate-400"
                      )}>
                        <Thermometer size={14} />
                        <span>Temperature</span>
                      </div>
                      {tempActive ? (
                        <button
                          id="btn_exclude_temp"
                          type="button"
                          onClick={() => setTempActive(false)}
                          className="w-5 h-5 rounded-full flex items-center justify-center hover:bg-rose-50 hover:text-rose-600 text-slate-400 text-[10px] font-bold transition-colors cursor-pointer"
                          title="Exclude Temperature"
                        >
                          ✕
                        </button>
                      ) : (
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">N/A</span>
                      )}
                    </div>

                    {tempActive ? (
                      <div className="flex items-center gap-2 mt-2">
                        <input
                          id="input_temp"
                          type="number"
                          step="0.1"
                          required
                          className="w-20 bg-white border border-slate-250 rounded-lg px-2 py-1 text-center font-bold text-slate-800 focus:outline-none"
                          value={temp}
                          onChange={(e) => setTemp(e.target.value)}
                        />
                        <span className="text-[10px] text-slate-400 font-medium">°F</span>
                      </div>
                    ) : (
                      <div className="mt-2">
                        <button
                          id="btn_include_temp"
                          type="button"
                          onClick={() => setTempActive(true)}
                          className="text-[11px] text-blue-600 hover:text-blue-800 font-bold"
                        >
                          + Restore Temp
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Respiratory Rate */}
                  <div className={cn(
                    "p-4 rounded-xl border transition-all flex flex-col justify-between min-h-[112px]",
                    respActive 
                      ? "bg-slate-50 border-slate-200" 
                      : "bg-slate-100/70 border-dashed border-slate-300 opacity-60"
                  )}>
                    <div className="flex items-center justify-between">
                      <div className={cn(
                        "flex items-center gap-1.5 font-bold text-xs uppercase tracking-wider",
                        respActive ? "text-indigo-600" : "text-slate-400"
                      )}>
                        <Activity size={14} />
                        <span>Respiratory Rate</span>
                      </div>
                      {respActive ? (
                        <button
                          id="btn_exclude_resp"
                          type="button"
                          onClick={() => setRespActive(false)}
                          className="w-5 h-5 rounded-full flex items-center justify-center hover:bg-rose-50 hover:text-rose-600 text-slate-400 text-[10px] font-bold transition-colors cursor-pointer"
                          title="Exclude Respiratory Rate"
                        >
                          ✕
                        </button>
                      ) : (
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">N/A</span>
                      )}
                    </div>

                    {respActive ? (
                      <div className="flex items-center gap-2 mt-2">
                        <input
                          id="input_resp_rate"
                          type="number"
                          required
                          className="w-20 bg-white border border-slate-250 rounded-lg px-2 py-1 text-center font-bold text-slate-800 focus:outline-none"
                          value={respRate}
                          onChange={(e) => setRespRate(e.target.value)}
                        />
                        <span className="text-[10px] text-slate-400 font-medium">rpm</span>
                      </div>
                    ) : (
                      <div className="mt-2">
                        <button
                          id="btn_include_resp"
                          type="button"
                          onClick={() => setRespActive(true)}
                          className="text-[11px] text-blue-600 hover:text-blue-800 font-bold"
                        >
                          + Restore Respiration
                        </button>
                      </div>
                    )}
                  </div>

                  {/* SpO2 */}
                  <div className={cn(
                    "p-4 rounded-xl border transition-all flex flex-col justify-between min-h-[112px]",
                    spo2Active 
                      ? "bg-slate-50 border-slate-200" 
                      : "bg-slate-100/70 border-dashed border-slate-300 opacity-60"
                  )}>
                    <div className="flex items-center justify-between">
                      <div className={cn(
                        "flex items-center gap-1.5 font-bold text-xs uppercase tracking-wider",
                        spo2Active ? "text-cyan-600" : "text-slate-400"
                      )}>
                        <Heart size={14} />
                        <span>SpO₂ (Oxygen)</span>
                      </div>
                      {spo2Active ? (
                        <button
                          id="btn_exclude_o2"
                          type="button"
                          onClick={() => setSpo2Active(false)}
                          className="w-5 h-5 rounded-full flex items-center justify-center hover:bg-rose-50 hover:text-rose-600 text-slate-400 text-[10px] font-bold transition-colors cursor-pointer"
                          title="Exclude Oxygen Saturation"
                        >
                          ✕
                        </button>
                      ) : (
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">N/A</span>
                      )}
                    </div>

                    {spo2Active ? (
                      <div className="flex items-center gap-2 mt-2">
                        <input
                          id="input_o2_sat"
                          type="number"
                          required
                          max="100"
                          className="w-20 bg-white border border-slate-250 rounded-lg px-2 py-1 text-center font-bold text-slate-800 focus:outline-none"
                          value={o2Sat}
                          onChange={(e) => setO2Sat(e.target.value)}
                        />
                        <span className="text-[10px] text-slate-400 font-medium">%</span>
                      </div>
                    ) : (
                      <div className="mt-2">
                        <button
                          id="btn_include_o2"
                          type="button"
                          onClick={() => setSpo2Active(true)}
                          className="text-[11px] text-blue-600 hover:text-blue-800 font-bold"
                        >
                          + Restore Oxygen
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Weight */}
                  <div className={cn(
                    "p-4 rounded-xl border transition-all flex flex-col justify-between min-h-[112px]",
                    weightActive 
                      ? "bg-slate-50 border-slate-200" 
                      : "bg-slate-100/70 border-dashed border-slate-300 opacity-60"
                  )}>
                    <div className="flex items-center justify-between">
                      <div className={cn(
                        "flex items-center gap-1.5 font-bold text-xs uppercase tracking-wider",
                        weightActive ? "text-emerald-600" : "text-slate-400"
                      )}>
                        <Scale size={14} />
                        <span>Body Weight</span>
                      </div>
                      {weightActive ? (
                        <button
                          id="btn_exclude_weight"
                          type="button"
                          onClick={() => setWeightActive(false)}
                          className="w-5 h-5 rounded-full flex items-center justify-center hover:bg-rose-50 hover:text-rose-600 text-slate-400 text-[10px] font-bold transition-colors cursor-pointer"
                          title="Exclude Weight"
                        >
                          ✕
                        </button>
                      ) : (
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">N/A</span>
                      )}
                    </div>

                    {weightActive ? (
                      <div className="flex items-center gap-2 mt-2">
                        <input
                          id="input_weight"
                          type="number"
                          required
                          className="w-20 bg-white border border-slate-250 rounded-lg px-2 py-1 text-center font-bold text-slate-800 focus:outline-none"
                          value={weight}
                          onChange={(e) => setWeight(e.target.value)}
                        />
                        <span className="text-[10px] text-slate-400 font-medium">lbs</span>
                      </div>
                    ) : (
                      <div className="mt-2">
                        <button
                          id="btn_include_weight"
                          type="button"
                          onClick={() => setWeightActive(true)}
                          className="text-[11px] text-blue-600 hover:text-blue-800 font-bold"
                        >
                          + Restore Weight
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    id="btn_commit_vitals"
                    type="submit"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-2 rounded-lg text-sm shadow-sm transition-all flex items-center gap-2"
                  >
                    <CheckCircle2 size={16} />
                    Commit Vitals block to Chart
                  </button>
                </div>
              </form>

              {/* Nurse Rooming AI intake status integration */}
              {localStorage.getItem(`previsit_completed_${selectedPatient.id}`) === 'true' ? (
                <div className="mt-4 p-4 border border-indigo-150 bg-indigo-50/40 rounded-xl space-y-3">
                  <div className="flex items-center gap-1.5 text-indigo-850 font-bold text-xs uppercase tracking-wider">
                    <Sparkles className="text-indigo-600 animate-pulse" size={15} />
                    Nurse Carey AI Scribe Intake complete
                  </div>
                  <div className="bg-white border border-indigo-100 rounded-lg p-3 text-xs leading-relaxed text-slate-750">
                    <span className="font-semibold text-slate-800">Pre-Visit Digest:</span>{' '}
                    {localStorage.getItem(`previsit_summary_${selectedPatient.id}`)}
                  </div>
                </div>
              ) : (
                <div className="mt-4 p-4 border border-slate-200 bg-slate-50 rounded-xl text-xs flex items-center gap-2 text-slate-500">
                  <Info size={16} className="text-slate-400" />
                  <span>The patient has not completed Nurse Carey's pre-visit AI automated triage checking yet. Inform patient to run conversational check-in.</span>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-12 text-center text-slate-450 flex flex-col items-center justify-center gap-2.5">
              <User size={40} className="text-slate-300" />
              <h4 className="font-bold text-slate-700">No Patient Selected</h4>
              <p className="text-xs text-slate-400 max-w-sm">
                Select an arrived patient from the Intake Worklist on the left to review demographics, input clinical vitals, or preview rooming digests.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
