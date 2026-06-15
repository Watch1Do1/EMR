import { Patient, Appointment } from '../types';

export interface PatientVitals {
  bloodPressure: string;
  heartRate: string;
  temperature: string;
  respiratoryRate: string;
  oxygenSat: string;
  weight: string;
  recordedAt: string;
  recordedBy: string;
}

const DEFAULT_PATIENTS: Patient[] = [
  { 
    id: '1', 
    firstName: 'Jane', 
    lastName: 'Doe', 
    dob: '1985-05-12', 
    gender: 'female', 
    mrn: 'MRN-12345',
    phone: '555-0192',
    email: 'jane.doe@example.com',
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
  { 
    id: '2', 
    firstName: 'John', 
    lastName: 'Smith', 
    dob: '1970-11-23', 
    gender: 'male', 
    mrn: 'MRN-67890',
    phone: '555-0144',
    email: 'john.smith@example.com',
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
  { 
    id: '3', 
    firstName: 'Robert', 
    lastName: 'Johnson', 
    dob: '1992-02-28', 
    gender: 'male', 
    mrn: 'MRN-54321',
    phone: '555-0188',
    email: 'robert.j@example.com',
    problems: [
      { id: 'p5', code: 'M25.361', description: 'Instability, right knee', onsetDate: '2023-10-01', status: 'active' }
    ],
    allergies: [],
    activeMeds: []
  }
];

const DEFAULT_APPOINTMENTS: Appointment[] = [
  { id: 'apt-1', patientId: '1', providerId: 'dr_smith', date: '2026-06-15', time: '09:00', duration: 30, type: 'Follow-up', status: 'checked-in', reasonForVisit: 'Hypertension management' },
  { id: 'apt-2', patientId: '2', providerId: 'dr_smith', date: '2026-06-15', time: '09:45', duration: 15, type: 'Quick Check', status: 'scheduled', reasonForVisit: 'Medication refill' },
  { id: 'apt-3', patientId: '3', providerId: 'dr_smith', date: '2026-06-15', time: '10:30', duration: 45, type: 'Initial Consult', status: 'scheduled', reasonForVisit: 'Right knee instability' },
];

export const getPatients = (): Patient[] => {
  const saved = localStorage.getItem('emr_patients');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
  }
  // Initialize with defaults if empty
  localStorage.setItem('emr_patients', JSON.stringify(DEFAULT_PATIENTS));
  return DEFAULT_PATIENTS;
};

export const getPatientById = (id: string): Patient | undefined => {
  const patients = getPatients();
  return patients.find(p => p.id === id);
};

export const addPatient = (patientData: Omit<Patient, 'id'>): Patient => {
  const patients = getPatients();
  const newId = (patients.reduce((max, p) => Math.max(max, parseInt(p.id, 10) || 0), 0) + 1).toString();
  const newPatient: Patient = {
    ...patientData,
    id: newId,
    problems: [],
    allergies: [],
    activeMeds: []
  };
  const updated = [...patients, newPatient];
  localStorage.setItem('emr_patients', JSON.stringify(updated));
  triggerStorageEvent();
  return newPatient;
};

export const getAppointments = (): Appointment[] => {
  const saved = localStorage.getItem('emr_appointments');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
  }
  // Initialize with defaults if empty
  localStorage.setItem('emr_appointments', JSON.stringify(DEFAULT_APPOINTMENTS));
  return DEFAULT_APPOINTMENTS;
};

export const addAppointment = (aptData: Omit<Appointment, 'id'>): Appointment => {
  const appointments = getAppointments();
  const newId = `apt-${appointments.reduce((max, a) => Math.max(max, parseInt(a.id.replace('apt-', ''), 10) || 0), 0) + 1}`;
  const newApt: Appointment = {
    ...aptData,
    id: newId
  };
  const updated = [...appointments, newApt];
  localStorage.setItem('emr_appointments', JSON.stringify(updated));
  triggerStorageEvent();
  return newApt;
};

export const updateAppointmentStatus = (id: string, status: Appointment['status']): boolean => {
  const appointments = getAppointments();
  const idx = appointments.findIndex(a => a.id === id);
  if (idx !== -1) {
    appointments[idx].status = status;
    localStorage.setItem('emr_appointments', JSON.stringify(appointments));
    triggerStorageEvent();
    return true;
  }
  return false;
};

export const getVitals = (patientId: string): PatientVitals | undefined => {
  const saved = localStorage.getItem(`vitals_${patientId}`);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
  }
  return undefined;
};

export const saveVitals = (patientId: string, vitals: PatientVitals): void => {
  localStorage.setItem(`vitals_${patientId}`, JSON.stringify(vitals));
  
  // also add medical assistant info to the checklist or audit log if needed
  triggerStorageEvent();
};

export const clearAllDataStore = (): void => {
  localStorage.removeItem('emr_patients');
  localStorage.removeItem('emr_appointments');
  // clear vitals
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('vitals_')) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach(k => localStorage.removeItem(k));
  
  triggerStorageEvent();
};

// Helper to trigger standard 'storage' event so other tabs/listeners update of the same page
function triggerStorageEvent() {
  window.dispatchEvent(new Event('storage'));
}
