let currentKeybind = {
    key: "Enter",
    altKey: true,
    ctrlKey: false,
    shiftKey: false
}

chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local' && changes.keybind) {
        currentKeybind = changes.keybind.newValue;
    }
});

async function Init() {
    const result = await getKeybind();
    if (result) {
        currentKeybind = result;
    }
}

function setInnerText(element, content) {
    if (element.isContentEditable) {
        element.innerText = content;
    } else if (element.tagName === "INPUT" || element.tagName === "TEXTAREA") {
        element.value = content;
    }
    
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
}

function simulateSend(element) {
    const enterEvent = new KeyboardEvent("keydown", {
        key: "Enter",
        code: "Enter",
        keyCode: 13,
        which: 13,
        bubbles: true,
        cancelable: true
    })

    element.dispatchEvent(enterEvent);
}

async function getPreset() {
    const result = await chrome.storage.local.get({ activeUserPreset: {} });
    return result.activeUserPreset;
}

async function getKeybind() {
    const result = await chrome.storage.local.get({
        keybind: {
            key: "Enter",
            altKey: true,
            ctrlKey: false,
            shiftKey: false
        }
    })
    return result.keybind;
}

function pressedKeybind(event, keybind) {
    const isPressedCtrl = event.ctrlKey || event.metaKey;

    return (
        event.key === keybind.key &&
        event.altKey === keybind.altKey &&
        isPressedCtrl === keybind.ctrlKey &&
        event.shiftKey === keybind.shiftKey
    );
}

async function handleAltEnter(activeElement) {
    const originalContent = activeElement.innerText || activeElement.value || "";
    if (!originalContent.trim()) return;

    const preset = await getPreset();
    if (!preset || !preset.name) {
        alert("Prompt for Prompt: No active preset selected. Please open the extension popup and activate a preset.");
        return;
    }

    const originalOpacity = activeElement.style.opacity;
    const originalPointerEvents = activeElement.style.pointerEvents;
    activeElement.style.opacity = "0.5";
    activeElement.style.pointerEvents = "none";
    
    const loadingText = "Generating optimized prompt...";
    setInnerText(activeElement, loadingText);

    chrome.runtime.sendMessage({
        action: "SUBMIT_TEXT",
        data: {
            content: originalContent,
            preset: preset
        }
    }).then((response) => {
        activeElement.style.opacity = originalOpacity;
        activeElement.style.pointerEvents = originalPointerEvents;

        if (response?.status === "success") {
            const apiOutput = response.result?.output?.[0]?.content || 
                             response.result?.choices?.[0]?.message?.content || 
                             response.result?.content?.[0]?.text ||
                             "";
            setInnerText(activeElement, apiOutput);
            simulateSend(activeElement);

        } else if (response?.status === "error") {
            setInnerText(activeElement, originalContent);
            const err = response.message;
            alert(`Prompt for Prompt - Error: ${err}`);
        }
    }).catch((error) => {
        activeElement.style.opacity = originalOpacity;
        activeElement.style.pointerEvents = originalPointerEvents;
        setInnerText(activeElement, originalContent);
        console.error("Error sending message: ", error);
    })
}

document.addEventListener('keydown', (event) => {
    if (!pressedKeybind(event, currentKeybind)) {
        return;
    }

    const activeElement = document.activeElement;
    if (activeElement instanceof HTMLElement) {
        if (activeElement.isContentEditable || activeElement.tagName === "INPUT" || activeElement.tagName === "TEXTAREA") {
            event.preventDefault();
            event.stopPropagation();

            handleAltEnter(activeElement);
        }
    }
}, true);

Init();