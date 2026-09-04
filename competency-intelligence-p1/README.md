# StatSaksham AI - Module P1: Competency Intelligence & Skill Gap
**Smart India Hackathon (SIH26101) - Ministry of Statistics and Programme Implementation (MoSPI)**

Production-grade FastAPI backend service powering MoSPI's Competency Intelligence, Calibrated AI Baseline Evaluation, Role-Based Skill Gap Analysis, Recharts-Ready Radar Analytics, and the Competency Digital Twin.

---

## 🏛️ Architecture & Highlights

- **Framework**: Python 3.11+ with **FastAPI** (asynchronous ASGI, typed dependency injection).
- **ORM & Database**: **SQLAlchemy 2.0** Declarative Base, **Pydantic v2** validation schemas, **PostgreSQL on Supabase** (Session pooler on port 5432).
- **Resilience**: Engineered connection pooler resilience with `pool_pre_ping=True`, `pool_recycle=300`, and automatic exponential backoff retry decorator (`@with_db_retry`).
- **AI Competency Engine**: Multi-provider support for **Google Gemini API** (`google-genai`) and **OpenAI API** (`openai`) using structured JSON outputs, augmented by a resilient MoSPI domain calibration model for 100% offline & test reliability.
- **Competency Matrix**: 33 seeded competencies across the 4 MoSPI pillars:
  - **Statistical** (10 competencies): Survey Design, Sampling, National Accounts, Price Statistics, Labour Statistics, Agricultural Statistics, Industrial Statistics, SDG Indicators, Metadata Standards, Data Quality.
  - **Technical** (12 competencies): Python, R, SQL, Stata, SPSS, SAS, GIS, Data Visualization, AI/ML, Cloud, APIs, Open Data.
  - **Digital Governance** (5 competencies): Cybersecurity, Data Privacy, Digital Signatures, Government Cloud, DPI (Digital Public Infrastructure).
  - **Behavioural & Managerial** (6 competencies): Leadership, Communication, Project Management, Ethics, Decision Making, Change Management.
- **Full CORS Middleware**: Configured to connect out-of-the-box with React/Next.js/Vite frontend dashboards.

---

## 📂 Project Structure

```
SIH/
├── .env                         # Active configuration with Supabase connection URL
├── .env.example                 # Config template
├── config.py                    # Pydantic-settings centralized typed configuration
├── database.py                  # SQLAlchemy engine, session maker & connection retry logic
├── models.py                    # Declarative models mirroring Supabase schema
├── schemas.py                   # Pydantic v2 schemas for all payloads and API responses
├── ai_evaluator.py              # LLM evaluation engine (Gemini / OpenAI structured output + fallback)
├── services.py                  # Business logic (Ingestion, Gap Engine, Radar, Digital Twin)
├── routers/
│   ├── __init__.py
│   ├── profile.py               # Profile onboarding & profile details endpoints
│   ├── competencies.py          # Master competency list endpoint
│   └── gap_and_twin.py          # Skill gaps, Recharts radar, & Digital Twin endpoints
├── main.py                      # FastAPI app entrypoint with CORS and lifespan handler
├── seed_benchmarks.py           # CLI utility to populate MoSPI role benchmarks
├── test_api.py                  # Comprehensive end-to-end API test suite
└── README.md                    # System documentation
```

---

## ⚙️ Configuration (`.env`)

```env
DATABASE_URL=postgresql://postgres.dgbmxefpfcledhifnxyv:Marisamenezes-123@aws-0-ap-south-1.pooler.supabase.com:5432/postgres
AI_PROVIDER=gemini
GEMINI_API_KEY=your_gemini_api_key_here
OPENAI_API_KEY=your_openai_api_key_here
FALLBACK_BENCHMARK_SCORE=3.5
ENVIRONMENT=development
APP_PORT=8000
DEBUG=True
```

---

## 🚀 Running the Service

### 1. Install Dependencies
```bash
pip install fastapi uvicorn sqlalchemy psycopg2-binary pydantic pydantic-settings google-genai openai httpx
```

### 2. (Optional) Seed Standard MoSPI Role Benchmarks
```bash
python seed_benchmarks.py
```

### 3. Start the FastAPI Server
```bash
python main.py
# Or with uvicorn CLI:
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```
Interactive Swagger API docs available at: `http://localhost:8000/docs`.

### 4. Run the Full Test Suite
```bash
python test_api.py
```

---

## 📡 REST API Endpoints Specification

### 1. Ingest Profile & Evaluate Baseline
- **Method & Path**: `POST /api/v1/profile/create`
- **Request Body**:
```json
{
  "full_name": "Ramesh Chandra Sharma",
  "designation": "Junior Statistical Officer",
  "department": "National Sample Survey Office (NSSO)",
  "job_role": "Junior Statistical Officer",
  "current_assignment": "Annual Survey of Industries (ASI)",
  "education": "M.Sc. in Applied Statistics",
  "experience_years": 4,
  "previous_training": [
    "National Statistical Systems & SDMX Standards Workshop",
    "Python for Statistical Analysis & Data Scrutiny"
  ],
  "career_objective": "Advance into Senior Statistical Officer role specializing in National Accounts macro-aggregation.",
  "self_assessments": [
    {"competency_id": 1, "rating": 4.5},
    {"competency_id": 2, "rating": 4.2},
    {"competency_id": 3, "rating": 4.8},
    {"competency_id": 11, "rating": 3.8}
  ]
}
```
- **Response**: `201 Created`
```json
{
  "official_id": "2b574d66-f752-4348-ab00-17587012f291",
  "full_name": "Ramesh Chandra Sharma",
  "job_role": "Junior Statistical Officer",
  "scores_evaluated": 33,
  "message": "Official profile registered and calibrated baseline evaluated across 33 competencies."
}
```

---

### 2. Get Master Competencies
- **Method & Path**: `GET /api/v1/competencies`
- **Response**:
```json
{
  "total_competencies": 33,
  "categories": {
    "Statistical": [{"id": 1, "category": "Statistical", "name": "Survey Design"}, ...],
    "Technical": [{"id": 11, "category": "Technical", "name": "Python"}, ...],
    "Digital Governance": [{"id": 23, "category": "Digital Governance", "name": "Cybersecurity"}, ...],
    "Behavioural & Managerial": [{"id": 28, "category": "Behavioural & Managerial", "name": "Leadership"}, ...]
  }
}
```

---

### 3. Get Official Profile & Scores
- **Method & Path**: `GET /api/v1/profile/{official_id}`
- **Response**: Official details + all 33 evaluated scores, confidence weights, and update timestamps.

---

### 4. Skill Gap Matrix & AI Rationale
- **Method & Path**: `GET /api/v1/competency/gaps/{official_id}`
- **Response**:
```json
{
  "official_id": "2b574d66-f752-4348-ab00-17587012f291",
  "full_name": "Ramesh Chandra Sharma",
  "job_role": "Junior Statistical Officer",
  "benchmark_source": "Role benchmark for 'Junior Statistical Officer'",
  "total_competencies": 33,
  "high_priority_count": 0,
  "medium_priority_count": 12,
  "low_priority_count": 21,
  "average_gap": 0.38,
  "critical_gaps_rationale": [
    "1. Critical Gap (+1.1) in 'Communication' [Behavioural & Managerial]: Official's calibrated proficiency (2.4) is substantially below benchmark (3.5)...",
    "2. Critical Gap (+1.0) in 'National Accounts' [Statistical]: Official's calibrated proficiency (2.5) is substantially below benchmark (3.5)..."
  ],
  "gaps": [
    {
      "competency_id": 29,
      "category": "Behavioural & Managerial",
      "competency_name": "Communication",
      "current_score": 2.4,
      "required_score": 3.5,
      "gap": 1.1,
      "priority": "MEDIUM",
      "is_critical": false
    }
  ]
}
```

---

### 5. Recharts Radar Chart Format
- **Method & Path**: `GET /api/v1/competency/radar/{official_id}`
- **Response**:
```json
{
  "official_id": "2b574d66-f752-4348-ab00-17587012f291",
  "job_role": "Junior Statistical Officer",
  "competency_radar": [
    {"category": "Statistical", "competency": "Survey Design", "current": 4.5, "required": 3.5, "gap": -1.0},
    {"category": "Technical", "competency": "Python", "current": 3.8, "required": 3.0, "gap": -0.8}
  ],
  "category_radar": [
    {"category": "Statistical", "current_avg": 3.25, "required_avg": 3.28, "gap_avg": 0.03},
    {"category": "Technical", "current_avg": 2.82, "required_avg": 2.89, "gap_avg": 0.07}
  ]
}
```

---

### 6. Competency Digital Twin
- **Method & Path**: `GET /api/v1/competency/digital-twin/{official_id}`
- **Response**:
```json
{
  "official_id": "2b574d66-f752-4348-ab00-17587012f291",
  "full_name": "Ramesh Chandra Sharma",
  "designation": "Junior Statistical Officer",
  "job_role": "Junior Statistical Officer",
  "overall_readiness_pct": 89.2,
  "status_summary": "Operationally Proficient: Strong baseline with minor skill gaps in specialized modules.",
  "category_breakdown": [
    {
      "category": "Statistical",
      "current_average": 3.25,
      "required_average": 3.28,
      "readiness_pct": 91.5,
      "competencies_count": 10
    }
  ],
  "timeline_milestones": [
    {
      "id": 1,
      "competency_id": 1,
      "competency_name": "Survey Design",
      "category": "Statistical",
      "score": 4.5,
      "source_type": "ai_baseline",
      "reason": "High self-rating confirmed by verified experience (4y) and background in Survey Design.",
      "recorded_at": "2026-09-03T15:26:21.448Z"
    }
  ],
  "recent_updates_count": 33
}
```
