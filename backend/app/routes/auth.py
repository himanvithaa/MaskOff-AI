from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from app.models import db, User, UserPreferences, WeaknessProfile
from app.ml.recommender import generate_adaptive_recommendations

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json() or {}
    name = data.get('name', '').strip()
    email = data.get('email', '').strip().lower()
    password = data.get('password', '').strip()

    if not name:
        return jsonify({'error': 'Please enter your name.'}), 400
    if not email:
        return jsonify({'error': 'Please enter your email address.'}), 400
    if not password:
        return jsonify({'error': 'Please enter your password.'}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({'error': 'An account with this email already exists'}), 409

    user = User(name=name, email=email)
    user.set_password(password)
    db.session.add(user)
    db.session.flush()

    # Create default preferences
    prefs = UserPreferences(
        user_id=user.id,
        primary_goals=data.get('primary_goals', ["Improve speaking skills", "Prepare for interviews"]),
        preferred_language=data.get('preferred_language', 'English')
    )
    db.session.add(prefs)

    # Initialize empty Weakness DNA profile
    profile = WeaknessProfile(
        user_id=user.id,
        top_strengths=[
            {"skill": "Answer relevance in direct inquiries", "frequency": 1, "confidence": 80},
            {"skill": "Poise during initial greeting", "frequency": 1, "confidence": 78}
        ],
        persistent_weaknesses=[
            {"weakness": "Difficulty defending reasoning against counterarguments", "recurrence_count": 1, "severity": "Moderate"},
            {"weakness": "Technical explanations lack concrete metrics", "recurrence_count": 1, "severity": "Moderate"}
        ],
        recurring_patterns=["Needs to back up claims with concrete examples before concluding."]
    )
    db.session.add(profile)
    db.session.commit()

    # Pre-populate adaptive recommendations
    try:
        generate_adaptive_recommendations(user.id)
    except Exception:
        pass

    access_token = create_access_token(identity=str(user.id))
    return jsonify({
        'message': 'Registration successful',
        'token': access_token,
        'user': user.to_dict()
    }), 201


@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    email = data.get('email', '').strip().lower()
    password = data.get('password', '').strip()

    if not email:
        return jsonify({'error': 'Please enter your email address.'}), 400
    if not password:
        return jsonify({'error': 'Please enter your password.'}), 400

    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({'error': 'Account not found. Please register first.'}), 404

    if not user.check_password(password):
        return jsonify({'error': 'Incorrect password. Please try again.'}), 401

    access_token = create_access_token(identity=str(user.id))
    return jsonify({
        'message': 'Login successful',
        'token': access_token,
        'user': user.to_dict()
    }), 200


@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    return jsonify({'user': user.to_dict()}), 200


@auth_bp.route('/onboarding', methods=['POST'])
@jwt_required()
def complete_onboarding():
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404

    data = request.get_json() or {}
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
    return jsonify({
        'message': 'Onboarding preferences saved',
        'preferences': prefs.to_dict()
    }), 200

