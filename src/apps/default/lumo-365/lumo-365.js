window.Lumo365 = {
    state: {
        activeTab: 'word',
        docs: [],
        sheets: {}, // { "A1": "value", "B1": "formula" }
        slides: [
            { id: 1, title: "Click to add title", subtitle: "Subtitle" }
        ],
        activeSlideIndex: 0,
        activeCell: null
    },

    buildMarkup() {
        return `
            <div class="flex flex-col h-full bg-[var(--bg-dark)] text-[var(--text-main)] font-sans">
                <!-- App Header / Tab Switcher -->
                <div class="flex items-center justify-between px-4 py-2 border-b border-[var(--window-border)] bg-[var(--window-header)]">
                    <div class="flex items-center gap-4">
                        <div class="w-8 h-8 bg-white/5 rounded flex items-center justify-center border border-white/10">
                            <img src="./src/apps/default/lumo-365/logo.png" class="w-6 h-6 object-contain invert opacity-80">
                        </div>
                        <div class="flex gap-2">
                            <button data-tab="word" class="lumo-365-tab active flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors hover:bg-[var(--card-bg)]">
                                <i class="fa-solid fa-file-word text-blue-500"></i>
                                <span class="text-sm font-bold">Word</span>
                            </button>
                            <button data-tab="excel" class="lumo-365-tab flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors hover:bg-[var(--card-bg)]">
                                <i class="fa-solid fa-file-excel text-green-500"></i>
                                <span class="text-sm font-bold">Excel</span>
                            </button>
                            <button data-tab="powerpoint" class="lumo-365-tab flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors hover:bg-[var(--card-bg)]">
                                <i class="fa-solid fa-file-powerpoint text-orange-500"></i>
                                <span class="text-sm font-bold">Slide</span>
                            </button>
                        </div>
                    </div>
                    <div class="flex items-center gap-3">
                        <button class="text-xs font-mono bg-[var(--accent)] text-white px-3 py-1 rounded hover:opacity-80">SAVE</button>
                        <i class="fa-solid fa-user-circle text-xl opacity-50"></i>
                    </div>
                </div>

                <!-- Main Content Area -->
                <div id="lumo-365-content" class="flex-1 overflow-hidden relative">
                    
                    <!-- Word View -->
                    <div id="view-word" class="absolute inset-0 flex flex-col">
                        <div class="h-10 border-b border-[var(--window-border)] flex items-center px-4 gap-3 bg-[var(--input-bg)] overflow-x-auto">
                            <select class="bg-transparent text-xs border border-[var(--input-border)] rounded px-2 py-1 outline-none text-[var(--text-main)]"><option>Inter</option><option>Roboto</option><option>VT323</option></select>
                            <select class="bg-transparent text-xs border border-[var(--input-border)] rounded px-2 py-1 outline-none text-[var(--text-main)]"><option>11</option><option>12</option><option>14</option><option>18</option><option>24</option><option>36</option></select>
                            <div class="w-[1px] h-4 bg-[var(--window-border)]"></div>
                            <button onclick="document.execCommand('bold')" class="w-6 h-6 flex items-center justify-center hover:bg-[var(--window-border)] rounded"><i class="fa-solid fa-bold text-xs"></i></button>
                            <button onclick="document.execCommand('italic')" class="w-6 h-6 flex items-center justify-center hover:bg-[var(--window-border)] rounded"><i class="fa-solid fa-italic text-xs"></i></button>
                            <button onclick="document.execCommand('underline')" class="w-6 h-6 flex items-center justify-center hover:bg-[var(--window-border)] rounded"><i class="fa-solid fa-underline text-xs"></i></button>
                            <div class="w-[1px] h-4 bg-[var(--window-border)]"></div>
                            <button onclick="document.execCommand('justifyLeft')" class="w-6 h-6 flex items-center justify-center hover:bg-[var(--window-border)] rounded"><i class="fa-solid fa-align-left text-xs"></i></button>
                            <button onclick="document.execCommand('justifyCenter')" class="w-6 h-6 flex items-center justify-center hover:bg-[var(--window-border)] rounded"><i class="fa-solid fa-align-center text-xs"></i></button>
                            <button onclick="document.execCommand('justifyRight')" class="w-6 h-6 flex items-center justify-center hover:bg-[var(--window-border)] rounded"><i class="fa-solid fa-align-right text-xs"></i></button>
                            <div class="w-[1px] h-4 bg-[var(--window-border)]"></div>
                            <button onclick="document.execCommand('insertUnorderedList')" class="w-6 h-6 flex items-center justify-center hover:bg-[var(--window-border)] rounded"><i class="fa-solid fa-list-ul text-xs"></i></button>
                            <button onclick="document.execCommand('insertOrderedList')" class="w-6 h-6 flex items-center justify-center hover:bg-[var(--window-border)] rounded"><i class="fa-solid fa-list-ol text-xs"></i></button>
                        </div>
                        <div class="flex-1 overflow-y-auto p-8 bg-[var(--bg-dark)] flex justify-center">
                            <div class="w-[210mm] min-h-[297mm] bg-[var(--card-bg)] shadow-xl p-12 text-[var(--text-main)] border border-[var(--window-border)] outline-none" contenteditable="true">
                                <h1 class="text-3xl font-bold mb-4">Untitled Document</h1>
                                <p>Start typing...</p>
                            </div>
                        </div>
                    </div>

                    <!-- Excel View -->
                    <div id="view-excel" class="absolute inset-0 flex flex-col hidden">
                        <div class="h-8 border-b border-[var(--window-border)] flex items-center px-2 bg-[var(--input-bg)] text-xs font-mono">
                            <div class="px-2 text-[var(--text-muted)] w-10" id="excel-active-cell-id"></div>
                            <div class="w-[1px] h-4 bg-[var(--window-border)] mx-2"></div>
                            <div class="px-2 text-[var(--text-muted)]">fx</div>
                            <input type="text" id="excel-formula-bar" class="flex-1 bg-transparent outline-none border-l border-[var(--window-border)] px-2 text-[var(--text-main)]" placeholder="Function...">
                        </div>
                        <div class="flex-1 overflow-auto bg-[var(--card-bg)]" id="excel-grid">
                            <!-- Grid generated by JS -->
                        </div>
                    </div>

                    <!-- PowerPoint View -->
                    <div id="view-powerpoint" class="absolute inset-0 flex hidden">
                        <div class="w-48 border-r border-[var(--window-border)] bg-[var(--input-bg)] flex flex-col gap-4 p-4 overflow-y-auto">
                            <div id="ppt-slides-list" class="space-y-4">
                                <!-- Slides injected here -->
                            </div>
                            <button id="ppt-add-slide" class="w-full py-2 border border-dashed border-[var(--window-border)] text-[var(--text-muted)] text-xs hover:bg-[var(--window-border)] hover:text-[var(--text-main)] transition">
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
            </div>
        `;
    },

    init(win) {
        this.win = win;
        this.bindEvents();
        this.renderExcelGrid();
        this.renderSlides();
    },

    bindEvents() {
        const tabs = this.win.querySelectorAll('.lumo-365-tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                // Update Tab UI
                tabs.forEach(t => {
                    t.classList.remove('bg-[var(--card-bg)]', 'border-b-2', 'border-[var(--accent)]');
                    t.style.opacity = '0.6';
                });
                tab.style.opacity = '1';
                tab.classList.add('bg-[var(--card-bg)]');

                // Switch Views
                const target = tab.dataset.tab;
                this.win.querySelector('#view-word').classList.add('hidden');
                this.win.querySelector('#view-excel').classList.add('hidden');
                this.win.querySelector('#view-powerpoint').classList.add('hidden');
                this.win.querySelector(`#view-${target}`).classList.remove('hidden');
            });
        });

        // Set initial active state
        const activeTab = this.win.querySelector('[data-tab="word"]');
        if (activeTab) activeTab.click();

        // Excel Formula Bar
        const formulaBar = this.win.querySelector('#excel-formula-bar');
        formulaBar.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && this.state.activeCell) {
                const val = formulaBar.value;
                this.updateCell(this.state.activeCell, val);
            }
        });

        // PowerPoint Add Slide
        this.win.querySelector('#ppt-add-slide').addEventListener('click', () => {
            this.state.slides.push({ id: Date.now(), title: "New Slide", subtitle: "Click to edit" });
            this.state.activeSlideIndex = this.state.slides.length - 1;
            this.renderSlides();
        });
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

        formulaBar.value = this.state.sheets[cellId] || '';
        activeCellDisplay.innerText = cellId;
    },

    onCellBlur(input) {
        const cellId = input.dataset.cell;
        const val = input.value;
        this.updateCell(cellId, val);
    },

    updateCell(cellId, value) {
        this.state.sheets[cellId] = value;

        // Simple evaluation if starts with =
        if (value.startsWith('=')) {
            try {
                // Very unsafe eval, but okay for local mock
                // Replace cell refs with values? Too complex for now.
                // Just basic math: =1+2
                const res = eval(value.substring(1));
                // We store the formula but display the result?
                // For this simple app, let's just update the input value to result but keep formula in state?
                // Actually, let's just keep it simple.
                // If it's a formula, we might want to calculate it.
            } catch (e) { }
        }
    },

    // --- PowerPoint Logic ---

    renderSlides() {
        const list = this.win.querySelector('#ppt-slides-list');
        const currentSlideView = this.win.querySelector('#ppt-current-slide');

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
        currentSlideView.innerHTML = `
            <h1 class="text-5xl font-bold mb-4 text-[var(--text-main)] outline-none" contenteditable="true" 
                onblur="window.Lumo365.updateSlideTitle(this)">${activeSlide.title}</h1>
            <p class="text-xl text-[var(--text-muted)] outline-none" contenteditable="true"
                onblur="window.Lumo365.updateSlideSubtitle(this)">${activeSlide.subtitle}</p>
        `;
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
    }
};
