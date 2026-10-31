import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Sparkles, Mail, Lock, ArrowRight, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, register } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('expired') === 'true') {
      setError('Your session has expired. Please log in again.');
    }
  }, [location]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }

    if (!password.trim()) {
      setError('Please enter your password.');
      return;
    }

    setLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      if (!err.response) {
        setError('Unable to connect to the server. Please try again.');
      } else if (err.response.status === 404) {
        setError('Account not found. Please register first.');
      } else if (err.response.status === 401) {
        setError('Incorrect password. Please try again.');
      } else {
        setError(err.response?.data?.error || 'Unable to connect to the server. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setError('');
    setLoading(true);
    const demoEmail = 'judge.demo@maskoff.ai';
    const demoPass = 'DemoPassword123!';

    try {
      await login(demoEmail, demoPass);
      navigate('/dashboard');
    } catch (err) {
      try {
        await register('Hackathon Evaluator', demoEmail, demoPass, [
          'Prepare for interviews',
          'Handle difficult conversations'
        ]);
        navigate('/dashboard');
      } catch (regErr) {
        setError('Failed to initialize demo account');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-1.5">
          <div 
            onClick={() => navigate('/')} 
            className="inline-flex items-center space-x-2.5 cursor-pointer group mb-1"
          >
            <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center shadow-sm">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-extrabold text-xl tracking-tight text-text-main">MaskOff AI</span>
          </div>
          <p className="text-xs text-text-muted">Welcome back. Practise being yourself under pressure.</p>
        </div>

        {/* Minimal Clean Card */}
        <div className="clean-card p-6 sm:p-7 shadow-card space-y-5">
          <h2 className="text-lg font-bold text-text-main">Sign In</h2>

          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-center space-x-2 text-rose-700 text-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-text-main mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 text-text-muted absolute left-3 top-3" />
                <input
                  type="email"
                  placeholder="alex@domain.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 clean-input text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-main mb-1">Password</label>
              <div className="relative">
                <Lock className="w-3.5 h-3.5 text-text-muted absolute left-3 top-3" />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 clean-input text-xs"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-semibold text-xs shadow-subtle transition flex items-center justify-center space-x-1.5 disabled:opacity-50"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* Quick Demo Login */}
          <div className="pt-3 border-t border-border">
            <button
              type="button"
              onClick={handleDemoLogin}
              disabled={loading}
              className="w-full py-2 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-border text-xs font-semibold text-primary-700 flex items-center justify-center space-x-1.5 transition"
            >
              <Sparkles className="w-3.5 h-3.5 text-primary-600" />
              <span>1-Click Hackathon Evaluator Login</span>
            </button>
          </div>

          <p className="text-center text-xs text-text-muted">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary-600 font-semibold hover:underline">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
