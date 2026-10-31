import pytest
from app import create_app
from app.models import db, User, Scenario, PracticeSession
from app.ai.personas import get_persona, INDIAN_INTERVIEWERS
from app.ml.nlp_processor import analyze_nlp_text, find_filler_occurrences
from app.ai.provider import MockAIProvider

@pytest.fixture
def client():
    app = create_app()
    app.config['TESTING'] = True
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
    with app.app_context():
        db.create_all()
        yield app.test_client()
        db.session.remove()
        db.drop_all()

def test_health_check(client):
    res = client.get('/api/health')
    assert res.status_code == 200
    assert res.get_json()['status'] == 'online'

def test_indian_personas():
    """Verify all 8 essential Indian interviewer personas across Male and Female identities."""
    expected_names = [
        "Arjun", "Ananya", "Vikram", "Meera", "Rahul", "Priya",
        "Aditya", "Kavya", "Karan", "Neha", "Rohan", "Ishita",
        "Aarav", "Diya", "Krishna", "Nandini"
    ]
    for key, info in INDIAN_INTERVIEWERS.items():
        assert info["name"] in expected_names
        assert info["role"] is not None
        assert info["system_directive"] is not None

    # Test flexible lookups
    assert get_persona("Arjun")["name"] == "Arjun"
    assert get_persona("Ananya")["name"] == "Ananya"
    assert get_persona("Vikram")["name"] == "Vikram"
    assert get_persona("Meera")["name"] == "Meera"
    assert get_persona("Strict Professor", "male")["name"] == "Arjun"
    assert get_persona("Strict Professor", "female")["name"] == "Ananya"
    assert get_persona("Technical Interviewer", "male")["name"] == "Vikram"
    assert get_persona("Technical Interviewer", "female")["name"] == "Meera"
    assert get_persona("HR Interviewer", "male")["name"] == "Rahul"
    assert get_persona("HR Interviewer", "female")["name"] == "Priya"
    assert get_persona("Skeptical Examiner", "male")["name"] == "Aditya"
    assert get_persona("Skeptical Examiner", "female")["name"] == "Kavya"
    assert get_persona("Strict Manager", "male")["name"] == "Karan"
    assert get_persona("Strict Manager", "female")["name"] == "Neha"
    assert get_persona("Devil's Advocate", "male")["name"] == "Rohan"
    assert get_persona("Devil's Advocate", "female")["name"] == "Ishita"
    assert get_persona("Curious Audience", "male")["name"] == "Aarav"
    assert get_persona("Curious Audience", "female")["name"] == "Diya"
    assert get_persona("Supportive Mentor", "male")["name"] == "Krishna"
    assert get_persona("Supportive Mentor", "female")["name"] == "Nandini"

def test_filler_word_detection():
    """Verify detection of uh, ah, eh, er, hmm, um, and contextual 'like' vs genuine 'like'."""
    # 1. Phonetic hesitation sounds
    text1 = "Um, uh, ah, eh, er, and hmm, I think we need to test this."
    res1 = analyze_nlp_text(text1)
    breakdown1 = res1['filler_breakdown']
    assert breakdown1.get('um') == 1
    assert breakdown1.get('uh') == 1
    assert breakdown1.get('ah') == 1
    assert breakdown1.get('eh') == 1
    assert breakdown1.get('er') == 1
    assert breakdown1.get('hmm') == 1

    # 2. Genuine 'like' (verb/comparison) vs filler 'like'
    text2 = "I like Python because algorithms like Dijkstra work well, but like, it was tricky."
    res2 = analyze_nlp_text(text2)
    assert res2['filler_breakdown'].get('like') == 1
    assert res2['filler_word_count'] == 1

    # 3. Repeated 'basically' / 'actually'
    text3 = "Basically, we deployed it and basically, it was actually, actually fast."
    res3 = analyze_nlp_text(text3)
    assert 'basically' in res3['filler_breakdown']
    assert 'actually' in res3['filler_breakdown']

    # 4. Highlighted transcript structure
    assert 'highlighted_transcript' in res1
    assert any(seg['is_filler'] for seg in res1['highlighted_transcript'])

def test_structured_correctness_and_dynamic_followup():
    """Verify structured correctness evaluation and dynamic follow-up generation."""
    mock = MockAIProvider()

    # Case A: Reversed / Incorrect concept
    eval_incorrect = mock.evaluate_response({
        "question": "Can you explain the difference between supervised and unsupervised learning?",
        "answer": "Supervised learning has no labels, while unsupervised has labels.",
        "nlp_data": {"word_count": 12, "filler_frequency_per_100_words": 0.0}
    })
    assert eval_incorrect["correctness"] == "incorrect"
    assert eval_incorrect["score"] < 50
    assert len(eval_incorrect["what_was_wrong"]) > 0
    assert "Supervised learning requires labeled data" in eval_incorrect["what_was_wrong"][0]
    assert len(eval_incorrect["follow_up_question"]) > 0

    # Verify Vikram's response specifically challenges the incorrect answer
    reply_incorrect = mock.generate_chat_reply({
        "ai_persona": "Vikram – Strict Technical Interviewer",
        "last_question": "Explain supervised vs unsupervised learning",
        "last_answer": "Supervised has no labels",
        "evaluation": eval_incorrect
    })
    assert "That is incorrect" in reply_incorrect["reply"]

    # Case B: Correct concept
    eval_correct = mock.evaluate_response({
        "question": "Explain how Dijkstra handles negative edge cycles.",
        "answer": "Dijkstra greedily assumes visited nodes have finalized optimal distances, so negative edge weights break that invariant.",
        "nlp_data": {"word_count": 17, "filler_frequency_per_100_words": 0.0}
    })
    assert eval_correct["correctness"] == "correct"
    assert eval_correct["score"] >= 85
    assert len(eval_correct["what_was_correct"]) > 0

    # Case C: Insufficient Information / Don't know
    eval_unknown = mock.evaluate_response({
        "question": "Explain Raft joint consensus configuration changes.",
        "answer": "I don't know the exact details of joint consensus.",
        "nlp_data": {"word_count": 9, "filler_frequency_per_100_words": 0.0}
    })
    assert eval_unknown["correctness"] == "insufficient_information"
    assert len(eval_unknown["explanation"]) > 0

def test_user_flow_and_simulation(client):
    """End-to-end user simulation flow verifying Indian personas and correctness structure."""
    # Register
    reg_res = client.post('/api/auth/register', json={
        'name': 'Alex Rivera',
        'email': 'alex@maskoff.ai',
        'password': 'StrongPassword123!'
    })
    assert reg_res.status_code == 201
    token = reg_res.get_json()['token']
    headers = {'Authorization': f'Bearer {token}'}

    # Fetch scenarios
    sc_res = client.get('/api/scenarios')
    assert sc_res.status_code == 200
    scenarios = sc_res.get_json()['scenarios']
    assert len(scenarios) > 0

    # Start session with Vikram (Indian Strict Technical Interviewer)
    session_res = client.post('/api/sessions', json={
        'scenario_id': scenarios[0]['id'],
        'pressure_level': 3,
        'ai_persona': 'Vikram – Strict Technical Interviewer'
    }, headers=headers)
    assert session_res.status_code == 201
    session_id = session_res.get_json()['session']['id']
    initial_msg = session_res.get_json()['initial_message']
    assert "Vikram" in initial_msg['content']

    # Send response
    msg_res = client.post(f'/api/sessions/{session_id}/messages', json={
        'content': 'We implemented Raft consensus to achieve fault tolerance across leader elections using dual-majority quorums.',
        'duration_seconds': 14.5
    }, headers=headers)
    assert msg_res.status_code == 200
    data = msg_res.get_json()
    assert 'ai_message' in data
    assert 'analysis' in data
    assert 'correctness_evaluation' in data['analysis']
    assert data['analysis']['correctness_evaluation']['correctness'] in ['correct', 'partially_correct']
    assert data['analysis']['overall_score'] > 50

    # Complete session
    comp_res = client.post(f'/api/sessions/{session_id}/complete', headers=headers)
    assert comp_res.status_code == 200
    assert comp_res.get_json()['session']['status'] == 'completed'

def test_auth_error_messages(client):
    """Verify specific error messages for all login validation cases."""
    # 1. Missing email
    res1 = client.post('/api/auth/login', json={'email': '', 'password': 'Password123!'})
    assert res1.status_code == 400
    assert res1.get_json()['error'] == 'Please enter your email address.'

    # 2. Missing password
    res2 = client.post('/api/auth/login', json={'email': 'alex@domain.com', 'password': ''})
    assert res2.status_code == 400
    assert res2.get_json()['error'] == 'Please enter your password.'

    # 3. Account not found
    res3 = client.post('/api/auth/login', json={'email': 'nonexistent@domain.com', 'password': 'Password123!'})
    assert res3.status_code == 404
    assert res3.get_json()['error'] == 'Account not found. Please register first.'

    # 4. Register user
    reg = client.post('/api/auth/register', json={
        'name': 'Test User',
        'email': 'valid@domain.com',
        'password': 'CorrectPassword123!'
    })
    assert reg.status_code == 201

    # 5. Incorrect password
    res4 = client.post('/api/auth/login', json={'email': 'valid@domain.com', 'password': 'WrongPassword!'})
    assert res4.status_code == 401
    assert res4.get_json()['error'] == 'Incorrect password. Please try again.'

    # 6. Correct login
    res5 = client.post('/api/auth/login', json={'email': 'valid@domain.com', 'password': 'CorrectPassword123!'})
    assert res5.status_code == 200
    assert 'token' in res5.get_json()

def test_chatbot_endpoint(client):
    """Verify MaskOff Assistant chatbot API endpoint and grounding in knowledge base."""
    # 1. Empty message error
    res_empty = client.post('/api/chatbot/message', json={'message': ''})
    assert res_empty.status_code == 400

    # 2. Query about interviewers
    res_interviewers = client.post('/api/chatbot/message', json={'message': 'Who are the interviewers?'})
    assert res_interviewers.status_code == 200
    data_int = res_interviewers.get_json()
    assert 'reply' in data_int
    assert 'Arjun' in data_int['reply'] or 'Ananya' in data_int['reply']
    assert 'suggestions' in data_int
    assert len(data_int['suggestions']) > 0

    # 3. Query about PREP framework
    res_prep = client.post('/api/chatbot/message', json={'message': 'Explain the PREP framework'})
    assert res_prep.status_code == 200
    data_prep = res_prep.get_json()
    assert 'Point' in data_prep['reply'] or 'Reason' in data_prep['reply']

    # 4. Query about accents
    res_accent = client.post('/api/chatbot/message', json={'message': 'What voice accents are supported?'})
    assert res_accent.status_code == 200
    data_accent = res_accent.get_json()
    assert 'Polish' in data_accent['reply'] or 'African' in data_accent['reply'] or 'American' in data_accent['reply']

    # 5. Query about live captions
    res_caps = client.post('/api/chatbot/message', json={'message': 'Tell me about live captions'})
    assert res_caps.status_code == 200
    data_caps = res_caps.get_json()
    assert 'Captions' in data_caps['reply'] or 'video' in data_caps['reply']
