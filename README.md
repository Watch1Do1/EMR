# Narrative EMR — Clinician-First Ambient Scribe Co-Pilot

A clinician-first, narrative-centric, chart-focused Electronic Medical Record (EMR) designed for speed, clarity, and trust. This EMR centers around clinical narratives and an immersive **AI Scribe Co-Pilot** that optimizes workflows from pre-visit intake to in-visit exam capture and real-time E/M coding level suggestions.

---

## 🚀 Key Design Principles & Vision

1. **The Chart is a View, Not the Source of Truth:**
   Modern EMRs fail because they treat flat forms as the schema. The Narrative EMR treats the chart timeline as a fluid visual window onto the underlying data.
2. **One-Click Immutable Export:**
   Physical charts can be printed, exported, or finalized instantly with zero layout breakage.
3. **No Tech-Larping / Screen Clutter:**
   We strictly enforce honest clinical workflows—no simulated telemetry lines or terminal logs—focusing purely on clean, legible Inter/Geist fonts, generous negative spaces, and light-slate high-contrast borders.

---

## 🛠️ Minimal Viable EMR Feature Map

### 🔒 Layer 0 — Foundational (Non‑Negotiable)
- **Role-Based Workflows:** Profiles tailored for MD, PA, MA, and Admin roles.
- **Auditing & Locking:** Robust HIPAA-grade audit trails documenting every `view`, `edit`, and `sign` event.

### 📁 Layer 1 — Core Chart Model (PDF-like Scroll)
- **Longitudinal Timeline:** View historical encounters, labs, and medications chronologically.
- **Section Highlights:** Instantly collapse/expand problems, vitals, active medications, and recent history.

### 📝 Layer 2 — Core Clinical Documentation
- **Dot Phrases:** Interactive autocomplete system using rapid expansion codes (e.g., `.ros` for Review of Systems, `.pe` for Physical Exam, `.norm` for standard follow-ups) directly in the Note Editor.
- **Draft Copy-Forwarding:** Seamlessly copy structured Scribe notes directly into new follow-up notes.

---

## 🧠 Scribe Co-Pilot Integration (Current & Future Scope)

### 1. Pre-Visit AI Intaker (Rooming Helper)
- **Clinic Flow:** Before the physician enters, the roomer/medical assistant starts the intake. The tablet is handed to the patient.
- **Audio-Visual Feedback:** Playable text-to-speech engine speaks naturally to the patient, prompting them for their chief complaint, onset details, and pain severity.
- **One-Click HPI Note:** Automatically compiles a narrative History of Present Illness (HPI) following clinical guidelines, ready to be copied forward directly into the physician's visit draft.

### 2. In-Visit Webcam Biomechanical Exam Capture
- **Physical Exam Tracking:** Uses an ambient audio-visual capture stream to trace a physician's diagnostic movements (e.g., Orthopedic joint testing like the Lachman knee laxity maneuver, or thoracic chest examinations).
- **Voice / Tap Confirmation:** After recognizing the gesture, the AI prompts the physician to confirm findings:
  * *"It looks like you performed a Lachman test on the right knee. Was it positive?"*
- **Auto-Auscultation Synthesis:** Validates stethoscope positioning and records abnormal findings with a single confirmation.

### 3. Billing Complexity & Medical Decision Making (MDM) Optimizer
- **Live Scoring Sidebar:** Computes E/M coding criteria in real-time.
- **Dynamic Prompts:** Shows visual alerts while the scribe is actively listening to guide the provider to higher-value clinical questions (e.g., matching requirements for a Level 4 or Level 5 diagnostic code):
  - *Add onset duration details to satisfy Level 4 billing.*
  - *Document 3+ physical exam regions to satisfy compliance.*

---

## 🏗️ Technical Architecture

- **Front-End:** React 19, Vite, Tailwind CSS.
- **Iconorgaphy:** Clean, minimal feather icons via `lucide-react`.
- **Animations:** Direct, smooth micro-state changes using Tailwind transitions.
- **Auditing engine:** Integrated logging matching medical requirements.
