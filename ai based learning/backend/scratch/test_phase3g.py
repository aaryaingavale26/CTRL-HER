"""
Deterministic integration test for Phase 3G Question Bank & Review workflow.
Tests:
1. Save question to bank (validates and marks DRAFT)
2. Duplicate rejection (same doc + topic + question)
3. List question bank with filters
4. Edit question in question bank (provenance preserved, duplicate checked)
5. Approve question (state transition DRAFT -> APPROVED)
6. Reject question (state transition -> REJECTED)
7. Assemble learner quiz from bank:
   - Fails if insufficient approved questions
   - Succeeds when enough approved questions
   - Excludes DRAFT and REJECTED questions
   - Learner questions NEVER leak correct_answer or explanation
   - QuizSession is persisted and can be evaluated with existing QuizEvaluator
"""
import os
import sys
import unittest
from fastapi.testclient import TestClient

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "..", "..", "c:/Users/vishr/Downloads/sih/backend")))

from main import app
from services.question_bank_repository import get_question_bank_repository

client = TestClient(app)

class TestQuestionBankWorkflow(unittest.TestCase):
    def setUp(self):
        # Clear question bank storage and cache for clean deterministic testing
        repo = get_question_bank_repository()
        repo.clear()

    def test_question_bank_full_lifecycle(self):
        # 1. Save question 1 (DRAFT)
        payload1 = {
            "question": "What is the primary objective of the NSS survey?",
            "options": [
                {"id": "A", "text": "Collect socio-economic statistical data"},
                {"id": "B", "text": "Forecast the weather for tomorrow"},
                {"id": "C", "text": "Print paper ballots for elections"},
                {"id": "D", "text": "Manage national parks"}
            ],
            "correct_answer": "A",
            "explanation": "NSS is designed to conduct nationwide socioeconomic surveys.",
            "difficulty": "medium",
            "topic": "Socio-Economic Surveys",
            "source": {
                "document": "NSS_Overview.pdf",
                "document_id": "doc_nss_01",
                "chunk_ids": ["chunk_01"],
                "locations": ["Page 1"]
            },
            "origin": "GENERATED"
        }
        res = client.post("/api/assessment/question-bank", json=payload1)
        self.assertEqual(res.status_code, 201, res.text)
        data1 = res.json()
        q1_id = data1["question_id"]
        self.assertEqual(data1["status"], "DRAFT")
        self.assertEqual(data1["source"]["document_id"], "doc_nss_01")

        # 2. Duplicate detection test: Attempting to save exact same question to same doc & topic
        res_dup = client.post("/api/assessment/question-bank", json=payload1)
        self.assertEqual(res_dup.status_code, 409, "Should prevent duplicate question in same doc/topic")

        # 3. Save question 2 (DRAFT) with different question text
        payload2 = {
            "question": "Which sampling technique is most commonly utilized in the survey?",
            "options": [
                {"id": "A", "text": "Stratified multi-stage sampling"},
                {"id": "B", "text": "Simple coin flip sampling"},
                {"id": "C", "text": "Voluntary online poll"},
                {"id": "D", "text": "Snowball sampling only"}
            ],
            "correct_answer": "A",
            "explanation": "Stratified multi-stage sampling is standard for nationwide representation.",
            "difficulty": "hard",
            "topic": "Socio-Economic Surveys",
            "source": {
                "document": "NSS_Overview.pdf",
                "document_id": "doc_nss_01",
                "chunk_ids": ["chunk_02"],
                "locations": ["Page 2"]
            },
            "origin": "GENERATED"
        }
        res2 = client.post("/api/assessment/question-bank", json=payload2)
        self.assertEqual(res2.status_code, 201)
        q2_id = res2.json()["question_id"]

        # 4. Save question 3 (DRAFT)
        payload3 = {
            "question": "What is the reference period for consumer expenditure inquiries?",
            "options": [
                {"id": "A", "text": "Last 30 days or 365 days depending on item"},
                {"id": "B", "text": "Last 10 minutes"},
                {"id": "C", "text": "Exactly one century"},
                {"id": "D", "text": "The upcoming fiscal year"}
            ],
            "correct_answer": "A",
            "explanation": "Reference periods typically use 30 or 365 days recall.",
            "difficulty": "medium",
            "topic": "Socio-Economic Surveys",
            "source": {
                "document": "NSS_Overview.pdf",
                "document_id": "doc_nss_01",
                "chunk_ids": ["chunk_03"],
                "locations": ["Page 5"]
            },
            "origin": "GENERATED"
        }
        res3 = client.post("/api/assessment/question-bank", json=payload3)
        self.assertEqual(res3.status_code, 201)
        q3_id = res3.json()["question_id"]

        # 5. List items filter: all 3 should be DRAFT
        res_list = client.get("/api/assessment/question-bank?status=DRAFT")
        self.assertEqual(res_list.status_code, 200)
        self.assertEqual(res_list.json()["total"], 3)

        # 6. Attempt quiz creation from bank before approving: should fail (0 approved)
        quiz_req = {
            "learner_id": "learner_42",
            "count": 2,
            "topic": "Socio-Economic Surveys"
        }
        res_quiz_fail = client.post("/api/assessment/quizzes/from-bank", json=quiz_req)
        self.assertEqual(res_quiz_fail.status_code, 400)
        self.assertIn("Insufficient approved questions", res_quiz_fail.json()["detail"])

        # 7. Edit question 1 (Trainer polish)
        patch_payload = {
            "question": "What is the primary objective of the National Sample Survey (NSS)?",
            "explanation": "Updated explanation: NSS conducts comprehensive nationwide socioeconomic surveys."
        }
        res_patch = client.patch(f"/api/assessment/question-bank/{q1_id}", json=patch_payload)
        self.assertEqual(res_patch.status_code, 200)
        patched_item = res_patch.json()
        self.assertEqual(patched_item["question"], patch_payload["question"])
        # Provenance source must remain unchanged
        self.assertEqual(patched_item["source"]["document_id"], "doc_nss_01")

        # 8. Approve Question 1 and Question 2
        res_app1 = client.post(f"/api/assessment/question-bank/{q1_id}/approve")
        self.assertEqual(res_app1.status_code, 200)
        self.assertEqual(res_app1.json()["status"], "APPROVED")

        res_app2 = client.post(f"/api/assessment/question-bank/{q2_id}/approve")
        self.assertEqual(res_app2.status_code, 200)
        self.assertEqual(res_app2.json()["status"], "APPROVED")

        # 9. Reject Question 3
        res_rej = client.post(f"/api/assessment/question-bank/{q3_id}/reject")
        self.assertEqual(res_rej.status_code, 200)
        self.assertEqual(res_rej.json()["status"], "REJECTED")

        # 10. Check list filter by status
        res_app_list = client.get("/api/assessment/question-bank?status=APPROVED")
        self.assertEqual(res_app_list.json()["total"], 2)
        res_rej_list = client.get("/api/assessment/question-bank?status=REJECTED")
        self.assertEqual(res_rej_list.json()["total"], 1)

        # 11. Create Quiz from Bank for count=2
        res_quiz = client.post("/api/assessment/quizzes/from-bank", json=quiz_req)
        self.assertEqual(res_quiz.status_code, 201)
        quiz_data = res_quiz.json()
        self.assertEqual(quiz_data["total_questions"], 2)
        quiz_id = quiz_data["quiz_id"]

        # SECURITY VERIFICATION: Learner safe questions must NEVER expose correct_answer or explanation
        for q in quiz_data["questions"]:
            self.assertNotIn("correct_answer", q)
            self.assertNotIn("explanation", q)
            self.assertIn("question", q)
            self.assertIn("options", q)
            self.assertIn("source", q)

        # 12. Submit Quiz and evaluate using existing evaluation pipeline
        # Dynamic answers based on actual quiz question order: answer first question with "A", second with "B"
        # First question in quiz: if q1, A is correct. If q2, A is correct, B is incorrect.
        answers = []
        for q in quiz_data["questions"]:
            if q["question_id"] == q1_id:
                answers.append({"question_id": q1_id, "selected_answer": "A"}) # Correct
            elif q["question_id"] == q2_id:
                answers.append({"question_id": q2_id, "selected_answer": "B"}) # Incorrect

        submit_payload = {
            "answers": answers
        }
        res_eval = client.post(f"/api/assessment/quizzes/{quiz_id}/submit", json=submit_payload)
        self.assertEqual(res_eval.status_code, 200, res_eval.text)
        eval_data = res_eval.json()
        self.assertEqual(eval_data["total_questions"], 2)
        self.assertEqual(eval_data["correct_answers"], 1)
        self.assertEqual(eval_data["percentage"], 50.0)
        print("\nAll Question Bank & Review tests passed successfully!")

if __name__ == "__main__":
    unittest.main()
