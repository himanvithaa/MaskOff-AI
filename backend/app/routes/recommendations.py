from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models import RecommendedExercise
from app.ml.recommender import generate_adaptive_recommendations

recommendations_bp = Blueprint('recommendations', __name__, url_prefix='/api/recommendations')

@recommendations_bp.route('', methods=['GET'])
@jwt_required()
def get_recommendations():
    user_id = int(get_jwt_identity())
    recs = RecommendedExercise.query.filter_by(user_id=user_id, is_completed=False).all()
    if not recs:
        recs = generate_adaptive_recommendations(user_id)
    return jsonify({'recommendations': [r.to_dict() for r in recs]}), 200

