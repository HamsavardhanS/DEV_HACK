from flask import Flask, jsonify
from flask_cors import CORS
import sqlite3
import json
import os

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
        
        # Only count threats from the last 5 minutes for "Active Threats"
        cur.execute('''
            SELECT COUNT(*) FROM incident_logs 
            WHERE severity_level IN ('High', 'Critical', '80.0', '90.0', '100.0')
            AND timestamp > datetime('now', '-5 minutes')
        ''')
        active_threats = cur.fetchone()[0]
        
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
                'status': status
            })
            
        conn.close()
        conn.close()
        # Filter: Only show "Blocked" threats to remove "monitoring stage" clutter as requested
        filtered_threats = [t for t in threats if t['status'] == 'Blocked']
        return jsonify(filtered_threats)
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
                # Parse timestamp to simple HH:MM:SS for proper graph alignment
                time_str = row['timestamp'].split('T')[1].split('.')[0][:8]
                trend.append({'time': time_str, 'score': score})
            except: pass
            
        conn.close()
        return jsonify(trend)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/agents', methods=['GET'])
def get_agents():
    agents = [
        { 'name': 'Monitoring Agent', 'status': 'Detecting anomalies', 'active': True },
        { 'name': 'Threat Agent', 'status': 'Classifying attack', 'active': True },
        { 'name': 'Risk Agent', 'status': 'Calculating risk score', 'active': True },
        { 'name': 'Response Agent', 'status': 'Blocking malicious IP', 'active': True },
        { 'name': 'Forensic Agent', 'status': 'Storing logs to SQLite', 'active': True },
        { 'name': 'Learning Agent', 'status': 'Analyzing false positive rates', 'active': True },
    ]
    return jsonify(agents)

if __name__ == '__main__':
    app.run(port=5000, debug=True)
