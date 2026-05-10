import logging
from datetime import datetime, timedelta, timezone
import arxiv

logger = logging.getLogger(__name__)

_client = arxiv.Client()

def fetch_alerts(concepts: list[str]) -> list[dict]:
    """Query ArXiv for papers submitted in the last 7 days per concept."""
    cutoff = datetime.now(timezone.utc) - timedelta(days=7)
    alerts = []
    for concept in concepts:
        try:
            logger.info(f"Querying ArXiv for: {concept}")
            search = arxiv.Search(
                query=concept,
                max_results=5,
                sort_by=arxiv.SortCriterion.SubmittedDate,
                sort_order=arxiv.SortOrder.Descending,
            )
            papers = []
            for result in _client.results(search):
                if result.published < cutoff:
                    break
                papers.append({
                    "title": result.title,
                    "summary": result.summary[:300],
                    "url": result.entry_id,
                    "published": result.published.strftime("%Y-%m-%d"),
                })
            alerts.append({"concept": concept, "papers": papers})
        except Exception as e:
            logger.error(f"Error fetching ArXiv alerts for {concept}: {e}")
            alerts.append({"concept": concept, "error": str(e)})
    return alerts
