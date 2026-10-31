import re
from datetime import datetime
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models import db, JournalEntry, WellnessSession

mindspace_bp = Blueprint('mindspace', __name__, url_prefix='/api/mindspace')

CRISIS_PATTERNS = [
    r'\bsuicid',
    r'\bkill myself\b',
    r'\bend my life\b',
    r'\bwant to die\b',
    r'\bharm myself\b',
    r'\bcan\'?t go on living\b'
]

def check_crisis_indicators(text: str) -> bool:
    lower = text.lower()
    return any(re.search(pat, lower) for pat in CRISIS_PATTERNS)

CRISIS_RESPONSE = {
    "is_crisis": True,
    "warning": "CRISIS SUPPORT NOTICE",
    "message": (
        "It sounds like you may be going through an intense and overwhelming crisis. "
        "MaskOff AI is an educational communication practice tool and is NOT a mental health service or crisis intervention provider. "
        "Please connect immediately with qualified support who can help you right now."
    ),
    "resources": [
        {"name": "National Crisis Hotline (US/Canada)", "contact": "Call or Text 988", "url": "https://988lifeline.org"},
        {"name": "Crisis Text Line", "contact": "Text HOME to 741741", "url": "https://www.crisistextline.org"},
        {"name": "International Crisis Helplines", "contact": "Find local helpline", "url": "https://findahelpline.com"}
    ]
}

@mindspace_bp.route('/reflections', methods=['GET'])
@jwt_required()
def get_reflections():
    user_id = int(get_jwt_identity())
    entries = JournalEntry.query.filter_by(user_id=user_id).order_by(JournalEntry.created_at.desc()).all()
    return jsonify({'entries': [e.to_dict() for e in entries]}), 200

@mindspace_bp.route('/reflections', methods=['POST'])
@jwt_required()
def create_reflection():
    user_id = int(get_jwt_identity())
    data = request.get_json() or {}

    title = data.get('title', '').strip()
    what_happened = data.get('what_happened', '').strip()
    what_was_difficult = data.get('what_was_difficult', '').strip()
    struggled_to_express = data.get('struggled_to_express', '').strip()
    what_would_do_differently = data.get('what_would_do_differently', '').strip()
    emotional_state = data.get('emotional_state', 'Reflective')
    tags = data.get('tags', [])

    full_text = f"{title} {what_happened} {what_was_difficult} {struggled_to_express}"
    if check_crisis_indicators(full_text):
        return jsonify(CRISIS_RESPONSE), 200

    if not title or not what_happened:
        return jsonify({'error': 'Title and What Happened fields are required'}), 400

    entry = JournalEntry(
        user_id=user_id,
        title=title,
        what_happened=what_happened,
        what_was_difficult=what_was_difficult,
        struggled_to_express=struggled_to_express,
        what_would_do_differently=what_would_do_differently,
        emotional_state=emotional_state,
        tags=tags
    )
    db.session.add(entry)
    db.session.commit()

    return jsonify({'message': 'Journal reflection saved securely', 'entry': entry.to_dict()}), 201

@mindspace_bp.route('/reflections/<int:entry_id>', methods=['DELETE'])
@jwt_required()
def delete_reflection(entry_id):
    user_id = int(get_jwt_identity())
    entry = JournalEntry.query.filter_by(id=entry_id, user_id=user_id).first_or_404()
    db.session.delete(entry)
    db.session.commit()
    return jsonify({'message': 'Journal entry permanently deleted'}), 200

@mindspace_bp.route('/reframe', methods=['POST'])
@jwt_required()
def reframe_emotional_expression():
    """
    Transforms reactive, aggressive or passive communication into constructive 'I-statements'.
    E.g., transforms 'I am angry because my teammate never listens' into:
    'When my suggestions are dismissed without discussion, I feel frustrated. I would appreciate it if we could consider everyone's ideas.'
    """
    data = request.get_json() or {}
    raw_statement = data.get('statement', '').strip()

    if check_crisis_indicators(raw_statement):
        return jsonify(CRISIS_RESPONSE), 200

    if not raw_statement:
        return jsonify({'error': 'Statement is required'}), 400

    # Rule-based expression transformation
    lower = raw_statement.lower()
    
    # Common scenarios
    if 'never listens' in lower or 'doesn\'t listen' in lower:
        reframed = "When our discussions move forward without reviewing my input, I feel unheard. I would appreciate a 5-minute sync where we can review everyone's proposals together."
        core_emotion = "Unheard / Frustrated"
        constructive_model = "When [situation happens], I feel [emotion]. I would appreciate [action]."
    elif 'always' in lower and ('late' in lower or 'interrupts' in lower):
        reframed = "When meetings run off-schedule or conversations overlap, it disrupts my focus. Could we agree to reserve the first 10 minutes for uninterrupted updates?"
        core_emotion = "Overwhelmed / Disrespected"
        constructive_model = "State objective observation without 'always/never' generalizers."
    elif 'angry' in lower or 'hate' in lower:
        reframed = "I feel strongly about this outcome because our team's delivery is on the line. Let's look at the specific requirements and agree on the cleanest path forward."
        core_emotion = "High Stake Conviction"
        constructive_model = "Channel raw anger into clarity of shared stakes."
    elif 'unfair' in lower or 'credit' in lower:
        reframed = "I noticed my contributions in the recent milestone presentation weren't highlighted. For future reviews, I would appreciate direct visibility on the modules I architected."
        core_emotion = "Undervalued"
        constructive_model = "Request specific recognition calmly with documented evidence."
    else:
        reframed = f"When this issue arises, I feel concerned about our progress. I want to collaborate on finding a solution that respects everyone's bandwidth."
        core_emotion = "Reflective Concern"
        constructive_model = "I-statement focusing on shared goals."

    return jsonify({
        'original': raw_statement,
        'reframed_i_statement': reframed,
        'core_emotion': core_emotion,
        'communication_framework': constructive_model,
        'coaching_tip': "Avoid using 'You always...' or 'You never...'. Focus on the observable event, how it affects you, and a specific request."
    }), 200

@mindspace_bp.route('/exercises', methods=['POST'])
@jwt_required()
def record_wellness_exercise():
    user_id = int(get_jwt_identity())
    data = request.get_json() or {}

    exercise_type = data.get('exercise_type', 'breathing_box')
    duration = int(data.get('duration_seconds', 180))
    notes = data.get('notes', '')

    session = WellnessSession(
        user_id=user_id,
        exercise_type=exercise_type,
        duration_seconds=duration,
        user_notes=notes
    )
    db.session.add(session)
    db.session.commit()

    return jsonify({'message': 'Wellness session recorded', 'session': session.to_dict()}), 201

