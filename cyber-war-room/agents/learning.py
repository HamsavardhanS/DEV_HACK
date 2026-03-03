import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from shared.kafka_utils import get_consumer, get_producer
from shared.models import AgentEvent
from dataclasses import asdict

AGENT_NAME = "LearningAgent"
INPUT_TOPIC = "response-events"
OUTPUT_TOPIC = "learning-events"

def analyze_incident(payload: dict) -> dict:
    """
    Analyzes an incident to detect potential false positives and suggest threshold updates.
    """
    insight = {}
    action_taken = payload.get("action_taken")
    threat_level = payload.get("threat_level", 0)
    asset_sensitivity = payload.get("asset_sensitivity", 0)
    risk_score = payload.get("risk_score", 0)
    
    # Simple logic for detecting false positives
    # e.g., if a high sensitivity asset gets isolated for a low threat level
    if action_taken == "isolate_host" and threat_level <= 5:
        insight["false_positive_detected"] = True
        insight["suggested_update"] = "Increase the threat level required to isolate high-sensitivity assets to prevent business disruption."
        
    elif action_taken == "monitor" and threat_level >= 8 and asset_sensitivity < 50:
        insight["false_negative_warning"] = True
        insight["suggested_update"] = "Lower the asset sensitivity threshold for blocking IPs for Level-8+ threats."
    else:
        insight["status"] = "incident_analyzed_no_changes_needed"
        
    return insight

def run_learning_agent():
    print(f"Starting {AGENT_NAME}...")
    consumer = get_consumer(INPUT_TOPIC, group_id="learning-group")
    producer = get_producer()
    print(f"{AGENT_NAME} listening on topic: {INPUT_TOPIC}")

    try:
        for message in consumer:
            event_data = message.value
            incoming_event = AgentEvent.from_json(event_data) if isinstance(event_data, str) else AgentEvent(**event_data)
            
            payload = incoming_event.payload
            
            insights = analyze_incident(payload)
            
            if insights.get("false_positive_detected") or insights.get("false_negative_warning"):
                print(f"[{AGENT_NAME}] Insight Generated: {insights.get('suggested_update')}")
            else:
                print(f"[{AGENT_NAME}] Reviewed incident {incoming_event.event_id}. No threshold changes recommended.")

            new_payload = {
                "insights": insights,
                "reviewed_event_id": incoming_event.event_id,
                **payload
            }
            
            out_event = AgentEvent(
                source_agent=AGENT_NAME,
                payload=new_payload,
                confidence_score=0.90,
                reasoning="Completed incident review to adjust rules and thresholds dynamically."
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
