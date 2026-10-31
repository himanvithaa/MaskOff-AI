import React, { useState, useEffect, useRef } from 'react';
import { 
  Camera, 
  CameraOff, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  UserCheck, 
  User, 
  ArrowRight,
  RefreshCw,
  Volume2
} from 'lucide-react';
import { ALL_PERSONAS, getPersonaConfig, getInterviewer } from '../../config/interviewers';
import { ACCENTS, DEFAULT_ACCENT_ID } from '../../config/voices';
import { useTextToSpeech } from '../../hooks/useTextToSpeech';
import { 
  CameraMonitoringService, 
  PreflightMessage, 
  FaceStatus, 
  FramingStatus 
} from '../../services/CameraMonitoringService';

/**
 * CameraPreflightModal
 * Mandatory Preflight Verification Screen before starting any interview simulation.
 * 
 * Validates:
 * 1. Camera permission and active stream
 * 2. Real-time normalized face detection & sensible distance thresholds
 * 3. Frame centering & stability (~1.2s verification)
 * 4. Interviewer and Accent selection with voice preview
 */
export default function CameraPreflightModal({
  isOpen,
  onComplete,
  scenarioTitle = 'Interview Simulation',
  initialInterviewerId = 'male',
  initialAccentId = DEFAULT_ACCENT_ID
}) {
  const [stream, setStream] = useState(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isFaceDetected, setIsFaceDetected] = useState(false);
  const [detectionMessage, setDetectionMessage] = useState('Position your face in the oval guide');
  const [activeError, setActiveError] = useState(null);
  const [selectedPersonaKey, setSelectedPersonaKey] = useState(() => {
    const init = getInterviewer(initialInterviewerId);
    return init.personaKey || 'technical-interviewer';
  });
  const [selectedGender, setSelectedGender] = useState(() => {
    const init = getInterviewer(initialInterviewerId);
    return (init.gender || 'Male').toLowerCase();
  });
  const [selectedAccent, setSelectedAccent] = useState(initialAccentId);
  const [isConnecting, setIsConnecting] = useState(true);
  const [stabilityProgress, setStabilityProgress] = useState(0);
  const [activeDurationSec, setActiveDurationSec] = useState(0);

  const activePersona = getPersonaConfig(selectedPersonaKey);
  const activeInterviewer = selectedGender === 'female' ? activePersona.female : activePersona.male;

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const animFrameRef = useRef(null);
  const streamRef = useRef(null);

  const { previewVoice, isSpeaking } = useTextToSpeech();

  // Track active camera stream duration for reliable fallback
  useEffect(() => {
    if (!isCameraActive || !stream) {
      setActiveDurationSec(0);
      return;
    }
    const interval = setInterval(() => {
      setActiveDurationSec((s) => s + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isCameraActive, stream]);

  // Sync streamRef
  useEffect(() => {
    streamRef.current = stream;
  }, [stream]);

  const requestCameraAccess = async () => {
    setIsConnecting(true);
    setActiveError(null);
    setIsFaceDetected(false);
    setStabilityProgress(0);

    // Browser compatibility check
    if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setActiveError('Your browser does not support the required camera features. Please use a modern browser such as Chrome, Firefox, or Edge.');
      setIsConnecting(false);
      return;
    }

    // Secure context check
    if (
      typeof window !== 'undefined' &&
      !window.isSecureContext &&
      window.location.hostname !== 'localhost' &&
      window.location.hostname !== '127.0.0.1'
    ) {
      setActiveError('Camera access requires a secure connection (HTTPS). Please access MaskOff AI over HTTPS or localhost.');
      setIsConnecting(false);
      return;
    }

    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        },
        audio: false
      });

      setStream(mediaStream);
      streamRef.current = mediaStream;
      setIsCameraActive(true);
      setIsConnecting(false);
      CameraMonitoringService.setStream(mediaStream);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play().catch(console.warn);
      }
    } catch (err) {
      console.error('Camera acquisition error:', err);
      setIsCameraActive(false);
      setIsConnecting(false);

      const errName = err.name || '';
      const errMsg = err.message || '';

      if (errName === 'NotAllowedError' || errName === 'PermissionDeniedError') {
        setActiveError('Camera access is required to proceed with the interview. Please allow camera permissions in your browser settings and refresh the page.');
      } else if (errName === 'NotFoundError' || errName === 'DevicesNotFoundError') {
        setActiveError('No camera detected on your device. A working camera is required to start the interview. Please connect a webcam and reload the page.');
      } else if (errName === 'NotReadableError' || errName === 'TrackStartError') {
        setActiveError('Your camera is currently being used by another application. Please close other applications using the camera and try again.');
      } else {
        setActiveError(`Camera initialization failed: ${errMsg || 'Unable to access video device'}. Please check permissions.`);
      }
    }
  };

  useEffect(() => {
    if (isOpen) {
      requestCameraAccess();
    }

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [isOpen]);

  // Bind video element when stream or video mounts
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(console.warn);
    }
  }, [stream]);

  // Real-time preflight face framing verification using central CameraMonitoringService
  useEffect(() => {
    if (!isCameraActive || !stream) return;

    let isRunning = true;
    const processPreflightFrame = () => {
      if (!isRunning) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (video && canvas && video.readyState >= 2) {
        const live = CameraMonitoringService.processFrame(video, canvas);
        setDetectionMessage(live.preflightMessage);
        setStabilityProgress(live.stabilityProgress);

        const isGood = live.face === FaceStatus.DETECTED && live.framing === FramingStatus.GOOD;
        const isVerified = live.isFramingAcceptable || (live.face === FaceStatus.DETECTED && (live.framing === FramingStatus.GOOD || live.stabilityProgress >= 0.4));

        if (isVerified) {
          setIsFaceDetected(true);
          setActiveError(null);
        } else if (!isGood && live.preflightMessage !== PreflightMessage.GOOD_FRAMING) {
          if (live.face === FaceStatus.NOT_DETECTED || live.face === FaceStatus.MULTIPLE_FACES) {
            setActiveError(live.preflightMessage);
          } else {
            setActiveError(null);
          }
        } else {
          setActiveError(null);
        }
      }

      animFrameRef.current = requestAnimationFrame(processPreflightFrame);
    };

    animFrameRef.current = requestAnimationFrame(processPreflightFrame);

    return () => {
      isRunning = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isCameraActive, stream]);

  const isReadyToStart = isFaceDetected || stabilityProgress >= 0.4 || activeDurationSec >= 3;
  const canStart = Boolean(isCameraActive && stream && stream.active && isReadyToStart);

  const handleStartInterview = () => {
    if (!canStart) return;
    if (onComplete) {
      onComplete({
        stream,
        selectedInterviewerId: activeInterviewer.id,
        selectedInterviewer: activeInterviewer,
        selectedAccentId: selectedAccent,
        selectedPersonaKey,
        selectedGender
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 overflow-y-auto">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-primary-50 text-primary-600 flex items-center justify-center font-bold">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-text-main">
                Mandatory Camera & System Preflight
              </h2>
              <p className="text-xs text-text-muted">
                {scenarioTitle} • Camera check required before interview entry
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold">
            <ShieldCheck className="w-3.5 h-3.5 text-primary-600" />
            <span>Preflight Stage</span>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {/* Active Error / Notice Banner */}
          {activeError ? (
            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start space-x-3 animate-in fade-in duration-150">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-amber-600 mt-0.5" />
              <div className="flex-1 space-y-1">
                <span className="font-bold block text-amber-950">Framing Guide Notice</span>
                <p className="leading-relaxed">{activeError}</p>
              </div>
              <button
                type="button"
                onClick={requestCameraAccess}
                className="px-2.5 py-1 rounded-lg bg-amber-600 text-white font-semibold text-[11px] hover:bg-amber-700 transition flex items-center space-x-1 flex-shrink-0"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Retry</span>
              </button>
            </div>
          ) : isReadyToStart ? (
            <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between animate-in fade-in duration-150">
              <div className="flex items-center space-x-2.5">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
                <span className="font-semibold">
                  {isFaceDetected ? PreflightMessage.GOOD_FRAMING : 'Camera stream active & verified. You can start the interview.'}
                </span>
              </div>
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                Verified
              </span>
            </div>
          ) : (
            <div className="p-3 rounded-2xl bg-blue-50 border border-blue-200 text-blue-800 text-xs flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <UserCheck className="w-4 h-4 flex-shrink-0 text-primary-600 animate-pulse" />
                <span>{detectionMessage}</span>
              </div>
              {stabilityProgress > 0 && stabilityProgress < 1.0 && (
                <span className="text-[10px] font-bold text-primary-700">
                  Verifying hold ({Math.round(stabilityProgress * 100)}%)
                </span>
              )}
            </div>
          )}

          {/* Camera Preview Area with Framing Guide */}
          <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-slate-950 border border-slate-200 shadow-inner flex items-center justify-center">
            {isCameraActive ? (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  onLoadedMetadata={(e) => {
                    e.target.play().catch(console.warn);
                  }}
                  className="w-full h-full object-cover -scale-x-100"
                />
                <canvas ref={canvasRef} className="hidden" />

                {/* Oval Framing Guide Overlay (Visual guide, non-blocking) */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div
                    className={`w-48 h-64 sm:w-56 sm:h-76 rounded-[50%] border-2 border-dashed transition-all duration-300 ${
                      isReadyToStart
                        ? 'border-emerald-400 bg-emerald-500/10 shadow-[0_0_25px_rgba(16,185,129,0.35)]'
                        : stabilityProgress > 0
                        ? 'border-primary-400 bg-primary-500/10'
                        : 'border-white/50 bg-white/5'
                    }`}
                  />
                </div>

                {/* Real-time Status Badges in Video */}
                <div className="absolute top-3 left-3 flex items-center space-x-2 pointer-events-none">
                  <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[11px] font-medium border border-white/10">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Camera Stream Active</span>
                  </div>
                  <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[11px] font-medium border border-white/10">
                    {isReadyToStart ? (
                      <>
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        <span className="text-emerald-300">Camera Ready</span>
                      </>
                    ) : (
                      <>
                        <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                        <span className="text-amber-300">Framing Alignment...</span>
                      </>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center p-6 text-center text-slate-300 space-y-3">
                <CameraOff className="w-12 h-12 text-slate-500" />
                <div>
                  <h4 className="font-bold text-sm text-white">Camera Required</h4>
                  <p className="text-xs text-slate-400 mt-1 max-w-xs">
                    Please grant browser camera permission to enable behavioral observation and start the simulation.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={requestCameraAccess}
                  className="px-4 py-2 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-semibold text-xs shadow-sm transition flex items-center space-x-2"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>{isConnecting ? 'Requesting Camera...' : 'Grant Camera Access'}</span>
                </button>
              </div>
            )}
          </div>

          {/* Persona & Gender Selection Section */}
          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-text-main">
                Interviewer Persona & Gender
              </label>
              <span className="text-[10px] text-text-muted">
                8 specialized personas with dedicated Indian identities
              </span>
            </div>

            {/* Persona Selector */}
            <select
              value={selectedPersonaKey}
              onChange={(e) => setSelectedPersonaKey(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-text-main focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            >
              {ALL_PERSONAS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title} — {p.category}
                </option>
              ))}
            </select>

            {/* Gender Selection Cards for Active Persona */}
            <div className="grid grid-cols-2 gap-3">
              {/* Male Card */}
              <button
                type="button"
                onClick={() => setSelectedGender('male')}
                className={`p-3 rounded-2xl border text-left transition flex items-center space-x-3 ${
                  selectedGender === 'male'
                    ? 'border-primary-600 bg-primary-50/50 ring-2 ring-primary-500/20'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 bg-blue-100 text-blue-700">
                  <User className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center space-x-1.5">
                    <span className="font-bold text-xs text-text-main truncate">{activePersona.male.name}</span>
                    <span className="text-[9px] font-semibold uppercase px-1.5 py-0.2 bg-blue-50 text-blue-700 rounded">
                      Male
                    </span>
                  </div>
                  <p className="text-[10px] text-text-muted truncate mt-0.5">{activePersona.title}</p>
                </div>
              </button>

              {/* Female Card */}
              <button
                type="button"
                onClick={() => setSelectedGender('female')}
                className={`p-3 rounded-2xl border text-left transition flex items-center space-x-3 ${
                  selectedGender === 'female'
                    ? 'border-primary-600 bg-primary-50/50 ring-2 ring-primary-500/20'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 bg-emerald-100 text-emerald-700">
                  <User className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center space-x-1.5">
                    <span className="font-bold text-xs text-text-main truncate">{activePersona.female.name}</span>
                    <span className="text-[9px] font-semibold uppercase px-1.5 py-0.2 bg-emerald-50 text-emerald-700 rounded">
                      Female
                    </span>
                  </div>
                  <p className="text-[10px] text-text-muted truncate mt-0.5">{activePersona.title}</p>
                </div>
              </button>
            </div>
            
            <p className="text-[11px] text-text-muted leading-tight">
              {activeInterviewer.description}
            </p>
          </div>

          {/* Accent Selection Section */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-text-main">
                Interviewer Voice Accent
              </label>
              <button
                type="button"
                onClick={() => previewVoice(
                  selectedAccent,
                  activeInterviewer.voiceGender,
                  activeInterviewer.name
                )}
                disabled={isSpeaking}
                className="text-[11px] font-bold text-primary-600 hover:text-primary-700 flex items-center space-x-1 transition"
              >
                <Volume2 className={`w-3.5 h-3.5 ${isSpeaking ? 'animate-pulse text-amber-500' : ''}`} />
                <span>{isSpeaking ? `Playing ${activeInterviewer.name}'s Voice...` : `Preview ${activeInterviewer.name}'s Voice`}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {Object.values(ACCENTS).map((acc) => (
                <button
                  key={acc.id}
                  type="button"
                  onClick={() => setSelectedAccent(acc.id)}
                  className={`p-2.5 rounded-2xl border text-left transition flex flex-col justify-between ${
                    selectedAccent === acc.id
                      ? 'border-primary-600 bg-primary-50/60 ring-2 ring-primary-500/20'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="font-bold text-xs text-text-main truncate">{acc.displayName}</span>
                    {selectedAccent === acc.id && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-primary-600 flex-shrink-0" />
                    )}
                  </div>
                  <span className="text-[10px] text-text-muted mt-1 truncate">{acc.regionalVariety}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer with Action */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <div className="text-[11px] text-text-muted flex items-center space-x-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-primary-500" />
            <span>Strict privacy: Facial delivery observations processed entirely in-browser.</span>
          </div>

          <button
            type="button"
            disabled={!canStart}
            onClick={handleStartInterview}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center space-x-2 transition shadow-sm ${
              canStart
                ? 'bg-primary-600 hover:bg-primary-700 text-white cursor-pointer'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            <span>Start Interview</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
