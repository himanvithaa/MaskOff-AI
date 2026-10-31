# MaskOff AI 🎭

> **Tagline:** Practise Being Yourself in High-Pressure Situations.  
> **Philosophy:** *"MaskOff AI doesn't teach you what to think. It helps you express what you already know, think and feel."*

MaskOff AI is an AI-powered real-world communication training platform designed for high-stakes human interaction. It bridges the gap between knowing knowledge and defending it under intense conversational pressure.

Now upgraded with an **Interactive Anime AI Companion**, **Live Expression & Delivery Coach**, **Combined Speech & Delivery Analytics**, and a **Clean Minimalist UI**.

---

## 🌟 Major Upgrades

### 1. Virtual Anime AI Companion
* **Central Practice Partner:** A friendly, lightweight 2D anime character acting as your communication coach.
* **7 Expressive States:** 
  1. `Idle` (Relaxed breathing & blinking)
  2. `Listening` (Soundwave aura indicating user speech)
  3. `Thinking` (Formulating counter-questions)
  4. `Speaking` (Animated mouth sync during audio playback)
  5. `Happy` (Celebration reaction on strong attempts)
  6. `Encouraging` (Supportive head tilt when user struggles)
  7. `Explaining` (Coaching & delivery breakdown)
* **Character Appearances:** Switch between **Aoi** (*The Thoughtful Guide*), **Ren** (*The Sharp Sparring Partner*), and **Kaia** (*The Warm Coach*).
* **Text-to-Speech (TTS):** Browser SpeechSynthesis API with speech playback, voice on/off toggle, stop speaking, and 0.85x/1.0x/1.2x speed controls.

### 2. Live Expression & Delivery Coach
* **Camera Interface:** Optional webcam panel in the conversation simulator with explicit permission handling.
* **Purely Observable Computer Vision Metrics:**
  * Face Visibility % in frame
  * Camera Eye-Level Framing (Centered vs Too Close / Off-Center)
  * Screen Engagement / Gaze Direction (Direct vs Looking Away)
  * Head Movement Stability (Steady vs Frequent Shifts)
* **100% On-Device & Private:** Video frames are processed locally in real-time. Never transmitted to the LLM or stored on servers.
* **Ethical Guardrails:** Explicitly does **not** claim to detect psychological confidence, anxiety, nervousness, or mental health.
* **Zero Penalty:** If the camera is disabled, communication practice continues completely normally.

### 3. Combined Speech & Delivery Dashboard
* **Side-by-Side (Desktop) / Vertical (Mobile):**
  * **Section A (Communication Analysis):** Answer clarity, relevance, structure, technical depth, filler frequency per 100 words, strengths, weaknesses, actionable suggestions, and model answer.
  * **Section B (Presentation Delivery Feedback):** Face visibility %, camera framing observations, approximate gaze consistency %, head movement stability, and practical camera angle/lighting tips.
* **Unified Synthesis:** Combined actionable recommendation derived strictly from observable data.

### 4. Clean Minimalist UI Redesign
* **Default Light Theme:** Calm, modern, professional palette:
  * Background: `#F8FAFC`
  * Primary Text: `#111827`
  * Secondary Text: `#64748B`
  * Primary Accent: `#7C3AED` (vibrant purple)
  * Secondary Accent: `#EDE9FE`
  * Surfaces / Cards: `#FFFFFF` with borders `#E2E8F0`
* **Focused Dashboard:** Displays welcome greeting, prominent Start Practice CTA, overall communication score, practice streak, top recurring weakness from Weakness DNA, and recommended next arena.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite, Tailwind CSS, React Router v6, Lucide React, Recharts, Framer Motion |
| **Backend** | Python 3, Flask, Flask-SQLAlchemy, Flask-JWT-Extended, Flask-CORS, Werkzeug |
| **Database** | MySQL (with automatic local SQLite fallback `maskoff.db`) |
| **AI & NLP** | Modular AI Interface (Google Gemini API, OpenAI API, and High-Fidelity Zero-Key Demo Engine), Regex NLP Engine for filler & repetition analysis |
| **Speech & Audio** | Browser SpeechSynthesis API (TTS), MediaRecorder & Web Speech API (STT), Backend Whisper upload handler |
| **Vision & Delivery** | Browser MediaDevices API, Client-side optical landmark and framing analyzer |

---

## 🚀 Quick Start Guide

### Step 1: Backend Setup (Flask & Python)

```powershell
cd backend
.venv\Scripts\activate
pip install -r requirements.txt
python run.py
```
*Backend runs on `http://127.0.0.1:5000` (auto-creates `maskoff.db` with 14 seeded arenas and 7 missions).*

### Step 2: Frontend Setup (React & Vite)

```powershell
cd frontend
npm install
npm run dev
```
*Frontend runs on `http://localhost:3000`.*

### Step 3: Run Automated Test Suite

```powershell
cd backend
.venv\Scripts\python -m pytest tests/test_api.py -v
```

---

## 🎭 1-Click Hackathon Evaluator Login
1. Open `http://localhost:3000/login`.
2. Click **"1-Click Hackathon Evaluator Login"** for instant testing without filling credentials.
3. Select an arena in **Practice** (e.g. *College Viva Voce Defense*).
4. Watch the **Virtual Anime Companion** greet you and ask the opening question with synchronized TTS speech.
5. Optionally enable the **Live Expression & Delivery Coach** webcam panel to observe eye-level framing.
6. Answer via microphone or text fallback.
7. Review the **Dual Speech & Delivery Analysis** and test the **Repeat-and-Compare** second attempt!
