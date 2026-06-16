import { useState, useEffect, useRef } from 'react';
import { usePersistentState } from '../../lib/usePersistentState';
import { Patient, Medication, ClinicalOrder } from '../../types';
import { ScreeningMessage, ExamManeuver, DoctorQuery } from './types';

export const AMBIENT_DEMO_LINES = [
  'Dr. Smith: "We should do some tests on your knee. Have you had any imaging recently?"',
  'Patient: "No, I had an ultrasound of my ankle last year but nothing on my knee. It feels like there is swelling."',
  'Dr. Smith: "I see. Let\'s schedule some routine laboratory bloodwork checkup, particularly a Hemoglobin A1c test to monitor sugar level trends."',
  'Patient: "Alright, and what about the pain? I can\'t sleep because it aches so much at night."',
  'Dr. Smith: "Good. For joint aching, let\'s prescribe you Meloxicam 15mg oral once daily."',
  'Patient: "Is there anything else I can do? Like exercises or stretches?"',
  'Dr. Smith: "To build extension range of motion, I will submit a Referral to Physical Therapy for rehabilitation exercises."',
  'Patient: "Thank you. Let\'s hope that works. Do you think we need an X-Ray?"',
  'Dr. Smith: "We should also get a standard X-Ray of the right knee (2 views) to inspect cartilage structures before surgery."',
  'Patient: "Okay, I\'ll do the bloodwork and physical therapy. Hopefully we\'ll know more soon."',
];

interface UseScribeStateProps {
  patient: Patient;
  onImportHpi: (hpiText: string) => void;
  onImportExam: (examText: string) => void;
  onAddMedication?: (med: Medication) => void;
  onAddOrder?: (order: ClinicalOrder) => void;
  activeMeds?: Medication[];
  orders?: ClinicalOrder[];
}

export function useScribeState({
  patient,
  onImportHpi,
  onImportExam,
  onAddMedication,
  onAddOrder,
  activeMeds = [],
  orders = []
}: UseScribeStateProps) {
  // Clinical Session Workflow State
  const [sessionPhase, setSessionPhase] = usePersistentState<'rooming' | 'transition' | 'visit' | 'review'>(
    `session_phase_${patient.id}`,
    (localStorage.getItem(`previsit_completed_${patient.id}`) === 'true') ? 'transition' : 'rooming'
  );

  // Audio / voice synthesizer state
  const [isMuted, setIsMuted] = useState(false);
  const [isRecording, setIsRecording] = useState(true);
  const [isListeningForInput, setIsListeningForInput] = useState(false);
  const [userInput, setUserInput] = useState('');
  const recognitionRef = useRef<any>(null);

  // Conversational voice / speed / pitch parameters
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState<string>('');
  const [speechRate, setSpeechRate] = useState<number>(0.92);
  const [speechPitch, setSpeechPitch] = useState<number>(1.04);
  const [showVoiceSettings, setShowVoiceSettings] = useState(false);

  // Visit Type Check
  const [isFollowUp, setIsFollowUp] = useState<boolean>(() => {
    const savedType = localStorage.getItem(`previsit_type_${patient.id}`);
    if (savedType) return savedType === 'Follow-up';
    return patient.id !== '3'; // Robert Johnson (3) is new, Jane Doe (1) and John Smith (2) are follow-ups
  });

  const screeningSteps = isFollowUp 
    ? [
        { key: 'chief_complaint', label: "Reason for Visit", prompt: `Welcome back, ${patient.firstName}! It is so wonderful to see you again. I am Nurse Carey, and I'll be checking you in today. What is the main reason for your visit today?` },
        { key: 'medical_changes', label: "Changes Since Prior Visit", prompt: "To make sure we have your up-to-date health details, have there been any changes in your medical condition, daily medications, or allergies since we last met?" }
      ]
    : [
        { key: 'chief_complaint', label: "Reason for Visit", prompt: `Hello there, ${patient.firstName}. I am Nurse Carey, and I'm so glad to assist with your check-in today. We want to take excellent care of you. What is the main reason for your visit today?` },
        { key: 'onset', label: "Onset & Timeline", prompt: "I'm so sorry you have to experience that. Could you tell me a bit more about when this problem or pain first started, and did it come on suddenly or gradually over time?" },
        { key: 'severity', label: "Severity (1-10)", prompt: "We want to make sure we're managing your pain as best as possible. On a scale of 1 to 10, where 10 is the worst pain imaginable, how would you rate your discomfort today?" },
        { key: 'history_pmh_psh_allergies', label: "PMH / PSH / Allergies", prompt: "Thank you for sharing that with me. Just so I can update your chart perfectly before the doctor comes in, could you please tell me about any past medical conditions, previous surgeries, and any allergies you might have?" }
      ];

  const [screeningStep, setScreeningStep] = usePersistentState<number>(
    `screening_step_${patient.id}`,
    0
  );

  const [screeningMessages, setScreeningMessages] = usePersistentState<ScreeningMessage[]>(
    `screening_messages_${patient.id}`,
    (() => {
      const initialText = isFollowUp 
        ? `Welcome back, ${patient.firstName}! It is so wonderful to see you again. I am Nurse Carey, and I'll be checking you in today. What is the main reason for your visit today?`
        : `Hello there, ${patient.firstName}. I am Nurse Carey, and I'm so glad to assist with your check-in today. We want to take excellent care of you. What is the main reason for your visit today?`;
      return [
        {
          sender: 'ai',
          text: initialText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ];
    })()
  );

  // Available voices setup
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const updateVoices = () => {
        const voicesList = window.speechSynthesis.getVoices();
        setAvailableVoices(voicesList);
        
        const englishVoices = voicesList.filter(v => v.lang.startsWith('en'));
        if (englishVoices.length > 0) {
          const preferredVoice = englishVoices.find(v => 
            v.name.includes('Samantha') || 
            v.name.includes('Aria') || 
            v.name.includes('Hazel') || 
            v.name.includes('Zira') || 
            v.name.includes('Google US English') ||
            v.name.includes('Microsoft Aria') ||
            v.name.includes('Natural') ||
            v.name.toLowerCase().includes('female')
          ) || englishVoices.find(v => v.lang === 'en-US') || englishVoices[0];

          if (preferredVoice) {
            setSelectedVoiceURI(preferredVoice.voiceURI);
          }
        }
      };

      updateVoices();
      window.speechSynthesis.onvoiceschanged = updateVoices;
      return () => {
        window.speechSynthesis.onvoiceschanged = null;
      };
    }
  }, []);

  const handleSendScreeningRef = useRef<any>(null);
  useEffect(() => {
    handleSendScreeningRef.current = handleSendScreening;
  });

  // Speech Recognition setup
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'en-US';

      rec.onstart = () => {
        setIsListeningForInput(true);
      };

      rec.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setUserInput(transcript);
          setTimeout(() => {
            if (handleSendScreeningRef.current) {
              handleSendScreeningRef.current(transcript);
            }
          }, 900);
        }
      };

      rec.onerror = (event: any) => {
        console.warn("Speech recognition error:", event.error);
        setIsListeningForInput(false);
      };

      rec.onend = () => {
        setIsListeningForInput(false);
      };

      recognitionRef.current = rec;
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {}
      }
    };
  }, []);

  // Voice output / Speech Synthesis helpers
  const speakVoicePrompt = (text: string, onEndCallback?: () => void) => {
    if (isMuted) {
      if (onEndCallback) {
        setTimeout(onEndCallback, 400);
      }
      return;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const clean = text.replace(/["'“”]/g, '');
      const utterance = new SpeechSynthesisUtterance(clean);
      
      const choice = availableVoices.find(v => v.voiceURI === selectedVoiceURI);
      if (choice) {
        utterance.voice = choice;
      }
      
      utterance.rate = speechRate;
      utterance.pitch = speechPitch;
      if (onEndCallback) {
        utterance.onend = () => {
          onEndCallback();
        };
      }
      window.speechSynthesis.speak(utterance);
    } else if (onEndCallback) {
      setTimeout(onEndCallback, 400);
    }
  };

  const speakAndListen = (text: string) => {
    speakVoicePrompt(text, () => {
      if (recognitionRef.current && !isMuted) {
        try {
          recognitionRef.current.start();
        } catch (e) {
          console.warn("Speech recognition auto-start blocked:", e);
        }
      }
    });
  };

  // Trigger TTS on initial rooming phase entry
  useEffect(() => {
    if (sessionPhase === 'rooming' && screeningStep === 0) {
      speakAndListen(screeningMessages[0].text);
    }
  }, [sessionPhase]);

  const toggleVoiceInput = () => {
    if (!recognitionRef.current) {
      alert("In-browser Speech-to-Text is not supported or permitted in this browser container. Please type or use the Simulate Voice buttons!");
      return;
    }

    if (isListeningForInput) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    } else {
      setUserInput('');
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleToggleVisitType = (newIsFollowUp: boolean) => {
    setIsFollowUp(newIsFollowUp);
    setScreeningStep(0);
    setUserInput('');
    const firstPrompt = newIsFollowUp 
      ? `Welcome back, ${patient.firstName}! It is so wonderful to see you again. I am Nurse Carey, and I'll be checking you in today. What is the main reason for your visit today?`
      : `Hello there, ${patient.firstName}. I am Nurse Carey, and I'm so glad to assist with your check-in today. We want to take excellent care of you. What is the main reason for your visit today?`;
    setScreeningMessages([
      {
        sender: 'ai',
        text: firstPrompt,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
    speakAndListen(firstPrompt);
  };

  // Transition & Doctor Entry
  const [isDoctorEntering, setIsDoctorEntering] = useState(false);

  // Visit Phase states
  const [consultTranscript, setConsultTranscript] = usePersistentState<string[]>(
    `consult_transcript_${patient.id}`,
    [
      `Dr. Smith: Hi ${patient.firstName}, good to see you today. I read the screening report. Let's look closer at your symptoms.`,
      "Patient: Yes, it is particularly uncomfortable today.",
      "Dr. Smith: Understood. Let's perform a physical assessment. Lean back and let your muscles fully relax..."
    ]
  );

  const [isSimulatingAmbient, setIsSimulatingAmbient] = useState(false);
  const [simulationIndex, setSimulationIndex] = useState(0);

  useEffect(() => {
    if (!isSimulatingAmbient) return;
    
    const interval = setInterval(() => {
      if (simulationIndex < AMBIENT_DEMO_LINES.length) {
        const text = AMBIENT_DEMO_LINES[simulationIndex];
        handleAddNewTranscriptLine(text);
        setSimulationIndex(prev => prev + 1);
      } else {
        setIsSimulatingAmbient(false);
        setSimulationIndex(0);
      }
    }, 4500);
    
    return () => clearInterval(interval);
  }, [isSimulatingAmbient, simulationIndex]);

  // Detected Orders
  const [detectedOrders, setDetectedOrders] = usePersistentState<Array<{
    id: string;
    type: 'lab' | 'imaging' | 'referral' | 'medication';
    name: string;
    details: string;
    status: 'detected' | 'approved' | 'declined';
    snippet: string;
  }>>(
    `detected_orders_${patient.id}`,
    [
      {
        id: 'det-1',
        type: 'imaging',
        name: 'MRI Right Knee (Non-Contrast)',
        details: 'Reason: Persistent right knee mechanical instability and positive Lachman. Evaluate ACL/meniscus.',
        status: 'detected',
        snippet: 'Dr. Smith: "Let\'s definitively get an MRI of your Right Knee to make sure there is no meniscus tear..."'
      },
      {
        id: 'det-2',
        type: 'medication',
        name: 'Celebrex (Celecoxib) 200mg',
        details: 'Dosage: 200mg orally once daily. Refills: 2. Indications: Right knee joint pain & swelling.',
        status: 'detected',
        snippet: 'Dr. Smith: "I\'ll prescribe Celebrex 200mg daily to reduce knee joint inflammation. Take it with meals."'
      }
    ]
  );

  // Handle ambient parsing of new transcript line
  const handleAddNewTranscriptLine = (text: string) => {
    setConsultTranscript(prev => [...prev, text]);
    const textLower = text.toLowerCase();
    
    if (textLower.includes('mri') || textLower.includes('x-ray') || textLower.includes('ultrasound') || textLower.includes('imaging') || textLower.includes('ct scan')) {
      let dName = "X-Ray Right Knee (2 Views)";
      let dDetails = "Indication: Evaluate joint space narrowing, subluxative shifts, or osteophytes.";
      let dType: 'lab' | 'imaging' | 'referral' | 'medication' = 'imaging';
      
      if (textLower.includes('mri')) {
        dName = "MRI Right Knee (Non-Contrast)";
        dDetails = "Indication: Assess status of ACL, PCL, collateral ligaments and meniscal integrity.";
      } else if (textLower.includes('ultrasound')) {
        dName = "Ultrasound Right Knee Joint";
        dDetails = "Indication: Fluid collection mapping or Baker's cyst check.";
      }

      const duplicate = detectedOrders.some(o => o.name.toLowerCase() === dName.toLowerCase());
      if (!duplicate) {
        setDetectedOrders(prev => [
          ...prev,
          {
            id: `det-img-${Date.now()}`,
            type: dType,
            name: dName,
            details: dDetails,
            status: 'detected',
            snippet: `${text}`
          }
        ]);
        speakVoicePrompt(`AI Assistant: Detected potential order recommendation for ${dName}.`);
      }
    }

    if (textLower.includes('labs') || textLower.includes('cmp') || textLower.includes('cbc') || textLower.includes('a1c') || textLower.includes('bloodwork') || textLower.includes('lipid')) {
      let dName = "Comprehensive Metabolic Panel (CMP)";
      let dDetails = "Indication: Routine metabolic monitoring of diabetic kidneys and electrolytes.";
      
      if (textLower.includes('a1c')) {
        dName = "Hemoglobin A1c";
        dDetails = "Indication: Regular glycemic log follow-up for diabetes mellitus type 2.";
      } else if (textLower.includes('lipid')) {
        dName = "Lipid Panel (Fasting)";
        dDetails = "Indication: Preventative atherosclerotic cardiovascular risk screening.";
      }

      const duplicate = detectedOrders.some(o => o.name.toLowerCase() === dName.toLowerCase());
      if (!duplicate) {
        setDetectedOrders(prev => [
          ...prev,
          {
            id: `det-lab-${Date.now()}`,
            type: 'lab',
            name: dName,
            details: dDetails,
            status: 'detected',
            snippet: `${text}`
          }
        ]);
        speakVoicePrompt(`AI Assistant: Detected potential clinical laboratory order for ${dName}.`);
      }
    }

    if (textLower.includes('refer') || textLower.includes('referral') || textLower.includes('physical therapy') || textLower.includes('sports med')) {
      let dName = "Referral to Physical Therapy";
      let dDetails = "Indication: Gait retraining, right knee flexion/extension manual alignment exercises.";
      
      if (textLower.includes('ortho')) {
        dName = "Referral to Orthopedic Surgery";
        dDetails = "Indication: Expert consult for joint subluxation and chronic knee instability.";
      }

      const duplicate = detectedOrders.some(o => o.name.toLowerCase() === dName.toLowerCase());
      if (!duplicate) {
        setDetectedOrders(prev => [
          ...prev,
          {
            id: `det-ref-${Date.now()}`,
            type: 'referral',
            name: dName,
            details: dDetails,
            status: 'detected',
            snippet: `${text}`
          }
        ]);
        speakVoicePrompt(`AI Assistant: Detected referral order request for ${dName}.`);
      }
    }

    if (textLower.includes('prescribe') || textLower.includes('medication') || textLower.includes('start') || textLower.includes('mg') || textLower.includes('celebrex') || textLower.includes('lipitor') || textLower.includes('meloxicam') || textLower.includes('ibuprofen') || textLower.includes('aspirin')) {
      let dName = "Celebrex (Celecoxib) 200mg";
      let dDetails = "Dosage: 200mg orally, Route: Oral, Freq: Daily, Qty: 30, Refills: 2. Take with meals.";
      
      if (textLower.includes('lipitor')) {
        dName = "Lipitor (Atorvastatin) 20mg";
        dDetails = "Dosage: 20mg, Route: Oral, Freq: At Bedtime, Qty: 90. Cardioprotection standard.";
      } else if (textLower.includes('meloxicam')) {
        dName = "Meloxicam 15mg";
        dDetails = "Dosage: 15mg, Route: Oral, Freq: Once daily, Qty: 30. For osteoarthritic knee ache.";
      } else if (textLower.includes('ibuprofen')) {
        dName = "Ibuprofen 600mg";
        dDetails = "Dosage: 600mg, Route: Oral, Freq: Every 6 hours as needed, Qty: 60. For edema.";
      } else if (textLower.includes('aspirin')) {
        dName = "Baby Aspirin (ASA) 81mg";
        dDetails = "Dosage: 81mg, Route: Oral, Freq: Daily with breakfast, Qty: 100. Routine antiplatelet protection.";
      }

      const duplicate = detectedOrders.some(o => o.name.toLowerCase() === dName.toLowerCase());
      if (!duplicate) {
        setDetectedOrders(prev => [
          ...prev,
          {
            id: `det-med-${Date.now()}`,
            type: 'medication',
            name: dName,
            details: dDetails,
            status: 'detected',
            snippet: `${text}`
          }
        ]);
        speakVoicePrompt(`AI Assistant: Ambient check detected medication order for ${dName}.`);
      }
    }
  };

  // Doctor Queries / Billing Suggestions
  const [billingQueries, setBillingQueries] = usePersistentState<DoctorQuery[]>(
    `billing_queries_${patient.id}`,
    [
      {
        id: 'bq1',
        question: "Inquire about exacerbating/relieving factors (flexion vs extension) to reach Level 4 Chief History elements.",
        suggestedAction: "Ask: 'Does the pain get worse with specific motions?'",
        category: 'billing',
        completed: false
      },
      {
        id: 'bq2',
        question: "Confirm current medication compliance for established hypertension treatment to support overall medical decision making (MDM).",
        suggestedAction: "Ask: 'Are you taking your Lisinopril consistently every morning?'",
        category: 'billing',
        completed: false
      },
      {
        id: 'bq3',
        question: "Document right knee joint effusion details or joint line tenderness to complete structural Orthopedic documentation.",
        suggestedAction: "Perform joint line palpation exam.",
        category: 'clinical',
        completed: false
      }
    ]
  );

  // Video Active Biomechanics Exam
  const [isVideoActive, setIsVideoActive] = usePersistentState<boolean>(
    `is_video_active_${patient.id}`,
    false
  );

  const [activeDetections, setActiveDetections] = usePersistentState<ExamManeuver[]>(
    `active_detections_${patient.id}`,
    [
      {
        id: 'em1',
        maneuver: 'Lachman Test (Right Knee)',
        detectedAt: '15:12:35',
        question: 'It looks like you performed a Lachman exam on the right knee. Was it positive (laxity or soft end-point)?',
        category: 'ortho'
      },
      {
        id: 'em2',
        maneuver: 'Chest Stethoscope Auscultation',
        detectedAt: '15:13:50',
        question: 'You did a stethoscope exam of the chest. Were there any abnormal crackles or lung findings detected?',
        category: 'cardio'
      }
    ]
  );

  // Handle rooming screening prompt replies
  const handleSendScreening = (text: string) => {
    if (!text.trim()) return;

    const patientMsg: ScreeningMessage = {
      sender: 'patient',
      text: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    const updatedMessages = [...screeningMessages, patientMsg];
    setScreeningMessages(updatedMessages);
    setUserInput('');

    const nextIdx = screeningStep + 1;
    if (nextIdx < screeningSteps.length) {
      setScreeningStep(nextIdx);
      const nextPromptStr = screeningSteps[nextIdx].prompt;
      
      setTimeout(() => {
        const aiPromptMsg: ScreeningMessage = {
          sender: 'ai',
          text: nextPromptStr,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setScreeningMessages(prev => [...prev, aiPromptMsg]);
        speakAndListen(nextPromptStr);
      }, 700);
    } else {
      setTimeout(() => {
        const exitText = "Thank you, I will let the doctor know you're ready.";
        setScreeningMessages(prev => [...prev, {
          sender: 'ai',
          text: exitText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]);
        speakVoicePrompt(exitText);

        const reasonText = updatedMessages.find((m, i) => Math.floor((i-1)/2) === 0 && m.sender === 'patient')?.text || "Not provided";
        let summaryText = "";

        if (isFollowUp) {
          const conditionText = updatedMessages.find((m, i) => Math.floor((i-1)/2) === 1 && m.sender === 'patient')?.text || "No changes reported";
          summaryText = `Follow-up Visit. Reason for visit: "${reasonText}". PRIOR CONDITION CHANGES: "${conditionText}". Prior medical records and current medications reviewed and verified.`;
        } else {
          const onsetText = updatedMessages.find((m, i) => Math.floor((i-1)/2) === 1 && m.sender === 'patient')?.text || "N/A";
          const severityText = updatedMessages.find((m, i) => Math.floor((i-1)/2) === 2 && m.sender === 'patient')?.text || "N/A";
          const historyText = updatedMessages.find((m, i) => Math.floor((i-1)/2) === 3 && m.sender === 'patient')?.text || "N/A";
          summaryText = `New Patient Consult. Reason for visit: "${reasonText}". ONSET: "${onsetText}". SEVERITY: ${severityText}/10. HISTORY/PMH/PSH/ALLERGIES: "${historyText}".`;
        }

        localStorage.setItem(`previsit_completed_${patient.id}`, 'true');
        localStorage.setItem(`previsit_summary_${patient.id}`, summaryText);
        localStorage.setItem(`previsit_type_${patient.id}`, isFollowUp ? 'Follow-up' : 'New Patient');

        window.dispatchEvent(new Event('storage'));
        setSessionPhase('transition');
      }, 950);
    }
  };

  const handleDoctorEntersRoom = () => {
    setIsDoctorEntering(true);
    speakVoicePrompt("Welcome, Doctor Smith. Pre-visit patient rooming screening is compiled and saved. Beginning real-time ambient visit consultation and video exam monitoring.");
    
    setTimeout(() => {
      setSessionPhase('visit');
      setIsDoctorEntering(false);
      setIsVideoActive(true);
    }, 1800);
  };

  const handleConfirmManeuver = (id: string, confirmed: boolean, findingsText: string) => {
    setActiveDetections(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, confirmed, findings: findingsText };
      }
      return item;
    }));

    const target = activeDetections.find(d => d.id === id);
    if (target) {
      speakVoicePrompt(`Acknowledged. Recorded ${target.maneuver} as ${findingsText}`);
    }
  };

  const toggleQueryCompleted = (id: string) => {
    setBillingQueries(prev => prev.map(q => {
      if (q.id === id) {
        return { ...q, completed: !q.completed };
      }
      return q;
    }));
  };

  // Compile entire combined Scribe note
  const getCompiledUnifiedNote = () => {
    const today = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    const patientName = `${patient.firstName} ${patient.lastName}`;
    const calculateAge = (dobString: string) => {
      const birthDate = new Date(dobString);
      if (isNaN(birthDate.getTime())) return 'N/A';
      const difference = Date.now() - birthDate.getTime();
      const ageDate = new Date(difference);
      return Math.abs(ageDate.getUTCFullYear() - 1970).toString();
    };
    const patientAge = calculateAge(patient.dob);

    let note = `==================================================\n`;
    note += `AMBIENT SCRIBE VISIT NOTE - ${today}\n`;
    note += `PATIENT: ${patientName} | AGE/SEX: ${patientAge} / ${patient.gender} | DOB: ${patient.dob}\n`;
    note += `PROVIDER: Dr. John Smith, MD\n`;
    note += `STATUS: Locked & Attested Ambient Record\n`;
    note += `==================================================\n\n`;

    note += `[PART 1: CLINICAL ASSISTANT PRE-VISIT ROOMING INTAKE]\n`;
    screeningMessages.forEach((msg, index) => {
      if (msg.sender === 'patient') {
        const stepNum = Math.floor((index - 1) / 2);
        if (stepNum >= 0 && stepNum < screeningSteps.length) {
          note += `• ${screeningSteps[stepNum].label}: "${msg.text}"\n`;
        } else {
          note += `• Response: "${msg.text}"\n`;
        }
      }
    });
    note += `\n`;

    note += `[PART 2: IN-VISIT PHYSICIAN DIALOGUE OVERVIEWS]\n`;
    consultTranscript.forEach(t => {
      note += `- ${t}\n`;
    });
    note += `\n`;

    note += `[PART 3: AI VIDEO MONITORING PHYSICAL EXAMINATION]\n`;
    activeDetections.forEach(d => {
      const statusStr = d.confirmed === undefined 
        ? "No confirmation provided" 
        : d.findings;
      note += `• ${d.maneuver}:\n  - Scribe Video Confidence: 99%\n  - Status: ${statusStr}\n`;
    });
    note += `\n`;

    note += `[PART 4: BILLING COMPLIANCE & COMPLEXITY MATRIX]\n`;
    const checkCount = activeDetections.filter(item => item.confirmed !== undefined).length;
    note += `- E/M MDM Level: ${checkCount >= 2 ? 'Level 4 (Moderate MDM Complexity)' : 'Level 3 (Low MDM Complexity)'}\n`;
    note += `- Interactive screening completed: Yes\n`;
    note += `- Physical exam biomechanical tracking validated: Yes\n`;
    note += `\n--------------------------------------------------\n`;
    note += `ELECTRONICALLY SIGNED BY: Dr. John Smith, MD (Via Ambient Narrative Scribe Engine)\n`;

    return note;
  };

  return {
    sessionPhase,
    setSessionPhase,
    isMuted,
    setIsMuted,
    isRecording,
    setIsRecording,
    isListeningForInput,
    userInput,
    setUserInput,
    availableVoices,
    selectedVoiceURI,
    setSelectedVoiceURI,
    speechRate,
    setSpeechRate,
    speechPitch,
    setSpeechPitch,
    showVoiceSettings,
    setShowVoiceSettings,
    isFollowUp,
    setIsFollowUp,
    screeningStep,
    setScreeningStep,
    screeningSteps,
    screeningMessages,
    setScreeningMessages,
    isDoctorEntering,
    consultTranscript,
    setConsultTranscript,
    isSimulatingAmbient,
    setIsSimulatingAmbient,
    simulationIndex,
    setSimulationIndex,
    detectedOrders,
    setDetectedOrders,
    billingQueries,
    setBillingQueries,
    activeDetections,
    setActiveDetections,
    isVideoActive,
    setIsVideoActive,
    speakVoicePrompt,
    speakAndListen,
    toggleVoiceInput,
    handleToggleVisitType,
    handleSendScreening,
    handleDoctorEntersRoom,
    handleConfirmManeuver,
    toggleQueryCompleted,
    handleAddNewTranscriptLine,
    getCompiledUnifiedNote
  };
}
