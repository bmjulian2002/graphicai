'use client';

import { useRouter, usePathname } from 'next/navigation';
import { LogOut, Moon, Sun, ArrowLeft } from 'lucide-react';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const pathname = usePathname();
    const [darkMode, setDarkMode] = useState(false);
    const [showSidebar, setShowSidebar] = useState(false);
    const [user, setUser] = useState<any>(null);
    const supabase = createClient();

    useEffect(() => {
        const isDark = document.documentElement.classList.contains('dark');
        setDarkMode(isDark);

        // Get current user
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
        };
        getUser();
    }, [supabase]);

    const toggleDarkMode = () => {
        document.documentElement.classList.toggle('dark');
        setDarkMode(!darkMode);
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/login');
        router.refresh();
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Navigation */}
            <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center gap-4">
                            {pathname?.startsWith('/flow/') && (
                                <button
                                    onClick={() => router.push('/dashboard')}
                                    className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-lg transition-all"
                                    title="Volver al dashboard"
                                >
                                    <ArrowLeft className="w-5 h-5" />
                                </button>
                            )}
                            <div>
                                <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif' }}>
                                    GraphicAI
                                </h1>
                            </div>
                        </div>

                        {/* Right side - Apple style */}
                        <div className="flex items-center gap-2">
                            {/* Dark mode toggle */}
                            <button
                                onClick={toggleDarkMode}
                                className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-lg transition-all"
                            >
                                {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                            </button>

                            {/* User avatar - opens sidebar */}
                            <button
                                onClick={() => setShowSidebar(!showSidebar)}
                                className="flex items-center gap-2 px-2 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-lg transition-all"
                            >
                                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center ring-2 ring-white dark:ring-gray-800">
                                    <span className="text-white text-sm font-semibold">
                                        {user?.email?.[0].toUpperCase() || 'U'}
                                    </span>
                                </div>
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Sidebar */}
            {showSidebar && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 bg-black/20 dark:bg-black/40 z-40 backdrop-blur-sm"
                        onClick={() => setShowSidebar(false)}
                    />

                    {/* Sidebar panel */}
                    <div className="fixed top-0 right-0 h-full w-80 bg-white dark:bg-gray-800 shadow-2xl z-50 border-l border-gray-200 dark:border-gray-700 animate-slide-in">
                        <div className="flex flex-col h-full">
                            {/* Sidebar header */}
                            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center ring-2 ring-blue-100 dark:ring-blue-900">
                                        <span className="text-white text-lg font-semibold">
                                            {user?.email?.[0].toUpperCase() || 'U'}
                                        </span>
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                            {user?.email?.split('@')[0] || 'Usuario'}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                            {user?.email || 'usuario@example.com'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Sidebar content */}
                            <div className="flex-1 p-4 space-y-1">
                                <button
                                    onClick={() => {
                                        router.push('/dashboard');
                                        setShowSidebar(false);
                                    }}
                                    className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-left"
                                >
                                    <span className="text-sm font-medium">Dashboard</span>
                                </button>
                            </div>

                            {/* Sidebar footer */}
                            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                                <button
                                    onClick={handleLogout}
                                    className="w-full flex items-center gap-3 px-4 py-3 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                >
                                    <LogOut className="w-5 h-5" />
                                    <span className="text-sm font-medium">Cerrar sesión</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* Layout with Left Sidebar */}
            <div className="flex h-[calc(100vh-4rem)]">
                {/* Left Sidebar */}
                <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
                    <div className="p-4">
                        <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
                            Navegación
                        </h2>
                        <nav className="space-y-1">
                            <button
                                onClick={() => router.push('/dashboard')}
                                className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${pathname === '/dashboard'
                                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                                    }`}
                            >
                                <span>Dashboard</span>
                            </button>
                        </nav>
                    </div>
                </aside>

                {/* Main Content */}
                <main className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-900">
                    {children}
                </main>
            </div>
        </div>
    );
}
