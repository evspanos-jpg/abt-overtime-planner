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
                " / dock " + (layout.railDock || "-") + "-" + (layout.agendaDock || "-") +
                " / float " + (layout.railFloating ? "rail" : "-") + "-" + (layout.agendaFloating ? "agenda" : "-")
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
        window.ensurePaneFloatButtons?.()
        window.ensurePaneResizeGrips?.()
        document.querySelectorAll(".pane-dock-controls, .tablet-agenda-size-controls").forEach(node=>{
            if(ipad){
                node.hidden = false
                node.removeAttribute("hidden")
            }else{
                node.hidden = true
                node.setAttribute("hidden","hidden")
            }
        })
        window.syncDeviceDiagnostics()
    }

    window.resetWorkspaceLayoutPreferences = function resetWorkspaceLayoutPreferences(showToast=true){
        if(typeof window.saveWorkspaceLayout !== "function") return
        window.saveWorkspaceLayout({
            rail:192,
            agenda:320,
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
                if(typeof window.isPaneFloating === "function" && !window.isPaneFloating(config.pane)) return
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

    window.syncPaneFloatButtons = function syncPaneFloatButtons(layout){
        const next = layout || (typeof window.currentWorkspaceLayout === "function" ? window.currentWorkspaceLayout() : {})
        const configs = [
            {pane:"rail", id:"railFloatToggleButton", floating:!!next.railFloating},
            {pane:"agenda", id:"agendaFloatToggleButton", floating:!!next.agendaFloating}
        ]

        configs.forEach(config=>{
            const button = document.getElementById(config.id)
            if(!button) return
            button.textContent = config.floating ? "\u21b2" : "\u2922"
            button.classList.toggle("is-active",config.floating)
            button.setAttribute("aria-pressed",String(config.floating))
            button.setAttribute("aria-label",config.floating ? "Dock " + config.pane + " pane" : "Undock " + config.pane + " pane")
            button.title = config.floating ? "Dock " + config.pane + " pane" : "Undock " + config.pane + " pane"
        })
    }

    window.ensurePaneFloatButtons = function ensurePaneFloatButtons(){
        const configs = [
            {
                pane:"rail",
                id:"railFloatToggleButton",
                containerSelector:".calendar-rail .pane-dock-controls",
                headerSelector:".calendar-rail .navigation-pane-header",
                ariaLabel:"Move navigation pane"
            },
            {
                pane:"agenda",
                id:"agendaFloatToggleButton",
                containerSelector:".agenda-pane .pane-dock-controls",
                headerSelector:".agenda-pane .agenda-header",
                ariaLabel:"Move agenda pane"
            }
        ]

        configs.forEach(config=>{
            let container = document.querySelector(config.containerSelector)
            if(!container){
                const header = document.querySelector(config.headerSelector)
                if(!header) return
                container = document.createElement("div")
                container.className = "pane-dock-controls"
                container.setAttribute("aria-label",config.ariaLabel)
                container.hidden = true
                header.appendChild(container)
            }

            let button = document.getElementById(config.id)
            if(!button){
                button = document.createElement("button")
                button.type = "button"
                button.className = "secondary pane-float-toggle"
                button.id = config.id
                button.textContent = "\u2922"
                button.addEventListener("click",()=>window.togglePaneFloating?.(config.pane))
                container.appendChild(button)
            }
        })

        window.syncPaneFloatButtons?.()
    }

    // Undocked panes can be moved (header) but also need resizing. Add a corner
    // grip anchored to each floating pane's bottom-right via the same layout
    // vars (it lives in the workspace, not inside the scrolling pane, so it
    // never scrolls out of reach).
    window.ensurePaneResizeGrips = function ensurePaneResizeGrips(){
        const workspace = document.querySelector(".calendar-workspace")
        if(!workspace) return
        const grips = [
            {cls:"rail-resize-grip", pane:"rail"},
            {cls:"agenda-resize-grip", pane:"agenda"}
        ]
        grips.forEach(config=>{
            if(workspace.querySelector(":scope > ."+config.cls)) return
            let grip = document.createElement("div")
            grip.className = "pane-resize-grip " + config.cls
            grip.dataset.resizePane = config.pane
            grip.setAttribute("aria-hidden","true")
            grip.title = "Drag to resize"
            workspace.appendChild(grip)
        })
        window.initFloatingPaneResize?.()
    }

    window.initFloatingPaneResize = function initFloatingPaneResize(){
        const configs = [
            {pane:"rail", selector:".rail-resize-grip", widthKey:"rail", heightKey:"railHeight"},
            {pane:"agenda", selector:".agenda-resize-grip", widthKey:"agenda", heightKey:"agendaHeight"}
        ]
        configs.forEach(config=>{
            let grip = document.querySelector(config.selector)
            if(!grip || grip.dataset.resizeInit === "true") return
            grip.dataset.resizeInit = "true"
            grip.addEventListener("pointerdown",event=>{
                if(!window.isFloatingTabletLayout()) return
                if(typeof window.isPaneFloating === "function" && !window.isPaneFloating(config.pane)) return
                event.preventDefault()
                event.stopPropagation()
                grip.setPointerCapture?.(event.pointerId)

                let start = typeof window.currentWorkspaceLayout === "function" ? window.currentWorkspaceLayout() : {}
                let startX = event.clientX
                let startY = event.clientY
                let startW = Number(start[config.widthKey]) || 0
                let startH = Number(start[config.heightKey]) || 0
                document.body.classList.add("resizing-floating-pane")

                function onMove(moveEvent){
                    let next = {...start}
                    next[config.widthKey] = startW + (moveEvent.clientX - startX)
                    next[config.heightKey] = startH + (moveEvent.clientY - startY)
                    window.applyWorkspaceLayout?.(next)
                }

                function onUp(){
                    document.body.classList.remove("resizing-floating-pane")
                    document.removeEventListener("pointermove",onMove)
                    document.removeEventListener("pointerup",onUp)
                    document.removeEventListener("pointercancel",onUp)
                    if(typeof window.currentWorkspaceLayout === "function"){
                        window.saveWorkspaceLayout?.(window.currentWorkspaceLayout())
                    }
                }

                document.addEventListener("pointermove",onMove)
                document.addEventListener("pointerup",onUp)
                document.addEventListener("pointercancel",onUp)
            })
        })
    }
})()
