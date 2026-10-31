import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mic, 
  Brain, 
  Volume2, 
  Clock, 
  Sparkles, 
  Camera, 
  Upload, 
  Check, 
  RefreshCw,
  UserCheck
} from 'lucide-react';

export const INDIAN_INTERVIEWERS = {
  arjun: {
    id: 'arjun',
    name: 'Arjun',
    role: 'Friendly Interviewer',
    fullName: 'Arjun – Friendly Interviewer',
    image: '/assets/interviewers/arjun.jpg',
    tagline: 'Warm, conversational, and approachable practice partner',
    badgeColor: 'bg-sky-50 text-sky-700 border-sky-200',
    ringColor: 'ring-sky-500'
  },
  meera: {
    id: 'meera',
    name: 'Meera',
    role: 'Supportive Mentor',
    fullName: 'Meera – Supportive Mentor',
    image: '/assets/interviewers/meera.jpg',
    tagline: 'Empathetic senior coach focused on clarity and structure',
    badgeColor: 'bg-violet-50 text-violet-700 border-violet-200',
    ringColor: 'ring-violet-500'
  },
  vikram: {
    id: 'vikram',
    name: 'Vikram',
    role: 'Strict Technical Interviewer',
    fullName: 'Vikram – Strict Technical Interviewer',
    image: '/assets/interviewers/vikram.jpg',
    tagline: 'Exacting technical examiner demanding fundamental depth',
    badgeColor: 'bg-rose-50 text-rose-700 border-rose-200',
    ringColor: 'ring-rose-500'
  },
  ananya: {
    id: 'ananya',
    name: 'Ananya',
    role: 'Professional HR Interviewer',
    fullName: 'Ananya – Professional HR Interviewer',
    image: '/assets/interviewers/ananya.jpg',
    tagline: 'Executive HR leader evaluating behavioral poise and ownership',
    badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
    ringColor: 'ring-blue-500'
  },
  rahul: {
    id: 'rahul',
    name: 'Rahul',
    role: 'Critical Thinking Interviewer',
    fullName: 'Rahul – Critical Thinking Interviewer',
    image: '/assets/interviewers/rahul.jpg',
    tagline: 'Analytical debater stress-testing logic and edge cases',
    badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
    ringColor: 'ring-amber-500'
  }
};

export default function InterviewerAvatar({
  state = 'waiting', // 'speaking' | 'listening' | 'thinking' | 'waiting'
  interviewerKey = 'meera',
  persona = 'Meera – Supportive Mentor',
  isSpeakingAudio = false,
  customImageUrl = null,
  onCustomImageChange = null,
  className = ''
}) {
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [tempUrlInput, setTempUrlInput] = useState('');

  // Map persona string to interviewer key
  const normalizedKey = (() => {
    if (interviewerKey && INDIAN_INTERVIEWERS[interviewerKey.toLowerCase()]) {
      return interviewerKey.toLowerCase();
    }
    const p = (persona || '').toLowerCase();
    if (p.includes('arjun') || p.includes('friendly')) return 'arjun';
    if (p.includes('vikram') || p.includes('strict') || p.includes('professor')) return 'vikram';
    if (p.includes('ananya') || p.includes('hr') || p.includes('manager')) return 'ananya';
    if (p.includes('rahul') || p.includes('critical') || p.includes('devil')) return 'rahul';
    return 'meera';
  })();

  const interviewer = INDIAN_INTERVIEWERS[normalizedKey] || INDIAN_INTERVIEWERS.meera;
  const activeImage = customImageUrl || interviewer.image;

  // Active state: Audio speaking overrides state to 'speaking'
  const activeState = isSpeakingAudio ? 'speaking' : state;

  // State metadata
  const stateMeta = {
    speaking: {
      label: 'Interviewer Speaking',
      icon: Volume2,
      badge: 'bg-emerald-50 text-emerald-700 border-emerald-300',
      aura: 'from-emerald-400/30 via-teal-300/20 to-transparent',
      borderColor: 'border-emerald-500'
    },
    listening: {
      label: 'Listening to Candidate...',
      icon: Mic,
      badge: 'bg-primary-50 text-primary-700 border-primary-300',
      aura: 'from-primary-500/30 via-violet-400/20 to-transparent',
      borderColor: 'border-primary-500'
    },
    thinking: {
      label: 'Analyzing Response...',
      icon: Brain,
      badge: 'bg-amber-50 text-amber-700 border-amber-300',
      aura: 'from-amber-400/30 via-orange-300/20 to-transparent',
      borderColor: 'border-amber-500'
    },
    waiting: {
      label: 'Ready for Answer',
      icon: Clock,
      badge: 'bg-slate-100 text-text-muted border-slate-200',
      aura: 'from-slate-200/20 via-transparent to-transparent',
      borderColor: 'border-border'
    }
  }[activeState] || {
    label: 'Ready',
    icon: Clock,
    badge: 'bg-slate-100 text-text-muted border-slate-200',
    aura: 'from-slate-200/20 to-transparent',
    borderColor: 'border-border'
  };

  const StateIcon = stateMeta.icon;

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file && onCustomImageChange) {
      const reader = new FileReader();
      reader.onload = (event) => {
        onCustomImageChange(event.target.result);
        setShowUploadModal(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleApplyUrl = () => {
    if (tempUrlInput.trim() && onCustomImageChange) {
      onCustomImageChange(tempUrlInput.trim());
      setShowUploadModal(false);
      setTempUrlInput('');
    }
  };

  return (
    <div className={`relative flex flex-col items-center select-none ${className}`}>
      {/* Top Header Bar: Interviewer Name & Live State Pill */}
      <div className="flex items-center justify-between w-full max-w-sm mb-3 px-2">
        <div className="flex items-center space-x-2">
          <span className="font-bold text-sm text-text-main flex items-center space-x-1.5">
            <UserCheck className="w-4 h-4 text-primary-600" />
            <span>{interviewer.fullName}</span>
          </span>
        </div>

        {/* Live State Badge */}
        <span className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold border shadow-xs transition-all duration-300 ${stateMeta.badge}`}>
          <StateIcon className={`w-3.5 h-3.5 ${activeState === 'speaking' || activeState === 'listening' ? 'animate-pulse' : ''}`} />
          <span>{stateMeta.label}</span>
        </span>
      </div>

      {/* Prominent Reference Person Portrait Display */}
      <div className="relative w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center">
        {/* Dynamic Glow / Soundwave Aura Ring */}
        <motion.div
          animate={{
            scale: activeState === 'speaking' ? [1, 1.08, 1] : (activeState === 'listening' ? [1, 1.05, 1] : 1),
            opacity: activeState === 'speaking' ? [0.6, 0.9, 0.6] : (activeState === 'listening' ? 0.7 : 0.3)
          }}
          transition={{ duration: activeState === 'speaking' ? 0.8 : 1.8, repeat: Infinity, ease: 'easeInOut' }}
          className={`absolute inset-0 rounded-full bg-gradient-to-tr ${stateMeta.aura} blur-xl pointer-events-none`}
        />

        {/* Speaking Audio Wave Pulse Ring */}
        {activeState === 'speaking' && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="w-60 h-60 rounded-full border-2 border-emerald-400/40 animate-ping" />
            <span className="w-68 h-68 rounded-full border border-emerald-300/30 animate-pulse" />
          </div>
        )}

        {/* Listening Soundwave Pulse */}
        {activeState === 'listening' && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="w-60 h-60 rounded-full border-2 border-primary-400/40 animate-ping" />
          </div>
        )}

        {/* Reference Person Photographic Portrait */}
        <motion.div
          animate={
            activeState === 'speaking'
              ? { scale: [1, 1.02, 1], y: [0, -2, 0] }
              : activeState === 'listening'
              ? { scale: [1, 1.01, 1] }
              : { y: [0, -1, 0] }
          }
          transition={{
            duration: activeState === 'speaking' ? 0.4 : 3,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
          className={`relative z-10 w-52 h-52 sm:w-60 sm:h-60 rounded-full overflow-hidden border-4 shadow-xl transition-all duration-300 ${stateMeta.borderColor} bg-slate-100 flex items-center justify-center`}
        >
          <img
            src={activeImage}
            alt={interviewer.name}
            className="w-full h-full object-cover object-top transition-transform duration-500"
            onError={(e) => {
              // Graceful fallback to local SVG or default
              e.target.onerror = null;
              e.target.src = '/assets/interviewers/meera.jpg';
            }}
          />

          {/* Real-time speaking audio equalizer overlay */}
          {activeState === 'speaking' && (
            <div className="absolute bottom-2 inset-x-0 flex items-end justify-center space-x-1.5 p-1 bg-black/50 backdrop-blur-xs py-1.5">
              {[0.4, 0.8, 0.5, 0.9, 0.6, 0.7, 0.4].map((height, i) => (
                <motion.span
                  key={i}
                  animate={{ height: [`${height * 10}px`, `${height * 24}px`, `${height * 8}px`] }}
                  transition={{ duration: 0.35 + (i * 0.05), repeat: Infinity, ease: 'easeInOut' }}
                  className="w-1 bg-emerald-400 rounded-full inline-block"
                />
              ))}
            </div>
          )}

          {/* Listening audio input overlay */}
          {activeState === 'listening' && (
            <div className="absolute bottom-2 inset-x-0 flex items-center justify-center space-x-1 py-1 bg-black/50 backdrop-blur-xs">
              <span className="w-2 h-2 rounded-full bg-primary-400 animate-ping mr-1" />
              <span className="text-[10px] font-semibold text-white tracking-wide">Listening to you</span>
            </div>
          )}

          {/* Thinking overlay */}
          {activeState === 'thinking' && (
            <div className="absolute bottom-2 inset-x-0 flex items-center justify-center space-x-1 py-1 bg-black/60 backdrop-blur-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-bounce" />
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-bounce delay-100" />
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-bounce delay-200" />
              <span className="text-[10px] font-semibold text-amber-200 ml-1">Analyzing...</span>
            </div>
          )}
        </motion.div>
      </div>

      {/* Role Tagline & Optional Custom Image Trigger */}
      <div className="mt-3 flex items-center space-x-2">
        <p className="text-xs text-text-muted text-center max-w-xs">
          {interviewer.tagline}
        </p>

        {onCustomImageChange && (
          <button
            type="button"
            onClick={() => setShowUploadModal(true)}
            title="Use custom reference person photo"
            className="p-1 rounded-md text-text-muted hover:text-primary-600 hover:bg-slate-100 transition"
          >
            <Camera className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Custom Reference Image Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-5 max-w-sm w-full space-y-4 shadow-xl border border-border">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <h4 className="text-sm font-bold text-text-main flex items-center space-x-2">
                <Camera className="w-4 h-4 text-primary-600" />
                <span>Reference Person's Photo</span>
              </h4>
              <button
                type="button"
                onClick={() => setShowUploadModal(false)}
                className="text-xs text-text-muted hover:text-text-main"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-text-muted">
              Upload a reference image or paste a photo URL to act as your interviewer.
            </p>

            {/* Upload File */}
            <label className="block p-4 rounded-xl border-2 border-dashed border-border hover:border-primary-400 text-center cursor-pointer transition">
              <Upload className="w-6 h-6 mx-auto text-primary-600 mb-1" />
              <span className="text-xs font-semibold text-primary-700 block">Upload Image File</span>
              <span className="text-[10px] text-text-muted">JPG, PNG up to 5MB</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>

            {/* URL Input */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-text-muted">Or Image URL</label>
              <div className="flex items-center space-x-2">
                <input
                  type="url"
                  placeholder="https://example.com/photo.jpg"
                  value={tempUrlInput}
                  onChange={(e) => setTempUrlInput(e.target.value)}
                  className="flex-1 px-3 py-1.5 text-xs bg-slate-50 border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
                <button
                  type="button"
                  onClick={handleApplyUrl}
                  className="px-3 py-1.5 bg-primary-600 text-white rounded-lg text-xs font-semibold hover:bg-primary-700 transition"
                >
                  Apply
                </button>
              </div>
            </div>

            {customImageUrl && (
              <button
                type="button"
                onClick={() => {
                  onCustomImageChange(null);
                  setShowUploadModal(false);
                }}
                className="w-full text-xs text-rose-600 hover:underline pt-1 text-center"
              >
                Reset to default portrait
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

