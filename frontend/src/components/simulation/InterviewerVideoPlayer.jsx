import React, { useRef, useEffect, useState } from 'react';
import { 
  Volume2, 
  VolumeX, 
  RotateCcw, 
  Play, 
  Pause, 
  Mic, 
  Brain, 
  Sparkles, 
  User, 
  CheckCircle2, 
  AlertCircle,
  Globe
} from 'lucide-react';
import { INTERVIEWERS, getInterviewer, getPersonaConfig, ALL_PERSONAS } from '../../config/interviewers';
import { ACCENTS, DEFAULT_ACCENT_ID } from '../../config/voices';

/**
 * InterviewerVideoPlayer
 * 16:9 Rectangular Video Player for MaskOff AI Interviewers.
 * 
 * CRITICAL REQUIREMENTS:
 * - The video element is ALWAYS completely muted (muted={true}, volume=0).
 * - Original voice embedded in video is never played.
 * - Text-To-Speech engine provides the only interviewer voice.
 * - Aspect ratio strictly 16:9 without distortion.
 * - Responsive on desktop, tablet, and mobile.
 * - Synchronized states: introduction, speaking, listening, thinking, completed.
 */
export default function InterviewerVideoPlayer({
  interviewerKey = 'male',
  accentId = DEFAULT_ACCENT_ID,
  state = 'waiting', // 'introduction' | 'speaking' | 'listening' | 'thinking' | 'waiting' | 'completed'
  isSpeakingAudio = false,
  onReplay = null,
  onGenderChange = null,
  onAccentChange = null,
  onPreviewAccent = null,
  isAudioMuted = false,
  onToggleAudioMute = null,
  accentWarning = null,
  className = ''
}) {
  const videoRef = useRef(null);
  const [videoError, setVideoError] = useState(false);
  const [isPausedManually, setIsPausedManually] = useState(false);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);

  const interviewer = getInterviewer(interviewerKey);
  const currentAccent = ACCENTS[accentId] || ACCENTS.american;
  const personaConfig = getPersonaConfig(interviewer.personaKey || interviewer.role || interviewerKey);
  const maleName = personaConfig?.male?.name || 'Male';
  const femaleName = personaConfig?.female?.name || 'Female';

  // Active state: if audio is actively speaking, state is speaking
  const activeState = isSpeakingAudio ? 'speaking' : state;

  // Strict Muting & Play/Pause Synchronization
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Force complete muting on DOM element
    video.muted = true;
    video.volume = 0;

    if (videoError) return;

    if (isPausedManually) {
      video.pause();
      return;
    }

    if (activeState === 'speaking' || activeState === 'introduction') {
      video.loop = true;
      video.play().catch((err) => {
        console.warn('Silent video play notice:', err);
      });
    } else {
      // In listening, thinking, or waiting state, pause video on current frame
      video.pause();
    }
  }, [activeState, isPausedManually, videoError]);

  // When interviewer changes, reload video
  useEffect(() => {
    setVideoError(false);
    setIsVideoLoaded(false);
    if (videoRef.current) {
      videoRef.current.muted = true;
      videoRef.current.volume = 0;
      videoRef.current.load();
    }
  }, [interviewer.video]);

  const toggleManualPause = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().catch(console.warn);
      setIsPausedManually(false);
    } else {
      video.pause();
      setIsPausedManually(true);
    }
  };

  const getStateBadge = () => {
    switch (activeState) {
      case 'speaking':
      case 'introduction':
        return (
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-primary-600/95 text-white text-[11px] font-semibold backdrop-blur-md shadow-sm">
            <Volume2 className="w-3.5 h-3.5 animate-pulse" />
            <span>Speaking Question</span>
          </div>
        );
      case 'listening':
        return (
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-emerald-600/95 text-white text-[11px] font-semibold backdrop-blur-md shadow-sm">
            <Mic className="w-3.5 h-3.5 animate-pulse" />
            <span>Listening to You</span>
          </div>
        );
      case 'thinking':
        return (
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-amber-600/95 text-white text-[11px] font-semibold backdrop-blur-md shadow-sm">
            <Brain className="w-3.5 h-3.5 animate-spin text-white" />
            <span>Evaluating Response</span>
          </div>
        );
      case 'completed':
        return (
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-slate-700/95 text-white text-[11px] font-semibold backdrop-blur-md shadow-sm">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Interview Completed</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-slate-800/85 text-slate-200 text-[11px] font-medium backdrop-blur-md shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>Ready</span>
          </div>
        );
    }
  };

  return (
    <div className={`w-full max-w-2xl mx-auto flex flex-col space-y-2.5 ${className}`}>
      {/* Header Bar: Identity & Quick Toggles */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
        <div>
          <div className="flex items-center space-x-2">
            <h3 className="text-base sm:text-lg font-bold text-text-main tracking-tight">
              {interviewer.name}
            </h3>
            <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${interviewer.badgeColor}`}>
              {interviewer.gender}
            </span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
              {currentAccent.displayName}
            </span>
          </div>
          <p className="text-xs font-medium text-text-muted">
            {interviewer.role}
          </p>
        </div>

        {/* Gender & Accent Quick Controls */}
        <div className="flex flex-wrap items-center gap-1.5 self-start sm:self-auto">
          {onGenderChange && (
            <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-border">
              <button
                type="button"
                onClick={() => onGenderChange('male')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                  interviewer.gender === 'Male'
                    ? 'bg-white text-primary-700 shadow-xs'
                    : 'text-text-muted hover:text-text-main'
                }`}
                title={`Switch to ${maleName} (Male)`}
              >
                {maleName} (Male)
              </button>
              <button
                type="button"
                onClick={() => onGenderChange('female')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                  interviewer.gender === 'Female'
                    ? 'bg-white text-primary-700 shadow-xs'
                    : 'text-text-muted hover:text-text-main'
                }`}
                title={`Switch to ${femaleName} (Female)`}
              >
                {femaleName} (Female)
              </button>
            </div>
          )}

          {onAccentChange && (
            <select
              value={accentId}
              onChange={(e) => onAccentChange(e.target.value)}
              className="px-2 py-1 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-text-main focus:outline-none shadow-xs"
              title="Select Interviewer Voice Accent"
            >
              <option value="american">American Accent</option>
              <option value="polish">Polish Accent</option>
              <option value="african">African Accent</option>
            </select>
          )}

          {onPreviewAccent && (
            <button
              type="button"
              onClick={onPreviewAccent}
              title="Listen to accent voice preview"
              className="p-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition flex items-center space-x-1"
            >
              <Volume2 className="w-3.5 h-3.5 text-primary-600" />
              <span className="hidden sm:inline">Preview</span>
            </button>
          )}
        </div>
      </div>

      {/* Accent Warning Banner (If browser lacks native pack) */}
      {accentWarning && (
        <div className="p-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-[11px] flex items-center space-x-2">
          <AlertCircle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
          <span>{accentWarning}</span>
        </div>
      )}

      {/* Main 16:9 Video Container */}
      <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-slate-950 border border-slate-200 shadow-card flex items-center justify-center group">
        {!videoError ? (
          <video
            ref={videoRef}
            src={interviewer.video}
            playsInline
            muted={true}
            defaultMuted={true}
            preload="auto"
            onLoadedData={() => setIsVideoLoaded(true)}
            onError={() => {
              console.warn('Interviewer video failed to load, attempting fallback.');
              if (interviewer.legacyVideo && videoRef.current && !videoRef.current.src.includes(interviewer.legacyVideo)) {
                videoRef.current.src = interviewer.legacyVideo;
                videoRef.current.load();
              } else {
                setVideoError(true);
              }
            }}
            className="w-full h-full object-cover object-center"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 text-white p-6 text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-primary-600/20 border border-primary-500/30 flex items-center justify-center">
              <User className="w-8 h-8 text-primary-400" />
            </div>
            <div>
              <h4 className="font-bold text-sm">{interviewer.name}</h4>
              <p className="text-xs text-slate-400">{interviewer.role}</p>
            </div>
            <div className="px-3 py-1 rounded-full bg-slate-800 text-[11px] text-slate-300 border border-slate-700">
              Interviewer Video Stream (Fallback Active)
            </div>
          </div>
        )}

        {/* State Indicator Pill (Top Left) */}
        <div className="absolute top-3 left-3 z-10 pointer-events-none">
          {getStateBadge()}
        </div>

        {/* Floating Controls Bar (Bottom Right Overlay) */}
        <div className="absolute bottom-3 right-3 z-10 flex items-center space-x-1.5 bg-black/60 backdrop-blur-md p-1 rounded-xl border border-white/10 opacity-90 hover:opacity-100 transition">
          {/* Pause / Resume Video */}
          <button
            type="button"
            onClick={toggleManualPause}
            title={isPausedManually ? "Resume video" : "Pause video"}
            className="p-1.5 rounded-lg text-white/90 hover:text-white hover:bg-white/10 transition"
          >
            {isPausedManually ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
          </button>

          {/* Replay Question with TTS */}
          {onReplay && (
            <button
              type="button"
              onClick={onReplay}
              title="Replay question and video"
              className="p-1.5 rounded-lg text-white/90 hover:text-white hover:bg-white/10 transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Mute / Unmute Audio */}
          {onToggleAudioMute && (
            <button
              type="button"
              onClick={onToggleAudioMute}
              title={isAudioMuted ? "Unmute TTS audio" : "Mute TTS audio"}
              className="p-1.5 rounded-lg text-white/90 hover:text-white hover:bg-white/10 transition"
            >
              {isAudioMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>
      </div>

      {/* Description below the video */}
      <div className="px-1 text-xs text-text-muted leading-relaxed">
        <span className="font-semibold text-text-main">{interviewer.title}: </span>
        {interviewer.description}
      </div>
    </div>
  );
}
