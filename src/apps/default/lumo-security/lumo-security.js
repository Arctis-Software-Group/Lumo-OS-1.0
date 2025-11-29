if (!window.LumoSecurityClass) {
    class LumoSecurity {
        constructor() {
            this.id = 'lumo-security';
            this.activeTab = 'scanner'; // scanner, lock, home
            this.isScanning = false;
            this.lockedApps = JSON.parse(localStorage.getItem('lumo_security_locked_apps') || '[]');
            
            // Home Security State
            this.securityMode = 'idle'; // idle, child, parent
            this.motionThreshold = 40; // Increased sensitivity slightly (lower number = more sensitive, wait logic is reversed in diff)
            // Actually logic is: score > threshold. So lower threshold = more sensitive.
            // Previous was 50. Let's keep 50 but allow config? 50 is fine.
            
            this.lastFrameData = null;
            this.isAlarmActive = false;
            this.cameraStream = null;
            this.checkInterval = null;

            // P2P State
            this.deviceCode = localStorage.getItem('lumo_sec_code') || Math.random().toString(36).substr(2, 6).toUpperCase();
            localStorage.setItem('lumo_sec_code', this.deviceCode);
            this.peer = null;
            this.conn = null; // Data connection
            this.call = null; // Media connection
            this.remoteStream = null;
            this.reconnectInterval = null;
            
            this.loadPeerJS();
        }

        loadPeerJS() {
            if (window.Peer) {
                this.initPeer();
                return;
            }
            const script = document.createElement('script');
            script.src = 'https://unpkg.com/peerjs@1.5.4/dist/peerjs.min.js';
            script.onload = () => this.initPeer();
            document.head.appendChild(script);
        }

        initPeer() {
            if (!window.Peer) return;
            if (this.peer && !this.peer.destroyed) return;
            
            const peerId = `lumo-sec-${this.deviceCode}`;
            console.log('Initializing Peer with ID:', peerId);

            this.peer = new Peer(peerId, {
                debug: 1
            });

            this.peer.on('open', (id) => {
                console.log('LumoSecurity Peer ID:', id);
                const statusEl = document.getElementById('p2p-status');
                if (statusEl) {
                    statusEl.innerText = 'Online';
                    statusEl.classList.remove('text-gray-600');
                    statusEl.classList.add('text-green-500');
                }
                this.updateDeviceCodeUI();
            });

            this.peer.on('connection', (conn) => {
                console.log('Incoming connection from:', conn.peer);
                this.conn = conn;
                this.setupDataConnection();
                
                if (this.securityMode === 'child') {
                    const status = document.getElementById('motion-status');
                    if (status) status.innerText = "CONNECTED TO PANEL";
                    
                    // Auto-call back if needed, but usually parent calls child for stream
                    // In this design, Parent Connects -> Parent Calls Child
                }
            });

            this.peer.on('call', (call) => {
                console.log('Incoming call from:', call.peer);
                if (this.securityMode === 'child') {
                    this.answerCall(call);
                }
            });

            this.peer.on('disconnected', () => {
                console.log('Peer disconnected.');
                if (this.peer && !this.peer.destroyed) {
                    this.peer.reconnect();
                }
            });

            this.peer.on('error', (err) => {
                console.error('Peer error:', err);
                
                if (err.type === 'unavailable-id' || err.message.includes('is taken')) {
                    console.warn('Device ID is taken. Generating new ID...');
                    this.deviceCode = Math.random().toString(36).substr(2, 6).toUpperCase();
                    localStorage.setItem('lumo_sec_code', this.deviceCode);
                    this.updateDeviceCodeUI();
                    
                    if (this.peer) {
                        this.peer.destroy();
                        this.peer = null;
                    }
                    setTimeout(() => this.initPeer(), 500);
                    return;
                }
            });
            
            if (!this.unloadListener) {
                this.unloadListener = () => {
                    if (this.peer) this.peer.destroy();
                };
                window.addEventListener('beforeunload', this.unloadListener);
            }
        }

        updateDeviceCodeUI() {
            const idDisplays = document.querySelectorAll('.lumo-device-id-display');
            idDisplays.forEach(el => el.innerText = this.deviceCode);
        }

        setupDataConnection() {
            if (!this.conn) return;
            
            this.conn.on('open', () => {
                console.log('Data connection opened');
                // Send current state
                if (this.isAlarmActive) {
                    this.conn.send({ type: 'alarm', kind: 'sync' });
                }
            });

            this.conn.on('data', (data) => {
                console.log('Received data:', data);
                if (data.type === 'alarm') {
                    this.triggerAlarm(true, data.kind);
                } else if (data.type === 'stop_alarm') {
                    this.stopAlarm(true);
                }
            });

            this.conn.on('close', () => {
                console.log('Data connection closed');
                if (this.securityMode === 'parent') {
                    // alert('Camera Device Disconnected');
                    // Don't alert, just update status
                    const status = document.getElementById('parent-status-text');
                    if (status) status.innerText = "DISCONNECTED";
                }
            });
        }

        answerCall(call) {
            const getStream = async () => {
                try {
                    return await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: true });
                } catch (e) {
                    console.warn('Env camera failed, trying default', e);
                    return await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                }
            };

            getStream().then(stream => {
                this.cameraStream = stream;
                call.answer(stream);
                this.call = call;
                
                const video = document.getElementById('security-cam');
                if (video) {
                    video.srcObject = stream;
                    video.play().catch(e => console.error("Video play failed", e));
                }
                
                this.startMotionDetection();

                // Handle call close
                call.on('close', () => {
                    this.stopCamera();
                });
            }).catch(err => {
                console.error('Failed to get stream for call', err);
            });
        }

        connectToChild(targetCode) {
            if (!this.peer) return alert('P2P Service not ready');
            
            const targetId = `lumo-sec-${targetCode}`;
            const btn = document.querySelector('#connect-btn');
            if (btn) {
                btn.innerText = 'Connecting...';
                btn.disabled = true;
            }
            
            // 1. Data Connection
            this.conn = this.peer.connect(targetId);
            this.setupDataConnection();
            
            this.conn.on('open', () => {
                console.log('Connected to child, starting call...');
                // 2. Media Call
                navigator.mediaDevices.getUserMedia({ video: false, audio: true })
                    .then(stream => {
                        this.call = this.peer.call(targetId, stream);
                        this.handleStream(this.call);
                    })
                    .catch(e => {
                        console.log('Mic failed, calling with dummy stream');
                        this.call = this.peer.call(targetId, this.createDummyStream());
                        this.handleStream(this.call);
                    });
            });
            
            this.conn.on('error', (err) => {
                alert('Connection Failed: ' + err);
                if (btn) {
                    btn.innerText = 'CONNECT';
                    btn.disabled = false;
                }
            });
            
            // Timeout backup
            setTimeout(() => {
                if (btn && btn.innerText === 'Connecting...') {
                    btn.innerText = 'Retry';
                    btn.disabled = false;
                }
            }, 10000);
        }
        
        createDummyStream() {
            const ctx = new AudioContext();
            const osc = ctx.createOscillator();
            const dst = ctx.createMediaStreamDestination();
            osc.connect(dst);
            osc.start();
            return dst.stream;
        }

        handleStream(call) {
            call.on('stream', (remoteStream) => {
                console.log('Received remote stream');
                this.remoteStream = remoteStream;
                // Force update parent view
                if (this.securityMode === 'parent') {
                    this.switchTab('home');
                }
            });
            
            call.on('close', () => {
                this.call = null;
                this.remoteStream = null;
                const status = document.getElementById('parent-status-text');
                if (status) status.innerText = "STREAM ENDED";
            });
            
            call.on('error', (e) => {
                console.error('Call error', e);
            });
        }

        buildMarkup() {
            return `
                <div class="flex flex-col h-full bg-black text-white font-sans overflow-hidden select-none relative">
                    <!-- Header -->
                    <div class="h-14 border-b border-white/20 flex items-center justify-between px-4 shrink-0 bg-black/50 backdrop-blur-md z-30">
                        <div class="flex items-center gap-3">
                            <div class="w-8 h-8 rounded-full bg-white flex items-center justify-center text-black">
                                <i class="fa-solid fa-shield-halved"></i>
                            </div>
                            <span class="font-dot text-lg tracking-widest uppercase">Lumo Security <span class="text-[10px] bg-white text-black px-1 rounded ml-1">ALPHA</span></span>
                        </div>
                        <div class="flex gap-1 bg-white/10 p-1 rounded-lg">
                            <button onclick="window.LumoSecurityApp.switchTab('scanner')" id="tab-scanner" class="px-3 py-1 rounded text-xs font-dot uppercase transition-colors ${this.activeTab === 'scanner' ? 'bg-white text-black' : 'hover:bg-white/5 text-gray-400'}">Integrity</button>
                            <button onclick="window.LumoSecurityApp.switchTab('lock')" id="tab-lock" class="px-3 py-1 rounded text-xs font-dot uppercase transition-colors ${this.activeTab === 'lock' ? 'bg-white text-black' : 'hover:bg-white/5 text-gray-400'}">App Lock</button>
                            <button onclick="window.LumoSecurityApp.switchTab('home')" id="tab-home" class="px-3 py-1 rounded text-xs font-dot uppercase transition-colors ${this.activeTab === 'home' ? 'bg-white text-black' : 'hover:bg-white/5 text-gray-400'}">Home</button>
                        </div>
                    </div>

                    <!-- Content Area -->
                    <div id="security-content" class="flex-1 overflow-hidden relative">
                        ${this.renderActiveTab()}
                    </div>
                </div>
            `;
        }

        renderActiveTab() {
            switch (this.activeTab) {
                case 'scanner': return this.renderScanner();
                case 'lock': return this.renderLock();
                case 'home': return this.renderHome();
                default: return this.renderScanner();
            }
        }

        switchTab(tab) {
            this.activeTab = tab;
            if (tab !== 'home') {
                this.stopCamera(); 
            }
            
            const content = document.getElementById('security-content');
            if (content) {
                content.innerHTML = this.renderActiveTab();
                this.updateTabButtons();
                
                if (tab === 'home') {
                     if (this.securityMode === 'child') this.startChildMode();
                     if (this.securityMode === 'parent' && this.remoteStream) {
                         setTimeout(() => {
                             const video = document.getElementById('parent-cam-feed');
                             if (video) {
                                 video.srcObject = this.remoteStream;
                                 video.play().catch(e => console.error("Parent video play error", e));
                             }
                         }, 100);
                     }
                }
            }
        }

        updateTabButtons() {
            ['scanner', 'lock', 'home'].forEach(t => {
                const btn = document.getElementById(`tab-${t}`);
                if (btn) {
                    btn.className = `px-3 py-1 rounded text-xs font-dot uppercase transition-colors ${this.activeTab === t ? 'bg-white text-black' : 'hover:bg-white/5 text-gray-400'}`;
                }
            });
        }

        // --- Scanner Logic ---
        renderScanner() {
            return `
                <div class="flex flex-col items-center justify-center h-full p-8 text-center relative overflow-hidden">
                    <div class="absolute inset-0 opacity-20" style="background-image: radial-gradient(#333 1px, transparent 1px); background-size: 20px 20px;"></div>
                    
                    <div id="scanner-status-icon" class="w-32 h-32 rounded-full border border-dashed border-white/30 flex items-center justify-center mb-8 relative">
                        <i class="fa-solid fa-code text-4xl text-gray-500"></i>
                        <div id="scanner-ring" class="absolute inset-0 rounded-full border-2 border-transparent border-t-white animate-spin hidden"></div>
                    </div>
                    
                    <h2 id="scanner-title" class="text-2xl font-dot uppercase mb-2">System Integrity</h2>
                    <p id="scanner-desc" class="text-gray-500 font-mono text-xs mb-8 max-w-md">Scan generated applications for malicious code patterns, infinite loops, and eval() usage.</p>
                    
                    <button onclick="window.LumoSecurityApp.startScan()" id="scan-btn" class="group relative px-8 py-3 bg-white text-black font-dot font-bold uppercase tracking-wider hover:bg-gray-200 transition-all overflow-hidden">
                        <span class="relative z-10">Start Scan</span>
                        <div class="absolute inset-0 bg-[var(--accent)] translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                    </button>

                    <div id="scan-results" class="w-full max-w-lg mt-8 text-left hidden max-h-48 overflow-y-auto font-mono text-xs space-y-2 bg-white/5 p-4 rounded border border-white/10">
                    </div>
                </div>
            `;
        }

        startScan() {
            if (this.isScanning) return;
            this.isScanning = true;
            
            const icon = document.getElementById('scanner-status-icon');
            const ring = document.getElementById('scanner-ring');
            const btn = document.getElementById('scan-btn');
            const results = document.getElementById('scan-results');
            const title = document.getElementById('scanner-title');
            
            ring.classList.remove('hidden');
            btn.disabled = true;
            btn.style.opacity = '0.5';
            results.innerHTML = '';
            results.classList.remove('hidden');
            title.innerText = "SCANNING...";
            
            const apps = JSON.parse(localStorage.getItem('lumo_generated_apps') || '[]');
            let issuesFound = 0;
            
            const addLog = (msg, type = 'info') => {
                const div = document.createElement('div');
                div.className = type === 'error' ? 'text-red-400' : (type === 'success' ? 'text-green-400' : 'text-gray-400');
                div.innerHTML = `<span class="opacity-50 mr-2">[${new Date().toLocaleTimeString()}]</span> ${msg}`;
                results.appendChild(div);
                results.scrollTop = results.scrollHeight;
            };

            addLog(`Found ${apps.length} generated apps to scan...`);

            let i = 0;
            const scanNext = () => {
                if (i >= apps.length) {
                    this.isScanning = false;
                    ring.classList.add('hidden');
                    btn.disabled = false;
                    btn.style.opacity = '1';
                    title.innerText = issuesFound > 0 ? "THREATS DETECTED" : "SYSTEM SECURE";
                    icon.style.borderColor = issuesFound > 0 ? '#ef4444' : '#22c55e';
                    addLog(`Scan complete. ${issuesFound} issues found.`, issuesFound > 0 ? 'error' : 'success');
                    return;
                }

                const app = apps[i];
                addLog(`Scanning: ${app.name}...`);
                
                setTimeout(() => {
                    const code = app.code || '';
                    let appIssues = [];
                    
                    if (code.includes('eval(')) appIssues.push('Unsafe eval() detected');
                    if (code.match(/while\s*\(\s*true\s*\)/)) appIssues.push('Potential infinite loop (while true)');
                    if (code.includes('document.cookie')) appIssues.push('Cookie access detected');
                    
                    if (appIssues.length > 0) {
                        issuesFound++;
                        appIssues.forEach(issue => addLog(`⚠ ${app.name}: ${issue}`, 'error'));
                    } else {
                        addLog(`✓ ${app.name}: Clean`, 'success');
                    }
                    
                    i++;
                    scanNext();
                }, 500);
            };
            
            scanNext();
        }

        // --- Lock Logic ---
        renderLock() {
            const allApps = window.getAllApps ? window.getAllApps() : [];
            const lockableApps = allApps.filter(a => !['lumo-security', 'settings'].includes(a.id));

            return `
                <div class="flex flex-col h-full p-6">
                    <div class="flex items-center justify-between mb-6">
                        <div>
                            <h2 class="text-xl font-dot uppercase">App Lock</h2>
                            <p class="text-xs text-gray-500 font-mono">Require passcode to open specific apps.</p>
                        </div>
                        <button onclick="window.LumoSecurityApp.setPasscode()" class="text-xs border border-white/20 px-3 py-2 hover:bg-white/10 transition uppercase font-mono">
                            ${localStorage.getItem('lumo_security_passcode') ? 'Change Passcode' : 'Set Passcode'}
                        </button>
                    </div>

                    <div class="flex-1 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-2 pr-2">
                        ${lockableApps.map(app => {
                            const isLocked = this.lockedApps.includes(app.id);
                            return `
                                <div class="flex items-center justify-between p-3 border ${isLocked ? 'border-[var(--accent)] bg-[var(--accent)]/10' : 'border-white/10 bg-white/5'} rounded-lg transition-colors">
                                    <div class="flex items-center gap-3">
                                        ${window.renderAppIcon ? window.renderAppIcon(app, 'text-sm') : ''}
                                        <span class="font-dot text-sm">${app.name}</span>
                                    </div>
                                    <button onclick="window.LumoSecurityApp.toggleLock('${app.id}')" class="w-8 h-8 flex items-center justify-center rounded-full ${isLocked ? 'bg-[var(--accent)] text-white' : 'bg-white/10 text-gray-500 hover:bg-white/20'} transition-colors">
                                        <i class="fa-solid ${isLocked ? 'fa-lock' : 'fa-lock-open'}"></i>
                                    </button>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            `;
        }

        toggleLock(appId) {
            if (!localStorage.getItem('lumo_security_passcode')) {
                alert('Please set a passcode first.');
                this.setPasscode();
                return;
            }

            if (this.lockedApps.includes(appId)) {
                this.lockedApps = this.lockedApps.filter(id => id !== appId);
            } else {
                this.lockedApps.push(appId);
            }
            localStorage.setItem('lumo_security_locked_apps', JSON.stringify(this.lockedApps));
            
            const content = document.getElementById('security-content');
            if (content) content.innerHTML = this.renderLock();
        }

        setPasscode() {
            const current = localStorage.getItem('lumo_security_passcode');
            if (current) {
                const check = prompt('Enter current passcode:');
                if (check !== current) return alert('Incorrect passcode');
            }
            
            const newCode = prompt('Enter new 4-digit passcode:');
            if (newCode && newCode.length >= 4) {
                localStorage.setItem('lumo_security_passcode', newCode);
                alert('Passcode set.');
                this.switchTab('lock');
            } else {
                alert('Invalid passcode. Must be at least 4 characters.');
            }
        }

        // --- Home Security Logic ---
        renderHome() {
            if (this.securityMode === 'child') return this.renderChildMode();
            if (this.securityMode === 'parent') return this.renderParentMode();

            return `
                <div class="flex flex-col items-center justify-center h-full p-8 text-center relative">
                    <!-- Device Identity -->
                    <div class="absolute top-4 right-4 flex items-center gap-2 bg-white/5 px-3 py-1 rounded-lg border border-white/10">
                        <div class="w-2 h-2 bg-red-500 rounded-full" id="p2p-status-dot"></div>
                        <span class="text-[10px] font-mono text-gray-500 uppercase">ID: <span class="text-white font-bold lumo-device-id-display">${this.deviceCode}</span></span>
                    </div>

                    <div class="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-6 border border-white/10">
                        <i class="fa-solid fa-house-signal text-4xl text-[var(--accent)]"></i>
                    </div>
                    <h2 class="text-2xl font-dot uppercase mb-2">Home Sentinel</h2>
                    <p class="text-gray-500 text-xs font-mono mb-10 max-w-md">P2P Security Network. Connect devices securely using the code above.</p>

                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-md">
                        <button onclick="window.LumoSecurityApp.setSecurityMode('child')" class="p-6 border border-white/20 hover:border-[var(--accent)] hover:bg-[var(--accent)]/10 transition-all group text-left rounded-xl">
                            <i class="fa-solid fa-video text-2xl mb-3 text-gray-400 group-hover:text-white"></i>
                            <h3 class="font-dot uppercase text-lg mb-1">Camera Mode</h3>
                            <p class="text-[10px] text-gray-500 font-mono uppercase">Records & streams video.</p>
                        </button>

                        <button onclick="window.LumoSecurityApp.setSecurityMode('parent')" class="p-6 border border-white/20 hover:border-[var(--accent)] hover:bg-[var(--accent)]/10 transition-all group text-left rounded-xl">
                            <i class="fa-solid fa-tablet-screen-button text-2xl mb-3 text-gray-400 group-hover:text-white"></i>
                            <h3 class="font-dot uppercase text-lg mb-1">Panel Mode</h3>
                            <p class="text-[10px] text-gray-500 font-mono uppercase">Views the stream.</p>
                        </button>
                    </div>
                    
                    <div id="p2p-status" class="mt-8 text-xs font-mono text-gray-600 uppercase">Initializing Network...</div>
                </div>
            `;
        }

        setSecurityMode(mode) {
            this.securityMode = mode;
            this.switchTab('home');
        }

        startChildMode() {
            this.startCamera();
            const status = document.getElementById('motion-status');
            if (status) status.innerText = this.conn ? "CONNECTED TO PANEL" : "WAITING FOR CONNECTION...";
        }

        renderChildMode() {
            setTimeout(() => this.startChildMode(), 100);
            return `
                <div class="relative h-full bg-black flex flex-col">
                    <video id="security-cam" autoplay playsinline class="flex-1 object-cover w-full h-full opacity-50"></video>
                    <canvas id="motion-canvas" class="hidden"></canvas>
                    
                    <!-- Overlay UI -->
                    <div class="absolute inset-0 flex flex-col justify-between p-6 pointer-events-none">
                        <div class="flex justify-between items-start">
                            <div class="flex flex-col gap-2 pointer-events-auto">
                                 <div class="flex items-center gap-2 bg-red-500/20 border border-red-500/50 px-3 py-1 rounded backdrop-blur-md w-fit">
                                    <div class="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                                    <span class="font-mono text-xs text-red-500 font-bold uppercase tracking-widest">Live Feed</span>
                                </div>
                                <div class="bg-black/50 backdrop-blur px-3 py-2 rounded border border-white/10">
                                    <p class="text-[10px] text-gray-400 font-mono uppercase">DEVICE ID</p>
                                    <p class="text-xl font-dot text-white lumo-device-id-display">${this.deviceCode}</p>
                                </div>
                            </div>

                            <button onclick="window.LumoSecurityApp.setSecurityMode('idle')" class="pointer-events-auto bg-black/50 text-white w-10 h-10 rounded-full flex items-center justify-center hover:bg-white hover:text-black transition">
                                <i class="fa-solid fa-xmark"></i>
                            </button>
                        </div>
                        
                        <!-- SOS Button for Child -->
                        <div class="pointer-events-auto flex justify-end mb-4">
                             <button onclick="window.LumoSecurityApp.triggerAlarm(false, 'sos')" class="bg-red-600 hover:bg-red-700 text-white font-bold rounded-full w-20 h-20 flex flex-col items-center justify-center shadow-lg shadow-red-600/30 border-4 border-red-800 animate-pulse gap-1">
                                <i class="fa-solid fa-bell-exclamation text-xl"></i>
                                <span class="font-dot text-[10px]">SOS</span>
                             </button>
                        </div>

                        <div id="alert-overlay" class="hidden absolute inset-0 bg-red-500/50 flex items-center justify-center animate-pulse z-20">
                            <div class="text-center">
                                <i class="fa-solid fa-triangle-exclamation text-6xl text-white mb-4"></i>
                                <h1 class="font-dot text-4xl text-white uppercase tracking-widest">Intruder Detected</h1>
                            </div>
                        </div>

                        <div class="pointer-events-auto">
                             <p class="text-xs font-mono text-gray-500 mb-2">STATUS: <span id="motion-status">${this.conn ? 'CONNECTED TO PANEL' : 'WAITING FOR CONNECTION...'}</span></p>
                        </div>
                    </div>
                </div>
            `;
        }

        renderParentMode() {
            return `
                <div class="flex flex-col h-full bg-[#111]">
                    <div class="p-4 border-b border-white/10 flex justify-between items-center shrink-0 z-20 bg-[#111]">
                        <div>
                            <h2 class="font-dot text-xl uppercase">Security Panel</h2>
                            <p class="text-[10px] text-gray-500 font-mono uppercase tracking-widest" id="parent-status-text">${this.remoteStream ? 'LIVE MONITORING' : 'DISCONNECTED'}</p>
                        </div>
                        <button onclick="window.LumoSecurityApp.setSecurityMode('idle')" class="text-xs border border-white/20 px-3 py-2 hover:bg-white/10 transition uppercase font-mono">
                            Exit
                        </button>
                    </div>
                    
                    <div class="flex-1 relative overflow-hidden flex flex-col">
                         
                         <!-- Video Feed Area -->
                         <div class="flex-1 relative bg-black">
                             <video id="parent-cam-feed" autoplay playsinline class="absolute inset-0 w-full h-full object-cover opacity-80"></video>
                             
                             ${!this.remoteStream ? `
                             <div class="absolute inset-0 flex items-center justify-center bg-black/80 z-10">
                                 <div class="bg-[#222] p-6 rounded-xl border border-white/10 w-full max-w-xs text-center">
                                     <h3 class="text-sm font-dot uppercase mb-4">Connect to Camera</h3>
                                     <input type="text" id="target-code" placeholder="ENTER ID" maxlength="6" 
                                         class="w-full bg-black border border-white/20 rounded px-4 py-2 text-center font-mono text-lg uppercase tracking-widest mb-4 focus:border-[var(--accent)] outline-none text-white">
                                     <button id="connect-btn" onclick="window.LumoSecurityApp.connectToChild(document.getElementById('target-code').value.toUpperCase())" 
                                         class="w-full bg-[var(--accent)] hover:bg-[var(--accent)]/80 text-black font-bold py-2 rounded uppercase font-dot text-sm">
                                         Connect
                                     </button>
                                 </div>
                             </div>
                             ` : ''}
                             
                             <!-- Alarm Overlay (Transparent Red) -->
                             <div id="parent-alarm-overlay" class="hidden absolute inset-0 bg-red-500/30 border-4 border-red-500 z-20 flex items-center justify-center animate-pulse pointer-events-none">
                                  <h1 class="font-dot text-4xl text-white uppercase tracking-widest drop-shadow-md">ALERT</h1>
                             </div>
                         </div>

                         <!-- Control Panel -->
                         <div class="h-auto bg-[#151515] border-t border-white/10 p-4 shrink-0 z-30">
                              <div class="grid grid-cols-3 gap-3">
                                   <button onclick="window.LumoSecurityApp.triggerAlarm(false, 'manual')" class="bg-white/5 hover:bg-white/10 border border-white/10 text-white p-3 rounded-lg flex flex-col items-center justify-center gap-2 transition active:scale-95">
                                       <i class="fa-solid fa-bell"></i>
                                       <span class="font-dot text-[10px] uppercase">Siren</span>
                                   </button>
                                   
                                   <button onclick="window.LumoSecurityApp.triggerAlarm(false, 'fire')" class="bg-orange-900/30 hover:bg-orange-900/50 border border-orange-500/30 text-orange-500 p-3 rounded-lg flex flex-col items-center justify-center gap-2 transition active:scale-95">
                                       <i class="fa-solid fa-fire"></i>
                                       <span class="font-dot text-[10px] uppercase">Fire</span>
                                   </button>
                                   
                                   <button onclick="window.LumoSecurityApp.triggerAlarm(false, 'suspect')" class="bg-red-900/30 hover:bg-red-900/50 border border-red-500/30 text-red-500 p-3 rounded-lg flex flex-col items-center justify-center gap-2 transition active:scale-95">
                                       <i class="fa-solid fa-user-secret"></i>
                                       <span class="font-dot text-[10px] uppercase">Intruder</span>
                                   </button>
                              </div>
                              
                              <button id="dismiss-btn" onclick="window.LumoSecurityApp.stopAlarm()" class="hidden w-full mt-3 py-3 bg-white text-black font-bold uppercase font-dot text-sm rounded hover:bg-gray-200">
                                  Dismiss Alarm
                              </button>
                         </div>
                    </div>
                </div>
            `;
        }
        
        async startCamera() {
            try {
                const video = document.getElementById('security-cam');
                if (!video) return;
                
                if (this.cameraStream) {
                     video.srcObject = this.cameraStream;
                     video.play().catch(e=>console.error(e));
                     this.startMotionDetection();
                     return;
                }

                const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
                this.cameraStream = stream;
                video.srcObject = stream;
                video.play().catch(e=>console.error(e));
                
                this.startMotionDetection();
            } catch (e) {
                console.error("Camera error", e);
                try {
                    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
                    this.cameraStream = stream;
                    const video = document.getElementById('security-cam');
                    if(video) {
                        video.srcObject = stream;
                        video.play().catch(e=>console.error(e));
                    }
                    this.startMotionDetection();
                } catch(e2) {
                     // alert("Could not start camera: " + e2.message);
                }
            }
        }

        startMotionDetection() {
            const video = document.getElementById('security-cam');
            if (!video) return;

            const canvas = document.getElementById('motion-canvas');
            if (!canvas) return;

            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            const width = 320;
            const height = 240;
            canvas.width = width;
            canvas.height = height;
            
            if (this.checkInterval) clearInterval(this.checkInterval);

            this.checkInterval = setInterval(() => {
                if (this.securityMode !== 'child') return;
                if (video.readyState !== 4) return; // Wait for video
                
                try {
                    ctx.drawImage(video, 0, 0, width, height);
                    const frame = ctx.getImageData(0, 0, width, height);
                    
                    if (this.lastFrameData) {
                        let diff = 0;
                        // Sample pixels to improve perf
                        for (let i = 0; i < frame.data.length; i += 16) {
                            diff += Math.abs(frame.data[i] - this.lastFrameData.data[i]);
                        }
                        
                        const score = diff / (frame.data.length / 16);
                        
                        if (score > this.motionThreshold) {
                            this.lastMotionTime = Date.now();
                            if (!this.isAlarmActive) this.triggerAlarm();
                        } else if (this.isAlarmActive && Date.now() - (this.lastMotionTime || 0) > 3000) {
                            this.stopAlarm();
                        }
                    }
                    
                    this.lastFrameData = frame;
                } catch (e) {
                    console.error(e);
                }
            }, 500);
        }


        stopCamera() {
            if (this.cameraStream) {
                this.cameraStream.getTracks().forEach(track => track.stop());
                this.cameraStream = null;
            }
            if (this.checkInterval) {
                clearInterval(this.checkInterval);
                this.checkInterval = null;
            }
            this.lastFrameData = null;
        }

        triggerAlarm(fromRemote = false, type = 'motion') {
            this.isAlarmActive = true;
            
            // Child UI
            const overlay = document.getElementById('alert-overlay');
            const status = document.getElementById('motion-status');
            if (overlay) overlay.classList.remove('hidden');
            if (status) status.innerText = "ALARM TRIGGERED: " + type.toUpperCase();
            
            // Parent UI
            const parentOverlay = document.getElementById('parent-alarm-overlay');
            const dismissBtn = document.getElementById('dismiss-btn');
            if (parentOverlay) parentOverlay.classList.remove('hidden');
            if (dismissBtn) dismissBtn.classList.remove('hidden');

            // Play Sound
            this.playSiren();
            
            // P2P Alert
            if (!fromRemote && this.conn && this.conn.open) {
                this.conn.send({ type: 'alarm', kind: type });
            }
            
            localStorage.setItem('lumo_security_alert', Date.now());
        }
        
        stopAlarm(fromRemote = false) {
            this.isAlarmActive = false;
            if (this.sirenOscillator) {
                this.sirenOscillator.stop();
                this.sirenOscillator = null;
            }
            
            // Child UI
            const overlay = document.getElementById('alert-overlay');
            if (overlay) overlay.classList.add('hidden');
            
            // Parent UI
            const parentOverlay = document.getElementById('parent-alarm-overlay');
            const dismissBtn = document.getElementById('dismiss-btn');
            if (parentOverlay) parentOverlay.classList.add('hidden');
            if (dismissBtn) dismissBtn.classList.add('hidden');

            if (!fromRemote && this.conn && this.conn.open) {
                this.conn.send({ type: 'stop_alarm' });
            }
        }

        playSiren() {
            if (this.sirenOscillator) return;
            
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (!AudioContext) return;
            
            const ctx = new AudioContext();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            
            osc.type = 'sawtooth';
            osc.frequency.value = 800;
            osc.connect(gain);
            gain.connect(ctx.destination);
            
            osc.start();
            this.sirenOscillator = osc;
            
            let high = true;
            this.sirenInterval = setInterval(() => {
                if (!this.isAlarmActive) {
                    clearInterval(this.sirenInterval);
                    try { osc.stop(); } catch(e){}
                    this.sirenOscillator = null;
                    return;
                }
                osc.frequency.setValueAtTime(high ? 1200 : 800, ctx.currentTime);
                high = !high;
            }, 500);
        }
    }
    window.LumoSecurityClass = LumoSecurity;
}

window.LumoSecurityApp = new window.LumoSecurityClass();
