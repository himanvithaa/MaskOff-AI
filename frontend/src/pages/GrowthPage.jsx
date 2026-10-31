import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  TrendingUp, 
  Award, 
  AlertTriangle, 
  Sparkles, 
  ArrowRight, 
  BarChart2,
  Mic
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { dashboardAPI } from '../services/api';

export default function GrowthPage() {
  const navigate = useNavigate();
  const [growthData, setGrowthData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeMetric, setActiveMetric] = useState('overall');

  useEffect(() => {
    const fetchGrowth = async () => {
      try {
        setLoading(true);
        const res = await dashboardAPI.getProgress();
        setGrowthData(res.data);
      } catch (err) {
        console.error("Growth fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchGrowth();
  }, []);

  if (loading) {
    return (
      <div className="p-8 max-w-5xl mx-auto flex items-center justify-center min-h-[70vh]">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-8 h-8 border-3 border-primary-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-text-muted">Loading growth analytics...</p>
        </div>
      </div>
    );
  }

  const hasData = growthData?.has_sufficient_data && growthData.timeline.length > 0;
  const timeline = growthData?.timeline || [];

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-cyan-50 text-cyan-700 text-xs font-semibold mb-1">
          <TrendingUp className="w-3.5 h-3.5" />
          <span>Longitudinal Performance Analytics</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-text-main">Communication Progress</h1>
        <p className="text-xs sm:text-sm text-text-muted mt-0.5">
          Review your progression over time across clarity, depth, argumentation, and recovery.
        </p>
      </div>

      {/* Snapshot Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="clean-card p-5 space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted flex items-center space-x-1">
            <Award className="w-3.5 h-3.5 text-emerald-600" />
            <span>Strongest Skill</span>
          </span>
          <div className="text-lg font-bold text-emerald-700">
            {growthData?.strongest_skill || 'Relevance'}
          </div>
          <span className="text-[11px] text-text-muted block">Highest baseline across sessions</span>
        </div>

        <div className="clean-card p-5 space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted flex items-center space-x-1">
            <Sparkles className="w-3.5 h-3.5 text-cyan-600" />
            <span>Most Improved</span>
          </span>
          <div className="text-lg font-bold text-cyan-700">
            {growthData?.most_improved || 'Structure'}
          </div>
          <span className="text-[11px] text-text-muted block">Highest calculated delta over time</span>
        </div>

        <div className="clean-card p-5 space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted flex items-center space-x-1">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
            <span>Growth Edge</span>
          </span>
          <div className="text-lg font-bold text-amber-700">
            {growthData?.weakest_skill || 'Technical Depth'}
          </div>
          <span className="text-[11px] text-text-muted block">Recommended focus for next arena</span>
        </div>
      </div>

      {/* Longitudinal Progression Chart */}
      <div className="clean-card p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-text-main">Performance Trajectory Across Sessions</h3>
            <p className="text-xs text-text-muted">Calculated strictly from actual stored session evaluations</p>
          </div>

          <div className="flex items-center space-x-1 overflow-x-auto pb-1">
            {[
              { id: 'overall', label: 'Overall' },
              { id: 'clarity', label: 'Clarity' },
              { id: 'relevance', label: 'Relevance' },
              { id: 'structure', label: 'Structure' },
              { id: 'depth', label: 'Depth' },
              { id: 'argumentation', label: 'Argument' },
            ].map((m) => (
              <button
                key={m.id}
                onClick={() => setActiveMetric(m.id)}
                className={`py-1 px-2.5 rounded-lg text-xs font-semibold transition ${
                  activeMetric === m.id
                    ? 'bg-primary-600 text-white shadow-subtle'
                    : 'bg-slate-100 text-text-muted hover:text-text-main'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {hasData ? (
          <div className="w-full h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timeline}>
                <defs>
                  <linearGradient id="metricGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#7C3AED" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="session" stroke="#94A3B8" tick={{ fill: '#64748B', fontSize: 11 }} />
                <YAxis domain={[40, 100]} stroke="#94A3B8" tick={{ fill: '#64748B', fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', borderRadius: '8px', color: '#111827', fontSize: '11px' }}
                />
                <Area
                  type="monotone"
                  dataKey={activeMetric}
                  name={activeMetric.toUpperCase()}
                  stroke="#7C3AED"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#metricGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="py-14 text-center text-text-muted space-y-2">
            <BarChart2 className="w-10 h-10 text-slate-300 mx-auto" />
            <h4 className="text-xs font-bold text-text-main">Complete 2 Simulations to Render Progress</h4>
            <p className="text-xs max-w-sm mx-auto">
              Historical progression graphs render automatically once multiple sessions are completed.
            </p>
            <button
              onClick={() => navigate('/scenarios')}
              className="py-2 px-4 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold inline-flex items-center space-x-1.5 transition mt-2"
            >
              <Mic className="w-3.5 h-3.5" />
              <span>Practice Now</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
