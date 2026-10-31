"""
MaskOff AI - NLP Analysis Engine
Provides deterministic, transparent linguistic metrics:
- Precision filler word detection & frequency per 100 words (uh, um, ah, eh, er, hmm, you know, contextual like, repeated basically/actually)
- Genuine vocabulary vs filler disambiguation
- Character-level filler spans for transcript highlighting
- Phrase repetition analysis
- Vague phrase detection
- Answer structure heuristics (intro, explanation, evidence, conclusion)
"""

import re
from collections import Counter

# Standard phonetic hesitation patterns (sound fillers)
HESITATION_PATTERNS = [
    (r'\buh+\b', 'uh'),
    (r'\bum+\b', 'um'),
    (r'\bah+\b', 'ah'),
    (r'\beh+\b', 'eh'),
    (r'\ber+\b', 'er'),
    (r'\b(h+m+|h+u+m+)\b', 'hmm'),
]

# Fixed verbal crutch phrases
CRUTCH_PHRASES = [
    (r'\byou know\b', 'you know'),
    (r'\bi mean\b', 'i mean'),
    (r'\bso yeah\b', 'so yeah'),
    (r'\byou see\b', 'you see'),
    (r'\bsort of\b', 'sort of'),
    (r'\bkind of\b', 'kind of'),
]

VAGUE_PATTERNS = [
    r'\bit works better\b',
    r'\bit\'?s good\b',
    r'\bi think so\b',
    r'\bsomething like that\b',
    r'\bstuff like that\b',
    r'\band things\b',
    r'\betc\b',
    r'\betcetera\b',
    r'\bmore or less\b',
    r'\bkind of good\b',
    r'\blot of things\b',
    r'\ball that stuff\b'
]

STRUCTURAL_MARKERS = {
    'intro': [r'\bto begin with\b', r'\bfirstly\b', r'\bthe core issue\b', r'\bin my view\b', r'\bthe main reason\b', r'\bwhen we look at\b', r'\bfirst and foremost\b'],
    'explanation': [r'\bbecause\b', r'\bthis means\b', r'\bthe mechanism\b', r'\bas a result\b', r'\bspecifically\b', r'\bthe rationale\b', r'\bunder the hood\b', r'\bin other words\b'],
    'example': [r'\bfor example\b', r'\bfor instance\b', r'\bin our project\b', r'\bin production\b', r'\bsuch as\b', r'\ba case in point\b', r'\bconsider\b'],
    'conclusion': [r'\bin conclusion\b', r'\btherefore\b', r'\bto summarize\b', r'\bultimately\b', r'\bthis demonstrates\b', r'\bin short\b', r'\bthat is why\b', r'\bin summary\b']
}

# Regex to check if "like" is used as genuine vocabulary
GENUINE_LIKE_BEFORE = re.compile(
    r'\b(i|we|you|they|he|she|it|would|could|should|do|does|did|will|might|must|feels?|felt|looks?|looked|sounds?|sounded|seems?|seemed|smells?|tastes?|act(s|ed)?|is|are|was|were|be|been|being|just|much|more|less|something|nothing|anything|someone|not|un)\s+$',
    re.IGNORECASE
)
GENUINE_LIKE_AFTER = re.compile(
    r'^\s+(to|a|an|the|this|that|these|those|me|us|him|her|them|it|my|our|your|their|his|her|its)\b',
    re.IGNORECASE
)


def find_filler_occurrences(raw_text: str):
    """
    Detects filler words with exact start/end character offsets and categorizes them.
    Distinguishes filler 'like' from verb/preposition 'like'.
    Detects 'uh', 'um', 'ah', 'eh', 'er', 'hmm', 'you know', 'basically', 'actually'.
    """
    detected_fillers = []
    text_lower = raw_text.lower()
    occupied_spans = []

    def overlaps(start, end):
        return any(s < end and start < e for s, e in occupied_spans)

    # 1. Phonetic hesitation sounds
    for pat, label in HESITATION_PATTERNS:
        for match in re.finditer(pat, text_lower):
            start, end = match.span()
            if not overlaps(start, end):
                occupied_spans.append((start, end))
                detected_fillers.append({
                    'word': raw_text[start:end],
                    'normalized': label,
                    'start': start,
                    'end': end,
                    'type': 'hesitation_sound',
                    'explanation': f"Hesitation vocalization '{label}'"
                })

    # 2. Fixed crutch phrases (e.g. 'you know', 'i mean')
    for pat, label in CRUTCH_PHRASES:
        for match in re.finditer(pat, text_lower):
            start, end = match.span()
            if not overlaps(start, end):
                occupied_spans.append((start, end))
                detected_fillers.append({
                    'word': raw_text[start:end],
                    'normalized': label,
                    'start': start,
                    'end': end,
                    'type': 'crutch_phrase',
                    'explanation': f"Filler crutch phrase '{label}'"
                })

    # 3. Contextual 'like' analysis
    for match in re.finditer(r'\blike\b', text_lower):
        start, end = match.span()
        if overlaps(start, end):
            continue

        # Look at prefix and suffix context
        prefix = raw_text[max(0, start - 30):start]
        suffix = raw_text[end:min(len(raw_text), end + 30)]

        is_filler_like = False
        reason = ""

        # Case A: at sentence start or after punctuation: ". Like", ", like,"
        if re.search(r'(^|[,.?!;:—\n])\s*$', prefix):
            is_filler_like = True
            reason = "Used at start of clause/sentence as verbal crutch"
        # Case B: followed by comma or pause: "like,"
        elif re.match(r'^\s*[,.?!;:]', suffix):
            is_filler_like = True
            reason = "Isolated by punctuation pause as filler"
        # Case C: preceded by conjunction or hesitation: "and like", "so like", "uh like"
        elif re.search(r'\b(and|so|but|or|uh|um|ah|er|yeah)\s+$', prefix, re.IGNORECASE):
            is_filler_like = True
            reason = "Conjunctive filler hesitation"
        # Case D: repeated "like like"
        elif re.match(r'^\s+like\b', suffix, re.IGNORECASE):
            is_filler_like = True
            reason = "Repeated word stammer"
        # Case E: Check if genuine verb/preposition
        elif GENUINE_LIKE_BEFORE.search(prefix):
            is_filler_like = False
        else:
            # Check if followed by adjective/filler: "like really", "like basically"
            if re.match(r'^\s+(really|basically|actually|kind of|sort of|pretty|you know)\b', suffix, re.IGNORECASE):
                is_filler_like = True
                reason = "Vague approximation filler"

        if is_filler_like:
            occupied_spans.append((start, end))
            detected_fillers.append({
                'word': raw_text[start:end],
                'normalized': 'like',
                'start': start,
                'end': end,
                'type': 'verbal_filler',
                'explanation': reason or "Filler usage of 'like'"
            })

    # 4. 'basically' and 'actually' (flagged as filler crutches, especially when repeated or clause-openers)
    for target in ['basically', 'actually']:
        matches = list(re.finditer(rf'\b{target}\b', text_lower))
        if len(matches) > 1 or any(re.search(r'(^|[,.?!;:—\n])\s*$', raw_text[max(0, m.start()-30):m.start()]) for m in matches):
            for m in matches:
                start, end = m.span()
                if not overlaps(start, end):
                    occupied_spans.append((start, end))
                    detected_fillers.append({
                        'word': raw_text[start:end],
                        'normalized': target,
                        'start': start,
                        'end': end,
                        'type': 'crutch_word',
                        'explanation': f"Overused crutch word '{target}'"
                    })

    # Sort fillers by occurrence position in text
    detected_fillers.sort(key=lambda x: x['start'])
    return detected_fillers


def generate_highlighted_transcript(raw_text: str, detected_fillers: list) -> list:
    """
    Splits transcript into ordered text segments with filler metadata for clean frontend rendering.
    """
    if not raw_text:
        return []
    
    segments = []
    current_idx = 0

    for filler in detected_fillers:
        start = filler['start']
        end = filler['end']

        if start > current_idx:
            segments.append({
                'text': raw_text[current_idx:start],
                'is_filler': False
            })

        segments.append({
            'text': raw_text[start:end],
            'is_filler': True,
            'normalized': filler['normalized'],
            'type': filler['type'],
            'explanation': filler['explanation']
        })
        current_idx = end

    if current_idx < len(raw_text):
        segments.append({
            'text': raw_text[current_idx:],
            'is_filler': False
        })

    return segments


def analyze_nlp_text(text: str, duration_seconds: float = 0.0) -> dict:
    """
    Performs comprehensive NLP analysis on the user's spoken or typed transcript.
    """
    if not text or not text.strip():
        return {
            'word_count': 0,
            'words_per_minute': 0.0,
            'filler_word_count': 0,
            'filler_frequency_per_100_words': 0.0,
            'filler_breakdown': {},
            'detected_fillers': [],
            'highlighted_transcript': [],
            'repetition_count': 0,
            'repeated_phrases': [],
            'vague_expressions': [],
            'structure_components': {'intro': False, 'explanation': False, 'example': False, 'conclusion': False},
            'structure_score': 30.0
        }

    raw_text = text.strip()
    words = re.findall(r'\b[a-zA-Z0-9_\'-]+\b', raw_text.lower())
    word_count = len(words)

    # Words per minute calculation
    wpm = 0.0
    if duration_seconds > 2.0 and word_count > 0:
        wpm = round((word_count / duration_seconds) * 60, 1)

    # 1. Advanced Filler word detection with token spans
    detected_fillers = find_filler_occurrences(raw_text)
    total_fillers = len(detected_fillers)
    filler_breakdown = dict(Counter(f['normalized'] for f in detected_fillers))

    filler_frequency_per_100 = 0.0
    if word_count > 0:
        filler_frequency_per_100 = round((total_fillers / word_count) * 100, 1)

    highlighted_segments = generate_highlighted_transcript(raw_text, detected_fillers)

    # 2. Vague Expressions
    lower_text = raw_text.lower()
    vague_expressions = []
    for pattern in VAGUE_PATTERNS:
        matches = re.findall(pattern, lower_text)
        if matches:
            vague_clean = pattern.replace(r'\b', '').replace('\\', '').replace('\'?', "'")
            vague_expressions.append({
                'phrase': vague_clean,
                'count': len(matches)
            })

    # 3. Phrase Repetition (2-grams and 3-grams)
    stop_words = {'the', 'is', 'at', 'which', 'on', 'a', 'an', 'and', 'or', 'to', 'in', 'of', 'for', 'with', 'it', 'as'}
    repeated_phrases = []
    if word_count >= 6:
        # Check 2-grams
        bigrams = [' '.join(words[i:i+2]) for i in range(len(words)-1)]
        bigram_counts = Counter(bigrams)
        for phrase, count in bigram_counts.items():
            phrase_words = phrase.split()
            if count >= 3 and not all(w in stop_words for w in phrase_words):
                repeated_phrases.append({'phrase': phrase, 'count': count})

        # Check 3-grams
        trigrams = [' '.join(words[i:i+3]) for i in range(len(words)-2)]
        trigram_counts = Counter(trigrams)
        for phrase, count in trigram_counts.items():
            if count >= 2:
                repeated_phrases.append({'phrase': phrase, 'count': count})

    # 4. Structure Heuristics
    structure_found = {}
    structure_points = 0
    for comp, markers in STRUCTURAL_MARKERS.items():
        found = any(re.search(marker, lower_text) for marker in markers)
        if comp == 'explanation' and (' because ' in lower_text or ' since ' in lower_text or ' when ' in lower_text):
            found = True
        structure_found[comp] = found
        if found:
            structure_points += 20

    # Basic length & paragraph bonus
    if word_count >= 40:
        structure_points += 10
    if word_count >= 80:
        structure_points += 10

    structure_score = min(100.0, max(40.0, float(structure_points)))

    return {
        'word_count': word_count,
        'words_per_minute': wpm,
        'filler_word_count': total_fillers,
        'filler_frequency_per_100_words': filler_frequency_per_100,
        'filler_breakdown': filler_breakdown,
        'detected_fillers': detected_fillers,
        'highlighted_transcript': highlighted_segments,
        'repetition_count': len(repeated_phrases),
        'repeated_phrases': repeated_phrases,
        'vague_expressions': vague_expressions,
        'structure_components': structure_found,
        'structure_score': structure_score
    }
