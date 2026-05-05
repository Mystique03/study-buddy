import pytest
import pytest_asyncio
import httpx
from httpx import ASGITransport
from main import app


@pytest_asyncio.fixture(scope="session")
async def client():
    async with httpx.AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
    ) as c:
        yield c
