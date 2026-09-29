import React, { useState } from 'react';
import { Activity, ShieldCheck, ArrowRight, Lock, Mail } from 'lucide-react';
import { api, setAuthToken } from '../services/api';

interface LoginProps {
  onLoginSuccess: () => void;
}

export const LoginPage: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await api.login({ email, password });
      setAuthToken(res.access_token);
      onLoginSuccess();
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (role: 'super' | 'company') => {
    if (role === 'super') {
      setEmail('admin@aperture.io');
      setPassword('AdminPass123!');
    } else {
      setEmail('admin@aperture-auto.com');
      setPassword('CompanyPass123!');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-white border border-gray-200 rounded-2xl p-8 shadow-sm space-y-6">
        {/* Brand */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white mx-auto shadow-sm">
            <Activity className="w-7 h-7" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">
            Aperture AIoT Control Center
          </h1>
          <p className="text-xs text-gray-500">
            Enterprise Multi-Tenant AI + Hardware Safety Monitoring Platform
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-medium text-gray-700 mb-1">Corporate Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full border border-gray-200 rounded-lg pl-9 pr-3 py-2.5 focus:ring-1 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-medium text-gray-700 mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full border border-gray-200 rounded-lg pl-9 pr-3 py-2.5 focus:ring-1 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-xs cursor-pointer flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
          >
            {loading ? 'Authenticating...' : 'Sign In to Control Center'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Quick Demo Logins for Fast Review */}
        <div className="pt-4 border-t border-gray-100 text-center space-y-2">
          <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
            Quick-Login Accounts
          </div>
          <div className="flex gap-2 justify-center">
            <button
              type="button"
              onClick={() => handleQuickFill('super')}
              className="px-2.5 py-1 text-[11px] font-medium bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 rounded-md cursor-pointer transition-colors"
            >
              Super Admin
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill('company')}
              className="px-2.5 py-1 text-[11px] font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-md cursor-pointer transition-colors"
            >
              Company Admin (Automotive)
            </button>
          </div>
        </div>
      </div>

      <div className="mt-6 text-xs text-gray-400 font-mono">
        Aperture AIoT Platform &bull; ISO-Compliant Industrial Telemetry
      </div>
    </div>
  );
};
