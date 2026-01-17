'use server';

export type Provider = 'gemini' | 'openai' | 'anthropic';

interface GenerateRequest {
    provider: Provider;
    apiKey: string;
    modelId: string;
    systemPrompt: string;
    userPrompt: string;
}

interface GenerateResponse {
    content: string;
    error?: string;
    usage?: {
        promptTokens: number;
        completionTokens: number;
    };
}

export async function generateAIResponse({
    provider,
    apiKey,
    modelId,
    systemPrompt,
    userPrompt
}: GenerateRequest): Promise<GenerateResponse> {

    if (!apiKey) {
        return { content: '', error: 'API Key is missing.' };
    }

    try {
        // Sanitize modelId (remove provider prefix if present, e.g. "google/gemini-1.5-flash" -> "gemini-1.5-flash")
        // This assumes standard model IDs don't contain slashes themselves, or that we consistently use "provider/model" format.
        const cleanModelId = modelId.includes('/') ? modelId.split('/').pop()! : modelId;

        switch (provider) {
            case 'gemini':
                return await generateGemini(apiKey, cleanModelId, systemPrompt, userPrompt);
            case 'openai':
                return await generateOpenAI(apiKey, cleanModelId, systemPrompt, userPrompt);
            case 'anthropic':
                return await generateAnthropic(apiKey, cleanModelId, systemPrompt, userPrompt);
            default:
                return { content: '', error: 'Unsupported provider.' };
        }
    } catch (error: any) {
        console.error(`Generation error for ${provider}:`, error);
        return { content: '', error: error.message || 'Failed to generate response.' };
    }
}

async function generateGemini(apiKey: string, modelId: string, systemPrompt: string, userPrompt: string): Promise<GenerateResponse> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${apiKey}`;

    const body = {
        contents: [
            {
                role: 'user',
                parts: [{ text: `System: ${systemPrompt}\n\nUser: ${userPrompt}` }]
            }
        ],
        generationConfig: {
            temperature: 0.7,
        }
    };

    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });

    const text = await response.text();
    let data;

    try {
        data = JSON.parse(text);
    } catch (e) {
        throw new Error(`Gemini API returned invalid JSON: ${text.slice(0, 200)}...`);
    }

    if (!response.ok) {
        throw new Error(data.error?.message || `Gemini API Error: ${response.status} ${response.statusText}`);
    }

    const content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    const usage = {
        promptTokens: data.usageMetadata?.promptTokenCount || 0,
        completionTokens: data.usageMetadata?.candidatesTokenCount || 0
    };

    return { content, usage };
}

async function generateOpenAI(apiKey: string, modelId: string, systemPrompt: string, userPrompt: string): Promise<GenerateResponse> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model: modelId,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ],
            temperature: 0.7
        })
    });

    const text = await response.text();
    let data;

    try {
        data = JSON.parse(text);
    } catch (e) {
        throw new Error(`OpenAI API returned invalid JSON: ${text.slice(0, 200)}...`);
    }

    if (!response.ok) {
        throw new Error(data.error?.message || `OpenAI API Error: ${response.status} ${response.statusText}`);
    }

    return {
        content: data.choices[0].message.content,
        usage: {
            promptTokens: data.usage?.prompt_tokens || 0,
            completionTokens: data.usage?.completion_tokens || 0
        }
    };
}

async function generateAnthropic(apiKey: string, modelId: string, systemPrompt: string, userPrompt: string): Promise<GenerateResponse> {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
            model: modelId,
            system: systemPrompt,
            messages: [
                { role: 'user', content: userPrompt }
            ],
            max_tokens: 1024,
            temperature: 0.7
        })
    });

    const text = await response.text();
    let data;

    try {
        data = JSON.parse(text);
    } catch (e) {
        throw new Error(`Anthropic API returned invalid JSON: ${text.slice(0, 200)}...`);
    }

    if (!response.ok) {
        throw new Error(data.error?.message || `Anthropic API Error: ${response.status} ${response.statusText}`);
    }

    return {
        content: data.content[0].text,
        usage: {
            promptTokens: data.usage?.input_tokens || 0,
            completionTokens: data.usage?.output_tokens || 0
        }
    };
}
