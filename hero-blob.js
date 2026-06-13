// 下層ヒーローの3Dオブジェクト — 素材(クローム×赤の灯)は全社共通、造形はページの意味を背負って全て別物。
// data-form: torus(環=92年の連環) / knot(絡み合う6事業) / crystal(実績の結晶) /
//            ring7(本社+6営業所の7つの灯) / flame(灯を継ぐ人) / sphere(歪みなき品質) / contact(接点)
// 画面外では完全休止。モバイルはCSS非表示＝初期化しない。
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { SimplexNoise } from 'three/addons/math/SimplexNoise.js';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';

const canvas = document.querySelector('.hero-blob');
const prefersReduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const isMobile = matchMedia('(max-width: 900px)').matches;

if (canvas) {
  let renderer = null;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  } catch (e) { /* WebGL不可なら出さない */ }

  if (renderer) {
    renderer.setPixelRatio(Math.min(devicePixelRatio, isMobile ? 1.5 : 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.3;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 50);
    camera.position.set(0, 0, 5.2);

    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

    const red = new THREE.PointLight(0xff3a26, 80, 30);
    red.position.set(-2.6, -1.8, 3.2); scene.add(red);
    const cool = new THREE.PointLight(0xbfd8ff, 28, 30);
    cool.position.set(3.2, 2.6, 3.0); scene.add(cool);
    const rim = new THREE.DirectionalLight(0xdfe8ff, 2.2);
    rim.position.set(3.5, 1.2, -2.5); scene.add(rim);
    const rim2 = new THREE.DirectionalLight(0xff5a3c, 1.1);
    rim2.position.set(-2.5, -2.5, -2.0); scene.add(rim2);

    const chrome = (opts) => new THREE.MeshPhysicalMaterial(Object.assign({
      color: 0xd8d8dc, metalness: 0.95, roughness: 0.09,
      clearcoat: 0.5, clearcoatRoughness: 0.2, envMapIntensity: 1.5,
    }, opts || {}));
    const smooth = (g) => { g.deleteAttribute('uv'); return mergeVertices(g); };

    const FORM = canvas.dataset.form || 'flame';
    const root = new THREE.Group();
    scene.add(root);

    // ノイズ変位の対象（有機的に揺らすのは torus / flame のみ。他は造形が主役）
    let noiseGeo = null, noiseBase = null, noiseAmp = 0, noiseMesh = null;
    const simplex = new SimplexNoise();
    let pair = null; // contact用

    if (FORM === 'torus') {
      const g = smooth(new THREE.TorusGeometry(0.92, 0.34, isMobile ? 44 : 64, isMobile ? 100 : 140));
      noiseMesh = new THREE.Mesh(g, chrome());
      noiseGeo = g; noiseBase = g.attributes.position.array.slice(); noiseAmp = 0.09;
      root.add(noiseMesh);
    } else if (FORM === 'knot') {
      root.add(new THREE.Mesh(smooth(new THREE.TorusKnotGeometry(0.72, 0.22, 280, 40, 2, 3)), chrome()));
    } else if (FORM === 'crystal') {
      root.add(new THREE.Mesh(new THREE.IcosahedronGeometry(1.12, 0), chrome({ flatShading: true, roughness: 0.12 })));
    } else if (FORM === 'ring7') {
      root.add(new THREE.Mesh(smooth(new THREE.SphereGeometry(0.4, 48, 48)), chrome()));
      root.add(new THREE.Mesh(new THREE.TorusGeometry(1.0, 0.014, 12, 160), chrome({ roughness: 0.2 })));
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        const s = new THREE.Mesh(smooth(new THREE.SphereGeometry(0.17, 32, 32)), chrome());
        s.position.set(Math.cos(a), Math.sin(a), 0);
        root.add(s);
      }
    } else if (FORM === 'sphere') {
      root.add(new THREE.Mesh(smooth(new THREE.SphereGeometry(1.02, 96, 96)), chrome({ roughness: 0.05 })));
    } else if (FORM === 'contact') {
      const a = new THREE.Mesh(smooth(new THREE.SphereGeometry(0.58, 64, 64)), chrome());
      const b = a.clone();
      a.position.x = -0.64; b.position.x = 0.64;
      root.add(a); root.add(b);
      pair = [a, b];
    } else { // flame
      const g = smooth(new THREE.SphereGeometry(1.0, isMobile ? 72 : 96, isMobile ? 72 : 96));
      noiseMesh = new THREE.Mesh(g, chrome());
      noiseMesh.scale.set(0.85, 1.22, 0.85);
      noiseGeo = g; noiseBase = g.attributes.position.array.slice(); noiseAmp = 0.2;
      root.add(noiseMesh);
    }

    function resize() {
      const w = canvas.clientWidth, h = canvas.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h; camera.updateProjectionMatrix();
    }
    addEventListener('resize', resize); resize();

    let visible = true;
    new IntersectionObserver((es) => {
      es.forEach((e) => { visible = e.isIntersecting; });
    }, { threshold: 0 }).observe(canvas);

    let intro = 0;
    const clock = new THREE.Clock();
    const speed = prefersReduced ? 0 : 0.22;

    function tick() {
      if (!visible) { requestAnimationFrame(tick); return; }
      const t = clock.getElapsedTime();
      intro = Math.min(1, intro + 0.014);
      const ease = 1 - Math.pow(1 - intro, 3);

      if (noiseGeo) {
        const pos = noiseGeo.attributes.position;
        const amp = noiseAmp * ease, f1 = 0.7, f2 = 1.4;
        for (let i = 0; i < pos.count; i++) {
          const ix = i * 3, x = noiseBase[ix], y = noiseBase[ix + 1], z = noiseBase[ix + 2];
          const n =
            simplex.noise3d(x * f1 + t * speed, y * f1 + t * speed * 0.8, z * f1) * 0.78 +
            simplex.noise3d(x * f2 + 10 + t * speed * 1.4, y * f2, z * f2 + t * speed) * 0.22;
          const s = 1 + n * amp;
          pos.array[ix] = x * s; pos.array[ix + 1] = y * s; pos.array[ix + 2] = z * s;
        }
        pos.needsUpdate = true;
        noiseGeo.computeVertexNormals();
      }

      // ページごとの所作（ゆっくり・上質に）
      if (FORM === 'torus') {
        root.rotation.x = 0.85; root.rotation.z = t * 0.10;
      } else if (FORM === 'knot') {
        root.rotation.y = t * 0.12; root.rotation.x = 0.25;
      } else if (FORM === 'crystal') {
        root.rotation.y = t * 0.14; root.rotation.x = 0.35;
        root.position.y = Math.sin(t * 0.7) * 0.05;
      } else if (FORM === 'ring7') {
        root.rotation.x = 1.0; root.rotation.z = t * 0.14;
      } else if (FORM === 'sphere') {
        root.rotation.y = t * 0.10;
      } else if (FORM === 'contact') {
        const d = 0.66 - Math.sin(t * 0.9) * 0.05;
        pair[0].position.x = -d; pair[1].position.x = d;
        // 常に2球が見えるよう、回転は揺動に留める（重なると品質ページと見分けがつかなくなる）
        root.rotation.y = Math.sin(t * 0.4) * 0.35;
        root.rotation.z = 0.18;
      } else { // flame
        root.rotation.y = t * 0.06;
      }

      // FV級のインパクト（カメラ視野に対し造形を大きく張る）
      root.scale.setScalar((0.7 + 0.3 * ease) * 1.12);
      renderer.render(scene, camera);
      requestAnimationFrame(tick);
    }
    canvas.classList.add('is-on');
    requestAnimationFrame(tick);
  }
}
