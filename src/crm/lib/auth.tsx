import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { supabase } from './supabase';

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: Record<string, boolean>;
}

export interface AppUser {
  id: string;
  name: string;
  username: string;
  email: string;
  phone: string;
  role_id: string | null;
  is_active: boolean;
  avatar_url: string;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  roles?: Role;
}

// ─────────────────────────────────────────────────────────────
// SESSION STRATEGY
//  • sessionStorage (not localStorage) — clears when browser/tab closes
//  • 30-minute inactivity timeout — auto logout if no mouse/key/touch
//  • On load: if sessionStorage has user, restore. Otherwise → Login.
// ─────────────────────────────────────────────────────────────
const STORAGE_KEY        = 'wbe_session';
const INACTIVITY_MINUTES = 30;
const INACTIVITY_MS      = INACTIVITY_MINUTES * 60 * 1000;

interface AuthContextValue {
  user:        AppUser | null;
  role:        Role | null;
  loading:     boolean;
  signIn:      (username: string, password: string) => Promise<string | null>;
  signOut:     () => void;
  refreshUser: () => Promise<void>;
  can:         (module: string) => boolean;
  isAdmin:     () => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user,    setUser]    = useState<AppUser | null>(null);
  const [role,    setRole]    = useState<Role | null>(null);
  const [loading, setLoading] = useState(true);

  // Inactivity timer ref
  const inactivityTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Sign out ──────────────────────────────────────────────
  const signOut = useCallback(async () => {
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    await supabase.auth.signOut();
    setUser(null);
    setRole(null);
    sessionStorage.removeItem(STORAGE_KEY);
  }, []);

  // ── Reset inactivity timer on every user action ───────────
  const resetTimer = useCallback(() => {
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    inactivityTimer.current = setTimeout(() => {
      // Auto logout after INACTIVITY_MINUTES of no activity
      signOut();
    }, INACTIVITY_MS);
  }, [signOut]);

  // ── Attach/detach activity listeners ─────────────────────
  useEffect(() => {
    if (!user) return;

    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click'];
    events.forEach(e => window.addEventListener(e, resetTimer, { passive: true }));
    resetTimer(); // Start timer immediately on login

    return () => {
      events.forEach(e => window.removeEventListener(e, resetTimer));
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    };
  }, [user, resetTimer]);

  // ── On mount: restore session from sessionStorage ─────────
  // sessionStorage is cleared automatically when browser/tab closes
  useEffect(() => {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed: AppUser = JSON.parse(stored);
        setUser(parsed);
        setRole((parsed.roles as Role) ?? null);
        restoreSupabaseSession();
      } catch {
        sessionStorage.removeItem(STORAGE_KEY);
      }
    }
    setLoading(false);
  }, []);

  async function restoreSupabaseSession() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      await supabase.auth.signInWithPassword({
        email:    import.meta.env.VITE_APP_SERVICE_EMAIL,
        password: import.meta.env.VITE_APP_SERVICE_PASSWORD,
      });
    }
  }

  // ── Sign in ───────────────────────────────────────────────
  async function signIn(username: string, password: string): Promise<string | null> {
    const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/custom-login`;
    try {
      const res  = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) return data.error ?? 'Invalid username or password';

      const { error: authError } = await supabase.auth.signInWithPassword({
        email:    import.meta.env.VITE_APP_SERVICE_EMAIL,
        password: import.meta.env.VITE_APP_SERVICE_PASSWORD,
      });
      if (authError) console.error('Supabase service auth failed:', authError.message);

      const appUser: AppUser = data.user;
      setUser(appUser);
      setRole((appUser.roles as Role) ?? null);

      // ✅ sessionStorage — NOT localStorage — clears on browser close
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(appUser));
      return null;
    } catch {
      return 'Network error. Please try again.';
    }
  }

  // ── Refresh user ──────────────────────────────────────────
  async function refreshUser() {
    if (!user) return;
    const { data } = await supabase
      .from('users')
      .select('id, name, username, email, phone, role_id, is_active, avatar_url, last_login_at, created_at, updated_at, deleted_at, roles(id, name, description, permissions)')
      .eq('id', user.id)
      .maybeSingle();
    if (data) {
      const updated = data as unknown as AppUser;
      setUser(updated);
      setRole((updated.roles as Role) ?? null);
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    }
  }

  function can(module: string): boolean {
    if (!role) return false;
    if (role.name === 'Admin') return true;
    return role.permissions?.[module] === true;
  }

  function isAdmin(): boolean {
    return role?.name === 'Admin';
  }

  return (
    <AuthContext.Provider value={{ user, role, loading, signIn, signOut, refreshUser, can, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
