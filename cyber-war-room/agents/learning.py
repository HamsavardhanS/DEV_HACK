import os
import sys
import sqlite3

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from shared.kafka_utils import get_consumer, get_producer
from shared.models import AgentEvent
from dataclasses import asdict

AGENT_NAME = "LearningAgent"
INPUT_TOPIC = "response-events"
OUTPUT_TOPIC = "learning-events"
DB_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "forensics.db")

def analyze_historical_data() -> dict:
    """
    Analyzes past incidents from SQLite to identify false positives, missed attacks, 
    and suggest threshold tuning.
    """
    if not os.path.exists(DB_PATH):
        return {
            "analysis_summary": "Database not found. Waiting for more data.",
            "suggested_threshold_updates": "None",
            "false_positive_rate": "0.0%"
        }
        
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # Check if table exists
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='incident_logs'")
        if not cursor.fetchone():
            return {
                "analysis_summary": "Table incident_logs not found. Waiting for Forensic Agent.",
                "suggested_threshold_updates": "None",
                "false_positive_rate": "0.0%"
            }

        # Calculate Total Interventions
        cursor.execute("SELECT COUNT(*) FROM incident_logs WHERE action_taken IN ('block_ip', 'isolate_host')")
        total_interventions = cursor.fetchone()[0] or 0
        
        # False Positives: High action but Low/Medium severity
        cursor.execute("SELECT COUNT(*) FROM incident_logs WHERE action_taken = 'isolate_host' AND severity_level IN ('Low', 'Medium')")
        false_positives = cursor.fetchone()[0] or 0
        
        # Missed Attacks / False Negatives: Critical/High severity but only monitored
        cursor.execute("SELECT COUNT(*) FROM incident_logs WHERE action_taken = 'monitor' AND severity_level IN ('High', 'Critical')")
        missed_attacks = cursor.fetchone()[0] or 0
        
        fp_rate = (false_positives / total_interventions * 100) if total_interventions > 0 else 0.0
        
        suggestions = []
        if fp_rate > 15.0:
            suggestions.append("High false positive rate detected. Increase risk score threshold for 'isolate_host' from 80 to 85.")
            
        if missed_attacks > 0:
            suggestions.append(f"Detected {missed_attacks} missed high-severity attacks. Lower risk score threshold for 'block_ip'.")
            
        if not suggestions:
            suggestions.append("Current thresholds are optimal. No tuning required.")
        
        return {
            "analysis_summary": f"Analyzed {total_interventions} past interventions. Found {false_positives} false positives and {missed_attacks} potential missed attacks.",
            "suggested_threshold_updates": " | ".join(suggestions),
            "false_positive_rate": f"{fp_rate:.1f}%"
        }
    except Exception as e:
        return {
            "analysis_summary": f"Error during analysis: {str(e)}",
            "suggested_threshold_updates": "None",
            "false_positive_rate": "0.0%"
        }
    finally:
        if 'conn' in locals():
            conn.close()

def run_learning_agent():
    print(f"Starting {AGENT_NAME}...")
    consumer = get_consumer(INPUT_TOPIC, group_id="learning-group")
    producer = get_producer()
    print(f"{AGENT_NAME} listening on topic: {INPUT_TOPIC}")

    try:
        # Counter to avoid spamming the database with queries on every single event during a high-volume attack
        event_counter = 0
        
        for message in consumer:
            event_data = message.value
            incoming_event = AgentEvent.from_json(event_data) if isinstance(event_data, str) else AgentEvent(**event_data)
            
            payload = incoming_event.payload
            event_counter += 1
            
            # Run analysis every 5 events to simulate periodic learning
            if event_counter % 5 == 0 or True: # Run on every event for testing purposes
                insights = analyze_historical_data()
                
                print(f"[{AGENT_NAME}] Generated Insights: FP Rate={insights['false_positive_rate']}")

                out_event = AgentEvent(
                    source_agent=AGENT_NAME,
                    payload=insights,
                    confidence_score=0.95,
                    reasoning="Analyzed historical incident data to generate adaptive learning recommendations."
                )
                
                producer.send(OUTPUT_TOPIC, value=asdict(out_event))
                producer.flush()

    except KeyboardInterrupt:
        print(f"Stopping {AGENT_NAME}...")
    finally:
        consumer.close()
        producer.close()

if __name__ == "__main__":
    run_learning_agent()
