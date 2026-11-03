/* C2 · Bag skærmen — Teknologiens rolle og intention.
   Et lyst værksted (træ, hulplade, planter, ovenlys). På det store bord folder en telefon sig ud i lag:
   hardware, data, algoritme og app (skærmen øverst, resten "bag skærmen").
   c2-0: telefonen folder sig ud, og hvert lag får et mærke. En lille tavle med Hjorths fem spørgsmål.
   c2-1: en lup svæver over lagene; spørgsmålstegn og spørgsmål lyser op, hvor den peger.
   c2-2: tre maskiner får samme input: deterministisk (samme output), adaptiv (output glider mod brugerens valg),
         generativ (noget nyt hver gang). Rækken af output viser forskellen.
   c2-3: spejlvæggen: en dobbeltgænger bygges op af datapunkter; brugerens omrids lægges ovenpå, og forskellene lyser.
   c2-4: to versioner af samme (opdigtede) app; designvalgene lyser op parvis, ét ad gangen.
   "Afmaskere" vises som lag og et låg, der løftes; aldrig som masker. */

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

  ctx.env({ background: "#cfd5de" });

  /* ---------- Rummet: lyst værksted, x −7…7, z −6…7,5, loft 3,6 m ---------- */
  const W = 7, ZB = -6, ZF = 7.5, H = 3.6;
  const S = batch(), G = batch();
  S.box(2 * W, 0.1, ZF - ZB, "#b48a63", [0, -0.05, (ZB + ZF) / 2]);
  for (let x = -W + 0.2; x < W; x += 0.2) S.box(0.01, 0.004, ZF - ZB, "#a07752", [x, 0.002, (ZB + ZF) / 2]);
  S.box(2 * W, H, 0.2, "#d3cabb", [0, H / 2, ZB - 0.1]);
  G.box(2 * W, H, 0.2, "#a59c90", [0, H / 2, ZF + 0.1]);   // forvæggen får ikke retningslys; derfor ubelyst i en mellemtone
  S.box(0.2, H, ZF - ZB, "#d0c7b8", [-W - 0.1, H / 2, (ZB + ZF) / 2]);
  S.box(0.2, H, ZF - ZB, "#d0c7b8", [W + 0.1, H / 2, (ZB + ZF) / 2]);
  S.box(2 * W, 0.1, ZF - ZB, "#c9c0b2", [0, H + 0.05, (ZB + ZF) / 2]);
  for (const [x0, len, z0, along] of [[0, 2 * W, ZB + 0.02, "x"], [0, 2 * W, ZF - 0.02, "x"]]) S.box(len, 0.12, 0.04, "#9c7a5a", [x0, 0.06, z0]);
  S.box(0.04, 0.12, ZF - ZB, "#9c7a5a", [-W + 0.02, 0.06, (ZB + ZF) / 2]); S.box(0.04, 0.12, ZF - ZB, "#9c7a5a", [W - 0.02, 0.06, (ZB + ZF) / 2]);
  // loftsbjælker i træ og tre ovenlysvinduer
  for (let z = -5; z < ZF; z += 2.2) S.box(2 * W, 0.18, 0.14, "#a9845e", [0, H - 0.09, z]);
  for (const z of [-3.2, 0.2, 3.6]) { S.box(2.6, 0.06, 1.4, "#9c7a5a", [0, H - 0.01, z]); G.box(2.4, 0.04, 1.2, "#f4f8ff", [0, H - 0.03, z]); }

  /* det store bord midt i rummet */
  const TBL = { x: 0, z: -0.8, y: 0.9 };
  S.box(3.2, 0.07, 1.6, "#c79b6c", [TBL.x, TBL.y - 0.035, TBL.z]);
  S.box(3.0, 0.06, 1.4, "#a8805a", [TBL.x, TBL.y - 0.12, TBL.z]);
  for (const [dx, dz] of [[-1.45, -0.65], [1.45, -0.65], [-1.45, 0.65], [1.45, 0.65]]) S.box(0.08, TBL.y - 0.07, 0.08, "#8e6b4b", [TBL.x + dx, (TBL.y - 0.07) / 2, TBL.z + dz]);
  // værktøj på bordet: skruetrækkere, pincet, en lille æske med skruer, en skæremåtte
  S.box(1.0, 0.006, 0.7, "#3f7a6a", [TBL.x + 0.95, TBL.y + 0.003, TBL.z + 0.25]);
  for (let i = 0; i < 3; i++) { S.cyl(0.012, 0.012, 0.14, ["#e8638c", "#f2a541", "#4f86d1"][i], [TBL.x + 0.8 + i * 0.09, TBL.y + 0.015, TBL.z + 0.45], [90, 0, 0], 6); S.cyl(0.004, 0.004, 0.12, "#c9ccd2", [TBL.x + 0.8 + i * 0.09, TBL.y + 0.015, TBL.z + 0.32], [90, 0, 0], 4); }
  S.box(0.18, 0.04, 0.12, "#d8d2c4", [TBL.x - 1.2, TBL.y + 0.02, TBL.z + 0.45]);
  S.box(0.16, 0.012, 0.1, "#8e9aa8", [TBL.x - 1.2, TBL.y + 0.046, TBL.z + 0.45]);
  // bordlampe med arm
  S.cyl(0.1, 0.12, 0.03, "#2f3a48", [TBL.x - 1.3, TBL.y + 0.015, TBL.z - 0.5], [0, 0, 0], 12);
  S.box(0.025, 0.6, 0.025, "#2f3a48", [TBL.x - 1.3, TBL.y + 0.3, TBL.z - 0.5], [0, 0, -18]);
  S.box(0.025, 0.5, 0.025, "#2f3a48", [TBL.x - 1.1, TBL.y + 0.68, TBL.z - 0.5], [0, 0, 55]);
  S.cyl(0.04, 0.12, 0.14, "#2f3a48", [TBL.x - 0.88, TBL.y + 0.72, TBL.z - 0.5], [0, 0, 30], 12);

  /* hulplade med værktøj på bagvæggen (her hænger Hjorths fem spørgsmål) */
  const PEG = { x: -3.6, y: 1.75 };
  S.box(2.2, 1.3, 0.04, "#d1ae80", [PEG.x, PEG.y, ZB + 0.03]);
  // reoler med kasser langs venstre væg (forrest), planter og en arbejdsbænk ved højre væg (forrest)
  for (const z of [4.6, 6.2]) {
    S.box(0.45, 2.2, 1.4, "#b48a63", [-W + 0.25, 1.1, z]);
    for (let y = 0.3; y < 2.1; y += 0.5) { S.box(0.42, 0.03, 1.36, "#9c7a5a", [-W + 0.27, y, z]); for (let i = 0; i < 3; i++) S.box(0.34, 0.3, 0.38, ["#e2d6c0", "#c7d3db", "#e8c9b9"][(i + Math.round(y * 2)) % 3], [-W + 0.28, y + 0.165, z - 0.45 + i * 0.45]); }
  }
  for (const [x, z, sc] of [[W - 0.5, 6.6, 1], [-W + 0.6, 6.4, 0.8], [W - 0.5, -5.4, 0.9]]) {
    S.cyl(0.2 * sc, 0.15 * sc, 0.38 * sc, "#c7764f", [x, 0.19 * sc, z], [0, 0, 0], 10);
    for (let i = 0; i < 9; i++) S.sph(0.17 * sc, i % 2 ? "#5d8f5a" : "#6fa26a", [x + Math.cos(i * 1.9) * 0.16 * sc, (0.55 + (i % 3) * 0.2) * sc, z + Math.sin(i * 1.9) * 0.16 * sc], 6, [1, 1.3, 1]);
  }
  for (const y of [1.3, 1.95]) { S.box(3.0, 0.05, 0.36, "#b48a63", [1.0, y, ZB + 0.2]); for (let i = 0; i < 6; i++) S.box(0.36, 0.26, 0.3, ["#c7d3db", "#e2d6c0", "#e8c9b9", "#cfe1cf"][(i + Math.round(y * 3)) % 4], [-0.25 + i * 0.5, y + 0.155, ZB + 0.2]); }
  S.box(3.0, 0.9, 0.62, "#a8805a", [1.0, 0.45, ZB + 0.33]); S.box(3.1, 0.05, 0.68, "#c79b6c", [1.0, 0.92, ZB + 0.33]);
  for (let i = 0; i < 5; i++) S.box(0.5, 0.02, 0.01, "#7a5c40", [-0.2 + i * 0.6, 0.7, ZB + 0.645]);
  S.box(2.2, 0.06, 0.7, "#c79b6c", [W - 1.6, 0.92, 5.6]); S.box(2.0, 0.85, 0.06, "#a8805a", [W - 1.6, 0.45, 5.9]);
  addObj(S.build(litMat)); addObj(G.build(glowMat));
  addObj(new THREE.PointLight("#fff1dc", 3.2, 7, 1.6), root, `${TBL.x} 2.6 ${TBL.z + 0.6}`);
  addObj(new THREE.PointLight("#ffe7f0", 2.0, 6, 1.6), root, `${W - 2.4} 2.4 0`);

  /* ---------- Skilt med rummets navn og dør tilbage til Gaden ---------- */
  const DOORX = 4.0;
  ctx.door(ctx.room.parent, { position: `${DOORX} 0 ${ZB + 0.14}` });
  const roomSign = ctx.sign(ctx.room.name, { position: `${PEG.x} 2.85 ${ZB + 0.12}`, width: 2.4, sub: ctx.room.sub });

  /* hulpladens tekstur: huller, værktøjssilhuetter og fem kort med Hjorths spørgsmål */
  const QWORDS = ["interaktion", "anvendelse", "formål", "begrundelse", "konsekvens"];
  const pegTex = K.canvasTexture(1024, 600, (g, w, h) => {
    g.fillStyle = "#d6b487"; g.fillRect(0, 0, w, h);
    g.fillStyle = "rgba(90,60,30,0.35)"; for (let x = 20; x < w; x += 40) for (let y = 20; y < h; y += 40) { g.beginPath(); g.arc(x, y, 4, 0, 7); g.fill(); }
    g.fillStyle = "#59626e"; g.save(); g.translate(120, 120); g.rotate(-0.3); K.roundRect(g, -14, 0, 28, 150, 10); g.fill(); g.fillRect(-4, -70, 8, 70); g.restore();
    g.fillStyle = "#e8638c"; K.roundRect(g, 220, 60, 34, 120, 14); g.fill(); g.fillStyle = "#59626e"; g.fillRect(232, 180, 10, 80);
    g.strokeStyle = "#59626e"; g.lineWidth = 12; g.beginPath(); g.arc(860, 140, 60, 0.3, Math.PI * 1.7); g.stroke();
    g.fillStyle = "#59626e"; K.roundRect(g, 760, 60, 18, 170, 8); g.fill();
  });
  const pegFace = quad(2.2, 1.3, new THREE.MeshBasicMaterial({ map: pegTex, color: "#e0e0e0" })); pegFace.position.set(PEG.x, PEG.y, ZB + 0.055); addObj(pegFace);
  const qCards = QWORDS.map((wd, i) => {
    const tx = K.canvasTexture(400, 120, (g, w, h) => {
      g.fillStyle = "#fbf7ef"; K.roundRect(g, 4, 4, w - 8, h - 8, 16); g.fill(); g.strokeStyle = C.c; g.lineWidth = 5; g.stroke();
      g.fillStyle = "#2b2230"; g.font = FONT(700, 54); g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(wd, w / 2, h / 2 + 2);
    });
    const q = quad(0.62, 0.186, basic({ map: tx, depthWrite: true })); q.position.set(PEG.x - 0.72 + (i % 3) * 0.72, PEG.y - 0.12 - Math.floor(i / 3) * 0.3 + (i >= 3 ? 0 : 0), ZB + 0.07);
    if (i >= 3) q.position.x = PEG.x - 0.36 + (i - 3) * 0.72;
    q.rotation.z = ((i * 37) % 7 - 3) * D; addObj(q); return q;
  });

  /* ---------- Vejen tilbage: et lille klikbart skilt i hvert view med en pil mod døren til forælderen ---------- */
  const VIEWS = {};
  const view = (id, o) => { VIEWS[id] = o; ctx.view(id, o); };
  function makeBackHint(doorPos) {
    const g = new THREE.Group();
    const name = ctx.rooms[ctx.room.parent].name;
    const tex = K.canvasTexture(640, 150, (c, w, h) => {
      c.fillStyle = "rgba(14,12,26,0.9)"; K.roundRect(c, 4, 4, w - 8, h - 8, 60); c.fill(); c.strokeStyle = ctx.rooms[ctx.room.parent].color; c.lineWidth = 6; c.stroke();
      c.fillStyle = "#ffffff"; c.font = `600 54px "Source Sans 3", "Segoe UI", sans-serif`; c.textBaseline = "middle"; c.fillText(`Tilbage: ${name}`, 150, h / 2 + 2);
    });
    const panel = new THREE.Mesh(new THREE.PlaneGeometry(0.64, 0.15), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, opacity: 0.85 }));
    g.add(panel);
    const ar = new THREE.Shape(); ar.moveTo(-0.012, -0.04); ar.lineTo(0.012, -0.04); ar.lineTo(0.012, 0.005); ar.lineTo(0.03, 0.005); ar.lineTo(0, 0.045); ar.lineTo(-0.03, 0.005); ar.lineTo(-0.012, 0.005); ar.closePath();
    const arrowM = new THREE.Mesh(new THREE.ShapeGeometry(ar), new THREE.MeshBasicMaterial({ color: ctx.rooms[ctx.room.parent].color, transparent: true, depthWrite: false }));
    arrowM.position.set(-0.24, 0, 0.002); g.add(arrowM);
    g.renderOrder = 30; panel.renderOrder = 30; arrowM.renderOrder = 31;
    const e = addObj(g);
    ctx.onClick(e, () => ctx.goRoom(ctx.room.parent));
    return {
      place(id) {
        const v = VIEWS[id]; if (!v) { g.visible = false; return; }
        g.visible = true;
        const p = v.position, la = v.lookAt || [p[0], 1.6, p[2] - 1];
        const fx = la[0] - p[0], fz = la[2] - p[2], fl = Math.hypot(fx, fz) || 1, ux = fx / fl, uz = fz / fl;
        // nede til venstre i synsfeltet, vippet op mod øjet
        const pitch = typeof v.pitch === "number" ? v.pitch : 0;
        const px = p[0] + ux * 1.3 + uz * 0.95, pz = p[2] + uz * 1.3 - ux * 0.95;
        g.position.set(px, 1.6 + Math.tan(pitch * D) * 1.3 - 0.8, pz);
        g.rotation.set(0, Math.atan2(-ux, -uz), 0, "YXZ"); g.rotateX((pitch - 22) * D);
        // pilens retning: vinkel fra blikretningen til døren (positiv = til venstre)
        const dx = doorPos[0] - p[0], dz = doorPos[2] - p[2];
        arrowM.rotation.z = Math.atan2(ux * dz - uz * dx, ux * dx + uz * dz) * -1;
      },
    };
  }

  /* ---------- c2-0: telefonen folder sig ud i lag ---------- */
  const LAYERS = [
    { name: "app", c: "#ff8fb1", draw: (g, w, h) => {
      g.fillStyle = "#1c2236"; K.roundRect(g, 0, 0, w, h, 40); g.fill();
      g.fillStyle = "#2b3352"; g.fillRect(0, 0, w, 90); g.fillStyle = "#e8638c"; g.beginPath(); g.arc(60, 46, 22, 0, 7); g.fill();
      for (let i = 0; i < 5; i++) { g.fillStyle = ["#3d4b78", "#5a3a5a", "#3e5a52", "#5a4a32", "#3d4b78"][i]; K.roundRect(g, 30, 120 + i * 140, w - 60, 120, 18); g.fill(); g.fillStyle = "rgba(255,255,255,0.75)"; g.fillRect(150, 150 + i * 140, 200, 14); g.fillRect(150, 180 + i * 140, 140, 12); g.beginPath(); g.arc(90, 180 + i * 140, 32, 0, 7); g.fill(); }
    } },
    { name: "algoritme", c: "#c9a0ff", draw: (g, w, h) => {
      g.fillStyle = "rgba(60,40,90,0.88)"; K.roundRect(g, 0, 0, w, h, 40); g.fill();
      g.strokeStyle = "#e6d6ff"; g.fillStyle = "#e6d6ff"; g.lineWidth = 6;
      const node = (x, y, d) => { g.beginPath(); if (d) { g.moveTo(x, y - 46); g.lineTo(x + 70, y); g.lineTo(x, y + 46); g.lineTo(x - 70, y); g.closePath(); } else K.roundRect(g, x - 80, y - 34, 160, 68, 14); g.stroke(); };
      const arrow = (x1, y1, x2, y2) => { g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke(); const a = Math.atan2(y2 - y1, x2 - x1); g.beginPath(); g.moveTo(x2, y2); g.lineTo(x2 - 18 * Math.cos(a - 0.5), y2 - 18 * Math.sin(a - 0.5)); g.lineTo(x2 - 18 * Math.cos(a + 0.5), y2 - 18 * Math.sin(a + 0.5)); g.fill(); };
      node(w / 2, 150); arrow(w / 2, 184, w / 2, 290); node(w / 2, 340, true); arrow(w / 2 - 70, 340, 110, 470); arrow(w / 2 + 70, 340, w - 110, 470);
      node(110, 510); node(w - 110, 510); arrow(110, 544, w / 2 - 30, 680); arrow(w - 110, 544, w / 2 + 30, 680); node(w / 2, 720);
      g.beginPath(); g.moveTo(w / 2 + 80, 720); g.bezierCurveTo(w - 20, 720, w - 20, 150, w / 2 + 84, 150); g.setLineDash([12, 10]); g.stroke(); g.setLineDash([]);
    } },
    { name: "data", c: "#8fb2ff", draw: (g, w, h) => {
      g.fillStyle = "rgba(30,50,90,0.88)"; K.roundRect(g, 0, 0, w, h, 40); g.fill();
      g.font = '500 30px "JetBrains Mono", monospace'; g.textBaseline = "middle";
      for (let r = 0; r < 14; r++) { g.fillStyle = r % 2 ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.12)"; g.fillRect(24, 110 + r * 52, w - 48, 52);
        for (let c = 0; c < 3; c++) { g.fillStyle = ["#ffd9a0", "#bfe0ff", "#ffb3c9"][c]; g.fillRect(44 + c * 140, 128 + r * 52, 40 + ((r * 7 + c * 13) % 70), 14); } }
      g.fillStyle = "#cfe0ff"; g.font = FONT(700, 40); g.fillText("tid · sted · klik", 40, 64);
    } },
    { name: "hardware", c: "#7fd1a6", draw: (g, w, h) => {
      g.fillStyle = "#1f5a46"; K.roundRect(g, 0, 0, w, h, 40); g.fill();
      g.strokeStyle = "rgba(200,240,210,0.55)"; g.lineWidth = 5;
      for (let i = 0; i < 16; i++) { g.beginPath(); const x = 40 + (i * 53) % (w - 80); g.moveTo(x, 80); g.lineTo(x, 300 + (i * 41) % 200); g.lineTo(x + 40, 340 + (i * 41) % 200); g.lineTo(x + 40, h - 60); g.stroke(); }
      g.fillStyle = "#1a1f26"; K.roundRect(g, 140, 220, 220, 220, 14); g.fill(); g.strokeStyle = "#c8f0d2"; g.lineWidth = 4; g.strokeRect(160, 240, 180, 180);
      g.fillStyle = "#c8f0d2"; for (let i = 0; i < 8; i++) { g.fillRect(120, 236 + i * 24, 20, 8); g.fillRect(360, 236 + i * 24, 20, 8); }
      g.fillStyle = "#334a5c"; K.roundRect(g, 60, 540, w - 120, 240, 20); g.fill(); g.fillStyle = "#9fe3a0"; g.fillRect(w / 2 - 30, 520, 60, 24);
      g.fillStyle = "#111"; g.beginPath(); g.arc(w - 90, 110, 40, 0, 7); g.fill(); g.strokeStyle = "#aac"; g.beginPath(); g.arc(w - 90, 110, 26, 0, 7); g.stroke();
      g.strokeStyle = "#ffd9a0"; g.lineWidth = 6; g.strokeRect(30, 30, 80, 30);
    } },
  ];
  const LW = 0.56, LH = 1.03;
  const phone = new THREE.Group(); addObj(phone);
  const layerObjs = LAYERS.map((L, i) => {
    const grp = new THREE.Group(); phone.add(grp);
    const tex = K.canvasTexture(512, 940, (g, w, h) => { L.draw(g, w, h); g.strokeStyle = L.c; g.lineWidth = 10; K.roundRect(g, 5, 5, w - 10, h - 10, 38); g.stroke(); });
    const face = quad(LW, LH, basic({ map: tex, side: THREE.DoubleSide, opacity: 0.95, depthWrite: i === 3 })); grp.add(face);
    const edge = new THREE.Mesh(roundBox(LW, LH, 0.012, 0.05), new THREE.MeshStandardMaterial({ color: L.c, transparent: true, opacity: 0.35, depthWrite: false })); edge.position.z = -0.008; grp.add(edge);
    // mærket: en lille fane over laget
    const tagTex = K.canvasTexture(320, 96, (g, w, h) => { g.fillStyle = L.c; K.roundRect(g, 3, 3, w - 6, h - 6, 22); g.fill(); g.fillStyle = "#1a1424"; g.font = FONT(700, 50); g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(L.name, w / 2, h / 2 + 2); });
    const tag = quad(0.5, 0.15, basic({ map: tagTex, side: THREE.DoubleSide })); tag.position.set(LW / 2 + 0.32, 0, 0.01); grp.add(tag);
    return { grp, face, edge, tag };
  });
  // et tyndt bundstykke (telefonens ramme), som ligger tilbage på bordet
  const shell = new THREE.Mesh(roundBox(LW + 0.03, LH + 0.03, 0.03, 0.06), new THREE.MeshStandardMaterial({ color: "#20232c", roughness: 0.5 }));
  shell.rotation.x = -90 * D; shell.position.set(TBL.x, TBL.y + 0.015, TBL.z); addObj(shell);
  // stiplede linjer, der viser, at lagene hører sammen
  const explodeLine = new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(new Array(8).fill(0).map(() => new THREE.Vector3())), new THREE.LineDashedMaterial({ color: "#6a5a70", dashSize: 0.04, gapSize: 0.03, transparent: true }));
  addObj(explodeLine);
  // lagenes to tilstande: samlet (fladt på bordet) og foldet ud (diagonalt i luften)
  const compactPose = i => ({ p: [TBL.x, TBL.y + 0.035 + (3 - i) * 0.012, TBL.z], r: [-90, 0, 0] });
  // foldet ud: en stak lige over telefonen, hvert lag lidt højere og vippet mod beskueren, så man ser dem lag på lag
  const explodedPose = i => ({ p: [TBL.x, TBL.y + 0.32 + (3 - i) * 0.34, TBL.z + 0.05 * (3 - i)], r: [-62, 0, 0] });
  function setLayers(k) {
    layerObjs.forEach((o, i) => {
      const a = compactPose(i), b = explodedPose(i);
      const ki = ease((k * 1.6) - i * 0.2);            // lagene løfter sig ét efter ét, app-laget (låget) først
      o.grp.position.set(lerp(a.p[0], b.p[0], ki), lerp(a.p[1], b.p[1], ki) + Math.sin(ki * Math.PI) * 0.25, lerp(a.p[2], b.p[2], ki));
      o.grp.rotation.set(lerp(a.r[0], b.r[0], ki) * D, lerp(a.r[1], b.r[1], ki) * D, 0);
      o.ki = ki;
    });
    // fire lodrette stiplede linjer fra telefonens hjørner op gennem lagene
    const pts = [];
    for (const [cx, cz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { pts.push(new THREE.Vector3(TBL.x + cx * LW / 2, TBL.y + 0.03, TBL.z + cz * LH / 2)); const top = layerObjs[0].grp; pts.push(new THREE.Vector3(cx * LW / 2, cz * -LH / 2, 0).applyEuler(top.rotation).add(top.position)); }
    explodeLine.geometry.setFromPoints(pts); explodeLine.computeLineDistances();
    explodeLine.material.opacity = ease((k - 0.6) / 0.3) * 0.7;
  }
  const back = makeBackHint([DOORX, 0, ZB + 0.14]);
  const st0 = kit.grp(root, `${TBL.x} 0 ${TBL.z}`);
  kit.box(st0, `0 ${TBL.y + 0.5} 0`, 3.0, 1.2, 1.4, "opacity: 0; transparent: true; depthWrite: false");
  ctx.station("c2-0", st0);
  const s20 = ctx.sign(ctx.step("c2-0").title, { position: `${TBL.x} 2.95 ${TBL.z - 0.3}`, width: 2.1 });
  view("c2-0", { position: [TBL.x + 0.35, 0, TBL.z + 3.2], lookAt: [TBL.x, 1.55, TBL.z], pitch: 0 });

  /* ---------- c2-1: luppen og spørgsmålene ---------- */
  const lens = new THREE.Group(); addObj(lens);
  {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.018, 8, 32), new THREE.MeshStandardMaterial({ color: "#3b3f4a", metalness: 0.5, roughness: 0.3 })); lens.add(ring);
    const glassM = new THREE.Mesh(new THREE.CircleGeometry(0.15, 32), basic({ color: "#dff2ff", opacity: 0.22 })); lens.add(glassM);
    const hdl = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.026, 0.26, 8), new THREE.MeshStandardMaterial({ color: "#8a4a5c" })); hdl.position.set(0.15, -0.2, 0); hdl.rotation.z = 35 * D; lens.add(hdl);
    const glint = quad(0.5, 0.5, basic({ map: K.glowTex("#ffffff"), blending: THREE.AdditiveBlending, opacity: 0.35 })); glint.position.z = -0.01; lens.add(glint);
  }
  // spørgsmålene: ét pr. lag (fra manus)
  const QUEST = [
    { layer: 0, q: "Hvad sker der, hvis jeg trykker her?", at: [-0.1, 0.1] },
    { layer: 1, q: "Hvornår fandt den ud af det?", at: [0.08, 0.0] },
    { layer: 2, q: "Hvad ved appen om mig?", at: [-0.08, -0.05] },
    { layer: 3, q: "Hvad sker der uden internet?", at: [0.12, 0.3] },
  ];
  const qmTex = K.canvasTexture(256, 256, (g, w, h) => {
    const gr = g.createRadialGradient(w / 2, h / 2, 10, w / 2, h / 2, w / 2); gr.addColorStop(0, "rgba(232,99,140,0.95)"); gr.addColorStop(0.55, "rgba(232,99,140,0.55)"); gr.addColorStop(1, "rgba(232,99,140,0)");
    g.fillStyle = gr; g.fillRect(0, 0, w, h); g.fillStyle = "#ffffff"; g.font = FONT(700, 150); g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("?", w / 2, h / 2 + 8);
  });
  QUEST.forEach(Q => {
    Q.mark = quad(0.2, 0.2, basic({ map: qmTex, opacity: 0, side: THREE.DoubleSide })); layerObjs[Q.layer].grp.add(Q.mark); Q.mark.position.set(Q.at[0], Q.at[1], 0.03);
    const tx = K.canvasTexture(1000, 150, (g, w, h) => { g.fillStyle = "rgba(255,255,255,0.96)"; K.roundRect(g, 4, 4, w - 40, h - 40, 30); g.fill(); g.beginPath(); g.moveTo(w - 60, 30); g.lineTo(w - 2, (h - 36) / 2); g.lineTo(w - 60, h - 70); g.fill(); g.strokeStyle = C.c; g.lineWidth = 5; K.roundRect(g, 4, 4, w - 40, h - 40, 30); g.stroke(); g.fillStyle = "#2b2230"; g.font = BODY(600, 50); g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(Q.q, (w - 36) / 2, (h - 36) / 2 + 4); });
    Q.bubble = quad(1.25, 0.19, basic({ map: tx, opacity: 0, side: THREE.DoubleSide, depthTest: false })); Q.bubble.renderOrder = 20; addObj(Q.bubble);
  });
  let pointed = -1, pointedAt = 0;   // hvis brugeren klikker på et lag, peger luppen dér
  const st1 = kit.grp(root, `${TBL.x} 0 ${TBL.z + 0.4}`);
  kit.box(st1, "0 1.5 0", 0.4, 0.4, 0.4, "opacity: 0; transparent: true; depthWrite: false");
  ctx.station("c2-1", st1);
  const s21 = ctx.sign(ctx.step("c2-1").title, { position: `${TBL.x} 2.95 ${TBL.z - 0.28}`, width: 2.1 });
  view("c2-1", { position: [TBL.x + 0.2, 0, TBL.z + 3.0], lookAt: [TBL.x, 1.55, TBL.z] });
  // klikbare lag: et usynligt plan pr. lag, der følger laget
  layerObjs.forEach((o, i) => {
    const hit = kit.plane(root, "0 0 0", LW, LH, "opacity: 0; transparent: true; depthWrite: false; side: double");
    o.hit = hit;
    ctx.onClick(hit, () => { if (cur === "c2-1") { pointed = QUEST.findIndex(Q => Q.layer === i); pointedAt = now; } });
  });

  /* ---------- c2-2: tre maskiner med samme input ---------- */
  const MACH = [
    { key: "det", name: "deterministisk", sub: "samme svar hver gang", z: 3.4 },
    { key: "ada", name: "adaptiv", sub: "ændrer sig efter brugen", z: 1.4 },
    { key: "gen", name: "generativ", sub: "laver noget nyt", z: -0.6 },
  ];
  const MX = -W + 0.75;
  const GEOS = [new THREE.ConeGeometry(0.075, 0.13, 3), new THREE.SphereGeometry(0.07, 12, 8), new THREE.BoxGeometry(0.11, 0.11, 0.11), new THREE.IcosahedronGeometry(0.08, 0), new THREE.TorusGeometry(0.055, 0.024, 6, 14), new THREE.OctahedronGeometry(0.085, 0), new THREE.DodecahedronGeometry(0.075, 0), new THREE.CylinderGeometry(0.06, 0.06, 0.11, 6)];
  const PAL = ["#4f86d1", "#f2a541", "#5fb878", "#9a7ad1"];
  const machines = MACH.map((m, mi) => {
    const g = new THREE.Group(); g.position.set(MX, 0, m.z); g.rotation.y = 90 * D; addObj(g);
    const B = batch();
    B.box(1.0, 1.0, 0.8, ["#5b6b82", "#6a5b82", "#825b6e"][mi], [0, 0.65, 0]);
    B.box(1.04, 0.06, 0.84, "#3a4150", [0, 1.17, 0]);
    for (const dx of [-0.42, 0.42]) for (const dz of [-0.32, 0.32]) B.box(0.06, 0.15, 0.06, "#3a4150", [dx, 0.075, dz]);
    B.cyl(0.24, 0.08, 0.3, "#8e98a8", [0.1, 1.35, 0], [0, 0, 0], 12);                 // tragt
    B.box(0.2, 0.14, 0.2, "#3a4150", [-0.33, 0.92, 0.45]);                            // udløb
    B.box(0.95, 0.04, 0.32, "#c79b6c", [0.02, 0.82, 0.58]);                           // hylde til output
    B.box(0.95, 0.06, 0.03, "#a8805a", [0.02, 0.85, 0.735]);
    for (let i = 0; i < 3; i++) B.cyl(0.035, 0.035, 0.03, "#2a2f3a", [0.25 + i * 0.1, 1.05, 0.41], [90, 0, 0], 10);   // knapper
    g.add(B.build(litMat));
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.045, 10, 6), new THREE.MeshBasicMaterial({ color: "#3a3f4a" })); lamp.position.set(0.36, 1.27, 0.25); g.add(lamp);
    // navneplade på maskinens front
    const plate = quad(0.78, 0.29, basic({ map: K.canvasTexture(640, 240, (c, w, h) => {
      c.fillStyle = "#fbf7ef"; K.roundRect(c, 4, 4, w - 8, h - 8, 22); c.fill(); c.strokeStyle = C.c; c.lineWidth = 6; c.stroke();
      c.textAlign = "center"; c.fillStyle = "#2b2230"; c.font = FONT(700, 70); c.fillText(m.name, w / 2, 100); c.fillStyle = "#6a5a66"; c.font = BODY(500, 46); c.fillText(m.sub, w / 2, 178);
    }), depthWrite: true }));
    plate.position.set(-0.05, 0.56, 0.405); g.add(plate);
    // input-terningen (den samme for alle tre)
    const inp = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.1), new THREE.MeshStandardMaterial({ color: "#f4f1ea", roughness: 0.4 })); g.add(inp);
    // fire pladser til output på hylden
    const outs = [0, 1, 2, 3].map(j => { const o = new THREE.Mesh(GEOS[0], new THREE.MeshStandardMaterial({ color: "#fff", roughness: 0.45, flatShading: true })); o.position.set(-0.33 + j * 0.22, 0.92, 0.58); g.add(o); return o; });
    // feedback-pil for den adaptive maskine: fra hylden tilbage til tragten
    let loop = null;
    if (m.key === "ada") {
      const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(0.38, 0.95, 0.6), new THREE.Vector3(0.62, 1.35, 0.45), new THREE.Vector3(0.45, 1.75, 0.1), new THREE.Vector3(0.15, 1.6, 0)]);
      loop = new THREE.Mesh(new THREE.TubeGeometry(curve, 24, 0.012, 5), basic({ color: C.c, opacity: 0.85 })); g.add(loop);
      const head = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.08, 8), basic({ color: C.c, opacity: 0.85 })); head.position.set(0.15, 1.58, 0); head.rotation.z = 70 * D; g.add(head); loop.userData.head = head;
    }
    const sparks = m.key === "gen" ? (() => { const n = 18, geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(n * 3), 3)); const p = new THREE.Points(geo, new THREE.PointsMaterial({ map: K.glowTex("#ffffff"), color: "#ffe2a0", size: 0.06, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); g.add(p); return p; })() : null;
    return { ...m, g, lamp, inp, outs, loop, sparks };
  });
  // samme input: en fælles skinne over de tre tragte med et skilt
  {
    const B = batch(); B.box(0.08, 0.08, 4.6, "#3a4150", [MX + 0.0, 2.25, MACH[1].z]);
    for (const m of MACH) B.box(0.04, 0.3, 0.04, "#3a4150", [MX, 2.4, m.z]);
    B.box(0.04, 1.2, 0.04, "#3a4150", [MX - 0.3, 2.85, MACH[0].z - 0.3]); B.box(0.04, 1.2, 0.04, "#3a4150", [MX - 0.3, 2.85, MACH[2].z + 0.3]);
    addObj(B.build(litMat));
    const inLab = quad(0.9, 0.2, basic({ map: K.canvasTexture(450, 100, (c, w, h) => { c.fillStyle = "#fbf7ef"; K.roundRect(c, 3, 3, w - 6, h - 6, 40); c.fill(); c.strokeStyle = "#3a4150"; c.lineWidth = 5; c.stroke(); c.fillStyle = "#2b2230"; c.font = FONT(700, 54); c.textAlign = "center"; c.textBaseline = "middle"; c.fillText("samme input", w / 2, h / 2 + 2); }) }));
    inLab.position.set(MX + 0.05, 2.02, MACH[1].z - 1.0); inLab.rotation.y = 90 * D; addObj(inLab);
  }
  const st2 = kit.grp(root, `${MX} 0 ${MACH[1].z}`);
  kit.box(st2, "0 0.7 0", 0.9, 1.4, 5.0, "opacity: 0; transparent: true; depthWrite: false");
  ctx.station("c2-2", st2);
  const s22 = ctx.sign(ctx.step("c2-2").title, { position: `${MX + 0.05} 2.55 ${MACH[1].z}`, width: 2.1, rotation: "0 90 0" });
  view("c2-2", { position: [MX + 3.5, 0, MACH[1].z], lookAt: [MX, 1.3, MACH[1].z] });
  // output for maskine m ved kørsel r: [geometri-indeks, farve]
  function outputOf(key, r) {
    if (key === "det") return [0, "#f2a541"];
    if (key === "ada") { const c = new THREE.Color(PAL[(r * 3) % 4]).lerp(new THREE.Color(C.c), Math.min(1, r / 3)); return [1, "#" + c.getHexString()]; }
    return [(r * 5 + 2) % GEOS.length, "#" + new THREE.Color().setHSL(((r * 0.37) + 0.05) % 1, 0.62, 0.6).getHexString()];
  }

  /* ---------- c2-3: spejlvæggen og den digitale dobbeltgænger ---------- */
  const MIR = { x: W - 0.06, z: 0.2, w: 2.6, h: 2.45 };
  const mirror = new THREE.Group(); mirror.position.set(MIR.x, 0, MIR.z); mirror.rotation.y = -90 * D; addObj(mirror);
  {
    const B = batch();
    B.box(MIR.w + 0.2, MIR.h + 0.2, 0.06, "#b48a63", [0, 0.1 + MIR.h / 2, -0.02]);
    B.box(MIR.w + 0.3, 0.08, 0.2, "#9c7a5a", [0, 0.1, 0.06]);
    mirror.add(B.build(litMat));
    const mt = K.canvasTexture(256, 256, (g, w, h) => { const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, "#2a3446"); gr.addColorStop(0.45, "#3e4c63"); gr.addColorStop(0.5, "#56657d"); gr.addColorStop(0.56, "#3a475d"); gr.addColorStop(1, "#202838"); g.fillStyle = gr; g.fillRect(0, 0, w, h); });
    const glassP = quad(MIR.w, MIR.h, new THREE.MeshBasicMaterial({ map: mt })); glassP.position.set(0, 0.1 + MIR.h / 2, 0.015); mirror.add(glassP);
  }
  // figurerne som 2D-kapsler (meter; fødder i y = 0). Brugeren har en guitarkasse; dobbeltgængeren har en indkøbspose og kigger ned i telefonen.
  const body = [[[0.1, 0.06], [0.1, 0.88], 0.075], [[-0.1, 0.06], [-0.1, 0.88], 0.075], [[0, 0.92], [0, 1.38], 0.17], [[0, 1.42], [0, 1.5], 0.05]];
  const userShape = [...body, [[0, 1.62], [0, 1.62], 0.115], [[0.21, 1.4], [0.27, 0.86], 0.05], [[-0.21, 1.4], [-0.27, 0.86], 0.05],
    [[0.44, 0.2], [0.44, 0.78], 0.15], [[0.44, 0.8], [0.44, 1.12], 0.06], [[0.3, 0.86], [0.44, 0.86], 0.02]];
  const twinShape = [...body, [[0.04, 1.59], [0.04, 1.59], 0.12], [[0.21, 1.4], [0.22, 1.14], 0.05], [[0.22, 1.14], [0.07, 1.24], 0.045], [[0.05, 1.26], [0.05, 1.26], 0.05],
    [[-0.21, 1.4], [-0.29, 0.88], 0.05], [[-0.36, 0.5], [-0.36, 0.78], 0.13]];
  const inShape = (sh, x, y) => sh.some(([a, b, r]) => { const dx = b[0] - a[0], dy = b[1] - a[1], L2 = dx * dx + dy * dy; let t = L2 ? ((x - a[0]) * dx + (y - a[1]) * dy) / L2 : 0; t = Math.max(0, Math.min(1, t)); const px = a[0] + t * dx - x, py = a[1] + t * dy - y; return px * px + py * py <= r * r; });
  const FIG_Y = 0.25, FIG_S = 1.2;    // figurerne skaleres lidt op, så de fylder spejlet
  // brugerens omrids (hvid streg) tegnet på spejlet
  const outlineTex = K.canvasTexture(512, 768, (g, w, h) => {
    const sx = w / 1.6, ox = w / 2, oy = h;      // 1,6 m bredt, 2,4 m højt
    const seg = (lw, sh) => sh.forEach(([a, b, r]) => { g.lineWidth = (r * 2) * sx + lw; g.lineCap = "round"; g.beginPath(); g.moveTo(ox + a[0] * sx, oy - a[1] * sx); g.lineTo(ox + b[0] * sx + 0.01, oy - b[1] * sx); g.stroke(); });
    g.clearRect(0, 0, w, h); g.strokeStyle = "#ffffff"; seg(10, userShape); g.globalCompositeOperation = "destination-out"; seg(0, userShape); g.globalCompositeOperation = "source-over";
  });
  const outline = quad(1.6 * FIG_S, 2.4 * FIG_S, basic({ map: outlineTex, opacity: 0 })); outline.position.set(0, FIG_Y + 1.2 * FIG_S, 0.04); mirror.add(outline);
  // dobbeltgængeren: punkter samplet inden for figurens form
  const NPTS = 2600, pts = new Float32Array(NPTS * 3), pcol = new Float32Array(NPTS * 3);
  const DCOL = [new THREE.Color("#ff6f9e"), new THREE.Color("#ffc56b"), new THREE.Color("#8fb2ff"), new THREE.Color("#ffffff")];
  for (let i = 0, guard = 0; i < NPTS && guard < 200000; guard++) {
    const x = (Math.random() - 0.5) * 1.0, y = Math.random() * 1.8;
    if (!inShape(twinShape, x, y)) continue;
    pts[i * 3] = x * FIG_S; pts[i * 3 + 1] = FIG_Y + y * FIG_S; pts[i * 3 + 2] = 0.08 + (Math.random() - 0.5) * 0.05;
    const c = DCOL[Math.floor(Math.random() * (Math.random() < 0.15 ? 4 : 3))]; pcol.set([c.r, c.g, c.b], i * 3); i++;
  }
  const twinGeo = new THREE.BufferGeometry(); twinGeo.setAttribute("position", new THREE.BufferAttribute(pts, 3)); twinGeo.setAttribute("color", new THREE.BufferAttribute(pcol, 3));
  const twin = new THREE.Points(twinGeo, new THREE.PointsMaterial({ size: 0.022, vertexColors: true, transparent: true, depthWrite: false })); mirror.add(twin);
  // datamærker, der flyver ind i figuren
  const DATA = ["kl. 23:40", "løbesko", "nyheder", "3,2 km", "playliste", "fodbold", "14 år?", "pizza"];
  const chips = DATA.map((d, i) => {
    const tx = K.canvasTexture(320, 90, (g, w, h) => { g.fillStyle = "rgba(20,24,40,0.85)"; K.roundRect(g, 3, 3, w - 6, h - 6, 40); g.fill(); g.strokeStyle = ["#ff6f9e", "#ffc56b", "#8fb2ff"][i % 3]; g.lineWidth = 5; g.stroke(); g.fillStyle = "#fff"; g.font = BODY(600, 46); g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(d, w / 2, h / 2 + 2); });
    const q = quad(0.32, 0.09, basic({ map: tx, opacity: 0 })); mirror.add(q);
    const side = i % 2 ? 1 : -1; q.userData.from = [side * (1.15 + (i % 3) * 0.08), FIG_Y + 0.3 + (i * 0.27) % 2.0]; q.userData.to = [(Math.random() - 0.5) * 0.3, FIG_Y + 0.5 + Math.random() * 1.3]; return q;
  });
  // forskelle: pulserende ringe der, hvor dobbeltgængeren og brugeren ikke passer sammen
  const DIFF = [[0.44 * FIG_S, FIG_Y + 0.62 * FIG_S], [-0.36 * FIG_S, FIG_Y + 0.64 * FIG_S], [0.06 * FIG_S, FIG_Y + 1.25 * FIG_S]];
  const diffRings = DIFF.map(([x, y]) => { const r = new THREE.Mesh(new THREE.RingGeometry(0.17, 0.2, 32), basic({ color: C.c, opacity: 0 })); r.position.set(x, y, 0.11); mirror.add(r); return r; });
  // forklaring under spejlet
  const legendTex = K.canvasTexture(560, 300, (g, w, h) => {
    g.fillStyle = "rgba(20,24,40,0.9)"; K.roundRect(g, 3, 3, w - 6, h - 6, 30); g.fill(); g.textBaseline = "middle"; g.font = BODY(600, 48);
    g.strokeStyle = "#fff"; g.lineWidth = 7; K.roundRect(g, 36, 52, 46, 56, 20); g.stroke(); g.fillStyle = "#fff"; g.fillText("dig", 110, 82);
    for (let i = 0; i < 9; i++) { g.fillStyle = ["#ff6f9e", "#ffc56b", "#8fb2ff"][i % 3]; g.fillRect(38 + (i % 3) * 16, 176 + Math.floor(i / 3) * 18, 11, 11); }
    g.fillStyle = "#fff"; g.fillText("tjenestens", 110, 190); g.fillText("model af dig", 110, 240);
  });
  const mLegend = quad(0.84, 0.45, basic({ map: legendTex })); mLegend.position.set(-MIR.w / 2 - 0.62, 1.45, 0.02); mirror.add(mLegend);
  const st3 = kit.grp(root, `${MIR.x - 0.3} 0 ${MIR.z}`);
  kit.box(st3, "0 1.3 0", 0.4, 2.6, MIR.w, "opacity: 0; transparent: true; depthWrite: false");
  ctx.station("c2-3", st3);
  const s23 = ctx.sign(ctx.step("c2-3").title, { position: `${MIR.x - 0.14} 3.0 ${MIR.z}`, width: 3.0, size: 60, rotation: "0 -90 0" });
  view("c2-3", { position: [MIR.x - 3.3, 0, MIR.z], lookAt: [MIR.x, 1.5, MIR.z] });

  /* ---------- c2-4: to versioner af samme (opdigtede) app ---------- */
  const AP = { z: ZF - 0.08, y: 1.55, xa: 1.6, xb: -1.4, w: 0.95, h: 1.8 };   // på forvæggen, set indefra (A til venstre)
  // fire designvalg; hvert har et område på hver telefon (x0, y0, x1, y1 i brøkdele af skærmen) og to korte ord
  const CHOICES = [
    { t: "sortering", a: "algoritme", b: "tid", ra: [0.04, 0.1, 0.96, 0.17], rb: [0.04, 0.1, 0.96, 0.17] },
    { t: "indtægt", a: "reklamer", b: "abonnement", ra: [0.04, 0.42, 0.96, 0.6], rb: [0.04, 0.02, 0.36, 0.09] },
    { t: "scroll", a: "uendelig", b: "slutter", ra: [0.04, 0.84, 0.96, 0.98], rb: [0.04, 0.84, 0.96, 0.98] },
    { t: "notifikationer", a: "løbende", b: "samlet kl. 18", ra: [0.74, 0.015, 0.96, 0.09], rb: [0.74, 0.015, 0.96, 0.09] },
  ];
  const appTex = ver => K.canvasTexture(500, 950, (g, w, h) => {
    const A = ver === "A";
    g.fillStyle = "#f7f4ee"; K.roundRect(g, 0, 0, w, h, 50); g.fill();
    // topbar med app-symbol (to bølger i en cirkel) og navn
    g.fillStyle = "#2b3352"; g.beginPath(); g.arc(60, 45, 26, 0, 7); g.fill(); g.strokeStyle = "#fff"; g.lineWidth = 5;
    for (const dy of [-7, 7]) { g.beginPath(); g.moveTo(44, 45 + dy); g.bezierCurveTo(54, 35 + dy, 66, 55 + dy, 76, 45 + dy); g.stroke(); }
    g.fillStyle = "#2b3352"; g.font = FONT(700, 40); g.textBaseline = "middle"; g.fillText("Strøm", 100, 47);
    if (!A) { g.fillStyle = "#5fb878"; K.roundRect(g, 26, 20, 140, 50, 25); g.globalAlpha = 0; g.fill(); g.globalAlpha = 1; }
    // klokke
    g.strokeStyle = "#2b3352"; g.lineWidth = 5; g.beginPath(); g.arc(w - 70, 44, 18, Math.PI, 0); g.lineTo(w - 50, 60); g.lineTo(w - 90, 60); g.closePath(); g.stroke();
    if (A) { g.fillStyle = "#e0384d"; g.beginPath(); g.arc(w - 52, 28, 17, 0, 7); g.fill(); g.fillStyle = "#fff"; g.font = FONT(700, 22); g.textAlign = "center"; g.fillText("27", w - 52, 29); g.textAlign = "left"; }
    else { g.fillStyle = "#2b3352"; g.font = BODY(600, 20); g.fillText("18:00", w - 98, 82); }
    // faner (sortering)
    g.font = FONT(700, 32); g.fillStyle = A ? "#2b3352" : "#9a9aa8"; g.fillText("For dig", 50, 128); g.fillStyle = A ? "#9a9aa8" : "#2b3352"; g.fillText("Nyeste", 270, 128);
    g.fillStyle = "#e8638c"; g.fillRect(A ? 50 : 270, 150, 140, 6);
    if (!A) { g.strokeStyle = "#2b3352"; g.lineWidth = 4; g.beginPath(); g.arc(415, 128, 16, 0, 7); g.stroke(); g.beginPath(); g.moveTo(415, 128); g.lineTo(415, 118); g.moveTo(415, 128); g.lineTo(423, 132); g.stroke(); }
    // opslag
    const post = (y, col, hgt = 130) => { g.fillStyle = "#ffffff"; K.roundRect(g, 24, y, w - 48, hgt, 20); g.fill(); g.fillStyle = col; g.beginPath(); g.arc(80, y + 50, 30, 0, 7); g.fill(); g.fillStyle = "#c8c6cf"; g.fillRect(130, y + 34, 220, 14); g.fillRect(130, y + 62, 160, 12); g.fillRect(50, y + 98, w - 120, 10); };
    post(180, "#4f86d1"); post(330, "#f2a541");
    if (A) { g.fillStyle = "#fff4cf"; K.roundRect(g, 24, 400, w - 48, 170, 20); g.fill(); g.fillStyle = "#d9a520"; g.font = BODY(700, 24); g.fillText("ANNONCE", 50, 430); g.fillStyle = "#e7c76a"; K.roundRect(g, 50, 450, w - 100, 90, 14); g.fill(); }
    else post(480, "#5fb878");
    post(600, A ? "#9a7ad1" : "#9a7ad1");
    if (A) { post(750, "#4f86d1", 120); const gr = g.createLinearGradient(0, 800, 0, h); gr.addColorStop(0, "rgba(247,244,238,0)"); gr.addColorStop(1, "rgba(247,244,238,1)"); g.fillStyle = gr; g.fillRect(0, 800, w, h - 800); g.fillStyle = "#9a9aa8"; g.font = FONT(700, 40); g.textAlign = "center"; g.fillText("· · ·", w / 2, 905); g.textAlign = "left"; }
    else { g.strokeStyle = "#5fb878"; g.lineWidth = 6; g.beginPath(); g.moveTo(w / 2 - 40, 840); g.lineTo(w / 2 - 15, 865); g.lineTo(w / 2 + 35, 815); g.stroke(); g.fillStyle = "#2b3352"; g.font = BODY(600, 30); g.textAlign = "center"; g.fillText("Du har set alt nyt", w / 2, 905); g.textAlign = "left"; }
    if (!A) { g.fillStyle = "#5fb878"; K.roundRect(g, 330, 26, 0, 0, 0); }
  });
  const apps = ["A", "B"].map((v, i) => {
    const x = i ? AP.xb : AP.xa; const g = new THREE.Group(); g.position.set(x, AP.y, AP.z - 0.06); g.rotation.y = Math.PI; addObj(g);
    const B = batch(); B.rbox(AP.w + 0.08, AP.h + 0.1, 0.06, 0.12, "#1d1f27", [0, 0, 0]); g.add(B.build(litMat));
    const scr = quad(AP.w, AP.h, new THREE.MeshBasicMaterial({ map: appTex(v) })); scr.position.z = 0.032; g.add(scr);
    const lab = quad(0.5, 0.12, basic({ map: K.canvasTexture(400, 96, (c, w, h) => { c.fillStyle = "#2b2230"; K.roundRect(c, 3, 3, w - 6, h - 6, 40); c.fill(); c.fillStyle = "#fff"; c.font = FONT(700, 54); c.textAlign = "center"; c.textBaseline = "middle"; c.fillText(`version ${v}`, w / 2, h / 2 + 2); }) }));
    lab.position.set(0, -AP.h / 2 - 0.15, 0.03); g.add(lab);
    // en ramme pr. designvalg (tændes én ad gangen)
    const hl = CHOICES.map(ch => {
      const r = i ? ch.rb : ch.ra; const wq = (r[2] - r[0]) * AP.w, hq = (r[3] - r[1]) * AP.h;
      const tx = K.canvasTexture(256, 128, (c, w, h) => { c.strokeStyle = C.c; c.lineWidth = 10; K.roundRect(c, 6, 6, w - 12, h - 12, 18); c.stroke(); c.fillStyle = "rgba(232,99,140,0.12)"; c.fill(); });
      const q = quad(wq + 0.04, hq + 0.04, basic({ map: tx, opacity: 0 })); q.position.set(-AP.w / 2 + (r[0] + r[2]) / 2 * AP.w, AP.h / 2 - (r[1] + r[3]) / 2 * AP.h, 0.04); g.add(q); return q;
    });
    return { g, hl };
  });
  {
    const bd = quad(5.0, 2.7, new THREE.MeshBasicMaterial({ map: K.canvasTexture(512, 280, (c, w, h) => { const gr = c.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, "#efe9df"); gr.addColorStop(1, "#ddd5c8"); c.fillStyle = gr; c.fillRect(0, 0, w, h); c.strokeStyle = "#b48a63"; c.lineWidth = 10; c.strokeRect(5, 5, w - 10, h - 10); }) }));
    bd.position.set((AP.xa + AP.xb) / 2, AP.y + 0.05, AP.z - 0.01); bd.rotation.y = Math.PI; addObj(bd);
  }
  // midterkolonne: én plade pr. designvalg med "A-ord · B-ord"
  const midX = (AP.xa + AP.xb) / 2;
  const mids = CHOICES.map((ch, i) => {
    const tx = K.canvasTexture(640, 230, (c, w, h) => {
      c.fillStyle = "rgba(20,18,30,0.92)"; K.roundRect(c, 4, 4, w - 8, h - 8, 26); c.fill(); c.strokeStyle = C.c; c.lineWidth = 5; c.stroke();
      c.textAlign = "center"; c.textBaseline = "middle"; c.fillStyle = C.c; c.font = FONT(700, 52); c.fillText(ch.t, w / 2, 62);
      c.font = BODY(600, 44); c.fillStyle = "#fff"; c.textAlign = "right"; c.fillText(ch.a, w / 2 - 34, 160); c.textAlign = "left"; c.fillText(ch.b, w / 2 + 34, 160);
      c.fillStyle = "#a9b0d6"; c.textAlign = "center"; c.fillText("·", w / 2, 160);
    });
    const q = quad(1.3, 0.467, basic({ map: tx, opacity: 0 })); q.position.set(midX, AP.y + 0.72 - i * 0.5, AP.z - 0.12); q.rotation.y = Math.PI; addObj(q); return q;
  });
  // forbindelseslinjer fra midterpladen ud til rammerne
  const links = CHOICES.map(() => { const l = new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()]), new THREE.LineBasicMaterial({ color: C.c, transparent: true, opacity: 0 })); addObj(l); return l; });
  root.object3D.updateMatrixWorld(true);
  CHOICES.forEach((ch, i) => {
    const pa = new THREE.Vector3(), pb = new THREE.Vector3(); apps[0].hl[i].getWorldPosition(pa); apps[1].hl[i].getWorldPosition(pb);
    const m = mids[i].position;
    pa.x -= ((CHOICES[i].ra[2] - CHOICES[i].ra[0]) * AP.w) / 2; pb.x += ((CHOICES[i].rb[2] - CHOICES[i].rb[0]) * AP.w) / 2;
    links[i].geometry.setFromPoints([pa, new THREE.Vector3(m.x + 0.65, m.y, m.z), new THREE.Vector3(m.x - 0.65, m.y, m.z), pb]);
  });
  const st4 = kit.grp(root, `${midX} 0 ${AP.z - 0.5}`);
  kit.box(st4, "0 1.5 0.3", 4.2, 2.0, 0.3, "opacity: 0; transparent: true; depthWrite: false");
  ctx.station("c2-4", st4);
  const s24 = ctx.sign(ctx.step("c2-4").title, { position: `${midX} 3.05 ${AP.z - 0.12}`, width: 2.3, rotation: "0 180 0" });
  view("c2-4", { position: [midX, 0, AP.z - 3.6], lookAt: [midX, 1.6, AP.z] });

  /* ---------- Tilstand og animation ---------- */
  let cur = null, t0 = null, now = 0;
  const tmpV = new THREE.Vector3(), tmpQ = new THREE.Quaternion(), M4 = new THREE.Matrix4();
  const camPos = () => { root.sceneEl.camera.getWorldPosition(tmpV); return tmpV; };
  return {
    onStep(id) { cur = id; t0 = null; pointed = -1; back.place(id); },
    tick(t, dt) {
      now = t; if (t0 === null) t0 = t;
      const kf = 1 - Math.exp(-(dt || 16) / 1000 * 7);   // tidsbaseret udjævning (uafhængig af billedfrekvens)
      const e = (t - t0) / 1000, s = t / 1000;
      /* lagene: samlet i c2-0's begyndelse, ellers foldet ud */
      const unfold = cur === "c2-0" ? Math.min(1, Math.max(0, (e - 0.5) / 2.2)) : 1;
      setLayers(unfold);
      layerObjs.forEach((o, i) => {
        const lit = cur === "c2-0" || cur === "c2-1";
        o.face.material.opacity = lit ? 0.95 : 0.55; o.edge.material.opacity = lit ? 0.35 : 0.15;
        o.tag.material.opacity = (cur === "c2-0" ? ease((e - 1.6 - i * 0.35) / 0.4) : lit ? 1 : 0.5);
        o.tag.scale.setScalar(cur === "c2-0" ? 0.6 + 0.4 * ease((e - 1.6 - i * 0.35) / 0.4) : 1);
        // usynlige klikplaner følger lagene
        if (o.hit) { o.hit.object3D.position.copy(o.grp.position); o.hit.object3D.quaternion.copy(o.grp.quaternion); }
      });
      // Hjorths fem spørgsmål på hulpladen
      qCards.forEach((q, i) => { q.material.opacity = cur === "c2-0" ? ease((e - 3.2 - i * 0.3) / 0.4) : 0.55; });

      /* luppen */
      const L1 = cur === "c2-1";
      let qi = Math.floor(Math.max(0, e - 1.0) / 2.4) % QUEST.length;
      if (pointed >= 0 && t - pointedAt < 6000) qi = pointed;
      const target = QUEST[qi];
      const lo = layerObjs[target.layer];
      lo.grp.updateMatrixWorld(true);
      const tp = new THREE.Vector3(target.at[0], target.at[1], 0.22).applyMatrix4(lo.grp.matrixWorld);
      if (L1) {
        lens.visible = true;
        lens.position.lerp(tp, kf);
        lens.quaternion.slerp(lo.grp.getWorldQuaternion(tmpQ), kf);
      } else { lens.visible = cur === "c2-0" ? false : true; lens.position.set(TBL.x + 0.95, TBL.y + 0.05, TBL.z + 0.3); lens.rotation.set(-90 * D, 0, 30 * D); }
      // hvert lag får sit spørgsmål; et spørgsmål, luppen har været ved, bliver hængende (svagere), så alle fire ses til sidst
      const visited = L1 ? Math.min(QUEST.length, Math.floor(Math.max(0, e - 1.0) / 2.4) + 1) : 0;
      QUEST.forEach((Q, i) => {
        const on = L1 && i === qi && lens.position.distanceTo(tp) < 0.15;
        const seen = L1 && i < visited;
        Q.mark.material.opacity = L1 ? (on ? 1 : seen ? 0.7 : 0.3) : 0;
        Q.mark.scale.setScalar(on ? 1 + 0.12 * Math.sin(s * 6) : 0.8);
        const bo = Q.bubble.material.opacity; Q.bubble.material.opacity = lerp(bo, on ? 1 : seen ? 0.8 : 0, kf);
        // boblen står ud for laget, til venstre for stakken (fri af lagene og mærkerne)
        const lp = layerObjs[Q.layer].grp.position; Q.bubble.position.set(TBL.x - LW / 2 - 0.72, lp.y + 0.05, lp.z + 0.1);
        Q.bubble.quaternion.copy(root.sceneEl.camera.getWorldQuaternion(tmpQ));
        Q.bubble.scale.setScalar(on ? 1.08 : 0.92);
      });

      /* maskinerne */
      const L2 = cur === "c2-2";
      const cycle = 2.2, run = L2 ? Math.max(0, e - 0.8) / cycle : 4.2;
      const r = Math.floor(run), ph = run - r;
      machines.forEach((m, mi) => {
        // input: samme hvide terning falder i tragten
        if (L2 && r < 4) { const k = ease(ph / 0.35); m.inp.visible = ph < 0.45; m.inp.position.set(0.1, lerp(2.15, 1.3, k), 0); m.inp.rotation.set(s, s * 1.3, 0); }
        else if (!L2) { m.inp.visible = true; m.inp.position.set(0.1, 2.15, 0); }
        else m.inp.visible = false;
        m.lamp.material.color.set(L2 && ph > 0.3 && ph < 0.65 && r < 4 ? C.c : "#3a3f4a");
        m.outs.forEach((o, j) => {
          const shown = !L2 || j < r || (j === r && ph > 0.6);
          o.visible = shown && j < 4;
          if (!o.visible) return;
          const [gi, col] = outputOf(m.key, j);
          if (o.geometry !== GEOS[gi]) o.geometry = GEOS[gi];
          o.material.color.set(col);
          const pop = (L2 && j === r) ? ease((ph - 0.6) / 0.25) : 1;
          o.position.set(-0.33 + j * 0.22, 0.92 + 0.1 * (1 - pop), 0.58);
          o.scale.setScalar(Math.max(0.01, pop) * 1.35 * (m.key === "ada" ? 0.85 + j * 0.15 : 1));
          o.rotation.y = s * 0.6 + j;
        });
        if (m.loop) { const k = L2 ? 0.45 + 0.4 * (0.5 + 0.5 * Math.sin(s * 4)) : 0.25; m.loop.material.opacity = k; m.loop.userData.head.material.opacity = k; }
        if (m.sparks) {
          const pa = m.sparks.geometry.attributes.position;
          for (let i = 0; i < pa.count; i++) { const a = i * 2.4 + s * 2, rr = 0.1 + ((s * 0.8 + i * 0.13) % 1) * 0.35; pa.setXYZ(i, -0.33 + Math.cos(a) * rr * 0.6, 1.0 + ((s * 0.8 + i * 0.13) % 1) * 0.5, 0.45 + Math.sin(a) * rr * 0.3); }
          pa.needsUpdate = true; m.sparks.material.opacity = L2 && ph > 0.5 && ph < 0.95 ? 1 : 0;
        }
      });

      /* spejlet */
      const L3 = cur === "c2-3";
      const build3 = L3 ? ease((e - 0.6) / 4.5) : 1;
      twinGeo.setDrawRange(0, Math.floor(NPTS * build3));
      twin.material.opacity = L3 ? 1 : 0.5;
      chips.forEach((q, i) => {
        const k = L3 ? ((e - 0.4 - i * 0.55) / 1.2) : -1;
        q.material.opacity = k > 0 && k < 1 ? Math.sin(k * Math.PI) : 0;
        const kk = ease(k); q.position.set(lerp(q.userData.from[0], q.userData.to[0], kk), lerp(q.userData.from[1], q.userData.to[1], kk), 0.14);
        q.scale.setScalar(1 - 0.6 * kk);
      });
      outline.material.opacity = L3 ? ease((e - 5.4) / 0.8) : 0.0;
      diffRings.forEach((rg, i) => { const k = L3 ? ease((e - 6.2 - i * 0.5) / 0.4) : 0; rg.material.opacity = k * (0.65 + 0.35 * Math.sin(s * 5 + i)); rg.scale.setScalar(0.8 + 0.2 * k + 0.06 * Math.sin(s * 5 + i)); });

      /* de to apps */
      const L4 = cur === "c2-4";
      const ci = L4 ? Math.floor(Math.max(0, e - 0.8) / 2.4) : -1;
      CHOICES.forEach((ch, i) => {
        const shown = L4 && ci >= i;
        const active = L4 && (ci % CHOICES.length) === i || (L4 && ci >= CHOICES.length);
        const k = shown ? ease((e - 0.8 - i * 2.4) / 0.4) : 0;
        mids[i].material.opacity = L4 ? (k * (ci === i || ci >= CHOICES.length ? 1 : 0.55)) : 0;
        apps.forEach(a => { a.hl[i].material.opacity = k * (ci === i ? 1 : ci >= CHOICES.length ? 0.6 : 0.25); });
        links[i].material.opacity = k * (ci === i ? 0.9 : 0.2);
        void active;
      });
      apps.forEach(a => a.g.children[1].material.color.setScalar(L4 ? 1 : 0.85));

      // skilte: aktive tydelige, øvrige dæmpede
      // dæmpningsregime: kun det aktive trins skilt er synligt; de andre er næsten skjult, så de ikke konkurrerer
      [[s20, "c2-0"], [s21, "c2-1"], [s22, "c2-2"], [s23, "c2-3"], [s24, "c2-4"]].forEach(([sg, id]) => { setSignOpacity(sg, cur === id ? 1 : 0.12); sg.object3D.visible = cur === id || !((id === "c2-0" && cur === "c2-1") || (id === "c2-1" && cur === "c2-0")); });
      setSignOpacity(roomSign, cur === "c2-0" ? 1 : 0.35);
    },
  };
}
