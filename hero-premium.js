'use strict';
(function () {

  /* ── 1. Scroll progress bar ─────────────────────────────── */
  var bar = document.createElement('div');
  bar.className = 'scroll-progress-bar';
  document.body.prepend(bar);
  window.addEventListener('scroll', function () {
    var pct = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight);
    bar.style.width = Math.min(pct * 100, 100) + '%';
  }, { passive: true });

  /* ── 2. Navbar scrolled glow ────────────────────────────── */
  var navPill = document.querySelector('.navbar-pill');
  var onNavScroll = function () {
    if (navPill) navPill.classList.toggle('scrolled', window.scrollY > 40);
  };
  window.addEventListener('scroll', onNavScroll, { passive: true });

  /* ── 3. Scroll indicator — hide on first scroll ─────────── */
  var scrollIndicator = document.querySelector('.hero-scroll-indicator');
  if (scrollIndicator) {
    window.addEventListener('scroll', function hideIndicator() {
      scrollIndicator.classList.add('hidden');
      window.removeEventListener('scroll', hideIndicator);
    }, { passive: true, once: true });
  }

  /* ── 4. Word-by-word headline reveal ────────────────────── */

  function initWordReveal() {
    var headline = document.querySelector('.hero-headline');
    if (!headline || headline.dataset.wordified) return;
    headline.dataset.wordified = '1';

    var nodes = Array.from(headline.childNodes);
    headline.innerHTML = '';

    nodes.forEach(function (node) {
      if (node.nodeType === 3) {
        // Plain text node — split into words
        var parts = node.textContent.split(/(\s+)/);
        parts.forEach(function (w) {
          if (!w.trim()) {
            headline.appendChild(document.createTextNode(w));
          } else {
            var mask  = document.createElement('span');
            mask.className = 'hero-word-mask';
            var inner = document.createElement('span');
            inner.className = 'hero-word-inner';
            inner.textContent = w;
            mask.appendChild(inner);
            headline.appendChild(mask);
          }
        });
      } else if (node.nodeType === 1 && node.classList.contains('highlight-phrase')) {
        // Wrap the entire highlight phrase as one unit
        var mask  = document.createElement('span');
        mask.className = 'hero-word-mask';
        var inner = document.createElement('span');
        inner.className = 'hero-word-inner';
        inner.appendChild(node.cloneNode(true));
        mask.appendChild(inner);
        headline.appendChild(mask);
      }
    });
  }

  function revealWords(delayOffset) {
    var inners = document.querySelectorAll('.hero-word-inner');
    inners.forEach(function (el, i) {
      setTimeout(function () {
        el.classList.add('word-visible');
        if (i === inners.length - 1) {
          setTimeout(function () {
            var hp = document.querySelector('.highlight-phrase');
            if (hp) hp.classList.add('underline-visible');
            inners.forEach(function (e) { e.style.willChange = 'auto'; });
          }, 750);
        }
      }, delayOffset + i * 70);
    });
  }

  // Watch for renderHero() populating the headline
  var headlineEl = document.querySelector('.hero-headline');
  if (headlineEl) {
    var mo = new MutationObserver(function () {
      if (headlineEl.innerHTML.trim()) {
        mo.disconnect();
        initWordReveal();
      }
    });
    mo.observe(headlineEl, { childList: true, subtree: false });
  }

  // Trigger word reveal when .hero-fade-up gains .visible
  var heroSection = document.getElementById('hero');
  if (heroSection) {
    var vis = new MutationObserver(function () {
      var badge = document.querySelector('.hero-badge');
      if (badge && badge.classList.contains('visible')) {
        vis.disconnect();
        initWordReveal();
        revealWords(200);
      }
    });
    vis.observe(heroSection, { subtree: true, attributes: true, attributeFilter: ['class'] });
  }

  /* ── 5. Live social proof rotator ───────────────────────── */
  var PROOF_EN = [
    'Ahmed from Casablanca just ordered 5,000 Instagram followers',
    'Sara from Marrakesh just ordered TikTok coins',
    'Youssef from Rabat just got Netflix 4K',
    'Karim from Fès just ordered 10,000 followers'
  ];
  var PROOF_AR = [
    'أحمد من الدار البيضاء طلب 5,000 متابع على إنستغرام',
    'سارة من مراكش طلبت عملات تيك توك',
    'يوسف من الرباط حصل على نتفليكس 4K',
    'كريم من فاس طلب 10,000 متابع'
  ];

  var proofEl = document.querySelector('.hero-proof-text');
  if (proofEl) {
    var proofIdx   = 0;
    var proofTimer = null;

    function nextProof() {
      var lang = document.documentElement.lang || 'ar';
      var list = lang === 'ar' ? PROOF_AR : PROOF_EN;
      proofIdx = (proofIdx + 1) % list.length;

      proofEl.classList.add('proof-exit');
      setTimeout(function () {
        proofEl.textContent = list[proofIdx];
        proofEl.classList.remove('proof-exit');
        proofEl.classList.add('proof-enter');
        requestAnimationFrame(function () {
          requestAnimationFrame(function () {
            proofEl.classList.remove('proof-enter');
          });
        });
      }, 400);
    }

    function startProof() {
      var lang = document.documentElement.lang || 'ar';
      var list = lang === 'ar' ? PROOF_AR : PROOF_EN;
      proofEl.textContent = list[0];
      proofTimer = setInterval(nextProof, 3500);
    }

    startProof();

    document.addEventListener('visibilitychange', function () {
      if (document.hidden) {
        clearInterval(proofTimer);
      } else {
        proofTimer = setInterval(nextProof, 3500);
      }
    });
  }

  /* ── 6. Count-up for trust stats ────────────────────────── */
  function easeOutExpo(t) {
    return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
  }

  function countUp(el, target, duration) {
    var start = performance.now();
    (function frame(now) {
      var progress = Math.min((now - start) / duration, 1);
      var value    = Math.round(easeOutExpo(progress) * target);
      el.textContent = value.toLocaleString() + (target === 5000 ? '+' : '');
      if (progress < 1) {
        requestAnimationFrame(frame);
      } else {
        el.textContent = el.dataset.finalVal;
      }
    })(start);
  }

  var trustNums = document.querySelectorAll('.trust-stat-num');
  if (trustNums.length) {
    trustNums.forEach(function (el) {
      el.dataset.finalVal = el.textContent;
    });

    var trustObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        trustObs.unobserve(entry.target);
        var el  = entry.target;
        var raw = el.dataset.finalVal;
        if (raw && raw.includes('5,000')) {
          countUp(el, 5000, 1400);
        }
      });
    }, { threshold: 0.5 });

    trustNums.forEach(function (el) { trustObs.observe(el); });
  }

  /* ── 7. Hero off-screen animation pause ─────────────────── */
  var heroSec = document.getElementById('hero');
  if (heroSec) {
    new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        heroSec.classList.toggle('hero-animations-paused', !e.isIntersecting);
      });
    }, { threshold: 0 }).observe(heroSec);
  }

  /* ── 8. Desktop magnetic button effect ──────────────────── */
  var orderBtn = document.querySelector('.btn-hero-order');
  if (orderBtn && window.matchMedia('(hover: hover) and (min-width: 1024px)').matches) {
    var rafId = null;
    orderBtn.addEventListener('mousemove', function (e) {
      if (rafId) return;
      rafId = requestAnimationFrame(function () {
        rafId = null;
        var rect = orderBtn.getBoundingClientRect();
        var cx   = rect.left + rect.width  / 2;
        var cy   = rect.top  + rect.height / 2;
        var dx   = Math.max(-8, Math.min(8, (e.clientX - cx) * 0.3));
        var dy   = Math.max(-8, Math.min(8, (e.clientY - cy) * 0.3));
        orderBtn.style.transform = 'translate(' + dx + 'px, ' + dy + 'px)';
      });
    }, { passive: true });

    orderBtn.addEventListener('mouseleave', function () {
      orderBtn.style.transform = '';
    }, { passive: true });
  }

})();
