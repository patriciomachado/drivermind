import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ table: string }> }
) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const { table } = await params;
        const { searchParams } = new URL(req.url);
        
        // Allowed tables for this generic API
        const allowedTables = ['vehicles', 'work_days', 'earnings', 'expenses', 'maintenances', 'fixed_costs'];
        if (!allowedTables.includes(table)) {
            return new NextResponse('Forbidden Table', { status: 403 });
        }

        const supabase = getSupabaseAdmin();
        let query = supabase.from(table).select('*').eq('user_id', userId);

        // Filter by vehicle_id if provided
        const vehicle_id = searchParams.get('vehicle_id');
        if (vehicle_id) {
            query = query.eq('vehicle_id', vehicle_id);
        }

        // Filter by id if provided
        const id = searchParams.get('id');
        if (id) {
            query = query.eq('id', id);
        }

        // Filter by work_day_id if provided
        const work_day_id = searchParams.get('work_day_id');
        if (work_day_id) {
            query = query.eq('work_day_id', work_day_id);
        }

        // Apply ordering if needed
        if (table === 'work_days') {
            query = query.order('date', { ascending: false });
        } else if (['earnings', 'expenses', 'maintenances', 'fixed_costs'].includes(table)) {
            query = query.order('created_at', { ascending: false });
        }

        const { data, error } = await query;

        if (error) {
            console.error(`Error fetching from ${table}:`, error);
            return new NextResponse(`Database Error: ${error.message}`, { status: 500 });
        }

        return NextResponse.json(data);
    } catch (error: any) {
        console.error('API Error:', error);
        return new NextResponse(`Server Error: ${error.message}`, { status: 500 });
    }
}

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ table: string }> }
) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const { table } = await params;
        const allowedTables = ['vehicles', 'work_days', 'earnings', 'expenses', 'maintenances', 'fixed_costs'];
        if (!allowedTables.includes(table)) {
            return new NextResponse('Forbidden Table', { status: 403 });
        }

        const body = await req.json();
        const supabase = getSupabaseAdmin();

        // Enforce user_id
        const dataToInsert = { ...body, user_id: userId };

        const { data, error } = await supabase
            .from(table)
            .insert(dataToInsert)
            .select()
            .single();

        if (error) {
            console.error(`Error inserting into ${table}:`, error);
            return new NextResponse(`Database Error: ${error.message}`, { status: 500 });
        }

        return NextResponse.json(data);
    } catch (error: any) {
        console.error('API Error:', error);
        return new NextResponse(`Server Error: ${error.message}`, { status: 500 });
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ table: string }> }
) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const { table } = await params;
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');
        const work_day_id = searchParams.get('work_day_id');

        const allowedTables = ['vehicles', 'work_days', 'earnings', 'expenses', 'maintenances', 'fixed_costs'];
        if (!allowedTables.includes(table)) {
            return new NextResponse('Forbidden Table', { status: 403 });
        }

        const supabase = getSupabaseAdmin();
        let query = supabase.from(table).delete().eq('user_id', userId);

        if (id) {
            query = query.eq('id', id);
        } else if (work_day_id) {
            query = query.eq('work_day_id', work_day_id);
        } else {
            return new NextResponse('Missing Filter', { status: 400 });
        }

        const { error } = await query;

        if (error) {
            console.error(`Error deleting from ${table}:`, error);
            return new NextResponse(`Database Error: ${error.message}`, { status: 500 });
        }

        return new NextResponse(null, { status: 204 });
    } catch (error: any) {
        console.error('API Error:', error);
        return new NextResponse(`Server Error: ${error.message}`, { status: 500 });
    }
}

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ table: string }> }
) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const { table } = await params;
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) {
            return new NextResponse('Missing ID', { status: 400 });
        }

        const allowedTables = ['vehicles', 'work_days', 'earnings', 'expenses', 'maintenances', 'fixed_costs'];
        if (!allowedTables.includes(table)) {
            return new NextResponse('Forbidden Table', { status: 403 });
        }

        const body = await req.json();
        const supabase = getSupabaseAdmin();

        const { data, error } = await supabase
            .from(table)
            .update(body)
            .eq('id', id)
            .eq('user_id', userId)
            .select()
            .single();

        if (error) {
            console.error(`Error updating ${table}:`, error);
            return new NextResponse(`Database Error: ${error.message}`, { status: 500 });
        }

        return NextResponse.json(data);
    } catch (error: any) {
        console.error('API Error:', error);
        return new NextResponse(`Server Error: ${error.message}`, { status: 500 });
    }
}
