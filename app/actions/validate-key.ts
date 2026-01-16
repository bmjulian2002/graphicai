'use server';

type Provider = 'gemini' | 'openai' | 'anthropic';

interface ValidationResult {
    valid: boolean;
    error?: string;
}

export async function validateApiKey(provider: Provider, key: string): Promise<ValidationResult> {
    if (!key || key.trim() === '') {
        return { valid: false, error: 'La clave no puede estar vacía.' };
    }

    try {
        switch (provider) {
            case 'gemini':
                return await validateGemini(key);
            case 'openai':
                return await validateOpenAI(key);
            case 'anthropic':
                return await validateAnthropic(key);
            default:
                return { valid: false, error: 'Proveedor no soportado.' };
        }
    } catch (error: any) {
        console.error(`Validation error for ${provider}:`, error);
        return { valid: false, error: 'Error de conexión al validar la clave.' };
    }
}

async function validateGemini(key: string): Promise<ValidationResult> {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`, {
        method: 'GET',
    });

    if (response.ok) {
        return { valid: true };
    } else {
        const data = await response.json().catch(() => ({}));
        return { valid: false, error: data.error?.message || 'Clave de Google Gemini inválida.' };
    }
}

async function validateOpenAI(key: string): Promise<ValidationResult> {
    const response = await fetch('https://api.openai.com/v1/models', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${key}`,
        },
    });

    if (response.ok) {
        return { valid: true };
    } else {
        const data = await response.json().catch(() => ({}));
        return { valid: false, error: data.error?.message || 'Clave de OpenAI inválida.' };
    }
}

async function validateAnthropic(key: string): Promise<ValidationResult> {
    // Anthropic requires a version header. Using a known supported version.
    const response = await fetch('https://api.anthropic.com/v1/models', {
        method: 'GET',
        headers: {
            'x-api-key': key,
            'anthropic-version': '2023-06-01',
        },
    });

    if (response.ok) {
        return { valid: true };
    } else {
        // Anthropic error responses
        const data = await response.json().catch(() => ({}));
        return { valid: false, error: data.error?.message || 'Clave de Anthropic inválida.' };
    }
}
