/**
 * Verification test script for all 16 Interviewer Persona x Gender combinations.
 * Tests:
 * 1. 8 Personas x 2 Genders = 16 Distinct Identities
 * 2. 16:9 Video Asset mapping (male-interviewer.mp4 vs female-interviewer.mp4)
 * 3. Default Indian Names match the table exactly
 * 4. Voice Gender synchronization across all 3 Accents (American, Polish, African)
 * 5. Text sanitization, AI introductions & Live Caption speaker matching
 */

import { PERSONAS_CONFIG, ALL_PERSONAS, getPersonaConfig, getInterviewer, formatInterviewerText } from './src/config/interviewers.js';
import { ACCENTS, resolveAccentVoice } from './src/config/voices.js';

const EXPECTED_IDENTITIES = [
  { personaKey: 'strict-professor', title: 'Strict Professor', maleName: 'Arjun', femaleName: 'Ananya' },
  { personaKey: 'technical-interviewer', title: 'Technical Interviewer', maleName: 'Vikram', femaleName: 'Meera' },
  { personaKey: 'hr-interviewer', title: 'HR Interviewer', maleName: 'Rahul', femaleName: 'Priya' },
  { personaKey: 'skeptical-examiner', title: 'Skeptical Examiner', maleName: 'Aditya', femaleName: 'Kavya' },
  { personaKey: 'strict-manager', title: 'Strict Manager', maleName: 'Karan', femaleName: 'Neha' },
  { personaKey: 'devils-advocate', title: "Devil's Advocate", maleName: 'Rohan', femaleName: 'Ishita' },
  { personaKey: 'curious-audience', title: 'Curious Audience', maleName: 'Aarav', femaleName: 'Diya' },
  { personaKey: 'supportive-mentor', title: 'Supportive Mentor', maleName: 'Krishna', femaleName: 'Nandini' }
];

console.log('--- TESTING 8 PERSONAS x 2 GENDERS (16 IDENTITIES) ---');

let totalTested = 0;
let passedCount = 0;

EXPECTED_IDENTITIES.forEach((exp) => {
  const pConfig = PERSONAS_CONFIG[exp.personaKey];
  if (!pConfig) {
    throw new Error(`Missing persona config for: ${exp.personaKey}`);
  }

  // 1. Check Male Identity
  totalTested++;
  const male = pConfig.male;
  if (male.name !== exp.maleName) throw new Error(`Expected male name ${exp.maleName}, got ${male.name}`);
  if (male.gender !== 'Male') throw new Error(`Expected male gender, got ${male.gender}`);
  if (male.voiceGender !== 'male') throw new Error(`Expected male voiceGender, got ${male.voiceGender}`);
  if (male.video !== '/interviewers/male-interviewer.mp4') throw new Error(`Expected male video asset, got ${male.video}`);
  passedCount++;

  // 2. Check Female Identity
  totalTested++;
  const female = pConfig.female;
  if (female.name !== exp.femaleName) throw new Error(`Expected female name ${exp.femaleName}, got ${female.name}`);
  if (female.gender !== 'Female') throw new Error(`Expected female gender, got ${female.gender}`);
  if (female.voiceGender !== 'female') throw new Error(`Expected female voiceGender, got ${female.voiceGender}`);
  if (female.video !== '/interviewers/female-interviewer.mp4') throw new Error(`Expected female video asset, got ${female.video}`);
  passedCount++;

  console.log(`✓ ${exp.title}: Male = ${male.name} [${male.video}], Female = ${female.name} [${female.video}]`);
});

console.log(`\nAll 16 Persona Identities Verified (${passedCount}/${totalTested})`);

// 3. Test getInterviewer resolution
console.log('\n--- TESTING GET_INTERVIEWER RESOLUTION ---');
const tests = [
  { query: 'Arjun', expectedName: 'Arjun', expectedGender: 'Male' },
  { query: 'Ananya', expectedName: 'Ananya', expectedGender: 'Female' },
  { query: 'Vikram', expectedName: 'Vikram', expectedGender: 'Male' },
  { query: 'Meera', expectedName: 'Meera', expectedGender: 'Female' },
  { query: 'Rahul', expectedName: 'Rahul', expectedGender: 'Male' },
  { query: 'Priya', expectedName: 'Priya', expectedGender: 'Female' },
  { query: 'Aditya', expectedName: 'Aditya', expectedGender: 'Male' },
  { query: 'Kavya', expectedName: 'Kavya', expectedGender: 'Female' },
  { query: 'Karan', expectedName: 'Karan', expectedGender: 'Male' },
  { query: 'Neha', expectedName: 'Neha', expectedGender: 'Female' },
  { query: 'Rohan', expectedName: 'Rohan', expectedGender: 'Male' },
  { query: 'Ishita', expectedName: 'Ishita', expectedGender: 'Female' },
  { query: 'Aarav', expectedName: 'Aarav', expectedGender: 'Male' },
  { query: 'Diya', expectedName: 'Diya', expectedGender: 'Female' },
  { query: 'Krishna', expectedName: 'Krishna', expectedGender: 'Male' },
  { query: 'Nandini', expectedName: 'Nandini', expectedGender: 'Female' },
  // Persona Key + Gender
  { query: 'technical-interviewer', gender: 'female', expectedName: 'Meera', expectedGender: 'Female' },
  { query: 'strict-professor', gender: 'female', expectedName: 'Ananya', expectedGender: 'Female' },
  { query: 'hr-interviewer', gender: 'male', expectedName: 'Rahul', expectedGender: 'Male' },
  { query: 'supportive-mentor', gender: 'female', expectedName: 'Nandini', expectedGender: 'Female' },
];

tests.forEach((t) => {
  const resolved = getInterviewer(t.query, t.gender);
  if (resolved.name !== t.expectedName) {
    throw new Error(`getInterviewer('${t.query}', '${t.gender}') expected ${t.expectedName}, got ${resolved.name}`);
  }
  if (resolved.gender !== t.expectedGender) {
    throw new Error(`getInterviewer('${t.query}', '${t.gender}') expected ${t.expectedGender}, got ${resolved.gender}`);
  }
  console.log(`✓ Resolved "${t.query}" (${t.gender || 'default'}) -> ${resolved.name} [${resolved.gender}, ${resolved.role}]`);
});

// 4. Test formatInterviewerText for introductions and captions
console.log('\n--- TESTING GREETINGS & INTRODUCTIONS ---');
const sampleOpening = "Hello, I am Vikram, your Strict Technical Interviewer for this System Design session. We will examine your reasoning, structure, and communication clarity under pressure.";

EXPECTED_IDENTITIES.forEach((exp) => {
  const male = PERSONAS_CONFIG[exp.personaKey].male;
  const female = PERSONAS_CONFIG[exp.personaKey].female;

  const maleSanitized = formatInterviewerText(sampleOpening, male);
  if (!maleSanitized.includes(`Hello, I am ${male.name}, your ${male.role} for this System Design session.`)) {
    throw new Error(`Male format failed: ${maleSanitized}`);
  }

  const femaleSanitized = formatInterviewerText(sampleOpening, female);
  if (!femaleSanitized.includes(`Hello, I am ${female.name}, your ${female.role} for this System Design session.`)) {
    throw new Error(`Female format failed: ${femaleSanitized}`);
  }

  console.log(`✓ [${exp.title}] Intro formatted -> Male: "${male.name}" | Female: "${female.name}"`);
});

// 5. Test Voice Synchronization with Accents (Mock browser voices)
console.log('\n--- TESTING VOICE ACCENT & GENDER SYNCHRONIZATION ---');
const mockBrowserVoices = [
  { name: 'Microsoft David Desktop - English (United States)', lang: 'en-US' },
  { name: 'Microsoft Zira Desktop - English (United States)', lang: 'en-US' },
  { name: 'Google US English', lang: 'en-US' },
  { name: 'Google UK English Male', lang: 'en-GB' },
  { name: 'Google UK English Female', lang: 'en-GB' },
  { name: 'Microsoft Paulina Desktop - Polish (Poland)', lang: 'pl-PL' },
  { name: 'Microsoft Adam Desktop - Polish (Poland)', lang: 'pl-PL' },
  { name: 'English South Africa Male', lang: 'en-ZA' },
  { name: 'English South Africa Female', lang: 'en-ZA' },
];

['american', 'polish', 'african'].forEach((accentId) => {
  // Test Male resolution
  const maleResult = resolveAccentVoice(accentId, 'male', mockBrowserVoices);
  const maleVoice = maleResult.voice;
  const maleNameLower = (maleVoice?.name || '').toLowerCase();
  const isFemaleLeak = maleNameLower.includes('zira') || maleNameLower.includes('paulina') || (maleNameLower.includes('female') && !maleNameLower.includes('male'));
  if (isFemaleLeak) {
    throw new Error(`Male voice resolved to female voice in ${accentId}: ${maleVoice?.name}`);
  }

  // Test Female resolution
  const femaleResult = resolveAccentVoice(accentId, 'female', mockBrowserVoices);
  const femaleVoice = femaleResult.voice;
  const femaleNameLower = (femaleVoice?.name || '').toLowerCase();
  const isMaleLeak = (femaleNameLower.includes('david') || femaleNameLower.includes('adam')) && !femaleNameLower.includes('female');
  if (isMaleLeak) {
    throw new Error(`Female voice resolved to male voice in ${accentId}: ${femaleVoice?.name}`);
  }

  console.log(`✓ Accent [${accentId.toUpperCase()}]: Male Voice = "${maleVoice?.name}" | Female Voice = "${femaleVoice?.name}"`);
});

console.log('\n======================================================');
console.log('ALL 16 INTERVIEWER PERSONA x GENDER COMBINATIONS PASS!');
console.log('======================================================');
