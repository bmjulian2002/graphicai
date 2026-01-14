import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
    try {
        const { name, email, password } = await req.json();

        if (!email || !password) {
            return NextResponse.json(
                { error: 'Email y contraseña son requeridos' },
                { status: 400 }
            );
        }

        const supabase = await createServerClient();

        // Register user with Supabase Auth
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    name: name || null,
                },
            },
        });

        if (error) {
            if (error.message.includes('already registered') || error.message.includes('already exists')) {
                return NextResponse.json(
                    { error: 'El usuario ya existe' },
                    { status: 400 }
                );
            }
            throw error;
        }

        return NextResponse.json(
            {
                user: {
                    id: data.user?.id,
                    name: data.user?.user_metadata?.name,
                    email: data.user?.email,
                },
            },
            { status: 201 }
        );
    } catch (error) {
        console.error('Registration error:', error);
        return NextResponse.json(
            { error: 'Error al crear la cuenta' },
            { status: 500 }
        );
    }
}
