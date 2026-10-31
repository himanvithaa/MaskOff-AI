from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models import db, PracticeSession, UserResponse, ResponseAnalysis, AttemptComparison
from app.ml.nlp_processor import analyze_nlp_text
from app.ai.provider import get_ai_provider
from app.ml.weakness_engine import update_user_weakness_dna

analysis_bp = Blueprint('analysis', __name__, url_prefix='/api/analysis')

@analysis_bp.route('/<int:analysis_id>', methods=['GET'])
@jwt_required()
def get_analysis(analysis_id):
    analysis = ResponseAnalysis.query.get_or_404(analysis_id)
    return jsonify({'analysis': analysis.to_dict()}), 200


@analysis_bp.route('/compare', methods=['POST'])
@jwt_required()
def compare_attempts():
    """
    Compares two specific user responses (First Attempt vs Second Attempt),
    calculates real score deltas, detects resolved/unresolved weaknesses,
    and returns a comparison record.
    """
    user_id = int(get_jwt_identity())
    data = request.get_json() or {}

    first_response_id = data.get('first_response_id')
    second_response_id = data.get('second_response_id')

    if not first_response_id or not second_response_id:
        return jsonify({'error': 'Both first_response_id and second_response_id are required'}), 400

    resp1 = UserResponse.query.get_or_404(first_response_id)
    resp2 = UserResponse.query.get_or_404(second_response_id)

    # Verify session belongs to user
    session = PracticeSession.query.filter_by(id=resp1.session_id, user_id=user_id).first_or_404()

    a1 = resp1.analysis
    a2 = resp2.analysis

    if not a1 or not a2:
        return jsonify({'error': 'Analyses for both responses must be completed before comparison'}), 400

    # Calculate exact deltas
    overall_delta = round(a2.overall_score - a1.overall_score, 1)
    relevance_delta = round(a2.relevance - a1.relevance, 1)
    clarity_delta = round(a2.clarity - a1.clarity, 1)
    structure_delta = round(a2.structure - a1.structure, 1)
    specificity_delta = round(a2.specificity - a1.specificity, 1)
    filler_delta = round(a2.filler_frequency_per_100_words - a1.filler_frequency_per_100_words, 1)

    # Improvements detected
    improvements = []
    if overall_delta > 0:
        improvements.append(f"Overall communication score improved by {overall_delta} points.")
    if clarity_delta > 0:
        improvements.append(f"Clarity and articulation increased (+{clarity_delta}%).")
    if specificity_delta > 0:
        improvements.append(f"Concrete technical depth and evidence expanded (+{specificity_delta}%).")
    if filler_delta < 0:
        improvements.append(f"Filler word frequency dropped from {a1.filler_frequency_per_100_words}% to {a2.filler_frequency_per_100_words}%.")
    if not improvements and overall_delta >= 0:
        improvements.append("Maintained consistent answer relevance and tone across iterations.")

    # Unresolved and new issues
    unresolved = []
    new_issues = []
    w1_set = set(a1.weaknesses or [])
    w2_set = set(a2.weaknesses or [])

    for w in w2_set:
        if w in w1_set:
            unresolved.append(w)
        else:
            new_issues.append(w)

    summary_text = (
        f"In your second attempt, your score shifted by {overall_delta:+} points. "
        f"{'You successfully reduced ambiguities and sharpened your delivery.' if overall_delta > 0 else 'You maintained focus, but continue to address remaining depth gaps.'}"
    )

    comparison = AttemptComparison(
        session_id=session.id,
        first_response_id=resp1.id,
        second_response_id=resp2.id,
        question_text=resp1.question_text,
        overall_delta=overall_delta,
        relevance_delta=relevance_delta,
        clarity_delta=clarity_delta,
        structure_delta=structure_delta,
        specificity_delta=specificity_delta,
        filler_delta=filler_delta,
        improvements=improvements,
        unresolved_weaknesses=unresolved,
        new_issues=new_issues,
        summary=summary_text
    )
    db.session.add(comparison)
    db.session.commit()

    # Re-trigger Weakness DNA
    update_user_weakness_dna(user_id)

    return jsonify({
        'message': 'Attempt comparison generated',
        'comparison': comparison.to_dict()
    }), 201

