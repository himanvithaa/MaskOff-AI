import React from 'react';
import { Volume2, VolumeX, Square, RotateCcw, UserCheck } from 'lucide-react';
import { INDIAN_INTERVIEWERS } from './InterviewerAvatar';

export default function CompanionControls({
  characterId = 'meera',
  setCharacterId,
  isVoiceEnabled,
  setIsVoiceEnabled,
  isSpeaking,
  onStopSpeaking,
  onReplaySpeech,
  speechRate,
  setSpeechRate,
  className = ''
}) {
  return (
    <div className={`flex flex-wrap items-center justify-between gap-3 p-3 bg-white border border-border rounded-xl shadow-subtle ${className}`}>
      {/* Indian Interviewer Selector */}
      <div className="flex items-center space-x-1.5 overflow-x-auto py-0.5">
        <span className="text-xs text-text-muted font-medium mr-1 flex items-center space-x-1 flex-shrink-0">
          <UserCheck className="w-3.5 h-3.5 text-primary-600" />
          <span>Interviewer:</span>
        </span>
        {Object.values(INDIAN_INTERVIEWERS).map((interviewer) => (
          <button
            key={interviewer.id}
            type="button"
            onClick={() => setCharacterId && setCharacterId(interviewer.id)}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
              characterId === interviewer.id
                ? 'bg-primary-50 text-primary-700 border border-primary-200'
                : 'text-text-muted hover:text-text-main hover:bg-slate-50 border border-transparent'
            }`}
          >
            {interviewer.name}
          </button>
        ))}
      </div>

      {/* Voice Playback Controls */}
      <div className="flex items-center space-x-2">
        {/* Voice On/Off Toggle */}
        <button
          type="button"
          onClick={() => setIsVoiceEnabled(!isVoiceEnabled)}
          title={isVoiceEnabled ? 'Voice enabled (Click to mute)' : 'Voice muted (Click to enable)'}
          className={`p-1.5 rounded-lg text-xs font-medium border flex items-center space-x-1 transition ${
            isVoiceEnabled
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
              : 'bg-slate-100 text-slate-500 border-border hover:bg-slate-200'
          }`}
        >
          {isVoiceEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          <span>{isVoiceEnabled ? 'Voice On' : 'Muted'}</span>
        </button>

        {/* Stop Speech / Replay */}
        {isSpeaking ? (
          <button
            type="button"
            onClick={onStopSpeaking}
            className="p-1.5 px-2.5 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 text-xs font-medium flex items-center space-x-1 transition"
          >
            <Square className="w-3 h-3 fill-rose-600" />
            <span>Stop Speaking</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={onReplaySpeech}
            title="Replay interviewer question"
            className="p-1.5 px-2.5 rounded-lg bg-slate-100 text-text-muted hover:text-text-main border border-border hover:bg-slate-200 text-xs font-medium flex items-center space-x-1 transition"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Replay</span>
          </button>
        )}

        {/* Speed Selector */}
        <select
          value={speechRate}
          onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
          className="text-xs bg-slate-50 border border-border rounded-lg px-2 py-1 text-text-main font-medium focus:outline-none"
        >
          <option value="0.85">0.85x</option>
          <option value="1.0">1.0x</option>
          <option value="1.15">1.15x</option>
        </select>
      </div>
    </div>
  );
}
