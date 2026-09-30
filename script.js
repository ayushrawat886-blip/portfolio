(function () {
    var stage = document.getElementById('stage'), floor = document.getElementById('floor'), count = document.getElementById('count'),
        cards = [].slice.call(document.querySelectorAll('.card')), n = cards.length,
        reduce = matchMedia('(prefers-reduced-motion: reduce)').matches,
        pos = 0, target = 0, raf = 0, startX = 0, startT = 0, dragging = false, moved = 0;
    function gap() { return cards[0].offsetWidth * 1.04 }
    function clamp(v, a, b) { return Math.max(a, Math.min(b, v)) }
    function layout() {
        var g = gap();
        cards.forEach(function (c, i) {
            var d = i - pos, a = Math.abs(d);
            c.style.transform = 'translate(-50%,-50%) translateX(' + d * g + 'px) translateZ(' + (-a * 200) + 'px) rotateY(' + clamp(-d * 30, -62, 62) + 'deg)';
            c.style.opacity = Math.max(0, 1 - a * .3);
            c.style.zIndex = 100 - Math.round(a * 10);
            c.style.pointerEvents = a < 2.5 ? 'auto' : 'none';
        });
        floor.style.setProperty('--x', (-pos * g * .5) + 'px');
        count.textContent = (clamp(Math.round(pos), 0, n - 1) + 1) + ' / ' + n;
    }
    function tick() {
        var diff = target - pos;
        pos = Math.abs(diff) < .001 ? target : pos + diff * .11;
        layout();
        raf = (pos !== target) ? requestAnimationFrame(tick) : 0;
    }
    function go(t) { target = clamp(t, -.35, n - 1 + .35); if (reduce) { pos = target; layout(); return } if (!raf) raf = requestAnimationFrame(tick) }
    function snap(t) { go(clamp(Math.round(t), 0, n - 1)) }
    stage.addEventListener('pointerdown', function (e) { dragging = true; moved = 0; startX = e.clientX; startT = target; stage.classList.add('drag') });
    window.addEventListener('pointermove', function (e) {
        if (!dragging) return; var dx = e.clientX - startX; moved = Math.max(moved, Math.abs(dx));
        if (moved > 4) go(startT - dx / gap() * 1.2);
    });
    window.addEventListener('pointerup', function () { if (!dragging) return; dragging = false; stage.classList.remove('drag'); snap(target) });
    stage.addEventListener('click', function (e) { if (moved > 6) e.preventDefault() }, true);
    var wheelT;
    stage.addEventListener('wheel', function (e) {
        var d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
        if (e.deltaMode === 1) d *= 32;
        var atStart = target <= 0.05 && d < 0, atEnd = target >= n - 1 - 0.05 && d > 0;
        if (atStart || atEnd) return;
        e.preventDefault();
        go(target + d / gap() * .9);
        clearTimeout(wheelT); wheelT = setTimeout(function () { snap(target) }, 110);
    }, { passive: false });
    stage.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowRight') { e.preventDefault(); snap(Math.round(target) + 1) }
        if (e.key === 'ArrowLeft') { e.preventDefault(); snap(Math.round(target) - 1) }
    });
    document.getElementById('next').onclick = function () { snap(Math.round(target) + 1) };
    document.getElementById('prev').onclick = function () { snap(Math.round(target) - 1) };
    cards.forEach(function (c, i) {
        var h = c.getAttribute('data-href');
        c.style.cursor = h && h !== '#' ? 'pointer' : '';
        c.addEventListener('click', function (e) {
            if (moved >= 6 || e.target.closest('.go')) return;
            e.preventDefault();
            if (i !== Math.round(target)) snap(i);
            else if (h && h !== '#') window.open(h, '_blank', 'noopener');
        });
        var a = c.querySelector('.go');
        if (a && a.getAttribute('href') === '#') a.addEventListener('click', function (e) { e.preventDefault() });
    });
    addEventListener('resize', layout);
    var home = document.getElementById('home'), more = document.getElementById('more'), wasMore = false;
    function route() {
        var m = location.hash.indexOf('#/more') === 0;
        home.hidden = m; more.hidden = !m;
        if (m) { scrollTo(0, 0); more.classList.remove('in'); void more.offsetWidth; more.classList.add('in') }
        else {
            dispatchEvent(new Event('resize'));
            var t = location.hash.length > 1 && document.querySelector(location.hash);
            if (t) t.scrollIntoView(); else if (wasMore) scrollTo(0, 0);
        }
        wasMore = m;
    }
    addEventListener('hashchange', route);
    var hero = document.getElementById('top'), hbg = hero.querySelector('.hero-bg'), hin = hero.querySelector('.hero-inner'), say = document.getElementById('say'), sp = document.getElementById('say-p'), busy = false;
    sp.innerHTML = sp.textContent.trim().split(/\s+/).map(function (w) { return '<span class="w">' + w + '</span>' }).join(' ');
    var words = [].slice.call(sp.querySelectorAll('.w'));
    function onScroll() {
        if (home.hidden) return;
        var vh = innerHeight, p = clamp(scrollY / vh, 0, 1);
        if (!reduce) {
            hin.style.transform = 'translateY(' + (-p * 14) + 'vh) scale(' + (1 - p * .1) + ')'; hin.style.opacity = 1 - p * .95;
            hbg.style.transform = 'scale(' + (1 + p * .12) + ')'; hbg.style.opacity = 1 - p * .55;
        }
        var r = say.getBoundingClientRect(), q = clamp((vh * .8 - r.top) / (r.height + vh * .05), 0, 1), k = reduce ? words.length : Math.round(q * words.length * 1.08);
        words.forEach(function (w, i) { w.classList.toggle('on', i < k) });
    }
    addEventListener('scroll', function () { if (!busy) { busy = true; requestAnimationFrame(function () { busy = false; onScroll() }) } }, { passive: true });
    pos = -1.2; layout(); snap(0); route(); onScroll();
})();