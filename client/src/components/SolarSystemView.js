import React, { useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Html, Stars } from '@react-three/drei';

// Realistic astronomical data (NASA/JPL values)
// Semi-major axis in AU, converted to scene units (1 AU = 10 units for visualization)
// Orbital periods in Earth days
// Eccentricity for elliptical orbits
// Longitude of perihelion (ω) in degrees
const PLANETS = [
  { 
    id: 'mercury', 
    name: 'Mercury', 
    color: '#8c7853', 
    a: 3.87, // 0.387 AU * 10
    e: 0.2056, 
    period: 87.969, 
    longitudePerihelion: 77.45645,
    size: 0.38, 
    actualRadius: 2439.7, // km
    rotationPeriod: 58.646 // Earth days
  },
  { 
    id: 'venus', 
    name: 'Venus', 
    color: '#ffc649', 
    a: 7.23, // 0.723 AU * 10
    e: 0.0068, 
    period: 224.701, 
    longitudePerihelion: 131.53298,
    size: 0.95, 
    actualRadius: 6051.8,
    rotationPeriod: -243.018 // Retrograde rotation
  },
  { 
    id: 'earth', 
    name: 'Earth', 
    color: '#4a90e2', 
    a: 10.0, // 1.0 AU * 10
    e: 0.0167, 
    period: 365.256, 
    longitudePerihelion: 102.94719,
    size: 1.0, 
    actualRadius: 6371.0,
    rotationPeriod: 0.99726968 // 23h 56m 4s
  },
  { 
    id: 'mars', 
    name: 'Mars', 
    color: '#e27b58', 
    a: 15.24, // 1.524 AU * 10
    e: 0.0934, 
    period: 686.980, 
    longitudePerihelion: 336.04084,
    size: 0.53, 
    actualRadius: 3389.5,
    rotationPeriod: 1.02595675
  },
  { 
    id: 'jupiter', 
    name: 'Jupiter', 
    color: '#c88b3a', 
    a: 52.03, // 5.203 AU * 10
    e: 0.0484, 
    period: 4332.589, 
    longitudePerihelion: 14.75385,
    size: 3.5, 
    actualRadius: 69911,
    rotationPeriod: 0.41354 // Fast rotation ~10h
  },
  { 
    id: 'saturn', 
    name: 'Saturn', 
    color: '#fad5a5', 
    a: 95.37, // 9.537 AU * 10
    e: 0.0542, 
    period: 10759.22, 
    longitudePerihelion: 92.43194,
    size: 2.9, 
    actualRadius: 58232,
    rotationPeriod: 0.44401 // ~10.7h
  },
  { 
    id: 'uranus', 
    name: 'Uranus', 
    color: '#4fd0e7', 
    a: 191.91, // 19.191 AU * 10
    e: 0.0472, 
    period: 30688.5, 
    longitudePerihelion: 170.96424,
    size: 1.3, 
    actualRadius: 25362,
    rotationPeriod: -0.71833 // Retrograde, ~17h
  },
  { 
    id: 'neptune', 
    name: 'Neptune', 
    color: '#4166f5', 
    a: 300.68, // 30.068 AU * 10
    e: 0.0086, 
    period: 60182, 
    longitudePerihelion: 44.97135,
    size: 1.2, 
    actualRadius: 24622,
    rotationPeriod: 0.67125 // ~16h
  },
];

// Calculate orbital position using Kepler's laws
function calculateOrbitalPosition(planet, julianDate) {
  const J2000 = 2451545.0; // Julian date for Jan 1, 2000, 12:00 TT
  const daysSinceJ2000 = julianDate - J2000;
  
  // Mean anomaly
  const n = (2 * Math.PI) / planet.period; // Mean motion (radians per day)
  const M = (n * daysSinceJ2000) % (2 * Math.PI);
  
  // Solve Kepler's equation for eccentric anomaly (E)
  // M = E - e*sin(E)
  let E = M;
  for (let i = 0; i < 10; i++) {
    E = M + planet.e * Math.sin(E);
  }
  
  // True anomaly (v)
  const v = 2 * Math.atan2(
    Math.sqrt(1 + planet.e) * Math.sin(E / 2),
    Math.sqrt(1 - planet.e) * Math.cos(E / 2)
  );
  
  // Distance from sun
  const r = planet.a * (1 - planet.e * Math.cos(E));
  
  // Position in orbital plane
  const omega = (planet.longitudePerihelion * Math.PI) / 180; // Convert to radians
  const x = r * Math.cos(v + omega);
  const z = r * Math.sin(v + omega);
  
  return { x, y: 0, z, trueAnomaly: v, distance: r };
}

// Convert date to Julian Date
function dateToJulianDate(date) {
  return date.getTime() / 86400000 + 2440587.5;
}

// Orbit line component - draws full elliptical orbit
function OrbitLine({ planet }) {
  const points = useMemo(() => {
    const segments = 128;
    const pts = [];
    const omega = (planet.longitudePerihelion * Math.PI) / 180;
    
    for (let i = 0; i <= segments; i++) {
      const theta = (i / segments) * 2 * Math.PI;
      const r = (planet.a * (1 - planet.e * planet.e)) / (1 + planet.e * Math.cos(theta));
      const x = r * Math.cos(theta + omega);
      const z = r * Math.sin(theta + omega);
      pts.push([x, 0, z]);
    }
    return pts;
  }, [planet.a, planet.e, planet.longitudePerihelion]);

  return (
    <line>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={points.length}
          array={new Float32Array(points.flat())}
          itemSize={3}
        />
      </bufferGeometry>
      <lineBasicMaterial color={planet.color} transparent opacity={0.3} linewidth={1} />
    </line>
  );
}
OrbitLine.displayName = 'OrbitLine';

// Sun component
function Sun() {
  const sunRef = useRef();
  
  useFrame(() => {
    if (sunRef.current) {
      sunRef.current.rotation.y += 0.001;
    }
  });

  return (
    <group>
      <mesh ref={sunRef}>
        <sphereGeometry args={[3.5, 32, 32]} />
        <meshBasicMaterial color="#FDB813" />
      </mesh>
      <pointLight position={[0, 0, 0]} intensity={2} distance={1000} decay={1.5} />
      <Html distanceFactor={8} style={{ pointerEvents: 'none', fontWeight: 'bold', fontSize: '20px', color: '#FDB813' }}>
        <div className="annotation">Sun</div>
      </Html>
    </group>
  );
}
Sun.displayName = 'Sun';

// Planet component with realistic physics
function Planet({ planet, currentDate, timeScale }) {
  const planetRef = useRef();
  const groupRef = useRef();
  const { camera } = useThree();
  const [showLabel, setShowLabel] = useState(true);
  const [labelScale, setLabelScale] = useState(1);

  useFrame(() => {
    if (!groupRef.current) return;

    // Calculate current Julian date
    const julianDate = dateToJulianDate(currentDate);
    
    // Get orbital position
    const pos = calculateOrbitalPosition(planet, julianDate);
    groupRef.current.position.set(pos.x, pos.y, pos.z);

    // Planet rotation on its axis
    if (planetRef.current) {
      // Rotation speed based on actual rotation period and time scale
      const rotationSpeed = (2 * Math.PI / planet.rotationPeriod) * (timeScale / 86400); // radians per frame
      planetRef.current.rotation.y += rotationSpeed;
    }

    // Adaptive label scaling based on camera distance
    const camDist = camera.position.distanceTo(groupRef.current.position);
    const scale = Math.max(0.5, Math.min(2, camDist * 0.015));
    setLabelScale(scale);
    setShowLabel(camDist < 500);
  });

  return (
    <>
      <OrbitLine planet={planet} />
      <group ref={groupRef}>
        <mesh ref={planetRef}>
          <sphereGeometry args={[planet.size, 32, 32]} />
          <meshStandardMaterial 
            color={planet.color} 
            roughness={0.7}
            metalness={0.3}
          />
        </mesh>
        {showLabel && (
          <Html 
            distanceFactor={10} 
            style={{ 
              pointerEvents: 'none', 
              fontWeight: 'bold', 
              fontSize: `${14 * labelScale}px`, 
              color: planet.color,
              textShadow: '0 0 5px black',
              whiteSpace: 'nowrap'
            }}
          >
            <div>{planet.name}</div>
          </Html>
        )}
      </group>
    </>
  );
}
Planet.displayName = 'Planet';

// Asteroid component with realistic orbit
function Asteroid({ asteroid, onClick, isSelected, currentDate, timeScale }) {
  const meshRef = useRef();
  const groupRef = useRef();
  
  // Simulated orbital parameters for asteroids (you would get these from NASA API)
  const orbitParams = useMemo(() => ({
    a: 15 + Math.random() * 40, // Semi-major axis
    e: 0.05 + Math.random() * 0.3, // Eccentricity
    period: 300 + Math.random() * 1000, // Orbital period in days
    longitudePerihelion: Math.random() * 360,
  }), [asteroid.id]);

  useFrame(() => {
    if (!groupRef.current) return;

    const julianDate = dateToJulianDate(currentDate);
    const J2000 = 2451545.0;
    const daysSinceJ2000 = julianDate - J2000;
    
    const n = (2 * Math.PI) / orbitParams.period;
    const M = (n * daysSinceJ2000) % (2 * Math.PI);
    
    let E = M;
    for (let i = 0; i < 10; i++) {
      E = M + orbitParams.e * Math.sin(E);
    }
    
    const v = 2 * Math.atan2(
      Math.sqrt(1 + orbitParams.e) * Math.sin(E / 2),
      Math.sqrt(1 - orbitParams.e) * Math.cos(E / 2)
    );
    
    const r = orbitParams.a * (1 - orbitParams.e * Math.cos(E));
    const omega = (orbitParams.longitudePerihelion * Math.PI) / 180;
    
    const x = r * Math.cos(v + omega);
    const z = r * Math.sin(v + omega);
    
    groupRef.current.position.set(x, 0, z);
    
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.02 * timeScale / 86400;
    }
  });

  // Draw orbit for asteroids
  const orbitPoints = useMemo(() => {
    const segments = 64;
    const pts = [];
    const omega = (orbitParams.longitudePerihelion * Math.PI) / 180;
    
    for (let i = 0; i <= segments; i++) {
      const theta = (i / segments) * 2 * Math.PI;
      const r = (orbitParams.a * (1 - orbitParams.e * orbitParams.e)) / (1 + orbitParams.e * Math.cos(theta));
      const x = r * Math.cos(theta + omega);
      const z = r * Math.sin(theta + omega);
      pts.push([x, 0, z]);
    }
    return pts;
  }, [orbitParams.a, orbitParams.e, orbitParams.longitudePerihelion]);

  return (
    <>
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={orbitPoints.length}
            array={new Float32Array(orbitPoints.flat())}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial 
          color={asteroid.is_potentially_hazardous_asteroid ? '#ff4444' : '#888888'} 
          transparent 
          opacity={0.4} 
        />
      </line>
      <group ref={groupRef}>
        <mesh
          ref={meshRef}
          onClick={() => onClick(asteroid)}
        >
          <sphereGeometry args={[0.3, 16, 16]} />
          <meshStandardMaterial 
            color={isSelected ? '#ff6b6b' : (asteroid.is_potentially_hazardous_asteroid ? '#ff8844' : '#8b7355')}
            roughness={0.9}
          />
        </mesh>
        {isSelected && (
          <Html distanceFactor={10} style={{ pointerEvents: 'none', color: '#fff', fontWeight: 'bold' }}>
            <div className="annotation">{asteroid.name}</div>
          </Html>
        )}
      </group>
    </>
  );
}
Asteroid.displayName = 'Asteroid';

// Main component
function SolarSystemView({ onAsteroidSelect, selectedAsteroid, currentDate = new Date(), timeScale = 1 }) {
  // Example asteroids with realistic data
  const asteroids = useMemo(() => [
    { id: '1', name: '2025 Impactor', is_potentially_hazardous_asteroid: true },
    { id: '2', name: '99942 Apophis', is_potentially_hazardous_asteroid: true },
    { id: '3', name: '101955 Bennu', is_potentially_hazardous_asteroid: false }
  ], []);

  return (
    <Canvas camera={{ position: [0, 80, 180], fov: 50, near: 0.1, far: 5000 }}>
      <color attach="background" args={['#000000']} />
      
      {/* Starfield background */}
      <Stars radius={300} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
      
      {/* Lighting */}
      <ambientLight intensity={0.15} />
      
      {/* Sun */}
      <Sun />
      
      {/* Planets */}
      {PLANETS.map(planet => (
        <Planet 
          key={planet.id} 
          planet={planet} 
          currentDate={currentDate}
          timeScale={timeScale}
        />
      ))}
      
      {/* Asteroids */}
      {asteroids.map(asteroid => (
        <Asteroid
          key={asteroid.id}
          asteroid={asteroid}
          onClick={onAsteroidSelect}
          isSelected={selectedAsteroid?.id === asteroid.id}
          currentDate={currentDate}
          timeScale={timeScale}
        />
      ))}
      
      {/* Camera controls */}
      <OrbitControls 
        enablePan={true} 
        enableZoom={true} 
        enableRotate={true}
        minDistance={10}
        maxDistance={1000}
        zoomSpeed={1.2}
      />
    </Canvas>
  );
}
SolarSystemView.displayName = 'SolarSystemView';

export default SolarSystemView;