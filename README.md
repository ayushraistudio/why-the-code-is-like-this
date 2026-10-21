# GraphoraX

### HackFront India — T1.1: AI and Developer Tools

**GraphoraX** is an AI-powered developer intelligence platform that explains **"Why is the code like this?"** by building knowledge graphs from GitHub repository history and using GraphRAG with LLMs to generate evidence-grounded engineering explanations.

**Live Demo:** https://graphorax.vercel.app/

**GitHub Repository:** https://github.com/ayushraistudio/why-the-code-is-like-this

---

## Overview

Software repositories record what changed, but the reasoning behind a decision is often spread across commits, authors, files, and pull requests. This project connects that history in Neo4j AuraDB and retrieves relevant graph evidence to help explain how code evolved.

The system is designed to distinguish evidence-backed conclusions from uncertain interpretations. When the ingested graph does not contain enough relevant information, the answer should acknowledge the gap instead of inventing a reason.

## Features

- **Graph-based reasoning:** Connects repositories, files, authors, commits, and pull requests in Neo4j.
- **Temporal decision tracking:** Uses chronological evidence to identify when an earlier implementation may have been superseded.
- **Evidence-aware answers:** Communicates uncertainty when relevant history is missing or ambiguous.
- **Repository-scoped queries:** Keeps analysis in the context of the selected ingested repository.
- **Interactive graph visualization:** Explores relationships through a React and Cytoscape.js interface.
- **Structured analysis:** Presents explanations, commit timelines, supporting evidence, and limitations.
- **LLM fallback:** Supports a configured Groq fallback when the primary Gemini provider fails or reaches a quota limit.
- **Export and theme support:** Available where implemented in the current frontend build.

## Technology Stack

| Layer | Technologies |
|---|---|
| Frontend | React, TypeScript, Vite, Tailwind CSS, Cytoscape.js, Lucide Icons, Axios |
| Backend | Python, FastAPI, Pydantic, Requests |
| Knowledge graph | Neo4j AuraDB |
| Primary LLM | Google Gemini |
| Fallback LLM | Groq Cloud API, when configured |
| Source data | GitHub repository metadata, commits, pull requests, and modified-file information |

## Documentation

Detailed technical documentation is maintained in the `docs/` directory:

| Document | Description |
|---|---|
| [System Architecture](docs/architecture.md) | Components, responsibilities, data flow, and API endpoints |
| [Evaluation Criteria](docs/evaluation.md) | Functional scenarios and how to verify system behavior |
| [Graph Schema](docs/graph-schema.md) | Neo4j node labels, properties, and relationships |
| [Known Limitations](docs/limitations.md) | Ingestion coverage, evidence quality, service limits, and evaluation boundaries |

## Prerequisites

- Python 3.10 or later, using a version supported by the dependencies
- Node.js and npm
- A running Neo4j AuraDB instance
- A Google Gemini API key
- A GitHub Personal Access Token for higher API rate limits
- A Groq API key if fallback generation is enabled

## External Services

1. Create a database instance with [Neo4j AuraDB](https://neo4j.com/cloud/platform/aura-graph-database/).
2. Generate a Gemini API key in [Google AI Studio](https://aistudio.google.com/).
3. Generate a [GitHub Personal Access Token](https://github.com/settings/tokens).
4. Generate a Groq API key in [Groq Console](https://console.groq.com/) if the fallback provider is enabled.

Never commit real API keys, tokens, database passwords, or `.env` files to version control.

## Local Setup

### 1. Backend

From the project root:

```bash
cd backend
python -m venv venv
```

Activate the virtual environment.

**Windows PowerShell:**

```powershell
.\venv\Scripts\Activate.ps1
```

**macOS / Linux:**

```bash
source venv/bin/activate
```

Install dependencies:

```bash
python -m pip install -r requirements.txt
```

Create `backend/.env`:

```dotenv
GITHUB_TOKEN=your_github_token_here
NEO4J_URI=neo4j+s://your-instance.databases.neo4j.io
NEO4J_USERNAME=your_neo4j_username
NEO4J_PASSWORD=your_neo4j_password_here
GEMINI_API_KEY=your_gemini_api_key_here
GROQ_API_KEY=your_groq_api_key_here
```

If Groq fallback is not used in your current configuration, follow the environment-variable requirements in the backend code.

Start the API server **from the `backend/` directory**:

```bash
python -m uvicorn app.main:app --reload
```

API documentation: `http://127.0.0.1:8000/docs`

### 2. Frontend

Open a second terminal from the project root:

```bash
cd frontend
npm install
```

Create `frontend/.env`:

```dotenv
VITE_API_BASE_URL=http://127.0.0.1:8000/api
```

Start the frontend:

```bash
npm run dev
```

Open the local URL printed by Vite, typically `http://localhost:5173`.

Keep both development servers running while using the application.

## Typical Workflow

1. Start the backend and frontend.
2. Enter a public GitHub repository URL or its owner and repository name.
3. Ingest the repository into the knowledge graph.
4. Select the active repository if the frontend provides a repository selector.
5. Ask an architectural question, optionally specifying a target file or keyword.
6. Review the explanation, decision status, confidence signal, commit timeline, entity graph, supporting evidence, and limitations.
7. Verify important conclusions against the cited commits, pull requests, and source changes.
8. Export the analysis as JSON if the export option is available in the current build.

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | Health check |
| `POST` | `/api/ingest/?owner={owner}&repo={repo}` | Ingest repository commits, pull requests, authors, and file entities |
| `GET` | `/api/ingest/repositories` | List ingested repository URLs |
| `DELETE` | `/api/ingest/clear` | Clear graph data; destructive operation |
| `GET` | `/api/ask/?question={q}&keyword={k}&repo_url={url}` | Retrieve graph evidence and generate a structured answer |

Verify endpoint details against the backend route definitions if the implementation changes.

## Evaluation

Initial functional evaluation should cover:

1. Evidence-grounded explanations.
2. Multi-hop graph traversal.
3. Temporal reasoning and supersession detection.
4. Honest abstention when evidence is insufficient.
5. LLM fallback and database retry behavior where configured.

These are functional scenarios, not a statistically validated accuracy benchmark. See [Evaluation Criteria](docs/evaluation.md) for verification steps.

## Security Notes

- Never commit credentials, tokens, or real `.env` files.
- Revoke or rotate exposed credentials immediately.
- Avoid exposing private repository data or secrets in generated answers.
- Configure production CORS origins and API URLs for the deployment environment.
- `--reload` is intended for local development, not production.
- Use the graph-clearing endpoint only when you intentionally want to delete ingested graph data.
- Verify important AI-generated conclusions against the source evidence.

## Troubleshooting

- **Backend fails to start:** Activate the virtual environment and install `backend/requirements.txt`.
- **Pylance import warnings:** Select `backend/venv/Scripts/python.exe` as the Windows interpreter and restart the language server.
- **Frontend cannot reach the API:** Confirm the backend is running and `VITE_API_BASE_URL` matches the API address and prefix.
- **Neo4j connection errors:** Check the AuraDB URI, credentials, instance status, and network access.
- **GitHub ingestion fails:** Check the owner/repository name, visibility, token, API rate limits, and backend logs.
- **No evidence found:** Confirm ingestion succeeded and the requested file or keyword exists in the ingested graph.
- **LLM quota exceeded:** Check Gemini quota and verify Groq credentials/model settings if fallback is enabled.
- **Uncertain answer or limited evidence:** Inspect ingestion coverage and retrieved graph evidence before assuming the model is at fault.

## Project Status

This is a developer-intelligence prototype for exploring GitHub history and evidence-grounded architectural reasoning. Feature availability and provider fallback behavior depend on the current implementation and configuration. Verify generated conclusions against source evidence before relying on them.

## Links
**Live Demo:** https://graphorax.vercel.app/

**GitHub Repository:** https://github.com/ayushraistudio/why-the-code-is-like-this

## 🎬 Project Demo

[![Watch GraphoraX Demo](https://img.youtube.com/vi/Io0-KjZsGmk/maxresdefault.jpg)](https://youtu.be/Io0-KjZsGmk)


