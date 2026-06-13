/**
 * Script de setup dos buckets de Storage do Supabase.
 * Idempotente — não falha se o bucket já existe.
 *
 * Executar UMA VEZ após deploy ou em ambiente novo:
 *   npx tsx scripts/setup-storage-buckets.ts
 *
 * Requer: NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env.local
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error('NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY devem estar definidas.');
  process.exit(1);
}

const supabase = createClient(url, key);

const BUCKETS = [
  { id: 'contratos-html',      public: false, label: 'HTML original pré-assinatura' },
  { id: 'contratos-assinados', public: false, label: 'PDFs assinados' },
];

async function main() {
  for (const bucket of BUCKETS) {
    const { data: existing } = await supabase.storage.getBucket(bucket.id);
    if (existing) {
      console.log(`✓ Bucket "${bucket.id}" já existe — pulando.`);
      continue;
    }
    const { error } = await supabase.storage.createBucket(bucket.id, { public: bucket.public });
    if (error) {
      console.error(`✗ Erro ao criar bucket "${bucket.id}":`, error.message);
    } else {
      console.log(`✓ Bucket "${bucket.id}" criado (${bucket.label}, público=${bucket.public}).`);
    }
  }
  console.log('\nSetup concluído. Verifique os buckets em: Supabase → Storage.');
}

main();
