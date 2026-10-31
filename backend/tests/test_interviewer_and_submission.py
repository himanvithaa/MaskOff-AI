import pytest
from app import create_app
from app.models import db, User, PracticeSession, ConversationMessage, UserResponse, ResponseAnalysis
from app.ai.personas import get_persona

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

def test_interviewer_personas_and_aliases():
    arjun = get_persona('Arjun')
    assert arjun['name'] == 'Arjun'
    assert 'Technical Interviewer' in arjun['role']
    assert arjun['gender'] == 'male'

    ananya = get_persona('Ananya')
    assert ananya['name'] == 'Ananya'
    assert 'Professional Interviewer' in ananya['role']
    assert ananya['gender'] == 'female'

    # Aliases
    assert get_persona('male')['name'] == 'Arjun'
    assert get_persona('female')['name'] == 'Ananya'
    assert get_persona('technical interviewer')['name'] in ['Vikram', 'Arjun']
    assert get_persona('professional interviewer')['name'] in ['Meera', 'Ananya', 'Priya']

def test_submission_workflow_both_payload_keys(client):
    # Register and login user
    reg_res = client.post('/api/auth/register', json={
        'name': 'Test Candidate',
        'email': 'candidate@test.com',
        'password': 'SecurePassword123!'
    })
    token = reg_res.get_json()['token']
    auth_headers = {'Authorization': f'Bearer {token}'}

    # 1. Create session with Arjun
    create_arjun = client.post('/api/sessions', json={
        'interviewer_id': 'male',
        'ai_persona': 'Arjun – Technical Interviewer'
    }, headers=auth_headers)
    assert create_arjun.status_code == 201
    arjun_data = create_arjun.get_json()
    assert 'Arjun' in arjun_data['session']['ai_persona']
    assert 'Arjun' in arjun_data['initial_message']['content']
    session_id_arjun = arjun_data['session']['id']

    # 2. Submit answer using 'answer_text' key
    sub_res = client.post(f'/api/sessions/{session_id_arjun}/messages', json={
        'answer_text': 'I designed the service using an asynchronous queue with idempotency keys to guarantee at-least-once delivery.',
        'audio_duration_seconds': 14.5,
        'interviewer_id': 'male'
    }, headers=auth_headers)
    assert sub_res.status_code == 200
    res_data = sub_res.get_json()
    assert 'user_message' in res_data
    assert 'ai_message' in res_data
    assert 'response' in res_data
    assert 'response_id' in res_data
    assert 'analysis' in res_data
    assert 'messages' in res_data
    assert len(res_data['messages']) >= 3 # initial + user + ai

    # Verify database persistence
    user_resp = db.session.get(UserResponse, res_data['response_id'])
    assert user_resp is not None
    assert 'asynchronous queue' in user_resp.answer_text
    assert user_resp.analysis is not None
    assert user_resp.analysis.overall_score > 0

    # 3. Submit empty answer -> should return 400
    empty_res = client.post(f'/api/sessions/{session_id_arjun}/messages', json={
        'answer_text': '   '
    }, headers=auth_headers)
    assert empty_res.status_code == 400
    assert 'cannot be empty' in empty_res.get_json()['error']

    # 4. Create session with Ananya
    create_ananya = client.post('/api/sessions', json={
        'interviewer_id': 'female',
        'ai_persona': 'Ananya – Professional Interviewer'
    }, headers=auth_headers)
    assert create_ananya.status_code == 201
    ananya_data = create_ananya.get_json()
    assert 'Ananya' in ananya_data['session']['ai_persona']
    assert 'Ananya' in ananya_data['initial_message']['content']
    session_id_ananya = ananya_data['session']['id']

    # 5. Submit answer using 'content' key
    sub_ananya = client.post(f'/api/sessions/{session_id_ananya}/messages', json={
        'content': 'I addressed the stakeholder conflict by organizing a requirements alignment workshop and clarifying core KPIs.',
        'duration_seconds': 18.0,
        'interviewer_id': 'female'
    }, headers=auth_headers)
    assert sub_ananya.status_code == 200
    ananya_sub_data = sub_ananya.get_json()
    assert 'Ananya' in ananya_sub_data['ai_message']['pressure_intent'] or 'Ananya' in ananya_data['session']['ai_persona']

    # 6. Test update_session_interviewer endpoint (switch from Arjun to Ananya)
    switch_res = client.post(f'/api/sessions/{session_id_arjun}/interviewer', json={
        'interviewer_id': 'female'
    }, headers=auth_headers)
    assert switch_res.status_code == 200
    switch_data = switch_res.get_json()
    assert 'Ananya' in switch_data['ai_persona']
    assert 'Ananya' in switch_data['opening_message']['content']
