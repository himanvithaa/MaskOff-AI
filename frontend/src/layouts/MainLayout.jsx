import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { 
  Home, 
  Layers, 
  Dna, 
  TrendingUp, 
  Target, 
  Heart, 
  User, 
  Settings, 
  LogOut, 
  Menu, 
  X, 
  Mic, 
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const NAV_ITEMS = [
  { name: 'Home', path: '/dashboard', icon: Home },
  { name: 'Practice', path: '/scenarios', icon: Layers },
  { name: 'Weakness DNA', path: '/weakness-dna', icon: Dna, highlight: true },
  { name: 'Progress', path: '/growth', icon: TrendingUp },
  { name: 'Missions', path: '/missions', icon: Target },
  { name: 'Profile', path: '/settings', icon: User },
];

export default function MainLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-background text-text-main overflow-hidden">
      {/* Minimal Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-60 bg-white border-r border-border z-20">
        {/* Brand */}
        <div className="p-5 flex items-center justify-between border-b border-border">
          <div className="flex items-center space-x-2.5 cursor-pointer" onClick={() => navigate('/dashboard')}>
            <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center shadow-sm">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="font-extrabold text-base tracking-tight text-text-main">
                MaskOff AI
              </span>
              <p className="text-[10px] text-text-muted font-medium uppercase tracking-wider">AI Coach</p>
            </div>
          </div>
        </div>

        {/* Primary Practice CTA */}
        <div className="p-3">
          <button
            onClick={() => navigate('/scenarios')}
            className="w-full py-2.5 px-3 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-medium text-xs flex items-center justify-center space-x-2 shadow-subtle transition-all transform active:scale-95"
          >
            <Mic className="w-4 h-4" />
            <span>Start Practice</span>
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                    isActive
                      ? 'bg-primary-50 text-primary-700 font-bold'
                      : 'text-text-muted hover:text-text-main hover:bg-slate-50'
                  }`
                }
              >
                <div className="flex items-center space-x-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-primary-600' : 'text-slate-400 group-hover:text-text-main'}`} />
                  <span>{item.name}</span>
                </div>
                {item.highlight && (
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-violet-100 text-primary-700">
                    DNA
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* User Footer Profile & Sign out */}
        <div className="p-3 border-t border-border bg-slate-50/50">
          <div className="flex items-center justify-between p-2 rounded-xl hover:bg-white border border-transparent hover:border-border transition">
            <div className="flex items-center space-x-2.5 cursor-pointer overflow-hidden" onClick={() => navigate('/settings')}>
              <div className="w-7 h-7 rounded-full bg-primary-100 border border-primary-200 flex items-center justify-center text-primary-700 text-xs font-bold flex-shrink-0">
                {user?.name ? user.name[0].toUpperCase() : 'U'}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-semibold text-text-main truncate">{user?.name || 'Practitioner'}</p>
                <p className="text-[10px] text-text-muted truncate">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Sign out"
              className="p-1.5 text-text-muted hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Header Bar */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-border z-30">
          <div className="flex items-center space-x-2" onClick={() => navigate('/dashboard')}>
            <div className="w-7 h-7 rounded-lg bg-primary-600 flex items-center justify-center shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold text-sm tracking-tight text-text-main">MaskOff AI</span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => navigate('/scenarios')}
              className="py-1 px-3 rounded-lg bg-primary-600 text-white text-xs font-semibold flex items-center space-x-1"
            >
              <Mic className="w-3 h-3" />
              <span>Practice</span>
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 text-text-muted hover:text-text-main rounded-lg hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </header>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden fixed inset-0 top-13 bg-white/95 backdrop-blur-md z-50 p-5 flex flex-col justify-between">
            <nav className="space-y-1">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center space-x-3 px-3 py-3 rounded-xl text-sm font-semibold text-text-main hover:bg-slate-50"
                  >
                    <Icon className="w-4 h-4 text-primary-600" />
                    <span>{item.name}</span>
                  </NavLink>
                );
              })}
            </nav>
            <div className="pt-4 border-t border-border flex items-center justify-between">
              <span className="text-xs text-text-muted">{user?.name}</span>
              <button
                onClick={handleLogout}
                className="px-3 py-1.5 rounded-lg bg-rose-50 text-rose-600 text-xs font-semibold flex items-center space-x-1"
              >
                <LogOut className="w-3 h-3" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        )}

        {/* Dynamic Route View */}
        <main className="flex-1 overflow-y-auto bg-background">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
