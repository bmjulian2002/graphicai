import React, { useState } from 'react';
import { X, Copy, Check, FileJson } from 'lucide-react';

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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-4 animate-in fade-in duration-300">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-md transition-opacity"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-2xl bg-white/95 dark:bg-[#1c1c1e]/95 backdrop-blur-2xl rounded-2xl shadow-2xl border border-white/20 dark:border-white/10 overflow-hidden flex flex-col h-[600px] max-h-[90vh] animate-in zoom-in-95 duration-300 ring-1 ring-black/5 dark:ring-white/5">

                {/* Header */}
                <div className="px-6 py-5 border-b border-gray-100/50 dark:border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-2.5 bg-gray-100 dark:bg-white/5 rounded-xl shadow-inner border border-gray-200 dark:border-white/5">
                            <FileJson className="w-5 h-5 text-gray-700 dark:text-gray-200" />
                        </div>
                        <div className="space-y-0.5">
                            <h3 className="text-[17px] font-semibold text-gray-900 dark:text-white tracking-tight">
                                Export MCP Config
                            </h3>
                            <p className="text-[13px] text-gray-500 dark:text-gray-300 font-medium">
                                Combined configuration for Claude Desktop
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full transition-all duration-200"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content - Read-only Editor */}
                <div className="flex-1 relative group bg-white dark:bg-black/20">
                    <div className="absolute inset-0 hidden dark:block bg-[#0d1117] dark:bg-black/40 transition-colors duration-500" />
                    <textarea
                        value={config}
                        readOnly
                        className="relative z-10 w-full h-full bg-transparent text-gray-600 dark:text-gray-100 font-mono text-[13px] leading-relaxed p-6 resize-none focus:outline-none selection:bg-blue-500/20 selection:text-blue-600 dark:selection:bg-blue-500/40 dark:selection:text-white caret-blue-600 dark:caret-white"
                        spellCheck={false}
                    />
                </div>

                {/* Footer */}
                <div className="px-6 py-5 border-t border-gray-100/50 dark:border-white/5 bg-gray-50/50 dark:bg-[#1c1c1e]/50 backdrop-blur-xl flex items-center justify-between gap-4">
                    <div className="text-[11px] font-medium text-gray-400 dark:text-gray-500">
                        Copy this JSON to your mcp_settings.json
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={onClose}
                            className="px-5 py-2.5 text-[13px] font-medium text-gray-500 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl transition-all duration-200"
                        >
                            Close
                        </button>
                        <button
                            onClick={handleCopy}
                            className={`
                                relative overflow-hidden px-6 py-2.5 rounded-xl text-[13px] font-semibold text-white shadow-lg transition-all duration-300
                                ${copied
                                    ? 'bg-emerald-500 shadow-emerald-500/20'
                                    : 'bg-gray-900 dark:bg-white dark:text-black shadow-blue-500/20 hover:opacity-90 active:scale-95'
                                }
                            `}
                        >
                            <div className="flex items-center gap-2">
                                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                                <span>{copied ? 'Copied!' : 'Copy to Clipboard'}</span>
                            </div>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
