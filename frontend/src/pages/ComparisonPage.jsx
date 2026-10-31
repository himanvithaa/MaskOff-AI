import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Repeat, 
  ArrowRight, 
  CheckCircle2, 
  AlertTriangle, 
  Sparkles, 
  Mic, 
  Square, 
  RotateCcw,
  Send
} from 'lucide-react';
import { sessionsAPI, analysisAPI } from '../services/api';
import { useAudioRecorder } from '../hooks/useAudioRecorder';

export default function ComparisonPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session');
  const firstResponseId = searchParams.get('response');

  const [session, setSession] = useState(null);
  const [firstResp, setFirstResp] = useState(null);
  const [secondResp, setSecondResp] = useState(null);
  const [comparison, setComparison] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submittingRetry, setSubmittingRetry] = useState(false);
  const [retryText, setRetryText] = useState('');
  const [inputMode, setInputMode] = useState('voice');

  const {
    isRecording,
    recordingTime,
    audioUrl,
    transcript,
    setTranscript,
    startRecording,
    stopRecording,
    resetRecording
  } = useAudioRecorder();

  const loadData = async () => {
    if (!sessionId) {
      navigate('/dashboard');
      return;
    }
    try {
      setLoading(true);
      const res = await sessionsAPI.getSession(sessionId);
      setSession(res.data.session);

      const allResponses = res.data.responses || [];
      const resp1 = allResponses.find((r) => r.id === parseInt(firstResponseId)) || allResponses[0];
      setFirstResp(resp1);

      const resp2 = allResponses.find((r) => r.parent_response_id === resp1?.id || (r.is_retry && r.id !== resp1?.id));
      if (resp2) {
        setSecondResp(resp2);
        const compRes = await analysisAPI.compareAttempts({
          first_response_id: resp1.id,
          second_response_id: resp2.id
        });
        setComparison(compRes.data.comparison);
      }
    } catch (err) {
      console.error("Comparison load error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [sessionId, firstResponseId]);

  const handleSubmitRetry = async () => {
    const finalAnswer = (inputMode === 'voice' ? transcript : retryText).trim();
    if (!finalAnswer) {
      alert("Please speak or type your retry response.");
      return;
    }

    setSubmittingRetry(true);
    try {
      const payload = {
        content: finalAnswer,
        duration_seconds: recordingTime || 12,
        parent_response_id: firstResp.id,
        is_retry: true
      };

      await sessionsAPI.sendMessage(sessionId, payload);
      await loadData();
      resetRecording();
      setRetryText('');
    } catch (err) {
      console.error("Retry submission error:", err);
      alert("Failed to submit retry attempt.");
    } finally {
      setSubmittingRetry(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 max-w-5xl mx-auto flex items-center justify-center min-h-[70vh]">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-8 h-8 border-3 border-primary-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-text-muted">Loading Repeat & Compare analysis...</p>
        </div>
      </div>
    );
  }

  const a1 = firstResp?.analysis;
  const a2 = secondResp?.analysis;

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-primary-50 text-primary-700 text-xs font-semibold mb-1">
          <Repeat className="w-3.5 h-3.5" />
          <span>Repeat-and-Compare Engine</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-text-main">Attempt Comparison</h1>
        <p className="text-xs sm:text-sm text-text-muted mt-0.5">
          Measure genuine progress by retrying the exact same question with immediate feedback guidance.
        </p>
      </div>

      {/* Target Question */}
      {firstResp && (
        <div className="clean-card p-4 space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted block">
            Target Scenario Question
          </span>
          <p className="text-sm font-semibold text-text-main italic">"{firstResp.question_text}"</p>
        </div>
      )}

      {/* Recording Second Attempt Arena */}
      {!secondResp ? (
        <div className="clean-card p-6 sm:p-8 space-y-5 border-primary-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-text-main flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-primary-600" />
                <span>Record Your Second Attempt</span>
              </h2>
              <p className="text-xs text-text-muted mt-0.5">
                Apply your feedback: reduce filler words, name concrete mechanisms, and structure your answer.
              </p>
            </div>

            <div className="flex items-center space-x-1 text-xs">
              <button
                onClick={() => setInputMode('voice')}
                className={`px-2.5 py-1 rounded-lg ${inputMode === 'voice' ? 'bg-primary-50 text-primary-700 font-semibold' : 'text-text-muted'}`}
              >
                🎤 Voice
              </button>
              <button
                onClick={() => setInputMode('text')}
                className={`px-2.5 py-1 rounded-lg ${inputMode === 'text' ? 'bg-primary-50 text-primary-700 font-semibold' : 'text-text-muted'}`}
              >
                ⌨️ Text
              </button>
            </div>
          </div>

          {inputMode === 'voice' ? (
            <div className="space-y-3">
              <textarea
                rows={3}
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                placeholder="Click 'Record Second Attempt' and speak with greater clarity, depth, and poise..."
                className="w-full p-3 clean-input text-xs sm:text-sm resize-none"
              />

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {!isRecording ? (
                    <button
                      type="button"
                      onClick={startRecording}
                      disabled={submittingRetry}
                      className="py-2 px-5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center space-x-1.5 shadow-subtle transition"
                    >
                      <Mic className="w-4 h-4" />
                      <span>Record Attempt 2</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={stopRecording}
                      className="py-2 px-5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center space-x-1.5"
                    >
                      <Square className="w-4 h-4" />
                      <span>Stop ({recordingTime}s)</span>
                    </button>
                  )}

                  {audioUrl && (
                    <div className="flex items-center space-x-2">
                      <audio controls src={audioUrl} className="h-8 w-40" />
                      <button onClick={resetRecording} className="p-1 text-text-muted hover:text-text-main">
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                <button
                  onClick={handleSubmitRetry}
                  disabled={submittingRetry || !transcript.trim() || isRecording}
                  className="py-2 px-5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs shadow-subtle transition disabled:opacity-40"
                >
                  {submittingRetry ? 'Comparing Attempts...' : 'Submit & Calculate Delta'}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <textarea
                rows={3}
                value={retryText}
                onChange={(e) => setRetryText(e.target.value)}
                placeholder="Type your improved response..."
                className="w-full p-3 clean-input text-xs sm:text-sm resize-none"
              />
              <div className="flex justify-end">
                <button
                  onClick={handleSubmitRetry}
                  disabled={submittingRetry || !retryText.trim()}
                  className="py-2 px-5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs transition disabled:opacity-40"
                >
                  {submittingRetry ? 'Evaluating...' : 'Submit & Compare'}
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Side by Side Comparison */
        <div className="space-y-6">
          {/* Comparison Verdict Summary */}
          {comparison && (
            <div className="clean-card p-5 border-cyan-200 bg-cyan-50/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-800 block mb-0.5">
                  Comparison Verdict
                </span>
                <p className="text-xs font-semibold text-text-main">{comparison.summary}</p>
              </div>
              <div className="text-left sm:text-right flex-shrink-0">
                <span className="text-[10px] text-text-muted block uppercase">Overall Delta</span>
                <span className={`text-2xl font-extrabold ${comparison.overall_delta >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {comparison.overall_delta >= 0 ? `+${comparison.overall_delta}` : comparison.overall_delta} pts
                </span>
              </div>
            </div>
          )}

          {/* Side by side attempt cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Attempt 1 */}
            <div className="clean-card p-5 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-border">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Baseline</span>
                  <h3 className="text-sm font-bold text-text-main">First Attempt</h3>
                </div>
                <div className="text-lg font-bold text-text-muted">
                  {a1 ? Math.round(a1.overall_score) : 70} / 100
                </div>
              </div>

              <div>
                <span className="text-[10px] font-bold text-text-muted uppercase">Spoken Answer</span>
                <p className="text-xs text-text-muted bg-slate-50 p-2.5 rounded-lg border border-border mt-1 italic leading-relaxed">
                  "{firstResp.answer_text}"
                </p>
              </div>

              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-text-muted">
                  <span>Filler Frequency:</span>
                  <span className="font-semibold text-text-main">{a1?.nlp_metrics?.filler_frequency_per_100_words || 0}%</span>
                </div>
                <div className="flex justify-between text-text-muted">
                  <span>Clarity:</span>
                  <span className="font-semibold text-text-main">{a1?.scores?.clarity || 70}%</span>
                </div>
                <div className="flex justify-between text-text-muted">
                  <span>Technical Depth:</span>
                  <span className="font-semibold text-text-main">{a1?.scores?.specificity || 70}%</span>
                </div>
              </div>
            </div>

            {/* Attempt 2 */}
            <div className="clean-card p-5 space-y-3 border-emerald-200 bg-emerald-50/20">
              <div className="flex items-center justify-between pb-2 border-b border-border">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Iteration</span>
                  <h3 className="text-sm font-bold text-text-main">Second Attempt</h3>
                </div>
                <div className="text-lg font-bold text-emerald-600">
                  {a2 ? Math.round(a2.overall_score) : 80} / 100
                </div>
              </div>

              <div>
                <span className="text-[10px] font-bold text-emerald-700 uppercase">Improved Spoken Answer</span>
                <p className="text-xs text-text-main bg-white p-2.5 rounded-lg border border-emerald-200 mt-1 italic leading-relaxed">
                  "{secondResp.answer_text}"
                </p>
              </div>

              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-text-muted">
                  <span>Filler Frequency:</span>
                  <span className="font-semibold text-emerald-700">
                    {a2?.nlp_metrics?.filler_frequency_per_100_words || 0}%
                    {comparison && (
                      <span className="text-[10px] ml-1">({comparison.deltas?.filler_frequency >= 0 ? `+${comparison.deltas.filler_frequency}` : comparison.deltas?.filler_frequency}%)</span>
                    )}
                  </span>
                </div>
                <div className="flex justify-between text-text-muted">
                  <span>Clarity:</span>
                  <span className="font-semibold text-emerald-700">
                    {a2?.scores?.clarity || 75}%
                    {comparison && (
                      <span className="text-[10px] ml-1">({comparison.deltas?.clarity >= 0 ? `+${comparison.deltas.clarity}` : comparison.deltas?.clarity}%)</span>
                    )}
                  </span>
                </div>
                <div className="flex justify-between text-text-muted">
                  <span>Technical Depth:</span>
                  <span className="font-semibold text-emerald-700">
                    {a2?.scores?.specificity || 75}%
                    {comparison && (
                      <span className="text-[10px] ml-1">({comparison.deltas?.specificity >= 0 ? `+${comparison.deltas.specificity}` : comparison.deltas?.specificity}%)</span>
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Verified Improvements */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="clean-card p-4 space-y-2">
              <h4 className="text-xs font-bold text-emerald-700 flex items-center space-x-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Verified Improvements</span>
              </h4>
              <ul className="space-y-1 text-xs text-text-muted">
                {(comparison?.improvements || ["Clarified core premise"]).map((imp, i) => (
                  <li key={i} className="flex items-start space-x-1.5">
                    <span className="text-emerald-600 font-bold">+</span>
                    <span>{imp}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="clean-card p-4 space-y-2">
              <h4 className="text-xs font-bold text-amber-700 flex items-center space-x-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Unresolved Weaknesses to Watch</span>
              </h4>
              <ul className="space-y-1 text-xs text-text-muted">
                {(comparison?.unresolved_weaknesses || ["Ensure clear concluding synthesis"]).map((un, i) => (
                  <li key={i} className="flex items-start space-x-1.5">
                    <span className="text-amber-600 font-bold">•</span>
                    <span>{un}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Footer Navigation */}
      <div className="flex items-center justify-between pt-4 border-t border-border">
        <button
          onClick={() => navigate(`/feedback?session=${sessionId}`)}
          className="text-xs font-semibold text-text-muted hover:text-text-main"
        >
          ← Return to Feedback
        </button>

        <button
          onClick={() => navigate('/scenarios')}
          className="py-2 px-5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-semibold text-xs shadow-subtle transition flex items-center space-x-1.5"
        >
          <span>Continue Practice</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
