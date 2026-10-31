import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Sparkles, 
  ArrowRight, 
  ShieldAlert, 
  Zap, 
  Mic, 
  Dna, 
  Repeat, 
  Heart, 
  GraduationCap, 
  Briefcase, 
  Camera, 
  CheckCircle2, 
  Volume2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import InterviewerAvatar from '../components/simulation/InterviewerAvatar';

export default function LandingPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const handleCTA = () => {
    if (isAuthenticated) {
      navigate('/dashboard');
    } else {
      navigate('/register');
    }
  };

  return (
    <div className="min-h-screen bg-background text-text-main selection:bg-primary-100">
      {/* Top Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-border px-6 py-3.5">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2.5 cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center shadow-sm">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="font-extrabold text-base tracking-tight text-text-main">
                MaskOff AI
              </span>
              <span className="text-[10px] text-text-muted font-medium ml-1.5 hidden sm:inline">Communication Training</span>
            </div>
          </div>

          <div className="hidden md:flex items-center space-x-6 text-xs font-semibold text-text-muted">
            <a href="#features" className="hover:text-text-main transition">AI Interviewers</a>
            <a href="#delivery" className="hover:text-text-main transition">Live Delivery Coach</a>
            <a href="#dna" className="hover:text-text-main transition">Weakness DNA</a>
            <a href="#how-it-works" className="hover:text-text-main transition">How It Works</a>
          </div>

          <div className="flex items-center space-x-2.5">
            {isAuthenticated ? (
              <button
                onClick={() => navigate('/dashboard')}
                className="py-2 px-4 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-semibold text-xs shadow-subtle flex items-center space-x-1.5 transition"
              >
                <span>Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <>
                <button
                  onClick={() => navigate('/login')}
                  className="py-1.5 px-3 rounded-lg text-text-muted hover:text-text-main text-xs font-semibold transition"
                >
                  Sign In
                </button>
                <button
                  onClick={() => navigate('/register')}
                  className="py-2 px-4 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-semibold text-xs shadow-subtle flex items-center space-x-1.5 transition"
                >
                  <span>Start Practising</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-16 px-6 max-w-5xl mx-auto text-center space-y-6">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-primary-50 text-primary-700 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>AI Communication Training Platform</span>
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-text-main leading-tight max-w-3xl mx-auto">
          Your Voice. Your Thoughts.{' '}
          <span className="text-primary-600">No More Holding Back.</span>
        </h1>

        <p className="text-base sm:text-lg text-text-muted max-w-2xl mx-auto leading-relaxed">
          Practise difficult conversations, challenge your thinking, and master verbal delivery under pressure with realistic AI interviewers.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            onClick={handleCTA}
            className="w-full sm:w-auto px-7 py-3 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-semibold text-xs shadow-subtle transition flex items-center justify-center space-x-2 transform active:scale-95"
          >
            <span>Start Free Practice</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <a
            href="#features"
            className="w-full sm:w-auto px-7 py-3 rounded-xl bg-white border border-border hover:bg-slate-50 text-text-main font-semibold text-xs transition flex items-center justify-center"
          >
            Explore Upgrades
          </a>
        </div>

        <p className="text-xs text-text-subtle italic pt-2">
          "MaskOff AI doesn't teach you what to think. It helps you express what you already know, think and feel."
        </p>

        {/* Live AI Interviewer Simulator Hero Preview */}
        <div className="pt-10">
          <div className="clean-card p-6 sm:p-8 max-w-3xl mx-auto shadow-card border-border-dark flex flex-col md:flex-row items-center justify-between gap-8">
            {/* Interviewer Visual */}
            <div className="flex-1 flex flex-col items-center">
              <InterviewerAvatar
                state="speaking"
                interviewerKey="meera"
                persona="Meera – Supportive Mentor"
                message="Welcome! In a viva or boardroom, clear reasoning beats rehearsed answers. Walk me through your design decisions."
                className="scale-90 sm:scale-100"
              />
            </div>

            {/* Feature Highlights Column */}
            <div className="flex-1 text-left space-y-3.5 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-border space-y-1">
                <span className="font-bold text-text-main flex items-center space-x-1.5">
                  <Volume2 className="w-3.5 h-3.5 text-primary-600" />
                  <span>Real Reference Person AI Interviewers</span>
                </span>
                <p className="text-text-muted text-[11px] leading-relaxed">
                  Engage with Indian interviewers (Arjun, Meera, Vikram, Ananya, Rahul) with active speaking, listening, and thinking visual states.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-border space-y-1">
                <span className="font-bold text-text-main flex items-center space-x-1.5">
                  <Camera className="w-3.5 h-3.5 text-cyan-600" />
                  <span>Live Expression & Delivery Coach</span>
                </span>
                <p className="text-text-muted text-[11px] leading-relaxed">
                  On-device camera framing, eye contact observations, and head composure tracking with 8 presence states.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-border space-y-1">
                <span className="font-bold text-text-main flex items-center space-x-1.5">
                  <Repeat className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Repeat-and-Compare Engine</span>
                </span>
                <p className="text-text-muted text-[11px] leading-relaxed">
                  Retry the same question and observe mathematical deltas on clarity, structure, and filler words.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 1: AI Interviewers Showcase */}
      <section id="features" className="py-16 px-6 max-w-5xl mx-auto border-t border-border">
        <div className="text-center max-w-xl mx-auto mb-12 space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-primary-600">Dynamic Interviewers</span>
          <h2 className="text-2xl font-bold text-text-main">Indian Professional Interviewer Personas</h2>
          <p className="text-xs text-text-muted">
            Realistic interviewers who actively speak, listen, challenge incorrect answers, and adapt to your spoken performance.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="clean-card p-5 space-y-2">
            <span className="font-bold text-text-main block">7 Expressive Character States</span>
            <p className="text-text-muted text-[11px] leading-relaxed">
              Idle, Listening, Thinking, Speaking, Happy, Encouraging, and Explaining states render seamlessly without heavy 3D rendering.
            </p>
          </div>
          <div className="clean-card p-5 space-y-2">
            <span className="font-bold text-text-main block">Character Selection</span>
            <p className="text-text-muted text-[11px] leading-relaxed">
              Switch between Aoi (Thoughtful Guide), Ren (Sharp Sparring Partner), and Kaia (Warm Coach) with custom speech rates.
            </p>
          </div>
          <div className="clean-card p-5 space-y-2">
            <span className="font-bold text-text-main block">Text-to-Speech Integration</span>
            <p className="text-text-muted text-[11px] leading-relaxed">
              Natural browser speech synthesis with play, stop, speed multiplier controls, and live synchronized mouth animation.
            </p>
          </div>
        </div>
      </section>

      {/* Section 2: Live Expression & Delivery Coach */}
      <section id="delivery" className="py-16 px-6 max-w-5xl mx-auto border-t border-border">
        <div className="text-center max-w-xl mx-auto mb-12 space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-600">Major Upgrade 2</span>
          <h2 className="text-2xl font-bold text-text-main">Live Expression & Delivery Coach</h2>
          <p className="text-xs text-text-muted">
            Observe your physical presentation delivery with strictly objective, non-psychological computer vision metrics.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="clean-card p-4 space-y-1">
            <span className="font-bold text-text-main block">Face Visibility %</span>
            <p className="text-text-muted text-[11px]">
              Verifies that your face remains continuously centered inside the frame during explanations.
            </p>
          </div>
          <div className="clean-card p-4 space-y-1">
            <span className="font-bold text-text-main block">Eye-Level Camera Framing</span>
            <p className="text-text-muted text-[11px]">
              Observes if the camera is too close, too far, or tilted off-center for audience eye contact.
            </p>
          </div>
          <div className="clean-card p-4 space-y-1">
            <span className="font-bold text-text-main block">Screen Engagement Gaze</span>
            <p className="text-text-muted text-[11px]">
              Estimates whether visual attention is maintained toward the audience or shifting away.
            </p>
          </div>
          <div className="clean-card p-4 space-y-1">
            <span className="font-bold text-text-main block">Head Movement Stability</span>
            <p className="text-text-muted text-[11px]">
              Observes posture and head shifts to encourage composed, steady delivery under pressure.
            </p>
          </div>
        </div>
      </section>

      {/* Section 3: Dual Combined Feedback */}
      <section id="dna" className="py-16 px-6 max-w-5xl mx-auto border-t border-border">
        <div className="text-center max-w-xl mx-auto mb-12 space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-primary-600">Major Upgrade 3</span>
          <h2 className="text-2xl font-bold text-text-main">Dual Speech & Delivery Analysis</h2>
          <p className="text-xs text-text-muted">
            Separated into Section A (Communication Content) and Section B (Delivery Poise), side-by-side.
          </p>
        </div>

        <div className="clean-card p-6 sm:p-8 max-w-2xl mx-auto space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-violet-50/60 border border-violet-100">
              <span className="font-bold text-primary-950 block mb-1">Section A: Communication</span>
              <ul className="space-y-1 text-primary-800 text-[11px]">
                <li>• Answer Relevance & Depth</li>
                <li>• Explanation Structure & Logic</li>
                <li>• Exact Filler Frequency Detection</li>
                <li>• Actionable Coaching Suggestions</li>
              </ul>
            </div>

            <div className="p-4 rounded-xl bg-cyan-50/60 border border-cyan-100">
              <span className="font-bold text-cyan-950 block mb-1">Section B: Presentation Delivery</span>
              <ul className="space-y-1 text-cyan-800 text-[11px]">
                <li>• Face Visibility Percentage</li>
                <li>• Eye-Level Framing Observations</li>
                <li>• Gaze Consistency Observations</li>
                <li>• Practical Lighting & Angle Tips</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-6 text-center text-xs text-text-muted">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-3.5 h-3.5 text-primary-600" />
            <span className="font-bold text-text-main">MaskOff AI</span>
            <span>— Practise Being Yourself in High-Pressure Situations.</span>
          </div>
          <p>© 2025-2026 MaskOff AI. Clean Minimal Upgrade.</p>
        </div>
      </footer>
    </div>
  );
}
