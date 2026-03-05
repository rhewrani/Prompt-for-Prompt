function setInnerText(element, content) {
    if (element.isContentEditable) {
        console.log("Setting innerText!");
        element.innerText = content;
    } else if (element.tagName === "INPUT" || element.tagName === "TEXTAREA") {
        console.log("Setting value!");
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

document.addEventListener('keydown', (event) => {

    if (!(event.altKey && event.key === 'Enter')) {
        return;
    }

    const activeElement = document.activeElement;
    if (activeElement instanceof HTMLElement) {
        if (activeElement.isContentEditable || activeElement.tagName === "INPUT" || activeElement.tagName === "TEXTAREA") {
            event.preventDefault();
            event.stopPropagation();

            chrome.runtime.sendMessage({
                action: "SUBMIT_TEXT",
                data: {
                    content: activeElement.innerText || activeElement.value || ""
                }
            }).then((response) => {
                console.log("Response from background: ", response?.status);
                setInnerText(activeElement, response?.result?.output[0].content);
                simulateSend(activeElement);
            }).catch((error) => {
                console.error("Error sending message: ", error)
            })
       }
    }
}, true);


console.log("Content script loaded");