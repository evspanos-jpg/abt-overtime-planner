if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
        navigator.serviceWorker.register("/service-worker.js", { updateViaCache: "none" }).then(registration => {
            registration.update()
        }).catch(() => {
            // The app still works in the browser when service workers are unavailable.
        })
    })
}
