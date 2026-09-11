import { useState } from 'react';
import { Zap, Mail, ArrowRight, Sparkles, Image, Video, Coins } from 'lucide-react';
import ParticleBackground from '../components/ParticleBackground';

interface AuthGateProps {
  onLogin: () => void;
}

export default function AuthGate({ onLogin }: AuthGateProps) {
  const [email, setEmail] = useState('creator@surge.ai');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate auth delay
    await new Promise(resolve => setTimeout(resolve, 1200));
    onLogin();
  };

  return (
    <div className="min-h-screen grid-bg flex flex-col relative">
      <ParticleBackground />
      {/* Background effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gold-400/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyber-purple/5 rounded-full blur-3xl" />
      </div>

      {/* Nav */}
      <nav className="relative z-10 p-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center">
            <Zap className="w-6 h-6 text-obsidian-950" />
          </div>
          <span className="text-xl font-bold gold-heading">Surge.AI</span>
        </div>
      </nav>

      {/* Hero */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-4">
        <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left - Info */}
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 bg-gold-400/10 border border-gold-400/20 rounded-full px-4 py-1.5">
              <Sparkles className="w-4 h-4 text-gold-400" />
              <span className="text-sm text-gold-400 font-medium">AI-Powered Creative Platform</span>
            </div>

            <h1 className="text-4xl lg:text-6xl font-black leading-tight">
              <span className="gold-heading">AI Video</span>
              <br />
              <span className="text-white">&</span>{' '}
              <span className="gold-heading">Image</span>
              <br />
              <span className="text-white">Generation</span>
            </h1>

            <p className="text-lg text-obsidian-400 max-w-md leading-relaxed">
              Create stunning AI images with SDXL and premium videos via our supplier network. 
              Powered by a dual-currency creator economy.
            </p>

            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2 text-sm text-obsidian-400">
                <Image className="w-4 h-4 text-gold-400" />
                <span>SDXL Image Studio</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-obsidian-400">
                <Video className="w-4 h-4 text-cyber-purple" />
                <span>Video Engine</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-obsidian-400">
                <Coins className="w-4 h-4 text-gold-400" />
                <span>Daily Rewards</span>
              </div>
            </div>
          </div>

          {/* Right - Login Card */}
          <div className="w-full max-w-md mx-auto lg:mx-0 lg:ml-auto">
            <div className="gold-glow-panel p-8">
              <h2 className="text-2xl font-bold text-white mb-2">Welcome Back</h2>
              <p className="text-sm text-obsidian-500 mb-6">Sign in to access your Surge.AI dashboard</p>

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="text-sm text-obsidian-400 mb-1.5 block">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-obsidian-500" />
                    <input
                      type="email"
                      className="terminal-input pl-11"
                      placeholder="you@example.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm text-obsidian-400 mb-1.5 block">Password</label>
                  <input
                    type="password"
                    className="terminal-input"
                    placeholder="••••••••"
                    defaultValue="surgeai2024"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="gold-capsule-button w-full flex items-center justify-center gap-2 mt-2"
                >
                  {isLoading ? (
                    <div className="spinner-gold" />
                  ) : (
                    <>
                      Sign In
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-xs text-obsidian-600">
                  Demo mode — click Sign In to explore the platform
                </p>
              </div>

              <div className="mt-6 pt-6 border-t border-obsidian-700">
                <p className="text-xs text-obsidian-500 text-center mb-3">Or continue with</p>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={handleLogin}
                    className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-obsidian-800 border border-obsidian-600 text-sm text-obsidian-400 hover:border-obsidian-500 hover:text-white transition-all"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    Google
                  </button>
                  <button
                    onClick={handleLogin}
                    className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-obsidian-800 border border-obsidian-600 text-sm text-obsidian-400 hover:border-obsidian-500 hover:text-white transition-all"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                    </svg>
                    GitHub
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 p-6 text-center">
        <p className="text-xs text-obsidian-600">
          © 2024 Surge.AI — AI video and image generation with a dual-currency creator economy.
        </p>
      </footer>
    </div>
  );
}
