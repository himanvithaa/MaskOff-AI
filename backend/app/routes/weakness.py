from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models import WeaknessProfile, SkillScores
from app.ml.weakness_engine import update_user_weakness_dna

weakness_bp = Blueprint('weakness', __name__, url_prefix='/api/weakness')

@weakness_bp.route('/profile', methods=['GET'])
@jwt_required()
def get_weakness_profile():
    user_id = int(get_jwt_identity())
    profile = WeaknessProfile.query.filter_by(user_id=user_id).first()
    if not profile:
        profile = update_user_weakness_dna(user_id)
    return jsonify({'profile': profile.to_dict()}), 200

@weakness_bp.route('/history', methods=['GET'])
@jwt_required()
def get_weakness_history():
    user_id = int(get_jwt_identity())
    scores = SkillScores.query.filter_by(user_id=user_id).order_by(SkillScores.created_at.asc()).all()
    history_data = [s.to_dict() for s in scores]
    return jsonify({'history': history_data}), 200

