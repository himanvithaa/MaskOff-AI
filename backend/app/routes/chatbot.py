from flask import Blueprint, request, jsonify
from app.knowledge.project_knowledge import PROJECT_KNOWLEDGE, search_knowledge_base, FAQS
from app.ai.provider import get_ai_provider
import logging

logger = logging.getLogger(__name__)

chatbot_bp = Blueprint('chatbot', __name__, url_prefix='/api/chatbot')

DEFAULT_SUGGESTIONS = [
    "How does the PREP framework work?",
    "Tell me about Arjun and Ananya.",
    "How is my camera delivery evaluated?",
    "What is Weakness DNA?",
    "How do I start an interview simulation?"
]

@chatbot_bp.route('/message', methods=['POST'])
def send_message():
    data = request.get_json() or {}
    user_message = data.get('message', '').strip()
    history = data.get('history', [])

    if not user_message:
        return jsonify({'error': 'Message cannot be empty'}), 400

    # 1. Search knowledge base
    search_res = search_knowledge_base(user_message)
    matched_faq = search_res.get('matched_faq')

    # 2. Query AI Provider with Grounded Context
    provider = get_ai_provider()
    system_prompt = (
        f"You are the MaskOff Assistant, the intelligent and friendly AI companion for MaskOff AI.\n"
        f"MaskOff AI Tagline: '{PROJECT_KNOWLEDGE['tagline']}'\n"
        f"Core Philosophy: '{PROJECT_KNOWLEDGE['core_philosophy']}'\n\n"
        f"Central Knowledge Base:\n"
        f"- Target Audience: {', '.join(PROJECT_KNOWLEDGE['target_audience'])}\n"
        f"- Interviewers: Arjun (Male - Technical Interviewer) and Ananya (Female - Professional Interviewer) with 16:9 video.\n"
        f"- Mandatory Preflight: Camera permissions, live stream verification, lighting & face framing checks.\n"
        f"- Triple Pillar Feedback: Answer Quality (factual correctness & gap analysis), Speech Fluency (WPM & fillers), Camera Delivery (100% on-device presence & gaze).\n"
        f"- Weakness DNA: Longitudinal tracking of recurring communication habits and severity.\n"
        f"- Key Frameworks: PREP (Point, Reason, Example, Point) and STAR (Situation, Task, Action, Result).\n\n"
        f"Matched FAQ Snippet:\n{matched_faq or 'None'}\n\n"
        f"Instructions:\n"
        f"1. Answer concisely, warmly, and helpfully in 2-4 sentences or clear bullet points.\n"
        f"2. Always remain grounded in the official MaskOff AI knowledge base above.\n"
        f"3. Never invent features that MaskOff AI does not have.\n"
        f"4. If asked about general communication or speaking tips, provide actionable advice using proven methods like PREP or STAR."
    )

    reply_text = None

    # Try LLM provider if available
    try:
        if hasattr(provider, '_call_groq'):
            groq_messages = [{"role": "system", "content": system_prompt}]
            for msg in history[-4:]:
                groq_messages.append({
                    "role": "user" if msg.get("sender") == "user" else "assistant",
                    "content": msg.get("content", "")
                })
            groq_messages.append({"role": "user", "content": user_message})
            reply_text = provider._call_groq(system_prompt, groq_messages)
        elif hasattr(provider, '_call_gemini'):
            gemini_contents = []
            for msg in history[-4:]:
                gemini_contents.append({
                    "role": "user" if msg.get("sender") == "user" else "model",
                    "parts": [{"text": msg.get("content", "")}]
                })
            gemini_contents.append({
                "role": "user",
                "parts": [{"text": user_message}]
            })
            reply_text = provider._call_gemini(system_prompt, gemini_contents)
    except Exception as e:
        logger.warning(f"Chatbot LLM inference failed, falling back to knowledge base: {e}")

    # Fallback to direct knowledge base reply
    if not reply_text:
        if matched_faq:
            reply_text = matched_faq
        else:
            reply_text = (
                f"MaskOff AI helps you express what you already know under high-pressure situations! "
                f"You can practice with our 16:9 video interviewers Arjun (Technical) and Ananya (Professional), "
                f"receive honest answer evaluations, track verbal fillers, and build your Weakness DNA profile. "
                f"How can I help you prepare today?"
            )

    # Dynamic suggestions based on context
    suggestions = [s for s in DEFAULT_SUGGESTIONS if s.lower() not in user_message.lower()][:3]

    return jsonify({
        'reply': reply_text.strip(),
        'suggestions': suggestions
    }), 200

