/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum UserRole {
  MD = 'MD',
  PA = 'PA',
  MA = 'MA',
  BILLING = 'billing',
  ADMIN = 'admin',
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  npi?: string;
}

export interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  dob: string;
  gender: 'male' | 'female' | 'other';
  mrn: string;
  phone?: string;
  email?: string;
  problems?: Problem[];
  allergies?: Allergy[];
  activeMeds?: Medication[];
}

export interface Problem {
  id: string;
  code: string; // ICD-10
  description: string;
  onsetDate: string;
  status: 'active' | 'resolved' | 'inactive';
}

export interface Allergy {
  id: string;
  substance: string;
  reaction: string;
  severity: 'mild' | 'moderate' | 'severe';
}

export interface Medication {
  id: string;
  name: string;
  dosage: string;
  route: string;
  frequency: string;
  startDate: string;
  stopDate?: string;
  prescribedBy: string;
  status: 'active' | 'discontinued' | 'completed';
}

export enum NoteType {
  INITIAL = 'Initial Visit',
  FOLLOW_UP = 'Follow-up',
  PROCEDURE = 'Procedure',
  OPERATIVE = 'Operative Note',
}

export interface ClinicalNote {
  id: string;
  patientId: string;
  encounterId?: string;
  type: NoteType;
  date: string;
  authorId: string;
  authorName: string;
  content: string; // Markdown or structured JSON
  signed: boolean;
  signedAt?: string;
  amended?: boolean;
  originalNoteId?: string;
  signatureHash?: string;
}

export enum OrderType {
  LAB = 'Lab',
  IMAGING = 'Imaging',
  REFERRAL = 'Referral',
}

export enum OrderStatus {
  ORDERED = 'Ordered',
  SENT = 'Sent',
  COMPLETED = 'Completed',
  RESULTED = 'Resulted',
  REVIEWED = 'Reviewed',
}

export interface ClinicalOrder {
  id: string;
  patientId: string;
  type: OrderType;
  description: string;
  date: string;
  providerId: string;
  status: OrderStatus;
  result?: ClinicalResult;
}

export interface ClinicalResult {
  id: string;
  orderId: string;
  date: string;
  value: string;
  units?: string;
  range?: string;
  abnormal: boolean;
  flagged: boolean;
  reviewed: boolean;
  reviewedBy?: string;
  reviewedAt?: string;
  fileUrl?: string; // For PDFs/Images
}

export interface Appointment {
  id: string;
  patientId: string;
  providerId: string;
  date: string;
  time: string;
  duration: number; // minutes
  type: string;
  status: 'scheduled' | 'checked-in' | 'completed' | 'cancelled';
  reasonForVisit: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userEmail: string;
  action: 'view' | 'edit' | 'sign' | 'delete' | 'login' | 'print';
  entityType: 'patient' | 'note' | 'order' | 'result' | 'user';
  entityId: string;
  details?: string;
}
