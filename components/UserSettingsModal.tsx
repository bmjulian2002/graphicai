import { useState, useEffect } from 'react';
import { X, Eye, EyeOff, Key, User, LogOut, Shield, Info, Zap, Box, Cpu, Sun, Moon } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useApiKeys } from '@/hooks/useApiKeys';

interface UserSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: any;
    darkMode: boolean;
    toggleTheme: () => void;
    initialTab?: 'profile' | 'api';
    allowEdit?: boolean;
}

export const UserSettingsModal = ({ isOpen, onClose, user, darkMode, toggleTheme, initialTab = 'profile', allowEdit = false }: UserSettingsModalProps) => {
    const [activeTab, setActiveTab] = useState<'profile' | 'api'>(initialTab);
    const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
    const [inputValues, setInputValues] = useState<Record<string, string>>({});
    const [isLoading, setIsLoading] = useState(false);

    const router = useRouter();
    const supabase = createClient();
    const { geminiKey, openaiKey, anthropicKey, saveKey } = useApiKeys();

    const keys = {
        gemini: geminiKey,
        openai: openaiKey,
        anthropic: anthropicKey
    };

    // Initialize inputs when modal opens or keys change
    useEffect(() => {
        if (isOpen) {
            setActiveTab(initialTab);
            setInputValues({
                gemini: geminiKey || '',
                openai: openaiKey || '',
                anthropic: anthropicKey || ''
            });
        }
    }, [isOpen, initialTab, geminiKey, openaiKey, anthropicKey]);

    const handleLogout = async () => {
        try {
            setIsLoading(true);
            await supabase.auth.signOut();
            router.push('/login');
            router.refresh();
        } catch (error) {
            console.error('Error signing out:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const toggleShowKey = (key: string) => {
        setShowKeys(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleSaveKey = (providerId: string) => {
        const value = inputValues[providerId];
        saveKey(providerId as 'gemini' | 'openai' | 'anthropic', value);
    };

    const handleClearKey = (providerId: string) => {
        saveKey(providerId as 'gemini' | 'openai' | 'anthropic', '');
        setInputValues(prev => ({ ...prev, [providerId]: '' }));
    };

    if (!isOpen) return null;

    const providers = [
        {
            id: 'gemini',
            name: 'Google Gemini',
            icon: Zap,
            color: 'text-yellow-500',
            bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
            placeholder: 'AIzaSy...'
        },
        {
            id: 'openai',
            name: 'OpenAI',
            icon: Box,
            color: 'text-green-500',
            bgColor: 'bg-green-100 dark:bg-green-900/30',
            placeholder: 'sk-...'
        },
        {
            id: 'anthropic',
            name: 'Anthropic',
            icon: Cpu,
            color: 'text-purple-500',
            bgColor: 'bg-purple-100 dark:bg-purple-900/30',
            placeholder: 'sk-ant-...'
        }
    ];

    const configuredProviders = providers.filter(p => !!keys[p.id as keyof typeof keys]);

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/20 dark:bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-[#1c1c1e] w-full max-w-md rounded-[24px] shadow-2xl border border-gray-200/50 dark:border-white/10 overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 dark:border-white/5 flex items-center justify-between bg-white/50 dark:bg-white/5 backdrop-blur-xl">
                    <h2 className="text-base font-bold text-gray-900 dark:text-white">Ajustes</h2>
                    <button
                        onClick={onClose}
                        className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Segmented Control */}
                <div className="px-6 pt-5 pb-2">
                    <div className="flex p-1 bg-gray-100 dark:bg-black/40 rounded-xl">
                        <button
                            onClick={() => setActiveTab('profile')}
                            className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-all duration-200 ${activeTab === 'profile'
                                ? 'bg-white dark:bg-[#2c2c2e] text-gray-900 dark:text-white shadow-sm'
                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                                }`}
                        >
                            <User className="w-3.5 h-3.5" />
                            Perfil
                        </button>
                        <button
                            onClick={() => setActiveTab('api')}
                            className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-all duration-200 ${activeTab === 'api'
                                ? 'bg-white dark:bg-[#2c2c2e] text-gray-900 dark:text-white shadow-sm'
                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                                }`}
                        >
                            <Key className="w-3.5 h-3.5" />
                            API Keys
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto px-6 py-4">
                    {activeTab === 'profile' ? (
                        <div className="space-y-6">
                            {/* Profile Card */}
                            <div className="flex items-center gap-4 p-4 bg-gray-50/50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5">
                                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-blue-500/20 ring-4 ring-white dark:ring-gray-800">
                                    {user?.email?.[0]?.toUpperCase() || 'U'}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate">
                                        {user?.email?.split('@')[0] || 'Usuario'}
                                    </h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                        {user?.email || 'usuario@example.com'}
                                    </p>
                                    <div className="flex items-center gap-2 mt-2">
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold uppercase tracking-wide">
                                            <Shield className="w-3 h-3" />
                                            Pro Plan
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Info Section */}
                            <div className="space-y-1">
                                <div className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-blue-100/50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
                                            <Info className="w-4 h-4" />
                                        </div>
                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Versión</span>
                                    </div>
                                    <span className="text-xs font-bold text-gray-400 dark:text-gray-500">v2.0.1</span>
                                </div>
                            </div>

                            {/* Appearance Section */}
                            <div className="space-y-3 pt-2">
                                <h3 className="px-1 text-xs font-bold text-gray-400 uppercase tracking-wider">Apariencia</h3>
                                <div className="flex p-1 bg-gray-100 dark:bg-black/40 rounded-xl">
                                    <button
                                        onClick={() => { if (darkMode) toggleTheme(); }}
                                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-semibold rounded-lg transition-all duration-200 ${!darkMode
                                            ? 'bg-white dark:bg-[#2c2c2e] text-gray-900 dark:text-white shadow-sm ring-1 ring-black/5 dark:ring-white/10'
                                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                                            }`}
                                    >
                                        <Sun className={`w-3.5 h-3.5 ${!darkMode ? 'fill-current' : ''}`} />
                                        Claro
                                    </button>
                                    <button
                                        onClick={() => { if (!darkMode) toggleTheme(); }}
                                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-semibold rounded-lg transition-all duration-200 ${darkMode
                                            ? 'bg-white dark:bg-[#2c2c2e] text-gray-900 dark:text-white shadow-sm ring-1 ring-black/5 dark:ring-white/10'
                                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                                            }`}
                                    >
                                        <Moon className={`w-3.5 h-3.5 ${darkMode ? 'fill-current' : ''}`} />
                                        Oscuro
                                    </button>
                                </div>
                            </div>

                            {/* Logout */}
                            <button
                                onClick={handleLogout}
                                disabled={isLoading}
                                className="w-full flex items-center justify-center gap-2 p-3.5 rounded-xl border border-red-200 dark:border-red-900/30 bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 font-semibold text-sm hover:bg-red-100 dark:hover:bg-red-900/20 transition-all duration-200 disabled:opacity-50"
                            >
                                <LogOut className="w-4 h-4" />
                                {isLoading ? 'Cerrando sesión...' : 'Cerrar Sesión'}
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-5">
                            <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-xl border border-blue-100 dark:border-blue-900/20">
                                <h4 className="flex items-center gap-2 text-xs font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wide mb-1">
                                    <Shield className="w-3.5 h-3.5" />
                                    {allowEdit ? 'Configuración de Llaves' : 'Visualización de Llaves'}
                                </h4>
                                <p className="text-xs text-blue-600/80 dark:text-blue-400/70 leading-relaxed">
                                    {allowEdit
                                        ? 'Gestiona tus llaves API personales. Se guardan localmente en tu navegador.'
                                        : 'Estas son las llaves API configuradas actualmente en tu entorno local.'
                                    }
                                </p>
                            </div>

                            <div className="space-y-3">
                                {allowEdit ? (
                                    // Make inputs for all providers in edit mode
                                    providers.map((provider) => (
                                        <div key={provider.id} className="p-3 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5 transition-all focus-within:ring-2 focus-within:ring-blue-500/20">
                                            <div className="flex items-center gap-2 mb-2">
                                                <div className={`p-1.5 rounded-lg ${provider.bgColor} ${provider.color}`}>
                                                    <provider.icon className="w-3 h-3" />
                                                </div>
                                                <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">{provider.name}</span>
                                            </div>
                                            <div className="flex gap-2">
                                                <input
                                                    type="password"
                                                    value={inputValues[provider.id] || ''}
                                                    onChange={(e) => setInputValues(prev => ({ ...prev, [provider.id]: e.target.value }))}
                                                    placeholder={provider.placeholder}
                                                    className="flex-1 bg-white dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-gray-800 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:border-blue-500/50 transition-colors"
                                                />
                                                <button
                                                    onClick={() => handleSaveKey(provider.id)}
                                                    className="p-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
                                                    title="Guardar"
                                                >
                                                    <Shield className="w-3.5 h-3.5" />
                                                </button>
                                                {inputValues[provider.id] && (
                                                    <button
                                                        onClick={() => handleClearKey(provider.id)}
                                                        className="p-2 bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                                                        title="Borrar"
                                                    >
                                                        <X className="w-3.5 h-3.5" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    // Read-only list
                                    configuredProviders.length > 0 ? (
                                        configuredProviders.map((provider) => (
                                            <div key={provider.id} className="group relative overflow-hidden bg-gray-50 dark:bg-black/20 border border-gray-100 dark:border-white/5 rounded-xl p-3 flex items-center gap-3 transition-all hover:bg-gray-100 dark:hover:bg-white/5">
                                                <div className={`p-2 rounded-lg ${provider.bgColor} ${provider.color}`}>
                                                    <provider.icon className="w-4 h-4" />
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between mb-0.5">
                                                        <span className="text-sm font-semibold text-gray-900 dark:text-white">
                                                            {provider.name}
                                                        </span>
                                                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/30 px-1.5 py-0.5 rounded-md">
                                                            Activo
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <code className="text-xs font-mono text-gray-500 dark:text-gray-400 truncate max-w-[150px]">
                                                            {showKeys[provider.id] ? keys[provider.id as keyof typeof keys] : '••••••••••••••••'}
                                                        </code>
                                                        <button
                                                            onClick={() => toggleShowKey(provider.id)}
                                                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                                                        >
                                                            {showKeys[provider.id] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="flex flex-col items-center justify-center py-10 text-center">
                                            <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center mb-3">
                                                <Key className="w-6 h-6 text-gray-300 dark:text-gray-600" />
                                            </div>
                                            <p className="text-sm font-medium text-gray-900 dark:text-white">No hay llaves configuradas</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-[200px]">
                                                No se han detectado API Keys guardadas en este dispositivo.
                                            </p>
                                        </div>
                                    )
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
