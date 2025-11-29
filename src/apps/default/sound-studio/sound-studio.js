(() => {
    // --- Audio Context & State ---
    let audioCtx;
    let sourceNode;
    let gainNode;
    let pannerNode;
    let analyserNode;
    let eqNodes = [];
    let audioBuffer = null;
    let isPlaying = false;
    let startTime = 0;
    let pauseTime = 0;
    let rafId;

    // Default State
    const state = {
        filters: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // Gains for 10 bands
        panner: { x: 0, z: 0 }, // Top-down view (x, z)
        volume: 1.0
    };

    const FREQUENCIES = [60, 170, 310, 600, 1000, 3000, 6000, 12000, 14000, 16000];
    const LABELS = ['60', '170', '310', '600', '1k', '3k', '6k', '12k', '14k', '16k'];

    // --- Helper: WAV Encoder ---
    const bufferToWave = (abuffer, len) => {
        let numOfChan = abuffer.numberOfChannels,
            length = len * numOfChan * 2 + 44,
            buffer = new ArrayBuffer(length),
            view = new DataView(buffer),
            channels = [], i, sample,
            offset = 0,
            pos = 0;

        const setUint16 = (data) => { view.setUint16(pos, data, true); pos += 2; };
        const setUint32 = (data) => { view.setUint32(pos, data, true); pos += 4; };

        setUint32(0x46464952); // "RIFF"
        setUint32(length - 8); // file length - 8
        setUint32(0x45564157); // "WAVE"

        setUint32(0x20746d66); // "fmt " chunk
        setUint32(16); // length = 16
        setUint16(1); // PCM (uncompressed)
        setUint16(numOfChan);
        setUint32(abuffer.sampleRate);
        setUint32(abuffer.sampleRate * 2 * numOfChan); // avg. bytes/sec
        setUint16(numOfChan * 2); // block-align
        setUint16(16); // 16-bit

        setUint32(0x61746164); // "data" - chunk
        setUint32(length - pos - 4); // chunk length

        for(i = 0; i < abuffer.numberOfChannels; i++) channels.push(abuffer.getChannelData(i));

        while(pos < length) {
            for(i = 0; i < numOfChan; i++) {
                // clamp and scale
                sample = Math.max(-1, Math.min(1, channels[i][offset / 2])); 
                sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0;
                view.setInt16(44 + offset * 2, sample, true);
                offset++;
            }
            // pos is updated by setInt16 logic manually here? No, just increment logic pos
            // Actually my logic above is slightly mixed. Let's fix the loop.
            // The pos variable tracks the header writing. After header, pos is 44.
            // We need to write data starting at 44.
        }
        // Re-implement simpler loop
        pos = 44;
        for (let frame = 0; frame < len; frame++) {
            for (let ch = 0; ch < numOfChan; ch++) {
                sample = channels[ch][frame];
                sample = Math.max(-1, Math.min(1, sample));
                sample = (sample < 0 ? sample * 32768 : sample * 32767) | 0;
                view.setInt16(pos, sample, true);
                pos += 2;
            }
        }

        return new Blob([buffer], { type: "audio/wav" });
    };

    // --- UI Builder ---
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
                    <input type="file" id="ss-file-input" accept="audio/*" class="hidden">
                    <button id="ss-load-btn" class="nothing-btn text-[10px] py-1 px-3">LOAD AUDIO</button>
                    <button id="ss-save-btn" class="nothing-btn text-[10px] py-1 px-3 hidden">SAVE & DOWNLOAD</button>
                    <div class="w-px h-4 bg-[var(--window-border)]"></div>
                    <div class="flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--input-bg)] border border-[var(--window-border)]">
                        <div id="ss-play-indicator" class="w-2 h-2 rounded-full bg-gray-500"></div>
                        <span class="text-xs font-dot text-[var(--text-muted)]">MASTER OUT</span>
                    </div>
                </div>
            </div>

            <!-- Main Interface -->
            <div class="flex-1 flex flex-col p-6 gap-6 overflow-y-auto bg-dot-matrix">
                
                <!-- Visualizer -->
                <div class="h-48 bg-[var(--card-bg)] rounded-xl border border-[var(--window-border)] relative overflow-hidden flex items-end justify-center gap-1 p-4" id="ss-visualizer">
                    ${Array(32).fill(0).map((_, i) => `<div class="w-2 bg-[var(--accent)] rounded-t-sm transition-all duration-75 bar-${i}" style="height: 5%"></div>`).join('')}
                    <div class="absolute top-4 left-4 text-[10px] font-dot text-[var(--text-muted)] uppercase tracking-wider">Visualizer // L-R</div>
                    
                    <!-- Play Controls Overlay -->
                    <div class="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black/20 backdrop-blur-[1px]">
                        <button id="ss-play-btn" class="w-16 h-16 rounded-full bg-[var(--accent)] text-black text-2xl flex items-center justify-center shadow-lg hover:scale-110 transition active:scale-95">
                            <i class="fa-solid fa-play"></i>
                        </button>
                    </div>
                </div>

                <!-- Controls Grid -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    <!-- Equalizer -->
                    <div class="nothing-card flex flex-col gap-4">
                        <div class="flex items-center justify-between mb-2">
                            <h3 class="font-dot text-lg uppercase">Equalizer</h3>
                            <button id="ss-eq-reset" class="nothing-btn text-[10px] py-0.5 px-2">RESET</button>
                        </div>
                        <div class="flex justify-between items-end h-32 gap-2 px-2">
                            ${FREQUENCIES.map((freq, i) => `
                                <div class="flex flex-col items-center gap-2 h-full group w-full">
                                    <div class="flex-1 w-1 bg-[var(--input-bg)] rounded-full relative cursor-ns-resize eq-slider-track" data-index="${i}">
                                        <div class="absolute bottom-0 left-0 w-full bg-[var(--accent)] rounded-full group-hover:bg-[var(--text-main)] transition pointer-events-none eq-fill-${i}" style="height: 50%"></div>
                                        <div class="absolute bottom-[50%] left-1/2 -translate-x-1/2 w-3 h-3 bg-[var(--card-bg)] border border-[var(--input-border)] rounded-full shadow-lg cursor-pointer hover:scale-125 hover:border-[var(--text-main)] transition eq-thumb-${i}"></div>
                                    </div>
                                    <span class="text-[10px] font-mono text-[var(--text-muted)]">${LABELS[i]}</span>
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
                        <div id="ss-spatial-pad" class="flex-1 bg-[var(--bg-dark)] rounded-xl border border-[var(--window-border)] relative flex items-center justify-center overflow-hidden group cursor-crosshair h-64">
                            <div class="absolute inset-0 opacity-20" style="background-image: radial-gradient(circle, var(--text-muted) 1px, transparent 1px); background-size: 20px 20px;"></div>
                            
                            <!-- Listener (Center) -->
                            <div class="absolute w-4 h-4 bg-[var(--text-muted)] rounded-full flex items-center justify-center z-10">
                                <i class="fa-solid fa-headphones text-[8px] text-black"></i>
                            </div>
                            <div class="absolute w-32 h-32 border border-[var(--window-border)] rounded-full pointer-events-none"></div>
                            <div class="absolute w-64 h-64 border border-[var(--window-border)] rounded-full pointer-events-none opacity-50"></div>

                            <!-- Source (Draggable) -->
                            <div id="ss-source-dot" class="absolute top-1/2 left-1/2 w-6 h-6 -ml-3 -mt-3 bg-[var(--accent)] rounded-full shadow-[0_0_15px_var(--accent)] cursor-move flex items-center justify-center z-20 transition-transform duration-75">
                                <div class="w-2 h-2 bg-black rounded-full"></div>
                                <div class="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-mono text-[var(--accent)] whitespace-nowrap pointer-events-none">SOURCE</div>
                            </div>
                        </div>
                        <div class="flex justify-between text-xs font-mono text-[var(--text-muted)]">
                            <span id="ss-pan-val">PAN: 0</span>
                            <span id="ss-dist-val">DIST: 0m</span>
                        </div>
                    </div>

                </div>
            </div>
            
            <!-- Status Overlay -->
            <div id="ss-status" class="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/80 text-white text-xs rounded-full backdrop-blur border border-white/10 hidden">
                Processing...
            </div>
        </div>
    `;

    const init = (win) => {
        // --- Elements ---
        const fileInput = win.querySelector('#ss-file-input');
        const loadBtn = win.querySelector('#ss-load-btn');
        const saveBtn = win.querySelector('#ss-save-btn');
        const playBtn = win.querySelector('#ss-play-btn');
        const playIcon = playBtn.querySelector('i');
        const playIndicator = win.querySelector('#ss-play-indicator');
        const eqResetBtn = win.querySelector('#ss-eq-reset');
        const spatialPad = win.querySelector('#ss-spatial-pad');
        const sourceDot = win.querySelector('#ss-source-dot');
        const panVal = win.querySelector('#ss-pan-val');
        const distVal = win.querySelector('#ss-dist-val');
        const statusEl = win.querySelector('#ss-status');
        const bars = Array.from(win.querySelectorAll('#ss-visualizer > div')).filter(d => d.classList.contains('bar-0') || d.className.includes('bar-'));

        // --- Audio Setup ---
        const initAudio = () => {
            if (!audioCtx) {
                audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                
                // Create Nodes
                gainNode = audioCtx.createGain();
                pannerNode = audioCtx.createPanner();
                analyserNode = audioCtx.createAnalyser();
                analyserNode.fftSize = 64; // Low resolution for retro look

                // Panner Config
                pannerNode.panningModel = 'HRTF';
                pannerNode.distanceModel = 'inverse';
                pannerNode.refDistance = 1;
                pannerNode.maxDistance = 10000;
                pannerNode.rolloffFactor = 1;
                pannerNode.coneInnerAngle = 360;
                pannerNode.coneOuterAngle = 0;
                pannerNode.coneOuterGain = 0;

                // EQ Setup
                eqNodes = FREQUENCIES.map(freq => {
                    const eq = audioCtx.createBiquadFilter();
                    eq.type = 'peaking';
                    eq.frequency.value = freq;
                    eq.Q.value = 1.4; // approx 1 octave bandwidth
                    eq.gain.value = 0;
                    return eq;
                });

                // Connect Chain: Source -> EQ[0] -> ... -> EQ[last] -> Panner -> Analyser -> Gain -> Destination
                // Source will be connected later
                
                // Chain EQs
                for (let i = 0; i < eqNodes.length - 1; i++) {
                    eqNodes[i].connect(eqNodes[i+1]);
                }
                
                // Connect last EQ to Panner
                eqNodes[eqNodes.length - 1].connect(pannerNode);
                
                // Panner to Analyser
                pannerNode.connect(analyserNode);
                
                // Analyser to Gain
                analyserNode.connect(gainNode);
                
                // Gain to Destination
                gainNode.connect(audioCtx.destination);
            }
        };

        // --- Logic ---

        const showStatus = (msg, duration = 2000) => {
            statusEl.innerText = msg;
            statusEl.classList.remove('hidden');
            if (duration) setTimeout(() => statusEl.classList.add('hidden'), duration);
        };

        const updateVisualizer = () => {
            if (!analyserNode || !isPlaying) return;
            const dataArray = new Uint8Array(analyserNode.frequencyBinCount);
            analyserNode.getByteFrequencyData(dataArray);

            bars.forEach((bar, i) => {
                if (i < dataArray.length) {
                    const h = (dataArray[i] / 255) * 100;
                    bar.style.height = Math.max(5, h) + '%';
                }
            });

            if (isPlaying) requestAnimationFrame(updateVisualizer);
        };

        const stopAudio = () => {
            if (sourceNode) {
                try { sourceNode.stop(); } catch(e) {}
                sourceNode.disconnect();
                sourceNode = null;
            }
            isPlaying = false;
            playIcon.className = 'fa-solid fa-play';
            playIndicator.classList.remove('animate-pulse', 'bg-[var(--accent)]');
            playIndicator.classList.add('bg-gray-500');
        };

        const playAudio = () => {
            if (!audioBuffer) return;
            initAudio();
            if (audioCtx.state === 'suspended') audioCtx.resume();

            // Stop existing
            stopAudio();

            sourceNode = audioCtx.createBufferSource();
            sourceNode.buffer = audioBuffer;
            
            // Connect Source to First EQ
            sourceNode.connect(eqNodes[0]);

            sourceNode.onended = () => {
                isPlaying = false;
                playIcon.className = 'fa-solid fa-play';
                playIndicator.classList.remove('animate-pulse', 'bg-[var(--accent)]');
                playIndicator.classList.add('bg-gray-500');
            };

            sourceNode.start(0);
            isPlaying = true;
            playIcon.className = 'fa-solid fa-stop';
            playIndicator.classList.add('animate-pulse', 'bg-[var(--accent)]');
            playIndicator.classList.remove('bg-gray-500');

            updateVisualizer();
        };

        // Load File
        loadBtn.onclick = () => fileInput.click();
        fileInput.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            showStatus('Loading Audio...');
            initAudio();
            
            const reader = new FileReader();
            reader.onload = async (evt) => {
                try {
                    const arrayBuffer = evt.target.result;
                    audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
                    showStatus('Audio Loaded');
                    saveBtn.classList.remove('hidden');
                    playAudio(); // Auto play
                } catch (err) {
                    console.error(err);
                    showStatus('Error loading audio');
                }
            };
            reader.readAsArrayBuffer(file);
        };

        playBtn.onclick = () => {
            if (isPlaying) stopAudio();
            else playAudio();
        };

        // EQ Controls
        const updateEQ = (index, val) => {
            // val is 0-1 (from track height percentage logic, wait need better drag)
            // Mapping 0-100% height to -12dB to +12dB
            // 50% is 0dB
            const db = (val - 0.5) * 24; 
            if (eqNodes[index]) eqNodes[index].gain.value = db;
            state.filters[index] = db;
        };

        win.querySelectorAll('.eq-slider-track').forEach((track, i) => {
            const updateFromEvent = (e) => {
                const rect = track.getBoundingClientRect();
                let y = 1 - (e.clientY - rect.top) / rect.height;
                y = Math.max(0, Math.min(1, y));
                
                // Update UI
                const fill = win.querySelector(`.eq-fill-${i}`);
                const thumb = win.querySelector(`.eq-thumb-${i}`);
                if (fill) fill.style.height = (y * 100) + '%';
                if (thumb) thumb.style.bottom = (y * 100) + '%';
                
                updateEQ(i, y);
            };

            track.addEventListener('mousedown', (e) => {
                updateFromEvent(e);
                const onMove = (ev) => updateFromEvent(ev);
                const onUp = () => {
                    document.removeEventListener('mousemove', onMove);
                    document.removeEventListener('mouseup', onUp);
                };
                document.addEventListener('mousemove', onMove);
                document.addEventListener('mouseup', onUp);
            });
        });

        eqResetBtn.onclick = () => {
            state.filters.fill(0);
            eqNodes.forEach((node, i) => {
                node.gain.value = 0;
                const fill = win.querySelector(`.eq-fill-${i}`);
                const thumb = win.querySelector(`.eq-thumb-${i}`);
                if (fill) fill.style.height = '50%';
                if (thumb) thumb.style.bottom = '50%';
            });
        };

        // Spatial Controls
        const updateSpatial = (x, z) => {
            // x, z are -1 to 1 relative to center
            // Map to panner coordinates (e.g., -10 to 10 units)
            const scale = 5;
            if (pannerNode) {
                pannerNode.positionX.value = x * scale;
                pannerNode.positionZ.value = z * scale;
                // Adjust volume based on distance slightly for effect (already handled by PannerNode inverse model)
            }
            state.panner = { x, z };
            
            panVal.innerText = `PAN: ${x.toFixed(2)}`;
            // Dist from 0,0
            const dist = Math.sqrt(x*x + z*z) * scale;
            distVal.innerText = `DIST: ${dist.toFixed(1)}m`;
        };

        spatialPad.addEventListener('mousedown', (e) => {
            const updatePos = (ev) => {
                const rect = spatialPad.getBoundingClientRect();
                const centerX = rect.width / 2;
                const centerY = rect.height / 2;
                let x = (ev.clientX - rect.left - centerX) / (rect.width / 2);
                let z = (ev.clientY - rect.top - centerY) / (rect.height / 2); // In WebAudio Z is depth. On screen Y maps to Z (top view)

                // Clamp to circle
                const dist = Math.sqrt(x*x + z*z);
                if (dist > 1) {
                    x /= dist;
                    z /= dist;
                }

                // Update UI Dot
                // x, z are -1 to 1. 
                // left = (x + 1)/2 * 100%
                // top = (z + 1)/2 * 100%
                sourceDot.style.left = ((x + 1) / 2 * 100) + '%';
                sourceDot.style.top = ((z + 1) / 2 * 100) + '%';

                updateSpatial(x, z); // In Panner: X is left/right, Z is front/back. Y is up/down (0).
                // Here Screen X -> Panner X
                // Screen Y -> Panner Z (Forward/Back)
            };

            updatePos(e);
            const onMove = (ev) => updatePos(ev);
            const onUp = () => {
                document.removeEventListener('mousemove', onMove);
                document.removeEventListener('mouseup', onUp);
            };
            document.addEventListener('mousemove', onMove);
            document.addEventListener('mouseup', onUp);
        });


        // Save & Download
        saveBtn.onclick = async () => {
            if (!audioBuffer) return;
            showStatus('Rendering...', 0);
            
            // Offline Rendering
            const offlineCtx = new OfflineAudioContext(
                audioBuffer.numberOfChannels,
                audioBuffer.length,
                audioBuffer.sampleRate
            );

            // Rebuild Graph in Offline Context
            const offSource = offlineCtx.createBufferSource();
            offSource.buffer = audioBuffer;

            const offEqs = FREQUENCIES.map((freq, i) => {
                const eq = offlineCtx.createBiquadFilter();
                eq.type = 'peaking';
                eq.frequency.value = freq;
                eq.Q.value = 1.4;
                eq.gain.value = state.filters[i] || 0;
                return eq;
            });

            const offPanner = offlineCtx.createPanner();
            offPanner.panningModel = 'HRTF';
            offPanner.distanceModel = 'inverse';
            offPanner.refDistance = 1;
            offPanner.maxDistance = 10000;
            offPanner.positionX.value = (state.panner.x || 0) * 5;
            offPanner.positionZ.value = (state.panner.z || 0) * 5;
            offPanner.positionY.value = 0;

            // Connect Offline
            offSource.connect(offEqs[0]);
            for (let i = 0; i < offEqs.length - 1; i++) offEqs[i].connect(offEqs[i+1]);
            offEqs[offEqs.length - 1].connect(offPanner);
            offPanner.connect(offlineCtx.destination);

            offSource.start(0);

            // Render
            try {
                const renderedBuffer = await offlineCtx.startRendering();
                const wavBlob = bufferToWave(renderedBuffer, renderedBuffer.length);
                const fileName = `mix_${Date.now()}.wav`;

                // 1. Save to Files (simulated)
                // Convert Blob to Base64 for localStorage (Window.FileSystem)
                // Warning: This might fail if file is huge.
                const reader = new FileReader();
                reader.onloadend = () => {
                    const base64data = reader.result; // includes data:audio/wav;base64,...
                    try {
                        // Check size - limit to ~4MB for localStorage safety
                        if (base64data.length < 4 * 1024 * 1024) {
                            if (window.FileSystem) {
                                window.FileSystem.createFile('media', fileName, 'audio/wav', base64data);
                                showStatus('Saved to Files & Downloaded');
                            }
                        } else {
                            showStatus('File too large for "Files" app - Downloading only');
                        }
                    } catch (e) {
                        console.error('Save failed', e);
                        showStatus('Save failed - Downloading only');
                    }
                };
                reader.readAsDataURL(wavBlob);

                // 2. Download
                const url = URL.createObjectURL(wavBlob);
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = url;
                a.download = fileName;
                document.body.appendChild(a);
                a.click();
                setTimeout(() => {
                    document.body.removeChild(a);
                    window.URL.revokeObjectURL(url);
                }, 100);

            } catch (e) {
                console.error(e);
                showStatus('Rendering Failed');
            }
        };
    };

    window.SoundStudio = { buildMarkup, init };
})();
