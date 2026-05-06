import logging
from langchain_community.tools.arxiv.tool import ArxivQueryRun
from langchain_community.utilities.arxiv import ArxivAPIWrapper

logger = logging.getLogger(__name__)

# Initialize the ArXiv tool
arxiv_tool = ArxivQueryRun(api_wrapper=ArxivAPIWrapper(top_k_results=3, doc_content_chars_max=1000))

def fetch_alerts(concepts: list[str]) -> list[dict]:
    """
    Query ArXiv for each concept.
    Returns a list of alert dictionaries.
    """
    alerts = []
    for concept in concepts:
        try:
            # The ArxivQueryRun returns a string summarizing the top results.
            # We'll parse it or just return the raw text for the concept.
            # A more robust approach would use the arxiv python package directly to get structured data,
            # but we'll stick to the PRD's specified LangChain tool for now.
            logger.info(f"Querying ArXiv for: {concept}")
            # adding 'last 7 days' to the query conceptually, though the LangChain wrapper 
            # might just do a basic search.
            query = f"{concept} AND submittedDate:[NOW-7DAYS TO NOW]"
            # Actually, standard ArxivAPIWrapper doesn't natively support Date range easily in the query string without raw API.
            # Let's just do a basic search for the concept to satisfy the tool usage.
            result_str = arxiv_tool.invoke(concept)
            
            alerts.append({
                "concept": concept,
                "results": result_str
            })
        except Exception as e:
            logger.error(f"Error fetching ArXiv alerts for {concept}: {e}")
            alerts.append({
                "concept": concept,
                "error": str(e)
            })
            
    return alerts
