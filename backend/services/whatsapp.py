import logging
from twilio.rest import Client
from backend.config import settings

logger = logging.getLogger(__name__)

def send_alert(to_number: str, papers: list[dict]) -> bool:
    """
    Formats the papers and sends a WhatsApp message via Twilio.
    Falls back to logging if Twilio is not configured.
    """
    if not settings.twilio_account_sid or not settings.twilio_auth_token:
        logger.info("Twilio credentials not set. Falling back to logging.")
        logger.info(f"Would have sent WhatsApp to {to_number}: {papers}")
        return False
        
    try:
        client = Client(settings.twilio_account_sid, settings.twilio_auth_token)
        
        # Build message body
        body = "📚 *Study Buddy - New ArXiv Alerts* 📚\n\n"
        for alert in papers:
            concept = alert.get("concept", "Unknown")
            body += f"*{concept}*\n"
            results = alert.get("results", "")
            if results:
                # Truncate if too long, WhatsApp has limits
                body += f"{results[:300]}...\n"
            else:
                body += "No new papers.\n"
            body += "\n"
            
        message = client.messages.create(
            from_=settings.twilio_whatsapp_from,
            body=body,
            to=to_number
        )
        logger.info(f"Sent WhatsApp message SID: {message.sid}")
        return True
    except Exception as e:
        logger.error(f"Twilio error: {e}")
        return False
