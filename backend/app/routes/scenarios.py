from flask import Blueprint, request, jsonify
from app.models import Scenario

scenarios_bp = Blueprint('scenarios', __name__, url_prefix='/api/scenarios')

CATEGORIES_META = [
    {
        "id": "academic",
        "name": "Academic Simulator",
        "description": "Viva voce, defense panels, technical queries, and faculty challenges.",
        "icon": "GraduationCap",
        "color": "indigo"
    },
    {
        "id": "professional",
        "name": "Professional Simulator",
        "description": "Technical interviews, 1-on-1s, handling manager pushback, and explaining delays.",
        "icon": "Briefcase",
        "color": "cyan"
    },
    {
        "id": "public_speaking",
        "name": "Public Speaking Simulator",
        "description": "Keynotes, impromptu debates, hostile audience questions, and Q&A dynamics.",
        "icon": "Mic",
        "color": "purple"
    },
    {
        "id": "social",
        "name": "Social Interaction Simulator",
        "description": "Polite boundary setting, respectful disagreement, and authentic expression.",
        "icon": "MessageSquare",
        "color": "emerald"
    },
    {
        "id": "leadership",
        "name": "Leadership Simulator",
        "description": "Resolving team deadlocks, giving candid feedback, and making tough calls.",
        "icon": "Users",
        "color": "amber"
    },
    {
        "id": "critical_thinking",
        "name": "Critical Thinking Simulator",
        "description": "Devil's Advocate sparring, first-principles defense, and the Comeback Challenge.",
        "icon": "Flame",
        "color": "rose"
    }
]

@scenarios_bp.route('/categories', methods=['GET'])
def get_categories():
    # Append count of scenarios for each category
    result = []
    for cat in CATEGORIES_META:
        count = Scenario.query.filter_by(category=cat["id"]).count()
        result.append({**cat, "scenario_count": count})
    return jsonify({'categories': result}), 200

@scenarios_bp.route('', methods=['GET'])
def get_scenarios():
    category = request.args.get('category')
    difficulty = request.args.get('difficulty')
    search = request.args.get('q')

    query = Scenario.query
    if category and category != 'all':
        query = query.filter_by(category=category)
    if difficulty and difficulty != 'all':
        query = query.filter_by(difficulty=difficulty)
    if search:
        query = query.filter(Scenario.title.ilike(f'%{search}%') | Scenario.description.ilike(f'%{search}%'))

    scenarios = query.order_by(Scenario.id.asc()).all()
    return jsonify({'scenarios': [s.to_dict() for s in scenarios]}), 200

@scenarios_bp.route('/<int:scenario_id>', methods=['GET'])
def get_scenario(scenario_id):
    scenario = Scenario.query.get_or_404(scenario_id)
    return jsonify({'scenario': scenario.to_dict()}), 200

