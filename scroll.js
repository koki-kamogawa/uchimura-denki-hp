/* ============================================================
   scroll.js — スクロール体験（全ページ共通・main.jsより前に読む）
   ① Lenis スムーススクロール（慣性＝awwwardsの気持ちよさの正体）
   ② パララックス（巨大英字=強／漂う灯=弱・スクロールに反応する奥行き）
   ③ スクロール進捗バー（現在地）
   reduced-motion尊重・Lenis未ロード時はネイティブscrollにフォールバック。
   ============================================================ */
(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var mobile = window.matchMedia('(max-width: 760px)').matches;
  var qsa = function (s) { return Array.prototype.slice.call(document.querySelectorAll(s)); };

  var bar, enEls = [], floatEls = [];

  function update(scrollY) {
    if (scrollY == null) scrollY = window.pageYOffset || document.documentElement.scrollTop || 0;
    var h = document.documentElement;
    var max = (h.scrollHeight - h.clientHeight) || 1;
    if (bar) bar.style.transform = 'scaleX(' + Math.min(Math.max(scrollY / max, 0), 1).toFixed(4) + ')';
    if (reduce) return;
    var vh = window.innerHeight;
    var enK = mobile ? 0.08 : 0.16;   // 巨大英字：スクロールでゆっくり流れる
    var flK = mobile ? 0.03 : 0.07;   // 漂う灯：画面内位置に応じて上下にずれる
    var i, el, r, c;
    for (i = 0; i < enEls.length; i++) {
      enEls[i].style.transform = 'translate3d(0,' + (scrollY * enK).toFixed(1) + 'px,0)';
    }
    for (i = 0; i < floatEls.length; i++) {
      el = floatEls[i]; r = el.getBoundingClientRect();
      c = (r.top + r.height / 2) - vh / 2;
      el.style.transform = 'translate3d(0,' + (c * -flK).toFixed(1) + 'px,0)';
    }
  }

  function init() {
    bar = document.createElement('div');
    bar.className = 'scroll-progress';
    document.body.appendChild(bar);
    enEls = qsa('.page-hero__en');
    floatEls = qsa('.float, .page-hero__float');

    if (!reduce && window.Lenis) {
      var lenis = new Lenis({
        duration: 0.85,
        easing: function (t) { return 1 - Math.pow(1 - t, 3); },
        smoothWheel: true,
        wheelMultiplier: 1.05,
        touchMultiplier: 1.5
      });
      lenis.on('scroll', function (e) { update(e.scroll); });
      function raf(time) { lenis.raf(time); requestAnimationFrame(raf); }
      requestAnimationFrame(raf);
      qsa('a[href^="#"]').forEach(function (a) {
        a.addEventListener('click', function (ev) {
          var id = a.getAttribute('href');
          if (id && id.length > 1) { var t = document.querySelector(id); if (t) { ev.preventDefault(); lenis.scrollTo(t, { offset: -20 }); } }
        });
      });
    } else {
      window.addEventListener('scroll', function () { update(); }, { passive: true });
    }
    window.addEventListener('resize', function () { update(); });
    update(0);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
