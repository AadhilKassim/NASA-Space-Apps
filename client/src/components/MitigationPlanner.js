import React, { useState } from 'react';

function MitigationPlanner({ asteroid }) {
  const [selectedStrategy, setSelectedStrategy] = useState(null);
  const [missionStatus, setMissionStatus] = useState('planning');

  const strategies = [
    {
      id: 'kinetic',
      name: 'Kinetic Impactor',
      description: 'Launch a spacecraft to collide with the asteroid (like NASA DART)',
      cost: '$300M - $500M',
      timeRequired: '3-5 years',
      successRate: '85%',
      icon: '🚀'
    },
    {
      id: 'gravity',
      name: 'Gravity Tractor',
      description: 'Use spacecraft gravity to slowly pull asteroid off course',
      cost: '$1B - $2B',
      timeRequired: '10-15 years',
      successRate: '95%',
      icon: '🛰️'
    },
    {
      id: 'nuclear',
      name: 'Nuclear Deflection',
      description: 'Nuclear explosion near asteroid to change trajectory',
      cost: '$2B - $5B',
      timeRequired: '2-3 years',
      successRate: '90%',
      icon: '💥'
    }
  ];

  const handleLaunchMission = () => {
    setMissionStatus('launched');
    setTimeout(() => setMissionStatus('success'), 3000);
  };

  if (!asteroid) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h2>Mitigation Planning</h2>
        <p>Select an asteroid to plan mitigation strategies</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', height: '100%', overflow: 'auto' }}>
      <h2>Mitigation Planning: {asteroid.name}</h2>
      
      <div className="strategy-grid">
        {strategies.map(strategy => (
          <div
            key={strategy.id}
            className={`strategy-card ${selectedStrategy?.id === strategy.id ? 'selected' : ''}`}
            onClick={() => setSelectedStrategy(strategy)}
          >
            <h3>{strategy.icon} {strategy.name}</h3>
            <p style={{ margin: '1rem 0', color: '#ccc' }}>{strategy.description}</p>
            <div style={{ fontSize: '0.9rem', opacity: '0.8' }}>
              <p><strong>Cost:</strong> {strategy.cost}</p>
              <p><strong>Time Required:</strong> {strategy.timeRequired}</p>
              <p><strong>Success Rate:</strong> {strategy.successRate}</p>
            </div>
          </div>
        ))}
      </div>

      {selectedStrategy && (
        <div className="card" style={{ marginTop: '2rem' }}>
          <h3>Mission Planning: {selectedStrategy.name}</h3>
          <p>Selected strategy for deflecting {asteroid.name}</p>
          
          <div style={{ marginTop: '1rem' }}>
            <h4>International Cooperation Required:</h4>
            <div className="agency-chips">
              {['🇺🇸 NASA', '🇪🇺 ESA', '🇯🇵 JAXA', '🇷🇺 Roscosmos'].map(agency => (
                <span key={agency} className="chip">
                  {agency}
                </span>
              ))}
            </div>
          </div>

          <button
            onClick={handleLaunchMission}
            disabled={missionStatus !== 'planning'}
            className={missionStatus === 'planning' ? 'btn-primary' : 'btn-success'}
            style={{ marginTop: '1rem', fontSize: '1rem' }}
          >
            {missionStatus === 'planning' && 'Launch Mission'}
            {missionStatus === 'launched' && 'Mission in Progress...'}
            {missionStatus === 'success' && '✅ Mission Successful!'}
          </button>

          {missionStatus === 'success' && (
            <div className="card" style={{ marginTop: '1rem', background: 'linear-gradient(135deg, #388e3c, #4caf50)' }}>
              <div style={{ padding: '1rem' }}>
                <p><strong>Success!</strong> {asteroid.name} trajectory altered by 0.003°</p>
                <p>Impact probability reduced from 1:2,700 to 1:50,000</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default MitigationPlanner;