import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Award, 
  CheckCircle2, 
  AlertCircle, 
  AlertTriangle, 
  Lightbulb, 
  Repeat, 
  ArrowRight, 
  Sparkles, 
  MessageSquare, 
  Camera, 
  Mic, 
  HelpCircle,
  BookOpen,
  Volume2,
  ShieldCheck,
  ChevronRight,
  Target,
  TrendingUp,
  Compass
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
import { sessionsAPI } from '../services/api';
import DeliveryFeedback from '../components/feedback/DeliveryFeedback';
import { getInterviewer } from '../config/interviewers';
import { ACCENTS } from '../config/voices';

export default function FeedbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session');

  const [session, setSession] = useState(null);
  const [responses, setResponses] = useState([]);
  const [selectedResponseIndex, setSelectedResponseIndex] = useState(0);
  const [deliveryData, setDeliveryData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeedback = async () => {
      if (!sessionId) {
        navigate('/dashboard');
        return;
      }
      try {
        setLoading(true);
        const res = await sessionsAPI.getSession(sessionId);
        setSession(res.data.session);
        setResponses(res.data.responses || []);
        if (res.data.responses && res.data.responses.length > 0) {
          setSelectedResponseIndex(res.data.responses.length - 1);
        }

        // Retrieve camera delivery observations from session storage or backend session record
        let deliveryObj = null;
        const savedDelivery = sessionStorage.getItem(`delivery_${sessionId}`);
        if (savedDelivery) {
          try {
            deliveryObj = JSON.parse(savedDelivery);
          } catch (e) {
            console.warn("Delivery parse error:", e);
          }
        }
        if (!deliveryObj && res.data.session?.delivery_metrics) {
          deliveryObj = res.data.session.delivery_metrics;
        }
        if (deliveryObj) {
          setDeliveryData(deliveryObj);
        }
      } catch (err) {
        console.error("Feedback fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchFeedback();
  }, [sessionId, navigate]);

  if (loading) {
    return (
      <div className="p-8 max-w-5xl mx-auto flex items-center justify-center min-h-[70vh]">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-8 h-8 border-3 border-primary-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-text-muted">Loading communication and delivery feedback...</p>
        </div>
      </div>
    );
  }

  const currentResp = responses[selectedResponseIndex] || null;
  const analysis = currentResp?.analysis || null;
  const correctnessEval = analysis?.correctness_evaluation || null;

  const savedInterviewerId = sessionStorage.getItem(`interviewer_${sessionId}`);
  const savedAccentId = sessionStorage.getItem(`accent_${sessionId}`);
  const interviewer = getInterviewer(savedInterviewerId || session?.ai_persona);
  const accentInfo = ACCENTS[savedAccentId] || ACCENTS.american;

  const radarData = analysis ? [
    { metric: 'Relevance', value: analysis.scores?.relevance || 75 },
    { metric: 'Clarity', value: analysis.scores?.clarity || 75 },
    { metric: 'Structure', value: analysis.scores?.structure || 70 },
    { metric: 'Depth', value: analysis.scores?.specificity || 70 },
    { metric: 'Fluency', value: analysis.scores?.speaking_fluency || 75 },
    { metric: 'Argument', value: analysis.scores?.argumentation || 70 },
    { metric: 'Pressure', value: analysis.scores?.pressure_handling || 70 },
  ] : [];

  // Section A Aggregate Stats across all session responses
  const answerStats = useMemo(() => {
    let correct = 0;
    let incorrect = 0;
    let partiallyCorrect = 0;
    let scoreSum = 0;
    const gapsSet = new Set();

    responses.forEach((r) => {
      const an = r.analysis;
      const c = (an?.classification || an?.correctness || an?.correctness_evaluation?.correctness || '').toLowerCase();
      if (c === 'correct') correct++;
      else if (['incorrect', 'meaningless', 'irrelevant', 'empty_response'].includes(c)) incorrect++;
      else partiallyCorrect++;

      const s = an?.overall_score || an?.score || 70;
      scoreSum += s;

      if (an?.what_was_wrong && Array.isArray(an.what_was_wrong)) {
        an.what_was_wrong.forEach((gap) => gapsSet.add(gap));
      }
      if (an?.missing_concepts && Array.isArray(an.missing_concepts)) {
        an.missing_concepts.forEach((concept) => gapsSet.add(concept));
      }
    });

    const total = Math.max(1, responses.length);
    return {
      correct,
      incorrect,
      partiallyCorrect,
      averageScore: Math.round(scoreSum / total),
      conceptsRequiringImprovement: Array.from(gapsSet).filter(Boolean).slice(0, 6)
    };
  }, [responses]);

  // Section D: Areas to Improve (Unified across Answer, Speech, and Camera)
  const areasToImprove = useMemo(() => {
    const list = [];
    if (answerStats.incorrect > 0) {
      list.push({
        category: 'Answer Quality',
        text: `${answerStats.incorrect} response(s) contained factual inaccuracies or did not align with expected conceptual mechanisms.`
      });
    }
    if (answerStats.conceptsRequiringImprovement.length > 0) {
      list.push({
        category: 'Missing Core Concepts',
        text: `Key concepts needing revision: ${answerStats.conceptsRequiringImprovement.slice(0, 3).join(', ')}.`
      });
    }
    if ((analysis?.nlp_metrics?.filler_frequency_per_100_words || 0) > 3) {
      list.push({
        category: 'Speech Delivery',
        text: `Elevated filler frequency observed (${analysis.nlp_metrics.filler_frequency_per_100_words}% per 100 words). Practice using deliberate silent pauses instead of filler crutches.`
      });
    }
    if (deliveryData?.faceVisibilityPercent < 75) {
      list.push({
        category: 'Camera Framing',
        text: `Face was framed inside the viewport for only ${deliveryData.faceVisibilityPercent}% of the interview. Visual delivery score was adjusted proportionally.`
      });
    }
    if (deliveryData?.directGazePercent < 65) {
      list.push({
        category: 'Camera Gaze',
        text: `Frequent gaze deviation away from lens detected (${deliveryData.directGazePercent}% direct gaze). Try maintaining a more consistent camera-facing direction.`
      });
    }
    if (deliveryData?.cameraInterruptionsCount > 0) {
      list.push({
        category: 'Hardware Integrity',
        text: `Camera was interrupted ${deliveryData.cameraInterruptionsCount} time(s). Ensure steady webcam connection to preserve uninterrupted assessment.`
      });
    }
    if (list.length === 0) {
      list.push({
        category: 'Presentation Master',
        text: 'Outstanding conceptual command, composed speech delivery, and optimal visual poise maintained throughout the simulation.'
      });
    }
    return list;
  }, [answerStats, analysis, deliveryData]);

  // Section E: Recommended Practice Arenas
  const recommendedPractices = useMemo(() => {
    const recs = [];
    if (answerStats.incorrect > 0 || answerStats.partiallyCorrect > 0) {
      recs.push({
        title: 'College Viva Voce Defense',
        description: 'Exacting technical defense challenging architectural trade-offs, protocols, and edge cases under high scrutiny.',
        tag: 'Technical Depth',
        slug: 'college-viva-voce'
      });
    }
    if ((analysis?.nlp_metrics?.filler_frequency_per_100_words || 0) > 2) {
      recs.push({
        title: 'Elevator Pitch Challenge',
        description: 'Practice succinct, fluent verbal communication with strict pause control and zero filler sounds.',
        tag: 'Speech Fluency',
        slug: 'elevator-pitch'
      });
    }
    recs.push({
      title: 'Unexpected Professor Question',
      description: 'Rapid on-the-spot response training under skeptical examination and intense camera presence monitoring.',
      tag: 'Poise Under Pressure',
      slug: 'unexpected-professor-question'
    });
    return recs.slice(0, 2);
  }, [answerStats, analysis]);

  // Helper for rendering transcript with highlighted filler words
  const renderHighlightedTranscript = () => {
    if (!analysis || !currentResp) return null;

    const raw = currentResp.answer_text || '';
    const breakdown = analysis.nlp_metrics?.filler_breakdown || {};
    const hasFillers = Object.keys(breakdown).length > 0;

    if (!hasFillers) {
      return (
        <p className="text-xs sm:text-sm text-text-main leading-relaxed bg-slate-50 p-4 rounded-xl border border-border">
          "{raw}"
        </p>
      );
    }

    // Highlight known filler patterns in transcript
    const fillerRegex = /\b(um+|uh+|ah+|eh+|er+|h+m+|you know|i mean|so yeah|basically|actually|like)\b/gi;
    const parts = raw.split(fillerRegex);

    return (
      <div className="text-xs sm:text-sm text-text-main leading-relaxed bg-slate-50 p-4 rounded-xl border border-border space-y-2">
        <p>
          "
          {raw.split(/\b/).map((token, i) => {
            const lower = token.toLowerCase();
            const isFiller = (
              ['um', 'umm', 'uh', 'uhh', 'ah', 'aah', 'eh', 'er', 'hmm', 'hm', 'basically', 'actually', 'you know'].includes(lower) ||
              (lower === 'like' && breakdown['like'])
            );

            if (isFiller) {
              return (
                <span
                  key={i}
                  className="bg-rose-100 text-rose-800 font-bold px-1.5 py-0.5 rounded mx-0.5 border border-rose-200 inline-block text-[11px]"
                  title={`Detected verbal filler: "${token}"`}
                >
                  {token}
                </span>
              );
            }
            return <span key={i}>{token}</span>;
          })}
          "
        </p>
        <span className="text-[10px] text-text-subtle block italic">
          * Highlighted words represent detected hesitation sounds and verbal crutches.
        </span>
      </div>
    );
  };

  // Helper for rendering correctness status badge
  const renderCorrectnessHeader = () => {
    if (!correctnessEval) return null;
    const status = correctnessEval.correctness || 'partially_correct';

    if (status === 'correct') {
      return (
        <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-300 text-xs font-bold">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Conceptually Correct</span>
        </span>
      );
    }
    if (status === 'incorrect') {
      return (
        <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-300 text-xs font-bold">
          <AlertCircle className="w-4 h-4 text-rose-600" />
          <span>Answer Incorrect</span>
        </span>
      );
    }
    if (status === 'insufficient_information') {
      return (
        <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-300 text-xs font-bold">
          <HelpCircle className="w-4 h-4 text-amber-600" />
          <span>Insufficient Technical Information</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-300 text-xs font-bold">
        <Sparkles className="w-4 h-4 text-blue-600" />
        <span>Partially Correct</span>
      </span>
    );
  };

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8">
      {/* Top Banner */}
      <div className="clean-card p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center space-x-1.5 px-3 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold mb-2">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Simulation Evaluated & Weakness DNA Updated</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-text-main">
            {session?.scenario_title || 'Session Feedback & Performance Evaluation'}
          </h1>
          <p className="text-xs sm:text-sm text-text-muted mt-1">
            Interviewer: <span className="font-semibold text-text-main">{interviewer.title}</span> • Accent: <span className="font-semibold text-primary-700">{accentInfo.displayName}</span> • Pressure: <span className="font-bold text-amber-600">Level {session?.pressure_level}/5</span>
          </p>
        </div>

        {/* Triple Pillar Summary Badges */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Answer Quality Score */}
          <div className="p-3 px-4 rounded-xl bg-slate-50 border border-border text-center">
            <span className="text-[10px] uppercase font-bold text-text-muted block">Answer Quality</span>
            <span className="text-xl font-extrabold text-primary-600">
              {analysis ? Math.round(analysis.overall_score) : 75}
              <span className="text-xs text-text-muted font-normal"> / 100</span>
            </span>
          </div>

          {/* Speech Fluency Score */}
          <div className="p-3 px-4 rounded-xl bg-slate-50 border border-border text-center">
            <span className="text-[10px] uppercase font-bold text-text-muted block">Speech Fluency</span>
            <span className="text-xl font-extrabold text-emerald-600">
              {analysis ? Math.round(analysis.scores?.speaking_fluency || 75) : 75}
              <span className="text-xs text-text-muted font-normal"> / 100</span>
            </span>
          </div>

          {/* Delivery Poise Score */}
          <div className="p-3 px-4 rounded-xl bg-slate-50 border border-border text-center">
            <span className="text-[10px] uppercase font-bold text-text-muted block">Camera Delivery</span>
            <span className={`text-xl font-extrabold ${
              deliveryData?.deliveryScore !== null && deliveryData?.deliveryScore !== undefined
                ? (deliveryData.deliveryScore < 20 ? 'text-rose-600' : 'text-cyan-600')
                : 'text-slate-400 text-sm'
            }`}>
              {deliveryData?.deliveryScore !== null && deliveryData?.deliveryScore !== undefined ? (
                <>
                  {deliveryData.deliveryScore}
                  <span className="text-xs text-text-muted font-normal"> / 100</span>
                </>
              ) : deliveryData?.cameraStatus === 'ANALYSIS_UNAVAILABLE' ? (
                'Unavailable'
              ) : (
                'Disabled'
              )}
            </span>
          </div>

          {currentResp && (
            <button
              onClick={() => navigate(`/comparison?session=${sessionId}&response=${currentResp.id}`)}
              className="py-3 px-4 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-semibold text-xs shadow-subtle transition flex items-center space-x-1.5"
            >
              <Repeat className="w-4 h-4" />
              <span>Repeat & Compare</span>
            </button>
          )}
        </div>
      </div>

      {/* Target Question Card */}
      {currentResp && (
        <div className="clean-card p-5 sm:p-6 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted flex items-center space-x-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-primary-600" />
              <span>Interviewer Question ({session?.ai_persona})</span>
            </span>
            {renderCorrectnessHeader()}
          </div>
          <p className="text-sm font-semibold text-text-main italic">
            "{currentResp.question_text}"
          </p>
        </div>
      )}

      {/* THREE EXPLICIT SEPARATE SCORING SECTIONS */}

      {/* SECTION A: ANSWER QUALITY & CONCEPTUAL CORRECTNESS */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2 pb-2 border-b border-border">
          <BookOpen className="w-5 h-5 text-primary-600" />
          <h2 className="text-base font-bold text-text-main">Section A: Answer Quality & Conceptual Correctness</h2>
        </div>

        {/* Section A Aggregate Metrics Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-4 rounded-xl bg-emerald-50/80 border border-emerald-200">
            <span className="text-[10px] uppercase font-bold text-emerald-800 block">Correct Answers</span>
            <div className="text-2xl font-extrabold text-emerald-700 mt-1">{answerStats.correct}</div>
            <span className="text-[10px] text-emerald-600 block">Conceptually validated</span>
          </div>
          <div className="p-4 rounded-xl bg-rose-50/80 border border-rose-200">
            <span className="text-[10px] uppercase font-bold text-rose-800 block">Incorrect Answers</span>
            <div className="text-2xl font-extrabold text-rose-700 mt-1">{answerStats.incorrect}</div>
            <span className="text-[10px] text-rose-600 block">Required revision</span>
          </div>
          <div className="p-4 rounded-xl bg-blue-50/80 border border-blue-200">
            <span className="text-[10px] uppercase font-bold text-blue-800 block">Partially Correct</span>
            <div className="text-2xl font-extrabold text-blue-700 mt-1">{answerStats.partiallyCorrect}</div>
            <span className="text-[10px] text-blue-600 block">Partial marks awarded</span>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 border border-border">
            <span className="text-[10px] uppercase font-bold text-text-muted block">Average Answer Score</span>
            <div className="text-2xl font-extrabold text-primary-700 mt-1">{answerStats.averageScore}%</div>
            <span className="text-[10px] text-text-subtle block">Across {responses.length} response(s)</span>
          </div>
        </div>

        {/* Concepts Requiring Improvement (if any) */}
        {answerStats.conceptsRequiringImprovement.length > 0 && (
          <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 space-y-1.5">
            <span className="text-xs font-bold text-amber-900 flex items-center space-x-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              <span>Key Concepts Requiring Improvement:</span>
            </span>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {answerStats.conceptsRequiringImprovement.map((concept, idx) => (
                <span key={idx} className="px-2.5 py-0.5 rounded-full bg-white border border-amber-300 text-amber-900 text-[11px] font-medium">
                  {concept}
                </span>
              ))}
            </div>
          </div>
        )}

        {correctnessEval && (
          <div className="clean-card p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-border">
              <div>
                <span className="text-xs font-bold text-text-main block">Evaluation Verdict:</span>
                <p className="text-xs text-text-muted mt-0.5">
                  {correctnessEval.correctness === 'correct'
                    ? 'Your answer is conceptually accurate and demonstrates solid domain mastery.'
                    : correctnessEval.correctness === 'incorrect'
                    ? 'Your answer contained factual errors or reversed principles that must be corrected.'
                    : 'Your answer is partially correct but omitted critical architectural/operational mechanisms.'}
                </p>
              </div>
              <div className="self-start sm:self-auto">{renderCorrectnessHeader()}</div>
            </div>

            {/* Explanation of the concept */}
            {correctnessEval.explanation && (
              <div className="p-3.5 rounded-xl bg-slate-50 border border-border text-xs space-y-1">
                <span className="font-bold text-text-main block">Verified Technical Principle:</span>
                <p className="text-text-muted leading-relaxed">{correctnessEval.explanation}</p>
              </div>
            )}

            {/* What was correct vs What was wrong */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-1.5">
                <h4 className="text-xs font-bold text-emerald-800 flex items-center space-x-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>What Was Correct:</span>
                </h4>
                <ul className="space-y-1 text-xs text-emerald-900">
                  {(correctnessEval.what_was_correct || []).length > 0 ? (
                    correctnessEval.what_was_correct.map((point, i) => (
                      <li key={i} className="flex items-start space-x-1.5">
                        <span className="font-bold text-emerald-600">•</span>
                        <span>{point}</span>
                      </li>
                    ))
                  ) : (
                    <li className="italic text-emerald-700">None identified.</li>
                  )}
                </ul>
              </div>

              <div className="p-4 rounded-xl bg-rose-50/70 border border-rose-200 space-y-1.5">
                <h4 className="text-xs font-bold text-rose-800 flex items-center space-x-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                  <span>Identified Errors or Gaps:</span>
                </h4>
                <ul className="space-y-1 text-xs text-rose-900">
                  {(correctnessEval.what_was_wrong || []).length > 0 ? (
                    correctnessEval.what_was_wrong.map((point, i) => (
                      <li key={i} className="flex items-start space-x-1.5">
                        <span className="font-bold text-rose-600">•</span>
                        <span>{point}</span>
                      </li>
                    ))
                  ) : (
                    <li className="italic text-emerald-700">No factual errors detected!</li>
                  )}
                </ul>
              </div>
            </div>

            {/* Model Improved Answer */}
            {analysis?.sample_improved_answer && (
              <div className="p-4 rounded-xl bg-violet-50/70 border border-violet-200 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-primary-700 block">
                  Model High-Impact Answer:
                </span>
                <p className="text-xs sm:text-sm text-primary-950 italic font-serif leading-relaxed">
                  "{analysis.sample_improved_answer}"
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* SECTION B: SPEECH DELIVERY & VERBAL FLUENCY */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2 pb-2 border-b border-border">
          <Mic className="w-5 h-5 text-emerald-600" />
          <h2 className="text-base font-bold text-text-main">Section B: Speech Delivery & Verbal Fluency</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Transcript with Highlighted Fillers (7 cols) */}
          <div className="lg:col-span-7 clean-card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-text-main">Spoken Response Transcript</span>
              <span className="text-[11px] text-text-muted">
                Duration: {currentResp?.response_duration_seconds || 12}s • Words: {analysis?.nlp_metrics?.word_count || 0}
              </span>
            </div>

            {/* Render with visual filler highlights */}
            {renderHighlightedTranscript()}

            {/* Filler Word Counter & Breakdown */}
            <div className="p-4 rounded-xl bg-slate-50 border border-border space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-text-main">Detected Hesitations & Verbal Fillers</span>
                <span className={`font-bold ${
                  (analysis?.nlp_metrics?.filler_frequency_per_100_words || 0) > 3 ? 'text-rose-600' : 'text-emerald-600'
                }`}>
                  {analysis?.nlp_metrics?.filler_word_count || 0} total ({analysis?.nlp_metrics?.filler_frequency_per_100_words || 0}% per 100 words)
                </span>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {Object.entries(analysis?.nlp_metrics?.filler_breakdown || {}).length > 0 ? (
                  Object.entries(analysis.nlp_metrics.filler_breakdown).map(([word, count]) => (
                    <span key={word} className="px-2 py-0.5 rounded bg-rose-50 border border-rose-200 text-rose-700 text-[10px] font-semibold">
                      "{word}": {count}x
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-emerald-600 font-medium">
                    ✓ Zero filler crutches detected. Clean verbal articulation!
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Linguistic Rubric Radar (5 cols) */}
          <div className="lg:col-span-5 clean-card p-6 space-y-3">
            <span className="text-xs font-bold text-text-main block">Communication Rubric Profile</span>
            <div className="w-full h-56">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#E2E8F0" />
                  <PolarAngleAxis dataKey="metric" stroke="#64748B" tick={{ fill: '#334155', fontSize: 10 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#CBD5E1" tick={{ fill: '#94A3B8', fontSize: 8 }} />
                  <Radar name="Performance" dataKey="value" stroke="#7C3AED" fill="#7C3AED" fillOpacity={0.25} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', borderRadius: '8px', color: '#111827', fontSize: '11px' }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-[10px] pt-2 border-t border-border">
              <div>
                <span className="text-text-muted block">FLUENCY</span>
                <span className="font-bold text-emerald-600">{analysis?.scores?.speaking_fluency || 75}%</span>
              </div>
              <div>
                <span className="text-text-muted block">STRUCTURE</span>
                <span className="font-bold text-text-main">{analysis?.scores?.structure || 70}%</span>
              </div>
              <div>
                <span className="text-text-muted block">CLARITY</span>
                <span className="font-bold text-primary-600">{analysis?.scores?.clarity || 75}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION C: CAMERA DELIVERY & VISUAL POISE */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2 pb-2 border-b border-border">
          <Camera className="w-5 h-5 text-cyan-600" />
          <h2 className="text-base font-bold text-text-main">Section C: Camera Delivery & Visual Poise</h2>
        </div>

        <DeliveryFeedback deliveryData={deliveryData} />
      </div>

      {/* SECTION D: AREAS TO IMPROVE */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2 pb-2 border-b border-border">
          <AlertCircle className="w-5 h-5 text-amber-600" />
          <h2 className="text-base font-bold text-text-main">Section D: Areas to Improve</h2>
        </div>

        <div className="clean-card p-6 space-y-3">
          <p className="text-xs text-text-muted">
            Specific areas identified across your answers, verbal articulation, and camera composure during this session:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            {areasToImprove.map((item, idx) => (
              <div key={idx} className="p-3.5 rounded-xl bg-slate-50 border border-border flex items-start space-x-2.5">
                <span className="w-2 h-2 rounded-full bg-amber-500 mt-1.5 flex-shrink-0" />
                <div className="space-y-0.5 text-xs">
                  <span className="font-bold text-text-main block">{item.category}</span>
                  <p className="text-text-muted leading-relaxed">{item.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* SECTION E: RECOMMENDED PRACTICE */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2 pb-2 border-b border-border">
          <Target className="w-5 h-5 text-primary-600" />
          <h2 className="text-base font-bold text-text-main">Section E: Recommended Practice</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {recommendedPractices.map((rec, idx) => (
            <div key={idx} className="clean-card p-6 flex flex-col justify-between space-y-4 border hover:border-primary-300 transition group">
              <div className="space-y-2">
                <span className="inline-block px-2.5 py-0.5 rounded-full bg-primary-50 text-primary-700 text-[10px] font-bold">
                  {rec.tag}
                </span>
                <h3 className="text-base font-bold text-text-main group-hover:text-primary-700 transition">
                  {rec.title}
                </h3>
                <p className="text-xs text-text-muted leading-relaxed">
                  {rec.description}
                </p>
              </div>

              <button
                onClick={() => navigate('/scenarios')}
                className="w-full py-2.5 px-4 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-semibold text-xs shadow-xs transition flex items-center justify-center space-x-1.5"
              >
                <span>Launch Practice Arena</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Action Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-border">
        <button
          onClick={() => navigate('/dashboard')}
          className="text-xs font-semibold text-text-muted hover:text-text-main transition"
        >
          ← Return to Dashboard
        </button>

        <div className="flex items-center space-x-3">
          {currentResp && (
            <button
              onClick={() => navigate(`/comparison?session=${sessionId}&response=${currentResp.id}`)}
              className="py-2.5 px-5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-semibold text-xs shadow-subtle transition flex items-center space-x-2"
            >
              <Repeat className="w-4 h-4" />
              <span>Retry Question (Repeat & Compare)</span>
            </button>
          )}

          <button
            onClick={() => navigate('/scenarios')}
            className="py-2.5 px-5 rounded-xl bg-slate-100 hover:bg-slate-200 text-text-main font-semibold text-xs transition"
          >
            <span>Next Practice Arena</span>
          </button>
        </div>
      </div>
    </div>
  );
}
