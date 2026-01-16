import React, { useState, useRef, useCallback } from 'react';
import { UploadCloud, FileJson, X, AlertCircle, CheckCircle2 } from 'lucide-react';

interface ImportFlowModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const ImportFlowModal = ({ isOpen, onClose }: ImportFlowModalProps) => {
    const [isDragging, setIsDragging] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDragEnter = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const processFile = (file: File) => {
        setError(null);
        setSuccess(false);

        if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
            setError('Please upload a valid JSON file.');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const content = e.target?.result as string;
                const data = JSON.parse(content);

                // Basic validation
                if (!Array.isArray(data.nodes) || !Array.isArray(data.edges)) {
                    throw new Error('Invalid flow format: Missing nodes or edges arrays.');
                }

                // Dispatch event
                window.dispatchEvent(new CustomEvent('import-flow', { detail: data }));

                setSuccess(true);
                setTimeout(() => {
                    onClose();
                    setSuccess(false);
                }, 1500);

            } catch (err) {
                console.error(err);
                setError('Failed to parse JSON file. Please ensure it is a valid flow export.');
            }
        };
        reader.readAsText(file);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            processFile(e.dataTransfer.files[0]);
            e.dataTransfer.clearData();
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            processFile(e.target.files[0]);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className="relative w-full max-w-2xl bg-white dark:bg-[#1c1c1e] rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-300 ring-1 ring-black/5 dark:ring-white/10">
                {/* Header */}
                <div className="px-8 py-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Import Flow</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            Drag and drop your flow JSON file to restore your diagram.
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Drop Zone */}
                <div className="p-8">
                    <div
                        onDragEnter={handleDragEnter}
                        onDragLeave={handleDragLeave}
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className={`
                            relative h-64 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all duration-300 group
                            ${isDragging
                                ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/10 scale-[1.02]'
                                : 'border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500/50 hover:bg-gray-50 dark:hover:bg-gray-800/50'}
                            ${success ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-900/10' : ''}
                            ${error ? 'border-red-500 bg-red-50/50 dark:bg-red-900/10' : ''}
                        `}
                    >
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileSelect}
                            accept=".json"
                            className="hidden"
                        />

                        {success ? (
                            <div className="text-center animate-in zoom-in spin-in-180 duration-500">
                                <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <CheckCircle2 className="w-8 h-8" />
                                </div>
                                <h3 className="text-lg font-bold text-emerald-700 dark:text-emerald-400">Import Successful!</h3>
                                <p className="text-sm text-emerald-600/80 dark:text-emerald-500/80 mt-1">Restoring your flow...</p>
                            </div>
                        ) : (
                            <div className="text-center space-y-4">
                                <div className={`
                                    w-16 h-16 rounded-2xl flex items-center justify-center mx-auto transition-all duration-300
                                    ${isDragging
                                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rotate-12'
                                        : 'bg-gray-100 dark:bg-gray-800 text-gray-400 group-hover:text-blue-500 group-hover:scale-110'}
                                `}>
                                    {isDragging ? <UploadCloud className="w-8 h-8" /> : <FileJson className="w-8 h-8" />}
                                </div>

                                <div>
                                    <p className="text-lg font-semibold text-gray-700 dark:text-gray-200">
                                        Drop your JSON file here
                                    </p>
                                    <p className="text-sm text-gray-400 mt-1">
                                        or click to browse
                                    </p>
                                </div>
                            </div>
                        )}

                        {error && (
                            <div className="absolute bottom-4 left-0 right-0 max-w-sm mx-auto p-3 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm font-medium rounded-xl flex items-center justify-center gap-2 animate-in slide-in-from-bottom-2 fade-in">
                                <AlertCircle className="w-4 h-4" />
                                {error}
                            </div>
                        )}
                    </div>
                </div>

                <div className="px-8 pb-8 text-center">
                    <p className="text-xs text-gray-400 max-w-md mx-auto">
                        Supported file: JSON format exported from GraphicAI. Ensure the file contains valid node and edge configurations.
                    </p>
                </div>
            </div>
        </div>
    );
};
