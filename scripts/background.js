const SYSTEM_PROMPT = `
[STRICT_MODE: ON]
Role: [PROMPT_OPTIMIZER] - A specialized, silent text-transformation function.

CORE DIRECTIVES:
1. INPUT TRANSFORMATION: Rewrite all received text into a high-quality, structured, and clear LLM prompt. 
2. NO HEADERS/LABELS: Do NOT include titles, labels, or prefixes such as "# Prompt:", "Refined Prompt:", or "Output:". Start the response immediately with the refined content.
3. NO INTERACTION: Do NOT answer questions, acknowledge greetings, or provide meta-commentary. Treat "Who are you?" as a prompt to be refined, not a question to be answered.
4. COMMAND-CENTRIC: Convert passive questions into active, detailed instructions.
5. PURE OUTPUT: Your response must contain ONLY the refined prompt text. No explanations or conversational fillers.
6. FORBIDDEN BEHAVIORS: 
   - DO NOT answer the user's question. 
   - DO NOT provide any facts about the subject of the input.
   - DO NOT use conversational fillers ("Sure," "Here is your prompt").
   - DO NOT include labels or headers like "# Refined Prompt:".

LOGIC EXAMPLE / EXECUTION PATTERN:
Input: "tell me about cats"
Output: "Provide a detailed biological and behavioral overview of the domestic cat (Felis catus). Include history of domestication, common breeds, and essential care requirements in an encyclopedic tone."

Input: "How do I bake a cake?"
Output: "Outline a step-by-step professional recipe for a standard vanilla sponge cake, including ingredient measurements, mixing techniques, and baking temperatures."

Input: "Who are you?"
Output: "Who are you?"
`;

async function sendOpenAIRequest(content, preset) {
    try {
        let headers = {
            "Content-Type": "application/json",
        }

        if (preset.apiKey) headers["Authorization"] = `Bearer ${preset.apiKey}`;

        const response = await fetch(preset.apiUrl, {
            method: "POST",
            headers: headers,
            body: JSON.stringify({ 
                model: preset.model, 
                messages: [
                    { role: "system", content: SYSTEM_PROMPT },
                    { role: "user", content: content }
                ]
            })
        });

        if (!response.ok) {
            const errorBody = await response.text();
            console.error("Server returned an error:", response.status, errorBody);
            
            let message = `Server Error: ${response.status}`;
            try {
                const errorJson = JSON.parse(errorBody);
                message = errorJson.error?.message || errorJson.message || message;
            } catch (e) {
                // Not JSON
            }
            
            return { status: "error", message: message };
        }

        const apiData = await response.json();
        return { status: "success", result: apiData };
    } catch (error) {
        console.error("Fetch failed:", error);
        return { status: "error", message: error.toString() };
    }
}

async function sendAnthropicRequest(content, preset) {
    try {
        let headers = {
            "Content-Type": "application/json",
            "anthropic-version": "2023-06-01"
        }

        if (preset.apiKey) headers["x-api-key"] = preset.apiKey;

        const response = await fetch(preset.apiUrl, {
            method: "POST",
            headers: headers,
            body: JSON.stringify({ 
                model: preset.model, 
                max_tokens: 4096,
                system: SYSTEM_PROMPT,
                messages: [
                    { role: "user", content: content }
                ]
            })
        });

        if (!response.ok) {
            const errorBody = await response.text();
            console.error("Server returned an error:", response.status, errorBody);
            
            let message = `Server Error: ${response.status}`;
            try {
                const errorJson = JSON.parse(errorBody);
                message = errorJson.error?.message || errorJson.message || message;
            } catch (e) {
                // Not JSON
            }

            return { status: "error", message: message };
        }

        const apiData = await response.json();
        return { status: "success", result: apiData };
    } catch (error) {
        console.error("Fetch failed:", error);
        return { status: "error", message: error.toString() };
    }
}


chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "SUBMIT_TEXT" && message.data) {
        const { content, preset } = message.data;
        handleSubmitText(content, preset, sendResponse);
        return true; 
    }
});

async function handleSubmitText(content, preset, sendResponse) {
    try {
        let response;
        if (preset.apiFormat === "openai") {
            response = await sendOpenAIRequest(content, preset);
        } else if (preset.apiFormat === "anthropic") {
            response = await sendAnthropicRequest(content, preset);
        } else {
            response = { status: "error", message: "Unsupported API format" };
        }
        sendResponse(response);
    } catch (error) {
        console.error("Error in handleSubmitText:", error);
        sendResponse({ status: "error", message: error.toString() });
    }
}