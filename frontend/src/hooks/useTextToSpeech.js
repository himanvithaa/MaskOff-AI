import { useState, useEffect, useRef, useCallback } from 'react';
import { resolveAccentVoice, ACCENTS, DEFAULT_ACCENT_ID } from '../config/voices';

export const useTextToSpeech = ({
  onStart,
  onEnd,
  onWordBoundary,
  preferredGender = 'male',
  preferredAccentId = DEFAULT_ACCENT_ID,
  customPitch = null
} = {}) => {
  const [isSupported, setIsSupported] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isEnabled, setIsEnabled] = useState(true);
  const [rate, setRate] = useState(1.0); // 0.8, 1.0, 1.2
  const [voices, setVoices] = useState([]);
  const [selectedVoiceInfo, setSelectedVoiceInfo] = useState(null);
  const [currentWordCharIndex, setCurrentWordCharIndex] = useState(0);
  const [syncMode, setSyncMode] = useState('word_boundary'); // 'word_boundary' or 'smooth_cadence'
  const [isAutoplayBlocked, setIsAutoplayBlocked] = useState(false);

  const utteranceRef = useRef(null);
  const cadenceIntervalRef = useRef(null);

  // Load voices and resolve accent
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      setIsSupported(true);

      const loadVoices = () => {
        const availableVoices = window.speechSynthesis.getVoices();
        setVoices(availableVoices);
        const resolved = resolveAccentVoice(preferredAccentId, preferredGender, availableVoices);
        setSelectedVoiceInfo(resolved);
      };

      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }

    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      if (cadenceIntervalRef.current) {
        clearInterval(cadenceIntervalRef.current);
      }
    };
  }, [preferredAccentId, preferredGender]);

  const stop = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setCurrentWordCharIndex(0);
      if (cadenceIntervalRef.current) {
        clearInterval(cadenceIntervalRef.current);
      }
      if (onEnd) onEnd();
    }
  }, [onEnd]);

  const speak = useCallback((
    text,
    overrideGender = null,
    overrideAccentId = null,
    overridePitch = null
  ) => {
    if (!isEnabled || !isSupported || !text) return;

    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }
    if (cadenceIntervalRef.current) {
      clearInterval(cadenceIntervalRef.current);
    }

    // Clean markdown/symbols
    const cleanText = text
      .replace(/[*_#`~]/g, '')
      .replace(/\[.*?\]/g, '')
      .replace(/\(.*?\)/g, '')
      .trim();

    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utteranceRef.current = utterance;

    const activeGender = overrideGender || preferredGender;
    const activeAccentId = overrideAccentId || preferredAccentId;
    const available = window.speechSynthesis.getVoices();
    const resolved = resolveAccentVoice(
      activeAccentId,
      activeGender,
      available.length ? available : voices
    );

    setSelectedVoiceInfo(resolved);

    if (resolved.voice) {
      utterance.voice = resolved.voice;
    }

    const accentConfig = ACCENTS[activeAccentId] || ACCENTS.american;
    utterance.rate = rate * (accentConfig.rateModifier || 1.0);

    const pitchVal = overridePitch !== null 
      ? overridePitch 
      : customPitch !== null 
      ? customPitch 
      : accentConfig.pitchModifier[activeGender] || (activeGender === 'female' ? 1.05 : 0.95);
    utterance.pitch = pitchVal;

    setCurrentWordCharIndex(0);
    setSyncMode('word_boundary');
    let boundaryFired = false;

    // Track word-level boundaries when provided by browser engine
    utterance.onboundary = (event) => {
      if (event.name === 'word' || event.charIndex !== undefined) {
        boundaryFired = true;
        setSyncMode('word_boundary');
        setCurrentWordCharIndex(event.charIndex);
        if (onWordBoundary) {
          onWordBoundary(event.charIndex, event.charLength || 0);
        }
      }
    };

    utterance.onstart = () => {
      setIsSpeaking(true);
      setIsAutoplayBlocked(false);
      if (onStart) onStart();

      // Fallback cadence timer if browser does not emit boundary events
      setTimeout(() => {
        if (!boundaryFired && cleanText.length > 0) {
          setSyncMode('smooth_cadence');
          const totalWords = cleanText.split(/\s+/).length;
          // ~140 words per minute adjusted by rate
          const estimatedDurationMs = (totalWords / (140 * utterance.rate)) * 60 * 1000;
          const intervalMs = Math.max(80, Math.floor(estimatedDurationMs / cleanText.length));

          let charIdx = 0;
          cadenceIntervalRef.current = setInterval(() => {
            charIdx += 4;
            if (charIdx >= cleanText.length) {
              clearInterval(cadenceIntervalRef.current);
            } else {
              setCurrentWordCharIndex(charIdx);
              if (onWordBoundary) onWordBoundary(charIdx, 4);
            }
          }, intervalMs);
        }
      }, 350);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      setCurrentWordCharIndex(cleanText.length);
      if (cadenceIntervalRef.current) {
        clearInterval(cadenceIntervalRef.current);
      }
      if (onEnd) onEnd();
    };

    utterance.onerror = (e) => {
      console.warn("SpeechSynthesis error:", e);
      if (e.error === 'not-allowed') {
        setIsAutoplayBlocked(true);
      }
      setIsSpeaking(false);
      if (cadenceIntervalRef.current) {
        clearInterval(cadenceIntervalRef.current);
      }
      if (onEnd) onEnd();
    };

    try {
      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn("Autoplay audio blocked:", err);
      setIsAutoplayBlocked(true);
    }
  }, [
    isEnabled,
    isSupported,
    voices,
    rate,
    preferredGender,
    preferredAccentId,
    customPitch,
    onStart,
    onEnd,
    onWordBoundary
  ]);

  const previewVoice = useCallback((accentId, gender, interviewerName = 'Arjun') => {
    const previewPhrases = {
      american: `Hello, I am ${interviewerName}. I will be assessing your reasoning with a General American accent. Let's begin.`,
      polish: `Hello, I am ${interviewerName}. I will be conducting your evaluation in English with a Polish accent. Let's test your depth.`,
      african: `Hello, I am ${interviewerName}. I will be conducting your session with an authentic African English accent. Let us begin.`
    };
    const phrase = previewPhrases[accentId] || previewPhrases.american;
    speak(phrase, gender, accentId);
  }, [speak]);

  const unlockAudio = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const silent = new SpeechSynthesisUtterance(' ');
      window.speechSynthesis.speak(silent);
      setIsAutoplayBlocked(false);
    }
  }, []);

  return {
    isSupported,
    isSpeaking,
    isEnabled,
    setIsEnabled,
    rate,
    setRate,
    speak,
    stop,
    previewVoice,
    unlockAudio,
    isAutoplayBlocked,
    currentWordCharIndex,
    syncMode,
    selectedVoiceInfo,
    accentWarning: selectedVoiceInfo?.warning || null,
    regionalLabel: selectedVoiceInfo?.regionalLabel || 'Standard',
    isNativeAccent: selectedVoiceInfo?.isNativeAccent || false
  };
};
