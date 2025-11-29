class Lumora {
    constructor() {
        this.id = 'lumora';
        this.models = [
            { id: 'x-ai/grok-4.1-fast', name: 'Grok 4.1 Fast' },
            { id: 'google/gemini-2.5-flash', name: 'Gemini 2.5 Flash' },
            { id: 'google/gemini-2.5-flash-lite', name: 'Gemini 2.5 Flash Lite' },
            { id: 'liquid/lfm2-8b-a1b', name: 'Liquid LFM2 8B' },
            { id: 'google/gemini-3-pro-preview', name: 'Gemini 3.0 Pro (1/day)' }
        ];
        this.currentModel = 'x-ai/grok-4.1-fast';
        this.chatHistory = []; // Current active chat messages
        this.sessions = []; // List of saved sessions
        this.currentSessionId = null;
        this.accessKey = localStorage.getItem('lumora_access_key') || ''; // Store key for API calls
        this.isGenerating = false; // Prevent spamming
        this.pendingImage = null; // Store base64 image
        this.guidedLearning = false; // Guided Learning Mode

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

                <!-- Canvas Panel (Right Side) -->
                <div id="lumora-canvas" class="absolute top-0 right-0 h-full w-full md:w-1/2 bg-[#0a0a0a] border-l border-white/10 transform translate-x-full transition-transform duration-300 z-[55] flex flex-col shadow-2xl">
                    <div class="p-4 border-b border-white/10 flex justify-between items-center bg-[#111]">
                         <div class="flex items-center gap-3">
                             <span class="text-xs font-mono text-gray-400 uppercase tracking-widest">Canvas</span>
                             <span id="lumora-canvas-title" class="font-dot text-white font-bold truncate max-w-[150px]">Untitled</span>
                         </div>
                         <div class="flex gap-1">
                             <button id="lumora-canvas-download" class="w-8 h-8 flex items-center justify-center rounded hover:bg-white/10 text-gray-400 hover:text-white transition-colors" title="Download .md">
                                 <i class="fa-solid fa-download"></i>
                             </button>
                             <button id="lumora-canvas-save-files" class="w-8 h-8 flex items-center justify-center rounded hover:bg-white/10 text-gray-400 hover:text-white transition-colors" title="Save to Lumo Files">
                                 <i class="fa-solid fa-folder-plus"></i>
                             </button>
                             <button id="lumora-canvas-export-365" class="w-8 h-8 flex items-center justify-center rounded hover:bg-white/10 text-gray-400 hover:text-white transition-colors" title="Export to Lumo 365">
                                 <i class="fa-solid fa-arrow-up-right-from-square"></i>
                             </button>
                             <div class="w-[1px] h-6 bg-white/10 mx-1 self-center"></div>
                             <button id="lumora-canvas-close" class="w-8 h-8 flex items-center justify-center rounded hover:bg-red-500/20 text-gray-400 hover:text-red-500 transition-colors">
                                 <i class="fa-solid fa-xmark"></i>
                             </button>
                         </div>
                    </div>
                    <div id="lumora-canvas-content" class="flex-1 overflow-auto p-0 bg-[#0f0f0f] relative">
                        <!-- Content goes here -->
                        <div class="flex flex-col items-center justify-center h-full text-gray-600 font-mono text-xs">
                            <i class="fa-solid fa-layer-group text-4xl mb-4 opacity-20"></i>
                            <p>Waiting for content...</p>
                        </div>
                    </div>
                </div>

                <!-- Main Interface -->
                <div class="flex-1 flex flex-col relative z-0 overflow-hidden bg-black bg-dot-matrix">
                    
                    <!-- Chat Area (Full Screen) -->
                    <div id="lumora-chat-area" class="flex-1 overflow-y-auto p-4 pb-48 space-y-6 scroll-smooth relative">
                        <!-- Welcome Screen -->
                        <div class="flex flex-col items-center justify-center h-full text-white absolute inset-0 pointer-events-none" id="lumora-welcome">
                            <h1 class="font-dot text-4xl md:text-6xl mb-8 tracking-widest text-center">Welcome to Lumora</h1>
                        </div>
                        <!-- Messages go here -->
                    </div>

                    <!-- Floating Input Area -->
                    <div class="absolute bottom-0 left-0 right-0 p-6 z-50 flex justify-center pointer-events-none">
                        <div class="w-full max-w-3xl pointer-events-auto relative">
                             
                             <!-- Tools Menu Popup -->
                             <div id="lumora-tools-menu" class="absolute bottom-full left-0 mb-4 bg-black border border-dotted border-white rounded-[24px] p-2 hidden w-64 z-50 shadow-2xl">
                                  <button id="lumora-tool-canvas" class="w-full text-left text-white font-dot p-3 hover:bg-white/10 rounded-xl flex items-center gap-3 transition-colors">
                                       <i class="fa-solid fa-layer-group"></i> Canvas
                                  </button>
                                  <button id="lumora-tool-guided" class="w-full text-left text-white font-dot p-3 hover:bg-white/10 rounded-xl flex items-center gap-3 transition-colors">
                                       <i class="fa-solid fa-book-open"></i> Guided Learning
                                  </button>
                             </div>

                             <!-- Input Container -->
                             <div class="bg-black border-2 border-dotted border-white rounded-[32px] p-1 flex flex-col gap-1 transition-all focus-within:border-white relative shadow-lg">
                                  
                                  <!-- Label -->
                                  <div class="px-5 pt-3 text-gray-400 font-sans text-sm tracking-wide">Talk to Lumora</div>

                                  <!-- Image Preview -->
                                  <div id="lumora-image-preview" class="hidden px-4 py-2 relative">
                                      <img id="lumora-preview-img" class="h-16 w-auto rounded border border-white/20">
                                      <button id="lumora-remove-img" class="absolute top-0 left-16 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px]">
                                          <i class="fa-solid fa-xmark"></i>
                                      </button>
                                  </div>

                                  <!-- Textarea -->
                                  <textarea id="lumora-input" rows="1" class="w-full bg-transparent border-none outline-none text-white px-5 py-1 resize-none font-mono text-lg min-h-[40px] placeholder-transparent" placeholder="Ask..."></textarea>

                                  <!-- Controls -->
                                  <div class="flex items-center justify-between px-3 pb-2">
                                       <!-- Left Controls -->
                                       <div class="flex items-center gap-3">
                                            <button id="lumora-attach-btn" class="w-10 h-10 rounded-full text-white hover:bg-white/20 flex items-center justify-center transition-colors">
                                                 <i class="fa-solid fa-plus text-lg"></i>
                                                 <input type="file" id="lumora-file-input" accept="image/*" class="hidden">
                                            </button>
                                            <button id="lumora-tools-btn" class="flex items-center gap-2 text-white font-dot hover:bg-white/20 px-4 py-2 rounded-full transition-colors text-sm tracking-wide">
                                                 <i class="fa-solid fa-screwdriver-wrench"></i> ツール
                                            </button>
                                       </div>

                                       <!-- Right Controls -->
                                       <div class="flex items-center gap-2 relative">
                                            <button id="lumora-model-btn" class="text-white font-dot text-sm flex items-center gap-2 hover:bg-white/20 px-4 py-2 rounded-full transition-colors tracking-wide">
                                                 <span id="lumora-current-model-name">Grok 4.1 Fast</span> <i class="fa-solid fa-chevron-down"></i>
                                            </button>
                                            <!-- Model Dropdown (repositioned) -->
                                            <div id="lumora-model-dropdown" class="absolute bottom-full right-0 mb-2 w-56 bg-[#111] border border-white/10 rounded-xl shadow-2xl overflow-hidden hidden z-50">
                                                ${this.models.map(m => `
                                                    <button class="w-full text-left px-4 py-3 text-xs font-mono text-gray-400 hover:bg-white/10 hover:text-white transition border-b border-white/5 last:border-0"
                                                        data-model-id="${m.id}" data-model-name="${m.name}">
                                                        ${m.name}
                                                    </button>
                                                `).join('')}
                                            </div>

                                            <button id="lumora-send-btn" class="w-10 h-10 rounded-full text-white hover:bg-white/20 flex items-center justify-center transition-colors">
                                                 <i class="fa-solid fa-arrow-up text-lg"></i>
                                            </button>
                                            <button id="lumora-voice-btn" class="w-10 h-10 rounded-full text-white hover:bg-white/20 flex items-center justify-center transition-colors">
                                                 <i class="fa-solid fa-microphone text-lg"></i>
                                            </button>
                                       </div>
                                  </div>
                             </div>
                             <div class="text-center mt-2 opacity-0 hover:opacity-100 transition-opacity">
                                 <p class="text-[10px] text-gray-600 font-mono">Powered by Lumo OS AI Core</p>
                             </div>
                        </div>
                    </div>

                    <!-- History Sidebar Button (Always visible now, top left) -->
                    <button id="lumora-toggle-sidebar" class="absolute top-4 left-4 z-50 w-10 h-10 bg-black/50 backdrop-blur border border-white/10 rounded-full text-white flex items-center justify-center hover:bg-white/20 transition-colors">
                         <i class="fa-solid fa-clock-rotate-left"></i>
                    </button>

                    <!-- Sidebar (History) - Slide Over -->
                    <div class="absolute top-0 left-0 h-full w-72 bg-black/95 backdrop-blur-xl border-r border-dotted border-white/30 transform -translate-x-full transition-transform duration-300 z-[60] flex flex-col" id="lumora-sidebar">
                        <div class="p-6 border-b border-dotted border-white/30 flex items-center justify-between">
                            <span class="font-dot text-xl tracking-widest text-white">HISTORY</span>
                            <button id="lumora-close-sidebar" class="text-gray-400 hover:text-white"><i class="fa-solid fa-xmark text-xl"></i></button>
                        </div>
                        <div class="p-4">
                            <button id="lumora-new-chat-btn" class="w-full flex items-center justify-center gap-2 bg-white text-black border border-white text-sm font-bold py-3 rounded-full hover:bg-gray-200 transition-all font-dot tracking-wider">
                                <i class="fa-solid fa-plus"></i> NEW CHAT
                            </button>
                        </div>
                        <div id="lumora-history-list" class="flex-1 overflow-y-auto p-4 space-y-2">
                            <!-- History items injected here -->
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

        this.toolsBtn = win.querySelector('#lumora-tools-btn');
        this.toolsBtn.innerHTML = '<i class="fa-solid fa-screwdriver-wrench"></i> Tools';

        this.toolsMenu = win.querySelector('#lumora-tools-menu');
        this.toolCanvas = win.querySelector('#lumora-tool-canvas');
        this.toolGuided = win.querySelector('#lumora-tool-guided');

        // Canvas Elements
        this.canvasPanel = win.querySelector('#lumora-canvas');
        this.canvasTitle = win.querySelector('#lumora-canvas-title');
        this.canvasContent = win.querySelector('#lumora-canvas-content');
        this.canvasDownloadBtn = win.querySelector('#lumora-canvas-download');
        this.canvasSaveFilesBtn = win.querySelector('#lumora-canvas-save-files');
        this.canvasExport365Btn = win.querySelector('#lumora-canvas-export-365');
        this.canvasCloseBtn = win.querySelector('#lumora-canvas-close');
        
        this.activeCanvasData = null; // Stores current canvas state { type, title, content }

        this.voiceBtn = win.querySelector('#lumora-voice-btn'); // We need to add this ID to the HTML
        this.isRecording = false;

        // Voice Logic
        if ('webkitSpeechRecognition' in window) {
             this.recognition = new webkitSpeechRecognition();
             this.recognition.continuous = false;
             this.recognition.interimResults = false;
             this.recognition.lang = 'en-US'; // Default to English

             this.recognition.onresult = (event) => {
                  const transcript = event.results[0][0].transcript;
                  this.input.value += (this.input.value ? ' ' : '') + transcript;
                  this.input.focus();
             };

             this.recognition.onend = () => {
                  this.isRecording = false;
                  this.voiceBtn.classList.remove('text-red-500', 'animate-pulse');
                  this.voiceBtn.classList.add('text-white');
             };

             this.voiceBtn.addEventListener('click', () => {
                  if (this.isRecording) {
                       this.recognition.stop();
                  } else {
                       this.recognition.start();
                       this.isRecording = true;
                       this.voiceBtn.classList.remove('text-white');
                       this.voiceBtn.classList.add('text-red-500', 'animate-pulse');
                  }
             });
        } else {
             this.voiceBtn.style.display = 'none';
        }

        // Tools Logic
        this.toolsBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toolsMenu.classList.toggle('hidden');
        });

        this.toolCanvas.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toolsMenu.classList.add('hidden');
            this.toggleCanvas();
        });

        this.canvasCloseBtn.addEventListener('click', () => this.toggleCanvas(false));
        this.canvasDownloadBtn.addEventListener('click', () => this.handleCanvasDownload());
        this.canvasSaveFilesBtn.addEventListener('click', () => this.handleCanvasSaveToFiles());
        this.canvasExport365Btn.addEventListener('click', () => this.handleCanvasExport365());

        this.toolGuided.addEventListener('click', (e) => {
            e.stopPropagation();
            this.guidedLearning = !this.guidedLearning;
            this.toolsMenu.classList.add('hidden');
            
            // Update button text
            if (this.guidedLearning) {
                 this.toolGuided.innerHTML = '<i class="fa-solid fa-check text-green-400"></i> Guided Learning';
                 this.appendMessage('assistant', '**Guided Learning Mode Activated**\nI will now help you learn by providing hints instead of direct answers.');
            } else {
                 this.toolGuided.innerHTML = '<i class="fa-solid fa-book-open"></i> Guided Learning';
                 this.appendMessage('assistant', '**Guided Learning Mode Deactivated**');
            }
        });

        window.addEventListener('click', () => {
            if (this.toolsMenu && !this.toolsMenu.classList.contains('hidden')) {
                this.toolsMenu.classList.add('hidden');
            }
        });

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

    // --- Canvas Logic ---

    toggleCanvas(show = null) {
        if (show === null) {
            this.canvasPanel.classList.toggle('translate-x-full');
        } else if (show) {
            this.canvasPanel.classList.remove('translate-x-full');
        } else {
            this.canvasPanel.classList.add('translate-x-full');
        }
    }

    updateCanvas(type, title, content) {
        this.activeCanvasData = { type, title, content };
        this.canvasTitle.innerText = title;
        this.renderCanvasContent();
        this.toggleCanvas(true);
    }

    renderCanvasContent() {
        if (!this.activeCanvasData) return;
        const { type, content } = this.activeCanvasData;

        this.canvasContent.innerHTML = '';
        
        if (type === 'html') {
            const iframe = document.createElement('iframe');
            iframe.className = 'w-full h-full border-none bg-white';
            iframe.sandbox = 'allow-scripts allow-same-origin'; // Be careful with this
            iframe.srcdoc = content;
            this.canvasContent.appendChild(iframe);
        } else if (type === 'markdown') {
            const container = document.createElement('div');
            container.className = 'p-6 prose prose-invert max-w-none';
            container.innerHTML = this.parseMarkdown(content);
            this.canvasContent.appendChild(container);
        } else if (type === 'slides') {
             // Simple JSON preview for now
             const pre = document.createElement('pre');
             pre.className = 'p-4 text-xs text-green-400 overflow-auto h-full';
             pre.innerText = content; // Expecting JSON
             this.canvasContent.appendChild(pre);
        } else {
            const pre = document.createElement('pre');
            pre.className = 'p-4 whitespace-pre-wrap font-mono text-sm';
            pre.innerText = content;
            this.canvasContent.appendChild(pre);
        }
    }

    handleCanvasDownload() {
        if (!this.activeCanvasData) return;
        const { type, title, content } = this.activeCanvasData;
        let ext = 'txt';
        if (type === 'html') ext = 'html';
        if (type === 'markdown') ext = 'md';
        if (type === 'slides') ext = 'json';

        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${title.replace(/\s+/g, '_')}.${ext}`;
        a.click();
        URL.revokeObjectURL(url);
    }

    handleCanvasSaveToFiles() {
        if (!this.activeCanvasData) return;
        if (!window.FileSystem) {
            alert('File System not available');
            return;
        }
        const { type, title, content } = this.activeCanvasData;
        let docType = 'Text';
        if (type === 'html') docType = 'HTML';
        if (type === 'markdown') docType = 'Lumo Doc';
        
        // Save to Documents folder
        window.FileSystem.createFile('documents', title, docType, content);
        alert(`Saved "${title}" to Documents.`);
    }

    handleCanvasExport365() {
        if (!this.activeCanvasData) return;
        const { type, title, content } = this.activeCanvasData;

        // Check if Lumo 365 is available
        // Since Lumo 365 is an app, we might need to launch it with data.
        // Currently we can only simulate this by setting global state or saving file.
        
        if (type === 'markdown' || type === 'text') {
            // Try to set for Word
            if (window.Lumo365) {
                // If Lumo 365 is loaded in memory
                // We can try to inject into state if accessible, but Lumo365.state might be reset on reopen if not persisted.
                // Best way: Save to FileSystem and tell user.
                // OR: Open Lumo 365 and try to inject via DOM if it opens in same window.
                // Let's try to find the Lumo 365 app in systemApps
                
                // Trigger open app
                const app = window.getAllApps().find(a => a.id === 'lumo-365');
                if (app) {
                    window.openApp(app);
                    // Wait for it to open
                    setTimeout(() => {
                         const editor = document.getElementById('word-editor');
                         if (editor) {
                             editor.innerHTML = this.parseMarkdown(content); // Convert MD to HTML for Word
                             // Also trigger tab switch
                             const wordTab = document.querySelector('.lumo-365-tab[data-tab="word"]');
                             if (wordTab) wordTab.click();
                         }
                    }, 1000);
                }
            } else {
                 // Fallback: Save to files
                 this.handleCanvasSaveToFiles();
                 alert('Opened Lumo 365 (mock). Content saved to files.');
            }
        } else if (type === 'slides') {
            // Expecting JSON array of slides
            try {
                const slides = JSON.parse(content);
                 const app = window.getAllApps().find(a => a.id === 'lumo-365');
                if (app) {
                    window.openApp(app);
                    setTimeout(() => {
                         if (window.Lumo365 && window.Lumo365.state) {
                             window.Lumo365.state.slides = slides;
                             window.Lumo365.renderSlides();
                             const pptTab = document.querySelector('.lumo-365-tab[data-tab="powerpoint"]');
                             if (pptTab) pptTab.click();
                         }
                    }, 1000);
                }
            } catch (e) {
                alert('Invalid slide data for export.');
            }
        } else {
            alert('This content type cannot be exported to Lumo 365 directly.');
        }
    }

    appendMessage(role, text, image = null) {
        if (this.welcomeMsg) this.welcomeMsg.style.display = 'none';

        // Check for Canvas Action
        let canvasData = null;
        if (role === 'assistant') {
            const canvasRegex = /<canvas_action type="([^"]+)" title="([^"]+)" content_type="([^"]+)">([\s\S]*?)<\/canvas_action>/;
            const match = text.match(canvasRegex);
            if (match) {
                // type="create", title="...", content_type="html|markdown|..."
                const [fullMatch, actionType, title, contentType, content] = match;
                canvasData = { title, type: contentType, content };
                
                // Update Canvas immediately
                this.updateCanvas(contentType, title, content);
                
                // Replace the tag with a code block so the raw content is visible in chat
                const codeLang = contentType === 'slides' ? 'json' : contentType;
                text = text.replace(fullMatch, `\n\n*Created Canvas: ${title}*\n\`\`\`${codeLang}\n${content}\n\`\`\`\n`);
            }
        }

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
            
            // Add "Open Canvas" button if this message triggered one
            if (canvasData) {
                content += `
                    <button class="mt-3 w-full border border-white/20 bg-white/5 hover:bg-white/10 text-left px-3 py-2 rounded-lg flex items-center gap-3 transition-colors group"
                        onclick="window.Lumora.updateCanvas('${canvasData.type}', '${canvasData.title}', \`${canvasData.content.replace(/`/g, '\\`').replace(/\$/g, '\\$')}\`)">
                        <div class="w-8 h-8 rounded bg-blue-500/20 flex items-center justify-center text-blue-400 group-hover:text-blue-300">
                            <i class="fa-solid fa-layer-group"></i>
                        </div>
                        <div class="flex flex-col">
                            <span class="text-xs font-bold text-gray-300 group-hover:text-white">Open Canvas</span>
                            <span class="text-[10px] text-gray-500 group-hover:text-gray-400">${canvasData.title}</span>
                        </div>
                        <i class="fa-solid fa-chevron-right ml-auto text-gray-600 group-hover:text-gray-400 text-xs"></i>
                    </button>
                `;
            }
        } else {
            content += text.replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, '<br>');
        }

        bubble.innerHTML = content;
        div.appendChild(bubble);
        this.chatArea.appendChild(div);
        this.chatArea.scrollTop = this.chatArea.scrollHeight;

        // Store original text (without canvas tag stripped? No, stripping is better for history context usually, 
        // but we might want to keep it if we re-feed history. 
        // For now, I'll store the STRIPPED text to avoid re-triggering or confusing the model with its own output format if not needed.
        // Actually, keeping the tag in history might help the model know it already did it.
        // But `canvasData` is local.
        // Let's store the stripped text + a note.
        
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
                { role: 'system', content: `You are Lumora, an advanced AI assistant integrated into Lumo OS. You are helpful, concise, and have a personality inspired by "Nothing" design philosophy.
                
                CANVAS FEATURE:
                You have access to a "Canvas" feature for generating long content, code, HTML previews, or learning materials.
                When the user asks for code, an article, a test, or to "use canvas", output the content wrapped in this XML tag:
                
                <canvas_action type="create" title="Brief Title" content_type="html|markdown|slides">
                ... content here ...
                </canvas_action>
                
                - Use "html" for web previews (complete HTML document).
                - Use "markdown" for long text, articles, or simple code snippets.
                - Use "slides" for presentations (JSON array of objects: [{title: "...", subtitle: "..."}]).
                - Do NOT use markdown code blocks inside the <canvas_action> tag for "html" or "slides" types. For "markdown" type, you can use standard markdown.
                ` },
                ...(this.guidedLearning ? [{ role: 'system', content: 'You are in Guided Learning Mode. Use the Canvas to create custom tests or learning modules if appropriate (content_type="markdown").' }] : []),
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
        this.currentModel = session.model || 'x-ai/grok-4.1-fast';

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
