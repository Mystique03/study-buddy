async def test_learn_concept_structure(client):
    response = await client.post("/api/learn", json={"concept": "transformer neural networks"})

    assert response.status_code == 200

    body = response.json()
    assert set(body.keys()) >= {"intuition", "key_papers", "videos", "recent_advances"}

    assert isinstance(body["intuition"], str) and len(body["intuition"]) > 0

    assert isinstance(body["key_papers"], list) and len(body["key_papers"]) == 5
    for paper in body["key_papers"]:
        assert "title" in paper and isinstance(paper["title"], str)
        assert "description" in paper and isinstance(paper["description"], str)

    assert isinstance(body["videos"], list) and len(body["videos"]) == 3
    for video in body["videos"]:
        assert "title" in video and isinstance(video["title"], str)
        assert "url" in video and isinstance(video["url"], str)

    assert isinstance(body["recent_advances"], list) and len(body["recent_advances"]) > 0


async def test_learn_empty_concept_returns_422(client):
    response = await client.post("/api/learn", json={"concept": ""})
    assert response.status_code == 422


async def test_learn_whitespace_concept_returns_422(client):
    response = await client.post("/api/learn", json={"concept": "   "})
    assert response.status_code == 422
