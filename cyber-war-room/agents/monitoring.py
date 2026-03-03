import os
import sys
import time
from collections import defaultdict
from datetime import datetime, timedelta

# Add parent dir to path to import shared modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from shared.kafka_utils import get_consumer, get_producer
from shared.models import AgentEvent
from dataclasses import asdict

AGENT_NAME = "MonitoringAgent"
INPUT_TOPIC = "network-logs"
OUTPUT_TOPIC = "monitoring-events"

def run_monitoring_agent():
    print(f"Starting {AGENT_NAME}...")
    consumer = get_consumer(INPUT_TOPIC, group_id="monitoring-group")
    producer = get_producer()

    # Track login attempts per user/ip: { "ip/user": [timestamps] }
    login_attempts = defaultdict(list)
    
    # Track traffic spikes: sliding window of timestamps
    traffic_history = []
    
    print(f"{AGENT_NAME} listening on topic: {INPUT_TOPIC}")

    try:
        for message in consumer:
            log_entry = message.value
            current_time = datetime.fromisoformat(log_entry.get('timestamp', datetime.utcnow().isoformat()))
            
            # --- Detection Logic ---
            
            # 1. Traffic Spike Detection
            traffic_history.append(current_time)
            # Remove timestamps older than 1 minute for traffic spike detection
            one_min_ago = current_time - timedelta(minutes=1)
            traffic_history = [t for t in traffic_history if t >= one_min_ago]
            
            if len(traffic_history) > 1000:
                print(f"[{AGENT_NAME}] High traffic spike detected! ({len(traffic_history)} requests in 1 min)")
                event = AgentEvent(
                    source_agent=AGENT_NAME,
                    payload={"anomaly_type": "high_traffic", "request_count": len(traffic_history)},
                    confidence_score=0.95,
                    reasoning=f"Detected {len(traffic_history)} requests within 1 minute, exceeding threshold of 1000."
                )
                producer.send(OUTPUT_TOPIC, value=asdict(event))
                producer.flush()
                # Clear history to avoid repeated alerts for the same spike window
                traffic_history.clear()

            # 2. Abnormal Login Attempts
            if log_entry.get('action') == 'login' and log_entry.get('status') == 'failed':
                user_ip = log_entry.get('ip', 'unknown_ip')
                login_attempts[user_ip].append(current_time)
                
                # Filter old attempts
                login_attempts[user_ip] = [t for t in login_attempts[user_ip] if t >= one_min_ago]
                
                if len(login_attempts[user_ip]) > 5:
                    print(f"[{AGENT_NAME}] Abnormal login attempts detected for IP: {user_ip}")
                    event = AgentEvent(
                        source_agent=AGENT_NAME,
                        payload={"anomaly_type": "abnormal_login", "ip": user_ip, "failed_attempts": len(login_attempts[user_ip])},
                        confidence_score=0.85,
                        reasoning=f"Detected {len(login_attempts[user_ip])} failed logins in under 1 minute for IP {user_ip}."
                    )
                    producer.send(OUTPUT_TOPIC, value=asdict(event))
                    producer.flush()
                    # Clear attempts for this IP after alerting
                    login_attempts[user_ip].clear()
                    
            # 3. Malware Execution Simulation (Generic Anomaly fallback)
            if log_entry.get('action') == 'process_execution' and 'suspicious' in str(log_entry.get('process_name', '')).lower():
                print(f"[{AGENT_NAME}] Suspicious process execution detected: {log_entry.get('process_name')}")
                event = AgentEvent(
                    source_agent=AGENT_NAME,
                    payload={"anomaly_type": "suspicious_process", "process_name": log_entry.get('process_name')},
                    confidence_score=0.90,
                    reasoning=f"Process execution log matches known suspicious patterns: {log_entry.get('process_name')}."
                )
                producer.send(OUTPUT_TOPIC, value=asdict(event))
                producer.flush()
                
    except KeyboardInterrupt:
        print(f"Stopping {AGENT_NAME}...")
    finally:
        consumer.close()
        producer.close()

if __name__ == "__main__":
    run_monitoring_agent()
