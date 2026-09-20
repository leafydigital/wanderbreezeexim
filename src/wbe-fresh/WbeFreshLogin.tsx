import { useState } from 'react';
import { Eye, EyeOff, Lock, User, Sprout, ArrowLeft } from 'lucide-react';
import { useAuth } from '../crm/lib/auth';

export default function WbeFreshLogin({ onBack }: { onBack: () => void }) {
  const { signIn } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!username.trim() || !password.trim()) {
      setError('Username and password are required');
      return;
    }
    setLoading(true);
    const err = await signIn(username, password);
    if (err) setError(err);
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="relative w-full max-w-md">
        <button onClick={onBack} className="flex items-center gap-1.5 text-slate-300 hover:text-white text-sm mb-6 transition-colors">
          <ArrowLeft size={14} /> Back to price list
        </button>

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-teal-600 rounded-2xl mb-4 shadow-lg">
            <Sprout size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">WBE Fresh</h1>
          <p className="text-slate-400 text-sm mt-1">Supplier &amp; Staff Login</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="px-8 py-6 border-b border-gray-100 bg-gray-50">
            <h2 className="text-base font-semibold text-gray-800">Sign in to your account</h2>
            <p className="text-xs text-gray-500 mt-0.5">Enter your username and password to continue</p>
          </div>

          <form onSubmit={handleSubmit} className="px-8 py-6 space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Username</label>
              <div className="relative">
                <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  autoComplete="username"
                  autoFocus
                  className="w-full border border-gray-200 rounded-lg pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-shadow"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  className="w-full border border-gray-200 rounded-lg pl-9 pr-10 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-shadow"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-red-500 rounded-full flex-shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-teal-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-teal-700 active:bg-teal-800 disabled:opacity-60 transition-colors mt-2 shadow-sm"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Signing in...
                </span>
              ) : 'Sign In'}
            </button>
          </form>
        </div>

        <p className="text-center text-slate-500 text-xs mt-6">
          &copy; {new Date().getFullYear()} Wander Breeze Exim. All rights reserved.
        </p>
      </div>
    </div>
  );
}
