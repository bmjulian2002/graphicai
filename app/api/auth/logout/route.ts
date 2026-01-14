import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function POST() {
    try {
        const supabase = await createServerClient();
        await supabase.auth.signOut();
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Logout error:', error);
        return NextResponse.json(
            { error: 'Error al cerrar sesión' },
            { status: 500 }
        );
    }
}
