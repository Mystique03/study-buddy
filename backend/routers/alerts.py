from fastapi import APIRouter, BackgroundTasks
from pydantic import BaseModel
from typing import List
from backend.services.arxiv import fetch_alerts
from backend.services.telegram import send_alert
import asyncio
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/alerts")

class AlertsRequest(BaseModel):
    concepts: List[str]

def fetch_and_send_task(concepts: List[str]):
    alerts = fetch_alerts(concepts)
    asyncio.run(send_alert(alerts))

@router.post("")
async def trigger_alerts(req: AlertsRequest, background_tasks: BackgroundTasks):
    background_tasks.add_task(fetch_and_send_task, req.concepts)
    return {"message": "Alerts triggered", "concepts": req.concepts}
