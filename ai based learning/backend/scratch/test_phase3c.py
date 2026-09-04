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
from services.quiz_evaluator import QuizEvaluator
from models.assessment import TopicPerformance

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
repo = get_quiz_repository()

# ──────────────────────────────────────────────────────────────────
# 1. Weakest Answered Topic Selection Unit Logic
# ──────────────────────────────────────────────────────────────────
section("1. Weakest Answered Topic Selection Unit Logic")

# Case A: Exact specification scenario from prompt
# Sampling Design: 2 correct, 0 incorrect, 0 unanswered (100%)
# Cluster Sampling: 0 correct, 2 incorrect, 0 unanswered (0%)
# Field Supervision: 0 correct, 0 incorrect, 2 unanswered (0%)
# Target must be: Cluster Sampling (not Field Supervision!)
sample_topics = [
    TopicPerformance(topic="Sampling Design", questions=2, correct=2, incorrect=0, unanswered=0, accuracy=100.0),
    TopicPerformance(topic="Cluster Sampling", questions=2, correct=0, incorrect=2, unanswered=0, accuracy=0.0),
    TopicPerformance(topic="Field Supervision", questions=2, correct=0, incorrect=0, unanswered=2, accuracy=0.0)
]

weakest_res = QuizEvaluator.select_weakest_answered_topic(sample_topics)
assert weakest_res is not None
weak_topic, weak_acc = weakest_res
assert weak_topic == "Cluster Sampling", f"Expected 'Cluster Sampling', got '{weak_topic}'"
assert weak_acc == 0.0
ok("Weakest topic correctly selected as 'Cluster Sampling', ignoring unanswered-only topic 'Field Supervision'")

# Case B: All questions unanswered -> returns None
unanswered_only = [
    TopicPerformance(topic="Topic A", questions=2, correct=0, incorrect=0, unanswered=2, accuracy=0.0),
    TopicPerformance(topic="Topic B", questions=3, correct=0, incorrect=0, unanswered=3, accuracy=0.0)
]
assert QuizEvaluator.select_weakest_answered_topic(unanswered_only) is None
ok("select_weakest_answered_topic returns None when all topics are unanswered")

# Case C: Adaptive difficulty scaling
assert QuizEvaluator.calculate_adaptive_difficulty(0.0) == "easy"
assert QuizEvaluator.calculate_adaptive_difficulty(45.0) == "easy"
assert QuizEvaluator.calculate_adaptive_difficulty(50.0) == "medium"
assert QuizEvaluator.calculate_adaptive_difficulty(75.0) == "medium"
assert QuizEvaluator.calculate_adaptive_difficulty(80.0) == "hard"
assert QuizEvaluator.calculate_adaptive_difficulty(100.0) == "hard"
ok("calculate_adaptive_difficulty scales correctly (<50% -> easy, 50-79% -> medium, 80%+ -> hard)")


# ──────────────────────────────────────────────────────────────────
# 2. Adaptive Practice Generation via API
# ──────────────────────────────────────────────────────────────────
section("2. Adaptive Practice Generation (POST /quizzes/{id}/adaptive-practice)")

# Create an initial parent quiz
create_res = client.post("/api/assessment/quizzes", json={
    "document_id": "doc_nss_78th",
    "count": 4,
    "difficulty": "medium",
    "learner_id": "officer_verma"
})
assert create_res.status_code == 201
parent_quiz_id = create_res.json()["quiz_id"]
parent_session = repo.get_quiz(parent_quiz_id)
assert parent_session is not None
qs = parent_session.questions_snapshot

# Submit answers: answer Q1 correct, answer Q2 wrong, leave Q3 & Q4 unanswered
submit_res = client.post(f"/api/assessment/quizzes/{parent_quiz_id}/submit", json={
    "answers": [
        {"question_id": qs[0].question_id, "selected_answer": qs[0].correct_answer},
        {"question_id": qs[1].question_id, "selected_answer": "D" if qs[1].correct_answer != "D" else "A"}
    ]
})
assert submit_res.status_code == 200
parent_result = submit_res.json()
assert parent_result["answered_questions"] == 2

# Request Adaptive Practice
adapt_res = client.post(f"/api/assessment/quizzes/{parent_quiz_id}/adaptive-practice", json={
    "count": 3
})
assert adapt_res.status_code == 201, f"Failed adaptive practice: {adapt_res.text}"
adapt_data = adapt_res.json()

assert adapt_data["status"] == "ADAPTIVE_PRACTICE_CREATED"
assert "quiz_id" in adapt_data and adapt_data["quiz_id"].startswith("quiz_")
assert adapt_data["parent_quiz_id"] == parent_quiz_id
assert adapt_data["adaptive_round"] == 1
assert adapt_data["target_topic"] is not None and len(adapt_data["target_topic"]) > 0
assert len(adapt_data["questions"]) > 0
ok(f"Adaptive practice created: round={adapt_data['adaptive_round']}, target='{adapt_data['target_topic']}', diff='{adapt_data['difficulty']}'")


# ──────────────────────────────────────────────────────────────────
# 3. Learner Safety on Adaptive Questions
# ──────────────────────────────────────────────────────────────────
section("3. Learner Safety in Adaptive Practice")

for q in adapt_data["questions"]:
    assert "correct_answer" not in q, "Adaptive question leaked correct_answer!"
    assert "explanation" not in q, "Adaptive question leaked explanation!"
    assert len(q["options"]) == 4
ok("Learner safety verified: Zero answers or explanations exposed in adaptive quiz")


# ──────────────────────────────────────────────────────────────────
# 4. Duplicate Question Prevention & Lineage
# ──────────────────────────────────────────────────────────────────
section("4. Lineage Tracking & Duplicate Question Prevention")

adaptive_quiz_id = adapt_data["quiz_id"]
adaptive_session = repo.get_quiz(adaptive_quiz_id)
assert adaptive_session is not None
assert adaptive_session.parent_quiz_id == parent_quiz_id
assert adaptive_session.adaptive_round == 1
assert adaptive_session.status == "IN_PROGRESS"

parent_q_texts = {q.question.strip().lower() for q in parent_session.questions_snapshot}
for aq in adaptive_session.questions_snapshot:
    assert aq.question.strip().lower() not in parent_q_texts or len(parent_q_texts) == 0
ok("Adaptive session lineage and duplicate prevention verified")


# ──────────────────────────────────────────────────────────────────
# 5. Continuous Multi-Round Adaptive Loop
# ──────────────────────────────────────────────────────────────────
section("5. Continuous Adaptive Loop (Round 1 -> Round 2)")

# Submit Round 1 adaptive quiz
aqs = adaptive_session.questions_snapshot
submit_r1 = client.post(f"/api/assessment/quizzes/{adaptive_quiz_id}/submit", json={
    "answers": [
        {"question_id": aqs[0].question_id, "selected_answer": "D" if aqs[0].correct_answer != "D" else "A"}
    ]
})
assert submit_r1.status_code == 200

# Request Round 2 adaptive practice from Round 1
adapt_r2_res = client.post(f"/api/assessment/quizzes/{adaptive_quiz_id}/adaptive-practice", json={
    "count": 3
})
assert adapt_r2_res.status_code == 201
r2_data = adapt_r2_res.json()
assert r2_data["parent_quiz_id"] == adaptive_quiz_id
assert r2_data["adaptive_round"] == 2
ok(f"Continuous loop verified: Round 2 quiz created with parent={adaptive_quiz_id}")


# ──────────────────────────────────────────────────────────────────
# 6. Error Handling & Validation
# ──────────────────────────────────────────────────────────────────
section("6. Validation & Guardrails")

# 1. Unsubmitted quiz cannot create adaptive practice
unsub_res = client.post("/api/assessment/quizzes", json={"document_id": "doc_nss_78th", "count": 2})
unsub_id = unsub_res.json()["quiz_id"]

err_unsub = client.post(f"/api/assessment/quizzes/{unsub_id}/adaptive-practice", json={"count": 3})
assert err_unsub.status_code == 400
assert "has not been submitted yet" in err_unsub.json()["detail"].lower()
ok("Unsubmitted quiz rejected with 400 Bad Request")

# 2. Non-existent quiz returns 404
err_404 = client.post("/api/assessment/quizzes/non_existent_quiz_xyz/adaptive-practice", json={"count": 3})
assert err_404.status_code == 404
ok("Non-existent quiz returns 404 Not Found")

# 3. Quiz with 0 answered questions rejected
zero_ans_quiz = client.post("/api/assessment/quizzes", json={"document_id": "doc_nss_78th", "count": 2}).json()["quiz_id"]
client.post(f"/api/assessment/quizzes/{zero_ans_quiz}/submit", json={"answers": []})

err_zero_ans = client.post(f"/api/assessment/quizzes/{zero_ans_quiz}/adaptive-practice", json={"count": 3})
assert err_zero_ans.status_code == 400
assert "not enough answered performance data" in err_zero_ans.json()["detail"].lower()
ok("Quiz with 0 answered questions rejected with 400 Bad Request")

# 4. Count > 5 rejected
err_count = client.post(f"/api/assessment/quizzes/{parent_quiz_id}/adaptive-practice", json={"count": 10})
assert err_count.status_code == 422
ok("Count > 5 rejected with 422 Unprocessable Entity")


# ──────────────────────────────────────────────────────────────────
# 7. Backward Compatibility Verification
# ──────────────────────────────────────────────────────────────────
section("7. Backward Compatibility (Phases 1, 2, 3A, 3B)")

# Direct MCQ generate
gen_res = client.post("/api/assessment/mcqs/generate", json={
    "document_id": "doc_nss_78th",
    "count": 2,
    "difficulty": "medium"
})
assert gen_res.status_code == 200
assert gen_res.json()["status"] == "GENERATED"
ok("Phase 3A direct MCQ generate endpoint intact")

# Normal Quiz session create and get
q_norm = client.post("/api/assessment/quizzes", json={"document_id": "doc_nss_78th", "count": 2}).json()
q_norm_get = client.get(f"/api/assessment/quizzes/{q_norm['quiz_id']}")
assert q_norm_get.status_code == 200
ok("Phase 3B quiz create and get endpoints intact")

# Health
h_res = client.get("/api/health")
assert h_res.status_code == 200
ok("Phase 1 /api/health intact")


# ──────────────────────────────────────────────────────────────────
# Summary
# ──────────────────────────────────────────────────────────────────
print(f"\n{SEP}")
print(f"  Phase 3C Results:  {_pass} passed,  {_fail} failed")
print(SEP)
sys.exit(0 if _fail == 0 else 1)
