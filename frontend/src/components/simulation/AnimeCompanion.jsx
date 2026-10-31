/**
 * Compatibility wrapper for InterviewerAvatar.
 * Completely replaces all anime visuals with the realistic reference person interviewer.
 */
import React from 'react';
import InterviewerAvatar, { INDIAN_INTERVIEWERS } from './InterviewerAvatar';

export const COMPANION_CHARACTERS = {
  arjun: {
    id: 'arjun',
    name: 'Arjun',
    tagline: 'Friendly Interviewer',
    fullName: 'Arjun – Friendly Interviewer',
    image: '/assets/interviewers/arjun.jpg'
  },
  meera: {
    id: 'meera',
    name: 'Meera',
    tagline: 'Supportive Mentor',
    fullName: 'Meera – Supportive Mentor',
    image: '/assets/interviewers/meera.jpg'
  },
  vikram: {
    id: 'vikram',
    name: 'Vikram',
    tagline: 'Strict Technical Interviewer',
    fullName: 'Vikram – Strict Technical Interviewer',
    image: '/assets/interviewers/vikram.jpg'
  },
  ananya: {
    id: 'ananya',
    name: 'Ananya',
    tagline: 'Professional HR Interviewer',
    fullName: 'Ananya – Professional HR Interviewer',
    image: '/assets/interviewers/ananya.jpg'
  },
  rahul: {
    id: 'rahul',
    name: 'Rahul',
    tagline: 'Critical Thinking Interviewer',
    fullName: 'Rahul – Critical Thinking Interviewer',
    image: '/assets/interviewers/rahul.jpg'
  }
};

export default function AnimeCompanion(props) {
  return <InterviewerAvatar {...props} />;
}

export { InterviewerAvatar };
