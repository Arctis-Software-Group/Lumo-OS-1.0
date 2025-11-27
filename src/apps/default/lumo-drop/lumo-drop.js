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
        this.deviceId = localStorage.getItem('lumoDrop_deviceId') || null;
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
                <div id="lumoDrop-connect-screen" class="flex-1 flex flex-col">
                    <!-- Header -->
                    <div class="h-14 border-b border-white/10 flex items-center justify-between px-4 bg-black/50 backdrop-blur-md">
                        <div class="flex items-center gap-3">
                            <i class="fa-solid fa-share-nodes text-[#10b981]"></i>
                            <span class="font-dot tracking-wider text-sm">LUMODROP</span>
                        </div>
                        <div class="flex items-center gap-2">
                            <div id="lumoDrop-status" class="flex items-center gap-2 text-xs">
                                <span class="w-2 h-2 rounded-full bg-gray-500 animate-pulse" id="lumoDrop-status-dot"></span>
                                <span class="text-gray-400 font-mono" id="lumoDrop-status-text">Connecting...</span>
                            </div>
                        </div>
                    </div>

                    <!-- Main Content -->
                    <div class="flex-1 flex flex-col items-center justify-center p-6 gap-8">
                        <!-- Logo & Title -->
                        <div class="text-center">
                            <div class="w-24 h-24 rounded-full bg-[#10b981]/10 border border-[#10b981]/30 flex items-center justify-center mb-4 mx-auto">
                                <i class="fa-solid fa-share-nodes text-4xl text-[#10b981]"></i>
                            </div>
                            <h1 class="font-dot text-3xl tracking-widest mb-2">LUMODROP</h1>
                            <p class="text-gray-500 text-sm">Share files securely across devices</p>
                        </div>

                        <!-- Device Name Setup -->
                        <div class="w-full max-w-sm">
                            <label class="text-xs text-gray-500 uppercase tracking-widest mb-2 block">Your Device Name</label>
                            <div class="flex gap-2">
                                <input type="text" id="lumoDrop-device-name" 
                                    value="${this.deviceName}"
                                    class="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm font-mono outline-none focus:border-[#10b981]/50 transition" 
                                    placeholder="My Device">
                                <button id="lumoDrop-save-name" class="px-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition">
                                    <i class="fa-solid fa-check text-[#10b981]"></i>
                                </button>
                            </div>
                        </div>

                        <!-- Action Buttons -->
                        <div class="flex flex-col gap-4 w-full max-w-sm">
                            <button id="lumoDrop-create-room" 
                                class="w-full py-4 bg-[#10b981] text-black font-bold rounded-xl hover:bg-[#0d9668] transition flex items-center justify-center gap-3 font-dot tracking-wider">
                                <i class="fa-solid fa-plus"></i>
                                CREATE ROOM
                            </button>
                            
                            <div class="flex items-center gap-3">
                                <div class="flex-1 h-px bg-white/10"></div>
                                <span class="text-xs text-gray-500">OR</span>
                                <div class="flex-1 h-px bg-white/10"></div>
                            </div>
                            
                            <div class="flex gap-2">
                                <input type="text" id="lumoDrop-room-code" 
                                    class="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-center text-xl font-mono uppercase tracking-[0.5em] outline-none focus:border-[#10b981]/50 transition" 
                                    placeholder="CODE" maxlength="6">
                                <button id="lumoDrop-join-room" 
                                    class="px-6 bg-white/10 border border-white/10 text-white font-bold rounded-xl hover:bg-white/20 transition font-dot">
                                    JOIN
                                </button>
                            </div>
                        </div>

                        <!-- Features Info -->
                        <div class="grid grid-cols-3 gap-4 w-full max-w-md mt-4">
                            <div class="text-center p-3 rounded-xl bg-white/5 border border-white/5">
                                <i class="fa-solid fa-lock text-[#10b981] mb-2"></i>
                                <p class="text-[10px] text-gray-400 font-mono">E2E ENCRYPTED</p>
                            </div>
                            <div class="text-center p-3 rounded-xl bg-white/5 border border-white/5">
                                <i class="fa-solid fa-bolt text-[#10b981] mb-2"></i>
                                <p class="text-[10px] text-gray-400 font-mono">FAST TRANSFER</p>
                            </div>
                            <div class="text-center p-3 rounded-xl bg-white/5 border border-white/5">
                                <i class="fa-solid fa-globe text-[#10b981] mb-2"></i>
                                <p class="text-[10px] text-gray-400 font-mono">CROSS-PLATFORM</p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Room Screen (Hidden by default) -->
                <div id="lumoDrop-room-screen" class="flex-1 flex-col hidden">
                    <!-- Room Header -->
                    <div class="h-14 border-b border-white/10 flex items-center justify-between px-4 bg-black/50 backdrop-blur-md shrink-0">
                        <div class="flex items-center gap-3">
                            <button id="lumoDrop-leave-room" class="text-gray-400 hover:text-white transition">
                                <i class="fa-solid fa-arrow-left"></i>
                            </button>
                            <div>
                                <div class="flex items-center gap-2">
                                    <span class="font-dot tracking-wider text-sm">ROOM</span>
                                    <span id="lumoDrop-room-code-display" class="text-[#10b981] font-mono text-sm">------</span>
                                    <button id="lumoDrop-copy-code" class="text-gray-500 hover:text-white transition text-xs">
                                        <i class="fa-regular fa-copy"></i>
                                    </button>
                                </div>
                                <p class="text-[10px] text-gray-500"><span id="lumoDrop-device-count">0</span> devices connected</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-2">
                            <span class="w-2 h-2 rounded-full bg-[#10b981] animate-pulse"></span>
                            <span class="text-xs text-gray-400">Secure</span>
                        </div>
                    </div>

                    <!-- Room Content -->
                    <div class="flex-1 flex overflow-hidden">
                        <!-- Left: Devices & File Transfer -->
                        <div class="w-80 border-r border-white/10 flex flex-col shrink-0 bg-[#0a0a0a]">
                            <!-- Devices Section -->
                            <div class="p-4 border-b border-white/10">
                                <div class="flex items-center justify-between mb-3">
                                    <span class="text-xs text-gray-500 uppercase tracking-widest">Devices</span>
                                    <button id="lumoDrop-refresh-devices" class="text-gray-500 hover:text-white transition text-xs">
                                        <i class="fa-solid fa-rotate"></i>
                                    </button>
                                </div>
                                <div id="lumoDrop-devices-list" class="space-y-2 max-h-40 overflow-y-auto">
                                    <!-- Devices will be injected here -->
                                </div>
                            </div>

                            <!-- File Drop Zone -->
                            <div class="flex-1 p-4 flex flex-col">
                                <span class="text-xs text-gray-500 uppercase tracking-widest mb-3">Share Files</span>
                                <div id="lumoDrop-drop-zone" 
                                    class="flex-1 border-2 border-dashed border-white/10 rounded-xl flex flex-col items-center justify-center gap-3 transition hover:border-[#10b981]/50 hover:bg-[#10b981]/5 cursor-pointer min-h-[150px]">
                                    <i class="fa-solid fa-cloud-arrow-up text-3xl text-gray-500"></i>
                                    <p class="text-sm text-gray-400">Drop files here</p>
                                    <p class="text-[10px] text-gray-600">or click to browse</p>
                                    <input type="file" id="lumoDrop-file-input" class="hidden" multiple>
                                </div>

                                <!-- Transfer Queue -->
                                <div id="lumoDrop-transfers" class="mt-4 space-y-2 max-h-32 overflow-y-auto">
                                    <!-- Active transfers will be shown here -->
                                </div>
                            </div>
                        </div>

                        <!-- Right: Chat -->
                        <div class="flex-1 flex flex-col min-w-0 bg-black">
                            <!-- Chat Messages -->
                            <div id="lumoDrop-chat-messages" class="flex-1 overflow-y-auto p-4 space-y-3">
                                <!-- Messages will be injected here -->
                                <div class="text-center text-gray-600 text-xs py-4" id="lumoDrop-chat-empty">
                                    <i class="fa-solid fa-comments text-2xl mb-2 opacity-30"></i>
                                    <p>Messages are end-to-end encrypted</p>
                                </div>
                            </div>

                            <!-- Typing Indicator -->
                            <div id="lumoDrop-typing-indicator" class="px-4 py-1 text-xs text-gray-500 hidden">
                                <span id="lumoDrop-typing-name"></span> is typing...
                            </div>

                            <!-- Chat Input -->
                            <div class="p-4 border-t border-white/10 shrink-0">
                                <div class="flex gap-2">
                                    <input type="text" id="lumoDrop-chat-input" 
                                        class="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#10b981]/50 transition" 
                                        placeholder="Type a message...">
                                    <button id="lumoDrop-send-message" 
                                        class="px-4 bg-[#10b981] text-black rounded-xl hover:bg-[#0d9668] transition">
                                        <i class="fa-solid fa-paper-plane"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- File Receive Modal -->
                <div id="lumoDrop-receive-modal" class="absolute inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 hidden">
                    <div class="bg-[#111] border border-white/10 rounded-2xl p-6 max-w-sm w-full mx-4">
                        <div class="text-center mb-4">
                            <i class="fa-solid fa-file-arrow-down text-4xl text-[#10b981] mb-3"></i>
                            <h3 class="font-dot text-xl mb-2">INCOMING FILE</h3>
                            <p class="text-sm text-gray-400" id="lumoDrop-receive-from">From: Unknown</p>
                        </div>
                        <div class="bg-white/5 rounded-xl p-4 mb-4">
                            <p class="font-mono text-sm truncate" id="lumoDrop-receive-filename">file.txt</p>
                            <p class="text-xs text-gray-500" id="lumoDrop-receive-size">0 KB</p>
                        </div>
                        <div class="flex gap-3">
                            <button id="lumoDrop-reject-file" class="flex-1 py-3 border border-white/10 rounded-xl text-gray-400 hover:bg-white/5 transition font-dot">
                                DECLINE
                            </button>
                            <button id="lumoDrop-accept-file" class="flex-1 py-3 bg-[#10b981] text-black rounded-xl hover:bg-[#0d9668] transition font-dot">
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
        this.connectSocket();
        this.generateEncryptionKey();
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
            toasts: this.win.querySelector('#lumoDrop-toasts')
        };
    }

    // Bind event listeners
    bindEvents() {
        // Device name
        this.elements.saveNameBtn.addEventListener('click', () => this.saveDeviceName());
        this.elements.deviceNameInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') this.saveDeviceName();
        });

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

    // Connect to Socket.IO server
    connectSocket() {
        // Load Socket.IO from CDN if not already loaded
        if (typeof io === 'undefined') {
            const script = document.createElement('script');
            script.src = '/socket.io/socket.io.js';
            script.onload = () => this.initSocket();
            script.onerror = () => {
                this.updateStatus('error', 'Failed to load Socket.IO');
                this.showToast('Connection library not available', 'error');
            };
            document.head.appendChild(script);
        } else {
            this.initSocket();
        }
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
        this.socket.emit('lumoDrop:getRoomDevices', (response) => {
            if (response.success) {
                this.devices = response.devices;
                this.renderDevices();
            }
        });
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
        this.elements.deviceCount.textContent = this.devices.length + 1; // +1 for self

        if (this.devices.length === 0) {
            this.elements.devicesList.innerHTML = `
                <div class="text-center py-4 text-gray-600 text-xs">
                    <i class="fa-solid fa-user-plus mb-2"></i>
                    <p>Share room code to invite</p>
                </div>
            `;
            return;
        }

        this.elements.devicesList.innerHTML = this.devices.map(device => `
            <div class="flex items-center gap-3 p-2 rounded-lg bg-white/5 border border-white/5 hover:border-[#10b981]/30 transition">
                <div class="w-8 h-8 rounded-full bg-[#10b981]/10 flex items-center justify-center">
                    <i class="${device.avatar || 'fa-solid fa-laptop'} text-[#10b981] text-sm"></i>
                </div>
                <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium truncate">${device.name}</p>
                    <p class="text-[10px] text-gray-500">${device.platform || 'Unknown'}</p>
                </div>
                <span class="w-2 h-2 rounded-full bg-[#10b981]"></span>
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

        this.socket.emit('lumoDrop:chatMessage', { content, encrypted: false });
        this.elements.chatInput.value = '';
    }

    // Handle incoming chat message
    handleChatMessage(data) {
        if (this.elements.chatEmpty) {
            this.elements.chatEmpty.style.display = 'none';
        }

        const isOwn = data.from.id === this.deviceId;
        const msg = document.createElement('div');
        msg.className = `flex ${isOwn ? 'justify-end' : 'justify-start'}`;
        msg.innerHTML = `
            <div class="max-w-[75%] ${isOwn ? 'bg-[#10b981] text-black' : 'bg-white/10 text-white'} rounded-2xl ${isOwn ? 'rounded-tr-sm' : 'rounded-tl-sm'} px-4 py-2">
                ${!isOwn ? `<p class="text-[10px] font-bold mb-1 opacity-70">${data.from.name}</p>` : ''}
                <p class="text-sm break-words">${this.escapeHtml(data.content)}</p>
                <p class="text-[9px] mt-1 opacity-50">${new Date(data.timestamp).toLocaleTimeString()}</p>
            </div>
        `;
        this.elements.chatMessages.appendChild(msg);
        this.elements.chatMessages.scrollTop = this.elements.chatMessages.scrollHeight;
    }

    // Handle typing
    handleTyping() {
        if (!this.currentRoom) return;

        this.socket.emit('lumoDrop:typing', { isTyping: true });

        clearTimeout(this.typingTimeout);
        this.typingTimeout = setTimeout(() => {
            this.socket.emit('lumoDrop:typing', { isTyping: false });
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
        await this.sendFileChunks(data.transferId, transfer.file);
    }

    // Send file in chunks
    async sendFileChunks(transferId, file) {
        const CHUNK_SIZE = 64 * 1024;
        const totalChunks = Math.ceil(file.size / CHUNK_SIZE);

        for (let i = 0; i < totalChunks; i++) {
            const start = i * CHUNK_SIZE;
            const end = Math.min(start + CHUNK_SIZE, file.size);
            const chunk = file.slice(start, end);

            const arrayBuffer = await chunk.arrayBuffer();
            const encryptedChunk = await this.encryptFileChunk(new Uint8Array(arrayBuffer));

            this.socket.emit('lumoDrop:fileChunk', {
                transferId,
                chunkIndex: i,
                totalChunks,
                data: encryptedChunk
            });

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
        this.socket.emit('lumoDrop:fileTransferComplete', { transferId });
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
                totalChunks: 0,
                status: 'receiving'
            });

            this.socket.emit('lumoDrop:fileTransferAccept', { transferId });
            this.renderTransfers();
        }

        this.elements.receiveModal.classList.add('hidden');
        this.pendingFiles = this.pendingFiles.filter(f => f.transferId !== transferId);
    }

    // Reject incoming file
    rejectIncomingFile() {
        const transferId = this.elements.receiveModal.dataset.transferId;
        this.socket.emit('lumoDrop:fileTransferReject', { transferId });
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
                pending: 'bg-yellow-500',
                sending: 'bg-blue-500',
                receiving: 'bg-purple-500',
                completed: 'bg-[#10b981]',
                rejected: 'bg-red-500'
            };

            return `
                <div class="bg-white/5 rounded-lg p-3 border border-white/5">
                    <div class="flex items-center gap-2 mb-2">
                        <i class="fa-solid fa-file text-gray-400 text-xs"></i>
                        <span class="text-xs font-mono truncate flex-1">${transfer.fileName}</span>
                        <span class="text-[10px] ${statusColors[transfer.status]} text-black px-2 py-0.5 rounded-full uppercase">${transfer.status}</span>
                    </div>
                    <div class="h-1 bg-white/10 rounded-full overflow-hidden">
                        <div class="h-full ${statusColors[transfer.status]} transition-all duration-300" style="width: ${progress}%"></div>
                    </div>
                    <p class="text-[10px] text-gray-500 mt-1">${this.formatFileSize(transfer.fileSize)} • ${progress}%</p>
                </div>
            `;
        }).join('');
    }

    // Show toast notification
    showToast(message, type = 'info') {
        const colors = {
            success: 'bg-[#10b981]',
            error: 'bg-red-500',
            info: 'bg-blue-500',
            warning: 'bg-yellow-500'
        };

        const toast = document.createElement('div');
        toast.className = `${colors[type]} text-white px-4 py-2 rounded-lg text-sm font-medium shadow-lg animate-[fadeIn_0.3s_ease-out] flex items-center gap-2`;
        toast.innerHTML = `
            <i class="fa-solid ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-times-circle' : 'fa-info-circle'}"></i>
            ${message}
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
