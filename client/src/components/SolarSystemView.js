import React, { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Sphere, Text } from '@react-three/drei';
import * as THREE from 'three';

function Planet({ position, size, color, name }) {
  const meshRef = useRef();
  
  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.01;
    }
  });

  return (
    <group position={position}>
      <Sphere ref={meshRef} args={[size, 32, 32]}>
        <meshStandardMaterial color={color} />
      </Sphere>
      <Text position={[0, size + 0.5, 0]} fontSize={0.3} color="white">
        {name}
      </Text>
    </group>
  );
}

function Asteroid({ asteroid, onClick, isSelected }) {
  const meshRef = useRef();
  const [hovered, setHovered] = useState(false);
  
  // Simplified orbital position calculation
  const angle = Math.random() * Math.PI * 2;
  const distance = 8 + Math.random() * 15;
  const position = [
    Math.cos(angle) * distance,
    (Math.random() - 0.5) * 2,
    Math.sin(angle) * distance
  ];

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.x += 0.02;
      meshRef.current.rotation.y += 0.01;
    }
  });

  return (
    <group position={position}>
      <Sphere
        ref={meshRef}
        args={[0.1, 8, 8]}
        onClick={() => onClick(asteroid)}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <meshStandardMaterial 
          color={isSelected ? '#ff6b6b' : hovered ? '#ffd93d' : '#8b7355'} 
        />
      </Sphere>
      {(hovered || isSelected) && (
        <Text position={[0, 0.3, 0]} fontSize={0.2} color="white">
          {asteroid.name.replace(/[()]/g, '')}
        </Text>
      )}
    </group>
  );
}

function SolarSystemView({ onAsteroidSelect, selectedAsteroid }) {
  const [asteroids] = useState([
    { id: '1', name: 'Impactor-2025', is_potentially_hazardous_asteroid: true },
    { id: '2', name: 'Apophis', is_potentially_hazardous_asteroid: true },
    { id: '3', name: 'Bennu', is_potentially_hazardous_asteroid: false }
  ]);

  const planets = [
    { name: 'Sun', position: [0, 0, 0], size: 2, color: '#ffd700' },
    { name: 'Earth', position: [8, 0, 0], size: 0.5, color: '#6b93d6' },
    { name: 'Mars', position: [12, 0, 0], size: 0.3, color: '#cd5c5c' },
    { name: 'Jupiter', position: [20, 0, 0], size: 1.2, color: '#d2691e' }
  ];

  return (
    <Canvas camera={{ position: [0, 10, 20], fov: 60 }}>
      <ambientLight intensity={0.3} />
      <pointLight position={[0, 0, 0]} intensity={2} />
      
      {planets.map(planet => (
        <Planet key={planet.name} {...planet} />
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