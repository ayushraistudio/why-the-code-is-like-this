import requests
from typing import List, Optional
from fastapi import HTTPException
from app.core.config import settings
from app.models.github_models import (
    CommitData, PullRequestData, IssueData, RepositoryMetadata, GithubAuthor
)
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

class GithubClient:
    def __init__(self):
        self.base_url = "https://api.github.com"
        self.headers = {
            "Accept": "application/vnd.github.v3+json",
        }
        if settings.GITHUB_TOKEN:
            self.headers["Authorization"] = f"Bearer {settings.GITHUB_TOKEN}"
        
        self.session = requests.Session()
        self.session.headers.update(self.headers)

    def _parse_github_date(self, date_str: Optional[str]) -> datetime:
        """Safely parse ISO 8601 date strings from GitHub API."""
        if not date_str:
            return datetime.utcnow()
        try:
            return datetime.strptime(date_str, "%Y-%m-%dT%H:%M:%SZ")
        except ValueError:
            try:
                return datetime.fromisoformat(date_str.replace("Z", "+00:00"))
            except Exception:
                return datetime.utcnow()

    def validate_repository(self, owner: str, repo: str) -> RepositoryMetadata:
        url = f"{self.base_url}/repos/{owner}/{repo}"
        response = self.session.get(url, timeout=15)
        
        if response.status_code == 404:
            raise HTTPException(status_code=404, detail=f"Repository '{owner}/{repo}' not found or is private.")
        if response.status_code == 403:
            raise HTTPException(status_code=403, detail="GitHub API rate limit exceeded or access forbidden.")
        response.raise_for_status()
        
        data = response.json() or {}
        owner_data = data.get("owner") or {}
        
        return RepositoryMetadata(
            owner=owner_data.get("login", owner),
            name=data.get("name", repo),
            description=data.get("description") or "",
            url=data.get("html_url", f"https://github.com/{owner}/{repo}"),
            default_branch=data.get("default_branch") or "main"
        )

    def fetch_commits(self, owner: str, repo: str, limit: int = 100) -> List[CommitData]:
        url = f"{self.base_url}/repos/{owner}/{repo}/commits"
        params = {"per_page": min(limit, 100)}
        response = self.session.get(url, params=params, timeout=15)
        
        
        if response.status_code in (404, 409) or response.status_code != 200:
            logger.warning(f"Could not fetch commits for {owner}/{repo}: HTTP {response.status_code}")
            return []
            
        data = response.json()
        if not data or not isinstance(data, list):
            return []
            
        commits: List[CommitData] = []
        for item in data[:limit]:
            if not isinstance(item, dict):
                continue
                
            sha = item.get("sha")
            if not sha:
                continue

            commit_obj = item.get("commit") or {}
            commit_author_obj = commit_obj.get("author") or {}
            github_author_obj = item.get("author") or {}
            
            
            username = (
                github_author_obj.get("login")
                or commit_author_obj.get("name")
                or commit_author_obj.get("email")
                or "Unknown"
            )
            
            author = GithubAuthor(
                username=str(username),
                avatar_url=github_author_obj.get("avatar_url"),
                profile_url=github_author_obj.get("html_url")
            )
            
            date_str = commit_author_obj.get("date")
            
            commits.append(CommitData(
                sha=sha,
                message=commit_obj.get("message") or "No commit message",
                author=author,
                timestamp=self._parse_github_date(date_str),
                url=item.get("html_url") or f"https://github.com/{owner}/{repo}/commit/{sha}"
            ))
        return commits

    def fetch_pull_requests(self, owner: str, repo: str, state: str = "all", limit: int = 50) -> List[PullRequestData]:
        url = f"{self.base_url}/repos/{owner}/{repo}/pulls"
        params = {"state": state, "per_page": min(limit, 100)}
        response = self.session.get(url, params=params, timeout=15)
        
        if response.status_code != 200:
            logger.warning(f"Could not fetch PRs for {owner}/{repo}: HTTP {response.status_code}")
            return []
            
        data = response.json()
        if not data or not isinstance(data, list):
            return []
            
        prs: List[PullRequestData] = []
        for item in data[:limit]:
            if not isinstance(item, dict):
                continue
                
            pr_number = item.get("number")
            if pr_number is None:
                continue

            user_data = item.get("user") or {}
            author = GithubAuthor(
                username=user_data.get("login") or "Unknown",
                avatar_url=user_data.get("avatar_url"),
                profile_url=user_data.get("html_url")
            )
            
            merged_at_str = item.get("merged_at")
            
            prs.append(PullRequestData(
                pr_number=int(pr_number),
                title=item.get("title") or "Untitled PR",
                body=item.get("body") or "",
                state=item.get("state") or "open",
                author=author,
                created_at=self._parse_github_date(item.get("created_at")),
                merged_at=self._parse_github_date(merged_at_str) if merged_at_str else None,
                url=item.get("html_url") or f"https://github.com/{owner}/{repo}/pull/{pr_number}"
            ))
        return prs

    def fetch_commit_files(self, owner: str, repo: str, sha: str) -> List[str]:
        """Fetch files modified in a specific commit safely."""
        if not sha:
            return []
            
        url = f"{self.base_url}/repos/{owner}/{repo}/commits/{sha}"
        try:
            response = self.session.get(url, timeout=15)
            if response.status_code != 200:
                return []
                
            data = response.json()
            if not isinstance(data, dict):
                return []
                
            files = data.get("files")
            if not files or not isinstance(files, list):
                return []
                
            extracted_files: List[str] = []
            for f in files:
                if isinstance(f, dict) and f.get("filename"):
                    extracted_files.append(str(f["filename"]))
            return extracted_files
        except Exception as e:
            logger.warning(f"Failed to fetch files for commit {sha}: {e}")
            return []