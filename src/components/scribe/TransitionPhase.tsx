import { UserCheck, ArrowRight } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Patient } from '../../types';
import { ScreeningMessage } from './types';

export interface TransitionPhaseProps {
  patient: Patient;
  screeningMessages: ScreeningMessage[];
  handleDoctorEntersRoom: () => void;
  isDoctorEntering: boolean;
}

export function TransitionPhase({
  patient,
  screeningMessages,
  handleDoctorEntersRoom,
  isDoctorEntering,
}: TransitionPhaseProps) {
  return (
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
            <span className="font-bold text-blue-600 mr-1.55">✓</span> {m.text}
          </p>
        ))}
      </div>

      <button 
        type="button"
        onClick={handleDoctorEntersRoom}
        disabled={isDoctorEntering}
        className={cn(
          "w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition duration-200 flex items-center justify-center gap-2 text-sm shadow-md cursor-pointer",
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
  );
}
