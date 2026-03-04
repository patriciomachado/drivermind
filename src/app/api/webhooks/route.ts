
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

// Use a dummy key for build time if env var is missing
const stripeSecretKey = process.env.STRIPE_SECRET_KEY || 'sk_test_build_dummy_key';

const stripe = new Stripe(stripeSecretKey, {
    apiVersion: '2025-12-15.clover',
});

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_build_dummy_secret';

export async function POST(req: Request) {
    const body = await req.text();
    const headerPayload = await headers();
    const signature = headerPayload.get('stripe-signature') as string;

    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(body, signature, endpointSecret);
    } catch (err: any) {
        return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
    }

    const session = event.data.object as Stripe.Checkout.Session;

    // Handle the event
    if (event.type === 'checkout.session.completed' || event.type === 'invoice.payment_succeeded') {
        const userId = session.metadata?.user_id;

        if (userId) {
            console.log(`💰 Payment received from ${userId}. Unlocking access...`);

            // 1. Update user metadata as 'active' (Pro)
            const supabaseAdmin = getSupabaseAdmin();
            const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
                user_metadata: { subscription_status: 'active' },
                app_metadata: { subscription_status: 'active' } // Secure field
            });

            if (error) {
                console.error('Error updating user subscription:', error);
                return new NextResponse('Supabase Error', { status: 500 });
            }
        }
    }

    return new NextResponse(null, { status: 200 });
}
