"""
Phase 2C-1 Smoke Test: Embedding Service
Run from backend/ directory:  python ../scratch/test_phase2c1.py
"""
import sys, os
BACKEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from services.embedding_service import get_embedding_service, EmbeddingService
from config import settings

SEPARATOR = "=" * 60

def test_singleton():
    """Both calls should return the same object."""
    a = get_embedding_service()
    b = get_embedding_service()
    assert a is b, "Singleton broken — two different instances returned"
    print("  [PASS] Singleton: same instance returned on repeated calls")

def test_dimension():
    svc = get_embedding_service()
    dim = svc.dimension
    assert dim == 384, f"Expected 384, got {dim}"
    print(f"  [PASS] Dimension: {dim}")

def test_embed_single():
    svc = get_embedding_service()
    text = "The Annual Survey of Industries collects factory-level data on employment and output."
    vector = svc.embed_text(text)
    assert isinstance(vector, list), "Expected list"
    assert len(vector) == 384, f"Vector length {len(vector)}"
    # Check normalised (L2 ≈ 1.0)
    import math
    norm = math.sqrt(sum(v * v for v in vector))
    assert abs(norm - 1.0) < 1e-3, f"Vector not normalised: norm={norm:.4f}"
    print(f"  [PASS] Single embed: 384-dim, normalised (norm={norm:.4f})")

def test_embed_batch():
    svc = get_embedding_service()
    texts = [
        "GDP measures the total economic output of a country.",
        "The Consumer Price Index tracks changes in the price of a basket of goods.",
        "Census data provides population statistics at national and state levels.",
    ]
    vectors = svc.embed_texts(texts)
    assert len(vectors) == 3, f"Expected 3 vectors, got {len(vectors)}"
    for i, v in enumerate(vectors):
        assert len(v) == 384, f"Vector[{i}] has wrong dimension: {len(v)}"
    print(f"  [PASS] Batch embed: {len(vectors)} vectors × 384 dims")

def test_empty_text_guard():
    svc = get_embedding_service()
    try:
        svc.embed_text("")
        assert False, "Should have raised ValueError"
    except ValueError:
        print("  [PASS] Empty text guard raises ValueError")

def test_config():
    assert settings.EMBEDDING_MODEL == "sentence-transformers/all-MiniLM-L6-v2"
    assert settings.EMBEDDING_DIMENSION == 384
    assert settings.EMBEDDINGS_DIR.exists(), f"EMBEDDINGS_DIR missing: {settings.EMBEDDINGS_DIR}"
    print(f"  [PASS] Config: model={settings.EMBEDDING_MODEL}")
    print(f"  [PASS] Config: EMBEDDINGS_DIR={settings.EMBEDDINGS_DIR}")

if __name__ == "__main__":
    print(SEPARATOR)
    print("  Phase 2C-1 — Embedding Service Smoke Test")
    print(SEPARATOR)

    tests = [
        ("Config & Directory", test_config),
        ("Singleton", test_singleton),
        ("Dimension Property", test_dimension),
        ("Single Text Embed", test_embed_single),
        ("Batch Text Embed", test_embed_batch),
        ("Empty Text Guard", test_empty_text_guard),
    ]

    passed = failed = 0
    for name, fn in tests:
        print(f"\n[{name}]")
        try:
            fn()
            passed += 1
        except Exception as e:
            print(f"  [FAIL] {e}")
            failed += 1

    print(f"\n{SEPARATOR}")
    print(f"  Results: {passed} passed, {failed} failed")
    print(SEPARATOR)
    sys.exit(0 if failed == 0 else 1)
