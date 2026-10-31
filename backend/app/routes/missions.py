from datetime import datetime
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models import db, Mission, MissionCompletion

missions_bp = Blueprint('missions', __name__, url_prefix='/api/missions')

@missions_bp.route('', methods=['GET'])
@jwt_required()
def get_missions():
    user_id = int(get_jwt_identity())
    missions = Mission.query.order_by(Mission.id.asc()).all()
    result = [m.to_dict(user_id=user_id) for m in missions]
    
    # Calculate user XP and badges
    completions = MissionCompletion.query.filter_by(user_id=user_id).all()
    completed_mission_ids = {c.mission_id for c in completions}
    total_xp = sum(m.xp_reward for m in missions if m.id in completed_mission_ids)

    return jsonify({
        'missions': result,
        'user_stats': {
            'completed_count': len(completed_mission_ids),
            'total_missions': len(missions),
            'total_xp': total_xp
        }
    }), 200

@missions_bp.route('/<int:mission_id>/complete', methods=['POST'])
@jwt_required()
def complete_mission(mission_id):
    user_id = int(get_jwt_identity())
    mission = Mission.query.get_or_404(mission_id)
    data = request.get_json() or {}

    score = float(data.get('score', 85.0))
    session_id = data.get('session_id')
    feedback = data.get('feedback', 'Mission completed with high conviction.')

    existing = MissionCompletion.query.filter_by(user_id=user_id, mission_id=mission.id).first()
    if existing:
        existing.score = max(existing.score, score)
        existing.completed_at = datetime.utcnow()
    else:
        completion = MissionCompletion(
            user_id=user_id,
            mission_id=mission.id,
            session_id=session_id,
            score=score,
            feedback_notes=feedback
        )
        db.session.add(completion)

    db.session.commit()
    return jsonify({
        'message': f"Mission '{mission.title}' successfully completed!",
        'xp_awarded': mission.xp_reward,
        'badge': mission.badge_name
    }), 200

