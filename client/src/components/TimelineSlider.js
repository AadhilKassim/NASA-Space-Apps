
import React, { useEffect, useState } from 'react';

const TimelineSlider = ({ date, onChange }) => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  return (
    <div style={styles.container}>
      <button style={styles.liveButton}>LIVE</button>
      <div style={styles.dateDisplay}>{date.toDateString()}</div>
      <input
        type="range"
        min="0"
        max="365"
        value={Math.floor((date - new Date(date.getFullYear(), 0, 1)) / (1000 * 60 * 60 * 24))}
        onChange={e => {
          const newDate = new Date(date.getFullYear(), 0, 1);
          newDate.setDate(parseInt(e.target.value, 10));
          onChange(newDate);
        }}
        style={styles.slider}
      />
      <div style={styles.timeDisplay}>
        {mounted ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
      </div>
      <div style={styles.speedControl}>6 wks/s</div>
    </div>
  );
};

const styles = {
  container: {
    position: 'absolute',
    bottom: '20px',
    left: '50%',
    transform: 'translateX(-50%)',
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: '10px 20px',
    borderRadius: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
    color: 'white',
    fontFamily: "'Roboto', sans-serif",
    fontSize: '14px',
    userSelect: 'none',
  },
  liveButton: {
    backgroundColor: '#222',
    border: 'none',
    borderRadius: '12px',
    padding: '5px 10px',
    color: '#0f0',
    fontWeight: 'bold',
    cursor: 'pointer',
  },
  dateDisplay: {
    fontWeight: 'bold',
  },
  slider: {
    width: '300px',
  },
  timeDisplay: {
    minWidth: '60px',
    textAlign: 'center',
  },
  speedControl: {
    backgroundColor: '#333',
    borderRadius: '12px',
    padding: '5px 10px',
  },
};

export default TimelineSlider;
