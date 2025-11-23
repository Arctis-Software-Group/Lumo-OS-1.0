(function(){
    // Simple global i18n: loads JSON locales and exposes t(), setLocale(), getLocale()
    window.__locales = window.__locales || {};
    window.__currentLocale = window.__currentLocale || 'en';

    window.i18n = {
        load: async (paths = ['src/locales/en.json', 'src/locales/ja.json', 'src/locales/zh.json', 'src/locales/ko.json']) => {
            const results = await Promise.all(paths.map(p => fetch(p).then(r => r.ok ? r.json() : {})));
            paths.forEach((p, i) => {
                try {
                    const name = p.split('/').pop().split('.')[0];
                    window.__locales[name] = results[i] || {};
                } catch(e) {
                    // ignore
                }
            });
            return window.__locales;
        },
        setLocale: (locale) => {
            window.__currentLocale = (locale || 'en').toString().split(/[-_]/)[0];
            return window.__currentLocale;
        },
        getLocale: () => window.__currentLocale,
        t: (key, fallback) => {
            if (!key) return fallback || '';
            const locale = window.__currentLocale || 'en';
            // try direct path first
            const parts = key.split('.');
            const tryGet = (obj, parts) => {
                return parts.reduce((acc, p) => (acc && acc[p] !== undefined) ? acc[p] : undefined, obj);
            };
            // check exact locale pack
            const pack = window.__locales[locale] || {};
            let val = tryGet(pack, parts);
            if (val !== undefined) return val;
            // fallback to english
            const en = window.__locales['en'] || {};
            val = tryGet(en, parts);
            if (val !== undefined) return val;
            // last resort: provided fallback string or key
            return fallback || key;
        }
    };
})();