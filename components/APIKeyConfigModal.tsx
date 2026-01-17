import React, { useState, useEffect } from 'react';
import { X, Key, Save, Eye, EyeOff, ShieldCheck, Zap, Cpu, Box, Check, Loader2, Trash2 } from 'lucide-react';
import { useApiKeys } from '@/hooks/useApiKeys';
import { validateApiKey } from '@/app/actions/validate-key';

interface APIKeyConfigModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const APIKeyConfigModal = ({ isOpen, onClose }: APIKeyConfigModalProps) => {
    const { geminiKey, openaiKey, anthropicKey, saveKey } = useApiKeys();

    // UI State
    const [selectedProvider, setSelectedProvider] = useState<'gemini' | 'openai' | 'anthropic'>('gemini');
    const [showKey, setShowKey] = useState(false);

    // Form State
    const [inputs, setInputs] = useState<Record<string, string>>({
        gemini: geminiKey || '',
        openai: openaiKey || '',
        anthropic: anthropicKey || ''
    });

    // Validation State
    const [isValidating, setIsValidating] = useState(false);
    const [validationError, setValidationError] = useState<string | null>(null);
    const [saveStatus, setSaveStatus] = useState<string | null>(null); // 'gemini' | 'openai' | ...

    useEffect(() => {
        if (isOpen) {
            setInputs({
                gemini: geminiKey || '',
                openai: openaiKey || '',
                anthropic: anthropicKey || ''
            });
            setValidationError(null);
            setSaveStatus(null);
        }
    }, [isOpen, geminiKey, openaiKey, anthropicKey]);

    const providers = [
        {
            id: 'gemini',
            name: 'Google Gemini',
            icon: Zap,
            color: 'text-yellow-500',
            desc: 'Recomendado para la mayoría de tareas. Rápido y eficiente.'
        },
        {
            id: 'openai',
            name: 'OpenAI (GPT-4)',
            icon: Box,
            color: 'text-green-500',
            desc: 'Mayor capacidad de razonamiento. Ideal para tareas complejas.'
        },
        {
            id: 'anthropic',
            name: 'Anthropic (Claude)',
            icon: Cpu,
            color: 'text-purple-500',
            desc: 'Excelente para tareas de escritura y análisis de código.'
        }
    ] as const;

    const handleSave = async (providerId: string) => {
        const key = inputs[providerId];

        if (!key || !key.trim()) {
            setValidationError('La API Key no puede estar vacía');
            return;
        }

        setIsValidating(true);
        setValidationError(null);

        try {
            const result = await validateApiKey(providerId as any, key);

            if (result.valid) {
                saveKey(providerId as any, key);
                setSaveStatus(providerId);
                setTimeout(() => setSaveStatus(null), 2000);
            } else {
                setValidationError(result.error || 'Clave inválida');
            }
        } catch (error) {
            setValidationError('Error de conexión al validar');
        } finally {
            setIsValidating(false);
        }
    };

    const handleDelete = () => {
        saveKey(selectedProvider, '');
        setInputs(prev => ({ ...prev, [selectedProvider]: '' }));
        setValidationError(null);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-[#1c1c1e] w-full max-w-3xl rounded-2xl shadow-2xl border border-gray-200 dark:border-white/10 overflow-hidden flex flex-col md:flex-row h-[500px]">

                {/* Sidebar */}
                <div className="w-full md:w-64 bg-gray-50/50 dark:bg-black/20 border-b md:border-b-0 md:border-r border-gray-100 dark:border-white/5 p-6 flex flex-col justify-between">
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
                                        setShowKey(false);
                                    }}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${selectedProvider === p.id
                                        ? 'bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-sm ring-1 ring-gray-200 dark:ring-white/10'
                                        : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-gray-200'
                                        }`}
                                >
                                    <p.icon className={`w-4 h-4 ${p.color}`} />
                                    <span>{p.name}</span>
                                    {inputs[p.id] && (
                                        <div className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 p-8 flex flex-col relative bg-white dark:bg-[#1c1c1e]">
                    <button
                        onClick={onClose}
                        className="absolute top-6 right-6 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    <div className="flex-1">
                        <div className="mb-8">
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
                                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    {providers.find(p => p.id === selectedProvider)?.name} API Key
                                </label>
                                <div className="relative group">
                                    <input
                                        type={showKey ? "text" : "password"}
                                        value={inputs[selectedProvider]}
                                        onChange={(e) => {
                                            setInputs(prev => ({ ...prev, [selectedProvider]: e.target.value }));
                                            setValidationError(null);
                                        }}
                                        className={`w-full pl-4 pr-12 py-3.5 bg-gray-50 dark:bg-black/20 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm font-mono text-gray-900 dark:text-white transition-all ${validationError
                                            ? 'border-red-500 focus:border-red-500'
                                            : 'border-gray-200 dark:border-white/10 focus:border-blue-500'
                                            }`}
                                        placeholder={`sk-...`}
                                        disabled={isValidating}
                                    />
                                    {validationError && (
                                        <p className="absolute -bottom-6 left-0 text-red-500 text-xs font-medium animate-in slide-in-from-top-1 flex items-center gap-1">
                                            <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-500" />
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

                            <div className="bg-blue-50 dark:bg-blue-900/10 text-blue-600 dark:text-blue-400 p-4 rounded-xl text-xs leading-relaxed flex gap-3 border border-blue-100 dark:border-blue-900/20">
                                <ShieldCheck className="w-5 h-5 min-w-[20px]" />
                                <p>
                                    Tu clave se guarda <strong>exclusivamente en tu navegador</strong> (LocalStorage).
                                    Nunca se envía a nuestra base de datos ni servidores. Tú tienes el control total.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="pt-6 border-t border-gray-100 dark:border-white/5 flex justify-between items-center">
                        {inputs[selectedProvider] && (
                            <button
                                onClick={handleDelete}
                                className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200"
                            >
                                <Trash2 className="w-4 h-4" />
                                Eliminar Key
                            </button>
                        )}
                        <div className="flex-1 flex justify-end">
                            <button
                                onClick={() => handleSave(selectedProvider)}
                                disabled={isValidating || !inputs[selectedProvider]}
                                className={`
                                flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-300
                                ${saveStatus === selectedProvider
                                        ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 hover:bg-emerald-600'
                                        : 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 shadow-lg hover:shadow-xl hover:-translate-y-0.5'}
                                disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none
                            `}
                            >
                                {isValidating ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
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
        </div>
    );
};
