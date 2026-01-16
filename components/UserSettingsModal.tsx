import { useState, useEffect } from 'react';
import { X, Save, Eye, EyeOff, Key, User, LogOut, Shield, Info, CreditCard } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

interface UserSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: any;
}

export const UserSettingsModal = ({ isOpen, onClose, user }: UserSettingsModalProps) => {
    const [activeTab, setActiveTab] = useState<'profile' | 'api'>('profile');
    const [openaiKey, setOpenaiKey] = useState('');
    const [anthropicKey, setAnthropicKey] = useState('');
    const [geminiKey, setGeminiKey] = useState('');
    const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const supabase = createClient();

    useEffect(() => {
        if (isOpen) {
            setOpenaiKey(localStorage.getItem('openai_key') || '');
            setAnthropicKey(localStorage.getItem('anthropic_key') || '');
            setGeminiKey(localStorage.getItem('gemini_key') || '');
        }
    }, [isOpen]);

    const handleSaveKeys = () => {
        localStorage.setItem('openai_key', openaiKey);
        localStorage.setItem('anthropic_key', anthropicKey);
        localStorage.setItem('gemini_key', geminiKey);

        // Dispatch event to notify listeners
        window.dispatchEvent(new Event('storage'));
        onClose();
    };

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

    if (!isOpen) return null;

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
                                    Almacenamiento Seguro
                                </h4>
                                <p className="text-xs text-blue-600/80 dark:text-blue-400/70 leading-relaxed">
                                    Tus claves se guardan localmente en tu navegador. Nunca se envían a nuestros servidores excepto para hacer peticiones directas a los proveedores.
                                </p>
                            </div>

                            {[
                                { id: 'openai', label: 'OpenAI API Key', value: openaiKey, setter: setOpenaiKey },
                                { id: 'anthropic', label: 'Anthropic API Key', value: anthropicKey, setter: setAnthropicKey },
                                { id: 'gemini', label: 'Google Gemini API Key', value: geminiKey, setter: setGeminiKey }
                            ].map((field) => (
                                <div key={field.id} className="space-y-2">
                                    <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 ml-1">
                                        {field.label}
                                    </label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                            <Key className="w-4 h-4" />
                                        </div>
                                        <input
                                            type={showKeys[field.id] ? "text" : "password"}
                                            value={field.value}
                                            onChange={(e) => field.setter(e.target.value)}
                                            className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white text-sm rounded-xl pl-10 pr-10 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all"
                                            placeholder={`sk-...`}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => toggleShowKey(field.id)}
                                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                                        >
                                            {showKeys[field.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                {activeTab === 'api' && (
                    <div className="p-5 border-t border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-black/20 backdrop-blur-xl">
                        <button
                            onClick={handleSaveKeys}
                            className="w-full flex items-center justify-center gap-2 bg-gray-900 dark:bg-white text-white dark:text-black py-3 rounded-xl text-sm font-bold shadow-lg shadow-black/5 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
                        >
                            <Save className="w-4 h-4" />
                            Guardar Cambios
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
