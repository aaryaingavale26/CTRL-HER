import sys, os, json, tempfile, shutil, math
from pathlib import Path

# Force UTF-8 output on Windows
sys.stdout.reconfigure(encoding='utf-8')

BACKEND_DIR = r"C:\Users\vishr\Downloads\sih\backend"
sys.path.insert(0, BACKEND_DIR)
os.chdir(BACKEND_DIR)

from config import settings
from pydantic import ValidationError
from models.assessment import MCQGenerationRequest, MCQGenerationResponse, MCQItem, MCQOption, MCQSource
from services.assessment_context import AssessmentContextService, RetrievedChunk, AssessmentContext
from services.llm import get_llm_service, MockLLMService
from services.mcq_validator import MCQValidator
from fastapi.testclient import TestClient
from main import app

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

# ──────────────────────────────────────────────────────────────────
# 1. Request Schema Validation
# ──────────────────────────────────────────────────────────────────
section("1. MCQGenerationRequest Schema Validation")

# Valid request
req = MCQGenerationRequest(document_id="doc_nss_78th", topic="Sampling", count=5, difficulty="medium")
assert req.count == 5
assert req.difficulty == "medium"
ok("Valid request parses successfully")

# Count < 1
try:
    MCQGenerationRequest(document_id="doc_nss_78th", count=0)
    fail("count=0 should raise ValidationError")
except ValidationError:
    ok("count < 1 rejected by Pydantic")

# Count > 20
try:
    MCQGenerationRequest(document_id="doc_nss_78th", count=25)
    fail("count=25 should raise ValidationError")
except ValidationError:
    ok("count > 20 rejected by Pydantic")

# Invalid difficulty
try:
    MCQGenerationRequest(document_id="doc_nss_78th", difficulty="extreme")
    fail("Invalid difficulty should raise ValidationError")
except ValidationError:
    ok("Invalid difficulty rejected by Pydantic")


# ──────────────────────────────────────────────────────────────────
# 2. Context Building & Retrieval
# ──────────────────────────────────────────────────────────────────
section("2. AssessmentContextService")

context_service = AssessmentContextService()

# NSS 78th Round sample context
ctx = context_service.build_context(document_id="doc_nss_78th", topic="Sampling Design", count=3)
assert ctx.document_id == "doc_nss_78th"
assert len(ctx.chunks) > 0
assert ctx.total_words > 0
assert ctx.is_sufficient is True
assert "SOURCE:" in ctx.formatted_context
assert "CHUNK:" in ctx.formatted_context
ok(f"Context built for doc_nss_78th: {len(ctx.chunks)} chunks, {ctx.total_words} words, sufficient={ctx.is_sufficient}")

# Context without topic (document-wide selection)
ctx_wide = context_service.build_context(document_id="doc_cpi_manual", topic=None, count=2)
assert ctx_wide.document_id == "doc_cpi_manual"
assert len(ctx_wide.chunks) > 0
assert ctx_wide.is_sufficient is True
ok(f"Document-wide context built for doc_cpi_manual: {len(ctx_wide.chunks)} chunks")

# Insufficient content check with empty document
ctx_empty = context_service.build_context(document_id="non_existent_empty_doc", topic="Unknown", count=5)
assert ctx_empty.is_sufficient is False
assert len(ctx_empty.chunks) == 0
ok("Empty/insufficient content detected properly (is_sufficient=False)")


# ──────────────────────────────────────────────────────────────────
# 3. Mock LLM Generation
# ──────────────────────────────────────────────────────────────────
section("3. Mock LLM MCQ Structured Generation")

mock_llm = MockLLMService()

chunks_meta = [
    {
        "chunk_id": "doc_nss_78th_chunk_001",
        "document_id": "doc_nss_78th",
        "source": "NSS_78th_Round.pdf",
        "location": "Page 2",
        "locations": ["Page 2"],
        "text": "Multi-stage stratified sampling design was used.",
        "chunk_index": 0
    }
]

raw_mcqs = mock_llm.generate_mcqs(
    context_str=ctx.formatted_context,
    chunks_metadata=chunks_meta,
    count=4,
    difficulty="hard",
    topic="Sampling"
)

assert len(raw_mcqs) == 4
for q in raw_mcqs:
    assert "question" in q and len(q["question"]) > 5
    assert len(q["options"]) == 4
    assert q["correct_answer"] in ["A", "B", "C", "D"]
    assert q["difficulty"] == "hard"
    assert q["source"]["document_id"] == "doc_nss_78th"
    assert q["source"]["chunk_ids"] == ["doc_nss_78th_chunk_001"]
ok(f"MockLLMService generated {len(raw_mcqs)} structured questions with full source attribution")


# ──────────────────────────────────────────────────────────────────
# 4. Deterministic MCQValidator Tests
# ──────────────────────────────────────────────────────────────────
section("4. MCQValidator Unit Tests")

# Valid question passes
valid_q_dict = {
    "question_id": "q1",
    "question": "What is the primary function of the NSSO Multiple Indicator Survey?",
    "options": [
        {"id": "A", "text": "Collect demographic and migration indicators."},
        {"id": "B", "text": "Determine corporate profit taxation rates."},
        {"id": "C", "text": "Conduct foreign exchange rate stabilization."},
        {"id": "D", "text": "Audit provincial agricultural subsidies."}
    ],
    "correct_answer": "A",
    "explanation": "NSS 78th round covers multiple indicators including migration and education.",
    "difficulty": "medium",
    "topic": "NSS Survey Scope",
    "source": {
        "document_id": "doc_nss_78th",
        "document": "NSS_78th_Round.pdf",
        "chunk_ids": ["doc_nss_78th_chunk_001"],
        "locations": ["Page 1"]
    }
}
item, err = MCQValidator.validate_question(valid_q_dict, "doc_nss_78th", "NSS.pdf", set())
assert item is not None
assert err is None
assert item.correct_answer == "A"
ok("Valid question passes validation cleanly")

# Rejection: fewer than 4 options
bad_opts = dict(valid_q_dict)
bad_opts["options"] = [{"id": "A", "text": "Opt 1"}, {"id": "B", "text": "Opt 2"}]
item, err = MCQValidator.validate_question(bad_opts, "doc_nss_78th", "NSS.pdf", set())
assert item is None
assert "Expected exactly 4 options" in err
ok("Question with fewer than 4 options rejected")

# Rejection: duplicate options
dup_opts = dict(valid_q_dict)
dup_opts["options"] = [
    {"id": "A", "text": "Identical option"},
    {"id": "B", "text": "Identical Option"},
    {"id": "C", "text": "Other option 1"},
    {"id": "D", "text": "Other option 2"}
]
item, err = MCQValidator.validate_question(dup_opts, "doc_nss_78th", "NSS.pdf", set())
assert item is None
assert "Duplicate option text" in err
ok("Question with duplicate options rejected")

# Rejection: invalid correct_answer
bad_ans = dict(valid_q_dict)
bad_ans["correct_answer"] = "Z"
item, err = MCQValidator.validate_question(bad_ans, "doc_nss_78th", "NSS.pdf", set())
assert item is None
assert "Invalid correct_answer" in err
ok("Question with invalid correct_answer key rejected")

# Rejection: duplicate question within batch
seen = set()
item1, _ = MCQValidator.validate_question(valid_q_dict, "doc_nss_78th", "NSS.pdf", seen)
assert item1 is not None
item2, err2 = MCQValidator.validate_question(valid_q_dict, "doc_nss_78th", "NSS.pdf", seen)
assert item2 is None
assert "Duplicate question text" in err2
ok("Duplicate question text rejected within batch")

# Batch validation
batch_res = MCQValidator.validate_batch(raw_mcqs, "doc_nss_78th", "NSS.pdf")
assert len(batch_res) == len(raw_mcqs)
ok(f"validate_batch successfully validated {len(batch_res)} items")


# ──────────────────────────────────────────────────────────────────
# 5. API Endpoint Tests (TestClient)
# ──────────────────────────────────────────────────────────────────
section("5. API Route — POST /api/assessment/mcqs/generate")

client = TestClient(app)

# 1. Successful generation
res = client.post("/api/assessment/mcqs/generate", json={
    "document_id": "doc_nss_78th",
    "topic": "Sampling",
    "count": 3,
    "difficulty": "medium"
})
assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
data = res.json()
assert data["status"] == "GENERATED"
assert data["document_id"] == "doc_nss_78th"
assert len(data["questions"]) == 3
for q in data["questions"]:
    assert len(q["options"]) == 4
    assert q["correct_answer"] in ["A", "B", "C", "D"]
    assert len(q["source"]["chunk_ids"]) > 0
ok(f"API generated {len(data['questions'])} questions for doc_nss_78th")

# 2. Non-existent document -> 404
res_404 = client.post("/api/assessment/mcqs/generate", json={
    "document_id": "non_existent_doc_12345",
    "count": 5
})
assert res_404.status_code == 404
ok("Non-existent document correctly returns 404")

# 3. Invalid count -> 422
res_422 = client.post("/api/assessment/mcqs/generate", json={
    "document_id": "doc_nss_78th",
    "count": 30
})
assert res_422.status_code == 422
ok("Count > 20 correctly returns 422 Unprocessable Entity")


# ──────────────────────────────────────────────────────────────────
# 6. Backward Compatibility (Phases 1, 2A, 2B, 2C-1, 2C-2)
# ──────────────────────────────────────────────────────────────────
section("6. Backward Compatibility Verification")

# Health
health_res = client.get("/api/health")
assert health_res.status_code == 200
assert health_res.json()["status"] == "healthy"
ok("Phase 1 /api/health passes")

# Documents list
docs_res = client.get("/api/documents")
assert docs_res.status_code == 200
assert docs_res.json()["total"] > 0
ok("Phase 2A /api/documents passes")

# Chunks
chunks_res = client.get("/api/documents/doc_nss_78th/chunks")
assert chunks_res.status_code == 200
assert chunks_res.json()["chunk_count"] > 0
ok("Phase 2B /api/documents/{id}/chunks passes")

# Embedding & Search
from services.vector_store import get_vector_store
vs = get_vector_store()
assert vs.dimension == 384
ok("Phase 2C-1 & 2C-2 VectorStore dimension is 384")


# ──────────────────────────────────────────────────────────────────
# Summary
# ──────────────────────────────────────────────────────────────────
print(f"\n{SEP}")
print(f"  Phase 3A Results:  {_pass} passed,  {_fail} failed")
print(SEP)
sys.exit(0 if _fail == 0 else 1)
