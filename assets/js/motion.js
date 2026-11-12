/* NCD Photography Club: motion. Scroll reveals, header shadow, reading progress and floating light.
   Does nothing for visitors who prefer reduced motion. Safe to delete (also delete motion.css and the two lines in each page). */
(function () {
  if (!window.matchMedia || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var root = document.documentElement;
  root.classList.add('mo');

  // floating light + progress line
  var orbs = document.createElement('div'); orbs.className = 'mo-orbs'; orbs.setAttribute('aria-hidden', 'true');
  orbs.innerHTML = '<i></i><i></i>'; document.body.appendChild(orbs);
  var bar = document.createElement('div'); bar.className = 'mo-progress'; bar.setAttribute('aria-hidden', 'true'); document.body.appendChild(bar);
  var header = document.querySelector('.site'), ticking = false;
  function onScroll() {
    if (ticking) return; ticking = true;
    requestAnimationFrame(function () {
      var y = window.pageYOffset, max = document.documentElement.scrollHeight - innerHeight;
      bar.style.transform = 'scaleX(' + (max > 0 ? Math.min(1, y / max) : 0) + ')';
      if (header) header.classList.toggle('scrolled', y > 8);
      ticking = false;
    });
  }
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  // reveal on scroll
  var SEL = '.sec .eyebrow,.sec h2,.sec .lead,.sec .more,.folder,.qa details,.card,.apply-card,.person,.rules>div,.plan,.steps li,footer .wrap>*,.gal-item,.panel-sec h2,.panel-sec p';
  var seen = new WeakSet(), batch = [], timer = null;
  var io = 'IntersectionObserver' in window ? new IntersectionObserver(function (entries) {
    entries.forEach(function (e) { if (e.isIntersecting) { io.unobserve(e.target); queue(e.target); } });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 }) : null;
  function queue(n) { batch.push(n); if (!timer) timer = setTimeout(flush, 30); }
  function flush() {
    timer = null; var list = batch; batch = [];
    list.forEach(function (n, i) {
      n.style.setProperty('--d', Math.min(i, 8) * 80 + 'ms'); n.classList.add('in');
      setTimeout(function () { n.classList.add('done'); n.style.removeProperty('--d'); }, 1200);
    });
  }
  function tag(scope) {
    (scope.querySelectorAll ? scope.querySelectorAll(SEL) : []).forEach(function (n) {
      if (seen.has(n) || n.closest('.lb,.hero,.pagehead')) return;
      seen.add(n); n.classList.add('rv');
      if (io) io.observe(n); else n.classList.add('in');
    });
  }
  tag(document);
  // photos and people are drawn by other scripts a moment later, so watch for them
  new MutationObserver(function (m) { m.forEach(function (r) { r.addedNodes.forEach(function (n) { if (n.nodeType === 1) { tag(n); if (n.matches && n.matches(SEL)) tag({ querySelectorAll: function () { return [n]; } }); } }); }); })
    .observe(document.body, { childList: true, subtree: true });
})();
