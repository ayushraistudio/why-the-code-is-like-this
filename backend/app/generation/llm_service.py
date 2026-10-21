import google.generativeai as genai
from app.core.config import settings
import json
import logging
import re
import requests

logger = logging.getLogger(__name__)


class LLMService:
    def __init__(self):
        if settings.GEMINI_API_KEY:
            genai.configure(api_key=settings.GEMINI_API_KEY)
            self.gemini_model = genai.GenerativeModel("gemini-3.8-flash")
        else:
            self.gemini_model = None

    def _extract_json(self, raw_text: str) -> dict:
        """Safely extracts and parses a JSON object from LLM response text."""
        if not raw_text:
            raise ValueError("Empty response from AI model")

        cleaned = raw_text.strip()
        cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned, flags=re.IGNORECASE)
        cleaned = re.sub(r"\s*```$", "", cleaned)

        start_idx = cleaned.find("{")
        end_idx = cleaned.rfind("}")
        if start_idx != -1 and end_idx != -1 and end_idx > start_idx:
            cleaned = cleaned[start_idx : end_idx + 1]

        return json.loads(cleaned)

    def _call_groq(self, prompt: str) -> dict:
        """Fallback LLM call using Groq API with openai/gpt-oss-20b."""
        if not settings.GROQ_API_KEY:
            raise ValueError("GROQ_API_KEY is not configured in environment.")

        url = url = "https://api.groq.com/openai/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {settings.GROQ_API_KEY}",
            "Content-Type": "application/json",
        }
        payload = {
            "model": "openai/gpt-oss-20b",
            "messages": [
                {
                    "role": "system",
                    "content": (
                        "You are a senior software engineer analyzing git history. "
                        "Always respond with a valid JSON object only, with no markdown wrappers."
                    ),
                },
                {"role": "user", "content": prompt},
            ],
            "temperature": 0.2,
        }

        response = requests.post(url, json=payload, headers=headers, timeout=30)
        response.raise_for_status()
        data = response.json()
        content = data["choices"][0]["message"]["content"].strip()
        return self._extract_json(content)

    def generate_answer(self, question: str, evidence_list: list) -> dict:
        if not evidence_list:
            return {
                "Decision": (
                    "**Summary:** No matching commit or file history was found in the knowledge graph for this query.\n\n"
                    "- **Possible Reason 1:** The target file or feature has not been modified in the ingested commit window.\n"
                    "- **Possible Reason 2:** Try using a broader keyword or verify that the correct repository is selected in the top bar."
                ),
                "Evidence": [],
                "Related_Code": [],
                "Decision_Status": "Uncertain",
                "Confidence": "Low (No matching graph nodes)",
                "Limitations": "The knowledge graph contains no historical commits or PRs matching the search terms for this repository.",
                "ai_provider": "No Model Available",
            }

        context_text = ""
        for i, ev in enumerate(evidence_list):
            context_text += (
                f"\nEvidence {i+1} (Date: {ev.get('timestamp')}):\n"
                f"- SHA: {ev.get('sha')}\n"
                f"- Author: {ev.get('author')}\n"
                f"- File: {ev.get('file')}\n"
                f"- Message: {ev.get('message')}\n"
            )

        prompt = f"""
You are a strict, analytical senior software engineer tracing engineering decisions through a codebase's history.
Answer the question using ONLY the provided chronological evidence. Do NOT invent or hallucinate any details.

Question: {question}

Chronological Evidence from Knowledge Graph (Latest to Oldest):
{context_text}

INSTRUCTIONS FOR STRUCTURED FORMATTING & TEMPORAL REASONING (CRITICAL):
1. Format the "Decision" field as a well-structured, multi-part engineering explanation using newline breaks (\\n\\n) and bullet points (- ):
   - Start with a **Summary:** paragraph clearly answering the question.
   - Follow with **Chronological Breakdown:** using bullet points (`- `) that highlight key dates, **commit SHAs**, **authors**, and **file names** in `**bold**`.
   - End with **Architectural Impact / Rationale:** explaining why the change was made based on the evidence.
2. Look at the dates (Timestamps). If newer evidence explicitly changes, replaces, refactors, or reverses an older decision, mark "Decision_Status" as "Superseded".
3. If the decision remains active, mark "Decision_Status" as "Current".
4. If the evidence does not clearly explain the underlying rationale, set Confidence to "Low" or "Medium" and note it clearly in "Limitations".

Return your answer STRICTLY as a valid JSON object without markdown wrappers:
{{
    "Decision": "**Summary:** ...\\n\\n**Chronological Breakdown:**\\n- **Date (SHA):** ...\\n\\n**Architectural Impact:** ...",
    "Evidence": ["Commit <short_sha> by <author> (<date>) — <commit_message>"],
    "Related_Code": ["list of affected file paths"],
    "Decision_Status": "Current / Superseded / Contested / Uncertain",
    "Confidence": "High / Medium / Low (Short reason)",
    "Limitations": "Note any missing context or gaps."
}}
"""

        # 1. Primary Model: Google Gemini (gemini-3.8-flash)
        if self.gemini_model:
            try:
                response = self.gemini_model.generate_content(prompt)
                parsed_json = self._extract_json(response.text)
                parsed_json["ai_provider"] = "Google Gemini (gemini-3.8-flash)"
                return parsed_json
            except Exception as gemini_err:
                logger.warning(f"Gemini failed or hit rate limit. Falling back to Groq: {gemini_err}")

        # 2. Fallback Model: Groq (openai/gpt-oss-20b)
        if settings.GROQ_API_KEY:
            try:
                groq_result = self._call_groq(prompt)
                groq_result["ai_provider"] = "Groq (openai/gpt-oss-20b)"
                return groq_result
            except Exception as groq_err:
                logger.error(f"Groq fallback also failed: {groq_err}")

        # 3. Both models failed
        return {
            "Decision": "Internal AI service error. Both primary (Google Gemini) and fallback (Groq) models are temporarily unreachable or rate-limited.",
            "Evidence": [],
            "Related_Code": [],
            "Decision_Status": "Uncertain",
            "Confidence": "Low",
            "Limitations": "Both primary (Gemini) and fallback (Groq) models encountered errors. Please try again in a moment.",
            "ai_provider": "No Model Available",
            "error_flag": "AI_FAILURE",
        }