const cooldownInput = document.getElementById("cooldown");
const saveBtn = document.getElementById("save");
const status = document.getElementById("status");
const gifSelect = document.getElementById("gifSelect");

chrome.storage.sync.get(["cooldown", "warningGif"], (data) => {
    if (data.cooldown !== undefined) cooldownInput.value = data.cooldown;
    if (data.warningGif) gifSelect.value = data.warningGif;
});

saveBtn.onclick = () => {
    const cooldownVal = parseFloat(cooldownInput.value);
    const gifVal = gifSelect.value;

    if (isNaN(cooldownVal) || cooldownVal < 0) {
        status.textContent = "Cooldown must be ≥ 0";
        return;
    }

    chrome.storage.sync.set({
        cooldown: cooldownVal,
        warningGif: gifVal
    }, () => {
        status.textContent = "Settings saved.";
        setTimeout(() => status.textContent = "", 1500);
    });
};
