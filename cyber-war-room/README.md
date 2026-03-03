# Agentic Cybersecurity War Room Prototype

An event-driven architecture that demonstrates how multiple autonomous AI/logic agents can communicate via Apache Kafka to monitor, assess, and respond to cybersecurity threats in real-time.

## Architecture & Data Flow

```text
network-logs / system-logs
        ↓
monitoring-events
        ↓
threat-events
        ↓
risk-events
        ↓
response-events  ---> learning-events
        ↓
forensic database (audit-events)
```

## Folder Structure

```
cyber-war-room/
├── shared/
│   ├── __init__.py
│   ├── models.py         # Defines basic AgentEvent data structure
│   └── kafka_utils.py    # Kafka consumer/producer helper functions
├── agents/
│   ├── __init__.py
│   ├── monitoring.py     # Detects login anomalies & traffic spikes
│   ├── threat_intel.py   # Maps anomalies to DDoS, Brute Force, etc.
│   ├── risk_assessment.py# Calculates risk_score (0-100)
│   ├── response.py       # Decides actions (isolate_host, block_ip, monitor)
│   ├── forensic.py       # Stores all events in SQLite database
│   └── learning.py       # Detects false positives and suggests updates
├── simulate_attack.py    # Injects test scenarios (Normal, Brute Force, DDoS, Malware)
├── forensics.db          # (Generated) SQLite database of audit logs
├── requirements.txt      # Python dependencies
└── README.md             # This file
```

## Setup Instructions

### 1. Install Apache Kafka

You need Apache Kafka and Zookeeper running locally.

**Windows Setup (using WSL or Native):**
1. Download Kafka from [kafka.apache.org/downloads](https://kafka.apache.org/downloads).
2. Extract the archive (e.g., `C:\kafka`).
3. Start Zookeeper (in one terminal):
   ```bash
   .\bin\windows\zookeeper-server-start.bat .\config\zookeeper.properties
   ```
4. Start Kafka Server (in another terminal):
   ```bash
   .\bin\windows\kafka-server-start.bat .\config\server.properties
   ```

### 2. Install Python Dependencies

Open a terminal in the `cyber-war-room` folder and install requirements:

```bash
pip install -r requirements.txt
```

*(Note: `kafka-python` is used to interact with Kafka.)*

## How to Run

To see the system working end-to-end, you should run each agent in its own terminal window.

**Terminals 1 to 6 (Run Agents):**
```bash
python agents/monitoring.py
# (Next terminal)
python agents/threat_intel.py
# (Next terminal)
python agents/risk_assessment.py
# (Next terminal)
python agents/response.py
# (Next terminal)
python agents/forensic.py
# (Next terminal)
python agents/learning.py
```

**Terminal 7 (Run Simulation):**
```bash
python simulate_attack.py
```

## Expected Sample Output

When you run `simulate_attack.py`, you will see lines like this across your agent terminals:

**monitoring.py:** 
`[MonitoringAgent] High traffic spike detected! (2000 requests in 1 min)`

**threat_intel.py:**
`[ThreatIntelAgent] Mapped high_traffic to threat: DDoS (Level 8)`

**risk_assessment.py:**
`[RiskAssessmentAgent] Evaluated IP 203.0.113.15 (Sensitivity 30) against Threat Level 8 -> Risk Score: 60`

**response.py:**
`[ResponseAgent] Taking Action: BLOCK_IP on 203.0.113.15 -> Risk score 60 is between 50 and 79. Blocking IP 203.0.113.15 at the firewall.`

**learning.py:**
`[LearningAgent] Reviewed incident <uuid>. No threshold changes recommended.`

**forensic.py:**
`[ForensicLoggingAgent] Logged event <uuid> from MonitoringAgent`
`[ForensicLoggingAgent] Logged event <uuid> from ThreatIntelAgent`

## Sample SQLite DB Schema (`forensics.db`)

The Forensic Logging Agent automatically creates a table named `forensic_logs` and a view named `recent_forensic_logs`:

```sql
CREATE TABLE IF NOT EXISTS forensic_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id TEXT,
    agent_name TEXT,
    timestamp TEXT,
    details TEXT  -- JSON string of the payload
)

CREATE VIEW IF NOT EXISTS recent_forensic_logs AS 
SELECT * FROM forensic_logs ORDER BY timestamp DESC
```

You can view the most recent logs (with today's attacks at the top) using the SQLite CLI:
```bash
sqlite3 forensics.db
sqlite> SELECT agent_name, timestamp FROM recent_forensic_logs LIMIT 5;
```
