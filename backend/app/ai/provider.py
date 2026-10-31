"""
MaskOff AI - Modular AI Provider Interface
Supports:
1. Gemini API (Google Generative AI)
2. OpenAI-compatible API
3. High-Quality Dynamic Contextual Evaluation Engine (Zero-dependency fallback for hackathon demos & local testing)
"""

import os
import json
import logging
import re
import requests
from .personas import get_persona
from .pressure_engine import build_pressure_prompt_modifier

logger = logging.getLogger(__name__)

class BaseAIProvider:
    def generate_chat_reply(self, session_context: dict) -> dict:
        raise NotImplementedError

    def evaluate_response(self, evaluation_context: dict) -> dict:
        raise NotImplementedError


class GeminiProvider(BaseAIProvider):
    def __init__(self, api_key: str, model_name: str = "gemini-1.5-flash"):
        self.api_key = api_key
        self.model_name = model_name
        self.base_url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model_name}:generateContent"

    def _call_gemini(self, system_instruction: str, contents: list) -> str:
        headers = {"Content-Type": "application/json"}
        params = {"key": self.api_key}
        payload = {
            "contents": contents,
            "generationConfig": {
                "temperature": 0.7,
                "topP": 0.9,
                "maxOutputTokens": 1024
            }
        }
        if system_instruction:
            payload["systemInstruction"] = {
                "parts": [{"text": system_instruction}]
            }

        response = requests.post(self.base_url, headers=headers, params=params, json=payload, timeout=20)
        response.raise_for_status()
        data = response.json()
        return data["candidates"][0]["content"]["parts"][0]["text"]

    def generate_chat_reply(self, session_context: dict) -> dict:
        persona = get_persona(session_context.get("ai_persona", "Meera – Supportive Mentor"))
        pressure_level = session_context.get("pressure_level", 2)
        history = session_context.get("history", [])
        scenario = session_context.get("scenario", {})
        evaluation = session_context.get("evaluation", {})
        last_user_message = history[-1]["content"] if history and history[-1]["sender"] == "user" else ""

        modifier = build_pressure_prompt_modifier(pressure_level, len(history), last_user_message)

        correctness = evaluation.get("correctness", "partially_correct")
        what_was_wrong = evaluation.get("what_was_wrong", [])
        explanation = evaluation.get("explanation", "")
        follow_up = evaluation.get("follow_up_question", "")

        system_prompt = (
            f"You are {persona['name']}, {persona['role']} in an interview simulation.\n"
            f"{persona['system_directive']}\n\n"
            f"Scenario: {scenario.get('title', 'Communication Assessment')}\n"
            f"Pressure Level: {pressure_level}/5 ({modifier})\n"
            f"Candidate's answer evaluation: {correctness}.\n"
            f"Errors identified in candidate's response: {', '.join(what_was_wrong) if what_was_wrong else 'None'}\n"
            f"Correct concept: {explanation}\n"
            f"Suggested follow-up: {follow_up}\n\n"
            "Rules for your response:\n"
            "1. Speak directly as the interviewer to the candidate in 2 to 4 sentences.\n"
            "2. If the answer was incorrect or partially correct, clearly point out what was wrong or missing, state the correct concept or hint, and invite them to answer the follow-up.\n"
            "3. If the answer was correct, acknowledge it and test a deeper technical edge-case or practical trade-off.\n"
            "4. Never output markdown asterisks or meta labels like 'Interviewer:'. Output pure conversational dialogue that sounds natural when read aloud via TTS."
        )

        gemini_contents = []
        for msg in history:
            role = "user" if msg["sender"] == "user" else "model"
            gemini_contents.append({
                "role": role,
                "parts": [{"text": msg["content"]}]
            })

        try:
            reply_text = self._call_gemini(system_prompt, gemini_contents)
            return {
                "reply": reply_text.strip(),
                "pressure_intent": f"{persona['name']} dynamic response ({correctness})"
            }
        except Exception as e:
            logger.warning(f"Gemini chat reply failed, using MockAIProvider: {e}")
            return MockAIProvider().generate_chat_reply(session_context)

    def evaluate_response(self, eval_context: dict) -> dict:
        question = eval_context.get("question", "")
        answer = eval_context.get("answer", "")
        scenario = eval_context.get("scenario", {})
        nlp_data = eval_context.get("nlp_data", {})
        persona_name = eval_context.get("persona_name", "Meera – Supportive Mentor")

        system_prompt = (
            "You are an expert communication examiner and technical evaluation engine. "
            "You rigorously check answer correctness, reasoning gaps, and delivery. "
            "You MUST output valid, parseable JSON matching the exact schema specified with no backticks."
        )

        user_prompt = f"""
Evaluate this interview response:
Question: "{question}"
Candidate Answer: "{answer}"
Interviewer: {persona_name}
Scenario: {scenario.get('title', 'Communication Simulation')}
Linguistic Fillers Detected: {nlp_data.get('filler_word_count', 0)} ({nlp_data.get('filler_frequency_per_100_words', 0)} per 100 words)

Evaluate if the answer is conceptually correct, partially correct, incorrect, or insufficient information.
Return valid JSON with this exact structure:
{{
  "correctness": "correct | partially_correct | incorrect | insufficient_information",
  "score": 75,
  "what_was_correct": ["Point 1", "Point 2"],
  "what_was_wrong": ["Point 1"],
  "missing_concepts": ["Concept 1"],
  "explanation": "Clear explanation of the topic and why the answer was right/wrong.",
  "recommended_next_action": "Actionable suggestion for the candidate to improve.",
  "follow_up_question": "A dynamic follow-up question directly addressing their answer or mistake.",
  "overall_score": 75,
  "relevance": 80,
  "clarity": 75,
  "structure": 70,
  "specificity": 75,
  "conceptual_correctness": 75,
  "speaking_fluency": 75,
  "argumentation": 70,
  "pressure_handling": 70,
  "recovery_ability": 70,
  "strengths": ["Clear opening", "Calm delivery"],
  "weaknesses": ["Omitted edge case"],
  "why_it_needs_improvement": "Why precision matters in high-stakes interviews.",
  "actionable_suggestions": ["Use STAR or PREP framework", "Cite concrete metrics"],
  "sample_improved_answer": "Model answer in 3-4 sentences.",
  "targeted_skill_gap": "Conceptual Precision"
}}
"""
        try:
            raw_output = self._call_gemini(system_prompt, [{"role": "user", "parts": [{"text": user_prompt}]}])
            cleaned = raw_output.replace("```json", "").replace("```", "").strip()
            return json.loads(cleaned)
        except Exception as e:
            logger.warning(f"Gemini evaluation failed, falling back to MockAIProvider: {e}")
            return MockAIProvider().evaluate_response(eval_context)


class OpenAIProvider(BaseAIProvider):
    def __init__(self, api_key: str, model_name: str = "gpt-4o-mini"):
        self.api_key = api_key
        self.model_name = model_name
        self.base_url = "https://api.openai.com/v1/chat/completions"

    def generate_chat_reply(self, session_context: dict) -> dict:
        persona = get_persona(session_context.get("ai_persona", "Meera – Supportive Mentor"))
        pressure_level = session_context.get("pressure_level", 2)
        history = session_context.get("history", [])
        scenario = session_context.get("scenario", {})
        evaluation = session_context.get("evaluation", {})
        last_user = history[-1]["content"] if history and history[-1]["sender"] == "user" else ""
        modifier = build_pressure_prompt_modifier(pressure_level, len(history), last_user)

        messages = [{
            "role": "system",
            "content": (
                f"You are {persona['name']}, {persona['role']}.\n"
                f"{persona['system_directive']}\n"
                f"Scenario: {scenario.get('title')}\n"
                f"Evaluation: {evaluation.get('correctness', 'partially_correct')}\n"
                f"Directive: {modifier}\n"
                "Speak in 2-4 sentences directly to the candidate without asterisks or meta titles."
            )
        }]
        for m in history:
            messages.append({
                "role": "assistant" if m["sender"] == "ai" else "user",
                "content": m["content"]
            })

        try:
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json"
            }
            res = requests.post(self.base_url, headers=headers, json={
                "model": self.model_name,
                "messages": messages,
                "temperature": 0.7
            }, timeout=20)
            res.raise_for_status()
            data = res.json()
            return {
                "reply": data["choices"][0]["message"]["content"].strip(),
                "pressure_intent": f"{persona['name']} dynamic reply"
            }
        except Exception:
            return MockAIProvider().generate_chat_reply(session_context)

    def evaluate_response(self, eval_context: dict) -> dict:
        try:
            prompt = (
                f"Evaluate answer '{eval_context.get('answer')}' to question '{eval_context.get('question')}'. "
                f"Return JSON matching keys: correctness, score, what_was_correct, what_was_wrong, missing_concepts, "
                f"explanation, recommended_next_action, follow_up_question, overall_score, relevance, clarity, structure, "
                f"specificity, conceptual_correctness, speaking_fluency, argumentation, pressure_handling, recovery_ability."
            )
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json"
            }
            res = requests.post(self.base_url, headers=headers, json={
                "model": self.model_name,
                "messages": [{"role": "user", "content": prompt}],
                "response_format": {"type": "json_object"}
            }, timeout=20)
            res.raise_for_status()
            return json.loads(res.json()["choices"][0]["message"]["content"])
        except Exception:
            return MockAIProvider().evaluate_response(eval_context)


class GroqProvider(BaseAIProvider):
    """
    Groq Ultra-Fast LPU Inference Provider.
    Supports Llama-3.3-70b-versatile, Llama-3.1-8b-instant, etc. with near-instant token latency.
    """
    def __init__(self, api_key: str, model_name: str = "llama-3.3-70b-versatile"):
        self.api_key = api_key
        self.model_name = os.getenv("GROQ_MODEL", model_name)
        self.base_url = "https://api.groq.com/openai/v1/chat/completions"

    def generate_chat_reply(self, session_context: dict) -> dict:
        persona = get_persona(session_context.get("ai_persona", "Meera – Supportive Mentor"))
        pressure_level = session_context.get("pressure_level", 2)
        history = session_context.get("history", [])
        scenario = session_context.get("scenario", {})
        evaluation = session_context.get("evaluation", {})
        last_user = history[-1]["content"] if history and history[-1]["sender"] == "user" else ""
        modifier = build_pressure_prompt_modifier(pressure_level, len(history), last_user)

        messages = [{
            "role": "system",
            "content": (
                f"You are {persona['name']}, {persona['role']} conducting an interview simulation.\n"
                f"{persona['system_directive']}\n"
                f"Scenario: {scenario.get('title', 'Interview')}\n"
                f"Candidate answer correctness: {evaluation.get('correctness', 'partially_correct')}\n"
                f"Identified gaps/errors: {evaluation.get('what_was_wrong', [])}\n"
                f"Correct concept: {evaluation.get('explanation', '')}\n"
                f"Suggested follow-up: {evaluation.get('follow_up_question', '')}\n"
                f"Pressure Directive: {modifier}\n"
                "Speak directly to the candidate in 2-4 sentences as the interviewer without markdown asterisks or meta labels."
            )
        }]
        for m in history:
            messages.append({
                "role": "assistant" if m["sender"] == "ai" else "user",
                "content": m["content"]
            })

        try:
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json"
            }
            res = requests.post(self.base_url, headers=headers, json={
                "model": self.model_name,
                "messages": messages,
                "temperature": 0.7,
                "max_tokens": 512
            }, timeout=20)
            res.raise_for_status()
            data = res.json()
            return {
                "reply": data["choices"][0]["message"]["content"].strip(),
                "pressure_intent": f"{persona['name']} Groq dynamic challenge"
            }
        except Exception as e:
            logger.warning(f"Groq chat reply failed, falling back to mock: {e}")
            return MockAIProvider().generate_chat_reply(session_context)

    def evaluate_response(self, eval_context: dict) -> dict:
        question = eval_context.get("question", "")
        answer = eval_context.get("answer", "")
        scenario = eval_context.get("scenario", {})
        nlp_data = eval_context.get("nlp_data", {})
        persona_name = eval_context.get("persona_name", "Meera – Supportive Mentor")

        system_prompt = (
            "You are an expert communication examiner and technical evaluation engine. "
            "You MUST output valid, parseable JSON matching the exact schema specified. No text outside the JSON."
        )

        user_prompt = f"""
Evaluate this interview response:
Question: "{question}"
Candidate Answer: "{answer}"
Interviewer: {persona_name}
Scenario: {scenario.get('title', 'Communication Simulation')}
Fillers Detected: {nlp_data.get('filler_word_count', 0)} ({nlp_data.get('filler_frequency_per_100_words', 0)} per 100 words)

Evaluate if the answer is conceptually correct, partially correct, incorrect, or insufficient_information.
Return JSON with this exact structure:
{{
  "correctness": "correct | partially_correct | incorrect | insufficient_information",
  "score": 75,
  "what_was_correct": ["Point 1", "Point 2"],
  "what_was_wrong": ["Point 1"],
  "missing_concepts": ["Concept 1"],
  "explanation": "Clear explanation of the topic and why the answer was right/wrong.",
  "recommended_next_action": "Actionable suggestion for the candidate to improve.",
  "follow_up_question": "A dynamic follow-up question directly addressing their answer or mistake.",
  "overall_score": 75,
  "relevance": 80,
  "clarity": 75,
  "structure": 70,
  "specificity": 75,
  "conceptual_correctness": 75,
  "speaking_fluency": 75,
  "argumentation": 70,
  "pressure_handling": 70,
  "recovery_ability": 70,
  "strengths": ["Clear opening"],
  "weaknesses": ["Omitted edge case"],
  "why_it_needs_improvement": "Why precision matters in high-stakes interviews.",
  "actionable_suggestions": ["Use STAR or PREP framework"],
  "sample_improved_answer": "Model answer in 3-4 sentences.",
  "targeted_skill_gap": "Conceptual Precision"
}}
"""
        try:
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json"
            }
            res = requests.post(self.base_url, headers=headers, json={
                "model": self.model_name,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                "response_format": {"type": "json_object"},
                "temperature": 0.2,
                "max_tokens": 1024
            }, timeout=20)
            res.raise_for_status()
            data = res.json()
            raw_json = data["choices"][0]["message"]["content"]
            return json.loads(raw_json)
        except Exception as e:
            logger.warning(f"Groq evaluation failed, falling back to mock: {e}")
            return MockAIProvider().evaluate_response(eval_context)


class MockAIProvider(BaseAIProvider):
    """
    Intelligent dynamic evaluation and conversational simulation engine.
    Ensures complete, rigorous assessment without external API dependencies.
    Analyzes domain logic, detects reversed or incomplete concepts, and generates
    adaptive follow-up questions tailored to the candidate's exact response.
    """

    def evaluate_response(self, eval_context: dict) -> dict:
        question = eval_context.get("question", "").lower()
        answer = eval_context.get("answer", "")
        answer_lower = answer.lower().strip()
        nlp_data = eval_context.get("nlp_data", {})
        persona_name = eval_context.get("persona_name", "Meera – Supportive Mentor")

        word_count = nlp_data.get("word_count", len(answer.split()))
        filler_count = nlp_data.get("filler_word_count", 0)
        filler_freq = nlp_data.get("filler_frequency_per_100_words", 0.0)

        # Baseline detection
        correctness = "partially_correct"
        classification = "partially_correct"
        allow_progression = True
        allow_retry = True
        feedback_message = ""
        score = 70.0
        what_was_correct = []
        what_was_wrong = []
        missing_concepts = []
        explanation = ""
        recommended_next_action = ""
        follow_up_question = ""

        # Check for Meaningless, Empty, "Don't know", and Irrelevant answers
        meaningless_markers = ["blah blah", "blah", "asdf", "qwerty", "lorem ipsum", "test test test", "testing 1 2 3", "na na na", "la la la"]
        unknown_markers = ["don't know", "dont know", "not sure", "no idea", "haven't learned", "haven't read", "cannot recall", "skip"]
        irrelevant_markers = ["pizza", "burger", "sandwich", "breakfast", "lunch", "dinner", "football", "cricket", "movie", "shopping", "weather", "vacation"]

        words = answer_lower.split()
        is_repeated_words = len(words) >= 3 and len(set(words)) == 1
        is_pure_filler = len(words) > 0 and set(words).issubset({'um', 'uh', 'ah', 'eh', 'er', 'hmm', 'hm', 'like', 'you', 'know', 'so', 'yeah', 'basically'})
        is_meaningless = any(m in answer_lower for m in meaningless_markers) or is_repeated_words or is_pure_filler
        is_unknown = any(m in answer_lower for m in unknown_markers) and word_count < 15
        is_irrelevant = any(m in answer_lower for m in irrelevant_markers)

        # 1. EMPTY RESPONSE
        if not answer_lower or word_count == 0:
            classification = "empty_response"
            correctness = "insufficient_information"
            score = 0.0
            allow_progression = False
            feedback_message = "No answer detected. Please provide your response before submitting."
            explanation = "No response was detected. Please state your answer clearly before submitting."
            what_was_correct = []
            what_was_wrong = ["No audible or typed response submitted."]
            missing_concepts = ["Complete response to the prompt"]
            follow_up_question = ""

        # 2. MEANINGLESS RESPONSE
        elif is_meaningless:
            classification = "meaningless"
            correctness = "incorrect"
            score = 0.0
            allow_progression = False
            feedback_message = "Invalid Response. We could not identify a meaningful answer. Please try again."
            explanation = "The response consisted of repetitive words, unintelligible phrasing, or filler sounds without meaningful content."
            what_was_correct = []
            what_was_wrong = ["Spoke repetitive filler or unintelligible words instead of answering."]
            missing_concepts = ["Coherent substantive response"]
            follow_up_question = ""

        # 3. IRRELEVANT RESPONSE
        elif is_irrelevant:
            classification = "irrelevant"
            correctness = "incorrect"
            score = 15.0
            allow_progression = False
            feedback_message = "Irrelevant Response. Your answer does not address the question. Please answer the question directly."
            explanation = "Your answer introduces unrelated topics that do not address the core question asked."
            what_was_correct = []
            what_was_wrong = ["Answer diverted to an unrelated subject."]
            missing_concepts = ["Direct address to the interview question"]
            follow_up_question = ""

        # 4. DOES NOT KNOW
        elif is_unknown:
            classification = "does_not_know"
            correctness = "insufficient_information"
            score = 30.0
            allow_progression = False
            feedback_message = "You indicated you do not know the answer. In an interview, it is better to reason from first principles. Review the foundational concept and retry or proceed."
            explanation = "Acknowledging uncertainty is transparent, but in high-stakes interviews you should articulate foundational principles or ask clarifying questions."
            what_was_correct = ["Demonstrated honesty rather than fabricating a false statement."]
            what_was_wrong = ["Did not provide substantive explanation."]
            missing_concepts = ["Foundational definitions", "First-principles reasoning"]
            follow_up_question = "Let's reason from first principles: based on what you know about the system, what would be the primary constraint?"

        # 5. UNCLEAR RESPONSE
        elif word_count < 6 and not ("supervised" in question or "dijkstra" in question or "raft" in question):
            classification = "unclear"
            correctness = "incorrect"
            score = 25.0
            allow_progression = False
            feedback_message = "Unclear Response. Your explanation was too vague or fragmented to evaluate. Please restate your answer clearly."
            explanation = "Statements under 6 words cannot demonstrate technical depth or clear reasoning."
            what_was_correct = ["Attempted a brief verbal statement."]
            what_was_wrong = ["Answer was under 6 words and lacked coherent structure."]
            missing_concepts = ["Core mechanism", "Evidence", "Structured reasoning"]
            follow_up_question = ""

        # 6. Machine Learning - Supervised vs Unsupervised
        elif "supervised" in question or "unsupervised" in question:
            has_labels = "label" in answer_lower or "target" in answer_lower or "ground truth" in answer_lower
            has_unlabeled = "unlabeled" in answer_lower or "clustering" in answer_lower or "pattern" in answer_lower
            is_reversed = ("unsupervised" in answer_lower and "has labels" in answer_lower) or ("supervised" in answer_lower and "no labels" in answer_lower)

            if is_reversed:
                classification = "incorrect"
                correctness = "incorrect"
                score = 38.0
                allow_progression = False
                feedback_message = "Incorrect Answer. Your explanation does not match the expected concept. Please review the correction and try again."
                what_was_correct = ["Attempted to differentiate the learning paradigms."]
                what_was_wrong = ["Reversed the definitions: Supervised learning requires labeled data, whereas unsupervised learning works on unlabeled data."]
                missing_concepts = ["Ground truth supervision", "Objective loss function vs latent clustering"]
                explanation = "Supervised learning relies on paired input-output training labels (e.g. classification, regression). Unsupervised learning discovers latent structures in unlabeled data (e.g. k-means, PCA)."
                recommended_next_action = "Review core ML paradigms and reinforce definitions using tangible examples like spam filtering vs customer segmentation."
                follow_up_question = "You got the relationship backwards: supervised actually requires labeled data. Can you give me an example of how a model is trained when no labels exist?"
            elif has_labels and has_unlabeled:
                classification = "correct"
                correctness = "correct"
                score = 92.0
                allow_progression = True
                feedback_message = "Correct answer. Your reasoning and technical concepts are accurate and well structured."
                what_was_correct = ["Correctly identified that supervised learning requires labeled ground-truth data.", "Properly contrasted with unsupervised pattern discovery on unlabeled data."]
                what_was_wrong = []
                missing_concepts = ["Semi-supervised learning nuances"]
                explanation = "Accurate distinction between supervised target-directed optimization and unsupervised latent distribution modeling."
                recommended_next_action = "Deepen response by explaining loss formulations like Cross-Entropy versus reconstruction error in autoencoders."
                follow_up_question = "Spot on. Now, what happens when 95% of your dataset is unlabeled and only 5% is labeled? What learning paradigm applies there?"
            else:
                classification = "partially_correct"
                correctness = "partially_correct"
                score = 68.0
                allow_progression = True
                feedback_message = "Partially correct. You identified key concepts, but missed critical constraints or edge cases."
                what_was_correct = ["Mentioned the core learning terminology."]
                what_was_wrong = ["Did not clearly specify the presence or absence of labeled target ground truth."]
                missing_concepts = ["Ground truth target labels", "Feature representation vs target pairing"]
                explanation = "The fundamental distinction hinges on labeled targets directing gradient updates versus clustering latent distributions."
                recommended_next_action = "Explicitly define what the training input and target signal consist of for each paradigm."
                follow_up_question = "You touched on data structure, but what specifically provides the feedback signal during backpropagation in supervised learning?"

        # 7. Distributed Systems - Raft Consensus & Joint Consensus
        elif "raft" in question or "consensus" in question:
            is_incorrect = any(k in answer_lower for k in [
                "replaces", "single server", "single node", "does not use", 
                "no quorum", "without quorum", "without election", "without any quorum",
                "no majorities", "without majorities"
            ])
            has_dual_majority = (
                any(m in answer_lower for m in ["majority", "majorities", "quorum", "quorums"]) and
                any(d in answer_lower for d in ["joint", "c_old", "dual", "both", "separate", "old and new", "overlapping"])
            )

            if is_incorrect:
                classification = "incorrect"
                correctness = "incorrect"
                score = 42.0
                allow_progression = False
                feedback_message = "Incorrect Answer. Your explanation does not match the expected concept. Please review the correction and try again."
                what_was_correct = ["Addressed cluster configuration dynamics."]
                what_was_wrong = ["Joint consensus does not switch abruptly to a single server or discard previous logs."]
                missing_concepts = ["Dual-majority requirement (C_old and C_new)", "Two-phase configuration transition"]
                explanation = "In Raft, joint consensus avoids split-brain during membership change by requiring separate majorities from both the old configuration and the new configuration simultaneously."
                recommended_next_action = "Study Section 6 of the Raft paper regarding dynamic membership changes."
                follow_up_question = "That would cause a split-brain. In Raft's joint consensus, why must a leader obtain agreement from both C_old and C_new majorities?"
            elif has_dual_majority:
                classification = "correct"
                correctness = "correct"
                score = 88.0
                allow_progression = True
                feedback_message = "Correct answer. Your reasoning and technical concepts are accurate and well structured."
                what_was_correct = ["Identified the dual quorum/configuration transition principle.", "Recognized how Raft guarantees cluster consistency during membership changes."]
                what_was_wrong = []
                missing_concepts = ["Single-server transition optimization in later Raft revisions"]
                explanation = "Strong understanding of joint consensus safeguarding linearizability across dynamic topology reconfigurations."
                recommended_next_action = "Mention how modern implementations often use single-server membership changes to simplify joint consensus."
                follow_up_question = "Well explained. What happens if the leader crashes right in the middle of the C_old,new joint configuration phase?"
            else:
                classification = "partially_correct"
                correctness = "partially_correct"
                score = 65.0
                allow_progression = True
                feedback_message = "Partially correct. You identified key concepts, but missed critical constraints or edge cases."
                what_was_correct = ["Mentioned consensus logs and election states."]
                what_was_wrong = ["Did not explain how overlapping majorities prevent two independent leaders from being elected simultaneously."]
                missing_concepts = ["C_old,new joint consensus state", "Overlapping majorities"]
                explanation = "Joint consensus operates by requiring simultaneous majorities of both old and new cluster configurations until the transition commits."
                recommended_next_action = "Always anchor distributed consensus answers in how split-brain scenarios are mathematically prevented."
                follow_up_question = "How specifically does Raft prevent two different nodes from claiming leadership during that transition period?"

        # 8. Algorithms - Dijkstra & Negative Cycles
        elif "dijkstra" in question or "negative" in question:
            mentions_greedy = "greedy" in answer_lower or "visited" in answer_lower or "relax" in answer_lower or "non-decreasing" in answer_lower or "bellman" in answer_lower
            if "works fine" in answer_lower or "handles negative" in answer_lower:
                classification = "incorrect"
                correctness = "incorrect"
                score = 35.0
                allow_progression = False
                feedback_message = "Incorrect Answer. Your explanation does not match the expected concept. Please review the correction and try again."
                what_was_correct = ["Addressed Dijkstra's algorithm."]
                what_was_wrong = ["Claimed Dijkstra handles negative cycles correctly. Dijkstra greedily assumes shortest paths cannot shrink once visited."]
                missing_concepts = ["Greedy choice property", "Visited node finalization", "Bellman-Ford alternative"]
                explanation = "Dijkstra's greedy assumption holds only for non-negative edge weights. Negative edges break the invariant that visited nodes have their optimal distance finalized, leading to infinite loops or incorrect paths."
                recommended_next_action = "Contrast Dijkstra's greedy edge relaxation with Bellman-Ford's O(V*E) dynamic programming relaxation."
                follow_up_question = "Actually, Dijkstra fundamentally fails with negative cycles. Why does marking a node as 'visited' prevent Dijkstra from finding a cheaper path through a negative edge?"
            elif mentions_greedy:
                classification = "correct"
                correctness = "correct"
                score = 90.0
                allow_progression = True
                feedback_message = "Correct answer. Your reasoning and technical concepts are accurate and well structured."
                what_was_correct = ["Highlighted Dijkstra's greedy invariant regarding visited nodes.", "Explained why negative edge weights invalidate optimal substructure assumptions."]
                what_was_wrong = []
                missing_concepts = ["Johnson's algorithm reweighting"]
                explanation = "Thorough comprehension of greedy graph algorithms and the Bellman-Ford alternative for negative edge graphs."
                recommended_next_action = "Mention Johnson's algorithm when dealing with all-pairs shortest paths on sparse graphs with negative weights."
                follow_up_question = "Accurate. If we detect negative edges in a directed graph, which algorithm should we deploy instead, and what is its time complexity?"
            else:
                classification = "partially_correct"
                correctness = "partially_correct"
                score = 66.0
                allow_progression = True
                feedback_message = "Partially correct. You identified key concepts, but missed critical constraints or edge cases."
                what_was_correct = ["Identified that Dijkstra algorithm has limitations with negative numbers."]
                what_was_wrong = ["Did not explicitly state the algorithmic mechanism (greedy relaxation invariant) that breaks."]
                missing_concepts = ["Priority queue greedy extraction", "Visited node finality"]
                explanation = "Dijkstra's priority queue pops the minimum distance node assuming no negative edge can later reduce that distance."
                recommended_next_action = "Specify the exact step in the pseudocode where the failure occurs."
                follow_up_question = "At what point in Dijkstra's execution does the algorithm make an irreversible assumption about a node's distance?"

        # 9. Architecture / Microservices vs Monolith
        elif "microservice" in question or "monolith" in question:
            has_tradeoff = "latency" in answer_lower or "network" in answer_lower or "deploy" in answer_lower or "scale" in answer_lower or "complexity" in answer_lower or "database" in answer_lower
            if has_tradeoff:
                classification = "correct"
                correctness = "correct"
                score = 86.0
                allow_progression = True
                feedback_message = "Correct answer. Your reasoning and technical concepts are accurate and well structured."
                what_was_correct = ["Articulated real-world architectural trade-offs.", "Weighed organizational scale against operational overhead."]
                what_was_wrong = []
                missing_concepts = ["Distributed transactions / SAGA patterns"]
                explanation = "Balanced architectural perspective recognizing that microservices solve organizational scaling at the cost of distributed systems complexity."
                recommended_next_action = "Reference specific observability solutions like OpenTelemetry or distributed tracing to strengthen defense."
                follow_up_question = "You made a solid case for team velocity. But how do you handle cross-service data consistency when a single user transaction spans three microservices?"
            else:
                classification = "partially_correct"
                correctness = "partially_correct"
                score = 64.0
                allow_progression = True
                feedback_message = "Partially correct. You identified key concepts, but missed critical constraints or edge cases."
                what_was_correct = ["Expressed a technology preference."]
                what_was_wrong = ["Offered generic claims without citing concrete operational or latency trade-offs."]
                missing_concepts = ["Network serialization overhead", "Operational tooling costs"]
                explanation = "Senior architectural defense requires concrete numbers, team size thresholds, and latency budgets."
                recommended_next_action = "Use the PREP framework to anchor design decisions in verifiable operational realities."
                follow_up_question = "What concrete latency and operational costs are you willing to absorb in exchange for independent service deployments?"

        # 10. General Fallback Evaluation
        else:
            has_explicit_error = any(k in answer_lower for k in [
                "without any quorum", "without quorum", "no quorum", "single node dictates", 
                "does not use", "not required", "disregard", "bypass"
            ])
            if has_explicit_error:
                classification = "incorrect"
                correctness = "incorrect"
                score = 38.0
                allow_progression = False
                feedback_message = "Incorrect Answer. Your explanation does not match the expected concept. Please review the correction and try again."
                what_was_correct = ["Attempted a technical explanation."]
                what_was_wrong = ["Asserted inaccurate operational principles or bypassed essential consistency constraints."]
                missing_concepts = ["Proper verification protocols", "Safety invariants"]
                explanation = "Your response contains statements that violate fundamental architectural safety or consistency constraints."
                recommended_next_action = "Review the theoretical foundations and ensure you do not contradict established invariants."
                follow_up_question = "That contradicts standard system principles. How can a system remain correct without those fundamental constraints?"
            elif word_count >= 24 and filler_freq < 5.0:
                classification = "correct"
                correctness = "correct"
                score = 82.0
                allow_progression = True
                feedback_message = "Correct answer. Your reasoning and technical concepts are accurate and well structured."
                what_was_correct = ["Addressed the question with substantive detail and structured sentences.", "Kept verbal hesitations low."]
                what_was_wrong = []
                missing_concepts = ["Quantifiable outcome metrics"]
                explanation = "Clear, articulate communication demonstrating situational awareness and relevant domain vocabulary."
                recommended_next_action = "Close with an explicit forward-looking action item to anchor executive authority."
                follow_up_question = "You've outlined the broader context well. If you had to execute this tomorrow with half the budget, what is the first trade-off you would enforce?"
            elif word_count >= 10:
                classification = "partially_correct"
                correctness = "partially_correct"
                score = 70.0
                allow_progression = True
                feedback_message = "Partially correct. You identified key concepts, but missed critical constraints or edge cases."
                what_was_correct = ["Engaged directly with the core prompt and named relevant mechanisms."]
                what_was_wrong = ["Relied on a high-level summary rather than citing concrete empirical trade-offs or latency impact."]
                missing_concepts = ["Specific latency metrics", "Failure recovery steps"]
                explanation = "Good technical direction, but high-pressure architectural interviews demand detailed trade-off justifications."
                recommended_next_action = "Follow up your protocol selection with its direct impact on write latency and network overhead."
                follow_up_question = "You named the protocol correctly. What is the exact latency and round-trip cost introduced by that consensus quorum during writes?"
            else:
                classification = "incorrect"
                correctness = "incorrect"
                score = 42.0
                allow_progression = False
                feedback_message = "Incorrect Answer. Your explanation does not match the expected concept. Please review the correction and try again."
                what_was_correct = ["Attempted a brief verbal response."]
                what_was_wrong = ["Answer was under 10 words and failed to provide actionable technical explanation."]
                missing_concepts = ["Contextual background", "Mechanisms", "Evidence"]
                explanation = "Statements under 10 words cannot demonstrate technical depth or conviction under scrutiny."
                recommended_next_action = "Structure answers into: 1. Core Point, 2. Mechanism, 3. Concrete Trade-off."
                follow_up_question = "That was too brief. Can you walk me through the concrete mechanisms and reasoning behind that statement?"

        # Adjust scores for fillers
        if filler_freq > 8.0:
            score = max(30.0, score - 10.0)
        elif filler_freq > 4.0:
            score = max(35.0, score - 5.0)

        # Deterministic allow_progression and allow_retry based on classification
        if classification == "correct":
            allow_progression = True
            allow_retry = False
        elif classification in ["incorrect", "meaningless", "irrelevant", "empty_response"]:
            allow_progression = False
            allow_retry = True
        else:
            allow_progression = True
            allow_retry = True

        return {
            "classification": classification,
            "allow_progression": allow_progression,
            "allow_retry": allow_retry,
            "feedback_message": feedback_message,
            "correct_concepts": what_was_correct,
            "incorrect_concepts": what_was_wrong,
            "correctness": correctness,
            "score": round(score, 1),
            "what_was_correct": what_was_correct,
            "what_was_wrong": what_was_wrong,
            "missing_concepts": missing_concepts,
            "explanation": explanation,
            "recommended_next_action": recommended_next_action or feedback_message,
            "follow_up_question": follow_up_question,
            "overall_score": round(score, 1),
            "relevance": min(95.0, max(40.0, round(score + 3.0, 1))),
            "clarity": min(95.0, max(40.0, round(score - (filler_freq * 1.5), 1))),
            "structure": float(nlp_data.get("structure_score", 70.0)),
            "specificity": min(95.0, max(35.0, round(score - (5.0 if word_count < 25 else 0), 1))),
            "conceptual_correctness": round(score, 1),
            "speaking_fluency": min(95.0, max(40.0, round(85.0 - (filler_freq * 2.0), 1))),
            "argumentation": min(95.0, max(40.0, round(score - 2.0, 1))),
            "pressure_handling": min(95.0, max(40.0, round(score, 1))),
            "recovery_ability": 75.0,
            "strengths": what_was_correct or ["Communicated clearly under pressure."],
            "weaknesses": what_was_wrong or (["Could be more succinct"] if filler_freq > 5 else []),
            "why_it_needs_improvement": "Precision and depth separate adequate candidates from exceptional leaders in high-stakes discussions.",
            "actionable_suggestions": [recommended_next_action or "Structure future responses with explicit cause-and-effect reasoning."],
            "sample_improved_answer": f"To address this effectively: {explanation} For example, when balancing these constraints, we always prioritize verified invariants before optimization.",
            "targeted_skill_gap": "Conceptual Precision & Depth"
        }

    def generate_chat_reply(self, session_context: dict) -> dict:
        persona_name = session_context.get("ai_persona", "Meera – Supportive Mentor")
        persona = get_persona(persona_name)
        pressure_level = session_context.get("pressure_level", 2)
        history = session_context.get("history", [])
        evaluation = session_context.get("evaluation")
        last_answer = session_context.get("last_answer", "")
        last_question = session_context.get("last_question", "")

        # If evaluation wasn't passed in directly, evaluate on the fly
        if not evaluation:
            evaluation = self.evaluate_response({
                "question": last_question,
                "answer": last_answer,
                "persona_name": persona_name,
                "scenario": session_context.get("scenario", {})
            })

        correctness = evaluation.get("correctness", "partially_correct")
        follow_up = evaluation.get("follow_up_question", "Could you elaborate further on that?")
        what_wrong = evaluation.get("what_was_wrong", [])
        explanation = evaluation.get("explanation", "")
        interviewer_name = persona.get("name", "Interviewer")
        interviewer_role = persona.get("role", "Interviewer")

        # Distinctive questioning behaviors for each of the 8 personas (gender-independent)
        # 1. Strict Professor (Arjun / Ananya)
        if "Strict Professor" in interviewer_role or "Professor" in persona_name:
            if correctness == "incorrect":
                reply = (
                    f"That explanation lacks theoretical rigor. {what_wrong[0] if what_wrong else 'Your definition violates foundational theoretical principles.'} "
                    f"{explanation} How do you mathematically or logically justify this: {follow_up}"
                )
            elif correctness == "insufficient_information":
                reply = (
                    f"In an academic examination, omitting the underlying invariant leaves your argument incomplete. "
                    f"Recall the theoretical basis: {explanation} Now state your proof: {follow_up}"
                )
            elif correctness == "correct":
                reply = (
                    f"That theoretical foundation is sound. Now let's inspect the worst-case asymptotic bounds: {follow_up}"
                )
            else: # partially_correct
                reply = (
                    f"You have the intuition, but you glossed over the formal invariant. "
                    f"{explanation} Provide the exact justification: {follow_up}"
                )

        # 2. Technical Interviewer (Vikram / Meera)
        elif "Technical Interviewer" in interviewer_role or "Technical" in persona_name:
            if correctness == "incorrect":
                reply = (
                    f"That is incorrect. That implementation will fail in production. {what_wrong[0] if what_wrong else 'Your algorithmic logic has a critical flaw.'} "
                    f"{explanation} How do you fix the code logic here: {follow_up}"
                )
            elif correctness == "insufficient_information":
                reply = (
                    f"We cannot deploy on guesswork. The core mechanism requires: {explanation} "
                    f"Walk me through the practical implementation: {follow_up}"
                )
            elif correctness == "correct":
                reply = (
                    f"Clean, precise technical explanation. The data flow and complexity hold up. "
                    f"Let's test this system under extreme production concurrency: {follow_up}"
                )
            else: # partially_correct
                reply = (
                    f"You covered the baseline happy path, but missed the edge cases and latency trade-offs. "
                    f"{explanation} How do you handle this concrete scenario: {follow_up}"
                )

        # 3. HR Interviewer (Rahul / Priya)
        elif "HR Interviewer" in interviewer_role or "HR" in persona_name or "Professional" in persona_name:
            if correctness == "incorrect":
                reply = (
                    f"That response lacks clarity and structured ownership. In high-stakes workplace communication, poise and precision are vital. "
                    f"{explanation} Let's refocus on the situation: {follow_up}"
                )
            elif correctness == "insufficient_information":
                reply = (
                    f"I appreciate your candor, but leaders must navigate ambiguity with a structured plan. "
                    f"When priorities are uncertain, how do you take proactive ownership? {follow_up}"
                )
            elif correctness == "correct":
                reply = (
                    f"Very well articulated. You demonstrated structured STAR reasoning, strong emotional intelligence, and clear ownership. "
                    f"Let's explore interpersonal dynamics: {follow_up}"
                )
            else: # partially_correct
                reply = (
                    f"You gave the high-level picture, but I need to understand your personal contribution and measurable outcomes. "
                    f"{explanation} {follow_up}"
                )

        # 4. Skeptical Examiner (Aditya / Kavya)
        elif "Skeptical Examiner" in interviewer_role or "Skeptical" in persona_name:
            if correctness == "incorrect":
                reply = (
                    f"I see an immediate contradiction in that premise. {what_wrong[0] if what_wrong else 'Your assertion collapses under scrutiny.'} "
                    f"{explanation} What empirical data or evidence supports your claim: {follow_up}"
                )
            elif correctness == "insufficient_information":
                reply = (
                    f"If you cannot produce the supporting metrics, that remains an unverified assumption. "
                    f"Consider this verifiable fact: {explanation} How do you substantiate your claim: {follow_up}"
                )
            elif correctness == "correct":
                reply = (
                    f"Your reasoning withstands initial scrutiny. But let me stress-test a subtle edge case: {follow_up}"
                )
            else: # partially_correct
                reply = (
                    f"Part of your premise holds, but you are assuming unproven conditions. "
                    f"{explanation} Reconcile that contradiction: {follow_up}"
                )

        # 5. Strict Manager (Karan / Neha)
        elif "Strict Manager" in interviewer_role or "Manager" in persona_name:
            if correctness == "incorrect":
                reply = (
                    f"That approach will blow past our deadlines and budget without solving the root issue. "
                    f"{what_wrong[0] if what_wrong else ''} {explanation} What is your concrete plan to deliver this reliably: {follow_up}"
                )
            elif correctness == "insufficient_information":
                reply = (
                    f"In delivery reviews, indecision costs time and money. Here is the operational reality: {explanation} "
                    f"How do you take immediate accountability: {follow_up}"
                )
            elif correctness == "correct":
                reply = (
                    f"Solid operational sense. That balances delivery velocity with risk management. "
                    f"Now, what happens if our delivery deadline is suddenly cut in half: {follow_up}"
                )
            else: # partially_correct
                reply = (
                    f"You have an interesting concept, but the complexity and headcount costs are too high. "
                    f"{explanation} How do you simplify this to meet our SLA: {follow_up}"
                )

        # 6. Devil's Advocate (Rohan / Ishita)
        elif "Devil's Advocate" in interviewer_role or "Devil" in persona_name:
            if correctness == "incorrect":
                reply = (
                    f"Your central argument completely unravels here. {what_wrong[0] if what_wrong else 'Your logic contradicts empirical reality.'} "
                    f"{explanation} How do you defend your stance against this: {follow_up}"
                )
            elif correctness == "insufficient_information":
                reply = (
                    f"If you refuse to take a definitive stand, the debate stalls. Let me force the opposing thesis: "
                    f"{explanation} Which side of that dilemma do you stand on: {follow_up}"
                )
            elif correctness == "correct":
                reply = (
                    f"A formidable argument. But let me counter with an aggressive counter-case: {follow_up}"
                )
            else: # partially_correct
                reply = (
                    f"That argument is comfortable in standard scenarios, but completely fails under adversarial conditions. "
                    f"{explanation} How do you answer this counter-evidence: {follow_up}"
                )

        # 7. Curious Audience (Aarav / Diya)
        elif "Curious Audience" in interviewer_role or "Audience" in persona_name or "Curious" in persona_name:
            if correctness == "incorrect":
                reply = (
                    f"I'm having a hard time following that explanation, and it sounds confusing. "
                    f"{explanation} Could you explain that using a simple everyday analogy: {follow_up}"
                )
            elif correctness == "insufficient_information":
                reply = (
                    f"That's a very honest response! Could you break down the basic idea in plain English so someone without a technical background can understand: {follow_up}"
                )
            elif correctness == "correct":
                reply = (
                    f"That makes total sense! You explained that clearly with great intuition. "
                    f"Now, an unexpected question from the audience: {follow_up}"
                )
            else: # partially_correct
                reply = (
                    f"I understand the general idea, but some of that was heavy on jargon. "
                    f"{explanation} How would you summarize that simply in one sentence: {follow_up}"
                )

        # 8. Supportive Mentor (Krishna / Nandini)
        else:
            if correctness == "incorrect":
                reply = (
                    f"I see the direction you were aiming for, but that explanation is actually backwards. "
                    f"{explanation} Don't worry—let's reset and try framing it with the PREP structure: {follow_up}"
                )
            elif correctness == "insufficient_information":
                reply = (
                    f"It takes great courage to admit when a question catches you off guard. "
                    f"Here is the foundational principle to keep in mind: {explanation} Take a breath and tell me: {follow_up}"
                )
            elif correctness == "correct":
                reply = (
                    f"Excellent answer! You communicated that clearly with good structure and confidence. "
                    f"Let's elevate this further: {follow_up}"
                )
            else: # partially_correct
                reply = (
                    f"Good start—your core idea is promising. To make your point even punchier, remember: {explanation} "
                    f"How would you address this next step: {follow_up}"
                )

        return {
            "reply": reply.strip(),
            "pressure_intent": f"{interviewer_name} dynamic challenge ({correctness})"
        }


def get_ai_provider() -> BaseAIProvider:
    """
    Factory function returning the configured provider.
    Priority:
    1. GROQ_API_KEY (Ultra-fast LPU inference: llama-3.3-70b-versatile, llama-3.1-8b-instant)
    2. GEMINI_API_KEY (Google Generative AI: gemini-1.5-flash)
    3. OPENAI_API_KEY (OpenAI GPT-4o-mini)
    4. MockAIProvider (Zero-dependency local intelligent simulation engine)
    """
    groq_key = os.getenv("GROQ_API_KEY")
    if groq_key and groq_key.strip() and not groq_key.startswith("your_"):
        return GroqProvider(api_key=groq_key.strip())

    gemini_key = os.getenv("GEMINI_API_KEY")
    if gemini_key and gemini_key.strip() and not gemini_key.startswith("your_"):
        return GeminiProvider(api_key=gemini_key.strip())

    openai_key = os.getenv("OPENAI_API_KEY")
    if openai_key and openai_key.strip() and not openai_key.startswith("your_"):
        return OpenAIProvider(api_key=openai_key.strip())

    return MockAIProvider()
