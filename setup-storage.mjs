// Script para crear el bucket "productos" en Supabase Storage
// Ejecutar con: node setup-storage.mjs

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ophbmcprxcnpkpndusbe.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_SERVICE_KEY) {
  console.log('\n⚠️  No se encontró SUPABASE_SERVICE_KEY.');
  console.log('');
  console.log('OPCIÓN 1: Crear bucket desde Supabase Dashboard (más fácil):');
  console.log('────────────────────────────────────────────────');
  console.log('1. Ir a https://supabase.com/dashboard → tu proyecto');
  console.log('2. Ir a Storage (ícono de carpeta en el sidebar)');
  console.log('3. Click "New Bucket"');
  console.log('4. Nombre: productos');
  console.log('5. Marcar "Public bucket" ✅');
  console.log('6. Click "Create bucket"');
  console.log('7. Ir a Policies → Click "New Policy" para el bucket "productos"');
  console.log('8. Crear estas 2 políticas:');
  console.log('   a) SELECT → Allow for all users (público para ver imágenes)');
  console.log('   b) INSERT → Allow for all users (permitir subir)');
  console.log('');
  console.log('OPCIÓN 2: Ejecutar este script con la Service Role Key:');
  console.log('────────────────────────────────────────────────');
  console.log('La Service Role Key está en: Supabase Dashboard → Settings → API → service_role');
  console.log('');
  console.log('Ejecutar:');
  console.log('  $env:SUPABASE_SERVICE_KEY="tu-service-role-key"; node setup-storage.mjs');
  console.log('');
  process.exit(1);
}

async function setupStorage() {
  const headers = {
    'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
    'apikey': SUPABASE_SERVICE_KEY,
    'Content-Type': 'application/json',
  };

  console.log('🔧 Configurando Supabase Storage...\n');

  // 1. Check if bucket exists
  console.log('1. Verificando si el bucket "productos" existe...');
  const listRes = await fetch(`${SUPABASE_URL}/storage/v1/bucket`, { headers });
  const buckets = await listRes.json();
  
  const exists = Array.isArray(buckets) && buckets.some(b => b.name === 'productos');

  if (exists) {
    console.log('   ✅ El bucket "productos" ya existe.\n');
  } else {
    // 2. Create bucket
    console.log('   ⏳ Creando bucket "productos"...');
    const createRes = await fetch(`${SUPABASE_URL}/storage/v1/bucket`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        id: 'productos',
        name: 'productos',
        public: true,
        file_size_limit: 5242880, // 5MB
        allowed_mime_types: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
      }),
    });

    if (createRes.ok) {
      console.log('   ✅ Bucket "productos" creado exitosamente.\n');
    } else {
      const err = await createRes.json();
      console.error('   ❌ Error creando bucket:', err);
      process.exit(1);
    }
  }

  // 3. Set RLS policies for public access
  console.log('2. Configurando políticas de acceso...');
  console.log('   ℹ️  Ejecutá este SQL en Supabase Dashboard → SQL Editor:\n');
  console.log(`
-- ============================================
-- POLÍTICAS DE STORAGE PARA BUCKET "productos"
-- ============================================

-- Permitir a cualquiera VER imágenes (público)
CREATE POLICY "Imagenes productos publicas" ON storage.objects
  FOR SELECT USING (bucket_id = 'productos');

-- Permitir a cualquiera SUBIR imágenes
CREATE POLICY "Permitir subir imagenes productos" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'productos');

-- Permitir a cualquiera ACTUALIZAR imágenes
CREATE POLICY "Permitir actualizar imagenes productos" ON storage.objects
  FOR UPDATE USING (bucket_id = 'productos');

-- Permitir a cualquiera ELIMINAR imágenes  
CREATE POLICY "Permitir eliminar imagenes productos" ON storage.objects
  FOR DELETE USING (bucket_id = 'productos');
`);

  console.log('\n✅ ¡Listo! Copiá el SQL de arriba y ejecutalo en Supabase Dashboard.');
  console.log('   Dashboard → SQL Editor → New Query → Pegar → Run\n');
}

setupStorage().catch(console.error);
