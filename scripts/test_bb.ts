import * as fs from 'fs';
import * as path from 'path';

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
const builderbotUrl = envVars.BUILDERBOT_WEBHOOK_URL;
const builderbotKey = envVars.BUILDERBOT_API_KEY;

async function testBuilderbot() {
    // 1. Fetch Jorge Gonzalez phone
    const userUrl = `${supabaseUrl}/rest/v1/users?name=eq.Jorge Gonzalez&select=phone,coin_balance&limit=1`;
    const userRes = await fetch(userUrl, {
        headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`
        }
    });
    
    if (!userRes.ok) {
        console.error('Error fetching user:', await userRes.text());
        return;
    }
    const userData = await userRes.json();
    if (!userData.length) {
        console.error('User not found');
        return;
    }
    
    const user = userData[0];
    const phone = user.phone;
    const cleanPhone = phone.replace(/\D/g, '');
    console.log(`Testing with phone: ${cleanPhone}`);

    // 2. Simulate sending
    const payload = {
        messages: {
            content: `👋 Hola, Jorge Gonzalez\nPrueba de error`
        },
        number: cleanPhone,
        checkIfExists: false
    };

    const bbRes = await fetch(builderbotUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-builderbot': builderbotKey
        },
        body: JSON.stringify(payload)
    });

    if (!bbRes.ok) {
        const errorText = await bbRes.text();
        console.error(`Builderbot Error (${bbRes.status}):`, errorText);
    } else {
        console.log('Success:', await bbRes.text());
    }
}

testBuilderbot();
