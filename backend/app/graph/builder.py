from app.core.database import db_connection
from app.models.github_models import RepositoryMetadata, CommitData, PullRequestData
from typing import List
import logging

logger = logging.getLogger(__name__)


class GraphBuilder:
    def __init__(self):
        self.conn = db_connection

    def create_repository_node(self, repo: RepositoryMetadata):
        query = """
        MERGE (r:Repository {url: $url})
        ON CREATE SET r.owner = $owner, r.name = $name, r.default_branch = $default_branch
        ON MATCH SET r.owner = $owner, r.name = $name, r.default_branch = $default_branch
        RETURN r
        """
        self.conn.run_query_with_retry(
            query,
            {
                "url": repo.url,
                "owner": repo.owner,
                "name": repo.name,
                "default_branch": repo.default_branch,
            },
        )
        logger.info(f"Repository node created/merged for {repo.name}")

    def ingest_commits(self, repo_url: str, commits: List[CommitData]):
        if not commits:
            logger.info("No commits to ingest.")
            return

        query = """
        MATCH (r:Repository {url: $repo_url})
        UNWIND $commits AS commit
        MERGE (c:Commit {sha: commit.sha})
        ON CREATE SET c.message = commit.message, c.timestamp = commit.timestamp, c.url = commit.url
        ON MATCH SET c.message = commit.message, c.timestamp = commit.timestamp, c.url = commit.url
        MERGE (r)-[:CONTAINS]->(c)
        
        MERGE (a:Person {username: commit.author.username})
        ON CREATE SET a.avatar_url = commit.author.avatar_url, a.profile_url = commit.author.profile_url
        MERGE (a)-[:AUTHORED_BY]->(c)
        """
        commit_dicts = [
            {
                "sha": c.sha,
                "message": c.message or "",
                "timestamp": c.timestamp.isoformat() if c.timestamp else "",
                "url": c.url or "",
                "author": {
                    "username": c.author.username if c.author and c.author.username else "Unknown",
                    "avatar_url": c.author.avatar_url if c.author else None,
                    "profile_url": c.author.profile_url if c.author else None,
                },
            }
            for c in commits
            if c is not None
        ]

        if not commit_dicts:
            return

        self.conn.run_query_with_retry(query, {"repo_url": repo_url, "commits": commit_dicts})
        logger.info(f"Ingested {len(commit_dicts)} commits into the graph")

    def ingest_pull_requests(self, repo_url: str, prs: List[PullRequestData]):
        if not prs:
            logger.info("No pull requests to ingest.")
            return

        query = """
        MATCH (r:Repository {url: $repo_url})
        UNWIND $prs AS pr
        MERGE (p:PullRequest {pr_number: pr.pr_number, repo_url: $repo_url})
        ON CREATE SET p.title = pr.title, p.body = pr.body, p.state = pr.state, p.url = pr.url
        ON MATCH SET p.title = pr.title, p.body = pr.body, p.state = pr.state, p.url = pr.url
        MERGE (r)-[:CONTAINS]->(p)
        
        MERGE (a:Person {username: pr.author.username})
        ON CREATE SET a.avatar_url = pr.author.avatar_url, a.profile_url = pr.author.profile_url
        MERGE (a)-[:AUTHORED_BY]->(p)
        """
        pr_dicts = [
            {
                "pr_number": p.pr_number,
                "title": p.title or "",
                "body": p.body or "",
                "state": p.state or "open",
                "url": p.url or "",
                "author": {
                    "username": p.author.username if p.author and p.author.username else "Unknown",
                    "avatar_url": p.author.avatar_url if p.author else None,
                    "profile_url": p.author.profile_url if p.author else None,
                },
            }
            for p in prs
            if p is not None
        ]

        if not pr_dicts:
            return

        self.conn.run_query_with_retry(query, {"repo_url": repo_url, "prs": pr_dicts})
        logger.info(f"Ingested {len(pr_dicts)} pull requests into the graph")

    def link_commit_to_files(self, commit_sha: str, filenames: List[str]):
        """Phase 2: Code Entity Extraction (Linking Commits to Files)"""
        if not commit_sha or not filenames:
            return

        clean_filenames = [str(f) for f in filenames if f]
        if not clean_filenames:
            return

        query = """
        MATCH (c:Commit {sha: $commit_sha})
        UNWIND $filenames AS filename
        MERGE (f:CodeEntity {file_path: filename, entity_type: 'File'})
        ON CREATE SET f.name = filename
        MERGE (c)-[:MODIFIED_BY]->(f)
        """
        self.conn.run_query_with_retry(query, {"commit_sha": commit_sha, "filenames": clean_filenames})

    def get_ingested_repositories(self) -> List[str]:
        """Returns a list of all ingested repository URLs currently stored in Neo4j."""
        query = """
        MATCH (r:Repository)
        WHERE r.url IS NOT NULL
        RETURN r.url AS url
        ORDER BY r.name ASC
        """
        records = self.conn.run_query_with_retry(query)
        return [r["url"] for r in records if r.get("url")]

    def clear_all_data(self):
        """Deletes all ingested nodes and relationships from the Neo4j graph."""
        query = "MATCH (n) DETACH DELETE n"
        self.conn.run_query_with_retry(query)
        logger.info("Cleared all data from Neo4j knowledge graph.")