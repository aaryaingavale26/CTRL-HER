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
from services.personalized_learning_service import get_personalized_learning_service
from models.learner_progress import LearnerTopicProgress, LearnerProgressProfile, TopicAttemptHistory
from models.assessment import QuizResult, TopicPerformance

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
progress_repo = get_learner_progress_repository()
service = get_personalized_learning_service()

# ──────────────────────────────────────────────────────────────────
# 1. No-Progress Learner Handling
# ──────────────────────────────────────────────────────────────────
section("1. No-Progress Learner Handling")

fresh_learner = f"learner_{uuid.uuid4().hex[:8]}"
rec_fresh = service.get_recommendation(fresh_learner)
assert rec_fresh.status == "NO_PROGRESS"
assert "No assessment performance history" in rec_fresh.reason
assert "Complete an initial assessment" in rec_fresh.next_step
ok("Fresh learner with no history returns status='NO_PROGRESS'")


# ──────────────────────────────────────────────────────────────────
# 2. Priority Scoring Rules & Declining vs Improving
# ──────────────────────────────────────────────────────────────────
section("2. Priority Scoring: Declining vs Improving")

# Topic A: overall = 40%, recent = 75%, trend = IMPROVING, status = IMPROVING
topic_a = LearnerTopicProgress(
    topic="Sampling Design",
    attempts=3,
    questions_attempted=9,
    correct_answers=4,
    incorrect_answers=5,
    accuracy=44.44,
    recent_accuracy=75.0,
    status="IMPROVING",
    trend="IMPROVING",
    first_seen_at="2026-09-03T16:00:00",
    last_practiced_at="2026-09-03T16:30:00",
    history=[]
)

# Topic B: overall = 65%, recent = 35%, trend = DECLINING, status = NEEDS_REVIEW
topic_b = LearnerTopicProgress(
    topic="Cluster Sampling",
    attempts=3,
    questions_attempted=9,
    correct_answers=6,
    incorrect_answers=3,
    accuracy=66.67,
    recent_accuracy=35.0,
    status="NEEDS_REVIEW",
    trend="DECLINING",
    first_seen_at="2026-09-03T16:00:00",
    last_practiced_at="2026-09-03T16:30:00",
    history=[]
)

score_a = service.calculate_topic_priority(topic_a)
score_b = service.calculate_topic_priority(topic_b)
assert score_b > score_a, f"Expected Topic B priority > Topic A priority, got B={score_b}, A={score_a}"
ok(f"Declining topic with low recent accuracy (score={score_b}) prioritized over improving topic (score={score_a})")


# ──────────────────────────────────────────────────────────────────
# 3. Mastered Topic Deprioritization
# ──────────────────────────────────────────────────────────────────
section("3. Mastered Topic Deprioritization")

topic_mastered = LearnerTopicProgress(
    topic="Basic Statistics",
    attempts=4,
    questions_attempted=12,
    correct_answers=11,
    incorrect_answers=1,
    accuracy=91.67,
    recent_accuracy=100.0,
    status="MASTERED",
    trend="STABLE",
    first_seen_at="2026-09-03T16:00:00",
    last_practiced_at="2026-09-03T16:30:00",
    history=[]
)

score_mastered = service.calculate_topic_priority(topic_mastered)
assert score_mastered < score_a and score_mastered < score_b
ok(f"Mastered topic heavily deprioritized (score={score_mastered} vs {score_a})")


# ──────────────────────────────────────────────────────────────────
# 4. Action Selection & Deterministic Reasoning
# ──────────────────────────────────────────────────────────────────
section("4. Action Selection & Deterministic Reasoning")

# NEEDS_REVIEW with critically low recent accuracy (<40%) -> REVIEW
act_b, reason_b, next_b = service.determine_action(topic_b)
assert act_b == "REVIEW"
assert "critically low" in reason_b
ok("Critically low accuracy (<40%) prescribes action='REVIEW'")

# IMPROVING with recent accuracy >= 70% -> REASSESS
act_a, reason_a, next_a = service.determine_action(topic_a)
assert act_a == "REASSESS"
assert "reassessment" in next_a.lower()
ok("Improving topic with high recent accuracy prescribes action='REASSESS'")

# MASTERED -> ADVANCE
act_m, reason_m, next_m = service.determine_action(topic_mastered)
assert act_m == "ADVANCE"
assert "Advance" in next_m
ok("Mastered topic prescribes action='ADVANCE'")


# ──────────────────────────────────────────────────────────────────
# 5. All-Mastered Learner Profile
# ──────────────────────────────────────────────────────────────────
section("5. All-Mastered Learner Profile")

all_m_learner = f"master_learner_{uuid.uuid4().hex[:6]}"
all_m_profile = LearnerProgressProfile(
    learner_id=all_m_learner,
    topics={"Basic Statistics": topic_mastered},
    total_tracked_topics=1,
    mastered_topics=1,
    topics_needing_review=0,
    improving_topics=0,
    overall_accuracy=91.67
)
progress_repo.save_progress(all_m_profile)

rec_all_m = service.get_recommendation(all_m_learner)
assert rec_all_m.status == "ALL_MASTERED"
assert "Advance to new learning materials" in rec_all_m.next_step
ok("Learner with all mastered topics returns status='ALL_MASTERED'")


# ──────────────────────────────────────────────────────────────────
# 6. Recommendation API (GET /api/learners/{id}/recommendation)
# ──────────────────────────────────────────────────────────────────
section("6. Recommendation API Endpoint")

active_learner = f"officer_{uuid.uuid4().hex[:6]}"
active_profile = LearnerProgressProfile(
    learner_id=active_learner,
    topics={
        "Sampling Design": topic_a,
        "Cluster Sampling": topic_b,
        "Basic Statistics": topic_mastered
    },
    total_tracked_topics=3,
    mastered_topics=1,
    topics_needing_review=1,
    improving_topics=1,
    overall_accuracy=67.0
)
progress_repo.save_progress(active_profile)

get_rec_res = client.get(f"/api/learners/{active_learner}/recommendation")
assert get_rec_res.status_code == 200
rec_data = get_rec_res.json()
assert rec_data["status"] == "RECOMMENDED"
assert rec_data["recommended_topic"] == "Cluster Sampling"
assert rec_data["action"] == "REVIEW"
assert rec_data["priority_score"] == score_b
ok("GET /api/learners/{id}/recommendation correctly recommended 'Cluster Sampling'")


# ──────────────────────────────────────────────────────────────────
# 7. Personalized Practice Endpoint (POST /recommendation/practice)
# ──────────────────────────────────────────────────────────────────
section("7. Personalized Practice Endpoint")

# Start personalized practice for active_learner
prac_res = client.post(f"/api/learners/{active_learner}/recommendation/practice", json={"count": 3})
assert prac_res.status_code == 201, f"Practice endpoint failed: {prac_res.text}"
quiz_data = prac_res.json()

assert quiz_data["status"] == "IN_PROGRESS"
assert quiz_data["learner_id"] == active_learner
assert quiz_data["topic"] == "Cluster Sampling"
assert len(quiz_data["questions"]) > 0

# Verify learner safety: zero answers or explanations leaked
for q in quiz_data["questions"]:
    assert "correct_answer" not in q, "Learner-safe quiz leaked correct_answer!"
    assert "explanation" not in q, "Learner-safe quiz leaked explanation!"
    assert len(q["options"]) == 4
ok("POST /api/learners/{id}/recommendation/practice generated learner-safe quiz targeting 'Cluster Sampling'")


# ──────────────────────────────────────────────────────────────────
# 8. Error Handling & Guardrails
# ──────────────────────────────────────────────────────────────────
section("8. Error Handling & Guardrails")

# 1. Fresh learner cannot start practice
fresh_prac = client.post(f"/api/learners/{fresh_learner}/recommendation/practice", json={"count": 3})
assert fresh_prac.status_code == 400
assert "no learner progress history exists" in fresh_prac.json()["detail"].lower()
ok("Practice request for learner with no progress rejected with 400 Bad Request")

# 2. All-mastered learner cannot start remedial practice
mastered_prac = client.post(f"/api/learners/{all_m_learner}/recommendation/practice", json={"count": 3})
assert mastered_prac.status_code == 400
assert "mastery" in mastered_prac.json()["detail"].lower()
ok("Practice request for all-mastered learner rejected with 400 Bad Request")

# 3. Invalid count > 5 rejected
err_count = client.post(f"/api/learners/{active_learner}/recommendation/practice", json={"count": 10})
assert err_count.status_code == 422
ok("Practice request with count > 5 rejected with 422 Unprocessable Entity")


# ──────────────────────────────────────────────────────────────────
# 9. Backward Compatibility Verification
# ──────────────────────────────────────────────────────────────────
section("9. Backward Compatibility (Phases 3A, 3B, 3C, 3D)")

# Phase 3A: Direct MCQ generate
res_3a = client.post("/api/assessment/mcqs/generate", json={"document_id": "doc_nss_78th", "count": 2})
assert res_3a.status_code == 200
ok("Phase 3A direct MCQ generate endpoint intact")

# Phase 3D: Learner progress endpoint
res_3d = client.get(f"/api/learners/{active_learner}/progress")
assert res_3d.status_code == 200
assert res_3d.json()["total_tracked_topics"] == 3
ok("Phase 3D GET /api/learners/{id}/progress intact")

# Health
h = client.get("/api/health")
assert h.status_code == 200
ok("Phase 1 /api/health intact")


# ──────────────────────────────────────────────────────────────────
# Summary
# ──────────────────────────────────────────────────────────────────
print(f"\n{SEP}")
print(f"  Phase 3E Results:  {_pass} passed,  {_fail} failed")
print(SEP)
sys.exit(0 if _fail == 0 else 1)
