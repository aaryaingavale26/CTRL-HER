import uvicorn

if __name__ == "__main__":
    print("=" * 70)
    print("Starting StatSaksham AI - P4 Backend Server")
    print("Admin Intelligence + Analytics + Competency Quest Engine")
    print("Interactive Swagger Documentation: http://127.0.0.1:8000/docs")
    print("Redoc Alternative Documentation:   http://127.0.0.1:8000/redoc")
    print("=" * 70)
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
