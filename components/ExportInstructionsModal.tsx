import React from 'react';
import { X, FolderOpen, FileText, CheckCircle2, ArrowRight } from 'lucide-react';

interface ExportInstructionsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const ExportInstructionsModal = ({ isOpen, onClose }: ExportInstructionsModalProps) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-black/30 backdrop-blur-sm animate-in fade-in duration-300"
                onClick={onClose}
            />

            <div className="relative w-full max-w-lg bg-white/95 dark:bg-[#1c1c1e]/95 backdrop-blur-2xl rounded-2xl shadow-2xl border border-white/20 dark:border-white/10 overflow-hidden animate-in zoom-in-95 fade-in duration-300 ring-1 ring-black/5">
                <div className="p-6">
                    <div className="flex items-start justify-between mb-6">
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                                Exportación Completada
                            </h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Tu proyecto ha sido descargado exitosamente.
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-500 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="space-y-4">
                        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/30 rounded-xl p-4 flex gap-4">
                            <div className="shrink-0 w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-800/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
                                <FolderOpen className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900 dark:text-white mb-1 text-sm">
                                    Carpeta /workflow
                                </h3>
                                <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                                    El archivo .zip contiene una carpeta llamada <code className="font-mono bg-white/50 dark:bg-black/20 px-1 py-0.5 rounded">workflow</code>. Descomprímela en la raíz de tu proyecto.
                                </p>
                            </div>
                        </div>

                        <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 rounded-xl p-4">
                            <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">
                                Contenido del Paquete
                            </h3>
                            <ul className="space-y-3">
                                <li className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                                    <FileText className="w-4 h-4 text-gray-400" />
                                    <span>Archivos Markdown (.md) individuales</span>
                                </li>
                                <li className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                    <span>Un archivo por agente (LLM Agent)</span>
                                </li>
                                <li className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                    <span>Metadata y System Prompts incluidos</span>
                                </li>
                            </ul>
                        </div>
                    </div>

                    <div className="mt-8 flex justify-end">
                        <button
                            onClick={onClose}
                            className="px-5 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-medium rounded-xl hover:opacity-90 transition-opacity flex items-center gap-2 text-sm shadow-lg shadow-gray-900/20 dark:shadow-white/20"
                        >
                            <span>Entendido</span>
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
