import os
import sys
import sqlite3
import json

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from shared.kafka_utils import get_consumer, get_producer
from shared.models import AgentEvent
from dataclasses import asdict

AGENT_NAME = "ForensicLoggingAgent"
# Consuming from all event topics to get a full timeline
INPUT_TOPICS = ["monitoring-events", "threat-events", "risk-events", "response-events"]
OUTPUT_TOPIC = "audit-events" # Required to produce to another topic
DB_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "forensics.db")

def init_db():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    # Using 'incident_logs' as per requirements
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS incident_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            event_id TEXT,
            agent_name TEXT,
            timestamp TEXT,
            action_taken TEXT,
            severity_level TEXT,
            decision_trace TEXT,
            details TEXT
        )
    ''')
    cursor.execute('''
        CREATE VIEW IF NOT EXISTS recent_incident_logs AS
        SELECT * FROM incident_logs ORDER BY timestamp DESC
    ''')
    conn.commit()
    return conn

def run_forensic_agent():
    init_db()
    
    from kafka import KafkaConsumer
    # Create consumer subscribing to multiple topics
    consumer = KafkaConsumer(
        *INPUT_TOPICS,
        bootstrap_servers='localhost:9092',
        group_id="forensic-logging-group",
        auto_offset_reset='earliest',
        enable_auto_commit=True,
        value_deserializer=lambda x: json.loads(x.decode('utf-8')),
        api_version=(0, 11, 5) # Fixes MemberIdRequiredError
    )
    
    producer = get_producer()
    # print(f"{AGENT_NAME} listening on topics: {INPUT_TOPICS} | DB: {DB_PATH}")

    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()

        for message in consumer:
            event_data = message.value
            incoming_event = AgentEvent.from_json(event_data) if isinstance(event_data, str) else AgentEvent(**event_data)
            
            event_id = incoming_event.event_id
            source_agent = incoming_event.source_agent
            timestamp = incoming_event.timestamp
            payload = incoming_event.payload
            
            # Extract fields across different agents' schemas
            action_taken = payload.get("action_taken", payload.get("recommended_action", ""))
            # severity could be threat_level or impact depending on the agent
            severity_level = payload.get("threat_level", payload.get("impact", ""))
            decision_trace = incoming_event.reasoning
            details = json.dumps(payload)

            cursor.execute('''
                INSERT INTO incident_logs (event_id, agent_name, timestamp, action_taken, severity_level, decision_trace, details)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ''', (event_id, source_agent, timestamp, action_taken, str(severity_level), decision_trace, details))
            conn.commit()
            
            # print(f"[{AGENT_NAME}] Logged event {event_id} from {source_agent}")

            # Produce to audit-events to satisfy generic Agent pattern
            audit_event = AgentEvent(
                source_agent=AGENT_NAME,
                payload={"logged_event_id": event_id, "table": "incident_logs"},
                confidence_score=1.0,
                reasoning="Event securely stored in forensic SQLite database.",
                event_id=event_id
            )
            producer.send(OUTPUT_TOPIC, value=asdict(audit_event))
            producer.flush()

    except KeyboardInterrupt:
        print(f"Stopping {AGENT_NAME}...")
    finally:
        consumer.close()
        producer.close()
        if 'conn' in locals():
            conn.close()

if __name__ == "__main__":
    run_forensic_agent()
