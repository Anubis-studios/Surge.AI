import { useStore, SURGE_COIN_BUNDLES, SURGE_BUCK_BUNDLES } from '../store';
import { useBillingStatus, usePurchase } from '../hooks/useApi';
import { Coins, DollarSign, CreditCard, Check, Star, Zap, Loader2 } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function Billing() {
  const { state } = useStore();
  const { data: apiBilling } = useBillingStatus();
  const { purchaseCoins, purchaseBucks, loading } = usePurchase();
  
  // Use API data if available, fallback to store
  const billing = apiBilling || state.billing;

  const handleBuyCoins = async (bundleId: string) => {
    try {
      const result = await purchaseCoins(bundleId);
      // In production, this would redirect to Stripe
      // For now, we simulate the purchase
      confetti({ particleCount: 60, spread: 50, origin: { y: 0.7 }, colors: ['#fbbf24', '#f59e0b'] });
    } catch (err) {
      console.error('Purchase failed:', err);
    }
  };

  const handleBuyBucks = async (bundleId: string) => {
    try {
      const result = await purchaseBucks(bundleId);
      // In production, this would redirect to Stripe
      // For now, we simulate the purchase
      confetti({ particleCount: 60, spread: 50, origin: { y: 0.7 }, colors: ['#8b5cf6', '#06b6d4'] });
    } catch (err) {
      console.error('Purchase failed:', err);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold gold-heading flex items-center gap-3">
          <CreditCard className="w-8 h-8 text-gold-400" />
          Billing
        </h1>
        <p className="text-obsidian-500 mt-1">Manage your Surge Coins and Surge Bucks</p>
      </div>

      {/* Current Balances */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="gold-glow-panel p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gold-400/10 flex items-center justify-center">
              <Coins className="w-6 h-6 text-gold-400" />
            </div>
            <div>
              <p className="text-sm text-obsidian-500">Surge Coins</p>
              <p className="text-3xl font-bold text-gold-400 font-mono">{billing.surge_coins}</p>
            </div>
          </div>
          <p className="text-xs text-obsidian-500">
            Used for AI image generation. Earn free via daily streaks or purchase bundles below.
          </p>
        </div>

        <div className="obsidian-panel p-6 border-cyber-purple/20">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-cyber-purple/10 flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-cyber-purple" />
            </div>
            <div>
              <p className="text-sm text-obsidian-500">Surge Bucks</p>
              <p className="text-3xl font-bold text-cyber-purple font-mono">{billing.surge_bucks}</p>
            </div>
          </div>
          <p className="text-xs text-obsidian-500">
            Used for AI video generation and premium features.
          </p>
        </div>
      </div>

      {/* Surge Coin Bundles */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <Coins className="w-5 h-5 text-gold-400" />
          <h2 className="text-xl font-bold text-white">Buy Surge Coins</h2>
          <span className="text-xs text-obsidian-500 bg-obsidian-800 px-2 py-1 rounded-full">For image generation</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {SURGE_COIN_BUNDLES.map(bundle => (
            <div
              key={bundle.id}
              className={`obsidian-panel p-5 relative ${
                bundle.popular ? 'border-gold-400/30 ring-1 ring-gold-400/20' : ''
              }`}
            >
              {bundle.popular && (
                <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-gold-400 to-gold-500 text-obsidian-950 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                  <Star className="w-3 h-3" />
                  POPULAR
                </div>
              )}
              <div className="text-center mb-4">
                <h3 className="text-lg font-bold text-white mb-1">{bundle.name}</h3>
                <p className="text-3xl font-bold text-gold-400 font-mono">{bundle.coins}</p>
                <p className="text-sm text-obsidian-500">Surge Coins</p>
              </div>
              <div className="text-center mb-4">
                <p className="text-2xl font-bold text-white">£{bundle.price_gbp}</p>
                <p className="text-xs text-obsidian-500">
                  £{(bundle.price_gbp / bundle.coins).toFixed(3)}/coin
                </p>
              </div>
              <button
                onClick={() => handleBuyCoins(bundle.id)}
                className="gold-capsule-button w-full flex items-center justify-center gap-2 text-sm"
              >
                <Zap className="w-4 h-4" />
                Purchase
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Surge Buck Bundles */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <DollarSign className="w-5 h-5 text-cyber-purple" />
          <h2 className="text-xl font-bold text-white">Buy Surge Bucks</h2>
          <span className="text-xs text-obsidian-500 bg-obsidian-800 px-2 py-1 rounded-full">For video generation</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {SURGE_BUCK_BUNDLES.map(bundle => (
            <div
              key={bundle.id}
              className={`obsidian-panel p-6 relative ${
                bundle.popular ? 'border-cyber-purple/30 ring-1 ring-cyber-purple/20' : ''
              }`}
            >
              {bundle.popular && (
                <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-cyber-purple to-cyan-500 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                  <Star className="w-3 h-3" />
                  BEST VALUE
                </div>
              )}
              <div className="text-center mb-4">
                <h3 className="text-lg font-bold text-white mb-1">{bundle.name}</h3>
                <p className="text-3xl font-bold text-cyber-purple font-mono">{bundle.amount}</p>
                <p className="text-sm text-obsidian-500">Surge Bucks</p>
              </div>
              <div className="text-center mb-4">
                <p className="text-2xl font-bold text-white">£{bundle.price_gbp}</p>
                <p className="text-xs text-obsidian-500">
                  £{(bundle.price_gbp / bundle.amount).toFixed(3)}/buck
                </p>
              </div>
              <button
                onClick={() => handleBuyBucks(bundle.id)}
                className="w-full py-3 px-6 rounded-full font-bold text-sm uppercase tracking-wider transition-all bg-gradient-to-r from-cyber-purple to-cyan-500 text-white shadow-lg shadow-cyber-purple/20 hover:shadow-cyber-purple/40 hover:-translate-y-0.5 flex items-center justify-center gap-2"
              >
                <Zap className="w-4 h-4" />
                Purchase
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Payment Info */}
      <div className="obsidian-panel p-5">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-400/10 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Check className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <h4 className="text-sm font-medium text-white mb-1">Secure Payments via Stripe</h4>
            <p className="text-xs text-obsidian-500 leading-relaxed">
              All transactions are processed securely through Stripe. Your payment information is encrypted and never stored on our servers. 
              Purchases are applied instantly to your account upon successful checkout.
            </p>
          </div>
        </div>
      </div>

      {/* Transaction History Placeholder */}
      <div className="obsidian-panel p-5">
        <h3 className="text-lg font-bold text-white mb-4">Recent Transactions</h3>
        <div className="text-center py-8">
          <p className="text-obsidian-500 text-sm">Transaction history will appear here after your first purchase.</p>
        </div>
      </div>
    </div>
  );
}
