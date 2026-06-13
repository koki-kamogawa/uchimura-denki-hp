// 下層ヒーローの液体金属 — FVのリッチさを全ページへ（小型・省電力版）
// fv-cyber.js と同じ素材言語。画面外では完全休止。モバイルはCSSで非表示＝初期化しない。
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { SimplexNoise } from 'three/addons/math/SimplexNoise.js';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';

const canvas = document.querySelector('.hero-blob');
const prefersReduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

if (canvas && !matchMedia('(max-width: 900px)').matches) {
  let renderer = null;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  } catch (e) { /* WebGL不可なら出さない（情報は欠けない） */ }

  if (renderer) {
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
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

    let geo = new THREE.SphereGeometry(1.16, 96, 96);
    geo.deleteAttribute('uv');
    geo = mergeVertices(geo);
    const base = geo.attributes.position.array.slice();
    const pos = geo.attributes.position;
    const mat = new THREE.MeshPhysicalMaterial({
      color: 0xd8d8dc, metalness: 0.95, roughness: 0.09,
      clearcoat: 0.5, clearcoatRoughness: 0.2, envMapIntensity: 1.5,
    });
    scene.add(new THREE.Mesh(geo, mat));
    const blob = scene.children[scene.children.length - 1];

    const simplex = new SimplexNoise();
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
      const amp = 0.16 * ease, f1 = 0.7, f2 = 1.4;
      for (let i = 0; i < pos.count; i++) {
        const ix = i * 3, x = base[ix], y = base[ix + 1], z = base[ix + 2];
        const n =
          simplex.noise3d(x * f1 + t * speed, y * f1 + t * speed * 0.8, z * f1) * 0.78 +
          simplex.noise3d(x * f2 + 10 + t * speed * 1.4, y * f2, z * f2 + t * speed) * 0.22;
        const s = 1 + n * amp;
        pos.array[ix] = x * s; pos.array[ix + 1] = y * s; pos.array[ix + 2] = z * s;
      }
      pos.needsUpdate = true;
      geo.computeVertexNormals();
      blob.scale.setScalar(0.7 + 0.3 * ease);
      blob.rotation.y = t * 0.05;
      blob.rotation.x = -0.1;
      renderer.render(scene, camera);
      requestAnimationFrame(tick);
    }
    canvas.classList.add('is-on');
    requestAnimationFrame(tick);
  }
}
