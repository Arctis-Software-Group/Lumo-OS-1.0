class BootAnimation {
    constructor(containerId, onComplete) {
        this.container = document.getElementById(containerId);
        this.onComplete = onComplete;
        this.canvas = null;
        this.ctx = null;
        this.width = 0;
        this.height = 0;
        this.animationId = null;
        this.startTime = 0;
        this.duration = 14000; 
        this.skipped = false;
        
        // Visual Settings (Nothing Style)
        this.dotSize = 6;     // Size of individual LED dots
        this.dotGap = 6;      // Gap between dots
        this.gridUnit = 12;   // Total cell size (size + gap)
        this.activeColor = '#ffffff';
        this.accentColor = '#eb002a'; // Official Nothing Red approx
        this.dimColor = '#222222';
        
        // Animation State
        this.phase = 'pulse'; // pulse, ignite, glyphs, text, finish
        this.phaseStartTime = 0;
        
        // Glyph shapes (defined as coordinate paths)
        this.glyphs = [];
    }

    init() {
        this.container.innerHTML = '';
        this.container.style.backgroundColor = '#000';
        this.container.style.cursor = 'none';
        this.container.style.overflow = 'hidden';

        this.canvas = document.createElement('canvas');
        this.canvas.style.display = 'block';
        this.container.appendChild(this.canvas);
        this.ctx = this.canvas.getContext('2d');

        // Minimal Skip Button
        const skipBtn = document.createElement('button');
        skipBtn.innerHTML = 'SKIP';
        skipBtn.className = 'fixed bottom-10 right-10 text-zinc-600 hover:text-white font-mono text-[10px] tracking-[0.2em] transition-colors duration-500 z-[10000] cursor-pointer';
        skipBtn.onclick = () => this.skip();
        this.container.appendChild(skipBtn);

        window.addEventListener('resize', () => this.resize());
        this.resize();

        this.startTime = Date.now();
        this.phaseStartTime = this.startTime;
        
        this.animate();
    }

    resize() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        
        // Center calculations
        this.centerX = Math.floor(this.width / 2);
        this.centerY = Math.floor(this.height / 2);
    }

    skip() {
        if (this.skipped) return;
        this.skipped = true;
        cancelAnimationFrame(this.animationId);
        
        this.container.style.transition = 'opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1)';
        this.container.style.opacity = '0';
        setTimeout(() => {
            if (this.onComplete) this.onComplete();
        }, 800);
    }

    // --- Drawing Helpers ---

    // Draw a single LED dot
    drawDot(x, y, color, scale = 1) {
        this.ctx.fillStyle = color;
        const size = this.dotSize * scale;
        const offset = (this.dotSize - size) / 2;
        
        // Rounded rectangle for that "LED" look
        this.ctx.beginPath();
        this.ctx.roundRect(x + offset, y + offset, size, size, size * 0.4);
        this.ctx.fill();
    }

    // Draw a matrix text
    drawText(text, x, y, size = 10, color = '#fff', spacing = 1) {
        // Simple dot-matrix font emulation (just using canvas text for now but pixelated)
        this.ctx.font = `${size}px "VT323", monospace`;
        this.ctx.fillStyle = color;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(text, x, y);
    }

    // Draw a Glyph Pattern (Curved C, Lines) based on grid
    drawGlyphPath(type, progress, centerX, centerY, scale = 1) {
        const step = this.gridUnit * scale;
        
        this.ctx.fillStyle = this.activeColor;
        
        if (type === 'c-shape') {
            // The iconic "C" shape from Nothing Phone (1)
            // Draw using dots along a path
            const radius = 10 * step;
            const circumference = Math.PI * 2 * radius; // Approx
            const dotCount = 40;
            
            for (let i = 0; i < dotCount; i++) {
                const angle = (i / dotCount) * Math.PI * 1.5 + Math.PI * 0.75; // C shape
                // Reveal effect
                if ((i / dotCount) > progress) continue;
                
                const px = centerX + Math.cos(angle) * radius;
                const py = centerY + Math.sin(angle) * radius;
                this.drawDot(px, py, this.activeColor, scale);
            }
        } else if (type === 'center-ring') {
             const radius = 4 * step;
             const dotCount = 16;
             for (let i = 0; i < dotCount; i++) {
                const angle = (i / dotCount) * Math.PI * 2;
                if ((i / dotCount) > progress) continue;
                const px = centerX + Math.cos(angle) * radius;
                const py = centerY + Math.sin(angle) * radius;
                this.drawDot(px, py, this.activeColor, scale);
            }
        } else if (type === 'slash') {
            // Diagonal line
            const len = 15;
            for (let i = 0; i < len; i++) {
                 if ((i / len) > progress) continue;
                 const px = centerX + (i * step) + (5 * step);
                 const py = centerY - (i * step) - (5 * step);
                 this.drawDot(px, py, this.activeColor, scale);
            }
        }
    }

    animate() {
        if (this.skipped) return;

        const now = Date.now();
        const totalElapsed = now - this.startTime;
        const phaseElapsed = now - this.phaseStartTime;

        if (totalElapsed > this.duration) {
            this.skip();
            return;
        }

        // Clear
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.width, this.height);

        // --- Phase Management ---
        // 1. Pulse (0-3s): Red dot heartbeat
        // 2. Ignite (3-6s): Glyph interface lights up
        // 3. Text (6-10s): "LUMO" forms
        // 4. Finish (10s+): Clean logo

        if (this.phase === 'pulse' && phaseElapsed > 3000) {
            this.phase = 'ignite';
            this.phaseStartTime = now;
        } else if (this.phase === 'ignite' && phaseElapsed > 3000) {
            this.phase = 'text';
            this.phaseStartTime = now;
        } else if (this.phase === 'text' && phaseElapsed > 4000) {
            this.phase = 'finish';
            this.phaseStartTime = now;
        }

        // --- Rendering ---

        if (this.phase === 'pulse') {
            // Heartbeat Effect
            const beat = (Math.sin(phaseElapsed / 200) + 1) / 2; // 0 to 1
            const scale = 1 + (beat * 0.5);
            
            // Subtle background noise (grain)
            this.drawNoise(0.05);

            // Center Red Dot
            const dotSize = this.dotSize * 2;
            this.ctx.fillStyle = this.accentColor;
            this.ctx.beginPath();
            this.ctx.arc(this.centerX, this.centerY, dotSize * scale, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Dim rings rippling out
            if (phaseElapsed > 1000) {
                this.ctx.strokeStyle = '#333';
                this.ctx.lineWidth = 2;
                const ripple = (phaseElapsed - 1000) / 2000; // 0 to 1
                this.ctx.beginPath();
                this.ctx.arc(this.centerX, this.centerY, ripple * 200, 0, Math.PI * 2);
                this.ctx.stroke();
            }

        } else if (this.phase === 'ignite') {
            // Glyphs lighting up
            const progress = Math.min(1, phaseElapsed / 2000);
            
            // Flash background once at start
            if (phaseElapsed < 100) {
                this.ctx.fillStyle = `rgba(255,255,255,${1 - phaseElapsed/100})`;
                this.ctx.fillRect(0,0,this.width, this.height);
            }

            // Draw Glyphs
            this.drawGlyphPath('c-shape', progress, this.centerX, this.centerY, 1.5);
            this.drawGlyphPath('center-ring', progress, this.centerX, this.centerY, 1.5);
            this.drawGlyphPath('slash', progress, this.centerX, this.centerY, 1.5);
            
            // Red dot stays
            this.ctx.fillStyle = this.accentColor;
            this.ctx.beginPath();
            this.ctx.arc(this.centerX, this.centerY, this.dotSize * 2, 0, Math.PI * 2);
            this.ctx.fill();

        } else if (this.phase === 'text') {
            // Morphing into text
            // Grid of dots appearing to form "LUMO"
            
            // Keep Glyphs but fade them
            this.ctx.globalAlpha = Math.max(0, 1 - phaseElapsed/1000);
            this.drawGlyphPath('c-shape', 1, this.centerX, this.centerY, 1.5);
            this.drawGlyphPath('center-ring', 1, this.centerX, this.centerY, 1.5);
            this.ctx.globalAlpha = 1;

            const textProgress = Math.min(1, phaseElapsed / 2000);
            
            // Draw massive grid of dots
            const gridW = 40;
            const gridH = 10;
            const startX = this.centerX - (gridW * this.gridUnit) / 2;
            const startY = this.centerY - (gridH * this.gridUnit) / 2;

            // "LUMO" pattern (simple representation)
            // This logic decides if a dot is part of the text
            const textPattern = (x, y) => {
                // L
                if (x >= 2 && x <= 4 && y >= 2 && y <= 8) return true;
                if (x >= 2 && x <= 8 && y >= 7 && y <= 8) return true;
                
                // U
                if (x >= 11 && x <= 13 && y >= 2 && y <= 8) return true;
                if (x >= 16 && x <= 18 && y >= 2 && y <= 8) return true;
                if (x >= 11 && x <= 18 && y >= 7 && y <= 8) return true;

                // M
                if (x >= 21 && x <= 23 && y >= 2 && y <= 8) return true;
                if (x >= 28 && x <= 30 && y >= 2 && y <= 8) return true;
                if (x >= 23 && x <= 25 && y >= 3 && y <= 5) return true; // diagonal parts roughly
                if (x >= 26 && x <= 28 && y >= 3 && y <= 5) return true;

                // O
                if (x >= 33 && x <= 38 && y >= 2 && y <= 8) return true;
                if (x >= 34 && x <= 37 && y >= 3 && y <= 7) return false; // hollow

                return false;
            };

            for (let gy = 0; gy < gridH; gy++) {
                for (let gx = 0; gx < gridW; gx++) {
                    const isText = textPattern(gx, gy);
                    
                    // Random reveal effect for text
                    const revealThreshold = gx / gridW;
                    
                    if (isText) {
                        if (textProgress > revealThreshold) {
                             const x = startX + gx * this.gridUnit;
                             const y = startY + gy * this.gridUnit;
                             this.drawDot(x, y, '#fff');
                        }
                    } else {
                        // Background decorative dots (faint)
                        if (Math.random() > 0.99) {
                             const x = startX + gx * this.gridUnit;
                             const y = startY + gy * this.gridUnit;
                             this.drawDot(x, y, '#222');
                        }
                    }
                }
            }

        } else if (this.phase === 'finish') {
            // Final Clean Logo
            this.ctx.save();
            this.ctx.translate(this.centerX, this.centerY);
            
            this.ctx.font = 'bold 120px "VT323", monospace';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillStyle = '#fff';
            this.ctx.fillText("LUMO OS", 0, 0);
            
            // Breathing red dot
            const breath = (Math.sin(now / 500) + 1) / 2;
            this.ctx.fillStyle = this.accentColor;
            this.ctx.beginPath();
            this.ctx.arc(160, -40, 8 + breath * 4, 0, Math.PI*2);
            this.ctx.fill();
            
            // Version number
            this.ctx.font = '20px "Inter", sans-serif';
            this.ctx.fillStyle = '#666';
            this.ctx.letterSpacing = '4px';
            this.ctx.fillText("NOTHING INSPIRED", 0, 80);

            this.ctx.restore();
        }

        this.animationId = requestAnimationFrame(() => this.animate());
    }

    drawNoise(amount) {
        const w = this.canvas.width;
        const h = this.canvas.height;
        const idata = this.ctx.getImageData(0, 0, w, h);
        const buffer32 = new Uint32Array(idata.data.buffer);
        const len = buffer32.length;

        for (let i = 0; i < len; i++) {
            if (Math.random() < amount) {
                // Add some grey noise
                buffer32[i] = 0xff222222;
            }
        }
        this.ctx.putImageData(idata, 0, 0);
    }
}

window.BootAnimation = BootAnimation;
