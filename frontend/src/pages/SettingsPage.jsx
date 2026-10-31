import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Settings, 
  User, 
  Trash2, 
  Check, 
  Cpu, 
  LogOut,
  Camera,
  Mic,
  ShieldCheck
} from 'lucide-react';
import { profileAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function SettingsPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [preferredLang, setPreferredLang] = useState(user?.preferences?.preferred_language || 'English');
  const [audioConsent, setAudioConsent] = useState(user?.preferences?.audio_consent ?? true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      if (user.preferences) {
        setPreferredLang(user.preferences.preferred_language || 'English');
        setAudioConsent(user.preferences.audio_consent ?? true);
      }
    }
  }, [user]);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg('');
    try {
      await profileAPI.updateProfile({
        name,
        preferred_language: preferredLang,
        audio_consent: audioConsent,
      });
      setSuccessMsg('Settings saved successfully.');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      console.error("Save settings error:", err);
      alert("Failed to save settings.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAllData = async () => {
    const confirmation = window.prompt("Type 'DELETE' to confirm permanent erasure of all your practice sessions, Weakness DNA, and journal entries:");
    if (confirmation !== 'DELETE') return;

    setDeleting(true);
    try {
      await profileAPI.deleteData();
      alert("All simulation data has been erased.");
      window.location.reload();
    } catch (err) {
      console.error("Data deletion error:", err);
      alert("Failed to delete user data.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto space-y-6">
      <div>
        <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold mb-1">
          <Settings className="w-3.5 h-3.5" />
          <span>Profile & Privacy Settings</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-text-main">Settings</h1>
        <p className="text-xs sm:text-sm text-text-muted mt-0.5">
          Manage practitioner profile, speech & webcam permissions, and data erasure controls.
        </p>
      </div>

      {successMsg && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center space-x-2">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Profile Form */}
      <div className="clean-card p-6 sm:p-7 space-y-4">
        <h2 className="text-sm font-bold text-text-main flex items-center space-x-2">
          <User className="w-4 h-4 text-primary-600" />
          <span>Practitioner Profile</span>
        </h2>

        <form onSubmit={handleSaveProfile} className="space-y-3.5 text-xs">
          <div>
            <label className="block text-text-main font-semibold mb-1">Full Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-2.5 clean-input"
            />
          </div>

          <div>
            <label className="block text-text-main font-semibold mb-1">Email</label>
            <input
              type="email"
              disabled
              value={user?.email || ''}
              className="w-full p-2.5 clean-input bg-slate-50 text-text-muted cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-text-main font-semibold mb-1">Practice Language</label>
            <select
              value={preferredLang}
              onChange={(e) => setPreferredLang(e.target.value)}
              className="w-full p-2.5 clean-input"
            >
              <option value="English">English (Global / American)</option>
              <option value="British English">English (British / Academic)</option>
              <option value="Indian English">English (Indian / Regional)</option>
            </select>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-border flex items-start space-x-2.5">
            <input
              type="checkbox"
              id="audioConsent"
              checked={audioConsent}
              onChange={(e) => setAudioConsent(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded accent-primary-600 cursor-pointer"
            />
            <label htmlFor="audioConsent" className="text-text-muted cursor-pointer leading-relaxed text-[11px]">
              <span className="font-semibold text-text-main">Microphone Audio Consent:</span> Allow microphone audio processing for speech transcription and filler word metrics.
            </label>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={saving}
              className="py-2 px-5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-semibold text-xs shadow-subtle transition disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>
      </div>

      {/* System Engine Status */}
      <div className="clean-card p-6 space-y-3">
        <h2 className="text-sm font-bold text-text-main flex items-center space-x-2">
          <Cpu className="w-4 h-4 text-primary-600" />
          <span>System & Engine Architecture</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-text-muted">
          <div className="p-3 rounded-xl bg-slate-50 border border-border space-y-0.5">
            <span className="font-bold text-text-main block">AI Partner Engine</span>
            <span>Modular LLM API with high-fidelity zero-key demo fallback active.</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-border space-y-0.5">
            <span className="font-bold text-text-main block">Presentation Delivery Coach</span>
            <span>Client-side optical framing and gaze analysis via MediaDevices.</span>
          </div>
        </div>
      </div>

      {/* Data Erasure (GDPR) */}
      <div className="clean-card p-6 space-y-3 border-rose-200">
        <div className="flex items-center space-x-2 text-rose-700 font-bold text-sm">
          <Trash2 className="w-4 h-4" />
          <span>Data Isolation & Permanent Erasure</span>
        </div>
        <p className="text-xs text-text-muted leading-relaxed">
          You can permanently erase all historical simulation sessions, Weakness DNA profiles, and private journal entries.
        </p>
        <button
          onClick={handleDeleteAllData}
          disabled={deleting}
          className="py-2 px-4 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 font-semibold text-xs transition"
        >
          {deleting ? 'Erasing...' : 'Permanently Erase All My Data'}
        </button>
      </div>

      {/* Sign Out */}
      <div className="pt-2 flex justify-between items-center text-xs text-text-muted">
        <span>MaskOff AI v2.0 • Minimal Upgrade</span>
        <button
          onClick={() => {
            logout();
            navigate('/login');
          }}
          className="py-1.5 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 text-text-main font-semibold flex items-center space-x-1 transition"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
}
