from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

from .user import User, UserPreferences
from .scenario import Scenario, PracticeSession, ConversationMessage, UserResponse
from .analysis import SpeechTranscript, ResponseAnalysis, SkillScores, AttemptComparison
from .weakness import WeaknessProfile, RecommendedExercise
from .mission import Mission, MissionCompletion
from .mindspace import JournalEntry, WellnessSession

__all__ = [
    'db',
    'User', 'UserPreferences',
    'Scenario', 'PracticeSession', 'ConversationMessage', 'UserResponse',
    'SpeechTranscript', 'ResponseAnalysis', 'SkillScores', 'AttemptComparison',
    'WeaknessProfile', 'RecommendedExercise',
    'Mission', 'MissionCompletion',
    'JournalEntry', 'WellnessSession'
]

