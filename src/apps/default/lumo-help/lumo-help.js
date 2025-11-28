(() => {
    const buildMarkup = () => `
        <div class="flex-1 flex flex-col h-full bg-black text-white font-sans">
            <div class="flex-1 flex overflow-hidden">
                <!-- Sidebar -->
                <div class="w-64 border-r border-[#333] bg-black/50 flex flex-col">
                    <div class="p-6">
                        <h2 class="font-dot text-2xl tracking-widest text-[var(--accent)]">HELP</h2>
                        <p class="text-xs text-gray-500 mt-1 font-mono">Lumo OS Guide</p>
                    </div>
                    <nav class="flex-1 overflow-y-auto px-3 space-y-1">
                        <button data-help-tab="intro" class="w-full text-left px-4 py-3 rounded-md bg-[#222] text-white text-sm font-medium transition font-dot uppercase">Introduction</button>
                        <button data-help-tab="interface" class="w-full text-left px-4 py-3 rounded-md hover:bg-[#111] text-gray-400 hover:text-white text-sm font-medium transition font-dot uppercase">Interface</button>
                        <button data-help-tab="shortcuts" class="w-full text-left px-4 py-3 rounded-md hover:bg-[#111] text-gray-400 hover:text-white text-sm font-medium transition font-dot uppercase">Shortcuts</button>
                        <button data-help-tab="apps" class="w-full text-left px-4 py-3 rounded-md hover:bg-[#111] text-gray-400 hover:text-white text-sm font-medium transition font-dot uppercase">Apps</button>
                        <button data-help-tab="faq" class="w-full text-left px-4 py-3 rounded-md hover:bg-[#111] text-gray-400 hover:text-white text-sm font-medium transition font-dot uppercase">FAQ</button>
                        <div class="pt-4 mt-4 border-t border-[#333]">
                            <button data-help-tab="terms" class="w-full text-left px-4 py-3 rounded-md hover:bg-[#111] text-gray-400 hover:text-white text-sm font-medium transition font-dot uppercase">Terms of Service</button>
                            <button data-help-tab="privacy" class="w-full text-left px-4 py-3 rounded-md hover:bg-[#111] text-gray-400 hover:text-white text-sm font-medium transition font-dot uppercase">Privacy Policy</button>
                        </div>
                    </nav>
                    <div class="p-4 border-t border-[#333]">
                        <div class="text-[0.65rem] text-gray-600 uppercase tracking-widest font-mono">Version 1.0</div>
                    </div>
                </div>
                
                <!-- Content -->
                <div class="flex-1 overflow-y-auto p-8 sm:p-12 bg-dot-matrix" id="help-content">
                    <!-- Content injected via JS -->
                </div>
            </div>
        </div>
    `;

    const contentMap = {
        intro: `
            <h1 class="font-dot text-4xl mb-6">Welcome to Lumo OS</h1>
            <p class="text-lg text-gray-300 leading-relaxed mb-8 font-light">
                Lumo OS is a web-based operating system designed with a focus on aesthetics, simplicity, and fluid interaction. 
                Inspired by the Nothing OS design language, it brings a unique dot-matrix typography and monochrome palette to the web.
            </p>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div class="nothing-card">
                    <i class="fa-solid fa-layer-group text-3xl text-[var(--accent)] mb-4"></i>
                    <h3 class="text-xl font-bold mb-2 font-dot uppercase">Layered Design</h3>
                    <p class="text-sm text-gray-400">Experience depth with glassmorphism and subtle parallax effects.</p>
                </div>
                <div class="nothing-card">
                    <i class="fa-solid fa-bolt text-3xl text-[var(--accent)] mb-4"></i>
                    <h3 class="text-xl font-bold mb-2 font-dot uppercase">Fast & Fluid</h3>
                    <p class="text-sm text-gray-400">Built for speed with instant app launching and smooth transitions.</p>
                </div>
            </div>
        `,
        interface: `
            <h1 class="font-dot text-4xl mb-6">The Interface</h1>
            <div class="space-y-8">
                <section>
                    <h3 class="text-2xl font-bold mb-3 text-white font-dot uppercase">Desktop</h3>
                    <p class="text-gray-400 leading-relaxed">
                        Your main workspace. Icons can be moved freely. Double-click to open apps.
                        The widget area on the top right shows the time and weather.
                    </p>
                </section>
                <section>
                    <h3 class="text-2xl font-bold mb-3 text-white font-dot uppercase">Dock</h3>
                    <p class="text-gray-400 leading-relaxed">
                        Located at the bottom, the Dock holds your favorite and running apps. 
                        Hover to see app names. Click to launch or minimize.
                    </p>
                </section>
                <section>
                    <h3 class="text-2xl font-bold mb-3 text-white font-dot uppercase">Control Center</h3>
                    <p class="text-gray-400 leading-relaxed">
                        Access quick toggles for Wi-Fi, Bluetooth, and brightness by clicking the status bar at the top right.
                    </p>
                </section>
            </div>
        `,
        shortcuts: `
            <h1 class="font-dot text-4xl mb-6">Keyboard Shortcuts</h1>
            <div class="overflow-hidden rounded-xl border border-[#333]">
                <table class="w-full text-left text-sm">
                    <thead class="bg-[#111] text-white uppercase tracking-wider font-dot">
                        <tr>
                            <th class="px-6 py-3">Shortcut</th>
                            <th class="px-6 py-3">Action</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-[#333] text-gray-300 font-mono">
                        <tr class="hover:bg-[#111]">
                            <td class="px-6 py-4 text-[var(--accent)]">Alt + Space</td>
                            <td class="px-6 py-4">Toggle Spotlight Search</td>
                        </tr>
                        <tr class="hover:bg-[#111]">
                            <td class="px-6 py-4 text-[var(--accent)]">Esc</td>
                            <td class="px-6 py-4">Close active window (if supported)</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        `,
        apps: `
            <h1 class="font-dot text-4xl mb-6">Applications</h1>
            <p class="text-gray-400 mb-6">Lumo OS comes with a suite of powerful apps.</p>
            <div class="grid gap-4 sm:grid-cols-2">
                <div class="flex items-center gap-4 p-4 rounded-xl border border-[#333] bg-[#111]">
                    <div class="w-12 h-12 rounded bg-[#333] flex items-center justify-center text-white"><i class="fa-solid fa-terminal"></i></div>
                    <div>
                        <h4 class="font-bold font-dot uppercase">Cmd</h4>
                        <p class="text-xs text-gray-400">Command line interface for power users.</p>
                    </div>
                </div>
                <div class="flex items-center gap-4 p-4 rounded-xl border border-[#333] bg-[#111]">
                    <div class="w-12 h-12 rounded bg-[#F4B400] flex items-center justify-center text-white"><i class="fa-solid fa-note-sticky"></i></div>
                    <div>
                        <h4 class="font-bold font-dot uppercase">Notes</h4>
                        <p class="text-xs text-gray-400">Simple, auto-saving notepad.</p>
                    </div>
                </div>
                <div class="flex items-center gap-4 p-4 rounded-xl border border-[#333] bg-[#111]">
                    <div class="w-12 h-12 rounded bg-[var(--accent)] flex items-center justify-center text-white"><i class="fa-solid fa-image"></i></div>
                    <div>
                        <h4 class="font-bold font-dot uppercase">Photo Pro</h4>
                        <p class="text-xs text-gray-400">Advanced photo editor with filters.</p>
                    </div>
                </div>
                <div class="flex items-center gap-4 p-4 rounded-xl border border-[#333] bg-[#111]">
                    <div class="w-12 h-12 rounded bg-[#ff003c] flex items-center justify-center text-white"><i class="fa-solid fa-film"></i></div>
                    <div>
                        <h4 class="font-bold font-dot uppercase">Video Studio</h4>
                        <p class="text-xs text-gray-400">Professional timeline video editor.</p>
                    </div>
                </div>
                <div class="flex items-center gap-4 p-4 rounded-xl border border-[#333] bg-[#111]">
                    <div class="w-12 h-12 rounded bg-[#ff0055] flex items-center justify-center text-white"><i class="fa-solid fa-wave-square"></i></div>
                    <div>
                        <h4 class="font-bold font-dot uppercase">Sound Studio</h4>
                        <p class="text-xs text-gray-400">Spatial audio mixer and equalizer.</p>
                    </div>
                </div>
                <div class="flex items-center gap-4 p-4 rounded-xl border border-[#333] bg-[#111]">
                    <div class="w-12 h-12 rounded bg-[#ff4444] flex items-center justify-center text-white"><i class="fa-solid fa-comment-dots"></i></div>
                    <div>
                        <h4 class="font-bold font-dot uppercase">Talko</h4>
                        <p class="text-xs text-gray-400">Secure P2P chat application.</p>
                    </div>
                </div>
                <div class="flex items-center gap-4 p-4 rounded-xl border border-[#333] bg-[#111]">
                    <div class="w-12 h-12 rounded bg-[#8b5cf6] flex items-center justify-center text-white"><i class="fa-solid fa-wand-magic-sparkles"></i></div>
                    <div>
                        <h4 class="font-bold font-dot uppercase">Lumora</h4>
                        <p class="text-xs text-gray-400">AI Assistant powered by Gemini 3.0.</p>
                    </div>
                </div>
            </div>
        `,
        faq: `
            <h1 class="font-dot text-4xl mb-6">FAQ</h1>
            <div class="space-y-6">
                <details class="group rounded-xl border border-[#333] bg-[#111] open:bg-[#1a1a1a] transition">
                    <summary class="flex items-center justify-between p-4 cursor-pointer font-bold text-white list-none font-dot uppercase">
                        Is my data saved?
                        <span class="transition group-open:rotate-180"><i class="fa-solid fa-chevron-down"></i></span>
                    </summary>
                    <div class="px-4 pb-4 text-gray-400 text-sm leading-relaxed font-mono">
                        Yes, Lumo OS uses your browser's LocalStorage to save your installed apps, notes, and settings. 
                        Clearing your browser data will reset Lumo OS.
                    </div>
                </details>
                <details class="group rounded-xl border border-[#333] bg-[#111] open:bg-[#1a1a1a] transition">
                    <summary class="flex items-center justify-between p-4 cursor-pointer font-bold text-white list-none font-dot uppercase">
                        Can I install real apps?
                        <span class="transition group-open:rotate-180"><i class="fa-solid fa-chevron-down"></i></span>
                    </summary>
                    <div class="px-4 pb-4 text-gray-400 text-sm leading-relaxed font-mono">
                        Currently, Lumo OS only supports apps available in the Lumo Store. 
                        These are simulated web apps designed specifically for this environment.
                    </div>
                </details>
            </div>
        `,
        terms: `
            <h1 class="font-dot text-4xl mb-6">Terms of Service</h1>
            <div class="space-y-6 font-mono text-sm text-gray-400 leading-relaxed">
                <p>By using Lumo OS, you agree to the following terms:</p>
                
                <div class="p-4 border border-red-900/30 bg-red-900/10 rounded-xl">
                    <h3 class="text-white font-bold mb-2 font-dot uppercase text-lg">Prohibited Activities</h3>
                    <ul class="list-disc pl-5 space-y-2">
                        <li>Unauthorized access to system files or other user data.</li>
                        <li>Using the platform for any illegal activities.</li>
                        <li>Abuse of P2P communication features for harassment or distribution of illegal content.</li>
                        <li>Reverse engineering or modifying the core OS without authorization (except for permitted dev tools).</li>
                    </ul>
                </div>

                <p>
                    Lumo OS is provided "AS IS", without warranty of any kind. We are not responsible for any data loss or damages arising from the use of this software.
                </p>
            </div>
        `,
        privacy: `
            <h1 class="font-dot text-4xl mb-6">Privacy Policy</h1>
            <div class="space-y-6 font-mono text-sm text-gray-400 leading-relaxed">
                <p>Your privacy is important to us. Here is how we handle your data:</p>
                
                <div class="nothing-card">
                    <h3 class="text-white font-bold mb-2 font-dot uppercase text-lg">Data Storage</h3>
                    <p>
                        All your data (notes, settings, installed apps) is stored locally on your device using LocalStorage. 
                        We do not upload your personal files to any central server.
                    </p>
                </div>

                <div class="nothing-card">
                    <h3 class="text-white font-bold mb-2 font-dot uppercase text-lg">Communication</h3>
                    <p>
                        Communication features (like Talko) use direct P2P connections or temporary relays where applicable. 
                        <span class="text-[var(--accent)]">Administrators cannot view the content of your private messages.</span>
                        Your conversations are private and secure.
                    </p>
                </div>
            </div>
        `
    };

    const init = (win) => {
        const contentArea = win.querySelector('#help-content');
        const tabs = win.querySelectorAll('[data-help-tab]');

        const switchTab = (tabId) => {
            // Update content
            contentArea.innerHTML = contentMap[tabId] || contentMap.intro;
            contentArea.scrollTop = 0;

            // Update sidebar active state
            tabs.forEach(btn => {
                if (btn.dataset.helpTab === tabId) {
                    btn.classList.remove('hover:bg-[#111]', 'text-gray-400');
                    btn.classList.add('bg-[#222]', 'text-white');
                } else {
                    btn.classList.add('hover:bg-[#111]', 'text-gray-400');
                    btn.classList.remove('bg-[#222]', 'text-white');
                }
            });
        };

        tabs.forEach(btn => {
            btn.addEventListener('click', () => switchTab(btn.dataset.helpTab));
        });

        // Initial load
        switchTab('intro');
    };

    window.LumoHelp = { buildMarkup, init };
})();
