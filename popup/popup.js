const providerConfigs = [
    {
        name: "OpenAI",
        apiUrl: "https://api.openai.com/v1/chat/completions",
        apiKey: null,
        headers: null,
        apiFormat: "openai"
    },
    {
        name: "Anthropic",
        apiUrl: "https://api.anthropic.com/v1/messages",
        apiKey: null,
        headers: null,
        apiFormat: "anthropic"
    },
    {
        name: "Groq",
        apiUrl: "https://api.groq.com/openai/v1/chat/completions",
        apiKey: null,
        headers: null,
        apiFormat: "openai"
    },
    {
        name: "Together AI",
        apiUrl: "https://api.together.xyz/v1/chat/completions",
        apiKey: null,
        headers: null,
        apiFormat: "openai"
    },
    {
        name: "Google Gemini",
        apiUrl: "https://generativelanguage.googleapis.com/v1beta/openai/",
        apiKey: null,
        headers: null,
        apiFormat: "openai"
    },
    {
        name: "Ollama (Local)",
        apiUrl: "http://localhost:11434/api/chat",
        apiKey: null,
        headers: null,
        apiFormat: "openai"
    },
    {
        name: "LM Studio (Local)",
        apiUrl: "http://localhost:1234/v1/chat/completions",
        apiKey: null,
        headers: null,
        apiFormat: "openai"
    },
    {
        name: "Other",
        apiUrl: "",
        apiKey: null,
        headers: null,
        apiFormat: ""
    }
];


document.addEventListener("DOMContentLoaded", function() {
    
    const providerPresetsSelect = document.getElementById("provider-preset");

    const addButton = document.getElementById("btn-add-preset");
    const backButton = document.getElementById("btn-back");
    const saveButton = document.getElementById("btn-save");
    

    function Init() {
        setProviderPresets();
        setPresets();
    }
    
    function setProviderPresets() {
        if (providerPresetsSelect) {
            providerConfigs.forEach(config => {
                const option = new Option(config.name, config.name);
                providerPresetsSelect.appendChild(option);
            })
        }
    }

    function setPresets() {

    }
    
    function showView(viewId) {
        document.querySelectorAll(".view").forEach(view => {
            view.classList.remove("active");
        })
        document.getElementById(viewId).classList.add("active");
    }
    

    if (addButton) {
        addButton.addEventListener("click", function() {
            showView("view-add-preset");
        })
    }

    if (backButton) {
        backButton.addEventListener("click", function() {
            showView("view-settings");
        })
    }

    if (saveButton) {
        saveButton.addEventListener("click", function() {
            showView("view-settings");

            // refresh the preset list
        })
    }

    Init();

})