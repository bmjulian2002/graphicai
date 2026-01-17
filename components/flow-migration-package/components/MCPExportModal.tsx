import React, { useState } from 'react';
import { X, FileJson, CheckCircle2, ArrowRight, Copy, Check, Terminal } from 'lucide-react';

interface MCPExportModalProps {
    isOpen: boolean;
    onClose: () => void;
    config: string;
}

export const MCPExportModal = ({
    isOpen,
    onClose,
    config
}: MCPExportModalProps) => {
    const [copied, setCopied] = useState(false);

    if (!isOpen) return null;

    const handleCopy = () => {
        navigator.clipboard.writeText(config);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/30 backdrop-blur-sm animate-in fade-in duration-300"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-lg bg-white/95 dark:bg-[#1c1c1e]/95 backdrop-blur-2xl rounded-2xl shadow-2xl border border-white/20 dark:border-white/10 overflow-hidden animate-in zoom-in-95 fade-in duration-300 ring-1 ring-black/5">
                <div className="p-6">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-6">
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                                Exportación de Configuración
                            </h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                La configuración MCP está lista para ser utilizada.
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-500 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="space-y-4">
                        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/30 rounded-xl p-4 flex gap-4">
                            <div className="shrink-0 w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-800/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
                                <FileJson className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900 dark:text-white mb-1 text-sm">
                                    Configuración JSON Generada
                                </h3>
                                <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                                    Este código contiene las definiciones de tus servidores MCP para integrarlos con Claude Desktop u otros clientes.
                                </p>
                            </div>
                        </div>

                        <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 rounded-xl p-4">
                            <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">
                                Pasos Siguientes
                            </h3>
                            <ul className="space-y-3">
                                <li className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                                    <Copy className="w-4 h-4 text-gray-400" />
                                    <span>Copia el JSON al portapapeles</span>
                                </li>
                                <li className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                                    <Terminal className="w-4 h-4 text-gray-400" />
                                    <span>Pégalo en tu archivo de configuración</span>
                                </li>
                                <li className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                    <span>Reinicia tu cliente MCP (ej. Claude)</span>
                                </li>
                            </ul>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="mt-8 flex justify-end gap-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl transition-colors"
                        >
                            Cerrar
                        </button>
                        <button
                            onClick={handleCopy}
                            className={`
                                relative overflow-hidden px-5 py-2.5 rounded-xl text-sm font-semibold text-white shadow-lg transition-all duration-300 flex items-center gap-2
                                ${copied
                                    ? 'bg-emerald-500 shadow-emerald-500/20'
                                    : 'bg-gray-900 dark:bg-white dark:text-black shadow-gray-900/20 dark:shadow-white/20 hover:opacity-90'
                                }
                            `}
                        >
                            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                            <span>{copied ? '¡Copiado!' : 'Copiar al Portapapeles'}</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
