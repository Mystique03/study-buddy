import json
import logging
from backend.graph.state import StudyState
from backend.services.llm import call_7b, call_14b
from backend.services.arxiv import fetch_alerts

logger = logging.getLogger(__name__)

def _normalize_concept_page(page: dict) -> dict:
    # intuition: LLM sometimes wraps in {"text": "..."} or ["..."]
    intuition = page.get("intuition", "")
    if isinstance(intuition, dict):
        intuition = intuition.get("text") or intuition.get("content") or str(intuition)
    elif isinstance(intuition, list):
        intuition = " ".join(str(i) for i in intuition)
    page["intuition"] = str(intuition)

    # key_papers: ensure list of dicts with title + description
    papers = page.get("key_papers", [])
    if not isinstance(papers, list):
        papers = []
    page["key_papers"] = [
        {
            "title": str(p.get("title", "")),
            "description": str(p.get("description", p.get("summary", ""))),
        }
        for p in papers if isinstance(p, dict)
    ]

    # videos: ensure list of dicts with title + url
    videos = page.get("videos", [])
    if not isinstance(videos, list):
        videos = []
    page["videos"] = [
        {
            "title": str(v.get("title", "")),
            "url": str(v.get("url", v.get("link", ""))),
        }
        for v in videos if isinstance(v, dict)
    ]

    # recent_advances: ensure list of strings
    advances = page.get("recent_advances", [])
    if not isinstance(advances, list):
        advances = [str(advances)] if advances else []
    page["recent_advances"] = [str(a) for a in advances]

    return page


async def learn_concept(state: StudyState) -> StudyState:
    """Generates the concept page structured data."""
    concept = state["current_concept"]
    prompt = f"Explain the concept: '{concept}' in detail."
    system = """You are a helpful study buddy.
Create a structured explanation with these exact JSON keys:
- intuition: A prose paragraph explaining the core idea simply.
- key_papers: A list of 5 dicts with 'title' and 'description' of foundational papers.
- videos: A list of 3 dicts with 'title' and 'url' to relevant educational YouTube videos.
- recent_advances: A bullet list of strings describing recent breakthroughs.
Output JSON only.
"""
    try:
        response = await call_7b(prompt, system, require_json=True)
        concept_page = _normalize_concept_page(json.loads(response))
        state["concept_page"] = concept_page
    except Exception as e:
        logger.error(f"Error in learn_concept: {e}")
        state["concept_page"] = {"error": str(e)}
    return state

async def generate_visual(state: StudyState) -> StudyState:
    """Generates a self-contained HTML/JS animation string for the concept."""
    concept = state["current_concept"]
    prompt = f"Create a self-contained HTML and JS animation demonstrating: {concept}"
    system = """You are an expert web developer and educator.
Write a single, complete HTML file (including <style> and <script> tags) that renders an interactive, educational animation or visualization for the user's concept.
Do not use external dependencies if possible.
Return a JSON object with exactly one key: 'html', containing the full HTML string.
Output JSON only.
"""
    try:
        response = await call_14b(prompt, system, require_json=True)
        visual_data = json.loads(response)
        state["concept_page"] = state.get("concept_page", {})
        state["concept_page"]["visual_html"] = visual_data.get("html", "")
    except Exception as e:
        logger.error(f"Error in generate_visual: {e}")
        state["concept_page"] = state.get("concept_page", {})
        state["concept_page"]["visual_html"] = f"<div>Error generating visual: {e}</div>"
    return state

async def generate_question(state: StudyState) -> StudyState:
    """Generates a multiple choice question."""
    concept = state["current_concept"]
    difficulty = state.get("difficulty", "easy")

    prompt = f"Generate a {difficulty} difficulty multiple choice question about {concept}."
    system = """Create a multiple choice question.
Return JSON with these keys:
- question: The question text.
- options: A list of 4 string options.
- correct_index: Integer 0-3 indicating the correct option.
- explanation: Why this is the correct answer.
Output JSON only.
"""
    response = await call_7b(prompt, system, require_json=True)
    question_data = json.loads(response)
    state["current_question"] = question_data
    state["quiz_round"] = state.get("quiz_round", 0) + 1
    return state

def fetch_arxiv_alerts_node(state: StudyState) -> StudyState:
    """Queries ArXiv for saved concepts."""
    concepts = [c["concept"] for c in state.get("saved_concepts", []) if "concept" in c]
    if not concepts:
        state["pending_alerts"] = []
        return state
        
    alerts = fetch_alerts(concepts)
    state["pending_alerts"] = alerts
    return state

def escalate_difficulty(state: StudyState) -> StudyState:
    """Adjusts difficulty based on score."""
    score = state.get("quiz_score", 0)
    if score >= 3:
        state["difficulty"] = "hard"
    elif score >= 1:
        state["difficulty"] = "medium"
    else:
        state["difficulty"] = "easy"
    return state
