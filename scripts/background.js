const API_URL = "";
const SYSTEM_PROMPT = ``;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "SUBMIT_TEXT") {
        const content = message.data ? message.data.content : "No content";

        fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
        body: JSON.stringify({ model: "", system_prompt: SYSTEM_PROMPT, input: content })
        })
        .then(async response => {
        if (!response.ok) {
            const errorText = await response.text();
            console.error("Server returned an error:", response.status, errorText);
            throw new Error(`Server Error: ${response.status}`);
        }
        return response.json(); // Only parse as JSON if it's a success
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