# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Study Buddy AI is a voice-first AI study companion. Users name their buddy on first launch, then interact via a floating voice widget (push-to-talk). The backend runs on AMD MI300X via AMD Developer Cloud.

## Architecture

```
Frontend (React + Vite)
    ↕ REST/WebSocket
Backend (FastAPI)  ←→  LangGraph (one master graph)
                            ↕               ↕
                     Qwen-7B vLLM     Qwen-14B-AWQ vLLM
                      port 8000           port 8001
                     (explain/quiz)      (visuals)
                            ↕
                     LangChain tools (ArxivQueryRun + custom)

Local services (AMD MI300X):
  WhisperFlow — STT
  ChatterBox  — TTS
```

**Storage:** localStorage only — `buddy_name` and `saved_concepts`. No database.

## Key Design Decisions

- FastAPI is a **key proxy only** — API keys never reach the frontend, all LLM calls go through it
- Two separate vLLM endpoints: 7B for text (explain/quiz/alerts), 14B-AWQ for HTML/JS visual generation
- Visual explanations rendered in a sandboxed iframe (`sandbox="allow-scripts"` only)
- Concept pages are **cached** in the library to avoid re-generation on revisit
- ArXiv alerts fire on app open, querying the last 7 days per saved concept

## Buddy Mood States
Only 4 valid values: `"idle" | "listening" | "thinking" | "celebrating"`
`celebrating` triggers when `quiz_score >= 5`

## vLLM Startup
Both instances must run with `--gpu-memory-utilization 0.45` to share the MI300X safely.

## LangGraph State

```python
state = {
    "buddy_name": str,
    "mode": "learn" | "quiz" | "library" | "alert",
    "conversation_history": list,
    "current_concept": str,
    "concept_page": dict,
    "quiz_score": int,
    "quiz_round": int,
    "difficulty": "easy" | "medium" | "hard",
    "current_question": dict,
    "saved_concepts": list,   # persisted to localStorage
    "pending_alerts": list,
}
```

## Quiz Logic

```python
def should_continue_quiz(state):
    if state["quiz_score"] >= 5:  return "mastered"   # save to library
    if state["quiz_round"] >= 10: return "exhausted"  # prompt retry
    return "continue"
```

Difficulty escalates easy → medium → hard based on score. Mastery = 5 correct answers.

## Commands

```bash
# Backend
uv sync                  # install Python deps
uv add <package>         # add a dependency
uvicorn main:app --reload  # run FastAPI dev server

# Frontend (once scaffold exists)
npm install
npm run dev
```

## Environment

Copy `.env.example` to `.env`. All API keys must live in `.env` — never hardcode or expose to frontend.

Required `.env` keys (add as they are introduced):
- `VLLM_7B_URL=http://localhost:8000`
- `VLLM_14B_URL=http://localhost:8001`

## Security Rules

- Sanitize concept name input in FastAPI before passing to LangChain (prompt injection prevention)
- iframe for visuals: `sandbox="allow-scripts"` only — no network, storage, or DOM access
- Audio stays local on AMD — never forwarded to third-party APIs

## localStorage Schema
```javascript
{ buddy_name: string, saved_concepts: [{ concept, score, difficulty_reached, date_learned, concept_page, quiz_history }] }
```
