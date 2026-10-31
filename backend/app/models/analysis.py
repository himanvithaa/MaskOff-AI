from datetime import datetime
from . import db

class SpeechTranscript(db.Model):
    __tablename__ = 'speech_transcripts'

    id = db.Column(db.Integer, primary_key=True)
    response_id = db.Column(db.Integer, db.ForeignKey('user_responses.id', ondelete='CASCADE'), nullable=False, unique=True)
    raw_transcript = db.Column(db.Text, nullable=False)
    cleaned_transcript = db.Column(db.Text, nullable=True)
    word_count = db.Column(db.Integer, default=0)
    words_per_minute = db.Column(db.Float, default=0.0)
    duration_seconds = db.Column(db.Float, default=0.0)
    audio_file_path = db.Column(db.String(255), nullable=True)
    audio_engine_used = db.Column(db.String(50), default='browser_speech_api')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'response_id': self.response_id,
            'raw_transcript': self.raw_transcript,
            'cleaned_transcript': self.cleaned_transcript,
            'word_count': self.word_count,
            'words_per_minute': self.words_per_minute,
            'duration_seconds': self.duration_seconds,
            'audio_file_path': self.audio_file_path,
            'audio_engine_used': self.audio_engine_used,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class ResponseAnalysis(db.Model):
    __tablename__ = 'response_analyses'

    id = db.Column(db.Integer, primary_key=True)
    response_id = db.Column(db.Integer, db.ForeignKey('user_responses.id', ondelete='CASCADE'), nullable=False, unique=True)
    
    # Core rubric scores (0-100)
    overall_score = db.Column(db.Float, nullable=False, default=70.0)
    relevance = db.Column(db.Float, default=70.0)
    clarity = db.Column(db.Float, default=70.0)
    structure = db.Column(db.Float, default=70.0)
    specificity = db.Column(db.Float, default=70.0)
    conceptual_correctness = db.Column(db.Float, default=75.0)
    speaking_fluency = db.Column(db.Float, default=75.0)
    argumentation = db.Column(db.Float, default=70.0)
    pressure_handling = db.Column(db.Float, default=70.0)
    recovery_ability = db.Column(db.Float, default=70.0)
    
    # Linguistic & NLP details
    filler_word_count = db.Column(db.Integer, default=0)
    filler_frequency_per_100_words = db.Column(db.Float, default=0.0)
    filler_breakdown = db.Column(db.JSON, default=dict) # {"um": 3, "basically": 2}
    repetition_count = db.Column(db.Integer, default=0)
    repeated_phrases = db.Column(db.JSON, default=list)
    vague_expressions = db.Column(db.JSON, default=list) # ["it works better", "something like that"]
    structure_components = db.Column(db.JSON, default=dict) # {"intro": true, "explanation": true, "example": false, "conclusion": false}
    
    # Qualitative feedback
    strengths = db.Column(db.JSON, default=list)
    weaknesses = db.Column(db.JSON, default=list)
    why_it_needs_improvement = db.Column(db.Text, nullable=True)
    actionable_suggestions = db.Column(db.JSON, default=list)
    sample_improved_answer = db.Column(db.Text, nullable=True)
    targeted_skill_gap = db.Column(db.String(100), default='Structure & Depth')

    # Strict Conceptual Evaluation & Follow-Up Guidance
    correctness = db.Column(db.String(50), default='partially_correct') # correct | partially_correct | incorrect | insufficient_information
    what_was_correct = db.Column(db.JSON, default=list)
    what_was_wrong = db.Column(db.JSON, default=list)
    missing_concepts = db.Column(db.JSON, default=list)
    explanation = db.Column(db.Text, nullable=True)
    recommended_next_action = db.Column(db.Text, nullable=True)
    follow_up_question = db.Column(db.Text, nullable=True)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        c = (self.correctness or 'partially_correct').lower()
        allow_prog = c in ['correct', 'partially_correct']
        allow_ret = c != 'correct'
        return {
            'id': self.id,
            'response_id': self.response_id,
            'overall_score': self.overall_score,
            'correctness': self.correctness or 'partially_correct',
            'classification': self.correctness or 'partially_correct',
            'allow_progression': allow_prog,
            'allow_retry': allow_ret,
            'explanation': self.explanation or '',
            'feedback_message': self.recommended_next_action or '',
            'correct_concepts': self.what_was_correct or [],
            'incorrect_concepts': self.what_was_wrong or [],
            'missing_concepts': self.missing_concepts or [],
            'correctness_evaluation': {
                'correctness': self.correctness or 'partially_correct',
                'classification': self.correctness or 'partially_correct',
                'score': round(self.overall_score, 1),
                'allow_progression': allow_prog,
                'allow_retry': allow_ret,
                'what_was_correct': self.what_was_correct or [],
                'what_was_wrong': self.what_was_wrong or [],
                'correct_concepts': self.what_was_correct or [],
                'incorrect_concepts': self.what_was_wrong or [],
                'missing_concepts': self.missing_concepts or [],
                'explanation': self.explanation or '',
                'feedback_message': self.recommended_next_action or '',
                'recommended_next_action': self.recommended_next_action or '',
                'follow_up_question': self.follow_up_question or ''
            },
            'scores': {
                'relevance': self.relevance,
                'clarity': self.clarity,
                'structure': self.structure,
                'specificity': self.specificity,
                'conceptual_correctness': self.conceptual_correctness,
                'speaking_fluency': self.speaking_fluency,
                'argumentation': self.argumentation,
                'pressure_handling': self.pressure_handling,
                'recovery_ability': self.recovery_ability
            },
            'nlp_metrics': {
                'filler_word_count': self.filler_word_count,
                'filler_frequency_per_100_words': self.filler_frequency_per_100_words,
                'filler_breakdown': self.filler_breakdown or {},
                'repetition_count': self.repetition_count,
                'repeated_phrases': self.repeated_phrases or [],
                'vague_expressions': self.vague_expressions or [],
                'structure_components': self.structure_components or {}
            },
            'strengths': self.strengths or [],
            'weaknesses': self.weaknesses or [],
            'why_it_needs_improvement': self.why_it_needs_improvement,
            'actionable_suggestions': self.actionable_suggestions or [],
            'sample_improved_answer': self.sample_improved_answer,
            'targeted_skill_gap': self.targeted_skill_gap,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class SkillScores(db.Model):
    __tablename__ = 'skill_scores'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    session_id = db.Column(db.Integer, db.ForeignKey('practice_sessions.id', ondelete='CASCADE'), nullable=False)
    clarity = db.Column(db.Float, default=70.0)
    relevance = db.Column(db.Float, default=70.0)
    structure = db.Column(db.Float, default=70.0)
    technical_depth = db.Column(db.Float, default=70.0)
    speaking_fluency = db.Column(db.Float, default=70.0)
    argumentation = db.Column(db.Float, default=70.0)
    pressure_handling = db.Column(db.Float, default=70.0)
    recovery_ability = db.Column(db.Float, default=70.0)
    overall_session_score = db.Column(db.Float, default=70.0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'clarity': self.clarity,
            'relevance': self.relevance,
            'structure': self.structure,
            'technical_depth': self.technical_depth,
            'speaking_fluency': self.speaking_fluency,
            'argumentation': self.argumentation,
            'pressure_handling': self.pressure_handling,
            'recovery_ability': self.recovery_ability,
            'overall': self.overall_session_score,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class AttemptComparison(db.Model):
    __tablename__ = 'attempt_comparisons'

    id = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(db.Integer, db.ForeignKey('practice_sessions.id', ondelete='CASCADE'), nullable=False, index=True)
    first_response_id = db.Column(db.Integer, db.ForeignKey('user_responses.id', ondelete='CASCADE'), nullable=False)
    second_response_id = db.Column(db.Integer, db.ForeignKey('user_responses.id', ondelete='CASCADE'), nullable=False)
    question_text = db.Column(db.Text, nullable=False)
    
    # Deltas (Attempt 2 - Attempt 1)
    overall_delta = db.Column(db.Float, default=0.0)
    relevance_delta = db.Column(db.Float, default=0.0)
    clarity_delta = db.Column(db.Float, default=0.0)
    structure_delta = db.Column(db.Float, default=0.0)
    specificity_delta = db.Column(db.Float, default=0.0)
    filler_delta = db.Column(db.Float, default=0.0)
    
    improvements = db.Column(db.JSON, default=list)
    unresolved_weaknesses = db.Column(db.JSON, default=list)
    new_issues = db.Column(db.JSON, default=list)
    summary = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    first_response = db.relationship('UserResponse', foreign_keys=[first_response_id])
    second_response = db.relationship('UserResponse', foreign_keys=[second_response_id])

    def to_dict(self):
        return {
            'id': self.id,
            'session_id': self.session_id,
            'first_response_id': self.first_response_id,
            'second_response_id': self.second_response_id,
            'question_text': self.question_text,
            'overall_delta': self.overall_delta,
            'deltas': {
                'overall': self.overall_delta,
                'relevance': self.relevance_delta,
                'clarity': self.clarity_delta,
                'structure': self.structure_delta,
                'specificity': self.specificity_delta,
                'filler_frequency': self.filler_delta
            },
            'improvements': self.improvements or [],
            'unresolved_weaknesses': self.unresolved_weaknesses or [],
            'new_issues': self.new_issues or [],
            'summary': self.summary,
            'first_response': self.first_response.to_dict() if self.first_response else None,
            'second_response': self.second_response.to_dict() if self.second_response else None,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

