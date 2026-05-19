/* inert polyfill with MutationObserver for dynamic children */
if (!('inert' in HTMLElement.prototype)) {
  (function () {
    var style = document.createElement('style');
    style.textContent = [
      '[inert]{pointer-events:none!important;cursor:default!important;}',
      '[inert],[inert] *{user-select:none!important;-webkit-user-select:none!important;}',
      '[inert] *{pointer-events:none!important;}'
    ].join('');
    document.head.appendChild(style);

    var FOCUSABLE = 'a,button,input,select,textarea,[tabindex]:not([tabindex="-1"])';

    var applyInert = function (el) {
      el._inertFocusable = [];
      el.querySelectorAll(FOCUSABLE).forEach(function (f) {
        var prev = f.getAttribute('tabindex');
        el._inertFocusable.push({ el: f, prev: prev });
        f.setAttribute('tabindex', '-1');
      });
      if (!el._inertObserver) {
        el._inertObserver = new MutationObserver(function () {
          if (el.hasAttribute('inert')) applyInert(el);
        });
        el._inertObserver.observe(el, { childList: true, subtree: true });
      }
    };

    var removeInert = function (el) {
      if (el._inertObserver) { el._inertObserver.disconnect(); el._inertObserver = null; }
      (el._inertFocusable || []).forEach(function (item) {
        if (item.prev === null) item.el.removeAttribute('tabindex');
        else item.el.setAttribute('tabindex', item.prev);
      });
      el._inertFocusable = [];
    };

    var observer = new MutationObserver(function (mutations) {
      mutations.forEach(function (m) {
        if (m.type !== 'attributes' || m.attributeName !== 'inert') return;
        var el = m.target;
        if (el.hasAttribute('inert')) applyInert(el);
        else removeInert(el);
      });
    });
    observer.observe(document.body, { attributes: true, subtree: true, attributeFilter: ['inert'] });
  })();
}
