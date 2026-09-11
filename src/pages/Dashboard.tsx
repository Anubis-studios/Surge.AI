import { useStore, STREAK_REWARDS } from '../store';
import { Coins, DollarSign, Flame, Image, Video, ArrowRight, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const { state } = useStore();
  const { billing } = state;

  const currentStreakReward = STREAK_REWARDS[Math.min(billing.login_streak, STREAK_REWARDS.length - 1)];
  const nextReward = STREAK_REWARDS[Math.min(billing.login_streak + 1, STREAK_REWARDS.length - 1)];
  const streakProgress = (billing.login_streak / 5) * 100;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl lg:text-4xl font-bold gold-heading mb-2">
          Welcome back, {state.user.display_name}
        </h1>
        <p className="text-obsidian-500 text-lg">
          Your AI creation command center
        </p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Surge Coins */}
        <div className="stat-box neon-border">
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="w-10 h-10 rounded-full bg-gold-400/10 flex items-center justify-center">
              <Coins className="w-5 h-5 text-gold-400" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gold-400 font-mono">{billing.surge_coins}</p>
          <p className="text-sm text-obsidian-500 mt-1">Surge Coins</p>
          <p className="text-xs text-obsidian-600 mt-2">For image generation</p>
        </div>

        {/* Surge Bucks */}
        <div className="stat-box neon-border">
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="w-10 h-10 rounded-full bg-cyber-purple/10 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-cyber-purple" />
            </div>
          </div>
          <p className="text-3xl font-bold text-cyber-purple font-mono">{billing.surge_bucks}</p>
          <p className="text-sm text-obsidian-500 mt-1">Surge Bucks</p>
          <p className="text-xs text-obsidian-600 mt-2">For video generation</p>
        </div>

        {/* Streak */}
        <div className="stat-box neon-border">
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="w-10 h-10 rounded-full bg-orange-400/10 flex items-center justify-center">
              <Flame className="w-5 h-5 text-orange-400" />
            </div>
          </div>
          <p className="text-3xl font-bold text-orange-400 font-mono">{billing.login_streak}</p>
          <p className="text-sm text-obsidian-500 mt-1">Day Streak</p>
          <div className="streak-bar mt-3">
            <div className="streak-bar-fill" style={{ width: `${Math.min(streakProgress, 100)}%` }} />
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link to="/image-studio" className="obsidian-panel p-6 group cursor-pointer hover:border-gold-400/30 transition-all">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-xl bg-gold-400/10 flex items-center justify-center group-hover:bg-gold-400/20 transition-colors">
                  <Image className="w-6 h-6 text-gold-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Image Studio</h3>
                  <p className="text-sm text-obsidian-500">SDXL-powered generation</p>
                </div>
              </div>
              <p className="text-obsidian-400 text-sm leading-relaxed">
                Create stunning AI images with Stable Diffusion XL. Each generation costs 1 Surge Coin.
              </p>
            </div>
            <ArrowRight className="w-5 h-5 text-obsidian-500 group-hover:text-gold-400 transition-colors mt-1" />
          </div>
        </Link>

        <Link to="/video-engine" className="obsidian-panel p-6 group cursor-pointer hover:border-cyber-purple/30 transition-all">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-xl bg-cyber-purple/10 flex items-center justify-center group-hover:bg-cyber-purple/20 transition-colors">
                  <Video className="w-6 h-6 text-cyber-purple" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Video Engine</h3>
                  <p className="text-sm text-obsidian-500">Supplier passthrough</p>
                </div>
              </div>
              <p className="text-obsidian-400 text-sm leading-relaxed">
                Generate AI videos via premium supplier network. Each render costs 3 Surge Bucks.
              </p>
            </div>
            <ArrowRight className="w-5 h-5 text-obsidian-500 group-hover:text-cyber-purple transition-colors mt-1" />
          </div>
        </Link>
      </div>

      {/* Streak Info Card */}
      <div className="gold-glow-panel p-6">
        <div className="flex items-center gap-3 mb-4">
          <Sparkles className="w-6 h-6 text-gold-400" />
          <h3 className="text-lg font-bold text-white">Daily Rewards</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-obsidian-800/50 rounded-xl p-4">
            <p className="text-xs text-obsidian-500 uppercase tracking-wider mb-1">Current Streak</p>
            <p className="text-2xl font-bold text-orange-400 font-mono">{billing.login_streak} days</p>
          </div>
          <div className="bg-obsidian-800/50 rounded-xl p-4">
            <p className="text-xs text-obsidian-500 uppercase tracking-wider mb-1">Today's Reward</p>
            <p className="text-2xl font-bold text-gold-400 font-mono">{currentStreakReward.coins} coins</p>
          </div>
          <div className="bg-obsidian-800/50 rounded-xl p-4">
            <p className="text-xs text-obsidian-500 uppercase tracking-wider mb-1">Next Reward</p>
            <p className="text-2xl font-bold text-gold-300 font-mono">{nextReward.coins} coins</p>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-2">
          {STREAK_REWARDS.map((reward, i) => (
            <div
              key={i}
              className={`flex-1 h-2 rounded-full ${
                i < billing.login_streak
                  ? 'bg-gradient-to-r from-gold-400 to-gold-500'
                  : 'bg-obsidian-700'
              }`}
            />
          ))}
        </div>
        <p className="text-xs text-obsidian-500 mt-2">
          Log in daily to build your streak and earn increasing Surge Coin rewards!
        </p>
      </div>

      {/* Recent Activity */}
      {(state.images.length > 0 || state.videos.length > 0) && (
        <div className="obsidian-panel p-6">
          <h3 className="text-lg font-bold text-white mb-4">Recent Creations</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {state.images.slice(0, 4).map(img => (
              <div key={img.id} className="image-card">
                <img src={img.output_url} alt={img.prompt} className="w-full aspect-square object-cover" />
              </div>
            ))}
            {state.videos.slice(0, 4).map(vid => (
              <div key={vid.id} className="image-card relative">
                <img src={vid.output_url || ''} alt={vid.input_prompt} className="w-full aspect-square object-cover" />
                <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                  <Video className="w-8 h-8 text-white" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
