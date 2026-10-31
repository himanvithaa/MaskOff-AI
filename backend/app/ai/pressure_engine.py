"""
MaskOff AI - Pressure Injection Engine
Dynamically adjusts question difficulty, injects real-time conversational pressure,
detects ambiguities in the user's previous answer, and directs follow-ups.
"""

PRESSURE_LEVELS = {
    1: {
        "name": "Level 1: Friendly Exploration",
        "description": "Supportive dialogue, introductory clarity, foundational exploration without confrontational pushback."
    },
    2: {
        "name": "Level 2: Detailed Follow-ups",
        "description": "Constructive inquiry requesting specific examples, definitions, and logical links."
    },
    3: {
        "name": "Level 3: Critical Questioning",
        "description": "Skeptical inspection of assumptions, identifying weak premises, requesting proof and trade-offs."
    },
    4: {
        "name": "Level 4: Unexpected Challenges",
        "description": "Counter-scenarios, edge-case pressure, sudden shift in perspective, testing spontaneous recovery."
    },
    5: {
        "name": "Level 5: Advanced Argument Defence",
        "description": "Razor-sharp debate pressure, relentless stress-testing of logical consistency and conviction."
    }
}

def build_pressure_prompt_modifier(level, conversation_turn, previous_user_answer=""):
    """
    Returns instructions to inject into the AI's prompt for the given pressure level.
    """
    base_instructions = []
    
    if level == 1:
        base_instructions.append(
            "Maintain a welcoming, collaborative atmosphere. Acknowledge what was said and ask an inviting follow-up."
        )
    elif level == 2:
        base_instructions.append(
            "Dig deeper into the details. If the user used high-level terms, ask them to describe the actual mechanism or process."
        )
    elif level == 3:
        base_instructions.append(
            "Actively question the user's premise. Point out where their statement could be challenged in a real-world scenario. "
            "Ask: 'What data or trade-off backs that up?'"
        )
    elif level == 4:
        base_instructions.append(
            "Introduce an unexpected wrench or contrasting circumstance. "
            "For example, a sudden constraint, an opposing stakeholder demand, or a counter-intuitive failure mode. "
            "See how rapidly they adapt without getting defensive."
        )
    elif level == 5:
        base_instructions.append(
            "Apply high-pressure intellectual rigor. Do not let vague buzzwords or evasive answers pass. "
            "Directly contrast their current claim with a potential contradiction or extreme trade-off. "
            "Challenge them to stand their ground with bulletproof reasoning, but keep the language professional and dignified."
        )
        
    # Analyze quick characteristics of previous answer to make the follow-up reactive
    if previous_user_answer:
        cleaned = previous_user_answer.strip().lower()
        if len(cleaned.split()) < 15:
            base_instructions.append(
                "NOTE: The user's previous response was brief. Directly ask them to elaborate on the 'how' and 'why', not just state conclusions."
            )
        if any(w in cleaned for w in ['easy', 'good', 'better', 'fast', 'nice', 'simple']) and not any(w in cleaned for w in ['because', 'benchmark', 'latency', 'specifically', 'for instance']):
            base_instructions.append(
                "NOTE: The user made a generic quality claim (e.g. 'it works better' / 'it is easy'). "
                "Explicitly challenge this generality by asking what specific technical or structural factor makes it so."
            )
        if any(w in cleaned for w in ['i think', 'maybe', 'not sure', 'i guess', 'probably']):
            base_instructions.append(
                "NOTE: The user expressed uncertainty or hesitation. Acknowledge their honesty, but encourage them to reason through the first principles of what they do know."
            )
            
    return " ".join(base_instructions)
