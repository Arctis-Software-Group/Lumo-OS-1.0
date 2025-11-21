
window.CameraApp = {
    buildMarkup: () => {
        return `
            <div class="flex-1 flex flex-col bg-black relative overflow-hidden">
                <video id="camera-feed" autoplay playsinline class="absolute inset-0 w-full h-full object-cover"></video>
                <canvas id="camera-canvas" class="hidden"></canvas>
                
                <!-- Watermark Overlay (Hidden until capture) -->
                <div id="camera-watermark" class="absolute bottom-4 right-4 pointer-events-none hidden">
                    <p class="font-dot text-white text-xl opacity-80 shadow-lg">Lumo OS 1.0</p>
                </div>

                <!-- Controls -->
                <div class="absolute bottom-0 left-0 right-0 p-6 flex items-center justify-center gap-8 bg-gradient-to-t from-black/80 to-transparent z-10">
                    <button id="camera-toggle-watermark" class="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/20 transition" title="Toggle Watermark">
                        <i class="fa-solid fa-stamp"></i>
                    </button>
                    <button id="camera-shutter" class="w-16 h-16 rounded-full border-4 border-white flex items-center justify-center hover:scale-105 transition active:scale-95">
                        <div class="w-12 h-12 bg-white rounded-full"></div>
                    </button>
                    <button id="camera-switch" class="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/20 transition" title="Switch Camera">
                        <i class="fa-solid fa-rotate"></i>
                    </button>
                </div>

                <!-- Flash Effect -->
                <div id="camera-flash" class="absolute inset-0 bg-white pointer-events-none opacity-0 transition-opacity duration-100"></div>
            </div>
        `;
    },

    init: (win) => {
        const video = win.querySelector('#camera-feed');
        const canvas = win.querySelector('#camera-canvas');
        const shutterBtn = win.querySelector('#camera-shutter');
        const watermarkBtn = win.querySelector('#camera-toggle-watermark');
        const switchBtn = win.querySelector('#camera-switch');
        const flash = win.querySelector('#camera-flash');

        let stream = null;
        let useFrontCamera = true;
        let watermarkEnabled = false;

        const startCamera = async () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
            try {
                stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: useFrontCamera ? 'user' : 'environment' },
                    audio: false
                });
                video.srcObject = stream;
            } catch (err) {
                console.error("Camera access denied", err);
                win.innerHTML = `<div class="flex-1 flex items-center justify-center text-white">Camera access denied.</div>`;
            }
        };

        startCamera();

        // Toggle Watermark
        watermarkBtn.addEventListener('click', () => {
            watermarkEnabled = !watermarkEnabled;
            watermarkBtn.style.color = watermarkEnabled ? 'var(--accent)' : 'white';
            watermarkBtn.style.borderColor = watermarkEnabled ? 'var(--accent)' : 'transparent';
        });

        // Switch Camera
        switchBtn.addEventListener('click', () => {
            useFrontCamera = !useFrontCamera;
            startCamera();
        });

        // Take Photo
        shutterBtn.addEventListener('click', () => {
            // Flash effect
            flash.classList.remove('duration-100');
            flash.style.opacity = '1';
            setTimeout(() => {
                flash.classList.add('duration-500');
                flash.style.opacity = '0';
            }, 50);

            // Capture
            const ctx = canvas.getContext('2d');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;

            // Flip if front camera
            if (useFrontCamera) {
                ctx.translate(canvas.width, 0);
                ctx.scale(-1, 1);
            }

            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

            // Reset transform for text
            ctx.setTransform(1, 0, 0, 1, 0, 0);

            if (watermarkEnabled) {
                ctx.font = '30px "VT323", monospace';
                ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
                ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
                ctx.shadowBlur = 4;
                ctx.textAlign = 'right';
                ctx.fillText('Lumo OS 1.0', canvas.width - 20, canvas.height - 20);
            }

            // Download
            const link = document.createElement('a');
            link.download = `Lumo_Capture_${Date.now()}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        });

        // Cleanup on close
        const observer = new MutationObserver((mutations) => {
            if (!document.body.contains(win)) {
                if (stream) stream.getTracks().forEach(track => track.stop());
                observer.disconnect();
            }
        });
        observer.observe(document.body, { childList: true, subtree: true });
    }
};
