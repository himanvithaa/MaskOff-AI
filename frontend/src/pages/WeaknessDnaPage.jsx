import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Dna, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  Target, 
  ArrowRight,
  TrendingUp
} from 'lucide-react';
import { 
  Radar, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  ResponsiveContainer,
  Tooltip
} from 'recharts';
import { weaknessAPI, recommendationsAPI } from '../services/api';

export default function WeaknessDnaPage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDNA = async () => {
      try {
        setLoading(true);
        const [profRes, recsRes] = await Promise.all([
          weaknessAPI.getProfile(),
          recommendationsAPI.getRecommendations(),
        ]);
        setProfile(profRes.data.profile);
        setRecommendations(recsRes.data.recommendations || []);
      } catch (err) {
        console.error("Weakness DNA error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDNA();
  }, []);

  if (loading) {
    return (
      <div className="p-8 max-w-5xl mx-auto flex items-center justify-center min-h-[70vh]">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-8 h-8 border-3 border-primary-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-text-muted">Loading Weakness DNA profile...</p>
        </div>
      </div>
    );
  }

  const dnaMetrics = profile?.dna_metrics || {
    clarity: 70,
    relevance: 70,
    structure: 70,
    technical_depth: 70,
    fluency: 70,
    argumentation: 70,
    pressure_handling: 70,
    recovery_ability: 70,
  };

  const radarData = [
    { skill: 'Clarity', score: dnaMetrics.clarity },
    { skill: 'Relevance', score: dnaMetrics.relevance },
    { skill: 'Structure', score: dnaMetrics.structure },
    { skill: 'Depth', score: dnaMetrics.technical_depth },
    { skill: 'Fluency', score: dnaMetrics.fluency },
    { skill: 'Argument', score: dnaMetrics.argumentation },
    { skill: 'Pressure', score: dnaMetrics.pressure_handling },
    { skill: 'Recovery', score: dnaMetrics.recovery_ability },
  ];

  const topStrengths = profile?.top_strengths || [];
  const persistentWeaknesses = profile?.persistent_weaknesses || [];
  const recurringPatterns = profile?.recurring_patterns || [];

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-8">
      {/* Banner */}
      <div className="clean-card p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-primary-50 text-primary-700 text-xs font-semibold">
            <Dna className="w-3.5 h-3.5" />
            <span>Signature Multi-Session Profile</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-text-main tracking-tight">
            My Communication DNA
          </h1>
          <p className="text-xs sm:text-sm text-text-muted max-w-lg">
            Aggregated behavioral fingerprint updated after every completed simulation. Identifies persistent friction points across viva, interviews, and debate.
          </p>
        </div>

        <div className="p-4 px-6 rounded-2xl bg-slate-50 border border-border text-center flex-shrink-0">
          <span className="text-[10px] uppercase font-bold text-text-muted block">DNA Score</span>
          <span className="text-3xl font-extrabold text-primary-600">
            {profile?.overall_dna_score || '72.0'}
            <span className="text-xs text-text-muted font-normal"> / 100</span>
          </span>
          <span className="text-[10px] text-text-subtle block mt-0.5">
            {profile?.total_sessions_analyzed || 0} Sessions Synthesized
          </span>
        </div>
      </div>

      {/* Grid: Radar Polygon & Cross-Scenario Patterns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Radar (6 cols) */}
        <div className="lg:col-span-6 clean-card p-6 flex flex-col justify-between">
          <span className="text-xs font-bold text-text-main mb-2 block">DNA Competency Polygon</span>
          <div className="w-full h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="#E2E8F0" />
                <PolarAngleAxis dataKey="skill" stroke="#64748B" tick={{ fill: '#334155', fontSize: 10 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#CBD5E1" tick={{ fill: '#94A3B8', fontSize: 8 }} />
                <Radar name="My DNA" dataKey="score" stroke="#7C3AED" fill="#7C3AED" fillOpacity={0.25} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', borderRadius: '8px', color: '#111827', fontSize: '11px' }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-[11px] text-text-muted text-center pt-2 border-t border-border">
            Weighted across clarity, argumentation, depth, and pressure recovery.
          </p>
        </div>

        {/* Patterns (6 cols) */}
        <div className="lg:col-span-6 clean-card p-6 space-y-3">
          <h2 className="text-sm font-bold text-text-main flex items-center space-x-1.5">
            <Sparkles className="w-4 h-4 text-primary-600" />
            <span>Cross-Scenario Behavioral Patterns</span>
          </h2>
          <p className="text-xs text-text-muted">
            Recurring tendencies detected across differing scenario categories:
          </p>

          <div className="space-y-2 pt-1">
            {recurringPatterns.map((pat, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-border flex items-start space-x-2.5">
                <span className="w-5 h-5 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center flex-shrink-0 text-[10px] font-bold mt-0.5">
                  {idx + 1}
                </span>
                <p className="text-xs text-text-main leading-relaxed">{pat}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Strengths & Persistent Weaknesses */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="clean-card p-5 space-y-3">
          <h3 className="text-xs font-bold text-emerald-700 flex items-center space-x-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Strongest Communication Skills</span>
          </h3>
          <div className="space-y-2">
            {topStrengths.map((str, idx) => (
              <div key={idx} className="p-2.5 rounded-xl bg-slate-50 border border-border flex items-center justify-between text-xs">
                <span className="font-medium text-text-main">{str.skill}</span>
                <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold text-[10px]">
                  {str.confidence}% Confidence
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="clean-card p-5 space-y-3">
          <h3 className="text-xs font-bold text-rose-700 flex items-center space-x-1.5">
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            <span>Persistent Weakness Friction Points</span>
          </h3>
          <div className="space-y-2">
            {persistentWeaknesses.map((w, idx) => (
              <div key={idx} className="p-2.5 rounded-xl bg-slate-50 border border-border flex items-center justify-between text-xs">
                <div>
                  <span className="font-medium text-text-main block">{w.weakness}</span>
                  <span className="text-[10px] text-text-muted">Detected {w.recurrence_count} times</span>
                </div>
                <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                  w.severity === 'High' ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700'
                }`}>
                  {w.severity} Priority
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Cross-Scenario Recommended Exercises */}
      <div className="clean-card p-6 space-y-4">
        <div className="flex items-center space-x-2">
          <Target className="w-4 h-4 text-primary-600" />
          <h3 className="text-sm font-bold text-text-main">Targeted Adaptive Recommendations</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {recommendations.map((rec) => (
            <div
              key={rec.id}
              onClick={() => navigate(`/simulator?scenario=${rec.scenario_id}`)}
              className="p-3.5 rounded-xl bg-slate-50 hover:bg-violet-50/50 border border-border hover:border-primary-200 transition cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-primary-600 block mb-1">
                  Target: {rec.targeted_skill_gap}
                </span>
                <h4 className="text-xs font-bold text-text-main group-hover:text-primary-700 transition mb-1">
                  {rec.scenario?.title}
                </h4>
                <p className="text-[11px] text-text-muted line-clamp-2">{rec.reason}</p>
              </div>

              <div className="pt-2 text-xs font-semibold text-primary-600 flex items-center space-x-1 mt-2">
                <span>Start Practice</span>
                <ArrowRight className="w-3 h-3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
