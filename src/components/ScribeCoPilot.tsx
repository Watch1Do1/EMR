import { useState, useEffect, useRef } from 'react';
import { 
  Camera, 
  Mic, 
  Play, 
  Square, 
  Sparkles, 
  HelpCircle, 
  CheckCircle, 
  TrendingUp, 
  Trash2, 
  ClipboardCopy, 
  UserCheck, 
  Check, 
  AlertCircle,
  Volume2,
  VolumeX,
  Stethoscope,
  ChevronRight,
  ArrowRight,
  User,
  Heart,
  Activity,
  Award,
  Video,
  Printer,
  Settings
} from 'lucide-react';
import { cn } from '../lib/utils';
import { Patient, Medication, ClinicalOrder, OrderType, OrderStatus } from '../types';

function formatDate(dateStr: string) {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  } catch (e) {
    return dateStr;
  }
}

interface ScribeCoPilotProps {
  patient: Patient;
  onImportHpi: (hpiText: string) => void;
  onImportExam: (examText: string) => void;
  onAddMedication?: (med: Medication) => void;
  onAddOrder?: (order: ClinicalOrder) => void;
  activeMeds?: Medication[];
  orders?: ClinicalOrder[];
}

interface ScreeningMessage {
  sender: 'ai' | 'patient';
  text: string;
  timestamp: string;
}

interface ExamManeuver {
  id: string;
  maneuver: string;
  detectedAt: string;
  confirmed?: boolean;
  question: string;
  findings?: string;
  category: 'ortho' | 'cardio' | 'misc';
}

interface DoctorQuery {
  id: string;
  question: string;
  suggestedAction: string;
  category: 'billing' | 'clinical';
  completed: boolean;
}

export function ScribeCoPilot({ 
  patient, 
  onImportHpi, 
  onImportExam,
  onAddMedication,
  onAddOrder,
  activeMeds = [],
  orders = []
}: ScribeCoPilotProps) {
  // Clinical Session Workflow State
  // 'rooming' -> Assistant / Roomer starts pre-visit screening with the patient
  // 'transition' -> Screening finished, waiting/notifying for doctor to enter
  // 'visit' -> Physician entered, active ambient scribe & visual exam tracking
  // 'review' -> Note generation, formatting, and audit trial preview
  const [sessionPhase, setSessionPhase] = useState<'rooming' | 'transition' | 'visit' | 'review'>(() => {
    const saved = localStorage.getItem(`session_phase_${patient.id}`);
    if (saved === 'rooming' || saved === 'transition' || saved === 'visit' || saved === 'review') {
      return saved as 'rooming' | 'transition' | 'visit' | 'review';
    }
    const isCompleted = localStorage.getItem(`previsit_completed_${patient.id}`) === 'true';
    if (isCompleted) {
      return 'transition';
    }
    return 'rooming';
  });

  useEffect(() => {
    localStorage.setItem(`session_phase_${patient.id}`, sessionPhase);
  }, [sessionPhase, patient.id]);

  // Audio / voice synthesizer state
  const [isMuted, setIsMuted] = useState(false);
  const [isRecording, setIsRecording] = useState(true);
  const [isListeningForInput, setIsListeningForInput] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Conversational voice / speed / pitch parameters
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState<string>('');
  const [speechRate, setSpeechRate] = useState<number>(0.92); // 0.92 is slightly slower and more conversational/empathetic!
  const [speechPitch, setSpeechPitch] = useState<number>(1.04);
  const [showVoiceSettings, setShowVoiceSettings] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const updateVoices = () => {
        const voicesList = window.speechSynthesis.getVoices();
        setAvailableVoices(voicesList);
        
        // Find best local empathetic voice (Google US English, Samantha, Aria, Zira, etc.)
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
          // Conversational flow: automatically submit transcribed voice responses after a premium 900ms visual buffer
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

  // 1. Rooming Screening States & Config
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

  const [screeningStep, setScreeningStep] = useState<number>(() => {
    const saved = localStorage.getItem(`screening_step_${patient.id}`);
    if (saved !== null) {
      const parsed = parseInt(saved, 10);
      if (!isNaN(parsed)) return parsed;
    }
    return 0;
  });

  useEffect(() => {
    localStorage.setItem(`screening_step_${patient.id}`, screeningStep.toString());
  }, [screeningStep, patient.id]);

  const [userInput, setUserInput] = useState('');
  
  const [screeningMessages, setScreeningMessages] = useState<ScreeningMessage[]>(() => {
    const saved = localStorage.getItem(`screening_messages_${patient.id}`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
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
  });

  useEffect(() => {
    localStorage.setItem(`screening_messages_${patient.id}`, JSON.stringify(screeningMessages));
  }, [screeningMessages, patient.id]);

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

  // 2. Doctor Entry / Transition state
  const [isDoctorEntering, setIsDoctorEntering] = useState(false);

  // 3. active physician consultation / ambient dialogue state
  const [consultTranscript, setConsultTranscript] = useState<string[]>(() => {
    const saved = localStorage.getItem(`consult_transcript_${patient.id}`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return [
      `Dr. Smith: Hi ${patient.firstName}, good to see you today. I read the screening report. Let's look closer at your symptoms.`,
      "Patient: Yes, it is particularly uncomfortable today.",
      "Dr. Smith: Understood. Let's perform a physical assessment. Lean back and let your muscles fully relax..."
    ];
  });

  const [isSimulatingAmbient, setIsSimulatingAmbient] = useState(false);
  const [simulationIndex, setSimulationIndex] = useState(0);

  const AMBIENT_DEMO_LINES = [
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

  useEffect(() => {
    localStorage.setItem(`consult_transcript_${patient.id}`, JSON.stringify(consultTranscript));
  }, [consultTranscript, patient.id]);

  useEffect(() => {
    if (!isSimulatingAmbient) return;
    
    // Periodically append a line of dialogue that naturally mimics clinic interaction and triggers order extractions
    const interval = setInterval(() => {
      if (simulationIndex < AMBIENT_DEMO_LINES.length) {
        const text = AMBIENT_DEMO_LINES[simulationIndex];
        handleAddNewTranscriptLine(text);
        setSimulationIndex(prev => prev + 1);
      } else {
        setIsSimulatingAmbient(false);
        setSimulationIndex(0);
      }
    }, 4500); // 4.5 seconds for snappier demo engagement
    
    return () => clearInterval(interval);
  }, [isSimulatingAmbient, simulationIndex]);

  // 3b. Detected ambient orders and medications
  const [detectedOrders, setDetectedOrders] = useState<Array<{
    id: string;
    type: 'lab' | 'imaging' | 'referral' | 'medication';
    name: string;
    details: string;
    status: 'detected' | 'approved' | 'declined';
    snippet: string;
  }>>(() => {
    const saved = localStorage.getItem(`detected_orders_${patient.id}`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return [
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
    ];
  });

  useEffect(() => {
    localStorage.setItem(`detected_orders_${patient.id}`, JSON.stringify(detectedOrders));
  }, [detectedOrders, patient.id]);

  // Handle ambient parsing of new transcript line
  const handleAddNewTranscriptLine = (text: string) => {
    setConsultTranscript(prev => [...prev, text]);
    
    // Auto scanning text for orders
    const textLower = text.toLowerCase();
    
    // MRI / X-Ray / CT scans
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

    // Labs (CMP, A1c, Blood)
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

    // Referrals (PT, Ortho, Rehab)
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

    // Meds / Prescriptions (Celebrex, Lipitor, Lisinopril, Advil, etc)
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

  // Billing complexity suggestions showing dynamically during physician visit
  const [billingQueries, setBillingQueries] = useState<DoctorQuery[]>(() => {
    const saved = localStorage.getItem(`billing_queries_${patient.id}`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return [
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
    ];
  });

  useEffect(() => {
    localStorage.setItem(`billing_queries_${patient.id}`, JSON.stringify(billingQueries));
  }, [billingQueries, patient.id]);

  // 4. Physical Exam Maneuver Capture (Webcam Simulation)
  const [isVideoActive, setIsVideoActive] = useState(() => {
    return localStorage.getItem(`is_video_active_${patient.id}`) === 'true';
  });

  useEffect(() => {
    localStorage.setItem(`is_video_active_${patient.id}`, isVideoActive ? 'true' : 'false');
  }, [isVideoActive, patient.id]);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [lastExamDetected, setLastExamDetected] = useState<string>('');
  const [activeDetections, setActiveDetections] = useState<ExamManeuver[]>(() => {
    const saved = localStorage.getItem(`active_detections_${patient.id}`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return [
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
    ];
  });

  useEffect(() => {
    localStorage.setItem(`active_detections_${patient.id}`, JSON.stringify(activeDetections));
  }, [activeDetections, patient.id]);

  // Custom text-to-speech speak utility
  const speakVoicePrompt = (text: string, onEndCallback?: () => void) => {
    if (isMuted) {
      if (onEndCallback) {
        setTimeout(onEndCallback, 400);
      }
      return;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      // Clean clean text
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

  // Trigger TTS on Phase transitions or rooming step changes
  useEffect(() => {
    if (sessionPhase === 'rooming' && screeningStep === 0) {
      speakAndListen(screeningMessages[0].text);
    }
  }, [sessionPhase]);

  // Handle webcam feed when visit phase and camera is enabled
  useEffect(() => {
    let stream: MediaStream | null = null;
    if (isVideoActive && videoRef.current && sessionPhase === 'visit') {
      navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 240 } })
        .then(s => {
          stream = s;
          if (videoRef.current) {
            videoRef.current.srcObject = s;
          }
        })
        .catch(err => {
          console.warn("Camera hardware access failed or denied. Launching interactive visual override.", err);
        });
    } else {
      if (videoRef.current && videoRef.current.srcObject) {
        const s = videoRef.current.srcObject as MediaStream;
        s.getTracks().forEach(track => track.stop());
      }
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isVideoActive, sessionPhase]);

  // simulated visual tracking skeletal system
  useEffect(() => {
    let animationId: number;
    let frames = 0;

    const drawGridTracking = () => {
      if (!canvasRef.current || !isVideoActive || sessionPhase !== 'visit') return;
      const ctx = canvasRef.current.getContext('2d');
      if (!ctx) return;

      frames++;
      ctx.clearRect(0, 0, 320, 240);

      // Render digital lens targets
      ctx.strokeStyle = 'rgba(59, 130, 246, 0.25)';
      ctx.lineWidth = 1;
      for (let i = 0; i < 320; i += 30) {
        ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 240); ctx.stroke();
      }
      for (let j = 0; j < 240; j += 30) {
        ctx.beginPath(); ctx.moveTo(0, j); ctx.lineTo(320, j); ctx.stroke();
      }

      // Pulse circle indicating knee joints or stethoscope placement
      const cycle = Math.sin(frames * 0.1) * 4;
      
      // Draw joint line
      ctx.fillStyle = 'rgba(239, 68, 68, 0.7)';
      ctx.beginPath();
      ctx.arc(140, 110, 6 + cycle, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(140, 110, 12 + cycle, 0, Math.PI * 2);
      ctx.stroke();

      // Skeletal bone simulation
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(140, 50);
      ctx.lineTo(140, 110);
      ctx.lineTo(130, 190);
      ctx.stroke();

      // Text status overlay tracking
      ctx.font = '10px monospace';
      ctx.fillStyle = '#ef4444';
      ctx.fillText("[DETECTED: INTRA-EXAM MANEUVER]", 10, 25);
      ctx.fillStyle = '#3b82f6';
      ctx.fillText("BIOMECHANIC R-KNEE: LACHMAN ACTIVE", 10, 38);
      ctx.fillText("TARGET CONFIDENCE: 98.4%", 10, 51);

      animationId = requestAnimationFrame(drawGridTracking);
    };

    if (isVideoActive && sessionPhase === 'visit') {
      animationId = requestAnimationFrame(drawGridTracking);
    }
    return () => cancelAnimationFrame(animationId);
  }, [isVideoActive, sessionPhase]);

  // Handle rooming screening prompt replies
  const handleSendScreening = (text: string) => {
    if (!text.trim()) return;

    // Save patient message
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
      // Completed pre-visit patient rooming screening
      setTimeout(() => {
        const exitText = "Thank you, I will let the doctor know you're ready.";
        setScreeningMessages(prev => [...prev, {
          sender: 'ai',
          text: exitText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]);
        speakVoicePrompt(exitText);

        // Formulate pre-visit clinical report summary
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

        // Dispatch storage event so other views refresh immediately
        window.dispatchEvent(new Event('storage'));

        // Advance to transitional stage waiting for the MD to enter
        setSessionPhase('transition');
      }, 950);
    }
  };

  // Simulate physician entering room
  const handleDoctorEntersRoom = () => {
    setIsDoctorEntering(true);
    speakVoicePrompt("Welcome, Doctor Smith. Pre-visit patient rooming screening is compiled and saved. Beginning real-time ambient visit consultation and video exam monitoring.");
    
    setTimeout(() => {
      setSessionPhase('visit');
      setIsDoctorEntering(false);
      setIsVideoActive(true); // Automatically trigger visual exam tracking on doctor entry
    }, 1800);
  };

  // Perform orthopedic or cardiac confirmation response
  const handleConfirmManeuver = (id: string, confirmed: boolean, findingsText: string) => {
    setActiveDetections(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, confirmed, findings: findingsText };
      }
      return item;
    }));

    // Voice synthesize confirmation
    const target = activeDetections.find(d => d.id === id);
    if (target) {
      speakVoicePrompt(`Acknowledged. Recorded ${target.maneuver} as ${findingsText}`);
    }
  };

  // Complete billing query checking
  const toggleQueryCompleted = (id: string) => {
    setBillingQueries(prev => prev.map(q => {
      if (q.id === id) {
        return { ...q, completed: !q.completed };
      }
      return q;
    }));
  };

  // Compile entire combined Scribe note including Pre-Visit, consultation and Exam details
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

    // 1. Pre-Visit Rooming Screening
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

    // 2. Physician Consultation Ambient Dialogue Excerpts
    note += `[PART 2: IN-VISIT PHYSICIAN DIALOGUE OVERVIEWS]\n`;
    consultTranscript.forEach(t => {
      note += `- ${t}\n`;
    });
    note += `\n`;

    // 3. Physical Examination Biomechanical Detections
    note += `[PART 3: AI VIDEO MONITORING PHYSICAL EXAMINATION]\n`;
    activeDetections.forEach(d => {
      const statusStr = d.confirmed === undefined 
        ? "No confirmation provided" 
        : d.findings;
      note += `• ${d.maneuver}:\n  - Scribe Video Confidence: 99%\n  - Status: ${statusStr}\n`;
    });
    note += `\n`;

    // 4. Clinical Coding Summary
    note += `[PART 4: BILLING COMPLIANCE & COMPLEXITY MATRIX]\n`;
    const checkCount = activeDetections.filter(item => item.confirmed !== undefined).length;
    note += `- E/M MDM Level: ${checkCount >= 2 ? 'Level 4 (Moderate MDM Complexity)' : 'Level 3 (Low MDM Complexity)'}\n`;
    note += `- Interactive screening completed: Yes\n`;
    note += `- Physical exam biomechanical tracking validated: Yes\n`;
    note += `\n--------------------------------------------------\n`;
    note += `ELECTRONICALLY SIGNED BY: Dr. John Smith, MD (Via Ambient Narrative Scribe Engine)\n`;

    return note;
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-md flex flex-col h-[650px] transition-all">
      
      {/* Clinician-first Header */}
      <header className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between no-print border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
            <Sparkles className="animate-pulse" size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm tracking-tight">Narrative EMR Ambient Scribe</span>
              <span className="bg-indigo-900/60 text-indigo-200 border border-indigo-800 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase">
                {sessionPhase === 'rooming' && "Assistant Rooming"}
                {sessionPhase === 'transition' && "Ready for MD"}
                {sessionPhase === 'visit' && "MD Visit Live"}
                {sessionPhase === 'review' && "Note Synthesis"}
              </span>
            </div>
            <p className="text-[10px] text-slate-400">Integrated Medical Screening • Skeletal Exam Detection • Real-time Billing Copilot</p>
          </div>
        </div>

        {/* Audio control bars and speaker status */}
        <div className="flex items-center gap-3 relative">
          <button 
            onClick={() => setIsMuted(prev => !prev)}
            className={cn(
              "p-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors border",
              isMuted 
                ? "bg-slate-800/80 text-slate-400 border-slate-700 hover:text-white" 
                : "bg-blue-600/10 text-blue-400 border-blue-900 hover:bg-blue-600/20"
            )}
            title={isMuted ? "Unmute Scribe Voice Responses" : "Mute Scribe Audio"}
          >
            {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
            <span>Voice Speech</span>
          </button>

          <button 
            onClick={() => setShowVoiceSettings(prev => !prev)}
            className={cn(
              "p-2 rounded-lg text-xs font-semibold flex items-center justify-center transition-colors border",
              showVoiceSettings 
                ? "bg-slate-700 text-slate-100 border-slate-600" 
                : "bg-slate-800/80 text-slate-400 border-slate-700 hover:text-white hover:bg-slate-700/50"
            )}
            title="Voice & Speech Settings"
          >
            <Settings size={15} />
          </button>

          {showVoiceSettings && (
            <div className="absolute right-0 top-12 w-72 bg-slate-900 border border-slate-750 rounded-xl shadow-2xl p-4 z-50 text-slate-200">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
                <span className="font-bold text-xs uppercase tracking-wider text-slate-300">Intake Voice Panel</span>
                <button 
                  onClick={() => setShowVoiceSettings(false)}
                  className="text-slate-500 hover:text-slate-300 text-xs px-1"
                >
                  Close
                </button>
              </div>

              {/* Voice selection */}
              <div className="space-y-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wide">Select Nurse Voice</label>
                  <select
                    value={selectedVoiceURI}
                    onChange={(e) => {
                      setSelectedVoiceURI(e.target.value);
                      // Briefly test voice after choosing
                      setTimeout(() => {
                        speakVoicePrompt("Hello! I am Nurse Carey.");
                      }, 50);
                    }}
                    className="w-full text-xs bg-slate-950 border border-slate-700 text-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-blue-500 outline-none"
                  >
                    {availableVoices.filter(v => v.lang.startsWith('en')).map((v) => (
                      <option key={v.voiceURI} value={v.voiceURI}>
                        {v.name} ({v.lang})
                      </option>
                    ))}
                    {availableVoices.filter(v => v.lang.startsWith('en')).length === 0 && (
                      <option value="">System Default Voice</option>
                    )}
                  </select>
                </div>

                {/* Speed Rate Slider */}
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between items-center text-[10px] font-bold text-slate-450 uppercase tracking-wide">
                    <span>Speaking Speed</span>
                    <span className="font-mono text-blue-400 font-normal">{speechRate.toFixed(2)}x</span>
                  </div>
                  <input 
                    type="range"
                    min="0.75"
                    max="1.25"
                    step="0.05"
                    value={speechRate}
                    onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
                    className="w-full accent-blue-500 bg-slate-800 rounded-lg appearance-none h-1.5 cursor-pointer"
                  />
                  <div className="flex justify-between text-[8px] text-slate-500 font-mono">
                    <span>Empathetic & Slow</span>
                    <span>Conversational</span>
                  </div>
                </div>

                {/* Pitch Slider */}
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between items-center text-[10px] font-bold text-slate-450 uppercase tracking-wide">
                    <span>Tone & Pitch</span>
                    <span className="font-mono text-blue-400 font-normal">{speechPitch.toFixed(2)}</span>
                  </div>
                  <input 
                    type="range"
                    min="0.85"
                    max="1.20"
                    step="0.05"
                    value={speechPitch}
                    onChange={(e) => setSpeechPitch(parseFloat(e.target.value))}
                    className="w-full accent-blue-500 bg-slate-800 rounded-lg appearance-none h-1.5 cursor-pointer"
                  />
                  <div className="flex justify-between text-[8px] text-slate-500 font-mono">
                    <span>Deeper / Warm</span>
                    <span>Higher-toned</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => speakVoicePrompt("Hello! I am your care assistant, Nurse Carey. I'll guide you through your rooming step with empathy.")}
                  className="w-full py-1.5 text-center text-[11px] font-bold text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 rounded-lg border border-blue-500/30 transition-colors"
                >
                  Test Voice Tuning 🔊
                </button>
              </div>
            </div>
          )}

          {!isMuted && (
            <div className="flex items-center gap-1 bg-slate-800 px-2.5 py-1.5 rounded-lg border border-slate-700">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
              <span className="text-[10px] uppercase font-mono font-bold text-slate-300">TTS Active</span>
            </div>
          )}
        </div>
      </header>

      {/* Main Grid Wrapper with Workspace Split */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Section: Active Scribe Workflow Area */}
        <div className="flex-1 flex flex-col p-6 overflow-y-auto border-r border-slate-100 bg-white">
          
          {sessionPhase === 'rooming' && (
            /* PHASE 1: PRE-VISIT ROOMING SERVICE */
            <div className="flex-1 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl">
                  <div className="flex items-start gap-3">
                    <UserCheck className="text-blue-600 shrink-0 mt-0.5" size={18} />
                    <div className="flex-1">
                      <h4 className="font-bold text-sm text-slate-800">Caring Patient Intake Active</h4>
                      <p className="text-xs text-slate-500 mt-1">
                        Please hand this module to the patient. Nurse Carey will guide them through a conversational check-in, keeping them comfortable while mapping out their symptoms, timeline, and history.
                      </p>

                      {/* Visit Type Toggle */}
                      <div className="mt-4 pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
                        <span className="text-[11px] font-bold text-slate-650 uppercase tracking-wider">AI Intake Patient Status:</span>
                        <div className="flex bg-slate-200/70 p-0.5 rounded-lg border border-slate-300">
                          <button
                            type="button"
                            onClick={() => handleToggleVisitType(false)}
                            className={cn(
                              "px-3 py-1 rounded text-[10px] font-extrabold tracking-tight transition-all cursor-pointer",
                              !isFollowUp
                                ? "bg-blue-600 text-white shadow-sm"
                                : "text-slate-600 hover:text-slate-900"
                            )}
                          >
                            New Patient Consult
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleVisitType(true)}
                            className={cn(
                              "px-3 py-1 rounded text-[10px] font-extrabold tracking-tight transition-all cursor-pointer",
                              isFollowUp
                                ? "bg-blue-600 text-white shadow-sm"
                                : "text-slate-600 hover:text-slate-900"
                            )}
                          >
                            Established Follow-up
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Step status dots */}
                  <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-100">
                    <span className="text-[10px] font-bold uppercase text-slate-400 mr-2">Screening steps:</span>
                    {screeningSteps.map((step, idx) => (
                      <div 
                        key={step.key} 
                        className={cn(
                          "px-2.5 py-1 text-[10px] font-bold rounded-full border transition-all",
                          screeningStep === idx 
                            ? "bg-blue-600 text-white border-blue-500 shadow-sm animate-pulse" 
                            : screeningStep > idx 
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                              : "bg-slate-100 text-slate-400 border-slate-200"
                        )}
                      >
                        {step.label}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Screening Conversations Box */}
                <div className="space-y-3 max-h-[290px] overflow-y-auto pr-2">
                  {screeningMessages.map((msg, i) => (
                    <div 
                      key={i} 
                      className={cn(
                        "p-3 rounded-xl max-w-[85%] text-sm transition-all",
                        msg.sender === 'ai' 
                          ? "bg-indigo-50/70 text-slate-800 border border-indigo-100 self-start mr-auto font-serif italic" 
                          : "bg-blue-600 text-white self-end ml-auto shadow-sm"
                      )}
                    >
                      <p>{msg.text}</p>
                      <span className={cn("text-[9px] mt-1 block text-right", msg.sender === 'ai' ? "text-slate-400" : "text-blue-200")}>
                        {msg.timestamp}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action bar patient feedback */}
              <div className="space-y-2 mt-4 pt-4 border-t border-slate-150">
                {isListeningForInput && (
                  <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 text-rose-700 px-3 py-1.5 rounded-lg text-xs animate-pulse select-none self-start">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-455 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-600"></span>
                    </span>
                    <span className="font-extrabold font-mono text-[10px] uppercase tracking-wide">🎤 Continuous Microphone Dictation is active... Speak naturally now!</span>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    placeholder={isListeningForInput ? "My mic is active... Speak now!" : "Type symptoms response or click 'Talk to AI' to speak..."}
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSendScreening(userInput);
                    }}
                    className={cn(
                      "flex-1 border rounded-lg px-4 py-2.5 text-sm outline-none transition-all placeholder:italic",
                      isListeningForInput 
                        ? "bg-rose-50/40 border-rose-300 focus:ring-2 focus:ring-rose-500/10 focus:border-rose-450" 
                        : "bg-slate-50 border-slate-200 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    )}
                  />

                  {/* Dynamic Mic Rec Toggle */}
                  <button
                    type="button"
                    onClick={toggleVoiceInput}
                    className={cn(
                      "px-3.5 py-2.5 rounded-lg border text-xs font-bold transition-all flex items-center justify-center gap-1.5 shrink-0 cursor-pointer",
                      isListeningForInput 
                        ? "bg-rose-600 text-white border-rose-700 animate-pulse shadow-sm" 
                        : "bg-blue-50/50 text-blue-700 border-blue-200 hover:bg-blue-105"
                    )}
                    title={isListeningForInput ? "Cancel Mic Listening" : "Speak your answers out loud (Mic Active)"}
                  >
                    <Mic size={14} className={cn(isListeningForInput ? "text-white" : "text-blue-600")} />
                    <span>{isListeningForInput ? "Listening..." : "Talk to AI"}</span>
                  </button>

                  {/* Patient response simulator */}
                  <button 
                    type="button"
                    onClick={() => {
                      const presetAnswers = isFollowUp
                        ? [
                            "I am coming in today for my regular follow up of my chronic hypertension and to check my blood sugar. I also need refills on my Lisinopril and Metformin.",
                            "No significant changes since my last visit. My medical condition, active medications, and allergies are all exactly the same, and I feel stable."
                          ]
                        : [
                            "I am here because of some severe pain and instability in my right knee after pivot training last Saturday.",
                            "It started suddenly right after a pivot twist on Saturday night, and walking down stairs is particularly painful.",
                            "I rate the pain as a 7 out of 10 during active walking or when flexing the joint.",
                            "I have a surgical history of left ankle repair in 2020. No major chronic diseases, and my only allergy is Penicillin which causes moderate hives reactions."
                          ];
                      if (screeningStep < presetAnswers.length) {
                        const ans = presetAnswers[screeningStep];
                        setUserInput(ans);
                        // Conversational flow: auto-submit the simulated answer after a 900ms visual preview
                        setTimeout(() => {
                          handleSendScreening(ans);
                        }, 900);
                      }
                    }}
                    className="px-3 py-2 hover:bg-slate-50 border border-slate-200 text-slate-600 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 shrink-0"
                    title="Simulate Speech Dictation"
                  >
                    <span>Simulate Voice</span>
                  </button>

                  <button 
                    onClick={() => handleSendScreening(userInput)}
                    className="bg-blue-600 text-white font-bold text-xs px-5 py-2.5 rounded-lg hover:bg-blue-700 transition"
                  >
                    Submit
                  </button>
                </div>
              </div>
            </div>
          )}

          {sessionPhase === 'transition' && (
            /* PHASE 1.5: THE DOCTOR IS READY TO ENTER */
            <div className="flex-1 flex flex-col justify-center items-center text-center p-8 space-y-6 max-w-md mx-auto">
              <div className="w-16 h-16 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-500">
                <UserCheck size={32} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-800">Pre-Visit Screening Complete</h3>
                <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                  The rooming assistant has checked in {patient.firstName} {patient.lastName}. The EMR is awaiting physician entry to begin "Scribe Mode" ambient dialogue recording & mechanical exam tracking.
                </p>
              </div>

              {/* Screening summary breakdown */}
              <div className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-left space-y-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Intake Answers Logged</p>
                {screeningMessages.filter(m => m.sender === 'patient').map((m, i) => (
                  <p key={i} className="text-xs text-slate-705 truncate">
                    <span className="font-bold text-blue-600 mr-1.5">✓</span> {m.text}
                  </p>
                ))}
              </div>

              <button 
                onClick={handleDoctorEntersRoom}
                disabled={isDoctorEntering}
                className={cn(
                  "w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition duration-200 flex items-center justify-center gap-2 text-sm shadow-md",
                  isDoctorEntering && "bg-blue-500 opacity-90 cursor-not-allowed"
                )}
              >
                {isDoctorEntering ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    <span>Processing Doctor Entry...</span>
                  </>
                ) : (
                  <>
                    <span>🚪 PHYSICIAN ENTERS THE ROOM</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </div>
          )}

          {sessionPhase === 'visit' && (
            /* PHASE 2: PHYSICIAN ACTIVE AMBIENT VISIT SCRIBE */
            <div className="flex-1 flex flex-col justify-between">
              
              <div className="grid grid-cols-[1.2fr_1fr] gap-6 flex-1 min-h-0">
                
                {/* Visual Bio-Mechanic Exam Scribe */}
                <div className="space-y-4 flex flex-col">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                      <Video size={14} className="text-blue-500" />
                      Visual Examination Stream
                    </span>

                    <button 
                      onClick={() => setIsVideoActive(p => !p)}
                      className={cn(
                        "px-2 px-3 py-1 rounded text-[10px] font-bold transition-all border",
                        isVideoActive 
                          ? "bg-red-50 text-red-650 border-red-100 hover:bg-red-100" 
                          : "bg-slate-100 text-slate-650 border-slate-200 hover:bg-slate-200"
                      )}
                    >
                      {isVideoActive ? "Camera ON" : "Camera STBY"}
                    </button>
                  </div>

                  {/* Simulated exam biomechanical monitor panel */}
                  <div className="relative flex-1 bg-slate-950 rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center min-h-[190px]">
                    {isVideoActive ? (
                      <>
                        <video 
                          ref={videoRef} 
                          autoPlay 
                          playsInline 
                          muted 
                          className="absolute inset-0 w-full h-full object-cover opacity-60"
                        />
                        <canvas 
                          ref={canvasRef} 
                          width={320} 
                          height={240} 
                          className="absolute inset-0 w-full h-full pointer-events-none z-10"
                        />
                        <div className="absolute top-3 left-3 bg-red-650 text-white text-[9px] font-bold tracking-wider font-mono px-2 py-0.5 rounded flex items-center gap-1 animate-pulse shadow-sm">
                          <span className="w-1.5 h-1.5 rounded-full bg-white shrink-0" />
                          AMBIENT VISUAL ASSESS
                        </div>
                      </>
                    ) : (
                      <div className="text-center p-4 max-w-[200px]">
                        <Camera className="text-slate-550 mx-auto mb-2 opacity-50" size={24} />
                        <p className="text-xs text-slate-400 font-bold">Examiner Assist is Standby</p>
                        <p className="text-[10px] text-slate-500 mt-1 leading-normal">
                          Enable camera to start tracking knee maneuvers or thoracic auscultations automatically.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Ambient Dialogue Monitor */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-col space-y-2 max-h-[160px] overflow-auto">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                        <Mic size={11} className="text-indigo-500" />
                        Live Conversation stream
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          id="btn_toggle_ambient_simulation"
                          type="button"
                          onClick={() => {
                            setIsSimulatingAmbient(!isSimulatingAmbient);
                            if (!isSimulatingAmbient && simulationIndex === AMBIENT_DEMO_LINES.length) {
                              setSimulationIndex(0);
                            }
                          }}
                          className={cn(
                            "text-[8px] font-extrabold px-2 py-0.5 rounded border transition-all cursor-pointer flex items-center gap-0.5 uppercase select-none leading-none",
                            isSimulatingAmbient 
                              ? "bg-amber-50 text-amber-800 border-amber-300 animate-pulse" 
                              : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                          )}
                        >
                          ⚡ {isSimulatingAmbient ? "Simulating Audio..." : "Auto-Play Simulator"}
                        </button>
                        <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100 uppercase animate-pulse">Listening</span>
                      </div>
                    </div>

                    <div className="space-y-1.5 text-xs text-slate-600 leading-normal font-sans pr-1">
                      {consultTranscript.map((t, idx) => (
                        <p key={idx} className={idx === consultTranscript.length - 1 ? "font-semibold text-slate-800" : ""}>
                          {t}
                        </p>
                      ))}
                    </div>
                  </div>

                  {/* AI Ambient Order Extraction Desk */}
                  <div className="bg-white border border-slate-200 rounded-xl p-3.5 space-y-3 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 pb-0.5">
                        <Sparkles size={14} className="text-indigo-650 animate-pulse" />
                        <span className="font-bold text-xs uppercase tracking-tight text-slate-800">AI Scribe Assist Panel</span>
                      </div>
                      <span className="text-[9px] bg-slate-100 text-slate-500 font-bold px-1.5 py-0.5 rounded uppercase font-mono tracking-tight select-none">
                        Extractor Active
                      </span>
                    </div>

                    {/* Speech presets / typing */}
                    <div className="space-y-2">
                      <p className="text-[9px] font-bold text-slate-450 uppercase tracking-wider font-mono">Speak / Simulate Clinician orders</p>
                      <div className="flex flex-wrap gap-1">
                        <button 
                          onClick={() => handleAddNewTranscriptLine('Dr. Smith: "We should also get a standard X-Ray of the right knee (2 views) to inspect cartilage structures before surgery."')}
                          className="text-[9px] bg-indigo-50 border border-indigo-100 text-indigo-750 font-bold hover:bg-indigo-100 px-2 py-1.5 rounded transition cursor-pointer"
                        >
                          🗣️ "Order Knee X-Ray"
                        </button>
                        <button 
                          onClick={() => handleAddNewTranscriptLine('Dr. Smith: "Let\'s schedule some routine laboratory bloodwork checkup, particularly a Hemoglobin A1c test to monitor sugar level trends."')}
                          className="text-[9px] bg-indigo-50 border border-indigo-100 text-indigo-750 font-bold hover:bg-indigo-100 px-2 py-1.5 rounded transition cursor-pointer"
                        >
                          🗣️ "Order Hemoglobin A1c"
                        </button>
                        <button 
                          onClick={() => handleAddNewTranscriptLine('Dr. Smith: "To build extension range of motion, I will submit a Referral to Physical Therapy for rehabilitation exercises."')}
                          className="text-[9px] bg-indigo-50 border border-indigo-100 text-indigo-750 font-bold hover:bg-indigo-100 px-2 py-1.5 rounded transition cursor-pointer"
                        >
                          🗣️ "Refer to PT"
                        </button>
                        <button 
                          onClick={() => handleAddNewTranscriptLine('Dr. Smith: "Good. For joint aching, let\'s prescribe you Meloxicam 15mg oral once daily."')}
                          className="text-[9px] bg-indigo-50 border border-indigo-100 text-indigo-750 font-bold hover:bg-indigo-100 px-2 py-1.5 rounded transition cursor-pointer"
                        >
                          🗣️ "Prescribe Meloxicam"
                        </button>
                      </div>
                      
                      <div className="flex gap-1.5 pt-1.5">
                        <input 
                          type="text" 
                          placeholder="Or type custom statement e.g. 'I'll prescribe Lipitor 20mg'..."
                          id="voice-order-input-fld"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              const val = (e.target as HTMLInputElement).value;
                              if (val.trim()) {
                                handleAddNewTranscriptLine(`Dr. Smith: "${val}"`);
                                (e.target as HTMLInputElement).value = '';
                              }
                            }
                          }}
                          className="flex-1 text-[11px] bg-slate-50 border border-slate-200 outline-none px-2.5 py-1.5 rounded-lg focus:bg-white focus:ring-1 focus:ring-indigo-500/20"
                        />
                        <button 
                          onClick={() => {
                            const el = document.getElementById('voice-order-input-fld') as HTMLInputElement;
                            if (el && el.value.trim()) {
                              handleAddNewTranscriptLine(`Dr. Smith: "${el.value}"`);
                              el.value = '';
                            }
                          }}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] px-3.5 py-1.5 rounded-lg active:scale-95 transition"
                        >
                          Enter
                        </button>
                      </div>
                    </div>

                    {/* Queued extractions tracker */}
                    <div className="space-y-1.5 pt-2 border-t border-slate-100">
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest font-mono">Ambient Real-Time Extractor Queue</span>
                        <span className="text-[9px] bg-emerald-50 text-emerald-700 font-bold px-1.5 rounded-md border border-emerald-100">
                          {detectedOrders.length} Detections
                        </span>
                      </div>

                      <div className="space-y-1.5 max-h-[185px] overflow-y-auto pr-0.5">
                        {detectedOrders.map(det => (
                          <div 
                            key={det.id} 
                            className={cn(
                              "p-2 rounded-lg border text-xs relative overflow-hidden transition-all",
                              det.status === 'detected' 
                                ? "bg-slate-50 border-slate-200" 
                                : det.status === 'approved' 
                                  ? "bg-emerald-50/50 border-emerald-200" 
                                  : "bg-slate-100 border-slate-200 opacity-60 line-through"
                            )}
                          >
                            <div className="flex justify-between items-center pb-1">
                              <span className={cn(
                                "px-1.5 py-0.2 rounded text-[8px] font-bold uppercase tracking-tight",
                                det.type === 'medication' ? "bg-amber-100 text-amber-800" : "bg-blue-100 text-blue-800"
                              )}>
                                {det.type}
                              </span>
                              <span className="text-[8px] font-mono text-indigo-600 font-bold">Confidence: 96%</span>
                            </div>

                            <p className="font-bold text-slate-900 leading-tight text-xs">{det.name}</p>
                            <p className="text-[10px] text-slate-500 leading-snug">{det.details}</p>
                            <p className="text-[9px] text-slate-400 italic bg-white/75 p-1 rounded mt-1 border border-slate-100/50 block overflow-hidden text-ellipsis whitespace-nowrap"> Heard: {det.snippet} </p>

                            {det.status === 'detected' && (
                              <div className="flex gap-2 mt-2 pt-1.5 border-t border-slate-100">
                                <button 
                                  onClick={() => {
                                    setDetectedOrders(prev => prev.map(o => o.id === det.id ? { ...o, status: 'approved' } : o));
                                    
                                    // Persistent dispatch back upstream to clinical chart state
                                    if (det.type === 'medication' && onAddMedication) {
                                      onAddMedication({
                                        id: `m-${Date.now()}`,
                                        name: det.name,
                                        dosage: det.details.split('Dosage: ')[1]?.split(',')[0] || '1 tablet',
                                        route: 'oral',
                                        frequency: 'Daily',
                                        startDate: new Date().toISOString().split('T')[0],
                                        prescribedBy: 'Dr. John Smith, MD',
                                        status: 'active'
                                      });
                                    } else if (onAddOrder) {
                                      let mapType = OrderType.LAB;
                                      if (det.type === 'imaging') mapType = OrderType.IMAGING;
                                      else if (det.type === 'referral') mapType = OrderType.REFERRAL;

                                      onAddOrder({
                                        id: `o-${Date.now()}`,
                                        patientId: patient.id,
                                        type: mapType,
                                        description: det.name,
                                        date: new Date().toISOString().split('T')[0],
                                        providerId: 'dr_john_smith',
                                        status: OrderStatus.ORDERED
                                      });
                                    }
                                  }}
                                  className="flex items-center gap-1 text-[9px] bg-slate-900 hover:bg-slate-950 text-white font-bold px-2 py-1 rounded transition cursor-pointer"
                                >
                                  <Check size={10} />
                                  Approve & Add to Chart
                                </button>
                                <button 
                                  onClick={() => {
                                    setDetectedOrders(prev => prev.map(o => o.id === det.id ? { ...o, status: 'declined' } : o));
                                  }}
                                  className="text-[9px] border border-slate-200 hover:bg-slate-100 font-medium text-slate-550 px-2 py-1 rounded transition cursor-pointer"
                                >
                                  Decline
                                </button>
                              </div>
                            )}

                            {det.status === 'approved' && (
                              <div className="absolute top-1.5 right-1.5 flex items-center gap-1 text-emerald-700 bg-emerald-100/50 px-1 py-0.5 rounded text-[8px] font-bold">
                                <Check size={8} />
                                Approved
                              </div>
                            )}
                          </div>
                        ))}
                        {detectedOrders.length === 0 && (
                          <div className="p-4 text-center text-[11px] text-slate-400 italic">
                            No companion healthcare items have been voiced yet. Try saying "Let's prescribe Meloxicam" above.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                </div>

                {/* Exam detection confirmators */}
                <div className="space-y-3 flex flex-col min-h-0 overflow-y-auto">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                    Exam Detections & Confirmations
                  </span>

                  <div className="space-y-2.5">
                    {activeDetections.map(item => (
                      <div 
                        key={item.id} 
                        className={cn(
                          "p-3 rounded-lg border text-xs transition-colors",
                          item.confirmed === undefined 
                            ? "bg-amber-50/70 border-amber-250 hover:bg-amber-50" 
                            : item.confirmed 
                              ? "bg-red-55/10 border-red-200" 
                              : "bg-emerald-55/10 border-emerald-250"
                        )}
                      >
                        <p className="font-bold text-slate-800 flex items-center gap-1">
                          <Stethoscope size={13} className="text-blue-500 shrink-0" />
                          {item.maneuver}
                        </p>
                        
                        <p className="text-[11px] text-slate-600 mt-2 italic bg-white/40 p-1.5 rounded">
                          {item.question}
                        </p>

                        {item.confirmed === undefined ? (
                          <div className="flex gap-2 mt-3 pt-2 border-t border-slate-100">
                            <button
                              onClick={() => handleConfirmManeuver(
                                item.id, 
                                true, 
                                item.category === 'ortho' ? 'Positive lachman with abnormal joint laxity.' : 'Abnormal heart murmuring findings.'
                              )}
                              className="bg-white hover:bg-red-50 text-red-700 border border-slate-200 px-3 py-1 font-bold rounded-lg text-[10px] transition shadow-sm"
                            >
                              Yes (Abnormal)
                            </button>
                            <button 
                              onClick={() => handleConfirmManeuver(
                                item.id, 
                                false, 
                                'Negative (Normal exam findings, stable endpoint.)'
                              )}
                              className="bg-white hover:bg-emerald-50 text-emerald-700 border border-slate-200 px-3 py-1 font-bold rounded-lg text-[10px] transition shadow-sm"
                            >
                              No (Normal findings)
                            </button>
                          </div>
                        ) : (
                          <div className="mt-2.5 p-1.5 bg-white border border-slate-200 rounded flex items-center justify-between text-[11px]">
                            <span className="font-bold flex items-center gap-1 text-slate-700">
                              <CheckCircle size={12} className={item.confirmed ? "text-red-500" : "text-emerald-500"} />
                              Status: {item.confirmed ? 'Positive' : 'Normal'}
                            </span>
                            <span className="text-slate-500 text-[10px]">{item.findings}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Doctor Voice confirming helper info */}
                  <div className="bg-slate-100 rounded-lg p-2.5 text-[10px] text-slate-500 leading-normal border border-slate-200/60 mt-auto flex gap-1.5">
                    <HelpCircle size={14} className="shrink-0 text-slate-400 mt-0.5" />
                    <span>The AI prompts out loud following exams for instant validation. Check response options above or say normal to register.</span>
                  </div>

                </div>

              </div>

              {/* Visit Phase compilation triggers */}
              <div className="mt-4 pt-4 border-t border-slate-150 flex justify-between items-center bg-white">
                <div className="text-xs text-slate-500 flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-ping" />
                  <span>Ambient monitoring tracking active. Confirms recorded in note.</span>
                </div>
                
                <button 
                  onClick={() => {
                    setIsVideoActive(false);
                    setSessionPhase('review');
                  }}
                  className="bg-slate-900 text-white font-bold text-xs px-6 py-2.5 rounded-lg hover:bg-slate-800 transition duration-200 shadow flex items-center gap-1.5"
                >
                  <span>Generate Complete Chart Note</span>
                  <ArrowRight size={14} />
                </button>
              </div>

            </div>
          )}

          {sessionPhase === 'review' && (
            /* PHASE 3: FINAL CLINICAL NOTE SYNTHESIS AND CONFIRMATION */
            <div className="flex-1 flex flex-col justify-between">
              
              <div className="space-y-4">
                <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="text-emerald-600 shrink-0" size={18} />
                    <div>
                      <p className="text-xs font-bold text-emerald-800">Complete Chart Note Prepared!</p>
                      <p className="text-[10px] text-emerald-600 mt-0.5">Aggregated pre-visit screening history, clinician dialogues, and biomechanical orthopedic signs.</p>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => {
                      // Trigger fully unified copy to EMR notes
                      onImportHpi(getCompiledUnifiedNote());
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-sm transition-colors"
                  >
                    <ClipboardCopy size={13} />
                    Import Narrative to EMR
                  </button>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-inner font-mono text-xs bg-slate-50 p-4 leading-normal text-slate-700 h-[360px] overflow-y-auto">
                  <pre className="whitespace-pre-wrap font-sans">{getCompiledUnifiedNote()}</pre>
                </div>

                {/* Discharge Booklet & Printable Requisition Folder */}
                <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-sm no-print">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                        <Printer size={16} />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-slate-900">Patient Checkout & Requisitions Bundle</h4>
                        <p className="text-[11px] text-slate-500">Persistently captured items from this clinical encounter, prepared for physical printing.</p>
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => window.print()}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
                    >
                      <Printer size={13} />
                      Print All Patient Leaflets
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Prescriptions */}
                    <div className="border border-slate-150 rounded-lg p-3.5 bg-slate-50/50 space-y-2">
                      <div className="flex justify-between items-center mb-1 select-none">
                        <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider bg-amber-50 px-2 py-0.5 rounded border border-amber-100 font-mono">Prescription Pad</span>
                        <span className="text-xs font-bold text-slate-700">{detectedOrders.filter(o => o.type === 'medication' && o.status === 'approved').length} Active</span>
                      </div>
                      
                      <div className="space-y-1.5 max-h-[110px] overflow-y-auto">
                        {detectedOrders.filter(o => o.type === 'medication' && o.status === 'approved').map(med => (
                          <div key={med.id} className="text-xs bg-white border border-slate-200/80 p-2 rounded">
                            <p className="font-bold text-slate-900">{med.name}</p>
                            <p className="text-[10px] text-slate-550 italic mt-0.5">{med.details}</p>
                          </div>
                        ))}
                        {detectedOrders.filter(o => o.type === 'medication' && o.status === 'approved').length === 0 && (
                          <p className="text-[11px] text-slate-400 italic text-center py-2 select-none">No medications ordered in Scribe during this visit.</p>
                        )}
                      </div>
                    </div>

                    {/* Labs, Studies, & Referrals Booklet */}
                    <div className="border border-slate-150 rounded-lg p-3.5 bg-slate-50/50 space-y-2">
                      <div className="flex justify-between items-center mb-1 select-none">
                        <span className="text-[10px] font-bold text-blue-800 uppercase tracking-wider bg-blue-50 px-2 py-0.5 rounded border border-blue-100 font-mono">Orders & Referrals Booklet</span>
                        <span className="text-xs font-bold text-slate-700">{detectedOrders.filter(o => o.type !== 'medication' && o.status === 'approved').length} Active</span>
                      </div>
                      
                      <div className="space-y-1.5 max-h-[110px] overflow-y-auto">
                        {detectedOrders.filter(o => o.type !== 'medication' && o.status === 'approved').map(ord => (
                          <div key={ord.id} className="text-xs bg-white border border-slate-200/80 p-2 rounded">
                            <p className="font-bold text-slate-900">{ord.name}</p>
                            <span className="text-[8px] uppercase tracking-tight text-slate-400 font-bold">{ord.type} check</span>
                          </div>
                        ))}
                        {detectedOrders.filter(o => o.type !== 'medication' && o.status === 'approved').length === 0 && (
                          <p className="text-[11px] text-slate-400 italic text-center py-2 select-none">No labs, diagnostic scans or referrals ordered in Scribe.</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Print Layout Overlay for physical print output */}
                <div className="hidden print:block fixed inset-0 bg-white z-[9999] p-10 font-sans text-stone-900">
                  <div className="text-center pb-6 border-b-2 border-slate-900">
                    <h2 className="text-3xl font-extrabold tracking-tight">PATIENT LEAFLET & CARE INSTRUCTIONS</h2>
                    <p className="text-sm font-mono mt-1 text-slate-500">Date: {new Date().toLocaleDateString()} • Metropolitan Med-Center</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 py-4 text-xs border-b border-slate-350">
                    <div>
                      <p className="font-bold uppercase text-[10px] text-slate-400">PATIENT DEMOGRAPHICS</p>
                      <p className="text-sm font-bold mt-1 text-slate-950">{patient.lastName}, {patient.firstName}</p>
                      <p>DOB: {formatDate(patient.dob)} • MRN: {patient.mrn}</p>
                    </div>
                    <div>
                      <p className="font-bold uppercase text-[10px] text-slate-400">ORDERING PROVIDER</p>
                      <p className="text-sm font-bold mt-1 text-slate-950">Dr. John Smith, MD</p>
                      <p>Clinic: Orthopedic Rehab Group</p>
                    </div>
                  </div>

                  {/* Medications list printed block */}
                  <div className="py-4 border-b border-slate-200">
                    <h3 className="font-bold text-sm text-slate-900 mb-2 uppercase tracking-wide">💊 ACTIVE PRESCRIPTIONS AUTHORIZED TODAY</h3>
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-50 text-slate-500 font-bold">
                        <tr>
                          <th className="py-2 border-b border-slate-200">Medicine Name</th>
                          <th className="py-2 border-b border-slate-200">Instruction & Dosage Details</th>
                          <th className="py-2 border-b border-slate-200">Refill Authorization</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detectedOrders.filter(o => o.type === 'medication' && o.status === 'approved').map(med => (
                          <tr key={med.id} className="border-b border-slate-100">
                            <td className="py-2.5 font-bold">{med.name}</td>
                            <td className="py-2.5">{med.details}</td>
                            <td className="py-2.5 font-mono">Refills: 2 (Authorized)</td>
                          </tr>
                        ))}
                        {detectedOrders.filter(o => o.type === 'medication' && o.status === 'approved').length === 0 && (
                          <tr>
                            <td colSpan={3} className="py-4 text-center text-slate-400 italic">No direct outpatient medications written during this session.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Studies Ordered printed block */}
                  <div className="py-4">
                    <h3 className="font-bold text-sm text-slate-900 mb-2 uppercase tracking-wide font-sans">🔬 DIAGNOSTIC IMAGING, LABS & CONSULTING REFERRALS</h3>
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-50 text-slate-500 font-bold">
                        <tr>
                          <th className="py-2 border-b border-slate-200">Clinical Order</th>
                          <th className="py-2 border-b border-slate-200">Type Category</th>
                          <th className="py-2 border-b border-slate-200">Indications / ICD-10 Code</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detectedOrders.filter(o => o.type !== 'medication' && o.status === 'approved').map(ord => (
                          <tr key={ord.id} className="border-b border-slate-100">
                            <td className="py-2.5 font-bold">{ord.name}</td>
                            <td className="py-2.5 uppercase text-slate-500 text-[10px] font-mono">{ord.type}</td>
                            <td className="py-2.5 italic text-slate-650">{ord.details}</td>
                          </tr>
                        ))}
                        {detectedOrders.filter(o => o.type !== 'medication' && o.status === 'approved').length === 0 && (
                          <tr>
                            <td colSpan={3} className="py-4 text-center text-slate-400 italic">No secondary diagnostic testing orders completed during this session.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  <div className="pt-20 text-xs flex justify-between items-end">
                    <div>
                      <div className="border-b border-slate-900 w-52 h-6" />
                      <p className="mt-1 font-semibold text-slate-600">Clinician Signature Verification</p>
                    </div>
                    <div>
                      <p className="text-right text-slate-400 text-[9px] font-mono">ENCOUNTER CODE: EMC-6512-AMB</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-150 flex justify-between items-center">
                <button 
                  onClick={() => {
                    // Reset session sequence
                    setScreeningStep(0);
                    setSessionPhase('rooming');
                    setScreeningMessages([
                      {
                        sender: 'ai',
                        text: isFollowUp 
                          ? `Welcome back, ${patient.firstName}! It is so wonderful to see you again. I am Nurse Carey, and I'll be checking you in today. What is the main reason for your visit today?`
                          : `Hello there, ${patient.firstName}. I am Nurse Carey, and I'm so glad to assist with your check-in today. We want to take excellent care of you. What is the main reason for your visit today?`,
                        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      }
                    ]);
                  }}
                  className="px-4 py-2 hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-lg text-xs font-bold transition-colors"
                >
                  Restart Scribe Flow
                </button>
                
                <p className="text-[10px] text-slate-400">Locked with timestamp compliance. Secured with narrative-first integrity.</p>
              </div>

            </div>
          )}

        </div>

        {/* Right Section: Real-time Billing optimizer & Coding compliance checks */}
        <div className="w-[230px] bg-slate-50 p-4 border-l border-slate-100 flex flex-col justify-between select-none">
          
          <div className="space-y-4">
            
            {/* Real-time complexity tracking */}
            <div>
              <div className="flex items-center gap-1.5 mb-2.5">
                <TrendingUp className="text-indigo-600" size={15} />
                <h4 className="font-bold text-[10px] uppercase text-slate-500 tracking-wider font-mono">MDM Complexity Score</h4>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm text-center">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest font-mono block">Estimated E/M Level</span>
                <p className="text-sm font-bold text-indigo-700 mt-1">
                  {activeDetections.filter(d => d.confirmed !== undefined).length >= 2 
                    ? 'Level 4 (Moderate MDM)' 
                    : screeningMessages.some(m => m.sender === 'patient') 
                      ? 'Level 3 (Low MDM)' 
                      : 'Level 2 (Minimal Complexity)'
                  }
                </p>
                
                <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2.5 overflow-hidden">
                  <div 
                    className="bg-indigo-600 h-full transition-all duration-300" 
                    style={{ 
                      width: activeDetections.filter(d => d.confirmed !== undefined).length >= 2 
                        ? '100%' 
                        : screeningStep >= 2 ? '65%' : '35%' 
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Dynamic physician prompts ensuring higher billing complexity */}
            {sessionPhase === 'visit' && (
              <div className="space-y-2">
                <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono border-b border-slate-200 pb-1">
                  <span>Billing suggestions</span>
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse ml-auto" />
                </div>

                <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                  {billingQueries.map(q => (
                    <div 
                      key={q.id}
                      onClick={() => toggleQueryCompleted(q.id)}
                      className={cn(
                        "p-2.5 rounded-lg border text-[11px] cursor-pointer transition-colors",
                        q.completed 
                          ? "bg-slate-100 border-slate-200 text-slate-450 line-through" 
                          : q.category === 'billing' 
                            ? "bg-indigo-50/50 border-indigo-100 hover:bg-indigo-50 text-slate-700"
                            : "bg-blue-50/40 border-blue-105 hover:bg-blue-50 text-slate-700"
                      )}
                    >
                      <div className="flex items-start gap-1.5">
                        <input 
                          type="checkbox" 
                          checked={q.completed} 
                          onChange={() => {}} // toggled on div click
                          className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" 
                        />
                        <div>
                          <p className="font-semibold leading-relaxed">{q.question}</p>
                          {!q.completed && (
                            <p className="text-[10px] text-indigo-600 font-medium mt-1 uppercase tracking-tight">{q.suggestedAction}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* General compliance rule card */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono block">Clinical Milestones</span>
              <div className="space-y-1.5 bg-white border border-slate-200 rounded-lg p-2.5">
                <MilestoneCheck 
                  label="Pre-Visit Screener Complete" 
                  checked={sessionPhase !== 'rooming'} 
                />
                <MilestoneCheck 
                  label="HPI Elements Logged" 
                  checked={screeningMessages.some(m => m.sender === 'patient')} 
                />
                <MilestoneCheck 
                  label="Biomechanic Exam Verified" 
                  checked={activeDetections.some(d => d.confirmed !== undefined)} 
                />
                <MilestoneCheck 
                  label="Physician Confirmed Audio Exam" 
                  checked={activeDetections.every(d => d.confirmed !== undefined)} 
                />
              </div>
            </div>

          </div>

          <div className="pt-3 border-t border-slate-250">
            <div className="bg-slate-200/50 rounded p-2 text-[9px] text-slate-500 leading-normal flex gap-1 border border-slate-300/40">
              <AlertCircle size={11} className="shrink-0 text-slate-400 mt-0.5 animate-pulse" />
              <span>Attestation metadata is secured in audit log. No recording media persists off-app.</span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}

function MilestoneCheck({ label, checked }: { label: string, checked: boolean }) {
  return (
    <div className="flex items-center gap-1.5 text-[11px] leading-tight">
      {checked ? (
        <Check className="text-emerald-600 shrink-0" size={13} />
      ) : (
        <div className="w-3 h-3 rounded-full border border-slate-300 shrink-0" />
      )}
      <span className={checked ? "text-slate-800 font-medium" : "text-slate-400"}>
        {label}
      </span>
    </div>
  );
}
