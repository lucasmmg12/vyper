require('dotenv').config({ path: '.env.local' });
const bcrypt = require('bcryptjs');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  // Hash password for superadmin
  const hash = await bcrypt.hash('Vyper2026!', 10);
  console.log('Password hash generated');

  const { error } = await supabase
    .from('admin_users')
    .update({ password_hash: hash })
    .eq('email', 'fer@growlabs.com');

  if (error) {
    console.error('Error:', error.message);
  } else {
    console.log('✅ Superadmin password set for fer@growlabs.com');
  }
}

main();
