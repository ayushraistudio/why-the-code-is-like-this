# Neo4j Knowledge Graph Schema

## Overview

The graph models GitHub repository history so the application can retrieve relationships among repositories, commits, pull requests, contributors, and modified files. The schema below documents the entities and relationships used by the project.

## Node Labels and Properties

### `Repository`

Represents an ingested GitHub repository and provides the scope for repository-specific queries.

| Property | Type | Description |
|---|---|---|
| `url` | String | Full repository URL; used as the repository identifier |
| `owner` | String | GitHub user or organization that owns the repository |
| `name` | String | Repository name |
| `default_branch` | String | Default branch, such as `main` or `master` |

### `Commit`

Represents a commit retrieved from repository history.

| Property | Type | Description |
|---|---|---|
| `sha` | String | Commit SHA |
| `message` | String | Commit message |
| `timestamp` | String / ISO-8601 | Commit timestamp used for chronological ordering |
| `url` | String | Direct GitHub commit URL |

### `PullRequest`

Represents a GitHub pull request associated with a repository.

| Property | Type | Description |
|---|---|---|
| `pr_number` | Integer | Pull request number |
| `repo_url` | String | URL of the parent repository |
| `title` | String | Pull request title |
| `body` | String | Pull request description |
| `state` | String | State such as `open`, `closed`, or `merged` |
| `url` | String | Direct GitHub pull-request URL |

The implementation should scope a pull request by both its repository and PR number because PR numbers are repository-specific.

### `Person`

Represents a contributor associated with a commit or pull request.

| Property | Type | Description |
|---|---|---|
| `username` | String | GitHub login, author name, or fallback identifier |
| `avatar_url` | String, optional | Contributor avatar URL |
| `profile_url` | String, optional | Contributor profile URL |

### `CodeEntity`

Represents a file identified in commit modification metadata.

| Property | Type | Description |
|---|---|---|
| `file_path` | String | Repository-relative file path |
| `name` | String | File name or path used for matching |
| `entity_type` | String | File entity type; documented as `File` |

The current documented granularity is file-level. It does not imply AST-level, function-level, or line-level semantic analysis.

## Relationships

```text
(Repository)-[:CONTAINS]->(Commit)
(Repository)-[:CONTAINS]->(PullRequest)
(Person)-[:AUTHORED_BY]->(Commit)
(Person)-[:AUTHORED_BY]->(PullRequest)
(Commit)-[:MODIFIED_BY]->(CodeEntity)
```

| Relationship | Source | Target | Meaning |
|---|---|---|---|
| `[:CONTAINS]` | `Repository` | `Commit` | Associates a commit with its repository |
| `[:CONTAINS]` | `Repository` | `PullRequest` | Associates a pull request with its repository |
| `[:AUTHORED_BY]` | `Person` | `Commit` | Associates a contributor with a commit |
| `[:AUTHORED_BY]` | `Person` | `PullRequest` | Associates a contributor with a pull request |
| `[:MODIFIED_BY]` | `Commit` | `CodeEntity` | Records that a commit modified a file |

## Example Traversal

A file-history query conceptually follows these relationships:

```text
Repository -> Commit -> CodeEntity
                 |
                 v
               Person
```

This allows the application to retrieve commits associated with a target file and identify the recorded contributor for each commit, provided those entities and relationships were successfully ingested.

## Data Integrity and Query Scope

- Repository-specific queries should be constrained by the repository URL.
- Merge and upsert operations should avoid creating duplicate entities for the same identifiers.
- Commit timestamps should be normalized consistently before chronological sorting.
- Missing author or modified-file metadata should be treated as missing evidence, not fabricated.
- The precise uniqueness constraints and Cypher implementation should be verified against the backend code.

## Related Documentation

- [System Architecture](architecture.md)
- [Evaluation Criteria](evaluation.md)
- [Known Limitations](limitations.md)
- [Project README](../README.md)
