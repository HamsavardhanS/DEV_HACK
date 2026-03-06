from flask import Flask, jsonify
from flask_cors import CORS
import sqlite3
import json
import os
import psutil

app = Flask(__name__)
CORS(app)

DB_PATH = 'forensics.db'

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

@app.route('/api/stats', methods=['GET'])
def get_stats():
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        cur.execute("SELECT COUNT(*) FROM incident_logs WHERE agent_name='MonitoringAgent'")
        total_events = cur.fetchone()[0]
        
        cur.execute("SELECT COUNT(*) FROM incident_logs WHERE action_taken='block_ip'")
        blocked_ips = cur.fetchone()[0]
        
        cur.execute('''
            SELECT event_id, MAX(timestamp) as time
            FROM incident_logs
            GROUP BY event_id
            ORDER BY time DESC LIMIT 100
        ''')
        event_ids = [row['event_id'] for row in cur.fetchall()]
        
        active_threats = 0
        for eid in event_ids:
            cur.execute("SELECT agent_name, action_taken, details FROM incident_logs WHERE event_id=?", (eid,))
            event_logs = cur.fetchall()
            
            risk_score = 0
            is_blocked = False
            
            for log in event_logs:
                if log['agent_name'] == 'RiskAssessmentAgent':
                    try:
                        details = json.loads(log['details'])
                        risk_score = details.get('risk_score', 0)
                    except: pass
                elif log['agent_name'] == 'ResponseAgent':
                    action = log['action_taken']
                    if 'block' in action.lower() or 'isolate' in action.lower():
                        is_blocked = True
            
            if risk_score >= 50 and not is_blocked:
                active_threats += 1
        
        system_status = 'Healthy' if active_threats == 0 else 'Under Attack'
        
        conn.close()
        return jsonify({
            'totalEvents': total_events,
            'activeThreats': active_threats,
            'blockedIps': blocked_ips,
            'systemStatus': system_status
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/clear', methods=['POST', 'DELETE'])
def clear_logs():
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("DELETE FROM incident_logs")
        conn.commit()
        conn.close()
        return jsonify({'status': 'success', 'message': 'All incident logs cleared.'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/threats', methods=['GET'])
def get_threats():
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        cur.execute('''
            SELECT event_id, MAX(timestamp) as time
            FROM incident_logs
            GROUP BY event_id
            ORDER BY time DESC LIMIT 100
        ''')
        event_ids = [row['event_id'] for row in cur.fetchall()]
        
        threats = []
        for eid in event_ids:
            cur.execute("SELECT * FROM incident_logs WHERE event_id=? ORDER BY timestamp ASC", (eid,))
            event_logs = cur.fetchall()
            
            threat_type = 'Suspicious Activity'
            risk_score = 0
            action = 'monitor'
            status = 'Monitoring'
            
            for log in event_logs:
                if log['agent_name'] == 'ThreatIntelAgent':
                    try:
                        details = json.loads(log['details'])
                        threat_type = details.get('attack_type', 'Suspicious Activity')
                    except: pass
                elif log['agent_name'] == 'RiskAssessmentAgent':
                    try:
                        details = json.loads(log['details'])
                        risk_score = details.get('risk_score', 0)
                    except: pass
                elif log['agent_name'] == 'ResponseAgent':
                    action = log['action_taken']
                    if 'block' in action.lower() or 'isolate' in action.lower():
                        status = 'Blocked'
                    else:
                        status = 'Monitored'
                        
            threats.append({
                'id': eid,
                'eventId': eid[:8] + '...',
                'time': event_logs[0]['timestamp'],
                'type': threat_type,
                'riskScore': risk_score,
                'action': action,
                'status': status,
                # Frontend relies on riskScore >= 50 and status != 'Blocked'
            })
            
        conn.close()
        conn.close()
        # Return all threats (both Blocked and Monitored) as requested
        return jsonify(threats)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/logs', methods=['GET'])
def get_logs():
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute('''
            SELECT id, timestamp, agent_name, event_id, action_taken, details 
            FROM incident_logs 
            WHERE agent_name != 'MonitoringAgent'
            ORDER BY timestamp DESC LIMIT 50
        ''')
        rows = cur.fetchall()
        logs = []
        for row in rows:
            try:
                details_json = json.loads(row['details'])
            except:
                details_json = row['details']
                
            logs.append({
                'id': row['id'],
                'timestamp': row['timestamp'],
                'agent_name': row['agent_name'],
                'event_id': row['event_id'][:8] + '...',
                'action_taken': row['action_taken'],
                'details': details_json
            })
        conn.close()
        return jsonify(logs)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/distribution', methods=['GET'])
def get_distribution():
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        # Aggregate across all classifications in history
        # We need to map Monitoring anomalies that haven't been classified too?
        # Let's just use ThreatIntel's classifications for the chart.
        cur.execute('''
            SELECT details FROM incident_logs 
            WHERE agent_name='ThreatIntelAgent'
        ''')
        rows = cur.fetchall()
        
        dist = { 'DDoS': 0, 'Brute Force': 0, 'Malware': 0, 'Suspicious Activity': 0, 'Privilege Escalation': 0 }
        
        for row in rows:
            try:
                details = json.loads(row['details'])
                atype = details.get('attack_type', 'Suspicious Activity')
                if atype in dist:
                    dist[atype] += 1
                else:
                    dist['Suspicious Activity'] += 1
            except: pass
            
        conn.close()
        return jsonify(dist)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/risk-trend', methods=['GET'])
def get_risk_trend():
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        # Get risk scores over time (grouped by minute for a smoother line)
        cur.execute('''
            SELECT strftime('%H:%M', timestamp) as minute, 
                   AVG(CAST(details AS TEXT) LIKE '%risk_score%') as dummy,
                   details
            FROM incident_logs 
            WHERE agent_name='RiskAssessmentAgent'
            ORDER BY timestamp ASC
        ''')
        # This is a bit complex for a simple SQLite query without JSON extensions
        # Let's just fetch recent risk scores and and their timestamps
        cur.execute('''
            SELECT timestamp, details FROM incident_logs 
            WHERE agent_name='RiskAssessmentAgent'
            ORDER BY timestamp DESC LIMIT 50
        ''')
        rows = cur.fetchall()
        
        trend = []
        for row in reversed(rows):
            try:
                details = json.loads(row['details'])
                score = details.get('risk_score', 0)
                # Send full timestamp to allow frontend timezone conversion
                trend.append({'time': row['timestamp'], 'score': score})
            except: pass
            
        conn.close()
        return jsonify(trend)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/system-health', methods=['GET'])
def get_system_health():
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        cur.execute("SELECT COUNT(*) FROM incident_logs WHERE timestamp > datetime('now', '-1 minute')")
        events_last_min = cur.fetchone()[0]
        
        cur.execute("SELECT COUNT(*) FROM incident_logs WHERE severity_level IN ('High', 'Critical', '80.0', '90.0', '100.0') AND timestamp > datetime('now', '-5 minutes')")
        active_threats = cur.fetchone()[0]
        
        # Use real system metrics
        cpu_usage = psutil.cpu_percent(interval=None)
        memory_usage = psutil.virtual_memory().percent
        
        # Keep kafka_queue_size as a basic estimation based on recent events (or zero if no easy way to get real kafka lag)
        kafka_queue_size = int((events_last_min * 1.5))
        
        system_stability = 100 if active_threats == 0 else max(10, 100 - active_threats * 10)
        
        conn.close()
        return jsonify({
            'cpu_usage': cpu_usage,
            'memory_usage': memory_usage,
            'kafka_queue_size': kafka_queue_size,
            'event_processing_rate': events_last_min,
            'active_threats': active_threats,
            'system_stability': system_stability
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/blocked-ips', methods=['GET'])
def get_blocked_ips():
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("SELECT timestamp, details FROM incident_logs WHERE action_taken='block_ip' ORDER BY timestamp DESC")
        rows = cur.fetchall()
        ips = []
        for row in rows:
            try:
                details = json.loads(row['details'])
                ip = details.get('source_ip') or details.get('ip') or 'Unknown'
                # Ensure we only pick unique IPs or return the list with times
                ips.append({'time': row['timestamp'], 'ip': ip})
            except: pass
        conn.close()
        return jsonify(ips)
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/security-score', methods=['GET'])
def get_security_score():
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        # Security score is 100 minus the average risk score of the last 10 minutes
        cur.execute('''
            SELECT details FROM incident_logs 
            WHERE agent_name='RiskAssessmentAgent' 
            AND timestamp > datetime('now', '-10 minutes')
        ''')
        rows = cur.fetchall()
        
        total_risk = 0
        count = 0
        for row in rows:
            try:
                details = json.loads(row['details'])
                total_risk += details.get('risk_score', 0)
                count += 1
            except: pass
            
        avg_risk = (total_risk / count) if count > 0 else 0
        
        # Base score 100, drops by average active risk.
        security_score = max(0, min(100, int(100 - avg_risk)))
        
        conn.close()
        return jsonify({'security_score': security_score})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/events', methods=['GET'])
def get_raw_events():
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        # Fetch the 20 most recent logs for the scrolling stream
        cur.execute('''
            SELECT timestamp, agent_name, action_taken, details 
            FROM incident_logs 
            ORDER BY timestamp DESC LIMIT 20
        ''')
        rows = cur.fetchall()
        
        events = []
        for row in reversed(rows): # Reverse so oldest is first in the stream box
            time_str = row['timestamp'].split('T')[1].split('.')[0] # HH:MM:SS
            agent = row['agent_name']
            
            # Formulate a brief summary string
            msg = ""
            if agent == "MonitoringAgent":
                msg = "detected network anomaly"
            elif agent == "ThreatIntelAgent":
                try:
                    d = json.loads(row['details'])
                    msg = f"classified {d.get('attack_type', 'Suspicious Activity')}"
                except: msg = "classified threat"
            elif agent == "RiskAssessmentAgent":
                try:
                    d = json.loads(row['details'])
                    msg = f"assigned risk score {d.get('risk_score', 0)}"
                except: msg = "assigned risk score"
            elif agent == "ResponseAgent":
                msg = f"executed action: {row['action_taken']}"
            else:
                msg = "processed event payload"
                
            stream_str = f"[{time_str}] {agent} {msg}"
            events.append(stream_str)
            
        conn.close()
        return jsonify(events)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/agents', methods=['GET'])
def get_agents():
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        agent_names = [
            'MonitoringAgent',
            'ThreatIntelAgent',
            'RiskAssessmentAgent',
            'ResponseAgent',
            'ForensicAgent',
            'LearningAgent'
        ]
        
        agents = []
        for name in agent_names:
            # Check for activity in the last hour
            cur.execute("SELECT MAX(timestamp) FROM incident_logs WHERE agent_name=?", (name,))
            last_activity = cur.fetchone()[0]
            
            is_active = False
            status = "Waiting for events..."
            
            if last_activity:
                # Basic check: if active in last hour, mark as active
                # In a real system we'd check if the process is actually running
                is_active = True
                status = f"Last active: {last_activity.split('T')[1].split('.')[0]}"
            
            # Map back to human readable names for the frontend
            display_name = name.replace('Agent', ' Agent')
            if display_name == 'ThreatIntel Agent': display_name = 'Threat Agent'
            elif display_name == 'RiskAssessment Agent': display_name = 'Risk Agent'

            agents.append({
                'name': display_name,
                'status': status,
                'active': is_active
            })
            
        conn.close()
        return jsonify(agents)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/ai-analysis', methods=['GET'])
def get_ai_analysis():
    """Returns the latest AI incident analyses from the LLM SOC Analyst Agent."""
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        # Check if the table exists (it's created by the LLM agent)
        cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='ai_incident_analysis'")
        if not cur.fetchone():
            conn.close()
            return jsonify([])
        
        cur.execute('''
            SELECT id, event_id, timestamp, attack_type, risk_score, 
                   ai_analysis, recommendations, severity, source_ip
            FROM ai_incident_analysis 
            ORDER BY timestamp DESC LIMIT 50
        ''')
        rows = cur.fetchall()
        
        analyses = []
        for row in rows:
            # Parse recommendations from JSON string
            try:
                recs = json.loads(row['recommendations']) if row['recommendations'] else []
            except (json.JSONDecodeError, TypeError):
                recs = []
            
            analyses.append({
                'id': row['id'],
                'eventId': row['event_id'],
                'timestamp': row['timestamp'],
                'attackType': row['attack_type'],
                'riskScore': row['risk_score'],
                'aiAnalysis': row['ai_analysis'],
                'recommendations': recs,
                'severity': row['severity'],
                'sourceIp': row['source_ip']
            })
        
        conn.close()
        return jsonify(analyses)
    except Exception as e:
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    app.run(port=5000, debug=True)
