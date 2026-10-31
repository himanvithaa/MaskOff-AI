from datetime import datetime
from . import db

class JournalEntry(db.Model):
    __tablename__ = 'journal_entries'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    title = db.Column(db.String(200), nullable=False)
    what_happened = db.Column(db.Text, nullable=False)
    what_was_difficult = db.Column(db.Text, nullable=False)
    struggled_to_express = db.Column(db.Text, nullable=False)
    what_would_do_differently = db.Column(db.Text, nullable=True)
    emotional_state = db.Column(db.String(50), default='Reflective') # Frustrated, Anxious, Proud, Uncertain, etc.
    tags = db.Column(db.JSON, default=list)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'what_happened': self.what_happened,
            'what_was_difficult': self.what_was_difficult,
            'struggled_to_express': self.struggled_to_express,
            'what_would_do_differently': self.what_would_do_differently,
            'emotional_state': self.emotional_state,
            'tags': self.tags or [],
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class WellnessSession(db.Model):
    __tablename__ = 'wellness_sessions'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    exercise_type = db.Column(db.String(50), nullable=False) # 'breathing_box', '478_breathing', 'grounding_54321', 'expression_reframe'
    duration_seconds = db.Column(db.Integer, default=180)
    user_notes = db.Column(db.Text, nullable=True)
    completed_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'exercise_type': self.exercise_type,
            'duration_seconds': self.duration_seconds,
            'user_notes': self.user_notes,
            'completed_at': self.completed_at.isoformat() if self.completed_at else None
        }

