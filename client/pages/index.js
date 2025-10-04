import dynamic from 'next/dynamic';
import { useState } from 'react';

const Sidebar = dynamic(() => import('../src/components/Sidebar'), { ssr: false });
const SolarSystemView = dynamic(() => import('../src/components/SolarSystemView'), { ssr: false });
const ImpactSimulation = dynamic(() => import('../src/components/ImpactSimulation'), { ssr: false });
const MitigationPlanner = dynamic(() => import('../src/components/MitigationPlanner'), { ssr: false });

export default function Home() {
  const [activeModule, setActiveModule] = useState('orbital');
  const [selectedAsteroid, setSelectedAsteroid] = useState(null);

  return (
    <div className="app">
      <header className="header">
        <h1>A.I.M. - Asteroid Impact Mitigation Visualizer</h1>
        <p>Interactive tool for asteroid threat assessment and mitigation planning</p>
      </header>

      <div className="main-content">
        <Sidebar
          activeModule={activeModule}
          setActiveModule={setActiveModule}
          selectedAsteroid={selectedAsteroid}
        />

        <div className="visualization">
          {activeModule === 'orbital' && (
            <SolarSystemView
              onAsteroidSelect={setSelectedAsteroid}
              selectedAsteroid={selectedAsteroid}
            />
          )}
          {activeModule === 'impact' && (
            <ImpactSimulation asteroid={selectedAsteroid} />
          )}
          {activeModule === 'mitigation' && (
            <MitigationPlanner asteroid={selectedAsteroid} />
          )}
        </div>
      </div>
    </div>
  );
}
