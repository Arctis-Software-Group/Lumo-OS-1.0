(() => {
    // State
    let accessKey = localStorage.getItem('lumora_key') || '';
    let currentModel = 'x-ai/grok-4.1-fast:free';
    let chatHistory = [];
    let isProcessing = false;

    const buildMarkup = () => `
        <div class="flex-1 flex flex-col bg-[var(--bg-dark)] text-[var(--text-main)] font-sans overflow-hidden">
            <!-- Header -->
            <div class="h-12 bg-[var(--window-header)] border-b border-[var(--window-border)] flex items-center justify-between px-4 select-none">
                <div class="flex items-center gap-3">
                    <div class="w-6 h-6 bg-[var(--accent)] flex items-center justify-center text-black font-bold text-xs rounded-sm font-dot">&lt;/&gt;</div>
                    <span class="font-dot font-bold text-xl tracking-wider uppercase">Lumo Dev</span>
                    <div class="h-4 w-[1px] bg-[var(--window-border)]"></div>
                    <div class="flex gap-4 text-xs font-dot uppercase tracking-widest text-[var(--text-muted)]">
                        <span class="hover:text-white cursor-pointer transition-colors">File</span>
                        <span class="hover:text-white cursor-pointer transition-colors">Edit</span>
                        <span class="hover:text-white cursor-pointer transition-colors">View</span>
                    </div>
                </div>
                <div class="flex items-center gap-3">
                    <button class="nothing-btn text-xs flex items-center gap-2 px-3 py-1" onclick="LumoDev.runCode()">
                        <i class="fa-solid fa-play"></i> Run
                    </button>
                    <button class="nothing-btn text-xs flex items-center gap-2 px-3 py-1 bg-[var(--accent)] text-white border-[var(--accent)] hover:bg-red-700" onclick="LumoDev.toggleAI()">
                        <i class="fa-solid fa-sparkles"></i> AI
                    </button>
                </div>
            </div>

            <!-- Main Area -->
            <div class="flex-1 flex overflow-hidden">
                <!-- Left Sidebar (Explorer) -->
                <div class="w-12 md:w-56 bg-[var(--window-bg)] border-r border-[var(--window-border)] flex flex-col">
                    <div class="hidden md:block px-4 py-3 text-xs font-dot font-bold text-[var(--text-muted)] uppercase tracking-widest border-b border-[var(--window-border)] bg-dot-matrix">Explorer</div>
                    <div class="flex flex-col gap-1 px-2 py-2">
                        <div class="flex items-center gap-3 px-3 py-2 bg-[var(--card-border)] rounded-sm text-[var(--text-main)] cursor-pointer text-xs font-mono group border border-transparent hover:border-[var(--accent)] transition-all">
                            <i class="fa-brands fa-html5 text-[var(--accent)] group-hover:scale-110 transition-transform"></i> <span class="hidden md:inline">index.html</span>
                        </div>
                        <div class="flex items-center gap-3 px-3 py-2 hover:bg-[var(--card-border)] rounded-sm cursor-pointer text-[var(--text-muted)] hover:text-[var(--text-main)] transition text-xs font-mono border border-transparent hover:border-[var(--window-border)]">
                            <i class="fa-brands fa-css3-alt text-blue-500"></i> <span class="hidden md:inline">style.css</span>
                        </div>
                        <div class="flex items-center gap-3 px-3 py-2 hover:bg-[var(--card-border)] rounded-sm cursor-pointer text-[var(--text-muted)] hover:text-[var(--text-main)] transition text-xs font-mono border border-transparent hover:border-[var(--window-border)]">
                            <i class="fa-brands fa-js text-yellow-500"></i> <span class="hidden md:inline">script.js</span>
                        </div>
                    </div>
                </div>

                <!-- Editor & Preview -->
                <div class="flex-1 flex flex-col md:flex-row relative">
                    <!-- Editor -->
                    <div class="flex-1 flex flex-col min-w-0">
                        <div class="flex-1 relative">
                            <textarea id="ld-editor" class="absolute inset-0 w-full h-full bg-[var(--bg-dark)] text-[#e4e4e7] p-6 outline-none resize-none font-mono text-sm leading-relaxed border-none selection:bg-[var(--accent)] selection:text-white" spellcheck="false"><!DOCTYPE html>
<html>
<head>
    <style>
        body { 
            background: #000; 
            color: #fff; 
            font-family: 'Courier New', monospace;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
        }
        h1 {
            font-size: 4rem;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            color: #d71921;
        }
        p { color: #888; }
    </style>
</head>
<body>
    <h1>Lumo Dev</h1>
    <p>Nothing OS Style Editor</p>
</body>
</html></textarea>
                        </div>
                    </div>

                    <!-- Preview -->
                    <div class="flex-1 flex flex-col border-l border-[var(--window-border)] bg-white min-w-0">
                        <div class="h-8 bg-[#f4f4f5] border-b border-[#e4e4e7] flex items-center px-2 gap-2 justify-between">
                            <div class="flex gap-1.5">
                                <div class="w-2 h-2 rounded-full bg-[#d4d4d8]"></div>
                                <div class="w-2 h-2 rounded-full bg-[#d4d4d8]"></div>
                                <div class="w-2 h-2 rounded-full bg-[#d4d4d8]"></div>
                            </div>
                            <div class="bg-white border border-[#e4e4e7] rounded px-3 py-0.5 text-[10px] text-[#71717a] font-mono shadow-sm">Live Preview</div>
                            <div class="w-4"></div>
                        </div>
                        <iframe id="ld-preview" class="flex-1 w-full h-full border-none bg-white"></iframe>
                    </div>
                </div>

                <!-- AI Sidebar (Nothing OS Style) -->
                <div id="ld-ai-sidebar" class="w-80 bg-[var(--window-bg)] border-l border-[var(--window-border)] flex flex-col absolute right-0 top-0 bottom-0 z-20 transform transition-transform duration-300 translate-x-full shadow-2xl">
                    <!-- AI Header -->
                    <div class="h-12 border-b border-[var(--window-border)] flex items-center justify-between px-4 bg-[var(--bg-dark)] bg-dot-matrix-red">
                        <span class="font-dot font-bold text-lg flex items-center gap-2 text-[var(--text-main)] uppercase"><i class="fa-solid fa-robot text-[var(--accent)]"></i> AI Assistant</span>
                        <button onclick="LumoDev.toggleAI()" class="text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors"><i class="fa-solid fa-times text-lg"></i></button>
                    </div>
                    
                    <!-- Settings / Auth -->
                    <div class="p-4 border-b border-[var(--window-border)] bg-[var(--window-bg)] space-y-3">
                        <div>
                            <label class="text-[10px] font-dot uppercase text-[var(--text-muted)] mb-1 block">Access Key</label>
                            <input type="password" id="ld-api-key" placeholder="KEY..." class="w-full bg-black border border-[var(--input-border)] rounded-sm px-3 py-2 text-xs text-white outline-none focus:border-[var(--accent)] font-mono transition-colors" value="${accessKey}" onchange="LumoDev.saveKey(this.value)">
                        </div>
                        <div>
                            <label class="text-[10px] font-dot uppercase text-[var(--text-muted)] mb-1 block">Model</label>
                            <select id="ld-model-select" class="w-full bg-black border border-[var(--input-border)] rounded-sm px-2 py-2 text-xs text-white outline-none focus:border-[var(--accent)] font-mono appearance-none cursor-pointer hover:border-gray-500 transition-colors" onchange="LumoDev.setModel(this.value)">
                                <option value="x-ai/grok-4.1-fast:free">GROK 4.1 (FREE)</option>
                                <option value="google/gemini-3-pro-preview">GEMINI 3.0 PRO (1/DAY)</option>
                            </select>
                        </div>
                    </div>

                    <!-- Chat Area -->
                    <div id="ld-chat-messages" class="flex-1 overflow-y-auto p-4 space-y-4 font-mono text-xs bg-[var(--bg-dark)]">
                        <div class="bg-[var(--card-bg)] p-3 rounded border border-[var(--card-border)] text-[var(--text-muted)]">
                            <span class="font-dot text-[var(--accent)] uppercase block mb-1">System</span>
                            Hello. I am ready to code.
                        </div>
                    </div>

                    <!-- Input -->
                    <div class="p-4 border-t border-[var(--window-border)] bg-[var(--window-bg)]">
                        <div class="relative">
                            <textarea id="ld-chat-input" placeholder="INSTRUCT AI..." class="w-full bg-black border border-[var(--input-border)] rounded-sm p-3 pr-10 text-xs text-white outline-none focus:border-[var(--accent)] resize-none h-24 font-mono transition-colors placeholder:text-gray-700" onkeydown="if(event.key==='Enter' && !event.shiftKey){event.preventDefault(); LumoDev.sendChat();}"></textarea>
                            <button onclick="LumoDev.sendChat()" class="absolute bottom-3 right-3 text-[var(--accent)] hover:text-white transition-colors">
                                <i class="fa-solid fa-arrow-right text-lg"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Status Bar -->
            <div class="h-8 bg-[var(--window-header)] border-t border-[var(--window-border)] flex items-center justify-between px-4 text-[10px] font-dot font-bold tracking-widest uppercase text-[var(--text-muted)]">
                <span class="flex items-center gap-2"><div class="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-pulse"></div> READY</span>
                <span id="ld-status">LN 1, COL 1</span>
            </div>
        </div>
    `;

    const init = (win) => {
        runCode();
        const editor = win.querySelector('#ld-editor');
        editor.addEventListener('input', () => {
            // Debounce could be added
        });
        editor.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                e.preventDefault();
                const start = editor.selectionStart;
                const end = editor.selectionEnd;
                editor.value = editor.value.substring(0, start) + "    " + editor.value.substring(end);
                editor.selectionStart = editor.selectionEnd = start + 4;
            }
        });
    };

    const runCode = () => {
        const editor = document.querySelector('#ld-editor');
        const preview = document.querySelector('#ld-preview');
        if (editor && preview) {
            preview.srcdoc = editor.value;
        }
    };

    const toggleAI = () => {
        const sidebar = document.querySelector('#ld-ai-sidebar');
        if (sidebar) {
            sidebar.classList.toggle('translate-x-full');
        }
    };

    const saveKey = (val) => {
        accessKey = val;
        localStorage.setItem('lumora_key', val);
    };

    const setModel = (val) => {
        currentModel = val;
    };

    const appendMessage = (role, content) => {
        const container = document.querySelector('#ld-chat-messages');
        if (!container) return;

        const div = document.createElement('div');
        div.className = `p-2 rounded border text-xs ${role === 'user' ? 'bg-[var(--accent)]/10 border-[var(--accent)]/30 ml-4' : 'bg-[var(--card-bg)] border-[var(--card-border)] mr-4'}`;
        
        if (role === 'assistant') {
            // Parse code blocks
            const parts = content.split(/(```[\s\S]*?```)/g);
            parts.forEach(part => {
                if (part.startsWith('```')) {
                    const code = part.replace(/```\w*\n?/, '').replace(/```$/, '');
                    const codeBlock = document.createElement('div');
                    codeBlock.className = 'mt-2 mb-2 bg-[var(--bg-dark)] p-2 rounded border border-[var(--window-border)] relative group';
                    
                    const pre = document.createElement('pre');
                    pre.className = 'overflow-x-auto font-mono text-[var(--text-muted)]';
                    pre.textContent = code;
                    
                    const applyBtn = document.createElement('button');
                    applyBtn.className = 'absolute top-1 right-1 bg-[var(--accent)] text-white px-2 py-0.5 rounded text-[10px] opacity-0 group-hover:opacity-100 transition-opacity font-dot uppercase';
                    applyBtn.innerHTML = '<i class="fa-solid fa-check"></i> Apply';
                    applyBtn.onclick = () => applyCode(code);
                    
                    codeBlock.appendChild(pre);
                    codeBlock.appendChild(applyBtn);
                    div.appendChild(codeBlock);
                } else {
                    const p = document.createElement('p');
                    p.className = 'whitespace-pre-wrap font-mono';
                    p.textContent = part;
                    div.appendChild(p);
                }
            });
        } else {
            div.textContent = content;
        }

        container.appendChild(div);
        container.scrollTop = container.scrollHeight;
    };

    const sendChat = async () => {
        const input = document.querySelector('#ld-chat-input');
        const text = input.value.trim();
        if (!text || isProcessing) return;

        if (!accessKey) {
            alert('Please enter your LUMORA_ACCESS_KEY');
            return;
        }

        input.value = '';
        appendMessage('user', text);
        isProcessing = true;
        
        // Add loading indicator
        const loadingId = 'loading-' + Date.now();
        const container = document.querySelector('#ld-chat-messages');
        const loadingDiv = document.createElement('div');
        loadingDiv.id = loadingId;
        loadingDiv.className = 'p-2 text-xs text-[#71717a] italic';
        loadingDiv.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> AI is thinking...';
        container.appendChild(loadingDiv);

        try {
            const editor = document.querySelector('#ld-editor');
            const currentCode = editor ? editor.value : '';
            
            const response = await fetch('/api/lumora/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: currentModel,
                    accessKey: accessKey,
                    messages: [
                        { role: 'system', content: 'You are an expert coding assistant in Lumo Dev. You help write HTML, CSS, and JS. Always provide full code blocks when requested. The user currently has this code:\n\n' + currentCode },
                        ...chatHistory.map(m => ({ role: m.role, content: m.content })),
                        { role: 'user', content: text }
                    ]
                })
            });

            const data = await response.json();
            
            // Remove loading
            const lDiv = document.getElementById(loadingId);
            if(lDiv) lDiv.remove();

            if (data.error) {
                appendMessage('assistant', `Error: ${data.error}`);
            } else {
                const reply = data.choices[0].message.content;
                chatHistory.push({ role: 'user', content: text });
                chatHistory.push({ role: 'assistant', content: reply });
                appendMessage('assistant', reply);
            }

        } catch (e) {
            console.error(e);
            const lDiv = document.getElementById(loadingId);
            if(lDiv) lDiv.remove();
            appendMessage('assistant', 'Error connecting to AI service.');
        } finally {
            isProcessing = false;
        }
    };

    const applyCode = (code) => {
        const editor = document.querySelector('#ld-editor');
        if (editor) {
            editor.value = code;
            runCode();
        }
    };

    window.LumoDev = { buildMarkup, init, runCode, toggleAI, saveKey, setModel, sendChat };
})();
