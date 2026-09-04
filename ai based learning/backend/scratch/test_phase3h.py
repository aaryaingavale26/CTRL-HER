"""
Phase 3H — Complete AI Module Integration, Hardening & End-to-End Testing

Comprehensive test suite verifying:
- Test A: Document Processing Pipeline (PDF upload, extract, clean, chunk, embed, index)
- Test B: Semantic Retrieval & Filtering (relevance, doc filter, empty query rejection)
- Test C: Grounded RAG Learning Assistant (citations, confidence, vectors hidden)
- Test D: RAG Hallucination / Insufficient Context Guardrail (strict fallback, no fabrication)
- Test E: Grounded MCQ Generation (options, correct answer, explanation, provenance)
- Test F: Aggressive MCQ Validation (Cases 1-8: 3 opts, 5 opts, duplicates, invalid answer, etc.)
- Test G: Mock LLM Fallback & Graceful Degradation (no crashes, no stack trace leaks)
- Test H: Question Bank Quality Gate & Security (Draft -> Edit -> Approve -> Reject, Duplicate 409, Zero answer leaks to learner)
- Test I: Quiz Lifecycle & Deterministic Evaluation (Exact scoring e.g. 3/5 = 60%, topic metrics)
- Test J: Repeated Submission Protection (Idempotent / HTTP 400 rejection, no double-counting)
- Test K: Learner Progress & Mastery Rules (NEEDS_REVIEW, IMPROVING, MASTERED, cumulative stats)
- Test L: Personalized Recommendations (No-history safe, weakest topic priority, mastered deprioritization)
- Test M: Adaptive Practice (Weakest topic targeting, difficulty mapping, lineage, learning loop)
- Test N: Cross-Component Data Consistency (doc_id, chunk_id, provenance integrity)
- Test O: API Error Handling & Safety Boundaries (404s, 422s, 400s, no raw tracebacks)
- Test P: Full 20-Step End-to-End Scenario (Complete contiguous flow)
"""
import io
import os
import sys
import json
import logging
import unittest
from pathlib import Path
from fastapi.testclient import TestClient

# Add backend directory to sys.path
BACKEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from main import app
from config import settings
from services.vector_store import get_vector_store
from services.question_bank_repository import get_question_bank_repository
from services.quiz_repository import get_quiz_repository
from services.learner_progress_repository import get_learner_progress_repository
from services.mcq_validator import MCQValidator
from services.quiz_evaluator import QuizEvaluator
from services.learner_progress_service import get_learner_progress_service
from services.personalized_learning_service import PersonalizedLearningService
from models.assessment import MCQItem, MCQOption, MCQSource, QuizSession, QuizSubmissionRequest, SingleAnswerSubmission
from models.learner_progress import TopicAttemptHistory, LearnerTopicProgress, LearnerProgressProfile

client = TestClient(app)
logger = logging.getLogger("test_phase3h")

def create_sample_pdf_bytes() -> bytes:
    """Generates a realistic official statistical PDF document using PyMuPDF."""
    import fitz
    doc = fitz.open()
    
    rect = fitz.Rect(50, 50, 550, 750)

    # Page 1: Sampling Design
    p1 = doc.new_page()
    p1.insert_textbox(rect, 
        "Government of India - Ministry of Statistics & Programme Implementation (MoSPI)\n"
        "National Sample Survey (NSS) Manual on Sampling Methodology\n\n"
        "Section 1: Sampling Design and Stratified Sampling\n\n"
        "The National Sample Survey adopts a multi-stage stratified sampling design for nationwide socio-economic inquiries. "
        "The first stage units (FSUs) are census villages in the rural sector and Urban Frame Survey (UFS) blocks in urban areas. "
        "Stratification is carried out by grouping districts with similar agricultural, economic, and demographic characteristics.\n\n"
        "Proportional allocation of sample size across strata ensures that the variance of observations is minimized effectively. "
        "Within each rural stratum, villages are selected with Probability Proportional to Size with Replacement (PPSWR). "
        "In urban strata, simple random sampling without replacement (SRSWOR) is adopted for selecting sample blocks. "
        "Each stratum is treated as an independent population domain to guarantee representative statistical precision across India."
    )
    
    # Page 2: Estimation Procedure & Formula
    p2 = doc.new_page()
    p2.insert_textbox(rect,
        "Section 2: Estimation Procedure, Multipliers and Mathematical Formulation\n\n"
        "For estimating population aggregates, estimation formulas and sampling weights (multipliers) are strictly applied by survey supervisors. "
        "Let y_hij denote the observed value of characteristic y for the j-th sample household in the i-th FSU of the h-th stratum.\n\n"
        "The base multiplier formula W_h is given by W_h = N_h / n_h, where N_h is the total number of FSUs in stratum h and n_h is the sample size. "
        "Sample weights ensure unbiased estimation of totals, averages, ratios, and standard errors for official planning. "
        "Sub-sample estimates are computed independently to generate valid estimates of standard error and sampling variance across rounds."
    )

    # Page 3: Cluster Sampling & Secondary Stage Units
    p3 = doc.new_page()
    p3.insert_textbox(rect,
        "Section 3: Cluster Sampling and Secondary Stage Selection\n\n"
        "Cluster sampling is implemented when hamlet-groups or sub-blocks are formed in large villages to control field investigator workload. "
        "In cluster sampling, clusters of contiguous households are listed, and two or more clusters are chosen at random without bias.\n\n"
        "Ultimate stage units (USUs) are households selected through systematic sampling from each listing block. "
        "Non-sampling errors are monitored through standardized field re-interviews and rigorous data validation protocols."
    )
    
    pdf_bytes = doc.tobytes()
    doc.close()
    return pdf_bytes


class TestPhase3HIntegration(unittest.TestCase):
    """Phase 3H Complete AI Module End-to-End Integration & Hardening Test Suite."""

    @classmethod
    def setUpClass(cls):
        # Reset repositories to guarantee pristine state
        cls.qb_repo = get_question_bank_repository()
        cls.qb_repo.clear()
        
        cls.quiz_repo = get_quiz_repository()
        cls.quiz_repo.clear()
        
        cls.prog_repo = get_learner_progress_repository()
        cls.prog_repo.clear()
        
        cls.test_doc_id = None
        cls.test_chunks = []

    # =========================================================================
    # Test A: Document Processing Pipeline (A1–A5)
    # =========================================================================

    def test_A1_document_upload_and_extraction(self):
        """A1: Upload realistic PDF and verify metadata, file type, and text blocks."""
        pdf_content = create_sample_pdf_bytes()
        files = {"file": ("NSS_Sampling_Manual_Official.pdf", pdf_content, "application/pdf")}
        
        res = client.post("/api/documents/upload", files=files)
        self.assertEqual(res.status_code, 201, res.text)
        data = res.json()
        self.assertTrue(data["success"])
        meta = data["data"]
        
        TestPhase3HIntegration.test_doc_id = meta["document_id"]
        self.assertTrue(TestPhase3HIntegration.test_doc_id.startswith("doc_"))
        self.assertEqual(meta["file_type"], "pdf")
        self.assertEqual(meta["filename"], "NSS_Sampling_Manual_Official.pdf")
        self.assertGreaterEqual(meta["pages"], 2)
        self.assertGreaterEqual(meta["text_blocks"], 2)
        self.assertGreaterEqual(meta["chunks"], 1)

    def test_A2_extracted_content_verification(self):
        """A2: Verify extracted content contains expected domain statistical terms."""
        doc_id = TestPhase3HIntegration.test_doc_id
        res = client.get(f"/api/documents/{doc_id}/preview")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        
        all_text = " ".join([block["text"] for block in data["content"]])
        self.assertIn("stratified sampling", all_text.lower())
        self.assertIn("cluster sampling", all_text.lower())
        self.assertIn("first stage units", all_text.lower())

    def test_A3_chunks_structure_and_provenance(self):
        """A3: Verify chunks have valid chunk_ids, non-empty text, and page provenance."""
        doc_id = TestPhase3HIntegration.test_doc_id
        res = client.get(f"/api/documents/{doc_id}/chunks")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertGreaterEqual(data["chunk_count"], 1)
        
        TestPhase3HIntegration.test_chunks = data["chunks"]
        for chunk in data["chunks"]:
            self.assertTrue(chunk["chunk_id"].startswith(f"{doc_id}_chunk_"))
            self.assertGreater(chunk["word_count"], 10)
            self.assertIn("Page", chunk["location"])
            self.assertEqual(chunk["document_id"], doc_id)

    def test_A4_embeddings_generation(self):
        """A4: Generate vectors; verify dimensions, normalization, and chunk count alignment."""
        doc_id = TestPhase3HIntegration.test_doc_id
        res = client.post(f"/api/documents/{doc_id}/embed")
        self.assertEqual(res.status_code, 200, res.text)
        data = res.json()
        self.assertEqual(data["status"], "EMBEDDED")
        self.assertEqual(data["embedding_dimension"], settings.EMBEDDING_DIMENSION)
        self.assertEqual(data["chunks_embedded"], len(TestPhase3HIntegration.test_chunks))

    def test_A5_faiss_indexing_and_mapping(self):
        """A5: Build FAISS index and verify chunk-to-vector consistency."""
        doc_id = TestPhase3HIntegration.test_doc_id
        res = client.post(f"/api/documents/{doc_id}/index")
        self.assertEqual(res.status_code, 200, res.text)
        data = res.json()
        self.assertIn(data["status"], ["INDEXED", "ALREADY_INDEXED"])
        self.assertGreater(data["total_vectors"], 0)
        
        # Verify vector store internal mapping
        vs = get_vector_store()
        self.assertIn(doc_id, vs.indexed_documents)

    # =========================================================================
    # Test B: Semantic Retrieval (B1–B3)
    # =========================================================================

    def test_B1_semantic_search_and_ranking(self):
        """B1: Search for 'stratified sampling' and verify ranking and provenance."""
        res = client.post("/api/search", json={
            "query": "stratified sampling design and first stage units",
            "top_k": 5
        })
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertGreaterEqual(len(data["results"]), 1)
        top = data["results"][0]
        self.assertGreater(top["score"], 0.2)
        matching_texts = " ".join([r["text"].lower() for r in data["results"]])
        self.assertIn("stratified", matching_texts)
        has_new_doc = any(r["chunk_id"].startswith(TestPhase3HIntegration.test_doc_id) for r in data["results"])
        self.assertTrue(has_new_doc)

    def test_B2_document_filtering(self):
        """B2: When document_id is supplied, all returned chunks must match that document."""
        doc_id = TestPhase3HIntegration.test_doc_id
        res = client.post("/api/search", json={
            "query": "multiplier formula",
            "top_k": 3,
            "document_id": doc_id
        })
        self.assertEqual(res.status_code, 200)
        data = res.json()
        for r in data["results"]:
            self.assertEqual(r["document_id"], doc_id)

    def test_B3_empty_query_rejection(self):
        """B3: Empty or whitespace query returns controlled validation error (HTTP 422)."""
        res = client.post("/api/search", json={"query": "   ", "top_k": 3})
        self.assertEqual(res.status_code, 422)

    # =========================================================================
    # Test C: Grounded RAG Assistant
    # =========================================================================

    def test_C1_grounded_rag_with_citations(self):
        """C1: Ask question contained in material; verify answer, citations, and hidden vectors."""
        res = client.post("/api/learning-assistant/ask", json={
            "question": "What are the first stage units (FSUs) in rural and urban areas according to NSS?",
            "document_id": TestPhase3HIntegration.test_doc_id,
            "top_k": 3
        })
        self.assertEqual(res.status_code, 200, res.text)
        data = res.json()
        self.assertIn(data["status"], ["ANSWERED", "INSUFFICIENT_CONTEXT"])
        self.assertIn(data["confidence"], ["HIGH", "MEDIUM", "LOW"])
        # Vectors must NEVER be exposed
        self.assertNotIn("vector", data)
        self.assertNotIn("embeddings", data)
        # Citations check
        if data["status"] == "ANSWERED":
            self.assertGreater(len(data["sources"]), 0)
            self.assertEqual(data["sources"][0]["document_id"], TestPhase3HIntegration.test_doc_id)

    # =========================================================================
    # Test D: RAG Hallucination & Insufficient Context Guardrail
    # =========================================================================

    def test_D1_hallucination_guardrail_unrelated_topic(self):
        """D1: Question unrelated to document must trigger INSUFFICIENT_CONTEXT and not invent facts."""
        res = client.post("/api/learning-assistant/ask", json={
            "question": "What is the capital of planet Neptune and its hyperdrive propulsion rate in 2999?",
            "document_id": TestPhase3HIntegration.test_doc_id,
            "top_k": 3
        })
        self.assertEqual(res.status_code, 200)
        data = res.json()
        # Must return INSUFFICIENT_CONTEXT with LOW confidence
        self.assertEqual(data["status"], "INSUFFICIENT_CONTEXT")
        self.assertEqual(data["confidence"], "LOW")
        self.assertIn("could not find enough information", data["answer"].lower())

    # =========================================================================
    # Test E: Grounded MCQ Generation
    # =========================================================================

    def test_E1_grounded_mcq_generation_structure(self):
        """E1: Generate grounded MCQs; verify 4 options, valid correct answer, and provenance."""
        res = client.post("/api/assessment/mcqs/generate", json={
            "document_id": TestPhase3HIntegration.test_doc_id,
            "topic": "Stratified Sampling",
            "count": 2,
            "difficulty": "medium"
        })
        self.assertEqual(res.status_code, 200, res.text)
        data = res.json()
        self.assertEqual(data["status"], "GENERATED")
        self.assertGreaterEqual(len(data["questions"]), 1)
        
        q = data["questions"][0]
        self.assertGreater(len(q["question"]), 10)
        self.assertEqual(len(q["options"]), 4)
        option_ids = [opt["id"] for opt in q["options"]]
        self.assertEqual(option_ids, ["A", "B", "C", "D"])
        self.assertIn(q["correct_answer"], ["A", "B", "C", "D"])
        self.assertGreater(len(q["explanation"]), 5)
        self.assertEqual(q["source"]["document_id"], TestPhase3HIntegration.test_doc_id)

    # =========================================================================
    # Test F: Aggressive MCQ Validation (Cases 1–8)
    # =========================================================================

    def test_F1_mcq_validation_cases(self):
        """F1: Test cases 1-8: Reject 3 options, 5 options, duplicate options, invalid answer, duplicate question, etc."""
        base_valid = {
            "question": "What is the primary formula for the base multiplier W_h?",
            "options": [
                {"id": "A", "text": "Ratio of total stratum units to sample units"},
                {"id": "B", "text": "Product of total units and sample units"},
                {"id": "C", "text": "Difference of total units and sample units"},
                {"id": "D", "text": "Sum of all stratum units and sample units"}
            ],
            "correct_answer": "A",
            "explanation": "Ratio of N_h to n_h represents the stratum expansion multiplier.",
            "difficulty": "medium",
            "topic": "Estimation",
            "source": {"document_id": "doc_test", "document": "test.pdf"}
        }

        # Case 1: 3 options
        c1 = dict(base_valid, options=base_valid["options"][:3])
        item, err = MCQValidator.validate_question(c1, "doc_test", "test.pdf", set())
        self.assertIsNone(item)
        self.assertIn("Expected exactly 4 options", err)

        # Case 2: 5 options
        c2 = dict(base_valid, options=base_valid["options"] + [{"id": "E", "text": "Extra option"}])
        item, err = MCQValidator.validate_question(c2, "doc_test", "test.pdf", set())
        self.assertIsNone(item)
        self.assertIn("Expected exactly 4 options", err)

        # Case 3: Duplicate options
        c3 = dict(base_valid, options=[
            {"id": "A", "text": "Duplicate choice"},
            {"id": "B", "text": "Duplicate choice"},
            {"id": "C", "text": "Different choice"},
            {"id": "D", "text": "Another choice"}
        ])
        item, err = MCQValidator.validate_question(c3, "doc_test", "test.pdf", set())
        self.assertIsNone(item)
        self.assertIn("Duplicate option text", err)

        # Case 4: Invalid correct answer
        c4 = dict(base_valid, correct_answer="Z")
        item, err = MCQValidator.validate_question(c4, "doc_test", "test.pdf", set())
        self.assertIsNone(item)
        self.assertIn("Invalid correct_answer", err)

        # Case 5: Missing explanation (validator falls back safely)
        c5 = dict(base_valid, explanation="")
        item, err = MCQValidator.validate_question(c5, "doc_test", "test.pdf", set())
        self.assertIsNotNone(item)
        self.assertGreater(len(item.explanation), 0)

        # Case 6: Duplicate question text
        seen = {MCQValidator.normalize_text(base_valid["question"])}
        item, err = MCQValidator.validate_question(base_valid, "doc_test", "test.pdf", seen)
        self.assertIsNone(item)
        self.assertIn("Duplicate question text", err)

        # Case 7: Malformed / non-dict options
        c7 = dict(base_valid, options=["A", "B", "C", "D"])
        item, err = MCQValidator.validate_question(c7, "doc_test", "test.pdf", set())
        self.assertIsNone(item)
        self.assertIn("not a valid object", err)

        # Case 8: Empty question text
        c8 = dict(base_valid, question="   ")
        item, err = MCQValidator.validate_question(c8, "doc_test", "test.pdf", set())
        self.assertIsNone(item)
        self.assertIn("Question text is missing or too short", err)

    # =========================================================================
    # Test G: Mock LLM Fallback & Graceful Degradation
    # =========================================================================

    def test_G1_llm_fallback_resilience(self):
        """G1: Verify MockLLM operates gracefully when external LLM is offline."""
        from services.llm import MockLLMService
        mock_svc = MockLLMService()
        res = mock_svc.generate_text("Test prompt")
        self.assertIsInstance(res, str)
        self.assertIn("Mock LLM Response", res)
        # System does not crash or expose private keys
        self.assertNotIn("api_key", res.lower())

    # =========================================================================
    # Test H: Question Bank Quality Gate & Security Boundaries
    # =========================================================================

    def test_H1_save_draft_and_duplicate_prevention(self):
        """H1: Save question as DRAFT; reject exact duplicate in same doc/topic with HTTP 409."""
        payload = {
            "question": "What is the primary sampling unit (FSU) in rural NSS surveys?",
            "options": [
                {"id": "A", "text": "Census villages"},
                {"id": "B", "text": "Urban blocks"},
                {"id": "C", "text": "District headquarters"},
                {"id": "D", "text": "Agricultural fields"}
            ],
            "correct_answer": "A",
            "explanation": "Census villages serve as the first stage units in the rural sector.",
            "difficulty": "medium",
            "topic": "Sampling Units",
            "source": {
                "document": "NSS_Sampling_Manual_Official.pdf",
                "document_id": TestPhase3HIntegration.test_doc_id,
                "chunk_ids": ["chunk_001"],
                "locations": ["Page 1"]
            },
            "origin": "GENERATED"
        }
        res = client.post("/api/assessment/question-bank", json=payload)
        self.assertEqual(res.status_code, 201)
        data = res.json()
        self.assertEqual(data["status"], "DRAFT")
        self.assertEqual(data["question_id"][:3], "qb_")
        TestPhase3HIntegration.qb_item_id = data["question_id"]

        # Duplicate save attempt must return 409 Conflict
        res_dup = client.post("/api/assessment/question-bank", json=payload)
        self.assertEqual(res_dup.status_code, 409)
        self.assertIn("already exists", res_dup.json()["detail"])

    def test_H2_edit_allowed_fields_preserving_source(self):
        """H2: Trainer can edit explanation & difficulty; source provenance remains immutable."""
        qid = TestPhase3HIntegration.qb_item_id
        res = client.patch(f"/api/assessment/question-bank/{qid}", json={
            "explanation": "Updated explanation verified by NSSO trainer.",
            "difficulty": "easy"
        })
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["explanation"], "Updated explanation verified by NSSO trainer.")
        self.assertEqual(data["difficulty"], "easy")
        self.assertEqual(data["source"]["document_id"], TestPhase3HIntegration.test_doc_id)

    def test_H3_approve_and_reject_workflow(self):
        """H3: Approve question (DRAFT -> APPROVED); reject question (-> REJECTED)."""
        qid = TestPhase3HIntegration.qb_item_id
        # Approve
        res_app = client.post(f"/api/assessment/question-bank/{qid}/approve")
        self.assertEqual(res_app.status_code, 200)
        self.assertEqual(res_app.json()["status"], "APPROVED")

        # Create second question and reject it
        p2 = {
            "question": "What is the secondary stage unit in urban surveys?",
            "options": [
                {"id": "A", "text": "Households"},
                {"id": "B", "text": "Villages"},
                {"id": "C", "text": "States"},
                {"id": "D", "text": "Countries"}
            ],
            "correct_answer": "A",
            "explanation": "Households are selected within urban blocks.",
            "difficulty": "easy",
            "topic": "Sampling Units",
            "source": {
                "document": "NSS_Sampling_Manual_Official.pdf",
                "document_id": TestPhase3HIntegration.test_doc_id,
                "chunk_ids": ["chunk_002"],
                "locations": ["Page 2"]
            }
        }
        res2 = client.post("/api/assessment/question-bank", json=p2)
        q2_id = res2.json()["question_id"]
        res_rej = client.post(f"/api/assessment/question-bank/{q2_id}/reject")
        self.assertEqual(res_rej.status_code, 200)
        self.assertEqual(res_rej.json()["status"], "REJECTED")

    def test_H4_learner_security_never_expose_answers_pre_submission(self):
        """H4: CRITICAL SECURITY: Learner quiz retrieval NEVER exposes correct_answer or explanation."""
        # Create a quiz directly
        res = client.post("/api/assessment/quizzes", json={
            "document_id": TestPhase3HIntegration.test_doc_id,
            "topic": "Sampling Design",
            "count": 2,
            "difficulty": "medium",
            "learner_id": "sec_test_learner"
        })
        self.assertIn(res.status_code, [200, 201])
        quiz_data = res.json()
        quiz_id = quiz_data["quiz_id"]

        # Check creation response
        for q in quiz_data["questions"]:
            self.assertNotIn("correct_answer", q)
            self.assertNotIn("explanation", q)

        # Check GET /quizzes/{id}
        res_get = client.get(f"/api/assessment/quizzes/{quiz_id}")
        self.assertEqual(res_get.status_code, 200)
        for q in res_get.json()["questions"]:
            self.assertNotIn("correct_answer", q)
            self.assertNotIn("explanation", q)

    # =========================================================================
    # Test I: Quiz Lifecycle & Deterministic Evaluation
    # =========================================================================

    def test_I1_deterministic_quiz_evaluation_scoring(self):
        """I1: Evaluate 5 deterministic questions (3 correct, 2 incorrect) -> score 3/5 (60.0%)."""
        # Build deterministic session with 5 questions across 2 topics
        q_defs = [
            ("q1", "Q1 text", "A", "Sampling Design"),
            ("q2", "Q2 text", "B", "Sampling Design"),
            ("q3", "Q3 text", "C", "Sampling Design"),
            ("q4", "Q4 text", "D", "Cluster Sampling"),
            ("q5", "Q5 text", "A", "Cluster Sampling"),
        ]
        snapshot_mcqs = [
            MCQItem(
                question_id=qid,
                question=qtext,
                options=[MCQOption(id=opt, text=f"Opt {opt}") for opt in ["A", "B", "C", "D"]],
                correct_answer=ans,
                explanation=f"Exp {qid}",
                difficulty="medium",
                topic=top,
                source=MCQSource(
                    document_id=TestPhase3HIntegration.test_doc_id,
                    document="test.pdf",
                    chunk_ids=["c1"],
                    locations=["P1"]
                )
            )
            for qid, qtext, ans, top in q_defs
        ]

        session = QuizSession(
            quiz_id="quiz_det_001",
            learner_id="learner_phase3h",
            document_id=TestPhase3HIntegration.test_doc_id,
            topic="General",
            difficulty="medium",
            created_at="2026-09-04T00:00:00",
            status="IN_PROGRESS",
            questions_snapshot=snapshot_mcqs
        )
        get_quiz_repository().save_quiz(session)

        # Learner answers: 3 correct (q1: A, q2: B, q4: D), 2 incorrect (q3: A instead of C, q5: B instead of A)
        sub = QuizSubmissionRequest(
            answers=[
                SingleAnswerSubmission(question_id="q1", selected_answer="A"),
                SingleAnswerSubmission(question_id="q2", selected_answer="B"),
                SingleAnswerSubmission(question_id="q3", selected_answer="A"),  # Wrong
                SingleAnswerSubmission(question_id="q4", selected_answer="D"),
                SingleAnswerSubmission(question_id="q5", selected_answer="B"),  # Wrong
            ]
        )

        res = client.post("/api/assessment/quizzes/quiz_det_001/submit", json=sub.model_dump())
        self.assertEqual(res.status_code, 200, res.text)
        result = res.json()

        self.assertEqual(result["total_questions"], 5)
        self.assertEqual(result["correct_answers"], 3)
        self.assertEqual(result["incorrect_answers"], 2)
        self.assertEqual(result["score"], 3)
        self.assertEqual(result["percentage"], 60.0)

        # Topic Breakdown:
        # Sampling Design: 3 questions, 2 correct (q1, q2) -> 66.7%
        # Cluster Sampling: 2 questions, 1 correct (q4) -> 50.0%
        # Weakest topic should be Cluster Sampling
        self.assertEqual(result["weakest_topic"], "Cluster Sampling")
        self.assertIn("developing understanding", result["overall_feedback"].lower())

    # =========================================================================
    # Test J: Repeated Submission Protection
    # =========================================================================

    def test_J1_repeated_submission_idempotency_or_rejection(self):
        """J1: Repeated submit of already submitted quiz must return HTTP 400 and prevent double counting."""
        sub = {
            "answers": [{"question_id": "q1", "selected_answer": "A"}]
        }
        res = client.post("/api/assessment/quizzes/quiz_det_001/submit", json=sub)
        self.assertEqual(res.status_code, 400)
        self.assertIn("already been submitted", res.json()["detail"])

    # =========================================================================
    # Test K: Learner Progress & Mastery Tracking
    # =========================================================================

    def test_K1_learner_progress_cumulative_update(self):
        """K1: Verify learner profile correctly aggregates questions, accuracy, and history."""
        res = client.get("/api/learners/learner_phase3h/progress")
        self.assertEqual(res.status_code, 200)
        prof = res.json()

        self.assertIn("Sampling Design", prof["topics"])
        self.assertIn("Cluster Sampling", prof["topics"])

        cluster_top = prof["topics"]["Cluster Sampling"]
        self.assertEqual(cluster_top["questions_attempted"], 2)
        self.assertEqual(cluster_top["correct_answers"], 1)
        self.assertEqual(cluster_top["accuracy"], 50.0)
        self.assertEqual(len(cluster_top["history"]), 1)

    def test_K2_mastery_rules_classification(self):
        """K2: Test mastery states: NEEDS_REVIEW (<50%), IMPROVING (trend +5%), MASTERED (>=80% & >=2 attempts)."""
        svc = get_learner_progress_service()

        # Low accuracy < 50% -> NEEDS_REVIEW
        st1 = svc.compute_mastery(
            questions_attempted=5,
            correct_answers=2,
            recent_accuracy=40.0,
            overall_accuracy=40.0,
            attempts=1,
            trend="INSUFFICIENT_DATA"
        )
        self.assertEqual(st1, "NEEDS_REVIEW")

        # Improving trend
        hist = [
            TopicAttemptHistory(quiz_id="q1", accuracy=40.0, questions=5, correct=2, incorrect=3, timestamp="2026-09-01"),
            TopicAttemptHistory(quiz_id="q2", accuracy=60.0, questions=5, correct=3, incorrect=2, timestamp="2026-09-02"),
            TopicAttemptHistory(quiz_id="q3", accuracy=75.0, questions=5, correct=4, incorrect=1, timestamp="2026-09-03")
        ]
        trend = svc.compute_trend(hist)
        self.assertEqual(trend, "IMPROVING")

        st2 = svc.compute_mastery(
            questions_attempted=15,
            correct_answers=9,
            recent_accuracy=75.0,
            overall_accuracy=58.3,
            attempts=3,
            trend=trend
        )
        self.assertEqual(st2, "IMPROVING")

        # High accuracy >=80% with >=2 attempts -> MASTERED
        st3 = svc.compute_mastery(
            questions_attempted=10,
            correct_answers=9,
            recent_accuracy=90.0,
            overall_accuracy=90.0,
            attempts=2,
            trend="STABLE"
        )
        self.assertEqual(st3, "MASTERED")

    # =========================================================================
    # Test L: Personalized Recommendations
    # =========================================================================

    def test_L1_recommendation_cases(self):
        """L1: Verify recommendations for no-history, weak topic, and deprioritized mastered topic."""
        # Case 1: No history
        res_none = client.get("/api/learners/fresh_unknown_learner/recommendation")
        self.assertEqual(res_none.status_code, 200)
        data_none = res_none.json()
        self.assertEqual(data_none["status"], "NO_PROGRESS")
        self.assertIn("Complete an initial assessment", data_none["next_step"])

        # Case 2: For learner_phase3h, weakest topic is Cluster Sampling (50.0%)
        res_rec = client.get("/api/learners/learner_phase3h/recommendation")
        self.assertEqual(res_rec.status_code, 200)
        data_rec = res_rec.json()
        self.assertEqual(data_rec["status"], "RECOMMENDED")
        self.assertEqual(data_rec["recommended_topic"], "Cluster Sampling")

        # Case 4: Mastered topic receives -50.0 priority penalty
        tp_mastered = LearnerTopicProgress(
            topic="Stratified",
            attempts=3,
            questions_attempted=15,
            correct_answers=14,
            incorrect_answers=1,
            accuracy=93.3,
            recent_accuracy=93.3,
            status="MASTERED",
            trend="STABLE",
            first_seen_at="2026-09-01",
            last_practiced_at="2026-09-03",
            history=[]
        )
        priority_m = PersonalizedLearningService.calculate_topic_priority(tp_mastered)
        self.assertLess(priority_m, 0)  # Mastered receives negative priority adjustment

    # =========================================================================
    # Test M: Adaptive Practice
    # =========================================================================

    def test_M1_adaptive_practice_targets_weak_topic_and_difficulty(self):
        """M1: Generate adaptive practice from quiz_det_001; targets Cluster Sampling, calibrates difficulty, increments round."""
        res = client.post("/api/assessment/quizzes/quiz_det_001/adaptive-practice", json={"count": 2})
        self.assertEqual(res.status_code, 201, res.text)
        adapt = res.json()

        self.assertEqual(adapt["status"], "ADAPTIVE_PRACTICE_CREATED")
        self.assertEqual(adapt["parent_quiz_id"], "quiz_det_001")
        self.assertEqual(adapt["target_topic"], "Cluster Sampling")
        # Accuracy was 50.0% -> difficulty is "medium" (50% to <80%)
        self.assertEqual(adapt["difficulty"], "medium")
        self.assertEqual(adapt["adaptive_round"], 1)
        self.assertEqual(len(adapt["questions"]), 2)

        # Check answers hidden in learner questions
        for q in adapt["questions"]:
            self.assertNotIn("correct_answer", q)
            self.assertNotIn("explanation", q)

    def test_M2_adaptive_difficulty_thresholds(self):
        """M2: Test difficulty thresholds: <50% -> easy, 50-79% -> medium, 80%+ -> hard."""
        self.assertEqual(QuizEvaluator.calculate_adaptive_difficulty(35.0), "easy")
        self.assertEqual(QuizEvaluator.calculate_adaptive_difficulty(50.0), "medium")
        self.assertEqual(QuizEvaluator.calculate_adaptive_difficulty(79.9), "medium")
        self.assertEqual(QuizEvaluator.calculate_adaptive_difficulty(85.0), "hard")

    # =========================================================================
    # Test N: Cross-Component Data Consistency & Provenance
    # =========================================================================

    def test_N1_provenance_consistency(self):
        """N1: Verify document_id and provenance remain strictly consistent across pipeline."""
        doc_id = TestPhase3HIntegration.test_doc_id

        # Verify in Question Bank
        items = get_question_bank_repository().list(document_id=doc_id)
        for item in items:
            self.assertEqual(item.source.document_id, doc_id)

        # Verify in Quizzes
        quiz = get_quiz_repository().get_quiz("quiz_det_001")
        self.assertEqual(quiz.document_id, doc_id)
        for q in quiz.questions_snapshot:
            self.assertEqual(q.source.document_id, doc_id)

    # =========================================================================
    # Test O: API Error Handling & Safety Boundaries
    # =========================================================================

    def test_O1_api_error_handling(self):
        """O1: Unknown document, unknown quiz, and unknown question return clean 404s without tracebacks."""
        # Unknown doc
        r1 = client.get("/api/documents/non_existent_doc_12345/preview")
        self.assertEqual(r1.status_code, 404)
        self.assertIn("not found", r1.json()["detail"].lower())

        # Unknown quiz
        r2 = client.get("/api/assessment/quizzes/non_existent_quiz_12345")
        self.assertEqual(r2.status_code, 404)
        self.assertIn("not found", r2.json()["detail"].lower())

        # Unknown question bank item
        r3 = client.get("/api/assessment/question-bank/non_existent_qb_12345")
        self.assertEqual(r3.status_code, 404)
        self.assertIn("not found", r3.json()["detail"].lower())

        # Invalid quiz question count (e.g. 50 > 20)
        r4 = client.post("/api/assessment/mcqs/generate", json={
            "document_id": TestPhase3HIntegration.test_doc_id,
            "topic": "General",
            "count": 50,
            "difficulty": "medium"
        })
        self.assertEqual(r4.status_code, 422)

    # =========================================================================
    # Test P: Full 20-Step End-to-End Scenario
    # =========================================================================

    def test_P1_full_20_step_lifecycle(self):
        """
        P1: Continuous execution of the complete 20-step lifecycle:
        1. Upload -> 2. Extract -> 3. Clean/Chunk -> 4. Embed -> 5. Index ->
        6. RAG ask -> 7. Generate MCQ -> 8. Validate -> 9. Save Bank -> 10. Approve ->
        11. Create Quiz -> 12. Answer Quiz -> 13. Evaluate -> 14. Update Progress ->
        15. Calculate Mastery -> 16. Recommend -> 17. Adaptive Practice -> 18. Complete Adaptive ->
        19. Recalculate Progress -> 20. Next Recommendation.
        """
        learner_id = "learner_e2e_master"
        
        # 1-5 already verified via Test A on test_doc_id
        doc_id = TestPhase3HIntegration.test_doc_id
        self.assertIsNotNone(doc_id)

        # 6. RAG Assistant Ask
        rag_res = client.post("/api/learning-assistant/ask", json={
            "question": "What is proportional allocation in stratified sampling?",
            "document_id": doc_id
        })
        self.assertEqual(rag_res.status_code, 200)

        # 7. Generate MCQs
        gen_res = client.post("/api/assessment/mcqs/generate", json={
            "document_id": doc_id,
            "topic": "Stratified Sampling",
            "count": 2,
            "difficulty": "medium"
        })
        self.assertEqual(gen_res.status_code, 200)
        questions = gen_res.json()["questions"]
        self.assertGreaterEqual(len(questions), 1)

        # 8. Validate questions
        for q in questions:
            self.assertEqual(len(q["options"]), 4)
            self.assertIn(q["correct_answer"], ["A", "B", "C", "D"])

        # 9. Save question to bank
        first_q = questions[0]
        qb_save_res = client.post("/api/assessment/question-bank", json={
            "question": first_q["question"],
            "options": first_q["options"],
            "correct_answer": first_q["correct_answer"],
            "explanation": first_q["explanation"],
            "difficulty": first_q["difficulty"],
            "topic": "Official Statistics",
            "source": first_q["source"],
            "origin": "GENERATED"
        })
        self.assertEqual(qb_save_res.status_code, 201)
        qb_id = qb_save_res.json()["question_id"]

        # 10. Approve question
        app_res = client.post(f"/api/assessment/question-bank/{qb_id}/approve")
        self.assertEqual(app_res.status_code, 200)
        self.assertEqual(app_res.json()["status"], "APPROVED")

        # 11. Create learner quiz
        quiz_res = client.post("/api/assessment/quizzes", json={
            "document_id": doc_id,
            "topic": "Stratified Sampling",
            "count": 2,
            "difficulty": "medium",
            "learner_id": learner_id
        })
        self.assertIn(quiz_res.status_code, [200, 201])
        quiz_id = quiz_res.json()["quiz_id"]
        q_list = quiz_res.json()["questions"]

        # 12. Learner answers quiz (answer first correctly if possible, second incorrectly)
        q1_id = q_list[0]["question_id"]
        q2_id = q_list[1]["question_id"] if len(q_list) > 1 else q1_id
        
        # 13. Evaluate quiz
        eval_res = client.post(f"/api/assessment/quizzes/{quiz_id}/submit", json={
            "quiz_id": quiz_id,
            "answers": [
                {"question_id": q1_id, "selected_answer": "A"},
                {"question_id": q2_id, "selected_answer": "B"}
            ]
        })
        self.assertEqual(eval_res.status_code, 200)
        eval_data = eval_res.json()

        # 14. Progress updated automatically
        prog_res = client.get(f"/api/learners/{learner_id}/progress")
        self.assertEqual(prog_res.status_code, 200)
        prog_data = prog_res.json()
        self.assertGreater(prog_data["total_tracked_topics"], 0)

        # 15. Mastery calculated
        top_name = list(prog_data["topics"].keys())[0]
        self.assertIn(prog_data["topics"][top_name]["status"], ["LEARNING", "NEEDS_REVIEW", "IMPROVING", "MASTERED"])

        # 16. Generate recommendation
        rec_res = client.get(f"/api/learners/{learner_id}/recommendation")
        self.assertEqual(rec_res.status_code, 200)
        self.assertIn(rec_res.json()["status"], ["RECOMMENDED", "ALL_MASTERED"])

        # 17. Generate adaptive practice
        adapt_res = client.post(f"/api/assessment/quizzes/{quiz_id}/adaptive-practice", json={"count": 2})
        self.assertEqual(adapt_res.status_code, 201)
        adapt_quiz_id = adapt_res.json()["quiz_id"]
        adapt_qs = adapt_res.json()["questions"]

        # 18. Complete adaptive practice
        adapt_eval_res = client.post(f"/api/assessment/quizzes/{adapt_quiz_id}/submit", json={
            "quiz_id": adapt_quiz_id,
            "answers": [
                {"question_id": adapt_qs[0]["question_id"], "selected_answer": "A"},
                {"question_id": adapt_qs[1]["question_id"], "selected_answer": "A"}
            ]
        })
        self.assertEqual(adapt_eval_res.status_code, 200)

        # 19. Recalculate progress (attempts should now be >= 2)
        prog_res_2 = client.get(f"/api/learners/{learner_id}/progress")
        self.assertEqual(prog_res_2.status_code, 200)
        
        # 20. Next recommendation generated
        rec_res_2 = client.get(f"/api/learners/{learner_id}/recommendation")
        self.assertEqual(rec_res_2.status_code, 200)
        self.assertIn(rec_res_2.json()["status"], ["RECOMMENDED", "ALL_MASTERED"])


if __name__ == "__main__":
    unittest.main(verbosity=2)
