import Stripe from 'stripe';

// Lazy client — instantiated on first request, not at module load time.
// This avoids build errors when STRIPE_SECRET_KEY is not set in the build environment.
let _client: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_client) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY não configurado');
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    _client = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2026-05-27.dahlia' as any });
  }
  return _client;
}
