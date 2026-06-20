if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
        navigator.serviceWorker.register("/service-worker.js")
            .then(registration => registration.update())
            .catch(() => {})
    })
}

if ("caches" in window) {
    window.addEventListener("load", () => {
        caches.keys()
            .then(keys => Promise.all(keys.filter(key => key.startsWith("abt-planner")).map(key => caches.delete(key))))
            .catch(() => {})
    })
}
