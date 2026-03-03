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
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS forensic_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            event_id TEXT,
            agent_name TEXT,
            timestamp TEXT,
            details TEXT
        )
    ''')
    cursor.execute('''
        CREATE VIEW IF NOT EXISTS recent_forensic_logs AS
        SELECT * FROM forensic_logs ORDER BY timestamp DESC
    ''')
    conn.commit()
    return conn

def run_forensic_agent():
    print(f"Starting {AGENT_NAME}...")
    init_db()
    
    from kafka import KafkaConsumer
    # Create consumer subscribing to multiple topics
    consumer = KafkaConsumer(
        *INPUT_TOPICS,
        bootstrap_servers='localhost:9092',
        group_id="forensic-logging-group",
        auto_offset_reset='earliest',
        enable_auto_commit=True,
        value_deserializer=lambda x: json.loads(x.decode('utf-8'))
    )
    
    producer = get_producer()
    print(f"{AGENT_NAME} listening on topics: {INPUT_TOPICS} | DB: {DB_PATH}")

    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()

        for message in consumer:
            event_data = message.value
            incoming_event = AgentEvent.from_json(event_data) if isinstance(event_data, str) else AgentEvent(**event_data)
            
            event_id = incoming_event.event_id
            source_agent = incoming_event.source_agent
            timestamp = incoming_event.timestamp
            details = json.dumps(incoming_event.payload)

            cursor.execute('''
                INSERT INTO forensic_logs (event_id, agent_name, timestamp, details)
                VALUES (?, ?, ?, ?)
            ''', (event_id, source_agent, timestamp, details))
            conn.commit()
            
            print(f"[{AGENT_NAME}] Logged event {event_id} from {source_agent}")

            # Produce to audit-events to satisfy generic Agent pattern
            audit_event = AgentEvent(
                source_agent=AGENT_NAME,
                payload={"logged_event_id": event_id, "topic_source": message.topic},
                confidence_score=1.0,
                reasoning="Event securely stored in forensic SQLite database."
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
