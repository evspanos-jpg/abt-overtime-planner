if("serviceWorker" in navigator){
    window.addEventListener("load",async ()=>{
        try{
            const registration = await navigator.serviceWorker.register("/static/service-worker.js",{scope:"/"})
            if(registration.waiting){
                registration.waiting.postMessage({type:"SKIP_WAITING"})
            }
        }catch(error){
            console.warn("PWA service worker registration failed.",error)
        }
    })
}
