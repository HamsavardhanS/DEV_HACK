"""
LLM SOC Analyst Agent – AI-powered security analyst agent.

Consumes:
    - risk-events       (from Risk Assessment Agent)
    - response-events   (from Response Agent)

Publishes:
    - ai-analysis-events (new topic for AI analysis results)

Also stores results in SQLite table: ai_incident_analysis

Run:
    cd cyber-war-room
    python agents/llm_soc_analyst.py
"""

import os
import sys
import json
import sqlite3

# Add parent dir to path to import shared and services modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from shared.kafka_utils import get_producer
from shared.models import AgentEvent
from services.llm_service import analyze_event
from dataclasses import asdict
from kafka import KafkaConsumer

AGENT_NAME = "LLMSOCAnalystAgent"
INPUT_TOPICS = ["risk-events", "response-events"]
OUTPUT_TOPIC = "ai-analysis-events"
DB_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "forensics.db")


def init_db():
    """Creates the ai_incident_analysis table if it doesn't exist."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS ai_incident_analysis (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            event_id TEXT,
            timestamp TEXT,
            attack_type TEXT,
            risk_score INTEGER,
            ai_analysis TEXT,
            recommendations TEXT,
            severity TEXT,
            source_ip TEXT
        )
    ''')
    conn.commit()
    conn.close()
    print(f"[{AGENT_NAME}] Database initialized at {DB_PATH}")


def store_analysis(event_id: str, timestamp: str, event_data: dict, analysis: dict):
    """Stores the AI analysis result in the ai_incident_analysis table."""
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO ai_incident_analysis 
            (event_id, timestamp, attack_type, risk_score, ai_analysis, recommendations, severity, source_ip)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            event_id,
            timestamp,
            analysis.get("attack_type", "Unknown"),
            event_data.get("risk_score", 0),
            analysis.get("analysis", ""),
            json.dumps(analysis.get("recommendations", [])),
            analysis.get("severity", "Unknown"),
            event_data.get("source_ip", event_data.get("target_ip", "unknown"))
        ))
        conn.commit()
        conn.close()
    except Exception as e:
        print(f"[{AGENT_NAME}] DB write error: {e}")


def extract_event_data(incoming_event: AgentEvent) -> dict:
    """Extracts relevant fields from the incoming event payload for LLM analysis."""
    payload = incoming_event.payload
    return {
        "attack_type": payload.get("attack_type", "Unknown"),
        "source_ip": payload.get("target_ip", payload.get("ip", "unknown")),
        "timestamp": incoming_event.timestamp,
        "risk_score": payload.get("risk_score", 0),
        "impact": payload.get("impact", ""),
        "action_taken": payload.get("action_taken", payload.get("recommended_action", "")),
        "justification": payload.get("justification", ""),
        "reasoning": incoming_event.reasoning,
        "threat_level": payload.get("threat_level", ""),
        "anomaly_type": payload.get("original_anomaly", payload.get("anomaly_type", "")),
    }


def run_llm_soc_analyst():
    """Main loop – consumes risk-events and response-events, runs LLM analysis, publishes results."""
    init_db()

    # Multi-topic consumer (same pattern as forensic.py)
    consumer = KafkaConsumer(
        *INPUT_TOPICS,
        bootstrap_servers='localhost:9092',
        group_id="llm-soc-analyst-group",
        auto_offset_reset='earliest',
        enable_auto_commit=True,
        value_deserializer=lambda x: json.loads(x.decode('utf-8')),
        api_version=(0, 11, 5)
    )

    producer = get_producer()
    print(f"[{AGENT_NAME}] Listening on topics: {INPUT_TOPICS}")
    print(f"[{AGENT_NAME}] Publishing to: {OUTPUT_TOPIC}")

    # Track processed event IDs to avoid duplicate analysis
    # (same event_id arrives on both risk-events and response-events)
    processed_events = set()

    try:
        for message in consumer:
            event_data_raw = message.value
            incoming_event = (
                AgentEvent.from_json(event_data_raw)
                if isinstance(event_data_raw, str)
                else AgentEvent(**event_data_raw)
            )

            event_id = incoming_event.event_id
            source_topic = message.topic

            # Prefer response-events (has the most complete data with action_taken).
            # If we already processed this event from risk-events, skip.
            # If we see response-events first, process it immediately.
            if source_topic == "risk-events":
                # Only process risk-events if we haven't seen this event from response-events
                if event_id in processed_events:
                    continue
                # Mark as pending – will be overridden if response-events arrives
                processed_events.add(event_id)
            elif source_topic == "response-events":
                # Response events are the most complete – always process
                processed_events.add(event_id)

            # Extract event data for LLM
            extracted = extract_event_data(incoming_event)

            # Skip events with no meaningful attack data
            if extracted["attack_type"] == "Unknown" and extracted["risk_score"] == 0:
                continue

            print(f"\n[{AGENT_NAME}] Analyzing event {event_id[:8]}... (from {source_topic})")
            print(f"    Attack: {extracted['attack_type']} | IP: {extracted['source_ip']} | Risk: {extracted['risk_score']}")

            # ── Run LLM Analysis ──
            analysis = analyze_event(extracted)

            print(f"    AI Severity: {analysis['severity']}")
            print(f"    AI Analysis: {analysis['analysis'][:100]}...")
            print(f"    Recommendations: {len(analysis['recommendations'])} items")

            # ── Store in SQLite ──
            store_analysis(event_id, incoming_event.timestamp, extracted, analysis)

            # ── Publish to Kafka ──
            ai_payload = {
                "event_id": event_id,
                "attack_type": analysis["attack_type"],
                "severity": analysis["severity"],
                "ai_analysis": analysis["analysis"],
                "recommendations": analysis["recommendations"],
                "risk_score": extracted["risk_score"],
                "source_ip": extracted["source_ip"],
                "action_taken": extracted["action_taken"],
                "original_timestamp": incoming_event.timestamp,
            }

            out_event = AgentEvent(
                source_agent=AGENT_NAME,
                payload=ai_payload,
                confidence_score=0.90,
                reasoning=f"LLM SOC analysis of {extracted['attack_type']} event with risk score {extracted['risk_score']}.",
                event_id=event_id,
            )

            producer.send(OUTPUT_TOPIC, value=asdict(out_event))
            producer.flush()

            print(f"    ✓ Published to {OUTPUT_TOPIC}")

    except KeyboardInterrupt:
        print(f"\nStopping {AGENT_NAME}...")
    finally:
        consumer.close()
        producer.close()
        print(f"[{AGENT_NAME}] Shut down cleanly.")


if __name__ == "__main__":
    run_llm_soc_analyst()
