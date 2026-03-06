import os
import sys
import random

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from shared.kafka_utils import get_consumer, get_producer
from shared.models import AgentEvent
from dataclasses import asdict

AGENT_NAME = "RiskAssessmentAgent"
INPUT_TOPIC = "threat-events"
OUTPUT_TOPIC = "risk-events"

# Mock asset registry database (0-100 sensitivity)
ASSET_SENSITIVITY = {
    "10.0.0.5": 90,  # Database server
    "10.0.0.10": 50, # Web server
    "unknown": 30    # Default baseline
}

THREAT_WEIGHTS = {
    "Low": 10,
    "Medium": 30,
    "High": 50,
    "Critical": 70
}

def calculate_risk_score(threat_level: str, asset_sensitivity: int, payload: dict) -> int:
    """
    Calculates a risk score from 0-100 based on:
    risk_score = threat_weight + frequency_weight + asset_weight
    
    threat_weight: derived from string threat_level (max 70)
    asset_weight: scaled sensitivity (max 20)
    frequency_weight: based on traffic or login counts (max 10)
    """
    threat_weight = THREAT_WEIGHTS.get(threat_level, 10)
    
    # Asset weight (0-20 scale)
    asset_weight = int(asset_sensitivity * 0.2)
    
    # Frequency weight (0-10 scale)
    traffic_volume = payload.get("traffic_volume", 0)
    login_attempts = payload.get("login_attempts", 0)
    
    frequency_weight = 0
    if traffic_volume > 2000:
        frequency_weight = 10
    elif traffic_volume > 1000:
        frequency_weight = 5
        
    if login_attempts > 20:
        frequency_weight = max(frequency_weight, 10)
    elif login_attempts > 5:
        frequency_weight = max(frequency_weight, 5)

    score = threat_weight + frequency_weight + asset_weight
    
    # Introduce dynamic variance (+/- 5 points)
    variance = random.randint(-5, 5)
    score += variance
    
    return max(0, min(100, int(score)))

def get_impact_level(risk_score: int) -> str:
    if risk_score >= 80:
        return "Critical"
    elif risk_score >= 50:
        return "High"
    elif risk_score >= 30:
        return "Medium"
    return "Low"

def get_recommended_action(risk_score: int) -> str:
    if risk_score >= 80:
        return "isolate_host"
    elif risk_score >= 50:
        return "block_ip"
    else:
        return "monitor"

def run_risk_agent():
    consumer = get_consumer(INPUT_TOPIC, group_id="risk-assessment-group")
    producer = get_producer()
    # print(f"{AGENT_NAME} listening on topic: {INPUT_TOPIC}")

    try:
        for message in consumer:
            event_data = message.value
            incoming_event = AgentEvent.from_json(event_data) if isinstance(event_data, str) else AgentEvent(**event_data)
            
            payload = incoming_event.payload
            threat_level = payload.get("threat_level", "Low")
            target_ip = payload.get("target_ip", "unknown")
            
            sensitivity = ASSET_SENSITIVITY.get(target_ip, ASSET_SENSITIVITY["unknown"])
            
            risk_score = calculate_risk_score(threat_level, sensitivity, payload)
            impact = get_impact_level(risk_score)
            recommended_action = get_recommended_action(risk_score)
            
            print(f"[{AGENT_NAME}] Evaluated IP {target_ip} risk Score: {risk_score} (Impact: {impact})")

            # Create standardized payload
            new_payload = {
                "risk_score": risk_score,
                "impact": impact,
                "recommended_action": recommended_action,
                "asset_sensitivity": sensitivity,
                **payload
            }
            
            out_event = AgentEvent(
                source_agent=AGENT_NAME,
                payload=new_payload,
                confidence_score=incoming_event.confidence_score,
                reasoning=f"Calculated risk score {risk_score} based on threat severity, asset sensitivity, and attack frequency. Recommended action: {recommended_action}.",
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
    run_risk_agent()
