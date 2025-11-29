const THEME_STORAGE_KEY = 'lumo_theme_v2';

const DefaultThemes = {
  dark: {
    vars: {
      '--bg-dark': '#0a0a0a',
      '--text-main': '#eaeaea',
      '--glass': 'rgba(20,20,20,0.6)',
      '--glass-border': 'rgba(255,255,255,0.1)',
      '--card-bg': '#111111',
      '--card-border': '#333333',
      '--window-bg': '#111111',
      '--window-header': '#000000',
      '--window-border': '#333333',
      '--input-bg': 'transparent',
      '--input-border': '#444444',
      '--border-weight': '1px',
      '--card-shadow': '0 8px 32px 0 rgba(0, 0, 0, 0.5)',
      '--window-shadow': '0 20px 50px rgba(0, 0, 0, 0.8)',
      '--grid-size': '12px',
      '--widget-bg': 'rgba(20,20,20,0.6)',
      '--widget-border': 'rgba(255,255,255,0.1)',
      '--widget-radius': '24px',
      '--widget-padding': '20px'
    },
    accent: localStorage.getItem('lumo_accent') || '#ff003c'
  },
  light: {
    vars: {
      '--bg-dark': '#f5f5f5',
      '--text-main': '#0f172a',
      '--glass': 'rgba(255,255,255,0.8)',
      '--glass-border': 'rgba(15,23,42,0.1)',
      '--card-bg': '#ffffff',
      '--card-border': '#e2e8f0',
      '--window-bg': '#ffffff',
      '--window-header': '#f1f5f9',
      '--window-border': '#cbd5e1',
      '--input-bg': '#f8fafc',
      '--input-border': '#cbd5e1',
      '--border-weight': '1px',
      '--card-shadow': '0 8px 32px 0 rgba(0, 0, 0, 0.08)',
      '--window-shadow': '0 20px 50px rgba(0, 0, 0, 0.15)',
      '--grid-size': '12px',
      '--widget-bg': 'rgba(255,255,255,0.7)',
      '--widget-border': 'rgba(0,0,0,0.08)',
      '--widget-radius': '24px',
      '--widget-padding': '20px'
    },
    accent: localStorage.getItem('lumo_accent') || '#ff003c'
  }
};

function readStorage() {
  try {
    const raw = localStorage.getItem(THEME_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeStorage(payload) {
  localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(payload));
}

function applyVars(vars) {
  const root = document.documentElement;
  Object.entries(vars).forEach(([k, v]) => root.style.setProperty(k, v));
}

function getCurrentUserId() {
  return window.LoginManager?.currentUser?.id || 'default';
}

window.ThemeRegistry = {
  presets: window.LumoThemePresets || DefaultThemes,
  current: { name: 'dark', vars: DefaultThemes.dark.vars, accent: DefaultThemes.dark.accent },

  load(userId = getCurrentUserId()) {
    const store = readStorage();
    const entry = store[userId];
    if (entry && entry.vars) {
      this.current = entry;
      applyVars(entry.vars);
      document.documentElement.style.setProperty('--accent', entry.accent || this.current.accent || '#ff003c');
      document.dispatchEvent(new CustomEvent('lumo-theme-changed', { detail: this.current }));
      return entry;
    } else {
      // Default apply
      this.applyPreset('dark');
      return this.current;
    }
  },

  save(userId = getCurrentUserId()) {
    const store = readStorage();
    store[userId] = this.current;
    writeStorage(store);
  },

  applyPreset(name) {
    const preset = this.presets[name] || DefaultThemes[name];
    if (!preset) return;
    applyVars(preset.vars);
    document.documentElement.style.setProperty('--accent', preset.accent || '#ff003c');
    this.current = { name, vars: preset.vars, accent: preset.accent || '#ff003c' };
    document.dispatchEvent(new CustomEvent('lumo-theme-changed', { detail: this.current }));
    this.save();
  },

  preview(vars) {
    const prev = { ...this.current.vars };
    applyVars(vars);
    return () => applyVars(prev);
  },

  setAccentColor(color) {
    document.documentElement.style.setProperty('--accent', color);
    this.current.accent = color;
    this.save();
    const settingsWin = document.querySelector('[id^="win-settings"]');
    if (settingsWin) {
      const buttons = settingsWin.querySelectorAll('[data-accent-color]');
      buttons.forEach(btn => { btn.innerHTML = btn.dataset.accentColor === color ? '<i class="fa-solid fa-check text-white text-xs"></i>' : ''; });
    }
  },

  migrateLegacy() {
    const legacyAccent = localStorage.getItem('lumo_accent');
    if (legacyAccent && !this.current.accent) this.setAccentColor(legacyAccent);
  }
};

// Auto-load on boot after locales
document.addEventListener('DOMContentLoaded', () => {
  window.ThemeRegistry.load();
  window.ThemeRegistry.migrateLegacy();
});

