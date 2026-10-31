from datetime import datetime
from . import db

class Mission(db.Model):
    __tablename__ = 'missions'

    id = db.Column(db.Integer, primary_key=True)
    code = db.Column(db.String(50), unique=True, index=True)
    title = db.Column(db.String(150), nullable=False)
    subtitle = db.Column(db.String(255), nullable=True)
    category = db.Column(db.String(100), default='General')
    objective = db.Column(db.Text, nullable=False)
    scenario_prompt = db.Column(db.Text, nullable=False)
    ai_persona = db.Column(db.String(100), default='Challenger')
    difficulty = db.Column(db.String(50), default='Intermediate')
    evaluation_criteria = db.Column(db.JSON, default=list) # ["Firmness", "Empathy", "Clarity"]
    xp_reward = db.Column(db.Integer, default=100)
    badge_name = db.Column(db.String(100), default='Rising Voice')
    badge_icon = db.Column(db.String(50), default='Shield')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationship
    completions = db.relationship('MissionCompletion', backref='mission', lazy='dynamic')

    def to_dict(self, user_id=None):
        user_completion = None
        if user_id:
            user_completion = MissionCompletion.query.filter_by(mission_id=self.id, user_id=user_id).first()
            
        return {
            'id': self.id,
            'code': self.code,
            'title': self.title,
            'subtitle': self.subtitle,
            'category': self.category,
            'objective': self.objective,
            'scenario_prompt': self.scenario_prompt,
            'ai_persona': self.ai_persona,
            'difficulty': self.difficulty,
            'evaluation_criteria': self.evaluation_criteria or [],
            'xp_reward': self.xp_reward,
            'badge_name': self.badge_name,
            'badge_icon': self.badge_icon,
            'is_completed': user_completion is not None,
            'completion_score': user_completion.score if user_completion else None,
            'completed_at': user_completion.completed_at.isoformat() if user_completion else None
        }


class MissionCompletion(db.Model):
    __tablename__ = 'mission_completions'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    mission_id = db.Column(db.Integer, db.ForeignKey('missions.id', ondelete='CASCADE'), nullable=False)
    session_id = db.Column(db.Integer, db.ForeignKey('practice_sessions.id', ondelete='SET NULL'), nullable=True)
    score = db.Column(db.Float, default=80.0)
    feedback_notes = db.Column(db.Text, nullable=True)
    completed_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'mission_id': self.mission_id,
            'score': self.score,
            'feedback_notes': self.feedback_notes,
            'completed_at': self.completed_at.isoformat() if self.completed_at else None
        }

