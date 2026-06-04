/* 内村電機HP main.js — 「街に灯がともる」モーション1本に集中 */
(function () {
  'use strict';

  // ===== reveal =====
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
  }, { threshold: 0.12 });
  document.querySelectorAll('.reveal').forEach(function (el) { io.observe(el); });

  // ===== S1 FV：街に灯がともる（ロード後に点灯＋空が夕暮れへ） =====
  var scene = document.querySelector('.fv__scene');
  var skyTop = document.getElementById('skyTop');
  var skyBot = document.getElementById('skyBot');
  setTimeout(function () {
    if (scene) scene.classList.add('is-lit');
    // 空：昼(水色)→夕暮れ(橙がかった暖色)へ
    if (skyTop) skyTop.setAttribute('stop-color', '#E8B27A');
    if (skyBot) skyBot.setAttribute('stop-color', '#F4EEE2');
  }, 800);

  // ===== S5 島根マップ：本社→営業所へ順に灯がともる =====
  var SITES = [
    { x: 720, y: 338, main: true, label: '本社（出雲）' },
    { x: 685, y: 398, label: '雲南' },
    { x: 838, y: 300, label: '松江' },
    { x: 908, y: 278, label: '安来' },
    { x: 568, y: 402, label: '大田' },
    { x: 412, y: 454, label: '浜田' },
    { x: 262, y: 512, label: '益田' }
  ];
  var g = document.getElementById('mapDots');
  if (g) {
    var ns = 'http://www.w3.org/2000/svg';
    SITES.forEach(function (s, i) {
      var glow = document.createElementNS(ns, 'circle');
      glow.setAttribute('cx', s.x); glow.setAttribute('cy', s.y);
      glow.setAttribute('r', s.main ? 16 : 12); glow.setAttribute('fill', '#F2A93B');
      glow.setAttribute('opacity', '0');
      glow.style.transition = 'opacity .8s ' + (0.15 + i * 0.12) + 's';
      glow.dataset.glow = '1';
      g.appendChild(glow);
      var c = document.createElementNS(ns, 'circle');
      c.setAttribute('cx', s.x); c.setAttribute('cy', s.y);
      c.setAttribute('r', s.main ? 4.5 : 3.2); c.setAttribute('fill', '#F7E3B8');
      c.setAttribute('opacity', '0');
      c.style.transition = 'opacity .5s ' + (0.15 + i * 0.12) + 's';
      g.appendChild(c);
      if (s.main) {
        var t = document.createElementNS(ns, 'text');
        t.setAttribute('x', s.x); t.setAttribute('y', s.y + 26);
        t.setAttribute('fill', 'rgba(247,243,236,0.85)'); t.setAttribute('font-size', '13');
        t.setAttribute('text-anchor', 'middle'); t.setAttribute('font-family', 'Noto Sans JP');
        t.setAttribute('opacity', '0'); t.style.transition = 'opacity .6s 1s';
        t.textContent = '本社'; t.dataset.lab = '1';
        g.appendChild(t);
      }
    });
    var glowEls = g.querySelectorAll('circle');
    var netIo = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) {
          glowEls.forEach(function (c, idx) {
            setTimeout(function () { c.setAttribute('opacity', c.dataset.glow ? '0.5' : '1'); }, idx * 85);
          });
          var lab = g.querySelector('[data-lab]'); if (lab) setTimeout(function () { lab.setAttribute('opacity', '1'); }, 950);
          netIo.disconnect();
        }
      });
    }, { threshold: 0.3 });
    var net = document.querySelector('.network'); if (net) netIo.observe(net);
  }

  // ===== モバイル：ハンバーガー（簡易・サイドナビ表示トグル） =====
  var burger = document.getElementById('burger');
  var sidenav = document.querySelector('.sidenav');
  if (burger && sidenav) {
    burger.addEventListener('click', function () {
      var open = sidenav.style.display === 'flex';
      sidenav.style.display = open ? '' : 'flex';
      if (!open) {
        sidenav.style.position = 'fixed'; sidenav.style.top = '60px';
        sidenav.style.width = '100%'; sidenav.style.zIndex = '199';
      }
    });
  }

  // ===== 漂うイラスト：reveal + スクロール視差（kaonavi寄せ） =====
  var floats = Array.prototype.slice.call(document.querySelectorAll('.float'));
  if (floats.length) {
    var fio = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) e.target.classList.add('is-in'); });
    }, { threshold: 0.1 });
    floats.forEach(function (el) { fio.observe(el); });
    /* パララックス(inline transform)は常時浮遊(floaty)と競合するため浮遊を優先。 */
  }

  // ===== 夜の星（拠点ネットワーク＝夜空） =====
  var net2 = document.querySelector('.network');
  if (net2) {
    var sbox = document.createElement('div'); sbox.className = 'network__stars';
    for (var si = 0; si < 46; si++) {
      var star = document.createElement('span'); star.className = 'night-star';
      var sz = (Math.random() * 1.6 + 1).toFixed(1);
      star.style.width = sz + 'px'; star.style.height = sz + 'px';
      star.style.left = (Math.random() * 100).toFixed(1) + '%';
      star.style.top = (Math.random() * 72).toFixed(1) + '%';
      star.setAttribute('data-op', (Math.random() * 0.6 + 0.25).toFixed(2));
      sbox.appendChild(star);
    }
    net2.insertBefore(sbox, net2.firstChild);
    var sio = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) {
        sbox.querySelectorAll('.night-star').forEach(function (s) { s.style.opacity = s.getAttribute('data-op'); });
        sio.disconnect();
      } });
    }, { threshold: 0.15 });
    sio.observe(net2);
  }

  // ===== 数字カウントアップ（FV meta・点灯後に動く） =====
  var counts = Array.prototype.slice.call(document.querySelectorAll('.count'));
  if (counts.length) {
    var countUp = function (el) {
      var to = parseInt(el.getAttribute('data-to'), 10), t0 = null, dur = 1700;
      function step(ts) { if (!t0) t0 = ts; var p = Math.min((ts - t0) / dur, 1);
        el.textContent = Math.floor(to * (1 - Math.pow(1 - p, 3)));
        if (p < 1) requestAnimationFrame(step); else el.textContent = to; }
      requestAnimationFrame(step);
    };
    setTimeout(function () { counts.forEach(countUp); }, 1100);
  }
})();
