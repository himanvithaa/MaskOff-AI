"""
MaskOff AI - Central Project Knowledge Base
Structured, authoritative information about the MaskOff AI platform,
architecture, features, workflows, and core communication frameworks.
Used by the MaskOff Assistant Chatbot to provide grounded, accurate replies.
"""

PROJECT_KNOWLEDGE = {
    "product_name": "MaskOff AI",
    "tagline": "Practise Being Yourself in High-Pressure Situations.",
    "core_philosophy": "MaskOff AI doesn't teach you what to think. It helps you express what you already know, think and feel.",
    "domain": "Artificial Intelligence / Machine Learning + Human Communication Behavior",
    "mission": (
        "MaskOff AI is an AI-powered communication training platform that helps students, professionals, "
        "and leaders articulate their reasoning, defend their ideas against rigorous counter-questioning, "
        "and master verbal and physical delivery under high-pressure scenarios."
    ),
    "target_audience": [
        "Students preparing for campus placements, technical interviews, and thesis viva defenses.",
        "Software engineers and tech leads preparing for system design and architecture cross-examinations.",
        "Founders pitching to venture capitalists and angel investors.",
        "Professionals navigating salary negotiations, difficult stakeholder conversations, and executive presentations.",
        "Anyone suffering from communication anxiety who wants a private, judgment-free arena to build poise."
    ],
    "interviewers": {
        "male": {
            "name": "Arjun",
            "gender": "Male",
            "role": "Technical Interviewer",
            "video_asset": "/interviewers/male-interviewer.mp4",
            "focus": "Evaluates technical depth, logic, problem-solving, and architectural trade-offs.",
            "description": "Experienced technical interviewer who evaluates technical knowledge, reasoning and problem-solving skills."
        },
        "female": {
            "name": "Ananya",
            "gender": "Female",
            "role": "Professional Interviewer",
            "video_asset": "/interviewers/female-interviewer.mp4",
            "focus": "Evaluates communication clarity, structured thinking, behavioral ownership, and practical poise.",
            "description": "Professional interviewer who evaluates communication, conceptual understanding and practical knowledge."
        }
    },
    "arenas": [
        {"id": "academic", "name": "Academic", "focus": "Viva examinations, project defenses, research presentations, and conceptual explanations."},
        {"id": "professional", "name": "Professional", "focus": "System design cross-examinations, behavioral HR interviews, salary negotiations, and standup updates."},
        {"id": "public_speaking", "name": "Public Speaking", "focus": "Keynote introductions, handling hostile Q&A from audiences, and impromptu speaking."},
        {"id": "social", "name": "Social", "focus": "Boundary setting, conflict resolution, assertiveness, and honest disagreement without antagonism."},
        {"id": "leadership", "name": "Leadership", "focus": "Team realignment, difficult feedback delivery, crisis communication, and stakeholder buy-in."},
        {"id": "critical_thinking", "name": "Critical Thinking", "focus": "Debates against Devil's Advocates, defending counterintuitive theses, and stress-testing logic."}
    ],
    "key_features": {
        "16_9_video_player": "High-fidelity rectangular 16:9 video player featuring real human interviewer video synchronizing introduction, speaking, listening, thinking, and closing states, with native video audio completely muted.",
        "live_captions": "Dedicated real-time caption area placed directly below the 16:9 interviewer video with word-level synchronization, highlighting words as spoken, and an ON/OFF toggle.",
        "accent_selection": "Interviewer voice accents selectable across American Accent (en-US), Polish Accent (en-PL / Polish-accented English), and African Accent (Nigerian en-NG & South African en-ZA English).",
        "camera_closed_detection": "Continuous 15-state camera lifecycle monitor that instantly detects when the camera is turned off, disconnected, or shuttered, pausing the interview until re-verified.",
        "mandatory_camera_preflight": "Mandatory preflight screen ensuring camera permission, active video stream, face presence, lighting checks, and distance verification before interview access.",
        "answer_evaluation": "Strict conceptual correctness grading (correct, incorrect, partially correct) that pinpoints factual gaps and challenges candidates with dynamic follow-ups.",
        "speech_fluency": "Calculates words-per-minute (WPM), hesitation pause cadence, and detects verbal fillers (um, uh, like, basically, you know).",
        "physical_delivery": "100% on-device geometric facial presence tracking evaluating face visibility %, direct camera gaze, and head stability without pseudo-scientific emotion guessing.",
        "weakness_dna": "Longitudinal diagnostic profile tracking recurring speech and reasoning weaknesses, calculating recurrence count and severity over time.",
        "repeat_and_compare": "Side-by-side delta visualization allowing candidates to immediately re-attempt questions and measure concrete improvements.",
        "mindspace": "Cognitive reframing studio helping users dismantle high-pressure cognitive distortions and ground themselves before or after tough interactions."
    },
    "technical_stack": {
        "frontend": "React 18, Vite, Tailwind CSS, Lucide React, Framer Motion, Recharts.",
        "backend": "Python Flask REST API, SQLAlchemy ORM, SQLite database, Flask-JWT-Extended.",
        "ai_engine": "Multi-provider architecture supporting Groq LPU (Llama 3.3 70B, Llama 3.1 8B), Google Gemini 1.5 Flash, OpenAI GPT-4o-mini, and MockAIProvider.",
        "speech": "Browser Web Speech API (SpeechSynthesis with gender pitch tuning & SpeechRecognition) + Web Audio WebM upload.",
        "privacy": "Zero camera video leaves the browser. Facial metrics are calculated on-device using HTML5 Canvas pixel sampling and bounding box analysis."
    },
    "communication_frameworks": {
        "prep_framework": "Point, Reason, Example, Point. State your core conclusion first, substantiate with a logical reason, illustrate with a concrete example, and restate your conclusion.",
        "star_method": "Situation, Task, Action, Result. Essential for behavioral questions to highlight individual ownership and measurable impact.",
        "pyramid_principle": "Start with the governing thought (the answer), then group supporting logic into mutually exclusive, collectively exhaustive categories.",
        "handling_counterarguments": "Acknowledge the interviewer's premise, state boundary assumptions, explain trade-offs transparently, and demonstrate situational adaptability."
    }
}

FAQS = [
    {
        "keywords": ["what is maskoff", "about", "who made", "purpose", "vision"],
        "answer": (
            "MaskOff AI is an AI-powered communication training platform designed to help you express what you already know under high pressure. "
            "Unlike traditional mock interviews that only ask generic questions, MaskOff AI features 16:9 real video interviewers (Arjun & Ananya), "
            "evaluates conceptual correctness honestly, detects verbal fillers, measures physical camera delivery, and synthesizes your Weakness DNA."
        )
    },
    {
        "keywords": ["interviewer", "arjun", "ananya", "video", "gender", "who is the interviewer"],
        "answer": (
            "MaskOff AI features two realistic 16:9 video interviewers:\n"
            "• Arjun (Technical Interviewer): Focuses on technical logic, architectural depth, and problem-solving.\n"
            "• Ananya (Professional Interviewer): Focuses on communication poise, structured thinking, and practical execution.\n"
            "You can switch between Arjun and Ananya anytime during your session or in the scenario calibration modal."
        )
    },
    {
        "keywords": ["accent", "accents", "polish", "african", "american", "voice accent"],
        "answer": (
            "MaskOff AI supports three distinct interviewer voice accents:\n"
            "1. American Accent: General American English (en-US)\n"
            "2. Polish Accent: English with a distinctive Polish accent (en-PL)\n"
            "3. African Accent: Expressive African English (Nigerian en-NG & South African en-ZA)\n"
            "You can preview and select your preferred accent during preflight or directly above the video player!"
        )
    },
    {
        "keywords": ["caption", "captions", "subtitles", "live captions"],
        "answer": (
            "Live Captions appear directly below the 16:9 interviewer video, synchronizing in real time with the interviewer's speech. "
            "Words are illuminated progressively as they are spoken, matching the exact AI-generated question with an ON/OFF toggle."
        )
    },
    {
        "keywords": ["camera", "permission", "preflight", "webcam", "privacy", "video stream"],
        "answer": (
            "Camera access is mandatory before entering any interview simulation. "
            "The Camera Preflight screen ensures your camera is active, lighting is sufficient, and your face is well-framed. "
            "For strict privacy, 100% of video processing happens locally in your browser using HTML5 Canvas. No video is ever sent to cloud servers or LLMs."
        )
    },
    {
        "keywords": ["weakness dna", "profile", "recurring", "dna", "strengths"],
        "answer": (
            "Weakness DNA is MaskOff AI's persistent diagnostic engine. "
            "As you complete practice sessions, it tracks recurring communication habits (such as filler word frequency, hesitation under counterarguments, "
            "or missing concrete metrics) and ranks their severity to guide your daily missions."
        )
    },
    {
        "keywords": ["filler", "words", "um", "uh", "fluency", "speech"],
        "answer": (
            "MaskOff AI analyzes verbal fillers like 'um', 'uh', 'like', 'basically', and 'you know', highlighting them in your transcript. "
            "It also calculates your speaking pace in Words Per Minute (WPM), with 120-150 WPM being the ideal conversational rate."
        )
    },
    {
        "keywords": ["prep", "star", "framework", "how to answer", "structure", "tips"],
        "answer": (
            "For quick, confident answers under pressure, use the PREP framework:\n"
            "1. Point: State your direct conclusion immediately.\n"
            "2. Reason: Provide the underlying principle or rationale.\n"
            "3. Example: Give a concrete real-world metric or case study.\n"
            "4. Point: Reiterate your core stance with confidence.\n\n"
            "For past experience questions, use STAR (Situation, Task, Action, Result)."
        )
    },
    {
        "keywords": ["how to use", "start", "steps", "how do i practice"],
        "answer": (
            "Getting started with MaskOff AI is simple:\n"
            "1. Navigate to 'Arenas' and pick a communication scenario.\n"
            "2. Choose your interviewer (Arjun or Ananya) and set pressure (1-5).\n"
            "3. Complete the Camera Preflight to verify webcam and face framing.\n"
            "4. Start speaking into your mic or type responses.\n"
            "5. Answer dynamic challenges and review your multi-pillar feedback report!"
        )
    },
    {
        "keywords": ["model", "llm", "ai provider", "groq", "gemini", "tech stack"],
        "answer": (
            "MaskOff AI utilizes a modular AI provider architecture supporting Groq LPU (Llama 3.3 70B & Llama 3.1 8B), "
            "Google Gemini 1.5 Flash, OpenAI GPT-4o-mini, and a deterministic offline intelligence engine. "
            "The backend is built with Flask, SQLite, and SQLAlchemy, while the frontend runs on React 18 and Tailwind CSS."
        )
    }
]

def search_knowledge_base(query: str) -> dict:
    """
    Search the knowledge base for relevant facts and matched FAQs.
    """
    q = query.lower()
    matched_faq = None
    max_matches = 0

    for faq in FAQS:
        matches = sum(1 for kw in faq["keywords"] if kw in q)
        if matches > max_matches:
            max_matches = matches
            matched_faq = faq

    return {
        "matched_faq": matched_faq["answer"] if matched_faq and max_matches > 0 else None,
        "product_info": PROJECT_KNOWLEDGE
    }

