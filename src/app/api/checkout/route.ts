
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@/lib/supabase';
import { cookies } from 'next/headers';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-01-27.acacia', // Latest API version
});

export async function POST(req: Request) {
    try {
        const { priceId } = await req.json();

        // 1. Get the user from Supabase Auth
        const cookieStore = cookies();
        const supabase = createClient(cookieStore);
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        // 2. Create Stripe Checkout Session
        const session = await stripe.checkout.sessions.create({
            mode: 'subscription',
            payment_method_types: ['card', 'boleto'], // Pix requires extra setup usually, but boleto works
            line_items: [
                {
                    price: priceId || process.env.NEXT_PUBLIC_STRIPE_PRICE_ID,
                    quantity: 1,
                },
            ],
            metadata: {
                user_id: user.id, // CRITICAL: This links the payment to the Supabase User
            },
            success_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}?success=true`,
            cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}?canceled=true`,
            customer_email: user.email,
        });

        return NextResponse.json({ url: session.url });
    } catch (error: any) {
        console.error('Stripe Error:', error);
        return new NextResponse(`Internal Error: ${error.message}`, { status: 500 });
    }
}
