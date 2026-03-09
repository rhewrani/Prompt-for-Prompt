import { SYSTEM_PROMPT } from './prompt.js';

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
            //console.error("Server returned an error:", response.status, errorBody);
            
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
            //console.error("Server returned an error:", response.status, errorBody);
            
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
        //console.error("Error in handleSubmitText:", error);
        sendResponse({ status: "error", message: error.toString() });
    }
}