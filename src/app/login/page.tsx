'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Use direct fetch for login since we don't have auth tokens yet
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const data = await response.json();
        // Store JWT tokens in localStorage
        localStorage.setItem('accessToken', data.tokens.accessToken);
        localStorage.setItem('refreshToken', data.tokens.refreshToken);
        router.push('/editor');
      } else {
        const data = await response.json();
        setError(data.message || 'Invalid email or password');
      }
    } catch {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    setIsRegistering(true);
    setError('');

    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, role: 'admin' }),
      });

      if (response.ok) {
        const data = await response.json();
        // Store JWT tokens in localStorage
        localStorage.setItem('accessToken', data.tokens.accessToken);
        localStorage.setItem('refreshToken', data.tokens.refreshToken);
        router.push('/editor');
      } else {
        const data = await response.json();
        setError(data.message || 'Registration failed');
      }
    } catch {
      setError('An error occurred. Please try again.');
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-slate-800 mb-2">Login</h1>
            <p className="text-slate-600">Enter your credentials to access the editor</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
                Email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Enter your email"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-2">
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Enter your password"
                required
              />
            </div>

            {error && (
              <div className="px-4 py-3 rounded-lg bg-red-50 border border-red-200">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || isRegistering}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          <div className="mt-4">
            <button
              onClick={handleRegister}
              disabled={loading || isRegistering}
              className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isRegistering ? 'Registering...' : 'Register'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
