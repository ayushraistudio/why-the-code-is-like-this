from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.ingestion import router as ingestion_router
from app.api.retrieval import router as retrieval_router  

app = FastAPI(title="Why The Code Is Like This - API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(ingestion_router)
app.include_router(retrieval_router)  

@app.get("/")
def health_check():
    return {"status": "healthy", "service": "Why The Code Is Like This"}