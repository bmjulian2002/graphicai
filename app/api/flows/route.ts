import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

// GET all flows for the current user
export async function GET() {
    try {
        const supabase = createServerClient();

        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        const { data: flows, error } = await supabase
            .from('flows')
            .select(`
        *,
        flow_data (*)
      `)
            .eq('user_id', user.id)
            .order('updated_at', { ascending: false });

        if (error) throw error;

        return NextResponse.json({ flows });
    } catch (error) {
        console.error('Error fetching flows:', error);
        return NextResponse.json(
            { error: 'Error al obtener los flujos' },
            { status: 500 }
        );
    }
}

// POST create a new flow
export async function POST(req: Request) {
    try {
        const supabase = createServerClient();

        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        const { name, description } = await req.json();

        if (!name) {
            return NextResponse.json(
                { error: 'El nombre es requerido' },
                { status: 400 }
            );
        }

        // Create flow
        const { data: flow, error: flowError } = await supabase
            .from('flows')
            .insert({
                name,
                description,
                user_id: user.id,
            })
            .select()
            .single();

        if (flowError) throw flowError;

        // Create flow data
        const { error: flowDataError } = await supabase
            .from('flow_data')
            .insert({
                flow_id: flow.id,
                nodes_data: [],
                edges_data: [],
            });

        if (flowDataError) throw flowDataError;

        // Fetch complete flow with data
        const { data: completeFlow, error: fetchError } = await supabase
            .from('flows')
            .select(`
        *,
        flow_data (*)
      `)
            .eq('id', flow.id)
            .single();

        if (fetchError) throw fetchError;

        return NextResponse.json({ flow: completeFlow }, { status: 201 });
    } catch (error) {
        console.error('Error creating flow:', error);
        return NextResponse.json(
            { error: 'Error al crear el flujo' },
            { status: 500 }
        );
    }
}
