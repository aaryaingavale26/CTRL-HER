import sys, os, json, uuid
from pathlib import Path

# Force UTF-8 output on Windows
sys.stdout.reconfigure(encoding='utf-8')

BACKEND_DIR = r"C:\Users\vishr\Downloads\sih\backend"
sys.path.insert(0, BACKEND_DIR)
os.chdir(BACKEND_DIR)

from fastapi.testclient import TestClient
from main import app
from config import settings
from services.learner_progress_repository import get_learner_progress_repository
from services.learner_progress_service import get_learner_progress_service
from models.learner_progress import TopicAttemptHistory
from models.assessment import QuizResult, TopicPerformance, QuestionEvaluationResult, MCQOption, MCQSource

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
repo = get_learner_progress_repository()
service = get_learner_progress_service()

# ──────────────────────────────────────────────────────────────────
# 1. New Learner Progress Creation
# ──────────────────────────────────────────────────────────────────
section("1. New Learner Progress Creation")

learner_id = f"test_learner_{uuid.uuid4().hex[:8]}"
profile = repo.get_progress(learner_id)
assert profile.learner_id == learner_id
assert profile.total_tracked_topics == 0
assert profile.overall_accuracy == 0.0
ok(f"Clean profile initialized for new learner '{learner_id}'")


# ──────────────────────────────────────────────────────────────────
# 2. Trend Detection Unit Tests
# ──────────────────────────────────────────────────────────────────
section("2. Deterministic Learning Trend Detection")

# Less than 2 attempts -> INSUFFICIENT_DATA
h_one = [TopicAttemptHistory(quiz_id="q1", accuracy=70.0, questions=3, correct=2, incorrect=1, timestamp="t1")]
assert service.compute_trend(h_one) == "INSUFFICIENT_DATA"
ok("Single attempt classified as 'INSUFFICIENT_DATA'")

# 40 -> 65 -> 90 = IMPROVING
h_improving = [
    TopicAttemptHistory(quiz_id="q1", accuracy=40.0, questions=3, correct=1, incorrect=2, timestamp="t1"),
    TopicAttemptHistory(quiz_id="q2", accuracy=65.0, questions=3, correct=2, incorrect=1, timestamp="t2"),
    TopicAttemptHistory(quiz_id="q3", accuracy=90.0, questions=3, correct=3, incorrect=0, timestamp="t3")
]
assert service.compute_trend(h_improving) == "IMPROVING"
ok("40 -> 65 -> 90 correctly classified as 'IMPROVING'")

# 90 -> 60 -> 40 = DECLINING
h_declining = [
    TopicAttemptHistory(quiz_id="q1", accuracy=90.0, questions=3, correct=3, incorrect=0, timestamp="t1"),
    TopicAttemptHistory(quiz_id="q2", accuracy=60.0, questions=3, correct=2, incorrect=1, timestamp="t2"),
    TopicAttemptHistory(quiz_id="q3", accuracy=40.0, questions=3, correct=1, incorrect=2, timestamp="t3")
]
assert service.compute_trend(h_declining) == "DECLINING"
ok("90 -> 60 -> 40 correctly classified as 'DECLINING'")

# 75 -> 78 -> 76 = STABLE
h_stable = [
    TopicAttemptHistory(quiz_id="q1", accuracy=75.0, questions=3, correct=2, incorrect=1, timestamp="t1"),
    TopicAttemptHistory(quiz_id="q2", accuracy=78.0, questions=3, correct=2, incorrect=1, timestamp="t2"),
    TopicAttemptHistory(quiz_id="q3", accuracy=76.0, questions=3, correct=2, incorrect=1, timestamp="t3")
]
assert service.compute_trend(h_stable) == "STABLE"
ok("75 -> 78 -> 76 correctly classified as 'STABLE'")


# ──────────────────────────────────────────────────────────────────
# 3. Mastery Classification Unit Tests
# ──────────────────────────────────────────────────────────────────
section("3. Deterministic Mastery Classification")

# Rule: No attempts or recent < 50 -> NEEDS_REVIEW
assert service.compute_mastery(questions_attempted=3, correct_answers=1, recent_accuracy=33.3, overall_accuracy=33.3, attempts=1, trend="INSUFFICIENT_DATA") == "NEEDS_REVIEW"
ok("recent_accuracy < 50% classified as 'NEEDS_REVIEW'")

# Rule: 1 single attempt with 100% is NOT MASTERED (prevents single lucky guess)
assert service.compute_mastery(questions_attempted=3, correct_answers=3, recent_accuracy=100.0, overall_accuracy=100.0, attempts=1, trend="INSUFFICIENT_DATA") != "MASTERED"
ok("Single 100% attempt is NOT marked MASTERED (requires >= 2 attempts)")

# Rule: attempts >= 2 and recent_accuracy >= 80% -> MASTERED
assert service.compute_mastery(questions_attempted=6, correct_answers=5, recent_accuracy=83.3, overall_accuracy=83.3, attempts=2, trend="STABLE") == "MASTERED"
ok("recent_accuracy >= 80% with 2 attempts classified as 'MASTERED'")

# Rule: improving trend -> IMPROVING
assert service.compute_mastery(questions_attempted=6, correct_answers=3, recent_accuracy=66.7, overall_accuracy=50.0, attempts=2, trend="IMPROVING") == "IMPROVING"
ok("Topic showing upward accuracy classified as 'IMPROVING'")


# ──────────────────────────────────────────────────────────────────
# 4. Multi-Attempt Progression & Sliding Window Recent Accuracy
# ──────────────────────────────────────────────────────────────────
section("4. Multi-Attempt Progression & Sliding Window")

learner_prog = f"learner_{uuid.uuid4().hex[:6]}"

# Helper to simulate a QuizResult
def make_mock_result(quiz_id: str, topic: str, questions: int, correct: int, accuracy: float, learner: str) -> QuizResult:
    return QuizResult(
        quiz_id=quiz_id,
        learner_id=learner,
        document_id="doc_nss_78th",
        total_questions=questions,
        answered_questions=questions,
        correct_answers=correct,
        incorrect_answers=questions - correct,
        unanswered_questions=0,
        score=correct,
        percentage=accuracy,
        question_results=[],
        topic_performance=[
            TopicPerformance(
                topic=topic,
                questions=questions,
                correct=correct,
                incorrect=questions - correct,
                unanswered=0,
                accuracy=accuracy
            )
        ],
        overall_feedback="Feedback",
        submitted_at="2026-09-03T16:00:00"
    )

# Attempt 1: Cluster Sampling 40% (1/3)
r1 = make_mock_result("q1", "Cluster Sampling", 3, 1, 33.33, learner_prog)
p1 = service.update_from_quiz_result(r1, learner_prog)
tp1 = p1.topics["Cluster Sampling"]
assert tp1.attempts == 1
assert tp1.questions_attempted == 3
assert tp1.correct_answers == 1
assert tp1.status == "NEEDS_REVIEW"
ok("Attempt 1: Cluster Sampling (33.3%) -> status: NEEDS_REVIEW")

# Attempt 2: Cluster Sampling 66.67% (2/3)
r2 = make_mock_result("q2", "Cluster Sampling", 3, 2, 66.67, learner_prog)
p2 = service.update_from_quiz_result(r2, learner_prog)
tp2 = p2.topics["Cluster Sampling"]
assert tp2.attempts == 2
assert tp2.questions_attempted == 6
assert tp2.correct_answers == 3
assert tp2.accuracy == 50.0
assert tp2.trend == "IMPROVING"
assert tp2.status == "IMPROVING"
ok("Attempt 2: Cluster Sampling (66.7%) -> trend: IMPROVING, status: IMPROVING")

# Attempt 3: Cluster Sampling 100% (3/3)
r3 = make_mock_result("q3", "Cluster Sampling", 3, 3, 100.0, learner_prog)
p3 = service.update_from_quiz_result(r3, learner_prog)
tp3 = p3.topics["Cluster Sampling"]
assert tp3.attempts == 3
assert tp3.questions_attempted == 9
assert tp3.correct_answers == 6
# Window of 3: (1+2+3) / (3+3+3) = 6/9 = 66.67%
assert tp3.recent_accuracy == 66.67
assert tp3.trend == "IMPROVING"
ok("Attempt 3: Cumulative questions=9, correct=6, overall_accuracy=66.67%, recent=66.67%")

# Attempt 4: Cluster Sampling 100% (3/3)
# Window of 3 now covers attempts 2, 3, 4: (2 + 3 + 3) / (3 + 3 + 3) = 8/9 = 88.89% >= 80% -> MASTERED!
r4 = make_mock_result("q4", "Cluster Sampling", 3, 3, 100.0, learner_prog)
p4 = service.update_from_quiz_result(r4, learner_prog)
tp4 = p4.topics["Cluster Sampling"]
assert tp4.recent_accuracy == 88.89
assert tp4.status == "MASTERED"
assert p4.mastered_topics >= 1
ok("Attempt 4: Recent accuracy in sliding window rose to 88.89% -> transitioned to MASTERED!")


# ──────────────────────────────────────────────────────────────────
# 5. Bounded History Verification
# ──────────────────────────────────────────────────────────────────
section("5. Bounded History Constraint")

# Push 15 attempts to check truncation at MAX_TOPIC_HISTORY (10)
for i in range(5, 16):
    r_extra = make_mock_result(f"q_{i}", "Cluster Sampling", 2, 2, 100.0, learner_prog)
    service.update_from_quiz_result(r_extra, learner_prog)

p_bounded = repo.get_progress(learner_prog)
tp_bounded = p_bounded.topics["Cluster Sampling"]
assert len(tp_bounded.history) == getattr(settings, "MAX_TOPIC_HISTORY", 10)
ok(f"History successfully bounded to max {len(tp_bounded.history)} entries (prevented unbounded growth)")


# ──────────────────────────────────────────────────────────────────
# 6. Automatic Update via POST /quizzes/{id}/submit
# ──────────────────────────────────────────────────────────────────
section("6. Automatic Progress Update from Real Quiz Submission")

auto_learner = f"officer_{uuid.uuid4().hex[:6]}"

# Create quiz via API
q_res = client.post("/api/assessment/quizzes", json={
    "document_id": "doc_nss_78th",
    "count": 3,
    "learner_id": auto_learner
})
assert q_res.status_code == 201
q_id = q_res.json()["quiz_id"]

# Answer all questions
q_get = client.get(f"/api/assessment/quizzes/{q_id}")
questions = q_get.json()["questions"]
submission_body = {
    "answers": [
        {"question_id": q["question_id"], "selected_answer": "A"}
        for q in questions
    ]
}

# Submit quiz
sub_res = client.post(f"/api/assessment/quizzes/{q_id}/submit", json=submission_body)
assert sub_res.status_code == 200

# Check learner progress repository was automatically populated without any separate API call!
auto_profile = repo.get_progress(auto_learner)
assert auto_profile.total_tracked_topics > 0
assert auto_profile.overall_accuracy >= 0.0
ok(f"Progress updated automatically after submission: {auto_profile.total_tracked_topics} topics tracked for '{auto_learner}'")


# ──────────────────────────────────────────────────────────────────
# 7. Learner Progress API Endpoints
# ──────────────────────────────────────────────────────────────────
section("7. Learner Progress APIs (GET /api/learners/...)")

# GET /api/learners/{learner_id}/progress
get_prof = client.get(f"/api/learners/{auto_learner}/progress")
assert get_prof.status_code == 200
data_prof = get_prof.json()
assert data_prof["learner_id"] == auto_learner
assert "topics" in data_prof
assert data_prof["total_tracked_topics"] > 0
ok("GET /api/learners/{learner_id}/progress returned 200 with complete profile")

# GET /api/learners/{learner_id}/progress/{topic}
first_topic = list(data_prof["topics"].keys())[0]
get_top = client.get(f"/api/learners/{auto_learner}/progress/{first_topic}")
assert get_top.status_code == 200
data_top = get_top.json()
assert data_top["topic"] == first_topic
assert "recent_accuracy" in data_top
assert "status" in data_top
assert "trend" in data_top
assert len(data_top["history"]) >= 1
ok(f"GET /api/learners/{{learner_id}}/progress/{{topic}} returned 200 for '{first_topic}'")

# Non-existent topic returns 404
get_404 = client.get(f"/api/learners/{auto_learner}/progress/NonExistentTopicXYZ")
assert get_404.status_code == 404
ok("GET non-existent topic returned 404 Not Found")


# ──────────────────────────────────────────────────────────────────
# 8. Multi-Topic Aggregation for Same Learner
# ──────────────────────────────────────────────────────────────────
section("8. Multi-Topic Aggregation for Same Learner")

multi_learner = f"multi_{uuid.uuid4().hex[:6]}"
res_multi = QuizResult(
    quiz_id="q_multi",
    learner_id=multi_learner,
    document_id="doc_nss_78th",
    total_questions=6,
    answered_questions=6,
    correct_answers=4,
    incorrect_answers=2,
    unanswered_questions=0,
    score=4,
    percentage=66.67,
    question_results=[],
    topic_performance=[
        TopicPerformance(topic="Sampling Design", questions=3, correct=3, incorrect=0, unanswered=0, accuracy=100.0),
        TopicPerformance(topic="Field Validation", questions=3, correct=1, incorrect=2, unanswered=0, accuracy=33.33)
    ],
    overall_feedback="Good",
    submitted_at="2026-09-03T16:05:00"
)
service.update_from_quiz_result(res_multi, multi_learner)

p_multi = repo.get_progress(multi_learner)
assert p_multi.total_tracked_topics == 2
assert "Sampling Design" in p_multi.topics
assert "Field Validation" in p_multi.topics
assert p_multi.topics["Field Validation"].status == "NEEDS_REVIEW"
ok("Multi-topic quiz correctly tracked across individual topic profiles")


# ──────────────────────────────────────────────────────────────────
# 9. Backward Compatibility Verification
# ──────────────────────────────────────────────────────────────────
section("9. Backward Compatibility (Phases 3A, 3B, 3C)")

# Direct MCQ generation (Phase 3A)
mcq_res = client.post("/api/assessment/mcqs/generate", json={
    "document_id": "doc_nss_78th",
    "count": 2
})
assert mcq_res.status_code == 200
ok("Phase 3A direct MCQ generate endpoint intact")

# Adaptive Practice (Phase 3C)
# Use the earlier submitted quiz `q_id`
adapt_req = client.post(f"/api/assessment/quizzes/{q_id}/adaptive-practice", json={"count": 2})
# Either creates adaptive practice or correctly evaluates weak answered topic
assert adapt_req.status_code in [201, 400]
ok("Phase 3C adaptive practice endpoint intact")

# Health
h = client.get("/api/health")
assert h.status_code == 200
ok("Phase 1 /api/health intact")


# ──────────────────────────────────────────────────────────────────
# Summary
# ──────────────────────────────────────────────────────────────────
print(f"\n{SEP}")
print(f"  Phase 3D Results:  {_pass} passed,  {_fail} failed")
print(SEP)
sys.exit(0 if _fail == 0 else 1)
