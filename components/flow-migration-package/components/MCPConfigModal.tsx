import React, { useState, useEffect } from 'react';
import { X, Save, FileCode, Beaker, Check, Loader2, AlertCircle } from 'lucide-react';

interface MCPConfigModalProps {
    isOpen: boolean;
    onClose: () => void;
    config: string;
    onSave: (newConfig: string) => void;
}

export function MCPConfigModal({ isOpen, onClose, config, onSave }: MCPConfigModalProps) {
    const [jsonContent, setJsonContent] = useState(config);
    const [error, setError] = useState<string | null>(null);
    const [isValid, setIsValid] = useState(true);
    const [parsedConfig, setParsedConfig] = useState<any>(null);

    // Verification State
    const [verifying, setVerifying] = useState(false);
    const [verifyStatus, setVerifyStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [verifyMsg, setVerifyMsg] = useState('');

    // Reset content when opening with new config
    useEffect(() => {
        if (isOpen) {
            setError(null);
            setVerifyStatus('idle');
            setVerifyMsg('');
            setJsonContent(config || JSON.stringify({
                "mcp-server-name": {
                    "command": "npx",
                    "args": [
                        "-y",
                        "@organization/mcp-server@latest"
                    ]
                }
            }, null, 2));
        }
    }, [config, isOpen]);

    // Validate on content change
    useEffect(() => {
        const text = jsonContent.trim();

        if (!text) {
            setError(null);
            setIsValid(false);
            setParsedConfig(null); // Clear parsed config if content is empty
            return;
        }

        let parsed = null;

        // Try 1: Standard Parse
        try {
            parsed = JSON.parse(text);
        } catch (e) {
            // Try 2: Auto-fix (Wrap in braces and handle trailing comma)
            try {
                let fixedText = text;
                if (fixedText.endsWith(',')) fixedText = fixedText.slice(0, -1);
                fixedText = `{${fixedText}}`;
                parsed = JSON.parse(fixedText);
            } catch (e2) {
                // Determine error message based on content
                if (text.startsWith('"')) {
                    setError("Missing { } braces or trailing comma?");
                } else {
                    setError("Invalid JSON format.");
                }
                setIsValid(false);
                setParsedConfig(null);
                return;
            }
        }

        // Schema Validation
        try {
            const keys = Object.keys(parsed);

            if (keys.length !== 1) {
                setError("Configuration must contain exactly one server definition.");
                setIsValid(false);
                setParsedConfig(null);
                return;
            }

            const serverName = keys[0];
            const serverConfig = parsed[serverName];

            if (typeof serverConfig !== 'object' || serverConfig === null) {
                setError("Server configuration must be an object.");
                setIsValid(false);
                setParsedConfig(null);
                return;
            }

            if (!serverConfig.command || typeof serverConfig.command !== 'string') {
                setError("Configuration must include a 'command' string.");
                setIsValid(false);
                setParsedConfig(null);
                return;
            }

            if (!Array.isArray(serverConfig.args)) {
                setError("Configuration must include an 'args' array.");
                setIsValid(false);
                setParsedConfig(null);
                return;
            }

            setError(null);
            setIsValid(true);
            setParsedConfig(parsed);

        } catch (e) {
            setError("Configuration validation error.");
            setIsValid(false);
            setParsedConfig(null);
        }
    }, [jsonContent]);

    // Auto-verify when config is valid
    useEffect(() => {
        if (isValid && parsedConfig) {
            const timer = setTimeout(() => {
                handleVerify();
            }, 800); // Debounce 800ms
            return () => clearTimeout(timer);
        } else {
            setVerifyStatus('idle');
            setVerifyMsg('');
        }
    }, [isValid, parsedConfig]);

    const handleVerify = async () => {
        if (!parsedConfig) return;

        setVerifying(true);
        setVerifyStatus('loading'); // Use specific status for loading UI
        setVerifyMsg('Verifying package...');

        try {
            // 1. Extract package name
            const serverName = Object.keys(parsedConfig)[0];
            const args = parsedConfig[serverName].args || [];

            // Find the package name argument (first arg that doesn't start with '-')
            let pkgName = args.find((arg: string) => !arg.startsWith('-'));

            if (!pkgName) {
                // Determine if it's a local script or other command that shouldn't be verified against NPM
                // For now, if we can't find a package-like arg, we might skip or fail.
                // Given the context of "npx", we expect a package.
                throw new Error("No package specified");
            }

            // Remove version tag if present (e.g. @latest, @1.0.0)
            const isScoped = pkgName.startsWith('@');
            if (isScoped) {
                const parts = pkgName.slice(1).split('@');
                pkgName = '@' + parts[0];
            } else {
                pkgName = pkgName.split('@')[0];
            }

            // 2. Check NPM Registry
            const res = await fetch(`https://registry.npmjs.org/${pkgName}/latest`);

            if (res.ok) {
                const data = await res.json();
                setVerifyStatus('success');
                setVerifyMsg(`${pkgName} v${data.version}`);
            } else {
                setVerifyStatus('error');
                if (res.status === 404) {
                    setVerifyMsg(`Package not found`);
                } else {
                    setVerifyMsg(`Registry Error`);
                }
            }

        } catch (e: any) {
            setVerifyStatus('error');
            setVerifyMsg(e.message || "Verification failed");
        } finally {
            setVerifying(false); // Stop loading spinner
        }
    };

    const handleSave = () => {
        if (isValid && parsedConfig && verifyStatus === 'success') {
            onSave(JSON.stringify(parsedConfig, null, 2));
            onClose();
        }
    };

    if (!isOpen) return null;

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
                            <FileCode className="w-5 h-5 text-gray-700 dark:text-gray-200" />
                        </div>
                        <div className="space-y-0.5">
                            <h3 className="text-[17px] font-semibold text-gray-900 dark:text-white tracking-tight">
                                Server Configuration
                            </h3>
                            <p className="text-[13px] text-gray-500 dark:text-gray-300 font-medium">
                                Configure MCP server parameters
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

                {/* Content - Editor */}
                <div className="flex-1 relative group bg-white dark:bg-black/20">
                    <div className="absolute inset-0 hidden dark:block bg-[#0d1117] dark:bg-black/40 group-hover:bg-[#161b22] dark:group-hover:bg-black/50 transition-colors duration-500" />
                    <textarea
                        value={jsonContent}
                        onChange={(e) => {
                            setJsonContent(e.target.value);
                        }}
                        className="relative z-10 w-full h-full bg-transparent text-gray-600 dark:text-gray-100 font-mono text-[13px] leading-relaxed p-6 resize-none focus:outline-none selection:bg-blue-500/20 selection:text-blue-600 dark:selection:bg-blue-500/40 dark:selection:text-white caret-blue-600 dark:caret-white"
                        spellCheck={false}
                        autoFocus
                        placeholder="// Enter your MCP server configuration JSON here..."
                    />
                </div>

                {/* Footer */}
                <div className="px-6 py-5 border-t border-gray-100/50 dark:border-white/5 bg-gray-50/50 dark:bg-[#1c1c1e]/50 backdrop-blur-xl flex items-center justify-between gap-4">

                    {/* Status Indicator */}
                    <div className="flex-1 flex items-center">
                        {error ? (
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 animate-in slide-in-from-left-2 fade-in duration-300">
                                <AlertCircle className="w-3.5 h-3.5" />
                                <span className="text-[11px] font-medium leading-none pb-px">{error}</span>
                            </div>
                        ) : isValid ? (
                            <div className={`
                                flex items-center gap-2 px-3.5 py-1.5 rounded-lg border shadow-sm transition-all duration-300
                                ${verifyStatus === 'success'
                                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                                    : verifyStatus === 'loading'
                                        ? 'bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-300'
                                        : 'bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-300'
                                }
                            `}>
                                {verifyStatus === 'loading' ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : verifyStatus === 'success' ? (
                                    <Check className="w-3.5 h-3.5" />
                                ) : (
                                    <Beaker className="w-3.5 h-3.5" />
                                )}
                                <span className="text-[11px] font-semibold tracking-wide">
                                    {verifyStatus === 'loading' ? 'Verifying...' :
                                        verifyStatus === 'success' ? verifyMsg :
                                            verifyStatus === 'error' ? (verifyMsg || 'Verification Failed') :
                                                'NPM Package'}
                                </span>
                            </div>
                        ) : (
                            <div className="text-[11px] font-medium text-gray-400 dark:text-gray-300 px-2">
                                Waiting for input...
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-3">
                        <button
                            onClick={onClose}
                            className="px-5 py-2.5 text-[13px] font-medium text-gray-500 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl transition-all duration-200"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={!isValid || verifyStatus !== 'success'}
                            className={`
                                relative overflow-hidden px-6 py-2.5 rounded-xl text-[13px] font-semibold text-white shadow-lg shadow-blue-500/20 transition-all duration-300
                                bg-gray-900 dark:bg-white dark:text-black hover:opacity-90 active:scale-95
                                disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:active:scale-100
                            `}
                        >
                            <div className="flex items-center gap-2">
                                <Save className="w-3.5 h-3.5" />
                                <span>Save</span>
                            </div>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
