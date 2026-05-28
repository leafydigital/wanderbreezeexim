/**
 * InactivityWarning.tsx
 * Shows a countdown modal 2 minutes before auto-logout.
 * User can click "Stay Logged In" to reset the timer.
 */
import { useEffect, useState, useCallback, useRef } from 'react';
import { Clock, LogOut } from 'lucide-react';
import { useAuth } from '../lib/auth';

const INACTIVITY_MS     = 30 * 60 * 1000; // 30 min total
const WARNING_BEFORE_MS =  2 * 60 * 1000; // warn 2 min before
const WARNING_AT_MS     = INACTIVITY_MS - WARNING_BEFORE_MS; // show at 28 min

export default function InactivityWarning() {
  const { user, signOut } = useAuth();
  const [showWarning, setShowWarning] = useState(false);
  const [countdown,   setCountdown]   = useState(120); // seconds
  const warningTimer  = useRef<ReturnType<typeof setTimeout>  | null>(null);
  const countdownInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearAll = () => {
    if (warningTimer.current)      clearTimeout(warningTimer.current);
    if (countdownInterval.current) clearInterval(countdownInterval.current);
  };

  const resetWarning = useCallback(() => {
    clearAll();
    setShowWarning(false);
    setCountdown(120);

    // Schedule warning to appear at 28 minutes
    warningTimer.current = setTimeout(() => {
      setShowWarning(true);
      setCountdown(120);
      // Start countdown
      countdownInterval.current = setInterval(() => {
        setCountdown(c => {
          if (c <= 1) {
            clearInterval(countdownInterval.current!);
            signOut();
            return 0;
          }
          return c - 1;
        });
      }, 1000);
    }, WARNING_AT_MS);
  }, [signOut]);

  // Reset warning timer on any user activity
  useEffect(() => {
    if (!user) { clearAll(); setShowWarning(false); return; }

    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click'];
    events.forEach(e => window.addEventListener(e, resetWarning, { passive: true }));
    resetWarning();

    return () => {
      events.forEach(e => window.removeEventListener(e, resetWarning));
      clearAll();
    };
  }, [user, resetWarning]);

  if (!showWarning || !user) return null;

  const mins = Math.floor(countdown / 60);
  const secs = countdown % 60;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 99999,
      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(3px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        background: '#fff', borderRadius: 16, padding: '32px 36px',
        maxWidth: 400, width: '90%', textAlign: 'center',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
      }}>
        {/* Icon */}
        <div style={{
          width: 64, height: 64, borderRadius: '50%',
          background: '#FEF3C7', display: 'flex', alignItems: 'center',
          justifyContent: 'center', margin: '0 auto 20px',
        }}>
          <Clock size={30} style={{ color: '#D97706' }} />
        </div>

        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#111', marginBottom: 8 }}>
          Session Expiring Soon
        </h2>
        <p style={{ fontSize: 14, color: '#6B7280', marginBottom: 24, lineHeight: 1.6 }}>
          You've been inactive. You'll be logged out automatically in:
        </p>

        {/* Countdown */}
        <div style={{
          fontSize: 42, fontWeight: 800, color: countdown <= 30 ? '#DC2626' : '#D97706',
          marginBottom: 28, fontVariantNumeric: 'tabular-nums',
          transition: 'color 0.3s',
        }}>
          {mins > 0 ? `${mins}:${String(secs).padStart(2, '0')}` : `${secs}s`}
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <button
            onClick={resetWarning}
            style={{
              flex: 1, padding: '11px 20px', borderRadius: 8, border: 'none',
              background: '#0F9B6E', color: '#fff', fontSize: 14,
              fontWeight: 600, cursor: 'pointer',
            }}
          >
            Stay Logged In
          </button>
          <button
            onClick={signOut}
            style={{
              flex: 1, padding: '11px 20px', borderRadius: 8,
              border: '1px solid #e5e7eb', background: '#fff',
              color: '#374151', fontSize: 14, fontWeight: 500,
              cursor: 'pointer', display: 'flex', alignItems: 'center',
              justifyContent: 'center', gap: 6,
            }}
          >
            <LogOut size={14} /> Log Out Now
          </button>
        </div>
      </div>
    </div>
  );
}
