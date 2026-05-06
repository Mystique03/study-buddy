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
    prompt = f"Create an interactive, self-contained HTML and JS animation demonstrating the concept of: {concept}"
    system = """You are an expert frontend developer and educator.
Write a single, complete HTML file that renders an interactive, educational animation for the user's concept.
CRITICAL REQUIREMENTS:
1. Use Tailwind CSS via CDN (<script src="https://cdn.tailwindcss.com"></script>) for ALL styling.
2. The UI must be modern, highly polished, minimalist, and visually stunning (use soft shadows, rounded corners, nice typography).
3. The body must prevent scrollbars and center its content: `<body class="w-full h-screen overflow-hidden flex flex-col items-center justify-center bg-slate-50 font-sans p-4">`
4. The animation should be designed to look perfect inside a 800x600 window. Use responsive sizing (max-w-full, flexboxes) so it doesn't get cut off.
5. Include interactive elements (buttons, sliders, or hover effects) with smooth CSS transitions to demonstrate the concept dynamically.
6. Do not use external JS libraries other than Tailwind. Write vanilla JS for logic.
7. Output ONLY the raw HTML code wrapped in ```html ... ``` tags. Do not output anything else.
"""
    try:
        response = await call_14b(prompt, system, require_json=False)
        
        # Extract HTML from code block if present
        import re
        html_content = response
        match = re.search(r"```(?:html)?\s*([\s\S]+?)\s*```", response)
        if match:
            html_content = match.group(1)
            
        state["concept_page"] = state.get("concept_page", {})
        state["concept_page"]["visual_html"] = html_content
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

def evaluate_answer(state: StudyState) -> StudyState:
    """
    Evaluates the user's answer (if we had the answer in the state).
    In this architecture, the frontend will likely pass the answer directly to the router,
    so this node might be bypassed or used to update the state with the result.
    We'll let the router handle the actual comparison, but this node can represent the state update.
    """
    # Assuming 'last_answer_correct' is injected into the state by the router before calling the graph.
    # We will handle scoring logic in escalate_difficulty and router.
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
