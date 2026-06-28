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
