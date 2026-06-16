import { Check, ClipboardList, PenTool, Save, X } from 'lucide-react';
import { useState } from 'react';
import { NoteType } from '../types';

interface NoteEditorProps {
  onSave: (content: string, signed: boolean) => void;
  onCancel: () => void;
  initialContent?: string;
  type: NoteType;
}

const DOT_PHRASES: Record<string, string> = {
  '.ros': 'CONSTITUTIONAL: No fever, no chills. EYES: No vision changes. ENMT: No sore throat, no ear pain. RESPIRATORY: No cough, no SOB. CARDIOVASCULAR: No chest pain, no palpitations.',
  '.pe': 'GENERAL: WDWN, no acute distress. EYES: PERRL, EOMI. NECK: Supple, no LAD. HEART: RRR, no m/r/g. LUNGS: CTAB, no w/r/r. ABDOMEN: Soft, NT/ND, +BS.',
  '.norm': 'The patient is doing well and has no new complaints. Current medications are being tolerated without side effects.',
};

export function NoteEditor({ onSave, onCancel, initialContent = '', type }: NoteEditorProps) {
  const [content, setContent] = useState(initialContent);
  const [showDotPhrases, setShowDotPhrases] = useState(false);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === '.') {
      setShowDotPhrases(true);
    } else if (e.key === ' ' || e.key === 'Enter') {
      const words = content.split(/\s/);
      const lastWord = words[words.length - 1];
      if (DOT_PHRASES[lastWord]) {
        words[words.length - 1] = DOT_PHRASES[lastWord];
        setContent(words.join(' '));
      }
      setShowDotPhrases(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-lg flex flex-col h-[600px] overflow-hidden">
      <header className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <PenTool size={20} className="text-blue-600" />
          <h3 className="font-bold text-slate-800">New {type}</h3>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={onCancel}
            className="p-2 hover:bg-slate-200 rounded-lg text-slate-500 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
      </header>

      <div className="flex-1 relative flex flex-col group">
        <textarea
          className="flex-1 p-6 text-sm leading-relaxed focus:ring-0 border-none resize-none bg-white font-serif placeholder:font-sans placeholder:italic"
          placeholder="Start typing or use .dotphrases (.ros, .pe, .norm)..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          autoFocus
        />
        
        {showDotPhrases && (
          <div className="absolute top-10 left-6 bg-white border border-slate-200 shadow-xl rounded-lg p-2 z-50 w-64">
            <p className="text-[10px] font-bold text-slate-400 uppercase px-2 mb-2">Available Dot Phrases</p>
            {Object.keys(DOT_PHRASES).map(key => (
              <div 
                key={key} 
                className="px-2 py-1.5 hover:bg-slate-50 rounded cursor-pointer group flex justify-between items-center"
                onClick={() => {
                  setContent(prev => prev + key.slice(1));
                  setShowDotPhrases(false);
                }}
              >
                <span className="text-sm font-bold text-blue-600 font-mono">{key}</span>
                <span className="text-[10px] text-slate-400 truncate ml-4">{DOT_PHRASES[key]}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <footer className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-4 text-xs font-medium text-slate-500">
          <span className="flex items-center gap-1"><ClipboardList size={14} /> Smart Text Active</span>
          <span className="w-1 h-1 rounded-full bg-slate-300" />
          <span>Draft compliant with HIPAA</span>
        </div>
        <div className="flex items-center gap-2">
          <button 
            id="btn_note_cancel"
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-semibold text-slate-500 hover:text-slate-800"
          >
            Cancel
          </button>
          
          <button 
            id="btn_note_save_draft"
            type="button"
            onClick={() => onSave(content, false)}
            className="px-4 py-2 text-sm font-bold text-blue-600 hover:text-blue-700 bg-white border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors shadow-xs"
          >
            Save Draft
          </button>
          
          <button 
            id="btn_note_sign_finalize"
            type="button"
            onClick={() => onSave(content, true)}
            className="flex items-center gap-2 bg-emerald-600 text-white px-5 py-2 rounded-lg text-sm font-bold hover:bg-emerald-700 shadow-xs transition-colors"
          >
            <Check size={16} />
            Sign & Finalize
          </button>
        </div>
      </footer>
    </div>
  );
}
