import { useState, useEffect } from 'react';

export const useApiKeys = () => {
    const [geminiKey, setGeminiKey] = useState<string>('');
    const [openaiKey, setOpenaiKey] = useState<string>('');
    const [anthropicKey, setAnthropicKey] = useState<string>('');

    // Load keys on mount
    useEffect(() => {
        const storedGemini = localStorage.getItem('gemini_api_key');
        const storedOpenai = localStorage.getItem('openai_api_key');
        const storedAnthropic = localStorage.getItem('anthropic_api_key');

        if (storedGemini) setGeminiKey(storedGemini);
        if (storedOpenai) setOpenaiKey(storedOpenai);
        if (storedAnthropic) setAnthropicKey(storedAnthropic);
    }, []);

    const saveKey = (provider: 'gemini' | 'openai' | 'anthropic', key: string) => {
        const keyName = `${provider}_api_key`;
        if (key) {
            localStorage.setItem(keyName, key);
        } else {
            localStorage.removeItem(keyName);
        }

        // Update state
        if (provider === 'gemini') setGeminiKey(key);
        if (provider === 'openai') setOpenaiKey(key);
        if (provider === 'anthropic') setAnthropicKey(key);
    };

    return {
        geminiKey,
        openaiKey,
        anthropicKey,
        saveKey
    };
};
