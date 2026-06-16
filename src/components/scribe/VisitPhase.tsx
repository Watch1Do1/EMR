import { RefObject } from 'react';
import { 
  Camera, 
  Mic, 
  Sparkles, 
  Check, 
  Stethoscope, 
  CheckCircle, 
  HelpCircle, 
  ArrowRight,
  Video
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { Patient, Medication, ClinicalOrder, OrderType, OrderStatus } from '../../types';
import { ExamManeuver } from './types';

export interface VisitPhaseProps {
  patient: Patient;
  isVideoActive: boolean;
  setIsVideoActive: (val: boolean | ((p: boolean) => boolean)) => void;
  videoRef: RefObject<HTMLVideoElement | null>;
  canvasRef: RefObject<HTMLCanvasElement | null>;
  isSimulatingAmbient: boolean;
  setIsSimulatingAmbient: (val: boolean) => void;
  simulationIndex: number;
  setSimulationIndex: (val: number | ((p: number) => number)) => void;
  AMBIENT_DEMO_LINES: string[];
  consultTranscript: string[];
  handleAddNewTranscriptLine: (text: string) => void;
  detectedOrders: Array<{
    id: string;
    type: 'lab' | 'imaging' | 'referral' | 'medication';
    name: string;
    details: string;
    status: 'detected' | 'approved' | 'declined';
    snippet: string;
  }>;
  setDetectedOrders: (val: Array<{
    id: string;
    type: 'lab' | 'imaging' | 'referral' | 'medication';
    name: string;
    details: string;
    status: 'detected' | 'approved' | 'declined';
    snippet: string;
  }> | ((p: Array<{
    id: string;
    type: 'lab' | 'imaging' | 'referral' | 'medication';
    name: string;
    details: string;
    status: 'detected' | 'approved' | 'declined';
    snippet: string;
  }>) => Array<{
    id: string;
    type: 'lab' | 'imaging' | 'referral' | 'medication';
    name: string;
    details: string;
    status: 'detected' | 'approved' | 'declined';
    snippet: string;
  }>)) => void;
  onAddMedication?: (med: Medication) => void;
  onAddOrder?: (order: ClinicalOrder) => void;
  activeDetections: ExamManeuver[];
  handleConfirmManeuver: (id: string, confirmed: boolean, findings: string) => void;
  setSessionPhase: (phase: 'rooming' | 'transition' | 'visit' | 'review') => void;
}

export function VisitPhase({
  patient,
  isVideoActive,
  setIsVideoActive,
  videoRef,
  canvasRef,
  isSimulatingAmbient,
  setIsSimulatingAmbient,
  simulationIndex,
  setSimulationIndex,
  AMBIENT_DEMO_LINES,
  consultTranscript,
  handleAddNewTranscriptLine,
  detectedOrders,
  setDetectedOrders,
  onAddMedication,
  onAddOrder,
  activeDetections,
  handleConfirmManeuver,
  setSessionPhase,
}: VisitPhaseProps) {
  return (
    <div className="flex-1 flex flex-col justify-between">
      
      <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-6 flex-1 min-h-0">
        
        {/* Visual Bio-Mechanic Exam Scribe */}
        <div className="space-y-4 flex flex-col">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 select-none">
              <Video size={14} className="text-blue-505" />
              Visual Examination Stream
            </span>

            <button 
              type="button"
              onClick={() => setIsVideoActive(p => !p)}
              className={cn(
                "px-3 py-1 rounded text-[10px] font-bold transition-all border cursor-pointer select-none",
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
                <div className="absolute top-3 left-3 bg-red-650 text-white text-[9px] font-bold tracking-wider font-mono px-2 py-0.5 rounded flex items-center gap-1 animate-pulse shadow-sm select-none">
                  <span className="w-1.5 h-1.5 rounded-full bg-white shrink-0" />
                  AMBIENT VISUAL ASSESS
                </div>
              </>
            ) : (
              <div className="text-center p-4 max-w-[200px]">
                <Camera className="text-slate-550 mx-auto mb-2 opacity-50" size={24} />
                <p className="text-xs text-slate-400 font-bold select-none">Examiner Assist is Standby</p>
                <p className="text-[10px] text-slate-500 mt-1 leading-normal select-none">
                  Enable camera to start tracking knee maneuvers or thoracic auscultations automatically.
                </p>
              </div>
            )}
          </div>

          {/* Ambient Dialogue Monitor */}
          <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-3 flex flex-col space-y-2 max-h-[160px] overflow-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1 select-none">
                <Mic size={11} className="text-indigo-550" />
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
                      : "bg-white text-slate-650 border-slate-200 hover:bg-slate-100"
                  )}
                >
                  ⚡ {isSimulatingAmbient ? "Simulating Audio..." : "Auto-Play Simulator"}
                </button>
                <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100 uppercase animate-pulse select-none">Listening</span>
              </div>
            </div>

            <div className="space-y-1.5 text-xs text-slate-600 leading-normal font-sans pr-1 animate-feed">
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
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider font-mono select-none">Speak / Simulate Clinician orders</p>
              <div className="flex flex-wrap gap-1 select-none">
                <button 
                  type="button"
                  onClick={() => handleAddNewTranscriptLine('Dr. Smith: "We should also get a standard X-Ray of the right knee (2 views) to inspect cartilage structures before surgery."')}
                  className="text-[9px] bg-indigo-55/40 border border-indigo-100 text-indigo-750 font-bold hover:bg-indigo-50 px-2 py-1.5 rounded transition cursor-pointer"
                >
                  🗣️ "Order Knee X-Ray"
                </button>
                <button 
                  type="button"
                  onClick={() => handleAddNewTranscriptLine('Dr. Smith: "Let\'s schedule some routine laboratory bloodwork checkup, particularly a Hemoglobin A1c test to monitor sugar level trends."')}
                  className="text-[9px] bg-indigo-55/40 border border-indigo-100 text-indigo-750 font-bold hover:bg-indigo-50 px-2 py-1.5 rounded transition cursor-pointer"
                >
                  🗣️ "Order Hemoglobin A1c"
                </button>
                <button 
                  type="button"
                  onClick={() => handleAddNewTranscriptLine('Dr. Smith: "To build extension range of motion, I will submit a Referral to Physical Therapy for rehabilitation exercises."')}
                  className="text-[9px] bg-indigo-55/40 border border-indigo-100 text-indigo-750 font-bold hover:bg-indigo-50 px-2 py-1.5 rounded transition cursor-pointer"
                >
                  🗣️ "Refer to PT"
                </button>
                <button 
                  type="button"
                  onClick={() => handleAddNewTranscriptLine('Dr. Smith: "Good. For joint aching, let\'s prescribe you Meloxicam 15mg oral once daily."')}
                  className="text-[9px] bg-indigo-55/40 border border-indigo-100 text-indigo-750 font-bold hover:bg-indigo-50 px-2 py-1.5 rounded transition cursor-pointer"
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
                  type="button"
                  onClick={() => {
                    const el = document.getElementById('voice-order-input-fld') as HTMLInputElement;
                    if (el && el.value.trim()) {
                      handleAddNewTranscriptLine(`Dr. Smith: "${el.value}"`);
                      el.value = '';
                    }
                  }}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] px-3.5 py-1.5 rounded-lg active:scale-95 transition cursor-pointer"
                >
                  Enter
                </button>
              </div>
            </div>

            {/* Queued extractions tracker */}
            <div className="space-y-1.5 pt-2 border-t border-slate-100">
              <div className="flex justify-between items-center select-none">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest font-mono">Ambient Real-Time Extractor Queue</span>
                <span className="text-[9px] bg-emerald-50 text-emerald-700 font-bold px-1.5 rounded-md border border-emerald-100">
                  {detectedOrders.length} Detections
                </span>
              </div>

              <div className="space-y-1.5 max-h-[175px] overflow-y-auto pr-0.5 animate-feed">
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
                    <p className="text-[10px] text-slate-505 leading-snug">{det.details}</p>
                    <p className="text-[9px] text-slate-400 italic bg-white/75 p-1 rounded mt-1 border border-slate-100/50 block overflow-hidden text-ellipsis whitespace-nowrap"> Heard: {det.snippet} </p>

                    {det.status === 'detected' && (
                      <div className="flex gap-2 mt-2 pt-1.5 border-t border-slate-100 select-none">
                        <button 
                          type="button"
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
                          type="button"
                          onClick={() => {
                            setDetectedOrders(prev => prev.map(o => o.id === det.id ? { ...o, status: 'declined' } : o));
                          }}
                          className="text-[9px] border border-slate-205 hover:bg-slate-100 font-medium text-slate-500 px-2 py-1 rounded transition cursor-pointer"
                        >
                          Decline
                        </button>
                      </div>
                    )}

                    {det.status === 'approved' && (
                      <div className="absolute top-1.5 right-1.5 flex items-center gap-1 text-emerald-700 bg-emerald-100/50 px-1 py-0.5 rounded text-[8px] font-bold select-none">
                        <Check size={8} />
                        Approved
                      </div>
                    )}
                  </div>
                ))}
                {detectedOrders.length === 0 && (
                  <div className="p-4 text-center text-[11px] text-slate-405 italic select-none">
                    No companion healthcare items have been voiced yet. Try saying "Let's prescribe Meloxicam" above.
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>

        {/* Exam detection confirmators */}
        <div className="space-y-3 flex flex-col min-h-0 overflow-y-auto">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block select-none">
            Exam Detections & Confirmations
          </span>

          <div className="space-y-2.5">
            {activeDetections.map(item => (
              <div 
                key={item.id} 
                className={cn(
                  "p-3 rounded-lg border text-xs transition-colors",
                  item.confirmed === undefined 
                    ? "bg-amber-50/70 border-amber-200 hover:bg-amber-50" 
                    : item.confirmed 
                      ? "bg-red-50/20 border-red-200" 
                      : "bg-emerald-50/20 border-emerald-200"
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
                  <div className="flex gap-2 mt-3 pt-2 border-t border-slate-100 select-none">
                    <button
                      type="button"
                      onClick={() => handleConfirmManeuver(
                        item.id, 
                        true, 
                        item.category === 'ortho' ? 'Positive lachman with abnormal joint laxity.' : 'Abnormal heart murmuring findings.'
                      )}
                      className="bg-white hover:bg-red-50 text-red-700 border border-slate-200 px-3 py-1 font-bold rounded-lg text-[10px] transition shadow-sm cursor-pointer"
                    >
                      Yes (Abnormal)
                    </button>
                    <button 
                      type="button"
                      onClick={() => handleConfirmManeuver(
                        item.id, 
                        false, 
                        'Negative (Normal exam findings, stable endpoint.)'
                      )}
                      className="bg-white hover:bg-emerald-50 text-emerald-700 border border-slate-200 px-3 py-1 font-bold rounded-lg text-[10px] transition shadow-sm cursor-pointer"
                    >
                      No (Normal findings)
                    </button>
                  </div>
                ) : (
                  <div className="mt-2.5 p-1.5 bg-white border border-slate-200 rounded flex items-center justify-between text-[11px] select-none text-slate-700">
                    <span className="font-bold flex items-center gap-1">
                      <CheckCircle size={12} className={item.confirmed ? "text-red-500 animate-pulse" : "text-emerald-500"} />
                      Status: {item.confirmed ? 'Positive' : 'Normal'}
                    </span>
                    <span className="text-slate-500 text-[10px] font-medium">{item.findings}</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Doctor Voice confirming helper info */}
          <div className="bg-slate-100 rounded-lg p-2.5 text-[10px] text-slate-500 leading-normal border border-slate-200/60 mt-auto flex gap-1.5 select-none">
            <HelpCircle size={14} className="shrink-0 text-slate-400 mt-0.5" />
            <span>The AI prompts out loud following exams for instant validation. Check response options above or say normal to register.</span>
          </div>

        </div>

      </div>

      {/* Visit Phase compilation triggers */}
      <div className="mt-4 pt-4 border-t border-slate-150 flex justify-between items-center bg-white">
        <div className="text-xs text-slate-505 flex items-center gap-2 select-none">
          <div className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-ping" />
          <span>Ambient monitoring tracking active. Confirms recorded in note.</span>
        </div>
        
        <button 
          type="button"
          onClick={() => {
            setIsVideoActive(false);
            setSessionPhase('review');
          }}
          className="bg-slate-900 text-white font-bold text-xs px-6 py-2.5 rounded-lg hover:bg-slate-800 transition duration-200 shadow flex items-center gap-1.5 cursor-pointer selection-none"
        >
          <span>Generate Complete Chart Note</span>
          <ArrowRight size={14} />
        </button>
      </div>

    </div>
  );
}
