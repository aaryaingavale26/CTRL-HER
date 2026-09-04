# StatSaksham AI — P4 Backend Engine
## 👤 P4: Admin Intelligence + Workforce Analytics + Competency Quest

StatSaksham AI is an **Intelligent Capacity Building & Competency Intelligence Platform for Government Officials in Official Statistics** (SIH26101 - Ministry of Statistics & Programme Implementation).

This backend powers **P4 (Organization-Level Intelligence, Analytics, and Gamification)** built with **FastAPI**, **SQLAlchemy**, and **Pandas**. It is completely explainable and data-driven without black-box ML dependencies.

---

## 🌟 Key Features Implemented

### 1. 📊 Learner Analytics & Progress Loop
- **Learning Hours**: Weekly, monthly, and aggregate hours tracking (`/api/v1/learner/analytics`).
- **Course Progress**: Live enrollment tracking, completion percentages, and module logs.
- **Competency Improvement**: Before vs. After delta progression ($\Delta = \text{Current} - \text{Baseline}$, e.g. $+0.8$ improvement).
- **Assessment History**: Diagnostic quizzes, scores, strong/weak areas, and explainable AI insights.

### 2. 🏛️ Admin Workforce Intelligence
- **Workforce KPIs**: Total officials ($12,450$), Average Competency ($3.4/5.0$), Critical Skill Gaps ($18$), and Training Completion ($76\%$).
- **Domain Competency Breakdown**: Statistical ($4.1$), Technical ($2.9$), Digital ($3.5$), Behavioural ($4.0$).
- **Department Analytics**: Department-level performance, critical gaps, and participation (NSSO, CSO, FOD, NAD, ESD, SDRD).
- **Training Effectiveness**: Before vs. After training intervention gains ($+23.4\%$ average improvement across officers).

### 3. 🗺️ Skill Heatmap Matrix
- Dynamic **Department $\times$ Competency Matrix** with status ratings:
  - 🔴 **Critical** ($< 2.5$) — Immediate capacity building intervention needed
  - 🟡 **Moderate** ($2.5 - 3.4$) — Targeted upskilling recommended
  - 🟢 **Proficient** ($\ge 3.5$) — Meets or exceeds operational standard
- Supports bidirectional slicing: Department $\to$ Competencies or Competency $\to$ Departments.

### 4. 📈 Transparent Future Skill Demand Forecasting
Explainable scoring formula based on real workforce signals:
$$\text{Demand Score} = (0.30 \times \text{Historical Trend}) + (0.25 \times \text{Dept Requirements}) + (0.25 \times \text{Training Demand}) + (0.20 \times \text{Gap Frequency})$$
Provides natural language policy rationales (e.g. AI/ML surging $+32\%$ for survey anomaly detection and NIC classification).

### 5. 🔮 Workforce What-If Simulator
- Interactive policy planning tool:
  - **Input**: Target skill (e.g., `AI_ML`), Required level ($4.0$), Target officials needed ($500$).
  - **Output**: Current qualified ($127$), Gap ($373$), Training required ($373$), Estimated learning hours ($7,460\text{ hrs}$), Priority (`HIGH`), Automated strategic training policy text, recommended iGOT/NSSTA courses, and department-wise impact distribution.

### 6. 🎮 Competency Quest (Gamification Engine)
- **Quest Hub**: Level, XP progress bar ($720 / 1000\text{ XP}$), Streak tracking ($6\text{ days}$), and Badges.
- **Data Detective**: Real Indian survey dataset quality audits (NSSO/PLFS samples) with missing demographic values, sentinel outlier values (`9999999`), and invalid state codes (`XX`).
- **Statistical Sudoku**: 4x4 Latin Square mathematical logic puzzles with mean ($\mu = 2.5$), sum ($10$), and variance constraints.
- **Visualization Challenge**: Data scenario $\to$ optimal official statistics chart selection with pedagogical explanations.
- **Real-World Missions**: Multi-stage MoSPI survey design and non-response mitigation scenario trees.
- **Daily Challenge**: 2-minute daily micro-challenges.
- **Evaluation Engine**: Automated answer scoring, XP/Level progression, streak counters, and achievement unlocks (*Gap Crusher*, *Data Detective*, *7-Day Streak*).

---

## 🚀 Quick Start Guide

### Prerequisites
- Python 3.11+
- Virtual environment tool (`uv` or `venv`)

### 1. Installation
```bash
# Clone or navigate to the repository
cd statsaksham-backend

# Activate virtual environment (if using the bundled venv)
.venv\Scripts\activate

# Install dependencies (if setting up fresh)
pip install -r requirements.txt
```

### 2. Run the Server
```bash
python run.py
```
The server will start at `http://127.0.0.1:8000`.

### 3. Interactive Documentation
- **Swagger UI**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **Redoc**: [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)

---

## 🔌 API Reference & Endpoints

| Category | Method | Endpoint | Description |
|---|---|---|---|
| **Learner Analytics** | `GET` | `/api/v1/learner/analytics` | Learner hours, course progress, delta scores, assessments |
| | `GET` | `/api/v1/learner/progress` | Learning hours summary and active courses |
| | `GET` | `/api/v1/learner/competency-improvements`| Before vs After competency progression |
| **Admin Analytics** | `GET` | `/api/v1/admin/dashboard` | Workforce KPIs, domain breakdown, department summaries |
| | `GET` | `/api/v1/admin/workforce` | Top-level workforce metrics |
| | `GET` | `/api/v1/admin/departments` | Department-level analytics & gaps |
| | `GET` | `/api/v1/admin/training-effectiveness` | Training ROI & Before vs After gains (+23.4%) |
| **Skill Heatmap** | `GET` | `/api/v1/admin/heatmap` | Department $\times$ Competency matrix with 🔴/🟡/🟢 indicators |
| **Emerging Skills** | `GET` | `/api/v1/admin/emerging-skills` | Future demand scoring & explainable surge drivers |
| **What-If Simulator**| `POST`| `/api/v1/admin/what-if/simulate` | Workforce scenario simulator with hour & training estimates |
| **Competency Quest** | `GET` | `/api/v1/quest/home` | User XP, Level, Streak, Active Missions, Badges |
| | `GET` | `/api/v1/quest/daily-challenge` | Today's 2-minute micro-challenge |
| | `GET` | `/api/v1/quest/data-detective` | Data Detective dataset quality audit challenge |
| | `GET` | `/api/v1/quest/statistical-sudoku`| Statistical Latin Square logic puzzle |
| | `GET` | `/api/v1/quest/visualization` | Chart selection challenge with official statistics pedagogy |
| | `GET` | `/api/v1/quest/missions` | Multi-step official survey decision missions |
| | `POST`| `/api/v1/quest/submit` | Submit answers, earn XP, update streak, unlock badges |

---

## 🧪 Automated Testing
Run the complete pytest test suite:
```bash
.venv\Scripts\pytest.exe -v
```

---

## 📁 Architecture Overview
```text
statsaksham-backend/
├── app/
│   ├── main.py                  # FastAPI App Entry, CORS & Lifespan Seeder
│   ├── core/
│   │   ├── config.py            # App Settings & DB Configuration
│   │   ├── database.py          # SQLAlchemy Engine & SessionLocal
│   │   └── security.py          # User & Role Headers Context
│   ├── models/                  # SQLAlchemy ORM Models
│   │   ├── department.py        # MoSPI Departments (NSSO, CSO, FOD, NAD, ESD, SDRD)
│   │   ├── competency.py        # Competency Definitions across 4 Domains
│   │   ├── user.py              # Officials, Designations & Gamification stats
│   │   ├── user_competency.py   # Baseline, Current, Required levels & Gap logs
│   │   ├── learning.py          # Courses, Enrollments & Learning Logs
│   │   ├── assessment.py        # Diagnostic & Quiz Attempts
│   │   └── quest.py             # Quests, Submissions & Achievements
│   ├── schemas/                 # Pydantic v2 Models matching Frontend Contracts
│   │   ├── analytics.py         # Learner & Admin Analytics schemas
│   │   ├── heatmap.py           # Heatmap Grid & Cell schemas
│   │   ├── emerging.py          # Emerging Skills & Demand Factor schemas
│   │   ├── whatif.py            # What-If Simulator request/response
│   │   └── quest.py             # Mini-game payloads & submissions
│   ├── services/                # Business Logic & Pandas Analytics
│   │   ├── learner_analytics_service.py
│   │   ├── admin_analytics_service.py
│   │   ├── heatmap_service.py
│   │   ├── demand_service.py
│   │   ├── whatif_simulator_service.py
│   │   └── quest_service.py
│   ├── utils/
│   │   └── formulas.py          # Transparent scoring & simulation math
│   ├── seed/
│   │   └── seeder.py            # Auto-seeder with 40+ officials, courses & quests
│   └── api/
│       └── v1/                  # Versioned API Routers
├── tests/                       # Comprehensive Pytest Suite
├── requirements.txt             # Project Dependencies
└── run.py                       # Server Launcher
```
