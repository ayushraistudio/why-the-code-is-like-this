# Known Limitations and Scope Boundaries

This document records constraints that affect the coverage and reliability of **Why The Code Is Like This**. Actual limits may change as the implementation and service plans change.

## 1. Ingestion Window and GitHub API Rate Limits

The current project documentation describes an ingestion window of up to **25 recent commits** and **15 pull requests** per ingestion cycle, including modified-file information. Verify these limits against the current backend configuration before changing or publishing them as guarantees.

Older architectural decisions may fall outside the ingested window. GitHub API rate limits and pagination behavior can also restrict the history collected.

**Impact:** A missing old commit does not prove that the decision never happened; it may simply be outside the ingested dataset.

## 2. Commit Message and Pull-Request Quality

GraphRAG reasoning is constrained by the evidence available in commit messages, timestamps, file paths, and pull-request information. Vague messages such as `fix bug` or `update` may describe what changed without explaining why.

**Impact:** The system may be able to report the sequence of changes and the recorded authors but still be unable to establish the original engineering rationale.

## 3. File-Level Granularity

The current documented schema links commits to modified files through `CodeEntity` nodes. It does not describe Abstract Syntax Tree (AST) parsing or function-level and line-level semantic diff analysis.

**Impact:** The system can associate a commit with a file, but it should not claim to understand every function-level change unless additional diff-analysis functionality is implemented.

## 4. Empty or Missing File Metadata

Some commits, including certain merge commits or commits with no reported file changes, may have missing or `null` file arrays in GitHub API responses.

**Impact:** Such commits may be present in the graph without a usable file relationship. The backend should handle missing arrays safely and avoid inventing modified files.

## 5. LLM Uncertainty and Hallucination Risk

Prompt constraints and evidence retrieval reduce unsupported claims but do not guarantee that every generated interpretation is correct. A model may still overgeneralize, misunderstand a commit message, or infer intent that is not recorded.

**Impact:** Treat generated explanations as analysis, not proof. Verify important conclusions against commit URLs, SHAs, diffs, and pull requests. The system should label unsupported rationale as uncertain.

## 6. Cloud Service Availability and Quotas

Neo4j AuraDB and hosted LLM providers depend on service availability, network connectivity, and account quotas. Free-tier services may pause or impose request limits. Gemini-to-Groq fallback only helps when the fallback is configured, reachable, and has available quota.

**Impact:** If both LLM providers are unavailable or rate-limited, generation may fail temporarily. Database connection recovery cannot compensate for an unavailable database or invalid credentials.

## 7. Repository Scope and Incomplete Evidence

The quality of an answer depends on successful ingestion, retrieval, repository scoping, and the presence of relevant relationships. A query may return no evidence if the target file is absent, the ingestion window omitted its commits, the keyword does not match stored fields, or retrieval logic misses relevant nodes.

**Impact:** `Uncertain`, low confidence, or limited evidence can be appropriate outcomes. Check ingestion coverage and retrieved evidence before assuming the model is at fault.

## 8. Evaluation Scope

A small number of manual scenarios can check expected behavior but cannot establish a statistically validated accuracy score.

**Impact:** Report observed test cases, evidence, and limitations. Do not claim an accuracy percentage unless it comes from a defined, sufficiently sized evaluation set and reproducible measurement method.

## Related Documentation

- [System Architecture](architecture.md)
- [Evaluation Criteria](evaluation.md)
- [Graph Schema](graph-schema.md)
- [Project README](../README.md)
