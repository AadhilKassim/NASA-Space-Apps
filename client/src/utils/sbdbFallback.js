// Client-side SBDB fallback enrichment
// Fetches SBDB directly if server proxy fails and normalizes to merged shape
export async function fetchSbdbDirect({ spkid, name }) {
  const base = 'https://ssd-api.jpl.nasa.gov/sbdb.api';
  const params = new URLSearchParams({ 'phys-par': 1, 'cd-epoch': 1 });
  if (spkid) params.set('spk', spkid);
  else if (name) params.set('sstr', name.replace(/[()]/g,'').trim());
  const url = `${base}?${params.toString()}`;
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`SBDB HTTP ${resp.status}`);
  const data = await resp.json();
  return normalizeSbdbClient(data);
}

function toNumber(v){ if(v===null||v===undefined) return null; const n=typeof v==='string'?parseFloat(v):v; return Number.isFinite(n)?n:null; }
function elementsArrayToMap(elements = []) { const map={}; for(const el of elements){ if(el && el.name) map[el.name]=el; } return map; }

function normalizeSbdbClient(data){
  if(!data) return null;
  const obj = data.object || {}; const orbit = data.orbit || {}; const elements = elementsArrayToMap(orbit.elements||[]);
  const a_au = toNumber(elements.a?.value);
  const e = toNumber(elements.e?.value);
  const per_days = toNumber(elements.per?.value);
  const w_deg = toNumber(elements.w?.value);
  const om_deg = toNumber(elements.om?.value);
  const longitudePerihelionDeg = (w_deg!=null && om_deg!=null) ? (((w_deg + om_deg) % 360)+360)%360 : null;
  const phys = data.phys_par || [];
  const H = firstPhys(phys,['H']);
  const diam = firstPhys(phys,['diameter','diam']);
  const diameter_m = diam?.value!=null ? (String(diam.units).toLowerCase()==='km'?diam.value*1000:diam.value) : null;
  return {
    sbdb: {
      id: obj.spkid || obj.des || obj.fullname || obj.shortname || null,
      name: obj.fullname || obj.shortname || obj.des || obj.spkid || 'Unknown Object',
      absolute_magnitude_h: H?.value ?? null,
      estimated_diameter: diameter_m!=null ? { meters: { estimated_diameter_max: diameter_m } } : null,
      orbit: {
        a_au,
        e,
        period_days: per_days,
        w_deg,
        om_deg,
        longitudePerihelionDeg
      }
    },
    merged: {
      orbit: {
        semi_major_axis_au: a_au,
        eccentricity: e,
        period_days: per_days,
        longitude_perihelion_deg: longitudePerihelionDeg,
        argument_perihelion_deg: w_deg,
        ascending_node_deg: om_deg,
        source: 'sbdb-direct'
      },
      absolute_magnitude_h: H?.value ?? null,
      estimated_diameter: diameter_m!=null ? { meters: { estimated_diameter_max: diameter_m } } : null
    }
  };
}

function firstPhys(arr,names){ const set=new Set(names.map(n=>n.toLowerCase())); for(const item of arr){ if(item?.name && set.has(String(item.name).toLowerCase())){ return { value: toNumber(item.value), units: item.units||null }; } } return null; }
