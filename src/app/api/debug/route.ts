import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export async function GET() {
    try {
        const { userId } = await auth();
        
        const diagnostics = {
            auth: {
                hasUserId: !!userId,
                userId: userId ? `${userId.substring(0, 8)}...` : null,
            },
            env: {
                NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ? `${process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.substring(0, 7)}...` : 'MISSING',
                CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY ? `${process.env.CLERK_SECRET_KEY.substring(0, 7)}...` : 'MISSING',
                NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'PRESENT' : 'MISSING',
                SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? `${process.env.SUPABASE_SERVICE_ROLE_KEY.substring(0, 5)}...` : 'MISSING',
                STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY ? 'PRESENT' : 'MISSING',
            },
            node_version: process.version,
        };

        return NextResponse.json(diagnostics);
    } catch (error: any) {
        return NextResponse.json({
            error: error.message,
            stack: error.stack?.split('\n').slice(0, 2),
            env_check: {
                has_publishable: !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
                has_secret: !!process.env.CLERK_SECRET_KEY,
            }
        }, { status: 500 });
    }
}
