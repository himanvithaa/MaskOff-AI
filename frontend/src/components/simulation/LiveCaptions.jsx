import React, { useState } from 'react';
import { Subtitles, Volume2, Sparkles, CheckCircle2, Clock, Brain } from 'lucide-react';

/**
 * LiveCaptions
 * Dedicated live-caption interface positioned directly below the 16:9 Interviewer Video.
 * Features:
 * - Word-level synchronization and progressive phrase illumination
 * - Captions ON / OFF toggle
 * - 5 explicit caption states:
 *   1. Waiting for interviewer
 *   2. Interviewer speaking
 *   3. Caption active
 *   4. Interviewer finished speaking
 *   5. Processing next response
 */
export default function LiveCaptions({
  activeText = '',
  spokenCharIndex = 0,
  isSpeaking = false,
  state = 'waiting', // 'waiting' | 'speaking' | 'caption_active' | 'finished' | 'processing'
  interviewerName = 'Interviewer',
  syncMode = 'word_boundary',
  isCaptionsEnabled = true,
  onToggleCaptions = null,
  className = ''
}) {
  const [internalEnabled, setInternalEnabled] = useState(true);
  const captionsOn = onToggleCaptions !== null ? isCaptionsEnabled : internalEnabled;

  const handleToggle = () => {
    if (onToggleCaptions) {
      onToggleCaptions(!isCaptionsEnabled);
    } else {
      setInternalEnabled(!internalEnabled);
    }
  };

  // Derive active caption state
  const resolvedState = (() => {
    if (state === 'processing' || state === 'thinking') return 'processing';
    if (isSpeaking && activeText) return 'speaking';
    if (state === 'finished' || state === 'completed') return 'finished';
    if (activeText) return 'caption_active';
    return 'waiting';
  })();

  // Tokenize text into words with character offsets for word-level sync
  const tokens = React.useMemo(() => {
    if (!activeText) return [];
    const regex = /\S+|\s+/g;
    const list = [];
    let match;
    while ((match = regex.exec(activeText)) !== null) {
      list.push({
        text: match[0],
        isWord: /\S/.test(match[0]),
        startIndex: match.index,
        endIndex: match.index + match[0].length
      });
    }
    return list;
  }, [activeText]);

  const getStateBadge = () => {
    switch (resolvedState) {
      case 'speaking':
        return (
          <div className="flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-primary-100 text-primary-700 font-bold text-[10px]">
            <span className="w-2 h-2 rounded-full bg-primary-600 animate-ping" />
            <span>Interviewer Speaking</span>
          </div>
        );
      case 'processing':
        return (
          <div className="flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px]">
            <Brain className="w-3 h-3 text-amber-600 animate-spin" />
            <span>Processing Next Response</span>
          </div>
        );
      case 'finished':
        return (
          <div className="flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>Question Delivered • Your Turn</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium text-[10px]">
            <Clock className="w-3 h-3 text-slate-500" />
            <span>Waiting for Interviewer</span>
          </div>
        );
    }
  };

  return (
    <div className={`w-full max-w-2xl mx-auto rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden flex flex-col ${className}`}>
      {/* Live Caption Top Bar */}
      <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1.5 text-text-main font-bold text-xs uppercase tracking-wider">
            <Subtitles className={`w-4 h-4 ${isSpeaking ? 'text-primary-600 animate-pulse' : 'text-slate-400'}`} />
            <span>Live Captions</span>
          </div>
          {captionsOn && getStateBadge()}
        </div>

        <div className="flex items-center space-x-2">
          {captionsOn && isSpeaking && (
            <span className="hidden sm:inline-block text-[9px] uppercase font-mono px-2 py-0.5 rounded bg-slate-200/70 text-slate-600 font-semibold">
              {syncMode === 'word_boundary' ? 'Exact Word Sync' : 'Cadence Sync'}
            </span>
          )}

          {/* Captions ON / OFF Toggle Button */}
          <button
            type="button"
            onClick={handleToggle}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition flex items-center space-x-1.5 ${
              captionsOn
                ? 'bg-primary-50 text-primary-700 border border-primary-200 hover:bg-primary-100'
                : 'bg-slate-200 text-slate-500 hover:bg-slate-300'
            }`}
            title="Toggle Live Captions"
          >
            <Subtitles className="w-3.5 h-3.5" />
            <span>{captionsOn ? 'Captions ON' : 'Captions OFF'}</span>
          </button>
        </div>
      </div>

      {/* Main Caption Viewport */}
      <div className="p-4 sm:p-5 min-h-[92px] flex flex-col justify-center bg-slate-900 text-white rounded-b-2xl">
        {!captionsOn ? (
          <p className="text-xs text-slate-400 italic text-center">
            Captions turned off. Click "Captions OFF" above to re-enable real-time captions.
          </p>
        ) : resolvedState === 'waiting' && !activeText ? (
          <p className="text-xs text-slate-400 italic text-center animate-pulse">
            Waiting for interviewer to initiate question...
          </p>
        ) : resolvedState === 'processing' ? (
          <p className="text-xs text-amber-300 italic text-center flex items-center justify-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping mr-1" />
            <span>Evaluating your answer and formulating follow-up question...</span>
          </p>
        ) : (
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold tracking-wider text-primary-300 block">
              {(interviewerName || 'Interviewer').toUpperCase()} (INTERVIEWER):
            </span>
            <p className="text-sm sm:text-base leading-relaxed font-medium">
              "
              {tokens.map((token, i) => {
                if (!token.isWord) return <span key={i}>{token.text}</span>;

                // Word-level progressive highlight
                const isSpoken = spokenCharIndex >= token.startIndex;
                const isCurrentWord = spokenCharIndex >= token.startIndex && spokenCharIndex <= token.endIndex;

                return (
                  <span
                    key={i}
                    className={`transition-colors duration-150 ${
                      isCurrentWord
                        ? 'text-yellow-300 font-bold bg-yellow-400/20 px-0.5 rounded shadow-xs'
                        : isSpoken
                        ? 'text-white'
                        : 'text-slate-500'
                    }`}
                  >
                    {token.text}
                  </span>
                );
              })}
              "
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

