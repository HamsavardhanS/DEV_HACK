# Cyber War Room Agents Overview

The Agentic Cybersecurity War Room Prototype is composed of six autonomous agents communicating via an event-driven architecture using Apache Kafka. Below is an explanation of each agent's role and functionality within the system:

## 1. Monitoring Agent (`monitoring.py`)
- **Role**: Initial Detection & Observation
- **Function**: Acts as the system's eyes and ears by parsing network logs or system telemetry. It identifies anomalies such as login failures, traffic spikes, or unusual resource access patterns and publishes these as `monitoring-events` to Kafka.

## 2. Threat Intelligence Agent (`threat_intel.py`)
- **Role**: Classification & Contextualization
- **Function**: Consumes `monitoring-events` and enriches the raw anomalies with threat intelligence. It maps anomalies to specific attack vectors (e.g., classifying a high traffic spike as a DDoS attack, or multiple failed logins as a Brute Force attempt). It then publishes these enriched `threat-events`.

## 3. Risk Assessment Agent (`risk_assessment.py`)
- **Role**: Evaluation & Prioritization 
- **Function**: Consumes `threat-events` and evaluates the significance of the threat. It calculates a numerical `risk_score` (0-100) based on factors like target sensitivity and attack severity. High-risk scores indicate critical threats, while low-risk scores may simply register as warnings. The results are published as `risk-events`.

## 4. Response Agent (`response.py`)
- **Role**: Action & Mitigation
- **Function**: Consumes `risk-events` and determines the appropriate countermeasure based on the calculated risk score. It might decide to isolate a host, block an IP address, or simply continue monitoring if the risk is low. The taken action is published as `response-events`.

## 5. Forensic Logging Agent (`forensic.py`)
- **Role**: Audit & Record Keeping
- **Function**: Consumes events from all stages (`monitoring-events`, `threat-events`, `risk-events`, `response-events`) and securely stores them into a centralized SQLite database (`forensics.db`). This provides a complete chronological audit trail of all attacks and system responses for retrospective analysis.

## 6. Learning Agent (`learning.py`)
- **Role**: Optimization & Tuning
- **Function**: Consumes `response-events` (and implicitly monitors the full pipeline) to review incidents. It is responsible for detecting false positives and suggesting updates to detection thresholds or risk score weights, thereby allowing the system to adapt and improve its accuracy over time.
