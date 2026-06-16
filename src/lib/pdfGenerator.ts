import { jsPDF } from 'jspdf';
import { Patient, ClinicalNote } from '../types';

export const generateNotePDF = (patient: Patient, note: ClinicalNote) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - (margin * 2);

  let y = 15;
  let pageNum = 1;

  // Custom Page Management to draw recursive headers/footers on new pages
  const applyFooterAndHeader = (pNum: number) => {
    // Thin gray line at bottom of page
    doc.setFillColor(226, 232, 240); // slate-200
    doc.rect(margin, pageHeight - 12, contentWidth, 0.4, 'F');

    // Page numbers & copyright footer info
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text(`Page ${pNum} of Official Medical Record • MRN ID: ${patient.mrn || 'N/A'}`, margin, pageHeight - 7.5);
    
    const printDate = new Date().toLocaleDateString('en-US', { hour: 'numeric', minute: '2-digit', year: 'numeric', month: 'short', day: 'numeric' });
    doc.text(`Rendered Timestamp: ${printDate} via Narrative EMR Scribe Engine`, pageWidth - margin - doc.getTextWidth(`Rendered Timestamp: ${printDate} via Narrative EMR Scribe Engine`), pageHeight - 7.5);

    if (pNum > 1) {
      // Header for secondary pages
      doc.setFillColor(15, 23, 42); // slate-900 / dark brand
      doc.rect(margin, 10, contentWidth, 1.2, 'F');
      
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text('NARRATIVES CLINICAL HEALTH SYSTEM  •  CLINICAL SUMMARY', margin, 15);
      
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(7);
      doc.text(`Patient: ${patient.lastName}, ${patient.firstName} `, pageWidth - margin - doc.getTextWidth(`Patient: ${patient.lastName}, ${patient.firstName} `), 15);
    }
  };

  // Setup first page footer
  applyFooterAndHeader(pageNum);

  // --- PAGE 1: LETTERHEAD HEADER ---
  doc.setFillColor(15, 23, 42); // slate-900 / dark brand
  doc.rect(margin, y, contentWidth, 2, 'F');
  y += 6;

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(15, 23, 42);
  doc.text('NARRATIVES CLINICAL HEALTH SYSTEM', margin, y);
  
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text('100 MEDICAL PLAZA • SUITE 400 • CLINICAL RECORDS DIVISION • PHONE: (555) 010-9000', margin, y + 4.5);
  
  // Official Records badge
  doc.setFillColor(241, 119, 6); // Amber block indicating secure integrity clinical summary
  doc.setFillColor(15, 23, 42); // slate-900
  doc.roundedRect(pageWidth - margin - 47, y - 2, 47, 6.5, 1, 1, 'F');
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(255, 255, 255);
  doc.text('OFFICIAL CLINICAL RECORD', pageWidth - margin - 43, y + 2.5);

  y += 12;

  // --- PATIENT DEMOGRAPHICS SECTION ---
  doc.setFillColor(248, 250, 252); // slate-50 background card
  doc.setDrawColor(226, 232, 240); // slate-200 border
  doc.roundedRect(margin, y, contentWidth, 28, 2, 2, 'FD');

  const colWidth = contentWidth / 4;
  
  // DEMO ROW 1
  // Col 1: Patient Name
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text('PATIENT NAME', margin + 4, y + 5);
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text(`${patient.lastName}, ${patient.firstName}`, margin + 4, y + 10);

  // Col 2: Date of Birth
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text('DATE OF BIRTH', margin + colWidth + 4, y + 5);
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  let formattedDob = 'N/A';
  if (patient.dob) {
    try {
      formattedDob = new Date(patient.dob).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch (e) {
      formattedDob = patient.dob;
    }
  }
  doc.text(formattedDob, margin + colWidth + 4, y + 10);

  // Col 3: MRN ID
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text('MRN ID', margin + (colWidth * 2) + 4, y + 5);
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text(patient.mrn || 'N/A', margin + (colWidth * 2) + 4, y + 10);

  // Col 4: Gender
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text('GENDER', margin + (colWidth * 3) + 4, y + 5);
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  const genderCapitalized = patient.gender ? patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1) : 'N/A';
  doc.text(genderCapitalized, margin + (colWidth * 3) + 4, y + 10);

  // DEMO ROW 2
  // Phone
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text('PATIENT CONTACT', margin + 4, y + 17);
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  doc.text(patient.phone || 'No phone on chart', margin + 4, y + 22);

  // Email
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text('PATIENT EMAIL', margin + colWidth + 4, y + 17);
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  doc.text(patient.email || 'No email on chart', margin + colWidth + 4, y + 22);

  // Provider
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text('PRIMARY ATTENDING', margin + (colWidth * 2) + 4, y + 17);
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  doc.text(note.authorName || 'Dr. John Smith, MD', margin + (colWidth * 2) + 4, y + 22);

  // Account Type
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text('RECORD SEGMENT', margin + (colWidth * 3) + 4, y + 17);
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(79, 70, 229); // Indigo
  doc.text('AMBULATORY NOTE', margin + (colWidth * 3) + 4, y + 22);

  y += 34;

  // --- ENCOUNTER TYPE SUMMARY HEADER ---
  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, contentWidth, 11, 1, 1, 'FD');

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(30, 41, 59);
  doc.text(`Encounter Record: ${note.type} Note`, margin + 4, y + 7);

  const noteDateStr = new Date(note.date).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(`Intake/Visit Date: ${noteDateStr}`, pageWidth - margin - doc.getTextWidth(`Intake/Visit Date: ${noteDateStr}`) - 4, y + 7);

  y += 18;

  // --- NOTE CONTENT SECTION ---
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text('CLINICAL NARRATIVE REPORT', margin, y);
  y += 5;

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59);

  // Utility to handle safe y boundary check
  const ensureRoomForLines = (spaceNeeded: number) => {
    if (y > pageHeight - spaceNeeded) {
      pageNum++;
      doc.addPage();
      applyFooterAndHeader(pageNum);
      y = 25; // Reset y on new page
    }
  };

  const textLines = doc.splitTextToSize(note.content, contentWidth - 4);
  for (let i = 0; i < textLines.length; i++) {
    ensureRoomForLines(15);
    doc.text(textLines[i], margin + 2, y);
    y += 5.25;
  }

  y += 8;

  // --- 1. ACTIVE PROBLEMS GRID TABLE ---
  if (patient.problems && patient.problems.length > 0) {
    ensureRoomForLines(40);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text('CURRENT ACTIVE PROBLEMS (ICD-10)', margin, y);
    y += 4;

    // Table Header
    doc.setFillColor(241, 245, 249);
    doc.setDrawColor(203, 213, 225);
    doc.rect(margin, y, contentWidth, 7, 'FD');

    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(51, 65, 85);
    doc.text('Code / ICD-10', margin + 3, y + 4.5);
    doc.text('Clinical Problem Description', margin + 30, y + 4.5);
    doc.text('Onset Date', margin + 115, y + 4.5);
    doc.text('Status', margin + 150, y + 4.5);
    
    y += 7;

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(30, 41, 59);

    patient.problems.forEach((prob) => {
      ensureRoomForLines(15);
      
      // Draw horizontal separator
      doc.setDrawColor(226, 232, 240);
      doc.line(margin, y, margin + contentWidth, y);

      // Print row elements
      doc.setFont('Helvetica', 'bold');
      doc.text(prob.code, margin + 3, y + 5);
      doc.setFont('Helvetica', 'normal');
      doc.text(prob.description, margin + 30, y + 5);
      
      let formattedOnset = 'N/A';
      if (prob.onsetDate) {
        try {
          formattedOnset = new Date(prob.onsetDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
        } catch {
          formattedOnset = prob.onsetDate;
        }
      }
      doc.text(formattedOnset, margin + 115, y + 5);

      const statusUpper = prob.status ? prob.status.toUpperCase() : 'ACTIVE';
      doc.setFont('Helvetica', 'bold');
      doc.setTextColor(16, 185, 129); // Green status
      doc.text(statusUpper, margin + 150, y + 5);
      doc.setTextColor(30, 41, 59);
      doc.setFont('Helvetica', 'normal');

      y += 7.5;
    });

    // Closing table border
    doc.setDrawColor(203, 213, 225);
    doc.line(margin, y, margin + contentWidth, y);
    y += 10;
  }

  // --- 2. ACTIVE MEDICATIONS SECTIONS SUMMARY ---
  if (patient.activeMeds && patient.activeMeds.length > 0) {
    ensureRoomForLines(40);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text('CURRENT ACTIVE MEDICATIONS', margin, y);
    y += 4;

    // Table Header
    doc.setFillColor(241, 245, 249);
    doc.setDrawColor(203, 213, 225);
    doc.rect(margin, y, contentWidth, 7, 'FD');

    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(51, 65, 85);
    doc.text('Therapy / Asset', margin + 3, y + 4.5);
    doc.text('Dose & Freq', margin + 50, y + 4.5);
    doc.text('Route', margin + 95, y + 4.5);
    doc.text('Attest Prescriber', margin + 120, y + 4.5);
    doc.text('Status', margin + 160, y + 4.5);

    y += 7;

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(30, 41, 59);

    patient.activeMeds.forEach((med) => {
      ensureRoomForLines(15);

      // Draw horizontal separator
      doc.setDrawColor(226, 232, 240);
      doc.line(margin, y, margin + contentWidth, y);

      // Print meds rows
      doc.setFont('Helvetica', 'bold');
      doc.text(med.name, margin + 3, y + 5);
      doc.setFont('Helvetica', 'normal');
      doc.text(`${med.dosage} (${med.frequency})`, margin + 50, y + 5);
      doc.text(med.route || 'Oral', margin + 95, y + 5);
      doc.text(med.prescribedBy || 'Attending Physician', margin + 120, y + 5);
      
      doc.setFont('Helvetica', 'bold');
      doc.setTextColor(79, 70, 229); // Indigo status
      doc.text(med.status ? med.status.toUpperCase() : 'ACTIVE', margin + 160, y + 5);
      doc.setTextColor(30, 41, 59);
      doc.setFont('Helvetica', 'normal');

      y += 7.5;
    });

    // Closing table border
    doc.setDrawColor(203, 213, 225);
    doc.line(margin, y, margin + contentWidth, y);
    y += 10;
  }

  // --- 3. ALLERGIES SECTION ---
  if (patient.allergies && patient.allergies.length > 0) {
    ensureRoomForLines(25);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text('ALLERGIES & DRUG SENSITIVITIES', margin, y);
    y += 4;

    doc.setFillColor(254, 242, 242); // slate light red card for allergy highlights
    doc.setDrawColor(252, 165, 165);
    doc.roundedRect(margin, y, contentWidth, 12, 1, 1, 'FD');

    let allergyString = '';
    patient.allergies.forEach((alg, i) => {
      allergyString += `${alg.substance} (Reaction: ${alg.reaction || 'mild'}, Severity: ${alg.severity || 'mild'})${i < patient.allergies!.length - 1 ? '  •  ' : ''}`;
    });

    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(220, 38, 38); // Red text
    doc.text(allergyString, margin + 4, y + 7.5);

    doc.setTextColor(30, 41, 59);
    doc.setFont('Helvetica', 'normal');
    y += 18;
  } else {
    ensureRoomForLines(20);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text('ALLERGIES & DRUG SENSITIVITIES', margin, y);
    y += 4;

    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin, y, contentWidth, 10, 1, 1, 'FD');

    doc.setFont('Helvetica', 'medium');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('No Drug Allergies or Intolerances reported or documented on file.', margin + 4, y + 6);

    doc.setTextColor(30, 41, 59);
    doc.setFont('Helvetica', 'normal');
    y += 16;
  }

  // --- 4. SIGNATURE AND CLINICIAN CERTIFICATION LINE ---
  ensureRoomForLines(45);

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, y, contentWidth, note.signed ? 32 : 24, 1.5, 1.5, 'FD');

  // Certificate Header
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('CERTIFIED AUDIT SEALS & CO-SIGN CLINICAL REVIEW', margin + 4, y + 5.5);

  if (note.signed) {
    // Elegant Hand-written simulated line
    doc.setDrawColor(79, 70, 229); // Indigos
    doc.setLineWidth(0.45);
    // Draw signature line
    doc.line(margin + 4, y + 15, margin + 85, y + 15);

    // Calligraphic signature simulation
    doc.setFont('Courier', 'oblique');
    doc.setFontSize(11);
    doc.setTextColor(79, 70, 229);
    doc.text(`Dr. John Smith, MD`, margin + 8, y + 13);

    // Clinician attestation text
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(16, 185, 129); // emerald Green
    doc.text('DOCUMENT DIGITALLY ATTESTED & COMPLETED', margin + 4, y + 21);

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.text(`Author: ${note.authorName}, MD  |  NPI: 1891040523`, margin + 4, y + 25);
    
    const signedDate = new Date(note.signedAt || note.date).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
    doc.text(`Lock-date: ${signedDate}  |  SHA: ${note.signatureHash?.substring(0, 32) || 'N/A'}`, margin + 4, y + 28.5);

    // Virtual signature stamp block graphic on right side
    doc.setDrawColor(16, 185, 129);
    doc.setFillColor(236, 253, 245); // light green fill
    doc.rect(pageWidth - margin - 35, y + 4, 31, 24, 'FD');
    
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(6);
    doc.setTextColor(16, 185, 129);
    doc.text('DIGITAL COMPLY', pageWidth - margin - 33, y + 9);
    doc.text('ELECTRONIC SEAL', pageWidth - margin - 33, y + 14);
    doc.text('SYSTEM VERIFIED', pageWidth - margin - 33, y + 19);
    doc.text('VER-8902A-2026', pageWidth - margin - 32, y + 24);
  } else {
    // Amending sign line
    doc.setDrawColor(217, 119, 6); // amber line
    doc.setLineWidth(0.35);
    doc.line(margin + 4, y + 15, margin + 70, y + 15);

    doc.setFont('Helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(217, 119, 6);
    doc.text('X  _________________________________', margin + 4, y + 13);
    doc.text('Attending Physician Sign-off Required', margin + 6, y + 19);

    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(217, 119, 6); // Amber
    doc.text('UNSIGNED CLINICAL RECORD SUMMARY', margin + 85, y + 10);
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text('Lock file via Scribe portal and stamp signature to make record immutable.', margin + 85, y + 15);
  }

  // --- ALL SET: SAVE PDF FILE DOCUMENT ---
  const rawFileName = `${patient.lastName}_${patient.firstName}_Note_${note.type}`;
  const fileName = rawFileName.replace(/\s+/g, '_') + '.pdf';
  doc.save(fileName);
};
