import React, { useState } from 'react';
import SolarSystemView from './components/SolarSystemView';
import ImpactSimulation from './components/ImpactSimulation';
import MitigationPlanner from './components/MitigationPlanner';
import Sidebar from './components/Sidebar';

function App() {
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

export default App;