import os
import sys
import time
from collections import defaultdict, deque
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
    consumer = get_consumer(INPUT_TOPIC, group_id="monitoring-group")
    producer = get_producer()

    # Track login attempts per IP: { "ip": deque([timestamps]) }
    login_attempts = defaultdict(lambda: deque())
    
    # Track overall traffic spikes: deque of timestamps
    traffic_history = deque()
    
    # Track suspicious IPs (e.g., rapid requests from single IP)
    ip_traffic = defaultdict(lambda: deque())
    
    
    # print(f"{AGENT_NAME} listening on topic: {INPUT_TOPIC}")

    try:
        for message in consumer:
            log_entry = message.value
            current_time = datetime.fromisoformat(log_entry.get('timestamp', datetime.utcnow().isoformat()))
            user_ip = log_entry.get('ip', 'unknown_ip')
            
            # --- Sliding Window Memory Cleanup ---
            one_min_ago = current_time - timedelta(minutes=1)
            
            while traffic_history and traffic_history[0] < one_min_ago:
                traffic_history.popleft()
                
            while login_attempts[user_ip] and login_attempts[user_ip][0] < one_min_ago:
                login_attempts[user_ip].popleft()
                
            while ip_traffic[user_ip] and ip_traffic[user_ip][0] < one_min_ago:
                ip_traffic[user_ip].popleft()
            
            # --- Detection Logic ---
            
            # Record current request
            traffic_history.append(current_time)
            ip_traffic[user_ip].append(current_time)
            
            detected_anomaly = None
            reasoning = ""
            confidence = 0.0
            
            # 1. Traffic Spike Detection (>1000 requests per minute)
            if len(traffic_history) > 1000:
                detected_anomaly = "high_traffic"
                confidence = 0.95
                reasoning = f"Global traffic spike detected: {len(traffic_history)} requests in 1 minute."
                traffic_history.clear() # Reset to avoid spamming
                
            # 2. Suspicious IP / Scanning Behavior (>100 requests per minute from single IP)
            elif len(ip_traffic[user_ip]) > 100:
                detected_anomaly = "suspicious_ip_pattern"
                confidence = 0.90
                reasoning = f"Suspicious IP pattern detected: {len(ip_traffic[user_ip])} requests in 1 minute from IP {user_ip}."
                ip_traffic[user_ip].clear() # Reset to avoid spamming
                
            # 3. Abnormal Login Attempts (>5 failed logins per minute)
            elif log_entry.get('action') == 'login' and log_entry.get('status') == 'failed':
                login_attempts[user_ip].append(current_time)
                if len(login_attempts[user_ip]) > 5:
                    detected_anomaly = "brute_force_login"
                    confidence = 0.85
                    reasoning = f"Brute force detected: {len(login_attempts[user_ip])} failed logins in 1 minute from IP {user_ip}."
                    login_attempts[user_ip].clear() # Reset to avoid spamming
                    
            # 4. Malware Execution Simulation (Generic Anomaly fallback)
            elif log_entry.get('action') == 'process_execution' and 'suspicious' in str(log_entry.get('process_name', '')).lower():
                detected_anomaly = "suspicious_process"
                confidence = 0.90
                reasoning = f"Process execution log matches known suspicious patterns: {log_entry.get('process_name')}."
            
            if detected_anomaly:
                print(f"[{AGENT_NAME}] Anomaly detected: {detected_anomaly} on IP {user_ip}")
                event = AgentEvent(
                    source_agent=AGENT_NAME,
                    payload={
                        "ip": user_ip,
                        "anomaly_type": detected_anomaly,
                        "traffic_volume": len(traffic_history),
                        "login_attempts": len(login_attempts[user_ip])
                    },
                    confidence_score=confidence,
                    reasoning=reasoning
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
