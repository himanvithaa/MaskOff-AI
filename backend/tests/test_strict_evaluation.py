import pytest
from app import create_app
from app.models import db, User, PracticeSession, ConversationMessage, UserResponse
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

def test_mock_provider_8_classifications():
    provider = MockAIProvider()
    question = "Explain how the Raft consensus algorithm handles joint consensus during dynamic cluster membership changes."

    # 1. Meaningless response
    res_meaningless = provider.evaluate_response({
        'question': question,
        'answer': 'blah blah blah blah blah blah blah',
        'scenario': {},
        'nlp_data': {'filler_word_count': 0, 'filler_frequency_per_100_words': 0, 'structure_score': 0}
    })
    assert res_meaningless['classification'] == 'meaningless'
    assert res_meaningless['overall_score'] == 0.0
    assert res_meaningless['allow_progression'] is False
    assert res_meaningless['allow_retry'] is True
    assert "Invalid Response. We could not identify a meaningful answer. Please try again." in res_meaningless['feedback_message']

    # 2. Irrelevant response
    res_irrelevant = provider.evaluate_response({
        'question': question,
        'answer': 'I really love eating pizza and going to the movie theatre with my friends on weekends.',
        'scenario': {},
        'nlp_data': {'filler_word_count': 0, 'filler_frequency_per_100_words': 0, 'structure_score': 50}
    })
    assert res_irrelevant['classification'] == 'irrelevant'
    assert res_irrelevant['allow_progression'] is False
    assert res_irrelevant['allow_retry'] is True
    assert "Irrelevant Response. Your answer does not address the question. Please answer the question directly." in res_irrelevant['feedback_message']

    # 3. Incorrect technical response
    res_incorrect = provider.evaluate_response({
        'question': question,
        'answer': 'Raft does not use majorities, instead a single node dictates all state transitions without elections.',
        'scenario': {},
        'nlp_data': {'filler_word_count': 0, 'filler_frequency_per_100_words': 0, 'structure_score': 50}
    })
    assert res_incorrect['classification'] == 'incorrect'
    assert res_incorrect['allow_progression'] is False
    assert res_incorrect['allow_retry'] is True
    assert "Incorrect Answer. Your explanation does not match the expected concept. Please review the correction and try again." in res_incorrect['feedback_message']
    assert res_incorrect['explanation'] != ""

    # 4. Partially correct response
    res_partial = provider.evaluate_response({
        'question': question,
        'answer': 'Raft uses a transition configuration where log entries are committed by the cluster.',
        'scenario': {},
        'nlp_data': {'filler_word_count': 0, 'filler_frequency_per_100_words': 0, 'structure_score': 65}
    })
    assert res_partial['classification'] == 'partially_correct'
    assert res_partial['allow_progression'] is True
    assert res_partial['allow_retry'] is True
    assert res_partial['overall_score'] > 0

    # 5. Correct response
    res_correct = provider.evaluate_response({
        'question': question,
        'answer': 'During joint consensus, configuration entries require separate majorities of both the old and new configurations before committing.',
        'scenario': {},
        'nlp_data': {'filler_word_count': 0, 'filler_frequency_per_100_words': 0, 'structure_score': 90}
    })
    assert res_correct['classification'] == 'correct'
    assert res_correct['allow_progression'] is True
    assert res_correct['allow_retry'] is False
    assert res_correct['overall_score'] >= 85

def test_sessions_strict_evaluation_workflow(client):
    reg = client.post('/api/auth/register', json={
        'name': 'Strict Candidate',
        'email': 'candidate_strict@maskoff.ai',
        'password': 'Password123!'
    })
    token = reg.get_json()['token']
    headers = {'Authorization': f'Bearer {token}'}

    # Create session
    sess_res = client.post('/api/sessions', json={
        'interviewer_id': 'male',
        'ai_persona': 'Vikram – Technical Interviewer'
    }, headers=headers)
    assert sess_res.status_code == 201
    session_id = sess_res.get_json()['session']['id']

    # Submit meaningless response
    sub_meaningless = client.post(f'/api/sessions/{session_id}/messages', json={
        'content': 'blah blah blah blah random nonsense blah',
        'duration_seconds': 5.0
    }, headers=headers)
    assert sub_meaningless.status_code == 200
    data_m = sub_meaningless.get_json()
    assert data_m['classification'] == 'meaningless'
    assert data_m['allow_progression'] is False
    assert data_m['allow_retry'] is True
    assert "Invalid Response" in data_m['ai_message']['content']
    assert data_m['analysis']['overall_score'] == 0.0

    # Submit incorrect response
    sub_incorrect = client.post(f'/api/sessions/{session_id}/messages', json={
        'content': 'In Raft, consensus is reached without any quorum and single worker nodes take over directly.',
        'duration_seconds': 8.0
    }, headers=headers)
    assert sub_incorrect.status_code == 200
    data_inc = sub_incorrect.get_json()
    assert data_inc['classification'] == 'incorrect'
    assert data_inc['allow_progression'] is False
    assert data_inc['allow_retry'] is True
    assert "Incorrect Answer" in data_inc['ai_message']['content']
    assert "Retry" in data_inc['ai_message']['content'] or data_inc['allow_retry'] is True

    # Submit empty answer
    sub_empty = client.post(f'/api/sessions/{session_id}/messages', json={
        'content': '   '
    }, headers=headers)
    assert sub_empty.status_code == 400
    assert "No answer detected. Please provide your response before submitting." in sub_empty.get_json()['feedback_message']
