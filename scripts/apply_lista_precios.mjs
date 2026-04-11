/**
 * Script: Apply Lista de Precios to ALL products
 * Updates precio_mayorista = precio_costo × markup for every product
 */
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ophbmcprxcnpkpndusbe.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9waGJtY3ByeGNucGtwbmR1c2JlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODI0MjM2MiwiZXhwIjoyMDgzODE4MzYyfQ.5ArBffoxsUZd5NOjKTB3WwrmADOATw5DLBxxyXLJgC4';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function main() {
  // 1. Fetch all active listas
  const { data: listas, error: listasErr } = await supabase
    .from('listas_precios')
    .select('*')
    .eq('activo', true)
    .order('es_default', { ascending: false });

  if (listasErr) { console.error('Error fetching listas:', listasErr); return; }
  if (!listas || listas.length === 0) { console.error('No active listas found!'); return; }

  console.log(`\n📋 Listas de precios activas:`);
  listas.forEach(l => {
    const pct = Math.round((l.markup - 1) * 100);
    console.log(`   - ${l.nombre}: ${pct}% markup (×${l.markup}) ${l.es_default ? '⭐ DEFAULT' : ''}`);
  });

  // Use the default or first active lista
  const lista = listas[0];
  const markup = lista.markup;
  const pct = Math.round((markup - 1) * 100);
  console.log(`\n🎯 Usando lista: "${lista.nombre}" (${pct}% markup)\n`);

  // 2. Fetch ALL products
  let allProducts = [];
  let from = 0;
  const pageSize = 1000;

  while (true) {
    const { data, error } = await supabase
      .from('productos')
      .select('id, nombre, precio_costo, precio_mayorista')
      .range(from, from + pageSize - 1);

    if (error) { console.error('Error fetching products:', error); return; }
    if (!data || data.length === 0) break;
    allProducts.push(...data);
    if (data.length < pageSize) break;
    from += pageSize;
  }

  console.log(`📦 Total productos: ${allProducts.length}`);

  // 3. Update each product
  let updated = 0;
  let skipped = 0;
  const batchSize = 100;

  for (let i = 0; i < allProducts.length; i += batchSize) {
    const batch = allProducts.slice(i, i + batchSize);
    const updates = batch
      .filter(p => p.precio_costo && p.precio_costo > 0)
      .map(p => ({
        id: p.id,
        precio_mayorista: Math.round(p.precio_costo * markup),
      }));

    if (updates.length === 0) {
      skipped += batch.length;
      continue;
    }

    // Upsert batch
    for (const upd of updates) {
      const { error } = await supabase
        .from('productos')
        .update({ precio_mayorista: upd.precio_mayorista })
        .eq('id', upd.id);

      if (error) {
        console.error(`  ❌ Error updating ${upd.id}:`, error.message);
        skipped++;
      } else {
        updated++;
      }
    }

    const progress = Math.min(i + batchSize, allProducts.length);
    process.stdout.write(`\r✅ Actualizados: ${updated} | ⏭️ Omitidos: ${skipped} | Progreso: ${progress}/${allProducts.length}`);
  }

  console.log(`\n\n🎉 ¡Listo! ${updated} productos actualizados con ${pct}% markup`);
  console.log(`   Ejemplo: Costo $1.000 → Mayorista $${(1000 * markup).toLocaleString()}`);
}

main().catch(console.error);
