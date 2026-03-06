const fs = require('fs');

function parseEnv() {
    const envFile = fs.readFileSync('.env.local', 'utf8');
    const env = {};
    envFile.split('\n').forEach(line => {
        const [key, ...rest] = line.split('=');
        if (key && rest.length > 0) {
            env[key.trim()] = rest.join('=').trim().replace(/^"|"$/g, '').replace(/^'|'$/g, '');
        }
    });
    return env;
}

async function expireTrial() {
    try {
        const env = parseEnv();
        const clerkKey = env.CLERK_SECRET_KEY;
        const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || 'https://xlbaixcghujaxlymqecp.supabase.co';
        const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;

        if (!clerkKey || !supabaseKey) {
            console.error('Faltam chaves no arquivo .env.local');
            return;
        }

        console.log('🔍 Buscando usuário no Clerk...');
        const clerkRes = await fetch(`https://api.clerk.com/v1/users?email_address=patriciojmf@gmail.com`, {
            headers: { Authorization: `Bearer ${clerkKey}` }
        });

        const users = await clerkRes.json();
        if (!users || users.length === 0) {
            console.error('❌ Usuário patriciojmf@gmail.com não encontrado no Clerk!');
            return;
        }

        const userId = users[0].id;
        console.log('✅ Usuário encontrado. Clerk ID:', userId);

        console.log('⏳ Expirando a assinatura no Supabase...');
        const { createClient } = require('@supabase/supabase-js');
        const supabase = createClient(supabaseUrl, supabaseKey);

        const { error } = await supabase
            .from('subscriptions')
            .upsert({
                user_id: userId,
                status: 'expired',
                trial_end: new Date(Date.now() - 86400000).toISOString() // Ontem
            }, { onConflict: 'user_id' });

        if (error) {
            console.error('❌ Erro no Supabase:', error);
        } else {
            console.log('🎯 SUCESSO! O teste de 14 dias foi removido e a conta está como "expired".');
            console.log('👉 Agora recarregue (F5) o DriverMind na Vercel para ver a tela de bloqueio!');
        }
    } catch (e) {
        console.error('Erro no script:', e);
    }
}

expireTrial();
