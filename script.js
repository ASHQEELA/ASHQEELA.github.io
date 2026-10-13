/* Runs first, before the page paints, so a saved theme shows with no flash. */
try {
  var saved = localStorage.getItem('palette');
  if (saved && /^(cream|midnight|forest|ocean|rose)$/.test(saved)) {
    document.documentElement.setAttribute('data-palette', saved);
  }
} catch (e) {}

/* Everything else waits for the page to load. */
document.addEventListener('DOMContentLoaded', function () {
  /* Copy buttons for email and phone */
  (function(){
    var buttons = document.querySelectorAll('button[data-target]');
    buttons.forEach(function(btn){
      btn.addEventListener('click', function(){
        var el = document.getElementById(btn.getAttribute('data-target'));
        var text = el.textContent.trim();
        function select(){
          var r = document.createRange(); r.selectNodeContents(el);
          var s = window.getSelection(); s.removeAllRanges(); s.addRange(r);
          btn.textContent = 'Selected';
          setTimeout(function(){ btn.textContent = 'Copy'; }, 1600);
        }
        try {
          navigator.clipboard.writeText(text).then(function(){
            btn.textContent = 'Copied';
            setTimeout(function(){ btn.textContent = 'Copy'; }, 1600);
          }, select);
        } catch (e) { select(); }
      });
    });
  })();

  /* Project filter and show-all button */
  (function(){
    var btns = document.querySelectorAll('.filters button');
    var cards = document.querySelectorAll('.proj[data-cat]');
    var more = document.getElementById('more-projects');
    var filter = 'all';
    var expanded = false;
    function render(){
      cards.forEach(function(c){
        var list = c.getAttribute('data-cat').split(' ');
        var match = filter === 'all' || list.indexOf(filter) > -1;
        var featured = c.getAttribute('data-featured') === '1';
        var show = match && (filter !== 'all' || expanded || featured);
        var wasShown = !c.hidden;
        c.hidden = !show;
        if (show && !wasShown && c.dataset.ready === '1') {
          c.classList.remove('pop'); void c.offsetWidth; c.classList.add('pop');
        }
        c.dataset.ready = '1';
      });
      more.hidden = filter !== 'all';
      more.textContent = expanded ? 'Show fewer projects' : 'Show all ' + cards.length + ' projects';
      more.setAttribute('aria-expanded', expanded ? 'true' : 'false');
    }
    btns.forEach(function(b){
      b.addEventListener('click', function(){
        filter = b.getAttribute('data-filter');
        btns.forEach(function(x){ x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
        render();
      });
    });
    more.addEventListener('click', function(){ expanded = !expanded; render(); });
    render();
  })();

  /* Theme switcher */
  (function(){
    var root = document.documentElement;
    var wrap = document.getElementById('theme-wrap');
    var btn = document.getElementById('theme-btn');
    var menu = document.getElementById('theme-menu');
    var opts = Array.prototype.slice.call(menu.querySelectorAll('button[data-palette]'));
    var names = {cream:'Cream', midnight:'Midnight', forest:'Forest', ocean:'Ocean', rose:'Rose', auto:'Match device'};
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var timer;

    function current(){ return root.getAttribute('data-palette') || 'auto'; }

    function mark(){
      var c = current();
      opts.forEach(function(o){ o.setAttribute('aria-pressed', o.getAttribute('data-palette') === c ? 'true' : 'false'); });
      btn.setAttribute('aria-label', 'Theme: ' + names[c] + '. Change theme');
      var m = document.querySelector('meta[name="theme-color"]');
      if (m) m.setAttribute('content', getComputedStyle(document.body).backgroundColor);
    }

    function setPalette(p){
      if (!reduce) {
        root.classList.add('themed');
        clearTimeout(timer);
        timer = setTimeout(function(){ root.classList.remove('themed'); }, 800);
      }
      if (p === 'auto') root.removeAttribute('data-palette'); else root.setAttribute('data-palette', p);
      try { if (p === 'auto') localStorage.removeItem('palette'); else localStorage.setItem('palette', p); } catch (e) {}
      mark();
      setTimeout(mark, 850);
    }

    function setOpen(open){
      menu.hidden = !open;
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (open) {
        var first = menu.querySelector('[aria-pressed="true"]') || opts[0];
        first.focus();
      }
    }

    btn.addEventListener('click', function(){ setOpen(menu.hidden); });
    opts.forEach(function(o){ o.addEventListener('click', function(){ setPalette(o.getAttribute('data-palette')); }); });
    document.addEventListener('click', function(e){ if (!wrap.contains(e.target)) setOpen(false); });
    document.addEventListener('keydown', function(e){
      if (e.key === 'Escape' && !menu.hidden) { setOpen(false); btn.focus(); return; }
      if (menu.hidden || (e.key !== 'ArrowDown' && e.key !== 'ArrowUp')) return;
      var i = opts.indexOf(document.activeElement);
      if (i < 0) return;
      e.preventDefault();
      var n = e.key === 'ArrowDown' ? (i + 1) % opts.length : (i - 1 + opts.length) % opts.length;
      opts[n].focus();
    });
    mark();
  })();

  /* Typewriter line */
  (function(){
    var el = document.getElementById('typed');
    if (!el) return;
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var words = [
      'graph neural networks',
      'Bengali language models',
      'post-quantum signing tools',
      'full-stack healthcare apps',
      'blockchain verification',
      'GPU failure detectors'
    ];
    var typer = el.closest('.typer');
    function lock(){
      var keep = el.textContent;
      typer.style.minHeight = '0px';
      var max = 0;
      words.forEach(function(x){
        el.textContent = x;
        max = Math.max(max, typer.getBoundingClientRect().height);
      });
      el.textContent = keep;
      typer.style.minHeight = max + 'px';
    }
    lock();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(lock);
    window.addEventListener('resize', lock);
    var w = 0, i = words[0].length, erasing = true;
    function tick(){
      var word = words[w];
      i += erasing ? -1 : 1;
      el.textContent = word.slice(0, i);
      var delay = erasing ? 30 : 60;
      if (!erasing && i === word.length) { erasing = true; delay = 1700; }
      else if (erasing && i === 0) { erasing = false; w = (w + 1) % words.length; delay = 350; }
      setTimeout(tick, delay);
    }
    setTimeout(tick, 2000);
  })();

  /* Certificate preview toggle */
  (function(){
    var b = document.getElementById('cert-toggle');
    var w = document.getElementById('cert-wrap');
    if (!b || !w) return;
    b.addEventListener('click', function(){
      var open = w.hidden;
      w.hidden = !open;
      b.setAttribute('aria-expanded', open ? 'true' : 'false');
      b.textContent = open ? 'Hide certificate' : 'View certificate';
    });
  })();

  /* Certificate preview toggle */
  (function(){
    var b = document.getElementById('aws-toggle');
    var w = document.getElementById('aws-wrap');
    if (!b || !w) return;
    b.addEventListener('click', function(){
      var open = w.hidden;
      w.hidden = !open;
      b.setAttribute('aria-expanded', open ? 'true' : 'false');
      b.textContent = open ? 'Hide certificate' : 'View certificate';
    });
  })();

  /* Certificate preview toggle */
  (function(){
    var b = document.getElementById('toph-toggle');
    var w = document.getElementById('toph-wrap');
    if (!b || !w) return;
    b.addEventListener('click', function(){
      var open = w.hidden;
      w.hidden = !open;
      b.setAttribute('aria-expanded', open ? 'true' : 'false');
      b.textContent = open ? 'Hide certificate' : 'View certificate';
    });
  })();
});
