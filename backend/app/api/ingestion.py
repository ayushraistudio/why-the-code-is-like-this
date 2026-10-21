from fastapi import APIRouter, HTTPException
from typing import Dict, Any
from app.ingestion.github_client import GithubClient
from app.graph.builder import GraphBuilder
import logging
import traceback

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/ingest", tags=["Ingestion"])
github_client = GithubClient()
graph_builder = GraphBuilder()


def format_friendly_error(err: Exception) -> str:
    msg = str(err)
    lower = msg.lower()
    if "defunct connection" in lower or "ipv4address" in lower or "serviceunavailable" in lower:
        return "Neo4j AuraDB connection was interrupted (idle timeout or network change). Please click Ingest again to reconnect automatically."
    if "authentication" in lower or "unauthorized" in lower:
        return "Authentication error: Please verify your Neo4j or GitHub token credentials"
    return msg


@router.get("/repositories")
async def list_ingested_repositories() -> Dict[str, Any]:
    try:
        repos = graph_builder.get_ingested_repositories()
        return {
            "status": "success",
            "repositories": repos,
        }
    except Exception as e:
        logger.warning(f"Could not list repositories: {e}")
        return {
            "status": "success",
            "repositories": [],
        }


@router.delete("/clear")
async def clear_ingested_data() -> Dict[str, Any]:
    try:
        graph_builder.clear_all_data()
        return {
            "status": "success",
            "message": "All ingested repositories, commits, PRs, and files have been deleted from the database.",
        }
    except ConnectionError as ce:
        raise HTTPException(status_code=503, detail=format_friendly_error(ce))
    except Exception as e:
        logger.error(f"Error clearing database: {e}\n{traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=format_friendly_error(e))


@router.post("/")
async def ingest_repository(owner: str, repo: str) -> Dict[str, Any]:
    try:
        clean_owner = owner.strip()
        clean_repo = repo.strip().replace(".git", "")

        metadata = github_client.validate_repository(clean_owner, clean_repo)
        commits = github_client.fetch_commits(clean_owner, clean_repo, limit=25) or []
        pull_requests = github_client.fetch_pull_requests(clean_owner, clean_repo, limit=15) or []

        graph_builder.create_repository_node(metadata)
        graph_builder.ingest_commits(metadata.url, commits)
        graph_builder.ingest_pull_requests(metadata.url, pull_requests)

        extracted_files_count = 0
        for commit in commits:
            if commit and commit.sha:
                filenames = github_client.fetch_commit_files(clean_owner, clean_repo, commit.sha) or []
                if filenames:
                    graph_builder.link_commit_to_files(commit.sha, filenames)
                    extracted_files_count += len(filenames)

        return {
            "status": "success",
            "message": f"Ingestion and Entity Extraction complete for {clean_owner}/{clean_repo}",
            "repository_url": metadata.url,
            "data_summary": {
                "commits_saved": len(commits),
                "pull_requests_saved": len(pull_requests),
                "code_entities_extracted": extracted_files_count,
            },
        }
    except ConnectionError as ce:
        raise HTTPException(status_code=503, detail=format_friendly_error(ce))
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Error during ingestion for {owner}/{repo}: {e}\n{traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=format_friendly_error(e))