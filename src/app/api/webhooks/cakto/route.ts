import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

// Webhook para integração com a Cakto
// Documentação: https://cakto.com.br/docs/webhooks
export async function POST(req: Request) {
    console.log('[Cakto Webhook] Requisição recebida');
    
    try {
        const rawBody = await req.text();
        console.log('[Cakto Webhook] Raw Body:', rawBody);

        if (!rawBody) {
            console.warn('[Cakto Webhook] Body vazio recebido.');
            return NextResponse.json({ message: 'Empty body' }, { status: 200 });
        }

        let body;
        try {
            body = JSON.parse(rawBody);
        } catch (e) {
            console.error('[Cakto Webhook] Erro ao parsear JSON:', e);
            return NextResponse.json({ message: 'Invalid JSON but received' }, { status: 200 });
        }
        
        // A Cakto envia o evento e os dados da transação
        // Payload padrão costuma ter { event, data } ou ser o objeto direto
        const event = body.event || body.type;
        const data = body.data || body;
        
        console.log(`[Cakto Webhook] Evento processado: ${event}`);

        // O id do usuário deve vir no external_id que passamos no link de checkout
        // Alguns gateways passam isso em data.params ou data.metadata
        const userId = data?.external_id || data?.params?.external_id || data?.metadata?.external_id;

        if (!userId) {
            console.warn('[Cakto Webhook] external_id (userId) não encontrado no evento. Webhook ignorado (modo teste?).');
            return NextResponse.json({ message: 'Webhook received but no userId found' }, { status: 200 });
        }

        const supabaseAdmin = getSupabaseAdmin();

        // Evento de pagamento aprovado
        if (event === 'order.paid' || event === 'subscription.paid' || event === 'payment.succeeded') {
            const now = new Date();
            const periodEnd = new Date();
            periodEnd.setMonth(now.getMonth() + 1); // 1 mês de validade

            const { error } = await supabaseAdmin.from('subscriptions').upsert({
                user_id: userId,
                status: 'active',
                current_period_end: periodEnd.toISOString(),
                updated_at: now.toISOString(),
            }, { onConflict: 'user_id' });

            if (error) {
                console.error('[Cakto Webhook] Erro no Upsert Supabase:', error);
                throw error;
            }

            console.log(`✅ Assinatura ativada via Cakto para o usuário: ${userId}`);
        }

        // Evento de cancelamento ou estorno
        if (event === 'subscription.canceled' || event === 'order.refunded' || event === 'subscription.deleted') {
            await supabaseAdmin.from('subscriptions')
                .update({ status: 'canceled' })
                .eq('user_id', userId);
            
            console.log(`❌ Assinatura cancelada/estornada via Cakto para o usuário: ${userId}`);
        }

        return NextResponse.json({ success: true, processed: true }, { status: 200 });
    } catch (error: any) {
        console.error('[Cakto Webhook Error]:', error);
        // Retornamos 200 mesmo no erro para evitar que o gateway fique tentando infinitamente
        // Mas logamos o erro no servidor para o desenvolvedor ver
        return NextResponse.json({ error: error.message, status: 'error_logged' }, { status: 200 });
    }
}
