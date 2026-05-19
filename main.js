'use strict';

/* ─── footer year ────────────────────────────────────────────────── */
const setFooterYear = () => {
  const el = document.getElementById('footer-year');
  if (el) el.textContent = new Date().getFullYear();
};
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', setFooterYear);
} else {
  setFooterYear();
}

/* ─── loader ─────────────────────────────────────────────────────── */
const loader     = document.getElementById('page-loader');
const SHOW_AFTER = 150;
const MIN_SHOWN  = 500;
let loaderShownAt = null;
let showTimerId   = null;

const resetLoaderBar = () => {
  const bar    = document.getElementById('loaderBarFill');
  const parent = bar.parentNode;
  const clone  = bar.cloneNode(true);
  parent.replaceChild(clone, bar);
};

const revealApp = () => {
  loader.classList.add('hidden');
  loader.classList.remove('active');
  loader.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('loading');
  document.body.classList.add('ready');
};

const onPageLoad = () => {
  if (showTimerId) {
    clearTimeout(showTimerId);
    showTimerId = null;
    revealApp();
    return;
  }
  if (document.visibilityState === 'hidden') {
    const handleVisible = () => {
      document.removeEventListener('visibilitychange', handleVisible);
      const shown = loaderShownAt !== null ? Date.now() - loaderShownAt : MIN_SHOWN;
      const wait  = Math.max(0, MIN_SHOWN - shown);
      setTimeout(revealApp, wait);
    };
    document.addEventListener('visibilitychange', handleVisible);
    return;
  }
  if (loaderShownAt !== null) {
    const shown = Date.now() - loaderShownAt;
    const wait  = Math.max(0, MIN_SHOWN - shown);
    setTimeout(revealApp, wait);
  } else {
    revealApp();
  }
};

showTimerId = setTimeout(() => {
  showTimerId = null;
  loaderShownAt = Date.now();
  loader.removeAttribute('aria-hidden');
  resetLoaderBar();
  loader.classList.add('active');
}, SHOW_AFTER);

if (document.readyState === 'complete') {
  onPageLoad();
} else {
  window.addEventListener('load', onPageLoad, { once: true });
}

/* bfcache restore */
window.addEventListener('pageshow', e => {
  if (e.persisted) {
    resetLoaderBar();
    document.body.classList.remove('loading');
    document.body.classList.add('ready');
    loader.classList.add('hidden');
    loader.classList.remove('active');
    loader.setAttribute('aria-hidden', 'true');
    const btn = document.getElementById('sendBtn');
    if (btn) btn.disabled = false;
    if (document.getElementById('hamburger').classList.contains('open')) {
      closeMenu();
    }
  }
});

/* ─── custom cursor ring ─────────────────────────────────────────── */
if (window.matchMedia('(pointer: fine) and (hover: hover)').matches) {
  const ring = document.getElementById('curRing');
  let mx = 0, my = 0, rx = 0, ry = 0;
  let rafId = null;
  let ringInitialized = false;
  let isInsideDoc = false;

  const tick = () => {
    rx += (mx - rx) * 0.12;
    ry += (my - ry) * 0.12;
    ring.style.transform = `translate(${rx}px,${ry}px)`;
    rafId = requestAnimationFrame(tick);
  };

  const stopLoop = () => {
    if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
  };

  const startLoop = () => {
    if (!rafId) rafId = requestAnimationFrame(tick);
  };

  document.addEventListener('mousemove', e => {
    mx = e.clientX;
    my = e.clientY;
    isInsideDoc = true;
    if (!ringInitialized) {
      ringInitialized = true;
      rx = mx; ry = my;
      ring.classList.add('visible');
      startLoop();
    }
    if (ring.classList.contains('hidden')) {
      ring.classList.remove('hidden');
      ring.classList.add('visible');
    }
  }, { passive: true });

  window.addEventListener('mouseleave', () => {
    isInsideDoc = false;
    ring.classList.remove('visible');
    ring.classList.add('hidden');
    stopLoop();
    rx = mx; ry = my;
  });

  window.addEventListener('mouseenter', () => {
    isInsideDoc = true;
    ring.classList.remove('hidden');
    if (ringInitialized) {
      ring.classList.add('visible');
      startLoop();
    }
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      stopLoop();
    } else {
      if (ringInitialized && isInsideDoc) startLoop();
    }
  });
}

/* ─── smooth scroll ──────────────────────────────────────────────── */
const navbarEl     = document.querySelector('.navbar');
const getNavOffset = () => (navbarEl ? navbarEl.offsetHeight + 16 : 88);

const scrollToTarget = (target) => {
  const y = target.getBoundingClientRect().top + window.scrollY - getNavOffset();
  window.scrollTo({ top: y, behavior: 'smooth' });

  const hasScrollEnd = ('onscrollend' in window) || ('scrollend' in window);
  if (hasScrollEnd) {
    let safetyTimer = null;
    let done = false;

    const finish = () => {
      if (done) return;
      done = true;
      clearTimeout(safetyTimer);
      window.removeEventListener('scrollend', onScrollEnd);
      target.focus({ preventScroll: true });
    };

    const onScrollEnd = () => finish();
    window.addEventListener('scrollend', onScrollEnd, { once: true });
    safetyTimer = setTimeout(finish, 1000);
  } else {
    setTimeout(() => target.focus({ preventScroll: true }), 300);
  }
};

const scrollTargetSel = [
  '.navbar-links a[href^="#"]',
  '.mobile-nav a[href^="#"]',
  '.hero-actions a[href^="#"]',
  '.skip-link'
].join(', ');

document.querySelectorAll(scrollTargetSel).forEach(anchor => {
  anchor.addEventListener('click', e => {
    e.preventDefault();
    const href   = anchor.getAttribute('href');
    const target = document.querySelector(href);
    if (!target) return;
    scrollToTarget(target);
  });
});

/* ─── hamburger + focus trap ─────────────────────────────────────── */
const hamburger      = document.getElementById('hamburger');
const mobileNav      = document.getElementById('mobileNav');
const navBackdrop    = document.getElementById('navBackdrop');
const mainContent    = document.getElementById('main-content');
const siteFooter     = document.getElementById('site-footer');
let lastFocused          = null;
let savedScrollY         = 0;
let skipScrollRestore    = false;
let linkClickPending     = false;

const measureScrollbarWidth = () => {
  if (document.body.classList.contains('noscroll')) return;
  const w = window.innerWidth - document.documentElement.clientWidth;
  document.documentElement.style.setProperty('--scrollbar-w', w + 'px');
};
measureScrollbarWidth();

let resizeDebounce = null;
window.addEventListener('resize', () => {
  clearTimeout(resizeDebounce);
  resizeDebounce = setTimeout(() => {
    measureScrollbarWidth();
    setupReveal();
    applyStaggerDelays();
  }, 150);
}, { passive: true });

const setInert = (el, makeInert) => {
  if (!el) return;
  if (makeInert) {
    el.setAttribute('inert', '');
    el.setAttribute('aria-hidden', 'true');
  } else {
    el.removeAttribute('inert');
    el.removeAttribute('aria-hidden');
  }
};

const openMenu = () => {
  if (hamburger.classList.contains('open')) return;
  lastFocused  = document.activeElement;
  savedScrollY = window.scrollY;
  hamburger.classList.add('open');
  mobileNav.classList.add('open');
  navBackdrop.classList.add('active');
  hamburger.setAttribute('aria-expanded', 'true');
  setInert(mobileNav, false);
  setInert(mainContent, true);
  setInert(siteFooter, true);
  void document.body.offsetHeight;
  document.body.style.top = `-${savedScrollY}px`;
  document.body.classList.add('noscroll');
  const firstLink = mobileNav.querySelector('a');
  if (firstLink) firstLink.focus();
};

function closeMenu() {
  hamburger.classList.remove('open');
  mobileNav.classList.remove('open');
  navBackdrop.classList.remove('active');
  hamburger.setAttribute('aria-expanded', 'false');
  setInert(mobileNav, true);
  setInert(mainContent, false);
  setInert(siteFooter, false);
  document.body.classList.remove('noscroll');
  document.body.style.top = '';

  const shouldSkip   = skipScrollRestore;
  const wasLinkClick = linkClickPending;
  skipScrollRestore = false;
  linkClickPending  = false;

  if (!shouldSkip) {
    const targetY = savedScrollY;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        window.scrollTo({ top: targetY, behavior: 'auto' });
      });
    });
  }

  if (!wasLinkClick && lastFocused) {
    lastFocused.focus();
  }
  lastFocused = null;
}

hamburger.addEventListener('click', () => {
  hamburger.classList.contains('open') ? closeMenu() : openMenu();
});

hamburger.addEventListener('keydown', e => {
  if (e.key === 'Escape' && hamburger.classList.contains('open')) closeMenu();
});

document.addEventListener('click', e => {
  if (
    mobileNav.classList.contains('open') &&
    !mobileNav.contains(e.target) &&
    !hamburger.contains(e.target)
  ) {
    closeMenu();
  }
});

mobileNav.addEventListener('keydown', e => {
  const focusable = Array.from(mobileNav.querySelectorAll('a'));
  const first = focusable[0];
  const last  = focusable[focusable.length - 1];
  if (e.key === 'Tab') {
    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault();
        hamburger.focus();
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault();
        hamburger.focus();
      }
    }
  }
  if (e.key === 'Escape') closeMenu();
});

hamburger.addEventListener('keydown', e => {
  if (!mobileNav.classList.contains('open')) return;
  const focusable = Array.from(mobileNav.querySelectorAll('a'));
  if (e.key === 'Tab') {
    if (e.shiftKey) {
      e.preventDefault();
      focusable[focusable.length - 1].focus();
    } else {
      e.preventDefault();
      focusable[0].focus();
    }
  }
});

mobileNav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
  skipScrollRestore = true;
  linkClickPending  = true;
  closeMenu();
}));

/* ─── active nav ─────────────────────────────────────────────────── */
const secs         = Array.from(document.querySelectorAll('section[id]'));
const desktopLinks = document.querySelectorAll('.navbar-links a');
const mobileLinks  = document.querySelectorAll('.mobile-link');
let currentActive  = '';
const intersecting = new Set();

const setActive = id => {
  if (id === currentActive) return;
  currentActive = id;
  [...desktopLinks, ...mobileLinks].forEach(l => {
    l.classList.toggle('active', l.getAttribute('href') === '#' + id);
  });
};

const validSectionIds = new Set(secs.map(s => s.id));
const pickActive = () => {
  if (intersecting.size === 0) return;
  for (const id of intersecting) {
    if (!validSectionIds.has(id)) intersecting.delete(id);
  }
  for (const sec of secs) {
    if (intersecting.has(sec.id)) { setActive(sec.id); return; }
  }
};

const pickActiveByScroll = () => {
  const navBottom = getNavOffset();
  let best = null, bestDist = Infinity;
  for (const sec of secs) {
    const rect = sec.getBoundingClientRect();
    if (rect.top <= navBottom + 20) {
      const dist = Math.abs(rect.top - navBottom);
      if (dist < bestDist) { bestDist = dist; best = sec.id; }
    }
  }
  if (best) setActive(best);
};

if ('IntersectionObserver' in window) {
  const navObserver = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) intersecting.add(e.target.id);
      else intersecting.delete(e.target.id);
    });
    pickActive();
  }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });
  secs.forEach(s => navObserver.observe(s));
}
window.addEventListener('scroll', pickActiveByScroll, { passive: true });

/* ─── scroll reveal ──────────────────────────────────────────────── */
let revealObserver = null;

function setupReveal() {
  if (!('IntersectionObserver' in window)) {
    document.querySelectorAll('.reveal, [data-stagger]').forEach(el => el.classList.add('visible'));
    return;
  }

  if (revealObserver) {
    revealObserver.disconnect();
    revealObserver = null;
  }

  const threshold = window.innerWidth < 600 ? 0.15 : 0.08;

  revealObserver = new IntersectionObserver((entries, obs) => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      e.target.classList.add('visible');
      obs.unobserve(e.target);
    });
  }, { threshold });

  document.querySelectorAll('.reveal, [data-stagger]').forEach(el => {
    if (el.classList.contains('visible')) return;
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      el.classList.add('visible');
    } else {
      revealObserver.observe(el);
    }
  });
}

function applyStaggerDelays() {
  document.querySelectorAll('[data-i]').forEach(card => {
    const i = parseInt(card.getAttribute('data-i'), 10) || 0;
    card.style.transitionDelay = `${i * 0.12}s`;
  });
}

applyStaggerDelays();
setTimeout(setupReveal, 0);

/* ─── contact form ───────────────────────────────────────────────── */
const nameInput    = document.getElementById('msg-name');
const bodyInput    = document.getElementById('msg-body');
const sendBtn      = document.getElementById('sendBtn');
const sendFeedback = document.getElementById('sendFeedback');
const charCounter  = document.getElementById('charCounter');
let feedbackTimer  = null;

const syncCharCounter = () => {
  const len = bodyInput.value.length;
  const max = parseInt(bodyInput.getAttribute('maxlength'), 10) || 1000;
  charCounter.textContent = `${len} / ${max}`;
  charCounter.classList.toggle('warn',  len >= max * 0.8 && len < max);
  charCounter.classList.toggle('limit', len >= max);
};

bodyInput.addEventListener('input', () => {
  syncCharCounter();
  bodyInput.classList.remove('field-error');
});

bodyInput.addEventListener('change', syncCharCounter);

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', syncCharCounter);
} else {
  syncCharCounter();
}

let activeCopyBtn = null;

const showFeedback = (msg, isError = false, showCopy = false) => {
  if (activeCopyBtn && activeCopyBtn._resetTimer) {
    clearTimeout(activeCopyBtn._resetTimer);
    activeCopyBtn = null;
  }

  sendFeedback.innerHTML = '';
  const span = document.createElement('span');
  span.textContent = msg;
  sendFeedback.appendChild(span);

  if (showCopy) {
    const btn = document.createElement('button');
    btn.className = 'copy-email-btn';
    btn.textContent = 'Copy address';
    btn.type = 'button';
    activeCopyBtn = btn;
    btn.addEventListener('click', () => {
      clearTimeout(btn._resetTimer);
      navigator.clipboard.writeText('jahidulxtra@gmail.com').then(() => {
        btn.textContent = 'Copied ✓';
        btn._resetTimer = setTimeout(() => {
          btn.textContent = 'Copy address';
          btn._resetTimer = null;
        }, 2000);
      }).catch(() => {
        btn.textContent = 'jahidulxtra@gmail.com';
      });
    });
    sendFeedback.appendChild(btn);
  }

  sendFeedback.classList.toggle('error', isError);
  sendFeedback.classList.add('show');
  if (feedbackTimer) clearTimeout(feedbackTimer);
  feedbackTimer = setTimeout(() => {
    feedbackTimer = null;
    sendFeedback.classList.remove('show', 'error');
  }, 6000);
};

const handleSend = () => {
  const name = nameInput.value.trim().slice(0, 100);
  const body = bodyInput.value.trim().slice(0, 1000);

  if (!body) {
    bodyInput.classList.add('field-error');
    bodyInput.focus();
    showFeedback('Please write something before sending.', true);
    return;
  }

  bodyInput.classList.remove('field-error');
  sendBtn.disabled = true;

  const safeName  = name.replace(/[\r\n]+/g, ' ');
  const subject   = encodeURIComponent('Hey from your site' + (safeName ? ' — ' + safeName : ''));
  const bodyEnc   = encodeURIComponent(body);
  const mailtoURL = `mailto:jahidulxtra@gmail.com?subject=${subject}&body=${bodyEnc}`;

  let appOpened = false;
  let cleanedUp = false;

  const cleanup = () => {
    if (cleanedUp) return;
    cleanedUp = true;
    window.removeEventListener('blur', onBlur);
    document.removeEventListener('visibilitychange', onVisibility);
  };

  const onBlur = () => { appOpened = true; cleanup(); };
  const onVisibility = () => {
    if (document.visibilityState === 'hidden') { appOpened = true; cleanup(); }
  };

  window.addEventListener('blur', onBlur);
  document.addEventListener('visibilitychange', onVisibility);

  window.location.href = mailtoURL;

  setTimeout(() => {
    cleanup();
    sendBtn.disabled = false;
    if (appOpened) {
      showFeedback('✓ Email app opened — go ahead and send!');
    } else {
      showFeedback('⚠ No email app detected. Copy address below:', true, true);
    }
  }, 700);
};

/* Enter in textarea = send; Shift+Enter = newline */
bodyInput.addEventListener('keydown', e => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    handleSend();
  }
});

sendBtn.addEventListener('click', handleSend);
