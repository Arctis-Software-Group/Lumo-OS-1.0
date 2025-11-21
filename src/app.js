// --- Config & State ---
const systemApps = [
    { id: 'browser', name: 'Web', icon: 'fa-brands fa-chrome', color: '#4285F4', type: 'app', url: 'https://www.google.com/webhp?igu=1' },
    { id: 'cmd', name: 'Cmd', icon: 'fa-solid fa-terminal', color: '#333', type: 'app' },
    { id: 'notes', name: 'Notes', icon: 'fa-solid fa-note-sticky', color: '#F4B400', type: 'app' },
    { id: 'files', name: 'Files', icon: 'fa-solid fa-folder-open', color: '#0F9D58', type: 'app' },
    { id: 'settings', name: 'Settings', icon: 'fa-solid fa-gear', color: '#999', type: 'app' },
    { id: 'photos', name: 'Photos', icon: 'fa-solid fa-image', color: 'var(--accent)', type: 'app' },
    { id: 'calculator', name: 'Calc', icon: 'fa-solid fa-calculator', color: '#DB4437', type: 'app' },
    { id: 'store', name: 'Lumo Store', icon: 'fa-solid fa-bag-shopping', color: '#fff', type: 'app' },
];

const DESKTOP_SHORTCUT_IDS = new Set(['browser', 'files', 'cmd', 'notes', 'settings', 'store', 'photo-pro']);
const STORAGE_KEYS = {
    notes: 'lumo_notes',
    installedApps: 'lumo_store_apps',
    language: 'lumo_language',
};

const fileLibrary = [
    {
        id: 'workspace',
        name: 'Workspace',
        icon: 'fa-solid fa-laptop-code',
        accent: '#ff6b6b',
        description: 'Fast notes and sketches for daily riffs.',
        files: [
            { id: 'manifest', name: 'LumoManifest.txt', type: 'Text', size: '1.1 KB', modified: 'Today · 09:41', preview: 'Manifest entries for updates and system vibes.' },
            { id: 'idea', name: 'MidnightIdea.txt', type: 'Text', size: '680 B', modified: 'Yesterday · 22:30', preview: 'Quote: “Build the impossible.”' },
            { id: 'todo', name: 'MorningTodo.md', type: 'Markdown', size: '2.4 KB', modified: 'Today · 07:08', preview: '- Ship Photos app\n- Hook up Calc\n- Ship more style' },
        ],
    },
    {
        id: 'media',
        name: 'Media',
        icon: 'fa-solid fa-photo-film',
        accent: '#53b5ff',
        description: 'Screenshots, renders, and quick captures.',
        files: [
            { id: 'render', name: 'SunsetRender.png', type: 'Image', size: '4.8 MB', modified: 'Today · 05:12', preview: 'A haze-laced render from the mockup session.' },
            { id: 'loop', name: 'LoopDraft.mov', type: 'Video', size: '9.7 MB', modified: 'Yesterday · 20:44', preview: 'Short loop of the dock animation.' },
            { id: 'sprite', name: 'IconSprite.svg', type: 'SVG', size: '720 KB', modified: 'Nov 10 · 14:02', preview: 'SVG sprite for upcoming widgets.' },
        ],
    },
    {
        id: 'system',
        name: 'System Vault',
        icon: 'fa-solid fa-shield-halved',
        accent: '#b77bff',
        description: 'Logs, kernels, and dev notes.',
        files: [
            { id: 'log', name: 'kernel.log', type: 'Log', size: '128 KB', modified: 'Today · 03:08', preview: 'Startup sequence stable. No anomalies.' },
            { id: 'changelog', name: 'changelog.md', type: 'Markdown', size: '4.3 KB', modified: 'Nov 15 · 12:02', preview: 'v1.0.2 — Photos watermark, Files overhaul.' },
            { id: 'build', name: 'build-plan.txt', type: 'Text', size: '840 B', modified: 'Nov 12 · 19:48', preview: 'Notes for next layers: Store and drivers.' },
        ],
    },
];

const updateHistoryEntries = [
    { version: 'v1.0.0', note: 'Initial Lumo OS release.', date: 'Nov 20' },
];

const photoFilterMap = {
    normal: 'none',
    grayscale: 'grayscale(100%)',
    invert: 'invert(100%)',
    sepia: 'sepia(0.45)',
    neon: 'contrast(1.3) saturate(1.5)',
};

const calcButtons = [
    { label: 'C', type: 'action', value: 'clear' },
    { label: '⇤', type: 'action', value: 'backspace' },
    { label: '%', type: 'action', value: 'percent' },
    { label: '÷', type: 'operator', value: '/' },
    { label: '7', type: 'digit' },
    { label: '8', type: 'digit' },
    { label: '9', type: 'digit' },
    { label: '×', type: 'operator', value: '*' },
    { label: '4', type: 'digit' },
    { label: '5', type: 'digit' },
    { label: '6', type: 'digit' },
    { label: '-', type: 'operator', value: '-' },
    { label: '1', type: 'digit' },
    { label: '2', type: 'digit' },
    { label: '3', type: 'digit' },
    { label: '+', type: 'operator', value: '+' },
    { label: '0', type: 'digit', span: 2 },
    { label: '.', type: 'digit' },
    { label: '=', type: 'action', value: 'evaluate' },
];

const storeCatalogPaths = [
    'src/apps/default/photo-pro/meta.json',
    'src/apps/default/lumo-help/meta.json',
    'src/apps/default/lumo-365/meta.json',
    'src/apps/default/lumo-wallpaper/meta.json',
    'src/apps/default/lumora/meta.json',
    'src/apps/default/sound-studio/meta.json',
    'src/apps/default/lumo-dev/meta.json',
    'src/apps/default/video-studio/meta.json',
    'src/apps/default/camera/meta.json',
    'src/apps/community/drawin-simple/meta.json',
    'src/apps/community/grapher/meta.json'
];
let installedStoreApps = loadInstalledApps();
let storeCatalog = [];
let zIndexCounter = 100;
let activeWindows = {};
let currentTheme = 'dark';
// track boot time for uptime command
const lumoBootTime = new Date();

window.addEventListener('load', () => {
    const bar = document.getElementById('boot-bar');
    const screen = document.getElementById('boot-screen');
    const desktop = document.getElementById('desktop');

    setTimeout(() => { bar.style.width = '100%'; }, 100);
    setTimeout(() => {
        screen.style.opacity = '0';
        setTimeout(() => {
            screen.style.display = 'none';

            // Initialize Login Screen instead of showing desktop immediately
            if (window.LoginManager) {
                const loginScreen = document.getElementById('login-screen');
                loginScreen.classList.remove('hidden');

                window.LoginManager.init('login-screen', (user) => {
                    // On Login Success
                    console.log('Logged in as:', user.name);
                    updateCurrentUserDisplay(user);
                    desktop.style.display = 'block';
                    requestAnimationFrame(() => { desktop.style.opacity = '1'; });

                    // Play startup sound or welcome notification could go here
                });
            } else {
                // Fallback if LoginManager missing
                desktop.style.display = 'block';
                requestAnimationFrame(() => { desktop.style.opacity = '1'; });
            }
        }, 1000);
    }, 2500);

    // Load locales first so markup can be localized
    (async () => {
        if (window.i18n?.load) await window.i18n.load();
        renderDesktop();
        // Ensure the document lang is in-sync with saved preference at boot
        const bootLang = localStorage.getItem(STORAGE_KEYS.language) || 'en';
        if (window.i18n?.setLocale) window.i18n.setLocale(bootLang);
        document.documentElement.lang = bootLang;
        // Broadcast language on startup so apps that listen can update
        document.dispatchEvent(new CustomEvent('lumo-language-changed', { detail: bootLang }));
    })();
    updateClock();
    setInterval(updateClock, 1000);
    renderWidgets();
    loadStoreCatalog();
    loadWallpaperPreference();
    // (language dispatch already handled after locales load)
});

window.logoutUser = function () {
    const desktop = document.getElementById('desktop');
    const loginScreen = document.getElementById('login-screen');

    // Hide desktop
    desktop.style.opacity = '0';
    setTimeout(() => {
        desktop.style.display = 'none';

        // Show login screen
        if (window.LoginManager) {
            window.LoginManager.currentUser = null;
            window.LoginManager.init('login-screen', (user) => {
                console.log('Logged in again as:', user.name);
                updateCurrentUserDisplay(user);
                desktop.style.display = 'block';
                requestAnimationFrame(() => { desktop.style.opacity = '1'; });
            });
            loginScreen.classList.remove('hidden');
            loginScreen.classList.remove('opacity-0');
            loginScreen.classList.remove('pointer-events-none');
        } else {
            location.reload();
        }
    }, 500);
};

function updateCurrentUserDisplay(user) {
    const el = document.getElementById('current-user-name');
    if (el) el.innerText = user.name;
}

function updateClock() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const timeStr = `${hours}:${minutes}`;

    const clockEl = document.getElementById('desktop-clock');
    if (clockEl) clockEl.innerText = timeStr;

    const statusClock = document.getElementById('status-clock');
    if (statusClock) statusClock.innerText = timeStr;

    const dateEl = document.getElementById('desktop-date');
    if (dateEl) {
        const options = { weekday: 'short', month: 'short', day: 'numeric' };
        dateEl.innerText = now.toLocaleDateString('en-US', options);
    }
}

function renderWidgets() {
    const container = document.getElementById('desktop-widgets');
    if (!container) return;
    container.innerHTML = '';

    // Clock Widget
    const clockWidget = document.createElement('div');
    clockWidget.className = 'lumo-widget widget-clock';
    clockWidget.innerHTML = `
        <div class="time" id="desktop-clock">00:00</div>
        <div class="date" id="desktop-date">Loading...</div>
    `;
    container.appendChild(clockWidget);

    // Weather Widget
    const weatherWidget = document.createElement('div');
    weatherWidget.className = 'lumo-widget widget-weather';
    weatherWidget.innerHTML = `
        <div>
            <div class="condition">TOKYO</div>
            <div class="temp">24°C</div>
        </div>
        <i class="fa-solid fa-cloud-sun"></i>
    `;
    container.appendChild(weatherWidget);


}

function loadInstalledApps() {
    const raw = localStorage.getItem(STORAGE_KEYS.installedApps);
    if (!raw) return [];
    try { const data = JSON.parse(raw); return Array.isArray(data) ? data : []; } catch { return []; }
}

function persistInstalledApps() {
    localStorage.setItem(STORAGE_KEYS.installedApps, JSON.stringify(installedStoreApps));
}

function renderDesktop() {
    const dock = document.getElementById('dock-apps');
    const drawer = document.getElementById('drawer-grid');
    const desktopIcons = document.getElementById('desktop-icons');
    dock.innerHTML = '';
    drawer.innerHTML = '';
    desktopIcons.innerHTML = '';

    // Ensure desktop icons container allows free movement
    desktopIcons.className = 'absolute inset-0 z-0 pointer-events-none';

    const positions = loadIconPositions();
    let defaultX = 20;
    let defaultY = 20;
    const gapY = 100;

    getAllApps().forEach(app => {
        dock.appendChild(createDockButton(app));
        drawer.appendChild(createDrawerItem(app));
        // Show if it's a default shortcut OR it's an installed store app
        if (DESKTOP_SHORTCUT_IDS.has(app.id) || installedStoreApps.some(a => a.id === app.id)) {
            const icon = createDesktopIcon(app);

            // Position logic
            if (positions[app.id]) {
                icon.style.left = positions[app.id].x + 'px';
                icon.style.top = positions[app.id].y + 'px';
            } else {
                icon.style.left = defaultX + 'px';
                icon.style.top = defaultY + 'px';
                defaultY += gapY;
                if (defaultY > window.innerHeight - 100) {
                    defaultY = 20;
                    defaultX += 100;
                }
            }

            desktopIcons.appendChild(icon);
        }
    });
}

function renderAppIcon(app, extraClasses = '') {
    const color = resolveIconColor(app.color);
    if (app.icon.startsWith('fa-')) {
        return `<i class="${app.icon} ${extraClasses}" style="color: ${color}"></i>`;
    } else {
        return `<img src="${app.icon}" class="${extraClasses} object-contain" style="width: 1em; height: 1em; filter: drop-shadow(0 0 2px ${color});">`;
    }
}

function createDockButton(app) {
    const btn = document.createElement('button');
    btn.className = 'app-icon w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition hover:-translate-y-2 relative group';
    btn.innerHTML = `
        ${renderAppIcon(app, 'text-xl sm:text-2xl')}
        <div class="absolute -bottom-2 w-1 h-1 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
        <div class="absolute -top-10 bg-black/80 text-xs px-2 py-1 rounded text-white opacity-0 group-hover:opacity-100 transition pointer-events-none whitespace-nowrap font-dot border border-white/20">${app.name}</div>
    `;
    btn.onclick = () => openApp(app);
    return btn;
}

function resolveIconColor(color) {
    if (color === 'var(--accent)') return '#ff003c';
    if (color === '#fff') return '#fff';
    return color || 'var(--text-main)';
}

function createDrawerItem(app) {
    const wrapper = document.createElement('div');
    wrapper.className = 'flex flex-col items-center gap-2 cursor-pointer p-2 hover:bg-white/5 rounded-xl transition active:scale-95';
    wrapper.innerHTML = `
        <div class="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center shadow-lg border border-white/5 text-white">
            ${renderAppIcon(app, 'text-2xl')}
        </div>
        <span class="text-xs font-mono text-gray-300">${app.name}</span>
    `;
    wrapper.onclick = () => { openApp(app); toggleAppDrawer(); };
    return wrapper;
}

function createDesktopIcon(app) {
    const item = document.createElement('div');
    item.className = 'absolute flex flex-col items-center gap-1 cursor-pointer p-2 hover:bg-white/10 rounded-lg transition w-24 group pointer-events-auto';
    item.innerHTML = `
        ${renderAppIcon(app, 'text-3xl drop-shadow-md group-hover:scale-110 transition')}
        <span class="text-[10px] font-bold text-white drop-shadow-md bg-black/30 px-1 rounded text-center leading-tight">${app.name}</span>
    `;

    // Drag logic
    let isDraggingIcon = false;
    let startX, startY, initialLeft, initialTop;

    const onMouseDown = (e) => {
        e.stopPropagation();
        isDraggingIcon = true;
        startX = e.clientX;
        startY = e.clientY;
        initialLeft = item.offsetLeft;
        initialTop = item.offsetTop;
        item.style.zIndex = 1000;

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    };

    const onMouseMove = (e) => {
        if (!isDraggingIcon) return;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        item.style.left = `${initialLeft + dx}px`;
        item.style.top = `${initialTop + dy}px`;
    };

    const onMouseUp = () => {
        isDraggingIcon = false;
        item.style.zIndex = '';
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);

        // Save position
        const positions = loadIconPositions();
        positions[app.id] = { x: item.offsetLeft, y: item.offsetTop };
        localStorage.setItem('lumo_icon_positions', JSON.stringify(positions));
    };

    item.addEventListener('mousedown', onMouseDown);
    item.ondblclick = () => openApp(app);

    return item;
}

function getAllApps() {
    return [...systemApps, ...installedStoreApps];
}

function openApp(app) {
    if (activeWindows[app.id]) { bringToFront(app.id); return; }

    const winId = app.id;
    const isMobile = window.innerWidth < 768;
    const initialX = isMobile ? 0 : 50 + (Object.keys(activeWindows).length * 20);
    const initialY = isMobile ? 0 : 50 + (Object.keys(activeWindows).length * 20);

    const win = document.createElement('div');
    win.id = `win-${winId}`;
    win.className = `window-frame absolute flex flex-col bg-[#111] border border-[#333] shadow-2xl overflow-hidden pointer-events-auto animate-[scaleIn_0.2s_ease-out]`;

    if (isMobile) { win.className += ' fixed inset-0 z-50'; }
    else { win.className += ' rounded-xl w-[600px] h-[400px] resize'; win.style.top = `${initialY}px`; win.style.left = `${initialX}px`; }
    win.style.zIndex = ++zIndexCounter;

    let contentHTML = '';
    if (app.id === 'browser') {
        contentHTML = buildBrowserMarkup();
    } else if (app.id === 'cmd') {
        contentHTML = buildCmdMarkup(winId);
    } else if (app.id === 'notes') {
        contentHTML = buildNotesMarkup();
    } else if (app.id === 'settings') {
        contentHTML = buildSettingsMarkup();
    } else if (app.id === 'files') {
        contentHTML = buildFilesMarkup();
    } else if (app.id === 'photos') {
        contentHTML = buildPhotosMarkup();
    } else if (app.id === 'calculator') {
        contentHTML = buildCalculatorMarkup();
    } else if (app.id === 'store') {
        contentHTML = buildStoreMarkup();
    } else if (app.id === 'photo-pro') {
        contentHTML = buildPhotoProMarkup();
    } else if (app.id === 'lumo-help') {
        contentHTML = window.LumoHelp?.buildMarkup ? window.LumoHelp.buildMarkup() : buildFallbackMarkup(app);
    } else if (app.id === 'lumo-365') {
        contentHTML = window.Lumo365?.buildMarkup ? window.Lumo365.buildMarkup() : buildFallbackMarkup(app);
    } else if (app.id === 'lumo-wallpaper') {
        contentHTML = window.LumoWallpaper?.buildMarkup ? window.LumoWallpaper.buildMarkup() : buildFallbackMarkup(app);
    } else if (app.id === 'sound-studio') {
        contentHTML = window.SoundStudio?.buildMarkup ? window.SoundStudio.buildMarkup() : buildFallbackMarkup(app);
    } else if (app.id === 'lumo-dev') {
        contentHTML = window.LumoDev?.buildMarkup ? window.LumoDev.buildMarkup() : buildFallbackMarkup(app);
    } else if (app.id === 'video-studio') {
        contentHTML = window.VideoStudio?.buildMarkup ? window.VideoStudio.buildMarkup() : buildFallbackMarkup(app);
    } else if (app.id === 'camera') {
        contentHTML = window.CameraApp?.buildMarkup ? window.CameraApp.buildMarkup() : buildFallbackMarkup(app);
    } else if (app.id === 'drawin-simple') {
        contentHTML = window.DrawinSimple?.buildMarkup ? window.DrawinSimple.buildMarkup() : buildFallbackMarkup(app);
    } else if (app.id === 'grapher') {
        contentHTML = window.Grapher?.buildMarkup ? window.Grapher.buildMarkup() : buildFallbackMarkup(app);
    } else if (app.id === 'lumora') {
        contentHTML = window.Lumora?.buildMarkup ? window.Lumora.buildMarkup() : buildFallbackMarkup(app);
    } else {
        contentHTML = buildFallbackMarkup(app);
    }

    win.innerHTML = `
        <div class="window-header h-10 bg-[#1a1a1a] border-b border-[#333] flex items-center justify-between px-3 cursor-move select-none" onmousedown="startDrag(event, '${winId}')" ontouchstart="startDrag(event, '${winId}')">
            <div class="flex items-center gap-2">
                <div class="flex gap-1.5 window-controls">
                    <button onclick="closeApp('${winId}')" class="w-3 h-3 rounded-full bg-[#ff5f56] hover:bg-[#cc4b42] transition"></button>
                    <button class="w-3 h-3 rounded-full bg-[#ffbd2e] hover:bg-[#d69d23] transition"></button>
                    <button class="w-3 h-3 rounded-full bg-[#27c93f] hover:bg-[#1e9e31] transition"></button>
                </div>
                 <button onclick="closeApp('${winId}')" class="mobile-close-btn hidden text-red-500 font-bold text-lg ml-[-10px]"><i class="fa-solid fa-chevron-left"></i> Back</button>
            </div>
            <span class="font-dot text-gray-400 tracking-wider text-sm">${app.name.toUpperCase()}</span>
            <div class="w-10"></div>
        </div>
        ${contentHTML}
    `;

    document.getElementById('window-area').appendChild(win);
    activeWindows[winId] = win;
    if (app.id === 'cmd') initCommandPrompt(winId);
    if (app.id === 'notes') initNotes();
    if (app.id === 'settings') initSettings(winId);
    if (app.id === 'files') initFilesApp(win);
    if (app.id === 'photos') initPhotosApp(win);
    if (app.id === 'calculator') initCalculator(win);
    if (app.id === 'store') mountStoreApp(win);
    if (app.id === 'photo-pro' && window.PhotoPro?.init) window.PhotoPro.init(win);
    if (app.id === 'lumo-help' && window.LumoHelp?.init) window.LumoHelp.init(win);
    if (app.id === 'lumo-365' && window.Lumo365?.init) window.Lumo365.init(win);
    if (app.id === 'lumo-wallpaper' && window.LumoWallpaper?.init) window.LumoWallpaper.init(win);
    if (app.id === 'sound-studio' && window.SoundStudio?.init) window.SoundStudio.init(win);
    if (app.id === 'lumo-dev' && window.LumoDev?.init) window.LumoDev.init(win);
    if (app.id === 'video-studio' && window.VideoStudio?.init) window.VideoStudio.init(win);
    if (app.id === 'camera' && window.CameraApp?.init) window.CameraApp.init(win);
    if (app.id === 'drawin-simple' && window.DrawinSimple?.init) window.DrawinSimple.init(win);
    if (app.id === 'grapher' && window.Grapher?.init) window.Grapher.init(win);
    if (app.id === 'lumora' && window.Lumora?.init) window.Lumora.init(win);

    bringToFront(winId);
}

function closeApp(id) {
    const win = document.getElementById(`win-${id}`);
    if (win) {
        win.classList.add('opacity-0', 'scale-90');
        setTimeout(() => { win.remove(); delete activeWindows[id]; }, 200);
    }
}

function bringToFront(id) { if (activeWindows[id]) { zIndexCounter++; activeWindows[id].style.zIndex = zIndexCounter; } }

function initCommandPrompt(id) {
    const input = document.getElementById(`cmd-input-${id}`);
    const feed = document.getElementById(`cmd-feed-${id}`);
    if (!input || !feed) return;

    const resetFeed = () => {
        feed.innerHTML = `
            <div class="text-xs text-gray-400">Lumo Cmd Shell v1.0</div>
            <div class="text-[var(--accent)]">C:\\Lumo&gt; Ready for commands.</div>
        `;
        feed.scrollTop = 0;
    };

    const appendResponse = (message) => {
        const resDiv = document.createElement('div');
        resDiv.className = 'text-gray-400 text-sm mb-1';
        resDiv.innerText = message;
        feed.appendChild(resDiv);
    };

    const findAppByTerm = (term) => {
        const target = term.toLowerCase();
        return getAllApps().find(a => a.id === target || a.name.toLowerCase() === target || a.id.toLowerCase() === target);
    };

    const evaluateExpression = (expr) => {
        // allow only numbers, basic math operators, parentheses, decimals and whitespace
        if (!/^[0-9+\-*/(). %]+$/.test(expr)) return null;
        try { return Function(`'use strict'; return (${expr})`)(); } catch { return null; }
    };

    const executeCommand = (cmd) => {
        const normalized = cmd.trim();
        const low = normalized.toLowerCase();
        // basic & legacy
        if (low === 'help') return window.i18n?.t('cmd.help', 'Available commands: help, date, time, uptime, apps, open <app>, close <app>, ls <folder>, lang <code>, whoami, calc <expr>, clear, echo, reboot, about, weather, joke, quote, matrix');
        if (low === 'date') return new Date().toLocaleDateString();
        if (low === 'time') return new Date().toLocaleTimeString();
        if (low === 'uptime') {
            const ms = Date.now() - lumoBootTime.getTime();
            const sec = Math.floor(ms / 1000); const mins = Math.floor(sec / 60); const hours = Math.floor(mins / 60);
            return `${hours}h ${mins % 60}m ${sec % 60}s since boot`;
        }
        if (low === 'reboot') { location.reload(); return null; }
        if (low === 'reset') {
            if (confirm('Factory Reset: Are you sure?')) clearUserData();
            return null;
        }
        if (low === 'clear') { resetFeed(); return null; }
        if (low === 'about') return window.i18n?.t('cmd.about', 'Lumo OS Cmd v2.0 — The power of text.');
        if (low === 'whoami') {
            const user = window.LoginManager?.currentUser?.name || 'Lumo User';
            return window.i18n?.t('cmd.whoami', `You are ${user}`);
        }
        if (low.startsWith('echo ')) return cmd.slice(5);
        if (low === 'echo') return '';

        // Fun commands
        if (low === 'weather') return 'Lumo City: 24°C, Clear Sky. Perfect for coding.';
        if (low === 'joke') {
            const jokes = [
                "Why do programmers prefer dark mode? Because light attracts bugs.",
                "I told my CSS joke to a backend developer, but they didn't get the style.",
                "There are 10 types of people in the world: those who understand binary, and those who don't."
            ];
            return jokes[Math.floor(Math.random() * jokes.length)];
        }
        if (low === 'quote') {
            const quotes = [
                "Talk is cheap. Show me the code. - Linus Torvalds",
                "Programs must be written for people to read, and only incidentally for machines to execute. - Abelson & Sussman",
                "Simplicity is the ultimate sophistication. - Leonardo da Vinci"
            ];
            return quotes[Math.floor(Math.random() * quotes.length)];
        }
        if (low === 'matrix') {
            const feed = document.getElementById(`cmd-feed-${activeWindows['cmd']?.id?.replace('win-', '') || 'cmd'}`);
            return "Wake up, Neo... (The Matrix effect is best experienced in your imagination for now)";
        }

        // search <query>
        if (low.startsWith('search ')) {
            const query = normalized.slice(7).trim();
            if (!query) return 'Usage: search <query>';
            window.open(`https://www.google.com/search?q=${encodeURIComponent(query)}`, '_blank');
            return `Searching web for: ${query}`;
        }

        // sysinfo
        if (low === 'sysinfo') {
            return `
Lumo OS v1.0.0
Kernel: WebCore 5.0
User Agent: ${navigator.userAgent}
Screen: ${window.screen.width}x${window.screen.height}
Language: ${navigator.language}
            `.trim();
        }

        // play <song> (mock)
        if (low.startsWith('play ')) {
            const song = normalized.slice(5).trim();
            return `Playing "${song}" on Lumo Music... (Mock)`;
        }

        // list apps
        if (low === 'apps' || low === 'ls apps' || low === 'list apps') {
            return getAllApps().map(a => `${a.id} — ${a.name}`).join('\n');
        }

        // open app
        if (low.startsWith('open ')) {
            const term = normalized.slice(5).trim();
            const app = findAppByTerm(term);
            if (!app) return window.i18n?.t('cmd.openFail', `Unable to find app: ${term}`);
            openApp(app);
            return (window.i18n?.t('cmd.openSuccess', 'Opened') || 'Opened') + ` ${app.name}`;
        }

        // close app
        if (low.startsWith('close ')) {
            const term = normalized.slice(6).trim();
            const app = findAppByTerm(term);
            if (!app) return window.i18n?.t('cmd.openFail', `Unable to find app: ${term}`);
            closeApp(app.id);
            return (window.i18n?.t('cmd.closeSuccess', 'Closed') || 'Closed') + ` ${app.name}`;
        }

        // language switcher: lang en|ja|zh
        if (low.startsWith('lang ')) {
            const code = normalized.slice(5).trim().split(/[-_]/)[0];
            if (!['en', 'ja', 'zh'].includes(code)) return window.i18n?.t('cmd.langFail', 'Supported: en, ja, zh');
            if (window.i18n?.setLocale) window.i18n.setLocale(code);
            document.documentElement.lang = code;
            document.dispatchEvent(new CustomEvent('lumo-language-changed', { detail: code }));
            return (window.i18n?.t('cmd.langOk', 'Language set to') || 'Language set to') + ` ${code}`;
        }

        // list files via ls
        if (low.startsWith('ls ')) {
            const folderName = normalized.slice(3).trim();
            if (!folderName) return window.i18n?.t('cmd.lsHelp', 'Usage: ls <folder> — folders: ' + fileLibrary.map(f => f.id).join(', '));
            const folder = fileLibrary.find(f => f.id === folderName || f.name.toLowerCase() === folderName.toLowerCase());
            if (!folder) return window.i18n?.t('cmd.lsFail', `Folder not found: ${folderName}`);
            return folder.files.map(f => `${f.name} · ${f.type} · ${f.size}`).join('\n');
        }

        // evaluate simple arithmetic: calc 1+1
        if (low.startsWith('calc ') || low.startsWith('eval ')) {
            const expr = normalized.split(/calc |eval /i).slice(1).join(' ').trim();
            const result = evaluateExpression(expr);
            if (result === null) return window.i18n?.t('cmd.calcFail', 'Invalid expression');
            return String(result);
        }

        return window.i18n?.t('cmd.notRecognized', `C:\\Lumo> '${cmd}' is not recognized.`);
    };

    input.addEventListener('keydown', (e) => {
        if (e.key !== 'Enter') return;
        const cmd = input.value.trim();
        if (!cmd) { input.value = ''; return; }

        const line = document.createElement('div');
        line.className = 'flex gap-2 items-center';
        line.innerHTML = `<span class="text-[var(--accent)] font-bold">C:\\Lumo&gt;</span> ${cmd}`;
        feed.appendChild(line);

        const response = executeCommand(cmd);
        if (response) appendResponse(response);
        input.value = '';
        feed.scrollTop = feed.scrollHeight;
        input.focus();
    });

    resetFeed();
    input.focus();
}

function initNotes() { const area = document.getElementById('note-area'); area.addEventListener('input', () => { localStorage.setItem('lumo_notes', area.value); }); }

function initSettings(id) {
    const win = document.getElementById(`win-${id}`);
    if (!win) return;

    const toggles = win.querySelectorAll('.setting-toggle');
    const applyToggleState = (button, state) => {
        const label = button.querySelector('.setting-state');
        button.dataset.state = state;
        if (label) label.innerText = state === 'on' ? 'On' : 'Off';
        if (state === 'on') {
            button.style.backgroundColor = 'var(--accent)';
            button.style.color = '#0a0a0a';
            button.style.borderColor = 'var(--accent)';
        } else {
            button.style.backgroundColor = '';
            button.style.color = '';
            button.style.borderColor = '';
        }
    };
    toggles.forEach(button => {
        button.addEventListener('click', () => {
            const nextState = button.dataset.state === 'on' ? 'off' : 'on';
            applyToggleState(button, nextState);
        });
        applyToggleState(button, button.dataset.state === 'on' ? 'on' : 'off');
    });

    const brightnessSlider = win.querySelector('[data-brightness-slider]');
    const brightnessValue = win.querySelector('[data-brightness-value]');
    if (brightnessSlider && brightnessValue) {
        const syncBrightness = () => { brightnessValue.innerText = `${brightnessSlider.value}%`; };
        brightnessSlider.addEventListener('input', syncBrightness);
        syncBrightness();
    }

    const root = document.documentElement;
    const themeButtons = win.querySelectorAll('[data-theme-choice]');
    const highlightTheme = (button) => {
        themeButtons.forEach(btn => {
            btn.classList.remove('bg-white/10');
            btn.style.borderColor = '';
            btn.style.color = '';
        });
        button.classList.add('bg-white/10');
        button.style.borderColor = 'var(--accent)';
        button.style.color = 'var(--accent)';
    };

    const applyTheme = (theme) => {
        currentTheme = theme;
        if (theme === 'light') {
            root.style.setProperty('--bg-dark', '#f5f5f5');
            root.style.setProperty('--text-main', '#0f172a');
            root.style.setProperty('--glass', 'rgba(255,255,255,0.8)');
            root.style.setProperty('--glass-border', 'rgba(15,23,42,0.1)');

            root.style.setProperty('--card-bg', '#ffffff');
            root.style.setProperty('--card-border', '#e2e8f0');
            root.style.setProperty('--window-bg', '#ffffff');
            root.style.setProperty('--window-header', '#f1f5f9');
            root.style.setProperty('--window-border', '#cbd5e1');
            root.style.setProperty('--input-bg', '#f8fafc');
            root.style.setProperty('--input-border', '#cbd5e1');
        } else {
            root.style.setProperty('--bg-dark', '#0a0a0a');
            root.style.setProperty('--text-main', '#eaeaea');
            root.style.setProperty('--glass', 'rgba(20,20,20,0.6)');
            root.style.setProperty('--glass-border', 'rgba(255,255,255,0.1)');

            root.style.setProperty('--card-bg', '#111111');
            root.style.setProperty('--card-border', '#333333');
            root.style.setProperty('--window-bg', '#111111');
            root.style.setProperty('--window-header', '#000000');
            root.style.setProperty('--window-border', '#333333');
            root.style.setProperty('--input-bg', 'transparent');
            root.style.setProperty('--input-border', '#444444');
        }
        if (themeButtons.length) {
            const target = Array.from(themeButtons).find(btn => btn.dataset.themeChoice === theme);
            if (target) highlightTheme(target);
        }
    };

    themeButtons.forEach(button => {
        button.addEventListener('click', () => {
            applyTheme(button.dataset.themeChoice);
        });
    });
    if (themeButtons.length) {
        applyTheme(currentTheme);
    }

    const languageButtons = win.querySelectorAll('[data-language-choice]');
    const selectedLanguage = localStorage.getItem(STORAGE_KEYS.language) || 'en';
    const highlightLanguage = (lang) => {
        languageButtons.forEach(btn => {
            btn.classList.remove('bg-white/10');
            btn.style.borderColor = '';
            btn.style.color = '';
        });
        const target = Array.from(languageButtons).find(btn => btn.dataset.languageChoice === lang);
        if (target) {
            target.classList.add('bg-white/10');
            target.style.borderColor = 'var(--accent)';
            target.style.color = 'var(--accent)';
        }
    };

    languageButtons.forEach(button => {
        button.addEventListener('click', () => {
            const chosen = button.dataset.languageChoice;
            localStorage.setItem(STORAGE_KEYS.language, chosen);
            if (window.i18n?.setLocale) window.i18n.setLocale(chosen);
            highlightLanguage(chosen);
            // Update HTML lang attribute and notify apps of the language change
            document.documentElement.lang = chosen;
            document.dispatchEvent(new CustomEvent('lumo-language-changed', { detail: chosen }));
        });
    });
    if (languageButtons.length) {
        highlightLanguage(selectedLanguage);
    }

    const resetBtn = win.querySelector('#btn-reset-lumo');
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            if (confirm('WARNING: This will delete all your data (apps, notes, settings). Continue?')) {
                clearUserData();
            }
        });
    }

    renderSettingsUserList(win);
}

function renderSettingsUserList(win) {
    const container = win.querySelector('#settings-user-list');
    if (!container) return;

    const currentUser = window.LoginManager.currentUser;
    const users = window.LoginManager.users;

    if (!currentUser) return;

    container.innerHTML = users.map(u => `
        <div class="flex items-center justify-between bg-white/5 p-3 rounded-xl border border-white/5">
            <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-full flex items-center justify-center text-xs" style="background-color: ${u.color}20; color: ${u.color}">
                    <i class="${u.avatar}"></i>
                </div>
                <div class="flex flex-col">
                     <span class="font-dot text-sm">${u.name} ${u.id === currentUser.id ? '<span class="text-[var(--accent)] text-[10px] ml-1">(YOU)</span>' : ''}</span>
                     <span class="text-[10px] text-gray-500 font-mono">ID: ${u.id.slice(0, 6)}...</span>
                </div>
            </div>
            <div class="flex gap-2">
                <button onclick="window.promptChangePassword('${u.id}')" class="text-[10px] font-bold bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg text-gray-300 transition">PASS</button>
                <button onclick="window.promptDeleteUser('${u.id}')" class="text-[10px] font-bold bg-red-500/10 hover:bg-red-500/30 text-red-400 px-3 py-1.5 rounded-lg transition">DEL</button>
            </div>
        </div>
    `).join('');
}

window.promptChangePassword = function (id) {
    const newPass = prompt("Enter new password:");
    if (newPass) {
        if (window.LoginManager.updatePassword(id, newPass)) {
            alert("Password updated successfully.");
        } else {
            alert("Failed to update password.");
        }
    }
};

window.promptDeleteUser = function (id) {
    const currentUser = window.LoginManager.currentUser;
    if (id === currentUser.id) {
        if (!confirm("Are you sure you want to delete YOUR OWN account? You will be logged out.")) return;
    } else {
        if (!confirm("Are you sure you want to delete this user?")) return;
    }

    window.LoginManager.deleteUser(id);

    // Refresh settings list if still open
    const settingsWin = document.querySelector('[id^="win-settings"]'); // Simple check
    if (settingsWin) renderSettingsUserList(settingsWin);

    if (id === currentUser.id) {
        window.logoutUser();
    }
};

function renderToggle(title, detail, state) {
    return `
        <div class="flex items-center justify-between">
            <div>
                <p class="font-semibold">${title}</p>
                <p class="text-xs text-gray-400">${detail}</p>
            </div>
            <button class="setting-toggle flex items-center gap-2 border border-white/20 rounded-full px-4 py-1 text-xs text-white bg-white/10" data-state="${state}"><span class="setting-state">${state === 'on' ? 'On' : 'Off'}</span></button>
        </div>
    `;
}

function buildBrowserMarkup() {
    return `
        <div class="flex-1 bg-white relative">
            <div class="absolute inset-0 flex items-center justify-center text-black font-dot flex-col">
                <i class="fa-brands fa-google text-6xl mb-4 text-gray-800"></i>
                <input type="text" class="border border-gray-300 rounded-full px-4 py-2 w-64 bg-gray-100" placeholder="Search Web...">
                <p class="mt-4 text-xs text-gray-400">Lumo Browser Mockup</p>
            </div>
        </div>
    `;
}

function buildCmdMarkup(id) {
    return `
        <div class="flex-1 flex flex-col overflow-hidden font-mono text-sm text-[#c8ffbe] bg-black/90 border-t border-white/5">
            <div id="cmd-feed-${id}" class="flex-1 overflow-y-auto space-y-2 px-4 pt-4">
                <div class="text-xs text-gray-400">Lumo Cmd Shell v1.0</div>
                <div class="text-[var(--accent)]">C:\\Lumo&gt; Ready for commands.</div>
            </div>
            <div class="flex items-center gap-2 px-4 pb-4 pt-3 border-t border-white/10">
                <span class="text-[var(--accent)] font-bold">C:\\Lumo&gt;</span>
                <input id="cmd-input-${id}" type="text" class="flex-1 bg-transparent border-none outline-none text-[#f0f0f0]" autocomplete="off" autocapitalize="off" spellcheck="false">
            </div>
        </div>
    `;
}

function buildNotesMarkup() {
    const saved = localStorage.getItem(STORAGE_KEYS.notes) || 'Welcome to Lumo Notes.\nEverything you type here is saved locally.';
    return `
        <textarea id="note-area" class="flex-1 bg-[#1e1e1e] text-gray-200 p-4 resize-none outline-none font-mono text-sm leading-relaxed border-none">${saved}</textarea>
    `;
}

function buildSettingsMarkup() {
    return `
        <div class="flex-1 flex flex-col gap-5 overflow-y-auto px-5 py-4">
            <div>
                <p class="text-xs uppercase tracking-[0.4em] text-gray-400">System settings</p>
                <h2 class="font-dot text-3xl">Control Center</h2>
            </div>
            <section class="rounded-3xl border border-white/10 bg-white/5 p-4 flex flex-col gap-3">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-xs uppercase tracking-[0.4em] text-gray-400">Appearance</p>
                        <p class="text-2xl font-dot">Theme</p>
                    </div>
                    <div class="flex gap-2">
                        <button data-theme-choice="dark" class="theme-select px-4 py-1 rounded-full text-sm border border-white/30 text-[var(--accent)] bg-white/10 transition">Dark</button>
                        <button data-theme-choice="light" class="theme-select px-4 py-1 rounded-full text-sm border border-white/20 text-gray-300 transition">Light</button>
                    </div>
                </div>
                <p class="text-xs text-gray-400">Switch between night and day modes instantly.</p>
            </section>
            <section class="rounded-3xl border border-white/10 bg-white/5 p-4 flex flex-col gap-4">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-xs uppercase tracking-[0.4em] text-gray-400">Quick toggles</p>
                        <p class="text-lg font-dot">Essentials</p>
                    </div>
                    <span class="text-xs text-gray-500">5 entries</span>
                </div>
                <div class="flex flex-col gap-3">
                    ${renderToggle('Night Light', 'Warm up the display after dark.', 'on')}
                    ${renderToggle('Voice Control', 'Let Lumo listen for commands.', 'off')}
                    ${renderToggle('Auto Updates', 'Keep the core in sync.', 'on')}
                    ${renderToggle('Wi-Fi', 'LumoNet_5G', 'on')}
                    ${renderToggle('Bluetooth', 'Devices available', 'off')}
                    ${renderToggle('Do Not Disturb', 'Silence notifications', 'off')}
                </div>
            </section>

             <section class="rounded-3xl border border-white/10 bg-white/5 p-4 flex flex-col gap-4">
                <div class="flex items-center justify-between">
                     <div>
                        <p class="text-xs uppercase tracking-[0.4em] text-gray-400">Account</p>
                        <p class="text-lg font-dot">User Management</p>
                    </div>
                </div>
                <div id="settings-user-list" class="flex flex-col gap-2">
                    <!-- Injected via JS -->
                </div>
            </section>

            <section class="rounded-3xl border border-white/10 bg-white/5 p-4 flex flex-col gap-3">
                <div class="flex items-center justify-between">
                    <p class="font-semibold">Brightness</p>
                    <span class="text-xs text-gray-400" data-brightness-value>72%</span>
                </div>
                <input type="range" min="30" max="100" value="72" class="w-full accent-white" data-brightness-slider>
            </section>
            <section class="rounded-3xl border border-white/10 bg-white/5 p-4 flex flex-col gap-3">
                <div class="flex items-center justify-between">
                    <p class="font-semibold">${window.i18n?.t('app.language') || 'Language'}</p>
                    <span class="text-xs text-gray-400">${window.i18n?.t('app.languageSaved') || 'Preference saved locally'}</span>
                </div>
                <div class="flex gap-3" data-language-group>
                    <button data-language-choice="en" class="lang-select w-full rounded-2xl border border-white/20 px-3 py-2 text-sm">${window.i18n?.t('app.english') || 'English (Default)'}</button>
                    <button data-language-choice="ja" class="lang-select w-full rounded-2xl border border-white/20 px-3 py-2 text-sm">${window.i18n?.t('app.japanese') || '日本語 (サブ)'}</button>
                    <button data-language-choice="zh" class="lang-select w-full rounded-2xl border border-white/20 px-3 py-2 text-sm">${window.i18n?.t('app.chinese') || '中文'}</button>
                </div>
                <p class="text-xs text-gray-400">The interface stays aligned with global language hints, but English stays primary.</p>
            </section>
            <section class="rounded-3xl border border-white/10 bg-white/5 p-4 text-sm text-gray-400 space-y-1">
                <div class="font-semibold text-white/90">Update History</div>
                ${updateHistoryEntries.map(entry => `
                    <div class="flex items-start gap-3">
                        <div class="w-2 h-2 rounded-full bg-[var(--accent)] mt-1"></div>
                        <div>
                            <div class="text-xs uppercase tracking-[0.3em] text-gray-400">${entry.date}</div>
                            <p class="font-bold text-white">${entry.version}</p>
                            <p class="text-xs text-gray-400">${entry.note}</p>
                        </div>
                    </div>
                `).join('')}
            </section>
            <section class="rounded-3xl border border-white/10 bg-white/5 p-4 text-xs text-gray-500">
                Kernel: Lumo Core v1.0.0 · Last synced: moments ago · Notifications: enabled
            </section>
            <section class="rounded-3xl border border-red-900/30 bg-red-900/10 p-4 flex flex-col gap-3">
                <div class="flex items-center justify-between">
                    <p class="font-semibold text-red-400">Danger Zone</p>
                </div>
                <p class="text-xs text-gray-400">Permanently delete all local data and reset Lumo OS to factory settings.</p>
                <button id="btn-reset-lumo" class="w-full rounded-2xl border border-red-600/50 text-red-400 px-4 py-2 text-sm hover:bg-red-600/20 transition">Reset Lumo OS</button>
            </section>
        </div>
    `;
}

function buildFilesMarkup() {
    return `
        <div class="flex-1 flex flex-col gap-4 px-5 py-4">
            <div class="flex items-center justify-between">
                <div>
                    <p class="text-xs uppercase tracking-[0.4em] text-gray-400">Storage</p>
                    <h2 class="font-dot text-3xl">Files App</h2>
                </div>
                <input data-files-search type="text" placeholder="Search files..." class="bg-[#1c1c1c] border border-white/10 rounded-2xl px-4 py-2 text-sm focus:outline-none">
            </div>
            <div class="flex flex-col gap-4 lg:flex-row">
                <div class="lg:w-1/3 rounded-3xl border border-white/10 bg-white/5 p-4 space-y-3" id="files-folder-list"></div>
                <div class="flex-1 rounded-3xl border border-white/10 bg-white/5 p-4 space-y-4">
                    <div class="flex items-center justify-between">
                        <p class="text-sm text-gray-400">Quick View</p>
                        <span class="text-xs text-gray-500">${new Date().toLocaleDateString()}</span>
                    </div>
                    <div class="grid md:grid-cols-2 gap-3" id="files-list"></div>
                </div>
            </div>
            <div class="rounded-3xl border border-white/10 bg-white/5 p-4">
                <div class="flex items-center justify-between mb-3">
                    <p class="text-sm text-gray-400">Preview</p>
                    <span class="text-xs text-gray-500" id="files-preview-type"></span>
                </div>
                <div id="files-preview" class="text-sm text-gray-200 leading-relaxed font-mono"></div>
            </div>
        </div>
    `;
}

function buildPhotoProMarkup() {
    if (window.PhotoPro?.buildMarkup) {
        return window.PhotoPro.buildMarkup();
    }
    return `
        <div class="flex-1 flex items-center justify-center flex-col text-gray-500 gap-4">
            <i class="fa-solid fa-camera-retro text-6xl opacity-20"></i>
            <h2 class="font-dot text-2xl">Loading Photo Pro...</h2>
        </div>
    `;
}

function buildCalculatorMarkup() {
    return `
        <div class="flex-1 flex flex-col gap-4 p-5">
            <div class="rounded-3xl border border-white/10 bg-white/5 p-4 text-right text-4xl font-mono text-white" id="calc-display">0</div>
            <div class="grid grid-cols-4 gap-3" id="calc-buttons"></div>
        </div>
    `;
}

function buildStoreMarkup() {
    return `
        <div class="flex-1 flex flex-col overflow-hidden bg-[var(--bg-dark)] text-[var(--text-main)]">
            <!-- Hero Section -->
            <div class="relative h-48 shrink-0 overflow-hidden">
                <div class="absolute inset-0 bg-gradient-to-b from-[var(--accent)] to-transparent opacity-20"></div>
                <div class="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-30 mix-blend-overlay"></div>
                <div class="absolute bottom-0 left-0 p-6">
                    <p class="text-xs uppercase tracking-[0.4em] text-[var(--accent)] font-bold mb-2">Featured</p>
                    <h2 class="font-dot text-4xl mb-1">Lumo Store</h2>
                    <p class="text-sm opacity-70">Discover apps built for the future.</p>
                    <div class="mt-2 flex items-center gap-2 bg-black/30 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 w-fit">
                        <i class="fa-solid fa-sparkles text-[#8b5cf6] text-xs"></i>
                        <span class="text-[10px] font-mono text-gray-300">AI Generation powered by <span class="text-white font-bold">Lumora 1.0</span></span>
                    </div>
                </div>
            </div>

            <!-- Tabs / Filter -->
            <div class="flex items-center gap-4 px-6 py-3 border-b border-[var(--window-border)] overflow-x-auto no-scrollbar">
                <button class="px-4 py-1.5 rounded-full bg-[var(--accent)] text-white text-xs font-bold tracking-wider uppercase whitespace-nowrap">All Apps</button>
                <button class="px-4 py-1.5 rounded-full border border-[var(--window-border)] hover:bg-[var(--card-bg)] text-[var(--text-muted)] text-xs font-bold tracking-wider uppercase whitespace-nowrap transition">Productivity</button>
                <button class="px-4 py-1.5 rounded-full border border-[var(--window-border)] hover:bg-[var(--card-bg)] text-[var(--text-muted)] text-xs font-bold tracking-wider uppercase whitespace-nowrap transition">Creative</button>
                <button class="px-4 py-1.5 rounded-full border border-[var(--window-border)] hover:bg-[var(--card-bg)] text-[var(--text-muted)] text-xs font-bold tracking-wider uppercase whitespace-nowrap transition">System</button>
            </div>

            <!-- Grid -->
            <div id="store-apps-grid" class="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <!-- Apps injected here -->
            </div>
        </div>
    `;
}

function buildFallbackMarkup(app) {
    return `
        <div class="flex-1 flex items-center justify-center flex-col text-gray-500 gap-4">
            <i class="${app.icon} text-6xl opacity-20"></i>
            <h2 class="font-dot text-2xl">Not Implemented</h2>
        </div>
    `;
}

function loadStoreCatalog() {
    storeCatalogPaths.forEach(path => {
        fetch(path)
            .then(res => res.ok ? res.json() : Promise.reject())
            .then(data => {
                if (!storeCatalog.find(app => app.id === data.id)) {
                    storeCatalog.push(data);
                    refreshStoreWindow();
                }
            })
            .catch(() => console.warn('Unable to load store catalog:', path));
    });
}

function refreshStoreWindow() {
    const storeWindow = activeWindows.store;
    if (storeWindow) {
        mountStoreApp(storeWindow);
    }
}

function mountStoreApp(win) {
    const grid = win.querySelector('#store-apps-grid');
    if (!grid) return;
    grid.innerHTML = '';

    if (!storeCatalog.length) {
        grid.innerHTML = `<div class="flex items-center justify-center text-sm text-gray-400">Loading catalog...</div>`;
        return;
    }

    storeCatalog.forEach(appMeta => {
        const card = document.createElement('div');
        const isInstalled = installedStoreApps.some(app => app.id === appMeta.id);
        card.className = 'group relative flex flex-col gap-3 p-5 rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] hover:border-[var(--accent)] transition-all duration-300 hover:-translate-y-1 hover:shadow-xl';

        // Card Content
        card.innerHTML = `
            <div class="flex items-start justify-between mb-2">
                <div class="w-12 h-12 rounded-xl flex items-center justify-center text-2xl bg-[var(--bg-dark)] border border-[var(--window-border)] shadow-sm group-hover:scale-110 transition-transform duration-300">
                    ${renderAppIcon(appMeta)}
                </div>
                ${isInstalled ? '<span class="text-[10px] font-bold bg-green-500/10 text-green-500 px-2 py-1 rounded uppercase tracking-wider">Installed</span>' : ''}
            </div>
            
            <div>
                <div class="flex items-center gap-1 mb-1">
                    <span class="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-wider">${appMeta.creator || 'Lumo Team'}</span>
                    ${appMeta.verified ? '<i class="fa-solid fa-circle-check text-blue-400 text-[10px]"></i>' : ''}
                </div>
                <h3 class="font-dot text-xl font-bold text-[var(--text-main)] leading-none mb-1">${appMeta.name}</h3>
                <p class="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-2">${appMeta.category || 'Application'}</p>
                <p class="text-xs text-[var(--text-muted)] line-clamp-2 leading-relaxed">${appMeta.description}</p>
            </div>

            <div class="mt-auto pt-3 flex items-center gap-2">
                ${(appMeta.features || []).slice(0, 2).map(f => `<span class="text-[10px] px-2 py-0.5 rounded border border-[var(--window-border)] text-[var(--text-muted)] bg-[var(--bg-dark)]">${f}</span>`).join('')}
            </div>
        `;

        const actions = document.createElement('div');
        actions.className = 'mt-4 grid grid-cols-2 gap-2';

        // Primary action (install or installed status)
        const actionPrimary = document.createElement('button');
        const isComingSoon = appMeta.comingSoon;

        actionPrimary.className = `w-full py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${isInstalled
            ? 'bg-[var(--bg-dark)] text-[var(--text-muted)] border border-[var(--window-border)] cursor-default'
            : (isComingSoon
                ? 'bg-[var(--bg-dark)] text-[var(--text-muted)] border border-[var(--window-border)] cursor-not-allowed'
                : 'bg-[var(--text-main)] text-[var(--bg-dark)] hover:bg-[var(--accent)] hover:text-white border border-transparent')
            }`;

        actionPrimary.innerText = isInstalled ? (window.i18n?.t('store.open') || 'Open') : (isComingSoon ? 'Soon' : (window.i18n?.t('store.get') || 'Get'));

        if (isInstalled) {
            actionPrimary.onclick = () => openApp({ id: appMeta.id });
        } else if (!isComingSoon) {
            actionPrimary.onclick = () => installStoreApp(appMeta);
        }

        actions.appendChild(actionPrimary);

        // Secondary action: uninstall (only shown when installed)
        if (isInstalled) {
            const uninstallBtn = document.createElement('button');
            uninstallBtn.className = 'w-full py-2 rounded-lg text-xs font-bold uppercase tracking-wider border border-red-900/30 text-red-500 hover:bg-red-900/20 transition-colors';
            uninstallBtn.innerText = window.i18n?.t('store.uninstall') || 'Uninstall';
            uninstallBtn.addEventListener('click', () => uninstallStoreApp(appMeta));
            actions.appendChild(uninstallBtn);
        }

        card.appendChild(actions);
        grid.appendChild(card);
    });
}

function installStoreApp(appMeta) {
    if (installedStoreApps.some(app => app.id === appMeta.id)) return;
    const entry = {
        id: appMeta.id,
        name: appMeta.name,
        icon: appMeta.icon,
        color: appMeta.color,
        type: 'app',
    };
    installedStoreApps.push(entry);
    persistInstalledApps();
    renderDesktop();
    refreshStoreWindow();
}

function uninstallStoreApp(appMeta) {
    const installed = installedStoreApps.some(app => app.id === appMeta.id);
    if (!installed) return;

    const promptMsg = `${window.i18n?.t('store.uninstallConfirm') || 'Are you sure you want to uninstall this app?'}\n\n${appMeta.name}`;
    if (!window.confirm(promptMsg)) return;

    installedStoreApps = installedStoreApps.filter(app => app.id !== appMeta.id);
    persistInstalledApps();
    // If the app window is open, close it
    closeApp(appMeta.id);
    renderDesktop();
    refreshStoreWindow();
}

function initFilesApp(win) {
    const folderContainer = win.querySelector('#files-folder-list');
    const listContainer = win.querySelector('#files-list');
    const previewArea = win.querySelector('#files-preview');
    const previewType = win.querySelector('#files-preview-type');
    const searchInput = win.querySelector('[data-files-search]');

    const state = {
        folderId: fileLibrary[0].id,
        fileId: fileLibrary[0].files[0].id,
        filter: '',
    };

    const renderFolders = () => {
        if (!folderContainer) return;
        folderContainer.innerHTML = fileLibrary.map(folder => {
            const isActive = folder.id === state.folderId;
            return `
                <button data-folder="${folder.id}" class="w-full text-left rounded-2xl border ${isActive ? 'border-[var(--accent)] bg-white/10' : 'border-white/5'} px-3 py-2 text-sm">${folder.name}</button>
                <p class="text-[0.65rem] text-gray-500">${folder.description}</p>
            `;
        }).join('');
        folderContainer.querySelectorAll('[data-folder]').forEach(button => {
            button.addEventListener('click', () => {
                state.folderId = button.dataset.folder;
                const folder = fileLibrary.find(f => f.id === state.folderId);
                if (folder) state.fileId = folder.files[0]?.id || '';
                renderFolders();
                renderFiles();
                renderPreview();
            });
        });
    };

    const renderFiles = () => {
        const folder = fileLibrary.find(item => item.id === state.folderId);
        if (!folder || !listContainer) return;
        const items = folder.files.filter(file => file.name.toLowerCase().includes(state.filter.toLowerCase()));
        listContainer.innerHTML = items.map(file => {
            const isSelected = file.id === state.fileId;
            return `
                <div data-file="${file.id}" class="rounded-2xl border ${isSelected ? 'border-[var(--accent)] bg-white/10' : 'border-white/5'} p-3 cursor-pointer hover:border-[var(--accent)]">
                    <p class="font-semibold text-white">${file.name}</p>
                    <div class="flex items-center justify-between text-[0.7rem] text-gray-400 mt-2">
                        <span>${file.type}</span>
                        <span>${file.size}</span>
                    </div>
                    <p class="text-[0.65rem] text-gray-500 mt-1">${file.modified}</p>
                </div>
            `;
        }).join('');
        listContainer.querySelectorAll('[data-file]').forEach(card => {
            card.addEventListener('click', () => {
                state.fileId = card.dataset.file;
                renderFiles();
                renderPreview();
            });
        });
    };

    const renderPreview = () => {
        const folder = fileLibrary.find(item => item.id === state.folderId);
        const file = folder?.files.find(f => f.id === state.fileId);
        if (!file || !previewArea || !previewType) return;
        previewArea.innerText = file.preview;
        previewType.innerText = `${file.type} · ${file.size}`;
    };

    const handleSearch = () => {
        state.filter = searchInput?.value || '';
        renderFiles();
    };

    renderFolders();
    renderFiles();
    renderPreview();
    searchInput?.addEventListener('input', handleSearch);
}

function initPhotosApp(win) {
    const canvas = win.querySelector('[data-photo-canvas]');
    const fileInput = win.querySelector('[data-photo-input]');
    const filterButtons = win.querySelectorAll('[data-filter-button]');
    const glowSlider = win.querySelector('[data-photo-glow]');
    const downloadBtn = win.querySelector('[data-photo-download]');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const state = {
        image: new Image(),
        filter: 'normal',
        glow: Number(glowSlider?.value || 25),
    };

    state.image.crossOrigin = 'anonymous';
    state.image.src = 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?q=80&w=1200&auto=format&fit=crop';
    state.image.onload = () => drawPhoto();

    const defaultButton = Array.from(filterButtons).find(btn => btn.dataset.filterButton === state.filter);
    if (defaultButton) defaultButton.classList.add('bg-white/10');

    const drawPhoto = () => {
        if (!ctx || !state.image.width) return;
        const canvasWidth = canvas.width = 640;
        const canvasHeight = canvas.height = 360;
        ctx.clearRect(0, 0, canvasWidth, canvasHeight);
        ctx.filter = photoFilterMap[state.filter] || 'none';
        ctx.drawImage(state.image, 0, 0, canvasWidth, canvasHeight);
        ctx.filter = 'none';
        ctx.globalAlpha = state.glow / 120;
        ctx.fillStyle = 'radial-gradient(circle at 80% 20%, rgba(255,0,60,0.35), transparent 60%)';
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
        ctx.globalAlpha = 1;
        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        ctx.font = 'bold 28px VT323, monospace';
        ctx.textBaseline = 'bottom';
        ctx.fillText('Lumo OS 1.0', canvasWidth - 230, canvasHeight - 20);
    };

    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            state.filter = button.dataset.filterButton;
            filterButtons.forEach(btn => btn.classList.remove('bg-white/10'));
            button.classList.add('bg-white/10');
            drawPhoto();
        });
    });

    glowSlider?.addEventListener('input', () => {
        state.glow = Number(glowSlider.value);
        drawPhoto();
    });

    fileInput?.addEventListener('change', (event) => {
        const file = event.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (loadEvent) => {
            state.image.src = loadEvent.target.result;
        };
        reader.readAsDataURL(file);
    });

    downloadBtn?.addEventListener('click', () => {
        const link = document.createElement('a');
        link.href = canvas.toDataURL('image/png');
        link.download = 'lumo-os-watermark.png';
        link.click();
    });
}

function initCalculator(win) {
    const display = win.querySelector('#calc-display');
    const buttonsContainer = win.querySelector('#calc-buttons');
    if (!display || !buttonsContainer) return;

    buttonsContainer.innerHTML = calcButtons.map(button => `
        <button class="rounded-2xl border border-white/10 text-white px-4 py-3 text-xl ${button.span === 2 ? 'col-span-2' : ''}" data-calc-btn="${button.label}" data-type="${button.type}" data-value="${button.value || ''}">${button.label}</button>
    `).join('');

    const state = {
        displayValue: '0',
        operator: null,
        firstValue: null,
        waitingForSecondValue: false,
    };

    const updateDisplay = () => {
        display.innerText = state.displayValue;
    };

    const inputDigit = (digit) => {
        if (state.waitingForSecondValue) {
            state.displayValue = digit;
            state.waitingForSecondValue = false;
            return;
        }
        state.displayValue = state.displayValue === '0' ? digit : state.displayValue + digit;
    };

    const inputDecimal = () => {
        if (!state.displayValue.includes('.')) {
            state.displayValue += '.';
        }
    };

    const applyOperator = (operator) => {
        const inputValue = parseFloat(state.displayValue);
        if (state.firstValue === null) {
            state.firstValue = inputValue;
        } else if (state.operator) {
            const result = evaluate(state.firstValue, inputValue, state.operator);
            state.displayValue = `${result}`;
            state.firstValue = result;
        }
        state.waitingForSecondValue = true;
        state.operator = operator;
    };

    const evaluate = (first, second, operator) => {
        if (operator === '+') return first + second;
        if (operator === '-') return first - second;
        if (operator === '*') return first * second;
        if (operator === '/') return second === 0 ? 0 : first / second;
        return second;
    };

    buttonsContainer.querySelectorAll('button').forEach(button => {
        button.addEventListener('click', () => {
            const type = button.dataset.type;
            const value = button.dataset.value;
            if (type === 'digit') {
                if (button.innerText === '.') inputDecimal(); else inputDigit(button.innerText);
            } else if (type === 'operator') {
                applyOperator(value);
            } else if (type === 'action') {
                if (value === 'clear' || button.innerText === 'C') {
                    state.displayValue = '0';
                    state.firstValue = null;
                    state.operator = null;
                    state.waitingForSecondValue = false;
                } else if (value === 'backspace') {
                    state.displayValue = state.displayValue.slice(0, -1) || '0';
                } else if (value === 'percent') {
                    state.displayValue = `${parseFloat(state.displayValue) / 100}`;
                } else if (value === 'evaluate') {
                    if (state.operator && state.firstValue !== null) {
                        const second = parseFloat(state.displayValue);
                        state.displayValue = `${evaluate(state.firstValue, second, state.operator)}`;
                        state.firstValue = null;
                        state.operator = null;
                        state.waitingForSecondValue = false;
                    }
                }
            }
            updateDisplay();
        });
    });

    updateDisplay();
}

// initPhotoProApp removed (superseded by external module)

function hexToRgba(hex, alpha) {
    const trimmed = hex.replace('#', '');
    const bigint = parseInt(trimmed, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function toggleAppDrawer() { const drawer = document.getElementById('app-drawer'); const isHidden = drawer.classList.contains('hidden'); if (isHidden) { drawer.classList.remove('hidden'); drawer.classList.add('flex'); } else { drawer.classList.add('hidden'); drawer.classList.remove('flex'); } document.getElementById('control-center').classList.add('hidden'); }

function toggleControlCenter() { const cc = document.getElementById('control-center'); const isHidden = cc.classList.contains('hidden'); if (isHidden) { cc.classList.remove('hidden'); setTimeout(() => { cc.classList.remove('opacity-0', 'scale-90'); cc.classList.add('opacity-100', 'scale-100'); }, 10); } else { cc.classList.remove('opacity-100', 'scale-100'); cc.classList.add('opacity-0', 'scale-90'); setTimeout(() => cc.classList.add('hidden'), 300); } document.getElementById('app-drawer').classList.add('hidden'); }

function toggleState(element) { const circle = element.querySelector('.rounded-full'); const text = element.querySelector('.text-xs'); if (circle.classList.contains('bg-blue-500')) { circle.classList.remove('bg-blue-500'); circle.classList.add('bg-gray-600'); text.innerText = 'Off'; } else { circle.classList.add('bg-blue-500'); circle.classList.remove('bg-gray-600'); text.innerText = 'On'; } }

let isDragging = false; let currentWin = null; let offset = { x: 0, y: 0 };
function startDrag(e, id) { if (window.innerWidth < 768) return; isDragging = true; currentWin = document.getElementById(`win-${id}`); bringToFront(id); const clientX = e.touches ? e.touches[0].clientX : e.clientX; const clientY = e.touches ? e.touches[0].clientY : e.clientY; offset.x = clientX - currentWin.offsetLeft; offset.y = clientY - currentWin.offsetTop; }
window.addEventListener('mousemove', (e) => { if (!isDragging || !currentWin) return; e.preventDefault(); currentWin.style.left = `${e.clientX - offset.x}px`; currentWin.style.top = `${e.clientY - offset.y}px`; });
window.addEventListener('touchmove', (e) => { if (!isDragging || !currentWin) return; const touch = e.touches[0]; currentWin.style.left = `${touch.clientX - offset.x}px`; currentWin.style.top = `${touch.clientY - offset.y}px`; }, { passive: false });
window.addEventListener('mouseup', () => {
    if (isDragging && currentWin) {
        // Window Snapping Logic
        const snapThreshold = 50;
        const rect = currentWin.getBoundingClientRect();

        // Snap to Left
        if (rect.left < snapThreshold) {
            currentWin.style.left = '0px';
            currentWin.style.top = '0px';
            currentWin.style.height = '100%';
            currentWin.style.width = '50%';
            currentWin.classList.remove('rounded-xl');
        }
        // Snap to Right
        else if (window.innerWidth - rect.right < snapThreshold) {
            currentWin.style.left = '50%';
            currentWin.style.top = '0px';
            currentWin.style.height = '100%';
            currentWin.style.width = '50%';
            currentWin.classList.remove('rounded-xl');
        }
        // Snap to Top (Maximize)
        else if (rect.top < snapThreshold) {
            currentWin.style.left = '0px';
            currentWin.style.top = '0px';
            currentWin.style.height = '100%';
            currentWin.style.width = '100%';
            currentWin.classList.remove('rounded-xl');
        }
        // Restore rounded corners if not snapped (basic check)
        else {
            currentWin.classList.add('rounded-xl');
        }
    }
    isDragging = false;
    currentWin = null;
});
window.addEventListener('touchend', () => { isDragging = false; currentWin = null; });



document.addEventListener('keydown', (e) => { if (e.altKey && e.code === 'Space') { const spot = document.getElementById('spotlight'); if (spot.classList.contains('hidden')) { spot.classList.remove('hidden'); spot.classList.add('flex'); document.getElementById('spotlight-input').focus(); } else { spot.classList.add('hidden'); spot.classList.remove('flex'); } } });

document.getElementById('desktop').addEventListener('click', (e) => { const spot = document.getElementById('spotlight'); if (!spot.contains(e.target) && !e.altKey && !spot.classList.contains('hidden')) { spot.classList.add('hidden'); spot.classList.remove('flex'); } });

function clearUserData() {
    localStorage.clear();
    location.reload();
}

function loadWallpaperPreference() {
    const wpRaw = localStorage.getItem('lumo_wallpaper');
    if (!wpRaw) return;
    try {
        const wp = JSON.parse(wpRaw);
        const desktop = document.getElementById('desktop');
        if (wp.type === 'image') {
            desktop.style.backgroundImage = `url('${wp.url}')`;
            desktop.style.backgroundColor = '';
        } else {
            desktop.style.backgroundImage = 'none';
            desktop.style.backgroundColor = wp.color;
        }
    } catch (e) { console.error('Failed to load wallpaper', e); }
}

function loadIconPositions() {
    try {
        return JSON.parse(localStorage.getItem('lumo_icon_positions') || '{}');
    } catch { return {}; }
}

// --- Desktop Selection Logic ---
let selectionStart = null;
const selectionBox = document.createElement('div');
selectionBox.className = 'selection-box';
document.body.appendChild(selectionBox);

document.getElementById('desktop').addEventListener('mousedown', (e) => {
    // Only trigger if clicking directly on desktop or icons container (not on a window or app)
    if (e.target.id !== 'desktop' && e.target.id !== 'desktop-icons') return;

    selectionStart = { x: e.clientX, y: e.clientY };
    selectionBox.style.left = e.clientX + 'px';
    selectionBox.style.top = e.clientY + 'px';
    selectionBox.style.width = '0px';
    selectionBox.style.height = '0px';
    selectionBox.style.display = 'block';
});

document.addEventListener('mousemove', (e) => {
    if (!selectionStart) return;
    const currentX = e.clientX;
    const currentY = e.clientY;

    const width = Math.abs(currentX - selectionStart.x);
    const height = Math.abs(currentY - selectionStart.y);
    const left = Math.min(currentX, selectionStart.x);
    const top = Math.min(currentY, selectionStart.y);

    selectionBox.style.width = width + 'px';
    selectionBox.style.height = height + 'px';
    selectionBox.style.left = left + 'px';
    selectionBox.style.top = top + 'px';
});

document.addEventListener('mouseup', () => {
    if (selectionStart) {
        selectionStart = null;
        selectionBox.style.display = 'none';
    }
});
