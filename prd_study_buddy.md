# Study Buddy AI — PRD

---

## What it is
A voice-first AI study companion. User names their buddy on first launch, then types or speaks to it via a floating voice widget.

---

## Features

1. **Learn a concept** — generates structured page: intuition, key papers, videos, recent advances
2. **Visual explanation** — Qwen-14B generates HTML/JS animation, rendered in sandboxed iframe
3. **Adaptive quiz** — Qwen-7B generates questions, adjusts difficulty by score (easy→medium→hard). Ends at 5 correct (mastered) or 10 questions (hard cap)
4. **Knowledge library** — timeline view: concept, score, difficulty reached, date learned. Concept page cached to avoid re-generation
5. **ArXiv alerts** — on app open, query ArXiv (last 7 days) for each saved concept via keyword match

---

## Tech Stack

| Dimension | Decision | Notes |
|---|---|---|
| STT | WhisperFlow (local) | Runs on AMD MI300X, free |
| TTS | ChatterBox (self-hosted) | Open-source, free |
| Voice trigger | Push-to-talk | Safe for demo |
| LLM — explain/quiz | Qwen2.5-7B-Instruct | vLLM port 8000 |
| LLM — visuals | Qwen2.5-14B-AWQ | vLLM port 8001 |
| Orchestration | LangGraph | One master graph |
| Tools | LangChain | ArxivQueryRun + custom wrappers |
| Frontend | React + Vite | Vibe-coded |
| Backend | FastAPI | Key proxy, input sanitization |
| Storage | localStorage | buddy_name + saved_concepts only |
| Compute | AMD Developer Cloud | MI300X, $100 credits |

---

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

---

## Quiz Loop

```python
def should_continue_quiz(state):
    if state["quiz_score"] >= 5:  return "mastered"   # save to library
    if state["quiz_round"] >= 10: return "exhausted"  # prompt retry
    return "continue"
```

---

## Security
- All API keys in `.env`, proxied through FastAPI — never exposed to frontend
- iframe: `sandbox="allow-scripts"` only — no network, no storage, no DOM access
- Sanitize concept name input before LangChain — blocks prompt injection
- Audio processed locally on AMD — never sent to third parties

---

## UX
- Buddy: name + avatar + 4 mood states (idle, listening, thinking, celebrating)
- Celebrating triggers when quiz score hits 5
- Voice widget: floating bottom-right, mic icon → pulse when active

---