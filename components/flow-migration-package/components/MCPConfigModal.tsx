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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/20 dark:bg-black/40 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-2xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden flex flex-col h-[600px] max-h-[90vh] animate-in zoom-in-95 duration-200 ring-1 ring-black/5">
                {/* Header */}
                <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between bg-gray-50/50 dark:bg-gray-900/50 backdrop-blur-md">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl shadow-sm">
                            <FileCode className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">MCP Installation Config</h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Define the installation JSON for this server</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 p-0 overflow-hidden flex flex-col relative bg-[#1e1e1e]">
                    <textarea
                        value={jsonContent}
                        onChange={(e) => {
                            setJsonContent(e.target.value);
                            // Verify status resets via useEffect dependency on jsonContent (via isValid/parsedConfig)
                        }}
                        className="flex-1 w-full bg-transparent text-gray-300 font-mono text-xs p-5 resize-none focus:outline-none leading-relaxed"
                        spellCheck={false}
                        autoFocus
                        placeholder="// Enter your MCP server configuration JSON here..."
                    />
                </div>

                {/* Footer */}
                <div className="px-5 py-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 backdrop-blur-md flex items-center justify-between gap-3">
                    <div className="flex-1 flex items-center gap-3">
                        {/* Validation Status */}
                        {error && (
                            <span className="text-xs text-red-500 font-medium animate-pulse flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                                {error}
                            </span>
                        )}
                        {!error && isValid && (
                            <div className="flex items-center gap-4">
                                {/* JSON Status */}
                                <span className="text-xs text-emerald-500/70 font-medium flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/50" />
                                    JSON Valid
                                </span>

                                {/* Auto-Verification Status */}
                                <div className={`
                                    flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all
                                    ${verifyStatus === 'success'
                                        ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                                        : verifyStatus === 'error'
                                            ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800'
                                            : verifyStatus === 'loading'
                                                ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800'
                                                : 'bg-gray-50 dark:bg-gray-800 text-gray-400 border-gray-200 dark:border-gray-700'
                                    }
                                `}>
                                    {verifyStatus === 'loading' ? (
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    ) : verifyStatus === 'success' ? (
                                        <Check className="w-3.5 h-3.5" />
                                    ) : verifyStatus === 'error' ? (
                                        <AlertCircle className="w-3.5 h-3.5" />
                                    ) : (
                                        <Beaker className="w-3.5 h-3.5 opacity-50" />
                                    )}

                                    {verifyStatus === 'loading' ? 'Verifying...' :
                                        verifyStatus === 'idle' ? 'Waiting...' :
                                            verifyMsg}
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={!isValid || verifyStatus !== 'success'}
                            className={`px-4 py-2 text-xs font-medium bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl shadow-sm transition-all flex items-center gap-2
                                ${(!isValid || verifyStatus !== 'success') ? 'opacity-50 cursor-not-allowed grayscale' : 'hover:from-emerald-600 hover:to-teal-700 hover:shadow-md'}
                            `}
                        >
                            <Save className="w-3.5 h-3.5" />
                            Save Configuration
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
