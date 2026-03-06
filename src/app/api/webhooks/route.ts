import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_build_dummy_key', {
    apiVersion: '2025-12-15.clover',
});

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

export async function POST(req: Request) {
    const body = await req.text();
    const headerPayload = await headers();
    const signature = headerPayload.get('stripe-signature') as string;

    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(body, signature, endpointSecret);
    } catch (err: any) {
        console.error('Webhook signature verification failed:', err.message);
        return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
    }

    const supabaseAdmin = getSupabaseAdmin();

    try {
        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object as Stripe.Checkout.Session;
                const userId = session.metadata?.user_id;

                if (userId && session.subscription) {
                    // Fetch the subscription details from Stripe
                    const subscription = await stripe.subscriptions.retrieve(session.subscription as string) as any;

                    await supabaseAdmin.from('subscriptions').upsert({
                        user_id: userId,
                        stripe_customer_id: session.customer as string,
                        stripe_subscription_id: subscription.id,
                        status: subscription.status,
                        trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
                        current_period_end: subscription.current_period_end ? new Date(subscription.current_period_end * 1000).toISOString() : null,
                    }, { onConflict: 'user_id' });

                    console.log(`✅ Subscription created for user ${userId}`);
                }
                break;
            }

            case 'invoice.payment_succeeded': {
                const invoice = event.data.object as any;
                const subscriptionId = invoice.subscription as string;

                if (subscriptionId) {
                    const subscription = await stripe.subscriptions.retrieve(subscriptionId) as any;

                    await supabaseAdmin.from('subscriptions')
                        .update({
                            status: 'active',
                            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
                        })
                        .eq('stripe_subscription_id', subscriptionId);

                    console.log(`💰 Payment succeeded for subscription ${subscriptionId}`);
                }
                break;
            }

            case 'customer.subscription.updated': {
                const subscription = event.data.object as any;

                await supabaseAdmin.from('subscriptions')
                    .update({
                        status: subscription.status,
                        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
                        trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
                    })
                    .eq('stripe_subscription_id', subscription.id);

                console.log(`🔄 Subscription ${subscription.id} updated to ${subscription.status}`);
                break;
            }

            case 'customer.subscription.deleted': {
                const subscription = event.data.object as any;

                await supabaseAdmin.from('subscriptions')
                    .update({ status: 'canceled' })
                    .eq('stripe_subscription_id', subscription.id);

                console.log(`❌ Subscription ${subscription.id} canceled`);
                break;
            }
        }
    } catch (error: any) {
        console.error('Error processing webhook:', error);
        return new NextResponse(`Webhook handler error: ${error.message}`, { status: 500 });
    }

    return new NextResponse(null, { status: 200 });
}
