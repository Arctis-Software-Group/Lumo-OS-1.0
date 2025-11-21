window.VideoStudio = {
    buildMarkup() {
        return `
            <div class="flex flex-col h-full bg-[var(--bg-dark)] text-[var(--text-main)] font-sans select-none">
                <!-- Menu Bar -->
                <div class="h-8 bg-[var(--window-header)] border-b border-[var(--window-border)] flex items-center px-3 gap-4 text-xs text-[var(--text-muted)]">
                    <span class="hover:text-[var(--text-main)] cursor-pointer">File</span>
                    <span class="hover:text-[var(--text-main)] cursor-pointer">Edit</span>
                    <span class="hover:text-[var(--text-main)] cursor-pointer">Clip</span>
                    <span class="hover:text-[var(--text-main)] cursor-pointer">Sequence</span>
                    <div class="flex-1"></div>
                    <span class="text-[var(--accent)] font-bold">Lumo Video Studio Pro</span>
                </div>

                <!-- Main Workspace -->
                <div class="flex-1 flex overflow-hidden">
                    <!-- Left: Media Bin -->
                    <div class="w-64 bg-[var(--card-bg)] border-r border-[var(--window-border)] flex flex-col">
                        <div class="p-2 border-b border-[var(--window-border)] text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Project Media</div>
                        <div class="flex-1 p-2 overflow-y-auto grid grid-cols-2 gap-2 content-start">
                            <!-- Mock Media Items -->
                            <div class="aspect-square bg-[var(--input-bg)] rounded border border-[var(--window-border)] flex items-center justify-center flex-col gap-1 hover:border-[var(--accent)] cursor-pointer group">
                                <i class="fa-solid fa-video text-2xl text-blue-400 group-hover:scale-110 transition"></i>
                                <span class="text-[10px] truncate w-full text-center px-1 text-[var(--text-muted)]">clip_01.mp4</span>
                            </div>
                            <div class="aspect-square bg-[var(--input-bg)] rounded border border-[var(--window-border)] flex items-center justify-center flex-col gap-1 hover:border-[var(--accent)] cursor-pointer group">
                                <i class="fa-solid fa-image text-2xl text-purple-400 group-hover:scale-110 transition"></i>
                                <span class="text-[10px] truncate w-full text-center px-1 text-[var(--text-muted)]">bg_main.png</span>
                            </div>
                             <div class="aspect-square bg-[var(--input-bg)] rounded border border-[var(--window-border)] flex items-center justify-center flex-col gap-1 hover:border-[var(--accent)] cursor-pointer group">
                                <i class="fa-solid fa-music text-2xl text-green-400 group-hover:scale-110 transition"></i>
                                <span class="text-[10px] truncate w-full text-center px-1 text-[var(--text-muted)]">track_01.wav</span>
                            </div>
                        </div>
                    </div>

                    <!-- Center: Preview -->
                    <div class="flex-1 flex flex-col bg-black"> <!-- Preview area stays black usually -->
                        <div class="flex-1 flex items-center justify-center relative overflow-hidden">
                            <!-- Mock Video Player -->
                            <div class="aspect-video w-[90%] bg-[#050505] border border-[#333] relative shadow-2xl">
                                <div class="absolute inset-0 flex items-center justify-center text-gray-600 font-mono">
                                    NO SIGNAL
                                </div>
                                <!-- Playhead Overlay -->
                                <div class="absolute top-0 bottom-0 left-1/2 w-[1px] bg-white/20"></div>
                            </div>
                        </div>
                        <!-- Transport Controls -->
                        <div class="h-12 bg-[var(--window-header)] border-t border-[var(--window-border)] flex items-center justify-center gap-6 text-[var(--text-muted)]">
                            <i class="fa-solid fa-backward-step hover:text-[var(--text-main)] cursor-pointer transition"></i>
                            <i class="fa-solid fa-play text-[var(--text-main)] text-xl hover:text-[var(--accent)] cursor-pointer transition hover:scale-110"></i>
                            <i class="fa-solid fa-forward-step hover:text-[var(--text-main)] cursor-pointer transition"></i>
                        </div>
                    </div>

                    <!-- Right: Properties (Collapsed for now or simple) -->
                    <div class="w-64 bg-[var(--card-bg)] border-l border-[var(--window-border)] flex flex-col">
                         <div class="p-2 border-b border-[var(--window-border)] text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Effect Controls</div>
                         <div class="p-4 space-y-4">
                            <div class="space-y-1">
                                <label class="text-xs text-[var(--text-muted)]">Opacity</label>
                                <input type="range" class="w-full h-1 bg-[var(--input-border)] rounded appearance-none accent-[var(--accent)]">
                            </div>
                            <div class="space-y-1">
                                <label class="text-xs text-[var(--text-muted)]">Scale</label>
                                <input type="range" class="w-full h-1 bg-[var(--input-border)] rounded appearance-none accent-[var(--accent)]">
                            </div>
                             <div class="space-y-1">
                                <label class="text-xs text-[var(--text-muted)]">Rotation</label>
                                <input type="range" class="w-full h-1 bg-[var(--input-border)] rounded appearance-none accent-[var(--accent)]">
                            </div>
                         </div>
                    </div>
                </div>

                <!-- Bottom: Timeline -->
                <div class="h-64 bg-[var(--bg-dark)] border-t border-[var(--window-border)] flex flex-col">
                    <div class="h-6 bg-[var(--window-header)] border-b border-[var(--window-border)] flex items-center px-2 text-[10px] font-mono text-[var(--text-muted)]">
                        <span class="w-24">00:00:00</span>
                        <span class="w-24">00:00:15</span>
                        <span class="w-24">00:00:30</span>
                        <span class="w-24">00:00:45</span>
                        <span class="w-24">00:01:00</span>
                    </div>
                    <div class="flex-1 overflow-y-auto overflow-x-hidden relative p-2 space-y-1">
                        <!-- Playhead Line -->
                        <div class="absolute top-0 bottom-0 left-1/2 w-[1px] bg-[var(--accent)] z-10 pointer-events-none">
                            <div class="w-3 h-3 -ml-1.5 bg-[var(--accent)] transform rotate-45 -mt-1.5"></div>
                        </div>

                        <!-- Track V1 -->
                        <div class="h-16 bg-[var(--card-bg)] rounded border border-[var(--window-border)] relative w-full overflow-hidden group">
                            <div class="absolute left-0 top-0 bottom-0 w-24 bg-[var(--input-bg)] border-r border-[var(--window-border)] flex items-center justify-center text-xs font-bold text-[var(--text-muted)] z-10">V1</div>
                            <!-- Clip -->
                            <div class="absolute left-[10%] top-1 bottom-1 w-[30%] bg-blue-900/40 border border-blue-500/50 rounded flex items-center justify-center text-xs text-blue-200 overflow-hidden whitespace-nowrap px-2 hover:bg-blue-900/60 cursor-move">
                                clip_01.mp4
                            </div>
                             <div class="absolute left-[45%] top-1 bottom-1 w-[20%] bg-purple-900/40 border border-purple-500/50 rounded flex items-center justify-center text-xs text-purple-200 overflow-hidden whitespace-nowrap px-2 hover:bg-purple-900/60 cursor-move">
                                title_card
                            </div>
                        </div>

                        <!-- Track A1 -->
                        <div class="h-12 bg-[var(--card-bg)] rounded border border-[var(--window-border)] relative w-full overflow-hidden mt-2">
                            <div class="absolute left-0 top-0 bottom-0 w-24 bg-[var(--input-bg)] border-r border-[var(--window-border)] flex items-center justify-center text-xs font-bold text-[var(--text-muted)] z-10">A1</div>
                             <!-- Clip -->
                            <div class="absolute left-[10%] top-1 bottom-1 w-[60%] bg-green-900/40 border border-green-500/50 rounded flex items-center justify-center text-xs text-green-200 overflow-hidden whitespace-nowrap px-2 hover:bg-green-900/60 cursor-move">
                                background_music.wav
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    init(win) {
        // Init logic if needed
    }
};
