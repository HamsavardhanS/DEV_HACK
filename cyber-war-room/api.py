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

def ensure_geo_table():
    """Create geo_cache table if it doesn't exist."""
    conn = sqlite3.connect(DB_PATH)
    conn.execute('''
        CREATE TABLE IF NOT EXISTS geo_cache (
            ip TEXT PRIMARY KEY,
            country TEXT,
            country_code TEXT,
            city TEXT,
            lat REAL,
            lon REAL,
            looked_up_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    conn.commit()
    conn.close()

# Ensure geo table exists on startup
ensure_geo_table()


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
        unblocked_threats = 0
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
            
            if risk_score >= 50:
                active_threats += 1  # Count ALL high-risk (matches modal filter)
                if not is_blocked:
                    unblocked_threats += 1
        
        # System is 'Under Attack' if any unblocked high-risk threats exist,
        # 'Mitigated' if all high-risk threats are blocked, 'Healthy' if none
        if unblocked_threats > 0:
            system_status = 'Under Attack'
        elif active_threats > 0:
            system_status = 'Mitigated'
        else:
            system_status = 'Healthy'
        
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
        # Return all threats (both Blocked and Monitored) as requested
        return jsonify(threats)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/heatmap', methods=['GET'])
def get_heatmap():
    """Return threat counts per type per minute for last 10 minutes."""
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        threat_types = ['DDoS', 'Brute Force', 'Malware', 'Privilege Escalation', 'Suspicious Activity']
        
        # Fetch last 1000 ThreatIntel rows — filter in Python to avoid SQLite timezone issues
        cur.execute('''
            SELECT timestamp, details FROM incident_logs
            WHERE agent_name='ThreatIntelAgent'
            ORDER BY timestamp DESC LIMIT 1000
        ''')
        rows = cur.fetchall()
        conn.close()
        
        from datetime import datetime, timedelta, timezone
        import re
        
        now_utc = datetime.now(timezone.utc)
        now_local = datetime.now()
        window_start_utc = now_utc - timedelta(minutes=10)
        
        # Build 10 1-minute buckets in LOCAL time for display
        buckets = {}
        bucket_order = []
        for i in range(9, -1, -1):
            t_local = now_local - timedelta(minutes=i)
            key = t_local.strftime('%H:%M')
            buckets[key] = {typ: 0 for typ in threat_types}
            bucket_order.append(key)
        
        utc_offset = timedelta(hours=5, minutes=30)  # IST = UTC+5:30 (detected from system)
        
        for row in rows:
            ts_str = row['timestamp']
            try:
                # Parse ISO 8601 with timezone like '2026-03-06T09:12:20.933400+00:00'
                # Remove timezone info and microseconds for simple parsing
                ts_clean = re.sub(r'[+\-]\d{2}:\d{2}$', '', ts_str).replace('T', ' ').split('.')[0].strip()
                ts_utc = datetime.strptime(ts_clean, '%Y-%m-%d %H:%M:%S').replace(tzinfo=timezone.utc)
                
                # Only include events within the last 10 minutes (UTC)
                if ts_utc < window_start_utc:
                    continue
                
                # Convert to local time for bucketing
                ts_local = ts_utc + utc_offset
                minute_key = ts_local.strftime('%H:%M')
                
                if minute_key in buckets:
                    try:
                        details = json.loads(row['details'])
                        atype = details.get('attack_type', 'Suspicious Activity')
                        if atype in buckets[minute_key]:
                            buckets[minute_key][atype] += 1
                        else:
                            buckets[minute_key]['Suspicious Activity'] += 1
                    except:
                        pass
            except Exception:
                pass
        
        heatmap = [{'time': k, 'counts': buckets[k]} for k in bucket_order]
        return jsonify({'slots': heatmap, 'types': threat_types})
        
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


@app.route('/api/security-score', methods=['GET'])
def get_security_score():
    """Dynamic security score: starts at 100, deducted by threat severity."""
    try:
        conn = get_db_connection()
        cur = conn.cursor()

        cur.execute('''
            SELECT event_id FROM incident_logs
            GROUP BY event_id
            ORDER BY MAX(timestamp) DESC LIMIT 100
        ''')
        event_ids = [row[0] for row in cur.fetchall()]

        score = 100
        for eid in event_ids:
            cur.execute("SELECT agent_name, action_taken, details FROM incident_logs WHERE event_id=?", (eid,))
            logs = cur.fetchall()
            risk_score = 0
            is_blocked = False
            for log in logs:
                if log['agent_name'] == 'RiskAssessmentAgent':
                    try:
                        score_val = json.loads(log['details']).get('risk_score', 0)
                        risk_score = max(risk_score, score_val)
                    except: pass
                elif log['agent_name'] == 'ResponseAgent':
                    if 'block' in log['action_taken'].lower() or 'isolate' in log['action_taken'].lower():
                        is_blocked = True
            if risk_score >= 80 and not is_blocked:
                score -= 15
            elif risk_score >= 50 and not is_blocked:
                score -= 8
            elif risk_score >= 80:
                score -= 3  # blocked critical still dings a little
        score = max(0, min(100, score))
        conn.close()
        return jsonify({'security_score': round(score)})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/geo-threats', methods=['GET'])
def get_geo_threats():
    """Return geo-enriched blocked IPs — stores results in geo_cache table."""
    try:
        import urllib.request as urlreq
        from datetime import datetime

        ensure_geo_table()
        conn = get_db_connection()
        cur = conn.cursor()

        # Extract distinct blocked IPs from incident_logs
        cur.execute('''
            SELECT DISTINCT json_extract(details, '$.source_ip') as ip
            FROM incident_logs
            WHERE action_taken LIKE '%block%'
            AND json_extract(details, '$.source_ip') IS NOT NULL
        ''')
        all_ips = [r['ip'] for r in cur.fetchall()
                   if r['ip'] and not r['ip'].startswith('192.168')
                   and not r['ip'].startswith('10.')
                   and not r['ip'].startswith('127.')]

        # Find IPs not yet in geo_cache
        cur.execute('SELECT ip FROM geo_cache')
        cached_ips = {r['ip'] for r in cur.fetchall()}
        new_ips = [ip for ip in all_ips if ip not in cached_ips][:50]

        # Batch lookup new IPs via ip-api.com
        if new_ips:
            try:
                batch_data = json.dumps([{'query': ip} for ip in new_ips]).encode()
                req = urlreq.Request(
                    'http://ip-api.com/batch?fields=status,country,countryCode,city,lat,lon,query',
                    data=batch_data,
                    headers={'Content-Type': 'application/json'}
                )
                with urlreq.urlopen(req, timeout=5) as resp:
                    geo_results = json.loads(resp.read())

                now = datetime.utcnow().isoformat()
                for item in geo_results:
                    if item.get('status') == 'success':
                        cur.execute('''
                            INSERT OR REPLACE INTO geo_cache
                            (ip, country, country_code, city, lat, lon, looked_up_at)
                            VALUES (?, ?, ?, ?, ?, ?, ?)
                        ''', (
                            item.get('query'),
                            item.get('country', 'Unknown'),
                            item.get('countryCode', 'XX'),
                            item.get('city', ''),
                            item.get('lat', 0),
                            item.get('lon', 0),
                            now
                        ))
                conn.commit()
            except Exception as e:
                print(f'Geo lookup error: {e}')

        # Return all cached geo data for blocked IPs
        cur.execute('SELECT * FROM geo_cache ORDER BY looked_up_at DESC')
        rows = cur.fetchall()
        conn.close()

        geo_threats = [{
            'ip': r['ip'],
            'country': r['country'],
            'countryCode': r['country_code'],
            'city': r['city'],
            'lat': r['lat'],
            'lon': r['lon'],
            'riskScore': 80,
        } for r in rows]

        return jsonify({'geoThreats': geo_threats})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/export/report', methods=['GET'])
def export_report():
    """Export a full incident report as downloadable JSON."""
    try:
        conn = get_db_connection()
        cur = conn.cursor()

        # Stats
        cur.execute("SELECT COUNT(*) FROM incident_logs WHERE agent_name='MonitoringAgent'")
        total_events = cur.fetchone()[0]
        cur.execute("SELECT COUNT(*) FROM incident_logs WHERE action_taken='block_ip'")
        blocked_ips = cur.fetchone()[0]

        # Last 50 threats
        cur.execute('''
            SELECT timestamp, agent_name, action_taken, details
            FROM incident_logs ORDER BY timestamp DESC LIMIT 50
        ''')
        rows = cur.fetchall()
        logs = []
        for r in rows:
            try:
                d = json.loads(r['details'])
            except:
                d = r['details']
            logs.append({'timestamp': r['timestamp'], 'agent': r['agent_name'], 'action': r['action_taken'], 'details': d})

        conn.close()

        report = {
            'generated_at': __import__('datetime').datetime.utcnow().isoformat() + 'Z',
            'summary': {
                'total_events': total_events,
                'blocked_ips': blocked_ips,
            },
            'recent_incidents': logs
        }

        response = jsonify(report)
        response.headers['Content-Disposition'] = 'attachment; filename=incident_report.json'
        return response
    except Exception as e:
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    app.run(port=5000, debug=True)
