import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Mic, 
  Flame, 
  TrendingUp, 
  Award, 
  ArrowRight, 
  Dna, 
  AlertTriangle, 
  CheckCircle2, 
  Target, 
  Calendar,
  Sparkles
} from 'lucide-react';
import { dashboardAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        const res = await dashboardAPI.getDashboard();
        setDashboardData(res.data);
      } catch (err) {
        console.error("Dashboard error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="p-8 max-w-4xl mx-auto flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-8 h-8 border-3 border-primary-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-text-muted">Loading your communication overview...</p>
        </div>
      </div>
    );
  }

  const stats = dashboardData?.stats || {
    total_sessions: 0,
    average_score: 75.0,
    improvement_percentage: 0,
    current_streak_days: 0,
  };

  const recentSessions = dashboardData?.recent_sessions || [];
  const recommendedExercises = dashboardData?.recommended_exercises || [];
  const dnaSummary = dashboardData?.weakness_dna_summary || {};
  const topWeakness = (dnaSummary.persistent_weaknesses || [])[0] || null;
  const latestSession = recentSessions[0] || null;

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto space-y-8">
      {/* 1. Welcome Message & Primary Action */}
      <div className="clean-card p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-primary-50 text-primary-700 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Interactive AI Interviewer & Delivery Coach</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-text-main tracking-tight">
            Welcome back, {user?.name || 'Practitioner'}!
          </h1>
          <p className="text-xs sm:text-sm text-text-muted">
            Every conversation is an opportunity to improve.
          </p>
        </div>

        <div>
          <button
            onClick={() => navigate('/scenarios')}
            className="py-3 px-6 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-semibold text-xs shadow-subtle transition flex items-center space-x-2 transform active:scale-95"
          >
            <Mic className="w-4 h-4" />
            <span>Start Practice</span>
          </button>
        </div>
      </div>

      {/* 2. Core Snapshot Metrics (Score & Streak) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Overall Communication Progress */}
        <div className="clean-card p-5 space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted flex items-center space-x-1">
            <Award className="w-3.5 h-3.5 text-primary-600" />
            <span>Overall Communication Score</span>
          </span>
          <div className="text-2xl font-extrabold text-text-main">
            {stats.average_score > 0 ? stats.average_score : '75.0'}
            <span className="text-xs font-normal text-text-muted"> / 100</span>
          </div>
          <span className="text-[11px] text-text-muted block">
            {stats.total_sessions} completed practice sessions
          </span>
        </div>

        {/* Practice Streak */}
        <div className="clean-card p-5 space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted flex items-center space-x-1">
            <Flame className="w-3.5 h-3.5 text-amber-500" />
            <span>Active Practice Streak</span>
          </span>
          <div className="text-2xl font-extrabold text-amber-600">
            {stats.current_streak_days} <span className="text-xs font-normal text-text-muted">days</span>
          </div>
          <span className="text-[11px] text-text-muted block">
            Daily momentum builds confidence
          </span>
        </div>

        {/* Delta Progress */}
        <div className="clean-card p-5 space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted flex items-center space-x-1">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
            <span>Growth Delta</span>
          </span>
          <div className="text-2xl font-extrabold text-emerald-600">
            {stats.improvement_percentage > 0 ? `+${stats.improvement_percentage}%` : 'Baseline'}
          </div>
          <button
            onClick={() => navigate('/growth')}
            className="text-[11px] font-semibold text-primary-600 hover:underline block pt-0.5"
          >
            View analytics on Progress page →
          </button>
        </div>
      </div>

      {/* 3. Top Recurring Weakness (From Weakness DNA) */}
      <div className="clean-card p-6 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Dna className="w-4 h-4 text-primary-600" />
            <h2 className="text-sm font-bold text-text-main">Top Recurring Weakness</h2>
          </div>
          <button
            onClick={() => navigate('/weakness-dna')}
            className="text-xs font-semibold text-primary-600 hover:underline"
          >
            Inspect Weakness DNA →
          </button>
        </div>

        {topWeakness ? (
          <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200/80 flex items-start space-x-3">
            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-amber-900 block">{topWeakness.weakness}</span>
              <p className="text-[11px] text-amber-800">
                Recurring pattern detected across {topWeakness.recurrence_count} simulations. Focus on anchoring your arguments with concrete technical mechanisms.
              </p>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-slate-50 border border-border text-xs text-text-muted">
            Complete your initial practice sessions to isolate persistent communication weaknesses.
          </div>
        )}
      </div>

      {/* 4. Recommended Next Exercise */}
      <div className="clean-card p-6 space-y-3">
        <div className="flex items-center space-x-2">
          <Target className="w-4 h-4 text-cyan-600" />
          <h2 className="text-sm font-bold text-text-main">Recommended Next Exercise</h2>
        </div>

        {recommendedExercises.length > 0 ? (
          <div
            onClick={() => navigate(`/simulator?scenario=${recommendedExercises[0].scenario_id}`)}
            className="p-4 rounded-xl bg-slate-50 hover:bg-violet-50/50 border border-border hover:border-primary-200 transition cursor-pointer group flex items-center justify-between"
          >
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-primary-600">
                Targeting: {recommendedExercises[0].targeted_skill_gap}
              </span>
              <h3 className="text-sm font-bold text-text-main group-hover:text-primary-700 transition">
                {recommendedExercises[0].scenario?.title || 'Targeted Exercise'}
              </h3>
              <p className="text-xs text-text-muted line-clamp-1">
                {recommendedExercises[0].reason}
              </p>
            </div>
            <ArrowRight className="w-4 h-4 text-text-muted group-hover:text-primary-600 transition ml-4 flex-shrink-0" />
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-slate-50 border border-border text-xs text-text-muted">
            Choose an arena in Practice to initialize personalized recommendations.
          </div>
        )}
      </div>

      {/* 5. Recent Practice Session */}
      <div className="clean-card p-6 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-text-main">Recent Practice Session</h2>
          <button
            onClick={() => navigate('/history')}
            className="text-xs font-semibold text-primary-600 hover:underline"
          >
            All History →
          </button>
        </div>

        {latestSession ? (
          <div className="p-4 rounded-xl bg-slate-50 border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center space-x-2 text-[10px] text-text-muted mb-0.5">
                <span className="capitalize">{latestSession.category}</span>
                <span>•</span>
                <span>{latestSession.ai_persona}</span>
                <span>•</span>
                <span>{latestSession.date}</span>
              </div>
              <h3 className="text-sm font-bold text-text-main">{latestSession.scenario_title}</h3>
            </div>

            <div className="flex items-center space-x-3">
              <span className="text-sm font-bold text-primary-700">
                {latestSession.score ? `${Math.round(latestSession.score)}/100` : 'Complete'}
              </span>
              <button
                onClick={() => navigate(`/feedback?session=${latestSession.id}`)}
                className="py-1.5 px-3 rounded-lg bg-white border border-border hover:bg-slate-100 text-xs font-semibold text-text-main transition"
              >
                Review Feedback
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-6 text-xs text-text-muted">
            No completed sessions yet. Launch your first simulation!
          </div>
        )}
      </div>
    </div>
  );
}
