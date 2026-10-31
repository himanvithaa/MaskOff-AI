from datetime import datetime
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models import db, User, PracticeSession, ConversationMessage, UserResponse, Scenario, SkillScores, ResponseAnalysis
from app.ai.provider import get_ai_provider
from app.ml.nlp_processor import analyze_nlp_text
from app.ml.weakness_engine import update_user_weakness_dna
from app.ml.recommender import generate_adaptive_recommendations

sessions_bp = Blueprint('sessions', __name__, url_prefix='/api/sessions')

@sessions_bp.route('', methods=['POST'])
@jwt_required()
def create_session():
    user_id = int(get_jwt_identity())
    data = request.get_json() or {}

    scenario_id = data.get('scenario_id')
    scenario = Scenario.query.get(scenario_id) if scenario_id else None

    session_mode = data.get('session_mode', 'standard')
    interviewer_id = (data.get('interviewer_id') or '').lower()
    gender = data.get('gender') or data.get('interviewer_gender')
    ai_persona_req = data.get('ai_persona') or data.get('persona_key')

    from app.ai.personas import get_persona
    # Resolve gender preference if present in interviewer_id
    if not gender:
        if any(f in interviewer_id for f in ['female', 'ananya', 'meera', 'priya', 'kavya', 'neha', 'ishita', 'diya', 'nandini']):
            gender = 'female'
        elif any(m in interviewer_id for m in ['male', 'arjun', 'vikram', 'rahul', 'aditya', 'karan', 'rohan', 'aarav', 'krishna']):
            gender = 'male'

    if not ai_persona_req:
        def_p = scenario.default_persona if scenario and scenario.default_persona else "Technical Interviewer"
        persona_info = get_persona(def_p, gender=gender or 'male')
    else:
        persona_info = get_persona(ai_persona_req, gender=gender)

    ai_persona = persona_info.get("title", f"{persona_info.get('name')} – {persona_info.get('role')}")

    pressure_level = int(data.get('pressure_level', scenario.suggested_pressure_level if scenario else 2))
    difficulty = data.get('difficulty', scenario.difficulty if scenario else 'Intermediate')

    # Create session
    session = PracticeSession(
        user_id=user_id,
        scenario_id=scenario.id if scenario else None,
        session_mode=session_mode,
        ai_persona=ai_persona,
        pressure_level=pressure_level,
        difficulty=difficulty,
        status='active',
        started_at=datetime.utcnow()
    )
    db.session.add(session)
    db.session.flush()

    # Determine initial AI opening line with proper greeting and role introduction
    from app.ai.personas import get_persona
    persona_info = get_persona(ai_persona)
    interviewer_name = persona_info.get("name", "Arjun")
    interviewer_role = persona_info.get("role", "Technical Interviewer")
    scenario_title = scenario.title if scenario else "Communication Assessment"

    if session_mode == 'comeback':
        initial_text = (
            f"Hello, I am {interviewer_name}, your {interviewer_role}. Welcome to the Comeback Challenge. "
            f"In this simulation, we test how gracefully you navigate complex, unexpected questions without bluffing. "
            f"Here is your challenge: Explain how the Raft consensus algorithm handles joint consensus during dynamic cluster membership changes."
        )
    elif session_mode == 'devils_advocate':
        initial_text = (
            f"Hello, I am {interviewer_name}, your {interviewer_role}. Welcome to the Critical Thinking Sparring Arena. "
            f"My goal is to rigorously stress-test your arguments and logical consistency under pressure. "
            f"State your primary thesis clearly, and be prepared to defend it."
        )
    else:
        prompt_body = scenario.initial_prompt if scenario else "When you are ready, please present your core premise or recommendation."
        initial_text = (
            f"Hello, I am {interviewer_name}, your {interviewer_role} for this {scenario_title} session. "
            f"We will examine your reasoning, structure, and communication clarity under pressure. "
            f"{prompt_body}"
        )

    opening_msg = ConversationMessage(
        session_id=session.id,
        sender='ai',
        content=initial_text,
        sequence=1,
        pressure_intent='Greeting & Initial Challenge'
    )
    db.session.add(opening_msg)
    db.session.commit()

    return jsonify({
        'message': 'Session created',
        'session': session.to_dict(),
        'initial_message': opening_msg.to_dict()
    }), 201


@sessions_bp.route('', methods=['GET'])
@jwt_required()
def get_user_sessions():
    user_id = int(get_jwt_identity())
    sessions = (
        PracticeSession.query
        .filter_by(user_id=user_id)
        .order_by(PracticeSession.id.desc())
        .limit(50)
        .all()
    )
    return jsonify({'sessions': [s.to_dict() for s in sessions]}), 200


@sessions_bp.route('/<int:session_id>', methods=['GET'])
@jwt_required()
def get_session(session_id):
    user_id = int(get_jwt_identity())
    session = PracticeSession.query.filter_by(id=session_id, user_id=user_id).first_or_404()

    messages = [m.to_dict() for m in session.messages.order_by(ConversationMessage.sequence.asc()).all()]
    responses = [r.to_dict() for r in session.responses.order_by(UserResponse.id.asc()).all()]
    comparisons = [c.to_dict() for c in session.comparisons.all()]

    return jsonify({
        'session': session.to_dict(),
        'messages': messages,
        'responses': responses,
        'comparisons': comparisons,
        'skill_score': session.skill_score.to_dict() if session.skill_score else None
    }), 200


@sessions_bp.route('/<int:session_id>/interviewer', methods=['POST', 'PATCH'])
@jwt_required()
def update_session_interviewer(session_id):
    user_id = int(get_jwt_identity())
    session = PracticeSession.query.filter_by(id=session_id, user_id=user_id).first_or_404()

    data = request.get_json() or {}
    interviewer_id = (data.get('interviewer_id') or data.get('interviewer_key') or '').lower()
    gender = (data.get('gender') or data.get('interviewer_gender') or '').lower()
    persona_req = data.get('persona_key') or data.get('ai_persona')

    from app.ai.personas import get_persona
    
    if not gender:
        if any(f in interviewer_id for f in ['female', 'ananya', 'meera', 'priya', 'kavya', 'neha', 'ishita', 'diya', 'nandini']):
            gender = 'female'
        elif any(m in interviewer_id for m in ['male', 'arjun', 'vikram', 'rahul', 'aditya', 'karan', 'rohan', 'aarav', 'krishna']):
            gender = 'male'

    # Prioritize switching gender on current session persona, or adopting requested persona
    if persona_req:
        target_base = persona_req
    elif interviewer_id and interviewer_id not in ['male', 'female']:
        target_base = interviewer_id
    else:
        target_base = session.ai_persona

    persona_info = get_persona(target_base, gender=gender)
    session.ai_persona = persona_info.get("title", f"{persona_info.get('name')} – {persona_info.get('role')}")
    name = persona_info.get("name")
    role = persona_info.get("role")

    # Update opening greeting message if sequence == 1
    opening_msg = session.messages.filter_by(sender='ai', sequence=1).first()
    if opening_msg:
        import re
        content = opening_msg.content
        content = re.sub(
            r'Hello,\s+I\s+am\s+[^,.]+,?\s+your\s+([^.]*?)\s+for\s+this\s+([^.]*?)\s+session\.',
            f'Hello, I am {name}, your {role} for this \\2 session.',
            content,
            flags=re.IGNORECASE
        )
        content = re.sub(
            r'Hello,\s+I\s+am\s+[^,.]+,?\s+your\s+([^.]*?)\.',
            f'Hello, I am {name}, your {role}.',
            content,
            flags=re.IGNORECASE
        )
        content = re.sub(
            r'\bI\s+am\s+(?:Arjun|Ananya|Vikram|Meera|Rahul|Priya|Aditya|Kavya|Karan|Neha|Rohan|Ishita|Aarav|Diya|Krishna|Nandini)[^,.]*,?\s+your\s+[^,.]*',
            f'I am {name}, your {role}',
            content,
            flags=re.IGNORECASE
        )
        content = re.sub(
            r'\b(?:Arjun|Ananya|Vikram|Meera|Rahul|Priya|Aditya|Kavya|Karan|Neha|Rohan|Ishita|Aarav|Diya|Krishna|Nandini)\b',
            name,
            content
        )
        opening_msg.content = content

    db.session.commit()

    return jsonify({
        'message': 'Interviewer synchronized',
        'ai_persona': session.ai_persona,
        'opening_message': opening_msg.to_dict() if opening_msg else None
    }), 200


@sessions_bp.route('/<int:session_id>/messages', methods=['POST'])
@jwt_required()
def send_message(session_id):
    user_id = int(get_jwt_identity())
    session = PracticeSession.query.filter_by(id=session_id, user_id=user_id).first_or_404()

    data = request.get_json() or {}
    user_text = (data.get('content') or data.get('answer_text') or '').strip()
    duration_seconds = float(data.get('duration_seconds') or data.get('audio_duration_seconds') or 0.0)
    audio_url = data.get('audio_url')
    parent_response_id = data.get('parent_response_id')
    is_retry = bool(data.get('is_retry', False))

    # Synchronize interviewer persona if explicitly passed in submission
    interviewer_id = (data.get('interviewer_id') or '').lower()
    gender = (data.get('interviewer_gender') or data.get('gender') or '').lower()
    persona_override = data.get('ai_persona') or data.get('persona_key')
    if interviewer_id or persona_override or gender:
        from app.ai.personas import get_persona
        if not gender:
            if any(f in interviewer_id for f in ['female', 'ananya', 'meera', 'priya', 'kavya', 'neha', 'ishita', 'diya', 'nandini']):
                gender = 'female'
            elif any(m in interviewer_id for m in ['male', 'arjun', 'vikram', 'rahul', 'aditya', 'karan', 'rohan', 'aarav', 'krishna']):
                gender = 'male'
        persona_info = get_persona(persona_override or interviewer_id or session.ai_persona, gender=gender)
        session.ai_persona = persona_info.get("title", f"{persona_info.get('name')} – {persona_info.get('role')}")

    if not user_text:
        return jsonify({
            'error': 'Message content cannot be empty. No answer detected. Please provide your response before submitting.',
            'classification': 'empty_response',
            'allow_progression': False,
            'allow_retry': True,
            'feedback_message': 'No answer detected. Please provide your response before submitting.'
        }), 400

    # Get last AI message for question context
    last_ai_msg = (
        session.messages.filter_by(sender='ai')
        .order_by(ConversationMessage.sequence.desc())
        .first()
    )
    question_text = last_ai_msg.content if last_ai_msg else "General question"

    seq = session.messages.count() + 1
    user_msg = ConversationMessage(
        session_id=session.id,
        sender='user',
        content=user_text,
        audio_url=audio_url,
        sequence=seq
    )
    db.session.add(user_msg)
    db.session.flush()

    # Determine attempt number
    attempt_num = 1
    if parent_response_id or is_retry:
        attempt_num = 2

    # Record User Response
    user_response = UserResponse(
        session_id=session.id,
        question_text=question_text,
        answer_text=user_text,
        attempt_number=attempt_num,
        response_duration_seconds=duration_seconds,
        is_retry=is_retry,
        parent_response_id=parent_response_id
    )
    db.session.add(user_response)
    db.session.flush()

    # Perform immediate NLP and AI evaluation for this response
    nlp_metrics = analyze_nlp_text(user_text, duration_seconds) if user_text else {
        'word_count': 0,
        'words_per_minute': 0.0,
        'filler_word_count': 0,
        'filler_frequency_per_100_words': 0.0,
        'filler_breakdown': {},
        'repetition_count': 0,
        'repeated_phrases': [],
        'vague_expressions': [],
        'structure_components': {},
        'structure_score': 0.0
    }
    ai_provider = get_ai_provider()

    eval_data = ai_provider.evaluate_response({
        'question': question_text,
        'answer': user_text,
        'scenario': session.scenario.to_dict() if session.scenario else {},
        'nlp_data': nlp_metrics,
        'persona_name': session.ai_persona
    })

    classification = eval_data.get('classification', eval_data.get('correctness', 'partially_correct'))
    allow_progression = eval_data.get('allow_progression', True)
    allow_retry = eval_data.get('allow_retry', False)
    feedback_message = eval_data.get('feedback_message', '')
    explanation = eval_data.get('explanation', '')
    correct_concepts = eval_data.get('correct_concepts', eval_data.get('what_was_correct', []))
    incorrect_concepts = eval_data.get('incorrect_concepts', eval_data.get('what_was_wrong', []))
    missing_concepts = eval_data.get('missing_concepts', [])

    analysis = ResponseAnalysis(
        response_id=user_response.id,
        overall_score=eval_data.get('overall_score', eval_data.get('score', 75.0)),
        relevance=eval_data.get('relevance', 75.0),
        clarity=eval_data.get('clarity', 75.0),
        structure=eval_data.get('structure', nlp_metrics['structure_score']),
        specificity=eval_data.get('specificity', 70.0),
        conceptual_correctness=eval_data.get('conceptual_correctness', 75.0),
        speaking_fluency=eval_data.get('speaking_fluency', 75.0),
        argumentation=eval_data.get('argumentation', 70.0),
        pressure_handling=eval_data.get('pressure_handling', 70.0),
        recovery_ability=eval_data.get('recovery_ability', 70.0),
        filler_word_count=nlp_metrics['filler_word_count'],
        filler_frequency_per_100_words=nlp_metrics['filler_frequency_per_100_words'],
        filler_breakdown=nlp_metrics['filler_breakdown'],
        repetition_count=nlp_metrics['repetition_count'],
        repeated_phrases=nlp_metrics['repeated_phrases'],
        vague_expressions=nlp_metrics['vague_expressions'],
        structure_components=nlp_metrics['structure_components'],
        strengths=eval_data.get('strengths', []),
        weaknesses=eval_data.get('weaknesses', []),
        why_it_needs_improvement=eval_data.get('why_it_needs_improvement', ''),
        actionable_suggestions=eval_data.get('actionable_suggestions', []),
        sample_improved_answer=eval_data.get('sample_improved_answer', ''),
        targeted_skill_gap=eval_data.get('targeted_skill_gap', 'Clarity & Depth'),
        correctness=classification,
        what_was_correct=correct_concepts,
        what_was_wrong=incorrect_concepts,
        missing_concepts=missing_concepts,
        explanation=explanation,
        recommended_next_action=feedback_message or eval_data.get('recommended_next_action', ''),
        follow_up_question=eval_data.get('follow_up_question', '')
    )
    db.session.add(analysis)

    # Generate next AI conversational response
    all_msgs = session.messages.order_by(ConversationMessage.sequence.asc()).all()
    history = [{'sender': m.sender, 'content': m.content} for m in all_msgs]

    ai_reply_result = ai_provider.generate_chat_reply({
        'ai_persona': session.ai_persona,
        'pressure_level': session.pressure_level,
        'history': history,
        'scenario': session.scenario.to_dict() if session.scenario else {},
        'session_mode': session.session_mode,
        'evaluation': eval_data,
        'last_question': question_text,
        'last_answer': user_text
    })

    # When progression is disallowed, ensure the AI message gives the strict feedback & explanation, not a follow-up
    if not allow_progression:
        combined_text = f"{feedback_message} {explanation}".strip()
        ai_content = combined_text or feedback_message or "Please review the concept and provide your revised answer."
        ai_intent = f"Evaluation: {classification}"
    else:
        ai_content = ai_reply_result.get('reply', "That's an interesting perspective. Could you elaborate further?")
        ai_intent = ai_reply_result.get('pressure_intent', 'Dynamic follow-up')

    ai_msg = ConversationMessage(
        session_id=session.id,
        sender='ai',
        content=ai_content,
        sequence=seq + 1,
        pressure_intent=ai_intent
    )
    db.session.add(ai_msg)
    db.session.commit()

    all_session_messages = session.messages.order_by(ConversationMessage.sequence.asc()).all()

    return jsonify({
        'user_message': user_msg.to_dict(),
        'ai_message': ai_msg.to_dict(),
        'response': user_response.to_dict(),
        'response_id': user_response.id,
        'analysis': analysis.to_dict(),
        'classification': classification,
        'allow_progression': allow_progression,
        'allow_retry': allow_retry,
        'feedback_message': feedback_message,
        'explanation': explanation,
        'messages': [m.to_dict() for m in all_session_messages]
    }), 200


@sessions_bp.route('/<int:session_id>/complete', methods=['POST'])
@jwt_required()
def complete_session(session_id):
    user_id = int(get_jwt_identity())
    session = PracticeSession.query.filter_by(id=session_id, user_id=user_id).first_or_404()

    data = request.get_json(silent=True) or {}
    delivery_metrics = data.get('delivery_metrics')
    if delivery_metrics and isinstance(delivery_metrics, dict):
        import json
        session.summary_notes = json.dumps(delivery_metrics)

    # Aggregate scores across all user responses in this session
    analyses = (
        db.session.query(ResponseAnalysis)
        .join(UserResponse, ResponseAnalysis.response_id == UserResponse.id)
        .filter(UserResponse.session_id == session.id)
        .all()
    )

    if analyses:
        avg = lambda key: round(sum(getattr(a, key) for a in analyses) / len(analyses), 1)
        skill_scores = SkillScores(
            user_id=user_id,
            session_id=session.id,
            clarity=avg('clarity'),
            relevance=avg('relevance'),
            structure=avg('structure'),
            technical_depth=avg('specificity'),
            speaking_fluency=avg('speaking_fluency'),
            argumentation=avg('argumentation'),
            pressure_handling=avg('pressure_handling'),
            recovery_ability=avg('recovery_ability'),
            overall_session_score=avg('overall_score')
        )
        db.session.add(skill_scores)
        session.overall_score = avg('overall_score')
    else:
        session.overall_score = 75.0

    session.status = 'completed'
    session.completed_at = datetime.utcnow()
    db.session.commit()

    # Trigger Weakness DNA update and Adaptive Recommendations
    update_user_weakness_dna(user_id)
    recommendations = generate_adaptive_recommendations(user_id)

    return jsonify({
        'message': 'Session completed successfully',
        'session': session.to_dict(),
        'recommendations': [r.to_dict() for r in recommendations]
    }), 200

