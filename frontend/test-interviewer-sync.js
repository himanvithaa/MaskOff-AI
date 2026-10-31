import { formatInterviewerText, getInterviewer } from './src/config/interviewers.js';
import { resolveAccentVoice, ACCENTS } from './src/config/voices.js';

console.log('--- TESTING INTERVIEWER NAME & VOICE MATCHING ---');

// Mock voice catalog with mixed genders and locales
const voicesCatalog = [
  { name: 'Microsoft David Desktop - English (United States)', lang: 'en-US' },
  { name: 'Microsoft Zira Desktop - English (United States)', lang: 'en-US' },
  { name: 'Microsoft Mark - English (United States)', lang: 'en-US' },
  { name: 'Microsoft Paulina - Polish (Poland)', lang: 'pl-PL' },
  { name: 'Microsoft Adam - Polish (Poland)', lang: 'pl-PL' },
  { name: 'Microsoft Ayanda Online (Natural) - English (South Africa)', lang: 'en-ZA' },
  { name: 'Microsoft Luke Online (Natural) - English (South Africa)', lang: 'en-ZA' }
];

// Test 1: Ananya (Female) text formatting on the exact screenshot string
const rawTextFromScreenshot = (
  'Hello, I am Vikram, your Strict Technical Interviewer for this College Viva Voce Defense session. ' +
  'We will examine your reasoning, structure, and communication clarity under pressure. Welcome candidate. ' +
  'Let\'s get straight to the architecture.'
);

const femaleInterviewer = getInterviewer('female');
const formattedFemale = formatInterviewerText(rawTextFromScreenshot, femaleInterviewer);
console.log('Test 1 (Female text):', formattedFemale);

if (
  formattedFemale.includes('Ananya') &&
  (formattedFemale.includes('Strict Professor') || formattedFemale.includes('Professional Interviewer')) &&
  !formattedFemale.includes('Vikram') &&
  !formattedFemale.includes('Arjun')
) {
  console.log('✅ TEST 1 PASSED: Female image strictly displays Ananya and her role!');
} else {
  console.error('❌ TEST 1 FAILED');
  process.exit(1);
}

// Test 2: Arjun (Male) text formatting
const maleInterviewer = getInterviewer('male');
const formattedMale = formatInterviewerText(rawTextFromScreenshot, maleInterviewer);
console.log('Test 2 (Male text):', formattedMale);

if (
  formattedMale.includes('Arjun') &&
  !formattedMale.includes('Vikram') &&
  !formattedMale.includes('Ananya')
) {
  console.log('✅ TEST 2 PASSED: Male image strictly displays Arjun!');
} else {
  console.error('❌ TEST 2 FAILED');
  process.exit(1);
}

// Test 3: Voice gender matching across ALL 3 accents for Male
const maleAmerican = resolveAccentVoice('american', 'male', voicesCatalog);
const malePolish = resolveAccentVoice('polish', 'male', voicesCatalog);
const maleAfrican = resolveAccentVoice('african', 'male', voicesCatalog);

console.log('Test 3 (Male voices in all 3 accents):', {
  american: maleAmerican.voice.name,
  polish: malePolish.voice.name,
  african: maleAfrican.voice.name
});

const isMaleVoice = (vName) => {
  const n = vName.toLowerCase();
  return (n.includes('david') || n.includes('adam') || n.includes('luke') || n.includes('mark')) &&
         !n.includes('zira') && !n.includes('paulina') && !n.includes('ayanda');
};

if (isMaleVoice(maleAmerican.voice.name) && isMaleVoice(malePolish.voice.name) && isMaleVoice(maleAfrican.voice.name)) {
  console.log('✅ TEST 3 PASSED: Male image gets male voice in all 3 accents!');
} else {
  console.error('❌ TEST 3 FAILED');
  process.exit(1);
}

// Test 4: Voice gender matching across ALL 3 accents for Female
const femaleAmerican = resolveAccentVoice('american', 'female', voicesCatalog);
const femalePolish = resolveAccentVoice('polish', 'female', voicesCatalog);
const femaleAfrican = resolveAccentVoice('african', 'female', voicesCatalog);

console.log('Test 4 (Female voices in all 3 accents):', {
  american: femaleAmerican.voice.name,
  polish: femalePolish.voice.name,
  african: femaleAfrican.voice.name
});

const isFemaleVoice = (vName) => {
  const n = vName.toLowerCase();
  return (n.includes('zira') || n.includes('paulina') || n.includes('ayanda') || n.includes('jenny')) &&
         !n.includes('david') && !n.includes('adam') && !n.includes('luke');
};

if (isFemaleVoice(femaleAmerican.voice.name) && isFemaleVoice(femalePolish.voice.name) && isFemaleVoice(femaleAfrican.voice.name)) {
  console.log('✅ TEST 4 PASSED: Female image gets female voice in all 3 accents!');
} else {
  console.error('❌ TEST 4 FAILED');
  process.exit(1);
}

console.log('ALL INTERVIEWER SYNC TESTS PASSED! 🎉');

