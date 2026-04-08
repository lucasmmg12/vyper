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
  return await res.json();
}

async function main() {
  console.log('Creating admin_users table...');
  
  const result = await runSQL(`
    -- Admin users table for role-based access
    CREATE TABLE IF NOT EXISTS public.admin_users (
      id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
      email text NOT NULL UNIQUE,
      password_hash text NOT NULL,
      nombre text NOT NULL,
      rol text NOT NULL DEFAULT 'vendedor' CHECK (rol IN ('superadmin', 'administrador', 'vendedor')),
      activo boolean DEFAULT true,
      created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
      last_login timestamp with time zone
    );

    -- Enable RLS
    ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Enable all for service role" ON public.admin_users;
    CREATE POLICY "Enable all for service role" ON public.admin_users FOR ALL USING (true);

    -- Index
    CREATE INDEX IF NOT EXISTS idx_admin_users_email ON public.admin_users(email);
    CREATE INDEX IF NOT EXISTS idx_admin_users_rol ON public.admin_users(rol);
  `);
  
  console.log('Table result:', JSON.stringify(result, null, 2));

  // Now insert the superadmin user (fer@growlabs.com)
  // We'll use bcrypt-style hashing via a simple hash for now
  console.log('\nInserting superadmin user...');
  
  const insertResult = await runSQL(`
    INSERT INTO public.admin_users (email, password_hash, nombre, rol)
    VALUES ('fer@growlabs.com', 'superadmin_initial', 'Fernando', 'superadmin')
    ON CONFLICT (email) DO UPDATE SET rol = 'superadmin';
  `);
  
  console.log('Insert result:', JSON.stringify(insertResult, null, 2));
}

main().catch(console.error);
