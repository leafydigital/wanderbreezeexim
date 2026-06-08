/**
 * InactivityWarning.tsx  (repurposed — no longer shows inactivity warnings)
 *
 * Now acts as a BeforeUnload Guard:
 *  – Registers a window `beforeunload` handler when a lead search is running
 *  – Shows a custom in-app confirmation modal when the user clicks the
 *    sidebar Sign-Out button while a search is running
 *  – Exposes `useSearchGuard` hook so SearchPage can register/clear the guard
 *
 * Usage in SearchPage:
 *   import { useSearchGuard } from '../../components/InactivityWarning';
 *   const { setSearchRunning } = useSearchGuard();
 *   setSearchRunning(true);   // when search + enrichment starts
 *   setSearchRunning(false);  // when it finishes
 */

import {
  createContext, useContext, useState, useEffect, useCallback, useRef,
} from 'react';
import { AlertTriangle, X, LogOut, Search } from 'lucide-react';
import { useAuth } from '../lib/auth';

// ── Context ───────────────────────────────────────────────────

interface SearchGuardCtx {
  setSearchRunning: (running: boolean) => void;
  isSearchRunning: boolean;
}

const SearchGuardContext = createContext<SearchGuardCtx>({
  setSearchRunning: () => {},
  isSearchRunning: false,
});

export function useSearchGuard() {
  return useContext(SearchGuardContext);
}

// ── Provider + Guard component ────────────────────────────────

export default function InactivityWarning({ children }: { children?: React.ReactNode }) {
  const { user, signOut } = useAuth();
  const [isSearchRunning, setIsSearchRunning_] = useState(false);
  const [showSignOutModal, setShowSignOutModal] = useState(false);
  const isRunningRef = useRef(false); // sync ref for beforeunload (closure-safe)

  const setSearchRunning = useCallback((running: boolean) => {
    isRunningRef.current = running;
    setIsSearchRunning_(running);
  }, []);

  // ── beforeunload: warn browser-level close/refresh ────────
  useEffect(() => {
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      if (!isRunningRef.current || !user) return;
      const msg = 'A lead search is still running. If you close this tab, the search will be lost. Are you sure?';
      e.preventDefault();
      e.returnValue = msg; // Required for Chrome/Firefox to show the dialog
      return msg;
    }

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [user]);

  // ── Intercept Sign Out while search is running ────────────
  // We patch signOut via context so Layout's sign-out button shows a modal
  // instead of immediately logging out. This is handled inside the guard modal.

  if (!user) return <>{children}</>;

  return (
    <SearchGuardContext.Provider value={{ setSearchRunning, isSearchRunning }}>
      {children}

      {/* ── Sign-out confirmation modal (shown only when signout is triggered
           from outside while search is running — see Layout patch below) ── */}
      {showSignOutModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 99999,
          background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(3px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 16,
        }}>
          <div style={{
            background: '#fff', borderRadius: 16, padding: '32px 28px',
            maxWidth: 420, width: '100%',
            boxShadow: '0 24px 64px rgba(0,0,0,0.25)',
            textAlign: 'center',
          }}>
            <div style={{
              width: 60, height: 60, borderRadius: '50%',
              background: '#FEF3C7', display: 'flex', alignItems: 'center',
              justifyContent: 'center', margin: '0 auto 20px',
            }}>
              <AlertTriangle size={28} color="#D97706" />
            </div>
            <h2 style={{ fontSize: 19, fontWeight: 700, color: '#111', marginBottom: 10 }}>
              Sign out while search is running?
            </h2>
            <p style={{ fontSize: 14, color: '#6B7280', marginBottom: 8, lineHeight: 1.65 }}>
              A <strong>lead search is currently in progress</strong>. Signing out now will cancel it and you'll lose the results found so far.
            </p>
            <p style={{ fontSize: 13, color: '#9CA3AF', marginBottom: 28 }}>
              Export or save your results first, or wait for the search to finish.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setShowSignOutModal(false)}
                style={{
                  flex: 1, padding: '11px 0', borderRadius: 8,
                  border: '1px solid #E5E7EB', background: '#fff',
                  color: '#374151', fontSize: 14, fontWeight: 600, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                }}>
                <Search size={14} /> Keep Searching
              </button>
              <button
                onClick={() => { setShowSignOutModal(false); setSearchRunning(false); signOut(); }}
                style={{
                  flex: 1, padding: '11px 0', borderRadius: 8, border: 'none',
                  background: '#DC2626', color: '#fff', fontSize: 14,
                  fontWeight: 600, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                }}>
                <LogOut size={14} /> Sign Out Anyway
              </button>
            </div>
          </div>
        </div>
      )}
    </SearchGuardContext.Provider>
  );
}

// ── Guarded sign-out hook (used by Layout) ────────────────────
// Layout calls useGuardedSignOut() instead of signOut() directly.
// If a search is running it opens the modal; otherwise signs out immediately.

export function useGuardedSignOut() {
  const { isSearchRunning } = useSearchGuard();
  const { signOut } = useAuth();
  const [showModal, setShowModal] = useState(false);

  const guardedSignOut = useCallback(() => {
    if (isSearchRunning) {
      setShowModal(true);
    } else {
      signOut();
    }
  }, [isSearchRunning, signOut]);

  return { guardedSignOut, showModal, setShowModal };
}
