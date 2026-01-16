# AI Generation Integration

## Overview
This document details the implementation of the AI generation feature in the GraphicAI application. The system enables users to execute AI prompts directly from "LLM Agent" nodes within the flow diagram, utilizing user-provided API keys for authentication.

## Architecture

### 1. Server Action: `generateAIResponse`
Located in `app/actions/generate.ts`.

This server action acts as a secure proxy for AI generation requests. It is designed to be lightweight and dependency-free (using `fetch`) to minimize bundle size and handle dynamic, user-provided API keys gracefully.

**Supported Providers:**
- **Google Gemini**: Uses `generativelanguage.googleapis.com`
- **OpenAI**: Uses `api.openai.com`
- **Anthropic**: Uses `api.anthropic.com`

**Key Features:**
- **BYOK (Bring Your Own Key)**: Keys are passed from the client securely; they are not hardcoded or read from environment variables on the server (except as fallbacks if validation logic allows).
- **Standardized Response**: Returns a unified `GenerateResponse` object containing `content` (string) and `usage` (token counts).
- **Error Handling**: Catches and normalizes errors from different providers.

### 2. Client-Side Integration: `NodeDetailSidepanel`
The integration logic resides in `components/flow-migration-package/components/NodeDetailSidepanel.tsx`.

**UI Components:**
- **Test Agent Section**: A new UI block added to the bottom of the node details for "LLM Agent" nodes.
- **Run Button**: Triggers the generation process.
- **User Prompt Input**: A simple textarea for testing ad-hoc prompts.
- **Output Display**: Shows the text result from the AI model.

**Logic Flow:**
1.  **Key Retrieval**: Uses the `useApiKeys` hook to retrieve the stored API key from `localStorage` based on the selected provider (e.g., if node provider is "OpenAI", it fetches `openai_api_key`).
2.  **Request Construction**: Gathers `modelId`, `systemPrompt`, and `userPrompt` from the node data and component state.
3.  **Execution**: Calls `generateAIResponse` with the provider, key, and prompt data.
4.  **Display**: Updates the local state to show the result or error message.

## Security Considerations
- **No Server-Side Key Storage**: API keys are stored only in the user's browser (`localStorage`). They are sent to the server only during the function call and are not persisted in any database.
- **HTTPS**: All transport is secured via HTTPS/TLS.

## Future Improvements
- **Streaming**: Currently, the response receives the full text. Implementing streaming via `AI SDK` (Vercel) or readable streams would improve UX for long generations.
- **History**: Saving run history or context window management for multi-turn conversations.
