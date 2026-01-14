import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

// GET a specific flow
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

        return NextResponse.json({ flow });
    } catch (error) {
        console.error('Error fetching flow:', error);
        return NextResponse.json(
            { error: 'Error al obtener el flujo' },
            { status: 500 }
        );
    }
}

// PUT update a flow
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

        const { name, description } = await req.json();

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error } = await (supabase.from('flows' as any) as any)
            .update({
                name,
                description,
            })
            .eq('id', id)
            .eq('user_id', user.id)
            .select();

        if (error || !data || data.length === 0) {
            return NextResponse.json(
                { error: 'Flujo no encontrado' },
                { status: 404 }
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error updating flow:', error);
        return NextResponse.json(
            { error: 'Error al actualizar el flujo' },
            { status: 500 }
        );
    }
}

// DELETE a flow
export async function DELETE(
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

        const { data, error } = await supabase
            .from('flows')
            .delete()
            .eq('id', id)
            .eq('user_id', user.id)
            .select();

        if (error || !data || data.length === 0) {
            return NextResponse.json(
                { error: 'Flujo no encontrado' },
                { status: 404 }
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting flow:', error);
        return NextResponse.json(
            { error: 'Error al eliminar el flujo' },
            { status: 500 }
        );
    }
}
