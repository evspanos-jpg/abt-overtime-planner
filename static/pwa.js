// No service worker is needed: assets revalidate against the server (ETag +
// no-cache) and HTML is served no-store. An earlier build registered a
// cache-first worker that could pin stale JS/CSS on a device — notably on
// iPadOS, where worker updates are unreliable. So: if a worker is already
// registered, load the self-destruct worker (service-worker.js) which purges
// caches, unregisters, and reloads. On a clean device we register nothing,
// which avoids any reload loop.
if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
        navigator.serviceWorker.getRegistrations()
            .then(registrations => {
                if (registrations.length) {
                    navigator.serviceWorker.register("/service-worker.js").catch(() => {})
                }
            })
            .catch(() => {})
    })
}

// Belt-and-suspenders: clear any leftover Cache Storage from the page side too.
if ("caches" in window) {
    window.addEventListener("load", () => {
        caches.keys()
            .then(keys => Promise.all(keys.map(key => caches.delete(key))))
            .catch(() => {})
    })
}

// Visiting the app with "?diag" (or "#diag") pops up the raw signals used for
// device detection, so issues can be reported from any device without a
// console or digging through menus.
if (location.search.indexOf("diag") !== -1 || location.hash.indexOf("diag") !== -1) {
    window.addEventListener("load", () => {
        var coarse = window.matchMedia ? window.matchMedia("(pointer: coarse)").matches : "?"
        var hoverNone = window.matchMedia ? window.matchMedia("(hover: none)").matches : "?"
        var lines = [
            "BUILD: pwa diag v1",
            "mode: " + (typeof window.currentDeviceMode === "function" ? window.currentDeviceMode() : "?"),
            "isIpadDevice: " + (typeof window.isIpadDevice === "function" ? window.isIpadDevice() : "?"),
            "platform: " + navigator.platform,
            "maxTouchPoints: " + navigator.maxTouchPoints,
            "pointer coarse: " + coarse,
            "hover none: " + hoverNone,
            "viewport: " + window.innerWidth + " x " + window.innerHeight,
            "UA: " + navigator.userAgent
        ]
        alert(lines.join("\n"))
    })
}
