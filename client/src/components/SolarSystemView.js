// FadingOrbit for asteroid trails
function FadingOrbit({ xRadius, zRadius, angle, offset }) {
  // Draw a partial faded ellipse up to the asteroid's current position
  const segments = 64;
  const points = [];
  for (let i = 0; i <= segments; i++) {
    const t = (i / segments) * (angle + offset);
    points.push([
      xRadius * Math.cos(t),
      0,
      zRadius * Math.sin(t)
    ]);
  }
  return (
    <line>
      <bufferGeometry attach="geometry">
        <bufferAttribute
          attach="attributes-position"
          count={points.length}
          array={new Float32Array(points.flat())}
          itemSize={3}
        />
      </bufferGeometry>
      <lineBasicMaterial attach="material" color="#8b7355" linewidth={1} transparent opacity={0.3} />
    </line>
  );
}

// Asteroid component
function Asteroid({ asteroid, onClick, isSelected }) {
  const meshRef = useRef();
  // Randomize orbit for demo
  const angle = useMemo(() => Math.random() * Math.PI * 2, []);
  const xRadius = useMemo(() => 60 + Math.random() * 40, []);
  const zRadius = useMemo(() => 55 + Math.random() * 35, []);
  const offset = useMemo(() => Math.random() * Math.PI * 2, []);
  useFrame(({ clock }) => {
    if (meshRef.current) {
      // Animate asteroid revolution
      const t = clock.getElapsedTime() * 0.18 + offset;
      const x = xRadius * Math.cos(angle + t);
      const z = zRadius * Math.sin(angle + t);
      meshRef.current.position.x = x;
      meshRef.current.position.z = z;
      meshRef.current.rotation.y += 0.02;
    }
  });
  return (
    <>
      {/* Fading orbit ellipse for asteroid, ending at asteroid's current position */}
      <FadingOrbit xRadius={xRadius} zRadius={zRadius} angle={angle} offset={offset} />
      <mesh
        ref={meshRef}
        position={[xRadius * Math.cos(angle), 0, zRadius * Math.sin(angle)]}
        onClick={() => onClick(asteroid)}
      >
        <sphereGeometry args={[0.13, 8, 8]} />
        <meshStandardMaterial color={isSelected ? '#ff6b6b' : '#8b7355'} />
        {isSelected && (
          <Html distanceFactor={10} style={{ pointerEvents: 'none' }}>
            <div className="annotation">{asteroid.name}</div>
          </Html>
        )}
      </mesh>
    </>
  );
}
import React, { useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';

const PLANETS = [
  { id: 'mercury', name: 'Mercury', color: '#b1b1b1', a: 5.8, period: 87.97, size: 0.18, rotationSpeed: 0.03 },
  { id: 'venus', name: 'Venus', color: '#e6c07b', a: 10.8, period: 224.7, size: 0.45, rotationSpeed: 0.01 },
  { id: 'earth', name: 'Earth', color: '#6b93d6', a: 15, period: 365.26, size: 0.48, rotationSpeed: 0.02 },
  { id: 'mars', name: 'Mars', color: '#cd5c5c', a: 22.8, period: 686.98, size: 0.36, rotationSpeed: 0.018 },
  { id: 'jupiter', name: 'Jupiter', color: '#d2691e', a: 77.8, period: 4332.59, size: 1.1, rotationSpeed: 0.04 },
  { id: 'saturn', name: 'Saturn', color: '#e3c97b', a: 143.4, period: 10759.22, size: 0.95, rotationSpeed: 0.038 },
  { id: 'uranus', name: 'Uranus', color: '#b0e0e6', a: 287.1, period: 30685.4, size: 0.7, rotationSpeed: 0.03 },
  { id: 'neptune', name: 'Neptune', color: '#4166f5', a: 449.5, period: 60190.03, size: 0.68, rotationSpeed: 0.028 },
];

function usePlanetData(date = new Date()) {
  return useMemo(() => {
    const data = [{ id: 'sun', name: 'Sun', color: '#ffd700', xRadius: 0, zRadius: 0, size: 2.5, speed: 0, offset: 0, rotationSpeed: 0.005 }];
    const epoch = new Date('2000-01-01T12:00:00Z');
    const daysSinceEpoch = (date - epoch) / (1000 * 60 * 60 * 24);
    for (const p of PLANETS) {
      const meanAnomaly = 2 * Math.PI * ((daysSinceEpoch % p.period) / p.period);
      data.push({
        id: p.id,
        name: p.name,
        color: p.color,
        xRadius: p.a,
        zRadius: p.a,
        size: p.size,
        speed: 0,
        offset: meanAnomaly,
        rotationSpeed: p.rotationSpeed,
      });
    }
    return data;
  }, [date]);
}

function Ecliptic({ xRadius, zRadius, color = '#888' }) {
  const points = useMemo(() => {
    const segments = 128;
    const pts = [];
    for (let i = 0; i <= segments; i++) {
      const theta = (i / segments) * 2 * Math.PI;
      pts.push([
        xRadius * Math.sin(theta),
        0,
        zRadius * Math.cos(theta)
      ]);
    }
    return pts;
  }, [xRadius, zRadius]);
  return (
    <line>
      <bufferGeometry attach="geometry">
        <bufferAttribute
          attach="attributes-position"
          count={points.length}
          array={new Float32Array(points.flat())}
          itemSize={3}
        />
      </bufferGeometry>
      <lineBasicMaterial attach="material" color={color} linewidth={1} />
    </line>
  );
}

function Planet({ planet }) {
  const planetRef = useRef();
  const { camera } = useThree();
  const groupRef = useRef();
  const baseCircleSize = planet.size * 2;
  const minCircleSize = planet.size * 1;
  const maxCircleSize = planet.size * 5;
  const [circleScale, setCircleScale] = useState(baseCircleSize);
  const [showSphere, setShowSphere] = useState(true);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    // Animate revolution: add time to mean anomaly
    let angle = planet.offset;
    if (planet.xRadius !== 0) {
      // Orbital period in seconds (scale up for demo speed)
      const periodSeconds = planet.period ? planet.period * 1.2 : 2; // 0.2 = speed factor
      angle += (clock.getElapsedTime() / periodSeconds) * 2 * Math.PI;
    }
    const x = planet.xRadius * Math.cos(angle);
    const z = planet.zRadius * Math.sin(angle);
    groupRef.current.position.x = x;
    groupRef.current.position.z = z;
    const camDist = camera.position.distanceTo(groupRef.current.position);
    let scale = Math.max(minCircleSize, Math.min(maxCircleSize, camDist * 0.08));
    setCircleScale(scale);
    setShowSphere(scale < planet.size * 3.5);
    if (planetRef.current) {
      planetRef.current.rotation.y += planet.rotationSpeed;
    }
  });

  return (
    <>
      {/* Render orbit for planets, not Sun */}
      {planet.xRadius !== 0 && planet.zRadius !== 0 && (
        <Ecliptic xRadius={planet.xRadius} zRadius={planet.zRadius} color={planet.color} />
      )}
      <group ref={groupRef}>
        {/* Billboarded colored circle for planets, not Sun */}
        {planet.xRadius !== 0 && (
          <mesh rotation={[-Math.PI/2,0,0]}>
            <circleGeometry args={[circleScale, 48]} />
            <meshBasicMaterial color={planet.color} transparent opacity={0.25} depthWrite={false} />
          </mesh>
        )}
        {/* Always render the Sun's sphere, or planet sphere if showSphere */}
        {(planet.xRadius === 0 || showSphere) && (
          <mesh ref={planetRef}>
            <sphereGeometry args={[planet.size, 32, 32]} />
            <meshStandardMaterial color={planet.color} />
          </mesh>
        )}
        {/* Always render the Sun's label, or planet label if not Sun */}
        {(planet.xRadius === 0) ? (
          <Html distanceFactor={planet.size * 2.2} style={{ pointerEvents: 'none', fontWeight: 'bold', fontSize: `${Math.max(18, planet.size * 8)}px`, color: planet.color }}>
            <div className="annotation">{planet.name}</div>
          </Html>
        ) : (
          <Html distanceFactor={circleScale * 2.2} style={{ pointerEvents: 'none', fontWeight: 'bold', fontSize: `${Math.max(16, circleScale * 4)}px`, color: planet.color }}>
            <div className="annotation">{planet.name}</div>
          </Html>
        )}
      </group>
    </>
  );
}

function SolarSystemView({ onAsteroidSelect, selectedAsteroid }) {
  // Use the current date for planet positions
  const date = new Date();
  const planetData = usePlanetData(date);
  // Example asteroids
  const asteroids = useMemo(() => [
    { id: '1', name: 'Impactor-2025', is_potentially_hazardous_asteroid: true },
    { id: '2', name: 'Apophis', is_potentially_hazardous_asteroid: true },
    { id: '3', name: 'Bennu', is_potentially_hazardous_asteroid: false }
  ], []);
  return (
    <Canvas camera={{ position: [0, 120, 250], fov: 70, far: 2000 }}>
      <ambientLight intensity={0.3} />
      <pointLight position={[0, 0, 0]} intensity={2} />
      {planetData.map(planet => (
        <Planet key={planet.id} planet={planet} />
      ))}
      {asteroids.map(asteroid => (
        <Asteroid
          key={asteroid.id}
          asteroid={asteroid}
          onClick={onAsteroidSelect}
          isSelected={selectedAsteroid?.id === asteroid.id}
        />
      ))}
      <OrbitControls enablePan={true} enableZoom={true} enableRotate={true} />
    </Canvas>
  );
}

export default SolarSystemView;