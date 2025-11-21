
class LoginManager {
    constructor() {
        this.storageKey = 'lumo_users';
        this.users = this.loadUsers();
        this.currentUser = null;
        this.container = null;
        this.onLoginSuccess = null;
        this.selectedUserId = this.users.length > 0 ? this.users[0].id : null;
        this.currentLang = localStorage.getItem('lumo_language') || 'en';
    }

    loadUsers() {
        const stored = localStorage.getItem(this.storageKey);
        if (stored) {
            return JSON.parse(stored);
        }
        // Default initial user - REMOVED for Onboarding
        return [];
    }

    saveUsers() {
        localStorage.setItem(this.storageKey, JSON.stringify(this.users));
    }

    addUser(name, password, question = '', answer = '') {
        if (this.users.length >= 4) { // Increased to 4 to accommodate Guest + 3 users
            alert(this.t('alertMaxUsers'));
            return false;
        }
        const id = name === 'Guest' ? 'guest' : 'user_' + Date.now();
        const colors = ['#ff003c', '#2d7af7', '#00e054'];
        const color = name === 'Guest' ? '#888888' : colors[this.users.length % colors.length];

        this.users.push({
            id,
            name,
            password,
            question,
            answer,
            avatar: name === 'Guest' ? 'fa-solid fa-user-secret' : 'fa-solid fa-user',
            color
        });
        this.saveUsers();
        this.render();
        return true;
    }

    createGuest() {
        let guest = this.users.find(u => u.id === 'guest');
        if (!guest) {
            this.addUser('Guest', '', '', '');
            guest = this.users.find(u => u.id === 'guest');
        }
        this.loginUser(guest);
    }

    handleRecovery() {
        const username = prompt(this.t('promptRecoverUser'));
        if (!username) return;

        const user = this.users.find(u => u.name.toLowerCase() === username.toLowerCase());
        if (!user) {
            alert(this.t('alertUserNotFound'));
            return;
        }

        if (!user.question || !user.answer) {
            alert(this.t('alertNoSecQ'));
            return;
        }

        const ans = prompt(`${this.t('promptSecQ')} ${user.question}`);
        if (ans && ans.toLowerCase() === user.answer.toLowerCase()) {
            alert(`${this.t('alertPassIs')} ${user.password}`);
        } else {
            alert(this.t('alertWrongAnswer'));
        }
    }

    updatePassword(id, newPass) {
        const user = this.users.find(u => u.id === id);
        if (user) {
            user.password = newPass;
            this.saveUsers();
            return true;
        }
        return false;
    }

    deleteUser(id) {
        this.users = this.users.filter(u => u.id !== id);
        this.saveUsers();
        if (this.selectedUserId === id) {
            this.selectedUserId = this.users.length > 0 ? this.users[0].id : null;
        }
        this.render();
    }

    init(containerId, onLoginSuccess) {
        this.container = document.getElementById(containerId);
        this.onLoginSuccess = onLoginSuccess;
        this.render();
    }

    selectUser(id) {
        this.selectedUserId = id;
        this.render();
        // Focus password input
        setTimeout(() => {
            const input = document.getElementById('login-password');
            if (input) input.focus();
        }, 100);
    }

    attemptLogin() {
        const input = document.getElementById('login-password');
        if (!input) return;

        const password = input.value;
        const user = this.users.find(u => u.id === this.selectedUserId);

        if (user && user.password === password) {
            this.loginUser(user);
        } else {
            // Shake animation or error
            input.classList.add('animate-shake');
            input.style.borderColor = 'red';
            setTimeout(() => {
                input.classList.remove('animate-shake');
                input.style.borderColor = 'rgba(255,255,255,0.2)';
            }, 500);
        }
    }

    render() {
        if (!this.container) return;

        // Background styling (glassmorphism over the wallpaper + dot matrix)
        this.container.className = "fixed inset-0 z-[9000] flex flex-col items-center justify-center bg-black/60 backdrop-blur-xl transition-opacity duration-500 text-white bg-dot-matrix";

        if (this.users.length === 0) {
            this.renderOnboarding();
            return;
        }

        const selectedUser = this.users.find(u => u.id === this.selectedUserId) || this.users[0];

        let usersHtml = '';
        if (this.users.length > 1) {
            usersHtml = `<div class="flex gap-8 mb-12">
                ${this.users.map(u => `
                    <div onclick="window.LoginManager.selectUser('${u.id}')" 
                         class="flex flex-col items-center gap-3 cursor-pointer transition-all duration-300 group ${u.id === this.selectedUserId ? 'scale-110 opacity-100' : 'scale-100 opacity-40 hover:opacity-70'}">
                        <div class="w-20 h-20 rounded-full flex items-center justify-center text-3xl shadow-2xl border-2 ${u.id === this.selectedUserId ? 'border-[var(--accent)]' : 'border-transparent'} transition-colors" style="background-color: ${u.color}10; color: ${u.color}">
                            <i class="${u.avatar}"></i>
                        </div>
                        <span class="font-dot text-lg tracking-wider group-hover:text-[var(--accent)] transition-colors">${u.name}</span>
                    </div>
                `).join('')}
            </div>`;
        }

        // Single user view or selected user view
        const avatarHtml = this.users.length === 1 ? `
            <div class="w-32 h-32 rounded-full flex items-center justify-center text-5xl shadow-2xl mb-8 border-2 border-[var(--accent)] animate-[float_6s_ease-in-out_infinite]" style="background-color: ${selectedUser.color}10; color: ${selectedUser.color}">
                <i class="${selectedUser.avatar}"></i>
            </div>
            <h2 class="text-4xl font-dot tracking-widest mb-10">${selectedUser.name}</h2>
        ` : '';

        this.container.innerHTML = `
            <div class="flex flex-col items-center w-full max-w-md animate-[fadeIn_0.5s_ease-out]">
                ${usersHtml}
                ${avatarHtml}
                
                <div class="relative w-72 group">
                    <input type="password" id="login-password" 
                        placeholder="${this.t('loginPassPlaceholder')}" 
                        class="w-full bg-white/5 border-b-2 border-white/20 px-5 py-3 text-center outline-none focus:border-[var(--accent)] focus:bg-white/10 transition-all font-dot text-xl tracking-widest placeholder-gray-600"
                        onkeydown="if(event.key === 'Enter') window.LoginManager.attemptLogin()">
                    
                    <button onclick="window.LoginManager.attemptLogin()" 
                        class="absolute right-2 top-1/2 transform -translate-y-1/2 w-8 h-8 rounded-full hover:bg-[var(--accent)] hover:text-white text-gray-500 flex items-center justify-center transition-colors">
                        <i class="fa-solid fa-arrow-right"></i>
                    </button>
                </div>

                <div class="mt-16 flex flex-col items-center gap-4 text-xs text-gray-500 font-mono uppercase tracking-widest">
                    <span class="cursor-pointer hover:text-white transition" onclick="window.LoginManager.handleRecovery()">${this.t('forgotPass')}</span>
                    <div class="flex gap-4">
                        ${this.users.length < 4 ? `<button class="nothing-btn text-[10px] py-1 px-3" onclick="window.LoginManager.showAddUserDialog()">${this.t('addUser')}</button>` : ''}
                        <button class="nothing-btn text-[10px] py-1 px-3" onclick="window.LoginManager.createGuest()">${this.t('guestMode')}</button>
                    </div>
                </div>
            </div>
            
            <!-- Add User Dialog (Hidden by default) -->
            <div id="add-user-dialog" class="absolute inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center hidden z-[9001]">
                <div class="nothing-card w-96 flex flex-col gap-6 shadow-2xl border border-white/10">
                    <h3 class="font-dot text-2xl text-center text-[var(--accent)]">${this.t('newUser')}</h3>
                    <div class="flex flex-col gap-3">
                        <input id="new-user-name" type="text" placeholder="${this.t('userPlaceholder')}" class="nothing-input text-lg">
                        <input id="new-user-pass" type="password" placeholder="${this.t('passPlaceholder')}" class="nothing-input text-lg">
                        <div class="border-t border-white/10 my-2"></div>
                        <p class="text-xs text-gray-500 font-mono">${this.t('secTitle')}</p>
                        <input id="new-user-q" type="text" placeholder="${this.t('secQPlaceholder')}" class="nothing-input text-sm">
                        <input id="new-user-a" type="text" placeholder="${this.t('secAPlaceholder')}" class="nothing-input text-sm">
                    </div>
                    <div class="flex gap-3 mt-2">
                        <button onclick="document.getElementById('add-user-dialog').classList.add('hidden')" class="flex-1 nothing-btn border-gray-600 text-gray-400 hover:bg-gray-800 hover:border-gray-500">${this.t('cancel')}</button>
                        <button onclick="window.LoginManager.handleCreateUser()" class="flex-1 nothing-btn border-[var(--accent)] text-[var(--accent)] hover:bg-[var(--accent)] hover:text-white">${this.t('create')}</button>
                    </div>
                </div>
            </div>
        `;
    }

    showAddUserDialog() {
        const dialog = document.getElementById('add-user-dialog');
        if (dialog) dialog.classList.remove('hidden');
    }

    handleCreateUser() {
        const name = document.getElementById('new-user-name').value;
        const pass = document.getElementById('new-user-pass').value;
        const q = document.getElementById('new-user-q').value;
        const a = document.getElementById('new-user-a').value;

        if (name && pass) {
            if (this.addUser(name, pass, q, a)) {
                document.getElementById('add-user-dialog').classList.add('hidden');
            }
        } else {
            alert(this.t('alertFillFields'));
        }
    }

    renderOnboarding() {
        this.container.innerHTML = `
            <div class="flex flex-col items-center w-full max-w-md animate-[fadeIn_0.5s_ease-out] text-center">
                <div class="flex gap-4 mb-8">
                    <button onclick="window.LoginManager.setLanguage('en')" class="text-xs font-mono ${this.currentLang === 'en' ? 'text-[var(--accent)] underline' : 'text-gray-500 hover:text-white'}">ENGLISH</button>
                    <button onclick="window.LoginManager.setLanguage('ja')" class="text-xs font-mono ${this.currentLang === 'ja' ? 'text-[var(--accent)] underline' : 'text-gray-500 hover:text-white'}">日本語</button>
                    <button onclick="window.LoginManager.setLanguage('zh')" class="text-xs font-mono ${this.currentLang === 'zh' ? 'text-[var(--accent)] underline' : 'text-gray-500 hover:text-white'}">中文</button>
                </div>

                <h1 class="text-8xl font-dot mb-2 text-[var(--accent)] tracking-tighter animate-glitch">LUMO</h1>
                <h2 class="text-2xl font-dot mb-8 text-white tracking-[0.2em] uppercase border-b border-[var(--accent)] pb-2">${this.t('welcome')}</h2>
                <p class="text-sm font-mono text-gray-400 mb-8">${this.t('init')}</p>
                
                <div class="nothing-card w-full flex flex-col gap-6 shadow-2xl border border-white/10 p-8 bg-black/80">
                     <div class="flex flex-col gap-4">
                        <input id="setup-user-name" type="text" placeholder="${this.t('userPlaceholder')}" class="nothing-input text-lg text-center">
                        <input id="setup-user-pass" type="password" placeholder="${this.t('passPlaceholder')}" class="nothing-input text-lg text-center">
                        
                        <div class="mt-4 text-left">
                            <p class="text-[10px] text-[var(--accent)] font-bold mb-2 uppercase tracking-wider">${this.t('secTitle')}</p>
                            <input id="setup-user-q" type="text" placeholder="${this.t('secQPlaceholder')}" class="nothing-input text-sm w-full mb-2">
                            <input id="setup-user-a" type="text" placeholder="${this.t('secAPlaceholder')}" class="nothing-input text-sm w-full">
                        </div>
                    </div>
                    <button onclick="window.LoginManager.handleSetup()" class="nothing-btn border-[var(--accent)] text-[var(--accent)] hover:bg-[var(--accent)] hover:text-white text-xl py-3 mt-2">
                        ${this.t('startBtn')}
                    </button>
                    <button onclick="window.LoginManager.createGuest()" class="text-xs text-gray-500 hover:text-white transition mt-2 font-mono">
                        ${this.t('guestBtn')}
                    </button>
                </div>
            </div>
        `;
    }

    setLanguage(lang) {
        this.currentLang = lang;
        localStorage.setItem('lumo_language', lang);
        if (window.i18n?.setLocale) window.i18n.setLocale(lang);
        document.documentElement.lang = lang;
        this.renderOnboarding();
    }

    t(key) {
        return window.i18n?.t ? window.i18n.t('login.' + key) : key;
    }

    handleSetup() {
        const name = document.getElementById('setup-user-name').value;
        const pass = document.getElementById('setup-user-pass').value;
        const q = document.getElementById('setup-user-q').value;
        const a = document.getElementById('setup-user-a').value;

        if (name && pass) {
            this.addUser(name, pass, q, a);
            // Auto login the newly created user
            const newUser = this.users[this.users.length - 1];
            this.loginUser(newUser);
        } else {
            alert(this.t('alertFillFields'));
        }
    }

    loginUser(user) {
        this.currentUser = user;
        this.container.classList.add('opacity-0', 'pointer-events-none');
        setTimeout(() => {
            this.container.style.display = 'none';
            if (this.onLoginSuccess) this.onLoginSuccess(user);
        }, 500);
    }
}

window.LoginManager = new LoginManager();
