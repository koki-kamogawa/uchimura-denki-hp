// FV試作 — 液体金属（クローム流体）。電気＝形のないエネルギーの可視化。
// CPU側でノイズ変位 + 法線再計算（モバイルは頂点数とDPRを落とす）
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { SimplexNoise } from 'three/addons/math/SimplexNoise.js';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';

const canvas = document.getElementById('blob');
const prefersReduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const isMobile = matchMedia('(max-width: 900px)').matches;

let renderer = null;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
} catch (e) {
  document.body.classList.add('no-webgl');
}

if (renderer) {
  renderer.setPixelRatio(Math.min(devicePixelRatio, isMobile ? 1.5 : 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.3;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 50);
  camera.position.set(0, 0, 5.2);

  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  // 反射に夜の色味を入れる（赤＝灯・冷白＝夜気・リム＝輪郭）
  const red = new THREE.PointLight(0xff3a26, 90, 30);
  red.position.set(-2.6, -1.8, 3.2);
  scene.add(red);
  const cool = new THREE.PointLight(0xbfd8ff, 30, 30);
  cool.position.set(3.2, 2.6, 3.0);
  scene.add(cool);
  const rim = new THREE.DirectionalLight(0xdfe8ff, 2.4);
  rim.position.set(3.5, 1.2, -2.5);
  scene.add(rim);
  const rim2 = new THREE.DirectionalLight(0xff5a3c, 1.2);
  rim2.position.set(-2.5, -2.5, -2.0);
  scene.add(rim2);

  const seg = isMobile ? 88 : 128;
  // UV継ぎ目で法線が割れ縦線が出るため、uvを捨てて頂点溶接（シームレス化）
  let geo = new THREE.SphereGeometry(1.18, seg, seg);
  geo.deleteAttribute('uv');
  geo = mergeVertices(geo);
  const base = geo.attributes.position.array.slice();
  const pos = geo.attributes.position;
  const mat = new THREE.MeshPhysicalMaterial({
    color: 0xd8d8dc,
    metalness: 0.95,
    roughness: 0.09,
    clearcoat: 0.5,
    clearcoatRoughness: 0.2,
    envMapIntensity: 1.55,
  });
  const blob = new THREE.Mesh(geo, mat);
  scene.add(blob);

  const simplex = new SimplexNoise();
  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  addEventListener('pointermove', (e) => {
    pointer.tx = (e.clientX / innerWidth) * 2 - 1;
    pointer.ty = (e.clientY / innerHeight) * 2 - 1;
  });

  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  addEventListener('resize', resize);
  resize();

  // 画面外では描画と頂点計算を完全休止（CPU節約・FVに戻ったら再開）
  let visible = true;
  new IntersectionObserver((es) => {
    es.forEach((e) => { visible = e.isIntersecting; });
  }, { threshold: 0 }).observe(canvas);

  let intro = 0;
  const clock = new THREE.Clock();
  const speed = prefersReduced ? 0 : 0.26;

  function tick() {
    if (!visible) { requestAnimationFrame(tick); return; }
    const t = clock.getElapsedTime();
    intro = Math.min(1, intro + 0.012);
    const ease = 1 - Math.pow(1 - intro, 3);
    pointer.x += (pointer.tx - pointer.x) * 0.04;
    pointer.y += (pointer.ty - pointer.y) * 0.04;

    const amp = (0.2 + Math.abs(pointer.x) * 0.06) * ease;
    const f1 = 0.7, f2 = 1.4;
    for (let i = 0; i < pos.count; i++) {
      const ix = i * 3, x = base[ix], y = base[ix + 1], z = base[ix + 2];
      const n =
        simplex.noise3d(x * f1 + t * speed, y * f1 + t * speed * 0.8, z * f1) * 0.78 +
        simplex.noise3d(x * f2 + 10 + t * speed * 1.4, y * f2, z * f2 + t * speed) * 0.22;
      const s = 1 + n * amp;
      pos.array[ix] = x * s;
      pos.array[ix + 1] = y * s;
      pos.array[ix + 2] = z * s;
    }
    pos.needsUpdate = true;
    geo.computeVertexNormals();

    blob.scale.setScalar(0.68 + 0.32 * ease);
    blob.rotation.y = t * 0.06 + pointer.x * 0.25;
    blob.rotation.x = pointer.y * 0.18;

    renderer.render(scene, camera);
    if (!prefersReduced || intro < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

requestAnimationFrame(() => document.body.classList.add('is-in'));
