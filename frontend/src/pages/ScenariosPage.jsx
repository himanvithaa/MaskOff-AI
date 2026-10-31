import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  GraduationCap, 
  Briefcase, 
  Mic, 
  MessageSquare, 
  Users, 
  Flame, 
  Search, 
  ArrowRight, 
  Zap,
  Sparkles,
  Sliders,
  User,
  CheckCircle2
} from 'lucide-react';
import { scenariosAPI, sessionsAPI } from '../services/api';
import { ALL_PERSONAS, getPersonaConfig, getInterviewer } from '../config/interviewers';

const CATEGORIES = [
  { id: 'all', name: 'All Arenas', icon: Sparkles },
  { id: 'academic', name: 'Academic', icon: GraduationCap },
  { id: 'professional', name: 'Professional', icon: Briefcase },
  { id: 'public_speaking', name: 'Public Speaking', icon: Mic },
  { id: 'social', name: 'Social', icon: MessageSquare },
  { id: 'leadership', name: 'Leadership', icon: Users },
  { id: 'critical_thinking', name: 'Critical Thinking', icon: Flame },
];

export default function ScenariosPage() {
  const navigate = useNavigate();
  const [scenarios, setScenarios] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Customization modal state
  const [activeScenario, setActiveScenario] = useState(null);
  const [chosenPersonaKey, setChosenPersonaKey] = useState('technical-interviewer');
  const [chosenGender, setChosenGender] = useState('male');
  const [chosenPressure, setChosenPressure] = useState(3);
  const [startingSession, setStartingSession] = useState(false);

  useEffect(() => {
    const fetchScenarios = async () => {
      try {
        setLoading(true);
        const res = await scenariosAPI.getScenarios({
          category: selectedCategory !== 'all' ? selectedCategory : undefined,
          difficulty: selectedDifficulty !== 'all' ? selectedDifficulty : undefined,
          q: searchQuery || undefined,
        });
        setScenarios(res.data.scenarios);
      } catch (err) {
        console.error("Failed to fetch scenarios:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchScenarios();
  }, [selectedCategory, selectedDifficulty, searchQuery]);

  const openConfigModal = (scenario) => {
    setActiveScenario(scenario);
    const defP = (scenario.default_persona || '').toLowerCase();
    const config = getPersonaConfig(defP);
    setChosenPersonaKey(config.id);
    const isFemale = defP.includes('female') || defP.includes('ananya') || defP.includes('meera') || defP.includes('priya') || defP.includes('hr');
    setChosenGender(isFemale ? 'female' : 'male');
    setChosenPressure(scenario.suggested_pressure_level || 3);
  };

  const handleLaunchSimulation = async () => {
    if (!activeScenario) return;
    setStartingSession(true);
    try {
      const personaConfig = getPersonaConfig(chosenPersonaKey);
      const chosenInterviewer = chosenGender === 'female' ? personaConfig.female : personaConfig.male;
      const res = await sessionsAPI.createSession({
        scenario_id: activeScenario.id,
        ai_persona: chosenInterviewer.title,
        persona_key: chosenPersonaKey,
        interviewer_id: chosenInterviewer.id,
        gender: chosenGender,
        interviewer_gender: chosenGender,
        pressure_level: chosenPressure,
        difficulty: activeScenario.difficulty,
      });
      const session = res.data.session;
      sessionStorage.setItem(`interviewer_${session.id}`, chosenInterviewer.id);
      sessionStorage.setItem(`persona_${session.id}`, chosenPersonaKey);
      sessionStorage.setItem(`gender_${session.id}`, chosenGender);
      navigate(`/simulator?session=${session.id}`);
    } catch (err) {
      console.error("Error creating session:", err);
      alert("Failed to start session.");
    } finally {
      setStartingSession(false);
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-primary-50 text-primary-700 text-xs font-semibold mb-1">
          <Zap className="w-3.5 h-3.5" />
          <span>Real-World Scenario Simulator</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-text-main">Practice Arenas</h1>
        <p className="text-xs sm:text-sm text-text-muted mt-0.5">
          Choose a scenario, calibrate your interviewer persona, and practise under realistic pressure.
        </p>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isSelected = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                isSelected
                  ? 'bg-primary-600 text-white shadow-subtle'
                  : 'bg-white border border-border text-text-muted hover:text-text-main hover:bg-slate-50'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{cat.name}</span>
            </button>
          );
        })}
      </div>

      {/* Search & Difficulty Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="w-3.5 h-3.5 text-text-muted absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search scenarios by title, keyword, or context..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 clean-input text-xs"
          />
        </div>

        <select
          value={selectedDifficulty}
          onChange={(e) => setSelectedDifficulty(e.target.value)}
          className="p-2 clean-input text-xs sm:w-44"
        >
          <option value="all">All Difficulties</option>
          <option value="Beginner">Beginner</option>
          <option value="Intermediate">Intermediate</option>
          <option value="Advanced">Advanced</option>
        </select>
      </div>

      {/* Scenarios Grid */}
      {loading ? (
        <div className="py-20 text-center">
          <div className="w-8 h-8 border-3 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs text-text-muted">Loading arenas...</p>
        </div>
      ) : scenarios.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {scenarios.map((scenario) => {
            const diffColor =
              scenario.difficulty === 'Advanced'
                ? 'bg-rose-50 text-rose-700 border-rose-200'
                : scenario.difficulty === 'Intermediate'
                ? 'bg-amber-50 text-amber-700 border-amber-200'
                : 'bg-emerald-50 text-emerald-700 border-emerald-200';

            return (
              <div
                key={scenario.id}
                className="clean-card p-5 flex flex-col justify-between hover:shadow-card-hover transition group"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-primary-600">
                      {scenario.category.replace('_', ' ')}
                    </span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${diffColor}`}>
                      {scenario.difficulty}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-text-main group-hover:text-primary-700 transition mb-1.5">
                    {scenario.title}
                  </h3>

                  <p className="text-xs text-text-muted leading-relaxed line-clamp-3 mb-3">
                    {scenario.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-border flex items-center justify-between">
                  <span className="text-[11px] text-text-muted">
                    Partner: <span className="font-semibold text-text-main">{scenario.default_persona}</span>
                  </span>
                  <button
                    onClick={() => openConfigModal(scenario)}
                    className="py-1.5 px-3 rounded-lg bg-primary-50 text-primary-700 hover:bg-primary-100 border border-primary-200 text-xs font-semibold flex items-center space-x-1 transition"
                  >
                    <span>Configure</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16 text-text-muted clean-card p-8 text-xs">
          No scenarios match your search filter.
        </div>
      )}

      {/* Configure & Launch Modal */}
      {activeScenario && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-border w-full max-w-md p-6 rounded-2xl shadow-card space-y-5">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-primary-600">
                  Arena Calibration
                </span>
                <h3 className="text-base font-bold text-text-main mt-0.5">{activeScenario.title}</h3>
              </div>
              <button onClick={() => setActiveScenario(null)} className="text-text-muted hover:text-text-main text-sm">
                ✕
              </button>
            </div>

            {/* Persona Selection */}
            <div>
              <label className="block text-xs font-bold text-text-main mb-1.5">Select Partner Persona (8 Options)</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-48 overflow-y-auto pr-1">
                {ALL_PERSONAS.map((p) => {
                  const isSelected = chosenPersonaKey === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setChosenPersonaKey(p.id)}
                      className={`p-2 rounded-xl border text-left text-xs transition flex flex-col justify-between ${
                        isSelected
                          ? 'bg-primary-50 border-primary-400 text-primary-900 font-semibold ring-1 ring-primary-500/20'
                          : 'bg-white border-border text-text-muted hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="font-bold text-text-main">{p.title}</span>
                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-primary-600" />}
                      </div>
                      <span className="text-[10px] text-text-muted mt-0.5 line-clamp-1">{p.category}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Gender Selection for Selected Persona */}
            {(() => {
              const currentPersonaConfig = getPersonaConfig(chosenPersonaKey);
              return (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-text-main">
                      Interviewer Gender & Identity
                    </label>
                    <span className="text-[10px] text-text-muted">
                      Same questioning style & evaluation
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setChosenGender('male')}
                      className={`p-2.5 rounded-xl border text-left text-xs transition flex items-center space-x-2.5 ${
                        chosenGender === 'male'
                          ? 'bg-blue-50/70 border-blue-400 text-blue-900 ring-1 ring-blue-400/20 font-semibold'
                          : 'bg-white border-border text-text-muted hover:bg-slate-50'
                      }`}
                    >
                      <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center flex-shrink-0">
                        <User className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-text-main truncate">
                          {currentPersonaConfig.male.name} (Male)
                        </div>
                        <div className="text-[10px] text-text-muted truncate">
                          {currentPersonaConfig.title}
                        </div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setChosenGender('female')}
                      className={`p-2.5 rounded-xl border text-left text-xs transition flex items-center space-x-2.5 ${
                        chosenGender === 'female'
                          ? 'bg-emerald-50/70 border-emerald-400 text-emerald-900 ring-1 ring-emerald-400/20 font-semibold'
                          : 'bg-white border-border text-text-muted hover:bg-slate-50'
                      }`}
                    >
                      <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0">
                        <User className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-text-main truncate">
                          {currentPersonaConfig.female.name} (Female)
                        </div>
                        <div className="text-[10px] text-text-muted truncate">
                          {currentPersonaConfig.title}
                        </div>
                      </div>
                    </button>
                  </div>
                  <p className="text-[10px] text-text-muted leading-tight">
                    {chosenGender === 'female' ? currentPersonaConfig.female.description : currentPersonaConfig.male.description}
                  </p>
                </div>
              );
            })()}

            {/* Pressure Slider */}
            <div>
              <div className="flex items-center justify-between text-xs font-bold text-text-main mb-1">
                <span>Pressure Intensity</span>
                <span className="text-amber-600">Level {chosenPressure} / 5</span>
              </div>
              <input
                type="range"
                min="1"
                max="5"
                step="1"
                value={chosenPressure}
                onChange={(e) => setChosenPressure(parseInt(e.target.value))}
                className="w-full accent-primary-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-text-muted mt-1">
                <span>1: Friendly</span>
                <span>3: Critical</span>
                <span>5: Extreme</span>
              </div>
            </div>

            {/* Launch Action */}
            <div className="flex justify-end space-x-2 pt-2 border-t border-border">
              <button
                type="button"
                onClick={() => setActiveScenario(null)}
                className="py-2 px-3 text-xs text-text-muted hover:text-text-main"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleLaunchSimulation}
                disabled={startingSession}
                className="py-2 px-5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-semibold text-xs shadow-subtle transition flex items-center space-x-1.5 disabled:opacity-50"
              >
                <Mic className="w-3.5 h-3.5" />
                <span>{startingSession ? 'Launching...' : 'Start Practising'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
