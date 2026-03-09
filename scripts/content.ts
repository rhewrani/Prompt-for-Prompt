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
    const matchesKey = event.key === keybind.key;
    const matchesAlt = event.altKey === keybind.altKey;
    const matchesCtrl = (event.ctrlKey === keybind.ctrlKey || event.metaKey === keybind.ctrlKey);
    const matchesShift = event.shiftKey === keybind.shiftKey;

    return matchesKey && matchesAlt && matchesCtrl && matchesShift;
}

async function handleAltEnter(activeElement) {
    const content = activeElement.innerText || activeElement.value || "";
    const preset = await getPreset();
    if (!preset) {
        console.error("No active preset found!");
        return;
    }

    chrome.runtime.sendMessage({
        action: "SUBMIT_TEXT",
        data: {
            content: content,
            preset: preset
        }
    }).then((response) => {
        if (response?.status === "success") {
            const apiOutput = response.result?.output?.[0]?.content || 
                             response.result?.choices?.[0]?.message?.content || 
                             response.result?.content?.[0]?.text ||
                             "";
            setInnerText(activeElement, apiOutput);
            simulateSend(activeElement);

        } else if (response?.status === "error") {
            const err = response.message;
            alert(`Prompt for Prompt - Error: ${err}`);
        }
    }).catch((error) => {
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