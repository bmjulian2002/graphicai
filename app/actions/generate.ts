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
        switch (provider) {
            case 'gemini':
                return await generateGemini(apiKey, modelId, systemPrompt, userPrompt);
            case 'openai':
                return await generateOpenAI(apiKey, modelId, systemPrompt, userPrompt);
            case 'anthropic':
                return await generateAnthropic(apiKey, modelId, systemPrompt, userPrompt);
            default:
                return { content: '', error: 'Unsupported provider.' };
        }
    } catch (error: any) {
        console.error(`Generation error for ${provider}:`, error);
        return { content: '', error: error.message || 'Failed to generate response.' };
    }
}

async function generateGemini(apiKey: string, modelId: string, systemPrompt: string, userPrompt: string): Promise<GenerateResponse> {
    // Gemini 1.5 format
    // Map model ID if necessary, but assuming modelId passed is valid like 'gemini-1.5-flash'
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${apiKey}`;

    const body = {
        contents: [
            {
                role: 'user',
                parts: [{ text: `System: ${systemPrompt}\n\nUser: ${userPrompt}` }] // Gemini doesn't always have strict system role in all versions via REST easily, mixing is safe
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

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error?.message || 'Gemini API Error');
    }

    const content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // Estimate tokens roughly if not provided
    const usage = {
        promptTokens: 0,
        completionTokens: 0
    };

    if (data.usageMetadata) {
        usage.promptTokens = data.usageMetadata.promptTokenCount;
        usage.completionTokens = data.usageMetadata.candidatesTokenCount;
    }

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
            model: modelId, // e.g., 'gpt-4o'
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ],
            temperature: 0.7
        })
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error?.message || 'OpenAI API Error');
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
            model: modelId, // e.g., 'claude-3-opus-20240229'
            system: systemPrompt,
            messages: [
                { role: 'user', content: userPrompt }
            ],
            max_tokens: 1024,
            temperature: 0.7
        })
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error?.message || 'Anthropic API Error');
    }

    return {
        content: data.content[0].text,
        usage: {
            promptTokens: data.usage?.input_tokens || 0,
            completionTokens: data.usage?.output_tokens || 0
        }
    };
}
