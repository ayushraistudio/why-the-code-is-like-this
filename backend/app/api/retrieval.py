from fastapi import APIRouter, HTTPException, Query
from typing import Dict, Any, Optional
from app.retrieval.graph_rag import GraphRAGService
from app.generation.llm_service import LLMService
from app.api.ingestion import format_friendly_error

router = APIRouter(prefix="/api/ask", tags=["Retrieval & Generation"])
graph_rag_service = GraphRAGService()
llm_service = LLMService()


@router.get("/")
async def ask_question(
    question: str = Query(..., description="The natural language question about the code"),
    keyword: str = Query("", description="Keyword to search in Graph (e.g., filename or concept)"),
    repo_url: Optional[str] = Query("", description="Full GitHub URL to isolate context"),
) -> Dict[str, Any]:
    try:
        terms = graph_rag_service.extract_search_terms(keyword, question)
        search_term = keyword.strip() if keyword and keyword.strip() else (terms[0] if terms else "repository")

        evidence = graph_rag_service.retrieve_evidence(
            query_keyword=keyword,
            repo_url=repo_url or "",
            question=question,
        )
        structured_answer = llm_service.generate_answer(question, evidence)

        if structured_answer.get("error_flag") == "AI_FAILURE":
            raise HTTPException(
                status_code=503,
                detail="Internal AI service error. Both models failed to respond. Please try again after some time.",
            )

        provider_used = structured_answer.get("ai_provider", "No Model Available")

        return {
            "status": "success",
            "question": question,
            "keyword_used": search_term,
            "ai_provider_used": provider_used,
            "answer": structured_answer,
            "raw_evidence": evidence,
            "raw_evidence_count": len(evidence),
        }
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(
            status_code=503,
            detail=f"Internal error while processing request: {format_friendly_error(e)}",
        )