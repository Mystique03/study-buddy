async def test_quiz_start_structure(client):
    response = await client.post(
        "/api/quiz/start",
        json={"concept": "transformer neural networks"},
    )
    assert response.status_code == 200

    state = response.json()
    q = state["current_question"]

    assert isinstance(q["question"], str) and len(q["question"]) > 0
    assert isinstance(q["options"], list) and len(q["options"]) == 4
    for opt in q["options"]:
        assert isinstance(opt, str)
    assert isinstance(q["correct_index"], int) and 0 <= q["correct_index"] <= 3
    assert isinstance(q["explanation"], str) and len(q["explanation"]) > 0


async def test_quiz_mastery_path(client):
    # Start quiz
    start_resp = await client.post(
        "/api/quiz/start",
        json={"concept": "transformer neural networks"},
    )
    assert start_resp.status_code == 200
    state = start_resp.json()

    # Answer correctly 5 times to reach mastery
    for i in range(5):
        correct_idx = state["current_question"]["correct_index"]
        answer_resp = await client.post(
            "/api/quiz/answer",
            json={"answer_index": correct_idx, "state": state},
        )
        assert answer_resp.status_code == 200
        data = answer_resp.json()

        assert data["correct"] is True

        if i < 4:
            assert data["next_step"] == "continue"
            assert data["state"]["quiz_score"] == i + 1
            # difficulty escalates: score>=1 → medium, score>=3 → hard
            if i + 1 >= 3:
                assert data["state"]["difficulty"] == "hard"
            elif i + 1 >= 1:
                assert data["state"]["difficulty"] == "medium"
            state = data["state"]
        else:
            # 5th correct answer → mastered
            assert data["next_step"] == "mastered"
            assert data["state"]["quiz_score"] == 5


async def test_quiz_exhaustion_path(client):
    # Start quiz
    start_resp = await client.post(
        "/api/quiz/start",
        json={"concept": "transformer neural networks"},
    )
    assert start_resp.status_code == 200
    state = start_resp.json()

    # Answer wrongly 10 times to exhaust rounds
    # Wrong answer = (correct_index + 1) % 4
    for i in range(10):
        correct_idx = state["current_question"]["correct_index"]
        wrong_idx = (correct_idx + 1) % 4

        answer_resp = await client.post(
            "/api/quiz/answer",
            json={"answer_index": wrong_idx, "state": state},
        )
        assert answer_resp.status_code == 200
        data = answer_resp.json()

        assert data["correct"] is False

        if i < 9:
            assert data["next_step"] == "continue"
            state = data["state"]
        else:
            # 10th wrong answer → exhausted
            assert data["next_step"] == "exhausted"


async def test_quiz_start_empty_concept_returns_422(client):
    response = await client.post("/api/quiz/start", json={"concept": ""})
    assert response.status_code == 422


async def test_quiz_start_whitespace_concept_returns_422(client):
    response = await client.post("/api/quiz/start", json={"concept": "   "})
    assert response.status_code == 422
