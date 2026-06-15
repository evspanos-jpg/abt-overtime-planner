const CACHE_NAME = "abt-planner-v5"
const APP_SHELL = [
    "/manifest.webmanifest",
    "/static/style.css?v=99",
    "/static/pwa.js?v=2",
    "/static/icon.svg",
    "/static/icon-192.png",
    "/static/icon-512.png",
    "/static/apple-touch-icon.png",
    "/static/offline.html"
]

self.addEventListener("install", event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL))
    )
    self.skipWaiting()
})

self.addEventListener("activate", event => {
    event.waitUntil(
        caches.keys().then(keys => Promise.all(
            keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
        ))
    )
    self.clients.claim()
})

self.addEventListener("fetch", event => {
    const request = event.request

    if (request.method !== "GET") {
        return
    }

    if (request.mode === "navigate") {
        event.respondWith(
            fetch(request).catch(() => caches.match("/static/offline.html"))
        )
        return
    }

    if (new URL(request.url).pathname === "/static/style.css") {
        event.respondWith(
            fetch(request).then(response => {
                const copy = response.clone()
                caches.open(CACHE_NAME).then(cache => cache.put(request, copy))
                return response
            }).catch(() => caches.match(request))
        )
        return
    }

    event.respondWith(
        caches.match(request).then(cached => cached || fetch(request).then(response => {
            const copy = response.clone()
            caches.open(CACHE_NAME).then(cache => cache.put(request, copy))
            return response
        }))
    )
})
