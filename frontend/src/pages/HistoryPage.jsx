import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { History, Award, ArrowRight, Mic, Search } from 'lucide-react';
import { sessionsAPI } from '../services/api';

export default function HistoryPage() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        const res = await sessionsAPI.getSessions();
        setSessions(res.data.sessions || []);
      } catch (err) {
        console.error("History fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const filtered = sessions.filter((s) => {
    const titleMatch = (s.scenario_title || '').toLowerCase().includes(search.toLowerCase());
    const personaMatch = (s.ai_persona || '').toLowerCase().includes(search.toLowerCase());
    return titleMatch || personaMatch;
  });

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-6">
      <div>
        <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-primary-50 text-primary-700 text-xs font-semibold mb-1">
          <History className="w-3.5 h-3.5" />
          <span>Session Archive</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-text-main">Practice History</h1>
        <p className="text-xs sm:text-sm text-text-muted mt-0.5">
          Review all your recorded simulations, transcripts, delivery feedback, and retry comparisons.
        </p>
      </div>

      <div className="relative">
        <Search className="w-3.5 h-3.5 text-text-muted absolute left-3 top-3" />
        <input
          type="text"
          placeholder="Search by scenario name or interviewer..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2 clean-input text-xs"
        />
      </div>

      {loading ? (
        <div className="py-20 text-center">
          <div className="w-8 h-8 border-3 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs text-text-muted">Loading history...</p>
        </div>
      ) : filtered.length > 0 ? (
        <div className="space-y-3">
          {filtered.map((s) => (
            <div
              key={s.id}
              className="clean-card p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:shadow-card-hover transition"
            >
              <div>
                <div className="flex items-center space-x-2 text-[10px] text-text-muted mb-0.5">
                  <span className="capitalize">{s.category}</span>
                  <span>•</span>
                  <span>Interviewer: <span className="font-semibold text-text-main">{s.ai_persona}</span></span>
                  <span>•</span>
                  <span className="text-amber-600">Pressure {s.pressure_level}/5</span>
                </div>
                <h3 className="text-sm font-bold text-text-main">{s.scenario_title}</h3>
                <span className="text-[10px] text-text-muted mt-0.5 block">
                  {new Date(s.started_at).toLocaleString()}
                </span>
              </div>

              <div className="flex items-center space-x-4">
                <div className="text-left sm:text-right">
                  <span className="text-[10px] font-bold uppercase text-text-muted block">Score</span>
                  <span className="text-base font-bold text-primary-700">
                    {s.overall_score ? `${Math.round(s.overall_score)}/100` : 'Complete'}
                  </span>
                </div>

                <button
                  onClick={() => navigate(`/feedback?session=${s.id}`)}
                  className="py-1.5 px-3.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-border text-xs font-semibold text-text-main flex items-center space-x-1 transition"
                >
                  <span>Review Feedback</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="clean-card p-12 text-center text-text-muted text-xs space-y-2">
          <p>No practice sessions found.</p>
          <button
            onClick={() => navigate('/scenarios')}
            className="py-2 px-4 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold inline-flex items-center space-x-1.5 transition"
          >
            <Mic className="w-3.5 h-3.5" />
            <span>Launch Simulation</span>
          </button>
        </div>
      )}
    </div>
  );
}
