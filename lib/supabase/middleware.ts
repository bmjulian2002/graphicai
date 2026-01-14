import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import type { Database } from './database.types';

export async function updateSession(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    });

    const supabase = createMiddlewareClient<Database>({ req: request, res: response });

    // Refresh session if expired
    const {
        data: { session },
    } = await supabase.auth.getSession();

    // Allow access to auth pages and API endpoints
    const isAuthPage = request.nextUrl.pathname.startsWith('/login') ||
        request.nextUrl.pathname.startsWith('/register');
    const isAuthAPI = request.nextUrl.pathname.startsWith('/api/auth') ||
        request.nextUrl.pathname.startsWith('/api/register');

    // Redirect to login if no session and trying to access protected routes
    if (!session && !isAuthPage && !isAuthAPI) {
        const redirectUrl = request.nextUrl.clone();
        redirectUrl.pathname = '/login';
        return NextResponse.redirect(redirectUrl);
    }

    // Redirect to dashboard if logged in and trying to access auth pages
    if (session && isAuthPage) {
        const redirectUrl = request.nextUrl.clone();
        redirectUrl.pathname = '/dashboard';
        return NextResponse.redirect(redirectUrl);
    }

    return response;
}
