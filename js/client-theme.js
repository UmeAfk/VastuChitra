// Client-only appearance preference. Studio and Heritage keep their own design.
(() => {
  const key = 'vastuchitra-client-theme-v1';
  const root = document.documentElement;
  const cfg = window.VASTU_SETTINGS?.normalize(window.VASTUCHITRA?.settings || {}) || {};
  const remember = cfg.clientRememberTheme !== false;
  const configured = ['light','dark'].includes(cfg.clientThemeDefault) ? cfg.clientThemeDefault : null;
  const system = matchMedia('(prefers-color-scheme: dark)');
  let preference = null;
  let changing = false;
  try { if (remember) preference = localStorage.getItem(key); } catch {}
  const valid = value => value === 'light' || value === 'dark';
  function apply(theme){
    root.dataset.clientTheme = theme;
    window.dispatchEvent(new Event('client-theme-changed'));
  }
  apply(valid(preference) ? preference : configured || (system.matches ? 'dark' : 'light'));
  window.VASTU_CLIENT_THEME = {
    async toggle(button){
      if (changing) return;
      const next = root.dataset.clientTheme === 'dark' ? 'light' : 'dark';
      preference = next;
      try { if (remember) localStorage.setItem(key,next); } catch {}
      const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches || cfg.motion === false || cfg.clientThemeAnimation === false;
      if (!document.startViewTransition || reduced){ apply(next); return; }
      changing = true;
      root.classList?.add('client-theme-changing');
      const rect = button.getBoundingClientRect();
      const x = rect.left + rect.width / 2, y = rect.top + rect.height / 2;
      const radius = Math.hypot(Math.max(x,innerWidth - x),Math.max(y,innerHeight - y));
      try {
        const transition = document.startViewTransition(() => apply(next));
        await transition.ready;
        await root.animate({clipPath:[`circle(0px at ${x}px ${y}px)`,`circle(${radius}px at ${x}px ${y}px)`]},
          {duration:650,easing:'cubic-bezier(.22,.68,.15,1)',pseudoElement:'::view-transition-new(root)'}).finished;
        await transition.finished;
      } catch { apply(next); }
      finally { root.classList?.remove('client-theme-changing');changing = false; }
    }
  };
  system.addEventListener('change',event => { if (!valid(preference) && !configured) apply(event.matches ? 'dark' : 'light'); });
  window.addEventListener('storage',event => {
    if (event.key !== key || !remember) return;
    preference = event.newValue;
    apply(valid(preference) ? preference : configured || (system.matches ? 'dark' : 'light'));
  });
})();
