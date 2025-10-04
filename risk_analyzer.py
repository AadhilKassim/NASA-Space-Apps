import math
import json
import requests
import sys
from datetime import datetime, timedelta
from flask import Flask, request, jsonify

# --- 1. CONFIGURATION AND CONSTANTS ---

# NASA API Endpoint
SENTRY_API_URL = "https://ssd-api.jpl.nasa.gov/sentry.api"

# General Physics Constants
DENSITY_KG_M3 = 2600.0  # Assumed density for a stony asteroid (kg/m^3)
J_PER_MT = 4.184e15  # Joules per Megaton of TNT
R_EARTH_KM = 6371.0 # Radius of Earth in kilometers
# Default mitigation mission planning time (used if ETA is far in the future)
DEFAULT_PUSH_TIME_YEARS = 20.0 

# Initialize Flask App
app = Flask(__name__)


# --- 2. DATA ACQUISITION FUNCTION ---

def fetch_sentry_data(designation):
    """Fetches asteroid data from the NASA CNEOS Sentry API."""
    # print(f"[*] Fetching Sentry data for: {designation}...") # Removed print for API environment

    params = {'des': designation}
    
    try:
        # Implemented basic exponential backoff retry logic for robust API calls
        max_retries = 3
        for attempt in range(max_retries):
            response = requests.get(SENTRY_API_URL, params=params)
            
            if response.status_code == 200:
                data = response.json()
                # Check for "removed" or "not found" status explicitly
                if 'error' in data:
                     # Treat removed/not found as a success status but with an internal error message
                     return data
                return data
            
            # If rate limited (429) or transient error (5xx), wait and retry
            if response.status_code in (429, 500, 502, 503, 504) and attempt < max_retries - 1:
                # print(f"Temporary API error {response.status_code}. Retrying in {2**attempt}s...")
                time.sleep(2**attempt)
            else:
                response.raise_for_status()
                
    except requests.exceptions.HTTPError as e:
        return {"error": f"HTTP Error: {e.response.status_code} - {e.response.reason}"}
    except requests.exceptions.RequestException as e:
        return {"error": f"Request failed: {str(e)}"}
    except Exception as e:
        return {"error": f"An unexpected error occurred: {str(e)}"}

    return None

# --- 3. CORE CALCULATION FUNCTIONS ---

def calculate_consequences(sentry_data, designation):
    """
    Calculates impact consequences (severity) based on API data.
    """
    summary = sentry_data.get('summary', {})
    
    # 1. Extract inputs (handling potential missing fields with defaults)
    try:
        ENERGY_MT = float(summary.get('energy', 0.0))
        DIAMETER_KM = float(summary.get('diameter', 0.0))
        VELOCITY_KMS = float(summary.get('v_inf', 0.0))
        IP_CUM = float(summary.get('ip', 0.0))
        
        # Find the highest single probability VI date for the ETA
        highest_risk_vi = max(sentry_data.get('data', []), key=lambda x: float(x.get('ip', 0.0)), default={})
        IMPACT_DATE_STR = highest_risk_vi.get('date', 'N/A')
        
    except (ValueError, TypeError) as e:
        return {"error": f"Data parsing error: {e}"}


    # 2. Derive mass and kinetic energy (for seismic calculation)
    diameter_m = DIAMETER_KM * 1000
    radius_m = diameter_m / 2
    volume_m3 = (4/3) * math.pi * (radius_m**3)
    mass_kg = DENSITY_KG_M3 * volume_m3
    
    velocity_ms = VELOCITY_KMS * 1000
    kinetic_energy_J = 0.5 * mass_kg * (velocity_ms**2)
    
    # 3. Airblast Radius (4 psi for heavy destruction)
    R_ref_4psi = 6.2 # km (Ref radius for 1 Mt explosion)
    R_ref_1psi = 17.0 # km (Ref radius for 1 Mt explosion)
    
    if ENERGY_MT > 0:
        R_blast_4psi = R_ref_4psi * (ENERGY_MT / 1.0)**(1/3)
        R_blast_1psi = R_ref_1psi * (ENERGY_MT / 1.0)**(1/3)
    else:
        R_blast_4psi = 0.0
        R_blast_1psi = 0.0

    # 4. Seismic Effects (Moment Magnitude)
    SEISMIC_EFFICIENCY = 1e-4  # 0.01% of total energy converts to seismic waves
    E_seismic_J = kinetic_energy_J * SEISMIC_EFFICIENCY
    
    moment_magnitude = 0.0
    if E_seismic_J > 0:
        moment_magnitude = 0.67 * math.log10(E_seismic_J) - 5.87

    # 5. Crater Size (Simplified)
    crater_diameter_km = 0.0
    if ENERGY_MT > 0:
        crater_diameter_km = ENERGY_MT**(1/3)
        
    # Placeholder for lat/lon since the public API JSON response omits it.
    NOMINAL_LAT = 15.0 
    NOMINAL_LON = -30.0

    return {
        "asteroid_name": summary.get('fullname', designation),
        "ip_cumulative": IP_CUM,
        "eta": IMPACT_DATE_STR,
        "energy_mt": ENERGY_MT,
        "diameter_km": DIAMETER_KM,
        "nominal_impact_location": {"lat": NOMINAL_LAT, "lon": NOMINAL_LON},
        "destruction_radius_km": R_blast_4psi,
        "shaking_radius_km": R_blast_1psi,
        "seismic_magnitude_mw": moment_magnitude,
        "crater_diameter_km": crater_diameter_km
    }

def calculate_mitigation(consequence_results, push_time_years=DEFAULT_PUSH_TIME_YEARS):
    """
    Calculates the required Delta V (to miss Earth by 1 R_Earth) and simulates
    the deflection using that calculated minimum required Delta V.
    """
    
    # 1. Setup Time to Impact
    eta_str = consequence_results['eta']
    
    if eta_str == 'N/A':
        impact_date = datetime(2150, 1, 1) 
    else:
        # Handle CNEOS date format (e.g., '2071-09-16.04')
        date_part = eta_str.split('.')[0]
        date_format = "%Y-%m-%d %H:%M:%S" if ' ' in date_part else "%Y-%m-%d"
        
        try:
            impact_date = datetime.strptime(date_part, date_format)
        except ValueError:
            impact_date = datetime.strptime(date_part, "%Y-%m-%d")


    current_date = datetime.now()
    
    # Ensure push time is feasible and adjust if impact date is near
    if (impact_date - current_date).days < (push_time_years * 365.25):
        # Set intervention time to 1 year before impact if default time is too long
        push_time_years = max(1.0, (impact_date - current_date).days / 365.25 - 1)
    
    time_to_impact_s = (impact_date - current_date).total_seconds()
    
    # Time for deflection to take effect
    T_push_effect_s = time_to_impact_s - (timedelta(days=365.25 * push_time_years).total_seconds())

    # 2. Calculate Required Delta V (The goal)
    required_deflection_m = R_EARTH_KM * 1000.0
    
    if T_push_effect_s > 0:
        required_delta_v_ms = required_deflection_m / T_push_effect_s
        required_delta_v_mms = required_delta_v_ms * 1000
    else:
        required_delta_v_mms = 99999.0

    # 3. Deflection Simulation: Apply the calculated required Delta V
    delta_v_mms_applied = required_delta_v_mms
    
    delta_v_m_s = delta_v_mms_applied / 1000.0
    deflection_m = delta_v_m_s * T_push_effect_s
    deflection_km = deflection_m / 1000.0
    deflection_earth_radii = deflection_km / R_EARTH_KM

    # 4. Mitigation Conclusion
    mitigation_success = "IMPOSSIBLE" if T_push_effect_s <= 0 else "SUCCESSFUL"
    
    return {
        "intervention_time_years": push_time_years,
        "applied_delta_v_mms": delta_v_mms_applied,
        "required_delta_v_mms": required_delta_v_mms,
        "resulting_deflection_km": deflection_km,
        "deflection_earth_radii": deflection_earth_radii,
        "mitigation_conclusion": mitigation_success
    }

# --- 4. FLASK API ENDPOINT ---

@app.route('/analyze/<designation>', methods=['GET'])
def run_analysis_api(designation):
    """
    API endpoint to analyze an asteroid and return the full risk assessment JSON.
    Example: /analyze/2000 SG344
    """
    
    # 1. Fetch Data
    sentry_data = fetch_sentry_data(designation)
    
    if sentry_data and 'error' in sentry_data:
        # If the fetch failed or the object was removed/not found
        status_code = 404 if 'not found' in sentry_data['error'] else 500
        return jsonify({
            "status": "error",
            "message": f"Analysis failed: {sentry_data['error']}",
            "designation": designation
        }), status_code

    # 2. Calculate Consequences
    consequence_results = calculate_consequences(sentry_data, designation)
    
    if 'error' in consequence_results:
        return jsonify({"status": "error", "message": f"Calculation failed: {consequence_results['error']}"}), 500

    # 3. Calculate Mitigation (using the calculated required Delta V)
    mitigation_results = calculate_mitigation(consequence_results)

    # 4. Consolidate and Output (Clean JSON format for the API response)
    final_output = {
        "status": "success",
        "timestamp": datetime.now().isoformat(),
        "asteroid_info": {
            "designation": consequence_results['asteroid_name'],
            "risk_assessment_summary": f"Cumulative Impact Probability: {consequence_results['ip_cumulative']:.4f} ({1/consequence_results['ip_cumulative']:.0f} chance)",
            "size_km": f"{consequence_results['diameter_km']:.3f}",
            "eta": consequence_results['eta'],
            "energy_mt": f"{consequence_results['energy_mt']:.3f}"
        },
        "impact_severity": {
            "nominal_location": consequence_results['nominal_impact_location'],
            "destruction_radius_km": f"{consequence_results['destruction_radius_km']:.2f}",
            "shaking_radius_km": f"{consequence_results['shaking_radius_km']:.2f}",
            "seismic_magnitude_mw": f"{consequence_results['seismic_magnitude_mw']:.2f}",
            "crater_diameter_km": f"{consequence_results['crater_diameter_km']:.2f}"
        },
        "mitigation_planning": {
            "intervention_time_years": f"{mitigation_results['intervention_time_years']:.1f}",
            "required_delta_v_mms": f"{mitigation_results['required_delta_v_mms']:.2f}",
            "simulated_deflection_km": f"{mitigation_results['resulting_deflection_km']:.0f}",
            "conclusion": mitigation_results['mitigation_conclusion']
        }
    }
    
    return jsonify(final_output)

# --- 5. MAIN EXECUTION (FOR RUNNING THE API) ---

if __name__ == "__main__":
    
    # NOTE: When running in a local environment (terminal), run on port 5000.
    # In Colab, you need to use ngrok or similar tunneling for external access, but for 
    # testing within the notebook, the flask server runs fine locally.
    app.run(host='0.0.0.0', port=5000)
