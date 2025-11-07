
import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';

const TimelineSlider = ({ date, onChange, timeScale, onTimeScaleChange, isPlaying, onPlayPause }) => {
  const [mounted, setMounted] = useState(false);
  const animationRef = useRef(null);
  const lastTimestampRef = useRef(Date.now());
  
  useEffect(() => {
    setMounted(true);
  }, []);

  // Auto-advance time when playing
  useEffect(() => {
    if (isPlaying) {
      lastTimestampRef.current = Date.now();
      
      const animate = () => {
        const now = Date.now();
        const deltaTime = (now - lastTimestampRef.current) / 1000; // seconds
        lastTimestampRef.current = now;
        
        // Advance simulation time based on timeScale
        const newDate = new Date(date.getTime() + timeScale * deltaTime * 1000);
        onChange(newDate);
        
        animationRef.current = requestAnimationFrame(animate);
      };
      
      animationRef.current = requestAnimationFrame(animate);
      
      return () => {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
      };
    }
  }, [isPlaying, timeScale]); // Removed date and onChange from deps

  const handleLiveClick = useCallback(() => {
    onChange(new Date());
    onPlayPause(false);
  }, [onChange, onPlayPause]);

  const timeScaleOptions = useMemo(() => [
    { label: '1 day/s', value: 86400 },
    { label: '1 week/s', value: 604800 },
    { label: '2 weeks/s', value: 1209600 },
    { label: '1 month/s', value: 2592000 },
    { label: '3 months/s', value: 7776000 },
  ], []);

  const cycleTimeScale = useCallback(() => {
    const currentIndex = timeScaleOptions.findIndex(opt => opt.value === timeScale);
    const nextIndex = (currentIndex + 1) % timeScaleOptions.length;
    onTimeScaleChange(timeScaleOptions[nextIndex].value);
  }, [timeScale, onTimeScaleChange, timeScaleOptions]);

  const currentTimeScaleLabel = timeScaleOptions.find(opt => opt.value === timeScale)?.label || '1 day/s';

  const handleSliderChange = useCallback((e) => {
    const newDate = new Date(date.getFullYear(), 0, 1);
    newDate.setDate(parseInt(e.target.value, 10) + 1);
    onChange(newDate);
    onPlayPause(false);
  }, [date, onChange, onPlayPause]);

  const handlePlayPauseClick = useCallback(() => {
    onPlayPause(!isPlaying);
  }, [isPlaying, onPlayPause]);

  return (
    <div style={styles.container}>
      <button style={styles.liveButton} onClick={handleLiveClick}>
        LIVE
      </button>
      
      <button 
        style={{...styles.playButton, backgroundColor: isPlaying ? '#ff4444' : '#44ff44'}} 
        onClick={handlePlayPauseClick}
      >
        {isPlaying ? '⏸' : '▶'}
      </button>
      
      <div style={styles.dateDisplay}>{date.toDateString()}</div>
      
      <input
        type="range"
        min="0"
        max="365"
        value={Math.floor((date - new Date(date.getFullYear(), 0, 1)) / (1000 * 60 * 60 * 24))}
        onChange={handleSliderChange}
        style={styles.slider}
      />
      
      <div style={styles.timeDisplay}>
        {mounted ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
      </div>
      
      <button style={styles.speedControl} onClick={cycleTimeScale}>
        {currentTimeScaleLabel}
      </button>
    </div>
  );
};
TimelineSlider.displayName = 'TimelineSlider';

const styles = {
  container: {
    position: 'absolute',
    bottom: '20px',
    left: '50%',
    transform: 'translateX(-50%)',
    backgroundColor: 'rgba(0,0,0,0.8)',
    padding: '10px 20px',
    borderRadius: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
    color: 'white',
    fontFamily: "'Roboto', sans-serif",
    fontSize: '14px',
    userSelect: 'none',
    zIndex: 100,
  },
  liveButton: {
    backgroundColor: '#222',
    border: '1px solid #0f0',
    borderRadius: '12px',
    padding: '5px 10px',
    color: '#0f0',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  playButton: {
    border: 'none',
    borderRadius: '50%',
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
    transition: 'all 0.2s',
  },
  dateDisplay: {
    fontWeight: 'bold',
    minWidth: '140px',
  },
  slider: {
    width: '300px',
    cursor: 'pointer',
  },
  timeDisplay: {
    minWidth: '60px',
    textAlign: 'center',
  },
  speedControl: {
    backgroundColor: '#333',
    border: '1px solid #666',
    borderRadius: '12px',
    padding: '5px 10px',
    color: '#fff',
    cursor: 'pointer',
    fontWeight: 'bold',
    transition: 'all 0.2s',
  },
};

export default TimelineSlider;
