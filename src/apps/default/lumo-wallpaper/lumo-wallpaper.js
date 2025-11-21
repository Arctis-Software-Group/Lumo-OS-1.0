(() => {
    const wallpapers = [
        { name: 'Default Space', url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop', type: 'image' },
        { name: 'Neon City', url: 'https://images.unsplash.com/photo-1480796927426-f609979314bd?q=80&w=2000&auto=format&fit=crop', type: 'image' },
        { name: 'Abstract Waves', url: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=2000&auto=format&fit=crop', type: 'image' },
        { name: 'Deep Forest', url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=2000&auto=format&fit=crop', type: 'image' },
        { name: 'Minimal Dark', url: 'https://images.unsplash.com/photo-1464618663641-bbdd760ae19b?q=80&w=2000&auto=format&fit=crop', type: 'image' },
        { name: 'Cyberpunk Street', url: 'https://images.unsplash.com/photo-1535498730771-e735b998cd64?q=80&w=2000&auto=format&fit=crop', type: 'image' },
        { name: 'Glacier Blue', url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=2000&auto=format&fit=crop', type: 'image' },
        { name: 'Red Planet', url: 'https://images.unsplash.com/photo-1614730341194-75c6074065db?q=80&w=2000&auto=format&fit=crop', type: 'image' },
        { name: 'Nothing White', url: 'https://images.unsplash.com/photo-1550684847-75bdda21cc95?q=80&w=2000&auto=format&fit=crop', type: 'image' },
        { name: 'Urban Rain', url: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?q=80&w=2000&auto=format&fit=crop', type: 'image' },
        { name: 'Geometric Red', url: 'https://images.unsplash.com/photo-1550684848-86a5d8727436?q=80&w=2000&auto=format&fit=crop', type: 'image' },
        { name: 'Desert Dunes', url: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?q=80&w=2000&auto=format&fit=crop', type: 'image' },
        { name: 'Tech Circuit', url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=2000&auto=format&fit=crop', type: 'image' },
        { name: 'Solid Black', color: '#000000', type: 'color' },
        { name: 'Solid Gray', color: '#333333', type: 'color' },
        { name: 'Lumo Red', color: '#ff003c', type: 'color' },
        { name: 'Deep Purple', color: '#240046', type: 'color' },
        { name: 'Midnight Blue', color: '#001219', type: 'color' },
        { name: 'Pure White', color: '#ffffff', type: 'color' },
    ];

    const buildMarkup = () => `
        <div class="flex-1 flex flex-col gap-4 px-5 py-4 bg-[#111]">
            <div class="flex items-center justify-between">
                <div>
                    <p class="text-xs uppercase tracking-[0.4em] text-gray-400">Personalization</p>
                    <h2 class="font-dot text-3xl text-white">Wallpapers</h2>
                </div>
                <span class="text-xs text-gray-500">${wallpapers.length} items</span>
            </div>
            
            <div class="grid grid-cols-2 sm:grid-cols-3 gap-4 overflow-y-auto p-1">
                ${wallpapers.map((wp, index) => `
                    <div class="group relative aspect-video rounded-2xl overflow-hidden border border-white/10 cursor-pointer transition hover:scale-[1.02] hover:border-[var(--accent)]" data-wp-index="${index}">
                        ${wp.type === 'image'
            ? `<img src="${wp.url}" class="w-full h-full object-cover" loading="lazy">`
            : `<div class="w-full h-full" style="background-color: ${wp.color}"></div>`
        }
                        <div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                            <span class="font-dot text-white tracking-widest">APPLY</span>
                        </div>
                        <div class="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent text-xs text-white font-medium truncate">
                            ${wp.name}
                        </div>
                    </div>
                `).join('')}
            </div>

            <div class="rounded-3xl border border-white/10 bg-white/5 p-4 text-xs text-gray-400">
                <p>Selected wallpaper will be saved to your local preferences.</p>
            </div>
        </div>
    `;

    const init = (win) => {
        const items = win.querySelectorAll('[data-wp-index]');

        items.forEach(item => {
            item.addEventListener('click', () => {
                const index = item.dataset.wpIndex;
                const wp = wallpapers[index];
                const desktop = document.getElementById('desktop');

                if (wp.type === 'image') {
                    desktop.style.backgroundImage = `url('${wp.url}')`;
                    desktop.style.backgroundColor = '';
                } else {
                    desktop.style.backgroundImage = 'none';
                    desktop.style.backgroundColor = wp.color;
                }

                // Persist
                localStorage.setItem('lumo_wallpaper', JSON.stringify(wp));

                // Visual feedback
                items.forEach(i => i.classList.remove('ring-2', 'ring-[var(--accent)]'));
                item.classList.add('ring-2', 'ring-[var(--accent)]');
            });
        });
    };

    window.LumoWallpaper = { buildMarkup, init };
})();
