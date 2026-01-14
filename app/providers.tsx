'use client';

export function Providers({ children }: { children: React.ReactNode }) {
    // Supabase handles sessions automatically via middleware
    // No provider wrapper needed for basic auth
    return <>{children}</>;
}
