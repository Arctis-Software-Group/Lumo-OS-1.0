window.DrawinSimple = {
    buildMarkup: () => {
        return `
            <div class="flex-1 flex flex-col bg-[#1e1e1e] text-white h-full">
                <div class="h-14 border-b border-white/10 flex items-center px-4 gap-4 bg-[#252525] shrink-0">
                    <input type="color" id="ds-color" value="#000000" class="w-8 h-8 rounded cursor-pointer bg-transparent border-none">
                    <div class="flex items-center gap-2">
                        <span class="text-xs text-gray-400">Size</span>
                        <input type="range" id="ds-size" min="1" max="50" value="5" class="w-24 accent-[var(--accent)]">
                        <span class="text-xs text-gray-400 w-8" id="ds-size-val">5px</span>
                    </div>
                    <div class="flex-1"></div>
                    <button id="ds-clear" class="px-3 py-1.5 rounded bg-white/10 hover:bg-white/20 text-xs font-bold transition">Clear</button>
                    <button id="ds-export" class="px-3 py-1.5 rounded bg-[var(--accent)] text-black hover:opacity-90 text-xs font-bold transition">Export</button>
                </div>
                <div class="flex-1 relative overflow-hidden bg-[#111] flex items-center justify-center p-4">
                    <canvas id="ds-canvas" class="bg-white shadow-2xl rounded cursor-crosshair"></canvas>
                </div>
            </div>
        `;
    },
    init: (win) => {
        const canvas = win.querySelector('#ds-canvas');
        const ctx = canvas.getContext('2d');
        const colorPicker = win.querySelector('#ds-color');
        const sizeSlider = win.querySelector('#ds-size');
        const sizeVal = win.querySelector('#ds-size-val');
        const clearBtn = win.querySelector('#ds-clear');
        const exportBtn = win.querySelector('#ds-export');
        const container = canvas.parentElement;

        // Resize canvas
        const resize = () => {
            canvas.width = container.clientWidth - 32; // padding
            canvas.height = container.clientHeight - 32;
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        };
        // Initial resize
        setTimeout(resize, 50);

        let painting = false;

        const startPosition = (e) => {
            painting = true;
            draw(e);
        };
        const endPosition = () => {
            painting = false;
            ctx.beginPath();
        };
        const draw = (e) => {
            if (!painting) return;
            const rect = canvas.getBoundingClientRect();
            const x = (e.clientX || e.touches[0].clientX) - rect.left;
            const y = (e.clientY || e.touches[0].clientY) - rect.top;

            ctx.lineWidth = sizeSlider.value;
            ctx.lineCap = 'round';
            ctx.strokeStyle = colorPicker.value;

            ctx.lineTo(x, y);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(x, y);
        };

        canvas.addEventListener('mousedown', startPosition);
        canvas.addEventListener('mouseup', endPosition);
        canvas.addEventListener('mousemove', draw);

        // Touch support
        canvas.addEventListener('touchstart', (e) => { e.preventDefault(); startPosition(e); });
        canvas.addEventListener('touchend', (e) => { e.preventDefault(); endPosition(); });
        canvas.addEventListener('touchmove', (e) => { e.preventDefault(); draw(e); });

        sizeSlider.addEventListener('input', () => {
            sizeVal.innerText = `${sizeSlider.value}px`;
        });

        clearBtn.addEventListener('click', () => {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        });

        exportBtn.addEventListener('click', () => {
            const link = document.createElement('a');
            link.download = `drawin-${Date.now()}.png`;
            link.href = canvas.toDataURL();
            link.click();
        });
    }
};
