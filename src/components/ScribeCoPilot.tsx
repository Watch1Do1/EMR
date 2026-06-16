import { useRef, useEffect } from 'react';
import { 
  Sparkles, 
  TrendingUp, 
  Check, 
  AlertCircle
} from 'lucide-react';
import { cn } from '../lib/utils';
import { Patient, Medication, ClinicalOrder } from '../types';
import { RoomingPhase } from './scribe/RoomingPhase';
import { TransitionPhase } from './scribe/TransitionPhase';
import { VisitPhase } from './scribe/VisitPhase';
import { ReviewPhase } from './scribe/ReviewPhase';
import { useScribeState, AMBIENT_DEMO_LINES } from './scribe/useScribeState';
import { ScribeVoiceControls } from './scribe/ScribeVoiceControls';

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
  const {
    sessionPhase,
    setSessionPhase,
    isMuted,
    setIsMuted,
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
    screeningStep,
    setScreeningStep,
    screeningSteps,
    screeningMessages,
    setScreeningMessages,
    isDoctorEntering,
    consultTranscript,
    isSimulatingAmbient,
    setIsSimulatingAmbient,
    simulationIndex,
    setSimulationIndex,
    detectedOrders,
    setDetectedOrders,
    billingQueries,
    activeDetections,
    isVideoActive,
    setIsVideoActive,
    speakVoicePrompt,
    toggleVoiceInput,
    handleToggleVisitType,
    handleSendScreening,
    handleDoctorEntersRoom,
    handleConfirmManeuver,
    toggleQueryCompleted,
    handleAddNewTranscriptLine,
    getCompiledUnifiedNote
  } = useScribeState({
    patient,
    onImportHpi,
    onImportExam,
    onAddMedication,
    onAddOrder,
    activeMeds,
    orders
  });

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Bind WebRTC streams inside the view since ref handles html elements directly
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
          console.warn("Camera hardware access failed or denied.", err);
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

  // Handle active biomechanics grid overlay drawing
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

        {/* Instantiated Voice Speech controls */}
        <div className="flex items-center gap-3">
          <ScribeVoiceControls 
            isMuted={isMuted}
            setIsMuted={setIsMuted}
            availableVoices={availableVoices}
            selectedVoiceURI={selectedVoiceURI}
            setSelectedVoiceURI={setSelectedVoiceURI}
            speechRate={speechRate}
            setSpeechRate={setSpeechRate}
            speechPitch={speechPitch}
            setSpeechPitch={setSpeechPitch}
            showVoiceSettings={showVoiceSettings}
            setShowVoiceSettings={setShowVoiceSettings}
            speakVoicePrompt={speakVoicePrompt}
          />

          {!isMuted && (
            <div className="flex items-center gap-1 bg-slate-800 px-2.5 py-1.5 rounded-lg border border-slate-700">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
              <span className="text-[10px] uppercase font-mono font-bold text-slate-300">TTS Active</span>
            </div>
          )}
        </div>
      </header>

      {/* Workspace split columns */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left main pane for phase contents */}
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

        {/* Right Complexity & Billing sidebar */}
        <div className="w-[230px] bg-slate-50 p-4 border-l border-slate-100 flex flex-col justify-between select-none">
          <div className="space-y-4">
            
            {/* MDM tracking level */}
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

            {/* Dynamic Suggestions */}
            {sessionPhase === 'visit' && (
              <div className="space-y-2">
                <div className="flex items-center gap-1 text-[10px] font-bold text-slate-450 uppercase tracking-widest font-mono border-b border-slate-200 pb-1">
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
                          onChange={() => {}} // toggled overall
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

            {/* Clinical milestones checklist */}
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

          <div className="pt-3 border-t border-slate-200">
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
