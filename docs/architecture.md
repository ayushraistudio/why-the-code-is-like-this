# System Architecture

## Overview

**Why The Code Is Like This** is a developer-intelligence prototype that builds a temporal knowledge graph from GitHub repository history and uses GraphRAG with an LLM to produce evidence-grounded explanations of code evolution.

## Project Structure

```text
why-the-code-is-like-this/
|
+--- backend/
|   |
|   +--- app/
|   |   +--- api/
|   |   |   +--- ingestion.py
|   |   |   \--- retrieval.py
|   |   |
|   |   +--- core/
|   |   |   +--- config.py
|   |   |   \--- database.py
|   |   |
|   |   +--- generation/
|   |   |   \--- llm_service.py
|   |   |
|   |   +--- graph/
|   |   |   \--- builder.py
|   |   |
|   |   +--- ingestion/
|   |   |   \--- github_client.py
|   |   |
|   |   +--- models/
|   |   |   \--- github_models.py
|   |   |
|   |   +--- retrieval/
|   |   |   \--- graph_rag.py
|   |   |
|   |   \--- main.py
|   |
|   +--- .env.example
|   +--- requirements.txt
|
+--- demo/
|   \--- project-demo.mp4
|
+--- docs/
|   +--- architecture.md
|   +--- evaluation.md
|   +--- graph-schema.md
|   \--- limitations.md
|
+--- frontend/
|   |
|   +--- public/
|   |   +--- apple-touch-icon.png
|   |   \--- favicon.svg
|   |
|   +--- src/
|   |   +--- components/
|   |   |   +--- BrandIcons.tsx
|   |   |   +--- GraphView.tsx
|   |   |   +--- Header.tsx
|   |   |   +--- ResultsPanel.tsx
|   |   |   +--- SettingsModal.tsx
|   |   |   \--- Sidebar.tsx
|   |   |
|   |   +--- services/
|   |   |   \--- api.ts
|   |   |
|   |   +--- App.css
|   |   +--- App.tsx
|   |   +--- index.css
|   |   \--- main.tsx
|   |
|   +--- .env.example
|   +--- eslint.config.js
|   +--- index.html
|   +--- package.json
|   +--- package-lock.json
|   +--- tsconfig.app.json
|   +--- tsconfig.json
|   +--- tsconfig.node.json
|   \--- vite.config.ts
|
+--- .gitignore
\--- README.md
```

## Core Components

### 1. Frontend

**Technologies:** React, TypeScript, Vite, Tailwind CSS, Cytoscape.js, Lucide Icons, Axios.

The frontend provides the developer workspace for repository ingestion and architectural questions. It displays structured explanations, commit timelines, supporting evidence, limitations, and an interactive graph of retrieved entities. The current interface may also provide repository selection and light/dark themes, depending on the deployed build.

### 2. API and Orchestration Layer

**Technologies:** Python, FastAPI, Pydantic.

The backend exposes REST endpoints for repository ingestion, listing ingested repositories, clearing graph data, and asking GraphRAG questions. It coordinates GitHub data collection, graph construction, evidence retrieval, and LLM generation.

### 3. GitHub Ingestion Pipeline

**Main components:** `GithubClient` and `GraphBuilder`.

The ingestion pipeline validates repository metadata and retrieves repository information, commits, pull requests, authors, and modified file paths through the GitHub REST API. Cypher `MERGE` operations are used to create or update graph entities without intentionally duplicating matching nodes.

The amount of history ingested is limited by the current implementation and GitHub API constraints. See [Known Limitations](limitations.md).

### 4. Knowledge Graph Storage

**Technology:** Neo4j AuraDB.

The graph stores repositories, commits, pull requests, people, and file entities, connected by relationships described in [Graph Schema](graph-schema.md). The backend includes connection retry/recovery logic for transient database connection failures. The endpoint that clears the graph is destructive and should be used carefully.

### 5. GraphRAG Retrieval Engine

**Main component:** `GraphRAGService`.

The retrieval engine uses the user's question and optional keyword to find relevant graph evidence. Queries are scoped to the selected repository and use commit timestamps to order evidence chronologically. The quality of the answer depends on whether the relevant commits and file relationships were ingested and retrieved.

### 6. LLM Generation and Fallback

**Main component:** `LLMService`.

- **Primary provider:** Google Gemini, configured in the current project as `gemini-3.8-flash`.
- **Fallback provider:** Groq Cloud API, configured in the current project as `openai/gpt-oss-20b`, when the fallback is enabled and credentials are available.
- **Structured output:** The service parses model output into fields used by the UI, such as the explanation, evidence, decision status, confidence, limitations, and provider metadata.

Provider availability, model names, response formats, and fallback behavior depend on the current backend configuration. Model-generated conclusions should be checked against the supporting commits and other source evidence.

## End-to-End Data Flow

```text
GitHub REST API
      |
      | Repository metadata, commits, PRs, modified file paths
      v
FastAPI ingestion endpoint
      |
      v
GithubClient -> GraphBuilder -> Neo4j AuraDB knowledge graph
                                      |
                                      | Repository-scoped graph query
                                      v
Frontend question -> FastAPI ask endpoint -> GraphRAGService
                                                |
                                                v
                                      Retrieved graph evidence
                                                |
                                                v
                                           LLMService
                                         /           \
                              Gemini primary       Groq fallback
                                         \           /
                                                v
                                   Structured explanation
                                                |
                                                v
                           Explanation, timeline, graph, evidence,
                                  limitations, and export UI
```

## Main API Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/` | Health check |
| `POST` | `/api/ingest/?owner={owner}&repo={repo}` | Ingest a GitHub repository |
| `GET` | `/api/ingest/repositories` | List ingested repositories |
| `DELETE` | `/api/ingest/clear` | Clear graph data |
| `GET` | `/api/ask/?question={q}&keyword={k}&repo_url={url}` | Retrieve evidence and generate an answer |

Verify endpoint details against the backend route definitions if the implementation changes.

## Related Documentation

- [Graph Schema](graph-schema.md)
- [Evaluation Criteria](evaluation.md)
- [Known Limitations](limitations.md)
- [Project README](../README.md)
