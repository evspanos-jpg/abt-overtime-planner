if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
        navigator.serviceWorker.register("/service-worker.js").catch(() => {
            // The app still works in the browser when service workers are unavailable.
        })
    })
}
