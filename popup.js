const input = document.getElementById("cooldown");
const saveBtn = document.getElementById("save");
const status = document.getElementById("status");

chrome.storage.sync.get(["cooldown"], (data) => {
    input.value = data.cooldown ?? 20;
});

saveBtn.onclick = () => {
    const value = parseFloat(input.value);
    if (isNaN(value) || value < 0) {
        status.textContent = "Must be a number ≥ 0";
        return;
    }

    chrome.storage.sync.set({ cooldown: value }, () => {
        status.textContent = `Saved: ${value}s`;
        setTimeout(() => (status.textContent = ""), 1500);
    });
};
