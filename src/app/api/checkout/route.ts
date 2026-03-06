import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { auth } from '@clerk/nextjs/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_build_dummy_key', {
    apiVersion: '2025-12-15.clover',
});

export async function POST(req: Request) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const priceId = process.env.STRIPE_PRICE_ID;
        if (!priceId) {
            console.error('Missing STRIPE_PRICE_ID environment variable.');
            return new NextResponse('Configuração de preço incompleta. Fale com o suporte.', { status: 400 });
        }

        const session = await stripe.checkout.sessions.create({
            mode: 'subscription',
            payment_method_types: ['card'],
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            subscription_data: {
                trial_period_days: 14,
            },
            metadata: {
                user_id: userId,
            },
            success_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://drivermind.vercel.app'}?success=true`,
            cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://drivermind.vercel.app'}?canceled=true`,
        });

        return NextResponse.json({ url: session.url });
    } catch (error: any) {
        console.error('Stripe Checkout Error:', error);
        return new NextResponse(`Internal Error: ${error.message}`, { status: 500 });
    }
}
