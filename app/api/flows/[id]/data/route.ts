import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

// GET flow data (nodes and edges)
export async function GET(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const supabase = createServerClient();

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
            .eq('id', params.id)
            .eq('user_id', user.id)
            .single();

        if (error || !flow) {
            return NextResponse.json(
                { error: 'Flujo no encontrado' },
                { status: 404 }
            );
        }

        const flowData = Array.isArray(flow.flow_data) ? flow.flow_data[0] : flow.flow_data;

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
    { params }: { params: { id: string } }
) {
    try {
        const supabase = createServerClient();

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
            .eq('id', params.id)
            .eq('user_id', user.id)
            .single();

        if (flowError || !flow) {
            return NextResponse.json(
                { error: 'Flujo no encontrado' },
                { status: 404 }
            );
        }

        // Update flow data (upsert)
        const { error: updateError } = await supabase
            .from('flow_data')
            .update({
                nodes_data: nodes,
                edges_data: edges,
            })
            .eq('flow_id', params.id);

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
