/**
 * Talko - Next Gen P2P Chat & File Sharing
 * "Nothing OS" Style
 */

class TalkoApp {
    constructor() {
        this.id = 'talko';
        this.name = 'Talko';
        this.version = '1.0.0';
        this.deviceId = localStorage.getItem('talko_deviceId') || this.generateId();
        this.deviceName = localStorage.getItem('talko_deviceName') || 'User ' + this.deviceId.substring(0, 4);
        
        // State
        this.peer = null;
        this.connections = new Map(); // peerId -> conn
        this.messages = [];
        this.roomCode = null;
        this.isHost = false;
        this.pinnedMessages = new Set();
        this.folders = [
            { id: 'general', name: 'General', icon: 'fa-hashtag' },
            { id: 'files', name: 'Files', icon: 'fa-file' },
            { id: 'voice', name: 'Voice', icon: 'fa-microphone' }
        ];
        this.currentFolder = 'general';
        
        // Call State
        this.localStream = null;
        this.isInCall = false;

        // UI References
        this.win = null;
        this.elements = {};
    }

    generateId() {
        return Math.random().toString(36).substr(2, 9);
    }

    // --- UI Generation ---

    buildMarkup() {
        return `
            <div class="flex-1 flex flex-col bg-black text-white font-sans overflow-hidden h-full relative talko-app" id="talko-root">
                <style>
                    .talko-app ::selection { background: #ff0000; color: white; }
                    .talko-app .font-ndot { font-family: 'VT323', monospace; }
                    .talko-app .scrollbar-hide::-webkit-scrollbar { display: none; }
                    .talko-msg-enter { animation: slideIn 0.2s ease-out; }
                    @keyframes slideIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                    .talko-reaction-pop { animation: pop 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
                    @keyframes pop { 0% { transform: scale(0); } 100% { transform: scale(1); } }
                </style>

                <!-- Login / Connect Screen -->
                <div id="talko-login" class="absolute inset-0 z-50 bg-black flex flex-col items-center justify-center p-8">
                    <div class="w-full max-w-md space-y-8">
                        <div class="text-center">
                            <h1 class="text-6xl font-ndot text-white mb-2 tracking-tighter">Talko<span class="text-[#ff0000]">.</span></h1>
                            <p class="text-gray-500 font-mono text-xs uppercase tracking-widest">Secure P2P Communication</p>
                            <div class="mt-2 inline-block px-3 py-1 border border-[#ff0000] rounded-full">
                                <span class="text-[10px] text-[#ff0000] font-bold uppercase">Anonymous Mode</span>
                            </div>
                        </div>

                        <div class="bg-[#111] border border-white/10 rounded-2xl p-6 space-y-6">
                            <div class="space-y-2">
                                <label class="text-xs font-mono text-gray-500 uppercase">Display Name</label>
                                <input type="text" id="talko-name-input" value="${this.deviceName}" 
                                    class="w-full bg-black border border-white/20 rounded-xl px-4 py-3 text-white font-mono focus:border-[#ff0000] outline-none transition-colors">
                            </div>

                            <div class="grid grid-cols-2 gap-4">
                                <button id="talko-btn-create" class="group relative overflow-hidden rounded-xl bg-white text-black p-4 hover:bg-gray-200 transition-colors">
                                    <div class="relative z-10 flex flex-col items-center gap-2">
                                        <i class="fa-solid fa-plus text-2xl"></i>
                                        <span class="font-ndot text-xl uppercase">Create</span>
                                    </div>
                                </button>
                                <button id="talko-btn-join-mode" class="group relative overflow-hidden rounded-xl bg-[#ff0000] text-white p-4 hover:bg-[#cc0000] transition-colors">
                                    <div class="relative z-10 flex flex-col items-center gap-2">
                                        <i class="fa-solid fa-right-to-bracket text-2xl"></i>
                                        <span class="font-ndot text-xl uppercase">Join</span>
                                    </div>
                                </button>
                            </div>

                            <div id="talko-join-input-area" class="hidden space-y-4 pt-4 border-t border-white/10">
                                <div class="space-y-2">
                                    <label class="text-xs font-mono text-gray-500 uppercase">6-Digit Room Code</label>
                                    <input type="text" id="talko-code-input" maxlength="6" placeholder="XXXXXX"
                                        class="w-full bg-black border border-white/20 rounded-xl px-4 py-3 text-center text-2xl font-ndot tracking-[0.5em] uppercase text-white focus:border-[#ff0000] outline-none transition-colors">
                                </div>
                                <button id="talko-btn-connect" class="w-full bg-[#ff0000] text-white py-3 rounded-xl font-ndot text-xl uppercase hover:bg-[#cc0000] transition-colors">
                                    Connect
                                </button>
                                <button id="talko-btn-back" class="w-full text-gray-500 py-2 text-xs font-mono uppercase hover:text-white">Cancel</button>
                            </div>
                        </div>
                        
                        <p class="text-center text-[10px] text-gray-600 font-mono">
                            <i class="fa-solid fa-shield-halved mr-1"></i> End-to-End Encrypted via WebRTC
                        </p>
                    </div>
                </div>

                <!-- Main App Interface -->
                <div id="talko-main" class="hidden flex-1 flex overflow-hidden">
                    <!-- Sidebar -->
                    <div class="w-64 bg-[#0a0a0a] border-r border-white/10 flex flex-col shrink-0">
                        <div class="h-16 flex items-center px-6 border-b border-white/10">
                            <span class="font-ndot text-2xl">Talko<span class="text-[#ff0000]">.</span></span>
                        </div>
                        
                        <!-- Folders -->
                        <div class="p-4 space-y-2">
                            ${this.folders.map(f => `
                                <button class="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-colors ${f.id === 'general' ? 'bg-white/5 text-white' : ''}" onclick="window.talkoApp.switchFolder('${f.id}')">
                                    <i class="fa-solid ${f.icon} w-5"></i>
                                    <span class="font-mono text-sm uppercase tracking-wider">${f.name}</span>
                                </button>
                            `).join('')}
                        </div>

                        <div class="mt-auto p-4 border-t border-white/10">
                            <div class="bg-[#111] rounded-xl p-4 space-y-3">
                                <div class="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Room Code</div>
                                <div class="flex items-center justify-between">
                                    <span id="talko-room-display" class="font-ndot text-3xl text-[#ff0000] tracking-wider">------</span>
                                    <button id="talko-copy-code" class="text-gray-500 hover:text-white"><i class="fa-regular fa-copy"></i></button>
                                </div>
                            </div>
                            
                            <div class="mt-4 flex items-center gap-3">
                                <div class="w-2 h-2 bg-[#ff0000] rounded-full animate-pulse"></div>
                                <span id="talko-status-text" class="text-xs font-mono text-gray-400">Connected</span>
                            </div>
                        </div>
                    </div>

                    <!-- Chat Area -->
                    <div class="flex-1 flex flex-col bg-black min-w-0">
                        <!-- Header -->
                        <div class="h-16 flex items-center justify-between px-6 border-b border-white/10 bg-[#0a0a0a]">
                            <div class="flex items-center gap-4">
                                <div class="flex -space-x-2" id="talko-avatars">
                                    <!-- Dynamic Avatars -->
                                </div>
                                <span id="talko-participant-count" class="text-xs font-mono text-gray-500">1 Online</span>
                            </div>
                            
                            <div class="flex items-center gap-4">
                                <button id="talko-btn-call" class="w-10 h-10 rounded-full bg-white/5 hover:bg-[#ff0000] hover:text-white text-gray-400 transition-colors flex items-center justify-center">
                                    <i class="fa-solid fa-phone"></i>
                                </button>
                            </div>
                        </div>

                        <!-- Messages -->
                        <div id="talko-messages" class="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                            <div class="flex flex-col items-center justify-center h-full text-gray-600 opacity-30">
                                <i class="fa-solid fa-comments text-4xl mb-4"></i>
                                <p class="font-ndot text-xl uppercase">Start Talking</p>
                            </div>
                        </div>

                        <!-- Input Area -->
                        <div class="p-4 bg-[#0a0a0a] border-t border-white/10">
                             <!-- Reply Preview -->
                            <div id="talko-reply-preview" class="hidden mb-2 p-2 bg-white/5 border-l-2 border-[#ff0000] rounded flex justify-between items-center">
                                <div>
                                    <div class="text-[10px] text-[#ff0000] font-mono uppercase">Replying to <span id="talko-reply-user">User</span></div>
                                    <div id="talko-reply-text" class="text-xs text-gray-300 truncate max-w-md">...</div>
                                </div>
                                <button id="talko-cancel-reply" class="text-gray-500 hover:text-white"><i class="fa-solid fa-xmark"></i></button>
                            </div>

                            <div class="flex items-end gap-3">
                                <button id="talko-btn-attach" class="w-12 h-12 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors flex items-center justify-center shrink-0">
                                    <i class="fa-solid fa-paperclip"></i>
                                </button>
                                <div class="flex-1 bg-white/5 border border-white/10 focus-within:border-[#ff0000] rounded-xl px-4 py-3 transition-colors">
                                    <textarea id="talko-input" rows="1" class="w-full bg-transparent border-none outline-none text-white font-mono text-sm resize-none" placeholder="Type a message..."></textarea>
                                </div>
                                <button id="talko-btn-send" class="w-12 h-12 rounded-xl bg-[#ff0000] hover:bg-[#cc0000] text-white transition-colors flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(255,0,0,0.3)]">
                                    <i class="fa-solid fa-paper-plane"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Call Overlay -->
                <div id="talko-call-overlay" class="absolute inset-0 z-[100] bg-black/90 backdrop-blur-xl hidden flex-col items-center justify-center">
                    <div class="grid grid-cols-2 gap-4 max-w-4xl w-full p-8 h-[70%]">
                        <div class="bg-gray-900 rounded-2xl overflow-hidden relative border border-white/10">
                            <video id="talko-local-video" muted autoplay playsinline class="w-full h-full object-cover"></video>
                            <div class="absolute bottom-4 left-4 bg-black/50 px-3 py-1 rounded text-xs font-mono">YOU</div>
                        </div>
                        <div id="talko-remote-video-container" class="bg-gray-900 rounded-2xl overflow-hidden relative border border-white/10 flex items-center justify-center">
                            <div class="text-gray-500 font-ndot">WAITING...</div>
                        </div>
                    </div>
                    <div class="flex items-center gap-6 mt-8">
                        <button id="talko-btn-end-call" class="w-16 h-16 rounded-full bg-[#ff0000] hover:bg-[#cc0000] text-white flex items-center justify-center transition-colors shadow-[0_0_20px_rgba(255,0,0,0.4)]">
                            <i class="fa-solid fa-phone-slash text-xl"></i>
                        </button>
                    </div>
                </div>
                
                <input type="file" id="talko-file-input" class="hidden">
                <div id="talko-toast-container" class="absolute bottom-8 right-8 space-y-2 z-[60]"></div>
            </div>
        `;
    }

    init(win) {
        this.win = win;
        window.talkoApp = this;
        this.bindElements();
        this.bindEvents();
        this.loadPeerJS();
    }

    bindElements() {
        const q = (sel) => this.win.querySelector(sel);
        this.elements = {
            root: q('#talko-root'),
            login: q('#talko-login'),
            main: q('#talko-main'),
            nameInput: q('#talko-name-input'),
            createBtn: q('#talko-btn-create'),
            joinModeBtn: q('#talko-btn-join-mode'),
            joinInputArea: q('#talko-join-input-area'),
            codeInput: q('#talko-code-input'),
            connectBtn: q('#talko-btn-connect'),
            backBtn: q('#talko-btn-back'),
            
            roomDisplay: q('#talko-room-display'),
            messages: q('#talko-messages'),
            input: q('#talko-input'),
            sendBtn: q('#talko-btn-send'),
            attachBtn: q('#talko-btn-attach'),
            fileInput: q('#talko-file-input'),
            
            callBtn: q('#talko-btn-call'),
            callOverlay: q('#talko-call-overlay'),
            localVideo: q('#talko-local-video'),
            remoteVideoContainer: q('#talko-remote-video-container'),
            endCallBtn: q('#talko-btn-end-call'),
            
            replyPreview: q('#talko-reply-preview'),
            replyUser: q('#talko-reply-user'),
            replyText: q('#talko-reply-text'),
            cancelReplyBtn: q('#talko-cancel-reply'),
            
            toastContainer: q('#talko-toast-container')
        };
    }

    bindEvents() {
        this.elements.createBtn.onclick = () => this.createRoom();
        this.elements.joinModeBtn.onclick = () => {
            this.elements.joinInputArea.classList.remove('hidden');
            this.elements.createBtn.classList.add('hidden');
            this.elements.joinModeBtn.classList.add('hidden');
        };
        this.elements.backBtn.onclick = () => {
            this.elements.joinInputArea.classList.add('hidden');
            this.elements.createBtn.classList.remove('hidden');
            this.elements.joinModeBtn.classList.remove('hidden');
        };
        this.elements.connectBtn.onclick = () => this.joinRoom(this.elements.codeInput.value);
        
        this.elements.sendBtn.onclick = () => this.sendMessage();
        this.elements.input.onkeydown = (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        };
        
        this.elements.attachBtn.onclick = () => this.elements.fileInput.click();
        this.elements.fileInput.onchange = (e) => this.handleFileSelect(e);
        
        this.elements.callBtn.onclick = () => this.startCall();
        this.elements.endCallBtn.onclick = () => this.endCall();
        
        this.elements.cancelReplyBtn.onclick = () => this.cancelReply();
    }

    async loadPeerJS() {
        if (window.Peer) return;
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/peerjs@1.5.4/dist/peerjs.min.js';
        document.head.appendChild(script);
    }

    createRoom() {
        if (!window.Peer) return this.showToast('Loading P2P...', 'error');
        this.deviceName = this.elements.nameInput.value || this.deviceName;
        localStorage.setItem('talko_deviceName', this.deviceName);
        
        this.roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        this.isHost = true;
        this.initPeer(`talko-${this.roomCode}-host`);
    }

    joinRoom(code) {
        if (!window.Peer) return this.showToast('Loading P2P...', 'error');
        if (code.length !== 6) return this.showToast('Invalid Code', 'error');
        
        this.deviceName = this.elements.nameInput.value || this.deviceName;
        localStorage.setItem('talko_deviceName', this.deviceName);
        
        this.roomCode = code.toUpperCase();
        this.isHost = false;
        this.initPeer(`talko-${this.roomCode}-${this.deviceId}`);
    }

    initPeer(id) {
        this.peer = new Peer(id);
        
        this.peer.on('open', () => {
            this.enterRoom();
            if (!this.isHost) {
                this.connectToPeer(`talko-${this.roomCode}-host`);
            }
        });
        
        this.peer.on('connection', (conn) => this.handleConnection(conn));
        this.peer.on('call', (call) => this.handleIncomingCall(call));
        this.peer.on('error', (err) => this.showToast('Connection Error: ' + err.type, 'error'));
    }

    connectToPeer(peerId) {
        const conn = this.peer.connect(peerId, {
            metadata: { name: this.deviceName, deviceId: this.deviceId }
        });
        this.handleConnection(conn);
    }

    handleConnection(conn) {
        conn.on('open', () => {
            this.connections.set(conn.peer, conn);
            conn.send({ type: 'info', name: this.deviceName, deviceId: this.deviceId });
            if (this.isHost) {
                const peers = Array.from(this.connections.keys()).filter(p => p !== conn.peer);
                conn.send({ type: 'peers', list: peers });
            }
        });
        
        conn.on('data', (data) => this.handleData(data, conn));
        conn.on('close', () => {
            this.connections.delete(conn.peer);
            this.updateParticipants();
        });
    }

    handleData(data, conn) {
        switch (data.type) {
            case 'info':
                conn.metadata = { name: data.name, deviceId: data.deviceId };
                this.updateParticipants();
                break;
            case 'peers':
                data.list.forEach(peerId => {
                    if (!this.connections.has(peerId) && peerId !== this.peer.id) this.connectToPeer(peerId);
                });
                break;
            case 'message':
                this.addMessage(data.msg, false);
                break;
            case 'file':
                this.handleFileReceive(data);
                break;
            case 'unsend':
                this.removeMessage(data.id);
                break;
            case 'reaction':
                this.addReactionUI(data.msgId, data.emoji, data.sender);
                break;
        }
    }

    enterRoom() {
        this.elements.login.classList.add('hidden');
        this.elements.main.classList.remove('hidden');
        this.elements.roomDisplay.textContent = this.roomCode;
        this.showToast('Welcome to Talko', 'success');
    }

    sendMessage() {
        const text = this.elements.input.value.trim();
        if (!text) return;
        
        const msg = {
            id: Date.now().toString(),
            sender: this.deviceName,
            senderId: this.deviceId,
            text: text,
            timestamp: Date.now(),
            replyTo: this.replyingTo || null
        };
        
        this.addMessage(msg, true);
        this.broadcast({ type: 'message', msg: msg });
        this.elements.input.value = '';
        this.cancelReply();
    }
    
    broadcast(data) {
        this.connections.forEach(conn => conn.send(data));
    }

    addMessage(msg, isMe) {
        this.messages.push(msg);
        const div = document.createElement('div');
        div.id = `msg-${msg.id}`;
        div.className = `flex flex-col gap-1 max-w-[80%] ${isMe ? 'ml-auto items-end' : 'mr-auto items-start'} talko-msg-enter`;
        
        let replyHtml = '';
        if (msg.replyTo) {
            replyHtml = `
                <div class="text-[10px] text-gray-500 border-l-2 border-[#ff0000] pl-2 mb-1 opacity-75">
                    Replying to: ${msg.replyTo.text.substring(0, 20)}...
                </div>
            `;
        }

        div.innerHTML = `
            <div class="flex items-center gap-2 mb-1">
                <span class="text-[10px] font-mono text-gray-500 uppercase">${msg.sender}</span>
                <span class="text-[10px] text-gray-600">${new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
            </div>
            ${replyHtml}
            <div class="group relative">
                <div class="px-4 py-3 rounded-2xl ${isMe ? 'bg-[#ff0000] text-white' : 'bg-[#1a1a1a] text-gray-200 border border-white/10'}">
                    <p class="font-sans text-sm whitespace-pre-wrap">${this.escapeHtml(msg.text)}</p>
                </div>
                
                <!-- Actions -->
                <div class="absolute top-0 ${isMe ? '-left-28' : '-right-28'} h-full flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity px-2">
                    <div class="flex bg-black/80 rounded-full border border-white/10 p-1">
                        <button onclick="window.talkoApp.sendReaction('${msg.id}', '👍')" class="w-6 h-6 hover:bg-white/10 rounded-full">👍</button>
                        <button onclick="window.talkoApp.sendReaction('${msg.id}', '❤️')" class="w-6 h-6 hover:bg-white/10 rounded-full">❤️</button>
                        <button onclick="window.talkoApp.sendReaction('${msg.id}', '😂')" class="w-6 h-6 hover:bg-white/10 rounded-full">😂</button>
                    </div>
                    <button onclick="window.talkoApp.setReply('${msg.id}')" class="w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-[10px] text-white" title="Reply">
                        <i class="fa-solid fa-reply"></i>
                    </button>
                     ${isMe ? `
                    <button onclick="window.talkoApp.unsendMessage('${msg.id}')" class="w-6 h-6 rounded-full bg-white/10 hover:bg-red-500/50 flex items-center justify-center text-[10px] text-white" title="Unsend">
                        <i class="fa-solid fa-trash"></i>
                    </button>` : ''}
                </div>
                
                <!-- Reactions Container -->
                <div id="reactions-${msg.id}" class="flex flex-wrap gap-1 mt-1 absolute -bottom-4 ${isMe ? 'right-0' : 'left-0'}"></div>
            </div>
        `;
        
        if (this.elements.messages.querySelector('.fa-comments')) {
            this.elements.messages.innerHTML = '';
        }
        this.elements.messages.appendChild(div);
        this.elements.messages.scrollTop = this.elements.messages.scrollHeight;
    }
    
    sendReaction(msgId, emoji) {
        this.addReactionUI(msgId, emoji, 'You');
        this.broadcast({ type: 'reaction', msgId: msgId, emoji: emoji, sender: this.deviceName });
    }
    
    addReactionUI(msgId, emoji, sender) {
        const container = document.getElementById(`reactions-${msgId}`);
        if (!container) return;
        
        const badge = document.createElement('div');
        badge.className = 'bg-[#222] border border-white/10 rounded-full px-1.5 py-0.5 text-[10px] flex items-center shadow-lg talko-reaction-pop';
        badge.innerHTML = `<span>${emoji}</span>`;
        container.appendChild(badge);
    }
    
    unsendMessage(id) {
        this.removeMessage(id);
        this.broadcast({ type: 'unsend', id: id });
    }
    
    removeMessage(id) {
        const el = this.elements.messages.querySelector(`#msg-${id}`);
        if (el) el.innerHTML = `<div class="text-[10px] text-gray-600 font-mono italic">Message unsent</div>`;
    }
    
    setReply(id) {
        const msg = this.messages.find(m => m.id === id);
        if (!msg) return;
        this.replyingTo = msg;
        this.elements.replyPreview.classList.remove('hidden');
        this.elements.replyUser.textContent = msg.sender;
        this.elements.replyText.textContent = msg.text;
        this.elements.input.focus();
    }
    
    cancelReply() {
        this.replyingTo = null;
        this.elements.replyPreview.classList.add('hidden');
    }

    handleFileSelect(e) {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 10 * 1024 * 1024) return this.showToast('File too large (Max 10MB)', 'error');
        
        const reader = new FileReader();
        reader.onload = () => {
            const msg = {
                id: Date.now().toString(),
                sender: this.deviceName,
                senderId: this.deviceId,
                text: `📎 Sent a file: ${file.name}`,
                timestamp: Date.now(),
                fileData: reader.result,
                fileName: file.name,
                fileType: file.type
            };
            this.addMessage(msg, true);
            this.broadcast({ type: 'file', msg: msg });
        };
        reader.readAsDataURL(file);
    }
    
    handleFileReceive(data) {
        const msg = data.msg;
        this.messages.push(msg);
        const div = document.createElement('div');
        div.className = `flex flex-col gap-1 max-w-[80%] mr-auto items-start talko-msg-enter`;
        div.innerHTML = `
            <div class="flex items-center gap-2 mb-1">
                <span class="text-[10px] font-mono text-gray-500 uppercase">${msg.sender}</span>
            </div>
            <div class="px-4 py-3 rounded-2xl bg-[#1a1a1a] border border-white/10 group cursor-pointer hover:border-[#ff0000] transition-colors">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded bg-white/5 flex items-center justify-center text-[#ff0000]">
                        <i class="fa-solid fa-file"></i>
                    </div>
                    <div>
                        <div class="text-sm text-white font-mono">${msg.fileName}</div>
                        <a href="${msg.fileData}" download="${msg.fileName}" class="text-[10px] text-[#ff0000] hover:underline uppercase">Download</a>
                    </div>
                </div>
            </div>
        `;
        this.elements.messages.appendChild(div);
        this.elements.messages.scrollTop = this.elements.messages.scrollHeight;
    }

    async startCall() {
        if (this.isInCall) return;
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            this.localStream = stream;
            this.elements.callOverlay.classList.remove('hidden');
            this.elements.callOverlay.classList.add('flex');
            this.elements.localVideo.srcObject = stream;
            this.isInCall = true;
            
            this.connections.forEach((conn, peerId) => {
                const call = this.peer.call(peerId, stream);
                this.handleCallStream(call);
            });
        } catch (e) {
            console.error(e);
            this.showToast('Could not access camera/mic', 'error');
        }
    }
    
    handleIncomingCall(call) {
        if (confirm(`Incoming call from ${call.peer}. Answer?`)) {
            navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then(stream => {
                this.localStream = stream;
                this.elements.callOverlay.classList.remove('hidden');
                this.elements.callOverlay.classList.add('flex');
                this.elements.localVideo.srcObject = stream;
                this.isInCall = true;
                call.answer(stream);
                this.handleCallStream(call);
            });
        }
    }
    
    handleCallStream(call) {
        call.on('stream', (remoteStream) => {
            const video = document.createElement('video');
            video.srcObject = remoteStream;
            video.autoplay = true;
            video.playsInline = true;
            video.className = 'w-full h-full object-cover';
            this.elements.remoteVideoContainer.innerHTML = '';
            this.elements.remoteVideoContainer.appendChild(video);
        });
        call.on('close', () => this.endCall());
    }
    
    endCall() {
        if (this.localStream) {
            this.localStream.getTracks().forEach(t => t.stop());
        }
        this.elements.callOverlay.classList.add('hidden');
        this.elements.callOverlay.classList.remove('flex');
        this.isInCall = false;
    }

    updateParticipants() {
        const count = this.connections.size + 1;
        const el = document.getElementById('talko-participant-count');
        if(el) el.textContent = `${count} Online`;
    }

    showToast(msg, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `px-4 py-3 rounded-xl border text-sm font-mono flex items-center gap-2 shadow-xl transform transition-all duration-300 translate-y-10 opacity-0`;
        if (type === 'error') toast.classList.add('bg-red-900/90', 'border-red-500', 'text-white');
        else if (type === 'success') toast.classList.add('bg-green-900/90', 'border-green-500', 'text-white');
        else toast.classList.add('bg-[#111]', 'border-white/20', 'text-white');
        toast.innerHTML = `<span>${msg}</span>`;
        this.elements.toastContainer.appendChild(toast);
        requestAnimationFrame(() => toast.classList.remove('translate-y-10', 'opacity-0'));
        setTimeout(() => {
            toast.classList.add('translate-y-10', 'opacity-0');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    switchFolder(id) {
        this.currentFolder = id;
        const buttons = this.elements.root.querySelectorAll('.w-64 button');
        buttons.forEach(b => b.classList.remove('bg-white/5', 'text-white'));
        this.showToast(`Switched to ${id} folder`);
    }
}

window.TalkoApp = new TalkoApp();
