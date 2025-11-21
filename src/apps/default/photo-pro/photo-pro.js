(() => {
    const filterMap = {
        vapor: 'contrast(1.2) saturate(1.4)',
        dusk: 'brightness(1.05) sepia(0.35)',
        neon: 'saturate(1.5) contrast(1.2)',
        mono: 'grayscale(1)',
    };

    // Local fallback hints if i18n resource is not yet available
    const languageHints = {
        en: 'Nothing OS inspired polish with English-first cues.',
        ja: '日本語サブメッセージを用意しました。英語がプライマリです。',
        zh: '受 Nothing OS 启发，界面以英语为主。',
    };

    const buildFilters = () => Object.entries(filterMap).map(([key, label]) => `
        <button data-pro-filter="${key}" class="nothing-btn text-[10px]">${key}</button>
    `).join('');

    const buildMarkup = () => `
        <div class="flex-1 flex flex-col gap-4 px-5 py-4 bg-black text-white">
            <div class="nothing-card border border-[#333] p-4 flex flex-col gap-4 lg:flex-row lg:items-stretch">
                <div class="photo-pro-stage relative flex-1 rounded-xl border border-[#333] bg-[#06060b] overflow-hidden p-3">
                    <div class="absolute inset-0 rounded-[10px] bg-gradient-to-br from-black/60 to-black/10"></div>
                    <canvas data-pro-canvas class="absolute inset-0 h-full w-full bg-black/70"></canvas>
                    <div data-i18n="photoPro.title" class="absolute top-5 left-5 text-[0.65rem] font-dot uppercase tracking-[0.4em] text-white/60">${window.i18n?.t('photoPro.title') || 'Nothing OS Lens'}</div>
                </div>
                <div class="flex flex-col gap-3 lg:w-72">
                    <div class="nothing-card bg-[#111] p-3 space-y-3 text-xs text-gray-300">
                        <p data-i18n="photoPro.tonalPlay" class="font-dot uppercase tracking-[0.4em] text-[var(--accent)]">${window.i18n?.t('photoPro.tonalPlay') || 'Tonal Play'}</p>
                        <label data-i18n="photoPro.exposure" class="text-[0.65rem] font-mono text-gray-400">${window.i18n?.t('photoPro.exposure') || 'Exposure'}</label>
                        <input data-pro-exposure type="range" min="-40" max="40" value="0" class="w-full accent-[var(--accent)] h-1 bg-[#333] rounded-lg appearance-none">
                        <label data-i18n="photoPro.contrast" class="text-[0.65rem] font-mono text-gray-400">${window.i18n?.t('photoPro.contrast') || 'Contrast'}</label>
                        <input data-pro-contrast type="range" min="-40" max="40" value="0" class="w-full accent-[var(--accent)] h-1 bg-[#333] rounded-lg appearance-none">
                        <label data-i18n="photoPro.saturation" class="text-[0.65rem] font-mono text-gray-400">${window.i18n?.t('photoPro.saturation') || 'Saturation'}</label>
                        <input data-pro-saturation type="range" min="-40" max="40" value="0" class="w-full accent-[var(--accent)] h-1 bg-[#333] rounded-lg appearance-none">
                    </div>
                    <div class="nothing-card bg-[#111] p-3 flex flex-col gap-2 text-xs text-gray-400">
                        <div class="flex items-center justify-between">
                            <span data-i18n="photoPro.highlights" class="font-mono">${window.i18n?.t('photoPro.highlights') || 'Highlights'}</span>
                            <input data-pro-highlight type="color" value="#ffe0b2" class="w-8 h-8 rounded p-0 border border-[#333] bg-transparent">
                        </div>
                        <div class="flex items-center justify-between">
                            <span data-i18n="photoPro.shadows" class="font-mono">${window.i18n?.t('photoPro.shadows') || 'Shadows'}</span>
                            <input data-pro-shadow type="color" value="#1b1b27" class="w-8 h-8 rounded p-0 border border-[#333] bg-transparent">
                        </div>
                        <button data-pro-magic data-i18n="photoPro.magicLens" class="nothing-btn w-full mt-2 text-[var(--accent)] border-[var(--accent)]">${window.i18n?.t('photoPro.magicLens') || 'Magic Lens'}</button>
                    </div>
                    <div class="nothing-card bg-[#111] p-3 text-xs text-gray-400 space-y-2">
                        <p data-i18n="photoPro.quickUpload" class="text-white font-dot">${window.i18n?.t('photoPro.quickUpload') || 'Quick upload'}</p>
                        <input data-pro-input type="file" accept="image/*" class="nothing-input w-full text-[0.65rem]">
                        <button data-pro-download data-i18n="photoPro.exportWatermark" class="nothing-btn w-full text-white/90">${window.i18n?.t('photoPro.exportWatermark') || 'Export with Lumo watermark'}</button>
                    </div>
                </div>
            </div>
            <div class="nothing-card border border-[#333] p-3 space-y-3 text-xs text-gray-300">
                <div class="flex flex-wrap gap-2" data-pro-filter-group>
                    ${buildFilters()}
                </div>
                <p data-pro-status class="text-[0.65rem] font-mono text-white/60">${window.i18n?.t('photoPro.hint') || 'Nothing OS style, English-first interface.'}</p>
            </div>
        </div>
    `;

    const init = (win) => {
        const canvas = win.querySelector('[data-pro-canvas]');
        const stage = win.querySelector('.photo-pro-stage');
        if (!canvas || !stage) return;

        const fileInput = win.querySelector('[data-pro-input]');
        const downloadBtn = win.querySelector('[data-pro-download]');
        const exposure = win.querySelector('[data-pro-exposure]');
        const contrast = win.querySelector('[data-pro-contrast]');
        const saturation = win.querySelector('[data-pro-saturation]');
        const highlight = win.querySelector('[data-pro-highlight]');
        const shadow = win.querySelector('[data-pro-shadow]');
        const magic = win.querySelector('[data-pro-magic]');
        const status = win.querySelector('[data-pro-status]');
        const filterButtons = win.querySelectorAll('[data-pro-filter]');

        const ctx = canvas.getContext('2d');
        const baseImage = new Image();
        let state = {
            filter: 'vapor',
            exposure: 0,
            contrast: 0,
            saturation: 0,
            highlight: '#ffe0b2',
            shadow: '#1b1b27',
            magic: false,
        };

        const updateLanguageStatus = (lang) => {
            // Normalize locale (e.g., ja-JP or ja_JP -> ja)
            const normalized = (lang || 'en').toString().split(/[-_]/)[0];
            // Ensure i18n uses that locale if available
            if (window.i18n?.setLocale) window.i18n.setLocale(normalized);
            const hint = window.i18n?.t('photoPro.hint') || languageHints[normalized] || languageHints.en;
            if (status) status.innerText = hint;
            document.documentElement.lang = normalized;
            // Update any localized content inside this window
            const applyTranslations = (container) => {
                if (!container) return;
                container.querySelectorAll('[data-i18n]').forEach(el => {
                    const key = el.dataset.i18n;
                    const text = window.i18n?.t(key) || el.innerText;
                    el.innerText = text;
                });
            };
            applyTranslations(win);
        };

        const defaultButton = Array.from(filterButtons).find(button => button.dataset.proFilter === state.filter);
        if (defaultButton) {
            defaultButton.classList.add('bg-[var(--accent)]', 'border-[var(--accent)]', 'text-white');
        }

        baseImage.crossOrigin = 'anonymous';
        baseImage.src = 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1400&auto=format&fit=crop';
        baseImage.onload = draw;

        const resizeCanvas = () => {
            const rect = stage.getBoundingClientRect();
            const ratio = window.devicePixelRatio || 1;
            canvas.width = rect.width * ratio;
            canvas.height = rect.height * ratio;
            ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
        };

        function draw() {
            if (!state || !ctx) return;
            resizeCanvas();
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            const areaWidth = canvas.width / (window.devicePixelRatio || 1);
            const areaHeight = canvas.height / (window.devicePixelRatio || 1);
            ctx.filter = `brightness(${1 + state.exposure / 100}) contrast(${1 + state.contrast / 100}) saturate(${1 + state.saturation / 100})${filterMap[state.filter] ? ` ${filterMap[state.filter]}` : ''}`;
            ctx.drawImage(baseImage, 0, 0, areaWidth, areaHeight);
            ctx.filter = 'none';

            const gradient = ctx.createLinearGradient(0, 0, 0, areaHeight);
            gradient.addColorStop(0, toRgba(state.highlight, 0.35));
            gradient.addColorStop(0.8, toRgba(state.shadow, 0.35));
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, areaWidth, areaHeight);

            if (state.magic) {
                const glow = ctx.createRadialGradient(areaWidth * 0.6, areaHeight * 0.4, 0, areaWidth * 0.6, areaHeight * 0.4, areaWidth * 0.7);
                glow.addColorStop(0, 'rgba(215, 25, 33, 0.35)'); // Nothing Red
                glow.addColorStop(1, 'transparent');
                ctx.fillStyle = glow;
                ctx.fillRect(0, 0, areaWidth, areaHeight);
                ctx.globalAlpha = 0.35;
                ctx.fillStyle = '#000';
                ctx.fillRect(0, 0, areaWidth, areaHeight);
                ctx.globalAlpha = 1;
            }

            ctx.fillStyle = 'rgba(255,255,255,0.95)';
            ctx.font = 'bold 32px VT323, monospace';
            ctx.textBaseline = 'bottom';
            ctx.fillText('LUMO OS 1.0', 20, areaHeight - 20);
        }

        const toRgba = (hex, alpha) => {
            const cleaned = hex.replace('#', '');
            const num = parseInt(cleaned, 16);
            const r = (num >> 16) & 255;
            const g = (num >> 8) & 255;
            const b = num & 255;
            return `rgba(${r}, ${g}, ${b}, ${alpha})`;
        };

        const setupSlider = (element, key) => {
            element?.addEventListener('input', () => {
                state[key] = Number(element.value);
                draw();
            });
        };

        setupSlider(exposure, 'exposure');
        setupSlider(contrast, 'contrast');
        setupSlider(saturation, 'saturation');

        highlight?.addEventListener('input', () => {
            state.highlight = highlight.value;
            draw();
        });
        shadow?.addEventListener('input', () => {
            state.shadow = shadow.value;
            draw();
        });

        magic?.addEventListener('click', () => {
            state.magic = !state.magic;
            magic.classList.toggle('bg-[var(--accent)]', state.magic);
            magic.classList.toggle('text-white', state.magic);
            draw();
        });

        filterButtons.forEach(button => {
            button.addEventListener('click', () => {
                filterButtons.forEach(btn => btn.classList.remove('bg-[var(--accent)]', 'border-[var(--accent)]', 'text-white'));
                button.classList.add('bg-[var(--accent)]', 'border-[var(--accent)]', 'text-white');
                state.filter = button.dataset.proFilter;
                draw();
            });
        });

        fileInput?.addEventListener('change', (event) => {
            const file = event.target.files?.[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = () => {
                baseImage.src = reader.result;
            };
            reader.readAsDataURL(file);
        });

        downloadBtn?.addEventListener('click', () => {
            const link = document.createElement('a');
            link.href = canvas.toDataURL('image/png');
            link.download = 'photo-pro-lumo.png';
            link.click();
        });

        const ro = new ResizeObserver(draw);
        ro.observe(stage);
        win.__photoProCleanup = () => ro.disconnect();

        updateLanguageStatus(localStorage.getItem('lumo_language') || 'en');
        document.addEventListener('lumo-language-changed', (event) => updateLanguageStatus(event.detail || 'en'));
    };

    window.PhotoPro = {
        buildMarkup,
        init,
    };
})();