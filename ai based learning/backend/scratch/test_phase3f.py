import sys, os, json, uuid
from pathlib import Path
from unittest.mock import patch, MagicMock, PropertyMock

sys.stdout.reconfigure(encoding='utf-8')

BACKEND_DIR = r"C:\Users\vishr\Downloads\sih\backend"
sys.path.insert(0, BACKEND_DIR)
os.chdir(BACKEND_DIR)

from fastapi.testclient import TestClient
from main import app

SEP = "=" * 60
_pass = _fail = 0

def ok(msg):
    global _pass
    print(f"  [PASS] {msg}")
    _pass += 1

def fail(msg, exc=None):
    global _fail
    info = f" — {exc}" if exc else ""
    print(f"  [FAIL] {msg}{info}")
    _fail += 1

def section(name):
    print(f"\n{SEP}\n  {name}\n{SEP}")

client = TestClient(app)

from services.rag_assistant import get_rag_assistant_service
from services.vector_store import VectorStore
from services.embedding_service import EmbeddingService
svc = get_rag_assistant_service()

MOCK_CHUNKS = [
    {
        "chunk_id": "doc_001_chunk_001",
        "document_id": "doc_001",
        "score": 0.85,
        "text": "Stratified sampling is a method where the population is divided into homogeneous subgroups called strata. A random sample is then drawn from each stratum.",
        "source": "sampling_guide.pdf",
        "location": "Page 5",
        "locations": ["Page 5"],
        "chunk_index": 0,
    },
    {
        "chunk_id": "doc_001_chunk_002",
        "document_id": "doc_001",
        "score": 0.72,
        "text": "Cluster sampling involves dividing the population into clusters and randomly selecting entire clusters for inclusion in the sample.",
        "source": "sampling_guide.pdf",
        "location": "Page 7",
        "locations": ["Page 7"],
        "chunk_index": 1,
    },
]

MOCK_LLM_JSON = json.dumps({
    "answer": "Stratified sampling divides the population into homogeneous strata and samples from each. Cluster sampling selects entire clusters randomly.",
    "confidence": "HIGH",
    "chunk_ids_used": ["doc_001_chunk_001", "doc_001_chunk_002"]
})


# ──────────────────────────────────────────────────────────────────
# 1. Request Schema Validation
# ──────────────────────────────────────────────────────────────────
section("1. Request Schema Validation")

r = client.post("/api/learning-assistant/ask", json={})
assert r.status_code == 422
ok("Missing 'question' field returns 422 Unprocessable Entity")

r = client.post("/api/learning-assistant/ask", json={"question": "Hi"})
assert r.status_code == 422
ok("Question shorter than min_length returns 422")

r = client.post("/api/learning-assistant/ask", json={"question": "What is sampling?", "top_k": 20})
assert r.status_code == 422
ok("top_k > 10 returns 422")

r = client.post("/api/learning-assistant/ask", json={"question": "What is sampling?", "top_k": 0})
assert r.status_code == 422
ok("top_k = 0 returns 422")


# ──────────────────────────────────────────────────────────────────
# 2. No-Index State Handling
# ──────────────────────────────────────────────────────────────────
section("2. No-Index State Handling")

with patch.object(VectorStore, 'total_vectors', new_callable=PropertyMock, return_value=0):
    result = svc.answer("What is stratified sampling?")
    assert result["status"] == "NO_INDEX"
    assert result["confidence"] == "LOW"
    assert result["sources"] == []
    ok("Empty index returns status='NO_INDEX' with empty sources")


# ──────────────────────────────────────────────────────────────────
# 3. Retrieval & Context Building
# ──────────────────────────────────────────────────────────────────
section("3. Retrieval & Context Building")

with (
    patch.object(VectorStore, 'total_vectors', new_callable=PropertyMock, return_value=10),
    patch.object(svc.embedding_service, 'embed_text', return_value=[0.1] * 384),
    patch.object(svc.vector_store, 'search', return_value=MOCK_CHUNKS),
    patch.object(svc.llm_service, 'generate_text', return_value=MOCK_LLM_JSON),
):
    result = svc.answer("What is the difference between stratified and cluster sampling?")
    assert result["status"] == "ANSWERED"
    assert result["confidence"] == "HIGH"
    assert len(result["sources"]) == 2
    ok("Valid question returns status='ANSWERED' with HIGH confidence")
    ok(f"Sources correctly populated: {len(result['sources'])} sources")


# ──────────────────────────────────────────────────────────────────
# 4. Document-Specific Filtering
# ──────────────────────────────────────────────────────────────────
section("4. Document-Specific Filtering")

captured_calls = []

def mock_search(query_vector, top_k, document_id=None):
    captured_calls.append({"document_id": document_id, "top_k": top_k})
    return MOCK_CHUNKS

with (
    patch.object(VectorStore, 'total_vectors', new_callable=PropertyMock, return_value=10),
    patch.object(svc.embedding_service, 'embed_text', return_value=[0.1] * 384),
    patch.object(svc.vector_store, 'search', side_effect=mock_search),
    patch.object(svc.llm_service, 'generate_text', return_value=MOCK_LLM_JSON),
):
    svc.answer("What is sampling?", document_id="doc_001")
    assert captured_calls[-1]["document_id"] == "doc_001"
    ok("document_id parameter is correctly forwarded to VectorStore.search()")

    svc.answer("What is sampling?", document_id=None)
    assert captured_calls[-1]["document_id"] is None
    ok("Omitting document_id passes None — search spans all indexed material")


# ──────────────────────────────────────────────────────────────────
# 5. Empty Retrieval → Insufficient Context (no hallucination)
# ──────────────────────────────────────────────────────────────────
section("5. Empty Retrieval — Insufficient Context Guardrail")

with (
    patch.object(VectorStore, 'total_vectors', new_callable=PropertyMock, return_value=5),
    patch.object(svc.embedding_service, 'embed_text', return_value=[0.1] * 384),
    patch.object(svc.vector_store, 'search', return_value=[]),
    patch.object(svc.llm_service, 'generate_text') as mock_llm,
):
    result = svc.answer("What is quantum entanglement?")
    assert result["status"] == "INSUFFICIENT_CONTEXT"
    assert result["confidence"] == "LOW"
    assert result["sources"] == []
    mock_llm.assert_not_called()
    ok("Empty retrieval returns INSUFFICIENT_CONTEXT — LLM NOT called (no hallucination)")


# ──────────────────────────────────────────────────────────────────
# 6. Low-Score Chunks Filtered Out
# ──────────────────────────────────────────────────────────────────
section("6. Low-Score Chunk Filtering")

LOW_SCORE_CHUNKS = [
    {**MOCK_CHUNKS[0], "score": 0.05},
    {**MOCK_CHUNKS[1], "score": 0.03},
]

with (
    patch.object(VectorStore, 'total_vectors', new_callable=PropertyMock, return_value=5),
    patch.object(svc.embedding_service, 'embed_text', return_value=[0.1] * 384),
    patch.object(svc.vector_store, 'search', return_value=LOW_SCORE_CHUNKS),
    patch.object(svc.llm_service, 'generate_text') as mock_llm,
):
    result = svc.answer("What is sampling?")
    assert result["status"] == "INSUFFICIENT_CONTEXT"
    mock_llm.assert_not_called()
    ok("Chunks below similarity threshold filtered — LLM NOT called")


# ──────────────────────────────────────────────────────────────────
# 7. Source Metadata Preservation
# ──────────────────────────────────────────────────────────────────
section("7. Source Metadata Preservation")

with (
    patch.object(VectorStore, 'total_vectors', new_callable=PropertyMock, return_value=10),
    patch.object(svc.embedding_service, 'embed_text', return_value=[0.1] * 384),
    patch.object(svc.vector_store, 'search', return_value=MOCK_CHUNKS),
    patch.object(svc.llm_service, 'generate_text', return_value=MOCK_LLM_JSON),
):
    result = svc.answer("What is stratified sampling?")
    src = result["sources"][0]
    assert src["document_id"] == "doc_001"
    assert src["document"] == "sampling_guide.pdf"
    assert src["chunk_id"] == "doc_001_chunk_001"
    assert src["location"] == "Page 5"
    ok("Source metadata correctly preserved: document_id, document, chunk_id, location")


# ──────────────────────────────────────────────────────────────────
# 8. API Endpoint via TestClient
# ──────────────────────────────────────────────────────────────────
section("8. API Endpoint — POST /api/learning-assistant/ask")

with (
    patch.object(VectorStore, 'total_vectors', new_callable=PropertyMock, return_value=10),
    patch.object(svc.embedding_service, 'embed_text', return_value=[0.1] * 384),
    patch.object(svc.vector_store, 'search', return_value=MOCK_CHUNKS),
    patch.object(svc.llm_service, 'generate_text', return_value=MOCK_LLM_JSON),
):
    r = client.post("/api/learning-assistant/ask", json={
        "question": "What is stratified sampling?",
        "document_id": "doc_001",
        "top_k": 5
    })
    assert r.status_code == 200
    data = r.json()
    assert data["status"] == "ANSWERED"
    assert data["confidence"] == "HIGH"
    assert len(data["sources"]) == 2
    assert "answer" in data and "question" in data
    for src in data["sources"]:
        assert "vector" not in src
    ok("POST /api/learning-assistant/ask returns 200 with correct structure")
    ok("Response does not expose embedding vectors")


# ──────────────────────────────────────────────────────────────────
# 9. Mock LLM Compatibility
# ──────────────────────────────────────────────────────────────────
section("9. Mock LLM Compatibility")

from services.llm import MockLLMService
mock_llm_inst = MockLLMService()

with (
    patch.object(VectorStore, 'total_vectors', new_callable=PropertyMock, return_value=10),
    patch.object(svc.embedding_service, 'embed_text', return_value=[0.1] * 384),
    patch.object(svc.vector_store, 'search', return_value=MOCK_CHUNKS),
    patch.object(svc.llm_service, 'generate_text', side_effect=mock_llm_inst.generate_text),
):
    result = svc.answer("What is sampling?")
    assert result["status"] in {"ANSWERED", "INSUFFICIENT_CONTEXT"}
    assert "answer" in result
    ok("Mock LLM response handled gracefully without crashing")


# ──────────────────────────────────────────────────────────────────
# 10. LLM Explicit Insufficient Context Signal
# ──────────────────────────────────────────────────────────────────
section("10. LLM Explicit Insufficient Context Signal")

INSUFFICIENT_LLM_JSON = json.dumps({
    "answer": "This information cannot be determined from the provided learning material.",
    "confidence": "LOW",
    "chunk_ids_used": []
})

with (
    patch.object(VectorStore, 'total_vectors', new_callable=PropertyMock, return_value=10),
    patch.object(svc.embedding_service, 'embed_text', return_value=[0.1] * 384),
    patch.object(svc.vector_store, 'search', return_value=MOCK_CHUNKS),
    patch.object(svc.llm_service, 'generate_text', return_value=INSUFFICIENT_LLM_JSON),
):
    result = svc.answer("What is the GDP of Mars?")
    assert result["confidence"] == "LOW"
    assert result["status"] == "INSUFFICIENT_CONTEXT"
    ok("LLM 'cannot be determined' phrase triggers INSUFFICIENT_CONTEXT + LOW confidence")


# ──────────────────────────────────────────────────────────────────
# 11. Deduplication — same chunk_id not returned twice
# ──────────────────────────────────────────────────────────────────
section("11. Chunk Deduplication")

DUPE_CHUNKS = [MOCK_CHUNKS[0], MOCK_CHUNKS[0], MOCK_CHUNKS[1]]

with (
    patch.object(VectorStore, 'total_vectors', new_callable=PropertyMock, return_value=10),
    patch.object(svc.embedding_service, 'embed_text', return_value=[0.1] * 384),
    patch.object(svc.vector_store, 'search', return_value=DUPE_CHUNKS),
    patch.object(svc.llm_service, 'generate_text', return_value=MOCK_LLM_JSON),
):
    result = svc.answer("What is stratified sampling?")
    chunk_ids = [s["chunk_id"] for s in result["sources"]]
    assert len(chunk_ids) == len(set(chunk_ids))
    ok("Duplicate chunk_ids deduplicated — each source appears only once")


# ──────────────────────────────────────────────────────────────────
# 12. Backward Compatibility
# ──────────────────────────────────────────────────────────────────
section("12. Backward Compatibility (Phases 3A–3E)")

r = client.get("/api/health")
assert r.status_code == 200
ok("Phase 1 /api/health intact")

r = client.get("/api/documents")
assert r.status_code == 200
ok("Phase 2 /api/documents intact")

r = client.post("/api/assessment/mcqs/generate", json={"document_id": "doc_nss_78th", "count": 2})
assert r.status_code == 200
ok("Phase 3A /api/assessment/mcqs/generate intact")

test_learner = f"learner_{uuid.uuid4().hex[:6]}"
r = client.get(f"/api/learners/{test_learner}/recommendation")
assert r.status_code == 200 and r.json()["status"] == "NO_PROGRESS"
ok("Phase 3E /api/learners/{id}/recommendation intact")


# ──────────────────────────────────────────────────────────────────
# Summary
# ──────────────────────────────────────────────────────────────────
print(f"\n{SEP}")
print(f"  Phase 3F Results:  {_pass} passed,  {_fail} failed")
print(SEP)
sys.exit(0 if _fail == 0 else 1)
