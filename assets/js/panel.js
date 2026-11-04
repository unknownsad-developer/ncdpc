/* Builds the Panel page from window.PANEL_DATA (see assets/js/panel-data.js). */
(function () {
  var grid = document.getElementById('panelGrid');
  var D = window.PANEL_DATA;
  if (!grid || !D) return;

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text) n.textContent = text;
    return n;
  }
  function initials(name) {
    var p = String(name || '?').trim().split(/\s+/).slice(0, 2);
    return p.map(function (w) { return w.charAt(0).toUpperCase(); }).join('') || '?';
  }

  function set(id, text) { var n = document.getElementById(id); if (n) { if (text) n.textContent = text; else n.hidden = true; } }
  set('panelEyebrow', D.eyebrow);
  set('panelTitle', D.title);
  set('panelIntro', D.intro);

  function card(p) {
    var a = el('article', 'person');
    var ph = el('div', 'person-ph');
    function fallback() { ph.textContent = ''; ph.classList.add('noimg'); ph.appendChild(el('span', '', initials(p.name))); }
    if (p.photo) {
      var img = new Image();
      img.alt = 'Photo of ' + (p.name || 'member');
      img.loading = 'lazy';
      img.onerror = fallback;
      img.src = 'assets/panel/' + encodeURI(p.photo);
      ph.appendChild(img);
    } else { fallback(); }
    a.appendChild(ph);
    if (p.name) a.appendChild(el('h3', 'person-name', p.name));
    if (p.position) a.appendChild(el('p', 'person-pos', p.position));
    if (p.speech) a.appendChild(el('blockquote', 'person-speech', p.speech));
    return a;
  }

  var people = D.people || [];
  if (!people.length) { grid.appendChild(el('p', 'empty', 'No one has been added yet.')); return; }

  var groups = D.groups || {};
  var order = [], seen = {};
  people.forEach(function (p) { var g = p.group || ''; if (!seen[g]) { seen[g] = 1; order.push(g); } });

  order.forEach(function (g) {
    var section = el('div', 'panel-group');
    if (g && groups[g]) section.appendChild(el('h2', 'panel-h', groups[g]));
    var row = el('div', 'panel-cards');
    people.forEach(function (p) { if ((p.group || '') === g) row.appendChild(card(p)); });
    section.appendChild(row);
    grid.appendChild(section);
  });
})();
