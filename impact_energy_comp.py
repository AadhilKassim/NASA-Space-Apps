from flask import Flask, jsonify

# --- 1. CONFIGURATION ---

# Initialize a new, separate Flask App
app = Flask(__name__)

# Enhanced list of comparison points with categories
# Ordered from largest to smallest energy release.
COMPARISON_EVENTS = [
    ("impact", "the Chicxulub impact (that wiped out the dinosaurs)", 100000000),
    ("consumption", "the world's total annual energy consumption", 143000), # Approx. 600 EJ
    ("disaster", "the 2004 Indian Ocean earthquake/tsunami", 9600),
    ("explosion", "the Tsar Bomba (largest nuclear device ever detonated)", 50),
    ("disaster", "the 1980 Mount St. Helens eruption", 24),
    ("disaster", "a major Category 5 hurricane (total lifetime energy)", 10),
    ("explosion", "the Hiroshima atomic bomb ('Little Boy')", 0.015)
]

JOULES_PER_MEGATON = 4.184e15

# --- 2. THE ENHANCED API ENDPOINT ---

@app.route('/compare/energy/<float:megatons>', methods=['GET'])
def get_energy_comparison(megatons):
    """
    Provides a rich set of comparisons for an energy value in megatons.
    """
    
    if megatons <= 0:
        return jsonify({
            "input_megatons": 0,
            "energy_joules": "0 J",
            "comparisons": ["Negligible energy."]
        })
    
    # Calculate energy in Joules for scientific context
    energy_joules = megatons * JOULES_PER_MEGATON
    
    # Generate a list of interesting comparison facts
    facts = []
    for category, event_name, event_energy in COMPARISON_EVENTS:
        if megatons > event_energy * 0.1: # Only compare to reasonably scaled events
            ratio = megatons / event_energy
            
            if ratio >= 0.95 and ratio <= 1.05:
                fact_string = f"This is almost identical to the energy of {event_name}."
            elif ratio > 1:
                fact_string = f"This is equivalent to the energy of approximately {ratio:,.0f} times {event_name}."
            else: # ratio < 1
                # Only show this if it's a significant fraction
                if ratio > 0.01:
                    percentage = ratio * 100
                    fact_string = f"This has about {percentage:.0f}% of the energy of {event_name}."
                else:
                    continue # Skip comparisons that are too small to be intuitive
            
            facts.append(fact_string)

    if not facts:
        facts.append("The energy is too small for a meaningful comparison to major events.")

    return jsonify({
        "input_megatons": megatons,
        "energy_joules": f"{energy_joules:.2e} J",
        "comparisons": facts
    })

# --- 3. MAIN EXECUTION ---

if __name__ == "__main__":
    # To run this alongside your main API, use a different port (e.g., 5001).
    #
    # Example Usage:
    # http://127.0.0.1:5001/compare/energy/150
    # Expected Output: A JSON object with multiple comparison strings.
    
    app.run(host='0.0.0.0', port=5001, debug=True)

