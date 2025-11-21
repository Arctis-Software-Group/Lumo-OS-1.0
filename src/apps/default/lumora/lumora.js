class Lumora {
    constructor() {
        this.id = 'lumora';
        this.models = [
            { id: 'google/gemini-2.5-flash', name: 'Gemini 2.5 Flash' },
            { id: 'google/gemini-2.5-flash-lite', name: 'Gemini 2.5 Flash Lite' },
            { id: 'x-ai/grok-4.1-fast', name: 'Grok 4.1 Fast' },
            { id: 'liquid/lfm2-8b-a1b', name: 'Liquid LFM2 8B' },
            { id: 'google/gemini-3-pro-preview', name: 'Gemini 3.0 Pro (1/day)' }
        ];
        this.currentModel = 'google/gemini-2.5-flash';
        this.chatHistory = []; // Current active chat messages
        this.sessions = []; // List of saved sessions
        this.currentSessionId = null;
        this.accessKey = localStorage.getItem('lumora_access_key') || ''; // Store key for API calls
        this.isGenerating = false; // Prevent spamming
        this.pendingImage = null; // Store base64 image

        // Force re-auth if key is missing but UI thinks it's unlocked
        if (localStorage.getItem('lumora_unlocked') && !this.accessKey) {
            localStorage.removeItem('lumora_unlocked');
        }
    }

    buildMarkup() {
        return `
            <div class="flex-1 flex flex-col bg-black text-white font-sans overflow-hidden relative" id="lumora-app-root">
                <!-- Auth Screen (Overlay) -->
                <div id="lumora-auth" class="absolute inset-0 z-[60] bg-black flex flex-col items-center justify-center p-6 ${localStorage.getItem('lumora_unlocked') ? 'hidden' : ''}">
                    <div class="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center mb-6 border border-white/10 p-4">
                        <img src="./src/apps/default/lumora/logo.png" class="w-full h-full object-contain opacity-80 invert" alt="Lumora Logo">
                    </div>
                    <h2 class="font-dot text-3xl mb-2 tracking-widest">LUMORA 1.0</h2>
                    <p class="text-gray-500 mb-8 text-xs tracking-[0.3em] uppercase">Restricted Access</p>
                    
                    <div class="flex flex-col gap-4 w-full max-w-xs">
                        <input type="password" id="lumora-code-input" placeholder="ENTER ACCESS CODE" 
                            class="bg-transparent border-b border-white/20 py-2 text-center text-xl tracking-widest outline-none focus:border-[#8b5cf6] transition-colors placeholder-gray-700 font-dot text-white">
                        <button id="lumora-unlock-btn" class="bg-white text-black font-bold py-3 rounded-full hover:bg-gray-200 transition-colors font-dot tracking-wider">
                            UNLOCK
                        </button>
                    </div>
                    <p id="lumora-auth-error" class="text-red-500 text-xs mt-4 hidden font-mono">INVALID ACCESS CODE</p>
                </div>

                <!-- Main Interface -->
                <div class="flex-1 flex relative z-0 overflow-hidden">
                    
                    <!-- Sidebar (History) -->
                    <div class="w-64 bg-[#0a0a0a] border-r border-white/10 flex flex-col transition-all duration-300 absolute md:relative z-20 h-full -translate-x-full md:translate-x-0" id="lumora-sidebar">
                        <div class="p-4 border-b border-white/10 flex items-center justify-between">
                            <span class="font-dot text-xs tracking-widest text-gray-400">HISTORY</span>
                            <button id="lumora-close-sidebar" class="md:hidden text-gray-400 hover:text-white"><i class="fa-solid fa-xmark"></i></button>
                        </div>
                        <div class="p-3">
                            <button id="lumora-new-chat-btn" class="w-full flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-bold py-2.5 px-4 rounded-lg transition-all">
                                <i class="fa-solid fa-plus"></i> NEW CHAT
                            </button>
                        </div>
                        <div id="lumora-history-list" class="flex-1 overflow-y-auto p-3 space-y-1">
                            <!-- History items injected here -->
                        </div>
                    </div>

                    <!-- Chat Container -->
                    <div class="flex-1 flex flex-col min-w-0 bg-black relative">
                        <!-- Header -->
                        <div class="h-14 border-b border-white/10 flex items-center justify-between px-4 bg-black/50 backdrop-blur-md z-10">
                            <div class="flex items-center gap-3">
                                <button id="lumora-toggle-sidebar" class="md:hidden text-gray-400 hover:text-white">
                                    <i class="fa-solid fa-bars"></i>
                                </button>
                                <img src="./src/apps/default/lumora/logo.png" class="w-6 h-6 object-contain invert opacity-80">
                                <span class="font-dot tracking-wider text-sm hidden sm:inline">LUMORA</span>
                            </div>
                            <div class="relative">
                                <button id="lumora-model-btn" class="text-xs font-mono text-gray-400 hover:text-white flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-lg border border-white/10 transition">
                                    <span id="lumora-current-model-name">Gemini 2.5 Flash</span>
                                    <i class="fa-solid fa-chevron-down text-[10px]"></i>
                                </button>
                                <!-- Dropdown -->
                                <div id="lumora-model-dropdown" class="absolute right-0 top-full mt-2 w-56 bg-[#111] border border-white/10 rounded-xl shadow-2xl overflow-hidden hidden z-50">
                                    ${this.models.map(m => `
                                        <button class="w-full text-left px-4 py-3 text-xs font-mono text-gray-400 hover:bg-white/10 hover:text-white transition border-b border-white/5 last:border-0"
                                            data-model-id="${m.id}" data-model-name="${m.name}">
                                            ${m.name}
                                        </button>
                                    `).join('')}
                                </div>
                            </div>
                        </div>

                        <!-- Chat Area -->
                        <div id="lumora-chat-area" class="flex-1 overflow-y-auto p-4 space-y-6 scroll-smooth relative">
                            <div class="flex flex-col items-center justify-center h-full text-gray-600 opacity-50 absolute inset-0 pointer-events-none" id="lumora-welcome">
                                <img src="./src/apps/default/lumora/logo.png" class="w-24 h-24 object-contain invert opacity-20 mb-4">
                                <p class="font-dot text-sm tracking-widest">INITIALIZED</p>
                            </div>
                            <!-- Messages go here -->
                        </div>

                        <!-- Input Area -->
                        <div class="p-4 bg-black border-t border-white/10 z-10">
                            <!-- Image Preview -->
                            <div id="lumora-image-preview" class="hidden mb-2 relative inline-block">
                                <img id="lumora-preview-img" class="h-16 w-auto rounded border border-white/20">
                                <button id="lumora-remove-img" class="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                                    <i class="fa-solid fa-xmark"></i>
                                </button>
                            </div>

                            <div class="relative flex items-end gap-2 bg-[#111] border border-white/10 rounded-2xl p-2 focus-within:border-[#8b5cf6]/50 transition-colors">
                                <button id="lumora-attach-btn" class="w-8 h-8 rounded-full text-gray-400 hover:text-white flex items-center justify-center transition-colors shrink-0 mb-1">
                                    <i class="fa-solid fa-paperclip"></i>
                                </button>
                                <input type="file" id="lumora-file-input" accept="image/*" class="hidden">
                                
                                <textarea id="lumora-input" rows="1" placeholder="Ask anything..." 
                                    class="flex-1 bg-transparent border-none outline-none text-sm text-gray-200 p-2 resize-none max-h-32 font-mono placeholder-gray-600"
                                    oninput="this.style.height = ''; this.style.height = this.scrollHeight + 'px'"></textarea>
                                <button id="lumora-send-btn" class="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center hover:bg-[#8b5cf6] hover:text-white transition-all shrink-0 mb-1">
                                    <i class="fa-solid fa-arrow-up"></i>
                                </button>
                            </div>
                            <div class="text-center mt-2">
                                 <p class="text-[10px] text-gray-600 font-mono">Powered by Lumo OS AI Core</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    init(win) {
        this.win = win;
        this.chatArea = win.querySelector('#lumora-chat-area');
        this.input = win.querySelector('#lumora-input');
        this.sendBtn = win.querySelector('#lumora-send-btn');
        this.authScreen = win.querySelector('#lumora-auth');
        this.codeInput = win.querySelector('#lumora-code-input');
        this.unlockBtn = win.querySelector('#lumora-unlock-btn');
        this.errorMsg = win.querySelector('#lumora-auth-error');
        this.welcomeMsg = win.querySelector('#lumora-welcome');
        this.modelNameDisplay = win.querySelector('#lumora-current-model-name');
        this.modelBtn = win.querySelector('#lumora-model-btn');
        this.modelDropdown = win.querySelector('#lumora-model-dropdown');
        this.historyList = win.querySelector('#lumora-history-list');
        this.newChatBtn = win.querySelector('#lumora-new-chat-btn');
        this.sidebar = win.querySelector('#lumora-sidebar');
        this.toggleSidebarBtn = win.querySelector('#lumora-toggle-sidebar');
        this.closeSidebarBtn = win.querySelector('#lumora-close-sidebar');

        this.fileInput = win.querySelector('#lumora-file-input');
        this.attachBtn = win.querySelector('#lumora-attach-btn');
        this.imagePreview = win.querySelector('#lumora-image-preview');
        this.previewImg = win.querySelector('#lumora-preview-img');
        this.removeImgBtn = win.querySelector('#lumora-remove-img');

        // Auth Logic
        this.unlockBtn.addEventListener('click', () => this.checkCode());
        this.codeInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') this.checkCode(); });

        // Chat Logic
        this.sendBtn.addEventListener('click', () => this.sendMessage());
        this.input.addEventListener('keydown', (e) => {
            // Fix: Check for IME composition to prevent sending when confirming text
            if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        // Image Upload Logic
        this.attachBtn.addEventListener('click', () => this.fileInput.click());
        this.fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
        this.removeImgBtn.addEventListener('click', () => this.clearImage());

        // Model Selector Logic
        this.modelBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.modelDropdown.classList.toggle('hidden');
        });

        window.addEventListener('click', () => {
            if (this.modelDropdown && !this.modelDropdown.classList.contains('hidden')) {
                this.modelDropdown.classList.add('hidden');
            }
        });

        this.modelDropdown.querySelectorAll('button').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.setModel(btn.dataset.modelId, btn.dataset.modelName);
                this.modelDropdown.classList.add('hidden');
            });
        });

        // Sidebar Logic
        this.newChatBtn.addEventListener('click', () => this.startNewChat());
        this.toggleSidebarBtn.addEventListener('click', () => this.sidebar.classList.remove('-translate-x-full'));
        this.closeSidebarBtn.addEventListener('click', () => this.sidebar.classList.add('-translate-x-full'));

        this.loadSessionsFromStorage();
        this.startNewChat(false);
    }

    handleFileSelect(e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
            this.pendingImage = evt.target.result; // Base64 string
            this.previewImg.src = this.pendingImage;
            this.imagePreview.classList.remove('hidden');
        };
        reader.readAsDataURL(file);
    }

    clearImage() {
        this.pendingImage = null;
        this.fileInput.value = '';
        this.imagePreview.classList.add('hidden');
    }

    async checkCode() {
        const code = this.codeInput.value.trim();
        try {
            const res = await fetch('/api/lumora/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code })
            });
            const data = await res.json();
            if (data.success) {
                this.accessKey = code;
                localStorage.setItem('lumora_unlocked', 'true');
                localStorage.setItem('lumora_access_key', code);
                this.authScreen.classList.add('hidden');
            } else {
                throw new Error('Invalid code');
            }
        } catch (e) {
            this.errorMsg.classList.remove('hidden');
            this.codeInput.classList.add('border-red-500', 'text-red-500');
            setTimeout(() => {
                this.codeInput.classList.remove('border-red-500', 'text-red-500');
                this.errorMsg.classList.add('hidden');
            }, 2000);
        }
    }

    setModel(id, name) {
        this.currentModel = id;
        if (this.modelNameDisplay) this.modelNameDisplay.innerText = name;
        if (this.currentSessionId) {
            const session = this.sessions.find(s => s.id === this.currentSessionId);
            if (session) {
                session.model = id;
                this.saveSessionsToStorage();
            }
        }
    }

    appendMessage(role, text, image = null) {
        if (this.welcomeMsg) this.welcomeMsg.style.display = 'none';

        const div = document.createElement('div');
        div.className = `flex ${role === 'user' ? 'justify-end' : 'justify-start'} animate-[fadeIn_0.3s_ease-out]`;

        const bubble = document.createElement('div');
        bubble.className = `max-w-[85%] rounded-2xl p-3 text-sm leading-relaxed shadow-sm ${role === 'user'
            ? 'bg-white text-black font-medium rounded-tr-sm'
            : 'bg-[#1a1a1a] text-gray-200 border border-white/10 rounded-tl-sm font-mono'
            }`;

        let content = '';
        if (image) {
            content += `<img src="${image}" class="max-w-full rounded-lg mb-2 border border-black/10">`;
        }

        if (role === 'assistant') {
            content += this.parseMarkdown(text);
        } else {
            content += text.replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, '<br>');
        }

        bubble.innerHTML = content;
        div.appendChild(bubble);
        this.chatArea.appendChild(div);
        this.chatArea.scrollTop = this.chatArea.scrollHeight;

        this.chatHistory.push({ role, content: text, image });
        this.updateCurrentSession();
    }

    parseMarkdown(text) {
        if (!text) return '';

        // 1. Code Blocks
        let html = text.replace(/```(\w*)([\s\S]*?)```/g, (match, lang, code) => {
            return `<div class="my-2 rounded-lg overflow-hidden border border-white/10 bg-[#0f0f0f]">
                <div class="bg-white/5 px-3 py-1 text-[10px] text-gray-400 font-mono border-b border-white/5 flex justify-between">
                    <span>${lang || 'CODE'}</span>
                    <button onclick="navigator.clipboard.writeText(this.parentElement.nextElementSibling.innerText)" class="hover:text-white"><i class="fa-regular fa-copy"></i></button>
                </div>
                <pre class="p-3 overflow-x-auto text-xs font-mono text-[#c8ffbe] whitespace-pre-wrap">${code.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
            </div>`;
        });

        // 2. Inline Code
        html = html.replace(/`([^`]+)`/g, '<code class="bg-white/10 px-1.5 py-0.5 rounded text-xs font-mono text-[#ff7eb6]">$1</code>');

        // 3. Tables
        // Simple table parser: looks for lines with |
        // This is a basic implementation.
        const tableRegex = /(\n\|.*\|\n\|[-:| ]+\|\n(\|.*\|\n)+)/g;
        html = html.replace(tableRegex, (match) => {
            const rows = match.trim().split('\n');
            let tableHtml = '<div class="overflow-x-auto my-3"><table class="w-full border-collapse border border-white/20 text-xs">';

            rows.forEach((row, index) => {
                const cols = row.split('|').filter(c => c.trim() !== '');
                if (index === 1) return; // Skip separator line

                tableHtml += '<tr>';
                cols.forEach(col => {
                    if (index === 0) {
                        tableHtml += `<th class="border border-white/20 bg-white/10 p-2 text-left font-bold text-white">${col.trim()}</th>`;
                    } else {
                        tableHtml += `<td class="border border-white/20 p-2 text-gray-300">${col.trim()}</td>`;
                    }
                });
                tableHtml += '</tr>';
            });

            tableHtml += '</table></div>';
            return tableHtml;
        });

        // 4. Bold, Italic, etc.
        html = html
            .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-bold">$1</strong>')
            .replace(/\*(.*?)\*/g, '<em class="italic text-gray-300">$1</em>')
            .replace(/__(.*?)__/g, '<u>$1</u>')
            .replace(/\n/g, '<br>');

        return html;
    }

    async sendMessage() {
        if (this.isGenerating) return; // Prevent spamming

        const text = this.input.value.trim();
        const image = this.pendingImage;

        if (!text && !image) return;

        this.isGenerating = true;
        this.input.value = '';
        this.input.style.height = 'auto';
        this.clearImage(); // Clear preview

        if (!this.currentSessionId) {
            this.createSession(text.slice(0, 30) + (text.length > 30 ? '...' : ''));
        }

        this.appendMessage('user', text, image);

        // Rate Limit Check for Gemini 3 Pro
        if (this.currentModel === 'google/gemini-3-pro-preview') {
            const lastUsage = localStorage.getItem('lumora_gemini3_last_usage');
            const today = new Date().toDateString();
            if (lastUsage === today) {
                this.appendMessage('assistant', '⚠️ **Limit Reached**: Gemini 3.0 Pro is limited to once per day. Please switch models.');
                this.isGenerating = false;
                return;
            }
            localStorage.setItem('lumora_gemini3_last_usage', today);
        }

        const loadingId = 'loading-' + Date.now();
        const loadingDiv = document.createElement('div');
        loadingDiv.id = loadingId;
        loadingDiv.className = 'flex justify-start animate-[fadeIn_0.3s_ease-out]';
        loadingDiv.innerHTML = `
            <div class="bg-[#1a1a1a] border border-white/10 rounded-2xl rounded-tl-sm p-3 flex items-center gap-1">
                <div class="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce"></div>
                <div class="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce delay-75"></div>
                <div class="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce delay-150"></div>
            </div>
        `;
        this.chatArea.appendChild(loadingDiv);
        this.chatArea.scrollTop = this.chatArea.scrollHeight;

        try {
            const messages = [
                { role: 'system', content: 'You are Lumora, an advanced AI assistant integrated into Lumo OS. You are helpful, concise, and have a personality inspired by "Nothing" design philosophy (minimalist, precise, slightly robotic but friendly).' },
                ...this.chatHistory.map(m => ({
                    role: m.role,
                    content: m.image ? [
                        { type: "text", text: m.content },
                        { type: "image_url", image_url: { url: m.image } }
                    ] : m.content
                })).slice(-10)
            ];

            const response = await fetch('/api/lumora/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: this.currentModel,
                    messages: messages,
                    accessKey: this.accessKey
                })
            });

            if (response.status === 401) {
                document.getElementById(loadingId)?.remove();
                this.appendMessage('assistant', 'Authentication failed. Please unlock again.');
                localStorage.removeItem('lumora_unlocked');
                localStorage.removeItem('lumora_access_key');
                setTimeout(() => window.location.reload(), 2000);
                return;
            }

            const data = await response.json();
            document.getElementById(loadingId)?.remove();

            if (response.ok && data.choices && data.choices[0]) {
                this.appendMessage('assistant', data.choices[0].message.content);
            } else {
                this.appendMessage('assistant', `Error: ${data.error || 'No response'}`);
            }

        } catch (e) {
            document.getElementById(loadingId)?.remove();
            this.appendMessage('assistant', `Connection Error: ${e.message}`);
        } finally {
            this.isGenerating = false;
        }
    }

    loadSessionsFromStorage() {
        try {
            const raw = localStorage.getItem('lumora_sessions');
            this.sessions = raw ? JSON.parse(raw) : [];
            this.renderHistoryList();
        } catch (e) {
            this.sessions = [];
        }
    }

    saveSessionsToStorage() {
        localStorage.setItem('lumora_sessions', JSON.stringify(this.sessions));
        this.renderHistoryList();
    }

    createSession(title = 'New Chat') {
        const id = Date.now().toString();
        this.sessions.unshift({ id, title, messages: [], model: this.currentModel, date: new Date().toISOString() });
        this.currentSessionId = id;
        this.chatHistory = [];
        this.saveSessionsToStorage();
        return id;
    }

    updateCurrentSession() {
        if (!this.currentSessionId) return;
        const session = this.sessions.find(s => s.id === this.currentSessionId);
        if (session) {
            session.messages = [...this.chatHistory];
            if (this.chatHistory.length === 2 && this.chatHistory[0].role === 'user') {
                session.title = this.chatHistory[0].content.slice(0, 30);
            }
            this.saveSessionsToStorage();
        }
    }

    startNewChat(clear = true) {
        this.currentSessionId = null;
        this.chatHistory = [];
        if (this.chatArea) {
            this.chatArea.innerHTML = '';
            this.chatArea.appendChild(this.welcomeMsg);
            this.welcomeMsg.style.display = 'flex';
        }
        if (clear) this.renderHistoryList();
    }

    loadSession(id) {
        const session = this.sessions.find(s => s.id === id);
        if (!session) return;

        this.currentSessionId = id;
        this.chatHistory = session.messages || [];
        this.currentModel = session.model || 'google/gemini-2.5-flash';

        if (this.modelNameDisplay) {
            const modelObj = this.models.find(m => m.id === this.currentModel);
            this.modelNameDisplay.innerText = modelObj ? modelObj.name : this.currentModel;
        }

        if (this.chatArea) {
            this.chatArea.innerHTML = '';
            this.chatArea.appendChild(this.welcomeMsg);
            this.welcomeMsg.style.display = 'none';

            this.chatHistory.forEach(msg => {
                const div = document.createElement('div');
                div.className = `flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} mb-4`;
                const bubble = document.createElement('div');
                bubble.className = `max-w-[85%] rounded-2xl p-3 text-sm leading-relaxed shadow-sm ${msg.role === 'user'
                    ? 'bg-white text-black font-medium rounded-tr-sm'
                    : 'bg-[#1a1a1a] text-gray-200 border border-white/10 rounded-tl-sm font-mono'
                    }`;

                let content = '';
                if (msg.image) {
                    content += `<img src="${msg.image}" class="max-w-full rounded-lg mb-2 border border-black/10">`;
                }
                if (msg.role === 'assistant') {
                    content += this.parseMarkdown(msg.content);
                } else {
                    content += msg.content.replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, '<br>');
                }
                bubble.innerHTML = content;
                div.appendChild(bubble);
                this.chatArea.appendChild(div);
            });
            this.chatArea.scrollTop = this.chatArea.scrollHeight;
        }

        if (window.innerWidth < 768 && this.sidebar) {
            this.sidebar.classList.add('-translate-x-full');
        }
        this.renderHistoryList();
    }

    deleteSession(id, e) {
        e.stopPropagation();
        if (confirm('Delete this chat?')) {
            this.sessions = this.sessions.filter(s => s.id !== id);
            if (this.currentSessionId === id) this.startNewChat();
            this.saveSessionsToStorage();
        }
    }

    renderHistoryList() {
        if (!this.historyList) return;
        this.historyList.innerHTML = this.sessions.map(s => `
            <div class="group flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${s.id === this.currentSessionId ? 'bg-white/10 text-white' : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'}"
                onclick="window.Lumora.loadSession('${s.id}')">
                <div class="flex flex-col overflow-hidden">
                    <span class="text-xs font-medium truncate font-dot">${s.title || 'New Chat'}</span>
                    <span class="text-[10px] opacity-50 truncate">${new Date(s.date).toLocaleDateString()}</span>
                </div>
                <button class="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 transition-opacity px-2"
                    onclick="window.Lumora.deleteSession('${s.id}', event)">
                    <i class="fa-solid fa-trash text-[10px]"></i>
                </button>
            </div>
        `).join('');
    }
}

window.Lumora = new Lumora();
