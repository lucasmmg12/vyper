require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function seed() {
  console.log('🌱 Seeding ecommerce data...\n');

  // 1. Create Rubros
  console.log('📦 Creating rubros...');
  const rubros = [
    { nombre: 'Suplementos', icono: '💊', orden: 1 },
    { nombre: 'Indumentaria', icono: '👕', orden: 2 },
    { nombre: 'Accesorios', icono: '🏋️', orden: 3 },
  ];
  const { data: rubroData } = await supabase.from('rubros').upsert(rubros, { onConflict: 'nombre' }).select();
  const rubroMap = {};
  (rubroData || []).forEach(r => rubroMap[r.nombre] = r.id);
  console.log(`  ✅ ${Object.keys(rubroMap).length} rubros`);

  // 2. Create Categorías
  console.log('📂 Creating categorías...');
  const categorias = [
    { nombre: 'Proteínas', rubro_id: rubroMap['Suplementos'], orden: 1 },
    { nombre: 'Creatinas', rubro_id: rubroMap['Suplementos'], orden: 2 },
    { nombre: 'Aminoácidos', rubro_id: rubroMap['Suplementos'], orden: 3 },
    { nombre: 'Pre-Workout', rubro_id: rubroMap['Suplementos'], orden: 4 },
    { nombre: 'Vitaminas', rubro_id: rubroMap['Suplementos'], orden: 5 },
    { nombre: 'Ganadores de Peso', rubro_id: rubroMap['Suplementos'], orden: 6 },
    { nombre: 'Snacks Proteicos', rubro_id: rubroMap['Suplementos'], orden: 7 },
    { nombre: 'Remeras', rubro_id: rubroMap['Indumentaria'], orden: 1 },
    { nombre: 'Guantes', rubro_id: rubroMap['Accesorios'], orden: 1 },
    { nombre: 'Cinturones', rubro_id: rubroMap['Accesorios'], orden: 2 },
    { nombre: 'Botellas y Shakers', rubro_id: rubroMap['Accesorios'], orden: 3 },
    { nombre: 'Toallas', rubro_id: rubroMap['Accesorios'], orden: 4 },
  ];
  const { data: catData } = await supabase.from('categorias').upsert(categorias, { onConflict: 'nombre' }).select();
  const catMap = {};
  (catData || []).forEach(c => catMap[c.nombre] = c.id);
  console.log(`  ✅ ${Object.keys(catMap).length} categorías`);

  // 3. Create Marcas
  console.log('🏷️ Creating marcas...');
  const marcas = [
    { nombre: 'Star Nutrition' },
    { nombre: 'HTN' },
    { nombre: 'ENA' },
    { nombre: 'Gentech' },
    { nombre: 'Xtrenght' },
    { nombre: 'Vyper Gear' },
  ];
  const { data: marcaData } = await supabase.from('marcas').upsert(marcas, { onConflict: 'nombre' }).select();
  const marcaMap = {};
  (marcaData || []).forEach(m => marcaMap[m.nombre] = m.id);
  console.log(`  ✅ ${Object.keys(marcaMap).length} marcas`);

  // 4. Delete existing demo products
  console.log('\n🗑️ Cleaning existing products...');
  await supabase.from('productos').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  // 5. Create 15 Products
  console.log('🛍️ Creating 15 products...');
  const now = new Date();
  const productos = [
    {
      nombre: 'Whey Protein Premium 1kg',
      descripcion: 'Proteína de suero de leche de alta calidad. 24g de proteína por serving. Sabor chocolate intenso. Baja en grasas y carbohidratos. Ideal para recuperación post-entrenamiento.',
      precio_mayorista: 28500,
      precio_unitario: 35000,
      stock: 45,
      cantidad_minima: 3,
      categoria_id: catMap['Proteínas'],
      marca_id: marcaMap['Star Nutrition'],
      imagenes: ['/productos/whey-protein.png'],
      destacado: true,
      en_oferta: true,
      precio_oferta: 24900,
      created_at: new Date(now - 2 * 86400000).toISOString(),
    },
    {
      nombre: 'Creatina Monohidrato 300g',
      descripcion: 'Creatina micronizada de máxima pureza. Aumenta la fuerza y el rendimiento. 5g por porción. Sin sabor, fácil de mezclar. 60 porciones por envase.',
      precio_mayorista: 18200,
      precio_unitario: 22000,
      stock: 60,
      cantidad_minima: 6,
      categoria_id: catMap['Creatinas'],
      marca_id: marcaMap['HTN'],
      imagenes: ['/productos/creatina.png'],
      destacado: true,
      en_oferta: false,
      precio_oferta: 0,
      created_at: new Date(now - 5 * 86400000).toISOString(),
    },
    {
      nombre: 'BCAA 2:1:1 Powder 400g',
      descripcion: 'Aminoácidos de cadena ramificada en proporción 2:1:1. Previene el catabolismo muscular. Sabor limón. Acelera la recuperación muscular.',
      precio_mayorista: 15800,
      precio_unitario: 19500,
      stock: 38,
      cantidad_minima: 4,
      categoria_id: catMap['Aminoácidos'],
      marca_id: marcaMap['ENA'],
      imagenes: ['/productos/bcaa.png'],
      destacado: false,
      en_oferta: true,
      precio_oferta: 13500,
      created_at: new Date(now - 10 * 86400000).toISOString(),
    },
    {
      nombre: 'Pre-Workout Explosive 300g',
      descripcion: 'Fórmula pre-entrenamiento de alta potencia. Con cafeína, beta-alanina y citrulina. Energía explosiva y enfoque mental. Sabor frutas del bosque.',
      precio_mayorista: 21000,
      precio_unitario: 26500,
      stock: 25,
      cantidad_minima: 3,
      categoria_id: catMap['Pre-Workout'],
      marca_id: marcaMap['Gentech'],
      imagenes: ['/productos/preworkout.png'],
      destacado: true,
      en_oferta: false,
      precio_oferta: 0,
      created_at: new Date(now - 1 * 86400000).toISOString(),
    },
    {
      nombre: 'Proteína Vegana Plant-Based 908g',
      descripcion: 'Blend de proteína vegetal premium: arvejas, arroz y cáñamo. 22g de proteína por porción. Sin lactosa, sin gluten. Sabor vainilla natural.',
      precio_mayorista: 32000,
      precio_unitario: 39500,
      stock: 20,
      cantidad_minima: 2,
      categoria_id: catMap['Proteínas'],
      marca_id: marcaMap['Star Nutrition'],
      imagenes: ['/productos/proteina-vegana.png'],
      destacado: false,
      en_oferta: false,
      precio_oferta: 0,
      created_at: new Date(now - 0.5 * 86400000).toISOString(),
    },
    {
      nombre: 'L-Glutamina Pura 300g',
      descripcion: 'Glutamina de grado farmacéutico. Favorece la recuperación muscular y refuerza el sistema inmune. Sin sabor. 60 porciones por envase.',
      precio_mayorista: 14500,
      precio_unitario: 18000,
      stock: 42,
      cantidad_minima: 4,
      categoria_id: catMap['Aminoácidos'],
      marca_id: marcaMap['HTN'],
      imagenes: ['/productos/glutamina.png'],
      destacado: false,
      en_oferta: true,
      precio_oferta: 12800,
      created_at: new Date(now - 7 * 86400000).toISOString(),
    },
    {
      nombre: 'Shaker Pro 700ml',
      descripcion: 'Shaker premium con bola mezcladora de acero inoxidable. Tapa hermética anti-derrames. Diseño ergonómico. Libre de BPA.',
      precio_mayorista: 5200,
      precio_unitario: 7500,
      stock: 80,
      cantidad_minima: 10,
      categoria_id: catMap['Botellas y Shakers'],
      marca_id: marcaMap['Vyper Gear'],
      imagenes: ['/productos/shaker.png'],
      destacado: false,
      en_oferta: false,
      precio_oferta: 0,
      created_at: new Date(now - 3 * 86400000).toISOString(),
    },
    {
      nombre: 'Barras Proteicas x12 Pack',
      descripcion: 'Pack de 12 barras proteicas sabor chocolate y maní. 20g de proteína por barra. Snack perfecto post-entrenamiento o entre comidas. Sin azúcar agregada.',
      precio_mayorista: 19800,
      precio_unitario: 24000,
      stock: 30,
      cantidad_minima: 2,
      categoria_id: catMap['Snacks Proteicos'],
      marca_id: marcaMap['ENA'],
      imagenes: ['/productos/barras-proteicas.png'],
      destacado: true,
      en_oferta: false,
      precio_oferta: 0,
      created_at: new Date(now - 0.2 * 86400000).toISOString(),
    },
    {
      nombre: 'Remera Dry-Fit Training',
      descripcion: 'Remera deportiva de alto rendimiento. Tela Dry-Fit que absorbe la humedad. Corte slim fit. Costuras reforzadas. Disponible en negro.',
      precio_mayorista: 8500,
      precio_unitario: 12000,
      stock: 55,
      cantidad_minima: 5,
      categoria_id: catMap['Remeras'],
      marca_id: marcaMap['Vyper Gear'],
      imagenes: ['/productos/camiseta.png'],
      destacado: false,
      en_oferta: true,
      precio_oferta: 7200,
      created_at: new Date(now - 4 * 86400000).toISOString(),
    },
    {
      nombre: 'Guantes Pro-Grip',
      descripcion: 'Guantes de entrenamiento con muñequera integrada. Palma acolchada antideslizante. Cierre de velcro ajustable. Talle único.',
      precio_mayorista: 9800,
      precio_unitario: 13500,
      stock: 40,
      cantidad_minima: 6,
      categoria_id: catMap['Guantes'],
      marca_id: marcaMap['Xtrenght'],
      imagenes: ['/productos/guantes.png'],
      destacado: false,
      en_oferta: false,
      precio_oferta: 0,
      created_at: new Date(now - 6 * 86400000).toISOString(),
    },
    {
      nombre: 'Cinturón Lumbar Power Lifting',
      descripcion: 'Cinturón de cuero genuino para entrenamiento pesado. Doble hebilla de acero. Protección lumbar máxima. Ancho de 10cm. Talle regulable.',
      precio_mayorista: 18500,
      precio_unitario: 24000,
      stock: 15,
      cantidad_minima: 2,
      categoria_id: catMap['Cinturones'],
      marca_id: marcaMap['Xtrenght'],
      imagenes: ['/productos/cinturon.png'],
      destacado: true,
      en_oferta: false,
      precio_oferta: 0,
      created_at: new Date(now - 2 * 86400000).toISOString(),
    },
    {
      nombre: 'Multivitamínico Daily x60',
      descripcion: 'Complejo multivitamínico y mineral completo. 60 cápsulas para 2 meses. Vitaminas A, B, C, D, E y minerales esenciales. Consumo diario.',
      precio_mayorista: 12000,
      precio_unitario: 15500,
      stock: 50,
      cantidad_minima: 4,
      categoria_id: catMap['Vitaminas'],
      marca_id: marcaMap['Gentech'],
      imagenes: ['/productos/multivitaminico.png'],
      destacado: false,
      en_oferta: false,
      precio_oferta: 0,
      created_at: new Date(now - 8 * 86400000).toISOString(),
    },
    {
      nombre: 'Omega-3 Fish Oil x120',
      descripcion: 'Aceite de pescado concentrado con EPA y DHA. 120 cápsulas blandas. Salud cardiovascular y antiinflamatorio natural. Sin retrogusto.',
      precio_mayorista: 14200,
      precio_unitario: 18000,
      stock: 35,
      cantidad_minima: 4,
      categoria_id: catMap['Vitaminas'],
      marca_id: marcaMap['Star Nutrition'],
      imagenes: ['/productos/omega3.png'],
      destacado: false,
      en_oferta: true,
      precio_oferta: 11900,
      created_at: new Date(now - 0.8 * 86400000).toISOString(),
    },
    {
      nombre: 'Toalla Microfibra Gym',
      descripcion: 'Toalla de microfibra ultra absorbente. Secado rápido. Compacta y liviana. Ideal para el gimnasio. 80x40cm. Logo Vyper bordado.',
      precio_mayorista: 4800,
      precio_unitario: 7000,
      stock: 70,
      cantidad_minima: 10,
      categoria_id: catMap['Toallas'],
      marca_id: marcaMap['Vyper Gear'],
      imagenes: ['/productos/toalla.png'],
      destacado: false,
      en_oferta: false,
      precio_oferta: 0,
      created_at: new Date(now - 9 * 86400000).toISOString(),
    },
    {
      nombre: 'Mass Gainer Extreme 3kg',
      descripcion: 'Ganador de masa muscular de alto calibre. 50g de proteína + 250g de carbohidratos por serving. Ideal para hardgainers. Sabor dulce de leche.',
      precio_mayorista: 42000,
      precio_unitario: 52000,
      stock: 18,
      cantidad_minima: 1,
      categoria_id: catMap['Ganadores de Peso'],
      marca_id: marcaMap['Gentech'],
      imagenes: ['/productos/mass-gainer.png'],
      destacado: true,
      en_oferta: true,
      precio_oferta: 36500,
      created_at: new Date(now - 0.1 * 86400000).toISOString(),
    },
  ];

  const { data: insertedProducts, error } = await supabase
    .from('productos')
    .insert(productos)
    .select();

  if (error) {
    console.error('❌ Error inserting products:', error.message);
    return;
  }

  console.log(`  ✅ ${(insertedProducts || []).length} productos creados!\n`);

  // Summary
  const ofertas = productos.filter(p => p.en_oferta).length;
  const destacados = productos.filter(p => p.destacado).length;
  console.log('📊 Resumen:');
  console.log(`  🔥 En oferta: ${ofertas}`);
  console.log(`  ⭐ Destacados: ${destacados}`);
  console.log(`  🆕 Últimos ingresos: se calculan automáticamente por fecha`);
  console.log('\n🎉 Seed completado!');
}

seed().catch(console.error);
