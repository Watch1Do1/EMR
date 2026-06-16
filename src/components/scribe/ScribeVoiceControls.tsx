import { Settings, Volume2, VolumeX } from 'lucide-react';
import { cn } from '../../lib/utils';

interface ScribeVoiceControlsProps {
  isMuted: boolean;
  setIsMuted: (muted: boolean | ((p: boolean) => boolean)) => void;
  availableVoices: SpeechSynthesisVoice[];
  selectedVoiceURI: string;
  setSelectedVoiceURI: (uri: string) => void;
  speechRate: number;
  setSpeechRate: (r: number) => void;
  speechPitch: number;
  setSpeechPitch: (p: number) => void;
  showVoiceSettings: boolean;
  setShowVoiceSettings: (show: boolean | ((p: boolean) => boolean)) => void;
  speakVoicePrompt: (text: string) => void;
}

export function ScribeVoiceControls({
  isMuted,
  setIsMuted,
  availableVoices,
  selectedVoiceURI,
  setSelectedVoiceURI,
  speechRate,
  setSpeechRate,
  speechPitch,
  setSpeechPitch,
  showVoiceSettings,
  setShowVoiceSettings,
  speakVoicePrompt,
}: ScribeVoiceControlsProps) {
  return (
    <div className="flex items-center gap-3 relative">
      <button 
        type="button"
        id="btn_toggle_scribe_mute"
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
        id="btn_toggle_scribe_voice_settings"
        onClick={() => setShowVoiceSettings(prev => !prev)}
        className={cn(
          "p-2 rounded-lg text-xs font-semibold flex items-center justify-center transition-colors border cursor-pointer",
          showVoiceSettings 
            ? "bg-slate-705 text-slate-100 border-slate-600" 
            : "bg-slate-800/80 text-slate-400 border-slate-700 hover:text-white hover:bg-slate-700/50"
        )}
        title="Voice & Speech Settings"
      >
        <Settings size={15} />
      </button>

      {showVoiceSettings && (
        <div 
          id="panel_scribe_voice_settings"
          className="absolute right-0 top-12 w-72 bg-slate-900 border border-slate-850 rounded-xl shadow-2xl p-4 z-50 text-slate-200"
        >
          <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
            <span className="font-bold text-xs uppercase tracking-wider text-slate-300">Intake Voice Panel</span>
            <button 
              type="button"
              id="btn_close_scribe_voice_settings"
              onClick={() => setShowVoiceSettings(false)}
              className="text-slate-500 hover:text-slate-300 text-xs px-1 cursor-pointer"
            >
              Close
            </button>
          </div>

          <div className="space-y-3">
            {/* Voice selection */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="select_scribe_voice" className="text-[10px] font-bold text-slate-450 uppercase tracking-wide">Select Nurse Voice</label>
              <select
                id="select_scribe_voice"
                value={selectedVoiceURI}
                onChange={(e) => {
                  setSelectedVoiceURI(e.target.value);
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
                <label htmlFor="range_scribe_speech_rate">Speaking Speed</label>
                <span className="font-mono text-blue-400 font-normal">{speechRate.toFixed(2)}x</span>
              </div>
              <input 
                id="range_scribe_speech_rate"
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
                <label htmlFor="range_scribe_speech_pitch">Tone & Pitch</label>
                <span className="font-mono text-blue-400 font-normal">{speechPitch.toFixed(2)}</span>
              </div>
              <input 
                id="range_scribe_speech_pitch"
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
              id="btn_test_scribe_voice"
              onClick={() => speakVoicePrompt("Hello! I am your care assistant, Nurse Carey. I'll guide you through your rooming step with empathy.")}
              className="w-full py-1.5 text-center text-[11px] font-bold text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 rounded-lg border border-blue-500/30 transition-colors cursor-pointer"
            >
              Test Voice Tuning 🔊
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
