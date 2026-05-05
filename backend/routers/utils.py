import re


def sanitize_concept(concept: str) -> str:
    concept = concept.strip()
    concept = re.sub(r'[\x00-\x1f\x7f]', ' ', concept)
    concept = re.sub(r' {2,}', ' ', concept)
    concept = concept[:100]
    if not concept:
        raise ValueError("Concept cannot be empty")
    return concept
