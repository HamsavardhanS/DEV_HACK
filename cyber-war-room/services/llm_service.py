"""
LLM Service – Sends cybersecurity event data to Groq LLM (Llama 3.3 70B) for analysis.

Usage:
    from services.llm_service import analyze_event
    result = analyze_event(event_data_dict)

Environment:
    GROQ_API_KEY must be set.
"""


import os
import json
import time
import logging

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("LLMService")

try:
    from groq import Groq
except ImportError:
    logger.error("groq package not installed. Run: pip install groq")
    raise

# ──────────────────────────────────────────────
# Configuration
# ──────────────────────────────────────────────
MODEL = "llama-3.3-70b-versatile"
MAX_RETRIES = 3
RETRY_BACKOFF = 2  # seconds, doubles each retry

SYSTEM_PROMPT = """You are a senior SOC (Security Operations Center) analyst AI.
Given a cybersecurity incident event, produce a structured JSON analysis with these exact keys:

{
  "attack_type": "<string – refined attack classification>",
  "severity": "<Critical | High | Medium | Low>",
  "analysis": "<string – 2-4 sentence expert explanation of the attack, its potential impact, and indicators of compromise>",
  "recommendations": ["<actionable mitigation step 1>", "<step 2>", "..."]
}

Rules:
- Return ONLY valid JSON, no markdown fences, no extra text.
- Recommendations must be specific and actionable (e.g., "Block IP 10.0.0.88 at the perimeter firewall").
- Severity must match the risk score: >=80 Critical, >=50 High, >=30 Medium, else Low.
- Consider the action already taken and advise further steps."""


def _build_user_prompt(event: dict) -> str:
    """Formats event data into a concise prompt for the LLM."""
    return (
        f"Analyze this cybersecurity incident:\n"
        f"- Attack Type: {event.get('attack_type', 'Unknown')}\n"
        f"- Source IP: {event.get('source_ip', event.get('target_ip', 'Unknown'))}\n"
        f"- Risk Score: {event.get('risk_score', 'N/A')}\n"
        f"- Impact Level: {event.get('impact', 'N/A')}\n"
        f"- Action Taken: {event.get('action_taken', 'N/A')}\n"
        f"- Justification: {event.get('justification', 'N/A')}\n"
        f"- Timestamp: {event.get('timestamp', 'N/A')}\n"
        f"- Reasoning Chain: {event.get('reasoning', 'N/A')}\n"
    )


def analyze_event(event: dict) -> dict:
    """
    Sends an event dictionary to GPT-4o-mini and returns structured analysis.

    Returns dict with keys: attack_type, severity, analysis, recommendations
    On failure after retries, returns a fallback dict with error info.
    """
    api_key = os.environ.get("GROQ_API_KEY")
    if not api_key:
        logger.error("GROQ_API_KEY environment variable is not set.")
        return _fallback_response(event, "GROQ_API_KEY not configured")

    client = Groq(api_key=api_key)
    user_prompt = _build_user_prompt(event)

    for attempt in range(1, MAX_RETRIES + 1):
        try:
            response = client.chat.completions.create(
                model=MODEL,
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": user_prompt},
                ],
                temperature=0.3,
                max_tokens=512,
            )

            content = response.choices[0].message.content.strip()

            # Strip markdown code fences if the model wraps in ```json ... ```
            if content.startswith("```"):
                content = content.split("\n", 1)[1]  # drop first line
                content = content.rsplit("```", 1)[0]  # drop trailing fence
                content = content.strip()

            result = json.loads(content)

            # Validate required keys
            required = {"attack_type", "severity", "analysis", "recommendations"}
            if not required.issubset(result.keys()):
                raise ValueError(f"Missing keys: {required - set(result.keys())}")

            logger.info(f"LLM analysis successful for event (attempt {attempt})")
            return result

        except json.JSONDecodeError as e:
            logger.warning(f"Attempt {attempt}/{MAX_RETRIES} – Invalid JSON from LLM: {e}")
        except Exception as e:
            logger.warning(f"Attempt {attempt}/{MAX_RETRIES} – LLM error: {e}")

        if attempt < MAX_RETRIES:
            wait = RETRY_BACKOFF ** attempt
            logger.info(f"Retrying in {wait}s...")
            time.sleep(wait)

    logger.error("All LLM retries exhausted. Returning fallback response.")
    return _fallback_response(event, "LLM service unavailable after retries")


def _fallback_response(event: dict, error_msg: str) -> dict:
    """Returns a deterministic fallback when the LLM is unreachable."""
    risk_score = event.get("risk_score", 0)
    if risk_score >= 80:
        severity = "Critical"
    elif risk_score >= 50:
        severity = "High"
    elif risk_score >= 30:
        severity = "Medium"
    else:
        severity = "Low"

    return {
        "attack_type": event.get("attack_type", "Unknown"),
        "severity": severity,
        "analysis": f"[Automated fallback – {error_msg}] "
                     f"A {event.get('attack_type', 'unknown')} attack was detected from "
                     f"{event.get('source_ip', event.get('target_ip', 'unknown IP'))} "
                     f"with risk score {risk_score}.",
        "recommendations": [
            f"Review IP {event.get('source_ip', event.get('target_ip', 'unknown'))} in firewall logs",
            "Escalate to senior SOC analyst for manual review",
            "Check related events in forensic logs"
        ],
    }
