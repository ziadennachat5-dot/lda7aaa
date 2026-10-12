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
  // REMOVED: Now handled by app.js renderHero() with simpler structure

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
