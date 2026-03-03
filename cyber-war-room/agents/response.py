import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from shared.kafka_utils import get_consumer, get_producer
from shared.models import AgentEvent
from dataclasses import asdict

AGENT_NAME = "ResponseAgent"
INPUT_TOPIC = "risk-events"
OUTPUT_TOPIC = "response-events"

def run_response_agent():
    print(f"Starting {AGENT_NAME}...")
    consumer = get_consumer(INPUT_TOPIC, group_id="response-group")
    producer = get_producer()
    print(f"{AGENT_NAME} listening on topic: {INPUT_TOPIC}")

    try:
        for message in consumer:
            event_data = message.value
            incoming_event = AgentEvent.from_json(event_data) if isinstance(event_data, str) else AgentEvent(**event_data)
            
            payload = incoming_event.payload
            risk_score = payload.get("risk_score", 0)
            target_ip = payload.get("target_ip", "unknown")
            
            # Execute Response Logic based on Risk Score
            if risk_score >= 80:
                action = "isolate_host"
                justification = f"Risk score {risk_score} >= 80. Immediate isolation required for {target_ip}."
            elif 50 <= risk_score < 80:
                action = "block_ip"
                justification = f"Risk score {risk_score} is between 50 and 79. Blocking IP {target_ip} at the firewall."
            else:
                action = "monitor"
                justification = f"Risk score {risk_score} is below 50. Continuing to monitor {target_ip}."

            print(f"[{AGENT_NAME}] Taking Action: {action.upper()} on {target_ip} -> {justification}")

            new_payload = {
                "action_taken": action,
                "justification": justification,
                **payload
            }
            
            out_event = AgentEvent(
                source_agent=AGENT_NAME,
                payload=new_payload,
                confidence_score=incoming_event.confidence_score,
                reasoning=f"Action '{action}' selected based on risk threshold rules."
            )
            
            producer.send(OUTPUT_TOPIC, value=asdict(out_event))
            producer.flush()

    except KeyboardInterrupt:
        print(f"Stopping {AGENT_NAME}...")
    finally:
        consumer.close()
        producer.close()

if __name__ == "__main__":
    run_response_agent()
