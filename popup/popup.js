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
        name: "Custom",
        apiUrl: "",
        apiKey: null,
        headers: null,
        apiFormat: ""
    }
];


async function loadUserPresets() {
    const result = await chrome.storage.local.get({ userPresets: {} });
    return result.userPresets;
}

async function saveUserPreset(userPreset) {
    
    const currentPresets = await loadUserPresets();
    currentPresets[userPreset.name] = userPreset;
    
    await chrome.storage.local.set({ userPresets: currentPresets });
}

async function saveUserPresets(userPresets) { // overrides entire list
    await chrome.storage.local.set({ userPresets: userPresets });
}

async function getActivePreset() {
    const result = await chrome.storage.local.get({ activeUserPreset: {} });
    
    return result.activeUserPreset;
}

async function setActivePreset(preset) {
    await chrome.storage.local.set({ activeUserPreset: preset });
}


document.addEventListener("DOMContentLoaded", function() {
    
    const providerPresetsSelect = document.getElementById("provider-preset");
    const list = document.getElementById("preset-list");
    
    const addButton = document.getElementById("btn-add-preset");
    const backButton = document.getElementById("btn-back");
    const saveButton = document.getElementById("btn-save");
    const deleteButton = document.getElementById("btn-delete");
    
    let editingPresetName = null;
    
    function Init() {
        setProviderPresets();
        loadUserPresets();
        updateUserPresetsUI();
    }
    
    function setProviderPresets() {
        if (providerPresetsSelect) {
            providerConfigs.forEach(config => {
                const option = new Option(config.name, config.name);
                providerPresetsSelect.appendChild(option);
            })
        }
    }
    
    async function activateUserPreset(preset) {
        const result = await loadUserPresets();
    
        Object.keys(result).forEach(name => {
            result[name].isActive = false;
        })
    
        if (result[preset.name]) {
            result[preset.name].isActive = true;
        }
    
        saveUserPresets(result);
        setActivePreset(preset);
        updateUserPresetsUI();
    
    }
    
    async function updateUserPresetsUI() {
        const userPresetsObj = await loadUserPresets();
        const userPresets = Object.values(userPresetsObj);
        const template = document.getElementById("preset-item-template");
        
        list.innerHTML = "";
        
        if (userPresets.length === 0) {
            const emptyDiv = document.createElement("div");
            emptyDiv.className = "empty-state";
            emptyDiv.innerHTML = "No presets found.";
            list.appendChild(emptyDiv);
            return;
        }

        userPresets.forEach(preset => {
            const clone = template.content.cloneNode(true);
            const item = clone.querySelector(".preset-item");
            
            if (preset.isActive) {
                item.classList.add("is-active");
            }

            clone.querySelector(".name-text").textContent = preset.name;
            
            clone.querySelector(".btn-activate-action").onclick = () => {
                activateUserPreset(preset);
            };

            clone.querySelector(".btn-edit-action").onclick = () => {
                showView("view-add-preset", 'edit', preset);
            };

            list.appendChild(clone);
        });
    }

    function checkSettingsInput() {
        const name = document.getElementById("preset-name").value.trim();
        const apiEndpoint = document.getElementById("api-endpoint").value.trim();
        const model = document.getElementById("model-name").value.trim();

        if (!name || !apiEndpoint || !model) {
            return false;
        }

        return true;
    }


    function toggleCustomFields(providerName) {
        const customGroup = document.getElementById("custom-endpoint-group");
        const formatGroup = document.getElementById("api-format-group");
        const isCustom = providerName === "Custom";

        console.log(providerName);
        
        customGroup.style.display = isCustom ? "block" : "none";
        formatGroup.style.display = isCustom ? "block" : "none";

        if (!isCustom) {
            const config = providerConfigs.find(c => c.name === providerName);
            if (config) {
                document.getElementById("api-endpoint").value = config.apiUrl;
                document.getElementById("api-format").value = config.apiFormat;
            }
        } else {
            document.getElementById("api-endpoint").value = "";
            document.getElementById("api-format").value = "openai";
        }
    }

    if (providerPresetsSelect) {
        providerPresetsSelect.addEventListener("change", (e) => toggleCustomFields(e.target.value));
    }

    function showView(viewId, mode = 'add', presetData = null) {
        document.querySelectorAll(".view").forEach(view => view.classList.remove("active"));
        
        if (viewId === "view-add-preset") {
            const title = document.getElementById("form-title");
            const deleteBtn = document.getElementById("btn-delete");
            
            if (mode === 'edit' && presetData) {
                editingPresetName = presetData.name;
                title.textContent = "Edit Preset";
                deleteBtn.style.display = "block";

                console.log(presetData);
                
                document.getElementById("preset-name").value = presetData.name;
                document.getElementById("api-endpoint").value = presetData.apiUrl;
                document.getElementById("api-key").value = presetData.apiKey;
                document.getElementById("model-name").value = presetData.model;
                document.getElementById("provider-preset").value = presetData.provider || "Custom";
                document.getElementById("api-format").value = presetData.apiFormat || "openai";

                toggleCustomFields(presetData.provider || "Custom");
            } else {
                editingPresetName = null;
                title.textContent = "Add Preset";
                deleteBtn.style.display = "none";
                
                const defaultConfig = providerConfigs[0];
                document.getElementById("preset-name").value = "";
                document.getElementById("provider-preset").value = defaultConfig.name;
                document.getElementById("api-endpoint").value = defaultConfig.apiUrl;
                document.getElementById("api-key").value = "";
                document.getElementById("model-name").value = "";
                document.getElementById("api-format").value = defaultConfig.apiFormat;

                toggleCustomFields(defaultConfig.name);
            }
        }

        document.getElementById(viewId).classList.add("active");
    }

    if (addButton) {
        addButton.addEventListener("click", () => showView("view-add-preset", 'add'));
    }

    if (backButton) {
        backButton.addEventListener("click", function() {
            showView("view-settings");
        })
    }

    if (saveButton) {
        saveButton.addEventListener("click", async function() {
            if (!checkSettingsInput()) {
                alert("Please fill in all required fields.");
                return;
            }

            const newPreset = {
                name: document.getElementById("preset-name").value,
                apiUrl: document.getElementById("api-endpoint").value,
                apiKey: document.getElementById("api-key").value,
                model: document.getElementById("model-name").value,
                apiFormat: document.getElementById("api-format").value,
                provider: document.getElementById("provider-preset").value,
                isActive: false,
            };
            

            if (editingPresetName && editingPresetName !== newPreset.name) {
                const presets = await loadUserPresets();
                delete presets[editingPresetName];
                await saveUserPresets(presets);
            }

            await saveUserPreset(newPreset);
            updateUserPresetsUI();
            showView("view-settings");
        })
    }

    if (deleteButton) {
        deleteButton.addEventListener("click", async function() {
            if (editingPresetName) {
                const result = await loadUserPresets();
                delete result[editingPresetName];
                await saveUserPresets(result);
                updateUserPresetsUI();
                showView("view-settings");
            }
        })
    }

    Init();

})

/*
chrome.storage.local.remove("userPresets").then(() => {
        console.log("All user presets have been deleted from storage.");
    });
*/