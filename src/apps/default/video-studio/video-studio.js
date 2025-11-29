window.VideoStudio = {
    buildMarkup() {
        return `
            <div class="flex flex-col h-full bg-[var(--bg-dark)] text-[var(--text-main)] font-sans select-none" id="vs-root">
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
                        <div class="flex-1 p-2 overflow-y-auto grid grid-cols-2 gap-2 content-start" id="vs-media-bin">
                            <!-- Mock Media Items -->
                            <div class="aspect-square bg-[var(--input-bg)] rounded border border-[var(--window-border)] flex items-center justify-center flex-col gap-1 hover:border-[var(--accent)] cursor-pointer group vs-media-item" data-name="clip_01.mp4" data-type="video">
                                <i class="fa-solid fa-video text-2xl text-blue-400 group-hover:scale-110 transition"></i>
                                <span class="text-[10px] truncate w-full text-center px-1 text-[var(--text-muted)]">clip_01.mp4</span>
                            </div>
                            <div class="aspect-square bg-[var(--input-bg)] rounded border border-[var(--window-border)] flex items-center justify-center flex-col gap-1 hover:border-[var(--accent)] cursor-pointer group vs-media-item" data-name="bg_main.png" data-type="image">
                                <i class="fa-solid fa-image text-2xl text-purple-400 group-hover:scale-110 transition"></i>
                                <span class="text-[10px] truncate w-full text-center px-1 text-[var(--text-muted)]">bg_main.png</span>
                            </div>
                             <div class="aspect-square bg-[var(--input-bg)] rounded border border-[var(--window-border)] flex items-center justify-center flex-col gap-1 hover:border-[var(--accent)] cursor-pointer group vs-media-item" data-name="track_01.wav" data-type="audio">
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
                                <div class="absolute inset-0 flex items-center justify-center text-gray-600 font-mono" id="vs-preview-screen">
                                    NO SIGNAL
                                </div>
                                <!-- Playhead Overlay -->
                                <div class="absolute top-0 bottom-0 left-1/2 w-[1px] bg-white/20"></div>
                            </div>
                        </div>
                        <!-- Transport Controls -->
                        <div class="h-12 bg-[var(--window-header)] border-t border-[var(--window-border)] flex items-center justify-center gap-6 text-[var(--text-muted)]">
                            <i class="fa-solid fa-backward-step hover:text-[var(--text-main)] cursor-pointer transition" id="vs-btn-prev"></i>
                            <i class="fa-solid fa-play text-[var(--text-main)] text-xl hover:text-[var(--accent)] cursor-pointer transition hover:scale-110" id="vs-btn-play"></i>
                            <i class="fa-solid fa-forward-step hover:text-[var(--text-main)] cursor-pointer transition" id="vs-btn-next"></i>
                        </div>
                    </div>

                    <!-- Right: Properties (Collapsed for now or simple) -->
                    <div class="w-64 bg-[var(--card-bg)] border-l border-[var(--window-border)] flex flex-col">
                         <div class="p-2 border-b border-[var(--window-border)] text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Effect Controls</div>
                         <div class="p-4 space-y-4">
                            <div class="space-y-1">
                                <label class="text-xs text-[var(--text-muted)] flex justify-between"><span>Opacity</span> <span id="vs-val-opacity">100%</span></label>
                                <input type="range" class="w-full h-1 bg-[var(--input-border)] rounded appearance-none accent-[var(--accent)]" min="0" max="100" value="100" id="vs-input-opacity">
                            </div>
                            <div class="space-y-1">
                                <label class="text-xs text-[var(--text-muted)] flex justify-between"><span>Scale</span> <span id="vs-val-scale">100%</span></label>
                                <input type="range" class="w-full h-1 bg-[var(--input-border)] rounded appearance-none accent-[var(--accent)]" min="0" max="200" value="100" id="vs-input-scale">
                            </div>
                             <div class="space-y-1">
                                <label class="text-xs text-[var(--text-muted)] flex justify-between"><span>Rotation</span> <span id="vs-val-rotation">0°</span></label>
                                <input type="range" class="w-full h-1 bg-[var(--input-border)] rounded appearance-none accent-[var(--accent)]" min="0" max="360" value="0" id="vs-input-rotation">
                            </div>
                         </div>
                    </div>
                </div>

                <!-- Bottom: Timeline -->
                <div class="h-64 bg-[var(--bg-dark)] border-t border-[var(--window-border)] flex flex-col">
                    <div class="h-6 bg-[var(--window-header)] border-b border-[var(--window-border)] flex items-center px-2 text-[10px] font-mono text-[var(--text-muted)] justify-between" id="vs-time-ruler">
                        <span class="w-24" id="vs-time-display">00:00:00</span>
                        <!-- Dynamic ticks could go here -->
                    </div>
                    <div class="flex-1 overflow-y-auto overflow-x-hidden relative p-2 space-y-1" id="vs-timeline-area">
                        <!-- Playhead Line -->
                        <div class="absolute top-0 bottom-0 left-2 w-[1px] bg-[var(--accent)] z-20 pointer-events-none transition-all duration-75" id="vs-playhead" style="left: 0px;">
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
        const root = win;
        const playBtn = root.querySelector('#vs-btn-play');
        const prevBtn = root.querySelector('#vs-btn-prev');
        const nextBtn = root.querySelector('#vs-btn-next');
        const timeDisplay = root.querySelector('#vs-time-display');
        const playhead = root.querySelector('#vs-playhead');
        const timelineArea = root.querySelector('#vs-timeline-area');
        const previewScreen = root.querySelector('#vs-preview-screen');
        const mediaItems = root.querySelectorAll('.vs-media-item');
        
        // Properties
        const inputOpacity = root.querySelector('#vs-input-opacity');
        const valOpacity = root.querySelector('#vs-val-opacity');
        const inputScale = root.querySelector('#vs-input-scale');
        const valScale = root.querySelector('#vs-val-scale');
        const inputRotation = root.querySelector('#vs-input-rotation');
        const valRotation = root.querySelector('#vs-val-rotation');

        let isPlaying = false;
        let currentTime = 0; // in seconds
        let duration = 60; // 1 minute mock duration
        let animationFrame;
        let lastTime = 0;

        // Helper: Format Time
        const formatTime = (s) => {
            const date = new Date(s * 1000);
            const hh = date.getUTCHours().toString().padStart(2, '0');
            const mm = date.getUTCMinutes().toString().padStart(2, '0');
            const ss = date.getUTCSeconds().toString().padStart(2, '0');
            const ms = Math.floor(date.getUTCMilliseconds() / 10).toString().padStart(2, '0');
            return `${hh}:${mm}:${ss}:${ms}`;
        };

        // Update UI
        const updateUI = () => {
            timeDisplay.innerText = formatTime(currentTime);
            
            // Move Playhead (Simple pixel mapping: 1 sec = 20px roughly for demo)
            // Let's base it on percentage for now relative to 60s
            const percent = (currentTime / duration) * 100;
            // Or just map to width of container. Let's assume 100% width = 60s
            if (timelineArea) {
                const width = timelineArea.clientWidth;
                const px = (currentTime / duration) * width;
                playhead.style.left = `${Math.max(0, px)}px`;
            }
        };

        // Play Loop
        const loop = (timestamp) => {
            if (!isPlaying) return;
            if (!document.body.contains(root)) {
                isPlaying = false;
                return;
            }
            if (!lastTime) lastTime = timestamp;
            const delta = (timestamp - lastTime) / 1000;
            lastTime = timestamp;

            currentTime += delta;
            if (currentTime >= duration) {
                currentTime = 0; // Loop
            }

            updateUI();
            animationFrame = requestAnimationFrame(loop);
        };

        // Event Listeners
        playBtn.addEventListener('click', () => {
            isPlaying = !isPlaying;
            if (isPlaying) {
                playBtn.className = 'fa-solid fa-pause text-[var(--text-main)] text-xl hover:text-[var(--accent)] cursor-pointer transition hover:scale-110';
                lastTime = 0;
                animationFrame = requestAnimationFrame(loop);
            } else {
                playBtn.className = 'fa-solid fa-play text-[var(--text-main)] text-xl hover:text-[var(--accent)] cursor-pointer transition hover:scale-110';
                cancelAnimationFrame(animationFrame);
            }
        });

        prevBtn.addEventListener('click', () => {
            currentTime = 0;
            updateUI();
        });

        nextBtn.addEventListener('click', () => {
            currentTime = Math.min(currentTime + 5, duration);
            updateUI();
        });

        // Media Bin Click
        mediaItems.forEach(item => {
            item.addEventListener('click', () => {
                const name = item.dataset.name;
                const type = item.dataset.type;
                
                // Visual selection
                mediaItems.forEach(i => i.classList.remove('border-[var(--accent)]'));
                item.classList.add('border-[var(--accent)]');

                // Update Preview
                previewScreen.innerHTML = '';
                if (type === 'video') {
                    previewScreen.innerHTML = `<i class="fa-solid fa-video text-4xl text-blue-500 mb-2"></i><div class="text-xs">${name}</div>`;
                } else if (type === 'image') {
                    previewScreen.innerHTML = `<i class="fa-solid fa-image text-4xl text-purple-500 mb-2"></i><div class="text-xs">${name}</div>`;
                } else if (type === 'audio') {
                    previewScreen.innerHTML = `<i class="fa-solid fa-music text-4xl text-green-500 mb-2"></i><div class="text-xs">${name}</div>`;
                }
            });
        });

        // Property Inputs
        const updateProp = (input, display, suffix = '') => {
            input.addEventListener('input', (e) => {
                display.innerText = `${e.target.value}${suffix}`;
                // In a real app, this would update the selected clip's properties
            });
        };

        updateProp(inputOpacity, valOpacity, '%');
        updateProp(inputScale, valScale, '%');
        updateProp(inputRotation, valRotation, '°');

        // Timeline Click (Seek)
        timelineArea.addEventListener('click', (e) => {
            const rect = timelineArea.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const width = rect.width;
            const percent = Math.max(0, Math.min(1, x / width));
            currentTime = percent * duration;
            updateUI();
        });
    }
};
