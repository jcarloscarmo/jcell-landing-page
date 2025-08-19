// JCELL – scripts principais
(() => {
  document.addEventListener('DOMContentLoaded', () => {
    // ---------------------------
    // Helpers
    // ---------------------------
    const qs  = (sel, el = document) => el.querySelector(sel);
    const qsa = (sel, el = document) => [...el.querySelectorAll(sel)];

    const body = document.body;
    const header = qs('.main-header');

    // Bloqueio de scroll quando o menu abre (evita "jump" do layout)
    let scrollLock = {
      locked: false,
      prevOverflow: '',
      prevPaddingRight: '',
      lock() {
        if (this.locked) return;
        this.prevOverflow = body.style.overflow;
        this.prevPaddingRight = body.style.paddingRight;
        const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
        if (scrollbarWidth > 0) body.style.paddingRight = `${scrollbarWidth}px`;
        body.style.overflow = 'hidden';
        this.locked = true;
      },
      unlock() {
        if (!this.locked) return;
        body.style.overflow = this.prevOverflow || '';
        body.style.paddingRight = this.prevPaddingRight || '';
        this.locked = false;
      }
    };

    // ---------------------------
    // Menu mobile acessível
    // ---------------------------
    const hamburger = qs('.hamburger-menu');
    const navMenu   = qs('.main-nav');

    if (hamburger && navMenu) {
      // Garantir atributos ARIA/ID
      if (!navMenu.id) navMenu.id = 'site-menu';
      hamburger.setAttribute('aria-controls', navMenu.id);
      hamburger.setAttribute('aria-expanded', 'false');
      hamburger.setAttribute('aria-label', 'Abrir menu de navegação');

      let lastFocus = null;

      const openMenu = () => {
        navMenu.classList.add('active');
        hamburger.classList.add('active');
        hamburger.setAttribute('aria-expanded', 'true');
        lastFocus = document.activeElement;
        // tenta focar o primeiro link do menu
        const firstLink = qs('a, button', navMenu);
        firstLink && firstLink.focus({ preventScroll: true });
        scrollLock.lock();
        // fecha ao clicar fora
        document.addEventListener('click', onDocClick);
        document.addEventListener('keydown', onKeydown);
      };

      const closeMenu = () => {
        navMenu.classList.remove('active');
        hamburger.classList.remove('active');
        hamburger.setAttribute('aria-expanded', 'false');
        scrollLock.unlock();
        document.removeEventListener('click', onDocClick);
        document.removeEventListener('keydown', onKeydown);
        // volta o foco para o botão
        if (lastFocus) hamburger.focus({ preventScroll: true });
      };

      const toggleMenu = () => {
        const isOpen = navMenu.classList.toggle('active');
        hamburger.classList.toggle('active', isOpen);
        hamburger.setAttribute('aria-expanded', String(isOpen));
        if (isOpen) {
          openMenu();
        } else {
          closeMenu();
        }
      };

      const onDocClick = (e) => {
        if (!navMenu.contains(e.target) && !hamburger.contains(e.target)) {
          closeMenu();
        }
      };

      const onKeydown = (e) => {
        if (e.key === 'Escape') {
          closeMenu();
        }
      };

      hamburger.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleMenu();
      });

      // Fechar quando clicar em um link do menu (no mobile)
      navMenu.addEventListener('click', (e) => {
        const link = e.target.closest('a');
        if (!link) return;
        // Se for âncora interna, fechamos imediatamente
        if (link.getAttribute('href')?.startsWith('#')) {
          closeMenu();
        }
      });

      // Se a viewport mudar (paisagem -> retrato, etc.) garantindo estado consistente
      window.addEventListener('resize', () => {
        // Se o menu estiver aberto e a largura crescer (desktop), destravar scroll
        if (window.innerWidth > 900 && navMenu.classList.contains('active')) {
          closeMenu();
        }
      }, { passive: true });
    }

    // ---------------------------
    // Rolagem suave com offset do header fixo
    // ---------------------------
    const internalLinks = qsa('a[href^="#"]');
    internalLinks.forEach((a) => {
      a.addEventListener('click', (e) => {
        const id = a.getAttribute('href');
        if (id.length > 1) {
          const target = qs(id);
          if (target) {
            e.preventDefault();
            const headerH = header ? header.offsetHeight : 0;
            const top = Math.max(0, target.getBoundingClientRect().top + window.scrollY - headerH - 8);
            window.scrollTo({ top, behavior: 'smooth' });
          }
        }
      });
    });

    // ---------------------------
    // IntersectionObserver para .fade-in
    // ---------------------------
    const faders = qsa('.fade-in');
    if ('IntersectionObserver' in window && faders.length) {
      const io = new IntersectionObserver((entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            obs.unobserve(entry.target);
          }
        });
      }, { root: null, rootMargin: '0px 0px -10% 0px', threshold: 0.15 });
      faders.forEach(el => io.observe(el));
    } else {
      // fallback
      faders.forEach(el => el.classList.add('visible'));
    }

    // ---------------------------
    // Rotator de depoimentos
    // ---------------------------
    const rotator = qs('.testimonial-rotator');
    if (rotator) {
      const items = qsa('.testimonial-item', rotator);
      let idx = Math.max(0, items.findIndex(el => el.classList.contains('active')));
      if (idx < 0) idx = 0;
      const show = (i) => {
        items.forEach((el, k) => el.classList.toggle('active', k === i));
      };

      let timer = null;
      const start = () => {
        clearInterval(timer);
        timer = setInterval(() => {
          idx = (idx + 1) % items.length;
          show(idx);
        }, 6000);
      };
      const stop = () => clearInterval(timer);

      // pausa em hover/foco
      rotator.addEventListener('mouseenter', stop);
      rotator.addEventListener('mouseleave', start);
      rotator.addEventListener('focusin', stop);
      rotator.addEventListener('focusout', start);

      start();
    }

    // ---------------------------
    // Footer year dinâmico
    // ---------------------------
    const yearSpan = qs('[data-year]');
    if (yearSpan) {
      yearSpan.textContent = String(new Date().getFullYear());
    }

    // ---------------------------
    // FAB (CTA flutuante) – acessível
    // ---------------------------
    const fab = qs('[data-fab]');
    if (fab) {
      const btn = fab.querySelector('.fab-btn');
      const actions = fab.querySelector('.fab-actions');

      const isOpen = () => fab.getAttribute('aria-expanded') === 'true';
      const open = () => {
        fab.setAttribute('aria-expanded', 'true');
        btn.setAttribute('aria-expanded', 'true');
        // foco no primeiro item quando abrir via teclado
        const first = actions.querySelector('a,button');
        if (first && document.activeElement === btn) {
          first.focus({ preventScroll: true });
        }
        document.addEventListener('click', onDocClick);
        document.addEventListener('keydown', onKeydown);
      };
      const close = () => {
        fab.setAttribute('aria-expanded', 'false');
        btn.setAttribute('aria-expanded', 'false');
        document.removeEventListener('click', onDocClick);
        document.removeEventListener('keydown', onKeydown);
      };
      const toggle = () => (isOpen() ? close() : open());

      const onDocClick = (e) => {
        if (!fab.contains(e.target)) close();
      };
      const onKeydown = (e) => {
        if (e.key === 'Escape') {
          close();
          btn.focus({ preventScroll: true });
        }
      };

      // estado inicial
      fab.setAttribute('aria-expanded', 'false');
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggle();
      });

      // Acessibilidade extra: fecha quando tab sai do menu
      actions.addEventListener('focusout', (e) => {
        // se o foco saiu do container e não foi para dentro dele
        if (!actions.contains(e.relatedTarget)) {
          close();
        }
      });
    }
  });
})();
