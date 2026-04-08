require('dotenv').config({ path: '.env.local' });

const PROJECT_REF = 'ophbmcprxcnpkpndusbe';
const ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN;

async function runSQL(sql) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: sql }),
  });
  const data = await res.json();
  return data;
}

async function main() {
  console.log('Running migration: adding en_oferta + precio_oferta...');
  
  const result = await runSQL(`
    ALTER TABLE public.productos ADD COLUMN IF NOT EXISTS en_oferta boolean DEFAULT false;
    ALTER TABLE public.productos ADD COLUMN IF NOT EXISTS precio_oferta numeric DEFAULT 0.0;
    CREATE INDEX IF NOT EXISTS idx_productos_en_oferta ON public.productos(en_oferta);
  `);
  
  console.log('Result:', JSON.stringify(result, null, 2));
}

main().catch(console.error);
