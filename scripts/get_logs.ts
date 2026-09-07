import * as fs from 'fs';
import * as path from 'path';

// Parse .env file
const envPath = path.resolve('.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = Object.fromEntries(
    envContent.split('\n')
        .map(line => line.trim())
        .filter(line => line && !line.startsWith('#'))
        .map(line => line.split('=').map(part => part.trim()))
        .filter(parts => parts.length >= 2)
        .map(([key, ...rest]) => [key, rest.join('=')])
);

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function checkLogs() {
    const url = `${supabaseUrl}/rest/v1/coin_transactions?notification_status=eq.error&select=client_name,notification_status,notification_error,created_at&order=created_at.desc&limit=10`;
    
    const response = await fetch(url, {
        headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`
        }
    });
    
    if (!response.ok) {
        console.error('Error fetching data:', await response.text());
        return;
    }
    
    const data = await response.json();
    console.log('--- RECENT TRANSACTIONS WITH NOTIFICATION ERROR ---');
    data.forEach((t: any) => {
        console.log(`[${t.created_at}] ${t.client_name}: ${t.notification_error}`);
    });
}

checkLogs();
