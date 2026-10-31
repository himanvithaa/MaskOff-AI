import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Mic, 
  Square, 
  Send, 
  RotateCcw, 
  Volume2, 
  VolumeX, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  Flame, 
  Layers,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Sparkles,
  RefreshCw,
  HelpCircle,
  Pause,
  Play,
  Loader2
} from 'lucide-react';
import { sessionsAPI, audioAPI } from '../services/api';
import { useAudioRecorder } from '../hooks/useAudioRecorder';
import { useTextToSpeech } from '../hooks/useTextToSpeech';
import InterviewerVideoPlayer from '../components/simulation/InterviewerVideoPlayer';
import LiveCaptions from '../components/simulation/LiveCaptions';
import CameraPreview from '../components/camera/CameraPreview';
import CameraPreflightModal from '../components/camera/CameraPreflightModal';
import { INTERVIEWERS, getInterviewer, DEFAULT_INTERVIEWER_ID, formatInterviewerText, getPersonaConfig } from '../config/interviewers';
import { ACCENTS, DEFAULT_ACCENT_ID } from '../config/voices';
import { CameraState, CAMERA_MESSAGES } from '../components/camera/CameraStateMachine';
import { CameraMonitoringService } from '../services/CameraMonitoringService';

export default function SimulatorPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session');

  const [session, setSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [inputMode, setInputMode] = useState('voice'); // 'voice' or 'text'
  const [textInput, setTextInput] = useState('');
  const [latestAnalysis, setLatestAnalysis] = useState(null);
  const [showFullTranscript, setShowFullTranscript] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [lastResponseId, setLastResponseId] = useState(null);
  const [submissionError, setSubmissionError] = useState(null);

  // Mandatory Camera Preflight State
  const [hasCompletedPreflight, setHasCompletedPreflight] = useState(false);
  const [preflightStream, setPreflightStream] = useState(null);

  // Mid-Interview Camera Monitoring & Pausing
  const [cameraState, setCameraState] = useState(CameraState.CAMERA_ACTIVE);
  const [isInterviewPaused, setIsInterviewPaused] = useState(false);
  const [cameraPauseMessage, setCameraPauseMessage] = useState(null);

  // Interviewer & Accent Selection
  const [interviewerKey, setInterviewerKey] = useState(DEFAULT_INTERVIEWER_ID);
  const [accentId, setAccentId] = useState(DEFAULT_ACCENT_ID);
  const [interviewerState, setInterviewerState] = useState('introduction');
  const [isAudioMuted, setIsAudioMuted] = useState(false);

  // Dedicated Live Captions State
  const [currentCaptionText, setCurrentCaptionText] = useState('');
  const [isCaptionsEnabled, setIsCaptionsEnabled] = useState(true);

  // Camera Delivery state
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [latestDeliverySummary, setLatestDeliverySummary] = useState(null);
  const analyzerRef = useRef(null);

  const activeInterviewer = getInterviewer(interviewerKey);

  // Audio Recorder Hook
  const {
    isRecording,
    recordingTime,
    audioUrl,
    audioBlob,
    transcript,
    setTranscript,
    permissionError,
    startRecording,
    stopRecording,
    resetRecording
  } = useAudioRecorder();

  // Text to Speech Hook with Word Boundary Sync
  const {
    isSpeaking,
    rate: speechRate,
    speak: triggerTTS,
    stop: stopSpeaking,
    previewVoice,
    unlockAudio,
    isAutoplayBlocked,
    currentWordCharIndex,
    syncMode,
    accentWarning
  } = useTextToSpeech({
    preferredGender: activeInterviewer.voiceGender,
    preferredAccentId: accentId,
    customPitch: activeInterviewer.pitch,
    onStart: () => setInterviewerState('speaking'),
    onEnd: () => setInterviewerState('waiting'),
  });

  // Centralized speak method: coordinates Audio, Video, and Live Captions
  const speakInterviewerSpeech = useCallback((text, overrideGender = null, overrideAccent = null) => {
    if (!text || isAudioMuted) return;

    const chosen = overrideGender 
      ? (overrideGender === 'female' ? getInterviewer('female') : getInterviewer('male')) 
      : activeInterviewer;
    const g = overrideGender || chosen.voiceGender;
    const a = overrideAccent || accentId;
    const cleanText = formatInterviewerText(text, chosen);

    // Set caption text immediately for word-level sync
    setCurrentCaptionText(cleanText);
    setInterviewerState('speaking');

    // Trigger TTS
    triggerTTS(cleanText, g, a);
  }, [activeInterviewer, accentId, isAudioMuted, triggerTTS]);

  const fetchSession = async () => {
    if (!sessionId) {
      navigate('/scenarios');
      return;
    }
    try {
      setLoading(true);
      const res = await sessionsAPI.getSession(sessionId);
      setSession(res.data.session);
      setMessages(res.data.messages || []);

      // Check stored preference or calibrate based on persona
      const storedKey = sessionStorage.getItem(`interviewer_${sessionId}`);
      if (storedKey) {
        setInterviewerKey(storedKey);
      } else if (res.data.session?.ai_persona) {
        const resolved = getInterviewer(res.data.session.ai_persona);
        setInterviewerKey(resolved.id);
      } else {
        setInterviewerKey(DEFAULT_INTERVIEWER_ID);
      }

      // Restore saved accent
      const storedAccent = sessionStorage.getItem(`accent_${sessionId}`);
      if (storedAccent && ACCENTS[storedAccent]) {
        setAccentId(storedAccent);
      }

      if (res.data.responses && res.data.responses.length > 0) {
        const lastResp = res.data.responses[res.data.responses.length - 1];
        setLastResponseId(lastResp.id);
        if (lastResp.analysis) {
          setLatestAnalysis(lastResp.analysis);
        }
      }
    } catch (err) {
      console.error("Session load error:", err);
      navigate('/scenarios');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSession();
  }, [sessionId]);

  // Synchronize interviewer visual state with recording, submitting, and speaking
  useEffect(() => {
    if (isInterviewPaused) {
      setInterviewerState('waiting');
    } else if (isRecording) {
      setInterviewerState('listening');
      stopSpeaking();
    } else if (submitting) {
      setInterviewerState('thinking');
    } else if (isSpeaking) {
      setInterviewerState('speaking');
    } else {
      setInterviewerState('waiting');
    }
  }, [isRecording, submitting, isSpeaking, isInterviewPaused, stopSpeaking]);

  // Preflight Completion Handler
  const handlePreflightComplete = ({ stream, selectedInterviewerId, selectedAccentId, selectedPersonaKey, selectedGender }) => {
    setPreflightStream(stream);
    setInterviewerKey(selectedInterviewerId);
    setAccentId(selectedAccentId);
    sessionStorage.setItem(`interviewer_${sessionId}`, selectedInterviewerId);
    sessionStorage.setItem(`accent_${sessionId}`, selectedAccentId);
    if (selectedPersonaKey) sessionStorage.setItem(`persona_${sessionId}`, selectedPersonaKey);
    if (selectedGender) sessionStorage.setItem(`gender_${sessionId}`, selectedGender);
    setHasCompletedPreflight(true);
    setIsCameraActive(true);
    setIsInterviewPaused(false);

    // Keep backend synchronized with selected interviewer
    sessionsAPI.updateSessionInterviewer(sessionId, { 
      interviewer_id: selectedInterviewerId,
      persona_key: selectedPersonaKey,
      gender: selectedGender 
    }).catch(console.warn);

    // Initialize session camera monitoring
    CameraMonitoringService.startSession(sessionId);
    CameraMonitoringService.setStream(stream);

    const chosen = getInterviewer(selectedInterviewerId);

    // Initial greeting / prompt with matching name and role
    if (messages && messages.length > 0) {
      const opening = messages[0];
      if (opening && opening.sender === 'ai') {
        const cleanOpening = formatInterviewerText(opening.content, chosen);
        setCurrentCaptionText(cleanOpening);
        setTimeout(() => {
          speakInterviewerSpeech(cleanOpening, chosen.voiceGender, selectedAccentId);
        }, 500);
      }
    }
  };

  // Interviewer Gender Switcher
  const handleInterviewerGenderChange = (newGenderKey) => {
    const current = getInterviewer(interviewerKey);
    const personaCfg = getPersonaConfig(current.personaKey || session?.ai_persona);
    const chosen = newGenderKey === 'female' ? personaCfg.female : personaCfg.male;

    setInterviewerKey(chosen.id);
    sessionStorage.setItem(`interviewer_${sessionId}`, chosen.id);
    sessionStorage.setItem(`gender_${sessionId}`, newGenderKey);

    // Keep backend synchronized with selected interviewer and persona
    sessionsAPI.updateSessionInterviewer(sessionId, { 
      interviewer_id: chosen.id,
      persona_key: personaCfg.id,
      gender: newGenderKey 
    }).catch(console.warn);

    const lastAi = [...messages].reverse().find((m) => m.sender === 'ai');
    if (lastAi) {
      const cleanLast = formatInterviewerText(lastAi.content, chosen);
      setCurrentCaptionText(cleanLast);
      if (isSpeaking) {
        stopSpeaking();
        setTimeout(() => {
          speakInterviewerSpeech(cleanLast, chosen.voiceGender, accentId);
        }, 300);
      }
    }
  };

  // Accent Switcher
  const handleAccentChange = (newAccentId) => {
    setAccentId(newAccentId);
    sessionStorage.setItem(`accent_${sessionId}`, newAccentId);
    if (isSpeaking) {
      stopSpeaking();
      const lastAi = [...messages].reverse().find((m) => m.sender === 'ai');
      if (lastAi) {
        const cleanLast = formatInterviewerText(lastAi.content, activeInterviewer);
        setTimeout(() => {
          speakInterviewerSpeech(cleanLast, activeInterviewer.voiceGender, newAccentId);
        }, 300);
      }
    }
  };

  // Camera State Lifecycle Handler: Immediately pause interview if camera is closed, ended, or disconnected
  const handleCameraStateChange = useCallback((newState, message) => {
    setCameraState(newState);

    const isBlocking =
      newState === CameraState.CAMERA_CLOSED ||
      newState === CameraState.CAMERA_DISCONNECTED ||
      newState === CameraState.CAMERA_TRACK_ENDED ||
      newState === CameraState.PERMISSION_DENIED ||
      newState === CameraState.NO_CAMERA_FOUND ||
      newState === CameraState.CAMERA_IN_USE ||
      newState === CameraState.CAMERA_MUTED ||
      newState === CameraState.VIDEO_NOT_RENDERING ||
      newState === CameraState.CAMERA_ERROR;

    if (isBlocking) {
      setIsInterviewPaused(true);
      setCameraPauseMessage("Camera access interrupted. Your interview has been paused. Please enable your camera to resume.");
      if (isRecording) {
        stopRecording();
      }
      stopSpeaking();
      setInterviewerState('waiting');
    } else if (newState === CameraState.CAMERA_ACTIVE) {
      setIsInterviewPaused(false);
      setCameraPauseMessage(null);
      setIsCameraActive(true);
    }
  }, [isRecording, stopRecording, stopSpeaking]);

  const handleStartRecording = () => {
    if (isInterviewPaused) {
      alert("Please turn on your camera before speaking.");
      return;
    }
    stopSpeaking();
    startRecording();
  };

  const handleSubmitResponse = async (parentResponseId = null) => {
    // Prevent duplicate submission if already processing
    if (submitting) return;

    if (isInterviewPaused) {
      setSubmissionError("Please re-enable your camera to resume the interview.");
      return;
    }

    const finalAnswer = (inputMode === 'voice' ? transcript : textInput).trim();
    if (!finalAnswer) {
      setSubmissionError("Please provide an answer before submitting.");
      return;
    }

    setSubmissionError(null);
    setSubmitting(true);
    setInterviewerState('thinking');

    try {
      let uploadedAudioUrl = null;
      if (audioBlob) {
        const formData = new FormData();
        formData.append('audio', audioBlob, 'recording.webm');
        formData.append('transcript', finalAnswer);
        formData.append('duration_seconds', recordingTime.toString());
        try {
          const audioRes = await audioAPI.transcribe(formData);
          uploadedAudioUrl = audioRes.data.audio_url;
        } catch (e) {
          console.warn("Audio upload notice:", e);
        }
      }

      const payload = {
        content: finalAnswer,
        answer_text: finalAnswer,
        audio_url: uploadedAudioUrl,
        duration_seconds: recordingTime,
        audio_duration_seconds: recordingTime,
        parent_response_id: parentResponseId || (isRetrying ? lastResponseId : null),
        attempt_number: isRetrying ? 2 : 1,
        interviewer_id: activeInterviewer.id,
        ai_persona: activeInterviewer.title,
        persona_key: activeInterviewer.personaKey,
        gender: activeInterviewer.gender?.toLowerCase() || 'male',
        accent_id: accentId
      };

      const res = await sessionsAPI.sendMessage(sessionId, payload);

      const analysisData = res.data.analysis || res.data.response?.analysis;
      if (res.data.response) {
        setLastResponseId(res.data.response.id);
      }
      if (analysisData) {
        setLatestAnalysis(analysisData);
      }

      if (res.data.messages) {
        setMessages(res.data.messages);
      }

      // Check whether progression is allowed or candidate must retry
      const allowProg = res.data.allow_progression !== undefined 
        ? res.data.allow_progression 
        : (analysisData?.allow_progression !== undefined ? analysisData.allow_progression : true);

      if (allowProg === false) {
        setIsRetrying(true);
      } else {
        setIsRetrying(false);
      }

      const deliverySummary = CameraMonitoringService.completeSession(sessionId);
      setLatestDeliverySummary(deliverySummary);
      sessionStorage.setItem(`delivery_${sessionId}`, JSON.stringify(deliverySummary));

      // Update dedicated live caption and play interviewer follow-up with matching name and role
      if (res.data.ai_message && res.data.ai_message.content) {
        const cleanAi = formatInterviewerText(res.data.ai_message.content, activeInterviewer);
        setCurrentCaptionText(cleanAi);
        speakInterviewerSpeech(cleanAi);
      }

      // Only clear input and audio upon confirmed successful submission
      resetRecording();
      setTextInput('');
      setSubmissionError(null);
    } catch (err) {
      console.error("Submission error:", err);
      setInterviewerState('waiting');

      if (!err.response || err.code === 'ERR_NETWORK') {
        setSubmissionError("Unable to connect to the server. Please check your connection and try again.");
      } else if (err.response.status === 401) {
        setSubmissionError("Your interview session has expired. Please restart the interview.");
      } else if (err.response.status === 404) {
        setSubmissionError("Interview session not found. Please restart the interview.");
      } else if (err.response.status === 400) {
        setSubmissionError(err.response.data?.error || "Please provide an answer before submitting.");
      } else {
        setSubmissionError("We couldn't process your answer. Please try again.");
      }
      // Candidate's input is strictly preserved in transcript / textInput for immediate retry
    } finally {
      setSubmitting(false);
    }
  };

  const handleFinishSession = async () => {
    stopSpeaking();
    setInterviewerState('completed');

    // Dynamic Closing Statement incorporating chosen interviewer's name and role
    const closingText = (
      `Thank you for completing this interview simulation with me. I am ${activeInterviewer.name}, your ${activeInterviewer.role}. ` +
      `We have thoroughly evaluated your communication and reasoning under pressure. ` +
      `Let's proceed to your full performance breakdown, rubric feedback, and delivery observations.`
    );
    setCurrentCaptionText(closingText);
    speakInterviewerSpeech(closingText);

    const deliveryReport = CameraMonitoringService.completeSession(sessionId);
    sessionStorage.setItem(`delivery_${sessionId}`, JSON.stringify(deliveryReport));
    sessionStorage.setItem(`interviewer_${sessionId}`, interviewerKey);
    sessionStorage.setItem(`accent_${sessionId}`, accentId);

    try {
      await sessionsAPI.completeSession(sessionId, { delivery_metrics: deliveryReport });
    } catch (err) {
      console.warn("Complete session notice:", err);
    }

    setTimeout(() => {
      navigate(`/feedback?session=${sessionId}`);
    }, 2800);
  };

  const lastAiMessage = [...messages].reverse().find((m) => m.sender === 'ai');

  // Synchronize caption text on initial load or message change with matching interviewer name
  useEffect(() => {
    if (lastAiMessage && lastAiMessage.content) {
      const clean = formatInterviewerText(lastAiMessage.content, activeInterviewer);
      setCurrentCaptionText(clean);
    }
  }, [lastAiMessage, activeInterviewer]);

  // Helper for rendering correctness badge
  const renderCorrectnessBadge = (evaluation) => {
    if (!evaluation) return null;
    const correctness = evaluation.correctness || 'partially_correct';

    if (correctness === 'correct') {
      return (
        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>Conceptually Correct</span>
        </span>
      );
    }
    if (correctness === 'incorrect') {
      return (
        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[11px] font-bold">
          <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
          <span>Incorrect Statement</span>
        </span>
      );
    }
    if (correctness === 'insufficient_information') {
      return (
        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[11px] font-bold">
          <HelpCircle className="w-3.5 h-3.5 text-amber-600" />
          <span>Insufficient Detail</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[11px] font-bold">
        <Sparkles className="w-3.5 h-3.5 text-blue-600" />
        <span>Partially Correct</span>
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[75vh]">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-8 h-8 border-3 border-primary-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-text-muted">Loading interview arena and interviewer...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto space-y-5">
      {/* Mandatory Camera Preflight Modal */}
      <CameraPreflightModal
        isOpen={!hasCompletedPreflight && !loading}
        onComplete={handlePreflightComplete}
        scenarioTitle={session?.scenario?.title || 'Communication Interview'}
        initialInterviewerId={interviewerKey}
        initialAccentId={accentId}
      />

      {/* Autoplay Audio Blocked Helper Banner */}
      {isAutoplayBlocked && (
        <div className="p-3.5 rounded-2xl bg-amber-500 text-white shadow-md flex items-center justify-between gap-4 animate-in fade-in duration-200">
          <div className="flex items-center space-x-2.5">
            <Volume2 className="w-5 h-5 flex-shrink-0 animate-pulse" />
            <span className="text-xs font-semibold">
              Audio autoplay was restricted by your browser. Click to activate interviewer voice audio.
            </span>
          </div>
          <button
            type="button"
            onClick={unlockAudio}
            className="px-3 py-1 bg-white text-amber-900 rounded-xl font-bold text-xs hover:bg-amber-50 transition shadow-xs flex-shrink-0"
          >
            Enable Audio
          </button>
        </div>
      )}

      {/* Mid-Interview Camera Closed / Disconnected Alert Banner (Section 7) */}
      {isInterviewPaused && (
        <div className="p-4 rounded-2xl bg-rose-600 text-white shadow-lg flex items-center justify-between gap-4 animate-in slide-in-from-top-4 duration-200">
          <div className="flex items-center space-x-3">
            <AlertCircle className="w-6 h-6 flex-shrink-0 animate-bounce" />
            <div>
              <h4 className="font-bold text-sm">Interview Paused — Camera Required</h4>
              <p className="text-xs text-rose-100 mt-0.5">
                {cameraPauseMessage || "Your camera has been turned off. Please turn it on again to continue the interview."}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              if (analyzerRef.current) analyzerRef.current.reset();
              setIsInterviewPaused(false);
            }}
            className="px-4 py-2 rounded-xl bg-white text-rose-700 font-bold text-xs hover:bg-rose-50 transition shadow-sm flex-shrink-0"
          >
            Check Camera Status
          </button>
        </div>
      )}

      {/* Top Header / Arena Bar */}
      <div className="clean-card p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-primary-600 px-2 py-0.5 rounded-full bg-primary-50">
              {session?.scenario?.category || 'Scenario'}
            </span>
            <span className="text-xs text-text-muted">•</span>
            <span className="text-xs text-text-muted font-medium">
              Interviewer: <strong className="text-text-main">{activeInterviewer.title}</strong>
            </span>
            <span className="text-xs text-text-muted">•</span>
            <span className="text-xs text-text-muted font-medium">
              Accent: <strong className="text-primary-700">{ACCENTS[accentId]?.displayName}</strong>
            </span>
          </div>
          <h1 className="text-lg sm:text-xl font-bold text-text-main mt-1">
            {session?.scenario?.title || 'Active Communication Simulation'}
          </h1>
        </div>

        <div className="flex items-center space-x-3 self-end sm:self-auto">
          {/* Pressure indicator */}
          <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-border text-xs">
            <Flame className="w-3.5 h-3.5 text-amber-500" />
            <span className="text-text-muted">Pressure:</span>
            <span className="font-bold text-text-main">{session?.pressure_level || 3} / 5</span>
          </div>

          {/* Finish Session Button */}
          <button
            type="button"
            onClick={handleFinishSession}
            className="py-2 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs shadow-subtle transition flex items-center space-x-1.5"
          >
            <span>Finish Interview</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* THREE-COLUMN SIMULATOR GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* LEFT COLUMN: Scenario Context & Conversation Thread (3 cols) */}
        <div className="lg:col-span-3 space-y-4 order-2 lg:order-1">
          {/* Context Card */}
          <div className="clean-card p-4 space-y-3">
            <div className="flex items-center space-x-2">
              <Layers className="w-4 h-4 text-primary-600" />
              <h3 className="text-xs font-bold text-text-main">Scenario Context</h3>
            </div>
            <p className="text-xs text-text-muted leading-relaxed">
              {session?.scenario?.description}
            </p>
            {session?.scenario?.context_background && (
              <div className="p-2.5 rounded-lg bg-violet-50/60 border border-violet-100 text-[11px] text-primary-900 leading-relaxed italic">
                "{session.scenario.context_background}"
              </div>
            )}
          </div>

          {/* Transcript History Accordion */}
          <div className="clean-card p-4 space-y-2">
            <button
              onClick={() => setShowFullTranscript(!showFullTranscript)}
              className="w-full flex items-center justify-between text-xs font-semibold text-text-main"
            >
              <span className="flex items-center space-x-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-primary-600" />
                <span>Conversation Thread ({messages.length})</span>
              </span>
              {showFullTranscript ? <ChevronUp className="w-4 h-4 text-text-muted" /> : <ChevronDown className="w-4 h-4 text-text-muted" />}
            </button>

            {showFullTranscript && (
              <div className="space-y-2.5 pt-2 max-h-56 overflow-y-auto text-xs pr-1">
                {messages.map((m, idx) => (
                  <div
                    key={idx}
                    className={`p-2.5 rounded-xl border text-[11px] leading-relaxed ${
                      m.sender === 'ai'
                        ? 'bg-slate-50 border-border text-text-main'
                        : 'bg-primary-50 border-primary-100 text-primary-900 ml-3'
                    }`}
                  >
                    <span className="font-bold block text-[10px] text-text-muted mb-0.5">
                      {m.sender === 'ai' ? activeInterviewer.name : 'Candidate (You)'}
                    </span>
                    {m.sender === 'ai' ? formatInterviewerText(m.content, activeInterviewer) : m.content}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* CENTER COLUMN: 16:9 Video Player & Dedicated Live Captions (6 cols) */}
        <div className="lg:col-span-6 flex flex-col items-center justify-center space-y-4 order-1 lg:order-2">
          {/* Main 16:9 Rectangular Silent Video Player */}
          <InterviewerVideoPlayer
            interviewerKey={interviewerKey}
            accentId={accentId}
            state={interviewerState}
            isSpeakingAudio={isSpeaking}
            onReplay={() => lastAiMessage && speakInterviewerSpeech(lastAiMessage.content)}
            onGenderChange={handleInterviewerGenderChange}
            onAccentChange={handleAccentChange}
            onPreviewAccent={() => previewVoice(accentId, activeInterviewer.voiceGender, activeInterviewer.name)}
            isAudioMuted={isAudioMuted}
            onToggleAudioMute={() => setIsAudioMuted(!isAudioMuted)}
            accentWarning={accentWarning}
            className="w-full"
          />

          {/* DEDICATED LIVE CAPTIONS: Positioned directly below 16:9 Video */}
          <LiveCaptions
            activeText={currentCaptionText}
            spokenCharIndex={currentWordCharIndex}
            isSpeaking={isSpeaking}
            state={interviewerState}
            interviewerName={activeInterviewer.name}
            syncMode={syncMode}
            isCaptionsEnabled={isCaptionsEnabled}
            onToggleCaptions={setIsCaptionsEnabled}
            className="w-full"
          />

          {/* Strict Evaluation Callout (Section 1) */}
          {latestAnalysis?.correctness_evaluation && (
            <div className={`w-full max-w-2xl p-4 rounded-xl border text-xs space-y-2.5 shadow-sm ${
              latestAnalysis.correctness_evaluation.allow_progression === false || latestAnalysis.classification === 'incorrect' || latestAnalysis.classification === 'meaningless' || latestAnalysis.classification === 'irrelevant' || latestAnalysis.classification === 'empty_response'
                ? 'bg-rose-50/90 border-rose-300 text-rose-950'
                : latestAnalysis.correctness_evaluation.correctness === 'correct'
                ? 'bg-emerald-50/90 border-emerald-300 text-emerald-950'
                : 'bg-amber-50/90 border-amber-300 text-amber-950'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {renderCorrectnessBadge(latestAnalysis.correctness_evaluation)}
                  <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-text-muted">
                    Score: {latestAnalysis.correctness_evaluation.score || 0}%
                  </span>
                </div>
                {latestAnalysis.correctness_evaluation.allow_retry !== false && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsRetrying(true);
                      setInputMode('voice');
                    }}
                    className="px-3 py-1 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-[11px] font-bold shadow-xs flex items-center space-x-1.5 transition"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Retry Answer</span>
                  </button>
                )}
              </div>

              {/* Exact Evaluator Feedback Message */}
              {(latestAnalysis.feedback_message || latestAnalysis.correctness_evaluation.feedback_message) && (
                <div className="font-semibold text-xs leading-relaxed text-rose-900 bg-white/60 p-2.5 rounded-lg border border-rose-200">
                  {latestAnalysis.feedback_message || latestAnalysis.correctness_evaluation.feedback_message}
                </div>
              )}

              {/* Short concept explanation of the correct concept */}
              {latestAnalysis.correctness_evaluation.explanation && (
                <p className="text-[11px] leading-relaxed">
                  <strong>Concept Explanation:</strong> {latestAnalysis.correctness_evaluation.explanation}
                </p>
              )}

              {latestAnalysis.correctness_evaluation.what_was_wrong?.length > 0 && (
                <div className="text-[11px] text-rose-700">
                  <strong>Identified Gaps:</strong> {latestAnalysis.correctness_evaluation.what_was_wrong.join(', ')}
                </div>
              )}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Live Delivery & Presence Coach with Closed-Detection Monitoring (3 cols) */}
        <div className="lg:col-span-3 space-y-4 order-3">
          <CameraPreview
            isCameraActive={isCameraActive}
            setIsCameraActive={setIsCameraActive}
            onDeliveryUpdate={(summary) => setLatestDeliverySummary(summary)}
            existingStream={preflightStream}
            onCameraStateChange={handleCameraStateChange}
            onStreamReacquired={(newStream) => {
              setPreflightStream(newStream);
              setIsInterviewPaused(false);
              CameraMonitoringService.setStream(newStream);
            }}
            className="w-full"
          />
        </div>
      </div>

      {/* BOTTOM CONTROL PANEL: Spoken / Text Input */}
      <div className="clean-card p-4 sm:p-5 shadow-card max-w-3xl mx-auto w-full space-y-3">
        {/* Toggle Mode & Timer Bar */}
        <div className="flex items-center justify-between text-xs text-text-muted">
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setInputMode('voice')}
              className={`px-3 py-1 rounded-lg font-semibold transition ${
                inputMode === 'voice'
                  ? 'bg-primary-50 text-primary-700 border border-primary-200'
                  : 'text-text-muted hover:text-text-main'
              }`}
            >
              🎤 Microphone Voice
            </button>
            <button
              type="button"
              onClick={() => setInputMode('text')}
              className={`px-3 py-1 rounded-lg font-semibold transition ${
                inputMode === 'text'
                  ? 'bg-primary-50 text-primary-700 border border-primary-200'
                  : 'text-text-muted hover:text-text-main'
              }`}
            >
              ⌨️ Text Fallback
            </button>

            {isRetrying && (
              <span className="px-2 py-0.5 rounded-full bg-violet-100 text-primary-700 text-[10px] font-bold">
                Attempt 2 (Retry Mode)
              </span>
            )}
          </div>

          {isRecording && (
            <div className="flex items-center space-x-2 text-rose-600 font-mono font-bold animate-pulse">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-600" />
              <span>RECORDING {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}</span>
            </div>
          )}
        </div>

        {permissionError && (
          <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-amber-600" />
            <span>{permissionError}</span>
          </div>
        )}

        {/* User-Friendly Submission Error Banner */}
        {submissionError && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between shadow-xs">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
              <span className="font-medium">{submissionError}</span>
            </div>
            <button
              type="button"
              onClick={() => setSubmissionError(null)}
              className="text-rose-500 hover:text-rose-700 text-xs font-bold px-1.5 py-0.5 rounded hover:bg-rose-100 transition"
              title="Dismiss notice"
            >
              ✕
            </button>
          </div>
        )}

        {inputMode === 'voice' ? (
          <div className="space-y-3">
            {/* Live Transcript Box */}
            <textarea
              rows={2}
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder={
                isRecording
                  ? "Listening to your response... speak clearly into your microphone."
                  : isRetrying
                  ? "Attempt 2: State your corrected reasoning clearly..."
                  : "Click 'Start Speaking' to begin your answer, or type in text mode."
              }
              className="w-full p-3 clean-input text-xs sm:text-sm font-sans"
              disabled={isInterviewPaused}
            />

            {/* Action Bar */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {!isRecording ? (
                  <button
                    type="button"
                    onClick={handleStartRecording}
                    disabled={submitting || isInterviewPaused}
                    className="py-2.5 px-5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-semibold text-xs shadow-subtle transition flex items-center space-x-2 disabled:opacity-50"
                  >
                    <Mic className="w-4 h-4" />
                    <span>Start Speaking</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      stopRecording();
                      setInterviewerState('waiting');
                    }}
                    className="py-2.5 px-5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs shadow-subtle transition flex items-center space-x-2 animate-pulse"
                  >
                    <Square className="w-4 h-4" />
                    <span>Stop Recording</span>
                  </button>
                )}

                {audioUrl && (
                  <div className="flex items-center space-x-2">
                    <audio controls src={audioUrl} className="h-8 w-44" />
                    <button
                      type="button"
                      onClick={resetRecording}
                      title="Discard and re-record"
                      className="p-1.5 text-text-muted hover:text-rose-600 rounded-lg hover:bg-slate-100 transition"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => handleSubmitResponse()}
                disabled={submitting || (!transcript.trim() && !audioBlob) || isRecording || isInterviewPaused}
                className="py-2.5 px-6 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs shadow-subtle transition flex items-center space-x-2 disabled:opacity-40"
              >
                {submitting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                <span>{submitting ? 'Analyzing Response...' : (isRetrying ? 'Submit Refined Answer' : 'Submit Answer')}</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !submitting && !isInterviewPaused && handleSubmitResponse()}
              placeholder={isRetrying ? "Type your refined response..." : "Type your response to practice without a microphone..."}
              className="flex-1 p-2.5 clean-input text-xs sm:text-sm"
              disabled={isInterviewPaused}
            />
            <button
              type="button"
              onClick={() => handleSubmitResponse()}
              disabled={submitting || !textInput.trim() || isInterviewPaused}
              className="py-2.5 px-5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-semibold text-xs flex items-center space-x-1.5 transition disabled:opacity-50"
            >
              {submitting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
              <span>{submitting ? 'Analyzing...' : (isRetrying ? 'Submit Retry' : 'Submit Answer')}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
