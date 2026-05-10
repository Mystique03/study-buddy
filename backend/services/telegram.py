import logging
import httpx
from backend.config import settings

logger = logging.getLogger(__name__)

async def send_alert(papers: list[dict]) -> bool:
    if not settings.telegram_bot_token or not settings.telegram_chat_id:
        logger.info("Telegram credentials not set — skipping alert.")
        return False

    lines = ["📚 *Study Buddy — New ArXiv Alerts*\n"]
    for alert in papers:
        concept = alert.get("concept", "Unknown")
        paper_list = alert.get("papers", [])
        if not paper_list:
            lines.append(f"*{concept}*\nNo new papers in the last 7 days.\n")
        else:
            paper_lines = "\n".join(
                f"• [{p['title']}]({p['url']}) ({p['published']})"
                for p in paper_list
            )
            lines.append(f"*{concept}*\n{paper_lines}\n")

    text = "\n".join(lines)
    url = f"https://api.telegram.org/bot{settings.telegram_bot_token}/sendMessage"

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            res = await client.post(url, json={
                "chat_id": settings.telegram_chat_id,
                "text": text,
                "parse_mode": "Markdown",
            })
            res.raise_for_status()
            return True
    except Exception as e:
        logger.error(f"Telegram error: {e}")
        return False
