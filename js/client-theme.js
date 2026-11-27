// Client-only appearance preference. Studio and Heritage keep their own design.
(() => {
  const key = 'vastuchitra-client-theme-v1';
  const root = document.documentElement;
  const cfg = window.VASTU_SETTINGS?.normalize(window.VASTUCHITRA?.settings || {}) || {};
  root.dataset.clientThemeMotion = cfg.clientThemeAnimation === false || cfg.motion === false ? 'off' : 'on';
  const remember = cfg.clientRememberTheme !== false;
  const configured = ['light','dark'].includes(cfg.clientThemeDefault) ? cfg.clientThemeDefault : null;
  const system = matchMedia('(prefers-color-scheme: dark)');
  let preference = null;
  try { if (remember) preference = localStorage.getItem(key); } catch {}
  const valid = value => value === 'light' || value === 'dark';
  function apply(theme){
    root.dataset.clientTheme = theme;
    window.dispatchEvent(new Event('client-theme-changed'));
  }
  apply(valid(preference) ? preference : configured || (system.matches ? 'dark' : 'light'));
  window.VASTU_CLIENT_THEME = {
    async toggle(button){
      const next = root.dataset.clientTheme === 'dark' ? 'light' : 'dark';
      preference = next;
      try { if (remember) localStorage.setItem(key,next); } catch {}
      // Keep video, sticky headers and page content in the live compositor.
      // Whole-page snapshots can flash when those layers update during a reveal.
      apply(next);
    }
  };
  system.addEventListener('change',event => { if (!valid(preference) && !configured) apply(event.matches ? 'dark' : 'light'); });
  window.addEventListener('storage',event => {
    if (event.key !== key || !remember) return;
    preference = event.newValue;
    apply(valid(preference) ? preference : configured || (system.matches ? 'dark' : 'light'));
  });
})();
