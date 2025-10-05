import dynamic from 'next/dynamic';
import { useState } from 'react';
//import NavigationBar from '../src/components/NavigationBar';
import TimelineSlider from '../src/components/TimelineSlider';

const Sidebar = dynamic(() => import('../src/components/Sidebar'), { ssr: false });
const SolarSystemView = dynamic(() => import('../src/components/SolarSystemView'), { ssr: false });
const ImpactSimulation = dynamic(() => import('../src/components/ImpactSimulation'), { ssr: false });
const MitigationPlanner = dynamic(() => import('../src/components/MitigationPlanner'), { ssr: false });

export default function Home() {
  const [activeModule, setActiveModule] = useState('orbital');
  const [selectedAsteroid, setSelectedAsteroid] = useState(null);
  const [date, setDate] = useState(new Date());

  return (
    <div className="app" style={{ backgroundColor: '#000000', color: 'white', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* //<NavigationBar /> */}
      <header className="header" style={{ padding: '10px 20px', fontFamily: "'Roboto', sans-serif" }}>
        <h1>A.I.M. - Asteroid Impact Mitigation Visualizer</h1>
        <p>Interactive tool for asteroid threat assessment and mitigation planning</p>
      </header>

      <div className="main-content" style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <Sidebar
          activeModule={activeModule}
          setActiveModule={setActiveModule}
          selectedAsteroid={selectedAsteroid}
          setSelectedAsteroid={setSelectedAsteroid}
          style={{ width: '300px', overflowY: 'auto' }}
        />

        <div className="visualization" style={{ flex: 1, position: 'relative' }}>
          {activeModule === 'orbital' && (
            <>
              <SolarSystemView
                onAsteroidSelect={setSelectedAsteroid}
                selectedAsteroid={selectedAsteroid}
                date={date}
              />
              <TimelineSlider date={date} onChange={setDate} />
            </>
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
