from flask import Flask, jsonify
import requests
from datetime import datetime, timedelta

# --- 1. CONFIGURATION ---

# Initialize a new, separate Flask App
app = Flask(__name__)

# NASA DONKI API Endpoint for Coronal Mass Ejections (CME)
DONKI_API_URL = "https://api.nasa.gov/DONKI/CME"

# IMPORTANT: You MUST replace "DEMO_KEY" with your own personal key.
# A DEMO_KEY will get rate-limited and cause errors.
# Get a free key here: https://api.nasa.gov/
NASA_API_KEY = "Rjeha6nJ3HcHfyZAkqVLjORe5Ge1ylmcbY20nXES"


# --- 2. THE ENHANCED API ENDPOINT ---

@app.route('/mission_conditions', methods=['GET'])
def get_mission_conditions():
    """
    Checks recent space weather from the DONKI API to determine if conditions
    are favorable for a hypothetical deep-space mission. This enhanced version
    provides specifics on the most recent event.
    """
    
    start_date = (datetime.now() - timedelta(days=7)).strftime('%Y-%m-%d')
    end_date = datetime.now().strftime('%Y-%m-%d')
    
    params = {
        'startDate': start_date,
        'endDate': end_date,
        'api_key': NASA_API_KEY
    }
    
    try:
        response = requests.get(DONKI_API_URL, params=params)
        response.raise_for_status()
        cme_events = response.json()
    except requests.exceptions.RequestException as e:
        return jsonify({
            "status": "API Error",
            "message": f"Could not retrieve space weather data: {str(e)}",
        }), 500

    # --- NEW: Analysis with Specifics ---
    cme_count = len(cme_events)
    most_recent_event = None
    
    if cme_count == 0:
        status = "Nominal"
        message = "Space weather conditions are clear. All systems are nominal for mission planning and launch."
    else:
        # Find the most recent event (DONKI API usually returns them chronologically, but sorting is safer)
        cme_events.sort(key=lambda x: x.get('startTime', ''), reverse=True)
        latest_event = cme_events[0]
        
        most_recent_event = {
            "time": latest_event.get('startTime'),
            "note": latest_event.get('note'),
            "source_link": latest_event.get('link')
        }
        
        if cme_count > 10:
            status = "Warning"
            message = f"High level of recent solar activity detected. {cme_count} CMEs in the last 7 days. A mission launch is not advised. The most recent event occurred on {most_recent_event['time']}."
        else: # cme_count > 0
            status = "Caution"
            message = f"Moderate solar activity detected. {cme_count} CMEs in the last 7 days. Mission planners should proceed with caution. The most recent event is noted."

    # --- NEW: Enhanced JSON Response ---
    return jsonify({
        "status": status,
        "message": message,
        "data": {
            "recent_cme_count": cme_count,
            "most_recent_event": most_recent_event
        }
    })

# --- 3. MAIN EXECUTION ---

if __name__ == "__main__":
    # Note: To run this alongside your other APIs, use a different port (e.g., 5002).
    # Example Usage: http://127.0.0.1:5002/mission_conditions
    
    app.run(host='0.0.0.0', port=5002, debug=True)

