from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash
from . import db

class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(150), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    avatar_url = db.Column(db.String(255), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    preferences = db.relationship('UserPreferences', backref='user', uselist=False, cascade='all, delete-orphan')
    sessions = db.relationship('PracticeSession', backref='user', lazy='dynamic', cascade='all, delete-orphan')
    weakness_profile = db.relationship('WeaknessProfile', backref='user', uselist=False, cascade='all, delete-orphan')
    recommended_exercises = db.relationship('RecommendedExercise', backref='user', lazy='dynamic', cascade='all, delete-orphan')
    mission_completions = db.relationship('MissionCompletion', backref='user', lazy='dynamic', cascade='all, delete-orphan')
    journal_entries = db.relationship('JournalEntry', backref='user', lazy='dynamic', cascade='all, delete-orphan')
    wellness_sessions = db.relationship('WellnessSession', backref='user', lazy='dynamic', cascade='all, delete-orphan')
    skill_scores = db.relationship('SkillScores', backref='user', lazy='dynamic', cascade='all, delete-orphan')

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'email': self.email,
            'avatar_url': self.avatar_url,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'preferences': self.preferences.to_dict() if self.preferences else None
        }


class UserPreferences(db.Model):
    __tablename__ = 'user_preferences'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, unique=True)
    primary_goals = db.Column(db.JSON, default=list) # e.g. ["Improve speaking skills", "Prepare for interviews"]
    preferred_language = db.Column(db.String(50), default='English')
    experience_level = db.Column(db.String(50), default='Intermediate')
    notifications_enabled = db.Column(db.Boolean, default=True)
    audio_consent = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            'primary_goals': self.primary_goals or [],
            'preferred_language': self.preferred_language,
            'experience_level': self.experience_level,
            'audio_consent': self.audio_consent
        }

