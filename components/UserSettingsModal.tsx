import React, { useState, useEffect } from 'react';
import { X, Key, Save, Eye, EyeOff, ShieldCheck, Zap, Cpu, Box, Check } from 'lucide-react';
import { useApiKeys } from '@/hooks/useApiKeys';

interface UserSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

type Provider = 'gemini' | 'openai' | 'anthropic';

export const UserSettingsModal = ({ isOpen, onClose }: UserSettingsModalProps) => {
    const { geminiKey, openaiKey, anthropicKey, saveKey } = useApiKeys();
    const [selectedProvider, setSelectedProvider] = useState<Provider>('gemini');

    // Internal state for inputs to allow editing before saving
    const [inputs, setInputs] = useState({
        gemini: '',
        openai: '',
        anthropic: ''
    });

    const [showKey, setShowKey] = useState(false);
    const [saveStatus, setSaveStatus] = useState<Provider | null>(null);
    const [isValidating, setIsValidating] = useState(false);
    const [validationError, setValidationError] = useState<string | null>(null);

    // Sync inputs with stored keys when modal opens or keys load
    useEffect(() => {
        setInputs({
            gemini: geminiKey || '',
            openai: openaiKey || '',
            anthropic: anthropicKey || ''
        });
    }, [geminiKey, openaiKey, anthropicKey, isOpen]);

    const handleSave = async (provider: Provider) => {
        setValidationError(null);
        setIsValidating(true);
        setSaveStatus(null);

        const keyToSave = inputs[provider];

        if (!keyToSave) {
            setValidationError('La clave no puede estar vacía.');
            setIsValidating(false);
            return;
        }

        try {
            // Dynamic import to ensure server action is handled correctly
            const { validateApiKey } = await import('@/app/actions/validate-key');
            const result = await validateApiKey(provider, keyToSave);

            if (!result.valid) {
                setValidationError(result.error || 'La clave API no es válida.');
                setIsValidating(false);
                return;
            }

            // Si es válida, guardar
            saveKey(provider, keyToSave);
            setSaveStatus(provider);
            setTimeout(() => setSaveStatus(null), 2000);

        } catch (err) {
            console.error(err);
            setValidationError('Error al intentar validar la clave.');
        } finally {
            setIsValidating(false);
        }
    };

    if (!isOpen) return null;

    const providers = [
        {
            id: 'gemini',
            name: 'Google Gemini',
            icon: Zap,
            color: 'text-yellow-500',
            desc: 'Recomendado para uso gratuito (Free Tier).'
        },
        {
            id: 'openai',
            name: 'OpenAI (GPT-4)',
            icon: Box,
            color: 'text-green-500',
            desc: 'Requiere cuenta con créditos activos.'
        },
        {
            id: 'anthropic',
            name: 'Anthropic (Claude)',
            icon: Cpu,
            color: 'text-purple-500',
            desc: 'Excelente para razonamiento complejo.'
        }
    ] as const;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className="relative w-full max-w-2xl bg-white dark:bg-[#1c1c1e] rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-300 ring-1 ring-black/5 dark:ring-white/10 flex flex-col md:flex-row min-h-[500px] max-h-[85vh] overflow-y-auto">

                {/* Sidebar Navigation */}
                <div className="w-full md:w-64 bg-gray-50/50 dark:bg-black/20 border-b md:border-b-0 md:border-r border-gray-100 dark:border-gray-800 p-6 flex flex-col justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                            Configuración
                        </h2>

                        <div className="space-y-2">
                            {providers.map((p) => (
                                <button
                                    key={p.id}
                                    onClick={() => {
                                        setSelectedProvider(p.id);
                                        setValidationError(null);
                                        setSaveStatus(null);
                                    }}
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
                            className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-all duration-200 ${
                                activeTab === 'profile'
                                    ? 'bg-white dark:bg-[#2c2c2e] text-gray-900 dark:text-white shadow-sm'
                                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                            }`}
                        >
                            <User className="w-3.5 h-3.5" />
                            Perfil
                        </button>
                        <button
                            onClick={() => setActiveTab('api')}
                            className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-all duration-200 ${
                                activeTab === 'api'
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
                                    Validando...
                                </>
                            ) : saveStatus === selectedProvider ? (
                                <>
                                    <Check className="w-4 h-4" />
                                    Validado y Guardado
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4" />
                                    Validar y Guardar
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
                    </div>
                    );
};
