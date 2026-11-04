/* NCD Photography Club: scripts shared by every page.
   Each part only runs if the page has the markup it needs.

   HOW PHOTOS APPEAR (organised by event)
   Every folder inside assets/photos is one event ("folder" on the website):
       assets/photos/eid-photo-walk/  ->  a folder card on Home and Photos, with a cover photo
   The easiest way to add photos is the browser page  upload.php  (needs PHP hosting).
   The page finds the events in one of three ways:
     1. photos.php  (hosts with PHP): lists every event folder automatically. Photos of an event are
        only fetched when a visitor opens it, so thousands of photos stay fast.
     2. GitHub Pages: the site asks GitHub for the list of files in your repository, so you only
        drag a folder of photos into assets/photos on github.com. A folder named
        "2026-10-18 Eid Photo Walk" becomes the event "Eid Photo Walk" dated 18 Oct 2026.
     3. assets/js/events-data.js  (other hosts without PHP): you list your event folders there and
        number the photos 1.jpg, 2.jpg, 3.jpg ... inside each folder. See README.txt. */
(function () {
  var FOLDER = 'assets/photos/';
  var EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'];   // used by the numbered method
  var PAGE = 48;                                      // photos shown at a time inside an event
  var HOME_FOLDERS = 6;                               // folders shown on the home page
  var $ = function (id) { return document.getElementById(id); };
  var pad = function (n) { return String(n).padStart(2, '0'); };
  function el(tag, cls, text) { var n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; }
  function plural(n, one, many) { return n + ' ' + (n === 1 ? one : many); }
  function fmtDate(d) {
    if (!d) return '';
    var t = new Date(d + 'T00:00:00');
    return isNaN(t) ? '' : t.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  }
  function tabDate(d) {
    if (!d) return 'Event';
    var t = new Date(d + 'T00:00:00');
    return isNaN(t) ? 'Event' : t.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
  }

  /* ---------- 1. finding the events and photos ---------- */

  // Method 1: ask photos.php for every event folder.
  function fromPhp() {
    return fetch('photos.php', { cache: 'no-store' })
      .then(function (r) { if (!r.ok) throw new Error('no php'); return r.text(); })
      .then(function (t) {
        var d = JSON.parse(t);
        if (!d || !Array.isArray(d.events)) throw new Error('not a list');
        return d.events.filter(function (e) { return e.count > 0; }).map(function (e) { e.php = true; e.photos = null; return e; });
      });
  }
  function fetchJson(url) {
    return fetch(url, { cache: 'no-store' }).then(function (r) { if (!r.ok) throw new Error('bad'); return r.json(); });
  }

  // Method 2 (GitHub Pages): one GitHub API call returns every file path in the repository.
  // The owner and repository are read from the address (owner.github.io/repo). With a custom domain,
  // set window.NCD_GITHUB = { owner:'', repo:'', branch:'' } in assets/js/events-data.js.
  var IMG_RE = /\.(jpe?g|png|webp|gif|avif)$/i;
  function githubTarget() {
    var c = window.NCD_GITHUB;
    if (c && c.owner && c.repo) return { owner: c.owner, repo: c.repo, branch: c.branch || 'HEAD' };
    var m = /^([a-z0-9-]+)\.github\.io$/i.exec(location.hostname);
    if (!m) return null;
    var first = location.pathname.split('/')[1];
    var repo = first && !/\.html?$/i.test(first) ? first : m[1] + '.github.io';
    return { owner: m[1], repo: repo, branch: 'HEAD' };
  }
  function naturalSort(a, b) { return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }); }
  function parseFolder(name) {
    var m = /^(\d{4}-\d{2}-\d{2})[-_ ]+(.+)$/.exec(name), date = '', t = name;
    if (m) { date = m[1]; t = m[2]; }
    t = t.replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim();
    return { date: date, title: t ? t.charAt(0).toUpperCase() + t.slice(1) : name };
  }
  var whyNone = '';   // shown on the page when GitHub could not be read
  function ghWhy(e, g) {
    var where = g.owner + '/' + g.repo, m = String(e && e.message);
    if (/github 404/.test(m)) return 'Could not find the repository "' + where + '" on GitHub. It must be Public, and its name must match the address of this site. With your own domain, fill in assets/js/events-data.js.';
    if (/github (403|429)/.test(m)) return 'GitHub is limiting requests right now. Wait a few minutes and reload.';
    if (/no photos/.test(m)) return 'The repository "' + where + '" was found, but it has no photos in assets/photos/<event folder>/. The folder "assets" must be at the top level of the repository, and each event must be a folder that holds the photos.';
    return 'Could not read the photo list from GitHub (' + m + '). Check your internet connection and reload.';
  }
  function fromGithub() {
    var g = githubTarget();
    if (!g) return Promise.reject(new Error('not github'));
    return fromGithubInner(g).catch(function (e) { e.gh = ghWhy(e, g); throw e; });
  }
  function fromGithubInner(g) {
    var key = 'ncd-gh-' + g.owner + '/' + g.repo, cached = null;
    try { cached = JSON.parse(sessionStorage.getItem(key)); } catch (e) {}
    var tree = cached && Date.now() - cached.t < 120000 ? Promise.resolve(cached.paths)
      : fetch('https://api.github.com/repos/' + g.owner + '/' + g.repo + '/git/trees/' + g.branch + '?recursive=1')
        .then(function (r) { if (!r.ok) throw new Error('github ' + r.status); return r.json(); })
        .then(function (j) {
          var paths = (j.tree || []).filter(function (x) { return x.type === 'blob' && x.path.indexOf(FOLDER) === 0; }).map(function (x) { return x.path.slice(FOLDER.length); });
          try { sessionStorage.setItem(key, JSON.stringify({ t: Date.now(), paths: paths })); } catch (e) {}
          return paths;
        });
    return tree.then(function (paths) {
      var byDir = {};
      paths.forEach(function (p) {
        var parts = p.split('/');
        if (parts.length !== 2 || parts[1].charAt(0) === '.' || !IMG_RE.test(parts[1])) return;   // photos one level deep only
        (byDir[parts[0]] = byDir[parts[0]] || []).push(parts[1]);
      });
      var list = Object.keys(byDir).map(function (dir) {
        var info = parseFolder(dir), files = byDir[dir].sort(naturalSort);
        var photos = files.map(function (f) { return { src: FOLDER + encodeURIComponent(dir) + '/' + encodeURIComponent(f), w: 0, h: 0, time: 0 }; });
        return { slug: dir, title: info.title, date: info.date, count: photos.length, photos: photos, cover: photos[0].src };
      });
      if (!list.length) throw new Error('no photos found');
      list.sort(function (a, b) { return a.date === b.date ? naturalSort(b.slug, a.slug) : (a.date < b.date ? 1 : -1); });
      return list;
    });
  }

  // Method 3 (no PHP, not GitHub): events come from assets/js/events-data.js; photos are numbered 1.jpg, 2.jpg ...
  function tryImage(url) {
    return new Promise(function (resolve) {
      var img = new Image();
      img.onload = function () { resolve({ src: url, w: img.naturalWidth, h: img.naturalHeight }); };
      img.onerror = function () { resolve(null); };
      img.src = url;
    });
  }
  function tryNumber(base, n) {
    return Promise.all(EXTENSIONS.map(function (e) { return tryImage(base + n + '.' + e); }))
      .then(function (r) { return r.filter(Boolean)[0] || null; });
  }
  function fromNumbers(base) {
    var found = [], next = 1, misses = 0, MAX = 1000, BATCH = 8;
    function round() {
      var nums = [];
      for (var k = 0; k < BATCH; k++) nums.push(next + k);
      next += BATCH;
      return Promise.all(nums.map(function (n) { return tryNumber(base, n); })).then(function (results) {
        results.forEach(function (r) {
          if (misses >= 3) return;                 // already past the end
          if (r) { found.push(r); misses = 0; } else { misses++; }
        });
        if (misses >= 3 || next > MAX) return found;
        return round();
      });
    }
    return round();
  }
  function staticEvents() {
    var cfg = Array.isArray(window.NCD_EVENTS) ? window.NCD_EVENTS : [];
    var list = cfg.filter(function (c) { return c && c.folder; }).map(function (c) {
      return { slug: String(c.folder), title: c.title || String(c.folder), date: c.date || '', count: null, photos: null,
        base: FOLDER + encodeURIComponent(c.folder) + '/', cover: FOLDER + encodeURIComponent(c.folder) + '/' + (c.cover || '1.jpg') };
    });
    // nothing listed: show the loose numbered photos in assets/photos as a single folder
    if (!list.length) list = [{ slug: '_club', title: 'Club photos', date: '', count: null, photos: null, base: FOLDER, cover: FOLDER + '1.jpg' }];
    return list;
  }

  var dataPromise = null;
  function getEvents() {
    if (!dataPromise) dataPromise = (/\.github\.io$/i.test(location.hostname) ? Promise.reject(new Error('github')) : fromPhp()).catch(fromGithub).catch(function (e) {
        if (e && e.gh && !(Array.isArray(window.NCD_EVENTS) && window.NCD_EVENTS.length)) { whyNone = e.gh; return []; }
        return staticEvents();
      });
    return dataPromise;
  }
  // makes sure ev.photos is filled in (static mode loads them on demand)
  function loadPhotos(ev) {
    if (ev.photos) return Promise.resolve(ev.photos);
    if (ev.php) return fetchJson('photos.php?event=' + encodeURIComponent(ev.slug)).then(function (d) { ev.photos = d.photos || []; ev.count = ev.photos.length; return ev.photos; });
    return fromNumbers(ev.base).then(function (list) { ev.photos = list; ev.count = list.length; return list; });
  }
  // newest photos across every event, for the home slideshow
  function latestPhotos(events, n) {
    if (!events.length) return Promise.resolve([]);
    if (events[0].php) return fetchJson('photos.php?latest=' + n).then(function (d) { return d.photos || []; }).catch(function () { return []; });
    if (events[0].photos) {   // GitHub mode: every event's photos are already known, newest event first
      var out = [];
      events.forEach(function (ev) { ev.photos.slice().reverse().forEach(function (p) { if (out.length < n) out.push(p); }); });
      return Promise.resolve(out);
    }
    return loadPhotos(events[0]).then(function (l) { return l.slice().reverse().slice(0, n); });
  }

  function makeImg(p, alt, lazy, useThumb) {
    var img = document.createElement('img');
    img.src = useThumb && p.thumb ? p.thumb : p.src;
    img.alt = alt;
    if (p.w && p.h) { img.width = p.w; img.height = p.h; }   // reserves space, so the page does not jump
    img.decoding = 'async';
    if (lazy) img.loading = 'lazy';
    return img;
  }

  /* ---------- 2. mobile menu ---------- */
  var menuBtn = $('menuBtn'), nav = $('nav');
  if (menuBtn && nav) {
    menuBtn.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  /* ---------- 3. copy buttons ---------- */
  document.addEventListener('click', function (e) {
    var b = e.target.closest('.copy'); if (!b || !b.dataset.target) return;
    var el = document.querySelector(b.dataset.target), note = b.parentNode.querySelector('.copied');
    if (!el || !note) return;
    var text = el.value !== undefined ? el.value : el.textContent;
    function selectIt() {
      if (el.select) { el.select(); }
      else { var r = document.createRange(); r.selectNodeContents(el); var s = window.getSelection(); s.removeAllRanges(); s.addRange(r); }
      note.textContent = 'Selected, press copy';
    }
    try { navigator.clipboard.writeText(text).then(function () { note.textContent = 'Copied'; }, selectIt); } catch (err) { selectIt(); }
    setTimeout(function () { note.textContent = ''; }, 2600);
  });

  /* ---------- 4. big photo viewer (shared by Home and Photos) ---------- */
  var lb = $('lb'), Viewer = null;
  if (lb) {
    var lbImg = $('lbImg'), lbClose = $('lbClose'), lbPrev = $('lbPrev'), lbNext = $('lbNext'), lbCount = $('lbCount'), lbTitle = $('lbTitle');
    var vList = [], vIndex = 0, vTitle = '', vOpener = null;
    var preload = function (i) { if (vList[i]) { var im = new Image(); im.src = vList[i].src; } };
    var render = function () {
      lbImg.src = vList[vIndex].src; lbImg.alt = vTitle + ', photo ' + (vIndex + 1) + ' of ' + vList.length;
      lbCount.textContent = (vIndex + 1) + ' / ' + vList.length;
      if (lbTitle) lbTitle.textContent = vTitle;
      lbPrev.hidden = lbNext.hidden = vList.length < 2;
      preload(vIndex + 1); preload(vIndex - 1);
    };
    var vClose = function () { lb.hidden = true; lbImg.removeAttribute('src'); document.documentElement.style.overflow = ''; if (vOpener && document.contains(vOpener)) vOpener.focus(); };
    var vStep = function (d) { vIndex = (vIndex + d + vList.length) % vList.length; render(); };
    Viewer = {
      open: function (list, i, title, opener) {
        vList = list; vIndex = i; vTitle = title; vOpener = opener; render();
        lb.hidden = false; document.documentElement.style.overflow = 'hidden'; lbClose.focus();
      }
    };
    lbClose.addEventListener('click', vClose);
    lbPrev.addEventListener('click', function () { vStep(-1); });
    lbNext.addEventListener('click', function () { vStep(1); });
    lb.addEventListener('click', function (e) { if (e.target === lb) vClose(); });
    var tx = null;
    lb.addEventListener('touchstart', function (e) { tx = e.touches.length === 1 ? e.touches[0].clientX : null; }, { passive: true });
    lb.addEventListener('touchend', function (e) {
      if (tx === null || vList.length < 2) return;
      var dx = e.changedTouches[0].clientX - tx; tx = null;
      if (Math.abs(dx) > 50) vStep(dx < 0 ? 1 : -1);
    });
    document.addEventListener('keydown', function (e) {
      if (lb.hidden) return;
      if (e.key === 'Escape') vClose();
      else if (e.key === 'ArrowLeft' && vList.length > 1) vStep(-1);
      else if (e.key === 'ArrowRight' && vList.length > 1) vStep(1);
      else if (e.key === 'Tab') {
        var f = [lbClose, lbPrev, lbNext].filter(function (b) { return !b.hidden; }), i = f.indexOf(document.activeElement);
        e.preventDefault(); f[(i + (e.shiftKey ? -1 : 1) + f.length) % f.length].focus();
      }
    });
  }

  /* ---------- 5. event folders: one component, used on Home and on Photos ---------- */
  function mountAlbums(root, limit, hooks) {
    var events = [], listBox = el('div', 'folders'), view = el('div', 'evview'), openSlug = null, lastOpener = null;
    view.hidden = true;
    root.appendChild(listBox); root.appendChild(view);

    function slugFromHash() {
      var m = /(?:^#|&)e=([^&]*)/.exec(location.hash);
      if (!m) return null;
      try { return decodeURIComponent(m[1]); } catch (e) { return null; }
    }
    function find(slug) { for (var i = 0; i < events.length; i++) if (events[i].slug === slug) return events[i]; return null; }

    function drawFolders() {
      listBox.innerHTML = '';
      var shown = limit ? events.slice(0, limit) : events;
      shown.forEach(function (ev) {
        var a = el('a', 'folder'); a.href = '#e=' + encodeURIComponent(ev.slug); a.dataset.slug = ev.slug;
        var count = ev.count != null ? plural(ev.count, 'photo', 'photos') : 'Open folder';
        a.setAttribute('aria-label', ev.title + ', ' + count);
        var tab = el('span', 'folder-tab', tabDate(ev.date));
        var body = el('span', 'folder-body'), card = el('span', 'folder-cover');
        var img = document.createElement('img'); img.src = ev.cover; img.alt = ''; img.loading = 'lazy'; img.decoding = 'async';
        card.appendChild(img);
        var lab = el('span', 'folder-label'); lab.appendChild(el('span', 'folder-name', ev.title)); lab.appendChild(el('span', 'folder-count', count));
        body.appendChild(card); body.appendChild(lab);
        a.appendChild(tab); a.appendChild(body);
        a.addEventListener('click', function (e) {
          if (e.metaKey || e.ctrlKey || e.shiftKey || e.button) return;
          e.preventDefault(); lastOpener = a;
          if (location.hash === a.getAttribute('href')) route(); else location.hash = a.getAttribute('href');
        });
        listBox.appendChild(a);
      });
      if (hooks.onList) hooks.onList(events, shown.length);
    }

    function openEvent(ev) {
      openSlug = ev.slug; listBox.hidden = true; view.hidden = false; view.innerHTML = '';
      var back = el('button', 'back-btn', '← All events'); back.type = 'button';
      back.addEventListener('click', function () { history.length > 1 && /e=/.test(location.hash) ? history.back() : (location.hash = ''); setTimeout(function () { if (slugFromHash()) { history.replaceState(null, '', location.pathname + location.search); route(); } }, 60); });
      var head = el('div', 'evv-head'), h = el('h3', null, ev.title), meta = el('p', 'count', '');
      head.appendChild(h); head.appendChild(meta);
      var gal = el('div', 'gallery'); gal.setAttribute('aria-busy', 'true');
      var more = el('button', 'btn btn-ghost more-btn', 'Show more photos'); more.type = 'button'; more.hidden = true;
      view.appendChild(back); view.appendChild(head); view.appendChild(gal); view.appendChild(more);
      if (hooks.onOpen) hooks.onOpen(ev);

      loadPhotos(ev).then(function (list) {
        if (openSlug !== ev.slug) return;
        gal.setAttribute('aria-busy', 'false');
        meta.textContent = plural(list.length, 'photo', 'photos') + (ev.date ? ' · ' + fmtDate(ev.date) : '');
        if (!list.length) { gal.appendChild(el('p', 'empty', 'No photos in this folder yet.')); return; }
        var shown = 0;
        function draw() {
          list.slice(shown, shown + PAGE).forEach(function (p, k) {
            var i = shown + k, b = el('button', 'gal-item'); b.type = 'button';
            b.setAttribute('aria-label', 'View photo ' + (i + 1) + ' of ' + list.length + ' larger');
            b.appendChild(makeImg(p, ev.title + ', photo ' + (i + 1), true, true));
            b.addEventListener('click', function () { if (Viewer) Viewer.open(list, i, ev.title, b); });
            gal.appendChild(b);
          });
          shown = Math.min(list.length, shown + PAGE);
          more.hidden = shown >= list.length;
          more.textContent = 'Show more photos (' + (list.length - shown) + ' left)';
        }
        more.addEventListener('click', draw);
        draw();
      });
      root.scrollIntoView({ block: 'start' });
      back.focus({ preventScroll: true });
    }

    function showList() {
      var wasOpen = openSlug; openSlug = null; view.hidden = true; view.innerHTML = ''; listBox.hidden = false;
      if (hooks.onClose) hooks.onClose();
      if (wasOpen) {
        var f = listBox.querySelector('.folder[data-slug="' + (window.CSS && CSS.escape ? CSS.escape(wasOpen) : wasOpen) + '"]');
        root.scrollIntoView({ block: 'start' });
        if (f) f.focus({ preventScroll: true });
      }
    }

    function route() {
      var slug = slugFromHash(), ev = slug ? find(slug) : null;
      if (ev) { if (openSlug !== ev.slug) openEvent(ev); } else showList();
    }

    getEvents().then(function (list) {
      events = list;
      root.setAttribute('aria-busy', 'false');
      if (!events.length) { listBox.appendChild(el('p', 'empty', 'No photos yet. Check back soon.')); if (whyNone) listBox.appendChild(el('p', 'empty', whyNone)); if (hooks.onList) hooks.onList(events, 0); return; }
      drawFolders();
      if (slugFromHash()) route();
      window.addEventListener('hashchange', route);
    });
  }

  /* ---------- 6. home page: viewfinder slideshow (latest 6 photos) ---------- */
  var slidesBox = $('vfSlides');
  if (slidesBox) {
    getEvents().then(function (events) { return latestPhotos(events, 6); }).then(function (pics) {
      var ctl = $('vfCtl'), pauseBtn = $('vfPause'), focus = $('vfFocus');
      var meter = $('vfMeter'), mark = $('vfMark');
      for (var t = 0; t <= 12; t++) { var tk = document.createElement('i'); if (t % 3 === 0) tk.className = 'major'; meter.insertBefore(tk, mark); }
      if (!pics.length) {
        slidesBox.innerHTML = '<p class="vf-empty">Photos will appear here soon.</p>';
        ctl.hidden = true; $('vfCount').textContent = '00/00'; $('vfCap').textContent = 'No photos yet';
        return;
      }
      var els = [], dots = [], cur = 0, timer = null;
      var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches, paused = reduce;
      function show(i) {
        cur = i;
        els.forEach(function (el, j) { el.classList.toggle('on', j === i); });
        dots.forEach(function (d, j) { if (j === i) d.setAttribute('aria-current', 'true'); else d.removeAttribute('aria-current'); });
        $('vfCount').textContent = pad(i + 1) + '/' + pad(pics.length);
        $('vfCap').textContent = 'Frame ' + pad(i + 1) + ' of ' + pad(pics.length);
        mark.style.left = (20 + (i * 17) % 61) + '%';
        focus.classList.remove('lock'); void focus.offsetWidth; focus.classList.add('lock');
      }
      function play() { if (!timer && pics.length > 1) timer = setInterval(function () { show((cur + 1) % pics.length); }, 4800); }
      function stop() { clearInterval(timer); timer = null; }
      pics.forEach(function (p, i) {
        var img = makeImg(p, 'Photo ' + (i + 1) + ' from the club', i > 0, false); img.className = 'slide'; img.removeAttribute('width'); img.removeAttribute('height');
        slidesBox.appendChild(img); els.push(img);
        var d = document.createElement('button'); d.type = 'button'; d.className = 'dot'; d.setAttribute('aria-label', 'Show photo ' + (i + 1) + ' of ' + pics.length);
        d.addEventListener('click', function () { show(i); if (!paused) { stop(); play(); } });
        ctl.insertBefore(d, pauseBtn); dots.push(d);
      });
      if (pics.length < 2) { ctl.hidden = true; }
      pauseBtn.textContent = paused ? 'Play' : 'Pause';
      pauseBtn.addEventListener('click', function () { paused = !paused; pauseBtn.textContent = paused ? 'Play' : 'Pause'; if (paused) stop(); else play(); });
      show(0); if (!paused) play();
    });
  }

  /* ---------- 7. home page: "Our work" event folders (newest 6) ---------- */
  var work = $('workGrid');
  if (work) {
    var seeAll = $('seeAll'), workHead = $('workHead');
    mountAlbums(work, HOME_FOLDERS, {
      onList: function (events, shown) {
        if (workHead) workHead.hidden = false;
        if (seeAll) seeAll.hidden = events.length <= shown;
      },
      onOpen: function () { if (seeAll) seeAll.hidden = true; },
      onClose: function () { if (seeAll) seeAll.hidden = false; }
    });
  }

  /* ---------- 8. photos page: every event folder ---------- */
  var gallery = $('gallery');
  if (gallery) {
    var galCount = $('galCount'), pageIntro = $('pageIntro'), baseTitle = document.title, introText = pageIntro ? pageIntro.textContent : '';
    mountAlbums(gallery, 0, {
      onList: function (events) {
        document.title = baseTitle;
        var total = events.reduce(function (n, e) { return n + (e.count || 0); }, 0);
        galCount.textContent = events.length ? plural(events.length, 'event', 'events') + (total ? ' · ' + plural(total, 'photo', 'photos') : '') : '';
        if (pageIntro) pageIntro.textContent = introText;
      },
      onOpen: function (ev) {
        galCount.textContent = '';
        document.title = ev.title + ' | NCD Photography Club';
        if (pageIntro) pageIntro.textContent = 'Tap a photo to see it larger.';
      },
      onClose: function () { document.title = baseTitle; }
    });
  }

  /* ---------- 9. join page: write the application message ---------- */
  var form = $('joinForm');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var v = function (n) { return form.elements[n].value.trim(); };
      if (!v('name') || !v('contact')) { (!v('name') ? form.elements.name : form.elements.contact).focus(); return; }
      var msg = 'Hi NCD Photography Club,\n\nMy name is ' + v('name') + '. You can reach me at ' + v('contact') + '.\nI shoot with: ' + v('gear').toLowerCase() + '. Experience: ' + v('level').toLowerCase() + '.\n' + (v('like') ? 'I like shooting: ' + v('like') + '.\n' : '') + (v('more') ? '\n' + v('more') + '\n' : '') + '\nI would like to join the club.\n\nThanks,\n' + v('name');
      var out = $('out'); $('joinOut').value = msg; out.hidden = false; out.scrollIntoView({ block: 'nearest' });
    });
  }
})();
