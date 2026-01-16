'use client';

import { useRouter, usePathname } from 'next/navigation';
import { LogOut, Moon, Sun, ArrowLeft, Download, Settings, Bot, Server, Monitor, Database, Box, FileBox, FileJson, Upload } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ImportFlowModal } from '@/components/ImportFlowModal';
import { UserSettingsModal } from '@/components/UserSettingsModal';
import { ExportInstructionsModal } from '@/components/ExportInstructionsModal';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const pathname = usePathname();
    const [darkMode, setDarkMode] = useState(false);
    const [showSidebar, setShowSidebar] = useState(false);
    const [showImportModal, setShowImportModal] = useState(false);
    const [showSettingsModal, setShowSettingsModal] = useState(false);
    const [showExportModal, setShowExportModal] = useState(false);
    const [user, setUser] = useState<any>(null);
    const mcpImportRef = useRef<HTMLInputElement>(null);
    const supabase = createClient();

    const handleMCPImport = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const json = JSON.parse(e.target?.result as string);
                if (!json.mcpServers) {
                    alert('Formato inválido: Falta la clave "mcpServers".');
                    return;
                }
                window.dispatchEvent(new CustomEvent('import-mcp-config', { detail: json }));
                // Optional: Show success toast/notification
            } catch (error) {
                console.error('JSON Parse Error:', error);
                alert('Error al leer el archivo JSON.');
            }
        };
        reader.readAsText(file);
        // Reset the input so the same file can be selected again if needed
        event.target.value = '';
    };

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

    useEffect(() => {
        const handleOpenSettings = () => setShowSettingsModal(true);
        const handleExportSuccess = () => setShowExportModal(true);

        window.addEventListener('open-settings', handleOpenSettings);
        window.addEventListener('export-zip-success', handleExportSuccess);

        return () => {
            window.removeEventListener('open-settings', handleOpenSettings);
            window.removeEventListener('export-zip-success', handleExportSuccess);
        };
    }, []);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Navigation */}
            <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center gap-4">

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
                            <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
                                <button
                                    onClick={() => {
                                        setShowSettingsModal(true);
                                        setShowSidebar(false);
                                    }}
                                    className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                >
                                    <Settings className="w-5 h-5" />
                                    <span className="text-sm font-medium">Configuración</span>
                                </button>
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

            <UserSettingsModal
                isOpen={showSettingsModal}
                onClose={() => setShowSettingsModal(false)}
            />

            <ExportInstructionsModal
                isOpen={showExportModal}
                onClose={() => setShowExportModal(false)}
            />

            {/* Layout */}
            <div className="flex h-[calc(100vh-4rem)]">
                {/* Left Sidebar - Only visible in flow view */}
                {pathname?.startsWith('/flow/') && (
                    <aside className="w-[320px] bg-white/80 dark:bg-[#1c1c1e]/80 backdrop-blur-2xl border-r border-gray-200/50 dark:border-white/5 overflow-y-auto flex flex-col h-full shadow-[4px_0_24px_-12px_rgba(0,0,0,0.1)] z-20 transition-all duration-300">
                        {/* Navigation Section */}
                        <div className="p-5 pt-6 pb-2">
                            <button
                                onClick={() => router.push('/dashboard')}
                                className="group w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white rounded-xl transition-all hover:bg-black/5 dark:hover:bg-white/5"
                            >
                                <div className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 group-hover:bg-white dark:group-hover:bg-gray-700 shadow-sm transition-colors">
                                    <ArrowLeft className="w-4 h-4" />
                                </div>
                                <span className="font-semibold tracking-tight">Volver al Dashboard</span>
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-8">
                            {/* Tools Section */}
                            <div>
                                <div className="flex items-center justify-between px-1 mb-3">
                                    <h3 className="text-[13px] font-semibold text-gray-900 dark:text-gray-100 tracking-tight">Biblioteca de Nodos</h3>
                                    <span className="text-[10px] font-medium text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">
                                        Drag & Drop
                                    </span>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => window.dispatchEvent(new CustomEvent('create-node', { detail: { entityType: 'LLM Agent' } }))}
                                        className="relative flex flex-col items-center justify-center p-3 rounded-2xl border border-gray-200/60 dark:border-gray-700/50 bg-white/80 dark:bg-gray-800/40 hover:bg-white dark:hover:bg-gray-800 hover:border-purple-200 dark:hover:border-purple-900/50 hover:shadow-sm hover:-translate-y-0.5 transition-all duration-300 group text-center"
                                    >
                                        <div className="mb-2 p-2.5 rounded-xl bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform duration-300 shadow-sm">
                                            <Bot className="w-5 h-5" />
                                        </div>
                                        <span className="text-xs font-semibold text-gray-900 dark:text-white mb-0.5">LLM Agent</span>
                                        <span className="text-[9px] text-gray-400 dark:text-gray-500 font-medium">Procesamiento</span>
                                    </button>

                                    <button
                                        onClick={() => window.dispatchEvent(new CustomEvent('create-node', { detail: { entityType: 'MCP Server' } }))}
                                        className="relative flex flex-col items-center justify-center p-3 rounded-2xl border border-gray-200/60 dark:border-gray-700/50 bg-white/80 dark:bg-gray-800/40 hover:bg-white dark:hover:bg-gray-800 hover:border-emerald-200 dark:hover:border-emerald-900/50 hover:shadow-sm hover:-translate-y-0.5 transition-all duration-300 group text-center"
                                    >
                                        <div className="mb-2 p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform duration-300 shadow-sm">
                                            <Server className="w-5 h-5" />
                                        </div>
                                        <span className="text-xs font-semibold text-gray-900 dark:text-white mb-0.5">MCP Server</span>
                                        <span className="text-[9px] text-gray-400 dark:text-gray-500 font-medium">Herramientas</span>
                                    </button>

                                    <button
                                        onClick={() => window.dispatchEvent(new CustomEvent('create-node', { detail: { entityType: 'Client Interface' } }))}
                                        className="relative flex flex-col items-center justify-center p-3 rounded-2xl border border-gray-200/60 dark:border-gray-700/50 bg-white/80 dark:bg-gray-800/40 hover:bg-white dark:hover:bg-gray-800 hover:border-blue-200 dark:hover:border-blue-900/50 hover:shadow-sm hover:-translate-y-0.5 transition-all duration-300 group text-center"
                                    >
                                        <div className="mb-2 p-2.5 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform duration-300 shadow-sm">
                                            <Monitor className="w-5 h-5" />
                                        </div>
                                        <span className="text-xs font-semibold text-gray-900 dark:text-white mb-0.5">Interface</span>
                                        <span className="text-[9px] text-gray-400 dark:text-gray-500 font-medium">Cliente</span>
                                    </button>

                                    <button
                                        onClick={() => window.dispatchEvent(new CustomEvent('create-node', { detail: { entityType: 'Database' } }))}
                                        className="relative flex flex-col items-center justify-center p-3 rounded-2xl border border-gray-200/60 dark:border-gray-700/50 bg-white/80 dark:bg-gray-800/40 hover:bg-white dark:hover:bg-gray-800 hover:border-amber-200 dark:hover:border-amber-900/50 hover:shadow-sm hover:-translate-y-0.5 transition-all duration-300 group text-center"
                                    >
                                        <div className="mb-2 p-2.5 rounded-xl bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform duration-300 shadow-sm">
                                            <Database className="w-5 h-5" />
                                        </div>
                                        <span className="text-xs font-semibold text-gray-900 dark:text-white mb-0.5">Base de Datos</span>
                                        <span className="text-[9px] text-gray-400 dark:text-gray-500 font-medium">Almacenamiento</span>
                                    </button>

                                    <button
                                        onClick={() => window.dispatchEvent(new CustomEvent('create-node', { detail: { entityType: 'Storage' } }))}
                                        className="relative flex flex-col items-center justify-center p-3 rounded-2xl border border-gray-200/60 dark:border-gray-700/50 bg-white/80 dark:bg-gray-800/40 hover:bg-white dark:hover:bg-gray-800 hover:border-rose-200 dark:hover:border-rose-900/50 hover:shadow-sm hover:-translate-y-0.5 transition-all duration-300 group text-center"
                                    >
                                        <div className="mb-2 p-2.5 rounded-xl bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 group-hover:scale-110 transition-transform duration-300 shadow-sm">
                                            <Box className="w-5 h-5" />
                                        </div>
                                        <span className="text-xs font-semibold text-gray-900 dark:text-white mb-0.5">Storage</span>
                                        <span className="text-[9px] text-gray-400 dark:text-gray-500 font-medium">Archivos</span>
                                    </button>
                                </div>
                            </div>

                            {/* Configuration Files Section */}
                            <div>
                                <div className="flex items-center justify-between px-1 mb-3 pt-2">
                                    <h3 className="text-[13px] font-semibold text-gray-900 dark:text-gray-100 tracking-tight">Archivos de Configuración</h3>
                                </div>

                                <input
                                    type="file"
                                    ref={mcpImportRef}
                                    className="hidden"
                                    accept=".json"
                                    onChange={handleMCPImport}
                                />

                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        onClick={() => mcpImportRef.current?.click()}
                                        className="relative flex flex-col items-center justify-center p-2.5 rounded-xl border border-gray-200/60 dark:border-gray-700/50 bg-white/50 dark:bg-gray-800/20 hover:bg-white dark:hover:bg-gray-800 hover:border-blue-200 dark:hover:border-blue-800 transition-all duration-200 group text-center"
                                    >
                                        <div className="mb-1.5 p-1.5 rounded-lg bg-blue-100/50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                                            <Upload className="w-4 h-4" />
                                        </div>
                                        <span className="text-[10px] font-semibold text-gray-900 dark:text-white">Importar</span>
                                        <span className="text-[9px] text-gray-400 dark:text-gray-500">JSON</span>
                                    </button>

                                    <button
                                        onClick={() => window.dispatchEvent(new CustomEvent('request-mcp-export'))}
                                        className="relative flex flex-col items-center justify-center p-2.5 rounded-xl border border-gray-200/60 dark:border-gray-700/50 bg-white/50 dark:bg-gray-800/20 hover:bg-white dark:hover:bg-gray-800 hover:border-blue-200 dark:hover:border-blue-800 transition-all duration-200 group text-center"
                                    >
                                        <div className="mb-1.5 p-1.5 rounded-lg bg-blue-100/50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                                            <FileJson className="w-4 h-4" />
                                        </div>
                                        <span className="text-[10px] font-semibold text-gray-900 dark:text-white">Exportar</span>
                                        <span className="text-[9px] text-gray-400 dark:text-gray-500">Claude</span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* System Footer */}
                        <div className="p-5 border-t border-gray-200/50 dark:border-white/5 bg-gray-50/50 dark:bg-black/20 backdrop-blur-xl">
                            <h2 className="text-[10px] font-bold text-gray-400 dark:text-gray-600 uppercase tracking-wider mb-3 px-1">
                                Acciones del Sistema
                            </h2>
                            <div className="space-y-1">
                                <button
                                    onClick={() => window.dispatchEvent(new CustomEvent('export-workbench-zip'))}
                                    className="w-full flex items-center gap-3 px-3 py-2 text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors"
                                >
                                    <FileBox className="w-4 h-4" />
                                    <span>Exportar Mesa de Trabajo</span>
                                </button>
                                <button
                                    onClick={() => window.dispatchEvent(new CustomEvent('export-flow'))}
                                    className="w-full flex items-center gap-3 px-3 py-2 text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors"
                                >
                                    <Download className="w-4 h-4" />
                                    <span>Exportar Configuración</span>
                                </button>
                                <button
                                    onClick={() => setShowImportModal(true)}
                                    className="w-full flex items-center gap-3 px-3 py-2 text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors"
                                >
                                    <Download className="w-4 h-4 rotate-180" />
                                    <span>Importar Configuración</span>
                                </button>
                            </div>
                        </div>
                    </aside>
                )}

                <ImportFlowModal
                    isOpen={showImportModal}
                    onClose={() => setShowImportModal(false)}
                />

                {/* Main Content */}
                <main className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-900">
                    <div className={pathname?.startsWith('/flow/') ? 'h-full' : 'max-w-7xl mx-auto p-8'}>
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
