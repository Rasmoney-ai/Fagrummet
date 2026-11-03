/* C3 · Forsamlingssalen — Stillingtagen.
   En rund sal med bænke i trin (amfi) om en vægt i midten. Bag scenen tre nicher langs væggen:
   debatten (opdigtede, neutrale overskrifter og citatbobler i mange retninger), arkivet (gamle fremtidsbilleder)
   og samtalekredsen (stole i rundkreds om ét svævende spørgsmål). En dør fører tilbage til Gaden.
   c3-0: vægten tipper frem og tilbage og falder til ro; en lysende pil går fra vægten mod Gaden og videre mod Atelieret.
   c3-1/2/3: nichen åbner sig (lyset tændes, låget/porten løftes) og scenen spiller. */

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

  ctx.env({ background: "#0f0c1a" });

  /* ---------- Salen: cirkel med radius 8,5; scene og nicher mod nord (−z), indgang mod syd ---------- */
  const R = 8.5, H = 5.2;
  const S = batch(), G = batch();
  // gulv: mørkt træ i ringe, lys cirkel i midten (scenen)
  S.cyl(R + 0.2, R + 0.2, 0.1, "#3a2a2e", [0, -0.05, 0], [0, 0, 0], 48);
  S.cyl(2.4, 2.4, 0.06, "#5a3f45", [0, 0.03, 0], [0, 0, 0], 40);
  S.cyl(2.2, 2.2, 0.065, "#6b4b52", [0, 0.032, 0], [0, 0, 0], 40);
  // væg: 32 paneler med pilastre
  const NW = 32, NICHE_A = [-33.75 * D, 0, 33.75 * D];       // nicherne ligger på panelgrænser, så væggen kan åbnes rent
  const inNiche = a => NICHE_A.some(n => { let d = a - n; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; return Math.abs(d) < 7 * D; });
  for (let i = 0; i < NW; i++) {
    const a = (i + 0.5) / NW * Math.PI * 2, x = Math.sin(a) * (R + 0.15), z = -Math.cos(a) * (R + 0.15);
    if (inNiche(a)) continue;
    const w = 2 * Math.PI * (R + 0.15) / NW + 0.02;
    S.box(w, H, 0.25, i % 2 ? "#4a3240" : "#523848", [x, H / 2, z], [0, -a / D, 0]);
    const a2 = i / NW * Math.PI * 2;
    if (inNiche(a2) || Math.abs(a2 - Math.PI) < 1e-3) continue;      // ingen pilaster i nicher eller midt i døren
    S.box(0.22, H, 0.32, "#5e4252", [Math.sin(a2) * (R - 0.02), H / 2, -Math.cos(a2) * (R - 0.02)], [0, -a2 / D, 0]);
  }
  // kuppelloft: en lav kegle og en lysende oculus
  G.cyl(1.0, 1.0, 0.05, "#3a3260", [0, H + 2.15, 0], [0, 0, 0], 32);
  G.cyl(R + 0.45, R + 0.45, 0.3, "#3a2a36", [0, H, 0], [0, 0, 0], 48);
  // bænke i trin: tre ringe i en bue mod syd (siddende ser mod midten), afbrudt ved indgangen
  const ARC0 = 62 * D, ARC1 = 298 * D;    // målt fra nord med uret: åbent mod nicherne i nord
  for (let row = 0; row < 3; row++) {
    const rr = 4.0 + row * 1.1, hh = 0.25 + row * 0.38;
    const seg = 28;
    for (let i = 0; i < seg; i++) {
      const a = ARC0 + (ARC1 - ARC0) * (i + 0.5) / seg;
      if (Math.abs(a - Math.PI) < 9 * D) continue;          // gang mod indgangen
      const x = Math.sin(a) * rr, z = -Math.cos(a) * rr, w = (ARC1 - ARC0) / seg * rr + 0.02;
      S.box(w, hh, 1.05, row % 2 ? "#4d3540" : "#563c48", [x, hh / 2, z], [0, -a / D, 0]);                          // trin
      S.box(w - 0.04, 0.08, 0.5, "#9a6a58", [Math.sin(a) * (rr + 0.1), hh + 0.2, -Math.cos(a) * (rr + 0.1)], [0, -a / D, 0]);   // sæde
      S.box(w - 0.04, 0.06, 0.4, "#7a5244", [Math.sin(a) * (rr + 0.1), hh + 0.05, -Math.cos(a) * (rr + 0.1)], [0, -a / D, 0]);
    }
  }
  // lampetter rundt på væggen
  for (let i = 0; i < 12; i++) { const a = (i + 0.5) / 12 * Math.PI * 2; G.box(0.18, 0.36, 0.1, "#ffd9a8", [Math.sin(a) * (R - 0.12), 2.9, -Math.cos(a) * (R - 0.12)], [0, -a / D, 0]); }

  /* tre nicher i nordvæggen: −35°, 0°, +35° */
  const NICHES = [
    { id: "c3-1", a: NICHE_A[0], col: "#ffb3c9" },
    { id: "c3-2", a: NICHE_A[1], col: "#ffd9a0" },
    { id: "c3-3", a: NICHE_A[2], col: "#e2c9ff" },
  ];
  const ND = 3.0, NWID = 3.0, NH = 3.0;     // dybde, bredde, højde
  NICHES.forEach(n => {
    // en niche er et lille rum bag en åbning i væggen; vi bygger den i lokale koordinater (åbning ved z = 0, ind mod −z)
    const g = new THREE.Group(); g.position.set(Math.sin(n.a) * R, 0, -Math.cos(n.a) * R); g.rotation.y = -n.a; n.g = g;
    const B = batch();
    B.box(NWID, 0.06, ND, "#2c2230", [0, 0.03, -ND / 2]);
    B.box(0.2, NH, ND, "#3a2a36", [-NWID / 2 - 0.1, NH / 2, -ND / 2]); B.box(0.2, NH, ND, "#3a2a36", [NWID / 2 + 0.1, NH / 2, -ND / 2]);
    B.box(NWID + 0.4, NH, 0.2, "#33252f", [0, NH / 2, -ND - 0.1]);
    B.box(NWID + 0.4, 0.2, ND, "#2a1f28", [0, NH + 0.1, -ND / 2]);
    // portal (bue med søjler) i salens væg
    B.box(0.36, NH + 0.4, 0.5, "#6b4c5c", [-NWID / 2 - 0.18, (NH + 0.4) / 2, 0.05]); B.box(0.36, NH + 0.4, 0.5, "#6b4c5c", [NWID / 2 + 0.18, (NH + 0.4) / 2, 0.05]);
    B.box(NWID + 0.72, 0.4, 0.5, "#6b4c5c", [0, NH + 0.2, 0.05]);
    B.box(NWID + 1.0, H - NH - 0.4, 0.3, "#4a3240", [0, NH + 0.4 + (H - NH - 0.4) / 2, 0.15]);
    g.add(B.build(litMat));
    // lysrand langs portalen (tændes, når nichen er aktiv)
    n.rim = new THREE.Mesh(new THREE.BoxGeometry(NWID + 0.1, 0.05, 0.05), new THREE.MeshBasicMaterial({ color: n.col })); n.rim.position.set(0, NH - 0.03, 0.3); g.add(n.rim);
    // et "låg" (rulleport) der løftes, når trinnet vælges
    n.lid = new THREE.Mesh(new THREE.PlaneGeometry(NWID, NH), new THREE.MeshStandardMaterial({ color: "#3d2c38", roughness: 0.9, side: THREE.DoubleSide }));
    n.lid.position.set(0, NH / 2, -0.05); g.add(n.lid);
    // et blødt lys i nichen (additivt plan bag indholdet)
    n.glow = quad(NWID * 1.3, NH * 1.1, basic({ map: K.glowTex(n.col), blending: THREE.AdditiveBlending, opacity: 0 })); n.glow.position.set(0, NH / 2, -ND + 0.12); g.add(n.glow);
    n.content = new THREE.Group(); n.content.position.z = -ND / 2; g.add(n.content);
    addObj(g);
  });
  addObj(S.build(litMat)); addObj(G.build(glowMat));
  { const dome = new THREE.Mesh(new THREE.ConeGeometry(R + 0.45, 2.2, 48, 1, true), new THREE.MeshBasicMaterial({ map: K.canvasTexture(64, 256, (c, w, h) => { const gr = c.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, "#1a1428"); gr.addColorStop(1, "#4a3446"); c.fillStyle = gr; c.fillRect(0, 0, w, h); }), side: THREE.BackSide })); dome.position.y = H + 0.15 + 1.1; addObj(dome); }
  addObj(new THREE.PointLight("#ffd2b0", 7, 12, 1.4), root, "0 4.2 1.0");
  const nicheLight = new THREE.PointLight("#ffd9e6", 0, 5, 1.6); addObj(nicheLight);

  /* ---------- Skilt med rummets navn og dør tilbage til Gaden (i syd ved indgangen) ---------- */
  ctx.door(ctx.room.parent, { position: `0 0 ${R - 0.3}`, rotation: "0 180 0" });
  ctx.sign(ctx.room.name, { position: `0 4.0 ${R - 0.35}`, rotation: "0 180 0", width: 2.8, sub: ctx.room.sub });

  // hjælper: position i salen ud fra vinkel (fra nord, med uret) og radius
  const polar = (a, r, y = 0) => [Math.sin(a) * r, y, -Math.cos(a) * r];
  const yawDeg = a => -a / D;    // drejning, så noget vender ind mod midten

  /* ---------- c3-0: vægten ---------- */
  const scale = new THREE.Group(); addObj(scale);
  {
    const B = batch();
    B.cyl(0.55, 0.7, 0.2, "#3a2a36", [0, 0.1, 0], [0, 0, 0], 24);
    B.cyl(0.08, 0.12, 1.7, "#c9a86a", [0, 1.05, 0], [0, 0, 0], 12);
    B.sph(0.12, "#e0c27e", [0, 1.95, 0], 12);
    scale.add(B.build(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.35, metalness: 0.55, flatShading: true })));
  }
  const brass = new THREE.MeshStandardMaterial({ color: "#d8b46e", roughness: 0.35, metalness: 0.6, flatShading: true });
  const beam = new THREE.Group(); beam.position.y = 1.95; scale.add(beam);
  beam.add(new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.06, 0.08), brass));
  const pointer = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.36, 8), brass); pointer.position.y = 0.2; beam.add(pointer);
  const pans = [-1, 1].map(side => {
    const hang = new THREE.Group(); hang.position.x = side * 1.15; beam.add(hang);
    const cords = THREE.BufferGeometryUtils.mergeGeometries([0, 1, 2].map(k => { const a = k / 3 * Math.PI * 2; const g = new THREE.CylinderGeometry(0.006, 0.006, 0.78, 4); g.translate(0, -0.39, 0); g.rotateZ(Math.sin(a) * 0.32); g.rotateX(-Math.cos(a) * 0.32); return g; }));
    hang.add(new THREE.Mesh(cords, brass));
    const pan = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.24, 0.07, 20), brass); pan.position.y = -0.76; hang.add(pan);
    return { hang, pan };
  });
  // venstre skål: egne undersøgelser (små klodser i rosa); højre skål: principielle diskussioner (små talebobler)
  {
    const cubes = new THREE.InstancedMesh(new THREE.BoxGeometry(0.11, 0.11, 0.11), new THREE.MeshStandardMaterial({ color: "#ff8fb1", roughness: 0.5, flatShading: true }), 6);
    for (let i = 0; i < 6; i++) cubes.setMatrixAt(i, new THREE.Matrix4().compose(new THREE.Vector3((i % 3 - 1) * 0.13, -0.66 + Math.floor(i / 3) * 0.11, (i % 2) * 0.08 - 0.04), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, i, 0)), new THREE.Vector3(1, 1, 1)));
    pans[0].hang.add(cubes);
    const bubG = THREE.BufferGeometryUtils.mergeGeometries([new THREE.SphereGeometry(0.1, 10, 6).scale(1.2, 0.85, 0.6), new THREE.ConeGeometry(0.035, 0.08, 6).rotateZ(2.5).translate(-0.08, -0.08, 0)].map(g => g.toNonIndexed()));
    const bubs = new THREE.InstancedMesh(bubG, new THREE.MeshStandardMaterial({ color: "#f3eef6", roughness: 0.5, flatShading: true }), 4);
    for (let i = 0; i < 4; i++) bubs.setMatrixAt(i, new THREE.Matrix4().compose(new THREE.Vector3((i % 2 - 0.5) * 0.2, -0.62 + Math.floor(i / 2) * 0.15, (i % 2) * 0.06), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, i * 1.3, 0)), new THREE.Vector3(1, 1, 1)));
    pans[1].hang.add(bubs);
  }
  const panLabel = (txt) => K.canvasTexture(560, 120, (g, w, h) => { g.fillStyle = "rgba(20,14,26,0.88)"; K.roundRect(g, 3, 3, w - 6, h - 6, 40); g.fill(); g.strokeStyle = C.c; g.lineWidth = 5; g.stroke(); g.fillStyle = "#fff"; g.font = BODY(600, 46); g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(txt, w / 2, h / 2 + 2); });
  const panLabels = [["egne undersøgelser", 0], ["principielle diskussioner", 1]].map(([t, i]) => { const q = quad(1.12, 0.24, basic({ map: panLabel(t) })); pans[i].hang.add(q); q.position.set(0, -1.08, -0.02); q.rotation.y = Math.PI; return q; });
  // pilen på gulvet: fra vægten mod døren til Gaden (rosa), derefter videre mod Atelieret (ravgul)
  const arrowPts = [new THREE.Vector3(0, 0.08, 0.75), new THREE.Vector3(0.0, 0.08, 3.0), new THREE.Vector3(0, 0.08, R - 1.5)];
  const arrowCurve = new THREE.CatmullRomCurve3(arrowPts);
  const arrowGeo = (() => {    // et fladt bånd langs kurven
    const N = 60, pos = [], idx = [];
    for (let i = 0; i <= N; i++) { const t = i / N, p = arrowCurve.getPoint(t), tg = arrowCurve.getTangent(t), nx = -tg.z, nz = tg.x, w = 0.22; pos.push(p.x + nx * w, p.y, p.z + nz * w, p.x - nx * w, p.y, p.z - nz * w); if (i < N) { const k = i * 2; idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); } }
    const p = arrowCurve.getPoint(1), tg = arrowCurve.getTangent(1), nx = -tg.z, nz = tg.x, b = pos.length / 3;
    pos.push(p.x + nx * 0.5, p.y, p.z + nz * 0.5, p.x - nx * 0.5, p.y, p.z - nz * 0.5, p.x + tg.x * 0.8, p.y, p.z + tg.z * 0.8); idx.push(b, b + 1, b + 2);
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); return g;
  })();
  const arrowMat = basic({ color: C.c, opacity: 0.9, side: THREE.DoubleSide });
  const arrow = new THREE.Mesh(arrowGeo, arrowMat); addObj(arrow);
  const arrowGlow = quad(1.4, R - 1.0, basic({ map: K.glowTex(C.c), blending: THREE.AdditiveBlending, opacity: 0 })); arrowGlow.rotation.x = -90 * D; arrowGlow.position.set(0, 0.075, R / 2); addObj(arrowGlow);
  const ARROW_TRIS = arrowGeo.index.count;
  // over døren (som rammen skilter "Tilbage: …"): en ravgul pil videre mod nye handlinger, i Atelierets farve (C.a)
  const onTex = K.canvasTexture(900, 150, (g, w, h) => {
    g.fillStyle = "rgba(20,14,26,0.9)"; K.roundRect(g, 3, 3, w - 6, h - 6, 40); g.fill(); g.strokeStyle = C.a; g.lineWidth = 6; g.stroke();
    g.fillStyle = C.a; g.beginPath(); g.moveTo(60, 50); g.lineTo(120, 50); g.lineTo(120, 30); g.lineTo(160, 75); g.lineTo(120, 120); g.lineTo(120, 100); g.lineTo(60, 100); g.closePath(); g.fill();
    g.fillStyle = "#fff"; g.font = BODY(600, 50); g.textBaseline = "middle"; g.fillText("… og videre: nye handlinger", 190, h / 2 + 2);
  });
  const onward = quad(2.5, 0.417, basic({ map: onTex, opacity: 0 })); window.__dbgOn = onward; onward.position.set(0, 2.62, R - 0.55); onward.scale.setScalar(0.72); onward.rotation.set(-10 * D, Math.PI, 0); addObj(onward);
  const st0 = kit.grp(root, "0 0 0");
  kit.box(st0, "0 1.2 0", 2.6, 2.4, 0.8, "opacity: 0; transparent: true; depthWrite: false");
  ctx.station("c3-0", st0);
  const s30 = ctx.sign(ctx.step("c3-0").title, { position: "0 3.05 0", width: 1.6, rotation: "0 180 0" });
  ctx.view("c3-0", { position: [1.3, 0, -3.3], lookAt: [-0.15, 1.35, 3.0] });

  /* ---------- nichernes indhold ---------- */
  const N1 = NICHES[0], N2 = NICHES[1], N3 = NICHES[2];
  NICHES.forEach(n => {
    // stationen ligger foran portalen; skiltet sidder over åbningen
    const sp = polar(n.a, R - 0.9);
    const st = kit.grp(root, `${sp[0]} 0 ${sp[2]}`);
    kit.box(st, "0 1.4 0", 2.6, 2.8, 0.4, "opacity: 0; transparent: true; depthWrite: false", { rotation: `0 ${yawDeg(n.a)} 0` });
    ctx.station(n.id, st);
    const sg = polar(n.a, R - 0.45, NH + 0.5);
    n.sign = ctx.sign(ctx.step(n.id).title, { position: sg.join(" "), rotation: `0 ${yawDeg(n.a)} 0`, width: 2.3, size: 64 });
    const vp = polar(n.a, R - 3.4), la = polar(n.a, R + 0.6, 2.0);
    ctx.view(n.id, { position: vp, lookAt: la });
  });

  /* c3-1 debatten: overskrifter på bagvæggen, citatbobler i mange retninger */
  const HEADS = [
    "Skal der være aldersgrænse på sociale medier?",
    "Lærere: AI i skolen kræver nye fælles regler",
    "Forældre er delte om digitale aldersgrænser",
    "Elever: Vi vil være med til at bestemme",
    "Forsker: Forbud alene løser ikke problemet",
  ];
  const newsTex = (t, i) => K.canvasTexture(640, 400, (g, w, h) => {
    g.fillStyle = "#f4efe4"; g.fillRect(0, 0, w, h); g.fillStyle = "#2a2530"; g.fillRect(0, 0, w, 14);
    g.font = FONT(700, 54); g.fillStyle = "#1e1a24"; K.wrap(g, t, w - 60).slice(0, 3).forEach((l, k) => g.fillText(l, 30, 84 + k * 60));
    g.fillStyle = "#b9b2a4"; for (let k = 0; k < 6; k++) g.fillRect(30 + (k % 2) * 300, 280 + Math.floor(k / 2) * 30, 270, 12);
    g.fillStyle = ["#d8c1c8", "#c5ccd8", "#d5d0c0"][i % 3]; g.fillRect(w - 170, 250, 140, 120);
  });
  const heads = HEADS.map((t, i) => {
    const q = quad(1.05, 0.66, basic({ map: newsTex(t, i), side: THREE.DoubleSide, depthWrite: true }));
    const px = [-0.95, 0.15, 1.0, -0.5, 0.65][i], py = [2.25, 2.45, 1.95, 1.3, 1.15][i];
    q.position.set(px, py, -ND / 2 + 0.1 + i * 0.01); q.rotation.z = [-6, 3, -2, 5, -4][i] * D; N1.content.add(q); return q;
  });
  const QUOTES = [
    ["Børn skal beskyttes bedre", -1], ["Unge skal lære at navigere selv", 1], ["Platformene må tage ansvar", -1],
    ["AI kan hjælpe dem, der har svært ved at skrive", 1], ["AI gør det for let at springe over", -1], ["Hvad viser vores egen undersøgelse?", 0],
  ];
  const quoteTex = (t, side, mine) => K.canvasTexture(620, 220, (g, w, h) => {
    g.fillStyle = mine ? "#ffe2ec" : "#ffffff"; K.roundRect(g, 6, 6, w - 12, h - 60, 40); g.fill();
    g.beginPath(); const tx = side < 0 ? 110 : side > 0 ? w - 110 : w / 2; g.moveTo(tx - 26, h - 56); g.lineTo(tx + (side || 0) * 30, h - 6); g.lineTo(tx + 26, h - 56); g.fill();
    g.strokeStyle = mine ? C.c : "#a89aa8"; g.lineWidth = 5; K.roundRect(g, 6, 6, w - 12, h - 60, 40); g.stroke();
    g.fillStyle = "#2a2230"; g.font = BODY(600, 46); g.textAlign = "center"; g.textBaseline = "middle"; const ls = K.wrap(g, t, w - 70).slice(0, 2); ls.forEach((l, k) => g.fillText(l, w / 2, (h - 54) / 2 - (ls.length - 1) * 24 + k * 50));
  });
  const quotes = QUOTES.map(([t, side], i) => {
    const q = quad(0.95, 0.337, basic({ map: quoteTex(t, side, i === 5), side: THREE.DoubleSide })); N1.content.add(q);
    q.userData.base = [[-0.95, 1.55, 0.55], [0.95, 1.75, 0.35], [-0.6, 2.7, 0.75], [0.75, 2.75, 0.85], [0.95, 0.95, 0.9], [-0.15, 0.75, 1.15]][i];
    q.userData.rot = [[0, 25, -6], [0, -28, 5], [10, 15, 8], [-6, -20, -7], [0, -35, 4], [0, 0, 0]][i];
    return q;
  });
  // et argument fra elevernes egen undersøgelse: en lille døgnurskive, der løfter sig op til den sidste boble
  const argTex = K.canvasTexture(256, 256, (g, w) => { const c = w / 2; g.fillStyle = "#24182a"; g.beginPath(); g.arc(c, c, c - 4, 0, 7); g.fill(); g.strokeStyle = C.c; g.lineWidth = 10; g.stroke(); const cols = ["#ffc56b", "#ff6f9e", "#8fb2ff"]; for (let i = 0; i < 16; i++) { const a = (6 + i) / 24 * Math.PI * 2 - Math.PI / 2, r = c * [0.38, 0.55, 0.72][i % 3]; g.fillStyle = cols[i % 3]; g.beginPath(); g.arc(c + Math.cos(a) * r, c + Math.sin(a) * r, 11, 0, 7); g.fill(); } });
  const argDisc = quad(0.3, 0.3, basic({ map: argTex, side: THREE.DoubleSide })); N1.content.add(argDisc);

  /* c3-2 arkivet: arkivskabe, en tidslinje af gamle fremtidsbilleder og to små modeller */
  {
    const B = batch();
    for (const sx of [-1, 1]) for (let k = 0; k < 2; k++) {
      B.box(0.55, 1.3, 0.55, "#6b5a4a", [sx * 1.15, 0.65, -0.6 + k * 0.65]);
      for (let d = 0; d < 3; d++) { B.box(0.5, 0.36, 0.02, "#7d6a58", [sx * 1.15 - sx * 0.01, 0.25 + d * 0.41, -0.6 + k * 0.65 + 0.28]); B.box(0.12, 0.03, 0.03, "#d6c3a6", [sx * 1.15, 0.33 + d * 0.41, -0.6 + k * 0.65 + 0.3]); }
    }
    B.box(0.9, 0.8, 0.6, "#5a4a3c", [0, 0.4, -0.6]);
    B.cyl(0.18, 0.22, 0.3, "#4a3d32", [0, 0.95, -0.6], [0, 0, 0], 12);
    const mesh = B.build(litMat); mesh.rotation.y = 0; N2.content.add(mesh);
  }
  const OLD = [
    { y: "ca. 1450", t: "trykpressen", draw: g => { g.fillStyle = "#5b4636"; g.fillRect(70, 120, 30, 180); g.fillRect(220, 120, 30, 180); g.fillRect(60, 100, 200, 30); g.fillRect(90, 210, 140, 24); g.beginPath(); g.moveTo(160, 130); g.lineTo(160, 210); g.lineWidth = 10; g.strokeStyle = "#5b4636"; g.stroke(); g.fillRect(40, 300, 240, 16); } },
    { y: "ca. 1800", t: "vævestolen", draw: g => { g.strokeStyle = "#5b4636"; g.lineWidth = 8; g.strokeRect(60, 110, 200, 190); for (let i = 0; i < 12; i++) { g.beginPath(); g.moveTo(80 + i * 15, 120); g.lineTo(80 + i * 15, 290); g.lineWidth = 2; g.stroke(); } g.lineWidth = 8; g.beginPath(); g.moveTo(50, 200); g.lineTo(270, 200); g.stroke(); } },
    { y: "1950'erne", t: "en computer fylder et rum", draw: g => { g.fillStyle = "#5b4636"; for (let i = 0; i < 4; i++) { g.fillRect(40 + i * 62, 110, 50, 190); g.fillStyle = "#e9dcc3"; for (let k = 0; k < 6; k++) g.fillRect(50 + i * 62, 125 + k * 26, 12, 12); g.fillStyle = "#5b4636"; } g.beginPath(); g.arc(190, 330, 14, 0, 7); g.fill(); g.fillRect(180, 300, 20, 30); } },
    { y: "1960'erne", t: "den flyvende bil", draw: g => { g.fillStyle = "#5b4636"; g.beginPath(); g.ellipse(160, 200, 110, 34, 0, 0, 7); g.fill(); g.beginPath(); g.ellipse(160, 175, 50, 28, 0, Math.PI, 0); g.fill(); g.strokeStyle = "#5b4636"; g.lineWidth = 4; for (let i = 0; i < 5; i++) { g.beginPath(); g.moveTo(80 + i * 40, 250); g.lineTo(70 + i * 40, 300); g.stroke(); } g.beginPath(); g.arc(250, 110, 22, 0, 7); g.stroke(); } },
    { y: "1990'erne", t: "internettet gør alle lige", draw: g => { g.strokeStyle = "#5b4636"; g.lineWidth = 6; g.beginPath(); g.arc(160, 200, 90, 0, 7); g.stroke(); g.beginPath(); g.ellipse(160, 200, 40, 90, 0, 0, 7); g.stroke(); g.beginPath(); g.moveTo(70, 200); g.lineTo(250, 200); g.stroke(); g.beginPath(); g.moveTo(85, 155); g.lineTo(235, 155); g.moveTo(85, 245); g.lineTo(235, 245); g.stroke(); for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; g.fillStyle = "#5b4636"; g.beginPath(); g.arc(160 + Math.cos(a) * 125, 200 + Math.sin(a) * 125, 10, 0, 7); g.fill(); } } },
  ];
  const oldTex = o => K.canvasTexture(320, 440, (g, w, h) => {
    g.fillStyle = "#e9dcc3"; g.fillRect(0, 0, w, h); g.fillStyle = "rgba(120,90,60,0.12)"; for (let i = 0; i < 40; i++) g.fillRect(Math.random() * w, Math.random() * h, 3, 3);
    g.strokeStyle = "#a98e6a"; g.lineWidth = 6; g.strokeRect(12, 12, w - 24, h - 24);
    g.fillStyle = "#5b4636"; g.font = FONT(700, 30); g.textAlign = "center"; g.fillText(o.y, w / 2, 64); g.textAlign = "left";
    o.draw(g); g.fillStyle = "#3e3024"; g.font = BODY(600, 28); g.textAlign = "center"; K.wrap(g, o.t, w - 50).forEach((l, k) => g.fillText(l, w / 2, 376 + k * 32));
  });
  const archive = OLD.map((o, i) => { const q = quad(0.58, 0.8, basic({ map: oldTex(o), side: THREE.DoubleSide, depthWrite: true })); N2.content.add(q); return q; });
  const timeline = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.02, 0.02), new THREE.MeshBasicMaterial({ color: "#d9b27a" })); timeline.position.set(0, 1.58, -1.22); timeline.scale.x = 1.15; N2.content.add(timeline);
  // modeller: en lille flyvende bil på sin sokkel
  const car = new THREE.Group(); car.position.set(0, 1.45, -0.6); car.scale.setScalar(1.3); N2.content.add(car);
  {
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.22, 14, 8).scale(1.4, 0.45, 0.8), new THREE.MeshStandardMaterial({ color: "#e8a0b8", roughness: 0.4, metalness: 0.3, flatShading: true })); car.add(body);
    const dome = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), basic({ color: "#cfe9ff", opacity: 0.6 })); dome.position.y = 0.06; car.add(dome);
    const fins = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.12, 0.2), new THREE.MeshStandardMaterial({ color: "#c97a92" })); fins.position.set(-0.28, 0.06, 0); car.add(fins);
    const flame = quad(0.3, 0.3, basic({ map: K.glowTex("#ffd9a0"), blending: THREE.AdditiveBlending, opacity: 0.8 })); flame.position.set(0, -0.12, 0); flame.rotation.x = -90 * D; car.add(flame);
  }

  /* c3-3 samtalekredsen: stole i rundkreds om ét svævende spørgsmål */
  const ring = new THREE.Group(); ring.position.set(0, 0, 0.1); N3.content.add(ring);
  const CH = 7, CR = 0.95;
  {
    const B = batch();
    for (let i = 0; i < CH; i++) {
      const a = i / CH * Math.PI * 2 + Math.PI / CH, x = Math.sin(a) * CR, z = Math.cos(a) * CR, ry = a / D + 180;
      const off = (dx, dz) => [x + Math.sin(a) * dz + Math.cos(a) * dx, z + Math.cos(a) * dz - Math.sin(a) * dx];
      const [sx, sz] = off(0, 0); B.box(0.4, 0.05, 0.4, "#b48a63", [sx, 0.45, sz], [0, ry, 0]);
      const [bx, bz] = off(0, 0.2); B.box(0.4, 0.45, 0.04, "#9c7a5a", [bx, 0.7, bz], [0, ry, 0]);
      for (const [dx, dz] of [[-0.17, -0.17], [0.17, -0.17], [-0.17, 0.17], [0.17, 0.17]]) { const [lx, lz] = off(dx, dz); B.box(0.03, 0.45, 0.03, "#7a5c44", [lx, 0.225, lz]); }
    }
    B.cyl(CR + 0.45, CR + 0.45, 0.012, "#5a4a6a", [0, 0.006, 0], [0, 0, 0], 32);
    ring.add(B.build(litMat));
  }
  // fire siddende silhuetter (lavt, enkelt)
  {
    const sil = new THREE.MeshStandardMaterial({ color: "#2a1f2e", roughness: 0.9, flatShading: true, emissive: "#3a2238", emissiveIntensity: 0.35 });
    const parts = [];
    for (const i of [0, 2, 3, 5]) {
      const a = i / CH * Math.PI * 2 + Math.PI / CH, x = Math.sin(a) * CR, z = Math.cos(a) * CR, ix = -Math.sin(a), iz = -Math.cos(a);
      parts.push(capsule([x - ix * 0.05, 0.6, z - iz * 0.05], [x - ix * 0.02, 0.98, z - iz * 0.02], 0.14));
      parts.push(new THREE.SphereGeometry(0.1, 10, 6).translate(x, 1.17, z));
      parts.push(capsule([x, 0.5, z], [x + ix * 0.32, 0.5, z + iz * 0.32], 0.07));
      parts.push(capsule([x + ix * 0.32, 0.5, z + iz * 0.32], [x + ix * 0.36, 0.06, z + iz * 0.36], 0.06));
    }
    ring.add(new THREE.Mesh(mergeClean(parts), sil));
  }
  const ASKS = ["Hvem har ansvaret, når en algoritme tager fejl?", "Må en maskine afgøre, hvem der får et job?", "Er en digital dobbeltgænger en del af mig?"];
  const askTex = ASKS.map(t => K.canvasTexture(900, 300, (g, w, h) => {
    g.clearRect(0, 0, w, h); g.fillStyle = "rgba(25,18,34,0.9)"; K.roundRect(g, 6, 6, w - 12, h - 12, 50); g.fill(); g.strokeStyle = "#f3d9ff"; g.lineWidth = 6; g.stroke();
    g.fillStyle = "#fff"; g.font = FONT(700, 64); g.textAlign = "center"; g.textBaseline = "middle"; const ls = K.wrap(g, t, w - 90); ls.forEach((l, k) => g.fillText(l, w / 2, h / 2 - (ls.length - 1) * 37 + k * 74));
  }));
  const askQ = quad(2.0, 0.667, basic({ map: askTex[0], side: THREE.DoubleSide })); askQ.position.set(0, 2.3, 0.1); N3.content.add(askQ);
  const qOrb = new THREE.Mesh(new THREE.SphereGeometry(0.14, 16, 10), new THREE.MeshBasicMaterial({ color: "#f3d9ff" })); qOrb.position.set(0, 1.5, 0.1); N3.content.add(qOrb);
  const qGlow = quad(1.4, 1.4, basic({ map: K.glowTex("#e2c9ff"), blending: THREE.AdditiveBlending, opacity: 0.7 })); qGlow.position.set(0, 1.5, 0.1); N3.content.add(qGlow);
  const qMark = quad(0.3, 0.3, basic({ map: K.canvasTexture(128, 128, (g, w) => { g.fillStyle = "#2a1f3a"; g.font = FONT(700, 110); g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("?", w / 2, w / 2 + 6); }), side: THREE.DoubleSide })); qMark.position.set(0, 1.5, 0.25); N3.content.add(qMark);

  /* ---------- Tilstand og animation ---------- */
  let cur = null, t0 = null;
  const tmpV = new THREE.Vector3();
  return {
    onStep(id) { cur = id; t0 = null; },
    tick(t, dt) {
      if (t0 === null) t0 = t;
      const e = (t - t0) / 1000, s = t / 1000;
      /* vægten: dæmpet svingning i c3-0, ellers i ro (let åndedræt) */
      let tilt;
      if (cur === "c3-0") tilt = 15 * D * Math.exp(-e * 0.5) * Math.cos(e * 2.4) + 2 * D * (1 - Math.exp(-e * 0.5));
      else tilt = 2 * D + Math.sin(s * 0.6) * 0.3 * D;
      beam.rotation.z = tilt;
      pans.forEach(p => { p.hang.rotation.z = -tilt; });
      const settled = cur === "c3-0" ? Math.min(1, Math.max(0, (e - 5.5) / 1.0)) : 0;
      // pilen: tegnes frem, når vægten er faldet til ro
      const ak = cur === "c3-0" ? ease((e - 5.5) / 1.6) : 0.0;
      arrow.geometry.setDrawRange(0, ak >= 1 ? ARROW_TRIS : Math.floor((ARROW_TRIS - 3) * ak / 6) * 6);
      arrow.visible = ak > 0;
      arrowMat.opacity = 0.7 + 0.25 * Math.sin(s * 3); arrowGlow.material.opacity = 0.6 * ak;
      onward.material.opacity = cur === "c3-0" ? ease((e - 7.0) / 0.6) : 0;
      panLabels.forEach(q => { q.material.opacity = cur === "c3-0" ? 1 : 0.45; });
      void settled;

      /* nicherne: låget løftes og lyset tændes i den aktive niche */
      let anyOn = false;
      NICHES.forEach(n => {
        const on = cur === n.id;
        const k = on ? ease((e - 0.2) / 1.0) : 0;
        n.lid.position.y = NH / 2 + k * (NH + 0.05); n.lid.visible = k < 0.99;
        n.glow.material.opacity = on ? 0.75 * k : 0;
        n.rim.material.color.set(n.col).multiplyScalar(on ? 1 : 0.35);
        setSignOpacity(n.sign, on ? 1 : 0.6);
        if (on) { anyOn = true; n.g.updateMatrixWorld(true); tmpV.set(0, 2.2, -ND / 2 + 0.6).applyMatrix4(n.g.matrixWorld); nicheLight.position.copy(tmpV); nicheLight.color.set(n.col); nicheLight.intensity = 8 * k; }
        if (!on && cur !== "c3-0") { n.lid.position.y = NH / 2; n.lid.visible = true; }
        if (cur === "c3-0") { n.lid.visible = true; n.lid.position.y = NH / 2; }
      });
      if (!anyOn) nicheLight.intensity = 0;
      setSignOpacity(s30, cur === "c3-0" ? 1 : 0.6);

      /* debatten: bobler dukker op én ad gangen og svæver i hver sin retning; den sidste er elevernes egen */
      const A1 = cur === "c3-1";
      heads.forEach((q, i) => { const k = A1 ? ease((e - 0.8 - i * 0.25) / 0.5) : 0.6; q.material.opacity = k; });
      quotes.forEach((q, i) => {
        const k = A1 ? ease((e - 1.8 - i * 0.7) / 0.5) : 0;
        const [bx, by, bz] = q.userData.base, [rx, ry, rz] = q.userData.rot;
        q.position.set(bx + Math.sin(s * 0.7 + i) * 0.03, by + Math.sin(s * 0.9 + i * 2) * 0.04 - (1 - k) * 0.2, bz);
        q.rotation.set(rx * D, ry * D, rz * D); q.material.opacity = k; q.scale.setScalar(0.7 + 0.3 * k);
      });
      { const k = A1 ? ease((e - 6.3) / 0.8) : 0; argDisc.material.opacity = k; argDisc.position.set(-0.15 + 0.55, lerp(0.2, 0.78, k), 1.2); argDisc.rotation.set(0, 0, s * 0.4); }

      /* arkivet: billederne trækkes op af skufferne og hænger sig langs tidslinjen; den flyvende bil svæver */
      const A2 = cur === "c3-2";
      archive.forEach((q, i) => {
        const k = A2 ? ease((e - 0.9 - i * 0.55) / 0.8) : 1;
        const tx = -1.2 + i * 0.6, ty = 2.05, tz = -1.2;
        const fx = (i % 2 ? 1.15 : -1.15), fy = 1.0, fz = -0.2;
        q.position.set(lerp(fx, tx, k), lerp(fy, ty, k) + Math.sin(k * Math.PI) * 0.3, lerp(fz, tz, k));
        q.rotation.set(0, 0, (1 - k) * (i % 2 ? -20 : 20) * D + ((i * 37) % 7 - 3) * D * k);
        q.material.opacity = A2 ? Math.min(1, k * 3) : 0.8;
      });
      car.position.y = 1.2 + (A2 ? 0.08 * Math.sin(s * 1.8) : 0); car.rotation.y = A2 ? s * 0.5 : 0.6;

      /* samtalekredsen: spørgsmålet svæver over stolene og skifter langsomt */
      const A3 = cur === "c3-3";
      const qi = A3 ? Math.floor(Math.max(0, e - 0.5) / 4.5) % ASKS.length : 0;
      if (askQ.material.map !== askTex[qi]) { askQ.material.map = askTex[qi]; askQ.material.needsUpdate = true; }
      const ph = A3 ? ((Math.max(0, e - 0.5)) % 4.5) / 4.5 : 0.5;
      askQ.material.opacity = A3 ? Math.min(ease(ph / 0.12), ease((1 - ph) / 0.12)) : 0.6;
      askQ.position.y = 2.3 + Math.sin(s * 1.1) * 0.04;
      qOrb.position.y = 1.5 + Math.sin(s * 1.4) * 0.06; qMark.position.y = qOrb.position.y; qGlow.position.y = qOrb.position.y;
      qGlow.material.opacity = (A3 ? 0.75 : 0.35) + 0.15 * Math.sin(s * 3);
      ring.rotation.y = 0;
    },
  };
}
