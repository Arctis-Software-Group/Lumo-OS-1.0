/**
 * LumoDrop - Secure File Sharing & Real-time Chat
 * Part of Lumo OS
 * 
 * Features:
 * - End-to-End Encrypted File Transfer (AES-256-GCM)
 * - Real-time Chat with Encryption
 * - Device Discovery via Room Codes
 * - Cross-platform Support
 * - Nothing OS Design Language
 */

class LumoDrop {
    constructor() {
        this.id = 'lumo-drop';
        this.socket = null;
        this.deviceId = localStorage.getItem('lumoDrop_deviceId') || this.generateDeviceId();
        this.deviceName = localStorage.getItem('lumoDrop_deviceName') || this.generateDeviceName();
        this.currentRoom = null;
        this.devices = [];
        this.messages = [];
        this.transfers = new Map();
        this.encryptionKey = null;
        this.publicKey = null;
        this.privateKey = null;
        this.isConnected = false;
        this.pendingFiles = [];
        this.typingTimeout = null;
        this.win = null;
        
        // Connection mode: 'socket' or 'p2p'
        this.connectionMode = null;
        this.socketAvailable = false;
        
        // P2P (PeerJS/WebRTC) properties
        this.peer = null;                 // PeerJS instance
        this.peerConnections = new Map(); // peerId -> { conn, device }
        this.p2pRoomCode = null;
        this.isRoomHost = false;
        this.peerJsLoaded = false;
    }

    // Generate unique device ID
    generateDeviceId() {
        const id = 'LD-' + crypto.randomUUID().substring(0, 8).toUpperCase();
        localStorage.setItem('lumoDrop_deviceId', id);
        return id;
    }

    // Generate a friendly device name
    generateDeviceName() {
        const platform = this.detectPlatform();
        const adjectives = ['Swift', 'Noble', 'Cosmic', 'Lunar', 'Solar', 'Stellar', 'Crystal', 'Ember'];
        const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
        return `${adj} ${platform}`;
    }

    // Detect user's platform
    detectPlatform() {
        const ua = navigator.userAgent.toLowerCase();
        if (ua.includes('android')) return 'Android';
        if (ua.includes('iphone') || ua.includes('ipad')) return 'iOS';
        if (ua.includes('mac')) return 'Mac';
        if (ua.includes('windows')) return 'Windows';
        if (ua.includes('linux')) return 'Linux';
        return 'Device';
    }

    // Get platform icon
    getPlatformIcon(platform) {
        const icons = {
            'Android': 'fa-brands fa-android',
            'iOS': 'fa-brands fa-apple',
            'Mac': 'fa-solid fa-laptop',
            'Windows': 'fa-brands fa-windows',
            'Linux': 'fa-brands fa-linux',
            'Device': 'fa-solid fa-mobile-screen'
        };
        return icons[platform] || 'fa-solid fa-laptop';
    }

    // Generate AES encryption key
    async generateEncryptionKey() {
        try {
            this.encryptionKey = await window.crypto.subtle.generateKey(
                { name: 'AES-GCM', length: 256 },
                true,
                ['encrypt', 'decrypt']
            );
            return true;
        } catch (e) {
            console.error('[LumoDrop] Failed to generate encryption key:', e);
            return false;
        }
    }

    // Encrypt data using AES-GCM
    async encryptData(data) {
        if (!this.encryptionKey) await this.generateEncryptionKey();
        
        const iv = window.crypto.getRandomValues(new Uint8Array(12));
        const encodedData = new TextEncoder().encode(JSON.stringify(data));
        
        const encrypted = await window.crypto.subtle.encrypt(
            { name: 'AES-GCM', iv },
            this.encryptionKey,
            encodedData
        );

        return {
            iv: Array.from(iv),
            data: Array.from(new Uint8Array(encrypted))
        };
    }

    // Decrypt data using AES-GCM
    async decryptData(encryptedData) {
        if (!this.encryptionKey) return null;

        try {
            const iv = new Uint8Array(encryptedData.iv);
            const data = new Uint8Array(encryptedData.data);

            const decrypted = await window.crypto.subtle.decrypt(
                { name: 'AES-GCM', iv },
                this.encryptionKey,
                data
            );

            return JSON.parse(new TextDecoder().decode(decrypted));
        } catch (e) {
            console.error('[LumoDrop] Decryption failed:', e);
            return null;
        }
    }

    // Encrypt file chunk
    async encryptFileChunk(chunk) {
        if (!this.encryptionKey) await this.generateEncryptionKey();
        
        const iv = window.crypto.getRandomValues(new Uint8Array(12));
        const encrypted = await window.crypto.subtle.encrypt(
            { name: 'AES-GCM', iv },
            this.encryptionKey,
            chunk
        );

        return { iv: Array.from(iv), data: Array.from(new Uint8Array(encrypted)) };
    }

    // Decrypt file chunk
    async decryptFileChunk(encryptedChunk) {
        if (!this.encryptionKey) return null;

        try {
            const iv = new Uint8Array(encryptedChunk.iv);
            const data = new Uint8Array(encryptedChunk.data);

            return await window.crypto.subtle.decrypt(
                { name: 'AES-GCM', iv },
                this.encryptionKey,
                data
            );
        } catch (e) {
            console.error('[LumoDrop] Chunk decryption failed:', e);
            return null;
        }
    }

    // Build UI Markup
    buildMarkup() {
        return `
            <div class="flex-1 flex flex-col bg-black text-white font-sans overflow-hidden" id="lumoDrop-root">
                <!-- Connection Screen -->
                <div id="lumoDrop-connect-screen" class="flex-1 flex flex-col bg-black">
                    <!-- Header -->
                    <div class="h-16 flex items-center justify-between px-6 border-b border-white/10 bg-[#0a0a0a]">
                        <div class="flex items-center gap-3">
                            <div class="w-8 h-8 rounded-lg bg-[#10b981]/20 flex items-center justify-center">
                                <i class="fa-solid fa-share-nodes text-[#10b981]"></i>
                            </div>
                            <span class="font-dot tracking-wider text-lg">LUMODROP</span>
                        </div>
                        
                        <!-- Device Name Input (Header) -->
                        <div class="flex items-center gap-2 bg-white/5 rounded-full px-1 py-1 border border-white/5 focus-within:border-[#10b981]/50 transition max-w-[200px]">
                            <div class="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                                <i class="fa-solid fa-laptop text-[10px] text-gray-400"></i>
                            </div>
                            <input type="text" id="lumoDrop-device-name" 
                                value="${this.deviceName}"
                                class="bg-transparent border-none text-xs font-mono text-gray-300 focus:text-white outline-none w-full pr-3" 
                                placeholder="Device Name">
                            <button id="lumoDrop-save-name" class="hidden"></button> <!-- Hidden submit trigger -->
                        </div>
                    </div>

                    <!-- Main Content -->
                    <div class="flex-1 flex flex-col items-center justify-center p-6 md:p-12 gap-8 overflow-y-auto">
                        
                        <div class="text-center mb-4">
                            <h1 class="text-3xl md:text-4xl font-bold mb-2 bg-gradient-to-r from-white to-gray-500 bg-clip-text text-transparent">Share Instantly</h1>
                            <p class="text-gray-500 text-sm">Secure, encrypted file transfer across devices</p>
                        </div>

                        <!-- Primary Actions Grid -->
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl">
                            <!-- Send / Create Room -->
                            <button id="lumoDrop-create-room" class="group relative overflow-hidden flex flex-col items-center justify-center gap-6 p-8 md:p-12 rounded-3xl bg-[#10b981] hover:bg-[#0d9668] transition-all duration-300 transform hover:-translate-y-1 shadow-xl shadow-[#10b981]/10 text-left">
                                <div class="absolute top-0 right-0 p-32 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                                
                                <div class="w-20 h-20 rounded-2xl bg-black/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 backdrop-blur-sm">
                                    <i class="fa-solid fa-paper-plane text-3xl text-black"></i>
                                </div>
                                <div class="text-center relative z-10">
                                    <h2 class="font-dot text-2xl font-bold text-black mb-2">SEND</h2>
                                    <p class="text-black/60 text-sm font-medium">Create a room to share files</p>
                                </div>
                            </button>

                            <!-- Receive / Join Room -->
                            <div class="flex flex-col gap-6 p-8 rounded-3xl bg-[#111] border border-white/10 hover:border-white/20 transition-all duration-300 group">
                                <div class="text-center">
                                    <div class="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4 group-hover:bg-white/10 transition-colors">
                                        <i class="fa-solid fa-download text-2xl text-[#10b981]"></i>
                                    </div>
                                    <h2 class="font-dot text-xl font-bold text-white mb-1">RECEIVE</h2>
                                    <p class="text-gray-500 text-xs">Enter 6-digit room code</p>
                                </div>
                                
                                <div class="flex flex-col gap-3 mt-auto">
                                    <div class="relative">
                                        <input type="text" id="lumoDrop-room-code" 
                                            class="w-full bg-black border border-white/10 rounded-xl px-4 py-4 text-center text-2xl font-mono uppercase tracking-[0.5em] outline-none focus:border-[#10b981]/50 transition text-white placeholder-white/10" 
                                            placeholder="CODE" maxlength="6">
                                    </div>
                                    <button id="lumoDrop-join-room" 
                                        class="w-full py-4 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 text-white font-bold rounded-xl transition font-dot tracking-wider flex items-center justify-center gap-2">
                                        JOIN ROOM
                                        <i class="fa-solid fa-arrow-right text-xs opacity-50"></i>
                                    </button>
                                </div>
                            </div>
                        </div>

                        <!-- Status & Mode (Subtle) -->
                        <div class="mt-auto pt-8 flex flex-col items-center gap-3">
                            <div class="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/5">
                                <span class="w-2 h-2 rounded-full bg-gray-500 animate-pulse" id="lumoDrop-status-dot"></span>
                                <span class="text-xs text-gray-400 font-mono" id="lumoDrop-status-text">Connecting...</span>
                            </div>
                            
                            <!-- Hidden Mode Selectors but kept in DOM for logic compatibility -->
                            <div id="lumoDrop-mode-selector" class="hidden">
                                <button id="lumoDrop-mode-socket"></button>
                                <button id="lumoDrop-mode-p2p"></button>
                                <p id="lumoDrop-mode-hint"></p>
                            </div>
                            
                            <p class="text-[10px] text-gray-600">
                                <i class="fa-solid fa-shield-halved mr-1"></i> End-to-End Encrypted • P2P Direct Transfer
                            </p>
                        </div>
                    </div>
                </div>

                <!-- Room Screen (Hidden by default) -->
                <div id="lumoDrop-room-screen" class="flex-1 flex-col hidden bg-black">
                    <!-- Room Header -->
                    <div class="h-16 border-b border-white/10 flex items-center justify-between px-6 bg-[#0a0a0a] shrink-0">
                        <div class="flex items-center gap-4">
                            <button id="lumoDrop-leave-room" class="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 transition text-white">
                                <i class="fa-solid fa-arrow-left"></i>
                            </button>
                            <div>
                                <div class="flex items-center gap-3">
                                    <span class="font-dot text-xs text-gray-500 uppercase tracking-widest">ROOM CODE</span>
                                    <div class="flex items-center gap-2 bg-white/5 px-3 py-1 rounded-md border border-white/5">
                                        <span id="lumoDrop-room-code-display" class="font-mono text-xl tracking-widest text-[#10b981]">------</span>
                                        <button id="lumoDrop-copy-code" class="text-gray-500 hover:text-white transition ml-2">
                                            <i class="fa-regular fa-copy"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="flex items-center gap-3">
                            <div class="text-right hidden md:block">
                                <p class="text-[10px] text-gray-500 uppercase tracking-widest">Status</p>
                                <p class="text-xs font-mono text-[#10b981]">SECURE CONNECTION</p>
                            </div>
                            <div class="w-2 h-2 rounded-full bg-[#10b981] animate-pulse shadow-[0_0_10px_#10b981]"></div>
                        </div>
                    </div>

                    <!-- Room Content -->
                    <div class="flex-1 flex overflow-hidden">
                        <!-- Left: Devices & File Transfer -->
                        <div class="w-80 border-r border-white/10 flex flex-col shrink-0 bg-black">
                            <!-- Devices Section -->
                            <div class="p-6 border-b border-white/10">
                                <div class="flex items-center justify-between mb-4">
                                    <span class="font-dot text-lg">DEVICES <span id="lumoDrop-device-count" class="text-gray-500 text-sm ml-2">(0)</span></span>
                                    <button id="lumoDrop-refresh-devices" class="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition">
                                        <i class="fa-solid fa-rotate text-xs"></i>
                                    </button>
                                </div>
                                <div id="lumoDrop-devices-list" class="space-y-3 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                                    <!-- Devices will be injected here -->
                                </div>
                            </div>

                            <!-- File Drop Zone -->
                            <div class="flex-1 p-6 flex flex-col min-h-0">
                                <span class="font-dot text-lg mb-4">TRANSFER</span>
                                <div id="lumoDrop-drop-zone" 
                                    class="flex-1 border border-dashed border-white/20 rounded-2xl flex flex-col items-center justify-center gap-4 transition hover:border-[#10b981] hover:bg-[#10b981]/5 cursor-pointer relative group overflow-hidden">
                                    
                                    <!-- Decorative corners -->
                                    <div class="absolute top-0 left-0 w-4 h-4 border-t border-l border-white/30 group-hover:border-[#10b981] transition-colors"></div>
                                    <div class="absolute top-0 right-0 w-4 h-4 border-t border-r border-white/30 group-hover:border-[#10b981] transition-colors"></div>
                                    <div class="absolute bottom-0 left-0 w-4 h-4 border-b border-l border-white/30 group-hover:border-[#10b981] transition-colors"></div>
                                    <div class="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-white/30 group-hover:border-[#10b981] transition-colors"></div>

                                    <div class="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                        <i class="fa-solid fa-cloud-arrow-up text-2xl text-gray-400 group-hover:text-[#10b981] transition-colors"></i>
                                    </div>
                                    <div class="text-center z-10">
                                        <p class="font-dot text-sm mb-1">DROP FILES</p>
                                        <p class="text-[10px] text-gray-500 font-mono">CLICK TO BROWSE</p>
                                    </div>
                                    <input type="file" id="lumoDrop-file-input" class="hidden" multiple>
                                </div>

                                <!-- Transfer Queue -->
                                <div id="lumoDrop-transfers" class="mt-4 space-y-2 flex-1 overflow-y-auto min-h-[100px] custom-scrollbar">
                                    <!-- Active transfers will be shown here -->
                                </div>
                            </div>
                        </div>

                        <!-- Right: Chat -->
                        <div class="flex-1 flex flex-col min-w-0 bg-[#050505]">
                            <!-- Chat Messages -->
                            <div id="lumoDrop-chat-messages" class="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                                <!-- Messages will be injected here -->
                                <div class="h-full flex flex-col items-center justify-center text-gray-600 opacity-20" id="lumoDrop-chat-empty">
                                    <i class="fa-solid fa-fingerprint text-6xl mb-4"></i>
                                    <p class="font-mono text-xs uppercase tracking-widest">End-to-End Encrypted</p>
                                </div>
                            </div>

                            <!-- Typing Indicator -->
                            <div id="lumoDrop-typing-indicator" class="px-6 py-2 text-[10px] font-mono text-[#10b981] hidden flex items-center gap-2">
                                <span class="w-1.5 h-1.5 bg-[#10b981] rounded-full animate-bounce"></span>
                                <span class="w-1.5 h-1.5 bg-[#10b981] rounded-full animate-bounce delay-75"></span>
                                <span class="w-1.5 h-1.5 bg-[#10b981] rounded-full animate-bounce delay-150"></span>
                                <span id="lumoDrop-typing-name" class="uppercase"></span> IS TYPING...
                            </div>

                            <!-- Chat Input -->
                            <div class="p-4 border-t border-white/10 shrink-0 bg-black">
                                <div class="flex gap-3 items-end">
                                    <div class="flex-1 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 focus-within:border-[#10b981]/50 transition flex items-center gap-3">
                                        <input type="text" id="lumoDrop-chat-input" 
                                            class="flex-1 bg-transparent border-none text-sm outline-none text-white placeholder-gray-600 font-mono" 
                                            placeholder="Type a message...">
                                    </div>
                                    <button id="lumoDrop-send-message" 
                                        class="w-12 h-12 bg-[#10b981] text-black rounded-2xl hover:bg-[#0d9668] transition flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                                        <i class="fa-solid fa-arrow-up transform rotate-45"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- File Receive Modal -->
                <div id="lumoDrop-receive-modal" class="absolute inset-0 bg-black/90 backdrop-blur-xl flex items-center justify-center z-50 hidden">
                    <div class="bg-black border border-white/20 rounded-3xl p-8 max-w-sm w-full mx-4 shadow-[0_0_50px_rgba(0,0,0,0.8)] relative overflow-hidden">
                        <!-- Background decoration -->
                        <div class="absolute -top-20 -right-20 w-40 h-40 bg-[#10b981]/10 rounded-full blur-3xl pointer-events-none"></div>
                        
                        <div class="text-center mb-8 relative z-10">
                            <div class="w-20 h-20 mx-auto mb-6 rounded-full border border-[#10b981] flex items-center justify-center relative">
                                <div class="absolute inset-0 rounded-full border border-[#10b981] animate-ping opacity-20"></div>
                                <i class="fa-solid fa-file-import text-3xl text-[#10b981]"></i>
                            </div>
                            <h3 class="font-dot text-2xl mb-2 tracking-wider">INCOMING FILE</h3>
                            <p class="text-xs font-mono text-gray-500 uppercase tracking-widest" id="lumoDrop-receive-from">From: Unknown</p>
                        </div>
                        
                        <div class="bg-white/5 border border-white/10 rounded-xl p-4 mb-8 relative z-10">
                            <div class="flex items-center gap-3">
                                <i class="fa-solid fa-file text-gray-400"></i>
                                <div class="flex-1 min-w-0">
                                    <p class="font-mono text-sm truncate text-white" id="lumoDrop-receive-filename">file.txt</p>
                                    <p class="text-[10px] text-gray-500 mt-1" id="lumoDrop-receive-size">0 KB</p>
                                </div>
                            </div>
                        </div>
                        
                        <div class="flex gap-4 relative z-10">
                            <button id="lumoDrop-reject-file" class="flex-1 py-4 border border-white/20 rounded-xl text-gray-400 hover:bg-white/5 hover:text-white transition font-dot tracking-wider text-sm">
                                DECLINE
                            </button>
                            <button id="lumoDrop-accept-file" class="flex-1 py-4 bg-[#10b981] text-black font-bold rounded-xl hover:bg-[#0d9668] transition font-dot tracking-wider text-sm shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                                ACCEPT
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Toast Notifications -->
                <div id="lumoDrop-toasts" class="absolute bottom-4 right-4 space-y-2 z-50"></div>
            </div>
        `;
    }

    // Initialize app
    init(win) {
        this.win = win;
        this.bindElements();
        this.bindEvents();
        this.generateEncryptionKey();
        
        // Default to P2P mode immediately for better UX
        this.selectMode('p2p');
        
        // Check socket availability silently in background
        this.checkSocketAvailability();
    }

    // Check if Socket.IO server is available
    async checkSocketAvailability() {
        const isServerless = window.location.hostname.includes('vercel.app') || 
                            window.location.hostname.includes('netlify.app') ||
                            window.location.hostname.includes('github.io');
        
        if (isServerless) {
            this.socketAvailable = false;
            this.elements.modeSocketBtn.disabled = true;
            this.elements.modeSocketBtn.classList.add('opacity-50', 'cursor-not-allowed');
            this.elements.modeHint.textContent = 'Server mode unavailable - use Local P2P';
            // Auto-select P2P mode on serverless platforms
            setTimeout(() => this.selectMode('p2p'), 500);
            return;
        }

        // Try to check if socket.io is available
        try {
            const response = await fetch('/socket.io/socket.io.js', { method: 'HEAD' });
            this.socketAvailable = response.ok;
        } catch (e) {
            this.socketAvailable = false;
        }

        if (!this.socketAvailable) {
            this.elements.modeSocketBtn.disabled = true;
            this.elements.modeSocketBtn.classList.add('opacity-50', 'cursor-not-allowed');
            this.elements.modeHint.textContent = 'Server unavailable - use Local P2P';
        }
    }

    // Bind DOM elements
    bindElements() {
        this.elements = {
            root: this.win.querySelector('#lumoDrop-root'),
            connectScreen: this.win.querySelector('#lumoDrop-connect-screen'),
            roomScreen: this.win.querySelector('#lumoDrop-room-screen'),
            statusDot: this.win.querySelector('#lumoDrop-status-dot'),
            statusText: this.win.querySelector('#lumoDrop-status-text'),
            deviceNameInput: this.win.querySelector('#lumoDrop-device-name'),
            saveNameBtn: this.win.querySelector('#lumoDrop-save-name'),
            createRoomBtn: this.win.querySelector('#lumoDrop-create-room'),
            roomCodeInput: this.win.querySelector('#lumoDrop-room-code'),
            joinRoomBtn: this.win.querySelector('#lumoDrop-join-room'),
            leaveRoomBtn: this.win.querySelector('#lumoDrop-leave-room'),
            roomCodeDisplay: this.win.querySelector('#lumoDrop-room-code-display'),
            copyCodeBtn: this.win.querySelector('#lumoDrop-copy-code'),
            deviceCount: this.win.querySelector('#lumoDrop-device-count'),
            devicesList: this.win.querySelector('#lumoDrop-devices-list'),
            refreshDevicesBtn: this.win.querySelector('#lumoDrop-refresh-devices'),
            dropZone: this.win.querySelector('#lumoDrop-drop-zone'),
            fileInput: this.win.querySelector('#lumoDrop-file-input'),
            transfers: this.win.querySelector('#lumoDrop-transfers'),
            chatMessages: this.win.querySelector('#lumoDrop-chat-messages'),
            chatEmpty: this.win.querySelector('#lumoDrop-chat-empty'),
            chatInput: this.win.querySelector('#lumoDrop-chat-input'),
            sendMessageBtn: this.win.querySelector('#lumoDrop-send-message'),
            typingIndicator: this.win.querySelector('#lumoDrop-typing-indicator'),
            typingName: this.win.querySelector('#lumoDrop-typing-name'),
            receiveModal: this.win.querySelector('#lumoDrop-receive-modal'),
            receiveFrom: this.win.querySelector('#lumoDrop-receive-from'),
            receiveFilename: this.win.querySelector('#lumoDrop-receive-filename'),
            receiveSize: this.win.querySelector('#lumoDrop-receive-size'),
            acceptFileBtn: this.win.querySelector('#lumoDrop-accept-file'),
            rejectFileBtn: this.win.querySelector('#lumoDrop-reject-file'),
            toasts: this.win.querySelector('#lumoDrop-toasts'),
            // Mode selector elements
            modeSelector: this.win.querySelector('#lumoDrop-mode-selector'),
            modeSocketBtn: this.win.querySelector('#lumoDrop-mode-socket'),
            modeP2PBtn: this.win.querySelector('#lumoDrop-mode-p2p'),
            modeHint: this.win.querySelector('#lumoDrop-mode-hint')
        };
    }

    // Bind event listeners
    bindEvents() {
        // Device name
        if (this.elements.saveNameBtn) {
            this.elements.saveNameBtn.addEventListener('click', () => this.saveDeviceName());
        }
        
        if (this.elements.deviceNameInput) {
            this.elements.deviceNameInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    this.saveDeviceName();
                    this.elements.deviceNameInput.blur();
                }
            });
            this.elements.deviceNameInput.addEventListener('blur', () => this.saveDeviceName());
        }

        // Mode selection
        if (this.elements.modeSocketBtn) this.elements.modeSocketBtn.addEventListener('click', () => this.selectMode('socket'));
        if (this.elements.modeP2PBtn) this.elements.modeP2PBtn.addEventListener('click', () => this.selectMode('p2p'));

        // Room actions
        this.elements.createRoomBtn.addEventListener('click', () => this.createRoom());
        this.elements.joinRoomBtn.addEventListener('click', () => this.joinRoom());
        this.elements.roomCodeInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') this.joinRoom();
        });
        this.elements.leaveRoomBtn.addEventListener('click', () => this.leaveRoom());
        this.elements.copyCodeBtn.addEventListener('click', () => this.copyRoomCode());
        this.elements.refreshDevicesBtn.addEventListener('click', () => this.refreshDevices());

        // File handling
        this.elements.dropZone.addEventListener('click', () => this.elements.fileInput.click());
        this.elements.fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
        this.elements.dropZone.addEventListener('dragover', (e) => this.handleDragOver(e));
        this.elements.dropZone.addEventListener('dragleave', (e) => this.handleDragLeave(e));
        this.elements.dropZone.addEventListener('drop', (e) => this.handleDrop(e));

        // Chat
        this.elements.sendMessageBtn.addEventListener('click', () => this.sendMessage());
        this.elements.chatInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
                e.preventDefault();
                this.sendMessage();
            }
        });
        this.elements.chatInput.addEventListener('input', () => this.handleTyping());

        // File receive modal
        this.elements.acceptFileBtn.addEventListener('click', () => this.acceptIncomingFile());
        this.elements.rejectFileBtn.addEventListener('click', () => this.rejectIncomingFile());
    }

    // Select connection mode
    selectMode(mode) {
        this.connectionMode = mode;
        
        // Update UI if elements exist
        const activeClass = 'border-[#10b981] bg-[#10b981]/10';
        const inactiveClass = 'border-white/10 bg-white/5';
        
        if (this.elements.modeSocketBtn && this.elements.modeP2PBtn) {
            if (mode === 'socket') {
                this.elements.modeSocketBtn.className = this.elements.modeSocketBtn.className
                    .replace(inactiveClass, activeClass);
                this.elements.modeP2PBtn.className = this.elements.modeP2PBtn.className
                    .replace(activeClass, inactiveClass);
                if(this.elements.modeHint) this.elements.modeHint.textContent = 'Connect via your own server - requires Socket.IO';
                this.connectSocket();
            } else if (mode === 'p2p') {
                this.elements.modeP2PBtn.className = this.elements.modeP2PBtn.className
                    .replace(inactiveClass, activeClass);
                this.elements.modeSocketBtn.className = this.elements.modeSocketBtn.className
                    .replace(activeClass, inactiveClass);
                if(this.elements.modeHint) this.elements.modeHint.textContent = 'Direct P2P via WebRTC - works on any network!';
                this.initP2PMode();
            }
        } else {
            // Even if UI is hidden, initialize the mode
            if (mode === 'socket') this.connectSocket();
            else if (mode === 'p2p') this.initP2PMode();
        }
    }

    // Connect to Socket.IO server
    connectSocket() {
        // Check if we're on a serverless platform (Vercel, Netlify, etc.)
        const isServerless = window.location.hostname.includes('vercel.app') || 
                            window.location.hostname.includes('netlify.app') ||
                            window.location.hostname.includes('github.io');
        
        if (isServerless) {
            this.updateStatus('error', 'WebSocket not available');
            this.showServerlessWarning();
            return;
        }

        // Load Socket.IO from CDN if not already loaded
        if (typeof io === 'undefined') {
            const script = document.createElement('script');
            script.src = '/socket.io/socket.io.js';
            script.onload = () => this.initSocket();
            script.onerror = () => {
                this.updateStatus('error', 'Failed to load Socket.IO');
                this.showToast('Connection library not available', 'error');
                this.showServerlessWarning();
            };
            document.head.appendChild(script);
        } else {
            this.initSocket();
        }
    }

    // Show warning for serverless platforms
    showServerlessWarning() {
        this.showToast('Server mode not available on this platform. Using P2P.', 'warning');
        this.selectMode('p2p');
    }

    // ==================== P2P Mode Functions (PeerJS) ====================

    // Load PeerJS library
    async loadPeerJS() {
        if (this.peerJsLoaded || typeof Peer !== 'undefined') {
            this.peerJsLoaded = true;
            return true;
        }

        return new Promise((resolve) => {
            const script = document.createElement('script');
            script.src = 'https://unpkg.com/peerjs@1.5.4/dist/peerjs.min.js';
            script.onload = () => {
                this.peerJsLoaded = true;
                console.log('[LumoDrop] PeerJS loaded');
                resolve(true);
            };
            script.onerror = () => {
                console.error('[LumoDrop] Failed to load PeerJS');
                resolve(false);
            };
            document.head.appendChild(script);
        });
    }

    // Initialize P2P mode using PeerJS
    async initP2PMode() {
        this.updateStatus('connecting', 'Loading P2P...');
        
        const loaded = await this.loadPeerJS();
        if (!loaded) {
            this.updateStatus('error', 'P2P unavailable');
            this.showToast('Failed to load P2P library', 'error');
            return;
        }

        this.updateStatus('connected', 'P2P Ready');
        this.isConnected = true;
        this.showToast('P2P mode ready - create or join a room', 'success');
        console.log('[LumoDrop] P2P mode initialized');
    }

    // Generate a simple room code for P2P
    generateP2PRoomCode() {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let code = '';
        for (let i = 0; i < 6; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
    }

    // Create P2P room - host becomes the peer server
    async createP2PRoom() {
        this.p2pRoomCode = this.generateP2PRoomCode();
        this.currentRoom = this.p2pRoomCode;
        this.isRoomHost = true;

        // Create peer with room code as ID (host)
        const peerId = `lumoDrop-${this.p2pRoomCode}-host`;
        
        try {
            this.peer = new Peer(peerId, {
                debug: 1
            });

            this.peer.on('open', (id) => {
                console.log('[LumoDrop] Host peer opened:', id);
                this.showRoomScreen();
                this.showToast(`Room ${this.p2pRoomCode} created`, 'success');
                this.updateStatus('connected', 'Hosting');
            });

            this.peer.on('connection', (conn) => {
                this.handleIncomingConnection(conn);
            });

            this.peer.on('error', (err) => {
                console.error('[LumoDrop] Peer error:', err);
                if (err.type === 'unavailable-id') {
                    this.showToast('Room code already in use, try again', 'error');
                    this.p2pRoomCode = null;
                    this.currentRoom = null;
                } else {
                    this.showToast(`Connection error: ${err.type}`, 'error');
                }
            });

        } catch (e) {
            console.error('[LumoDrop] Failed to create peer:', e);
            this.showToast('Failed to create room', 'error');
        }
    }

    // Join P2P room - connect to host
    async joinP2PRoom(roomCode) {
        this.p2pRoomCode = roomCode.toUpperCase();
        this.currentRoom = this.p2pRoomCode;
        this.isRoomHost = false;

        const myPeerId = `lumoDrop-${this.p2pRoomCode}-${this.deviceId}`;
        const hostPeerId = `lumoDrop-${this.p2pRoomCode}-host`;

        try {
            this.peer = new Peer(myPeerId, {
                debug: 1
            });

            this.peer.on('open', (id) => {
                console.log('[LumoDrop] Client peer opened:', id);
                
                // Connect to host
                const conn = this.peer.connect(hostPeerId, {
                    reliable: true,
                    metadata: {
                        device: this.getDeviceInfo()
                    }
                });

                this.setupConnection(conn, true);
            });

            this.peer.on('connection', (conn) => {
                // Other peers connecting to us
                this.handleIncomingConnection(conn);
            });

            this.peer.on('error', (err) => {
                console.error('[LumoDrop] Peer error:', err);
                if (err.type === 'peer-unavailable') {
                    this.showToast('Room not found or host offline', 'error');
                    this.leaveP2PRoom();
                } else {
                    this.showToast(`Connection error: ${err.type}`, 'error');
                }
            });

        } catch (e) {
            console.error('[LumoDrop] Failed to join room:', e);
            this.showToast('Failed to join room', 'error');
        }
    }

    // Handle incoming peer connection
    handleIncomingConnection(conn) {
        console.log('[LumoDrop] Incoming connection from:', conn.peer);
        this.setupConnection(conn, false);
    }

    // Setup peer connection handlers
    setupConnection(conn, isInitiator) {
        conn.on('open', () => {
            console.log('[LumoDrop] Connection opened with:', conn.peer);
            
            // Get device info from metadata or request it
            const deviceInfo = conn.metadata?.device || { 
                id: conn.peer, 
                name: 'Unknown Device',
                platform: 'Unknown'
            };

            // Store connection
            this.peerConnections.set(conn.peer, { conn, device: deviceInfo });

            // Add to devices list
            if (!this.devices.find(d => d.id === deviceInfo.id)) {
                this.devices.push(deviceInfo);
                this.renderDevices();
                this.showToast(`${deviceInfo.name} connected`, 'success');
                this.addSystemMessage(`${deviceInfo.name} joined the room`);
            }

            // Send our device info
            this.sendP2PMessage(conn, {
                type: 'deviceInfo',
                device: this.getDeviceInfo()
            });

            // If we're host, share the peer list with the new connection
            if (this.isRoomHost) {
                const peerList = Array.from(this.peerConnections.keys()).filter(p => p !== conn.peer);
                if (peerList.length > 0) {
                    this.sendP2PMessage(conn, {
                        type: 'peerList',
                        peers: peerList
                    });
                }
            }

            // Show room screen if not already shown
            if (!this.elements.roomScreen.classList.contains('flex')) {
                this.showRoomScreen();
                this.updateStatus('connected', 'Connected');
            }
        });

        conn.on('data', (data) => {
            this.handleP2PData(conn, data);
        });

        conn.on('close', () => {
            console.log('[LumoDrop] Connection closed:', conn.peer);
            const peerData = this.peerConnections.get(conn.peer);
            if (peerData) {
                const device = peerData.device;
                this.devices = this.devices.filter(d => d.id !== device.id);
                this.peerConnections.delete(conn.peer);
                this.renderDevices();
                this.showToast(`${device.name} disconnected`, 'info');
                this.addSystemMessage(`${device.name} left the room`);
            }
        });

        conn.on('error', (err) => {
            console.error('[LumoDrop] Connection error:', err);
        });
    }

    // Send message via PeerJS connection
    sendP2PMessage(conn, data) {
        if (conn && conn.open) {
            conn.send(data);
        }
    }

    // Broadcast message to all peers
    broadcastP2P(data) {
        this.peerConnections.forEach(({ conn }) => {
            this.sendP2PMessage(conn, data);
        });
    }

    // Handle incoming P2P data
    handleP2PData(conn, data) {
        console.log('[LumoDrop] P2P data received:', data.type);

        switch (data.type) {
            case 'deviceInfo':
                // Update device info for this connection
                const peerData = this.peerConnections.get(conn.peer);
                if (peerData) {
                    peerData.device = data.device;
                    // Update devices list
                    const existingIdx = this.devices.findIndex(d => d.id === data.device.id);
                    if (existingIdx >= 0) {
                        this.devices[existingIdx] = data.device;
                    } else {
                        this.devices.push(data.device);
                    }
                    this.renderDevices();
                }
                break;

            case 'peerList':
                // Connect to other peers (mesh network)
                data.peers.forEach(peerId => {
                    if (!this.peerConnections.has(peerId) && peerId !== this.peer.id) {
                        const newConn = this.peer.connect(peerId, {
                            reliable: true,
                            metadata: { device: this.getDeviceInfo() }
                        });
                        this.setupConnection(newConn, true);
                    }
                });
                break;

            case 'chat':
                this.handleChatMessage(data);
                break;

            case 'typing':
                this.handleTypingIndicator(data);
                break;

            case 'fileRequest':
                this.handleFileTransferRequest(data);
                break;

            case 'fileAccept':
                this.handleFileTransferAccepted(data);
                break;

            case 'fileReject':
                this.handleFileTransferRejected(data);
                break;

            case 'fileChunk':
                this.handleFileChunk(data);
                break;

            case 'fileComplete':
                this.handleFileTransferComplete(data);
                break;
        }
    }

    // Legacy broadcast function - now uses broadcastP2P
    broadcastMessage(data) {
        this.broadcastP2P(data);
    }

    // Get current device info
    getDeviceInfo() {
        const platform = this.detectPlatform();
        return {
            id: this.deviceId,
            name: this.deviceName,
            platform: platform,
            avatar: this.getPlatformIcon(platform)
        };
    }

    // Leave P2P room
    leaveP2PRoom() {
        // Close all connections
        this.peerConnections.forEach(({ conn }) => {
            if (conn) conn.close();
        });
        this.peerConnections.clear();

        // Destroy peer
        if (this.peer) {
            this.peer.destroy();
            this.peer = null;
        }
        
        this.p2pRoomCode = null;
        this.currentRoom = null;
        this.devices = [];
        this.messages = [];
        this.isRoomHost = false;
        this.showConnectScreen();
        this.showToast('Left room', 'info');
    }

    // Initialize socket connection
    initSocket() {
        try {
            this.socket = io(window.location.origin, {
                transports: ['websocket', 'polling'],
                timeout: 10000
            });

            this.socket.on('connect', () => {
                this.isConnected = true;
                this.updateStatus('connected', 'Ready');
                this.registerDevice();
            });

            this.socket.on('disconnect', () => {
                this.isConnected = false;
                this.updateStatus('disconnected', 'Disconnected');
            });

            this.socket.on('connect_error', (err) => {
                console.error('[LumoDrop] Connection error:', err);
                this.updateStatus('error', 'Connection failed');
            });

            // LumoDrop events
            this.socket.on('lumoDrop:deviceJoined', (data) => this.handleDeviceJoined(data));
            this.socket.on('lumoDrop:deviceLeft', (data) => this.handleDeviceLeft(data));
            this.socket.on('lumoDrop:chatMessage', (data) => this.handleChatMessage(data));
            this.socket.on('lumoDrop:typing', (data) => this.handleTypingIndicator(data));
            this.socket.on('lumoDrop:fileTransferRequest', (data) => this.handleFileTransferRequest(data));
            this.socket.on('lumoDrop:fileTransferAccepted', (data) => this.handleFileTransferAccepted(data));
            this.socket.on('lumoDrop:fileTransferRejected', (data) => this.handleFileTransferRejected(data));
            this.socket.on('lumoDrop:fileChunk', (data) => this.handleFileChunk(data));
            this.socket.on('lumoDrop:fileTransferComplete', (data) => this.handleFileTransferComplete(data));

        } catch (e) {
            console.error('[LumoDrop] Socket initialization failed:', e);
            this.updateStatus('error', 'Init failed');
        }
    }

    // Register device with server
    registerDevice() {
        const platform = this.detectPlatform();
        this.socket.emit('lumoDrop:register', {
            deviceId: this.deviceId,
            name: this.deviceName,
            platform: platform,
            avatar: this.getPlatformIcon(platform)
        }, (response) => {
            if (response.success) {
                this.deviceId = response.deviceId;
                localStorage.setItem('lumoDrop_deviceId', this.deviceId);
                console.log('[LumoDrop] Registered as:', this.deviceId);
            }
        });
    }

    // Save device name
    saveDeviceName() {
        const name = this.elements.deviceNameInput.value.trim();
        if (name) {
            this.deviceName = name;
            localStorage.setItem('lumoDrop_deviceName', name);
            this.showToast('Device name saved', 'success');
            
            // Re-register with new name
            if (this.isConnected) {
                this.registerDevice();
            }
        }
    }

    // Create a new room
    createRoom() {
        if (!this.connectionMode) {
            this.showToast('Please select a connection mode', 'error');
            return;
        }

        if (this.connectionMode === 'p2p') {
            this.createP2PRoom();
            return;
        }

        // Socket mode
        if (!this.isConnected) {
            this.showToast('Not connected to server', 'error');
            return;
        }

        this.socket.emit('lumoDrop:createRoom', { encrypted: true }, (response) => {
            if (response.success) {
                this.currentRoom = response.roomCode;
                this.showRoomScreen();
                this.showToast(`Room ${response.roomCode} created`, 'success');
            } else {
                this.showToast(response.error || 'Failed to create room', 'error');
            }
        });
    }

    // Join existing room
    joinRoom() {
        const code = this.elements.roomCodeInput.value.trim().toUpperCase();
        if (!code || code.length < 6) {
            this.showToast('Enter a valid room code', 'error');
            return;
        }

        if (!this.connectionMode) {
            this.showToast('Please select a connection mode', 'error');
            return;
        }

        if (this.connectionMode === 'p2p') {
            this.joinP2PRoom(code);
            return;
        }

        // Socket mode
        if (!this.isConnected) {
            this.showToast('Not connected to server', 'error');
            return;
        }

        this.socket.emit('lumoDrop:joinRoom', { roomCode: code }, (response) => {
            if (response.success) {
                this.currentRoom = response.roomCode;
                this.devices = response.devices || [];
                this.showRoomScreen();
                this.renderDevices();
                this.showToast(`Joined room ${code}`, 'success');
            } else {
                this.showToast(response.error || 'Failed to join room', 'error');
            }
        });
    }

    // Leave current room
    leaveRoom() {
        if (this.connectionMode === 'p2p') {
            this.leaveP2PRoom();
            return;
        }

        // Socket mode
        if (this.currentRoom) {
            this.socket.emit('lumoDrop:leaveRoom', (response) => {
                this.currentRoom = null;
                this.devices = [];
                this.messages = [];
                this.showConnectScreen();
                this.showToast('Left room', 'info');
            });
        }
    }

    // Copy room code to clipboard
    copyRoomCode() {
        if (this.currentRoom) {
            navigator.clipboard.writeText(this.currentRoom).then(() => {
                this.showToast('Room code copied!', 'success');
            });
        }
    }

    // Refresh devices list
    refreshDevices() {
        if (this.connectionMode === 'p2p') {
            // In P2P mode, re-request device info from all peers
            this.broadcastP2P({
                type: 'deviceInfo',
                device: this.getDeviceInfo()
            });
            this.renderDevices();
            this.showToast('Refreshed device list', 'info');
            return;
        }

        // Socket mode
        if (this.socket) {
            this.socket.emit('lumoDrop:getRoomDevices', (response) => {
                if (response.success) {
                    this.devices = response.devices;
                    this.renderDevices();
                }
            });
        }
    }

    // Show room screen
    showRoomScreen() {
        this.elements.connectScreen.classList.add('hidden');
        this.elements.connectScreen.classList.remove('flex');
        this.elements.roomScreen.classList.remove('hidden');
        this.elements.roomScreen.classList.add('flex');
        this.elements.roomCodeDisplay.textContent = this.currentRoom;
        this.renderDevices();
    }

    // Show connect screen
    showConnectScreen() {
        this.elements.roomScreen.classList.add('hidden');
        this.elements.roomScreen.classList.remove('flex');
        this.elements.connectScreen.classList.remove('hidden');
        this.elements.connectScreen.classList.add('flex');
        this.elements.roomCodeInput.value = '';
        this.elements.chatMessages.innerHTML = '<div class="text-center text-gray-600 text-xs py-4"><i class="fa-solid fa-comments text-2xl mb-2 opacity-30"></i><p>Messages are end-to-end encrypted</p></div>';
    }

    // Update connection status
    updateStatus(status, text) {
        const colors = {
            connected: 'bg-[#10b981]',
            disconnected: 'bg-gray-500',
            error: 'bg-red-500',
            connecting: 'bg-yellow-500'
        };

        this.elements.statusDot.className = `w-2 h-2 rounded-full ${colors[status] || colors.connecting} animate-pulse`;
        this.elements.statusText.textContent = text;
    }

    // Render devices list
    renderDevices() {
        this.elements.deviceCount.textContent = `(${this.devices.length + 1})`; // +1 for self

        if (this.devices.length === 0) {
            this.elements.devicesList.innerHTML = `
                <div class="text-center py-8 text-gray-600 text-xs border border-dashed border-white/10 rounded-xl">
                    <i class="fa-solid fa-user-plus mb-3 text-xl opacity-50"></i>
                    <p class="font-mono uppercase tracking-wider">Waiting for peers...</p>
                </div>
            `;
            return;
        }

        this.elements.devicesList.innerHTML = this.devices.map(device => `
            <div class="flex items-center gap-4 p-3 rounded-xl bg-white/5 border border-white/5 hover:border-[#10b981]/50 transition group">
                <div class="w-10 h-10 rounded-lg bg-black border border-white/10 flex items-center justify-center group-hover:border-[#10b981]/50 transition-colors">
                    <i class="${device.avatar || 'fa-solid fa-laptop'} text-gray-400 group-hover:text-[#10b981] transition-colors"></i>
                </div>
                <div class="flex-1 min-w-0">
                    <p class="text-sm font-bold truncate text-white group-hover:text-[#10b981] transition-colors font-mono">${device.name}</p>
                    <p class="text-[10px] text-gray-500 uppercase tracking-wider">${device.platform || 'Unknown'}</p>
                </div>
                <div class="flex flex-col items-end gap-1">
                    <span class="w-1.5 h-1.5 rounded-full bg-[#10b981] shadow-[0_0_5px_#10b981]"></span>
                    <span class="text-[9px] text-gray-600 font-mono">CONN</span>
                </div>
            </div>
        `).join('');
    }

    // Handle device joined
    handleDeviceJoined(data) {
        const existing = this.devices.find(d => d.id === data.device.id);
        if (!existing) {
            this.devices.push(data.device);
            this.renderDevices();
            this.showToast(`${data.device.name} joined`, 'info');
            this.addSystemMessage(`${data.device.name} joined the room`);
        }
    }

    // Handle device left
    handleDeviceLeft(data) {
        const device = this.devices.find(d => d.id === data.deviceId);
        this.devices = this.devices.filter(d => d.id !== data.deviceId);
        this.renderDevices();
        if (device) {
            this.showToast(`${device.name} left`, 'info');
            this.addSystemMessage(`${device.name} left the room`);
        }
    }

    // Add system message to chat
    addSystemMessage(text) {
        if (this.elements.chatEmpty) {
            this.elements.chatEmpty.style.display = 'none';
        }

        const msg = document.createElement('div');
        msg.className = 'text-center text-xs text-gray-500 py-2';
        msg.innerHTML = `<span class="bg-white/5 px-3 py-1 rounded-full">${text}</span>`;
        this.elements.chatMessages.appendChild(msg);
        this.elements.chatMessages.scrollTop = this.elements.chatMessages.scrollHeight;
    }

    // Send chat message
    sendMessage() {
        const content = this.elements.chatInput.value.trim();
        if (!content || !this.currentRoom) return;

        if (this.connectionMode === 'p2p') {
            // P2P mode - broadcast message
            const message = {
                type: 'chat',
                id: crypto.randomUUID(),
                from: this.getDeviceInfo(),
                content: content,
                timestamp: Date.now()
            };
            this.broadcastP2P(message);
            // Also display locally
            this.handleChatMessage(message);
        } else {
            // Socket mode
            this.socket.emit('lumoDrop:chatMessage', { content, encrypted: false });
        }
        
        this.elements.chatInput.value = '';
    }

    // Handle incoming chat message
    handleChatMessage(data) {
        if (this.elements.chatEmpty) {
            this.elements.chatEmpty.style.display = 'none';
        }

        const isOwn = data.from.id === this.deviceId;
        const msg = document.createElement('div');
        msg.className = `flex flex-col ${isOwn ? 'items-end' : 'items-start'} mb-4 group`;
        
        // Nothing OS style: Minimalist, no bubbles, just text and lines
        msg.innerHTML = `
            <div class="flex items-center gap-2 mb-1 opacity-50 group-hover:opacity-100 transition-opacity">
                <span class="text-[10px] font-mono uppercase tracking-wider ${isOwn ? 'text-[#10b981]' : 'text-gray-400'}">
                    ${isOwn ? 'YOU' : data.from.name}
                </span>
                <span class="text-[9px] font-mono text-gray-600">${new Date(data.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
            </div>
            <div class="relative max-w-[85%]">
                ${!isOwn ? '<div class="absolute top-0 left-0 w-0.5 h-full bg-white/20 -ml-3"></div>' : ''}
                ${isOwn ? '<div class="absolute top-0 right-0 w-0.5 h-full bg-[#10b981] -mr-3"></div>' : ''}
                <p class="text-sm text-white leading-relaxed font-light break-words whitespace-pre-wrap">${this.escapeHtml(data.content)}</p>
            </div>
        `;
        this.elements.chatMessages.appendChild(msg);
        this.elements.chatMessages.scrollTop = this.elements.chatMessages.scrollHeight;
    }

    // Handle typing
    handleTyping() {
        if (!this.currentRoom) return;

        if (this.connectionMode === 'p2p') {
            this.broadcastP2P({
                type: 'typing',
                deviceId: this.deviceId,
                name: this.deviceName,
                isTyping: true
            });
        } else if (this.socket) {
            this.socket.emit('lumoDrop:typing', { isTyping: true });
        }

        clearTimeout(this.typingTimeout);
        this.typingTimeout = setTimeout(() => {
            if (this.connectionMode === 'p2p') {
                this.broadcastP2P({
                    type: 'typing',
                    deviceId: this.deviceId,
                    name: this.deviceName,
                    isTyping: false
                });
            } else if (this.socket) {
                this.socket.emit('lumoDrop:typing', { isTyping: false });
            }
        }, 2000);
    }

    // Handle typing indicator from others
    handleTypingIndicator(data) {
        if (data.deviceId === this.deviceId) return;

        if (data.isTyping) {
            this.elements.typingName.textContent = data.name;
            this.elements.typingIndicator.classList.remove('hidden');
        } else {
            this.elements.typingIndicator.classList.add('hidden');
        }
    }

    // File handling
    handleDragOver(e) {
        e.preventDefault();
        e.stopPropagation();
        this.elements.dropZone.classList.add('border-[#10b981]', 'bg-[#10b981]/10');
    }

    handleDragLeave(e) {
        e.preventDefault();
        e.stopPropagation();
        this.elements.dropZone.classList.remove('border-[#10b981]', 'bg-[#10b981]/10');
    }

    handleDrop(e) {
        e.preventDefault();
        e.stopPropagation();
        this.elements.dropZone.classList.remove('border-[#10b981]', 'bg-[#10b981]/10');

        const files = Array.from(e.dataTransfer.files);
        if (files.length > 0) {
            this.processFiles(files);
        }
    }

    handleFileSelect(e) {
        const files = Array.from(e.target.files);
        if (files.length > 0) {
            this.processFiles(files);
        }
        e.target.value = '';
    }

    // Process files for transfer
    async processFiles(files) {
        if (this.devices.length === 0) {
            this.showToast('No devices to send to', 'error');
            return;
        }

        for (const file of files) {
            await this.initiateFileTransfer(file);
        }
    }

    // Initiate file transfer
    async initiateFileTransfer(file) {
        const CHUNK_SIZE = 64 * 1024; // 64KB chunks
        const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
        const transferId = crypto.randomUUID();

        if (this.connectionMode === 'p2p') {
            // P2P mode - broadcast file request
            this.transfers.set(transferId, {
                file,
                fileName: file.name,
                fileSize: file.size,
                totalChunks,
                sentChunks: 0,
                status: 'pending'
            });

            this.broadcastP2P({
                type: 'fileRequest',
                transferId,
                from: this.getDeviceInfo(),
                to: 'all',
                fileName: file.name,
                fileSize: file.size,
                fileType: file.type,
                totalChunks,
                encrypted: true
            });

            this.renderTransfers();
            this.showToast(`Waiting for acceptance: ${file.name}`, 'info');
            return;
        }

        // Socket mode
        this.socket.emit('lumoDrop:fileTransferInit', {
            to: 'all',
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type,
            totalChunks: totalChunks,
            encrypted: true
        }, async (response) => {
            if (response.success) {
                const transferId = response.transferId;
                
                // Store transfer info
                this.transfers.set(transferId, {
                    file,
                    fileName: file.name,
                    fileSize: file.size,
                    totalChunks,
                    sentChunks: 0,
                    status: 'pending'
                });

                this.renderTransfers();
                this.showToast(`Waiting for acceptance: ${file.name}`, 'info');
            }
        });
    }

    // Handle file transfer accepted
    async handleFileTransferAccepted(data) {
        const transfer = this.transfers.get(data.transferId);
        if (!transfer) return;

        transfer.status = 'sending';
        this.renderTransfers();
        this.showToast(`Transfer accepted, sending ${transfer.fileName}`, 'success');

        // Start sending chunks
        await this.sendFileChunks(data.transferId, transfer.file, data.by);
    }

    // Send file in chunks
    async sendFileChunks(transferId, file, targetDeviceId = 'all') {
        const CHUNK_SIZE = 64 * 1024;
        const totalChunks = Math.ceil(file.size / CHUNK_SIZE);

        for (let i = 0; i < totalChunks; i++) {
            const start = i * CHUNK_SIZE;
            const end = Math.min(start + CHUNK_SIZE, file.size);
            const chunk = file.slice(start, end);

            const arrayBuffer = await chunk.arrayBuffer();
            const encryptedChunk = await this.encryptFileChunk(new Uint8Array(arrayBuffer));

            if (this.connectionMode === 'p2p') {
                this.broadcastP2P({
                    type: 'fileChunk',
                    transferId,
                    from: this.deviceId,
                    to: targetDeviceId,
                    chunkIndex: i,
                    totalChunks,
                    data: encryptedChunk
                });
            } else {
                this.socket.emit('lumoDrop:fileChunk', {
                    transferId,
                    chunkIndex: i,
                    totalChunks,
                    data: encryptedChunk
                });
            }

            // Update progress
            const transfer = this.transfers.get(transferId);
            if (transfer) {
                transfer.sentChunks = i + 1;
                this.renderTransfers();
            }

            // Small delay to prevent overwhelming
            await new Promise(resolve => setTimeout(resolve, 10));
        }

        // Signal completion
        if (this.connectionMode === 'p2p') {
            this.broadcastP2P({
                type: 'fileComplete',
                transferId,
                success: true
            });
        } else {
            this.socket.emit('lumoDrop:fileTransferComplete', { transferId });
        }
    }

    // Handle file transfer rejected
    handleFileTransferRejected(data) {
        const transfer = this.transfers.get(data.transferId);
        if (transfer) {
            transfer.status = 'rejected';
            this.renderTransfers();
            this.showToast(`Transfer rejected: ${transfer.fileName}`, 'error');
            setTimeout(() => {
                this.transfers.delete(data.transferId);
                this.renderTransfers();
            }, 3000);
        }
    }

    // Handle incoming file transfer request
    handleFileTransferRequest(data) {
        this.pendingFiles.push(data);
        
        // Show modal
        this.elements.receiveFrom.textContent = `From: ${data.from.name}`;
        this.elements.receiveFilename.textContent = data.fileName;
        this.elements.receiveSize.textContent = this.formatFileSize(data.fileSize);
        this.elements.receiveModal.classList.remove('hidden');
        this.elements.receiveModal.dataset.transferId = data.transferId;
    }

    // Accept incoming file
    acceptIncomingFile() {
        const transferId = this.elements.receiveModal.dataset.transferId;
        const fileInfo = this.pendingFiles.find(f => f.transferId === transferId);

        if (fileInfo) {
            // Initialize receiving transfer
            this.transfers.set(transferId, {
                fileName: fileInfo.fileName,
                fileSize: fileInfo.fileSize,
                fileType: fileInfo.fileType,
                receivedChunks: [],
                totalChunks: fileInfo.totalChunks || 0,
                status: 'receiving'
            });

            if (this.connectionMode === 'p2p') {
                this.broadcastP2P({
                    type: 'fileAccept',
                    transferId,
                    to: fileInfo.from.id,
                    by: this.deviceId
                });
            } else {
                this.socket.emit('lumoDrop:fileTransferAccept', { transferId });
            }
            
            this.renderTransfers();
        }

        this.elements.receiveModal.classList.add('hidden');
        this.pendingFiles = this.pendingFiles.filter(f => f.transferId !== transferId);
    }

    // Reject incoming file
    rejectIncomingFile() {
        const transferId = this.elements.receiveModal.dataset.transferId;
        const fileInfo = this.pendingFiles.find(f => f.transferId === transferId);

        if (this.connectionMode === 'p2p' && fileInfo) {
            this.broadcastP2P({
                type: 'fileReject',
                transferId,
                to: fileInfo.from.id,
                by: this.deviceId
            });
        } else if (this.socket) {
            this.socket.emit('lumoDrop:fileTransferReject', { transferId });
        }
        
        this.elements.receiveModal.classList.add('hidden');
        this.pendingFiles = this.pendingFiles.filter(f => f.transferId !== transferId);
    }

    // Handle incoming file chunk
    async handleFileChunk(data) {
        const transfer = this.transfers.get(data.transferId);
        if (!transfer || transfer.status !== 'receiving') return;

        // Decrypt chunk
        const decryptedChunk = await this.decryptFileChunk(data.data);
        if (!decryptedChunk) return;

        transfer.receivedChunks[data.chunkIndex] = decryptedChunk;
        transfer.totalChunks = data.totalChunks;
        this.renderTransfers();
    }

    // Handle file transfer complete
    handleFileTransferComplete(data) {
        const transfer = this.transfers.get(data.transferId);
        if (!transfer) return;

        if (transfer.status === 'receiving') {
            // Combine chunks and download
            const blob = new Blob(transfer.receivedChunks, { type: transfer.fileType });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = transfer.fileName;
            a.click();
            URL.revokeObjectURL(url);

            this.showToast(`Downloaded: ${transfer.fileName}`, 'success');
        } else {
            this.showToast(`Sent: ${transfer.fileName}`, 'success');
        }

        transfer.status = 'completed';
        this.renderTransfers();

        setTimeout(() => {
            this.transfers.delete(data.transferId);
            this.renderTransfers();
        }, 3000);
    }

    // Render active transfers
    renderTransfers() {
        if (this.transfers.size === 0) {
            this.elements.transfers.innerHTML = '';
            return;
        }

        this.elements.transfers.innerHTML = Array.from(this.transfers.entries()).map(([id, transfer]) => {
            let progress = 0;
            if (transfer.status === 'sending') {
                progress = Math.round((transfer.sentChunks / transfer.totalChunks) * 100);
            } else if (transfer.status === 'receiving') {
                progress = Math.round((transfer.receivedChunks.filter(Boolean).length / (transfer.totalChunks || 1)) * 100);
            } else if (transfer.status === 'completed') {
                progress = 100;
            }

            const statusColors = {
                pending: 'text-yellow-500',
                sending: 'text-blue-500',
                receiving: 'text-purple-500',
                completed: 'text-[#10b981]',
                rejected: 'text-red-500'
            };
            
            const barColors = {
                pending: 'bg-yellow-500',
                sending: 'bg-blue-500',
                receiving: 'bg-purple-500',
                completed: 'bg-[#10b981]',
                rejected: 'bg-red-500'
            };

            return `
                <div class="bg-black border border-white/10 rounded-xl p-3 relative overflow-hidden group">
                    <!-- Progress Background -->
                    <div class="absolute bottom-0 left-0 h-0.5 ${barColors[transfer.status]} transition-all duration-300" style="width: ${progress}%"></div>
                    
                    <div class="flex items-center gap-3 relative z-10">
                        <div class="w-8 h-8 rounded bg-white/5 flex items-center justify-center border border-white/5">
                            <i class="fa-solid fa-file ${statusColors[transfer.status]} text-xs"></i>
                        </div>
                        <div class="flex-1 min-w-0">
                            <div class="flex items-center justify-between mb-1">
                                <span class="text-xs font-mono truncate text-white max-w-[120px]">${transfer.fileName}</span>
                                <span class="text-[9px] ${statusColors[transfer.status]} font-mono uppercase">${transfer.status}</span>
                            </div>
                            <div class="flex items-center justify-between text-[9px] text-gray-500 font-mono">
                                <span>${this.formatFileSize(transfer.fileSize)}</span>
                                <span>${progress}%</span>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    // Show toast notification
    showToast(message, type = 'info') {
        const colors = {
            success: 'border-[#10b981] text-[#10b981]',
            error: 'border-red-500 text-red-500',
            info: 'border-blue-500 text-blue-500',
            warning: 'border-yellow-500 text-yellow-500'
        };

        const toast = document.createElement('div');
        toast.className = `bg-black border ${colors[type]} px-4 py-3 text-sm font-mono shadow-[0_0_20px_rgba(0,0,0,0.5)] animate-[fadeIn_0.3s_ease-out] flex items-center gap-3 min-w-[250px]`;
        
        // Nothing OS style icon (simple dot or symbol)
        let icon = '';
        if (type === 'success') icon = '<div class="w-2 h-2 bg-[#10b981] rounded-full shadow-[0_0_5px_#10b981]"></div>';
        else if (type === 'error') icon = '<div class="w-2 h-2 bg-red-500 rounded-full shadow-[0_0_5px_red]"></div>';
        else icon = '<div class="w-2 h-2 bg-white rounded-full"></div>';

        toast.innerHTML = `
            ${icon}
            <span class="text-white tracking-wide">${message}</span>
        `;
        this.elements.toasts.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(20px)';
            toast.style.transition = 'all 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    // Format file size
    formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }

    // Escape HTML
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Export to global scope
window.LumoDrop = new LumoDrop();
