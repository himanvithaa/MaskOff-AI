import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Sparkles, Wrench, ArrowLeft, ShieldCheck, Clock } from 'lucide-react';

export default function MindSpacePage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-6 max-w-2xl mx-auto">
      <div className="clean-card p-8 sm:p-12 text-center space-y-6 shadow-card w-full border border-border">
        {/* Coming Soon Badge */}
        <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-violet-50 text-primary-700 border border-violet-200 text-xs font-bold">
          <Sparkles className="w-3.5 h-3.5 text-primary-600 animate-spin" />
          <span>Coming Soon • Upgrade in Progress</span>
        </div>

        {/* Maintenance Icon */}
        <div className="relative w-20 h-20 mx-auto rounded-3xl bg-slate-100 flex items-center justify-center border border-border">
          <Heart className="w-10 h-10 text-primary-500 stroke-[1.5]" />
          <span className="absolute -bottom-1 -right-1 w-7 h-7 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-sm">
            <Wrench className="w-3.5 h-3.5" />
          </span>
        </div>

        {/* Title & Description */}
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-text-main tracking-tight">
            MindSpace is Under Maintenance
          </h1>
          <p className="text-xs sm:text-sm text-text-muted max-w-md mx-auto leading-relaxed">
            Our emotional reframing, reflective journaling, and communication wellness engine is currently undergoing architecture refinement to deliver higher-quality adaptive guidance.
          </p>
        </div>

        {/* Informative Feature Preview */}
        <div className="p-4 rounded-xl bg-slate-50 border border-border text-left space-y-2 text-xs">
          <span className="font-bold text-text-main flex items-center space-x-1.5">
            <Clock className="w-3.5 h-3.5 text-primary-600" />
            <span>What's Arriving in MindSpace:</span>
          </span>
          <ul className="space-y-1 text-text-muted pl-1">
            <li className="flex items-start space-x-2">
              <span className="text-primary-600 font-bold">•</span>
              <span>Cognitive reframing for high-pressure meeting anxiety.</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-primary-600 font-bold">•</span>
              <span>Post-session debriefing and speech composure journals.</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-primary-600 font-bold">•</span>
              <span>Breathing pacing synchronized with delivery feedback.</span>
            </li>
          </ul>
        </div>

        {/* Action Button */}
        <div className="pt-2">
          <button
            onClick={() => navigate('/dashboard')}
            className="py-3 px-6 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs shadow-subtle transition flex items-center space-x-2 mx-auto transform active:scale-95"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Dashboard</span>
          </button>
        </div>

        <p className="text-[11px] text-text-subtle">
          Backend models and encrypted reflection endpoints remain securely preserved.
        </p>
      </div>
    </div>
  );
}
