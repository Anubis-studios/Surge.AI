import { useStore, STREAK_REWARDS } from '../store';
import { Gift, Flame, Coins, Calendar, Trophy, Sparkles, CheckCircle, Lock } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function Rewards() {
  const { state, claimDailyReward } = useStore();
  const { billing, streakClaimed } = state;

  const today = new Date().toISOString().split('T')[0];
  const alreadyClaimedToday = streakClaimed || billing.last_login === today;

  const handleClaim = () => {
    claimDailyReward();
    if (!alreadyClaimedToday) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#fbbf24', '#f59e0b', '#d97706', '#fde68a'],
      });
    }
  };
  const currentDay = billing.login_streak;
  const nextDay = currentDay + 1;

  const getCurrentReward = () => {
    const idx = Math.min(currentDay, STREAK_REWARDS.length - 1);
    return STREAK_REWARDS[idx];
  };

  const getNextReward = () => {
    const idx = Math.min(nextDay, STREAK_REWARDS.length - 1);
    return STREAK_REWARDS[idx];
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold gold-heading flex items-center gap-3">
          <Gift className="w-8 h-8 text-gold-400" />
          Daily Rewards
        </h1>
        <p className="text-obsidian-500 mt-1">Build your streak and earn free Surge Coins every day</p>
      </div>

      {/* Main Streak Card */}
      <div className="gold-glow-panel p-8 text-center relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-4 left-8 text-6xl">🔥</div>
          <div className="absolute bottom-4 right-8 text-6xl">💰</div>
        </div>

        <div className="relative z-10">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center mx-auto mb-4 pulse-gold">
            <Flame className="w-10 h-10 text-white" />
          </div>

          <p className="text-sm text-obsidian-400 uppercase tracking-wider mb-1">Current Streak</p>
          <p className="text-6xl font-bold text-gold-400 font-mono mb-2">{currentDay}</p>
          <p className="text-lg text-obsidian-400">
            {currentDay === 0 ? 'Start your streak today!' : `day${currentDay > 1 ? 's' : ''} in a row`}
          </p>

          <div className="mt-6">
            {!alreadyClaimedToday ? (
              <button
                onClick={handleClaim}
                className="gold-capsule-button px-8 py-4 text-base"
              >
                <span className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  Claim Today's Reward (+{getNextReward().coins} Coins)
                </span>
              </button>
            ) : (
              <div className="flex items-center justify-center gap-2 text-emerald-400">
                <CheckCircle className="w-6 h-6" />
                <span className="font-medium text-lg">Today's reward claimed!</span>
              </div>
            )}
          </div>

          <p className="text-xs text-obsidian-600 mt-4">
            Come back tomorrow to continue your streak and earn even more!
          </p>
        </div>
      </div>

      {/* Reward Schedule */}
      <div className="obsidian-panel p-6">
        <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-gold-400" />
          Reward Schedule
        </h3>
        <p className="text-sm text-obsidian-500 mb-6">
          The longer your streak, the more Surge Coins you earn each day!
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
          {STREAK_REWARDS.map((reward, i) => {
            const isUnlocked = i < currentDay || (i === currentDay && alreadyClaimedToday);
            const isCurrent = i === currentDay && !alreadyClaimedToday;
            const isNext = i === nextDay && !alreadyClaimedToday;

            return (
              <div
                key={i}
                className={`rounded-xl p-4 text-center transition-all ${
                  isUnlocked
                    ? 'bg-gold-400/10 border border-gold-400/30'
                    : isCurrent
                    ? 'bg-gold-400/5 border border-gold-400/20 shimmer'
                    : isNext
                    ? 'bg-obsidian-700/50 border border-obsidian-500'
                    : 'bg-obsidian-800/50 border border-obsidian-700'
                }`}
              >
                <div className={`w-10 h-10 rounded-full mx-auto mb-2 flex items-center justify-center ${
                  isUnlocked ? 'bg-gold-400/20' : 'bg-obsidian-700'
                }`}>
                  {isUnlocked ? (
                    <CheckCircle className="w-5 h-5 text-gold-400" />
                  ) : isCurrent ? (
                    <Coins className="w-5 h-5 text-gold-400" />
                  ) : (
                    <Lock className="w-5 h-5 text-obsidian-600" />
                  )}
                </div>
                <p className="text-xs text-obsidian-500 uppercase tracking-wider">Day {reward.day}</p>
                <p className={`text-2xl font-bold font-mono mt-1 ${
                  isUnlocked ? 'text-gold-400' : isCurrent ? 'text-gold-300' : 'text-obsidian-600'
                }`}>
                  {reward.coins}
                </p>
                <p className="text-xs text-obsidian-600">coins</p>
              </div>
            );
          })}
        </div>

        {/* Progress bar */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-obsidian-500">Streak Progress</span>
            <span className="text-xs text-obsidian-500">{currentDay}/5 days</span>
          </div>
          <div className="streak-bar">
            <div
              className="streak-bar-fill"
              style={{ width: `${Math.min((currentDay / 5) * 100, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="obsidian-panel p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-gold-400/10 flex items-center justify-center">
              <Coins className="w-5 h-5 text-gold-400" />
            </div>
            <h4 className="font-bold text-white">What are Surge Coins?</h4>
          </div>
          <p className="text-sm text-obsidian-400 leading-relaxed">
            Surge Coins are used for AI image generation. Each image costs 1 Surge Coin.
            Earn them free through daily login streaks, or purchase bundles for more.
          </p>
        </div>

        <div className="obsidian-panel p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-orange-400/10 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-orange-400" />
            </div>
            <h4 className="font-bold text-white">How Streaks Work</h4>
          </div>
          <p className="text-sm text-obsidian-400 leading-relaxed">
            Log in each day to maintain your streak. Missing a day resets your streak to 0.
            The longer your streak, the higher your daily reward — up to 30 coins per day!
          </p>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="stat-box">
          <p className="text-xs text-obsidian-500 uppercase tracking-wider mb-1">Total Earned</p>
          <p className="text-xl font-bold text-gold-400 font-mono">
            {STREAK_REWARDS.slice(0, currentDay).reduce((sum, r) => sum + r.coins, 0) + (alreadyClaimedToday ? getCurrentReward().coins : 0)}
          </p>
          <p className="text-xs text-obsidian-600">coins</p>
        </div>
        <div className="stat-box">
          <p className="text-xs text-obsidian-500 uppercase tracking-wider mb-1">Current Streak</p>
          <p className="text-xl font-bold text-orange-400 font-mono">{currentDay}</p>
          <p className="text-xs text-obsidian-600">days</p>
        </div>
        <div className="stat-box">
          <p className="text-xs text-obsidian-500 uppercase tracking-wider mb-1">Next Reward</p>
          <p className="text-xl font-bold text-gold-300 font-mono">{getNextReward().coins}</p>
          <p className="text-xs text-obsidian-600">coins</p>
        </div>
        <div className="stat-box">
          <p className="text-xs text-obsidian-500 uppercase tracking-wider mb-1">Balance</p>
          <p className="text-xl font-bold text-gold-400 font-mono">{billing.surge_coins}</p>
          <p className="text-xs text-obsidian-600">coins</p>
        </div>
      </div>
    </div>
  );
}
