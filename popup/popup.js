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
        apiUrl: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
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
    const keybindDisplay = document.getElementById("keybind-display");
    
    const addButton = document.getElementById("btn-add-preset");
    const backButton = document.getElementById("btn-back");
    const saveButton = document.getElementById("btn-save");
    const deleteButton = document.getElementById("btn-delete");
    
    let editingPresetName = null;
    let isRecordingKeybind = false;
    
    async function loadKeybind() {
        const result = await chrome.storage.local.get({ 
            keybind: { 
                key: "Enter", 
                altKey: true, 
                ctrlKey: false, 
                shiftKey: false 
            } 
        });
        return result.keybind;
    }

    async function saveKeybind(keybind) {
        await chrome.storage.local.set({ keybind: keybind });
    }

    function updateKeybindUI(keybind) {
        if (!keybindDisplay) return;
        
        const tags = [];
        if (keybind.ctrlKey) tags.push("Ctrl");
        if (keybind.altKey) tags.push("Alt");
        if (keybind.shiftKey) tags.push("Shift");
        
        let html = tags.map(t => `<span class="key-tag">${t}</span>`).join(" + ");
        if (html) html += " + ";
        html += `<span class="key-tag">${keybind.key === " " ? "Space" : keybind.key}</span>`;
        
        keybindDisplay.innerHTML = html;
    }
    
    async function Init() {
        setProviderPresets();
        updateUserPresetsUI();
        
        const keybind = await loadKeybind();
        updateKeybindUI(keybind);
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

    async function checkNameAvailibility(name) {

        const currentPresets = await loadUserPresets();
        const preset = currentPresets[name];

        if (preset) {
            if (!editingPresetName) return false; 

            if (editingPresetName != name) return false;
        }
        return true;
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



    function toggleCustomFields(providerName) {
        const customGroup = document.getElementById("custom-endpoint-group");
        const formatGroup = document.getElementById("api-format-group");
        const isCustom = providerName === "Custom";

        customGroup.style.display = isCustom ? "block" : "none";
        formatGroup.style.display = isCustom ? "block" : "none";

        if (!isCustom) {
            const config = providerConfigs.find(c => c.name === providerName);
            if (config) {
                document.getElementById("api-format").value = config.apiFormat;
                document.getElementById("api-endpoint").value = config.apiUrl;
            }
        } else {
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

            if (!await checkNameAvailibility(document.getElementById("preset-name").value)) {
                alert("Name already used. Please use a different preset name.");
                console.log("cancelling save");
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
            

            if (editingPresetName) {
                const activePreset = await getActivePreset();
                console.log("Saving: Active preset is: ", activePreset.name);
                if (activePreset.name === editingPresetName) {
                    newPreset.isActive = true;
                    await setActivePreset(newPreset);
                }

                if (editingPresetName !== newPreset.name) {
                    const presets = await loadUserPresets();
                    delete presets[editingPresetName];
                    await saveUserPresets(presets);
                }

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
                const currentActive = await getActivePreset();

                delete result[editingPresetName];

                await saveUserPresets(result);
                if (currentActive.name === editingPresetName) {
                    await setActivePreset({});
                }

                updateUserPresetsUI();
                showView("view-settings");
            }
        })
    }

    if (keybindDisplay) {
        keybindDisplay.addEventListener("click", function() {
            isRecordingKeybind = true;
            keybindDisplay.classList.add("is-recording");
            keybindDisplay.innerHTML = "Press keys...";
            keybindDisplay.focus();
        });

        keybindDisplay.addEventListener("keydown", async function(event) {
            if (!isRecordingKeybind) return;
            
            event.preventDefault();
            event.stopPropagation();

            if (["Alt", "Control", "Shift", "Meta"].includes(event.key)) {
                return;
            }

            const newKeybind = {
                key: event.key,
                altKey: event.altKey,
                ctrlKey: event.ctrlKey,
                shiftKey: event.shiftKey
            };

            await saveKeybind(newKeybind);
            updateKeybindUI(newKeybind);
            
            isRecordingKeybind = false;
            keybindDisplay.classList.remove("is-recording");
            keybindDisplay.blur();
        });

        keybindDisplay.addEventListener("blur", async function() {
            if (isRecordingKeybind) {
                isRecordingKeybind = false;
                keybindDisplay.classList.remove("is-recording");
                const keybind = await loadKeybind();
                updateKeybindUI(keybind);
            }
        });
    }

    Init();

})
