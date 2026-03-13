import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export async function GET() {
    try {
        const { userId } = await auth();

        if (!userId) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const supabaseAdmin = getSupabaseAdmin();

        // Check if user has a subscription record
        const { data: sub } = await supabaseAdmin
            .from('subscriptions')
            .select('*')
            .eq('user_id', userId)
            .maybeSingle();

        if (!sub) {
            // No subscription record - check if this is a new user (auto-start trial)
            const now = new Date();
            const trialEnd = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000); // 15 days

            const { data: newSub } = await supabaseAdmin
                .from('subscriptions')
                .insert({
                    user_id: userId,
                    status: 'trialing',
                    trial_end: trialEnd.toISOString(),
                })
                .select()
                .single();

            return NextResponse.json({
                status: 'trialing',
                trial_end: trialEnd.toISOString(),
                days_remaining: 15,
            });
        }

        // Calculate days remaining for trial
        let daysRemaining = 0;
        if (sub.status === 'trialing' && sub.trial_end) {
            const now = new Date();
            const trialEnd = new Date(sub.trial_end);
            daysRemaining = Math.max(0, Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

            // If trial expired, update status
            if (daysRemaining === 0) {
                await supabaseAdmin
                    .from('subscriptions')
                    .update({ status: 'expired' })
                    .eq('user_id', userId);
                sub.status = 'expired';
            }
        }

        return NextResponse.json({
            status: sub.status,
            trial_end: sub.trial_end,
            current_period_end: sub.current_period_end,
            days_remaining: daysRemaining,
        });
    } catch (error: any) {
        console.error('Subscription check error:', error);
        return new NextResponse(`Error: ${error.message}`, { status: 500 });
    }
}
