'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';

function LoginForm() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });

    if (res.ok) {
      const redirect = searchParams.get('redirect') || '/';
      router.push(redirect);
      router.refresh();
    } else {
      setError('Incorrect password. Please try again.');
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="bg-white rounded-2xl p-10 w-full max-w-sm shadow-xl border border-gray-100">
        {/* Logo mark */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 mx-auto mb-4 flex items-center justify-center shadow-md">
            <span className="text-white text-lg font-bold tracking-tight">B</span>
          </div>
          <h1 className="text-gray-900 text-2xl font-bold mb-1 tracking-tight">
            BSB RFP Workbook
          </h1>
          <p className="text-gray-400 text-sm">
            Brim Financial — Internal Use
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="mb-5">
            <label
              htmlFor="password"
              className="block text-gray-500 text-xs font-semibold uppercase tracking-wide mb-2"
            >
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                autoFocus
                autoComplete="current-password"
                className={`w-full px-4 py-3 bg-white border-2 rounded-xl text-gray-900 text-sm outline-none transition-colors
                  ${error
                    ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
                    : 'border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                  } pr-11`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {error && (
              <p className="text-red-500 text-xs mt-2 font-medium">
                {error}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || !password}
            className={`w-full py-3 text-white rounded-xl text-sm font-semibold transition-all
              ${loading || !password
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 shadow-sm hover:shadow-md'
              }`}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Verifying…
              </span>
            ) : 'Enter Workbook'}
          </button>
        </form>

        <p className="text-center text-xs text-gray-400 mt-6">
          Confidential · Brim Financial
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
