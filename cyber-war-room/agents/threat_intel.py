import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from shared.kafka_utils import get_consumer, get_producer
from shared.models import AgentEvent
from dataclasses import asdict

AGENT_NAME = "ThreatIntelAgent"
INPUT_TOPIC = "monitoring-events"
OUTPUT_TOPIC = "threat-events"

def map_anomaly_to_threat(anomaly_type: str, payload: dict) -> tuple[str, str, str]:
    """
    Maps an anomaly type to a specific threat category and assigns a threat level string.
    Returns: (attack_type, threat_level, reasoning)
    """
    if anomaly_type == "high_traffic":
        return "DDoS", "High", "High volume of requests indicates a potential DDoS attack."
    elif anomaly_type == "brute_force_login":
        return "Brute Force", "Medium", "Multiple failed login attempts detected in a short time frame."
    elif anomaly_type == "suspicious_ip_pattern":
        return "Suspicious Activity", "Low", "IP is making rapid requests, typical of scanning or scraping."
    elif anomaly_type == "suspicious_process":
        process_name = payload.get("process_name", "")
        if "admin" in process_name.lower() or "root" in process_name.lower():
            return "Privilege Escalation", "Critical", "Suspicious process executed trying to elevate privileges."
        return "Malware", "High", "Suspicious process execution indicates potential malware activity."
    return "Unknown", "Low", "Unrecognized anomaly detected."

def run_threat_intel_agent():
    consumer = get_consumer(INPUT_TOPIC, group_id="threat-intel-group")
    producer = get_producer()
    # print(f"{AGENT_NAME} listening on topic: {INPUT_TOPIC}")

    try:
        for message in consumer:
            event_data = message.value
            incoming_event = AgentEvent.from_json(event_data) if isinstance(event_data, str) else AgentEvent(**event_data)
            
            payload = incoming_event.payload
            anomaly_type = payload.get("anomaly_type")
            target_ip = payload.get("ip") or payload.get("target_ip", "unknown")
            
            attack_type, threat_level, threat_reasoning = map_anomaly_to_threat(anomaly_type, payload)
            
            # Combine reasoning from Monitoring Agent with Threat Intel reasoning
            combined_reasoning = f"{incoming_event.reasoning} | {threat_reasoning}"
            
            print(f"[{AGENT_NAME}] Mapped {anomaly_type} to threat: {attack_type} (Level: {threat_level})")

            # Formulate new payload with standard fields
            new_payload = {
                "attack_type": attack_type,
                "threat_level": threat_level,
                "reasoning": combined_reasoning,
                "target_ip": target_ip, # Need to pass forward to risk assessment
                "original_anomaly": anomaly_type, # Pass forward for forensic logs
                **payload
            }
            
            out_event = AgentEvent(
                source_agent=AGENT_NAME,
                payload=new_payload,
                confidence_score=incoming_event.confidence_score * 0.95, # Slight decay in confidence
                reasoning=combined_reasoning,
                event_id=incoming_event.event_id
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
