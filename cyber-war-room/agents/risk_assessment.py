import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from shared.kafka_utils import get_consumer, get_producer
from shared.models import AgentEvent
from dataclasses import asdict

AGENT_NAME = "RiskAssessmentAgent"
INPUT_TOPIC = "threat-events"
OUTPUT_TOPIC = "risk-events"

# Mock asset registry database
ASSET_SENSITIVITY = {
    "10.0.0.5": 90,  # Database server
    "10.0.0.10": 50, # Web server
    "unknown": 30    # Default baseline
}

def calculate_risk_score(threat_level: int, asset_sensitivity: int) -> int:
    """
    Calculates a risk score from 0-100 based on threat level (1-10) and asset sensitivity (0-100).
    Formula: (Threat Level / 10) * Asset Sensitivity * Weighting Factor
    We'll assume a simpler calculation:
      Risk = Threat Level * 5 + Asset Sensitivity / 2
      Capped at 100.
    """
    score = (threat_level * 6) + (asset_sensitivity * 0.4)
    return min(100, int(score))

def get_recommended_response(risk_score: int) -> str:
    if risk_score >= 80:
        return "isolate_host"
    elif risk_score >= 50:
        return "block_ip"
    else:
        return "monitor"

def run_risk_agent():
    print(f"Starting {AGENT_NAME}...")
    consumer = get_consumer(INPUT_TOPIC, group_id="risk-assessment-group")
    producer = get_producer()
    print(f"{AGENT_NAME} listening on topic: {INPUT_TOPIC}")

    try:
        for message in consumer:
            event_data = message.value
            incoming_event = AgentEvent.from_json(event_data) if isinstance(event_data, str) else AgentEvent(**event_data)
            
            payload = incoming_event.payload
            threat_level = payload.get("threat_level", 1)
            target_ip = payload.get("target_ip", "unknown")
            
            sensitivity = ASSET_SENSITIVITY.get(target_ip, ASSET_SENSITIVITY["unknown"])
            
            risk_score = calculate_risk_score(threat_level, sensitivity)
            recommended_response = get_recommended_response(risk_score)
            
            print(f"[{AGENT_NAME}] Evaluated IP {target_ip} (Sensitivity {sensitivity}) against Threat Level {threat_level} -> Risk Score: {risk_score}")

            new_payload = {
                "risk_score": risk_score,
                "asset_sensitivity": sensitivity,
                "recommended_response": recommended_response,
                **payload
            }
            
            out_event = AgentEvent(
                source_agent=AGENT_NAME,
                payload=new_payload,
                confidence_score=incoming_event.confidence_score,
                reasoning=f"Calculated risk score of {risk_score} based on threat severity ({threat_level}) and asset context. Recommendation: {recommended_response}."
            )
            
            producer.send(OUTPUT_TOPIC, value=asdict(out_event))
            producer.flush()

    except KeyboardInterrupt:
        print(f"Stopping {AGENT_NAME}...")
    finally:
        consumer.close()
        producer.close()

if __name__ == "__main__":
    run_risk_agent()
