import React, { useState, useEffect } from 'react';
import { getPatients, addPatient, getAppointments, addAppointment, updateAppointmentStatus } from '../lib/dataStore';
import { Patient, Appointment } from '../types';
import { User, Calendar, CheckSquare, Phone, Mail, UserPlus, Clock, Search, ShieldAlert, BadgeInfo, CheckCircle } from 'lucide-react';
import { cn } from '../lib/utils';

export function FrontDeskView() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  
  // Registration Form State
  const [regFirstName, setRegFirstName] = useState('');
  const [regLastName, setRegLastName] = useState('');
  const [regDob, setRegDob] = useState('');
  const [regGender, setRegGender] = useState<'male' | 'female' | 'other'>('female');
  const [regPhone, setRegPhone] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regSuccess, setRegSuccess] = useState<string | null>(null);

  // Scheduling Form State
  const [schedPatientId, setSchedPatientId] = useState('');
  const [schedDate, setSchedDate] = useState('2026-06-15');
  const [schedTime, setSchedTime] = useState('11:00');
  const [schedDuration, setSchedDuration] = useState('30');
  const [schedType, setSchedType] = useState('Established Follow-up');
  const [schedReason, setSchedReason] = useState('Hypertension check');
  const [schedSuccess, setSchedSuccess] = useState<string | null>(null);

  // Search filter for check-in
  const [searchTerm, setSearchTerm] = useState('');

  // Loaded on mount and on storage updates
  const loadData = () => {
    setPatients(getPatients());
    setAppointments(getAppointments());
  };

  useEffect(() => {
    loadData();
    window.addEventListener('storage', loadData);
    return () => window.removeEventListener('storage', loadData);
  }, []);

  const handleRegisterPatient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regFirstName || !regLastName || !regDob) {
      alert("Please fill in the required patient demographics.");
      return;
    }

    // Generate MRN
    const mrn = `MRN-${Math.floor(10000 + Math.random() * 90000)}`;

    const newPatient = addPatient({
      firstName: regFirstName,
      lastName: regLastName,
      dob: regDob,
      gender: regGender,
      mrn: mrn,
      phone: regPhone || undefined,
      email: regEmail || undefined
    });

    setRegSuccess(`Successfully registered ${newPatient.firstName} ${newPatient.lastName} with MRN: ${mrn}`);
    
    // Reset inputs
    setRegFirstName('');
    setRegLastName('');
    setRegDob('');
    setRegGender('female');
    setRegPhone('');
    setRegEmail('');

    // Pre-populate scheduled patient selection dropdown for simplicity
    setSchedPatientId(newPatient.id);

    // Fade toast after 5s
    setTimeout(() => {
      setRegSuccess(null);
    }, 5000);
  };

  const handleCreateAppointment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!schedPatientId) {
      alert("Please select a patient to schedule.");
      return;
    }

    const selectedPatient = patients.find(p => p.id === schedPatientId);
    if (!selectedPatient) return;

    const newApt = addAppointment({
      patientId: schedPatientId,
      providerId: 'dr_smith',
      date: schedDate,
      time: schedTime,
      duration: parseInt(schedDuration, 10),
      type: schedType,
      status: 'scheduled',
      reasonForVisit: schedReason
    });

    setSchedSuccess(`Appointment scheduled successfully for ${selectedPatient.firstName} ${selectedPatient.lastName} at ${schedTime}.`);
    
    // Reset scheduling states
    setSchedReason('');
    
    setTimeout(() => {
      setSchedSuccess(null);
    }, 5000);
  };

  const handleCheckIn = (aptId: string) => {
    updateAppointmentStatus(aptId, 'checked-in');
  };

  const activeAppts = appointments.filter(apt => {
    const p = patients.find(pat => pat.id === apt.patientId);
    if (!p) return false;
    const matchesSearch = `${p.firstName} ${p.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) || p.mrn.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          📋 Front Desk Operations
        </h2>
        <p className="text-slate-500 mt-1">
          Answer phone calls, register new patient demographics, coordinate times, and check in patient arrivals.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Registration & Demographics Column */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 border-b border-slate-150 pb-4 mb-5">
              <div className="p-1.5 bg-blue-100 text-blue-700 rounded-lg">
                <UserPlus size={18} />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-lg">Demographic Intake</h3>
                <p className="text-xs text-slate-400">Register new patient files over phone / reception Desk</p>
              </div>
            </div>

            {regSuccess && (
              <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-800 rounded-lg text-sm flex items-start gap-2.5 animate-fadeIn">
                <CheckCircle size={16} className="text-green-600 mt-0.5 shrink-0" />
                <span>{regSuccess}</span>
              </div>
            )}

            <form onSubmit={handleRegisterPatient} className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">First Name <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Jane"
                    className="w-full bg-slate-50 border border-slate-205 rounded-lg px-3 py-2 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
                    value={regFirstName}
                    onChange={(e) => setRegFirstName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Last Name <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Doe"
                    className="w-full bg-slate-50 border border-slate-205 rounded-lg px-3 py-2 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
                    value={regLastName}
                    onChange={(e) => setRegLastName(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Date of Birth <span className="text-rose-500">*</span></label>
                  <input
                    type="date"
                    required
                    className="w-full bg-slate-50 border border-slate-205 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
                    value={regDob}
                    onChange={(e) => setRegDob(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Biological Sex <span className="text-rose-500">*</span></label>
                  <select
                    className="w-full bg-slate-50 border border-slate-205 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
                    value={regGender}
                    onChange={(e) => setRegGender(e.target.value as any)}
                  >
                    <option value="female">Female</option>
                    <option value="male">Male</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5 flex items-center gap-1"><Phone size={12} /> Contact Phone</label>
                  <input
                    type="tel"
                    placeholder="e.g. 555-0100"
                    className="w-full bg-slate-50 border border-slate-205 rounded-lg px-3 py-2 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5 flex items-center gap-1"><Mail size={12} /> Email Address</label>
                  <input
                    type="email"
                    placeholder="e.g. patient@gmail.com"
                    className="w-full bg-slate-50 border border-slate-205 rounded-lg px-3 py-2 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full mt-4 bg-blue-600 text-white font-bold py-2.5 px-4 rounded-lg hover:bg-blue-700 shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center justify-center gap-2"
              >
                <UserPlus size={16} />
                Create Demographics File
              </button>
            </form>
          </div>
        </div>

        {/* Scheduling Column */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 border-b border-slate-150 pb-4 mb-5">
              <div className="p-1.5 bg-indigo-100 text-indigo-700 rounded-lg">
                <Calendar size={18} />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-lg">Appointment Scheduler</h3>
                <p className="text-xs text-slate-400">Put registered patients directly on the calendar</p>
              </div>
            </div>

            {schedSuccess && (
              <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-800 rounded-lg text-sm flex items-start gap-2.5 animate-fadeIn">
                <CheckCircle size={16} className="text-green-600 mt-0.5 shrink-0" />
                <span>{schedSuccess}</span>
              </div>
            )}

            <form onSubmit={handleCreateAppointment} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Select Registered Patient <span className="text-rose-500">*</span></label>
                <select
                  required
                  className="w-full bg-slate-50 border border-slate-205 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
                  value={schedPatientId}
                  onChange={(e) => setSchedPatientId(e.target.value)}
                >
                  <option value="">-- Choose Patient --</option>
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.lastName}, {p.firstName} (DOB: {p.dob})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5 flex items-center gap-1"><Calendar size={12} /> Appointment Date</label>
                  <input
                    type="date"
                    required
                    className="w-full bg-slate-50 border border-slate-205 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
                    value={schedDate}
                    onChange={(e) => setSchedDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5 flex items-center gap-1"><Clock size={12} /> Check-In Slot Time</label>
                  <input
                    type="time"
                    required
                    className="w-full bg-slate-50 border border-slate-205 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
                    value={schedTime}
                    onChange={(e) => setSchedTime(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Duration</label>
                  <select
                    className="w-full bg-slate-50 border border-slate-205 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
                    value={schedDuration}
                    onChange={(e) => setSchedDuration(e.target.value)}
                  >
                    <option value="15">15 minutes (Quick check)</option>
                    <option value="30">30 minutes (Follow-up)</option>
                    <option value="45">45 minutes (Comprehensive)</option>
                    <option value="60">60 minutes (Initial consultation)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Visit Type</label>
                  <select
                    className="w-full bg-slate-50 border border-slate-205 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
                    value={schedType}
                    onChange={(e) => setSchedType(e.target.value)}
                  >
                    <option value="Established Follow-up">Established Follow-up</option>
                    <option value="Initial Consult">Initial Consult</option>
                    <option value="Quick Check">Quick Check</option>
                    <option value="Wellness Exam">Wellness Exam</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Reason for Visit <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Routine hypertension monitoring and prescription adjustment"
                  className="w-full bg-slate-50 border border-slate-205 rounded-lg px-3 py-2 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
                  value={schedReason}
                  onChange={(e) => setSchedReason(e.target.value)}
                />
              </div>

              <button
                type="submit"
                className="w-full mt-4 bg-indigo-600 text-white font-bold py-2.5 px-4 rounded-lg hover:bg-indigo-700 shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 flex items-center justify-center gap-2"
              >
                <Calendar size={16} />
                Save Schedule Block
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Check-In Desk Section */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-150 pb-4 mb-5 gap-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-green-100 text-green-700 rounded-lg">
              <CheckSquare size={18} />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-lg">Intake Arrivals Desk</h3>
              <p className="text-xs text-slate-400">Mark patients as arrived and notify the clinical Back Office / MAs</p>
            </div>
          </div>
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Search arrivals by name..."
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-1.5 focus:outline-none text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto text-sm">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-150">
              <tr>
                <th className="px-6 py-3">Scheduled Time</th>
                <th className="px-6 py-3">Patient Account</th>
                <th className="px-6 py-3">MRN / DOB</th>
                <th className="px-6 py-3">Details & Reason</th>
                <th className="px-6 py-3">Status Badge</th>
                <th className="px-6 py-3 text-right">Action Gate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {activeAppts.map((apt) => {
                const pat = patients.find(p => p.id === apt.patientId);
                if (!pat) return null;
                return (
                  <tr key={apt.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-800 flex flex-col justify-center">
                      <span>{apt.time}</span>
                      <span className="text-[10px] text-slate-400 font-normal">{apt.duration} min duration</span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-slate-900">{pat.lastName}, {pat.firstName}</p>
                      <p className="text-xs text-slate-400">{pat.phone || 'No phone recorded'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-mono text-xs text-slate-600">{pat.mrn}</p>
                      <p className="text-xs text-slate-400">DOB: {pat.dob}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-slate-800">{apt.type}</p>
                      <p className="text-xs text-slate-500 italic max-w-xs truncate">{apt.reasonForVisit}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border",
                        apt.status === 'checked-in' && "bg-emerald-50 text-emerald-700 border-emerald-250",
                        apt.status === 'scheduled' && "bg-amber-50 text-amber-700 border-amber-250",
                        apt.status === 'completed' && "bg-blue-50 text-blue-750 border-blue-250",
                        apt.status === 'cancelled' && "bg-rose-50 text-rose-700 border-rose-250"
                      )}>
                        {apt.status === 'checked-in' ? 'Arrived (Waiting)' : apt.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {apt.status === 'scheduled' ? (
                        <button
                          onClick={() => handleCheckIn(apt.id)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-md text-xs shadow-sm transition-all active:scale-95"
                        >
                          Check In Patient
                        </button>
                      ) : apt.status === 'checked-in' ? (
                        <div className="text-xs text-emerald-700 font-semibold flex items-center gap-1 justify-end">
                          <CheckCircle size={14} /> Check-In Confirmed
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic">No actions</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {activeAppts.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500 italic">
                    No active appointments scheduled on this day matching the search.
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
