import { useState, useEffect, useCallback, useRef } from 'react';
import './SessionTimer.css';

interface SessionTimerProps {
  remainingMinutes: number;
  isActive: boolean;
  onTimeUp: () => void;
  warningThresholdSeconds?: number;
}

export function SessionTimer({
  remainingMinutes,
  isActive,
  onTimeUp,
  warningThresholdSeconds = 10,
}: SessionTimerProps) {
  const [remainingSeconds, setRemainingSeconds] = useState(Math.floor(remainingMinutes * 60));
  const [hasPlayedWarning, setHasPlayedWarning] = useState(false);
  const [isWarning, setIsWarning] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const initialSecondsRef = useRef<number>(Math.floor(remainingMinutes * 60));

  // Reset when session starts
  useEffect(() => {
    if (isActive) {
      const seconds = Math.floor(remainingMinutes * 60);
      setRemainingSeconds(seconds);
      initialSecondsRef.current = seconds;
      startTimeRef.current = Date.now();
      setHasPlayedWarning(false);
      setIsWarning(false);
    }
  }, [isActive, remainingMinutes]);

  // Play warning sound
  const playWarningSound = useCallback(() => {
    try {
      // Create audio context on demand
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;

      // Play three short beeps
      const playBeep = (time: number, frequency: number, duration: number) => {
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.frequency.value = frequency;
        oscillator.type = 'sine';

        gainNode.gain.setValueAtTime(0.3, time);
        gainNode.gain.exponentialRampToValueAtTime(0.01, time + duration);

        oscillator.start(time);
        oscillator.stop(time + duration);
      };

      const now = ctx.currentTime;
      playBeep(now, 880, 0.15);        // A5
      playBeep(now + 0.2, 880, 0.15);  // A5
      playBeep(now + 0.4, 1760, 0.3);  // A6 (longer)

    } catch (error) {
      console.error('Could not play warning sound:', error);
    }
  }, []);

  // Countdown timer
  useEffect(() => {
    if (!isActive || remainingSeconds <= 0) return;

    const interval = setInterval(() => {
      // Calculate based on elapsed time for accuracy
      if (startTimeRef.current) {
        const elapsed = (Date.now() - startTimeRef.current) / 1000;
        const newRemaining = Math.max(0, initialSecondsRef.current - Math.floor(elapsed));
        setRemainingSeconds(newRemaining);

        // Warning state
        if (newRemaining <= warningThresholdSeconds && newRemaining > 0) {
          setIsWarning(true);
          if (!hasPlayedWarning) {
            playWarningSound();
            setHasPlayedWarning(true);
          }
        }

        // Time's up
        if (newRemaining <= 0) {
          onTimeUp();
          clearInterval(interval);
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive, remainingSeconds, warningThresholdSeconds, hasPlayedWarning, playWarningSound, onTimeUp]);

  if (!isActive) return null;

  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const percentRemaining = (remainingSeconds / initialSecondsRef.current) * 100;

  return (
    <div className={`session-timer ${isWarning ? 'warning' : ''} ${remainingSeconds <= 0 ? 'expired' : ''}`}>
      <div className="timer-display">
        <span className="timer-icon">{isWarning ? '!' : ''}</span>
        <span className="timer-value">
          {minutes}:{seconds.toString().padStart(2, '0')}
        </span>
        <span className="timer-label">remaining</span>
      </div>
      <div className="timer-bar">
        <div
          className="timer-bar-fill"
          style={{ width: `${percentRemaining}%` }}
        />
      </div>
    </div>
  );
}
