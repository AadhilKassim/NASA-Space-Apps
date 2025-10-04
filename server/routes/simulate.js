// server/routes/simulate.js
const express = require('express');
const router = express.Router();

/**
 * POST /api/impact/simulate
 * body: { diameter_m, density_kgm3, velocity_kms, entry_angle_deg, lat, lon, ocean:boolean }
 * returns simplified blast radius, crater size, tsunami info (if ocean), casualty & economic estimates
 *
 * NOTE: These formulas are simplified approximations for visualization only.
 */

function calcBlastRadius(diameter_m, velocity_kms, density = 3000) {
  // crude kinetic energy: 0.5*m*v^2 ; mass ~ volume * density (sphere)
  const r = diameter_m / 2;
  const volume = (4/3) * Math.PI * Math.pow(r, 3);
  const mass = volume * density; // kg
  const v = velocity_kms * 1000; // m/s
  const energyJ = 0.5 * mass * v * v; // Joules
  // Convert to TNT equivalent: 4.184e9 J per kiloton
  const kt = energyJ / 4.184e12; // kilotons
  // Yield-to-blast radius approximate scaling (scaled from nuclear effects tables)
  // R_km ~ k * (kt)^(1/3)  (k ~= 0.5 - 1.5 depending on scaling)
  const k = 0.8;
  const R_km = k * Math.pow(kt, 1/3);
  return { energyJ, kt, blastRadius_m: R_km * 1000 };
}

function calcCrater(diameter_m, velocity_kms, density_kgm3=3000, targetDensity=2600) {
  // Simplified crater diameter scaling law (pi-scaling)
  // D_crater ~ C * (mass/targetDensity)^(1/3) * (v/1000)^(0.25)
  const r = diameter_m / 2;
  const vol = (4/3) * Math.PI * r*r*r;
  const mass = vol * density_kgm3;
  const C = 1.8;
  const D_m = C * Math.pow(mass / targetDensity, 1/3) * Math.pow(velocity_kms, 0.25);
  return Math.max(10, D_m);
}

function calcTsunami(energyJ, distanceToCoast_km) {
  // Crude model: wave height at source scales with energy, attenuates with distance.
  // H0 ~ alpha * (E)^(1/3) (very rough). Then H(d) ~ H0 / (1 + d/d0)
  const alpha = 1e-5;
  const H0 = alpha * Math.pow(energyJ, 1/3); // meters
  const d0 = 100; // km attenuation scale
  const H_at_coast = H0 / (1 + (distanceToCoast_km / d0));
  return { H0_m: H0, height_at_coast_m: Math.max(0.1, H_at_coast) };
}

router.post('/simulate', (req, res) => {
  try {
    const {
      diameter_m = 100,
      velocity_kms = 20,
      density_kgm3 = 3000,
      entry_angle_deg = 45,
      lat, lon, ocean = false, distanceToCoast_km = 50
    } = req.body;

    const blast = calcBlastRadius(diameter_m, velocity_kms, density_kgm3);
    const craterDiameter = calcCrater(diameter_m, velocity_kms, density_kgm3);
    const tsunami = ocean ? calcTsunami(blast.energyJ, distanceToCoast_km) : null;

    // rough casualty estimate: population density * affected area fraction
    const affectedArea_km2 = Math.PI * Math.pow(blast.blastRadius_m/1000, 2);
    // use placeholder pop density (will be replaced by USGS/population data)
    const popDensity_per_km2 = 300;
    const casualtiesEstimate = Math.round(affectedArea_km2 * popDensity_per_km2 * 0.2); // 20% mortality in core
    const economicCostUSD = Math.round((affectedArea_km2 * 100000) + (blast.kt * 1e6)); // rough

    res.json({
      blastRadius_m: Math.round(blast.blastRadius_m),
      blast_kilotons: blast.kt,
      craterDiameter_m: Math.round(craterDiameter),
      tsunami,
      affectedArea_km2: Math.round(affectedArea_km2),
      casualtiesEstimate,
      economicCostUSD
    });

  } catch (err) {
    console.error('simulate error', err);
    res.status(500).json({ error: 'Simulation failed' });
  }
});

module.exports = router;
