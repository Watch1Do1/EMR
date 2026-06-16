import { Mic, UserCheck } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Patient } from '../../types';
import { ScreeningMessage, ScreeningStep } from './types';

export interface RoomingPhaseProps {
  patient: Patient;
  isFollowUp: boolean;
  handleToggleVisitType: (newIsFollowUp: boolean) => void;
  screeningStep: number;
  screeningSteps: ScreeningStep[];
  screeningMessages: ScreeningMessage[];
  isListeningForInput: boolean;
  userInput: string;
  setUserInput: (val: string) => void;
  handleSendScreening: (val: string) => void;
  toggleVoiceInput: () => void;
}

export function RoomingPhase({
  patient,
  isFollowUp,
  handleToggleVisitType,
  screeningStep,
  screeningSteps,
  screeningMessages,
  isListeningForInput,
  userInput,
  setUserInput,
  handleSendScreening,
  toggleVoiceInput,
}: RoomingPhaseProps) {
  return (
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
                <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">AI Intake Patient Status:</span>
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
        <div className="space-y-3 max-h-[290px] overflow-y-auto pr-2 animate-feed">
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
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-450 opacity-75"></span>
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
              "px-3.5 py-2.5 rounded-lg border text-xs font-bold transition-all flex items-center justify-center gap-1.5 shrink-0 cursor-pointer select-none",
              isListeningForInput 
                ? "bg-rose-600 text-white border-rose-700 animate-pulse shadow-sm" 
                : "bg-blue-50/50 text-blue-700 border-blue-200 hover:bg-blue-100"
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
            className="px-3 py-2 hover:bg-slate-50 border border-slate-200 text-slate-650 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer select-none"
            title="Simulate Speech Dictation"
          >
            <span>Simulate Voice</span>
          </button>

          <button 
            type="button"
            onClick={() => handleSendScreening(userInput)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-5 py-2.5 rounded-lg transition cursor-pointer"
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
}
