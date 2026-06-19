const CACHE_NAME = "abt-planner-shell-v1"
const APP_SHELL = [
    "/",
    "/static/style.css",
    "/static/pwa.js",
    "/static/manifest.webmanifest",
    "/static/offline.html",
    "/static/icon.svg",
    "/static/icon-192.png",
    "/static/icon-512.png",
    "/static/apple-touch-icon.png"
]

self.addEventListener("install",event=>{
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache=>cache.addAll(APP_SHELL))
            .then(()=>self.skipWaiting())
    )
})

self.addEventListener("activate",event=>{
    event.waitUntil(
        caches.keys()
            .then(keys=>Promise.all(keys.filter(key=>key !== CACHE_NAME).map(key=>caches.delete(key))))
            .then(()=>self.clients.claim())
    )
})

self.addEventListener("message",event=>{
    if(event.data?.type === "SKIP_WAITING"){
        self.skipWaiting()
    }
})

self.addEventListener("fetch",event=>{
    if(event.request.method !== "GET") return

    if(event.request.mode === "navigate"){
        event.respondWith(
            fetch(event.request)
                .then(response=>{
                    let copy = response.clone()
                    caches.open(CACHE_NAME).then(cache=>cache.put("/",copy)).catch(()=>{})
                    return response
                })
                .catch(()=>caches.match(event.request).then(match=>match || caches.match("/static/offline.html")))
        )
        return
    }

    let url = new URL(event.request.url)
    if(url.origin !== self.location.origin) return

    event.respondWith(
        caches.match(event.request).then(cached=>{
            let networkFetch = fetch(event.request)
                .then(response=>{
                    if(response && response.status === 200){
                        let copy = response.clone()
                        caches.open(CACHE_NAME).then(cache=>cache.put(event.request,copy)).catch(()=>{})
                    }
                    return response
                })
                .catch(()=>cached)

            return cached || networkFetch
        })
    )
})
