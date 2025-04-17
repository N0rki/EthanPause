let lastPauseTime = 0;
let cooldown = null;
let overlay = null;
let countdownInterval = null;
let currentVideo = null;
let suppressPlayTimestamp = false;
let selectedGif = "waggingFinger";

function setupOverlay() {
    if (!overlay) {
        overlay = document.createElement("div");
        overlay.id = "pause-limiter-overlay";
        Object.assign(overlay.style, {
            position: "fixed",
            top: "10%",
            left: "50%",
            transform: "translateX(-50%)",
            padding: "10px 20px",
            backgroundColor: "rgba(0,0,0,0.8)",
            color: "#fff",
            fontSize: "16px",
            borderRadius: "8px",
            zIndex: 9999,
            pointerEvents: "none",
            whiteSpace: "nowrap",
        });
        document.body.appendChild(overlay);
    }
    overlay.style.display = "block";
}

function showEthanWarning() {
    if (document.getElementById("ethan-warning")) return;

    const warning = document.createElement("div");
    warning.id = "ethan-warning";
    Object.assign(warning.style, {
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        color: "#fff",
        padding: "20px 30px",
        borderRadius: "12px",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        gap: "15px",
        opacity: "1",
        transition: "opacity 1.5s ease-out",
    });

    const img = document.createElement("img");
    img.src = chrome.runtime.getURL(`${selectedGif}.gif`);
    img.alt = "Warning Finger";
    img.style.width = "48px";
    img.style.height = "48px";

    const text = document.createElement("span");
    text.textContent = "Not yet, Ethan.";
    text.style.fontSize = "24px";
    text.style.fontWeight = "bold";

    warning.appendChild(img);
    warning.appendChild(text);
    document.body.appendChild(warning);

    setTimeout(() => {
        warning.style.opacity = "0";
    }, 1500);

    setTimeout(() => {
        if (warning && warning.parentNode) {
            warning.parentNode.removeChild(warning);
        }
    }, 3000);
}


function startCountdown() {
    if (cooldown === null || cooldown === 0) return;

    clearInterval(countdownInterval);
    setupOverlay();

    countdownInterval = setInterval(() => {
        const now = Date.now();
        const remaining = Math.max(0, cooldown - (now - lastPauseTime));
        if (remaining <= 0) {
            overlay.style.display = "none";
            clearInterval(countdownInterval);
        } else {
            overlay.textContent = `You can pause again in ${(remaining / 1000).toFixed(1)}s`;
        }
    }, 100);
}


function removeOverlay() {
    if (overlay) {
        overlay.remove();
        overlay = null;
    }
    clearInterval(countdownInterval);
}

function monitorVideo(video) {
    if (!video || video.dataset.limiterAttached) return;

    currentVideo = video;

    video.addEventListener("pause", () => {
        if (cooldown === 0) return;

        const now = Date.now();
        const timeSinceLastPlay = now - lastPauseTime;

        if (timeSinceLastPlay < cooldown) {
            suppressPlayTimestamp = true;
            video.play();
            startCountdown();
            showEthanWarning();
        }
    });



    video.addEventListener("play", () => {
        if (cooldown === 0) return;

        if (suppressPlayTimestamp) {
            suppressPlayTimestamp = false;
            return;
        }

        lastPauseTime = Date.now(); 
        startCountdown();
    });


    video.dataset.limiterAttached = "true";
}

function waitForVideoAfterCooldownLoad() {
    const check = setInterval(() => {
        const video = document.querySelector("video");
        if (video && cooldown !== null) {
            monitorVideo(video);
            clearInterval(check);
        }
    }, 500);
}

function loadCooldownAndRun() {
    chrome.storage.sync.get(["cooldown", "warningGif"], (data) => {
        cooldown = typeof data.cooldown === "number" ? data.cooldown * 1000 : 0;
        selectedGif = data.warningGif || "waggingFinger";
        waitForVideoAfterCooldownLoad();
    });
}


chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === "sync") {
        if (changes.cooldown) {
            const newVal = changes.cooldown.newValue;
            if (typeof newVal === "number") {
                cooldown = newVal * 1000;
                const now = Date.now();
                const timeSinceLastPause = now - lastPauseTime;
                const remaining = Math.max(0, cooldown - timeSinceLastPause);

                if (cooldown === 0) {
                    removeOverlay();
                } else if (remaining > 0) {
                    startCountdown();
                } else {
                    if (overlay) overlay.style.display = "none";
                    clearInterval(countdownInterval);
                }
            }
        }

        if (changes.warningGif) {
            selectedGif = changes.warningGif.newValue;
            console.log(`[Limiter] Warning GIF changed to: ${selectedGif}`);
        }
    }
});


let lastUrl = location.href;
new MutationObserver(() => {
    const currentUrl = location.href;

    if (currentUrl !== lastUrl) {
        lastUrl = currentUrl;
        removeOverlay();
        lastPauseTime = 0;
        setTimeout(loadCooldownAndRun, 1000);
    }


    if (!document.querySelector("video") && currentVideo) {
        currentVideo = null;
        removeOverlay();
    }
}).observe(document, { subtree: true, childList: true });

loadCooldownAndRun();
