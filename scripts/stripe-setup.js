/**
 * ============================================================
 * Surge.AI — Stripe Product & Price Setup Script
 * ============================================================
 * 
 * Run this ONCE to create all Stripe products and prices.
 * 
 * Usage:
 *   STRIPE_SECRET_KEY=sk_live_... node scripts/stripe-setup.js
 * 
 * This creates:
 *   - Surge Coin Bundles (4 products with prices)
 *   - Surge Buck Bundles (3 products with prices)
 * 
 * All prices are in GBP (pence) with metadata for webhook routing.
 * ============================================================
 */

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const SURGE_COIN_BUNDLES = [
  {
    name: 'Surge Coins — Starter Pack',
    description: '30 Surge Coins for AI image generation',
    price_gbp: 300, // £3.00 in pence
    metadata: { type: 'surge_coins', coins: '30', bundle: 'starter' },
  },
  {
    name: 'Surge Coins — Creator Pack',
    description: '80 Surge Coins for AI image generation',
    price_gbp: 700, // £7.00
    metadata: { type: 'surge_coins', coins: '80', bundle: 'creator' },
  },
  {
    name: 'Surge Coins — Pro Pack',
    description: '200 Surge Coins for AI image generation',
    price_gbp: 1500, // £15.00
    metadata: { type: 'surge_coins', coins: '200', bundle: 'pro' },
  },
  {
    name: 'Surge Coins — Ultra Pack',
    description: '450 Surge Coins for AI image generation',
    price_gbp: 3000, // £30.00
    metadata: { type: 'surge_coins', coins: '450', bundle: 'ultra' },
  },
];

const SURGE_BUCK_BUNDLES = [
  {
    name: 'Surge Bucks — Small',
    description: '100 Surge Bucks for AI video generation',
    price_gbp: 1000, // £10.00
    metadata: { type: 'surge_bucks', amount: '100', bundle: 'small' },
  },
  {
    name: 'Surge Bucks — Medium',
    description: '300 Surge Bucks for AI video generation',
    price_gbp: 2500, // £25.00
    metadata: { type: 'surge_bucks', amount: '300', bundle: 'medium' },
  },
  {
    name: 'Surge Bucks — Large',
    description: '700 Surge Bucks for AI video generation',
    price_gbp: 5000, // £50.00
    metadata: { type: 'surge_bucks', amount: '700', bundle: 'large' },
  },
];

async function createProducts() {
  console.log('🚀 Surge.AI — Stripe Product Setup\n');
  console.log('Creating products and prices...\n');

  const envVars = {};

  // Create Surge Coin products
  for (const bundle of SURGE_COIN_BUNDLES) {
    console.log(`📦 Creating: ${bundle.name}`);
    
    const product = await stripe.products.create({
      name: bundle.name,
      description: bundle.description,
      metadata: bundle.metadata,
      active: true,
    });

    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: bundle.price_gbp,
      currency: 'gbp',
      metadata: bundle.metadata,
    });

    const envKey = `STRIPE_SURGE_COINS_${bundle.metadata.bundle.toUpperCase()}`;
    envVars[envKey] = price.id;

    console.log(`   ✅ Product: ${product.id}`);
    console.log(`   ✅ Price: ${price.id} (£${(bundle.price_gbp / 100).toFixed(2)})`);
    console.log(`   📝 ${envKey}=${price.id}\n`);
  }

  // Create Surge Buck products
  for (const bundle of SURGE_BUCK_BUNDLES) {
    console.log(`📦 Creating: ${bundle.name}`);
    
    const product = await stripe.products.create({
      name: bundle.name,
      description: bundle.description,
      metadata: bundle.metadata,
      active: true,
    });

    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: bundle.price_gbp,
      currency: 'gbp',
      metadata: bundle.metadata,
    });

    const envKey = `STRIPE_SURGE_BUCKS_${bundle.metadata.bundle.toUpperCase()}`;
    envVars[envKey] = price.id;

    console.log(`   ✅ Product: ${product.id}`);
    console.log(`   ✅ Price: ${price.id} (£${(bundle.price_gbp / 100).toFixed(2)})`);
    console.log(`   📝 ${envKey}=${price.id}\n`);
  }

  // Output env vars
  console.log('═══════════════════════════════════════════');
  console.log('📋 Add these to your .env.local:\n');
  for (const [key, value] of Object.entries(envVars)) {
    console.log(`${key}=${value}`);
  }
  console.log('\n═══════════════════════════════════════════');
  console.log('✅ Setup complete!');
}

createProducts().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
