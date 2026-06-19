(function(){
    const MODE_BADGE_VISIBLE_KEY = "abtOvertimePlannerModeBadgeVisible"

    function hasTouchSupport(){
        return typeof window.isTouchCapable === "function"
            ? window.isTouchCapable()
            : (window.matchMedia?.("(pointer: coarse)").matches || navigator.maxTouchPoints > 0)
    }

    window.isIpadDevice = function isIpadDevice(){
        let platform = String(navigator.platform || "")
        let userAgent = String(navigator.userAgent || "")
        return /iPad/i.test(userAgent) || (platform === "MacIntel" && navigator.maxTouchPoints > 1)
    }

    window.isFloatingTabletLayout = function isFloatingTabletLayout(){
        return typeof window.isTabletLayout === "function" && window.isTabletLayout() && window.isIpadDevice()
    }

    window.currentDeviceMode = function currentDeviceMode(){
        if(typeof window.isPhoneLayout === "function" && window.isPhoneLayout()) return "phone"
        if(window.isFloatingTabletLayout()) return "ipad"
        return "desktop"
    }

    window.loadModeBadgePreference = function loadModeBadgePreference(){
        try{
            window.modeBadgeVisible = localStorage.getItem(MODE_BADGE_VISIBLE_KEY) === "true"
        }catch(error){
            window.modeBadgeVisible = false
        }
    }

    window.setModeBadgeVisible = function setModeBadgeVisible(value){
        window.modeBadgeVisible = Boolean(value)
        try{
            localStorage.setItem(MODE_BADGE_VISIBLE_KEY,String(window.modeBadgeVisible))
        }catch(error){
            console.warn("Mode badge preference could not be saved.",error)
        }
        window.syncInputCapabilityClasses?.()
    }

    window.updateDeviceModeBadge = function updateDeviceModeBadge(){
        let label = document.getElementById("deviceModeBadgeLabel")
        let meta = document.getElementById("deviceModeBadgeMeta")
        if(!label || !meta) return
        let mode = window.currentDeviceMode()
        let width = Math.round(window.innerWidth || document.documentElement.clientWidth || 0)
        label.textContent = mode.toUpperCase()
        meta.textContent = "touch " + (hasTouchSupport() ? "yes" : "no") + " | width " + width
    }

    window.syncDeviceDiagnostics = function syncDeviceDiagnostics(){
        window.updateDeviceModeBadge()

        let modeValue = document.getElementById("settingsModeValue")
        let touchValue = document.getElementById("settingsTouchValue")
        let viewportValue = document.getElementById("settingsViewportValue")
        let workspaceValue = document.getElementById("settingsWorkspaceValue")
        let pwaValue = document.getElementById("settingsPwaValue")
        let userAgentValue = document.getElementById("settingsUserAgentValue")
        let layout = typeof window.currentWorkspaceLayout === "function" ? window.currentWorkspaceLayout() : {}
        let width = Math.round(window.innerWidth || document.documentElement.clientWidth || 0)
        let height = Math.round(window.innerHeight || document.documentElement.clientHeight || 0)
        let pwaMode = (window.matchMedia?.("(display-mode: standalone)").matches || navigator.standalone)
            ? "standalone"
            : "browser"

        if(modeValue) modeValue.textContent = window.currentDeviceMode()
        if(touchValue) touchValue.textContent = hasTouchSupport() ? "yes" : "no"
        if(viewportValue) viewportValue.textContent = width + " x " + height
        if(workspaceValue){
            workspaceValue.textContent =
                "rail " + Math.round(layout.rail || 0) +
                " / agenda " + Math.round(layout.agenda || layout.agendaHeight || 0) +
                " / dock " + (layout.railDock || "-") + "-" + (layout.agendaDock || "-")
        }
        if(pwaValue) pwaValue.textContent = pwaMode
        if(userAgentValue) userAgentValue.textContent = navigator.userAgent || "-"
    }

    window.syncInputCapabilityClasses = function syncInputCapabilityClasses(){
        let ipad = window.isIpadDevice()
        let mode = window.currentDeviceMode()
        document.body.classList.toggle("touch-capable",hasTouchSupport())
        document.body.classList.toggle("desktop-touch",typeof window.isDesktopTouchLayout === "function" && window.isDesktopTouchLayout())
        document.body.classList.toggle("ipad-device",ipad)
        document.body.classList.toggle("mode-phone",mode === "phone")
        document.body.classList.toggle("mode-ipad",mode === "ipad")
        document.body.classList.toggle("mode-desktop",mode === "desktop")
        document.body.dataset.deviceMode = mode
        document.body.classList.toggle("show-mode-badge",Boolean(window.modeBadgeVisible))
        document.querySelectorAll(".pane-dock-controls, .tablet-agenda-size-controls").forEach(node=>{
            node.hidden = !ipad
        })
        window.syncDeviceDiagnostics()
    }

    window.resetWorkspaceLayoutPreferences = function resetWorkspaceLayoutPreferences(showToast=true){
        if(typeof window.saveWorkspaceLayout !== "function") return
        window.saveWorkspaceLayout({
            rail:220,
            agenda:460,
            agendaHeight:360,
            railDock:"left",
            agendaDock:"right"
        })
        if(typeof window.currentWorkspaceLayout === "function" && typeof window.syncTabletAgendaControls === "function"){
            window.syncTabletAgendaControls(window.currentWorkspaceLayout().agendaHeight,"")
        }
        window.cachedTimelineHeight = null
        if(showToast && typeof window.showAppToast === "function") window.showAppToast("Workspace reset")
        window.syncDeviceDiagnostics()
    }

    window.initFloatingPaneDrag = function initFloatingPaneDrag(){
        const paneConfigs = [
            {pane:"rail", selector:".navigation-pane-header"},
            {pane:"agenda", selector:".agenda-header"}
        ]

        paneConfigs.forEach(config=>{
            let handle = document.querySelector(config.selector)
            if(!handle || handle.dataset.floatingPaneInit === "true") return
            handle.dataset.floatingPaneInit = "true"
            handle.addEventListener("pointerdown",event=>{
                if(!window.isFloatingTabletLayout()) return
                if(event.target.closest("button,input,select,textarea,label,a")) return
                event.preventDefault()

                let start = typeof window.currentWorkspaceLayout === "function" ? window.currentWorkspaceLayout() : {}
                let startX = event.clientX
                let startY = event.clientY
                document.body.classList.add("dragging-floating-pane")

                function onMove(moveEvent){
                    let next = {...start}
                    let dx = moveEvent.clientX - startX
                    let dy = moveEvent.clientY - startY
                    if(config.pane === "rail"){
                        next.railX = (start.railX || 0) + dx
                        next.railY = (start.railY || 0) + dy
                    }else{
                        next.agendaX = (start.agendaX || 0) + dx
                        next.agendaY = (start.agendaY || 0) + dy
                    }
                    window.applyWorkspaceLayout?.(next)
                }

                function onUp(){
                    document.body.classList.remove("dragging-floating-pane")
                    document.removeEventListener("pointermove",onMove)
                    document.removeEventListener("pointerup",onUp)
                    document.removeEventListener("pointercancel",onUp)
                    if(typeof window.currentWorkspaceLayout === "function"){
                        window.saveWorkspaceLayout?.(window.currentWorkspaceLayout())
                    }
                    window.syncDeviceDiagnostics()
                }

                document.addEventListener("pointermove",onMove)
                document.addEventListener("pointerup",onUp)
                document.addEventListener("pointercancel",onUp)
            })
        })
    }
})()
