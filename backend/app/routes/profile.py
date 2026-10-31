from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models import db, User, UserPreferences, PracticeSession, MissionCompletion, JournalEntry

profile_bp = Blueprint('profile', __name__, url_prefix='/api/profile')

@profile_bp.route('', methods=['GET'])
@jwt_required()
def get_profile():
    user_id = int(get_jwt_identity())
    user = User.query.get_or_404(user_id)

    total_sessions = PracticeSession.query.filter_by(user_id=user_id, status='completed').count()
    completed_missions = MissionCompletion.query.filter_by(user_id=user_id).count()

    badges = []
    if total_sessions >= 1:
        badges.append({"name": "First Step", "description": "Completed first simulation", "icon": "Sparkles"})
    if total_sessions >= 5:
        badges.append({"name": "Consistent Voice", "description": "Completed 5 simulations", "icon": "Flame"})
    if completed_missions >= 1:
        badges.append({"name": "Mission Ready", "description": "Completed first MaskOff mission", "icon": "Shield"})

    return jsonify({
        'user': user.to_dict(),
        'stats': {
            'total_sessions': total_sessions,
            'completed_missions': completed_missions,
            'badges': badges
        }
    }), 200

@profile_bp.route('', methods=['PUT'])
@jwt_required()
def update_profile():
    user_id = int(get_jwt_identity())
    user = User.query.get_or_404(user_id)
    data = request.get_json() or {}

    if 'name' in data and data['name'].strip():
        user.name = data['name'].strip()

    prefs = user.preferences
    if not prefs:
        prefs = UserPreferences(user_id=user.id)
        db.session.add(prefs)

    if 'primary_goals' in data:
        prefs.primary_goals = data['primary_goals']
    if 'preferred_language' in data:
        prefs.preferred_language = data['preferred_language']
    if 'experience_level' in data:
        prefs.experience_level = data['experience_level']
    if 'audio_consent' in data:
        prefs.audio_consent = bool(data['audio_consent'])

    db.session.commit()
    return jsonify({'message': 'Profile updated successfully', 'user': user.to_dict()}), 200

@profile_bp.route('/data', methods=['DELETE'])
@jwt_required()
def delete_user_data():
    """
    Data privacy control: Deletes all user practice records, journal entries, and profiles.
    """
    user_id = int(get_jwt_identity())
    user = User.query.get_or_404(user_id)

    # Delete journal entries, sessions, completions
    JournalEntry.query.filter_by(user_id=user_id).delete()
    PracticeSession.query.filter_by(user_id=user_id).delete()
    MissionCompletion.query.filter_by(user_id=user_id).delete()

    db.session.commit()
    return jsonify({'message': 'All personal simulation history and journal data has been permanently deleted'}), 200

