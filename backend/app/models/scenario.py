from datetime import datetime
from . import db

class Scenario(db.Model):
    __tablename__ = 'scenarios'

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    slug = db.Column(db.String(200), unique=True, index=True)
    category = db.Column(db.String(100), nullable=False, index=True)  # academic, professional, public_speaking, social, leadership, critical_thinking
    description = db.Column(db.Text, nullable=False)
    context_background = db.Column(db.Text, nullable=True)
    difficulty = db.Column(db.String(50), default='Intermediate')  # Beginner, Intermediate, Advanced
    default_persona = db.Column(db.String(100), default='Skeptical Manager')
    suggested_pressure_level = db.Column(db.Integer, default=2)
    expected_topics = db.Column(db.JSON, default=list)
    initial_prompt = db.Column(db.Text, nullable=False)
    pressure_prompts = db.Column(db.JSON, default=dict)
    icon_name = db.Column(db.String(100), default='Briefcase')
    tags = db.Column(db.JSON, default=list)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    sessions = db.relationship('PracticeSession', backref='scenario', lazy='dynamic')
    recommended_in = db.relationship('RecommendedExercise', backref='scenario', lazy='dynamic')

    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'slug': self.slug,
            'category': self.category,
            'description': self.description,
            'context_background': self.context_background,
            'difficulty': self.difficulty,
            'default_persona': self.default_persona,
            'suggested_pressure_level': self.suggested_pressure_level,
            'expected_topics': self.expected_topics or [],
            'initial_prompt': self.initial_prompt,
            'icon_name': self.icon_name,
            'tags': self.tags or []
        }


class PracticeSession(db.Model):
    __tablename__ = 'practice_sessions'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    scenario_id = db.Column(db.Integer, db.ForeignKey('scenarios.id', ondelete='SET NULL'), nullable=True)
    session_mode = db.Column(db.String(50), default='standard')  # standard, retry, comeback, devils_advocate, mission
    ai_persona = db.Column(db.String(100), default='Supportive Mentor')
    pressure_level = db.Column(db.Integer, default=2)
    difficulty = db.Column(db.String(50), default='Intermediate')
    status = db.Column(db.String(50), default='active')  # active, completed, abandoned
    target_duration_minutes = db.Column(db.Integer, default=5)
    overall_score = db.Column(db.Float, nullable=True)
    summary_notes = db.Column(db.Text, nullable=True)
    started_at = db.Column(db.DateTime, default=datetime.utcnow)
    completed_at = db.Column(db.DateTime, nullable=True)

    # Relationships
    messages = db.relationship('ConversationMessage', backref='session', lazy='dynamic', cascade='all, delete-orphan', order_by='ConversationMessage.sequence')
    responses = db.relationship('UserResponse', backref='session', lazy='dynamic', cascade='all, delete-orphan')
    comparisons = db.relationship('AttemptComparison', backref='session', lazy='dynamic', cascade='all, delete-orphan')
    skill_score = db.relationship('SkillScores', backref='session', uselist=False, cascade='all, delete-orphan')

    def to_dict(self):
        delivery_metrics = None
        if self.summary_notes:
            try:
                import json
                delivery_metrics = json.loads(self.summary_notes)
            except Exception:
                delivery_metrics = None

        return {
            'id': self.id,
            'user_id': self.user_id,
            'scenario_id': self.scenario_id,
            'scenario_title': self.scenario.title if self.scenario else 'Custom Simulation',
            'category': self.scenario.category if self.scenario else 'custom',
            'session_mode': self.session_mode,
            'ai_persona': self.ai_persona,
            'pressure_level': self.pressure_level,
            'difficulty': self.difficulty,
            'status': self.status,
            'overall_score': self.overall_score,
            'summary_notes': self.summary_notes,
            'delivery_metrics': delivery_metrics,
            'started_at': self.started_at.isoformat() if self.started_at else None,
            'completed_at': self.completed_at.isoformat() if self.completed_at else None,
            'message_count': self.messages.count(),
            'response_count': self.responses.count()
        }


class ConversationMessage(db.Model):
    __tablename__ = 'conversation_messages'

    id = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(db.Integer, db.ForeignKey('practice_sessions.id', ondelete='CASCADE'), nullable=False, index=True)
    sender = db.Column(db.String(20), nullable=False)  # 'ai' or 'user'
    content = db.Column(db.Text, nullable=False)
    audio_url = db.Column(db.String(255), nullable=True)
    sequence = db.Column(db.Integer, default=0)
    pressure_intent = db.Column(db.String(100), nullable=True)  # follow_up, critical_challenge, evidence_request, etc.
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'session_id': self.session_id,
            'sender': self.sender,
            'content': self.content,
            'audio_url': self.audio_url,
            'sequence': self.sequence,
            'pressure_intent': self.pressure_intent,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class UserResponse(db.Model):
    __tablename__ = 'user_responses'

    id = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(db.Integer, db.ForeignKey('practice_sessions.id', ondelete='CASCADE'), nullable=False, index=True)
    question_text = db.Column(db.Text, nullable=False)
    answer_text = db.Column(db.Text, nullable=False)
    attempt_number = db.Column(db.Integer, default=1)
    response_duration_seconds = db.Column(db.Float, default=0.0)
    is_retry = db.Column(db.Boolean, default=False)
    parent_response_id = db.Column(db.Integer, db.ForeignKey('user_responses.id', ondelete='SET NULL'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    analysis = db.relationship('ResponseAnalysis', backref='user_response', uselist=False, cascade='all, delete-orphan')
    transcript = db.relationship('SpeechTranscript', backref='user_response', uselist=False, cascade='all, delete-orphan')
    retries = db.relationship('UserResponse', backref=db.backref('parent_response', remote_side=[id]), lazy='dynamic')

    def to_dict(self):
        return {
            'id': self.id,
            'session_id': self.session_id,
            'question_text': self.question_text,
            'answer_text': self.answer_text,
            'attempt_number': self.attempt_number,
            'response_duration_seconds': self.response_duration_seconds,
            'is_retry': self.is_retry,
            'parent_response_id': self.parent_response_id,
            'analysis': self.analysis.to_dict() if self.analysis else None,
            'transcript': self.transcript.to_dict() if self.transcript else None,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

