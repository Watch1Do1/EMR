import { Patient, Medication, ClinicalOrder } from '../../types';

export interface ScreeningMessage {
  sender: 'ai' | 'patient';
  text: string;
  timestamp: string;
}

export interface ExamManeuver {
  id: string;
  maneuver: string;
  detectedAt: string;
  confirmed?: boolean;
  question: string;
  findings?: string;
  category: 'ortho' | 'cardio' | 'misc';
}

export interface DoctorQuery {
  id: string;
  question: string;
  suggestedAction: string;
  category: 'billing' | 'clinical';
  completed: boolean;
}

export interface ScreeningStep {
  key: string;
  label: string;
  prompt: string;
}
