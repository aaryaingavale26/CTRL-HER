from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config import settings
from routes import health, ai, documents, search, assessment, learners, learning_assistant
from routes.igot import router as igot_router

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="StatSaksham AI Backend — AI Learning, RAG & Intelligent Assessment Platform for India's Official Statistical System."
)

# CORS middleware for seamless frontend interaction
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Restrict in production environment
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers under /api
app.include_router(health.router, prefix=settings.API_PREFIX)
app.include_router(ai.router, prefix=settings.API_PREFIX)
app.include_router(documents.router, prefix=settings.API_PREFIX)
app.include_router(search.router, prefix=settings.API_PREFIX)
app.include_router(assessment.router, prefix=settings.API_PREFIX)
app.include_router(learners.router, prefix=settings.API_PREFIX)
app.include_router(learning_assistant.router, prefix=settings.API_PREFIX)
app.include_router(igot_router)
@app.get("/")
def root_redirect():
    return {
        "message": "Welcome to StatSaksham AI API",
        "docs_url": "/docs",
        "health_check": f"{settings.API_PREFIX}/health"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=settings.PORT, reload=True)
