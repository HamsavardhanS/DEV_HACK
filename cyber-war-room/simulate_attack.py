import time
import uuid
import sys
import os
from datetime import datetime, timezone

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from shared.kafka_utils import get_producer

TOPIC = "network-logs"

def get_timestamp():
    return datetime.now(timezone.utc).isoformat()

def send_normal_traffic(producer):
    print("Simulating Normal Traffic...")
    # 100 normal requests
    for i in range(100):
        log = {
            "log_id": str(uuid.uuid4()),
            "timestamp": get_timestamp(),
            "action": "request",
            "ip": f"192.168.1.{i%50}",
            "endpoint": "/api/health"
        }
        producer.send(TOPIC, value=log)
        
    # Single login attempt
    login_log = {
        "log_id": str(uuid.uuid4()),
        "timestamp": get_timestamp(),
        "action": "login",
        "ip": "192.168.1.55",
        "status": "success",
        "username": "admin"
    }
    producer.send(TOPIC, value=login_log)
    producer.flush()
    print("Normal Traffic sent.")

def send_brute_force(producer):
    print("Simulating Brute Force Attack...")
    # 10 failed logins in quick succession
    target_ip = "10.0.0.88" # external malicious IP
    for i in range(10):
        log = {
            "log_id": str(uuid.uuid4()),
            "timestamp": get_timestamp(),
            "action": "login",
            "ip": target_ip,
            "status": "failed",
            "username": "admin"
        }
        producer.send(TOPIC, value=log)
        time.sleep(0.1) # small delay to keep them inside the monitoring time window
    producer.flush()
    print("Brute Force Attack sent.")

def send_ddos(producer):
    print("Simulating DDoS Attack...")
    # 2000 requests to trigger high traffic spike
    for i in range(2000):
        log = {
            "log_id": str(uuid.uuid4()),
            "timestamp": get_timestamp(),
            "action": "request",
            "ip": "203.0.113.15", # malicious source
            "endpoint": "/heavy-query"
        }
        producer.send(TOPIC, value=log)
    producer.flush()
    print("DDoS Attack sent.")

def send_malware(producer):
    print("Simulating Malware Execution...")
    log = {
        "log_id": str(uuid.uuid4()),
        "timestamp": get_timestamp(),
        "action": "process_execution",
        "ip": "10.0.0.5", # internal target
        "process_name": "/tmp/suspicious_script.sh",
        "user": "root"
    }
    producer.send(TOPIC, value=log)
    producer.flush()
    print("Malware execution sent.")

def run_simulation():
    producer = get_producer()
    print("Connected to Kafka. Beginning continuous test data simulation (every 5 minutes)...")
    
    try:
        while True:
            print(f"\n[{get_timestamp()}] --- Starting new attack simulation cycle ---")
            
            send_normal_traffic(producer)
            time.sleep(5)
            
            send_brute_force(producer)
            time.sleep(5)
            
            send_ddos(producer)
            time.sleep(5)
            
            send_malware(producer)
            
            producer.flush()
            print(f"[{get_timestamp()}] --- Cycle complete. Waiting 5 minutes until next cycle... ---")
            time.sleep(300)
            
    except KeyboardInterrupt:
        print("\nSimulation aborted by user. Waiting for producers to flush...")
        producer.flush()
        producer.close()
        print("Exiting simulator.")

if __name__ == "__main__":
    run_simulation()
