import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import type { Database } from './database.types';

export async function updateSession(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    });

    const supabase = createServerClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value));
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    });
                    cookiesToSet.forEach(({ name, value, options }) =>
                        response.cookies.set(name, value, options)
                    );
                },
            },
        }
    );

    // Refresh session if expired
    const {
        data: { user },
    } = await supabase.auth.getUser();

    // Allow access to auth pages and API endpoints
    const isAuthPage = request.nextUrl.pathname.startsWith('/login') ||
        request.nextUrl.pathname.startsWith('/register');
    const isAuthAPI = request.nextUrl.pathname.startsWith('/api/auth') ||
        request.nextUrl.pathname.startsWith('/api/register');

    // Redirect to login if no session and trying to access protected routes
    if (!user && !isAuthPage && !isAuthAPI) {
        const redirectUrl = request.nextUrl.clone();
        redirectUrl.pathname = '/login';
        return NextResponse.redirect(redirectUrl);
    }

    // Redirect to dashboard if logged in and trying to access auth pages
    if (user && isAuthPage) {
        const redirectUrl = request.nextUrl.clone();
        redirectUrl.pathname = '/dashboard';
        return NextResponse.redirect(redirectUrl);
    }

    return response;
}
