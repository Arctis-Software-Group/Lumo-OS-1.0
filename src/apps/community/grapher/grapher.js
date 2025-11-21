window.Grapher = {
    buildMarkup: () => {
        return `
            <div class="flex-1 flex flex-col bg-[#1e1e1e] text-white p-6 gap-6 overflow-y-auto h-full">
                <div class="flex flex-col gap-2 shrink-0">
                    <h2 class="font-dot text-2xl">Grapher Palette</h2>
                    <p class="text-sm text-gray-400">Pick a base color to generate a harmony.</p>
                </div>
                
                <div class="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10 shrink-0">
                    <input type="color" id="gr-picker" value="#00CED1" class="w-16 h-16 rounded-lg cursor-pointer bg-transparent border-none">
                    <div class="flex flex-col">
                        <span class="text-xs uppercase tracking-wider text-gray-500">Base Color</span>
                        <span id="gr-hex" class="font-mono text-xl">#00CED1</span>
                    </div>
                </div>

                <div class="grid grid-cols-2 md:grid-cols-4 gap-4" id="gr-palette">
                    <!-- Palette items -->
                </div>

                <div class="mt-auto pt-4 shrink-0">
                    <button id="gr-export" class="w-full py-3 rounded-xl bg-[var(--accent)] text-black font-bold hover:opacity-90 transition">Export Palette JSON</button>
                </div>
            </div>
        `;
    },
    init: (win) => {
        const picker = win.querySelector('#gr-picker');
        const hexDisplay = win.querySelector('#gr-hex');
        const paletteContainer = win.querySelector('#gr-palette');
        const exportBtn = win.querySelector('#gr-export');

        const generatePalette = (baseHex) => {
            const colors = [];
            colors.push({ name: 'Base', hex: baseHex });

            // Simple hex manipulation for demo
            const num = parseInt(baseHex.slice(1), 16);
            const r = (num >> 16) & 255;
            const g = (num >> 8) & 255;
            const b = num & 255;

            // Invert
            const invert = '#' + ((255 - r) << 16 | (255 - g) << 8 | (255 - b)).toString(16).padStart(6, '0');
            colors.push({ name: 'Invert', hex: invert });

            // Lighten
            const lighten = (c, amt) => Math.min(255, Math.max(0, c + amt));
            const lHex = '#' + (lighten(r, 40) << 16 | lighten(g, 40) << 8 | lighten(b, 40)).toString(16).padStart(6, '0');
            colors.push({ name: 'Light', hex: lHex });

            // Darken
            const dHex = '#' + (lighten(r, -40) << 16 | lighten(g, -40) << 8 | lighten(b, -40)).toString(16).padStart(6, '0');
            colors.push({ name: 'Dark', hex: dHex });

            return colors;
        };

        const render = () => {
            const base = picker.value;
            hexDisplay.innerText = base.toUpperCase();
            const colors = generatePalette(base);

            paletteContainer.innerHTML = colors.map(c => `
                <div class="flex flex-col gap-2 group cursor-pointer" onclick="navigator.clipboard.writeText('${c.hex}'); alert('Copied: ${c.hex}')">
                    <div class="h-24 rounded-xl shadow-lg transition group-hover:scale-105 border border-white/10" style="background-color: ${c.hex}"></div>
                    <div class="flex justify-between items-center px-1">
                        <span class="text-xs text-gray-400">${c.name}</span>
                        <span class="text-xs font-mono">${c.hex}</span>
                    </div>
                </div>
            `).join('');
        };

        picker.addEventListener('input', render);

        exportBtn.addEventListener('click', () => {
            const base = picker.value;
            const colors = generatePalette(base);
            const data = JSON.stringify(colors, null, 2);
            const blob = new Blob([data], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'palette.json';
            a.click();
        });

        render();
    }
};
