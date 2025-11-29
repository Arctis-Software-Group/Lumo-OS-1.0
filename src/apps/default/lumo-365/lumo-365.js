window.Lumo365 = {
    state: {
        activeTab: 'word',
        docs: [],
        sheets: {}, // { "A1": "value", "B1": "formula" }
        slides: [
            { id: 1, title: "Click to add title", subtitle: "Subtitle" }
        ],
        activeSlideIndex: 0,
        activeCell: null,
        ai: {
            accessKey: localStorage.getItem('lumora_key') || '',
            model: 'x-ai/grok-4.1-fast:free',
            history: [],
            isProcessing: false
        }
    },

    buildMarkup() {
        return `
            <div class="flex-1 flex flex-col bg-[var(--bg-dark)] text-[var(--text-main)] font-sans overflow-hidden">
                <!-- Header -->
                <div class="h-12 bg-[var(--window-header)] border-b border-[var(--window-border)] flex items-center justify-between px-4 select-none">
                    <div class="flex items-center gap-3">
                        <div class="w-6 h-6 bg-blue-600 flex items-center justify-center text-white font-bold text-xs rounded-sm font-dot">365</div>
                        <span class="font-dot font-bold text-xl tracking-wider uppercase">Lumo 365</span>
                        <div class="h-4 w-[1px] bg-[var(--window-border)]"></div>
                         <div class="flex gap-2">
                            <button data-tab="word" class="lumo-365-tab active nothing-btn text-xs border-none hover:bg-[var(--card-bg)] opacity-60">WORD</button>
                            <button data-tab="excel" class="lumo-365-tab nothing-btn text-xs border-none hover:bg-[var(--card-bg)] opacity-60">EXCEL</button>
                            <button data-tab="powerpoint" class="lumo-365-tab nothing-btn text-xs border-none hover:bg-[var(--card-bg)] opacity-60">SLIDE</button>
                        </div>
                    </div>
                    <div class="flex items-center gap-3">
                        <button id="lumo-365-save" class="nothing-btn text-xs flex items-center gap-2 px-3 py-1">
                            <i class="fa-solid fa-save"></i> SAVE
                        </button>
                        <button onclick="Lumo365.toggleAI()" class="nothing-btn text-xs flex items-center gap-2 px-3 py-1 bg-[var(--accent)] text-white border-[var(--accent)] hover:bg-red-700">
                            <i class="fa-solid fa-sparkles"></i> AI
                        </button>
                    </div>
                </div>

                <!-- Main Content Area -->
                <div id="lumo-365-content" class="flex-1 overflow-hidden relative flex">
                    
                    <!-- Content -->
                    <div class="flex-1 relative">
                        <!-- Word View -->
                        <div id="view-word" class="absolute inset-0 flex flex-col">
                           <!-- Toolbar -->
                            <div class="h-10 border-b border-[var(--window-border)] flex items-center px-4 gap-3 bg-[var(--bg-dark)] bg-dot-matrix overflow-x-auto">
                                <select class="bg-transparent text-xs border border-[var(--input-border)] rounded px-2 py-1 outline-none text-[var(--text-main)] font-dot uppercase"><option>Inter</option><option>Roboto</option><option>VT323</option></select>
                                <select class="bg-transparent text-xs border border-[var(--input-border)] rounded px-2 py-1 outline-none text-[var(--text-main)] font-dot"><option>11</option><option>12</option><option>14</option><option>18</option><option>24</option><option>36</option></select>
                                <div class="w-[1px] h-4 bg-[var(--window-border)]"></div>
                                <button onclick="document.execCommand('bold')" class="w-6 h-6 flex items-center justify-center hover:bg-[var(--window-border)] rounded"><i class="fa-solid fa-bold text-xs"></i></button>
                                <button onclick="document.execCommand('italic')" class="w-6 h-6 flex items-center justify-center hover:bg-[var(--window-border)] rounded"><i class="fa-solid fa-italic text-xs"></i></button>
                                <button onclick="document.execCommand('underline')" class="w-6 h-6 flex items-center justify-center hover:bg-[var(--window-border)] rounded"><i class="fa-solid fa-underline text-xs"></i></button>
                            </div>
                            <div class="flex-1 overflow-y-auto p-8 bg-[var(--bg-dark)] flex justify-center">
                                <div id="word-editor" class="w-[210mm] min-h-[297mm] bg-[var(--card-bg)] shadow-xl p-12 text-[var(--text-main)] border border-[var(--window-border)] outline-none" contenteditable="true">
                                    <h1 class="text-3xl font-bold mb-4">Untitled Document</h1>
                                    <p>Start typing...</p>
                                </div>
                            </div>
                        </div>

                        <!-- Excel View -->
                        <div id="view-excel" class="absolute inset-0 flex flex-col hidden">
                             <div class="h-8 border-b border-[var(--window-border)] flex items-center px-2 bg-[var(--bg-dark)] bg-dot-matrix text-xs font-mono">
                                <div class="px-2 text-[var(--text-muted)] w-10 font-dot" id="excel-active-cell-id"></div>
                                <div class="w-[1px] h-4 bg-[var(--window-border)] mx-2"></div>
                                <div class="px-2 text-[var(--text-muted)] font-dot">fx</div>
                                <input type="text" id="excel-formula-bar" class="flex-1 bg-transparent outline-none border-l border-[var(--window-border)] px-2 text-[var(--text-main)] font-mono" placeholder="Function...">
                            </div>
                            <div class="flex-1 overflow-auto bg-[var(--card-bg)]" id="excel-grid">
                                <!-- Grid generated by JS -->
                            </div>
                        </div>

                        <!-- PowerPoint View -->
                        <div id="view-powerpoint" class="absolute inset-0 flex hidden">
                            <div class="w-48 border-r border-[var(--window-border)] bg-[var(--bg-dark)] flex flex-col gap-4 p-4 overflow-y-auto">
                                <div id="ppt-slides-list" class="space-y-4">
                                    <!-- Slides injected here -->
                                </div>
                                <button id="ppt-add-slide" class="nothing-btn w-full text-xs">
                                    + New Slide
                                </button>
                            </div>
                            <div class="flex-1 bg-[var(--bg-dark)] flex items-center justify-center p-8">
                                <div id="ppt-current-slide" class="aspect-video w-full max-w-4xl bg-[var(--card-bg)] shadow-2xl border border-[var(--window-border)] p-12 flex flex-col justify-center items-center text-center relative overflow-hidden" contenteditable="true">
                                    <!-- Slide content -->
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- AI Sidebar -->
                    <div id="l365-ai-sidebar" class="w-80 bg-[var(--window-bg)] border-l border-[var(--window-border)] flex flex-col absolute right-0 top-0 bottom-0 z-20 transform transition-transform duration-300 translate-x-full shadow-2xl">
                        <!-- Header -->
                        <div class="h-12 border-b border-[var(--window-border)] flex items-center justify-between px-4 bg-[var(--bg-dark)] bg-dot-matrix-red">
                            <span class="font-dot font-bold text-lg flex items-center gap-2 text-[var(--text-main)] uppercase"><i class="fa-solid fa-robot text-[var(--accent)]"></i> Business AI</span>
                            <button onclick="Lumo365.toggleAI()" class="text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors"><i class="fa-solid fa-times text-lg"></i></button>
                        </div>
                        
                        <!-- Settings -->
                        <div class="p-4 border-b border-[var(--window-border)] bg-[var(--bg-dark)]">
                            <div class="mb-3">
                                <label class="text-[10px] uppercase font-dot text-[var(--text-muted)] mb-1 block">Access Key</label>
                                <input type="password" id="l365-api-key" placeholder="LUMORA_ACCESS_KEY" class="w-full bg-transparent border-b border-[var(--input-border)] px-2 py-1 text-xs text-[var(--text-main)] outline-none font-mono focus:border-[var(--accent)]" value="${this.state.ai.accessKey}" onchange="Lumo365.saveKey(this.value)">
                            </div>
                            <div>
                                <label class="text-[10px] uppercase font-dot text-[var(--text-muted)] mb-1 block">Model</label>
                                <select id="l365-model-select" class="w-full bg-transparent border-b border-[var(--input-border)] px-2 py-1 text-xs text-[var(--text-main)] outline-none font-dot uppercase focus:border-[var(--accent)]" onchange="Lumo365.setModel(this.value)">
                                    <option value="x-ai/grok-4.1-fast:free">GROK 4.1 (Free)</option>
                                    <option value="google/gemini-3-pro-preview">GEMINI 3.0 Pro PREVIEW (1/day)</option>
                                </select>
                            </div>
                        </div>

                        <!-- Quick Actions (Context Aware) -->
                        <div id="l365-quick-actions" class="p-4 grid grid-cols-2 gap-2 border-b border-[var(--window-border)] bg-[var(--bg-dark)]">
                            <!-- Injected by JS -->
                        </div>

                        <!-- Chat -->
                        <div id="l365-chat-messages" class="flex-1 overflow-y-auto p-4 space-y-4 font-sans text-xs bg-[var(--bg-dark)]">
                            <div class="p-3 rounded border border-[var(--window-border)] bg-[var(--card-bg)] text-[var(--text-muted)] font-dot">
                                How can I help with your document today?
                            </div>
                        </div>

                        <!-- Input -->
                        <div class="p-4 border-t border-[var(--window-border)] bg-[var(--bg-dark)]">
                            <div class="relative">
                                <textarea id="l365-chat-input" placeholder="Ask AI..." class="w-full bg-[var(--card-bg)] border border-[var(--input-border)] rounded p-3 pr-10 text-xs text-[var(--text-main)] outline-none focus:border-[var(--accent)] resize-none h-24 font-mono" onkeydown="if(event.key==='Enter' && !event.shiftKey){event.preventDefault(); Lumo365.sendChat();}"></textarea>
                                <button onclick="Lumo365.sendChat()" class="absolute bottom-3 right-3 text-[var(--accent)] hover:text-white transition-colors">
                                    <i class="fa-solid fa-paper-plane"></i>
                                </button>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        `;
    },

    init(win) {
        this.win = win;
        this.bindEvents();
        this.renderExcelGrid();
        this.renderSlides();
        this.updateQuickActions();
    },

    bindEvents() {
        const tabs = this.win.querySelectorAll('.lumo-365-tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                // Update Tab UI
                tabs.forEach(t => {
                    t.classList.remove('active', 'opacity-100', 'bg-[var(--card-bg)]');
                    t.classList.add('opacity-60');
                });
                tab.classList.remove('opacity-60');
                tab.classList.add('active', 'opacity-100', 'bg-[var(--card-bg)]');

                // Switch Views
                const target = tab.dataset.tab;
                this.state.activeTab = target;
                this.win.querySelector('#view-word').classList.add('hidden');
                this.win.querySelector('#view-excel').classList.add('hidden');
                this.win.querySelector('#view-powerpoint').classList.add('hidden');
                this.win.querySelector(`#view-${target}`).classList.remove('hidden');
                
                this.updateQuickActions();
            });
        });

        // Save
        this.win.querySelector('#lumo-365-save').addEventListener('click', () => {
            this.saveFile();
        });

        // Set initial active state
        const activeTab = this.win.querySelector('[data-tab="word"]');
        if (activeTab) activeTab.click();

        // Excel Formula Bar
        const formulaBar = this.win.querySelector('#excel-formula-bar');
        if (formulaBar) {
            formulaBar.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && this.state.activeCell) {
                    const val = formulaBar.value;
                    this.updateCell(this.state.activeCell, val);
                }
            });
        }

        // PowerPoint Add Slide
        const addSlideBtn = this.win.querySelector('#ppt-add-slide');
        if (addSlideBtn) {
            addSlideBtn.addEventListener('click', () => {
                this.state.slides.push({ id: Date.now(), title: "New Slide", subtitle: "Click to edit" });
                this.state.activeSlideIndex = this.state.slides.length - 1;
                this.renderSlides();
            });
        }
    },

    // --- AI Logic ---
    
    toggleAI() {
        const sidebar = this.win.querySelector('#l365-ai-sidebar');
        if (sidebar) {
            sidebar.classList.toggle('translate-x-full');
        }
    },

    saveKey(val) {
        this.state.ai.accessKey = val;
        localStorage.setItem('lumora_key', val);
    },

    setModel(val) {
        this.state.ai.model = val;
    },

    updateQuickActions() {
        const container = this.win.querySelector('#l365-quick-actions');
        if (!container) return;

        let actions = [];
        if (this.state.activeTab === 'word') {
            actions = [
                { icon: 'fa-align-left', label: 'Summarize', prompt: 'Summarize the document content concisely.' },
                { icon: 'fa-wand-magic-sparkles', label: 'Improve', prompt: 'Improve the writing style and grammar of the document.' }
            ];
        } else if (this.state.activeTab === 'excel') {
            actions = [
                { icon: 'fa-table', label: 'Gen Table', prompt: 'Generate a sample data table for sales.' },
                { icon: 'fa-chart-pie', label: 'Analyze', prompt: 'Analyze the data (mock).' }
            ];
        } else if (this.state.activeTab === 'powerpoint') {
            actions = [
                { icon: 'fa-film', label: 'Gen Slides', prompt: 'Generate a slide deck structure about Artificial Intelligence.' },
                { icon: 'fa-lightbulb', label: 'Ideas', prompt: 'Suggest slide topics.' }
            ];
        }

        container.innerHTML = actions.map(a => `
            <button onclick="Lumo365.triggerQuickAction('${a.prompt}')" class="nothing-btn flex flex-col items-center gap-1 hover:bg-[var(--card-bg)] transition py-3 h-auto">
                <i class="fa-solid ${a.icon} text-[var(--accent)] text-lg mb-1"></i>
                <span class="text-[10px] font-bold">${a.label}</span>
            </button>
        `).join('');
    },

    triggerQuickAction(prompt) {
        const input = this.win.querySelector('#l365-chat-input');
        if (input) {
            input.value = prompt;
            this.sendChat();
        }
    },

    appendMessage(role, content) {
        const container = this.win.querySelector('#l365-chat-messages');
        if (!container) return;

        const div = document.createElement('div');
        div.className = `p-3 rounded border text-xs ${role === 'user' ? 'bg-[var(--accent)] text-white border-[var(--accent)] ml-4' : 'bg-[var(--card-bg)] border-[var(--window-border)] mr-4'}`;
        
        // Simple content processing
        if (role === 'assistant') {
            // Check for specific "commands" in response to update UI
            if (content.includes('[[UPDATE_WORD]]')) {
                 const newContent = content.replace('[[UPDATE_WORD]]', '').trim();
                 const editor = this.win.querySelector('#word-editor');
                 if(editor) editor.innerHTML = newContent;
                 div.textContent = "I've updated the document.";
            } else if (content.includes('[[UPDATE_SLIDE_TITLE]]')) {
                const newTitle = content.replace('[[UPDATE_SLIDE_TITLE]]', '').trim();
                this.state.slides[this.state.activeSlideIndex].title = newTitle;
                this.renderSlides();
                div.textContent = `Updated slide title to: ${newTitle}`;
            } else if (content.includes('[[GENERATE_SLIDES]]')) {
                try {
                    const jsonStr = content.replace('[[GENERATE_SLIDES]]', '').trim();
                    const newSlides = JSON.parse(jsonStr);
                    if (Array.isArray(newSlides)) {
                        this.state.slides = newSlides;
                        this.state.activeSlideIndex = 0;
                        this.renderSlides();
                        div.textContent = `Generated ${newSlides.length} new slides.`;
                    } else {
                         div.textContent = "Error: AI returned invalid slide format.";
                    }
                } catch (e) {
                    console.error("Failed to parse slides", e);
                    div.textContent = "Error parsing generated slides.";
                }
            } else {
                div.textContent = content;
            }
        } else {
            div.textContent = content;
        }

        container.appendChild(div);
        container.scrollTop = container.scrollHeight;
    },

    async sendChat() {
        const input = this.win.querySelector('#l365-chat-input');
        const text = input.value.trim();
        if (!text || this.state.ai.isProcessing) return;

        if (!this.state.ai.accessKey) {
            alert('Please enter your LUMORA_ACCESS_KEY');
            return;
        }

        input.value = '';
        this.appendMessage('user', text);
        this.state.ai.isProcessing = true;

        // Context Gathering
        let context = '';
        if (this.state.activeTab === 'word') {
            context = 'Current Document Content:\n' + (this.win.querySelector('#word-editor').innerText || '');
        } else if (this.state.activeTab === 'powerpoint') {
            context = 'Current Slide Title: ' + this.state.slides[this.state.activeSlideIndex].title;
        }

        // Add loading
        const container = this.win.querySelector('#l365-chat-messages');
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'p-2 text-xs text-[var(--text-muted)] italic font-dot';
        loadingDiv.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Processing...';
        container.appendChild(loadingDiv);

        try {
            const response = await fetch('/api/lumora/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: this.state.ai.model,
                    accessKey: this.state.ai.accessKey,
                    messages: [
                        { role: 'system', content: `You are a helpful business assistant in Lumo 365. 
                        Current App: ${this.state.activeTab}. 
                        Context: ${context}. 
                        
                        RESPONSE RULES:
                        1. If the user asks to update the Word document, provide the full new HTML content prefixed with [[UPDATE_WORD]].
                        2. If the user asks to update the current slide title, provide just the title prefixed with [[UPDATE_SLIDE_TITLE]].
                        3. If the user asks to GENERATE NEW SLIDES (e.g. "create a presentation about X"), provide a JSON ARRAY of slide objects prefixed with [[GENERATE_SLIDES]].
                           Format: [[GENERATE_SLIDES]] [{"title": "Slide 1", "subtitle": "Content..."}, {"title": "Slide 2", "subtitle": "..."}]
                           Do NOT wrap the JSON in markdown code blocks. Just the raw string after the prefix.
                        4. Otherwise, answer normally.` },
                        ...this.state.ai.history.map(m => ({ role: m.role, content: m.content })),
                        { role: 'user', content: text }
                    ]
                })
            });

            const data = await response.json();
            loadingDiv.remove();

            if (data.error) {
                this.appendMessage('assistant', `Error: ${data.error}`);
            } else {
                const reply = data.choices[0].message.content;
                this.state.ai.history.push({ role: 'user', content: text });
                this.state.ai.history.push({ role: 'assistant', content: reply });
                this.appendMessage('assistant', reply);
            }

        } catch (e) {
            console.error(e);
            loadingDiv.remove();
            this.appendMessage('assistant', 'Error connecting to AI service.');
        } finally {
            this.state.ai.isProcessing = false;
        }
    },

    // --- Excel Logic ---

    renderExcelGrid() {
        const grid = this.win.querySelector('#excel-grid');
        if (!grid) return;

        let html = '<table class="w-full border-collapse text-xs font-mono text-[var(--text-main)]">';

        // Header Row
        html += '<tr><th class="w-10 bg-[var(--input-bg)] border border-[var(--window-border)]"></th>';
        for (let i = 0; i < 10; i++) {
            html += `<th class="w-24 bg-[var(--input-bg)] border border-[var(--window-border)] py-1 text-[var(--text-muted)]">${String.fromCharCode(65 + i)}</th>`;
        }
        html += '</tr>';

        // Rows
        for (let r = 1; r <= 20; r++) {
            html += `<tr><td class="bg-[var(--input-bg)] border border-[var(--window-border)] text-center text-[var(--text-muted)]">${r}</td>`;
            for (let c = 0; c < 10; c++) {
                const cellId = `${String.fromCharCode(65 + c)}${r}`;
                const val = this.state.sheets[cellId] || '';
                html += `<td class="border border-[var(--window-border)] bg-[var(--card-bg)] p-0">
                    <input type="text" data-cell="${cellId}" value="${val}" 
                        class="w-full h-full bg-transparent border-none outline-none px-1 focus:bg-[var(--accent)]/10 text-[var(--text-main)]"
                        onfocus="window.Lumo365.onCellFocus(this)"
                        onblur="window.Lumo365.onCellBlur(this)">
                </td>`;
            }
            html += '</tr>';
        }
        html += '</table>';
        grid.innerHTML = html;
    },

    onCellFocus(input) {
        const cellId = input.dataset.cell;
        this.state.activeCell = cellId;
        const formulaBar = this.win.querySelector('#excel-formula-bar');
        const activeCellDisplay = this.win.querySelector('#excel-active-cell-id');

        if (formulaBar) formulaBar.value = this.state.sheets[cellId] || '';
        if (activeCellDisplay) activeCellDisplay.innerText = cellId;
    },

    onCellBlur(input) {
        const cellId = input.dataset.cell;
        const val = input.value;
        this.updateCell(cellId, val);
    },

    updateCell(cellId, value) {
        this.state.sheets[cellId] = value;
        if (value.startsWith('=')) {
            try {
                const res = eval(value.substring(1));
                // Note: In a real app, we'd update the display value, not the stored formula, or separate them.
                // For now, this is a simple mockup.
            } catch (e) { }
        }
    },

    // --- PowerPoint Logic ---

    renderSlides() {
        const list = this.win.querySelector('#ppt-slides-list');
        const currentSlideView = this.win.querySelector('#ppt-current-slide');
        if (!list || !currentSlideView) return;

        // Render List
        list.innerHTML = this.state.slides.map((slide, index) => `
            <div class="aspect-video bg-[var(--card-bg)] border ${index === this.state.activeSlideIndex ? 'border-[var(--accent)] ring-1 ring-[var(--accent)]' : 'border-[var(--window-border)]'} shadow-sm flex items-center justify-center text-[var(--text-muted)] text-xs cursor-pointer hover:opacity-80 transition"
                onclick="window.Lumo365.switchSlide(${index})">
                <div class="transform scale-[0.2] origin-center w-full text-center pointer-events-none">
                    <h1 class="text-xl font-bold">${slide.title}</h1>
                </div>
                <span class="absolute bottom-1 right-1 text-[8px] opacity-50">${index + 1}</span>
            </div>
        `).join('');

        // Render Current Slide
        const activeSlide = this.state.slides[this.state.activeSlideIndex];
        if (activeSlide) {
            currentSlideView.innerHTML = `
                <h1 class="text-5xl font-bold mb-4 text-[var(--text-main)] outline-none" contenteditable="true" 
                    onblur="window.Lumo365.updateSlideTitle(this)">${activeSlide.title}</h1>
                <p class="text-xl text-[var(--text-muted)] outline-none" contenteditable="true"
                    onblur="window.Lumo365.updateSlideSubtitle(this)">${activeSlide.subtitle}</p>
            `;
        }
    },

    switchSlide(index) {
        this.state.activeSlideIndex = index;
        this.renderSlides();
    },

    updateSlideTitle(el) {
        this.state.slides[this.state.activeSlideIndex].title = el.innerText;
        this.renderSlides(); // Re-render thumbnails
    },

    updateSlideSubtitle(el) {
        this.state.slides[this.state.activeSlideIndex].subtitle = el.innerText;
    },

    loadFile(file, folderId) {
        this.state.currentFile = { id: file.id, folderId };
        try {
            const content = JSON.parse(file.content);
            
            if (content.type === 'word') {
                this.win.querySelector('[data-tab="word"]').click();
                const editor = this.win.querySelector('#word-editor');
                if (editor) editor.innerHTML = content.html || '';
            } else if (content.type === 'excel') {
                this.win.querySelector('[data-tab="excel"]').click();
                this.state.sheets = content.sheets || {};
                this.renderExcelGrid();
            } else if (content.type === 'powerpoint') {
                this.win.querySelector('[data-tab="powerpoint"]').click();
                this.state.slides = content.slides || [{ id: 1, title: "Click to add title", subtitle: "Subtitle" }];
                this.state.activeSlideIndex = 0;
                this.renderSlides();
            }
        } catch (e) {
            console.error('Failed to load file', e);
        }
    },

    saveFile() {
        if (!this.state.currentFile) {
            alert('Please create a file in Files app first.');
            return;
        }
        
        let content = {};
        const tab = this.state.activeTab;
        
        if (tab === 'word') {
            const editor = this.win.querySelector('#word-editor');
            content = { type: 'word', html: editor.innerHTML };
        } else if (tab === 'excel') {
            content = { type: 'excel', sheets: this.state.sheets };
        } else if (tab === 'powerpoint') {
            content = { type: 'powerpoint', slides: this.state.slides };
        }
        
        window.FileSystem.updateFile(
            this.state.currentFile.folderId, 
            this.state.currentFile.id, 
            JSON.stringify(content)
        );
        
        const btn = this.win.querySelector('#lumo-365-save');
        const oldText = btn.innerHTML;
        btn.innerHTML = '<i class="fa-solid fa-check"></i> SAVED';
        setTimeout(() => btn.innerHTML = oldText, 1000);
    }
};