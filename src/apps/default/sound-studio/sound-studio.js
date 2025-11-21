(() => {
    const buildMarkup = () => `
        <div class="flex-1 flex flex-col bg-[var(--bg-dark)] text-[var(--text-main)] font-sans relative overflow-hidden">
            <!-- Header -->
            <div class="h-14 border-b border-[var(--window-border)] flex items-center justify-between px-6 bg-[var(--window-header)] backdrop-blur-md">
                <div class="flex items-center gap-3">
                    <div class="w-6 h-6 bg-[var(--accent)] rounded-full flex items-center justify-center text-black text-xs font-bold">
                        <i class="fa-solid fa-wave-square"></i>
                    </div>
                    <span class="font-dot tracking-widest uppercase text-sm">Sound Studio</span>
                </div>
                <div class="flex items-center gap-4">
                    <div class="flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--input-bg)] border border-[var(--window-border)]">
                        <div class="w-2 h-2 rounded-full bg-[var(--accent)] animate-pulse"></div>
                        <span class="text-xs font-dot text-[var(--text-muted)]">MASTER OUT</span>
                    </div>
                </div>
            </div>

            <!-- Main Interface -->
            <div class="flex-1 flex flex-col p-6 gap-6 overflow-y-auto bg-dot-matrix">
                
                <!-- Visualizer -->
                <div class="h-48 bg-[var(--card-bg)] rounded-xl border border-[var(--window-border)] relative overflow-hidden flex items-end justify-center gap-1 p-4" id="ss-visualizer">
                    ${Array(32).fill(0).map(() => `<div class="w-2 bg-[var(--accent)] rounded-t-sm transition-all duration-75" style="height: ${Math.random() * 100}%"></div>`).join('')}
                    <div class="absolute top-4 left-4 text-[10px] font-dot text-[var(--text-muted)] uppercase tracking-wider">Visualizer // L-R</div>
                </div>

                <!-- Controls Grid -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    <!-- Equalizer -->
                    <div class="nothing-card flex flex-col gap-4">
                        <div class="flex items-center justify-between mb-2">
                            <h3 class="font-dot text-lg uppercase">Equalizer</h3>
                            <button class="nothing-btn text-[10px] py-0.5 px-2">RESET</button>
                        </div>
                        <div class="flex justify-between items-end h-32 gap-2">
                            ${[60, 170, 310, 600, '1k', '3k', '6k', '12k', '14k', '16k'].map(freq => `
                                <div class="flex flex-col items-center gap-2 h-full group">
                                    <div class="flex-1 w-1 bg-[var(--input-bg)] rounded-full relative">
                                        <div class="absolute bottom-0 left-0 w-full bg-[var(--accent)] rounded-full group-hover:bg-[var(--text-main)] transition" style="height: 50%"></div>
                                        <div class="absolute bottom-[50%] left-1/2 -translate-x-1/2 w-3 h-3 bg-[var(--card-bg)] border border-[var(--input-border)] rounded-full shadow-lg cursor-pointer hover:scale-125 hover:border-[var(--text-main)] transition"></div>
                                    </div>
                                    <span class="text-[10px] font-mono text-[var(--text-muted)]">${freq}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>

                    <!-- Spatializer -->
                    <div class="nothing-card flex flex-col gap-4">
                        <div class="flex items-center justify-between mb-2">
                            <h3 class="font-dot text-lg uppercase">Spatial Audio</h3>
                            <div class="w-8 h-4 bg-[var(--accent)] rounded-full relative cursor-pointer">
                                <div class="absolute right-0.5 top-0.5 w-3 h-3 bg-white rounded-full shadow-sm"></div>
                            </div>
                        </div>
                        <div class="flex-1 bg-[var(--bg-dark)] rounded-xl border border-[var(--window-border)] relative flex items-center justify-center overflow-hidden group cursor-crosshair">
                            <div class="absolute inset-0 opacity-20" style="background-image: radial-gradient(circle, var(--text-muted) 1px, transparent 1px); background-size: 20px 20px;"></div>
                            <div class="w-32 h-32 border border-[var(--window-border)] rounded-full flex items-center justify-center">
                                <i class="fa-solid fa-user text-[var(--text-muted)]"></i>
                            </div>
                            <div class="absolute top-1/4 left-1/4 w-4 h-4 bg-[var(--accent)] rounded-full shadow-[0_0_15px_var(--accent)] animate-pulse">
                                <div class="absolute -top-6 -left-4 text-[10px] font-mono text-[var(--accent)] whitespace-nowrap">SOURCE A</div>
                            </div>
                        </div>
                        <div class="flex justify-between text-xs font-mono text-[var(--text-muted)]">
                            <span>PAN: L30</span>
                            <span>DIST: 2.5m</span>
                            <span>REV: 40%</span>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    `;

    const init = (win) => {
        // Simulate visualizer animation
        const bars = win.querySelectorAll('#ss-visualizer > div');
        setInterval(() => {
            bars.forEach(bar => {
                bar.style.height = Math.max(10, Math.random() * 100) + '%';
            });
        }, 100);
    };

    window.SoundStudio = { buildMarkup, init };
})();
