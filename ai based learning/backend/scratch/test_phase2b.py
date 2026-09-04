import sys
from pathlib import Path
import json

backend_path = Path(r"c:\Users\vishr\Downloads\sih\backend")
sys.path.insert(0, str(backend_path))

from fastapi.testclient import TestClient
from main import app
from services.content_cleaner import clean_text_conservative, clean_extracted_blocks
from services.chunker import chunk_document
from models.document import ExtractedBlock
import fitz

client = TestClient(app)

def test_content_cleaner():
    print("\n1. Testing Conservative Content Cleaner...")
    raw = "   National   Sample   Survey  \n\n\n\nSection I:   Formula   W_h = N_h / n_h  \n\n  "
    cleaned = clean_text_conservative(raw)
    print(f"Cleaned output:\n{repr(cleaned)}")
    assert "National Sample Survey" in cleaned
    assert "Formula W_h = N_h / n_h" in cleaned
    assert "\n\n\n" not in cleaned
    print("Content Cleaner Test PASSED! [SUCCESS]")

def test_chunker_logic():
    print("\n2. Testing Structure-Aware Chunker Logic...")
    
    # Generate 10 mock extracted blocks representing 10 pages of a statistical manual
    blocks = []
    for i in range(1, 11):
        text = f"Chapter {i}: Statistical Survey Methodology & Sampling Distribution.\n" + ("This section covers random sampling, confidence intervals, standard error calculations, and multiplier formulas. " * 30)
        blocks.append(ExtractedBlock(document_id="doc_test_001", source="survey_manual.pdf", location=f"Page {i}", text=text))
        
    chunks = chunk_document(blocks=blocks, document_id="doc_test_001", filename="survey_manual.pdf", chunk_size=300, overlap=50)
    print(f"Generated {len(chunks)} chunks from 10 pages.")
    
    assert len(chunks) >= 2, "Should create multiple chunks for 10-page document"
    first_chunk = chunks[0]
    print(f"Chunk 1 ID: {first_chunk.chunk_id}")
    print(f"Chunk 1 Location: {first_chunk.location}")
    print(f"Chunk 1 Word Count: {first_chunk.word_count}")
    
    assert first_chunk.chunk_id == "doc_test_001_chunk_001"
    assert first_chunk.chunk_index == 1
    assert first_chunk.word_count > 0
    assert first_chunk.source == "survey_manual.pdf"
    
    # Verify small document (1 page) produces exactly 1 chunk
    small_block = [ExtractedBlock(document_id="doc_small", source="small.pdf", location="Page 1", text="Brief statistical note.")]
    small_chunks = chunk_document(small_block, "doc_small", "small.pdf", chunk_size=800, overlap=120)
    assert len(small_chunks) == 1
    assert small_chunks[0].chunk_id == "doc_small_chunk_001"
    print("Chunker Logic Test PASSED! [SUCCESS]")

def test_api_integration():
    print("\n3. Testing API Integration (Upload -> Extraction -> Cleaning -> Chunking -> Status -> Chunks)...")
    
    # Create test PDF
    tmp_pdf = backend_path / "data" / "tmp_test" / "phase2b_cpi_manual.pdf"
    tmp_pdf.parent.mkdir(parents=True, exist_ok=True)
    
    doc = fitz.open()
    p1 = doc.new_page()
    p1.insert_text((50, 50), "Consumer Price Index Compilation Guidelines 2026.\nChapter 1: Item Basket Selection & Laspeyres Weighting Diagram.")
    p2 = doc.new_page()
    p2.insert_text((50, 50), "Chapter 2: Price Collection Procedures across Rural & Urban Markets.\nFormula I_t = Sum(P_t * W_0) / Sum(P_0 * W_0).")
    doc.save(str(tmp_pdf))
    doc.close()

    with open(tmp_pdf, "rb") as f:
        res = client.post("/api/documents/upload", files={"file": ("phase2b_cpi_manual.pdf", f, "application/pdf")})
        
    print(f"Upload Status Code: {res.status_code}")
    print(f"Upload Response: {res.json()}")
    assert res.status_code == 201
    doc_id = res.json()["data"]["document_id"]
    assert res.json()["data"]["status"] == "CHUNKED"
    assert res.json()["data"]["chunks"] >= 1

    # Test GET /api/documents/{id}/status
    print(f"\n3b. Testing GET /api/documents/{doc_id}/status ...")
    status_res = client.get(f"/api/documents/{doc_id}/status")
    print(f"Status Response: {status_res.json()}")
    assert status_res.status_code == 200
    assert status_res.json()["status"] == "CHUNKED"
    assert status_res.json()["progress"] >= 60

    # Test GET /api/documents/{id}/chunks
    print(f"\n3c. Testing GET /api/documents/{doc_id}/chunks ...")
    chunks_res = client.get(f"/api/documents/{doc_id}/chunks")
    print(f"Chunks Count: {chunks_res.json()['chunk_count']}")
    assert chunks_res.status_code == 200
    assert len(chunks_res.json()["chunks"]) >= 1
    assert "Consumer Price Index" in chunks_res.json()["chunks"][0]["text"]
    
    print("API Integration Test PASSED! [SUCCESS]")

def run_all():
    print("=== RUNNING PHASE 2B VERIFICATION SUITE ===")
    test_content_cleaner()
    test_chunker_logic()
    test_api_integration()
    print("\nALL PHASE 2B TESTS PASSED SUCCESSFULLY! [SUCCESS]")

if __name__ == "__main__":
    run_all()
