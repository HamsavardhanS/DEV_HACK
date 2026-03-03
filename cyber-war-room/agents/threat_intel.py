import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from shared.kafka_utils import get_consumer, get_producer
from shared.models import AgentEvent
from dataclasses import asdict

AGENT_NAME = "ThreatIntelAgent"
INPUT_TOPIC = "monitoring-events"
OUTPUT_TOPIC = "threat-events"

def map_anomaly_to_threat(anomaly_type: str, payload: dict) -> tuple[str, int]:
    """
    Maps an anomaly type to a specific threat category and assigns a threat level (1-10).
    """
    if anomaly_type == "high_traffic":
        return "DDoS", 8
    elif anomaly_type == "abnormal_login":
        return "Brute Force", 7
    elif anomaly_type == "suspicious_process":
        process_name = payload.get("process_name", "")
        if "admin" in process_name.lower() or "root" in process_name.lower():
            return "Privilege Escalation", 9
        return "Malware", 8
    return "Unknown", 5

def run_threat_intel_agent():
    print(f"Starting {AGENT_NAME}...")
    consumer = get_consumer(INPUT_TOPIC, group_id="threat-intel-group")
    producer = get_producer()
    print(f"{AGENT_NAME} listening on topic: {INPUT_TOPIC}")

    try:
        for message in consumer:
            event_data = message.value
            incoming_event = AgentEvent.from_json(event_data) if isinstance(event_data, str) else AgentEvent(**event_data)
            
            payload = incoming_event.payload
            anomaly_type = payload.get("anomaly_type")
            
            target_ip = payload.get("ip") or payload.get("target_ip", "unknown")
            
            threat_type, threat_level = map_anomaly_to_threat(anomaly_type, payload)
            print(f"[{AGENT_NAME}] Mapped {anomaly_type} to threat: {threat_type} (Level {threat_level})")

            # Augment payload for the next agent
            new_payload = {
                "original_anomaly": anomaly_type,
                "threat_type": threat_type,
                "threat_level": threat_level,
                "target_ip": target_ip,
                **payload
            }
            
            out_event = AgentEvent(
                source_agent=AGENT_NAME,
                payload=new_payload,
                confidence_score=incoming_event.confidence_score * 0.95, # Slight decay in confidence
                reasoning=f"Analyzed {anomaly_type} event. Classified as {threat_type} with severity {threat_level}."
            )
            
            producer.send(OUTPUT_TOPIC, value=asdict(out_event))
            producer.flush()

    except KeyboardInterrupt:
        print(f"Stopping {AGENT_NAME}...")
    finally:
        consumer.close()
        producer.close()

if __name__ == "__main__":
    run_threat_intel_agent()
