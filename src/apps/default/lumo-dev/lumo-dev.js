(() => {
    const buildMarkup = () => `
        <div class="flex-1 flex flex-col bg-[var(--bg-dark)] text-[var(--text-main)] font-mono text-sm">
            <!-- Header -->
            <div class="h-12 bg-[var(--window-header)] border-b border-[var(--window-border)] flex items-center justify-between px-4 select-none">
                <div class="flex items-center gap-3">
                    <div class="w-6 h-6 bg-[var(--accent)] flex items-center justify-center text-black font-bold text-xs rounded-sm">&lt;/&gt;</div>
                    <span class="font-dot font-bold text-[var(--text-main)] tracking-wider uppercase">Lumo Dev</span>
                    <span class="text-xs text-[var(--text-muted)] font-dot border border-[var(--window-border)] px-2 rounded-full">index.html</span>
                </div>
                <div class="flex items-center gap-2">
                    <button class="nothing-btn text-xs flex items-center gap-2" onclick="LumoDev.runCode()">
                        <i class="fa-solid fa-play text-[var(--accent)]"></i> RUN
                    </button>
                    <button class="nothing-btn text-xs flex items-center gap-2" onclick="LumoDev.exportProject()">
                        EXPORT
                    </button>
                </div>
            </div>

            <!-- Main Area -->
            <div class="flex-1 flex overflow-hidden">
                <!-- Sidebar -->
                <div class="w-48 bg-[var(--card-bg)] border-r border-[var(--window-border)] flex flex-col pt-4">
                    <div class="px-4 mb-2 text-[10px] font-bold text-[var(--accent)] uppercase tracking-widest font-dot">Explorer</div>
                    <div class="flex flex-col gap-1 px-2">
                        <div class="flex items-center gap-2 px-3 py-2 bg-[var(--input-bg)] border border-[var(--window-border)] rounded-sm text-[var(--text-main)] cursor-pointer">
                            <i class="fa-brands fa-html5 text-gray-400"></i> index.html
                        </div>
                        <div class="flex items-center gap-2 px-3 py-2 hover:bg-[var(--input-bg)] rounded-sm cursor-pointer text-[var(--text-muted)] transition">
                            <i class="fa-brands fa-css3-alt text-gray-600"></i> style.css
                        </div>
                        <div class="flex items-center gap-2 px-3 py-2 hover:bg-[var(--input-bg)] rounded-sm cursor-pointer text-[var(--text-muted)] transition">
                            <i class="fa-brands fa-js text-gray-600"></i> script.js
                        </div>
                    </div>
                </div>

                <!-- Editor & Preview -->
                <div class="flex-1 flex flex-col md:flex-row bg-[var(--bg-dark)]">
                    <!-- Editor -->
                    <div class="flex-1 flex flex-col border-r border-[var(--window-border)]">
                        <textarea id="ld-editor" class="flex-1 bg-[var(--bg-dark)] text-[var(--text-main)] p-6 outline-none resize-none font-mono leading-relaxed border-none selection:bg-[var(--accent)] selection:text-white" spellcheck="false">&lt;!DOCTYPE html&gt;
&lt;html&gt;
&lt;head&gt;
    &lt;style&gt;
        body { 
            background: #000; 
            color: #fff; 
            font-family: 'Courier New', monospace;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
        }
        h1 {
            border-bottom: 2px solid #d71921;
            padding-bottom: 10px;
            font-size: 3rem;
            letter-spacing: -2px;
        }
    &lt;/style&gt;
&lt;/head&gt;
&lt;body&gt;
    &lt;h1&gt;HELLO LUMO&lt;/h1&gt;
&lt;/body&gt;
&lt;/html&gt;</textarea>
                    </div>

                    <!-- Preview -->
                    <div class="flex-1 bg-white flex flex-col border-l border-[var(--window-border)]">
                        <div class="h-8 bg-[var(--window-header)] border-b border-[var(--window-border)] flex items-center px-2 gap-2 justify-between">
                            <div class="flex gap-1.5">
                                <div class="w-2 h-2 rounded-full bg-[var(--window-border)]"></div>
                                <div class="w-2 h-2 rounded-full bg-[var(--window-border)]"></div>
                                <div class="w-2 h-2 rounded-full bg-[var(--window-border)]"></div>
                            </div>
                            <div class="bg-[var(--input-bg)] border border-[var(--window-border)] rounded px-3 py-0.5 text-[10px] text-[var(--text-muted)] font-mono">localhost:3000</div>
                            <div class="w-4"></div>
                        </div>
                        <iframe id="ld-preview" class="flex-1 w-full h-full border-none bg-white"></iframe>
                    </div>
                </div>
            </div>
            
            <!-- Status Bar -->
            <div class="h-6 bg-[var(--accent)] text-white flex items-center justify-between px-3 text-[10px] font-bold font-dot tracking-wider">
                <span>READY</span>
                <span>LN 1, COL 1</span>
            </div>
        </div>
    `;

    const init = (win) => {
        runCode();
        const editor = win.querySelector('#ld-editor');
        editor.addEventListener('input', () => {
            // Simple debounce could go here
        });
    };

    const runCode = () => {
        const editor = document.querySelector('#ld-editor');
        const preview = document.querySelector('#ld-preview');
        if (editor && preview) {
            preview.srcdoc = editor.value;
        }
    };

    const exportProject = () => {
        alert('Project exported as lumo-project.zip');
    };

    window.LumoDev = { buildMarkup, init, runCode, exportProject };
})();
