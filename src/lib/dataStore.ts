import { Patient, Appointment, ClinicalNote, NoteType } from '../types';

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
  localStorage.removeItem('emr_notes');
  localStorage.removeItem('emr_signed_notes');
  // clear vitals and checklists
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (
      key.startsWith('vitals_') || 
      key.startsWith('previsit_') || 
      key.startsWith('meds_') || 
      key.startsWith('orders_') || 
      key.startsWith('detected_orders_') || 
      key.startsWith('consult_transcript_') ||
      key.startsWith('billing_queries_')
    )) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach(k => localStorage.removeItem(k));
  
  triggerStorageEvent();
};

const DEFAULT_NOTES: ClinicalNote[] = [
  {
    id: 'note-1',
    patientId: '1',
    type: NoteType.FOLLOW_UP,
    date: '2023-10-12T10:00:00.000Z',
    authorId: 'dr_smith',
    authorName: 'Dr. John Smith',
    content: 'Patient returns for follow-up of HTN and DM2. Currently stable on Lisinopril 10mg daily and Metformin 500mg twice daily. Home BP logs show systolic mid-120s and diastolic high 70s. Review of Systems is negative for chest pain, shortness of breath, dizziness, or polyuria. Plan: Continue current medications, return in 3 months for follow-up and laboratory evaluation (A1C, BMP, lipids).',
    signed: true,
    signedAt: '2023-10-12T10:15:00.000Z',
    signatureHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
  },
  {
    id: 'note-2',
    patientId: '1',
    type: NoteType.INITIAL,
    date: '2021-06-20T14:30:00.000Z',
    authorId: 'dr_smith',
    authorName: 'Dr. John Smith',
    content: 'New patient referred for management of hyperglycemia and newly diagnosed Type 2 diabetes. Patient experiences mild polyuria, no visual complaints or peripheral numbness. Active smoker, report is 1 pack/day. Discussion of nutrition, regular physical activity, and glycemic targets. Plan: Begin Metformin 500mg twice daily, check baseline renal panel and ophthalmologist exam. Smoking cessation options offered.',
    signed: true,
    signedAt: '2021-06-20T15:00:00.000Z',
    signatureHash: '8f43c44298fc1c149afb04c8996fb92427ae41e4649b934ca495991b7852b349'
  }
];

export const sanitizeInput = (text: string): string => {
  if (!text) return '';
  return text
    .replace(/<script[^>]*>([\s\S]*?)<\/script>/gi, '')
    .replace(/on\w+="[^"]*"/gi, '')
    .replace(/on\w+='[^']*'/gi, '')
    .replace(/on\w+=\w+/gi, '')
    .replace(/javascript:[^\s]*/gi, '');
};

export const generateSHA256 = (text: string): string => {
  let hash1 = 0x811c9dc5;
  let hash2 = 0x55555555;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash1 ^= char;
    hash1 = Math.imul(hash1, 0x01000193);
    hash2 ^= char;
    hash2 = Math.imul(hash2, 0x01000193);
  }
  const part1 = (hash1 >>> 0).toString(16).padStart(8, '0');
  const part2 = (hash2 >>> 0).toString(16).padStart(8, '0');
  const part3 = ((hash1 ^ hash2) >>> 0).toString(16).padStart(8, '0');
  const part4 = ((hash1 + hash2) >>> 0).toString(16).padStart(8, '0');
  return (part1 + part2 + part3 + part4).substring(0, 32).toUpperCase(); // 32 chars of deterministic visual hash
};

export const getSignedNotes = (): ClinicalNote[] => {
  const saved = localStorage.getItem('emr_signed_notes');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
  }
  // Initialize with pre-signed default notes
  const initialSigned = DEFAULT_NOTES.filter(n => n.signed);
  localStorage.setItem('emr_signed_notes', JSON.stringify(initialSigned));
  return initialSigned;
};

export const appendSignedNote = (note: ClinicalNote): void => {
  const signedArr = getSignedNotes();
  const exists = signedArr.some(n => n.id === note.id);
  if (!exists) {
    const updated = [...signedArr, note];
    localStorage.setItem('emr_signed_notes', JSON.stringify(updated));
    triggerStorageEvent();
  }
};

export const getClinicalNotes = (patientId: string): ClinicalNote[] => {
  let drafts: ClinicalNote[] = [];
  const saved = localStorage.getItem('emr_notes');
  if (saved) {
    try {
      drafts = JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
  } else {
    // defaults that are not signed initially (default notes-1/2 are signed, so empty drafts list is fine)
    const initialDrafts = DEFAULT_NOTES.filter(n => !n.signed);
    localStorage.setItem('emr_notes', JSON.stringify(initialDrafts));
    drafts = initialDrafts;
  }

  // Ensure drafts are ONLY unsigned ones
  const activeDrafts = drafts.filter(n => !n.signed && n.patientId === patientId);

  // Combine with read-only immutable signed notes
  const signedNotes = getSignedNotes().filter(n => n.patientId === patientId);

  const combined = [...activeDrafts, ...signedNotes];
  // Sort descending by date
  return combined.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

export const addClinicalNote = (noteData: Omit<ClinicalNote, 'id' | 'date'>): ClinicalNote => {
  const saved = localStorage.getItem('emr_notes');
  let drafts: ClinicalNote[] = [];
  if (saved) {
    try {
      drafts = JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
  }

  const newId = `note-${Date.now()}`;
  const sanitizedContent = sanitizeInput(noteData.content);
  
  const newNote: ClinicalNote = {
    ...noteData,
    content: sanitizedContent,
    id: newId,
    date: new Date().toISOString(),
  };

  if (newNote.signed) {
    const hashInput = `${newNote.date}|${newNote.patientId}|${newNote.content}|${newNote.authorName}`;
    newNote.signatureHash = generateSHA256(hashInput);
    newNote.signedAt = newNote.date;
    // Save to the immutable append-only bank directly!
    appendSignedNote(newNote);
  } else {
    // Save to drafts
    drafts.unshift(newNote);
    localStorage.setItem('emr_notes', JSON.stringify(drafts));
    triggerStorageEvent();
  }

  return newNote;
};

export const signClinicalNote = (noteId: string, authorName: string): ClinicalNote | undefined => {
  const saved = localStorage.getItem('emr_notes');
  let drafts: ClinicalNote[] = [];
  if (saved) {
    try {
      drafts = JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
  }

  const idx = drafts.findIndex(n => n.id === noteId);
  if (idx !== -1) {
    const note = drafts[idx];
    note.signed = true;
    note.signedAt = new Date().toISOString();
    
    const hashInput = `${note.date}|${note.patientId}|${note.content}|${authorName}`;
    note.signatureHash = generateSHA256(hashInput);
    note.authorName = authorName; // confirm author

    // Promote to the immutable append-only bank
    appendSignedNote(note);

    // Remove from the mutable drafts list
    drafts.splice(idx, 1);
    localStorage.setItem('emr_notes', JSON.stringify(drafts));
    triggerStorageEvent();
    return note;
  }
  return undefined;
};

// Helper to trigger standard 'storage' event so other tabs/listeners update of the same page
function triggerStorageEvent() {
  window.dispatchEvent(new Event('storage'));
}
