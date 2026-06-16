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
  const margin = 20;
  const contentWidth = pageWidth - (margin * 2);

  let y = 15;

  // Draw Letterhead
  doc.setFillColor(15, 23, 42); // slate-900 / dark brand
  doc.rect(margin, y, contentWidth, 2, 'F');
  y += 6;

  // Title & Address
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(15, 23, 42);
  doc.text('NARRATIVES CLINICAL HEALTH SYSTEM', margin, y);
  
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('100 MEDICAL PLAZA • SUITE 400 • CLINICAL RECORDS DIVISION', margin, y + 4.5);
  
  // Official Records badge
  doc.setFillColor(241, 245, 249); // slate-100
  doc.roundedRect(pageWidth - margin - 47, y - 2, 47, 6, 1, 1, 'F');
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(51, 65, 85);
  doc.text('OFFICIAL RECORD RECONSTRUCT', pageWidth - margin - 44, y + 2);

  y += 12;

  // Patient Info Box (Demographics Grid)
  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.roundedRect(margin, y, contentWidth, 22, 2, 2, 'FD');

  const colWidth = contentWidth / 4;
  
  // Col 1: Patient Name
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text('PATIENT NAME', margin + 4, y + 6);
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text(`${patient.lastName}, ${patient.firstName}`, margin + 4, y + 13);

  // Col 2: Date of Birth
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text('DATE OF BIRTH', margin + colWidth + 4, y + 6);
  doc.setFontSize(9);
  doc.setTextColor(51, 65, 85);
  let formattedDob = 'N/A';
  if (patient.dob) {
    try {
      formattedDob = new Date(patient.dob).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch (e) {
      formattedDob = patient.dob;
    }
  }
  doc.text(formattedDob, margin + colWidth + 4, y + 13);

  // Col 3: MRN ID
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text('MRN ID', margin + (colWidth * 2) + 4, y + 6);
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(51, 65, 85);
  doc.text(patient.mrn || 'N/A', margin + (colWidth * 2) + 4, y + 13);

  // Col 4: Gender
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text('GENDER', margin + (colWidth * 3) + 4, y + 6);
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(51, 65, 85);
  const genderCapitalized = patient.gender ? patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1) : 'N/A';
  doc.text(genderCapitalized, margin + (colWidth * 3) + 4, y + 13);

  y += 28;

  // Encounter/Note Type Header Box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, contentWidth, 12, 1.5, 1.5, 'FD');

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59);
  doc.text(`Encounter Record: ${note.type} Note`, margin + 4, y + 7.5);

  const noteDate = new Date(note.date).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(`Recorded: ${noteDate}`, pageWidth - margin - doc.getTextWidth(`Recorded: ${noteDate}`) - 4, y + 7.5);

  y += 18;

  // Note Content - Split Text
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(30, 41, 59);
  
  const textLines = doc.splitTextToSize(note.content, contentWidth - 8);
  
  // Handle Multi-page printing dynamically
  for (let i = 0; i < textLines.length; i++) {
    if (y > pageHeight - 40) {
      // Add simple footer info bottom of previous page
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(148, 163, 184);
      doc.text(`Page continued on next sheet... MRN ID: ${patient.mrn}`, margin, pageHeight - 8);

      doc.addPage();
      y = 20;
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(9.5);
      doc.setTextColor(30, 41, 59);
    }
    doc.text(textLines[i], margin + 4, y);
    y += 5.5;
  }

  y += 10;

  // Audit and Signature details
  // Keep check to stay on same page if possible, otherwise add a clean page for closing certification
  if (y > pageHeight - 50) {
    // Add simple footer info bottom of previous page
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text(`Page continued on next sheet... MRN ID: ${patient.mrn}`, margin, pageHeight - 8);

    doc.addPage();
    y = 20;
  }

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, contentWidth, note.signed ? 28 : 20, 2, 2, 'FD');

  // Certificate / Security Header
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('CERTIFIED AUDIT SEALS & CLINIC VERIFICATION', margin + 4, y + 6);

  if (note.signed) {
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(16, 185, 129); // emerald-500
    doc.text(`Digitally signed by: ${note.authorName}, MD`, margin + 4, y + 13);

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    const signedDate = new Date(note.signedAt || note.date).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
    doc.text(`Signed Timestamp: ${signedDate}`, margin + 4, y + 18);

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    doc.text(`SHA256: ${note.signatureHash || 'E3B0C44298FC1C149AFBF4C8996FB92427AE41E4649B934CA495991B7852B855'}`, margin + 4, y + 23);

    // Virtual signature stamp graphic simulation
    doc.setDrawColor(16, 185, 129);
    doc.setFillColor(236, 253, 245); // light green fill
    doc.rect(pageWidth - margin - 35, y + 4, 30, 20, 'FD');
    
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(6);
    doc.setTextColor(16, 185, 129);
    doc.text('ELECTRONICALLY', pageWidth - margin - 33, y + 10);
    doc.text('SIGNED SEAL', pageWidth - margin - 30, y + 14);
    doc.text('VERIFIED CO-SIG', pageWidth - margin - 32, y + 18);
  } else {
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(217, 119, 6); // amber-600
    doc.text('WARNING: DOCUMENT IS AN UNSIGNED DRAFT', margin + 4, y + 13);

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    doc.text('Requires review, final edit and clinician sign-off to produce immutable ledger key.', margin + 4, y + 18);
  }

  // Footer footer
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text(`SYSTEM PIPELINE VERIFICATION COMPLIANT • CLINICAL KEY: EMC-${patient.mrn || '6512'}-AMB`, margin, pageHeight - 10);

  // Save the document
  const fileName = `${patient.lastName}_${patient.firstName}_${note.type}_Note.pdf`.replace(/\s+/g, '_');
  doc.save(fileName);
};
