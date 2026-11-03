/* C1 · Stuen — Menneskers brug og brugskontekst.
   En hyggelig stue i aftenlys: sofa, tv-væg, køkken, entré. Fire familiemedlemmer som silhuetter,
   og fire teknologier (telefon, tablet, smart-højttaler, spillekonsol) med et lille felt om hvem og til hvad.
   c1-0: silhuetterne går rundt og tager teknologierne op.
   c1-1: en døgnurskive på gulvet; prikker i tre farver dukker op time for time (kortlægning, ikke landkort).
   c1-2: tre gennemsigtige lag over en telefon (tænkt, faktisk, ønsket brug) forskydes i forhold til hinanden.
   c1-3: en telefon lægges i en skuffe, og silhuetterne ændrer langsomt adfærd. */

export default function build(ctx) {
  const { THREE, K, kit, C, root } = ctx;
  const D = Math.PI / 180;
  const ROSE = C.c;

  /* ---------- Hjælpere ---------- */
  function batch() {
    const parts = [];
    function add(geo, color, p = [0, 0, 0], r = [0, 0, 0], s = 1) {
      const g = geo.index ? geo.toNonIndexed() : geo;
      for (const k of Object.keys(g.attributes)) if (k !== "position" && k !== "normal") g.deleteAttribute(k);
      const sv = Array.isArray(s) ? s : [s, s, s];
      g.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(...p), new THREE.Quaternion().setFromEuler(new THREE.Euler(r[0] * D, r[1] * D, r[2] * D)), new THREE.Vector3(...sv)));
      const c = new THREE.Color(color), n = g.attributes.position.count, a = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) { a[i * 3] = c.r; a[i * 3 + 1] = c.g; a[i * 3 + 2] = c.b; }
      g.setAttribute("color", new THREE.BufferAttribute(a, 3)); parts.push(g);
    }
    return {
      add,
      box: (w, h, d, c, p, r, s) => add(new THREE.BoxGeometry(w, h, d), c, p, r, s),
      cyl: (rt, rb, h, c, p, r, seg = 12) => add(new THREE.CylinderGeometry(rt, rb, h, seg), c, p, r),
      sph: (rad, c, p, seg = 10, s) => add(new THREE.SphereGeometry(rad, seg, Math.max(4, Math.round(seg * 0.6))), c, p, [0, 0, 0], s),
      rbox: (w, h, d, rad, c, p, r) => add(roundBox(w, h, d, rad), c, p, r),
      build(material) { const g = THREE.BufferGeometryUtils.mergeGeometries(parts, false); parts.forEach(x => x.dispose()); g.computeBoundingSphere(); return new THREE.Mesh(g, material); },
    };
  }
  function roundBox(w, h, d, r) {  // afrundet kasse som ekstruderet afrundet rektangel (til hynder og telefoner)
    const s = new THREE.Shape(), x = -w / 2 + r, y = -h / 2 + r;
    s.moveTo(-w / 2, y); s.lineTo(-w / 2, h / 2 - r); s.quadraticCurveTo(-w / 2, h / 2, x, h / 2); s.lineTo(w / 2 - r, h / 2); s.quadraticCurveTo(w / 2, h / 2, w / 2, h / 2 - r);
    s.lineTo(w / 2, y); s.quadraticCurveTo(w / 2, -h / 2, w / 2 - r, -h / 2); s.lineTo(x, -h / 2); s.quadraticCurveTo(-w / 2, -h / 2, -w / 2, y);
    const g = new THREE.ExtrudeGeometry(s, { depth: d, bevelEnabled: false, curveSegments: 3 }); g.translate(0, 0, -d / 2); return g;
  }
  const litMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85, metalness: 0.02, flatShading: true });
  const glowMat = new THREE.MeshBasicMaterial({ vertexColors: true });
  const addObj = (obj, parent = root, pos = "0 0 0") => { const e = kit.grp(parent, pos); e.setObject3D("mesh", obj); obj.traverse(o => { o.el = e; }); return e; };
  const basic = (o = {}) => new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, ...o });
  const quad = (w, h, mat) => new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
  const FONT = (wgt, px) => `${wgt} ${px}px "Familjen Grotesk", "Segoe UI", system-ui, sans-serif`;
  const BODY = (wgt, px) => `${wgt} ${px}px "Source Sans 3", "Segoe UI", system-ui, sans-serif`;
  const ease = x => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));
  const lerp = (a, b, k) => a + (b - a) * k;
  const angLerp = (a, b, k) => { let d = b - a; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; return a + d * k; };
  const setSignOpacity = (el, o) => { const m = el.getObject3D("mesh"); if (m) m.material.opacity = o; };
  function capsule(A, B, r, seg = 8) {
    const a = new THREE.Vector3(...A), b = new THREE.Vector3(...B), d = b.clone().sub(a), len = d.length();
    const g = new THREE.CapsuleGeometry(r, Math.max(0.001, len), 3, seg);
    g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()));
    g.translate((A[0] + B[0]) / 2, (A[1] + B[1]) / 2, (A[2] + B[2]) / 2); return g;
  }
  const mergeClean = gs => THREE.BufferGeometryUtils.mergeGeometries(gs.map(g => { g = g.index ? g.toNonIndexed() : g; for (const k of Object.keys(g.attributes)) if (k !== "position" && k !== "normal") g.deleteAttribute(k); return g; }));

  ctx.env({ background: "#120c14" });

  /* ---------- Rummet: x −6,5…6,5, z −5…8, loft 3,0 m ---------- */
  const W = 6.5, ZB = -5, ZF = 8, H = 3.3;
  const S = batch(), G = batch(), U = batch();   // U: ubelyst (loft), så punktlysene ikke gør det dominerende
  // trægulv i planker
  S.box(2 * W, 0.1, ZF - ZB, "#6b4a3a", [0, -0.05, (ZB + ZF) / 2]);
  for (let x = -W + 0.3; x < W; x += 0.3) S.box(0.012, 0.004, ZF - ZB, "#56392c", [x, 0.002, (ZB + ZF) / 2]);
  // vægge, loft, fodlister
  S.box(2 * W, H, 0.2, "#6e5560", [0, H / 2, ZB - 0.1]);
  S.box(2 * W, H, 0.2, "#5d4a55", [0, H / 2, ZF + 0.1]);
  S.box(0.2, H, ZF - ZB, "#65505c", [-W - 0.1, H / 2, (ZB + ZF) / 2]);
  S.box(0.2, H, ZF - ZB, "#65505c", [W + 0.1, H / 2, (ZB + ZF) / 2]);
  U.box(2 * W, 0.1, ZF - ZB, "#21181e", [0, H + 0.05, (ZB + ZF) / 2]);
  S.box(2 * W, 0.1, 0.04, "#efe2dc", [0, 0.05, ZB + 0.02]);
  S.box(0.04, 0.1, ZF - ZB, "#efe2dc", [-W + 0.02, 0.05, (ZB + ZF) / 2]);
  S.box(0.04, 0.1, ZF - ZB, "#efe2dc", [W - 0.02, 0.05, (ZB + ZF) / 2]);
  // vægpanel (lys bræddebeklædning) på den nederste meter
  S.box(2 * W, 0.04, 0.05, "#d8c6c0", [0, 1.0, ZB + 0.03]);
  S.box(0.05, 0.04, ZF - ZB, "#d8c6c0", [-W + 0.03, 1.0, (ZB + ZF) / 2]);
  S.box(0.05, 0.04, ZF - ZB, "#d8c6c0", [W - 0.03, 1.0, (ZB + ZF) / 2]);
  // loftsbjælker
  for (let z = -3.5; z < ZF; z += 2.5) U.box(2 * W, 0.14, 0.16, "#2e232a", [0, H - 0.07, z]);

  /* entré: døren i bagvæggen (rammen tegner portalen), knagerække, skohylde, højttaler på hylde */
  const DOOR = { x: 0.2 };
  S.box(1.25, 0.08, 0.1, "#4a3a40", [DOOR.x - 1.75, 1.78, ZB + 0.06]);
  for (let i = 0; i < 3; i++) S.rbox(0.34, 0.78, 0.14, 0.12, ["#5a7a8c", "#a65e6e", "#c49a5a"][i], [DOOR.x - 2.15 + i * 0.4, 1.36, ZB + 0.13]);
  S.box(1.1, 0.35, 0.34, "#4a3a40", [DOOR.x - 1.75, 0.175, ZB + 0.2]);
  for (let i = 0; i < 4; i++) S.box(0.22, 0.1, 0.28, ["#2a2a33", "#e7d7c1", "#a65e6e", "#2a2a33"][i], [DOOR.x - 2.15 + i * 0.27, 0.4, ZB + 0.22]);
  S.box(1.3, 0.02, 0.8, "#5a4048", [DOOR.x, 0.01, ZB + 0.6]);                     // dørmåtte

  /* tv-væg (venstre væg) med tv-bænk og konsol */
  const TV = { z: -1.6 };
  S.box(0.5, 0.45, 2.6, "#3a2a30", [-W + 0.27, 0.225, TV.z]);
  S.box(0.46, 0.02, 2.5, "#4c3840", [-W + 0.27, 0.46, TV.z]);
  S.box(0.06, 1.0, 1.75, "#0d0d12", [-W + 0.05, 1.45, TV.z]);
  S.box(0.3, 0.08, 0.42, "#16161c", [-W + 0.3, 0.51, TV.z + 0.8]);                // spillekonsol
  G.box(0.01, 0.012, 0.06, "#9fe3a0", [-W + 0.455, 0.51, TV.z + 0.8]);
  // tæppe og sofa (vender mod tv'et, dvs. −x)
  S.box(3.4, 0.02, 3.0, "#8a4a5c", [-4.2, 0.01, TV.z]);
  S.box(3.1, 0.022, 2.7, "#a35a6f", [-4.2, 0.012, TV.z]);
  const SOF = { x: -2.9, z: TV.z };
  S.rbox(2.5, 0.4, 0.95, 0.08, "#7b5a68", [SOF.x, 0.22, SOF.z], [0, 90, 0]);
  S.rbox(2.5, 0.8, 0.25, 0.08, "#6e505d", [SOF.x + 0.42, 0.62, SOF.z], [0, 90, 0]);
  S.rbox(0.24, 0.6, 0.95, 0.08, "#6e505d", [SOF.x, 0.42, SOF.z - 1.3], [0, 0, 0]);
  S.rbox(0.24, 0.6, 0.95, 0.08, "#6e505d", [SOF.x, 0.42, SOF.z + 1.3], [0, 0, 0]);
  for (const dz of [-0.6, 0.6]) S.rbox(1.15, 0.14, 0.82, 0.06, "#8a6878", [SOF.x - 0.05, 0.47, SOF.z + dz], [-90, 90, 0]);
  S.rbox(0.42, 0.38, 0.14, 0.1, "#d99aa8", [SOF.x + 0.22, 0.75, SOF.z + 0.95], [-12, 70, 0]);
  // sofabord
  const TB = { x: -4.5, z: TV.z };
  S.box(0.7, 0.06, 1.3, "#8b6a4e", [TB.x, 0.4, TB.z]);
  for (const [dx, dz] of [[-0.28, -0.58], [0.28, -0.58], [-0.28, 0.58], [0.28, 0.58]]) S.box(0.05, 0.38, 0.05, "#5b4434", [TB.x + dx, 0.19, TB.z + dz]);
  // standerlampe ved sofaen
  S.cyl(0.02, 0.02, 1.55, "#2a2228", [SOF.x + 0.2, 0.78, SOF.z - 1.75], [0, 0, 0], 6);
  S.cyl(0.18, 0.18, 0.03, "#2a2228", [SOF.x + 0.2, 0.015, SOF.z - 1.75], [0, 0, 0], 10);
  G.cyl(0.16, 0.24, 0.3, "#ffd9a6", [SOF.x + 0.2, 1.66, SOF.z - 1.75], [0, 0, 0], 12);
  // skænk med skuffer mod bagvæggen (station for brugseksperimentet)
  const SB = { x: -1.95, z: TV.z };
  S.box(0.48, 0.78, 1.8, "#8b6a4e", [SB.x, 0.39, SB.z]);
  S.box(0.52, 0.04, 1.86, "#6d523c", [SB.x, 0.8, SB.z]);
  S.box(0.02, 0.32, 0.84, "#7a5c44", [SB.x + 0.245, 0.24, SB.z - 0.44]);
  S.box(0.03, 0.025, 0.12, "#d6c3a6", [SB.x + 0.265, 0.24, SB.z - 0.44]);
  S.box(0.02, 0.32, 0.84, "#7a5c44", [SB.x + 0.245, 0.24, SB.z + 0.44]);
  S.box(0.03, 0.025, 0.12, "#d6c3a6", [SB.x + 0.265, 0.24, SB.z + 0.44]);
  S.cyl(0.1, 0.07, 0.22, "#e7d7c1", [SB.x, 0.93, SB.z + 0.7], [0, 0, 0], 8);
  for (let i = 0; i < 3; i++) S.cyl(0.006, 0.006, 0.4, "#5f8a5f", [SB.x, 1.18, SB.z + 0.7 + (i - 1) * 0.03], [(i - 1) * 12, 0, 0], 4);
  const SPK = { x: SB.x, y: 0.82, z: SB.z - 0.15 };
  // billeder på bagvæggen (farvefelter)
  S.box(0.62, 0.82, 0.03, "#2f2730", [-4.0, 1.85, ZB + 0.02]); G.box(0.52, 0.72, 0.02, "#c47a6a", [-4.0, 1.85, ZB + 0.04]);
  S.box(0.5, 0.5, 0.03, "#2f2730", [-3.2, 1.7, ZB + 0.02]); G.box(0.4, 0.4, 0.02, "#7a8cc4", [-3.2, 1.7, ZB + 0.04]);
  // reol og plante (venstre væg, forrest)
  S.box(0.4, 2.0, 1.6, "#4a3a40", [-W + 0.22, 1.0, 1.8]);
  for (let y = 0.35; y < 1.95; y += 0.45) {
    S.box(0.36, 0.03, 1.5, "#5c4850", [-W + 0.24, y, 1.8]);
    for (let i = 0; i < 9; i++) if ((i * 7 + Math.round(y * 13)) % 5 > 1) S.box(0.24, 0.28 + ((i * 3) % 4) * 0.025, 0.07, ["#c96a7e", "#e7d7c1", "#6c8aa8", "#d7a35c", "#8e6c8a"][(i + Math.round(y * 10)) % 5], [-W + 0.26, y + 0.17, 1.15 + i * 0.16]);
  }
  S.cyl(0.14, 0.1, 0.26, "#c9a487", [-W + 0.5, 0.13, 0.55], [0, 0, 0], 8);
  for (let i = 0; i < 8; i++) S.box(0.07, 0.65, 0.02, "#4e7a54", [-W + 0.5 + Math.sin(i) * 0.07, 0.52, 0.55 + Math.cos(i) * 0.07], [Math.sin(i * 2) * 25, i * 45, Math.cos(i * 3) * 25]);

  /* køkken (højre side): skabe langs højre væg og bagvæg, ø med barstole, pendler */
  S.box(0.62, 0.9, 3.4, "#d9cfc8", [W - 0.32, 0.45, -3.0]);
  S.box(0.66, 0.05, 3.4, "#3b3236", [W - 0.32, 0.925, -3.0]);
  S.box(3.0, 0.9, 0.62, "#d9cfc8", [W - 1.8, 0.45, ZB + 0.32]);
  S.box(3.0, 0.05, 0.66, "#3b3236", [W - 1.8, 0.925, ZB + 0.32]);
  S.box(0.36, 0.7, 3.4, "#e4dad3", [W - 0.2, 2.15, -3.0]);
  S.box(3.0, 0.7, 0.36, "#e4dad3", [W - 1.8, 2.15, ZB + 0.2]);
  for (let z = -4.6; z < -1.4; z += 0.56) { S.box(0.01, 0.66, 0.01, "#b6aaa3", [W - 0.385, 2.15, z]); S.box(0.01, 0.86, 0.01, "#b6aaa3", [W - 0.635, 0.45, z]); }
  for (let x = W - 3.2; x < W; x += 0.6) { S.box(0.01, 0.66, 0.01, "#b6aaa3", [x, 2.15, ZB + 0.385]); S.box(0.01, 0.86, 0.01, "#b6aaa3", [x, 0.45, ZB + 0.635]); }
  G.box(1.4, 0.02, 0.3, "#ffe9c8", [W - 1.8, 1.79, ZB + 0.2]);                    // lys under overskabe
  const ISL = { x: 3.4, z: -2.2 };
  S.box(1.9, 0.92, 0.9, "#7a5d50", [ISL.x, 0.46, ISL.z]);
  S.box(2.1, 0.05, 1.05, "#ece4dd", [ISL.x, 0.945, ISL.z]);
  for (const dx of [-0.55, 0.55]) { S.cyl(0.17, 0.17, 0.05, "#3b3236", [ISL.x + dx, 0.72, ISL.z + 0.85], [0, 0, 0], 10); S.cyl(0.025, 0.025, 0.7, "#3b3236", [ISL.x + dx, 0.36, ISL.z + 0.85], [0, 0, 0], 6); }
  S.cyl(0.06, 0.05, 0.11, "#e7d7c1", [ISL.x - 0.7, 1.02, ISL.z + 0.2], [0, 0, 0], 8);
  S.sph(0.11, "#e0a050", [ISL.x - 0.45, 1.05, ISL.z + 0.25], 8);
  S.sph(0.1, "#c0504a", [ISL.x - 0.3, 1.04, ISL.z + 0.15], 8);
  for (const dx of [-0.5, 0.5]) { S.cyl(0.005, 0.005, 0.9, "#222", [ISL.x + dx, H - 0.45, ISL.z], [0, 0, 0], 4); S.cyl(0.05, 0.18, 0.2, "#2d2a30", [ISL.x + dx, H - 0.99, ISL.z], [0, 0, 0], 10); G.cyl(0.16, 0.16, 0.01, "#ffe2b8", [ISL.x + dx, H - 1.095, ISL.z], [0, 0, 0], 10); }

  // vinduer i højre væg forrest (blå skumring udenfor)
  for (const z of [1.2, 4.6]) { S.box(0.1, 1.5, 1.7, "#efe2dc", [W - 0.02, 1.65, z]); G.box(0.04, 1.36, 1.56, "#2b2d63", [W - 0.06, 1.65, z]); S.box(0.06, 1.36, 0.05, "#efe2dc", [W - 0.08, 1.65, z]); S.box(0.3, 0.05, 1.8, "#efe2dc", [W - 0.15, 0.92, z]); }
  addObj(S.build(litMat)); addObj(G.build(glowMat)); addObj(U.build(glowMat));

  // tv-billede og lys
  const tvTex = K.canvasTexture(256, 144, (g, w, h) => { const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, "#3a4f9a"); gr.addColorStop(1, "#c25a86"); g.fillStyle = gr; g.fillRect(0, 0, w, h); g.fillStyle = "rgba(255,255,255,0.85)"; g.beginPath(); g.arc(70, 72, 26, 0, 7); g.fill(); g.fillStyle = "rgba(255,230,140,0.9)"; g.fillRect(130, 50, 80, 14); g.fillRect(130, 80, 56, 14); });
  const tvScreen = quad(1.65, 0.92, basic({ map: tvTex })); tvScreen.rotation.y = 90 * D; tvScreen.position.set(-W + 0.085, 1.45, TV.z); addObj(tvScreen);
  addObj(new THREE.PointLight("#ffcf9a", 8, 8, 1.4), root, `${SOF.x + 0.2} 2.0 ${SOF.z - 1.75}`);
  addObj(new THREE.PointLight("#ffd9b0", 6, 7, 1.4), root, `${ISL.x} 2.0 ${ISL.z + 0.5}`);
  for (const [x, z, sz, c, o] of [[SOF.x + 0.2, SOF.z - 1.75, 4.0, "#ffcf9a", 0.45], [ISL.x, ISL.z, 3.2, "#ffe2b8", 0.45], [-W + 1.2, TV.z, 2.8, "#8fa6ff", 0.4]]) {
    const p = quad(sz, sz, basic({ map: K.glowTex(c), blending: THREE.AdditiveBlending, opacity: o })); p.rotation.x = -90 * D; p.position.set(x, 0.025, z); addObj(p);
  }

  /* ---------- Skilt med rummets navn og dør tilbage til Gaden ---------- */
  ctx.sign(ctx.room.name, { position: `${DOOR.x} 2.72 ${ZB + 0.6}`, width: 2.6, sub: ctx.room.sub });
  ctx.door(ctx.room.parent, { position: `${DOOR.x} 0 ${ZB + 0.14}`, width: 1.2, height: 2.2 });

  /* ---------- Teknologierne ---------- */
  const scrMat = c => new THREE.MeshBasicMaterial({ color: c });
  function makeDevice(kind) {
    const g = new THREE.Group(), B = batch();
    let scr = null;
    if (kind === "phone") { B.rbox(0.08, 0.16, 0.012, 0.012, "#16161c", [0, 0, 0]); scr = quad(0.068, 0.14, scrMat("#a9c6ff")); scr.position.z = 0.0075; }
    if (kind === "tablet") { B.rbox(0.28, 0.2, 0.012, 0.016, "#202028", [0, 0, 0]); scr = quad(0.255, 0.175, scrMat("#ffd9a0")); scr.position.z = 0.0075; }
    if (kind === "speaker") { B.cyl(0.08, 0.085, 0.22, "#ddd5d0", [0, 0.11, 0], [0, 0, 0], 14); scr = new THREE.Mesh(new THREE.TorusGeometry(0.065, 0.01, 4, 20), scrMat(ROSE)); scr.rotation.x = -90 * D; scr.position.y = 0.222; }
    if (kind === "pad") { B.rbox(0.18, 0.09, 0.05, 0.04, "#1f1f26", [0, 0, 0]); B.sph(0.025, "#3a3a46", [-0.05, 0.01, 0.03], 6); B.sph(0.025, "#3a3a46", [0.05, -0.01, 0.03], 6); scr = quad(0.03, 0.012, scrMat("#9fe3a0")); scr.position.set(0, 0.025, 0.026); }
    g.add(B.build(litMat)); if (scr) g.add(scr); g.userData.scr = scr; return g;
  }
  const speaker = makeDevice("speaker"); speaker.position.set(SPK.x, SPK.y, SPK.z); addObj(speaker);

  /* ---------- Silhuetter: fire familiemedlemmer (kan stå og sidde) ---------- */
  const silMat = new THREE.MeshStandardMaterial({ color: "#2a1f2e", roughness: 0.9, flatShading: true, emissive: "#3a2238", emissiveIntensity: 0.3 });
  const SEAT = 0.47;
  function makeFigure(h) {
    const s = h / 1.75, f = new THREE.Group(), upper = new THREE.Group(); f.add(upper);
    const hip = 0.84 * s;
    upper.add(new THREE.Mesh(mergeClean([
      capsule([0, 1.02 * s, 0], [0, 1.36 * s, 0.01], 0.16 * s), capsule([0, hip, 0], [0, 1.0 * s, 0], 0.14 * s),
      capsule([0, 1.48 * s, 0], [0, 1.56 * s, 0.01], 0.05 * s),
    ]), silMat));
    const armsHold = new THREE.Mesh(mergeClean([
      capsule([0.2 * s, 1.4 * s, 0], [0.19 * s, 1.12 * s, 0.07 * s], 0.05 * s), capsule([-0.2 * s, 1.4 * s, 0], [-0.19 * s, 1.12 * s, 0.07 * s], 0.05 * s),
      capsule([0.19 * s, 1.12 * s, 0.07 * s], [0.05 * s, 1.2 * s, 0.3 * s], 0.045 * s), capsule([-0.19 * s, 1.12 * s, 0.07 * s], [-0.05 * s, 1.2 * s, 0.3 * s], 0.045 * s),
    ]), silMat);
    const armsDown = new THREE.Mesh(mergeClean([
      capsule([0.2 * s, 1.4 * s, 0], [0.23 * s, 0.84 * s, 0.03 * s], 0.05 * s), capsule([-0.2 * s, 1.4 * s, 0], [-0.23 * s, 0.84 * s, 0.03 * s], 0.05 * s),
    ]), silMat);
    upper.add(armsHold, armsDown);
    const legsStand = new THREE.Mesh(mergeClean([capsule([0.085 * s, 0.08, 0], [0.085 * s, hip, 0], 0.07 * s), capsule([-0.085 * s, 0.08, 0], [-0.085 * s, hip, 0], 0.07 * s)]), silMat);
    const legsSit = new THREE.Mesh(mergeClean([
      capsule([0.09 * s, SEAT, -0.05], [0.09 * s, SEAT, 0.42 * s], 0.075 * s), capsule([-0.09 * s, SEAT, -0.05], [-0.09 * s, SEAT, 0.42 * s], 0.075 * s),
      capsule([0.09 * s, SEAT, 0.42 * s], [0.09 * s, 0.07, 0.48 * s], 0.065 * s), capsule([-0.09 * s, SEAT, 0.42 * s], [-0.09 * s, 0.07, 0.48 * s], 0.065 * s),
    ]), silMat);
    f.add(legsStand, legsSit);
    const head = new THREE.Group(); head.position.set(0, 1.56 * s, 0.01); upper.add(head);
    const hm = new THREE.Mesh(new THREE.SphereGeometry(0.11 * s, 12, 8), silMat); hm.position.set(0, 0.11 * s, 0.015); head.add(hm);
    const hand = new THREE.Group(); hand.position.set(0, 1.22 * s, 0.32 * s); upper.add(hand);
    const glow = quad(0.55 * s, 0.55 * s, basic({ map: K.glowTex("#bcd4ff"), blending: THREE.AdditiveBlending, opacity: 0 })); glow.position.set(0, 1.42 * s, 0.24 * s); upper.add(glow);
    return { f, upper, head, hand, armsHold, armsDown, legsStand, legsSit, glow, s, hip };
  }
  /* Hver person: teknologi, hvor de kommer fra, hvor de bruger den (x, z, retning, sidder?),
     hvor tingen ligger, feltets placering, og hvad de gør i brugseksperimentet (c1-3). */
  const fam = [
    { who: "Mor", use: "beskeder, bank og kalender", kind: "phone", h: 1.7,
      from: [DOOR.x, ZB + 0.2, 0, false], at: [DOOR.x - 0.9, ZB + 1.4, 25, false], home: null, label: [DOOR.x - 0.9, 2.25, ZB + 1.4],
      off: [TB.x, TB.z - 1.0, 0, false] },
    { who: "Far", use: "opskrifter og nyheder", kind: "tablet", h: 1.82,
      from: [W - 1.2, ZB + 1.0, -90, false], at: [ISL.x, ISL.z - 0.75, 0, false], home: [ISL.x + 0.25, 0.98, ISL.z - 0.1, -90, 0], label: [ISL.x, 2.45, ISL.z - 0.75],
      off: [ISL.x - 1.1, ISL.z - 0.2, -70, false] },
    { who: "Storesøster", use: "klassechat og video", kind: "phone", h: 1.6,
      from: [-1.6, 1.2, -120, false], at: [SOF.x, SOF.z + 0.6, -90, true], home: [TB.x + 0.1, 0.44, TB.z + 0.3, -90, 0], label: [SOF.x, 1.95, SOF.z + 0.75],
      off: [SOF.x, SOF.z + 0.6, -90, true] },
    { who: "Lillebror", use: "spil med venner", kind: "pad", h: 1.25,
      from: [-1.4, -3.4, -110, false], at: [SOF.x, SOF.z - 0.6, -90, true], home: [-W + 0.35, 0.5, TV.z + 0.35, -90, 90], label: [SOF.x, 1.6, SOF.z - 0.8],
      off: [SOF.x, SOF.z - 0.6, -60, true] },
  ];
  const fieldTex = (who, use) => K.canvasTexture(640, 170, (g, w, h) => {
    g.fillStyle = "rgba(24,14,22,0.9)"; K.roundRect(g, 4, 4, w - 8, h - 8, 28); g.fill(); g.strokeStyle = "rgba(232,99,140,0.9)"; g.lineWidth = 5; g.stroke();
    g.textAlign = "left"; g.textBaseline = "middle"; g.fillStyle = "#ffffff"; g.font = FONT(700, 58); g.fillText(who, 32, 58);
    g.fillStyle = "#ecd9e1"; g.font = BODY(500, 42); g.fillText(use, 32, 122);
  });
  const fields = [];
  const FIELD_EYE = [0.6, 1.6, 4.0];   // felterne drejes mod overbliksviewet
  function addField(who, use, pos) {
    const q = quad(1.2, 0.32, basic({ map: fieldTex(who, use), side: THREE.DoubleSide }));
    q.position.set(...pos); q.lookAt(FIELD_EYE[0], pos[1], FIELD_EYE[2]); addObj(q); fields.push(q); return q;
  }
  addField("Hele familien", "musik, timer og indkøb", [SPK.x + 0.1, 1.45, SPK.z]);
  for (const m of fam) { m.fig = makeFigure(m.h); addObj(m.fig.f); m.dev = makeDevice(m.kind); addObj(m.dev); m.field = addField(m.who, m.use, m.label); }

  /* ---------- c1-0: intro, overblik over stuen ---------- */
  const st0 = kit.grp(root, `${-0.6} 0 ${-1.0}`);
  kit.box(st0, "0 0.5 0", 1.2, 1.0, 1.2, "opacity: 0; transparent: true; depthWrite: false");
  ctx.station("c1-0", st0);
  ctx.view("c1-0", { position: [0.6, 0, 4.0], lookAt: [-0.5, 1.3, -2.0] });

  /* ---------- c1-1: døgnurskiven ---------- */
  const DIAL = { x: -3.4, z: 3.2, r: 1.35 };
  const dialG = new THREE.Group(); dialG.position.set(DIAL.x, 0, DIAL.z);
  const dialTilt = new THREE.Group(); dialTilt.position.y = 0.2; dialTilt.rotation.x = 18 * D; dialG.add(dialTilt);
  const dialTex = K.canvasTexture(1024, 1024, (g, w) => {
    const c = w / 2; g.clearRect(0, 0, w, w);
    g.fillStyle = "#24182a"; g.beginPath(); g.arc(c, c, c - 4, 0, 7); g.fill();
    // nat (21–07) mørk, dag lysere
    g.fillStyle = "#3a2a3e"; g.beginPath(); g.moveTo(c, c); g.arc(c, c, c - 8, (7 / 24) * 2 * Math.PI - Math.PI / 2, (21 / 24) * 2 * Math.PI - Math.PI / 2); g.closePath(); g.fill();
    g.strokeStyle = "rgba(232,99,140,0.95)"; g.lineWidth = 10; g.beginPath(); g.arc(c, c, c - 9, 0, 7); g.stroke();
    g.strokeStyle = "rgba(255,255,255,0.1)"; g.lineWidth = 2; for (const rr of [0.38, 0.55, 0.72]) { g.beginPath(); g.arc(c, c, c * rr, 0, 7); g.stroke(); }
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * 2 * Math.PI - Math.PI / 2, r1 = c - 20, r2 = c - (i % 6 === 0 ? 72 : 44);
      g.strokeStyle = i % 6 === 0 ? "#ffe0ea" : "rgba(255,224,234,0.55)"; g.lineWidth = i % 6 === 0 ? 9 : 4;
      g.beginPath(); g.moveTo(c + Math.cos(a) * r1, c + Math.sin(a) * r1); g.lineTo(c + Math.cos(a) * r2, c + Math.sin(a) * r2); g.stroke();
    }
    g.fillStyle = "#ffe0ea"; g.font = FONT(700, 70); g.textAlign = "center"; g.textBaseline = "middle";
    for (const [hh, lab] of [[0, "24"], [6, "06"], [12, "12"], [18, "18"]]) { const a = (hh / 24) * 2 * Math.PI - Math.PI / 2; g.fillText(lab, c + Math.cos(a) * (c - 125), c + Math.sin(a) * (c - 125)); }
    // sol (dag) og måne (nat)
    g.fillStyle = "#ffd9a0"; g.beginPath(); g.arc(c, c + c * 0.2, 20, 0, 7); g.fill();
    g.fillStyle = "#c9d1ff"; g.beginPath(); g.arc(c, c - c * 0.2, 20, 0, 7); g.fill(); g.fillStyle = "#24182a"; g.beginPath(); g.arc(c + 9, c - c * 0.2 - 6, 16, 0, 7); g.fill();
  });
  const dialDisc = new THREE.Mesh(new THREE.CircleGeometry(DIAL.r, 48), new THREE.MeshBasicMaterial({ map: dialTex, transparent: true }));
  dialDisc.rotation.x = -90 * D; dialDisc.position.y = 0.042; dialTilt.add(dialDisc);
  {
    const B = batch(); B.cyl(DIAL.r + 0.07, DIAL.r + 0.1, 0.07, "#3a2a35", [0, 0, 0], [0, 0, 0], 48); dialTilt.add(B.build(litMat));
    const B2 = batch(); B2.box(DIAL.r * 1.6, 0.18, DIAL.r * 1.2, "#2f2229", [0, -0.08, -0.15]); dialG.add(B2.build(litMat));
  }
  const handM = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.02, DIAL.r - 0.12).translate(0, 0.06, -(DIAL.r - 0.12) / 2), new THREE.MeshBasicMaterial({ color: "#ffffff" }));
  dialTilt.add(handM);
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.05, 12), new THREE.MeshBasicMaterial({ color: ROSE })); hub.position.y = 0.06; dialTilt.add(hub);
  // prikker: én InstancedMesh. Hver post: [klokkeslæt, kategori]
  const CAT = [{ name: "daglige gøremål", c: "#ffc56b" }, { name: "fællesskaber", c: "#ff6f9e" }, { name: "information om verden", c: "#8fb2ff" }];
  const LOG = [[6.6, 0], [7.0, 2], [7.3, 1], [7.7, 0], [8.1, 0], [8.4, 1], [10.1, 2], [12.0, 1], [12.3, 1], [12.6, 2], [14.4, 0], [15.0, 1], [15.4, 1], [15.8, 2], [16.3, 0],
    [16.8, 1], [17.4, 0], [17.7, 2], [18.2, 0], [18.8, 1], [19.3, 2], [19.7, 1], [20.1, 1], [20.4, 2], [20.9, 1], [21.3, 2], [21.7, 1], [22.2, 1], [22.6, 2], [23.2, 1]];
  const dotGeo = new THREE.CylinderGeometry(0.085, 0.085, 0.05, 14);
  const dots = new THREE.InstancedMesh(dotGeo, new THREE.MeshBasicMaterial({ color: "#ffffff" }), LOG.length);
  LOG.forEach(([hh, cat], i) => {
    const rr = DIAL.r * [0.38, 0.55, 0.72][cat];       // én ring pr. kategori, så mønstret kan aflæses
    const a = (hh / 24) * 2 * Math.PI;
    LOG[i].pos = [Math.sin(a) * rr, 0.07, -Math.cos(a) * rr];
    dots.setColorAt(i, new THREE.Color(CAT[cat].c));
  });
  dialTilt.add(dots);
  // sorteringsbakker: tre søjler til højre for skiven
  const bins = CAT.map((c, i) => {
    const g = new THREE.Group(); g.position.set(DIAL.r + 0.65, 0, -0.75 + i * 0.6);
    const B = batch(); B.box(0.46, 0.06, 0.46, "#3a2a35", [0, 0.03, 0]); B.box(0.46, 0.18, 0.04, "#4a3843", [0, 0.09, -0.21]); B.box(0.46, 0.18, 0.04, "#4a3843", [0, 0.09, 0.21]); g.add(B.build(litMat));
    const bar = new THREE.Mesh(new THREE.BoxGeometry(0.32, 1, 0.32).translate(0, 0.5, 0), new THREE.MeshBasicMaterial({ color: c.c })); bar.position.y = 0.06; bar.scale.y = 0.001; g.add(bar);
    dialG.add(g); return { bar, n: LOG.filter(l => l[1] === i).length };
  });
  addObj(dialG);
  const legendTex = K.canvasTexture(800, 300, (g, w, h) => {
    g.fillStyle = "rgba(24,14,22,0.9)"; K.roundRect(g, 4, 4, w - 8, h - 8, 26); g.fill();
    g.textBaseline = "middle"; g.font = BODY(600, 50);
    CAT.forEach((c, i) => { g.fillStyle = c.c; g.beginPath(); g.arc(60, 60 + i * 90, 24, 0, 7); g.fill(); g.fillStyle = "#f5e9ee"; g.fillText(c.name, 108, 62 + i * 90); });
  });
  const legend = quad(1.2, 0.45, basic({ map: legendTex, side: THREE.DoubleSide })); legend.position.set(DIAL.x + DIAL.r + 0.7, 1.15, DIAL.z - 0.75); legend.rotation.y = -12 * D; addObj(legend);
  const st1 = kit.grp(root, `${DIAL.x} 0 ${DIAL.z}`);
  kit.cyl(st1, "0 0.12 0", DIAL.r, 0.24, "opacity: 0; transparent: true; depthWrite: false");
  ctx.station("c1-1", st1);
  const s11 = ctx.sign(ctx.step("c1-1").title, { position: `${DIAL.x + 0.4} 2.1 ${DIAL.z - 1.7}`, width: 2.1 });
  ctx.view("c1-1", { position: [DIAL.x + 0.5, 0, DIAL.z + 3.6], lookAt: [DIAL.x + 0.5, 0.25, DIAL.z] });

  /* ---------- c1-2: tre lag over telefonen (mod højre væg) ---------- */
  const LY = { x: 4.4, z: 2.9 };
  const layG = new THREE.Group(); layG.position.set(LY.x, 0, LY.z); layG.rotation.y = -90 * D;
  {
    const B = batch();
    B.cyl(0.3, 0.36, 0.8, "#3a2a35", [0, 0.4, 0], [0, 0, 0], 16);
    B.cyl(0.4, 0.4, 0.04, "#4c3843", [0, 0.82, 0], [0, 0, 0], 16);
    B.box(0.06, 0.25, 0.08, "#222", [0, 0.95, -0.08], [-10, 0, 0]);
    B.rbox(0.44, 0.86, 0.04, 0.06, "#121218", [0, 1.5, 0], [-4, 0, 0]);
    layG.add(B.build(litMat));
  }
  const bigScreen = quad(0.39, 0.78, new THREE.MeshBasicMaterial({ map: K.canvasTexture(256, 512, (g, w, h) => {
    g.fillStyle = "#1b2238"; g.fillRect(0, 0, w, h); g.fillStyle = "#2b3558"; g.fillRect(0, 0, w, 64);
    g.fillStyle = "#c9d1ff"; g.font = BODY(600, 28); g.fillText("Klassechat", 20, 42);
    for (let i = 0; i < 6; i++) { g.fillStyle = i % 2 ? "#3b4a7a" : "#5a3a5a"; K.roundRect(g, i % 2 ? 90 : 18, 92 + i * 66, 148, 46, 18); g.fill(); }
  }) }));
  bigScreen.position.set(0, 1.5, 0.022); bigScreen.rotation.x = -4 * D; layG.add(bigScreen);
  const layerSpec = [
    { name: "tænkt brug", sub: "lektier", tint: "#c9d1ff", draw: (g) => {
      g.strokeStyle = "rgba(255,255,255,0.95)"; g.fillStyle = "rgba(255,255,255,0.9)"; g.lineWidth = 7;
      for (let i = 0; i < 4; i++) { g.strokeRect(38, 190 + i * 96, 44, 44); if (i < 2) { g.beginPath(); g.moveTo(44, 212 + i * 96); g.lineTo(60, 228 + i * 96); g.lineTo(90, 186 + i * 96); g.stroke(); } g.fillRect(108, 204 + i * 96, 210 - (i % 2) * 70, 16); }
    } },
    { name: "faktisk brug", sub: "alt muligt andet", tint: "#ff8fb1", draw: (g) => {
      for (let i = 0; i < 8; i++) { g.fillStyle = "rgba(255,255,255,0.88)"; K.roundRect(g, i % 2 ? 150 : 32, 180 + i * 50, 100 + (i * 37) % 80, 36, 17); g.fill(); }
      g.fillStyle = "rgba(255,225,130,0.95)"; for (let i = 0; i < 5; i++) { g.beginPath(); g.arc(64 + i * 58, 600, 18, 0, 7); g.fill(); }
    } },
    { name: "ønsket brug", sub: "ro og hjælp", tint: "#ffd9a0", draw: (g) => {
      g.fillStyle = "rgba(255,255,255,0.92)"; K.roundRect(g, 32, 180, 296, 80, 18); g.fill(); g.fillStyle = "rgba(90,60,20,0.9)"; g.fillRect(56, 210, 160, 16);
      g.fillStyle = "rgba(255,255,255,0.78)"; K.roundRect(g, 32, 310, 200, 42, 18); g.fill(); K.roundRect(g, 128, 380, 200, 42, 18); g.fill(); K.roundRect(g, 32, 450, 160, 42, 18); g.fill();
    } },
  ];
  const layers = layerSpec.map((L) => {
    const tex = K.canvasTexture(360, 660, (g, w, h) => {
      g.fillStyle = L.tint + "38"; K.roundRect(g, 6, 6, w - 12, h - 12, 34); g.fill(); g.strokeStyle = L.tint; g.lineWidth = 9; g.stroke();
      g.textAlign = "left"; g.fillStyle = L.tint; g.font = FONT(700, 50); g.fillText(L.name, 30, 76);
      g.fillStyle = "rgba(255,255,255,0.8)"; g.font = BODY(500, 34); g.fillText(L.sub, 30, 124);
      L.draw(g);
    });
    const m = quad(0.52, 0.95, basic({ map: tex, side: THREE.DoubleSide })); layG.add(m); return m;
  });
  addObj(layG);
  const st2 = kit.grp(root, `${LY.x} 0 ${LY.z}`);
  kit.box(st2, "0 0.9 0", 0.9, 1.8, 0.9, "opacity: 0; transparent: true; depthWrite: false");
  ctx.station("c1-2", st2);
  const s12 = ctx.sign(ctx.step("c1-2").title, { position: `${LY.x + 0.3} 2.55 ${LY.z}`, width: 1.7, rotation: "0 -90 0" });
  ctx.view("c1-2", { position: [LY.x - 2.5, 0, LY.z], lookAt: [LY.x, 1.5, LY.z] });

  /* ---------- c1-3: skuffen ---------- */
  const drawer = new THREE.Group(); drawer.rotation.y = 90 * D; drawer.position.set(SB.x + 0.24, 0.58, SB.z - 0.44);
  {
    const B = batch();
    B.box(0.84, 0.3, 0.03, "#8a6a52", [0, 0, 0]);
    B.box(0.8, 0.02, 0.42, "#5c4432", [0, -0.13, -0.21]);
    B.box(0.02, 0.24, 0.42, "#5c4432", [-0.39, -0.03, -0.21]); B.box(0.02, 0.24, 0.42, "#5c4432", [0.39, -0.03, -0.21]);
    B.box(0.12, 0.025, 0.03, "#e6d3b6", [0, 0, 0.025]);
    drawer.add(B.build(litMat));
  }
  addObj(drawer);
  // dagbogen på skænken
  const diary = new THREE.Group(); diary.position.set(SB.x + 0.02, 0.835, SB.z + 0.25); diary.rotation.y = 75 * D;
  {
    const B = batch(); B.box(0.32, 0.025, 0.23, "#a65e6e", [0, 0, 0]); B.box(0.3, 0.012, 0.21, "#f2ebe1", [0, 0.018, 0]); diary.add(B.build(litMat));
    const ln = quad(0.26, 0.17, basic({ map: K.canvasTexture(256, 170, (g, w, h) => { g.strokeStyle = "rgba(60,60,90,0.55)"; g.lineWidth = 3; for (let y = 22; y < h; y += 22) { g.beginPath(); g.moveTo(10, y); g.lineTo(w - 10 - (y * 7) % 60, y); g.stroke(); } }) }));
    ln.rotation.x = -90 * D; ln.position.y = 0.026; diary.add(ln);
  }
  addObj(diary);
  // brætspil på sofabordet dukker op, når telefonerne er lagt væk
  const boardTex = K.canvasTexture(256, 256, (g) => { for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) { g.fillStyle = (i + j) % 2 ? "#e7d7c1" : "#7a4a5a"; g.fillRect(i * 32, j * 32, 32, 32); } });
  const board = quad(0.48, 0.48, basic({ map: boardTex, opacity: 0, depthWrite: true })); board.rotation.x = -90 * D; board.position.set(TB.x, 0.435, TB.z); addObj(board);
  const pieces = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.022, 0.025, 0.035, 8), new THREE.MeshStandardMaterial({ color: "#ffffff" }), 8);
  for (let i = 0; i < 8; i++) { pieces.setMatrixAt(i, new THREE.Matrix4().makeTranslation(TB.x - 0.17 + (i % 4) * 0.11, 0.455, TB.z + (i < 4 ? -0.17 : 0.17))); pieces.setColorAt(i, new THREE.Color(i < 4 ? ROSE : "#2a1f2e")); }
  addObj(pieces);
  // ringe, der breder sig ud fra skuffen: eksperimentet mærkes i hele stuen
  const ripples = [0, 1, 2].map(() => { const r = new THREE.Mesh(new THREE.RingGeometry(0.95, 1.0, 48), basic({ color: ROSE, opacity: 0, side: THREE.DoubleSide })); r.rotation.x = -90 * D; r.position.set(SB.x + 0.4, 0.03, SB.z - 0.44); addObj(r); return r; });
  const st3 = kit.grp(root, `${SB.x + 0.5} 0 ${SB.z}`);
  kit.box(st3, "-0.5 0.45 0", 0.6, 0.9, 1.9, "opacity: 0; transparent: true; depthWrite: false");
  ctx.station("c1-3", st3);
  const s13 = ctx.sign(ctx.step("c1-3").title, { position: `${SB.x - 0.2} 2.35 ${SB.z - 1.25}`, width: 1.8, rotation: "0 50 0" });
  ctx.view("c1-3", { position: [0.6, 0, 1.5], lookAt: [-2.4, 0.9, -1.7] });

  /* ---------- Tilstand og animation ---------- */
  let cur = null, t0 = null;
  const tmpV = new THREE.Vector3();
  // stil en figur: (x, z), retning i grader, sidder?, hovedhældning, holder tingen?, skærmskær 0…1
  function pose(m, x, z, yaw, sit, headDown, holding, glowK, bounce = 0) {
    const F = m.fig;
    F.f.position.set(x, bounce, z); F.f.rotation.y = yaw * D;
    F.legsStand.visible = !sit; F.legsSit.visible = sit;
    F.upper.position.y = sit ? SEAT - F.hip + 0.04 : 0;
    F.head.rotation.x = headDown * D;
    F.armsHold.visible = holding; F.armsDown.visible = !holding;
    F.glow.material.opacity = 0.55 * glowK;
  }
  // tingen flyttes fra sin plads (eller lommen) til hånden; k = 0 … 1
  function devTo(m, k) {
    m.fig.f.updateMatrixWorld(true); m.fig.hand.getWorldPosition(tmpV);
    const yawF = m.fig.f.rotation.y;
    if (!m.home) { m.dev.visible = k > 0.02; m.dev.position.copy(tmpV); m.dev.rotation.set(-50 * D, yawF, 0, "YXZ"); return; }
    const [hx, hy, hz, rx, ry] = m.home;
    m.dev.visible = true;
    m.dev.position.set(lerp(hx, tmpV.x, k), lerp(hy, tmpV.y, k) + Math.sin(k * Math.PI) * 0.2, lerp(hz, tmpV.z, k));
    m.dev.rotation.set(lerp(rx * D, -50 * D, k), angLerp(ry * D, yawF, k), 0, "YXZ");
  }
  const devOn = (m, on) => { const sc = m.dev.userData.scr; if (sc) sc.material.color.set(on ? (m.kind === "tablet" ? "#ffd9a0" : m.kind === "pad" ? "#9fe3a0" : "#a9c6ff") : "#22232c"); };

  return {
    onStep(id) { cur = id; t0 = null; },
    tick(t) {
      if (t0 === null) t0 = t;
      const e = (t - t0) / 1000, s = t / 1000;
      /* familien */
      fam.forEach((m, i) => {
        const [ax, az, ay, asit] = m.at;
        devOn(m, true);
        if (cur === "c1-0") {
          // de kommer ind (forskudt), går hen til deres sted og tager teknologien op
          const t1 = e - 0.3 - i * 0.6;
          const k = ease(t1 / 2.4);
          const [fx, fz] = m.from;
          const x = lerp(fx, ax, k), z = lerp(fz, az, k);
          const walkYaw = Math.atan2(ax - fx, az - fz) / D;
          const arrive = ease((k - 0.8) / 0.2);
          const yaw = angLerp(walkYaw * D, ay * D, arrive) / D;
          const walking = k > 0 && k < 1;
          const pick = ease((t1 - 2.5) / 0.8);
          pose(m, x, z, yaw, asit && k >= 1, lerp(6, 28, pick), pick > 0.4, ease((t1 - 3.0) / 0.5), walking ? Math.abs(Math.sin(t1 * 7)) * 0.025 : 0);
          devTo(m, pick);
          return;
        }
        if (cur === "c1-3") {
          if (m.who === "Storesøster") {
            // hun rejser sig, går rundt om sofaen til skænken, lægger telefonen i skuffen og sætter sig igen
            const WP = [[ax, az], [ax + 0.15, SOF.z + 1.75], [SB.x + 0.85, SB.z - 0.44]];
            const w1 = ease((e - 0.3) / 1.1), w2 = ease((e - 1.4) / 1.3), put = ease((e - 2.8) / 1.0);
            const r1 = ease((e - 4.2) / 1.3), r2 = ease((e - 5.5) / 1.1);
            let x = lerp(WP[0][0], WP[1][0], w1), z = lerp(WP[0][1], WP[1][1], w1);
            x = lerp(x, WP[2][0], w2); z = lerp(z, WP[2][1], w2);
            x = lerp(x, WP[1][0], r1); z = lerp(z, WP[1][1], r1);
            x = lerp(x, WP[0][0], r2); z = lerp(z, WP[0][1], r2);
            let yaw = ay;
            if (e > 0.3) yaw = 0;
            if (e > 1.4) yaw = Math.atan2(WP[2][0] - WP[1][0], WP[2][1] - WP[1][1]) / D;
            if (e > 2.5) yaw = -90;
            if (e > 4.2) yaw = Math.atan2(WP[1][0] - WP[2][0], WP[1][1] - WP[2][1]) / D;
            if (e > 5.5) yaw = 180;
            if (e > 6.6) yaw = angLerp(Math.PI, ay * D, ease((e - 6.6) / 0.5)) / D;
            const moving = (w1 > 0 && w1 < 1) || (w2 > 0 && w2 < 1) || (r1 > 0 && r1 < 1) || (r2 > 0 && r2 < 1);
            const seated = e < 0.3 || e > 6.6;
            pose(m, x, z, yaw, seated, lerp(28, 6, put), put < 0.6, 1 - put, moving ? Math.abs(Math.sin(e * 7)) * 0.025 : 0);
            m.fig.f.updateMatrixWorld(true); m.fig.hand.getWorldPosition(tmpV);
            const dx = SB.x + 0.42, dy = 0.6, dz = SB.z - 0.44;
            m.dev.visible = e < 3.9;
            m.dev.position.set(lerp(tmpV.x, dx, put), lerp(tmpV.y, dy, put) + Math.sin(put * Math.PI) * 0.12, lerp(tmpV.z, dz, put));
            m.dev.rotation.set(lerp(-50 * D, -90 * D, put), -90 * D, 0, "YXZ");
            devOn(m, put < 0.9);
            return;
          }
          // de andre ændrer langsomt adfærd: kigger op, lægger tingen fra sig, vender sig mod hinanden
          const k = ease((e - 4.4 - i * 0.8) / 2.8);
          const [ox, oz, oy, osit] = m.off;
          const moving = (ox !== ax || oz !== az) && k > 0 && k < 1;
          pose(m, lerp(ax, ox, k), lerp(az, oz, k), angLerp(ay * D, oy * D, k) / D, k < 0.5 ? asit : osit, lerp(28, 4, k), k < 0.35, 1 - ease(k / 0.4), moving ? Math.abs(Math.sin(e * 7)) * 0.025 : 0);
          const dk = 1 - ease((k - 0.2) / 0.4);
          if (m.home) devTo(m, dk); else { devTo(m, dk > 0.5 ? 1 : 0); }
          devOn(m, k < 0.3);
          return;
        }
        // stille tilstand: alle bruger deres teknologi
        pose(m, ax, az, ay, asit, 28 + Math.sin(s * 0.7 + i) * 2, true, 0.85 + 0.15 * Math.sin(s * 2 + i));
        devTo(m, 1);
      });
      speaker.userData.scr.material.color.set(ROSE).multiplyScalar(0.55 + 0.45 * Math.sin(s * 3));
      tvScreen.material.opacity = cur === "c1-3" ? 1 - 0.7 * ease((e - 5) / 2) : 1;
      fields.forEach(q => { q.material.opacity = cur === "c1-0" ? 1 : cur === "c1-3" ? 0.25 : 0.5; });

      /* døgnurskiven */
      const D1 = cur === "c1-1";
      const hours = D1 ? Math.min(24, Math.max(0, (e - 0.5) * 2.6)) : 24;
      handM.rotation.y = -(hours / 24) * 2 * Math.PI; hub.visible = true;
      handM.visible = D1 && hours < 24;
      const M = new THREE.Matrix4(), cnt = [0, 0, 0];
      LOG.forEach(([hh, cat], i) => {
        const k = D1 ? ease((hours - hh) / 0.7) : 1;
        const pop = k * (1 + 0.45 * Math.sin(k * Math.PI));
        M.makeScale(Math.max(1e-4, pop), Math.max(1e-4, k), Math.max(1e-4, pop)); M.setPosition(...LOG[i].pos);
        dots.setMatrixAt(i, M); if (hours >= hh) cnt[cat]++;
      });
      dots.instanceMatrix.needsUpdate = true;
      bins.forEach((b, i) => { const target = (D1 ? cnt[i] : b.n) * 0.07; b.bar.scale.y = Math.max(0.001, lerp(b.bar.scale.y, target, 0.15)); });
      dialDisc.material.color.setScalar(D1 ? 1 : 0.75);
      legend.material.opacity = D1 ? 1 : 0.55;

      /* lagene */
      const L2 = cur === "c1-2" ? ease((e - 0.6) / 1.8) : 0;
      const sway = cur === "c1-2" ? Math.sin(s * 0.9) * 0.035 * ease((e - 2.4) / 1) : 0;
      const offs = [[-0.66, 0.1, 0.3], [0.0, -0.06, 0.55], [0.66, 0.16, 0.8]];
      layers.forEach((m, i) => {
        const [ox, oy, oz] = offs[i];
        m.position.set(ox * L2 + (i - 1) * sway, 1.5 + oy * L2, 0.06 + i * 0.015 + (oz - 0.06) * L2);
        m.rotation.set(-4 * D, (i - 1) * -12 * D * L2, (i - 1) * -3 * D * L2);
        m.material.opacity = cur === "c1-2" ? 0.95 : 0.3;
      });

      /* skuffen og ringene */
      const C3 = cur === "c1-3";
      const open = C3 ? ease((e - 2.4) / 0.5) * (1 - ease((e - 3.9) / 0.6)) : 0;
      drawer.position.x = SB.x + 0.24 + open * 0.34;
      board.material.opacity = C3 ? ease((e - 7.0) / 1.2) : 0;
      pieces.visible = C3 && e > 7.5;
      ripples.forEach((r, i) => {
        const ph = C3 ? (e - 4.0 - i * 1.1) / 3.3 : -1, pr = ph < 0 ? 0 : ph % 1;
        r.scale.setScalar(0.2 + pr * 5.0); r.material.opacity = ph < 0 ? 0 : 0.55 * (1 - pr);
      });
      setSignOpacity(s11, D1 ? 1 : 0.6); setSignOpacity(s12, cur === "c1-2" ? 1 : 0.6); setSignOpacity(s13, C3 ? 1 : 0.6);
    },
  };
}
