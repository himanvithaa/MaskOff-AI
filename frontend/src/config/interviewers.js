/**
 * Central Interviewer & Persona Configuration
 * Single source of truth for the 8 essential personas, gender-based interviewer identities,
 * 16:9 video assets, voice profiles, and system directives across the MaskOff AI platform.
 */

export const PERSONAS_CONFIG = {
  'strict-professor': {
    id: 'strict-professor',
    key: 'strict-professor',
    title: 'Strict Professor',
    category: 'Academic / Theoretical',
    description: 'Challenges explanations, asks difficult conceptual questions, and demands theoretical justification.',
    focus: 'Theoretical depth, mathematical/logical justification, edge cases, algorithmic invariants',
    icon: 'GraduationCap',
    male: {
      id: 'strict-professor-male',
      key: 'strict-professor-male',
      personaKey: 'strict-professor',
      name: 'Arjun',
      gender: 'Male',
      role: 'Strict Professor',
      title: 'Arjun – Strict Professor',
      video: '/interviewers/male-interviewer.mp4',
      legacyVideo: '/interviewers/arjun-speaking.mp4',
      description: 'Demanding academic examiner who scrutinizes conceptual fundamentals, mathematical proofs, and theoretical rigor.',
      voiceGender: 'male',
      pitch: 0.95,
      rate: 1.0,
      badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      accentColor: 'text-indigo-600',
      focus: 'Theoretical depth, mathematical/logical justification, edge cases'
    },
    female: {
      id: 'strict-professor-female',
      key: 'strict-professor-female',
      personaKey: 'strict-professor',
      name: 'Ananya',
      gender: 'Female',
      role: 'Strict Professor',
      title: 'Ananya – Strict Professor',
      video: '/interviewers/female-interviewer.mp4',
      legacyVideo: '/interviewers/ananya-speaking.mp4',
      description: 'Demanding academic examiner who scrutinizes conceptual fundamentals, mathematical proofs, and theoretical rigor.',
      voiceGender: 'female',
      pitch: 1.05,
      rate: 1.0,
      badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      accentColor: 'text-indigo-600',
      focus: 'Theoretical depth, mathematical/logical justification, edge cases'
    }
  },

  'technical-interviewer': {
    id: 'technical-interviewer',
    key: 'technical-interviewer',
    title: 'Technical Interviewer',
    category: 'Engineering / Architecture',
    description: 'Evaluates programming and technical knowledge, asking practical implementation questions.',
    focus: 'Algorithmic efficiency, clean code, architecture patterns, trade-offs',
    icon: 'Terminal',
    male: {
      id: 'technical-interviewer-male',
      key: 'technical-interviewer-male',
      personaKey: 'technical-interviewer',
      name: 'Vikram',
      gender: 'Male',
      role: 'Technical Interviewer',
      title: 'Vikram – Technical Interviewer',
      video: '/interviewers/male-interviewer.mp4',
      legacyVideo: '/interviewers/arjun-speaking.mp4',
      description: 'Hands-on engineering lead who tests code logic, data structures, and concrete production architecture.',
      voiceGender: 'male',
      pitch: 0.95,
      rate: 1.0,
      badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
      accentColor: 'text-blue-600',
      focus: 'Algorithmic efficiency, clean code, architecture patterns, trade-offs'
    },
    female: {
      id: 'technical-interviewer-female',
      key: 'technical-interviewer-female',
      personaKey: 'technical-interviewer',
      name: 'Meera',
      gender: 'Female',
      role: 'Technical Interviewer',
      title: 'Meera – Technical Interviewer',
      video: '/interviewers/female-interviewer.mp4',
      legacyVideo: '/interviewers/ananya-speaking.mp4',
      description: 'Hands-on engineering lead who tests code logic, data structures, and concrete production architecture.',
      voiceGender: 'female',
      pitch: 1.05,
      rate: 1.0,
      badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
      accentColor: 'text-blue-600',
      focus: 'Algorithmic efficiency, clean code, architecture patterns, trade-offs'
    }
  },

  'hr-interviewer': {
    id: 'hr-interviewer',
    key: 'hr-interviewer',
    title: 'HR Interviewer',
    category: 'Behavioral / Culture',
    description: 'Asks behavioral and situational questions, evaluating communication composure and leadership qualities.',
    focus: 'STAR framework, conflict resolution, emotional composure, values alignment',
    icon: 'Briefcase',
    male: {
      id: 'hr-interviewer-male',
      key: 'hr-interviewer-male',
      personaKey: 'hr-interviewer',
      name: 'Rahul',
      gender: 'Male',
      role: 'HR Interviewer',
      title: 'Rahul – HR Interviewer',
      video: '/interviewers/male-interviewer.mp4',
      legacyVideo: '/interviewers/arjun-speaking.mp4',
      description: 'People and culture strategist who assesses emotional intelligence, collaboration, and high-pressure composure.',
      voiceGender: 'male',
      pitch: 0.95,
      rate: 1.0,
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      accentColor: 'text-emerald-600',
      focus: 'STAR framework, conflict resolution, emotional composure, values alignment'
    },
    female: {
      id: 'hr-interviewer-female',
      key: 'hr-interviewer-female',
      personaKey: 'hr-interviewer',
      name: 'Priya',
      gender: 'Female',
      role: 'HR Interviewer',
      title: 'Priya – HR Interviewer',
      video: '/interviewers/female-interviewer.mp4',
      legacyVideo: '/interviewers/ananya-speaking.mp4',
      description: 'People and culture strategist who assesses emotional intelligence, collaboration, and high-pressure composure.',
      voiceGender: 'female',
      pitch: 1.05,
      rate: 1.0,
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      accentColor: 'text-emerald-600',
      focus: 'STAR framework, conflict resolution, emotional composure, values alignment'
    }
  },

  'skeptical-examiner': {
    id: 'skeptical-examiner',
    key: 'skeptical-examiner',
    title: 'Skeptical Examiner',
    category: 'Critical Review / Defense',
    description: 'Questions assumptions, identifies contradictions, and demands concrete supporting evidence.',
    focus: 'Logical consistency, unstated premises, statistical evidence, falsification',
    icon: 'Search',
    male: {
      id: 'skeptical-examiner-male',
      key: 'skeptical-examiner-male',
      personaKey: 'skeptical-examiner',
      name: 'Aditya',
      gender: 'Male',
      role: 'Skeptical Examiner',
      title: 'Aditya – Skeptical Examiner',
      video: '/interviewers/male-interviewer.mp4',
      legacyVideo: '/interviewers/arjun-speaking.mp4',
      description: 'Inquisitive auditor who stress-tests premises, probes vulnerabilities, and rejects unverified claims.',
      voiceGender: 'male',
      pitch: 0.95,
      rate: 1.0,
      badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
      accentColor: 'text-amber-600',
      focus: 'Logical consistency, unstated premises, statistical evidence, falsification'
    },
    female: {
      id: 'skeptical-examiner-female',
      key: 'skeptical-examiner-female',
      personaKey: 'skeptical-examiner',
      name: 'Kavya',
      gender: 'Female',
      role: 'Skeptical Examiner',
      title: 'Kavya – Skeptical Examiner',
      video: '/interviewers/female-interviewer.mp4',
      legacyVideo: '/interviewers/ananya-speaking.mp4',
      description: 'Inquisitive auditor who stress-tests premises, probes vulnerabilities, and rejects unverified claims.',
      voiceGender: 'female',
      pitch: 1.05,
      rate: 1.0,
      badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
      accentColor: 'text-amber-600',
      focus: 'Logical consistency, unstated premises, statistical evidence, falsification'
    }
  },

  'strict-manager': {
    id: 'strict-manager',
    key: 'strict-manager',
    title: 'Strict Manager',
    category: 'Operations / Delivery',
    description: 'Challenges decisions, asks about accountability, deadlines, operational costs, and measurable outcomes.',
    focus: 'Execution velocity, ROI, SLA reliability, contingency management',
    icon: 'ShieldAlert',
    male: {
      id: 'strict-manager-male',
      key: 'strict-manager-male',
      personaKey: 'strict-manager',
      name: 'Karan',
      gender: 'Male',
      role: 'Strict Manager',
      title: 'Karan – Strict Manager',
      video: '/interviewers/male-interviewer.mp4',
      legacyVideo: '/interviewers/arjun-speaking.mp4',
      description: 'Result-oriented manager who focuses on deadlines, team deliverables, budgets, and operational risk.',
      voiceGender: 'male',
      pitch: 0.95,
      rate: 1.0,
      badgeColor: 'bg-rose-50 text-rose-700 border-rose-200',
      accentColor: 'text-rose-600',
      focus: 'Execution velocity, ROI, SLA reliability, contingency management'
    },
    female: {
      id: 'strict-manager-female',
      key: 'strict-manager-female',
      personaKey: 'strict-manager',
      name: 'Neha',
      gender: 'Female',
      role: 'Strict Manager',
      title: 'Neha – Strict Manager',
      video: '/interviewers/female-interviewer.mp4',
      legacyVideo: '/interviewers/ananya-speaking.mp4',
      description: 'Result-oriented manager who focuses on deadlines, team deliverables, budgets, and operational risk.',
      voiceGender: 'female',
      pitch: 1.05,
      rate: 1.0,
      badgeColor: 'bg-rose-50 text-rose-700 border-rose-200',
      accentColor: 'text-rose-600',
      focus: 'Execution velocity, ROI, SLA reliability, contingency management'
    }
  },

  'devils-advocate': {
    id: 'devils-advocate',
    key: 'devils-advocate',
    title: "Devil's Advocate",
    category: 'Debate / Sparring',
    description: 'Takes opposing positions, challenges arguments, and tests logical reasoning under intellectual tension.',
    focus: 'Counter-arguments, edge-case invalidation, dialectical reasoning',
    icon: 'Flame',
    male: {
      id: 'devils-advocate-male',
      key: 'devils-advocate-male',
      personaKey: 'devils-advocate',
      name: 'Rohan',
      gender: 'Male',
      role: "Devil's Advocate",
      title: "Rohan – Devil's Advocate",
      video: '/interviewers/male-interviewer.mp4',
      legacyVideo: '/interviewers/arjun-speaking.mp4',
      description: 'Provocative sparring partner who challenges any consensus, presents strong counter-evidence, and demands debate.',
      voiceGender: 'male',
      pitch: 0.95,
      rate: 1.0,
      badgeColor: 'bg-orange-50 text-orange-700 border-orange-200',
      accentColor: 'text-orange-600',
      focus: 'Counter-arguments, edge-case invalidation, dialectical reasoning'
    },
    female: {
      id: 'devils-advocate-female',
      key: 'devils-advocate-female',
      personaKey: 'devils-advocate',
      name: 'Ishita',
      gender: 'Female',
      role: "Devil's Advocate",
      title: "Ishita – Devil's Advocate",
      video: '/interviewers/female-interviewer.mp4',
      legacyVideo: '/interviewers/ananya-speaking.mp4',
      description: 'Provocative sparring partner who challenges any consensus, presents strong counter-evidence, and demands debate.',
      voiceGender: 'female',
      pitch: 1.05,
      rate: 1.0,
      badgeColor: 'bg-orange-50 text-orange-700 border-orange-200',
      accentColor: 'text-orange-600',
      focus: 'Counter-arguments, edge-case invalidation, dialectical reasoning'
    }
  },

  'curious-audience': {
    id: 'curious-audience',
    key: 'curious-audience',
    title: 'Curious Audience',
    category: 'Public Speaking / Keynote',
    description: 'Asks unexpected presentation questions, requesting simple explanations and intuitive analogies.',
    focus: 'Accessibility, clear storytelling, analogies, handling non-technical inquiries',
    icon: 'Users',
    male: {
      id: 'curious-audience-male',
      key: 'curious-audience-male',
      personaKey: 'curious-audience',
      name: 'Aarav',
      gender: 'Male',
      role: 'Curious Audience',
      title: 'Aarav – Curious Audience',
      video: '/interviewers/male-interviewer.mp4',
      legacyVideo: '/interviewers/arjun-speaking.mp4',
      description: 'Engaged attendee who asks intuitive, unexpected questions to test whether concepts can be explained without jargon.',
      voiceGender: 'male',
      pitch: 0.95,
      rate: 1.0,
      badgeColor: 'bg-teal-50 text-teal-700 border-teal-200',
      accentColor: 'text-teal-600',
      focus: 'Accessibility, clear storytelling, analogies, handling non-technical inquiries'
    },
    female: {
      id: 'curious-audience-female',
      key: 'curious-audience-female',
      personaKey: 'curious-audience',
      name: 'Diya',
      gender: 'Female',
      role: 'Curious Audience',
      title: 'Diya – Curious Audience',
      video: '/interviewers/female-interviewer.mp4',
      legacyVideo: '/interviewers/ananya-speaking.mp4',
      description: 'Engaged attendee who asks intuitive, unexpected questions to test whether concepts can be explained without jargon.',
      voiceGender: 'female',
      pitch: 1.05,
      rate: 1.0,
      badgeColor: 'bg-teal-50 text-teal-700 border-teal-200',
      accentColor: 'text-teal-600',
      focus: 'Accessibility, clear storytelling, analogies, handling non-technical inquiries'
    }
  },

  'supportive-mentor': {
    id: 'supportive-mentor',
    key: 'supportive-mentor',
    title: 'Supportive Mentor',
    category: 'Coaching / Growth',
    description: 'Gives constructive guidance, encourages retry, and explains mistakes empathetically.',
    focus: 'Confidence building, PREP structure, reframing, iterative improvement',
    icon: 'Sparkles',
    male: {
      id: 'supportive-mentor-male',
      key: 'supportive-mentor-male',
      personaKey: 'supportive-mentor',
      name: 'Krishna',
      gender: 'Male',
      role: 'Supportive Mentor',
      title: 'Krishna – Supportive Mentor',
      video: '/interviewers/male-interviewer.mp4',
      legacyVideo: '/interviewers/arjun-speaking.mp4',
      description: 'Encouraging mentor who creates a safe learning environment while fostering structured, impactful delivery.',
      voiceGender: 'male',
      pitch: 0.95,
      rate: 1.0,
      badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
      accentColor: 'text-purple-600',
      focus: 'Confidence building, PREP structure, reframing, iterative improvement'
    },
    female: {
      id: 'supportive-mentor-female',
      key: 'supportive-mentor-female',
      personaKey: 'supportive-mentor',
      name: 'Nandini',
      gender: 'Female',
      role: 'Supportive Mentor',
      title: 'Nandini – Supportive Mentor',
      video: '/interviewers/female-interviewer.mp4',
      legacyVideo: '/interviewers/ananya-speaking.mp4',
      description: 'Encouraging mentor who creates a safe learning environment while fostering structured, impactful delivery.',
      voiceGender: 'female',
      pitch: 1.05,
      rate: 1.0,
      badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
      accentColor: 'text-purple-600',
      focus: 'Confidence building, PREP structure, reframing, iterative improvement'
    }
  }
};

export const ALL_PERSONAS = Object.values(PERSONAS_CONFIG);
export const DEFAULT_PERSONA_ID = 'technical-interviewer';
export const DEFAULT_GENDER = 'male';

/**
 * Backward-compatible interviewers object referencing the primary male and female profiles.
 */
export const interviewers = {
  male: PERSONAS_CONFIG['strict-professor'].male,
  female: PERSONAS_CONFIG['strict-professor'].female,
};

export const INTERVIEWERS = interviewers;
export const DEFAULT_INTERVIEWER_ID = 'male';

/**
 * Helper to retrieve a persona definition by id or partial name.
 */
export function getPersonaConfig(personaKeyOrName) {
  if (!personaKeyOrName) return PERSONAS_CONFIG['strict-professor'];
  const clean = personaKeyOrName.toString().toLowerCase().trim();

  // Direct key lookup
  if (PERSONAS_CONFIG[clean]) return PERSONAS_CONFIG[clean];

  // Primary defaults
  if (clean === 'female' || clean === 'male' || clean === 'default') {
    return PERSONAS_CONFIG['strict-professor'];
  }

  // Fuzzy match on persona title / keywords
  if (clean.includes('professor') || clean.includes('strict professor') || clean.includes('arjun') || clean.includes('ananya') || clean.includes('academic') || clean.includes('professional')) {
    return PERSONAS_CONFIG['strict-professor'];
  }
  if (clean.includes('technical') || clean.includes('vikram') || clean.includes('meera') || clean.includes('code') || clean.includes('programming')) {
    return PERSONAS_CONFIG['technical-interviewer'];
  }
  if (clean.includes('hr') || clean.includes('behavioral') || clean.includes('rahul') || clean.includes('priya')) {
    return PERSONAS_CONFIG['hr-interviewer'];
  }
  if (clean.includes('skeptical') || clean.includes('examiner') || clean.includes('aditya') || clean.includes('kavya')) {
    return PERSONAS_CONFIG['skeptical-examiner'];
  }
  if (clean.includes('manager') || clean.includes('karan') || clean.includes('neha')) {
    return PERSONAS_CONFIG['strict-manager'];
  }
  if (clean.includes('devil') || clean.includes('rohan') || clean.includes('ishita') || clean.includes('sparring')) {
    return PERSONAS_CONFIG['devils-advocate'];
  }
  if (clean.includes('audience') || clean.includes('curious') || clean.includes('aarav') || clean.includes('diya')) {
    return PERSONAS_CONFIG['curious-audience'];
  }
  if (clean.includes('mentor') || clean.includes('supportive') || clean.includes('krishna') || clean.includes('nandini')) {
    return PERSONAS_CONFIG['supportive-mentor'];
  }

  return PERSONAS_CONFIG['strict-professor'];
}

const NAME_TO_PERSONA = {
  arjun: 'strict-professor',
  ananya: 'strict-professor',
  vikram: 'technical-interviewer',
  meera: 'technical-interviewer',
  rahul: 'hr-interviewer',
  priya: 'hr-interviewer',
  aditya: 'skeptical-examiner',
  kavya: 'skeptical-examiner',
  karan: 'strict-manager',
  neha: 'strict-manager',
  rohan: 'devils-advocate',
  ishita: 'devils-advocate',
  aarav: 'curious-audience',
  diya: 'curious-audience',
  krishna: 'supportive-mentor',
  nandini: 'supportive-mentor'
};

const NAME_NATURAL_GENDER = {
  arjun: 'male', ananya: 'female',
  vikram: 'male', meera: 'female',
  rahul: 'male', priya: 'female',
  aditya: 'male', kavya: 'female',
  karan: 'male', neha: 'female',
  rohan: 'male', ishita: 'female',
  aarav: 'male', diya: 'female',
  krishna: 'male', nandini: 'female'
};

/**
 * Helper to resolve an interviewer configuration from persona, gender, name, or legacy ID.
 * Supports:
 * - getInterviewer('technical-interviewer', 'female') => Meera
 * - getInterviewer('Priya') => Priya
 * - getInterviewer('female') => Ananya / default female
 * - getInterviewer('male') => Arjun / default male
 */
export function getInterviewer(idOrKeyOrPersona, genderPreference = null) {
  if (!idOrKeyOrPersona && !genderPreference) {
    return PERSONAS_CONFIG['strict-professor'].male;
  }

  // If already an interviewer profile object with name and role
  if (typeof idOrKeyOrPersona === 'object' && idOrKeyOrPersona?.name && idOrKeyOrPersona?.video) {
    return idOrKeyOrPersona;
  }

  const str = (idOrKeyOrPersona || '').toString().toLowerCase().trim();
  const genderHint = (genderPreference || '').toString().toLowerCase().trim();

  // Name-specific lookups (checks if any of the 16 Indian names is in str)
  for (const [name, pKey] of Object.entries(NAME_TO_PERSONA)) {
    if (str.includes(name)) {
      const effectiveGender = genderHint === 'male' || genderHint === 'female' 
        ? genderHint 
        : NAME_NATURAL_GENDER[name];
      return effectiveGender === 'female' ? PERSONAS_CONFIG[pKey].female : PERSONAS_CONFIG[pKey].male;
    }
  }

  // Resolve target persona
  const persona = getPersonaConfig(str);

  // Determine gender
  let isFemale = false;
  if (genderHint === 'female' || str.endsWith('-female') || str === 'female' || str.includes('female')) {
    isFemale = true;
  } else if (genderHint === 'male' || str.endsWith('-male') || str === 'male' || str.includes('male')) {
    isFemale = false;
  }

  return isFemale ? persona.female : persona.male;
}

/**
 * Sanitizes and synchronizes any interviewer speech, thread, or caption text
 * to strictly ensure the name and role match the active interviewer.
 */
export function formatInterviewerText(text, interviewerOrGender) {
  if (!text) return '';
  const interviewer = typeof interviewerOrGender === 'object' && interviewerOrGender?.name
    ? interviewerOrGender
    : getInterviewer(interviewerOrGender);

  const name = interviewer.name;
  const role = interviewer.role;

  // 1. Replace opening session introductions
  let sanitized = text.replace(
    /Hello,\s+I\s+am\s+[^,.]+,?\s+your\s+.*?for\s+this\s+(.*?)\s+session\./i,
    (m, sTitle) => `Hello, I am ${name}, your ${role} for this ${sTitle.trim()} session.`
  );

  // 2. Replace simple opening greetings without session
  sanitized = sanitized.replace(
    /Hello,\s+I\s+am\s+[^,.]+,?\s+your\s+[^.]*?\./i,
    (m) => {
      if (m.includes('session.')) return m;
      return `Hello, I am ${name}, your ${role}.`;
    }
  );

  // 3. Standalone self-introductions in mid-text e.g. "I am [X], your [Y]."
  sanitized = sanitized.replace(
    /(?<!Hello,\s+)\bI\s+am\s+(?:Arjun|Ananya|Vikram|Meera|Rahul|Priya|Aditya|Kavya|Karan|Neha|Rohan|Ishita|Aarav|Diya|Krishna|Nandini)[^,.]*?,?\s+your\s+(?:[A-Za-z\s'’]+?)(?=\s+for|\.|\band\b|,|$)/gi,
    `I am ${name}, your ${role}`
  );

  // 4. Any remaining self-identifications: "I am [OldName]" or "My name is [OldName]"
  sanitized = sanitized.replace(
    /\b(?:I\s+am|My\s+name\s+is)\s+(?:Arjun|Ananya|Vikram|Meera|Rahul|Priya|Aditya|Kavya|Karan|Neha|Rohan|Ishita|Aarav|Diya|Krishna|Nandini)\b/gi,
    `I am ${name}`
  );

  return sanitized;
}
