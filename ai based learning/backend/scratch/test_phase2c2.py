import sys, os, json, tempfile, shutil, math

# Force UTF-8 output on Windows
sys.stdout.reconfigure(encoding='utf-8')

BACKEND_DIR = r"C:\Users\vishr\Downloads\sih\backend"
sys.path.insert(0, BACKEND_DIR)
os.chdir(BACKEND_DIR)

from pathlib import Path
from config import settings

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
# Helpers
# ──────────────────────────────────────────────────────────────────
def make_tmp_store():
    """Create a temporary directory for an isolated VectorStore."""
    tmpdir = Path(tempfile.mkdtemp())
    return tmpdir, tmpdir / "test.faiss", tmpdir / "test_meta.json"

def make_embedding_item(chunk_id, text, vector, index=0):
    return {
        "chunk_id": chunk_id,
        "chunk_index": index,
        "vector": vector,
        "text": text,
        "source": "test.pdf",
        "location": "Page 1",
        "locations": ["Page 1"],
        "word_count": len(text.split()),
    }

def normalised_vector(values):
    """Return a normalised float32-like list for a given direction."""
    import numpy as np
    v = np.array(values, dtype=np.float32)
    v = v / np.linalg.norm(v)
    return v.tolist()


# ──────────────────────────────────────────────────────────────────
# 1. VectorStore unit tests
# ──────────────────────────────────────────────────────────────────
section("1. VectorStore — unit tests")

from services.vector_store import VectorStore, get_vector_store

def _unit_tests():
    tmpdir, idx_path, meta_path = make_tmp_store()
    vs = VectorStore(idx_path, meta_path, dimension=4)

    # Empty index created
    assert vs.total_vectors == 0
    ok("Empty index created (total_vectors=0)")

    # No document exists yet
    assert not vs.document_exists("doc_a")
    ok("document_exists returns False on fresh index")

    # Add embeddings for doc_a
    vecs = [normalised_vector([1,0,0,0]), normalised_vector([0,1,0,0])]
    items = [
        make_embedding_item("doc_a_0", "Alpha text A", vecs[0]),
        make_embedding_item("doc_a_1", "Beta text B",  vecs[1]),
    ]
    added = vs.add_document_embeddings("doc_a", items)
    assert added == 2
    ok(f"add_document_embeddings added {added} vectors")

    # Total vectors updated
    assert vs.total_vectors == 2
    ok("total_vectors == 2 after adding doc_a")

    # Metadata count matches
    meta_items = vs._metadata.get("items", [])
    assert len(meta_items) == 2
    ok("metadata items count == 2")

    # indexed_docs updated
    assert vs.document_exists("doc_a")
    ok("document_exists returns True after indexing doc_a")

    # Duplicate prevention
    try:
        vs.add_document_embeddings("doc_a", items)
        fail("Duplicate indexing should raise ValueError")
    except ValueError:
        ok("Duplicate indexing raises ValueError")

    # Second document
    vecs2 = [normalised_vector([0,0,1,0])]
    items2 = [make_embedding_item("doc_b_0", "Gamma text C", vecs2[0])]
    vs.add_document_embeddings("doc_b", items2)
    assert vs.total_vectors == 3
    ok("Second document added; total_vectors == 3")

    # Save
    vs.save()
    assert idx_path.exists()
    assert meta_path.exists()
    ok("save() creates both FAISS and metadata files")

    # Load into fresh instance
    vs2 = VectorStore(idx_path, meta_path, dimension=4)
    assert vs2.total_vectors == 3
    ok("Reload: total_vectors == 3 survives restart")

    assert vs2.document_exists("doc_a") and vs2.document_exists("doc_b")
    ok("Reload: both document_ids survive in metadata")

    meta_items2 = vs2._metadata.get("items", [])
    assert len(meta_items2) == 3
    ok("Reload: metadata items count == 3")

    # Duplicate check still works after reload
    assert vs2.document_exists("doc_a")
    ok("Reload: duplicate guard still works")

    shutil.rmtree(tmpdir)

_unit_tests()


# ──────────────────────────────────────────────────────────────────
# 2. Semantic ranking tests
# ──────────────────────────────────────────────────────────────────
section("2. Semantic Ranking — controlled corpus")

def _ranking_tests():
    from services.embedding_service import get_embedding_service
    emb = get_embedding_service()

    CHUNKS = [
        "Stratified sampling divides a population into homogeneous subgroups called strata before sampling.",
        "Simple random sampling gives every member of the population an equal chance of being selected.",
        "Mean and median are measures of central tendency used to summarise a dataset.",
        "Variance measures how far the observations in a dataset spread from the mean.",
    ]
    labels = ["stratified", "simple_random", "central_tendency", "variance"]

    vectors = emb.embed_texts(CHUNKS)

    tmpdir, idx_path, meta_path = make_tmp_store()
    vs = VectorStore(idx_path, meta_path, dimension=384)

    items = [
        make_embedding_item(f"ctrl_{label}", text, vec, index=i)
        for i, (label, text, vec) in enumerate(zip(labels, CHUNKS, vectors))
    ]
    vs.add_document_embeddings("ctrl_doc", items)

    # Query 1: stratified sampling → should rank "stratified" first
    q1 = emb.embed_text("What is stratified sampling?")
    results = vs.search(q1, top_k=4)
    assert len(results) == 4
    assert results[0]["chunk_id"] == "ctrl_stratified", (
        f"Expected 'ctrl_stratified' first, got '{results[0]['chunk_id']}'"
    )
    ok(f"Query 'stratified sampling' → top result: {results[0]['chunk_id']} (score={results[0]['score']:.3f})")

    # Query 2: spread/variance → should rank "variance" highly
    q2 = emb.embed_text("What measures the spread of observations?")
    results2 = vs.search(q2, top_k=4)
    top_ids = [r["chunk_id"] for r in results2[:2]]
    assert "ctrl_variance" in top_ids, f"Expected 'ctrl_variance' in top-2, got {top_ids}"
    ok(f"Query 'spread of observations' → top-2: {top_ids}")

    # Score ordering: descending
    scores = [r["score"] for r in results]
    assert scores == sorted(scores, reverse=True)
    ok("Results ordered by descending similarity score")

    # Source metadata preserved
    assert results[0]["source"] == "test.pdf"
    assert results[0]["locations"] == ["Page 1"]
    ok("Source and location metadata preserved in results")

    # Document filtering
    # Add a second doc so filtering has something to exclude
    more_items = [make_embedding_item("other_0", "Unrelated text here.", emb.embed_text("Unrelated text here."))]
    vs.add_document_embeddings("other_doc", more_items)
    filtered = vs.search(q1, top_k=10, document_id="ctrl_doc")
    for r in filtered:
        assert r["document_id"] == "ctrl_doc"
    ok(f"Document filter: all {len(filtered)} results belong to ctrl_doc")

    shutil.rmtree(tmpdir)

_ranking_tests()


# ──────────────────────────────────────────────────────────────────
# 3. Config & directory checks
# ──────────────────────────────────────────────────────────────────
section("3. Config & Storage")

assert settings.VECTOR_STORE_DIR.exists(), f"VECTOR_STORE_DIR missing: {settings.VECTOR_STORE_DIR}"
ok(f"VECTOR_STORE_DIR exists: {settings.VECTOR_STORE_DIR}")

assert settings.SEARCH_TOP_K_DEFAULT == 5
assert settings.SEARCH_TOP_K_MAX == 20
ok(f"Search defaults: top_k={settings.SEARCH_TOP_K_DEFAULT}, max={settings.SEARCH_TOP_K_MAX}")

assert settings.FAISS_INDEX_FILE == "learning_materials.faiss"
assert settings.VECTOR_METADATA_FILE == "metadata.json"
ok("FAISS_INDEX_FILE and VECTOR_METADATA_FILE names correct")


# ──────────────────────────────────────────────────────────────────
# 4. Singleton
# ──────────────────────────────────────────────────────────────────
section("4. Singleton")

vs_a = get_vector_store()
vs_b = get_vector_store()
assert vs_a is vs_b
ok("get_vector_store() returns same instance on repeated calls")


# ──────────────────────────────────────────────────────────────────
# 5. Phase 2C-1 backward compatibility
# ──────────────────────────────────────────────────────────────────
section("5. Phase 2C-1 Backward Compatibility")

from services.embedding_service import get_embedding_service
svc = get_embedding_service()
v = svc.embed_text("National Sample Survey data on household expenditure.")
assert len(v) == 384
norm = math.sqrt(sum(x*x for x in v))
assert abs(norm - 1.0) < 1e-3
ok(f"EmbeddingService still produces 384-dim normalised vectors (norm={norm:.4f})")

vecs = svc.embed_texts(["Census", "GDP", "Inflation"])
assert len(vecs) == 3 and all(len(x) == 384 for x in vecs)
ok("Batch embedding still works: 3 × 384 dims")

# ──────────────────────────────────────────────────────────────────
# Summary
# ──────────────────────────────────────────────────────────────────
print(f"\n{SEP}")
print(f"  Phase 2C-2 Results:  {_pass} passed,  {_fail} failed")
print(SEP)
sys.exit(0 if _fail == 0 else 1)
