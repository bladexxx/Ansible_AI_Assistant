
import { GoogleGenAI } from "@google/genai";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  // In a real app, you might show an error message to the user.
  // For this context, we will log a warning.
  console.warn("API_KEY environment variable not set. Gemini API calls will fail.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY! });
const model = "gemini-2.5-flash";

export const generatePlaybook = async (prompt: string): Promise<string> => {
  try {
    const fullPrompt = `You are an expert Ansible engineer. Generate a complete and valid Ansible playbook in YAML format based on the following requirement. The playbook should be well-structured, include comments where necessary, and follow best practices. Only output the YAML code, without any surrounding text or markdown backticks.

Requirement: ${prompt}`;

    const response = await ai.models.generateContent({
      model,
      contents: fullPrompt,
    });
    
    // Clean up potential markdown code blocks
    const cleanedText = response.text.replace(/^```yaml\n|```$/g, '').trim();
    return cleanedText;

  } catch (error) {
    console.error("Error generating playbook:", error);
    return "Error: Could not generate playbook.";
  }
};

export const analyzePlaybook = async (playbookContent: string): Promise<string> => {
  try {
    const fullPrompt = `You are an expert Ansible engineer. Analyze the following Ansible playbook. Provide a summary in markdown format that includes:
1.  **Overall Purpose:** A brief, one-sentence summary of what the playbook does.
2.  **Key Tasks:** A bulleted list of the main actions performed by the playbook.
3.  **Dependencies & Execution Order:** Explain if any tasks depend on others and if the execution order is critical. If there are no specific dependencies, state that.
4.  **Validation:** Briefly comment on the validity of the playbook and suggest any simple improvements.

Playbook Content:
\`\`\`yaml
${playbookContent}
\`\`\``;

    const response = await ai.models.generateContent({
      model,
      contents: fullPrompt,
    });
    return response.text;
  } catch (error) {
    console.error("Error analyzing playbook:", error);
    return "Error: Could not analyze playbook.";
  }
};

export const compareResults = async (resultA: string, resultB: string): Promise<string> => {
    try {
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
        const response = await ai.models.generateContent({
            model,
            contents: fullPrompt,
        });

        return response.text;
    } catch (error) {
        console.error("Error comparing results:", error);
        return "Error: Could not compare results.";
    }
};
