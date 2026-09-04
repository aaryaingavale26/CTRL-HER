import sys, os, json
from pathlib import Path

# Force UTF-8 output on Windows
sys.stdout.reconfigure(encoding='utf-8')

BACKEND_DIR = r"C:\Users\vishr\Downloads\sih\backend"
sys.path.insert(0, BACKEND_DIR)
os.chdir(BACKEND_DIR)

from fastapi.testclient import TestClient
from main import app
from services.quiz_repository import get_quiz_repository

SEP = "=" * 64
PASS = "  [PASS]"
FAIL = "  [FAIL]"

_pass = _fail = 0

def ok(msg):
    global _pass
    print(f"{PASS} {msg}")
    _pass += 1

def fail(msg, exc=None):
    global _fail
    info = f" — {exc}" if exc else ""
    print(f"{FAIL} {msg}{info}")
    _fail += 1

def section(name):
    print(f"\n{'='*60}")
    print(f"  {name}")
    print(f"{'='*60}")

client = TestClient(app)

# ──────────────────────────────────────────────────────────────────
# 1. Quiz Creation & Learner Safety
# ──────────────────────────────────────────────────────────────────
section("1. Quiz Creation & Learner-Safe Question Serving")

create_res = client.post("/api/assessment/quizzes", json={
    "document_id": "doc_nss_78th",
    "topic": "Sampling",
    "count": 4,
    "difficulty": "medium",
    "learner_id": "officer_sharma"
})

assert create_res.status_code == 201, f"Expected 201, got {create_res.status_code}: {create_res.text}"
quiz_data = create_res.json()

assert "quiz_id" in quiz_data and quiz_data["quiz_id"].startswith("quiz_")
assert quiz_data["learner_id"] == "officer_sharma"
assert quiz_data["document_id"] == "doc_nss_78th"
assert quiz_data["status"] == "IN_PROGRESS"
assert quiz_data["total_questions"] == 4
assert len(quiz_data["questions"]) == 4
ok(f"Quiz session created with ID: {quiz_data['quiz_id']} (4 questions)")

# CRITICAL SECURITY CHECK: No correct_answer or explanation in learner questions
for idx, q in enumerate(quiz_data["questions"]):
    assert "correct_answer" not in q, f"Question #{idx+1} leaked correct_answer!"
    assert "explanation" not in q, f"Question #{idx+1} leaked explanation!"
    assert len(q["options"]) == 4
    assert "question_id" in q
    assert "source" in q
ok("Learner safety verified: ZERO correct answers or explanations exposed")


# ──────────────────────────────────────────────────────────────────
# 2. Quiz Retrieval Before Submission
# ──────────────────────────────────────────────────────────────────
section("2. Quiz Retrieval (GET /api/assessment/quizzes/{quiz_id})")

quiz_id = quiz_data["quiz_id"]
get_res = client.get(f"/api/assessment/quizzes/{quiz_id}")
assert get_res.status_code == 200
get_data = get_res.json()
assert get_data["quiz_id"] == quiz_id
assert get_data["status"] == "IN_PROGRESS"
for q in get_data["questions"]:
    assert "correct_answer" not in q
    assert "explanation" not in q
ok("GET /quizzes/{id} successfully returns learner-safe quiz")

# Pre-submission result request should fail with 400
premature_res = client.get(f"/api/assessment/quizzes/{quiz_id}/result")
assert premature_res.status_code == 400
assert "still in progress" in premature_res.json()["detail"].lower()
ok("GET /result correctly blocked with 400 before quiz submission")


# ──────────────────────────────────────────────────────────────────
# 3. Snapshot Stability & Backend Knowledge
# ──────────────────────────────────────────────────────────────────
section("3. Snapshot Stability")

repo = get_quiz_repository()
stored_session = repo.get_quiz(quiz_id)
assert stored_session is not None
assert len(stored_session.questions_snapshot) == 4
snapshot_answers = {q.question_id: q.correct_answer for q in stored_session.questions_snapshot}
ok(f"Server-side snapshot intact with {len(snapshot_answers)} stored correct answers")


# ──────────────────────────────────────────────────────────────────
# 4. Evaluation: 100% Perfect Score
# ──────────────────────────────────────────────────────────────────
section("4. Deterministic Evaluation — 100% Score")

# Create a fresh quiz for 100% test
q100_res = client.post("/api/assessment/quizzes", json={
    "document_id": "doc_nss_78th",
    "count": 3,
    "difficulty": "easy"
})
q100_id = q100_res.json()["quiz_id"]
q100_session = repo.get_quiz(q100_id)
assert q100_session is not None

# Submit all correct answers
all_correct_answers = [
    {"question_id": q.question_id, "selected_answer": q.correct_answer}
    for q in q100_session.questions_snapshot
]

sub100_res = client.post(f"/api/assessment/quizzes/{q100_id}/submit", json={
    "answers": all_correct_answers
})
assert sub100_res.status_code == 200, f"Submit failed: {sub100_res.text}"
res100 = sub100_res.json()

assert res100["score"] == 3
assert res100["total_questions"] == 3
assert res100["correct_answers"] == 3
assert res100["incorrect_answers"] == 0
assert res100["unanswered_questions"] == 0
assert res100["percentage"] == 100.0
assert "Excellent performance" in res100["overall_feedback"]
ok(f"100% score test passed: {res100['score']}/3 ({res100['percentage']}%)")


# ──────────────────────────────────────────────────────────────────
# 5. Evaluation: 0% Score
# ──────────────────────────────────────────────────────────────────
section("5. Deterministic Evaluation — 0% Score")

q0_res = client.post("/api/assessment/quizzes", json={
    "document_id": "doc_nss_78th",
    "count": 3,
    "difficulty": "hard"
})
q0_id = q0_res.json()["quiz_id"]
q0_session = repo.get_quiz(q0_id)
assert q0_session is not None

# Submit all deliberately wrong answers
all_wrong_answers = []
for q in q0_session.questions_snapshot:
    wrong = "C" if q.correct_answer != "C" else "D"
    all_wrong_answers.append({"question_id": q.question_id, "selected_answer": wrong})

sub0_res = client.post(f"/api/assessment/quizzes/{q0_id}/submit", json={
    "answers": all_wrong_answers
})
assert sub0_res.status_code == 200
res0 = sub0_res.json()
assert res0["score"] == 0
assert res0["correct_answers"] == 0
assert res0["incorrect_answers"] == 3
assert res0["percentage"] == 0.0
assert "Several concepts need review" in res0["overall_feedback"]
ok(f"0% score test passed: 0/3 (0.0%)")


# ──────────────────────────────────────────────────────────────────
# 6. Mixed Evaluation & Unanswered Handling
# ──────────────────────────────────────────────────────────────────
section("6. Mixed Answers & Unanswered Question Handling")

q_mix_res = client.post("/api/assessment/quizzes", json={
    "document_id": "doc_nss_78th",
    "count": 4,
    "difficulty": "medium"
})
q_mix_id = q_mix_res.json()["quiz_id"]
q_mix_session = repo.get_quiz(q_mix_id)
assert q_mix_session is not None
qs = q_mix_session.questions_snapshot

# Q1: Correct, Q2: Incorrect, Q3: Unanswered (None), Q4: omitted from answer list
mixed_answers = [
    {"question_id": qs[0].question_id, "selected_answer": qs[0].correct_answer},
    {"question_id": qs[1].question_id, "selected_answer": "D" if qs[1].correct_answer != "D" else "A"},
    {"question_id": qs[2].question_id, "selected_answer": None}
]

sub_mix_res = client.post(f"/api/assessment/quizzes/{q_mix_id}/submit", json={
    "answers": mixed_answers
})
assert sub_mix_res.status_code == 200
res_mix = sub_mix_res.json()

assert res_mix["total_questions"] == 4
assert res_mix["answered_questions"] == 2
assert res_mix["correct_answers"] == 1
assert res_mix["incorrect_answers"] == 1
assert res_mix["unanswered_questions"] == 2
assert res_mix["score"] == 1
assert res_mix["percentage"] == 25.0
ok(f"Mixed answers test passed: {res_mix['correct_answers']}/4 correct, {res_mix['unanswered_questions']} unanswered")

# Verification: Explanations and correct answers now revealed post-submission
assert len(res_mix["question_results"]) == 4
for qr in res_mix["question_results"]:
    assert "correct_answer" in qr and qr["correct_answer"] in ["A", "B", "C", "D"]
    assert "explanation" in qr and len(qr["explanation"]) > 5
    assert "is_correct" in qr
ok("Full explanations and correct answers confirmed present in post-submission result")


# ──────────────────────────────────────────────────────────────────
# 7. Topic-Level Performance Breakdown
# ──────────────────────────────────────────────────────────────────
section("7. Topic Performance Metrics")

assert "topic_performance" in res_mix
tp_list = res_mix["topic_performance"]
assert len(tp_list) > 0
for tp in tp_list:
    assert "topic" in tp
    assert "questions" in tp and tp["questions"] > 0
    assert "accuracy" in tp
    assert 0.0 <= tp["accuracy"] <= 100.0
ok(f"Topic performance calculated for {len(tp_list)} topics")

if res_mix["weakest_topic"]:
    ok(f"Weakest topic correctly identified for Phase 3C: '{res_mix['weakest_topic']}'")


# ──────────────────────────────────────────────────────────────────
# 8. Error Handling & Security Constraints
# ──────────────────────────────────────────────────────────────────
section("8. Error Handling & Input Validation")

# Duplicate submission check
dup_sub = client.post(f"/api/assessment/quizzes/{q_mix_id}/submit", json={"answers": []})
assert dup_sub.status_code == 400
assert "already been submitted" in dup_sub.json()["detail"].lower()
ok("Quiz cannot be submitted twice (400 Bad Request)")

# Invalid option key
q_err_res = client.post("/api/assessment/quizzes", json={"document_id": "doc_nss_78th", "count": 2})
q_err_id = q_err_res.json()["quiz_id"]
q_err_session = repo.get_quiz(q_err_id)
assert q_err_session is not None

bad_opt_res = client.post(f"/api/assessment/quizzes/{q_err_id}/submit", json={
    "answers": [{"question_id": q_err_session.questions_snapshot[0].question_id, "selected_answer": "X"}]
})
assert bad_opt_res.status_code == 422 or bad_opt_res.status_code == 400
ok("Invalid option key 'X' rejected properly")

# Non-belonging question ID
bad_qid_res = client.post(f"/api/assessment/quizzes/{q_err_id}/submit", json={
    "answers": [{"question_id": "unrelated_question_999", "selected_answer": "A"}]
})
assert bad_qid_res.status_code == 400
assert "does not belong" in bad_qid_res.json()["detail"].lower()
ok("Unrelated question ID rejected properly with 400")

# Duplicate question answer in single submission
valid_qid = q_err_session.questions_snapshot[0].question_id
dup_ans_res = client.post(f"/api/assessment/quizzes/{q_err_id}/submit", json={
    "answers": [
        {"question_id": valid_qid, "selected_answer": "A"},
        {"question_id": valid_qid, "selected_answer": "B"}
    ]
})
assert dup_ans_res.status_code == 400
assert "duplicate answer" in dup_ans_res.json()["detail"].lower()
ok("Duplicate answer submission for same question ID rejected with 400")


# ──────────────────────────────────────────────────────────────────
# 9. GET /result Endpoint
# ──────────────────────────────────────────────────────────────────
section("9. Result Endpoint Verification (GET /api/assessment/quizzes/{id}/result)")

result_res1 = client.get(f"/api/assessment/quizzes/{q_mix_id}/result")
assert result_res1.status_code == 200
r1 = result_res1.json()

result_res2 = client.get(f"/api/assessment/quizzes/{q_mix_id}/result")
assert result_res2.status_code == 200
r2 = result_res2.json()

assert r1 == r2
ok("Repeated GET /result requests return identical deterministic results")


# ──────────────────────────────────────────────────────────────────
# 10. Backward Compatibility
# ──────────────────────────────────────────────────────────────────
section("10. Backward Compatibility Verification")

# Phase 3A MCQ generate still works directly
gen_res = client.post("/api/assessment/mcqs/generate", json={
    "document_id": "doc_nss_78th",
    "count": 2,
    "difficulty": "medium"
})
assert gen_res.status_code == 200
assert gen_res.json()["status"] == "GENERATED"
ok("Phase 3A direct /api/assessment/mcqs/generate endpoint intact")

# Phase 1 health
h_res = client.get("/api/health")
assert h_res.status_code == 200
assert h_res.json()["status"] == "healthy"
ok("Phase 1 /api/health intact")

# Phase 2 documents
d_res = client.get("/api/documents")
assert d_res.status_code == 200
ok("Phase 2 /api/documents intact")


# ──────────────────────────────────────────────────────────────────
# Summary
# ──────────────────────────────────────────────────────────────────
print(f"\n{SEP}")
print(f"  Phase 3B-1 Results:  {_pass} passed,  {_fail} failed")
print(SEP)
sys.exit(0 if _fail == 0 else 1)
