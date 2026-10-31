"""
MaskOff AI - Weakness DNA Engine
Persistent Communication Profile & Multi-Session Trend Aggregator
Updates user's Weakness DNA based on all historical responses and session scores.
"""

from datetime import datetime
from app.models import db, WeaknessProfile, SkillScores, ResponseAnalysis, UserResponse, PracticeSession

def update_user_weakness_dna(user_id: int):
    """
    Recalculates and persists the user's Weakness DNA profile.
    Considers all completed sessions and detailed response analyses.
    """
    profile = WeaknessProfile.query.filter_by(user_id=user_id).first()
    if not profile:
        profile = WeaknessProfile(user_id=user_id)
        db.session.add(profile)

    # 1. Fetch all skill scores for this user
    all_scores = SkillScores.query.filter_by(user_id=user_id).all()
    if not all_scores:
        db.session.commit()
        return profile

    profile.total_sessions_analyzed = len(all_scores)

    # Calculate weighted averages (giving higher weight to more recent sessions)
    n = len(all_scores)
    total_weights = 0.0
    agg = {
        'clarity': 0.0,
        'relevance': 0.0,
        'structure': 0.0,
        'technical_depth': 0.0,
        'fluency': 0.0,
        'argumentation': 0.0,
        'pressure_handling': 0.0,
        'recovery_ability': 0.0,
        'overall': 0.0
    }

    for idx, s in enumerate(all_scores):
        weight = 1.0 + (idx / max(1, n)) # Later sessions have higher weight
        total_weights += weight
        agg['clarity'] += s.clarity * weight
        agg['relevance'] += s.relevance * weight
        agg['structure'] += s.structure * weight
        agg['technical_depth'] += s.technical_depth * weight
        agg['fluency'] += s.speaking_fluency * weight
        agg['argumentation'] += s.argumentation * weight
        agg['pressure_handling'] += s.pressure_handling * weight
        agg['recovery_ability'] += s.recovery_ability * weight
        agg['overall'] += s.overall_session_score * weight

    profile.clarity_dna = round(agg['clarity'] / total_weights, 1)
    profile.relevance_dna = round(agg['relevance'] / total_weights, 1)
    profile.structure_dna = round(agg['structure'] / total_weights, 1)
    profile.depth_dna = round(agg['technical_depth'] / total_weights, 1)
    profile.fluency_dna = round(agg['fluency'] / total_weights, 1)
    profile.argumentation_dna = round(agg['argumentation'] / total_weights, 1)
    profile.pressure_handling_dna = round(agg['pressure_handling'] / total_weights, 1)
    profile.recovery_ability_dna = round(agg['recovery_ability'] / total_weights, 1)
    profile.overall_communication_dna_score = round(agg['overall'] / total_weights, 1)

    # 2. Extract recurring weaknesses from recent response analyses
    recent_responses = (
        db.session.query(ResponseAnalysis)
        .join(UserResponse, ResponseAnalysis.response_id == UserResponse.id)
        .join(PracticeSession, UserResponse.session_id == PracticeSession.id)
        .filter(PracticeSession.user_id == user_id)
        .order_by(ResponseAnalysis.id.desc())
        .limit(20)
        .all()
    )

    weakness_frequency = {}
    strength_frequency = {}
    filler_overages = 0
    vague_overages = 0

    for r in recent_responses:
        for w in (r.weaknesses or []):
            weakness_frequency[w] = weakness_frequency.get(w, 0) + 1
        for s in (r.strengths or []):
            strength_frequency[s] = strength_frequency.get(s, 0) + 1
        if r.filler_frequency_per_100_words > 3.0:
            filler_overages += 1
        if r.vague_expressions and len(r.vague_expressions) > 0:
            vague_overages += 1

    # Build Top Strengths
    sorted_strengths = sorted(strength_frequency.items(), key=lambda x: x[1], reverse=True)
    profile.top_strengths = [
        {"skill": k, "frequency": v, "confidence": min(95, 75 + v * 5)}
        for k, v in sorted_strengths[:4]
    ]
    if not profile.top_strengths:
        profile.top_strengths = [
            {"skill": "Answer relevance in direct inquiries", "frequency": 1, "confidence": 80},
            {"skill": "Poise during initial greeting", "frequency": 1, "confidence": 78}
        ]

    # Build Persistent Weaknesses
    sorted_weaknesses = sorted(weakness_frequency.items(), key=lambda x: x[1], reverse=True)
    persistent_list = []
    for w, count in sorted_weaknesses[:5]:
        severity = "High" if count >= 3 else ("Moderate" if count == 2 else "Low")
        persistent_list.append({
            "weakness": w,
            "recurrence_count": count,
            "severity": severity
        })

    if filler_overages >= 2:
        persistent_list.append({
            "weakness": "Elevated filler word frequency under interrogation",
            "recurrence_count": filler_overages,
            "severity": "Moderate"
        })

    if vague_overages >= 2:
        persistent_list.append({
            "weakness": "Vague generalization when asked for specific mechanisms",
            "recurrence_count": vague_overages,
            "severity": "High"
        })

    profile.persistent_weaknesses = persistent_list

    # Recurring Patterns
    patterns = []
    if profile.depth_dna < 70:
        patterns.append("Struggles with technical depth when challenged on architectural trade-offs.")
    if profile.argumentation_dna < 70:
        patterns.append("Concedes arguments prematurely instead of defending premise with evidence.")
    if profile.fluency_dna < 70:
        patterns.append("Speech fluency drops sharply during spontaneous or unexpected questions.")
    if profile.structure_dna < 70:
        patterns.append("Answers lack clear closure or synthesized takeaway point.")
    if not patterns:
        patterns.append("Maintains consistent baseline communication; ready for advanced pressure challenges.")

    profile.recurring_patterns = patterns
    profile.updated_at = datetime.utcnow()

    db.session.commit()
    return profile

