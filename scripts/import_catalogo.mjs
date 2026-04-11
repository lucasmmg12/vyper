/**
 * ═══════════════════════════════════════════════════════
 *  VYPER LABS — CSV Catalog Import Script
 *  Imports products from catalogo.csv directly to Supabase
 *  
 *  Usage: node scripts/import_catalogo.mjs
 * ═══════════════════════════════════════════════════════
 */

import { readFileSync } from 'fs';
import { createClient } from '@supabase/supabase-js';

// ── Config ──────────────────────────────────────────────
const SUPABASE_URL = 'https://ophbmcprxcnpkpndusbe.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9waGJtY3ByeGNucGtwbmR1c2JlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODI0MjM2MiwiZXhwIjoyMDgzODE4MzYyfQ.5ArBffoxsUZd5NOjKTB3WwrmADOATw5DLBxxyXLJgC4';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const CSV_PATH = 'catalogo.csv';
const DRY_RUN = process.argv.includes('--dry-run');
const BATCH_SIZE = 50;

// ── Brand normalization map ─────────────────────────────
const BRAND_NORMALIZE = {
  'STAR NUTRITION': 'Star Nutrition',
  'BALBOAFIT': 'BalboaFit',
  'Balboafit': 'BalboaFit',
  'BalbaoFit': 'BalboaFit',
  'ULTRA TECH': 'Ultra Tech',
  'NUTREMAX': 'Nutremax',
  'Nutremax': 'Nutremax',
  'VITAMINWAY': 'Vitaminway',
  'ENA': 'ENA',
  'ENA SPORT': 'ENA Sport',
  'BODY ADVANCE': 'Body Advance',
  'Body Advance': 'Body Advance',
  'GOLD NUTRITION': 'Gold Nutrition',
  'Gold Nutrition': 'Gold Nutrition',
  'XTRENGHT': 'Xtrenght',
  'BSN': 'BSN',
  'HTN': 'HTN',
  'Mervick Lab': 'Mervick Lab',
  'Mervick lab': 'Mervick Lab',
  'MERVICK LAB': 'Mervick Lab',
  'Mervick': 'Mervick',
  'MERVICK': 'Mervick',
  'VITATECH': 'Vitatech',
  'VITA TECH': 'Vitatech',
  'Vita Tech': 'Vitatech',
  'KN NUTRITION': 'KN Nutrition',
  'KN': 'KN Nutrition',
  'KN Nutrition': 'KN Nutrition',
  'GRANGER': 'Granger',
  'Granger': 'Granger',
  'ON': 'ON',
  'GENTECH': 'Gentech',
  'Gentech': 'Gentech',
  'MYPROTEIN': 'Myprotein',
  'MY PROTEIN': 'Myprotein',
  'GU': 'GU',
  'ATLHETICA': 'Atlhetica',
  'UNIVERSAL': 'Universal',
  'Ultra Tech': 'Ultra Tech',
  'Energia Infinita': 'Energia Infinita',
  'ENERGIA INFINITA': 'Energia Infinita',
  'MUSCLETECH': 'Muscletech',
  'Muscletech': 'Muscletech',
  'Woman': 'Woman',
  'WOMAN & STAR NUTRITION': 'Woman & Star Nutrition',
  'EVERLAST': 'Everlast',
  'QUE LO PALEÓ': 'Que Lo Paleó',
  'G1M': 'G1M',
  'ULTIMATE NUTRITION': 'Ultimate Nutrition',
  'CELLUCOR': 'Cellucor',
  'INSANE LABZ': 'Insane Labz',
  'NUTREX': 'Nutrex',
  'Nutrex': 'Nutrex',
  'INNOVATIVE': 'Innovative',
  'PROTEIN PROJECT': 'Protein Project',
  'El mani de mi pueblo': 'El Maní de Mi Pueblo',
  'SABOR MANGO': 'Sabor Mango',
  'SABOR FRUTILLA': 'Sabor Frutilla',
  'Age biologique': 'Age Biologique',
};

// ── Category parsing ────────────────────────────────────
// "Nacionales -> - Star Nutrition" → rubro: "Nacionales", cat: "Star Nutrition"
// "Suplementos -> - Proteina" → rubro: "Suplementos", cat: "Proteina"
// "Accesorios -> Todos los Shakers -> Everlast" → rubro: "Accesorios", cat: "Shakers"
// "Destacados" → rubro: "Destacados", cat: "Destacados"
function parseCategoryPath(path) {
  if (!path || !path.includes('->')) {
    return { rubro: path || 'Sin Categoría', categoria: path || 'Sin Categoría' };
  }
  
  const parts = path.split('->').map(p => p.replace(/^[\s-]+|[\s-]+$/g, '').trim());
  const rubro = parts[0] || 'General';
  
  // Get the most specific category
  let cat = parts[parts.length - 1] || parts[0];
  // Clean up sub-categories
  cat = cat.replace(/^Todos los\s*/i, '');
  
  return { rubro, categoria: cat || rubro };
}

// ── CSV Parser ──────────────────────────────────────────
function parseCSV(filepath) {
  const csv = readFileSync(filepath, 'utf-8');
  const lines = csv.split('\n').filter(l => l.trim());
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const parts = [];
    let current = '';
    let inQuote = false;
    for (const ch of lines[i]) {
      if (ch === '"') { inQuote = !inQuote; continue; }
      if (ch === ';' && !inQuote) { parts.push(current); current = ''; continue; }
      current += ch;
    }
    parts.push(current.replace(/\r$/, ''));

    const [categoria, imageFormula, codigo, producto, opcion, precio, promocion, stock] = parts;

    // Extract image URL
    let imageUrl = '';
    if (imageFormula) {
      const m = imageFormula.match(/=IMAGE\("(.+?)"\)/i);
      if (m) imageUrl = m[1];
    }

    // Parse brand from "Product Name - BRAND"
    const prodStr = (producto || '').trim();
    const lastDash = prodStr.lastIndexOf(' - ');
    let name = prodStr;
    let brand = '';
    if (lastDash > 0) {
      name = prodStr.substring(0, lastDash).trim();
      brand = prodStr.substring(lastDash + 3).trim();
    }

    // Normalize brand
    brand = BRAND_NORMALIZE[brand] || brand;

    // Build full product name including variant
    const opcionStr = (opcion || '').trim();
    const fullName = opcionStr ? `${name} - ${opcionStr}` : name;

    rows.push({
      categoria_path: (categoria || '').trim(),
      imageUrl,
      codigo: (codigo || '').trim(),
      nombre: fullName,
      nombre_base: name,
      marca: brand,
      opcion: opcionStr,
      precio_costo: parseFloat(precio) || 0,
      precio_promocion: parseFloat(promocion) || 0,
      stock: parseInt(stock) || 0,
    });
  }

  return rows;
}

// ── Main Import ─────────────────────────────────────────
async function main() {
  console.log('═══════════════════════════════════════════');
  console.log('  VYPER LABS — Importación de Catálogo CSV');
  console.log('═══════════════════════════════════════════');
  if (DRY_RUN) console.log('  ⚠️  DRY RUN — No se escribirá en la DB\n');

  // 1. Parse CSV
  console.log('📄 Parseando CSV...');
  const rows = parseCSV(CSV_PATH);
  console.log(`   ${rows.length} filas parseadas`);

  // 2. Ensure external_id column exists
  if (!DRY_RUN) {
    console.log('\n🔧 Verificando columna external_id...');
    const { error: alterErr } = await supabase.rpc('exec_sql', {
      sql: `ALTER TABLE public.productos ADD COLUMN IF NOT EXISTS external_id text;
            CREATE INDEX IF NOT EXISTS idx_productos_external_id ON public.productos(external_id);`
    }).single();
    // If RPC doesn't exist, try direct
    if (alterErr) {
      // Column might already exist, continue
      console.log('   (columna ya existe o se creará con la migración)');
    }
  }

  // 3. Collect & create rubros
  console.log('\n📂 Procesando rubros...');
  const rubroMap = new Map(); // name → id
  const catParsed = new Map(); // path → {rubro, categoria}
  for (const row of rows) {
    const parsed = parseCategoryPath(row.categoria_path);
    catParsed.set(row.categoria_path, parsed);
    rubroMap.set(parsed.rubro, null);
  }

  if (!DRY_RUN) {
    // Get existing rubros
    const { data: existingRubros } = await supabase.from('rubros').select('id, nombre');
    for (const r of (existingRubros || [])) {
      if (rubroMap.has(r.nombre)) rubroMap.set(r.nombre, r.id);
    }

    // Create missing rubros
    const missingRubros = [...rubroMap.entries()].filter(([, id]) => !id);
    if (missingRubros.length > 0) {
      console.log(`   Creando ${missingRubros.length} rubros: ${missingRubros.map(([n]) => n).join(', ')}`);
      const { data: newRubros } = await supabase.from('rubros').insert(
        missingRubros.map(([nombre], i) => ({ nombre, orden: i }))
      ).select();
      for (const r of (newRubros || [])) {
        rubroMap.set(r.nombre, r.id);
      }
    }
  }
  console.log(`   ${rubroMap.size} rubros: ${[...rubroMap.keys()].join(', ')}`);

  // 4. Collect & create categorías
  console.log('\n📁 Procesando categorías...');
  const categoriaMap = new Map(); // "rubro|cat" → id
  for (const [, parsed] of catParsed) {
    const key = `${parsed.rubro}|${parsed.categoria}`;
    categoriaMap.set(key, null);
  }

  if (!DRY_RUN) {
    // Get existing categorías
    const { data: existingCats } = await supabase.from('categorias').select('id, nombre, rubro_id');
    for (const c of (existingCats || [])) {
      // Find matching key
      for (const [key] of categoriaMap) {
        const [, catName] = key.split('|');
        if (c.nombre === catName) {
          categoriaMap.set(key, c.id);
        }
      }
    }

    // Create missing categorías
    const missingCats = [...categoriaMap.entries()].filter(([, id]) => !id);
    if (missingCats.length > 0) {
      console.log(`   Creando ${missingCats.length} categorías...`);
      for (const [key] of missingCats) {
        const [rubroName, catName] = key.split('|');
        const rubroId = rubroMap.get(rubroName);
        if (!rubroId) continue;
        const { data: newCat } = await supabase.from('categorias').insert({
          nombre: catName,
          rubro_id: rubroId,
        }).select().single();
        if (newCat) categoriaMap.set(key, newCat.id);
      }
    }
  }
  console.log(`   ${categoriaMap.size} categorías`);

  // 5. Collect & create marcas
  console.log('\n🏷️  Procesando marcas...');
  const marcaMap = new Map(); // name → id
  for (const row of rows) {
    if (row.marca) marcaMap.set(row.marca, null);
  }

  if (!DRY_RUN) {
    // Get existing marcas
    const { data: existingMarcas } = await supabase.from('marcas').select('id, nombre');
    for (const m of (existingMarcas || [])) {
      if (marcaMap.has(m.nombre)) marcaMap.set(m.nombre, m.id);
    }

    // Create missing
    const missingMarcas = [...marcaMap.entries()].filter(([, id]) => !id);
    if (missingMarcas.length > 0) {
      console.log(`   Creando ${missingMarcas.length} marcas...`);
      const { data: newMarcas } = await supabase.from('marcas').insert(
        missingMarcas.map(([nombre]) => ({ nombre }))
      ).select();
      for (const m of (newMarcas || [])) {
        marcaMap.set(m.nombre, m.id);
      }
    }
  }
  console.log(`   ${marcaMap.size} marcas: ${[...marcaMap.keys()].slice(0, 15).join(', ')}...`);

  // 6. Import products
  console.log('\n📦 Importando productos...');
  
  // Get existing products by external_id for upsert logic
  let existingProducts = new Map(); // external_id → product
  if (!DRY_RUN) {
    const { data: existing } = await supabase
      .from('productos')
      .select('id, external_id, nombre, precio_costo')
      .not('external_id', 'is', null);
    for (const p of (existing || [])) {
      if (p.external_id) existingProducts.set(p.external_id, p);
    }
    console.log(`   ${existingProducts.size} productos existentes con external_id`);
  }

  let created = 0, updated = 0, skipped = 0, errors = 0;

  // Process in batches
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const toInsert = [];
    const toUpdate = [];

    for (const row of batch) {
      // Skip rows with bad data
      if (!row.nombre || row.nombre.length < 2) { skipped++; continue; }
      // Skip products with clearly invalid brands (parsing artifacts)
      if (row.marca.includes(' x 162 g') || row.marca === '60 CAPS') { 
        // Fix: these are part of the product name, not brands
        row.nombre = `${row.nombre_base}${row.opcion ? ' - ' + row.opcion : ''}`;
        row.marca = '';
      }

      const parsed = catParsed.get(row.categoria_path) || { rubro: '', categoria: '' };
      const catKey = `${parsed.rubro}|${parsed.categoria}`;
      const categoriaId = categoriaMap.get(catKey) || null;
      const marcaId = row.marca ? (marcaMap.get(row.marca) || null) : null;

      const productData = {
        nombre: row.nombre,
        descripcion: row.opcion ? `Opción: ${row.opcion}` : null,
        sku: `VYP-${row.codigo || Date.now().toString(36).toUpperCase().slice(-5)}`,
        external_id: row.codigo || null,
        precio_costo: row.precio_costo,
        precio_mayorista: 0, // Will be set by price lists
        precio_unitario: 0,
        stock: row.stock,
        cantidad_minima: 1,
        categoria_id: categoriaId,
        marca_id: marcaId,
        imagenes: row.imageUrl ? [row.imageUrl] : [],
        activo: true,
        destacado: row.categoria_path === 'Destacados',
        en_oferta: row.precio_promocion > 0,
        precio_oferta: row.precio_promocion || 0,
      };

      // Check if product already exists
      const existing = row.codigo ? existingProducts.get(row.codigo) : null;
      if (existing) {
        toUpdate.push({ id: existing.id, ...productData });
      } else {
        toInsert.push(productData);
      }
    }

    if (DRY_RUN) {
      created += toInsert.length;
      updated += toUpdate.length;
      continue;
    }

    // Insert new products
    if (toInsert.length > 0) {
      const { data, error } = await supabase.from('productos').insert(toInsert).select('id, external_id');
      if (error) {
        console.error(`   ❌ Error inserting batch: ${error.message}`);
        errors += toInsert.length;
      } else {
        created += (data || []).length;
        // Track newly inserted for dedup
        for (const p of (data || [])) {
          if (p.external_id) existingProducts.set(p.external_id, p);
        }
      }
    }

    // Update existing products
    for (const upd of toUpdate) {
      const { id, ...updateData } = upd;
      const { error } = await supabase.from('productos')
        .update({ ...updateData, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) {
        console.error(`   ❌ Error updating ${id}: ${error.message}`);
        errors++;
      } else {
        updated++;
      }
    }

    // Progress
    const progress = Math.min(100, Math.round(((i + BATCH_SIZE) / rows.length) * 100));
    process.stdout.write(`\r   Progreso: ${progress}% | Creados: ${created} | Actualizados: ${updated} | Errores: ${errors}`);
  }

  console.log('\n');
  console.log('═══════════════════════════════════════════');
  console.log('  ✅ IMPORTACIÓN COMPLETADA');
  console.log('═══════════════════════════════════════════');
  console.log(`  📦 Creados:      ${created}`);
  console.log(`  🔄 Actualizados: ${updated}`);
  console.log(`  ⏭️  Omitidos:     ${skipped}`);
  console.log(`  ❌ Errores:      ${errors}`);
  console.log(`  📊 Total:        ${rows.length}`);
  console.log('═══════════════════════════════════════════');
}

main().catch(console.error);
