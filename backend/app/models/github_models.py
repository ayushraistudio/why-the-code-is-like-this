from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class GithubAuthor(BaseModel):
    username: str
    avatar_url: Optional[str] = None
    profile_url: Optional[str] = None

class CommitData(BaseModel):
    sha: str
    message: str
    author: GithubAuthor
    timestamp: datetime
    url: str

class PullRequestData(BaseModel):
    pr_number: int
    title: str
    body: Optional[str]
    state: str
    author: GithubAuthor
    created_at: datetime
    merged_at: Optional[datetime] = None
    url: str

class IssueData(BaseModel):
    issue_number: int
    title: str
    body: Optional[str]
    state: str
    author: GithubAuthor
    created_at: datetime
    url: str

class RepositoryMetadata(BaseModel):
    owner: str
    name: str
    description: Optional[str]
    url: str
    default_branch: str