"""
MaskOff AI - Database Seeder
Populates initial rich scenarios across all 6 categories and the 7 gamified MaskOff missions.
"""

from app.models import db, Scenario, Mission

SCENARIOS_DATA = [
    # --- Category 1: Academic Simulator ---
    {
        "title": "College Viva Voce Defense",
        "slug": "college-viva-voce",
        "category": "academic",
        "description": "Defend your undergraduate engineering capstone project before an exacting faculty jury.",
        "context_background": "You are presenting the architecture of your distributed cache. The professor questions why you did not use Redis.",
        "difficulty": "Intermediate",
        "default_persona": "Vikram – Strict Technical Interviewer",
        "suggested_pressure_level": 3,
        "initial_prompt": "Welcome candidate. Let's get straight to the architecture. In section 3 of your report, you claim your cache handles network partitions gracefully. Explain precisely what protocol guarantees this, and what the latency trade-off is.",
        "icon_name": "GraduationCap",
        "tags": ["Engineering", "Architecture", "Viva", "Technical Defense"]
    },
    {
        "title": "Unexpected Professor Question",
        "slug": "unexpected-professor-question",
        "category": "academic",
        "description": "Handle sudden curveball questions in lecture or seminar when the professor points directly at you.",
        "context_background": "During an advanced algorithms lecture, the professor suddenly asks you to solve an edge-case complexity dilemma.",
        "difficulty": "Advanced",
        "default_persona": "Vikram – Strict Technical Interviewer",
        "suggested_pressure_level": 4,
        "initial_prompt": "You sitting in the third row. If we introduce negative weight cycles into our directed graph, why does Dijkstra's algorithm fail instead of terminating with a sub-optimal path?",
        "icon_name": "BookOpen",
        "tags": ["Algorithms", "Spontaneity", "Classroom"]
    },
    {
        "title": "Technical Project Explanation",
        "slug": "technical-project-explanation",
        "category": "academic",
        "description": "Explain a complex AI or software project to an academic reviewer looking for fundamental rigor.",
        "context_background": "You are explaining your deep learning pipeline for computer vision.",
        "difficulty": "Intermediate",
        "default_persona": "Vikram – Strict Technical Interviewer",
        "suggested_pressure_level": 2,
        "initial_prompt": "Walk me through how your training pipeline prevents data leakage between your cross-validation folds. What specific data transformations happen before splitting?",
        "icon_name": "Cpu",
        "tags": ["Machine Learning", "Data Pipeline", "Defense"]
    },

    # --- Category 2: Professional Simulator ---
    {
        "title": "Defending Project Decisions Under Manager Pushback",
        "slug": "defending-project-decisions",
        "category": "professional",
        "description": "Explain why you chose a specific technology or design pattern despite skepticism from leadership.",
        "context_background": "Your engineering director wants to know why you adopted microservices rather than a modular monolith for the new customer portal.",
        "difficulty": "Advanced",
        "default_persona": "Ananya – Professional HR Interviewer",
        "suggested_pressure_level": 3,
        "initial_prompt": "I looked over your design proposal. Moving to microservices introduces operational overhead, network latency, and multi-service tracing nightmares. Why shouldn't we simply keep this as a clean modular monolith?",
        "icon_name": "Briefcase",
        "tags": ["Workplace", "Architecture", "Negotiation", "Leadership"]
    },
    {
        "title": "Handling Manager Criticism",
        "slug": "handling-manager-criticism",
        "category": "professional",
        "description": "Respond constructively when your performance or code quality is criticized in a 1-on-1 meeting.",
        "context_background": "Your manager flags that a recent sprint delivery had unexpected bugs in staging.",
        "difficulty": "Intermediate",
        "default_persona": "Ananya – Professional HR Interviewer",
        "suggested_pressure_level": 3,
        "initial_prompt": "We had two critical regressions in staging this week from your feature branch. It caused a block for the QA team. What happened, and how do we ensure this doesn't repeat?",
        "icon_name": "AlertTriangle",
        "tags": ["Feedback", "Accountability", "De-escalation"]
    },
    {
        "title": "Explaining Project Delays",
        "slug": "explaining-project-delays",
        "category": "professional",
        "description": "Deliver bad news about missed deadlines with composure, clarity, and an actionable recovery plan.",
        "context_background": "A third-party payment integration is broken, threatening the upcoming production launch date.",
        "difficulty": "Advanced",
        "default_persona": "Ananya – Professional HR Interviewer",
        "suggested_pressure_level": 4,
        "initial_prompt": "The client demo is in 48 hours, and I'm hearing rumors the payment workflow isn't ready. What is the real status, and what's your plan?",
        "icon_name": "Clock",
        "tags": ["Crisis", "Transparency", "Stakeholder Management"]
    },

    # --- Category 3: Public Speaking Simulator ---
    {
        "title": "Keynote Presentation Q&A",
        "slug": "keynote-presentation-qa",
        "category": "public_speaking",
        "description": "Field spontaneous, challenging inquiries from an audience after pitching an innovative product.",
        "context_background": "You just finished presenting an AI productivity tool to an audience of 300 tech enthusiasts and founders.",
        "difficulty": "Intermediate",
        "default_persona": "Arjun – Friendly Interviewer",
        "suggested_pressure_level": 2,
        "initial_prompt": "Thank you for the inspiring demo! But frankly, how is this different from existing tools already built into Google Workspace or Microsoft Copilot? Why would a company switch to yours?",
        "icon_name": "Mic",
        "tags": ["Keynote", "Audience Q&A", "Differentiation"]
    },
    {
        "title": "Handling Hostile Audience Criticism",
        "slug": "handling-audience-criticism",
        "category": "public_speaking",
        "description": "De-escalate an aggressive or confrontational audience question without losing composure or authority.",
        "context_background": "An attendee claims your statistics are misleading during an open debate forum.",
        "difficulty": "Advanced",
        "default_persona": "Rahul – Critical Thinking Interviewer",
        "suggested_pressure_level": 4,
        "initial_prompt": "The numbers you cited in slide 6 are completely cherry-picked from a single unvetted blog post. Aren't you misleading this audience to make your thesis sound plausible?",
        "icon_name": "Volume2",
        "tags": ["Debate", "Composure", "Hostile Q&A"]
    },

    # --- Category 4: Social Interaction Simulator ---
    {
        "title": "Expressing Respectful Disagreement",
        "slug": "expressing-respectful-disagreement",
        "category": "social",
        "description": "Stand your ground and express an opposing perspective among peers without causing social hostility.",
        "context_background": "In a social gathering or study circle, friends are dismissing an important viewpoint you care about.",
        "difficulty": "Intermediate",
        "default_persona": "Arjun – Friendly Interviewer",
        "suggested_pressure_level": 2,
        "initial_prompt": "Honestly, I think all this talk about privacy and data tracking is overblown. If you've got nothing to hide, who cares who sees your data? Everyone agrees on this.",
        "icon_name": "MessageSquare",
        "tags": ["Assertiveness", "Social", "Empathy"]
    },
    {
        "title": "Handling Uncomfortable Personal Questions",
        "slug": "handling-uncomfortable-questions",
        "category": "social",
        "description": "Set clear, polite conversational boundaries when someone asks intrusive or inappropriate questions.",
        "context_background": "A distant acquaintance or intrusive coworker asks pointed personal questions about your salary and personal life.",
        "difficulty": "Beginner",
        "default_persona": "Arjun – Friendly Interviewer",
        "suggested_pressure_level": 1,
        "initial_prompt": "Hey, I heard your department just had raises. How much are you making right now? And why aren't you looking for a higher-paying job elsewhere?",
        "icon_name": "ShieldAlert",
        "tags": ["Boundaries", "Graceful Pivot", "Diplomacy"]
    },

    # --- Category 5: Leadership Simulator ---
    {
        "title": "Managing Intense Team Conflicts",
        "slug": "managing-team-conflicts",
        "category": "leadership",
        "description": "Mediate a heated disagreement between two talented team members without taking arbitrary sides.",
        "context_background": "Your senior backend engineer and senior frontend engineer refuse to communicate after an API design dispute.",
        "difficulty": "Advanced",
        "default_persona": "Ananya – Professional HR Interviewer",
        "suggested_pressure_level": 3,
        "initial_prompt": "I'm sick of this. They keep changing the JSON schemas without documentation, and it breaks our release builds every Thursday. Either they stick to the contract or I'm not touching their tickets.",
        "icon_name": "Users",
        "tags": ["Mediation", "Conflict Resolution", "Leadership"]
    },
    {
        "title": "Delivering Difficult Critical Feedback",
        "slug": "delivering-critical-feedback",
        "category": "leadership",
        "description": "Guide an underperforming but well-intentioned team member to improve their standards.",
        "context_background": "A direct report has missed several deliverables and shows signs of disengagement.",
        "difficulty": "Intermediate",
        "default_persona": "Meera – Supportive Mentor",
        "suggested_pressure_level": 2,
        "initial_prompt": "You asked to talk to me about my sprint review? I feel like I've been doing everything asked of me, so I'm not sure why my performance was flagged.",
        "icon_name": "HeartHandshake",
        "tags": ["1-on-1", "Empathy", "Radical Candor"]
    },

    # --- Category 6: Critical Thinking Simulator ---
    {
        "title": "The Devil's Advocate Sparring Arena",
        "slug": "devils-advocate-arena",
        "category": "critical_thinking",
        "description": "Defend a controversial thesis against an AI whose only purpose is to poke holes in your logic.",
        "context_background": "You are defending the position that artificial intelligence will create more human jobs than it destroys.",
        "difficulty": "Advanced",
        "default_persona": "Rahul – Critical Thinking Interviewer",
        "suggested_pressure_level": 5,
        "initial_prompt": "You claim AI will expand net employment. But historical revolutions replaced physical labor with cognitive labor. When cognition itself is commoditized, where does human comparative advantage go?",
        "icon_name": "Flame",
        "tags": ["Debate", "First Principles", "Logic", "Dialectic"]
    },
    {
        "title": "Comeback Challenge: Handling The Unknown",
        "slug": "comeback-challenge-unknown",
        "category": "critical_thinking",
        "description": "Practise responding gracefully when asked a question you do not know the answer to, without bluffing.",
        "context_background": "An interviewer asks you an obscure architectural standard you have never encountered before.",
        "difficulty": "Intermediate",
        "default_persona": "Vikram – Strict Technical Interviewer",
        "suggested_pressure_level": 3,
        "initial_prompt": "Can you explain how the Raft consensus algorithm handles joint consensus during dynamic cluster membership changes?",
        "icon_name": "Sparkles",
        "tags": ["Comeback", "Grace Under Fire", "Honesty", "Reasoning"]
    }
]

MISSIONS_DATA = [
    {
        "code": "M1_SPEAK_UP",
        "title": "Speak Up",
        "subtitle": "Express an opinion in a group discussion",
        "category": "Social & Team",
        "objective": "Interrupt the flow politely, articulate a fresh perspective, and assert your presence in a team meeting.",
        "scenario_prompt": "The team is about to agree on rushing the feature launch without testing. Unmute yourself and voice your reservation constructively.",
        "ai_persona": "Arjun – Friendly Interviewer",
        "difficulty": "Beginner",
        "evaluation_criteria": ["Assertiveness", "Constructive Tone", "Directness"],
        "xp_reward": 100,
        "badge_name": "Unmuted Voice",
        "badge_icon": "Volume2"
    },
    {
        "code": "M2_DEFEND_IDEA",
        "title": "Defend Your Idea",
        "subtitle": "Justify a decision under criticism",
        "category": "Workplace",
        "objective": "Stand by your recommendation when challenged by a senior stakeholder, providing concrete reasoning without becoming defensive.",
        "scenario_prompt": "Your manager says your design choice is too slow and impractical. Defend why your approach is optimal for long-term scalability.",
        "ai_persona": "Ananya – Professional HR Interviewer",
        "difficulty": "Intermediate",
        "evaluation_criteria": ["Logical Justification", "Emotional Poise", "Evidence Citations"],
        "xp_reward": 150,
        "badge_name": "Iron Conviction",
        "badge_icon": "Shield"
    },
    {
        "code": "M3_THINK_ON_FEET",
        "title": "Think on Your Feet",
        "subtitle": "Answer an unexpected question",
        "category": "Academic",
        "objective": "When hit with a surprise question outside your prepared notes, organize your response into a coherent answer within 5 seconds.",
        "scenario_prompt": "A professor suddenly points at you and asks: 'Why can't we use binary search on a linked list?' Formulate your answer concisely.",
        "ai_persona": "Vikram – Strict Technical Interviewer",
        "difficulty": "Advanced",
        "evaluation_criteria": ["Rapid Structuring", "Conceptual Accuracy", "Absence of Fillers"],
        "xp_reward": 200,
        "badge_name": "Quick Reflexes",
        "badge_icon": "Zap"
    },
    {
        "code": "M4_SAY_NO_POLITELY",
        "title": "Say No Politely",
        "subtitle": "Decline an unreasonable request",
        "category": "Workplace",
        "objective": "Decline a request for unpaid weekend overtime or impossible scope expansion while preserving the working relationship.",
        "scenario_prompt": "A project manager asks you to take on two additional modules over the weekend for Monday's client meeting. Decline diplomatically with alternative options.",
        "ai_persona": "Ananya – Professional HR Interviewer",
        "difficulty": "Intermediate",
        "evaluation_criteria": ["Clear Boundaries", "Diplomatic Phrasing", "Alternative Solutions"],
        "xp_reward": 150,
        "badge_name": "Boundary Master",
        "badge_icon": "Hand"
    },
    {
        "code": "M5_LEAD_THE_TEAM",
        "title": "Lead the Team",
        "subtitle": "Resolve a disagreement",
        "category": "Leadership",
        "objective": "Acknowledge both perspectives in a conflict, find common ground, and align the group on a single actionable consensus.",
        "scenario_prompt": "Two developers are in an impassioned argument about React vs Vue. Step in as team lead and guide them to an objective decision matrix.",
        "ai_persona": "Meera – Supportive Mentor",
        "difficulty": "Intermediate",
        "evaluation_criteria": ["Active Listening", "Objective Synthesis", "Decisiveness"],
        "xp_reward": 180,
        "badge_name": "Consensus Builder",
        "badge_icon": "Award"
    },
    {
        "code": "M6_EXPLAIN_SIMPLY",
        "title": "Explain Simply",
        "subtitle": "Explain a complex concept to a beginner",
        "category": "Public Speaking",
        "objective": "Deconstruct a complex technical concept (e.g. recursion, blockchain, or neural networks) using clear everyday analogies with zero buzzwords.",
        "scenario_prompt": "A curious high school student asks: 'What actually happens when you type google.com into your browser?' Explain it clearly in 60 seconds.",
        "ai_persona": "Arjun – Friendly Interviewer",
        "difficulty": "Beginner",
        "evaluation_criteria": ["Metaphor Clarity", "Jargon Elimination", "Engagement"],
        "xp_reward": 120,
        "badge_name": "Master Simplifier",
        "badge_icon": "Lightbulb"
    },
    {
        "code": "M7_HANDLE_PRESSURE",
        "title": "Handle the Pressure",
        "subtitle": "Respond to challenging questions",
        "category": "Critical Thinking",
        "objective": "Survive 3 rounds of escalating Devil's Advocate counter-arguments without losing logical consistency or composure.",
        "scenario_prompt": "Enter the debate arena where the AI attacks your fundamental assumptions about technology, society, and career ethics.",
        "ai_persona": "Rahul – Critical Thinking Interviewer",
        "difficulty": "Advanced",
        "evaluation_criteria": ["Composure Under Fire", "Consistency", "Reframing Counterarguments"],
        "xp_reward": 250,
        "badge_name": "Pressure Proof",
        "badge_icon": "Flame"
    }
]

def seed_database():
    """Seeds scenarios and missions into the database if they don't already exist, and refreshes personas."""
    # Seed or update Scenarios
    for item in SCENARIOS_DATA:
        existing = Scenario.query.filter_by(slug=item["slug"]).first()
        if not existing:
            sc = Scenario(**item)
            db.session.add(sc)
        else:
            existing.default_persona = item["default_persona"]
            existing.title = item["title"]
            existing.description = item["description"]
            existing.initial_prompt = item["initial_prompt"]

    # Seed or update Missions
    for item in MISSIONS_DATA:
        existing = Mission.query.filter_by(code=item["code"]).first()
        if not existing:
            m = Mission(**item)
            db.session.add(m)
        else:
            existing.ai_persona = item["ai_persona"]

    db.session.commit()

