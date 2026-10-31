import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Target, 
  Award, 
  Sparkles, 
  CheckCircle2, 
  Flame, 
  Zap, 
  Shield, 
  Volume2, 
  Lightbulb, 
  Hand, 
  ArrowRight 
} from 'lucide-react';
import { missionsAPI, sessionsAPI } from '../services/api';

export default function MissionsPage() {
  const navigate = useNavigate();
  const [missions, setMissions] = useState([]);
  const [userStats, setUserStats] = useState({ completed_count: 0, total_missions: 7, total_xp: 0 });
  const [loading, setLoading] = useState(true);
  const [launching, setLaunching] = useState(false);

  useEffect(() => {
    const fetchMissions = async () => {
      try {
        setLoading(true);
        const res = await missionsAPI.getMissions();
        setMissions(res.data.missions || []);
        setUserStats(res.data.user_stats || { completed_count: 0, total_missions: 7, total_xp: 0 });
      } catch (err) {
        console.error("Missions fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchMissions();
  }, []);

  const handleStartMission = async (mission) => {
    setLaunching(true);
    try {
      const res = await sessionsAPI.createSession({
        session_mode: 'mission',
        ai_persona: mission.ai_persona,
        pressure_level: mission.difficulty === 'Advanced' ? 4 : (mission.difficulty === 'Intermediate' ? 3 : 2),
        difficulty: mission.difficulty
      });
      const session = res.data.session;
      navigate(`/simulator?session=${session.id}&mission=${mission.id}`);
    } catch (err) {
      console.error("Mission launch error:", err);
      alert("Failed to start mission.");
    } finally {
      setLaunching(false);
    }
  };

  const getMissionIcon = (code) => {
    switch (code) {
      case 'M1_SPEAK_UP': return Volume2;
      case 'M2_DEFEND_IDEA': return Shield;
      case 'M3_THINK_ON_FEET': return Zap;
      case 'M4_SAY_NO_POLITELY': return Hand;
      case 'M5_LEAD_THE_TEAM': return Award;
      case 'M6_EXPLAIN_SIMPLY': return Lightbulb;
      default: return Flame;
    }
  };

  if (loading) {
    return (
      <div className="p-8 max-w-5xl mx-auto flex items-center justify-center min-h-[70vh]">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-8 h-8 border-3 border-primary-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-text-muted">Loading MaskOff Missions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-8">
      {/* Banner */}
      <div className="clean-card p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-primary-50 text-primary-700 text-xs font-semibold">
            <Target className="w-3.5 h-3.5" />
            <span>Gamified Communication Challenges</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-text-main tracking-tight">
            MaskOff Missions
          </h1>
          <p className="text-xs sm:text-sm text-text-muted max-w-lg">
            7 targeted real-world communication challenges designed to break conversational inhibitions and earn verified badges.
          </p>
        </div>

        {/* Progress Tracker */}
        <div className="flex items-center space-x-3">
          <div className="p-3 px-4 rounded-xl bg-slate-50 border border-border text-center">
            <span className="text-[10px] uppercase font-bold text-text-muted block">Total XP</span>
            <span className="text-xl font-extrabold text-amber-600">{userStats.total_xp} XP</span>
          </div>
          <div className="p-3 px-4 rounded-xl bg-slate-50 border border-border text-center">
            <span className="text-[10px] uppercase font-bold text-text-muted block">Completed</span>
            <span className="text-xl font-extrabold text-emerald-600">{userStats.completed_count} / {userStats.total_missions}</span>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {missions.map((mission) => {
          const Icon = getMissionIcon(mission.code);
          const isDone = mission.is_completed;

          return (
            <div
              key={mission.id}
              className={`clean-card p-5 flex flex-col justify-between transition group ${
                isDone ? 'border-emerald-200 bg-emerald-50/20' : 'hover:shadow-card-hover'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-8 h-8 rounded-lg bg-primary-50 text-primary-700 flex items-center justify-center">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                      +{mission.xp_reward} XP
                    </span>
                    {isDone && (
                      <span className="flex items-center space-x-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Done</span>
                      </span>
                    )}
                  </div>
                </div>

                <h3 className="text-sm font-bold text-text-main group-hover:text-primary-700 transition mb-0.5">
                  {mission.title}
                </h3>
                <p className="text-xs text-text-muted mb-2 font-medium">{mission.subtitle}</p>

                <p className="text-xs text-text-main leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-border mb-3">
                  {mission.objective}
                </p>
              </div>

              <div className="pt-3 border-t border-border flex items-center justify-between">
                <span className="text-[11px] text-text-muted">
                  Partner: <span className="font-semibold text-text-main">{mission.ai_persona}</span>
                </span>
                <button
                  onClick={() => handleStartMission(mission)}
                  disabled={launching}
                  className="py-1 px-3 rounded-lg bg-primary-600 hover:bg-primary-700 text-white font-semibold text-xs flex items-center space-x-1 transition disabled:opacity-50"
                >
                  <span>{isDone ? 'Replay' : 'Accept'}</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
