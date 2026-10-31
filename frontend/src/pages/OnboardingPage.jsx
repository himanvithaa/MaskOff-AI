import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Check, ArrowRight, Mic, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const GOALS_LIST = [
  "Improve speaking skills",
  "Prepare for interviews",
  "Improve public speaking",
  "Handle difficult conversations",
  "Improve workplace communication",
  "Express opinions confidently",
  "Improve emotional expression"
];

const LANGUAGES = [
  "English (Global / American)",
  "English (British / Academic)",
  "English (Indian / Regional)"
];

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { user, updatePreferences } = useAuth();
  const [selectedGoals, setSelectedGoals] = useState(["Prepare for interviews", "Handle difficult conversations"]);
  const [language, setLanguage] = useState("English (Global / American)");
  const [level, setLevel] = useState("Intermediate");
  const [audioConsent, setAudioConsent] = useState(true);
  const [loading, setLoading] = useState(false);

  const toggleGoal = (goal) => {
    if (selectedGoals.includes(goal)) {
      setSelectedGoals(selectedGoals.filter((g) => g !== goal));
    } else {
      setSelectedGoals([...selectedGoals, goal]);
    }
  };

  const handleFinish = async () => {
    setLoading(true);
    try {
      await updatePreferences({
        primary_goals: selectedGoals,
        preferred_language: language,
        experience_level: level,
        audio_consent: audioConsent
      });
      navigate('/dashboard');
    } catch (err) {
      console.error("Onboarding update failed:", err);
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-xl space-y-6">
        <div className="text-center space-y-1.5">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-primary-50 text-primary-700 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Personalizing Your Companion Experience</span>
          </div>
          <h1 className="text-2xl font-extrabold text-text-main">Welcome, {user?.name || 'Practitioner'}!</h1>
          <p className="text-xs text-text-muted">Configure your practice focus areas to calibrate your AI interviewer coaching.</p>
        </div>

        <div className="clean-card p-6 sm:p-8 shadow-card space-y-6">
          {/* Goals */}
          <div>
            <label className="block text-xs font-bold text-text-main mb-2">
              1. What are your primary communication goals? <span className="font-normal text-text-muted">(Select all that apply)</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
              {GOALS_LIST.map((goal) => {
                const isSelected = selectedGoals.includes(goal);
                return (
                  <button
                    key={goal}
                    type="button"
                    onClick={() => toggleGoal(goal)}
                    className={`p-2.5 rounded-xl border text-left text-xs font-medium transition flex items-center justify-between ${
                      isSelected
                        ? 'bg-primary-50 border-primary-300 text-primary-900'
                        : 'bg-white border-border text-text-main hover:bg-slate-50'
                    }`}
                  >
                    <span>{goal}</span>
                    <div className={`w-3.5 h-3.5 rounded flex items-center justify-center ${isSelected ? 'bg-primary-600 text-white' : 'border border-border'}`}>
                      {isSelected && <Check className="w-2.5 h-2.5" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Language & Experience Level */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-text-main mb-1.5">2. Practice Language</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full p-2.5 clean-input text-xs"
              >
                {LANGUAGES.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-text-main mb-1.5">3. Current Speaking Baseline</label>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                className="w-full p-2.5 clean-input text-xs"
              >
                <option value="Beginner">Beginner (Hesitant, nervous)</option>
                <option value="Intermediate">Intermediate (Comfortable, freeze on pushback)</option>
                <option value="Advanced">Advanced (Seeking tough debate sparring)</option>
              </select>
            </div>
          </div>

          {/* Consent */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-border">
            <div className="flex items-start space-x-2.5">
              <input
                type="checkbox"
                id="consent"
                checked={audioConsent}
                onChange={(e) => setAudioConsent(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded accent-primary-600 cursor-pointer"
              />
              <label htmlFor="consent" className="text-[11px] text-text-muted cursor-pointer leading-relaxed">
                <span className="font-semibold text-text-main">Microphone Audio Consent:</span> I agree to speech recording for live transcription, filler detection, and linguistic feedback. Data is processed locally and privately.
              </label>
            </div>
          </div>

          <button
            onClick={handleFinish}
            disabled={loading || selectedGoals.length === 0}
            className="w-full py-2.5 px-6 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-semibold text-xs shadow-subtle transition flex items-center justify-center space-x-1.5 disabled:opacity-50"
          >
            <span>{loading ? 'Initializing Companion...' : 'Enter MaskOff AI Dashboard'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
