from app.core.database import db_connection
import logging
import re

logger = logging.getLogger(__name__)

STOP_WORDS = {
    "why", "was", "were", "is", "are", "the", "a", "an", "in", "on", "at", "to",
    "for", "of", "with", "by", "from", "about", "how", "what", "when", "where",
    "who", "which", "this", "that", "these", "those", "added", "removed", "changed",
    "updated", "modified", "created", "implemented", "used", "using", "code", "file",
    "files", "repo", "repository", "project", "like", "does", "did", "do", "can", "we"
}


class GraphRAGService:
    def __init__(self):
        self.conn = db_connection

    def extract_search_terms(self, query_keyword: str, question: str = "") -> list[str]:
        terms = []
        if query_keyword and query_keyword.strip():
            terms.append(query_keyword.strip().lower())

        words = re.findall(r"[a-zA-Z0-9_.\-/]+", (question or "").lower())
        meaningful = [w for w in words if len(w) > 2 and w not in STOP_WORDS]
        for w in meaningful:
            if w not in terms:
                terms.append(w)

        if not terms and query_keyword:
            terms.append(query_keyword.strip().lower())
        return terms[:5]

    def retrieve_evidence(self, query_keyword: str, repo_url: str = "", question: str = ""):
        """
        Retrieves evidence sorted by timestamp and isolated by repository URL
        with multi-term matching and automatic recovery on dropped Neo4j connections.
        """
        search_terms = self.extract_search_terms(query_keyword, question)
        clean_repo = (repo_url or "").strip()

        if clean_repo:
            cypher_query = """
            MATCH (r:Repository {url: $repo_url})-[:CONTAINS]->(c:Commit)
            OPTIONAL MATCH (c)-[:MODIFIED_BY]->(f:CodeEntity)
            OPTIONAL MATCH (a:Person)-[:AUTHORED_BY]->(c)
            WHERE ANY(term IN $terms WHERE 
                (f.name IS NOT NULL AND toLower(f.name) CONTAINS term) OR 
                toLower(c.message) CONTAINS term OR
                toLower(c.sha) CONTAINS term
            )
            RETURN c.sha AS sha, c.message AS message, COALESCE(f.name, 'Repository Root') AS file, 
                   a.username AS author, c.timestamp AS timestamp
            ORDER BY c.timestamp DESC
            LIMIT 25
            """
            params = {"terms": search_terms, "repo_url": clean_repo}
        else:
            cypher_query = """
            MATCH (c:Commit)
            OPTIONAL MATCH (c)-[:MODIFIED_BY]->(f:CodeEntity)
            OPTIONAL MATCH (a:Person)-[:AUTHORED_BY]->(c)
            WHERE ANY(term IN $terms WHERE 
                (f.name IS NOT NULL AND toLower(f.name) CONTAINS term) OR 
                toLower(c.message) CONTAINS term OR
                toLower(c.sha) CONTAINS term
            )
            RETURN c.sha AS sha, c.message AS message, COALESCE(f.name, 'Repository Root') AS file, 
                   a.username AS author, c.timestamp AS timestamp
            ORDER BY c.timestamp DESC
            LIMIT 25
            """
            params = {"terms": search_terms}

        records = self.conn.run_query_with_retry(cypher_query, params)

        evidence_list = []
        seen_pairs = set()
        for record in records:
            sha = record.get("sha")
            file_name = record.get("file") or "Repository Root"
            pair_key = f"{sha}:{file_name}"
            if pair_key in seen_pairs:
                continue
            seen_pairs.add(pair_key)
            evidence_list.append(
                {
                    "sha": sha,
                    "message": record.get("message"),
                    "file": file_name,
                    "author": record.get("author") or "Unknown",
                    "timestamp": record.get("timestamp"),
                }
            )

        logger.info(f"Retrieved {len(evidence_list)} evidence nodes for terms {search_terms}")
        return evidence_list