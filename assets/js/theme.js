'use strict';

(() => {
  const root = document.documentElement;
  const storageKey = 'gs-portfolio-appearance-v2';
  const allowedAccents = ['red', 'violet', 'ice'];
  const config = window.PORTFOLIO_THEME || {};
  const defaults = {
    accent: allowedAccents.includes(config.accent) ? config.accent : 'red',
    motion: config.motion === 'reduced' ? 'reduced' : 'system'
  };
  const normalize = value => ({
    accent: value && allowedAccents.includes(value.accent) ? value.accent : defaults.accent,
    motion: value && ['reduced', 'system'].includes(value.motion) ? value.motion : defaults.motion
  });
  let canSave = true;
  const readSettings = () => {
    try {
      return normalize(JSON.parse(window.localStorage.getItem(storageKey)));
    } catch {
      // Bloqueio de armazenamento e JSON inválido não impedem o uso do site.
      return { ...defaults };
    }
  };
  let settings = readSettings();
  const preference = typeof window.matchMedia === 'function'
    ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
  const appearance = document.querySelector('[data-appearance]');
  const accentButtons = [...document.querySelectorAll('[data-set-accent]')];
  const motionInput = document.querySelector('[data-reduce-motion]');
  const note = document.querySelector('[data-appearance-note]');
  const revealElements = [...document.querySelectorAll('[data-reveal]')];
  let observer;

  const show = element => {
    element.classList.add('is-visible');
    element.dataset.revealDone = 'true';
    if (observer) observer.unobserve(element);
  };

  const configureReveals = reduced => {
    if (observer) observer.disconnect();
    observer = undefined;
    if (reduced || typeof window.IntersectionObserver !== 'function') {
      revealElements.forEach(element => element.classList.remove('will-reveal'));
      return;
    }
    try {
      observer = new window.IntersectionObserver(entries => {
        entries.forEach(entry => { if (entry.isIntersecting) show(entry.target); });
      }, { threshold: 0, rootMargin: '0px 0px -32px 0px' });

      revealElements.forEach(element => {
        // Elementos já lidos e conteúdo no alto da página nunca são ocultados.
        if (element.dataset.revealDone === 'true' || element.getBoundingClientRect().top < window.innerHeight - 32) {
          element.classList.remove('will-reveal');
          show(element);
        } else {
          element.classList.add('will-reveal');
          observer.observe(element);
        }
      });
    } catch {
      if (observer) observer.disconnect();
      observer = undefined;
      revealElements.forEach(element => element.classList.remove('will-reveal'));
    }
  };

  const updateNote = () => {
    if (!note) return;
    note.textContent = !canSave
      ? 'A preferência vale nesta página; o navegador bloqueou o salvamento.'
      : preference && preference.matches
        ? 'Movimento reduzido conforme a preferência do seu dispositivo.'
        : 'Suas preferências ficam neste navegador.';
  };

  const apply = () => {
    const systemReduced = Boolean(preference && preference.matches);
    const reduced = systemReduced || settings.motion === 'reduced';
    root.dataset.accent = settings.accent;
    root.dataset.motion = reduced ? 'reduced' : 'full';
    root.classList.toggle('motion-enabled', !reduced);
    accentButtons.forEach(button => {
      button.setAttribute('aria-pressed', String(button.dataset.setAccent === settings.accent));
    });
    if (motionInput) {
      motionInput.checked = reduced;
      motionInput.disabled = systemReduced;
    }
    configureReveals(reduced);
    updateNote();
  };

  const persist = () => {
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(settings));
      canSave = true;
    } catch { canSave = false; }
    updateNote();
  };

  accentButtons.forEach(button => button.addEventListener('click', () => {
    const accent = button.dataset.setAccent;
    if (!allowedAccents.includes(accent)) return;
    settings.accent = accent;
    apply();
    persist();
  }));

  if (motionInput) motionInput.addEventListener('change', () => {
    settings.motion = motionInput.checked ? 'reduced' : 'system';
    apply();
    persist();
  });

  if (preference) {
    if (typeof preference.addEventListener === 'function') preference.addEventListener('change', apply);
    else if (typeof preference.addListener === 'function') preference.addListener(apply);
  }

  window.addEventListener('storage', event => {
    if (event.key === storageKey || event.key === null) {
      settings = readSettings();
      apply();
    }
  });

  // Teclado: um link nunca recebe foco enquanto permanece invisível.
  document.addEventListener('focusin', event => {
    const element = event.target.closest && event.target.closest('[data-reveal]');
    if (element) show(element);
  });

  if (appearance) {
    document.addEventListener('click', event => {
      if (!appearance.contains(event.target)) appearance.open = false;
    });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && appearance.open) {
        appearance.open = false;
        appearance.querySelector('summary').focus();
      }
    });
  }

  const progress = document.querySelector('[data-scroll-progress]');
  if (progress) {
    let scheduled = false;
    const update = () => {
      const distance = root.scrollHeight - window.innerHeight;
      const ratio = distance > 0 ? Math.min(1, Math.max(0, window.scrollY / distance)) : 0;
      progress.style.transform = `scaleX(${ratio})`;
      scheduled = false;
    };
    const schedule = () => {
      if (scheduled) return;
      scheduled = true;
      window.requestAnimationFrame(update);
    };
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    window.addEventListener('load', schedule);
    document.addEventListener('toggle', schedule, true);
    update();
  }

  apply();
  if (appearance) appearance.hidden = false;
})();
