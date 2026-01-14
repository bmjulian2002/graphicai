import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
    try {
        const { email, password } = await req.json();

        if (!email || !password) {
            return NextResponse.json(
                { error: 'Email y contraseña son requeridos' },
                { status: 400 }
            );
        }

        const supabase = await createServerClient();

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            return NextResponse.json(
                { error: 'Credenciales inválidas' },
                { status: 401 }
            );
        }

        return NextResponse.json({
            user: {
                id: data.user.id,
                email: data.user.email,
                name: data.user.user_metadata?.name,
            },
            session: data.session,
        });
    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json(
            { error: 'Error al iniciar sesión' },
            { status: 500 }
        );
    }
}
