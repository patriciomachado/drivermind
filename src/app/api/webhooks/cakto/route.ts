import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

// Webhook para integração com a Cakto
// Documentação: https://cakto.com.br/docs/webhooks
export async function POST(req: Request) {
    try {
        const body = await req.json();
        
        // A Cakto envia o evento e os dados da transação
        const { event, data } = body;
        
        console.log(`[Cakto Webhook] Recebi evento: ${event}`);

        // O id do usuário deve vir no external_id que passamos no link de checkout
        const userId = data?.external_id;

        if (!userId) {
            console.warn('[Cakto Webhook] Webhook ignorado: external_id (userId) não encontrado.');
            return NextResponse.json({ message: 'External ID missing' }, { status: 200 });
        }

        const supabaseAdmin = getSupabaseAdmin();

        // Evento de pagamento aprovado
        if (event === 'order.paid' || event === 'subscription.paid') {
            const now = new Date();
            const periodEnd = new Date();
            periodEnd.setMonth(now.getMonth() + 1); // 1 mês de validade

            await supabaseAdmin.from('subscriptions').upsert({
                user_id: userId,
                status: 'active',
                current_period_end: periodEnd.toISOString(),
                updated_at: now.toISOString(),
            }, { onConflict: 'user_id' });

            console.log(`✅ Assinatura ativada via Cakto para o usuário: ${userId}`);
        }

        // Evento de cancelamento ou estorno (opcional implementar depois)
        if (event === 'subscription.canceled' || event === 'order.refunded') {
            await supabaseAdmin.from('subscriptions')
                .update({ status: 'canceled' })
                .eq('user_id', userId);
            
            console.log(`❌ Assinatura cancelada/estornada via Cakto para o usuário: ${userId}`);
        }

        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error: any) {
        console.error('[Cakto Webhook Error]:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
