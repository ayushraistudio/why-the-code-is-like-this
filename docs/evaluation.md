# Evaluation Criteria and Verification Scenarios

## Purpose

This document describes the core behaviors used to evaluate **Why The Code Is Like This**. These are functional verification scenarios, not a statistically validated accuracy benchmark.

## 1. Evidence-Grounded Decision Synthesis

**Objective:** Generate architectural explanations using ingested commit messages, timestamps, authors, file paths, and available pull-request information rather than inventing external facts.

**Verification:**
- Inspect the generated explanation and its supporting evidence.
- Confirm cited commit SHAs and links correspond to real repository history.
- Check whether the chronological breakdown matches the timestamps and changes shown by the source.
- Confirm the answer distinguishes recorded facts from inferred rationale.

**Pass condition:** Material claims are traceable to retrieved repository evidence, and missing rationale is explicitly acknowledged.

## 2. Multi-Hop Graph Traversal

**Objective:** Connect a repository to its commits, commits to modified files, and commits or pull requests to their authors.

**Verification:**
- Query using a file path or a concept present in the ingested history.
- Inspect the Commit Timeline and Entity Graph.
- Confirm the expected relationships are present in the graph.

The intended relationships are:

```text
(Repository)-[:CONTAINS]->(Commit)
(Repository)-[:CONTAINS]->(PullRequest)
(Person)-[:AUTHORED_BY]->(Commit)
(Person)-[:AUTHORED_BY]->(PullRequest)
(Commit)-[:MODIFIED_BY]->(CodeEntity)
```

**Pass condition:** Relevant entities and relationships are retrieved in the context of the selected repository.

## 3. Temporal Reasoning and Supersession Detection

**Objective:** Identify when an earlier engineering approach was later refactored, reversed, or replaced, when the available evidence supports that conclusion.

**Verification:**
- Compare the chronological order of relevant commits.
- Inspect commit messages, modified-file information, and any available PR context.
- Check whether the decision status matches the evidence.

The project uses these decision statuses:

- **`Current`** — the available history supports that the implementation remains current.
- **`Superseded`** — newer evidence indicates an earlier implementation was replaced or refactored.
- **`Contested`** — the available evidence supports conflicting interpretations or changes.
- **`Uncertain`** — the evidence is incomplete or ambiguous.

**Pass condition:** The status is justified by retrieved history, and chronology alone is not treated as proof of intent.

## 4. Honest Abstention When Evidence Is Insufficient

**Objective:** Avoid unsupported explanations when the requested file, feature, or technology is absent from the ingested graph or when relevant evidence cannot be retrieved.

**Verification:**
- Ask about a file or technology that is not present in the selected repository.
- Inspect the retrieved evidence count and the response.
- Confirm the answer identifies the evidence gap instead of inventing commits or reasons.

The intended no-evidence behavior is `Decision_Status: "Uncertain"` and `Confidence: "Low"` when the backend detects zero matching evidence nodes.

**Pass condition:** The system communicates the limitation clearly and does not present an unsupported explanation as fact.

## 5. LLM Failover and Operational Resilience

**Objective:** Preserve the analysis workflow when a configured LLM provider encounters a rate limit or transient failure, and recover from transient database connection problems where supported by the backend.

**Verification:**
- With fallback credentials configured, simulate or observe a primary Gemini failure or rate limit.
- Confirm the application attempts the configured Groq fallback and reports the active provider accurately.
- Where Neo4j retry logic is enabled, verify transient connection errors trigger the configured retry/reconnection behavior.

**Pass condition:** Fallback and retry behavior matches the implementation and is reported accurately. Do not mark this scenario as passed solely because the feature is described in documentation.

## Reporting Results

For each scenario, record:

| Field | What to record |
|---|---|
| Test input | Repository, question, and target file or keyword |
| Expected behavior | The behavior described in this document |
| Observed behavior | What the application actually returned |
| Evidence | Commit URLs/SHAs, graph output, logs, or screenshots |
| Result | Pass, Fail, or Not Tested |
| Notes | Missing data, rate limits, configuration, or other constraints |

A small number of manual tests can demonstrate functional behavior, but must not be reported as a statistically validated accuracy percentage.

## Related Documentation

- [System Architecture](architecture.md)
- [Graph Schema](graph-schema.md)
- [Known Limitations](limitations.md)
- [Project README](../README.md)
