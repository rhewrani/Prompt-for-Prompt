const API_URL = "http://localhost:1234/api/v1/chat";
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

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "SUBMIT_TEXT") {
        const content = message.data ? message.data.content : "No content";

        fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
        body: JSON.stringify({ model: "qwen/qwen3-vl-4b", system_prompt: SYSTEM_PROMPT, input: content })
        })
        .then(async response => {
        if (!response.ok) {
            const errorText = await response.text();
            console.error("Server returned an error:", response.status, errorText);
            throw new Error(`Server Error: ${response.status}`);
        }
        return response.json();
    })
    .then(apiData => {
        sendResponse({ status: "success", result: apiData });
    })
    .catch(error => {
        console.error("Fetch failed:", error);
        sendResponse({ status: "error", message: error.toString() });
    });

    }
    
    return true; 
});