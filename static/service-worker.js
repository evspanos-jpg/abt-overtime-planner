// Self-destructing service worker.
//
// The app is always served fresh from the network — the server sends
// `no-store` on HTML and an ETag + `no-cache` on every asset — so a worker
// cache buys nothing here and only risks pinning stale JS/CSS on a device.
// That is exactly what an earlier cache-first build did (notably on iPadOS:
// old code kept loading even after a deploy). This worker now unwinds that:
// it deletes every cache, unregisters itself, and reloads any pages it
// controls so they come straight from the network. Paired with pwa.js, which
// only loads this worker when one is already registered, there is no
// re-registration and therefore no reload loop on clean devices.
self.addEventListener("install", () => self.skipWaiting())

self.addEventListener("activate", event => {
    event.waitUntil((async () => {
        try {
            const keys = await caches.keys()
            await Promise.all(keys.map(key => caches.delete(key)))
        } catch (error) {}
        try {
            await self.registration.unregister()
        } catch (error) {}
        try {
            const windows = await self.clients.matchAll({ type: "window" })
            windows.forEach(client => client.navigate(client.url))
        } catch (error) {}
    })())
})

self.addEventListener("fetch", event => {
    // Never serve from a worker cache — always hit the network.
    event.respondWith(fetch(event.request))
})
