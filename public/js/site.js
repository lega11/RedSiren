// CODE BY OisinMccarthy(LEGA11)
/* =========================================================
   Site module — shared chrome for every page.

   Builds the navigation, footer and login modal from one place so
   they can't drift apart between pages, and exposes:
     Site.toast(message, type)   styled notification, replaces alert()
     Site.auth                   login state helpers
     Site.requireLogin(note)     opens the modal, resolves when logged in
     Site.apiFetch(path, opts)   fetch with the auth token attached

   Each page sets <body data-page="events"> so the matching nav link
   can be marked as the current page.
   ========================================================= */

const Site = (function () {
  'use strict';

  const NAV_ITEMS = [
    { page: 'home', href: 'index.html', label: 'Home' },
    { page: 'events', href: 'events.html', label: 'Events' },
    { page: 'my-tickets', href: 'my-tickets.html', label: 'My tickets' },
    { page: 'about', href: 'about.html', label: 'About' },
    { page: 'contact', href: 'contact.html', label: 'Contact' }
  ];

  const FOOTER_COLUMNS = [
    {
      title: 'Tickets',
      links: [
        { href: 'events.html', label: 'All events' },
        { href: 'basket.html', label: 'Your basket' },
        { href: 'my-tickets.html', label: 'My tickets' },
        { href: 'faq.html', label: 'FAQ' }
      ]
    },
    {
      title: 'Red Siren',
      links: [
        { href: 'about.html', label: 'About us' },
        { href: 'contact.html', label: 'Contact' },
        { href: 'mailto:bookings@redsiren.ie', label: 'Play for us' }
      ]
    },
    {
      title: 'Legal',
      links: [
        { href: 'terms.html', label: 'Terms and conditions' },
        { href: 'privacy.html', label: 'Privacy policy' },
        { href: 'refunds.html', label: 'Refund policy' }
      ]
    },
    {
      title: 'Follow',
      links: [
        { href: 'https://www.instagram.com/', label: 'Instagram', external: true },
        { href: 'https://bandcamp.com/', label: 'Bandcamp', external: true },
        { href: 'https://soundcloud.com/', label: 'SoundCloud', external: true },
        { href: 'https://bsky.app/', label: 'Bluesky', external: true }
      ]
    }
  ];

  /* ---------- login state ---------- */

  const auth = {
    token: () => localStorage.getItem('rs_token'),
    email: () => localStorage.getItem('rs_email'),
    isLoggedIn: () => !!localStorage.getItem('rs_token'),
    set(token, email) {
      localStorage.setItem('rs_token', token);
      localStorage.setItem('rs_email', email);
      renderAuthButton();
      document.dispatchEvent(new CustomEvent('auth:changed'));
    },
    clear() {
      localStorage.removeItem('rs_token');
      localStorage.removeItem('rs_email');
      renderAuthButton();
      document.dispatchEvent(new CustomEvent('auth:changed'));
    }
  };

  // fetch wrapper that attaches the token and always returns
  // { ok, status, body } so callers don't repeat the same plumbing.
  async function apiFetch(path, options = {}) {
    const headers = Object.assign({ 'Content-Type': 'application/json' }, options.headers || {});
    if (auth.isLoggedIn()) headers.Authorization = 'Bearer ' + auth.token();

    try {
      const res = await fetch(path, Object.assign({}, options, { headers }));
      const body = await res.json().catch(() => ({}));
      return { ok: res.ok, status: res.status, body };
    } catch {
      return { ok: false, status: 0, body: { error: 'Could not reach the server. Check it is running.' } };
    }
  }

  /* ---------- toasts ---------- */

  function toast(message, type) {
    let stack = document.querySelector('.toast-stack');
    if (!stack) {
      stack = document.createElement('div');
      stack.className = 'toast-stack';
      stack.setAttribute('role', 'status');
      stack.setAttribute('aria-live', 'polite');
      document.body.appendChild(stack);
    }

    const el = document.createElement('div');
    el.className = 'toast' + (type === 'ok' ? ' toast-ok' : '');
    el.textContent = message;
    stack.appendChild(el);

    setTimeout(() => el.remove(), 4000);
  }

  /* ---------- navigation ---------- */

  function buildNav() {
    const mount = document.getElementById('site-nav');
    if (!mount) return;

    const current = document.body.dataset.page || '';

    const links = NAV_ITEMS.map(item => {
      const isCurrent = item.page === current;
      return '<li><a href="' + item.href + '"' + (isCurrent ? ' aria-current="page"' : '') + '>' + item.label + '</a></li>';
    }).join('');

    const basketCurrent = current === 'basket' ? ' aria-current="page"' : '';

    mount.className = 'nav';
    mount.innerHTML =
      '<div class="nav-inner">' +
        '<a class="wordmark" href="index.html"><span class="a">RED</span><span class="b">SIREN</span></a>' +
        '<button class="nav-toggle" id="nav-toggle" aria-expanded="false" aria-controls="nav-links">Menu</button>' +
        '<ul class="nav-links" id="nav-links">' +
          links +
          '<li><a class="nav-basket" href="basket.html"' + basketCurrent + '>Basket' +
            '<span class="nav-count" id="nav-count">0</span>' +
            '<span class="visually-hidden" id="nav-count-label">items in basket</span>' +
          '</a></li>' +
          '<li><button type="button" id="auth-button">Log in</button></li>' +
        '</ul>' +
      '</div>';

    const toggle = document.getElementById('nav-toggle');
    const list = document.getElementById('nav-links');
    toggle.addEventListener('click', () => {
      const open = list.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(open));
    });

    document.getElementById('auth-button').addEventListener('click', () => {
      if (auth.isLoggedIn()) {
        auth.clear();
        toast('Logged out.', 'ok');
      } else {
        openModal('login');
      }
    });

    renderAuthButton();
    renderBasketCount();
  }

  function renderAuthButton() {
    const button = document.getElementById('auth-button');
    if (!button) return;
    button.textContent = auth.isLoggedIn() ? 'Log out' : 'Log in';
    button.title = auth.isLoggedIn() ? 'Logged in as ' + auth.email() : 'Log in to book';
  }

  function renderBasketCount() {
    const badge = document.getElementById('nav-count');
    const label = document.getElementById('nav-count-label');
    if (!badge || typeof Basket === 'undefined') return;
    const n = Basket.count();
    badge.textContent = n;
    if (label) label.textContent = n === 1 ? 'item in basket' : 'items in basket';
  }

  /* ---------- footer ---------- */

  function buildFooter() {
    const mount = document.getElementById('site-footer');
    if (!mount) return;

    const columns = FOOTER_COLUMNS.map(col => {
      const links = col.links.map(link => {
        const attrs = link.external ? ' target="_blank" rel="noopener"' : '';
        return '<li><a href="' + link.href + '"' + attrs + '>' + link.label + '</a></li>';
      }).join('');
      return '<div class="footer-col"><h3>' + col.title + '</h3><ul>' + links + '</ul></div>';
    }).join('');

    mount.className = 'site-footer';
    mount.innerHTML =
      '<div class="footer-inner">' + columns + '</div>' +
      '<div class="footer-bottom">' +
        '<p>Red Siren &middot; Horgan\'s Quay, Cork &middot; a volunteer-run promoter</p>' +
        '<p>&copy; ' + new Date().getFullYear() + ' Red Siren. Student project — no real payments are taken.</p>' +
      '</div>';
  }

  /* ---------- auth modal ---------- */

  let modalMode = 'login';
  let loginResolve = null;   // set when requireLogin() is waiting

  function buildModal() {
    if (document.getElementById('auth-veil')) return;

    const veil = document.createElement('div');
    veil.className = 'modal-veil';
    veil.id = 'auth-veil';
    veil.hidden = true;
    veil.innerHTML =
      '<div class="modal" role="dialog" aria-modal="true" aria-labelledby="auth-title">' +
        '<button type="button" class="modal-close" id="auth-close" aria-label="Close">&#10005;</button>' +
        '<div class="modal-tabs">' +
          '<button type="button" class="modal-tab" id="tab-login" aria-selected="true">Log in</button>' +
          '<button type="button" class="modal-tab" id="tab-register" aria-selected="false">Create account</button>' +
        '</div>' +
        '<h2 id="auth-title">Log in</h2>' +
        '<p class="modal-note" id="auth-note"></p>' +
        '<form id="auth-form" novalidate>' +
          '<label class="field"><span>Email</span>' +
            '<input type="email" id="auth-email" autocomplete="email" required>' +
          '</label>' +
          '<label class="field"><span id="auth-pw-label">Password</span>' +
            '<input type="password" id="auth-password" autocomplete="current-password" required>' +
          '</label>' +
          '<p class="modal-error" id="auth-error" role="alert"></p>' +
          '<button type="submit" class="btn" id="auth-submit">Log in</button>' +
        '</form>' +
      '</div>';

    document.body.appendChild(veil);

    document.getElementById('tab-login').addEventListener('click', () => setMode('login'));
    document.getElementById('tab-register').addEventListener('click', () => setMode('register'));
    document.getElementById('auth-close').addEventListener('click', closeModal);
    veil.addEventListener('click', e => { if (e.target === veil) closeModal(); });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && !veil.hidden) closeModal();
    });
    document.getElementById('auth-form').addEventListener('submit', submitAuth);
  }

  function setMode(mode) {
    modalMode = mode;
    const isLogin = mode === 'login';
    document.getElementById('auth-title').textContent = isLogin ? 'Log in' : 'Create an account';
    document.getElementById('auth-pw-label').textContent = isLogin ? 'Password' : 'Password (min. 8 characters)';
    document.getElementById('auth-submit').textContent = isLogin ? 'Log in' : 'Create account';
    document.getElementById('auth-password').setAttribute('autocomplete', isLogin ? 'current-password' : 'new-password');
    document.getElementById('tab-login').setAttribute('aria-selected', String(isLogin));
    document.getElementById('tab-register').setAttribute('aria-selected', String(!isLogin));
    document.getElementById('auth-error').textContent = '';
  }

  function openModal(mode, note) {
    buildModal();
    setMode(mode || 'login');
    document.getElementById('auth-form').reset();
    document.getElementById('auth-note').textContent = note || '';
    document.getElementById('auth-veil').hidden = false;
    document.getElementById('auth-email').focus();
  }

  function closeModal() {
    const veil = document.getElementById('auth-veil');
    if (veil) veil.hidden = true;
    // A cancelled login resolves false so the caller can stop cleanly.
    if (loginResolve) { loginResolve(false); loginResolve = null; }
  }

  async function submitAuth(event) {
    event.preventDefault();

    const email = document.getElementById('auth-email').value.trim();
    const password = document.getElementById('auth-password').value;
    const errorEl = document.getElementById('auth-error');
    const submit = document.getElementById('auth-submit');

    errorEl.textContent = '';

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errorEl.textContent = 'Enter a valid email address.';
      return;
    }
    if (password.length < 8) {
      errorEl.textContent = 'Password must be at least 8 characters.';
      return;
    }

    submit.disabled = true;
    const path = modalMode === 'login' ? '/api/auth/login' : '/api/auth/register';
    const result = await apiFetch(path, { method: 'POST', body: JSON.stringify({ email, password }) });
    submit.disabled = false;

    if (!result.ok) {
      errorEl.textContent = result.body.error || 'Something went wrong.';
      return;
    }

    auth.set(result.body.token, result.body.email);
    document.getElementById('auth-veil').hidden = true;
    toast('Logged in as ' + result.body.email, 'ok');

    if (loginResolve) { loginResolve(true); loginResolve = null; }
  }

  // Opens the modal and resolves true once logged in, false if cancelled.
  function requireLogin(note) {
    if (auth.isLoggedIn()) return Promise.resolve(true);
    openModal('login', note || 'Log in or create an account to continue.');
    return new Promise(resolve => { loginResolve = resolve; });
  }

  /* ---------- boot ---------- */

  function init() {
    buildNav();
    buildFooter();
    buildModal();
    document.addEventListener('basket:changed', renderBasketCount);
    // Another tab changing the basket keeps this one in step.
    window.addEventListener('storage', renderBasketCount);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  return { toast, auth, apiFetch, requireLogin, openModal, renderBasketCount };
})();
// CODE BY OisinMccarthy(LEGA11)
