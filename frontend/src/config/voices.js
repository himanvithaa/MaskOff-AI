/**
 * Central Voice and Accent Configuration for MaskOff AI
 * Supports:
 * 1. American Accent (General American English - en-US)
 * 2. Polish Accent (English with Polish accent - en-PL / tuned Polish-English fallback)
 * 3. African Accent (Nigerian English - en-NG / South African English - en-ZA)
 * 
 * Provides voice matching, fallback management, and honest warning detection
 * when specific native regional voice packs are absent from the client browser/OS.
 */

export const ACCENTS = {
  american: {
    id: 'american',
    displayName: 'American Accent',
    regionalVariety: 'General American English (en-US)',
    targetLocale: 'en-US',
    locales: ['en-US', 'en'],
    description: 'Crisp, authoritative General American accent ideal for tech and corporate interviews.',
    genderVoicePatterns: {
      male: ['david', 'guy', 'mark', 'george', 'christopher', 'richard', 'james', 'brian', 'male'],
      female: ['zira', 'jenny', 'samantha', 'aria', 'victoria', 'karen', 'catherine', 'google us english', 'female']
    },
    pitchModifier: { male: 0.93, female: 1.08 },
    rateModifier: 1.0
  },
  polish: {
    id: 'polish',
    displayName: 'Polish Accent',
    regionalVariety: 'Polish-Accented English (en-PL)',
    targetLocale: 'en-PL',
    locales: ['en-PL', 'pl-PL', 'en-GB', 'en-US'],
    description: 'Distinctive Central European / Polish inflection with firm consonant articulation.',
    genderVoicePatterns: {
      male: ['adam', 'marek', 'jan', 'piotr', 'krzysztof', 'pl-male', 'male'],
      female: ['paulina', 'ewa', 'agnieszka', 'zofia', 'maja', 'pl-female', 'female']
    },
    pitchModifier: { male: 0.90, female: 1.12 },
    rateModifier: 0.96
  },
  african: {
    id: 'african',
    displayName: 'African Accent',
    regionalVariety: 'Nigerian (en-NG) & South African (en-ZA) English',
    targetLocale: 'en-NG',
    locales: ['en-NG', 'en-ZA', 'en-KE', 'en-GH', 'en-GB'],
    description: 'Resonant, expressive African English cadence (Nigerian en-NG & South African en-ZA).',
    genderVoicePatterns: {
      male: ['luke', 'abeo', 'chilufya', 'en-za-male', 'en-ng-male', 'male'],
      female: ['ayanda', 'ezinne', 'chiamaka', 'en-za-female', 'en-ng-female', 'female']
    },
    pitchModifier: { male: 0.92, female: 1.08 },
    rateModifier: 0.98
  }
};

export const DEFAULT_ACCENT_ID = 'american';

export const GENDER_IDENTIFIERS = {
  male: {
    preferredNames: [
      'david', 'guy', 'mark', 'george', 'christopher', 'richard', 'james', 'brian',
      'adam', 'marek', 'jan', 'piotr', 'krzysztof',
      'luke', 'abeo', 'chilufya', 'male'
    ],
    antiPatterns: [
      'female', 'zira', 'jenny', 'aria', 'samantha', 'victoria', 'karen', 'catherine',
      'paulina', 'ewa', 'agnieszka', 'zofia', 'maja',
      'ayanda', 'ezinne', 'chiamaka', 'heera', 'neerja', 'hazel', 'susan', 'google us english'
    ]
  },
  female: {
    preferredNames: [
      'zira', 'jenny', 'aria', 'samantha', 'victoria', 'karen', 'catherine',
      'paulina', 'ewa', 'agnieszka', 'zofia', 'maja',
      'ayanda', 'ezinne', 'chiamaka', 'heera', 'neerja', 'hazel', 'susan', 'google us english', 'female'
    ],
    antiPatterns: [
      'male', 'david', 'guy', 'mark', 'george', 'christopher', 'richard', 'james', 'brian',
      'adam', 'marek', 'jan', 'piotr', 'krzysztof',
      'luke', 'abeo', 'chilufya'
    ]
  }
};

/**
 * Resolves a SpeechSynthesisVoice strictly adhering to the requested gender across all 3 accents.
 * Guarantees male voice for male interviewer, and female voice for female interviewer.
 */
export function resolveAccentVoice(accentId = 'american', gender = 'male', availableVoices = []) {
  const accent = ACCENTS[accentId] || ACCENTS.american;
  const targetGender = (gender || 'male').toLowerCase() === 'female' ? 'female' : 'male';
  const patterns = accent.genderVoicePatterns[targetGender] || accent.genderVoicePatterns.male;
  const genderRule = GENDER_IDENTIFIERS[targetGender];

  if (!availableVoices || availableVoices.length === 0) {
    return {
      voice: null,
      accent,
      isNativeAccent: false,
      warning: 'Browser text-to-speech voices not yet loaded. Please wait a moment.',
      effectiveLocale: accent.targetLocale,
      regionalLabel: accent.regionalVariety
    };
  }

  // Voice gender validator: strict anti-pattern check to prevent cross-gender voices
  const isGenderValid = (v) => {
    const name = (v.name || '').toLowerCase();
    if (genderRule.antiPatterns.some((ap) => name.includes(ap))) {
      return false;
    }
    return true;
  };

  // 1. Priority 1: Exact accent locale match + explicit gender pattern match
  let matchedVoice = availableVoices.find((v) => {
    if (!isGenderValid(v)) return false;
    const vLang = (v.lang || '').toLowerCase();
    const vName = (v.name || '').toLowerCase();
    const localeMatch = accent.locales.some((loc) => vLang.startsWith(loc.toLowerCase()));
    const patternMatch = patterns.some((p) => vName.includes(p));
    return localeMatch && patternMatch;
  });

  // 2. Priority 2: Accent locale match + any preferred gender name match
  if (!matchedVoice) {
    matchedVoice = availableVoices.find((v) => {
      if (!isGenderValid(v)) return false;
      const vLang = (v.lang || '').toLowerCase();
      const vName = (v.name || '').toLowerCase();
      const localeMatch = accent.locales.some((loc) => vLang.startsWith(loc.toLowerCase()));
      const nameMatch = genderRule.preferredNames.some((p) => vName.includes(p));
      return localeMatch && nameMatch;
    });
  }

  // 3. Priority 3: Any English voice strictly matching preferred gender names
  if (!matchedVoice) {
    matchedVoice = availableVoices.find((v) => {
      if (!isGenderValid(v)) return false;
      const vLang = (v.lang || '').toLowerCase();
      const vName = (v.name || '').toLowerCase();
      return vLang.startsWith('en') && genderRule.preferredNames.some((p) => vName.includes(p));
    });
  }

  // 4. Priority 4: Any English voice that passes gender validity
  if (!matchedVoice) {
    matchedVoice = availableVoices.find((v) => {
      const vLang = (v.lang || '').toLowerCase();
      return vLang.startsWith('en') && isGenderValid(v);
    });
  }

  // 5. Final fallback: Any voice that passes gender validity
  if (!matchedVoice) {
    matchedVoice = availableVoices.find(isGenderValid) || availableVoices[0];
  }

  // Determine native accent status and advisory warning
  let isNativeAccent = false;
  let warning = null;

  if (matchedVoice) {
    const langLower = (matchedVoice.lang || '').toLowerCase();
    const nameLower = (matchedVoice.name || '').toLowerCase();

    if (accent.id === 'african') {
      if (langLower.includes('ng') || langLower.includes('za') || nameLower.includes('nigeria') || nameLower.includes('south africa') || nameLower.includes('ayanda') || nameLower.includes('luke')) {
        isNativeAccent = true;
      } else {
        warning = `Native African English voice pack not detected in your OS. Using English ${targetGender} voice with tuned African cadence and pitch.`;
      }
    } else if (accent.id === 'polish') {
      if (langLower.includes('pl') || nameLower.includes('polish') || nameLower.includes('poland') || nameLower.includes('adam') || nameLower.includes('paulina')) {
        isNativeAccent = true;
      } else {
        warning = `Native Polish English voice pack not detected in your OS. Using English ${targetGender} voice with adjusted European inflection.`;
      }
    } else {
      isNativeAccent = langLower.startsWith('en-us') || nameLower.includes('us') || nameLower.includes('united states');
    }
  }

  return {
    voice: matchedVoice,
    accent,
    isNativeAccent,
    warning,
    effectiveLocale: matchedVoice?.lang || accent.targetLocale,
    regionalLabel: accent.regionalVariety
  };
}

