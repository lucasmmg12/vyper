import { readFileSync } from 'fs';

const csv = readFileSync('catalogo.csv', 'utf-8');
const lines = csv.split('\n').filter(l => l.trim());
const header = lines[0].split(';');
console.log('=== HEADERS ===', header);
console.log(`Total rows: ${lines.length - 1}`);

// Parse all rows
const rows = [];
for (let i = 1; i < lines.length; i++) {
  // CSV with semicolons, handle quoted fields with =IMAGE(...)
  const parts = [];
  let current = '';
  let inQuote = false;
  for (const ch of lines[i]) {
    if (ch === '"') { inQuote = !inQuote; continue; }
    if (ch === ';' && !inQuote) { parts.push(current); current = ''; continue; }
    current += ch;
  }
  parts.push(current);
  
  const [categoria, imageFormula, codigo, producto, opcion, precio, promocion, stock] = parts;
  
  // Extract image URL from =IMAGE("url")
  let imageUrl = '';
  if (imageFormula) {
    const m = imageFormula.match(/=IMAGE\("(.+?)"\)/i);
    if (m) imageUrl = m[1];
  }
  
  // Parse brand from product name: "Product Name - BRAND"
  const prodStr = (producto || '').trim();
  const lastDash = prodStr.lastIndexOf(' - ');
  let name = prodStr;
  let brand = '';
  if (lastDash > 0) {
    name = prodStr.substring(0, lastDash).trim();
    brand = prodStr.substring(lastDash + 3).trim();
  }
  
  rows.push({
    categoria: (categoria || '').trim(),
    imageUrl,
    codigo: (codigo || '').trim(),
    producto_full: prodStr,
    nombre: name,
    marca: brand,
    opcion: (opcion || '').trim(),
    precio: parseFloat(precio) || 0,
    promocion: parseFloat(promocion) || 0,
    stock: parseInt(stock) || 0,
  });
}

console.log(`Parsed rows: ${rows.length}`);

// Sample rows
console.log('\n=== FIRST 10 ROWS ===');
rows.slice(0, 10).forEach((r, i) => {
  console.log(`${i+1}. [${r.categoria}] ${r.nombre} | ${r.marca} | opt: "${r.opcion}" | $${r.precio} | promo: $${r.promocion} | stock: ${r.stock} | code: ${r.codigo}`);
  if (r.imageUrl) console.log(`   img: ${r.imageUrl.substring(0, 80)}...`);
});

// Unique categories
const cats = new Map();
for (const r of rows) {
  cats.set(r.categoria, (cats.get(r.categoria) || 0) + 1);
}
console.log('\n=== CATEGORÍAS ===');
for (const [c, n] of [...cats.entries()].sort((a, b) => b[1] - a[1])) {
  console.log(`  ${n.toString().padStart(4)} | ${c}`);
}

// Unique brands
const brands = new Map();
for (const r of rows) {
  if (r.marca) brands.set(r.marca, (brands.get(r.marca) || 0) + 1);
}
console.log(`\n=== MARCAS (${brands.size} únicas) ===`);
for (const [b, n] of [...brands.entries()].sort((a, b) => b[1] - a[1])) {
  console.log(`  ${n.toString().padStart(4)} | ${b}`);
}

// Price stats
const prices = rows.map(r => r.precio).filter(p => p > 0);
const promos = rows.filter(r => r.promocion > 0);
console.log('\n=== PRECIOS ===');
console.log(`Con precio: ${prices.length}/${rows.length}`);
console.log(`Rango: $${Math.min(...prices)} - $${Math.max(...prices)}`);
console.log(`Con promoción: ${promos.length}`);
if (promos.length > 0) {
  console.log('Samples con promo:');
  promos.slice(0, 10).forEach(r => console.log(`  ${r.nombre} | precio: $${r.precio} → promo: $${r.promocion}`));
}

// Products without option (no variant)
const noOption = rows.filter(r => !r.opcion);
console.log(`\nSin opción/variante: ${noOption.length}`);
noOption.slice(0, 5).forEach(r => console.log(`  ${r.nombre} - ${r.marca} | $${r.precio}`));

// Products with stock
const withStock = rows.filter(r => r.stock > 0);
console.log(`\nCon stock > 0: ${withStock.length}/${rows.length}`);
