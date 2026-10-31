"""
MaskOff AI - Cross-Scenario Intelligence & Adaptive Recommendation Engine
Identifies shared skill gaps across different categories and generates targeted exercise recommendations.
"""

from app.models import db, WeaknessProfile, Scenario, RecommendedExercise, PracticeSession

SKILL_TO_CATEGORY_MAP = {
    'argumentation': ['critical_thinking', 'professional'],
    'technical_depth': ['academic', 'professional'],
    'structure': ['public_speaking', 'academic'],
    'pressure_handling': ['critical_thinking', 'leadership'],
    'fluency': ['public_speaking', 'social'],
    'recovery_ability': ['critical_thinking', 'academic']
}

def generate_adaptive_recommendations(user_id: int, limit: int = 3):
    """
    Analyzes historical performance across scenarios, identifies recurring skill gaps,
    and populates recommended exercises for the user.
    """
    profile = WeaknessProfile.query.filter_by(user_id=user_id).first()
    
    # Identify lowest DNA skill area
    lowest_metric = 'argumentation'
    min_score = 100.0

    if profile:
        metrics = {
            'argumentation': profile.argumentation_dna,
            'technical_depth': profile.depth_dna,
            'structure': profile.structure_dna,
            'pressure_handling': profile.pressure_handling_dna,
            'fluency': profile.fluency_dna,
            'recovery_ability': profile.recovery_ability_dna
        }
        for k, v in metrics.items():
            if v < min_score:
                min_score = v
                lowest_metric = k

    target_categories = SKILL_TO_CATEGORY_MAP.get(lowest_metric, ['critical_thinking', 'professional'])

    # Find scenarios in target categories not completed recently
    recent_scenario_ids = [
        s.scenario_id for s in 
        PracticeSession.query.filter_by(user_id=user_id, status='completed').order_by(PracticeSession.id.desc()).limit(5).all()
        if s.scenario_id
    ]

    query = Scenario.query.filter(Scenario.category.in_(target_categories))
    if recent_scenario_ids:
        query = query.filter(~Scenario.id.in_(recent_scenario_ids))

    candidate_scenarios = query.limit(limit).all()
    if not candidate_scenarios:
        candidate_scenarios = Scenario.query.limit(limit).all()

    # Clear old incomplete recommendations to keep recommendations fresh
    RecommendedExercise.query.filter_by(user_id=user_id, is_completed=False).delete()

    created_recs = []
    for sc in candidate_scenarios:
        reason_text = (
            f"Based on your recent practice, your {lowest_metric.replace('_', ' ').title()} "
            f"(Score: {round(min_score, 1)}) indicates room for growth under counterarguments. "
            f"This scenario specifically exercises conviction and logical justification."
        )
        rec = RecommendedExercise(
            user_id=user_id,
            scenario_id=sc.id,
            targeted_skill_gap=lowest_metric.replace('_', ' ').title(),
            reason=reason_text,
            priority='high' if min_score < 70 else 'medium'
        )
        db.session.add(rec)
        created_recs.append(rec)

    db.session.commit()
    return created_recs

