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
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${selectedProvider === p.id
                                        ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm ring-1 ring-gray-200 dark:ring-gray-700'
                                        : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-gray-200'
                                        }`}
                                >
                                    <p.icon className={`w-4 h-4 ${p.color}`} />
                                    <span>{p.name}</span>
                                    {inputs[p.id] && (
                                        <div className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 p-8 flex flex-col relative">
                    <button
                        onClick={onClose}
                        className="absolute top-6 right-6 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    <div className="flex-1">
                        <div className="mb-6">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <Key className="w-5 h-5 text-blue-500" />
                                Bring Your Own Key (BYOK)
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                                {providers.find(p => p.id === selectedProvider)?.desc}
                            </p>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                                    {providers.find(p => p.id === selectedProvider)?.name} API Key
                                </label>
                                <div className="relative">
                                    <input
                                        type={showKey ? "text" : "password"}
                                        value={inputs[selectedProvider]}
                                        onChange={(e) => {
                                            setInputs(prev => ({ ...prev, [selectedProvider]: e.target.value }));
                                            setValidationError(null);
                                        }}
                                        className={`w-full pl-4 pr-12 py-3 bg-gray-50 dark:bg-gray-900 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-mono text-gray-900 dark:text-white transition-all ${validationError
                                                ? 'border-red-500 focus:ring-red-500'
                                                : 'border-gray-200 dark:border-gray-700'
                                            }`}
                                        placeholder={`sk-...`}
                                        disabled={isValidating}
                                    />
                                    {validationError && (
                                        <p className="text-red-500 text-xs mt-1 font-medium animate-in slide-in-from-top-1">
                                            {validationError}
                                        </p>
                                    )}
                                    <button
                                        onClick={() => setShowKey(!showKey)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg transition-colors"
                                    >
                                        {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 p-4 rounded-xl text-xs leading-relaxed flex gap-3">
                                <ShieldCheck className="w-5 h-5 min-w-[20px]" />
                                <p>
                                    Tu clave se guarda <strong>exclusivamente en tu navegador</strong> (LocalStorage).
                                    Nunca se envía a nuestra base de datos ni servidores. Tú tienes el control total.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="pt-6 border-t border-gray-100 dark:border-gray-800 flex justify-end">
                        <button
                            onClick={() => handleSave(selectedProvider)}
                            disabled={isValidating || !inputs[selectedProvider]}
                            className={`
                                flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300
                                ${saveStatus === selectedProvider
                                    ? 'bg-emerald-500 text-white shadow-emerald-500/30'
                                    : 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 shadow-lg hover:shadow-xl'}
                                disabled:opacity-50 disabled:cursor-not-allowed
                            `}
                        >
                            {isValidating ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
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
