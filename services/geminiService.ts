import { GoogleGenAI } from "@google/genai";

// This `declare` block informs TypeScript that the `process` object is globally available.
// Vite's `define` configuration will replace these variables with their actual values
// at build time, preventing runtime errors.
declare var process: {
  env: {
    // This variable is provided by the execution environment, not Vite's define config.
    API_KEY: string;
    // These variables are injected by Vite's define config.
    VITE_AI_PROVIDER: string;
    VITE_AI_GATEWAY_URL: string;
    VITE_AI_GATEWAY_API_KEY: string;
    VITE_AI_GATEWAY_MODEL: string;
  }
};

const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash";

// Read configuration from the process.env object. Vite's `define` config replaces these
// variable names with their literal string values during the build.
const aiProvider = process.env.VITE_AI_PROVIDER;
const gatewayUrl = process.env.VITE_AI_GATEWAY_URL;
const gatewayApiKey = process.env.VITE_AI_GATEWAY_API_KEY;
const gatewayModel = process.env.VITE_AI_GATEWAY_MODEL;

// Per project guidelines, the Gemini API key MUST come exclusively from the execution
// environment's `process.env.API_KEY`.
const geminiApiKey = process.env.API_KEY;

// --- Startup Logging: Log the configuration for easier debugging ---
console.groupCollapsed('[AI Service] Configuration Loaded');
console.info(`AI Provider: %c${aiProvider}`, 'font-weight: bold;');
if (aiProvider === 'GATEWAY') {
    console.log(`Gateway Base URL: ${gatewayUrl || 'Not Set'}`);
    console.log(`Gateway Model: ${gatewayModel || `(default: ${DEFAULT_GEMINI_MODEL})`}`);
    console.log(`Gateway API Key Set: %c${!!gatewayApiKey}`, `font-weight: bold; color: ${!!gatewayApiKey ? 'green' : 'red'};`);
} else {
     console.log(`Gemini API Key Set: %c${!!geminiApiKey}`, `font-weight: bold; color: ${!!geminiApiKey ? 'green' : 'red'};`);
}
console.groupEnd();

if (aiProvider === 'GATEWAY' && (!gatewayUrl || !gatewayApiKey)) {
    console.error('[AI Service] CRITICAL: AI Gateway is the configured provider, but VITE_AI_GATEWAY_URL or VITE_AI_GATEWAY_API_KEY is missing.');
} else if (aiProvider === 'GEMINI' && !geminiApiKey) {
    console.warn("[AI Service] WARNING: Gemini is the configured provider, but the API_KEY was not found in the environment. API calls will fail.");
}
// --- End of Startup Logging ---

/**
 * Internal helper to make a POST request to a local AI Gateway.
 * Assumes an OpenAI-compatible /v1/chat/completions endpoint structure.
 */
const _callAiGateway = async (callName: string, prompt: string): Promise<string> => {
    if (!gatewayUrl || !gatewayApiKey) {
        const errorMsg = 'AI Gateway is configured, but URL or API Key is missing.';
        console.error(`[AI Service] Aborting gateway request for ${callName}. ${errorMsg}`);
        throw new Error(errorMsg);
    }
    
    const modelToUse = gatewayModel || DEFAULT_GEMINI_MODEL;
    //const fullGatewayUrl = `${gatewayUrl}`; // The user may provide the full URL directly.
    const fullGatewayUrl = `${gatewayUrl}/${modelToUse}/v1/chat/completions`;
    const requestBody = {
      model: modelToUse,
      messages: [{ role: 'user', content: prompt }],
      stream: false,
    };

    console.log(`[AI Service] Sending ${callName} request to Gateway URL: %c${fullGatewayUrl}`, 'font-weight: bold;');

    try {
        const response = await fetch(fullGatewayUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${gatewayApiKey}`
            },
            body: JSON.stringify(requestBody)
        });

        const responseText = await response.text();

        if (!response.ok) {
            throw new Error(`AI Gateway request for ${callName} failed with status ${response.status}: ${responseText}`);
        }

        const data = JSON.parse(responseText);
        const content = data.choices?.[0]?.message?.content;

        if (typeof content !== 'string') {
          throw new Error('AI Gateway response did not contain expected content in "choices[0].message.content"');
        }
        
        return content;
    } catch (error) {
        console.error(`[AI Service] Error during Gateway fetch operation for ${callName}:`, error);
        throw error;
    }
};

/**
 * Generic content generation function that routes to the configured AI provider.
 */
const generateContent = async (callName: string, prompt: string): Promise<string> => {
  try {
    if (aiProvider === 'GATEWAY') {
      return await _callAiGateway(callName, prompt);
    }

    // Default to GEMINI provider
    if (!geminiApiKey) {
      throw new Error("API_KEY environment variable not set for Gemini. API calls will fail.");
    }
    const ai = new GoogleGenAI({ apiKey: geminiApiKey });
    const response = await ai.models.generateContent({
      model: DEFAULT_GEMINI_MODEL,
      contents: prompt,
    });
    return response.text;

  } catch (error) {
    console.error(`Error during AI content generation for "${callName}":`, error);
    return `Error: Could not perform AI task "${callName}". Check console for details.`;
  }
};


export const generatePlaybook = async (prompt: string): Promise<string> => {
  const fullPrompt = `You are an expert Ansible engineer. Generate a complete and valid Ansible playbook in YAML format based on the following requirement. The playbook should be well-structured, include comments where necessary, and follow best practices. Only output the YAML code, without any surrounding text or markdown backticks.

Requirement: ${prompt}`;
  
  const result = await generateContent("playbook generation", fullPrompt);
  const cleanedText = result.replace(/^```yaml\n|```$/g, '').trim();
  return cleanedText;
};

export const analyzePlaybook = async (playbookContent: string): Promise<string> => {
  const fullPrompt = `You are an expert Ansible engineer. Analyze the following Ansible playbook. Provide a summary in markdown format that includes:
1.  **Overall Purpose:** A brief, one-sentence summary of what the playbook does.
2.  **Key Tasks:** A bulleted list of the main actions performed by the playbook.
3.  **Dependencies & Execution Order:** Explain if any tasks depend on others and if the execution order is critical. If there are no specific dependencies, state that.
4.  **Validation:** Briefly comment on the validity of the playbook and suggest any simple improvements.

Playbook Content:
\`\`\`yaml
${playbookContent}
\`\`\``;

  return generateContent("playbook analysis", fullPrompt);
};

export const compareResults = async (resultA: string, resultB: string): Promise<string> => {
    const fullPrompt = `You are a senior DevOps engineer comparing the output of an Ansible playbook run on two different environments. Analyze the two execution logs below and provide a concise summary of the key differences. Focus on changed values, different task outcomes (e.g., ok vs. failed), or any discrepancies in system state reported in the logs. If the outputs are functionally identical (e.g., only timestamps differ), state that. Format your response as markdown with clear headings for each difference found.

---
Log A:
---
${resultA}

---
Log B:
---
${resultB}
`;
    return generateContent("result comparison", fullPrompt);
};
