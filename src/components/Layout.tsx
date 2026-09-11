import { NavLink, useLocation } from 'react-router-dom';
import { useStore } from '../store';
import {
  LayoutDashboard,
  Image,
  Video,
  CreditCard,
  Gift,
  Zap,
  Menu,
} from 'lucide-react';
import { useState } from 'react';
import ParticleBackground from './ParticleBackground';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/image-studio', label: 'Image Studio', icon: Image },
  { to: '/video-engine', label: 'Video Engine', icon: Video },
  { to: '/billing', label: 'Billing', icon: CreditCard },
  { to: '/rewards', label: 'Rewards', icon: Gift },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const { state } = useStore();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen grid-bg flex relative">
      <ParticleBackground />
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-72 bg-obsidian-900 border-r border-obsidian-600/30 flex flex-col transform transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Logo */}
        <div className="p-6 border-b border-obsidian-600/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center">
              <Zap className="w-6 h-6 text-obsidian-950" />
            </div>
            <div>
              <h1 className="text-xl font-bold gold-heading">Surge.AI</h1>
              <p className="text-xs text-obsidian-500 font-mono">v2.0</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = location.pathname === item.to;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                  isActive
                    ? 'bg-gold-400/10 text-gold-400 border border-gold-400/20'
                    : 'text-obsidian-500 hover:text-gold-300 hover:bg-obsidian-700/50'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-gold-400' : 'group-hover:text-gold-400'}`} />
                <span className="font-medium text-sm">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* User info */}
        <div className="p-4 border-t border-obsidian-600/30">
          <div className="obsidian-panel p-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center text-obsidian-950 font-bold text-sm">
                {state.user.display_name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{state.user.display_name}</p>
                <p className="text-xs text-obsidian-500 truncate">{state.user.email}</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-h-screen overflow-y-auto">
        {/* Mobile header */}
        <div className="lg:hidden sticky top-0 z-30 bg-obsidian-900/95 backdrop-blur-sm border-b border-obsidian-600/30 px-4 py-3 flex items-center justify-between">
          <button onClick={() => setSidebarOpen(true)} className="text-gold-400 p-2">
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-gold-400" />
            <span className="font-bold gold-heading text-lg">Surge.AI</span>
          </div>
          <div className="w-10" />
        </div>

        {/* Page content */}
        <div className="p-4 lg:p-8 max-w-7xl mx-auto pb-16">
          {children}
        </div>

        {/* Footer */}
        <footer className="border-t border-obsidian-600/20 px-4 lg:px-8 py-4">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
            <p className="text-xs text-obsidian-600">
              © 2024 Surge.AI — AI video and image generation with a dual-currency creator economy.
            </p>
            <div className="flex items-center gap-3">
              <span className="text-xs text-obsidian-600 font-mono">
                {state.tenant.name}
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs text-emerald-400/80">Online</span>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
