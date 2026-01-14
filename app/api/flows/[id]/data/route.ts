import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

// GET flow data (nodes and edges)
export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const supabase = await createServerClient();

        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        const { data: flow, error } = await supabase
            .from('flows')
            .select(`
                *,
                flow_data (*)
            `)
            .eq('id', id)
            .eq('user_id', user.id)
            .single();

        if (error || !flow) {
            return NextResponse.json(
                { error: 'Flujo no encontrado' },
                { status: 404 }
            );
        }

        // Explicitly cast or handle the joined data to avoid 'never' type error
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const flowWithData = flow as any;
        const flowData = Array.isArray(flowWithData.flow_data) ? flowWithData.flow_data[0] : flowWithData.flow_data;

        return NextResponse.json({
            nodes: flowData?.nodes_data || [],
            edges: flowData?.edges_data || [],
        });
    } catch (error) {
        console.error('Error fetching flow data:', error);
        return NextResponse.json(
            { error: 'Error al obtener los datos del flujo' },
            { status: 500 }
        );
    }
}

// PUT update flow data (nodes and edges)
export async function PUT(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const supabase = await createServerClient();

        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        const { nodes, edges } = await req.json();

        // Verify flow ownership
        const { data: flow, error: flowError } = await supabase
            .from('flows')
            .select('id')
            .eq('id', id)
            .eq('user_id', user.id)
            .single();

        if (flowError || !flow) {
            return NextResponse.json(
                { error: 'Flujo no encontrado' },
                { status: 404 }
            );
        }

        // Update flow data (upsert)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error: updateError } = await (supabase.from('flow_data' as any) as any)
            .update({
                nodes_data: nodes,
                edges_data: edges,
            })
            .eq('flow_id', id);

        if (updateError) throw updateError;

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error updating flow data:', error);
        return NextResponse.json(
            { error: 'Error al actualizar los datos del flujo' },
            { status: 500 }
        );
    }
}
