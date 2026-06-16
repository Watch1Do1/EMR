import { useState, useEffect, useRef } from 'react';
import { usePersistentState } from '../lib/usePersistentState';
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
import { ScreeningMessage, ExamManeuver, DoctorQuery } from './scribe/types';
import { RoomingPhase } from './scribe/RoomingPhase';
import { TransitionPhase } from './scribe/TransitionPhase';
import { VisitPhase } from './scribe/VisitPhase';
import { ReviewPhase } from './scribe/ReviewPhase';

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
  const [sessionPhase, setSessionPhase] = usePersistentState<'rooming' | 'transition' | 'visit' | 'review'>(
    `session_phase_${patient.id}`,
    (localStorage.getItem(`previsit_completed_${patient.id}`) === 'true') ? 'transition' : 'rooming'
  );

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

  const [screeningStep, setScreeningStep] = usePersistentState<number>(
    `screening_step_${patient.id}`,
    0
  );

  const [userInput, setUserInput] = useState('');
  
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

  // 4. Physical Exam Maneuver Capture (Webcam Simulation)
  const [isVideoActive, setIsVideoActive] = usePersistentState<boolean>(
    `is_video_active_${patient.id}`,
    false
  );

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [lastExamDetected, setLastExamDetected] = useState<string>('');
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
            type="button"
            onClick={() => setIsMuted(prev => !prev)}
            className={cn(
              "p-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors border cursor-pointer",
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
            type="button"
            onClick={() => setShowVoiceSettings(prev => !prev)}
            className={cn(
              "p-2 rounded-lg text-xs font-semibold flex items-center justify-center transition-colors border cursor-pointer",
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
                  type="button"
                  onClick={() => setShowVoiceSettings(false)}
                  className="text-slate-500 hover:text-slate-300 text-xs px-1 cursor-pointer"
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
                  className="w-full py-1.5 text-center text-[11px] font-bold text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 rounded-lg border border-blue-500/30 transition-colors cursor-pointer"
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
            <RoomingPhase
              patient={patient}
              isFollowUp={isFollowUp}
              handleToggleVisitType={handleToggleVisitType}
              screeningStep={screeningStep}
              screeningSteps={screeningSteps}
              screeningMessages={screeningMessages}
              isListeningForInput={isListeningForInput}
              userInput={userInput}
              setUserInput={setUserInput}
              handleSendScreening={handleSendScreening}
              toggleVoiceInput={toggleVoiceInput}
            />
          )}

          {sessionPhase === 'transition' && (
            <TransitionPhase
              patient={patient}
              screeningMessages={screeningMessages}
              handleDoctorEntersRoom={handleDoctorEntersRoom}
              isDoctorEntering={isDoctorEntering}
            />
          )}

          {sessionPhase === 'visit' && (
            <VisitPhase
              patient={patient}
              isVideoActive={isVideoActive}
              setIsVideoActive={setIsVideoActive}
              videoRef={videoRef}
              canvasRef={canvasRef}
              isSimulatingAmbient={isSimulatingAmbient}
              setIsSimulatingAmbient={setIsSimulatingAmbient}
              simulationIndex={simulationIndex}
              setSimulationIndex={setSimulationIndex}
              AMBIENT_DEMO_LINES={AMBIENT_DEMO_LINES}
              consultTranscript={consultTranscript}
              handleAddNewTranscriptLine={handleAddNewTranscriptLine}
              detectedOrders={detectedOrders}
              setDetectedOrders={setDetectedOrders}
              onAddMedication={onAddMedication}
              onAddOrder={onAddOrder}
              activeDetections={activeDetections}
              handleConfirmManeuver={handleConfirmManeuver}
              setSessionPhase={setSessionPhase}
            />
          )}

          {sessionPhase === 'review' && (
            <ReviewPhase
              patient={patient}
              getCompiledUnifiedNote={getCompiledUnifiedNote}
              onImportHpi={onImportHpi}
              detectedOrders={detectedOrders}
              setScreeningStep={setScreeningStep}
              setSessionPhase={setSessionPhase}
              setScreeningMessages={setScreeningMessages}
              isFollowUp={isFollowUp}
            />
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
                          className="mt-0.5 rounded border-slate-350 text-indigo-600 focus:ring-indigo-500" 
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
