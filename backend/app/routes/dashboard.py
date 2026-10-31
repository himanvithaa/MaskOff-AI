from datetime import datetime, timedelta
from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models import db, User, PracticeSession, SkillScores, WeaknessProfile, RecommendedExercise

dashboard_bp = Blueprint('dashboard', __name__, url_prefix='/api/dashboard')

@dashboard_bp.route('', methods=['GET'])
@jwt_required()
def get_dashboard_data():
    user_id = int(get_jwt_identity())
    user = User.query.get_or_404(user_id)

    # 1. Total practice sessions
    total_sessions = PracticeSession.query.filter_by(user_id=user_id, status='completed').count()

    # 2. Average communication score
    completed_sessions = (
        PracticeSession.query
        .filter_by(user_id=user_id, status='completed')
        .order_by(PracticeSession.id.asc())
        .all()
    )

    avg_score = 0.0
    improvement_pct = 0.0
    if completed_sessions:
        scores = [s.overall_score for s in completed_sessions if s.overall_score is not None]
        if scores:
            avg_score = round(sum(scores) / len(scores), 1)
            if len(scores) >= 2:
                first_avg = sum(scores[:2]) / len(scores[:2])
                last_avg = sum(scores[-2:]) / len(scores[-2:])
                improvement_pct = round(((last_avg - first_avg) / max(1.0, first_avg)) * 100, 1)

    # 3. Practice streak calculation
    streak_days = 0
    if completed_sessions:
        # Check consecutive days
        dates = sorted({s.started_at.date() for s in completed_sessions if s.started_at}, reverse=True)
        today = datetime.utcnow().date()
        if dates and (dates[0] == today or dates[0] == today - timedelta(days=1)):
            streak_days = 1
            curr = dates[0]
            for next_date in dates[1:]:
                if (curr - next_date).days == 1:
                    streak_days += 1
                    curr = next_date
                else:
                    break

    # 4. Communication skill overview (Radar chart data)
    profile = WeaknessProfile.query.filter_by(user_id=user_id).first()
    skill_metrics = {
        'Clarity': profile.clarity_dna if profile else 70.0,
        'Relevance': profile.relevance_dna if profile else 70.0,
        'Structure': profile.structure_dna if profile else 70.0,
        'Technical Depth': profile.depth_dna if profile else 70.0,
        'Speaking Fluency': profile.fluency_dna if profile else 70.0,
        'Argumentation': profile.argumentation_dna if profile else 70.0,
        'Pressure Handling': profile.pressure_handling_dna if profile else 70.0,
        'Recovery Ability': profile.recovery_ability_dna if profile else 70.0,
    }

    radar_data = [{'skill': k, 'score': round(v, 1), 'benchmark': 75} for k, v in skill_metrics.items()]

    # 5. Recent Practice
    recent_sessions_models = (
        PracticeSession.query
        .filter_by(user_id=user_id)
        .order_by(PracticeSession.id.desc())
        .limit(5)
        .all()
    )
    recent_sessions = []
    for s in recent_sessions_models:
        recent_sessions.append({
            'id': s.id,
            'scenario_title': s.scenario.title if s.scenario else 'Interactive Simulation',
            'category': s.scenario.category if s.scenario else 'custom',
            'date': s.started_at.strftime('%b %d, %Y') if s.started_at else 'Recent',
            'score': s.overall_score,
            'status': s.status,
            'ai_persona': s.ai_persona
        })

    # 6. Recommended Practice
    recs = (
        RecommendedExercise.query
        .filter_by(user_id=user_id, is_completed=False)
        .order_by(RecommendedExercise.id.desc())
        .limit(3)
        .all()
    )
    recommended_list = [r.to_dict() for r in recs]

    return jsonify({
        'user_name': user.name,
        'stats': {
            'total_sessions': total_sessions,
            'average_score': avg_score,
            'improvement_percentage': improvement_pct,
            'current_streak_days': max(1, streak_days) if total_sessions > 0 else 0
        },
        'radar_chart': radar_data,
        'recent_sessions': recent_sessions,
        'recommended_exercises': recommended_list,
        'weakness_dna_summary': {
            'top_strengths': profile.top_strengths if profile else [],
            'persistent_weaknesses': profile.persistent_weaknesses if profile else [],
            'recurring_patterns': profile.recurring_patterns if profile else []
        }
    }), 200


@dashboard_bp.route('/progress', methods=['GET'])
@jwt_required()
def get_growth_progress():
    user_id = int(get_jwt_identity())
    
    # Fetch all historical skill scores
    all_scores = (
        SkillScores.query
        .filter_by(user_id=user_id)
        .order_by(SkillScores.created_at.asc())
        .all()
    )

    if not all_scores:
        # Return structured template indicating insufficient data
        return jsonify({
            'has_sufficient_data': False,
            'timeline': [],
            'strongest_skill': "N/A (Complete 2 sessions to unlock)",
            'weakest_skill': "N/A",
            'most_improved': "N/A"
        }), 200

    timeline = []
    for idx, s in enumerate(all_scores):
        session_num = f"Session {idx + 1}"
        date_str = s.created_at.strftime('%b %d') if s.created_at else session_num
        timeline.append({
            'session': session_num,
            'date': date_str,
            'overall': round(s.overall_session_score, 1),
            'clarity': round(s.clarity, 1),
            'relevance': round(s.relevance, 1),
            'structure': round(s.structure, 1),
            'depth': round(s.technical_depth, 1),
            'fluency': round(s.speaking_fluency, 1),
            'argumentation': round(s.argumentation, 1),
            'pressure': round(s.pressure_handling, 1),
            'recovery': round(s.recovery_ability, 1)
        })

    # Determine strongest and weakest
    latest = timeline[-1]
    keys = ['clarity', 'relevance', 'structure', 'depth', 'fluency', 'argumentation', 'pressure', 'recovery']
    sorted_skills = sorted(keys, key=lambda k: latest[k], reverse=True)
    strongest = sorted_skills[0].replace('_', ' ').title()
    weakest = sorted_skills[-1].replace('_', ' ').title()

    # Most improved
    most_improved = "Consistent Baseline"
    if len(timeline) >= 2:
        first = timeline[0]
        deltas = {k: latest[k] - first[k] for k in keys}
        best_delta_key = max(deltas, key=deltas.get)
        if deltas[best_delta_key] > 0:
            most_improved = f"{best_delta_key.replace('_', ' ').title()} (+{round(deltas[best_delta_key], 1)} pts)"

    return jsonify({
        'has_sufficient_data': True,
        'timeline': timeline,
        'strongest_skill': strongest,
        'weakest_skill': weakest,
        'most_improved': most_improved
    }), 200

