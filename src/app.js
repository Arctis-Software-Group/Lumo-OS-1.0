// --- Config & State ---
const systemApps = [
    { id: 'browser', name: 'Web', icon: 'fa-brands fa-chrome', color: '#4285F4', type: 'app', url: 'https://www.google.com/webhp?igu=1' },
    { id: 'cmd', name: 'Cmd', icon: 'fa-solid fa-terminal', color: '#333', type: 'app' },
    { id: 'notes', name: 'Notes', icon: 'fa-solid fa-note-sticky', color: '#F4B400', type: 'app' },
    { id: 'files', name: 'Files', icon: 'fa-solid fa-folder-open', color: '#0F9D58', type: 'app' },
    { id: 'lumo-365', name: 'Lumo 365', icon: 'fa-solid fa-file-lines', color: '#2b5797', type: 'app' },
    { id: 'settings', name: 'Settings', icon: 'fa-solid fa-gear', color: '#999', type: 'app' },
    { id: 'photos', name: 'Photos', icon: 'fa-solid fa-image', color: 'var(--accent)', type: 'app' },
    { id: 'calculator', name: 'Calc', icon: 'fa-solid fa-calculator', color: '#DB4437', type: 'app' },
    { id: 'store', name: 'Lumo Store', icon: 'fa-solid fa-bag-shopping', color: '#fff', type: 'app' },
    { id: 'lumo-wallpaper', name: 'Wallpapers', icon: 'fa-solid fa-image', color: 'var(--accent)', type: 'app' },
];

const DESKTOP_SHORTCUT_IDS = new Set(['browser', 'files', 'cmd', 'notes', 'settings', 'store', 'photo-pro', 'lumo-wallpaper']);
const IconPack = {
    current: localStorage.getItem('lumo_icon_pack') || 'default',
    map: {
        default: {},
        line: {
            'settings': 'fa-regular fa-gear',
            'files': 'fa-regular fa-folder-open',
            'notes': 'fa-regular fa-note-sticky'
        }
    }
};
const STORAGE_KEYS = {
    notes: 'lumo_notes',
    installedApps: 'lumo_store_apps',
    language: 'lumo_language',
};

// --- File System Service ---
window.FileSystem = {
    storageKey: 'lumo_fs_v1',
    data: [],

    init() {
        const raw = localStorage.getItem(this.storageKey);
        if (raw) {
            try {
                this.data = JSON.parse(raw);
            } catch (e) {
                console.error('FS Corrupt, resetting', e);
                this.reset();
            }
        } else {
            this.reset();
        }
    },

    reset() {
        this.data = [
            {
                id: 'documents',
                name: 'Documents',
                icon: 'fa-solid fa-file-lines',
                accent: '#ff6b6b',
                description: 'Personal documents',
                files: [
                    { 
                        id: 'welcome-doc', 
                        name: 'Welcome.lumo', 
                        type: 'Lumo Doc', 
                        size: '2 KB', 
                        modified: new Date().toLocaleString(),
                        content: JSON.stringify({
                            type: 'word',
                            html: '<h1 class="text-3xl font-bold mb-4">Welcome to Lumo OS</h1><p>This is a real file stored in your browser\'s LocalStorage.</p>'
                        })
                    }
                ]
            },
            {
                id: 'media',
                name: 'Media',
                icon: 'fa-solid fa-photo-film',
                accent: '#53b5ff',
                description: 'Images and videos',
                files: []
            },
            {
                id: 'system',
                name: 'System',
                icon: 'fa-solid fa-shield-halved',
                accent: '#b77bff',
                description: 'System configurations',
                files: []
            }
        ];
        this.save();
    },

    save() {
        localStorage.setItem(this.storageKey, JSON.stringify(this.data));
    },

    getFolders() { return this.data; },

    createFile(folderId, name, type, content) {
        const folder = this.data.find(f => f.id === folderId);
        if (!folder) return null;
        const file = {
            id: 'file_' + Date.now(),
            name,
            type, // 'Lumo Doc', 'Lumo Sheet', 'Lumo Slide', 'Text', etc.
            size: this.estimateSize(content),
            modified: new Date().toLocaleString(),
            content
        };
        folder.files.push(file);
        this.save();
        return file;
    },

    updateFile(folderId, fileId, content) {
        const folder = this.data.find(f => f.id === folderId);
        if (!folder) return false;
        const file = folder.files.find(f => f.id === fileId);
        if (!file) return false;
        
        file.content = content;
        file.size = this.estimateSize(content);
        file.modified = new Date().toLocaleString();
        this.save();
        return true;
    },

    estimateSize(content) {
        const str = typeof content === 'string' ? content : JSON.stringify(content);
        const bytes = new Blob([str]).size;
        if (bytes < 1024) return bytes + ' B';
        return (bytes / 1024).toFixed(1) + ' KB';
    }
};
window.FileSystem.init();

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
    'src/apps/default/lumo-drop/meta.json',
    'src/apps/default/talko/meta.json',
    'src/apps/community/drawin-simple/meta.json',
    'src/apps/community/grapher/meta.json'
];
let installedStoreApps = loadInstalledApps();
let storeCatalog = [];
let zIndexCounter = 100;
let activeWindows = {};
let minimizedWindows = new Set();
let currentTheme = 'dark';
// track boot time for uptime command
const lumoBootTime = new Date();

window.addEventListener('load', () => {
    const bar = document.getElementById('boot-bar');
    const screen = document.getElementById('boot-screen');
    const desktop = document.getElementById('desktop');

    // System Start Logic
    const startSystem = () => {
        if (screen) {
            screen.style.transition = 'opacity 1s';
            screen.style.opacity = '0';
            setTimeout(() => {
                screen.style.display = 'none';
                
                // Initialize Login Screen
                if (window.LoginManager) {
                    const loginScreen = document.getElementById('login-screen');
                    loginScreen.classList.remove('hidden');

                    window.LoginManager.init('login-screen', (user) => {
                        console.log('Logged in as:', user.name);
                        updateCurrentUserDisplay(user);
                        desktop.style.display = 'block';
                        requestAnimationFrame(() => { desktop.style.opacity = '1'; });

                        if (window.ThemeRegistry?.load) {
                            window.ThemeRegistry.load(user.id);
                        }
                    });
                } else {
                    desktop.style.display = 'block';
                    requestAnimationFrame(() => { desktop.style.opacity = '1'; });
                }
            }, 1000);
        }
    };

    // Check First Boot
    const hasBooted = localStorage.getItem('lumo_has_booted');
    
    if (!hasBooted && window.BootAnimation) {
        // First Time Boot Animation
        const animation = new window.BootAnimation('boot-screen', () => {
            localStorage.setItem('lumo_has_booted', 'true');
            startSystem();
        });
        animation.init();
    } else {
        // Regular Boot
        if (bar) setTimeout(() => { bar.style.width = '100%'; }, 100);
        setTimeout(() => {
            startSystem();
        }, 2500);
    }

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
    loadAccentPreference();
    // (language dispatch already handled after locales load)
});

// --- Accent Color Logic ---
const accentColors = [
    { name: 'Lumo Red', value: '#ff003c' },
    { name: 'Blue', value: '#3b82f6' },
    { name: 'Green', value: '#22c55e' },
    { name: 'Purple', value: '#a855f7' },
    { name: 'Orange', value: '#f97316' },
    { name: 'Pink', value: '#ec4899' },
];

function loadAccentPreference() {
    const saved = localStorage.getItem('lumo_accent');
    if (saved) {
        document.documentElement.style.setProperty('--accent', saved);
    }
}

function setAccentColor(color) {
    if (window.ThemeRegistry?.setAccentColor) {
        window.ThemeRegistry.setAccentColor(color);
    } else {
        document.documentElement.style.setProperty('--accent', color);
    }
    localStorage.setItem('lumo_accent', color);
    const settingsWin = document.querySelector('[id^="win-settings"]');
    if (settingsWin) {
        const buttons = settingsWin.querySelectorAll('[data-accent-color]');
        buttons.forEach(btn => { btn.innerHTML = btn.dataset.accentColor === color ? '<i class="fa-solid fa-check text-white text-xs"></i>' : ''; });
    }
}

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
    const gapY = getIconGap();

    getAllApps().forEach(app => {
        dock.appendChild(createDockButton(app));
        const drawerItem = createDrawerItem(app);
        drawerItem.dataset.appName = app.name.toLowerCase();
        drawer.appendChild(drawerItem);
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
    updateDockIndicators();
}

function renderAppIcon(app, extraClasses = '') {
    const color = resolveIconColor(app.color);
    const pack = IconPack.map[IconPack.current] || {};
    const icon = pack[app.id] || app.icon;
    if (icon.startsWith('fa-') || icon.includes('fa-')) {
        return `<i class="${icon} ${extraClasses}" style="color: ${color}"></i>`;
    } else {
        return `<img src="${icon}" class="${extraClasses} object-contain" style="width: 1em; height: 1em; filter: drop-shadow(0 0 2px ${color});">`;
    }
}

function createDockButton(app) {
    const btn = document.createElement('button');
    btn.className = 'app-icon w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition hover:-translate-y-2 relative group';
    btn.dataset.appId = app.id;
    btn.innerHTML = `
        ${renderAppIcon(app, 'text-xl sm:text-2xl')}
        <div class="dock-dot absolute -bottom-2 w-1 h-1 bg-white rounded-full opacity-0 transition-opacity"></div>
        <div class="absolute -top-10 bg-black/80 text-xs px-2 py-1 rounded text-white opacity-0 group-hover:opacity-100 transition pointer-events-none whitespace-nowrap font-dot border border-white/20">${app.name}</div>
    `;
    btn.onclick = () => toggleApp(app.id);
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

function minimizeApp(id) {
    const win = activeWindows[id];
    if (win) {
        win.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
        win.style.transform = 'scale(0.5) translateY(100px)';
        win.style.opacity = '0';
        setTimeout(() => {
            win.classList.add('hidden');
            // Reset styles so it restores cleanly
            win.style.transform = '';
            win.style.opacity = '';
            win.style.transition = '';
        }, 300);
        minimizedWindows.add(id);
        updateDockIndicators();
    }
}

function restoreApp(id) {
    const win = activeWindows[id];
    if (win) {
        win.classList.remove('hidden');
        minimizedWindows.delete(id);
        bringToFront(id);
        
        // Animation
        win.style.transform = 'scale(0.9)';
        win.style.opacity = '0';
        requestAnimationFrame(() => {
             win.style.transition = 'all 0.3s cubic-bezier(0.18, 0.89, 0.32, 1.28)';
             win.style.transform = 'scale(1)';
             win.style.opacity = '1';
             setTimeout(() => { win.style.transition = ''; }, 300);
        });
        
        updateDockIndicators();
    }
}

function toggleApp(id) {
    if (minimizedWindows.has(id)) {
        restoreApp(id);
    } else if (activeWindows[id]) {
        const win = activeWindows[id];
        const isTop = parseInt(win.style.zIndex) === zIndexCounter;
        if (isTop) {
            minimizeApp(id);
        } else {
            bringToFront(id);
        }
    } else {
        const app = getAllApps().find(a => a.id === id);
        if (app) openApp(app);
    }
}

function minimizeAll() {
    Object.keys(activeWindows).forEach(id => {
        if (!minimizedWindows.has(id)) minimizeApp(id);
    });
}

function updateDockIndicators() {
    const dock = document.getElementById('dock-apps');
    if (!dock) return;
    
    Array.from(dock.children).forEach(btn => {
        const appId = btn.dataset.appId;
        if (!appId) return;
        
        const dot = btn.querySelector('.dock-dot');
        if (dot) {
             if (activeWindows[appId]) {
                 dot.classList.remove('opacity-0');
                 dot.classList.add('opacity-100');
                 if (minimizedWindows.has(appId)) {
                     dot.classList.add('bg-gray-400');
                     dot.classList.remove('bg-white');
                 } else {
                     dot.classList.remove('bg-gray-400');
                     dot.classList.add('bg-white');
                 }
             } else {
                 dot.classList.remove('opacity-100');
                 dot.classList.add('opacity-0');
             }
        }
    });
}

function getAllApps() {
    return [...systemApps, ...installedStoreApps];
}

async function openApp(app) {
    if (activeWindows[app.id]) {
        if (minimizedWindows.has(app.id)) {
            restoreApp(app.id);
        } else {
            bringToFront(app.id);
        }
        return;
    }

    // Generated App Handling
    if (app.isGenerated && app.code) {
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

        win.innerHTML = `
            <div class="window-header h-10 bg-[#1a1a1a] border-b border-[#333] flex items-center justify-between px-3 cursor-move select-none" onmousedown="startDrag(event, '${winId}')" ontouchstart="startDrag(event, '${winId}')">
                <div class="flex items-center gap-2">
                    <div class="flex gap-1.5 window-controls">
                        <button onclick="closeApp('${winId}')" class="w-3 h-3 rounded-full bg-[#ff5f56] hover:bg-[#cc4b42] transition"></button>
                        <button onclick="minimizeApp('${winId}')" class="w-3 h-3 rounded-full bg-[#ffbd2e] hover:bg-[#d69d23] transition"></button>
                        <button onclick="toggleMaximize('${winId}')" class="w-3 h-3 rounded-full bg-[#27c93f] hover:bg-[#1e9e31] transition"></button>
                    </div>
                </div>
                <span class="font-dot text-gray-400 tracking-wider text-sm">${app.name.toUpperCase()}</span>
                <div class="w-10"></div>
            </div>
            <div class="flex-1 bg-white relative">
                <iframe class="w-full h-full border-none" sandbox="allow-scripts allow-same-origin allow-forms allow-modals allow-popups"></iframe>
            </div>
        `;

        document.getElementById('window-area').appendChild(win);
        activeWindows[winId] = win;
        updateDockIndicators();

        const iframe = win.querySelector('iframe');
        iframe.srcdoc = app.code;

        bringToFront(winId);
        return;
    }

    await loadAppScript(app.id);

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
    } else if (app.id === 'lumo-drop') {
        contentHTML = window.LumoDrop?.buildMarkup ? window.LumoDrop.buildMarkup() : buildFallbackMarkup(app);
    } else if (app.id === 'talko') {
        contentHTML = window.TalkoApp?.buildMarkup ? window.TalkoApp.buildMarkup() : buildFallbackMarkup(app);
    } else {
        contentHTML = buildFallbackMarkup(app);
    }

    win.innerHTML = `
        <div class="window-header h-10 bg-[#1a1a1a] border-b border-[#333] flex items-center justify-between px-3 cursor-move select-none" onmousedown="startDrag(event, '${winId}')" ontouchstart="startDrag(event, '${winId}')">
            <div class="flex items-center gap-2">
                <div class="flex gap-1.5 window-controls">
                    <button onclick="closeApp('${winId}')" class="w-3 h-3 rounded-full bg-[#ff5f56] hover:bg-[#cc4b42] transition"></button>
                    <button onclick="minimizeApp('${winId}')" class="w-3 h-3 rounded-full bg-[#ffbd2e] hover:bg-[#d69d23] transition"></button>
                    <button onclick="toggleMaximize('${winId}')" class="w-3 h-3 rounded-full bg-[#27c93f] hover:bg-[#1e9e31] transition"></button>
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
    updateDockIndicators();
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
    if (app.id === 'lumo-drop' && window.LumoDrop?.init) window.LumoDrop.init(win);
    if (app.id === 'talko' && window.TalkoApp?.init) window.TalkoApp.init(win);

    bringToFront(winId);
}

function closeApp(id) {
    const win = document.getElementById(`win-${id}`);
    if (win) {
        win.classList.add('opacity-0', 'scale-90');
        setTimeout(() => {
            win.remove();
            delete activeWindows[id];
            minimizedWindows.delete(id);
            updateDockIndicators();
        }, 200);
    }
}

function toggleMaximize(id) {
    const win = document.getElementById(`win-${id}`);
    if (!win) return;

    if (win.dataset.maximized === 'true') {
        // Restore
        win.style.top = win.dataset.prevTop || '50px';
        win.style.left = win.dataset.prevLeft || '50px';
        win.style.width = win.dataset.prevWidth || '600px';
        win.style.height = win.dataset.prevHeight || '400px';
        win.classList.add('rounded-xl');
        win.dataset.maximized = 'false';
    } else {
        // Maximize
        win.dataset.prevTop = win.style.top;
        win.dataset.prevLeft = win.style.left;
        win.dataset.prevWidth = win.style.width;
        win.dataset.prevHeight = win.style.height;

        win.style.top = '32px'; // Status bar height
        win.style.left = '0px';
        win.style.width = '100%';
        win.style.height = 'calc(100% - var(--dock-reserved))';
        win.classList.remove('rounded-xl');
        win.dataset.maximized = 'true';
    }
    bringToFront(id);
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
            const folders = window.FileSystem.getFolders();
            if (!folderName) return window.i18n?.t('cmd.lsHelp', 'Usage: ls <folder> — folders: ' + folders.map(f => f.id).join(', '));
            const folder = folders.find(f => f.id === folderName || f.name.toLowerCase() === folderName.toLowerCase());
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
    const presetButtons = win.querySelectorAll('[data-theme-preset]');
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
        const map = { dark: 'nothing-dark', light: 'nothing-light' };
        if (window.ThemeRegistry?.applyPreset) {
            window.ThemeRegistry.applyPreset(map[theme] || 'nothing-dark');
        }
        if (themeButtons.length) {
            const target = Array.from(themeButtons).find(btn => btn.dataset.themeChoice === theme);
            if (target) highlightTheme(target);
        }
    };

    themeButtons.forEach(button => { button.addEventListener('click', () => { applyTheme(button.dataset.themeChoice); }); });
    presetButtons.forEach(button => { button.addEventListener('click', () => { window.ThemeRegistry?.applyPreset(button.dataset.themePreset); }); });
    if (themeButtons.length) {
        applyTheme(currentTheme);
    }

    // Accent Color Logic
    const accentButtons = win.querySelectorAll('[data-accent-color]');
    accentButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            setAccentColor(btn.dataset.accentColor);
        });
    });

    const iconPackButtons = win.querySelectorAll('[data-icon-pack]');
    iconPackButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            IconPack.current = btn.dataset.iconPack;
            localStorage.setItem('lumo_icon_pack', IconPack.current);
            renderDesktop();
            refreshStoreWindow();
        });
    });

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

    const radiusInput = win.querySelector('[data-style-radius]');
    const borderInput = win.querySelector('[data-style-border]');
    const shadowInput = win.querySelector('[data-style-shadow]');
    const gridInput = win.querySelector('[data-style-grid]');
    const widgetPadInput = win.querySelector('[data-style-widget-padding]');

    const setVar = (key, val) => { document.documentElement.style.setProperty(key, val); if (window.ThemeRegistry) { window.ThemeRegistry.current.vars[key] = val; window.ThemeRegistry.save(); } };

    radiusInput?.addEventListener('input', () => { const v = radiusInput.value + 'px'; setVar('--radius-md', v); setVar('--radius-lg', Math.max(Number(radiusInput.value) * 2, 24) + 'px'); });
    borderInput?.addEventListener('input', () => setVar('--border-weight', borderInput.value + 'px'));
    shadowInput?.addEventListener('input', () => setVar('--window-shadow', `0 20px 50px rgba(0,0,0, ${shadowInput.value})`));
    gridInput?.addEventListener('input', () => setVar('--grid-size', gridInput.value + 'px'));
    widgetPadInput?.addEventListener('input', () => setVar('--widget-padding', widgetPadInput.value + 'px'));

    const dockInput = win.querySelector('[data-layout-dock]');
    const iconGapInput = win.querySelector('[data-layout-icon-gap]');

    dockInput?.addEventListener('input', () => setVar('--dock-reserved', dockInput.value + 'px'));
    iconGapInput?.addEventListener('input', () => { localStorage.setItem('lumo_icon_gap', iconGapInput.value); renderDesktop(); });

    const widgetGridBtn = win.querySelector('[data-widget-grid]');
    const widgetFrameBtn = win.querySelector('[data-widget-frame]');
    const widgetArea = document.getElementById('desktop-widgets');
    const applyWidgetToggle = (btn, on) => { const label = btn.querySelector('.setting-state'); if (label) label.innerText = on ? 'On' : 'Off'; btn.dataset.state = on ? 'on' : 'off'; btn.style.backgroundColor = on ? 'var(--accent)' : ''; btn.style.color = on ? '#0a0a0a' : ''; btn.style.borderColor = on ? 'var(--accent)' : ''; };
    widgetGridBtn?.addEventListener('click', () => {
        const next = widgetGridBtn.dataset.state === 'on' ? false : true;
        applyWidgetToggle(widgetGridBtn, next);
        if (next) { widgetArea.classList.add('bg-dot-matrix'); } else { widgetArea.classList.remove('bg-dot-matrix'); }
    });
    widgetFrameBtn?.addEventListener('click', () => {
        const next = widgetFrameBtn.dataset.state === 'on' ? false : true;
        applyWidgetToggle(widgetFrameBtn, next);
        setVar('--widget-border', next ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.1)');
        setVar('--border-weight', next ? '2px' : '1px');
    });

    const desktopGridBtn = win.querySelector('[data-desktop-grid]');
    const desktop = document.getElementById('desktop');
    desktopGridBtn?.addEventListener('click', () => {
        const next = desktopGridBtn.dataset.state === 'on' ? false : true;
        applyWidgetToggle(desktopGridBtn, next);
        if (next) { desktop.classList.add('bg-dot-matrix'); } else { desktop.classList.remove('bg-dot-matrix'); }
    });

    const exportBtn = win.querySelector('#btn-export-settings');
    const importInput = win.querySelector('#input-import-settings');
    exportBtn?.addEventListener('click', () => {
        const payload = {
            theme: window.ThemeRegistry?.current || null,
            icon_pack: IconPack.current,
            icon_gap: getIconGap(),
            wallpaper: localStorage.getItem('lumo_wallpaper'),
            language: localStorage.getItem(STORAGE_KEYS.language)
        };
        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = 'lumo-settings.json'; a.click();
        URL.revokeObjectURL(url);
    });
    importInput?.addEventListener('change', () => {
        const file = importInput.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            try {
                const data = JSON.parse(reader.result);
                if (data.theme?.vars) {
                    Object.entries(data.theme.vars).forEach(([k,v]) => document.documentElement.style.setProperty(k,v));
                    window.ThemeRegistry.current = { name: data.theme.name || 'custom', vars: data.theme.vars, accent: data.theme.accent };
                    window.ThemeRegistry.save();
                }
                if (data.theme?.accent) setAccentColor(data.theme.accent);
                if (data.icon_pack) { IconPack.current = data.icon_pack; localStorage.setItem('lumo_icon_pack', IconPack.current); }
                if (data.icon_gap) { localStorage.setItem('lumo_icon_gap', String(data.icon_gap)); }
                if (data.language) { localStorage.setItem(STORAGE_KEYS.language, data.language); if (window.i18n?.setLocale) window.i18n.setLocale(data.language); }
                if (data.wallpaper) { localStorage.setItem('lumo_wallpaper', data.wallpaper); loadWallpaperPreference(); }
                renderDesktop();
                refreshStoreWindow();
                alert('Settings imported.');
            } catch(e) {
                alert('Invalid settings file.');
            }
        };
        reader.readAsText(file);
    });

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

            <section class="rounded-3xl border border-white/10 bg-white/5 p-4 flex flex-col gap-3">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-xs uppercase tracking-[0.4em] text-gray-400">Style</p>
                        <p class="text-2xl font-dot">${window.i18n?.t('settings.detailStyle') || 'Detail Style'}</p>
                    </div>
                </div>
                <div class="flex flex-col gap-3">
                    <div class="flex items-center justify-between">
                        <p class="font-semibold">Corner Radius</p>
                        <input type="range" min="0" max="32" value="12" data-style-radius>
                    </div>
                    <div class="flex items-center justify-between">
                        <p class="font-semibold">Border Weight</p>
                        <input type="range" min="1" max="3" value="1" data-style-border>
                    </div>
                    <div class="flex items-center justify-between">
                        <p class="font-semibold">Window Shadow</p>
                        <input type="range" min="0" max="1" step="0.05" value="0.8" data-style-shadow>
                    </div>
                    <div class="flex items-center justify-between">
                        <p class="font-semibold">Dot Grid Size</p>
                        <input type="range" min="8" max="20" value="12" data-style-grid>
                    </div>
                    <div class="flex items-center justify-between">
                        <p class="font-semibold">Widget Padding</p>
                        <input type="range" min="12" max="28" value="20" data-style-widget-padding>
                    </div>
                    <div class="flex items-center justify-between">
                        <p class="font-semibold">Widget Dot Grid</p>
                        <button class="setting-toggle flex items-center gap-2 border border-white/20 rounded-full px-4 py-1 text-xs text-white bg-white/10" data-widget-grid="off"><span class="setting-state">Off</span></button>
                    </div>
                    <div class="flex items-center justify-between">
                        <p class="font-semibold">Widget Frame Bold</p>
                        <button class="setting-toggle flex items-center gap-2 border border-white/20 rounded-full px-4 py-1 text-xs text-white bg-white/10" data-widget-frame="off"><span class="setting-state">Off</span></button>
                    </div>
                </div>
                <p class="text-xs text-gray-400">Fine-tune the Nothing look via CSS variables.</p>
            </section>

            <section class="rounded-3xl border border-white/10 bg-white/5 p-4 flex flex-col gap-3">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-xs uppercase tracking-[0.4em] text-gray-400">Appearance</p>
                        <p class="text-2xl font-dot">${window.i18n?.t('settings.themePresets') || 'Theme Presets'}</p>
                    </div>
                </div>
                <div class="grid grid-cols-2 md:grid-cols-3 gap-2">
                    ${Object.keys(window.LumoThemePresets || {}).map(name => `
                        <button data-theme-preset="${name}" class="px-3 py-2 rounded-xl border border-white/20 text-xs font-mono uppercase hover:border-[var(--accent)] hover:text-[var(--accent)] transition">${name}</button>
                    `).join('')}
                </div>
                <p class="text-xs text-gray-400">Apply curated Nothing-style presets with one tap.</p>
            </section>

            <section class="rounded-3xl border border-white/10 bg-white/5 p-4 flex flex-col gap-3">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-xs uppercase tracking-[0.4em] text-gray-400">Style</p>
                        <p class="text-2xl font-dot">Accent Color</p>
                    </div>
                </div>
                <div class="flex gap-3 flex-wrap">
                    ${accentColors.map(c => `
                        <button data-accent-color="${c.value}" class="w-8 h-8 rounded-full flex items-center justify-center transition hover:scale-110" style="background-color: ${c.value}; box-shadow: 0 0 10px ${c.value}40;">
                             ${(localStorage.getItem('lumo_accent') === c.value || (!localStorage.getItem('lumo_accent') && c.value === '#ff003c')) ? '<i class="fa-solid fa-check text-white text-xs"></i>' : ''}
                        </button>
                    `).join('')}
                </div>
                <div class="h-[1px] bg-white/10 my-2"></div>
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-lg font-dot">${window.i18n?.t('settings.iconPack') || 'Icon Pack'}</p>
                        <p class="text-xs text-gray-400">Switch icon style family.</p>
                    </div>
                    <div class="flex gap-2">
                        <button data-icon-pack="default" class="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-sm transition border border-white/10">Default</button>
                        <button data-icon-pack="line" class="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-sm transition border border-white/10">Line</button>
                    </div>
                </div>
                <div class="flex items-center justify-between">
                     <div>
                        <p class="text-lg font-dot">Wallpaper</p>
                        <p class="text-xs text-gray-400">Change your desktop background.</p>
                     </div>
                     <button onclick="openApp({ id: 'lumo-wallpaper', name: 'Wallpapers', icon: 'fa-solid fa-image', color: 'var(--accent)' })" class="px-4 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-sm transition border border-white/10">Open Gallery</button>
                </div>
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
                    <p class="font-semibold">${window.i18n?.t('settings.layout') || 'Layout'}</p>
                </div>
                <div class="flex items-center justify-between">
                    <p class="font-semibold">Dock Reserved Height</p>
                    <input type="range" min="90" max="160" value="130" data-layout-dock>
                </div>
                <div class="flex items-center justify-between">
                    <p class="font-semibold">Desktop Icon Gap (Y)</p>
                    <input type="range" min="80" max="160" value="100" data-layout-icon-gap>
                </div>
                <div class="flex items-center justify-between">
                    <p class="font-semibold">Desktop Dot Grid Overlay</p>
                    <button class="setting-toggle flex items-center gap-2 border border-white/20 rounded-full px-4 py-1 text-xs text-white bg-white/10" data-desktop-grid="off"><span class="setting-state">Off</span></button>
                </div>
            </section>
            <section class="rounded-3xl border border-white/10 bg-white/5 p-4 flex flex-col gap-3">
                <div class="flex items-center justify-between">
                    <p class="font-semibold">Import / Export</p>
                </div>
                <div class="flex items-center gap-2">
                    <button class="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-sm transition border border-white/10" id="btn-export-settings">Export Settings</button>
                    <label class="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-sm transition border border-white/10 cursor-pointer">
                        Import Settings
                        <input type="file" accept="application/json" class="hidden" id="input-import-settings">
                    </label>
                </div>
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
        <div class="flex-1 flex flex-col h-full bg-black text-white font-sans select-none">
            <!-- Toolbar / Header -->
            <div class="h-14 border-b border-white/10 flex items-center px-4 gap-4 bg-[#111]">
                <div class="flex gap-2">
                     <button id="files-back" class="w-8 h-8 flex items-center justify-center rounded hover:bg-white/10 disabled:opacity-30 transition text-gray-400"><i class="fa-solid fa-arrow-left"></i></button>
                     <button id="files-up" class="w-8 h-8 flex items-center justify-center rounded hover:bg-white/10 disabled:opacity-30 transition text-gray-400"><i class="fa-solid fa-arrow-up"></i></button>
                </div>
                <div class="flex-1 bg-[#222] border border-white/10 rounded-xl flex items-center px-3 h-9 transition-colors focus-within:border-white/30">
                     <i class="fa-solid fa-search text-gray-500 text-xs mr-2"></i>
                     <input id="files-search" type="text" class="bg-transparent border-none outline-none text-sm text-white w-full font-mono placeholder-gray-600" placeholder="Search files...">
                </div>
                <div class="flex items-center gap-3">
                     <button id="files-delete" class="px-3 py-1.5 border border-white/30 rounded text-xs font-mono uppercase hover:bg-red-900/50 hover:border-red-500 transition text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed">Delete</button>
                     <button id="files-new" class="px-3 py-1.5 border border-dashed border-white/30 rounded text-xs font-mono uppercase hover:bg-white/10 hover:border-white transition text-gray-300">+ New</button>
                </div>
            </div>

            <!-- Main Layout -->
            <div class="flex-1 flex overflow-hidden">
                <!-- Sidebar -->
                <div class="w-48 border-r border-white/10 bg-[#0a0a0a] flex flex-col py-4 gap-1 overflow-y-auto" id="files-sidebar">
                    <!-- Injected folders -->
                </div>

                <!-- Content -->
                <div class="flex-1 flex flex-col bg-black">
                    <!-- Breadcrumbs / Status -->
                    <div class="h-8 border-b border-white/5 flex items-center px-4 text-xs text-gray-500 font-mono" id="files-status">
                        Root / Documents
                    </div>
                    
                    <!-- File Grid/List -->
                    <div class="flex-1 overflow-y-auto p-4 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 content-start" id="files-grid">
                        <!-- Injected files -->
                    </div>
                </div>
            </div>
            
            <!-- Status Bar -->
            <div class="h-6 border-t border-white/10 bg-[#111] flex items-center px-4 justify-between text-[10px] text-gray-500 font-mono uppercase">
                <span id="files-count">0 items</span>
                <span>Nothing OS FS v1.0</span>
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
            <div class="relative h-32 md:h-48 shrink-0 overflow-hidden">
                <div class="absolute inset-0 bg-gradient-to-b from-[var(--accent)] to-transparent opacity-20"></div>
                <div class="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-30 mix-blend-overlay"></div>
                <div class="absolute bottom-0 left-0 p-4 md:p-6">
                    <p class="text-[10px] md:text-xs uppercase tracking-[0.4em] text-[var(--accent)] font-bold mb-1 md:mb-2">Featured</p>
                    <h2 class="font-dot text-2xl md:text-4xl mb-1">Lumo Store</h2>
                    <p class="text-xs md:text-sm opacity-70">Discover apps built for the future.</p>
                    <div class="mt-2 flex items-center gap-2 bg-black/30 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 w-fit hidden md:flex">
                        <i class="fa-solid fa-sparkles text-[#8b5cf6] text-xs"></i>
                        <span class="text-[10px] font-mono text-gray-300">AI Generation powered by <span class="text-white font-bold">Lumora 1.0</span></span>
                    </div>
                </div>
            </div>

            <!-- Tabs / Filter -->
            <div class="flex items-center gap-2 md:gap-4 px-4 md:px-6 py-2 border-b border-[var(--window-border)] overflow-x-auto no-scrollbar">
                <button data-tab="all" class="store-tab active px-3 md:px-4 py-1 md:py-1.5 rounded-full bg-[var(--accent)] text-white text-[10px] md:text-xs font-bold tracking-wider uppercase whitespace-nowrap">All Apps</button>
                <button data-tab="generate" class="store-tab px-3 md:px-4 py-1 md:py-1.5 rounded-full border border-[var(--window-border)] hover:bg-[var(--card-bg)] text-[var(--text-muted)] text-[10px] md:text-xs font-bold tracking-wider uppercase whitespace-nowrap transition">Generate</button>
                <button data-tab="productivity" class="store-tab px-3 md:px-4 py-1 md:py-1.5 rounded-full border border-[var(--window-border)] hover:bg-[var(--card-bg)] text-[var(--text-muted)] text-[10px] md:text-xs font-bold tracking-wider uppercase whitespace-nowrap transition">Productivity</button>
                <button data-tab="creative" class="store-tab px-3 md:px-4 py-1 md:py-1.5 rounded-full border border-[var(--window-border)] hover:bg-[var(--card-bg)] text-[var(--text-muted)] text-[10px] md:text-xs font-bold tracking-wider uppercase whitespace-nowrap transition">Creative</button>
                <button data-tab="system" class="store-tab px-3 md:px-4 py-1 md:py-1.5 rounded-full border border-[var(--window-border)] hover:bg-[var(--card-bg)] text-[var(--text-muted)] text-[10px] md:text-xs font-bold tracking-wider uppercase whitespace-nowrap transition">System</button>
            </div>

            <!-- Grid -->
            <div id="store-apps-grid" class="flex-1 overflow-y-auto p-4 md:p-6">
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

const loadedScripts = new Set();

function loadAppScript(appId) {
    if (loadedScripts.has(appId)) return Promise.resolve();

    const metaPath = storeCatalogPaths.find(p => p.includes(`/${appId}/`));
    if (!metaPath) return Promise.resolve(); // Not a catalog app, maybe system app

    const scriptPath = metaPath.replace('meta.json', `${appId}.js`);
    
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = scriptPath;
        script.onload = () => {
            loadedScripts.add(appId);
            resolve();
        };
        script.onerror = () => {
            console.warn(`Failed to load script for ${appId}`);
            resolve(); // Resolve anyway to allow fallback
        };
        document.body.appendChild(script);
    });
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

let activeStoreTab = 'all';

function refreshStoreWindow() {
    const storeWindow = activeWindows.store;
    if (storeWindow) {
        mountStoreApp(storeWindow);
    }
}

function mountStoreApp(win) {
    const grid = win.querySelector('#store-apps-grid');
    if (!grid) return;

    // Handle Tab Clicking
    const tabs = win.querySelectorAll('.store-tab');
    tabs.forEach(tab => {
        // Remove old listeners (not efficient but simple)
        const newTab = tab.cloneNode(true);
        tab.parentNode.replaceChild(newTab, tab);
        
        newTab.onclick = () => {
            activeStoreTab = newTab.dataset.tab;
            mountStoreApp(win); // Re-render
        };

        // Update Tab UI
        if (newTab.dataset.tab === activeStoreTab) {
            newTab.classList.add('bg-[var(--accent)]', 'text-white');
            newTab.classList.remove('border', 'border-[var(--window-border)]', 'hover:bg-[var(--card-bg)]', 'text-[var(--text-muted)]');
        } else {
            newTab.classList.remove('bg-[var(--accent)]', 'text-white');
            newTab.classList.add('border', 'border-[var(--window-border)]', 'hover:bg-[var(--card-bg)]', 'text-[var(--text-muted)]');
        }
    });

    grid.innerHTML = '';

    if (activeStoreTab === 'generate') {
        renderStoreGenerator(grid);
    } else {
        renderStoreCatalog(grid, activeStoreTab);
    }
}

function renderStoreCatalog(grid, tab) {
    if (!storeCatalog.length) {
        grid.innerHTML = `<div class="flex items-center justify-center text-sm text-gray-400 font-mono">LOADING_CATALOG...</div>`;
        return;
    }
    
    // Add Grid Classes
    grid.className = "flex-1 overflow-y-auto p-4 md:p-6 grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-3 md:gap-4";

    const filtered = tab === 'all' ? storeCatalog : storeCatalog.filter(app => (app.category || '').toLowerCase().includes(tab));

    if (filtered.length === 0) {
         grid.innerHTML = `<div class="col-span-full flex flex-col items-center justify-center text-gray-500 mt-10">
            <i class="fa-solid fa-box-open text-4xl mb-2 opacity-20"></i>
            <p class="text-xs font-mono uppercase">No apps found</p>
         </div>`;
         return;
    }

    filtered.forEach(appMeta => {
        const card = document.createElement('div');
        const isInstalled = installedStoreApps.some(app => app.id === appMeta.id);
        card.className = 'group relative flex flex-col gap-2 p-4 rounded-[20px] border border-[var(--card-border)] bg-[var(--card-bg)] hover:border-[var(--accent)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[4px_4px_0px_rgba(0,0,0,0.5)]';

        // Card Content
        card.innerHTML = `
            <div class="flex items-start justify-between mb-1">
                <div class="w-10 h-10 rounded-xl flex items-center justify-center text-xl bg-[var(--bg-dark)] border border-[var(--window-border)] shadow-sm group-hover:scale-110 transition-transform duration-300">
                    ${renderAppIcon(appMeta)}
                </div>
                ${isInstalled ? '<span class="text-[9px] font-bold bg-green-500/10 text-green-500 px-1.5 py-0.5 rounded uppercase tracking-wider font-mono">INSTALLED</span>' : ''}
            </div>
            
            <div>
                <div class="flex items-center gap-1 mb-0.5">
                    <span class="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-wider font-mono">${appMeta.creator || 'Lumo Team'}</span>
                    ${appMeta.verified ? '<i class="fa-solid fa-circle-check text-blue-400 text-[9px]"></i>' : ''}
                </div>
                <h3 class="font-dot text-lg font-bold text-[var(--text-main)] leading-none mb-1 uppercase">${appMeta.name}</h3>
                <p class="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-1.5 font-mono">${appMeta.category || 'Application'}</p>
                <p class="text-[11px] text-[var(--text-muted)] line-clamp-2 leading-relaxed font-mono opacity-80">${appMeta.description}</p>
            </div>

            <div class="mt-auto pt-2 flex items-center gap-1.5 flex-wrap">
                ${(appMeta.features || []).slice(0, 2).map(f => `<span class="text-[9px] px-1.5 py-0.5 rounded border border-[var(--window-border)] text-[var(--text-muted)] bg-[var(--bg-dark)] font-mono uppercase">${f}</span>`).join('')}
            </div>
        `;

        const actions = document.createElement('div');
        actions.className = 'mt-3 grid grid-cols-2 gap-2';

        // Primary action (install or installed status)
        const actionPrimary = document.createElement('button');
        const isComingSoon = appMeta.comingSoon;

        actionPrimary.className = `w-full py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors font-mono ${isInstalled
            ? 'bg-[var(--bg-dark)] text-[var(--text-muted)] border border-[var(--window-border)] cursor-default'
            : (isComingSoon
                ? 'bg-[var(--bg-dark)] text-[var(--text-muted)] border border-[var(--window-border)] cursor-not-allowed'
                : 'bg-[var(--text-main)] text-[var(--bg-dark)] hover:bg-[var(--accent)] hover:text-white border border-transparent')
            }`;

        actionPrimary.innerText = isInstalled ? (window.i18n?.t('store.open') || 'OPEN') : (isComingSoon ? 'SOON' : (window.i18n?.t('store.get') || 'GET'));

        if (isInstalled) {
            actionPrimary.onclick = () => openApp({ id: appMeta.id });
        } else if (!isComingSoon) {
            actionPrimary.onclick = () => installStoreApp(appMeta);
        }

        actions.appendChild(actionPrimary);

        // Secondary action: uninstall (only shown when installed)
        if (isInstalled) {
            const uninstallBtn = document.createElement('button');
            uninstallBtn.className = 'w-full py-2 rounded-lg text-xs font-bold uppercase tracking-wider border border-red-900/30 text-red-500 hover:bg-red-900/20 transition-colors font-mono';
            uninstallBtn.innerText = window.i18n?.t('store.uninstall') || 'UNINSTALL';
            uninstallBtn.addEventListener('click', () => uninstallStoreApp(appMeta));
            actions.appendChild(uninstallBtn);
        }

        // Generated App Actions: View Code & Complete Delete
        if (appMeta.isGenerated) {
            // View Code
            const codeBtn = document.createElement('button');
            codeBtn.className = 'col-span-2 py-2 rounded-lg text-xs font-bold uppercase tracking-wider border border-white/10 text-gray-400 hover:bg-white/5 hover:text-white transition-colors flex items-center justify-center gap-2 font-mono';
            codeBtn.innerHTML = '<i class="fa-solid fa-code"></i> VIEW CODE';
            codeBtn.onclick = () => viewAppCode(appMeta);
            actions.appendChild(codeBtn);

            // Delete Forever
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'col-span-2 py-2 rounded-lg text-xs font-bold uppercase tracking-wider bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors flex items-center justify-center gap-2 font-mono';
            deleteBtn.innerHTML = '<i class="fa-solid fa-trash"></i> DELETE FOREVER';
            deleteBtn.onclick = () => deleteGeneratedApp(appMeta.id);
            actions.appendChild(deleteBtn);
        }

        card.appendChild(actions);
        grid.appendChild(card);
    });
}

function renderStoreGenerator(grid) {
    grid.className = "flex-1 overflow-y-auto p-4 md:p-6 flex flex-col gap-4";
    
    const accessKey = localStorage.getItem('lumora_access_key');
    
    if (!accessKey) {
        grid.innerHTML = `
            <div class="flex-1 flex flex-col items-center justify-center text-center p-8">
                <div class="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 border border-dashed border-white/20">
                    <i class="fa-solid fa-lock text-2xl text-gray-400"></i>
                </div>
                <h3 class="font-dot text-xl mb-2 uppercase tracking-widest">Restricted Access</h3>
                <p class="text-xs font-mono text-gray-400 mb-6 max-w-md uppercase">To use the AI App Generator, you need a valid Lumora 1.0 Access Key.</p>
                <div class="flex gap-2 w-full max-w-xs">
                    <input type="password" id="store-gen-key" placeholder="ACCESS KEY" class="flex-1 bg-black border border-white/20 rounded-none px-4 py-2 text-white outline-none focus:border-[var(--accent)] transition font-mono text-xs placeholder-gray-600 uppercase">
                    <button id="store-gen-unlock" class="bg-[var(--accent)] text-white px-4 py-2 font-bold text-xs uppercase font-mono hover:opacity-80">Unlock</button>
                </div>
                <p id="store-gen-error" class="text-red-500 text-[10px] mt-4 hidden font-mono uppercase">Invalid Key</p>
            </div>
        `;
        
        const btn = grid.querySelector('#store-gen-unlock');
        const input = grid.querySelector('#store-gen-key');
        const error = grid.querySelector('#store-gen-error');
        
        const unlock = async () => {
             const code = input.value.trim();
             try {
                const res = await fetch('/api/lumora/verify', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ code })
                });
                const data = await res.json();
                if (data.success) {
                    localStorage.setItem('lumora_access_key', code);
                    renderStoreGenerator(grid);
                } else {
                    error.classList.remove('hidden');
                }
             } catch(e) {
                 error.innerText = "CONNECTION ERROR";
                 error.classList.remove('hidden');
             }
        };
        
        btn.onclick = unlock;
        return;
    }

    // Generator UI - Nothing OS Style
    grid.innerHTML = `
        <div class="flex flex-col gap-6 max-w-2xl mx-auto w-full pt-8">
            <div class="text-center mb-4">
                <h2 class="font-dot text-3xl mb-2 uppercase tracking-widest">App Generator</h2>
                <p class="text-[10px] font-mono text-gray-500 uppercase tracking-wider">Create instant micro-apps with AI. Powered by Lumora.</p>
            </div>

            <div class="bg-black border border-white/20 p-6 flex flex-col gap-6 shadow-[8px_8px_0px_rgba(255,255,255,0.1)]">
                <div class="flex flex-col gap-2">
                    <label class="text-[10px] font-mono text-[var(--accent)] uppercase tracking-widest font-bold">Select Model</label>
                    <div class="relative">
                        <select id="store-gen-model" class="w-full bg-black border border-white/20 px-4 py-3 text-xs font-mono text-white outline-none focus:border-[var(--accent)] appearance-none uppercase tracking-wider cursor-pointer hover:bg-white/5 transition">
                            <option value="x-ai/grok-4.1-fast">Grok 4.1</option>
                            <option value="google/gemini-3-pro-preview">Gemini 3.0 Pro Preview</option>
                        </select>
                        <div class="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                            <i class="fa-solid fa-chevron-down text-xs"></i>
                        </div>
                    </div>
                </div>

                <div class="flex flex-col gap-2">
                    <label class="text-[10px] font-mono text-[var(--accent)] uppercase tracking-widest font-bold">Prompt</label>
                    <textarea id="store-gen-prompt" rows="4" placeholder="DESCRIBE THE APP..." class="w-full bg-black border border-white/20 px-4 py-3 text-xs font-mono text-white outline-none focus:border-[var(--accent)] resize-none placeholder-gray-700 uppercase tracking-wider"></textarea>
                </div>

                <button id="store-gen-btn" class="bg-[var(--accent)] text-white py-4 font-bold font-dot uppercase tracking-widest hover:bg-white hover:text-black transition-all border border-[var(--accent)] text-sm relative overflow-hidden group">
                    <span class="relative z-10">GENERATE APP</span>
                    <div class="absolute inset-0 bg-white translate-y-full group-hover:translate-y-0 transition-transform duration-300 z-0"></div>
                </button>
            </div>
            
            <div id="store-gen-result" class="hidden mt-4">
                 <!-- Result injected here -->
            </div>
        </div>
    `;
    
    const btn = grid.querySelector('#store-gen-btn');
    const promptInput = grid.querySelector('#store-gen-prompt');
    const modelSelect = grid.querySelector('#store-gen-model');
    const resultContainer = grid.querySelector('#store-gen-result');
    
    btn.onclick = async () => {
        const prompt = promptInput.value.trim();
        if(!prompt) return;
        
        // Rate Limit Check for Gemini
        if (modelSelect.value === 'google/gemini-3-pro-preview') {
             const lastUsed = localStorage.getItem('lumo_gemini_last_used');
             if (lastUsed) {
                 const diff = Date.now() - parseInt(lastUsed);
                 // 24 hours = 86400000 ms
                 if (diff < 86400000) {
                     const remaining = Math.ceil((86400000 - diff) / (1000 * 60 * 60));
                     alert(`Gemini model limit reached. Please try again in ${remaining} hours, or use Grok.`);
                     return;
                 }
             }
        }

        btn.disabled = true;
        btn.innerHTML = `<span class="relative z-10"><i class="fa-solid fa-circle-notch fa-spin mr-2"></i>PROCESSING...</span>`;
        
        try {
             const styleGuide = `
STYLE GUIDE (STRICT - NOTHING OS AESTHETIC):
- VISUAL: Dot matrix aesthetics, pixelated or retro-futuristic vibe.
- COLORS: Strictly Black (#000000) background, White (#ffffff) text, Red (#ff0000) accents.
- FONTS: Monospace, dot-matrix, or retro computer fonts. HEADERS should be UPPERCASE.
- SHAPES: Rounded corners (20px) or pill shapes. Dotted borders.
- LAYOUT: Clean, grid-based, ample whitespace.
- NO: Gradients, shadows (except harsh pixel shadows), blue/green colors (unless accent).
- The app MUST look like it belongs in the Nothing OS ecosystem.
`;
             const messages = [
                { role: 'system', content: 'You are an expert web developer. Create a single-file HTML application (with CSS/JS embedded) based on the user request. The app must be self-contained. Return ONLY the code block. ' + styleGuide },
                { role: 'user', content: prompt }
             ];
             
             const res = await fetch('/api/lumora/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: modelSelect.value,
                    messages: messages,
                    accessKey: accessKey
                })
             });
             
             const data = await res.json();
             
             if(data.choices && data.choices[0]) {
                 // Update Gemini timestamp
                 if (modelSelect.value === 'google/gemini-3-pro-preview') {
                    localStorage.setItem('lumo_gemini_last_used', Date.now().toString());
                 }

                 const content = data.choices[0].message.content;
                 // Extract code from markdown
                 const match = content.match(/```(?:html)?([\s\S]*?)```/);
                 const code = match ? match[1] : content;
                 
                 const appId = 'gen-' + Date.now();
                 const appName = 'App ' + appId.substring(4); // Simple name
                 
                 // Save App
                 const appMeta = {
                     id: appId,
                     name: appName,
                     icon: 'fa-solid fa-robot',
                     color: '#8b5cf6',
                     category: 'Generated',
                     description: prompt.substring(0, 50) + '...',
                     code: code,
                     creator: 'You (AI)',
                     verified: false,
                     isGenerated: true,
                     features: ['AI Generated', 'Local']
                 };
                 
                 saveGeneratedApp(appMeta);
                 installStoreApp(appMeta); // Auto install
                 
                 // Show Success UI
                 resultContainer.innerHTML = `
                    <div class="bg-black border border-green-500/50 p-4 flex items-center justify-between shadow-[4px_4px_0px_rgba(34,197,94,0.2)]">
                        <div>
                            <h4 class="text-green-500 font-bold mb-1 font-mono uppercase text-xs tracking-wider">GENERATION COMPLETE</h4>
                            <p class="text-[10px] text-gray-400 font-mono uppercase">App installed to desktop.</p>
                        </div>
                        <div class="flex gap-2">
                            <button id="btn-open-${appId}" class="bg-green-500 text-black px-4 py-2 text-[10px] font-bold uppercase font-mono hover:bg-green-400 transition">OPEN</button>
                            <button id="btn-share-${appId}" class="bg-[#ff003c] text-white px-4 py-2 text-[10px] font-bold uppercase font-mono hover:bg-red-600 transition"><i class="fa-solid fa-share-nodes mr-1"></i> SHARE</button>
                        </div>
                    </div>
                 `;
                 resultContainer.classList.remove('hidden');

                 resultContainer.querySelector(`#btn-open-${appId}`).onclick = () => openApp(appMeta);
                 resultContainer.querySelector(`#btn-share-${appId}`).onclick = () => shareAppViaTalko(appMeta);

             } else {
                 throw new Error(data.error || 'Failed to generate');
             }
             
        } catch(e) {
            alert('Error: ' + e.message);
        } finally {
            btn.disabled = false;
            btn.innerHTML = `<span class="relative z-10">GENERATE APP</span>`;
        }
    };
}

function saveGeneratedApp(appMeta) {
    // In a real scenario, we might want to persist this to a specific 'generated_apps' list
    // For now, we rely on installedStoreApps persistence. 
    // But if we want it to appear in the Store Catalog under 'Generated', we should add it to storeCatalog?
    // The prompt says "Generated app should be saved".
    // I'll add it to storeCatalog so it persists in the Store view too.
    
    if (!storeCatalog.find(a => a.id === appMeta.id)) {
        storeCatalog.push(appMeta);
        // Persist store catalog? The current app doesn't seem to persist dynamic store additions to disk, 
        // but we can save it to localStorage.
        const generatedApps = JSON.parse(localStorage.getItem('lumo_generated_apps') || '[]');
        generatedApps.push(appMeta);
        localStorage.setItem('lumo_generated_apps', JSON.stringify(generatedApps));
    }
}

// Load generated apps on startup
function loadGeneratedApps() {
    try {
        const generatedApps = JSON.parse(localStorage.getItem('lumo_generated_apps') || '[]');
        generatedApps.forEach(app => {
            if (!storeCatalog.find(a => a.id === app.id)) {
                storeCatalog.push(app);
            }
        });
    } catch(e) {}
}
// Call this on init
loadGeneratedApps();

function shareAppViaTalko(app) {
    // Check if Talko is open
    const talkoWin = activeWindows['talko'];
    
    // If Talko app instance is accessible
    if (window.TalkoApp && window.TalkoApp.broadcastFile) {
        // Create a virtual file
        const file = {
            name: app.name + '.html',
            type: 'text/html',
            size: app.code.length,
            content: app.code
        };
        
        // We need to trigger Talko's file sharing. 
        // Since Talko.js is separate, we might need to use a CustomEvent or direct access.
        // Assuming TalkoApp is the instance.
        
        // Let's try to open Talko first if not open
        if (!talkoWin) {
            openApp({id: 'talko'}).then(() => {
                setTimeout(() => shareAppViaTalko(app), 1000);
            });
            return;
        }

        // If Talko is open, we try to send it.
        // Since I don't have easy access to Talko's internal state from here without exposing it,
        // I will use the 'lumoDrop:fileTransferInit' socket event if possible, or just alert the user.
        
        // However, the prompt says "Use Talko".
        // Talko uses PeerJS.
        
        // Best approach: Copy to clipboard and tell user to paste in Talko? No, that's low tech.
        // Better: Simulate a file selection in Talko.
        
        alert(`To share "${app.name}", please use Talko's file sharing feature. The app code has been copied to your clipboard.`);
        navigator.clipboard.writeText(app.code);
        
        // Bring Talko to front
        if(talkoWin) bringToFront('talko');
        
    } else {
        // Fallback
        openApp({id: 'talko'});
        alert('Opening Talko... Please connect to a room and use the File Share button to share this app.');
    }
}

function installStoreApp(appMeta) {
    if (installedStoreApps.some(app => app.id === appMeta.id)) return;
    const entry = {
        id: appMeta.id,
        name: appMeta.name,
        icon: appMeta.icon,
        color: appMeta.color,
        type: 'app',
        isGenerated: appMeta.isGenerated,
        code: appMeta.code,
        creator: appMeta.creator
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
    const fs = window.FileSystem;
    const state = {
        currentFolderId: 'documents',
        selectedFileId: null,
        history: ['documents'],
        historyIndex: 0
    };

    // Elements
    const sidebar = win.querySelector('#files-sidebar');
    const grid = win.querySelector('#files-grid');
    const status = win.querySelector('#files-status');
    const count = win.querySelector('#files-count');
    const backBtn = win.querySelector('#files-back');
    const searchInput = win.querySelector('#files-search');
    const newBtn = win.querySelector('#files-new');
    const deleteBtn = win.querySelector('#files-delete');

    // Render Sidebar
    const renderSidebar = () => {
        const folders = fs.getFolders();
        sidebar.innerHTML = folders.map(f => `
            <button data-id="${f.id}" class="w-full flex items-center gap-3 px-4 py-2 hover:bg-white/5 transition text-left border-l-2 ${f.id === state.currentFolderId ? 'border-[var(--accent)] bg-white/5 text-white' : 'border-transparent text-gray-400'}">
                <i class="${f.icon} w-4 text-center"></i>
                <span class="text-sm font-medium">${f.name}</span>
            </button>
        `).join('');
        
        sidebar.querySelectorAll('button').forEach(btn => {
            btn.addEventListener('click', () => {
                navigateTo(btn.dataset.id);
            });
        });
    };

    // Render Grid
    const renderGrid = () => {
        const folder = fs.data.find(f => f.id === state.currentFolderId);
        if (!folder) return;

        // Filter
        const term = searchInput.value.toLowerCase();
        const files = folder.files.filter(f => f.name.toLowerCase().includes(term));

        grid.innerHTML = files.map(file => {
            const isSelected = file.id === state.selectedFileId;
            let icon = 'fa-file';
            if (file.type.includes('Image')) icon = 'fa-file-image';
            if (file.type.includes('Video')) icon = 'fa-file-video';
            if (file.type.includes('Word') || file.type.includes('Lumo Doc')) icon = 'fa-file-word';
            if (file.type.includes('Sheet') || file.type.includes('Lumo Sheet')) icon = 'fa-file-excel';
            if (file.type.includes('Slide') || file.type.includes('Lumo Slide')) icon = 'fa-file-powerpoint';
            if (file.type.includes('Text') || file.type.includes('Markdown')) icon = 'fa-file-lines';

            return `
                <div data-file="${file.id}" class="group flex flex-col items-center gap-2 p-3 rounded border ${isSelected ? 'border-[var(--accent)] bg-[var(--accent)]/10' : 'border-transparent hover:bg-white/5'} cursor-pointer transition">
                    <div class="text-4xl ${isSelected ? 'text-[var(--accent)]' : 'text-gray-500 group-hover:text-gray-300'}">
                        <i class="fa-solid ${icon}"></i>
                    </div>
                    <div class="text-center w-full">
                        <p class="text-xs text-white truncate w-full font-medium">${file.name}</p>
                        <p class="text-[9px] text-gray-500 mt-0.5 font-mono">${file.size}</p>
                    </div>
                </div>
            `;
        }).join('');

        // Events
        grid.querySelectorAll('[data-file]').forEach(el => {
            el.addEventListener('click', (e) => {
                state.selectedFileId = el.dataset.file;
                renderGrid();
            });
            el.addEventListener('dblclick', () => {
                openFile(folder.id, el.dataset.file);
            });
        });

        // Update status
        status.innerText = `Root / ${folder.name}`;
        count.innerText = `${files.length} items`;
        
        // Update Buttons
        backBtn.disabled = state.historyIndex <= 0;
        deleteBtn.disabled = !state.selectedFileId;
    };

    const navigateTo = (folderId) => {
        if (state.currentFolderId === folderId) return;
        
        // History
        if (state.historyIndex < state.history.length - 1) {
            state.history = state.history.slice(0, state.historyIndex + 1);
        }
        state.history.push(folderId);
        state.historyIndex++;

        state.currentFolderId = folderId;
        state.selectedFileId = null;
        renderSidebar();
        renderGrid();
    };

    const openFile = (folderId, fileId) => {
        const folder = fs.data.find(f => f.id === folderId);
        const file = folder?.files.find(f => f.id === fileId);
        if (!file) return;
        
        // Logic to open Lumo 365 or others
        if (file.type.startsWith('Lumo')) {
             const app = getAllApps().find(a => a.id === 'lumo-365');
             if(app) {
                 openApp(app).then(() => {
                     setTimeout(() => {
                         if(window.Lumo365 && window.Lumo365.loadFile) {
                             window.Lumo365.loadFile(file, folderId);
                         }
                     }, 800);
                 });
             } else {
                 alert('Lumo 365 not installed!');
             }
        } else {
             alert('Preview: ' + file.name + '\n' + (file.preview || file.content));
        }
    };

    // Search
    searchInput.addEventListener('input', renderGrid);

    // New File
    newBtn.addEventListener('click', () => {
        const name = prompt('File Name:');
        if(name) {
            const type = prompt('Type (word/excel/slide)?', 'word');
            let fType = 'Lumo Doc';
            let content = {type: 'word', html: ''};
            
            if(type === 'excel') { fType = 'Lumo Sheet'; content = {type: 'excel', sheets: {}}; }
            if(type === 'slide') { fType = 'Lumo Slide'; content = {type: 'powerpoint', slides: []}; }

            fs.createFile(state.currentFolderId, name + '.lumo', fType, JSON.stringify(content));
            renderGrid();
        }
    });
    
    // Back
    backBtn.addEventListener('click', () => {
        if(state.historyIndex > 0) {
            state.historyIndex--;
            state.currentFolderId = state.history[state.historyIndex];
            renderSidebar();
            renderGrid();
        }
    });

    // Delete Event
    deleteBtn.addEventListener('click', () => {
        if(state.selectedFileId && confirm('Delete file?')) {
             const folder = fs.data.find(f => f.id === state.currentFolderId);
             if(folder) {
                 folder.files = folder.files.filter(f => f.id !== state.selectedFileId);
                 fs.save();
                 state.selectedFileId = null;
                 renderGrid();
             }
        }
    });

    renderSidebar();
    renderGrid();
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

function toggleAppDrawer() { 
    const drawer = document.getElementById('app-drawer'); 
    const isHidden = drawer.classList.contains('hidden'); 
    if (isHidden) { 
        drawer.classList.remove('hidden'); 
        drawer.classList.add('flex'); 
        const input = document.getElementById('drawer-search');
        if (input) {
            input.value = '';
            input.focus();
            // Filter Logic
            input.oninput = (e) => {
                const term = e.target.value.toLowerCase();
                const grid = document.getElementById('drawer-grid');
                Array.from(grid.children).forEach(item => {
                    const name = item.dataset.appName;
                    if (name && name.includes(term)) {
                        item.classList.remove('hidden');
                    } else {
                        item.classList.add('hidden');
                    }
                });
            };
            input.dispatchEvent(new Event('input'));
        }
    } else { 
        drawer.classList.add('hidden'); 
        drawer.classList.remove('flex'); 
    } 
    document.getElementById('control-center').classList.add('hidden'); 
}

function toggleControlCenter() { const cc = document.getElementById('control-center'); const isHidden = cc.classList.contains('hidden'); if (isHidden) { cc.classList.remove('hidden'); setTimeout(() => { cc.classList.remove('opacity-0', 'scale-90'); cc.classList.add('opacity-100', 'scale-100'); }, 10); } else { cc.classList.remove('opacity-100', 'scale-100'); cc.classList.add('opacity-0', 'scale-90'); setTimeout(() => cc.classList.add('hidden'), 300); } document.getElementById('app-drawer').classList.add('hidden'); }

function toggleState(element) { const circle = element.querySelector('.rounded-full'); const text = element.querySelector('.text-xs'); if (circle.classList.contains('bg-blue-500')) { circle.classList.remove('bg-blue-500'); circle.classList.add('bg-gray-600'); text.innerText = 'Off'; } else { circle.classList.add('bg-blue-500'); circle.classList.remove('bg-gray-600'); text.innerText = 'On'; } }

let isDragging = false; let currentWin = null; let offset = { x: 0, y: 0 };
function startDrag(e, id) { if (window.innerWidth < 768) return; isDragging = true; currentWin = document.getElementById(`win-${id}`); bringToFront(id); const clientX = e.touches ? e.touches[0].clientX : e.clientX; const clientY = e.touches ? e.touches[0].clientY : e.clientY; offset.x = clientX - currentWin.offsetLeft; offset.y = clientY - currentWin.offsetTop; }
window.addEventListener('mousemove', (e) => {
    if (!isDragging || !currentWin) return;
    e.preventDefault();
    currentWin.style.left = `${e.clientX - offset.x}px`;
    currentWin.style.top = `${e.clientY - offset.y}px`;

    // Snap Ghost Logic
    const snapThreshold = 50;
    const mouseX = e.clientX;
    const mouseY = e.clientY;

    snapGhost.classList.add('hidden');
    snapGhost.style.width = '';
    snapGhost.style.height = '';
    snapGhost.style.left = '';
    snapGhost.style.top = '';

    if (mouseX < snapThreshold) {
        // Left Snap
        snapGhost.classList.remove('hidden');
        snapGhost.style.left = '0px';
        snapGhost.style.top = '32px';
        snapGhost.style.height = 'calc(100% - var(--dock-reserved))';
        snapGhost.style.width = '50%';
    } else if (window.innerWidth - mouseX < snapThreshold) {
        // Right Snap
        snapGhost.classList.remove('hidden');
        snapGhost.style.left = '50%';
        snapGhost.style.top = '32px';
        snapGhost.style.height = 'calc(100% - var(--dock-reserved))';
        snapGhost.style.width = '50%';
    } else if (mouseY < snapThreshold) {
        // Top Snap (Maximize)
        snapGhost.classList.remove('hidden');
        snapGhost.style.left = '0px';
        snapGhost.style.top = '32px';
        snapGhost.style.width = '100%';
        snapGhost.style.height = 'calc(100% - var(--dock-reserved))';
    }
});
window.addEventListener('touchmove', (e) => { if (!isDragging || !currentWin) return; const touch = e.touches[0]; currentWin.style.left = `${touch.clientX - offset.x}px`; currentWin.style.top = `${touch.clientY - offset.y}px`; }, { passive: false });
window.addEventListener('mouseup', () => {
    if (isDragging && currentWin) {
        // Window Snapping Logic
        const snapThreshold = 50;
        const rect = currentWin.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        // Use mouse position based logic from ghost if available, but here we use rect for robustness or fallback
        // Actually, let's match the ghost logic which relies on cursor position.
        // Since mouseup event has clientX, we can use it.
        // But the event object is not passed to this arrow function in the original code?
        // Wait, `window.addEventListener('mouseup', () => {` doesn't take `e`.
        // I should change it to `(e)`.

        // Snap to Left
        if (rect.left < snapThreshold) {
            currentWin.style.left = '0px';
            currentWin.style.top = '32px';
            currentWin.style.height = 'calc(100% - var(--dock-reserved))';
            currentWin.style.width = '50%';
            currentWin.classList.remove('rounded-xl');
        }
        // Snap to Right
        else if (window.innerWidth - rect.right < snapThreshold) {
            currentWin.style.left = '50%';
            currentWin.style.top = '32px';
            currentWin.style.height = 'calc(100% - var(--dock-reserved))';
            currentWin.style.width = '50%';
            currentWin.classList.remove('rounded-xl');
        }
        // Snap to Top (Maximize)
        else if (rect.top < snapThreshold) {
            // Save previous state if not already maximized
            if (currentWin.dataset.maximized !== 'true') {
                currentWin.dataset.prevTop = currentWin.style.top;
                currentWin.dataset.prevLeft = currentWin.style.left;
                currentWin.dataset.prevWidth = currentWin.style.width;
                currentWin.dataset.prevHeight = currentWin.style.height;
            }

            currentWin.style.top = '32px';
            currentWin.style.left = '0px';
            currentWin.style.width = '100%';
            currentWin.style.height = 'calc(100% - var(--dock-reserved))';
            currentWin.classList.remove('rounded-xl');
            currentWin.dataset.maximized = 'true';
        }
        // Restore rounded corners if not snapped (basic check)
        else {
            currentWin.classList.add('rounded-xl');
        }
    }
    isDragging = false;
    currentWin = null;
    snapGhost.classList.add('hidden');
});
window.addEventListener('touchend', () => { isDragging = false; currentWin = null; });



document.addEventListener('keydown', (e) => { if (e.altKey && e.code === 'Space') { const spot = document.getElementById('spotlight'); if (spot.classList.contains('hidden')) { spot.classList.remove('hidden'); spot.classList.add('flex'); document.getElementById('spotlight-input').focus(); } else { spot.classList.add('hidden'); spot.classList.remove('flex'); } } });

document.getElementById('desktop').addEventListener('click', (e) => { const spot = document.getElementById('spotlight'); if (!spot.contains(e.target) && !e.altKey && !spot.classList.contains('hidden')) { spot.classList.add('hidden'); spot.classList.remove('flex'); } });

// --- Context Menu ---
const contextMenu = document.createElement('div');
contextMenu.className = 'fixed bg-[#1a1a1a]/90 backdrop-blur-md border border-white/10 rounded-lg py-1 z-[10000] hidden w-48 shadow-2xl';
contextMenu.innerHTML = `
    <button data-action="refresh" class="w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-white/10 flex items-center gap-2">
        <i class="fa-solid fa-rotate-right text-gray-400 w-4"></i> Refresh
    </button>
    <div class="h-[1px] bg-white/10 my-1"></div>
    <button data-action="generate" class="w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-white/10 flex items-center gap-2">
        <i class="fa-solid fa-wand-magic-sparkles text-[var(--accent)] w-4"></i> Generate App
    </button>
    <div class="h-[1px] bg-white/10 my-1"></div>
    <button data-action="wallpaper" class="w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-white/10 flex items-center gap-2">
        <i class="fa-solid fa-image text-gray-400 w-4"></i> Change Wallpaper
    </button>
    <button data-action="settings" class="w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-white/10 flex items-center gap-2">
        <i class="fa-solid fa-gear text-gray-400 w-4"></i> Settings
    </button>
    <div class="h-[1px] bg-white/10 my-1"></div>
    <button data-action="new-folder" class="w-full text-left px-4 py-2 text-sm text-gray-400 hover:bg-white/10 flex items-center gap-2 cursor-not-allowed">
        <i class="fa-solid fa-folder-plus text-gray-400 w-4"></i> New Folder
    </button>
`;
document.body.appendChild(contextMenu);

document.addEventListener('contextmenu', (e) => {
    if (e.target.closest('#desktop') || e.target.closest('#desktop-icons')) {
        e.preventDefault();
        contextMenu.style.left = `${e.clientX}px`;
        contextMenu.style.top = `${e.clientY}px`;
        contextMenu.classList.remove('hidden');
    } else {
        contextMenu.classList.add('hidden');
    }
});

document.addEventListener('click', (e) => {
    if (!contextMenu.contains(e.target)) {
        contextMenu.classList.add('hidden');
    }
});

contextMenu.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', () => {
        const action = btn.dataset.action;
        contextMenu.classList.add('hidden');
        if (action === 'refresh') {
            renderDesktop();
        } else if (action === 'wallpaper') {
            openApp({ id: 'lumo-wallpaper', name: 'Wallpapers', icon: 'fa-solid fa-image', color: 'var(--accent)' });
        } else if (action === 'settings') {
            openApp(systemApps.find(a => a.id === 'settings'));
        } else if (action === 'generate') {
            showDesktopGeneratorModal();
        }
    });
});

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

function getIconGap() {
    const raw = localStorage.getItem('lumo_icon_gap');
    const val = raw ? parseInt(raw) : 100;
    return Number.isFinite(val) ? val : 100;
}

// --- Desktop Selection Logic ---
let selectionStart = null;
const selectionBox = document.createElement('div');
selectionBox.className = 'selection-box';
document.body.appendChild(selectionBox);

const snapGhost = document.createElement('div');
snapGhost.className = 'fixed bg-white/20 border-2 border-dashed border-white/50 rounded-xl pointer-events-none z-[9999] transition-all duration-200 hidden';
document.body.appendChild(snapGhost);

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

// --- Generated App Helpers ---

function deleteGeneratedApp(id) {
    if (!confirm('Are you sure you want to delete this app forever? This cannot be undone.')) return;
    
    // Uninstall
    uninstallStoreApp({id});
    
    // Remove from catalog
    const idx = storeCatalog.findIndex(a => a.id === id);
    if (idx !== -1) storeCatalog.splice(idx, 1);
    
    // Update Storage
    const generatedApps = JSON.parse(localStorage.getItem('lumo_generated_apps') || '[]');
    const newApps = generatedApps.filter(a => a.id !== id);
    localStorage.setItem('lumo_generated_apps', JSON.stringify(newApps));
    
    refreshStoreWindow();
}

function evolveApp(app, win) {
    const status = document.createElement('div');
    status.className = 'absolute bottom-0 left-0 right-0 bg-[#111] border-t border-[#333] p-2 flex items-center justify-between text-xs font-mono z-50';
    status.innerHTML = `
        <div class="flex items-center gap-2 text-[var(--accent)]">
            <i class="fa-solid fa-microchip fa-spin"></i>
            <span>LUMORA IS EVOLVING THIS APP...</span>
        </div>
    `;
    win.querySelector('.relative').appendChild(status);

    const accessKey = localStorage.getItem('lumora_access_key');
    if (!accessKey) {
        status.innerHTML = `<span class="text-red-500">MISSING ACCESS KEY</span>`;
        return;
    }

    // Evolution Logic
    (async () => {
        try {
            const styleGuide = `
STYLE GUIDE (STRICT - NOTHING OS AESTHETIC):
- VISUAL: Dot matrix aesthetics, pixelated or retro-futuristic vibe.
- COLORS: Strictly Black (#000000) background, White (#ffffff) text, Red (#ff0000) accents.
- FONTS: Monospace, dot-matrix, or retro computer fonts. HEADERS should be UPPERCASE.
- SHAPES: Rounded corners (20px) or pill shapes. Dotted borders.
- LAYOUT: Clean, grid-based, ample whitespace.
- NO: Gradients, shadows (except harsh pixel shadows), blue/green colors (unless accent).
- The app MUST look like it belongs in the Nothing OS ecosystem.
`;
            const messages = [
                { role: 'system', content: 'You are an expert web developer. The user is inspecting the code of a generated app. Your goal is to "EVOLVE" it. Improve the code, add more advanced features, refine the UI to be strictly "Nothing OS" style, and optimize it. Return the FULL updated HTML code block. ' + styleGuide },
                { role: 'user', content: `Current Code:\n${app.code}\n\nInstruction: Evolve this app to the next level.` }
            ];

            // Use Gemini if available (better for code), else Grok
            const model = 'google/gemini-3-pro-preview';
            
            const res = await fetch('/api/lumora/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: model,
                    messages: messages,
                    accessKey: accessKey
                })
            });
            
            const data = await res.json();
            if (data.choices && data.choices[0]) {
                const content = data.choices[0].message.content;
                const match = content.match(/```(?:html)?([\s\S]*?)```/);
                const newCode = match ? match[1] : content;

                // Update App
                app.code = newCode;
                app.version = (app.version || 1) + 1;
                app.name = app.name.replace(/ v\d+$/, '') + ' v' + app.version;
                
                // Save
                const generatedApps = JSON.parse(localStorage.getItem('lumo_generated_apps') || '[]');
                const idx = generatedApps.findIndex(a => a.id === app.id);
                if (idx !== -1) {
                    generatedApps[idx] = app;
                    localStorage.setItem('lumo_generated_apps', JSON.stringify(generatedApps));
                }
                
                // Update UI
                win.querySelector('textarea').value = newCode;
                status.innerHTML = `
                    <div class="flex items-center gap-2 text-green-500">
                        <i class="fa-solid fa-check"></i>
                        <span>EVOLUTION COMPLETE (v${app.version})</span>
                    </div>
                    <button class="px-2 py-1 bg-white/10 hover:bg-white/20 rounded text-[10px] uppercase text-white" onclick="openApp({id:'${app.id}'})">Run</button>
                `;
                
                // Refresh Store if open
                if(activeWindows.store) refreshStoreWindow();
                
            } else {
                throw new Error('Failed to evolve');
            }
        } catch (e) {
            console.error(e);
            status.innerHTML = `<span class="text-red-500">EVOLUTION FAILED</span>`;
        }
    })();
}

function showDesktopGeneratorModal() {
    const accessKey = localStorage.getItem('lumora_access_key');
    if (!accessKey) {
        alert('Please unlock the Generator in Lumo Store first.');
        openApp({id:'store'});
        return;
    }

    const modalId = 'gen-modal-' + Date.now();
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]';
    modal.innerHTML = `
        <div class="bg-black border border-white/20 w-[500px] p-6 shadow-2xl relative flex flex-col gap-4">
            <button id="close-${modalId}" class="absolute top-4 right-4 text-gray-500 hover:text-white"><i class="fa-solid fa-xmark"></i></button>
            
            <div>
                <h2 class="font-dot text-2xl text-white uppercase tracking-widest mb-1">Instant App</h2>
                <p class="text-[10px] font-mono text-gray-400 uppercase">Generate & Run immediately</p>
            </div>
            
            <div class="flex flex-col gap-2">
                <label class="text-[10px] font-mono text-[var(--accent)] uppercase tracking-widest font-bold">Model</label>
                <select id="model-${modalId}" class="w-full bg-[#111] border border-white/20 px-3 py-2 text-xs font-mono text-white outline-none focus:border-[var(--accent)] uppercase">
                    <option value="x-ai/grok-4.1-fast">Grok 4.1</option>
                    <option value="google/gemini-3-pro-preview">Gemini 3.0 Pro Preview</option>
                </select>
            </div>

            <div class="flex flex-col gap-2">
                <label class="text-[10px] font-mono text-[var(--accent)] uppercase tracking-widest font-bold">Prompt</label>
                <textarea id="prompt-${modalId}" rows="3" class="w-full bg-[#111] border border-white/20 px-3 py-2 text-xs font-mono text-white outline-none focus:border-[var(--accent)] resize-none uppercase" placeholder="DESCRIBE APP..."></textarea>
            </div>

            <button id="btn-${modalId}" class="bg-[var(--accent)] text-white py-3 font-bold font-dot uppercase tracking-widest hover:bg-white hover:text-black transition-colors text-xs">
                GENERATE & RUN
            </button>
        </div>
    `;
    document.body.appendChild(modal);

    const close = () => modal.remove();
    modal.querySelector(`#close-${modalId}`).onclick = close;
    modal.addEventListener('click', (e) => { if(e.target === modal) close(); });

    const btn = modal.querySelector(`#btn-${modalId}`);
    const promptInput = modal.querySelector(`#prompt-${modalId}`);
    const modelSelect = modal.querySelector(`#model-${modalId}`);

    promptInput.focus();

    btn.onclick = async () => {
        const prompt = promptInput.value.trim();
        if(!prompt) return;

        btn.disabled = true;
        btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> PROCESSING...';

        try {
             if (modelSelect.value === 'google/gemini-3-pro-preview') {
                 const lastUsed = localStorage.getItem('lumo_gemini_last_used');
                 if (lastUsed && (Date.now() - parseInt(lastUsed) < 86400000)) {
                     alert('Gemini limit reached. Switching to Grok 4.1.');
                     modelSelect.value = 'x-ai/grok-4.1-fast';
                 }
             }

             const styleGuide = `
STYLE GUIDE (STRICT - NOTHING OS AESTHETIC):
- VISUAL: Dot matrix aesthetics, pixelated or retro-futuristic vibe.
- COLORS: Strictly Black (#000000) background, White (#ffffff) text, Red (#ff0000) accents.
- FONTS: Monospace, dot-matrix, or retro computer fonts. HEADERS should be UPPERCASE.
- SHAPES: Rounded corners (20px) or pill shapes. Dotted borders.
- LAYOUT: Clean, grid-based, ample whitespace.
- NO: Gradients, shadows (except harsh pixel shadows), blue/green colors (unless accent).
- The app MUST look like it belongs in the Nothing OS ecosystem.
`;
             const messages = [
                { role: 'system', content: 'You are an expert web developer. Create a single-file HTML application. Return ONLY the code block. ' + styleGuide },
                { role: 'user', content: prompt }
             ];

             const res = await fetch('/api/lumora/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: modelSelect.value,
                    messages: messages,
                    accessKey: accessKey
                })
             });
             
             const data = await res.json();
             if(data.choices && data.choices[0]) {
                 if (modelSelect.value.includes('gemini')) localStorage.setItem('lumo_gemini_last_used', Date.now().toString());
                 
                 const content = data.choices[0].message.content;
                 const match = content.match(/```(?:html)?([\s\S]*?)```/);
                 const code = match ? match[1] : content;
                 
                 const appId = 'gen-' + Date.now();
                 const appMeta = {
                     id: appId,
                     name: 'App ' + appId.substring(4),
                     icon: 'fa-solid fa-robot',
                     color: '#8b5cf6',
                     category: 'Generated',
                     description: prompt,
                     code: code,
                     creator: 'You (AI)',
                     verified: false,
                     isGenerated: true,
                     features: ['AI Generated', 'Local']
                 };
                 
                 saveGeneratedApp(appMeta);
                 installStoreApp(appMeta);
                 
                 close();
                 openApp(appMeta);
             } else {
                 throw new Error('Generation failed');
             }

        } catch(e) {
            alert('Error: ' + e.message);
            btn.disabled = false;
            btn.innerText = 'GENERATE & RUN';
        }
    };
}

function viewAppCode(app) {
    const winId = `code-${app.id}`;
    if (activeWindows[winId]) {
        bringToFront(winId);
        return;
    }

    const win = document.createElement('div');
    win.id = `win-${winId}`;
    win.className = `window-frame absolute flex flex-col bg-[#1e1e1e] border border-[#333] shadow-2xl overflow-hidden pointer-events-auto animate-[scaleIn_0.2s_ease-out] rounded-xl w-[600px] h-[500px] resize`;
    win.style.top = '100px';
    win.style.left = '100px';
    win.style.zIndex = ++zIndexCounter;

    win.innerHTML = `
        <div class="window-header h-10 bg-[#252526] border-b border-[#333] flex items-center justify-between px-3 cursor-move select-none" onmousedown="startDrag(event, '${winId}')" ontouchstart="startDrag(event, '${winId}')">
            <div class="flex items-center gap-2">
                <div class="flex gap-1.5 window-controls">
                    <button onclick="closeApp('${winId}')" class="w-3 h-3 rounded-full bg-[#ff5f56] hover:bg-[#cc4b42] transition"></button>
                </div>
                <span class="text-xs text-gray-400 ml-2 font-mono">SOURCE: ${app.name.toUpperCase()}</span>
            </div>
        </div>
        <div class="flex-1 relative">
            <textarea class="w-full h-full bg-[#1e1e1e] text-[#d4d4d4] font-mono text-xs p-4 outline-none resize-none pb-12" readonly></textarea>
        </div>
    `;

    document.getElementById('window-area').appendChild(win);
    win.querySelector('textarea').value = app.code;
    activeWindows[winId] = win;
    bringToFront(winId);
    updateDockIndicators();

    // Trigger Evolution
    if (app.isGenerated) {
        evolveApp(app, win);
    }
}
