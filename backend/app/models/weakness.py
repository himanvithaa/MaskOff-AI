from datetime import datetime
from . import db

class WeaknessProfile(db.Model):
    __tablename__ = 'weakness_profiles'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, unique=True, index=True)
    
    # Aggregated DNA values (0-100)
    overall_communication_dna_score = db.Column(db.Float, default=70.0)
    clarity_dna = db.Column(db.Float, default=70.0)
    relevance_dna = db.Column(db.Float, default=70.0)
    structure_dna = db.Column(db.Float, default=70.0)
    depth_dna = db.Column(db.Float, default=70.0)
    fluency_dna = db.Column(db.Float, default=70.0)
    argumentation_dna = db.Column(db.Float, default=70.0)
    pressure_handling_dna = db.Column(db.Float, default=70.0)
    recovery_ability_dna = db.Column(db.Float, default=70.0)
    
    # Key extracted patterns
    top_strengths = db.Column(db.JSON, default=list) # [{"skill": "Clear explanations", "confidence": 88}]
    persistent_weaknesses = db.Column(db.JSON, default=list) # [{"weakness": "Difficulty defending reasoning", "recurrence_count": 4, "severity": "High"}]
    recurring_patterns = db.Column(db.JSON, default=list) # ["Goes blank during unexpected challenges", "Uses filler words when uncertain"]
    category_performance = db.Column(db.JSON, default=dict) # {"academic": 78, "professional": 65, ...}
    total_sessions_analyzed = db.Column(db.Integer, default=0)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'overall_dna_score': round(self.overall_communication_dna_score, 1),
            'dna_metrics': {
                'clarity': round(self.clarity_dna, 1),
                'relevance': round(self.relevance_dna, 1),
                'structure': round(self.structure_dna, 1),
                'technical_depth': round(self.depth_dna, 1),
                'fluency': round(self.fluency_dna, 1),
                'argumentation': round(self.argumentation_dna, 1),
                'pressure_handling': round(self.pressure_handling_dna, 1),
                'recovery_ability': round(self.recovery_ability_dna, 1)
            },
            'top_strengths': self.top_strengths or [],
            'persistent_weaknesses': self.persistent_weaknesses or [],
            'recurring_patterns': self.recurring_patterns or [],
            'category_performance': self.category_performance or {},
            'total_sessions_analyzed': self.total_sessions_analyzed,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }


class RecommendedExercise(db.Model):
    __tablename__ = 'recommended_exercises'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    scenario_id = db.Column(db.Integer, db.ForeignKey('scenarios.id', ondelete='CASCADE'), nullable=False)
    targeted_skill_gap = db.Column(db.String(150), nullable=False)
    reason = db.Column(db.Text, nullable=False)
    priority = db.Column(db.String(20), default='medium')  # high, medium, low
    is_completed = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'scenario_id': self.scenario_id,
            'scenario': self.scenario.to_dict() if self.scenario else None,
            'targeted_skill_gap': self.targeted_skill_gap,
            'reason': self.reason,
            'priority': self.priority,
            'is_completed': self.is_completed,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

