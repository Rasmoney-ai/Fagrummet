/* B2 · Maskinrummet — Programmering og computerforståelse.
   Et højt maskinrum med fem lige store stationer i en bue omkring et stort, gennemsigtigt flowdiagram,
   der hænger skråt under loftet og kører. Stationerne: begreber (kasser, løkke, forgrening), det
   skærmløse hjørne (instruktionskort på gulvet), blokke og tekst side om side, to slags fejl, og
   generativ kunstig intelligens som værktøj (en talebobbel, der bliver til kode, som man kan spørge ind til). */
export default function build(ctx) {
  const { THREE: T, K, kit } = ctx;
  const B = ctx.room.color;
  const root = ctx.root;
  const D2R = Math.PI / 180;
  const RED = "#ff5a4f";

  /* ---------- hjælpere ---------- */
  const std = (c, o = {}) => new T.MeshStandardMaterial({ color: c, roughness: 0.75, metalness: 0.1, flatShading: true, ...o });
  const basic = (c, o = {}) => new T.MeshBasicMaterial({ color: c, ...o });
  const merge = gs => T.BufferGeometryUtils.mergeGeometries(gs.map(g => g.index ? g.toNonIndexed() : g));
  const mesh = (geo, mat, pos = [0, 0, 0], parent = root, rot = [0, 0, 0]) => kit.mesh(parent, geo, mat, pos.join(" "), { rotation: rot.join(" ") });
  const group = (pos = [0, 0, 0], parent = root, rot = [0, 0, 0]) => kit.grp(parent, pos.join(" "), { rotation: rot.join(" ") });
  const bx = (w, h, d, x = 0, y = 0, z = 0) => { const g = new T.BoxGeometry(w, h, d); g.translate(x, y, z); return g; };
  const ease = x => x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x);
  const clamp01 = x => Math.max(0, Math.min(1, x));
  const face = (from, to) => Math.atan2(to[0] - from[0], to[1] - from[1]) / D2R;
  const texMat = tex => basic("#ffffff", { map: tex, transparent: true, depthWrite: false, side: T.DoubleSide });
  // et lærred, der kan tegnes om (til kode, tal og diagrammer)
  function liveCanvas(w, h) {
    const c = document.createElement("canvas"); c.width = w; c.height = h;
    const tex = new T.CanvasTexture(c); tex.colorSpace = T.SRGBColorSpace; tex.anisotropy = 4;
    return { g: c.getContext("2d"), tex, w, h, key: null };
  }
  // lille etiket med tekst, tilpasset tekstens bredde (h = højde i meter)
  function label(text, pos, parent, h = 0.13, o = {}) {
    const font = `700 64px "Familjen Grotesk", sans-serif`;
    const m = document.createElement("canvas").getContext("2d"); m.font = font;
    const pw = Math.ceil(m.measureText(text).width) + 56, ph = 96;
    const tex = K.canvasTexture(pw, ph, (g, w, hh) => {
      g.fillStyle = o.bg || "rgba(9,16,30,0.9)"; K.roundRect(g, 3, 3, w - 6, hh - 6, 18); g.fill(); g.strokeStyle = o.edge || B; g.lineWidth = 4; g.stroke();
      g.fillStyle = o.ink || "#eef1ff"; g.font = font; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(text, w / 2, hh / 2 + 3);
    });
    const mat = texMat(tex);
    const e = mesh(new T.PlaneGeometry(h * pw / ph, h), mat, pos, parent, o.rot || [0, 0, 0]);
    e.mat = mat; return e;
  }
  // stiliseret figur (elev/robot): krop, hoved og en lille "næse", der viser retningen. Står på y = 0, kigger mod −z
  function figureGeo(s = 1) {
    const body = new T.CylinderGeometry(0.1 * s, 0.15 * s, 0.46 * s, 10); body.translate(0, 0.23 * s, 0);
    const head = new T.SphereGeometry(0.105 * s, 12, 8); head.translate(0, 0.6 * s, 0);
    const nose = new T.ConeGeometry(0.04 * s, 0.09 * s, 6); nose.rotateX(-Math.PI / 2); nose.translate(0, 0.6 * s, -0.12 * s);
    return merge([body, head, nose]);
  }

  ctx.env({ background: "#05080f", fog: "type: exponential; color: #05080f; density: 0.02" });

  /* ---------- rummet ---------- */
  const X0 = -8, X1 = 8, Z0 = -9, Z1 = 7, HC = 6;
  const floorTex = K.canvasTexture(512, 512, (g, w, h) => {
    g.fillStyle = "#121a2b"; g.fillRect(0, 0, w, h);
    g.strokeStyle = "rgba(0,0,0,0.55)"; g.lineWidth = 4; g.strokeRect(0, 0, w, h);
    g.strokeStyle = "rgba(140,170,220,0.06)"; g.lineWidth = 2; for (let i = 32; i < w; i += 32) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i, h); g.stroke(); g.beginPath(); g.moveTo(0, i); g.lineTo(w, i); g.stroke(); }
  });
  floorTex.wrapS = floorTex.wrapT = T.RepeatWrapping; floorTex.repeat.set(8, 8);
  const fl = new T.PlaneGeometry(X1 - X0, Z1 - Z0); fl.rotateX(-Math.PI / 2);
  mesh(fl, std("#ffffff", { map: floorTex, roughness: 0.9 }), [0, 0, (Z0 + Z1) / 2]);
  // vægge med sokkel, lodrette søjler og rør langs væggene
  const W = [bx(0.2, HC, Z1 - Z0, X0, HC / 2, (Z0 + Z1) / 2), bx(0.2, HC, Z1 - Z0, X1, HC / 2, (Z0 + Z1) / 2), bx(X1 - X0, HC, 0.2, 0, HC / 2, Z0), bx(X1 - X0, HC, 0.2, 0, HC / 2, Z1)];
  mesh(merge(W), std("#161e33"));
  const deco = [];
  for (let z = Z0 + 2; z < Z1; z += 3) deco.push(bx(0.3, HC, 0.4, X0 + 0.2, HC / 2, z), bx(0.3, HC, 0.4, X1 - 0.2, HC / 2, z));
  for (const x of [-6.5, -3.6, 3.6, 6.5]) deco.push(bx(0.4, HC, 0.3, x, HC / 2, Z0 + 0.2));
  deco.push(bx(X1 - X0, 0.3, 0.08, 0, 0.15, Z0 + 0.14), bx(0.08, 0.3, Z1 - Z0, X0 + 0.14, 0.15, (Z0 + Z1) / 2), bx(0.08, 0.3, Z1 - Z0, X1 - 0.14, 0.15, (Z0 + Z1) / 2));
  mesh(merge(deco), std("#1d2742"));
  const pipes = [];
  for (const [y, r] of [[5.0, 0.09], [5.25, 0.06], [5.45, 0.12]]) {
    const a = new T.CylinderGeometry(r, r, Z1 - Z0, 8); a.rotateX(Math.PI / 2); a.translate(X0 + 0.45, y, (Z0 + Z1) / 2); pipes.push(a);
    const b = a.clone(); b.translate(X1 - X0 - 0.9, 0, 0); pipes.push(b);
    const c = new T.CylinderGeometry(r, r, X1 - X0, 8); c.rotateZ(Math.PI / 2); c.translate(0, y, Z0 + 0.45); pipes.push(c);
  }
  mesh(merge(pipes), std("#2b3757", { metalness: 0.5, roughness: 0.4 }));
  const ce = new T.PlaneGeometry(X1 - X0, Z1 - Z0); ce.rotateX(Math.PI / 2);
  mesh(ce, std("#0c1222"), [0, HC, (Z0 + Z1) / 2]);
  mesh(merge([-5, -1, 3].map(z => bx(X1 - X0, 0.3, 0.3, 0, HC - 0.15, z))), std("#141c30"));

  kit.el("a-entity", { light: `type: point; color: #cfe8ff; intensity: 0.7; distance: 16; decay: 1.1`, position: "0 3.6 -1" });
  kit.el("a-entity", { light: `type: point; color: ${B}; intensity: 0.5; distance: 10; decay: 1.3`, position: "0 4.2 -3" });

  /* ---------- skilte og dør ---------- */
  ctx.sign(ctx.room.name, { position: `3.4 3.6 ${Z0 + 0.25}`, width: 2.4, sub: ctx.room.sub });
  ctx.door(ctx.room.parent, { position: `${X0 + 0.15} 0 3.6`, rotation: "0 90 0" });

  /* ---------- fem stationer: placering, lampe og gulvplade ---------- */
  const EYE = [0, 5.4];
  const ST = {
    "b2-1": { p: [-5.0, -0.2], view: [-2.5, 1.5] },
    "b2-2": { p: [-5.6, -6.2], view: [-3.6, -2.4], look: [-5.6, -6.4] },
    "b2-3": { p: [0, -8.75], view: [0, -4.9] },
    "b2-4": { p: [4.8, -6.0], view: [3.2, -3.6] },
    "b2-5": { p: [5.2, -0.4], view: [2.6, 1.6] },
  };
  const stationIds = Object.keys(ST);
  stationIds.forEach(id => {
    const s = ST[id];
    s.ry = id === "b2-3" ? 0 : face(s.p, s.view);
    s.g = group([s.p[0], 0, s.p[1]], root, [0, s.ry, 0]);
    // lampen over stationen og en lysende kant på gulvet (ét materiale, så hele stationen kan "tænde")
    s.mat = std(B, { emissive: new T.Color(B), emissiveIntensity: 0.15 });
    const shade = new T.CylinderGeometry(0.1, 0.3, 0.22, 12, 1, true); shade.translate(0, 4.75, 0.3);
    const rim = new T.TorusGeometry(0.3, 0.025, 4, 16); rim.rotateX(Math.PI / 2); rim.translate(0, 4.64, 0.3);
    const cord = new T.CylinderGeometry(0.01, 0.01, HC - 4.86, 4); cord.translate(0, (HC + 4.86) / 2, 0.3);
    mesh(merge([shade, rim, cord]), s.mat, [0, 0, 0], s.g);
  });
  // stationernes navne (fra manus)
  const signAt = (id, pos, w = 1.9) => ctx.sign(ctx.step(id).title, { parent: ST[id].g, position: pos, width: w });

  /* ================= flowdiagrammet under loftet ================= */
  // knuder i lærredskoordinater (2048 × 880); diagrammet læses fra venstre mod højre
  const FD = { w: 2048, h: 880 };
  const NODES = [
    { id: "start", t: "Start", x: 170, y: 440, k: "pill" },
    { id: "las", t: "Læs måling", x: 560, y: 440, k: "box" },
    { id: "hvis", t: "Regner det?", x: 1010, y: 440, k: "dia" },
    { id: "ja", t: "point + 1", x: 1470, y: 220, k: "box" },
    { id: "nej", t: "Vent", x: 1470, y: 660, k: "box" },
    { id: "vis", t: "Vis point", x: 1860, y: 440, k: "box" },
  ];
  const N = Object.fromEntries(NODES.map(n => [n.id, n]));
  // tokenets rute (polylinje i lærredskoordinater) og hvilke knuder den passerer
  const routeYes = [[170, 440], [560, 440], [1010, 440], [1010, 220], [1470, 220], [1860, 220], [1860, 440]];
  const routeNo = [[1860, 440], [1860, 660], [1470, 660], [1010, 660], [300, 660], [300, 440], [560, 440], [1010, 440]];
  const fdc = liveCanvas(FD.w, FD.h);
  function drawFlow(active) {
    if (fdc.key === active) return; fdc.key = active;
    const g = fdc.g; g.clearRect(0, 0, FD.w, FD.h);
    g.fillStyle = "rgba(10,30,40,0.35)"; K.roundRect(g, 8, 8, FD.w - 16, FD.h - 16, 40); g.fill();
    g.strokeStyle = "rgba(79,209,197,0.5)"; g.lineWidth = 6; g.stroke();
    // kanter
    g.strokeStyle = "rgba(160,240,232,0.75)"; g.lineWidth = 10; g.lineJoin = "round";
    const line = pts => { g.beginPath(); g.moveTo(...pts[0]); pts.slice(1).forEach(p => g.lineTo(...p)); g.stroke(); };
    line(routeYes); line(routeNo.slice(0, 7));
    g.fillStyle = "#cfe9ff"; g.font = '700 46px "Familjen Grotesk", sans-serif'; g.textAlign = "center"; g.textBaseline = "middle";
    g.fillText("ja", 960, 300); g.fillText("nej", 960, 580);
    // knuder
    for (const n of NODES) {
      const on = n.id === active;
      g.fillStyle = on ? "#4fd1c5" : "rgba(14,34,48,0.92)"; g.strokeStyle = on ? "#eafffb" : "#4fd1c5"; g.lineWidth = 8;
      if (n.k === "dia") { g.beginPath(); g.moveTo(n.x, n.y - 140); g.lineTo(n.x + 210, n.y); g.lineTo(n.x, n.y + 140); g.lineTo(n.x - 210, n.y); g.closePath(); g.fill(); g.stroke(); }
      else { K.roundRect(g, n.x - 175, n.y - 70, 350, 140, n.k === "pill" ? 70 : 18); g.fill(); g.stroke(); }
      g.fillStyle = on ? "#05201e" : "#eef1ff"; g.font = '700 54px "Familjen Grotesk", sans-serif'; g.fillText(n.t, n.x, n.y + 2);
    }
    fdc.tex.needsUpdate = true;
  }
  drawFlow(null);
  const FW = 7.6, FH = FW * FD.h / FD.w, FY = 4.45, FZ = -3.0, TILT = 58;
  const flow = group([0, FY, FZ], root, [TILT, 0, 0]);
  const flowMat = texMat(fdc.tex);
  mesh(new T.PlaneGeometry(FW, FH), flowMat, [0, 0, 0], flow);
  // tynd glasplade og ophæng
  mesh(new T.BoxGeometry(FW + 0.2, FH + 0.2, 0.03), std("#9ff3ea", { transparent: true, opacity: 0.07, depthWrite: false }), [0, 0, -0.03], flow);
  mesh(merge([-FW / 2, FW / 2].flatMap(x => [bx(0.03, 1.4, 0.03, x, FH / 2 + 0.55, 0)])), std("#3a4a6c"), [0, 0, 0], flow, [-TILT, 0, 0]);
  // tokenet, der løber gennem diagrammet
  const token = mesh(new T.SphereGeometry(0.11, 12, 8), basic("#eafffb"), [0, 0, 0.06], flow);
  const tokHalo = new T.Sprite(new T.SpriteMaterial({ map: K.glowTex("#7ffff0"), transparent: true, depthWrite: false, blending: T.AdditiveBlending }));
  tokHalo.scale.set(0.8, 0.8, 1); token.object3D.add(tokHalo);
  const cv2loc = ([x, y]) => [(x / FD.w - 0.5) * FW, (0.5 - y / FD.h) * FH];
  function polyAt(pts, u) {   // punkt på polylinje ved brøkdel u (efter længde)
    const L = []; let tot = 0; for (let i = 1; i < pts.length; i++) { const l = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); L.push(l); tot += l; }
    let d = clamp01(u) * tot; for (let i = 0; i < L.length; i++) { if (d <= L[i]) { const f = d / L[i]; return [pts[i][0] + (pts[i + 1][0] - pts[i][0]) * f, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * f]; } d -= L[i]; }
    return pts[pts.length - 1];
  }
  const nearNode = ([x, y]) => { for (const n of NODES) if (Math.abs(n.x - x) < 120 && Math.abs(n.y - y) < 90) return n.id; return null; };

  /* ================= B2.1 · Programmeringsbegreber ================= */
  const S1 = ST["b2-1"].g;
  // bord og en tavle bagved, hvor programmet samles
  mesh(merge([bx(2.6, 0.06, 0.9, 0, 0.84, 0.25), bx(0.06, 0.84, 0.06, -1.2, 0.42, 0.62), bx(0.06, 0.84, 0.06, 1.2, 0.42, 0.62), bx(0.06, 0.84, 0.06, -1.2, 0.42, -0.12), bx(0.06, 0.84, 0.06, 1.2, 0.42, -0.12)]), std("#252d48"), [0, 0, 0], S1);
  const boardTex = K.canvasTexture(512, 512, (g, w, h) => {
    g.fillStyle = "#0d1526"; g.fillRect(0, 0, w, h);
    g.strokeStyle = "rgba(79,209,197,0.12)"; g.lineWidth = 2; for (let i = 0; i < w; i += 32) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i, h); g.stroke(); g.beginPath(); g.moveTo(0, i); g.lineTo(w, i); g.stroke(); }
  });
  mesh(new T.BoxGeometry(2.4, 1.85, 0.05), [std("#1c2440"), std("#1c2440"), std("#1c2440"), std("#1c2440"), std("#ffffff", { map: boardTex }), std("#1c2440")], [0, 1.95, -0.35], S1);
  // tre navngivne kasser: hver med navn, indhold og datatype på et mærke
  function crateTex(name, val, type) {
    return K.canvasTexture(320, 300, (g, w, h) => {
      g.fillStyle = "#e9f2ff"; K.roundRect(g, 6, 6, w - 12, h - 12, 18); g.fill();
      g.fillStyle = "#0e2a3a"; g.font = '700 56px "JetBrains Mono", monospace'; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(name, w / 2, 62);
      g.fillStyle = "#0b1626"; K.roundRect(g, 26, 108, w - 52, 100, 14); g.fill();
      g.fillStyle = "#7ffff0"; g.font = '700 58px "JetBrains Mono", monospace'; g.fillText(val, w / 2, 160);
      g.fillStyle = "#47607a"; g.font = '600 38px "Source Sans 3", sans-serif'; g.fillText(type, w / 2, 250);
    });
  }
  const crateBody = merge([bx(0.42, 0.36, 0.36, 0, 0.18, 0), bx(0.46, 0.04, 0.4, 0, 0.36, 0)]);
  const crateMat = std("#2c6f8f");
  const crates = [["point", "3", "tal"], ["navn", "\"Ida\"", "tekst"], ["regner", "sand", "sand/falsk"]].map(([n, v, ty], i) => {
    const c = group([0, 0, 0], S1);
    mesh(crateBody, crateMat, [0, 0, 0], c);
    mesh(new T.PlaneGeometry(0.36, 0.34), texMat(crateTex(n, v, ty)), [0, 0.18, 0.185], c);
    return c;
  });
  // løkken: en C-formet klamme med pil og mærket "gentag 10 gange"
  const loopTex = K.canvasTexture(640, 120, (g, w, h) => { g.fillStyle = "#eef1ff"; g.font = '700 64px "Familjen Grotesk", sans-serif'; g.textBaseline = "middle"; g.fillText("↻  gentag 10 gange", 22, h / 2 + 4); });
  const loop = group([0, 0, 0], S1);
  const loopMat = std("#2a8f88", { emissive: new T.Color(B), emissiveIntensity: 0.2 });
  mesh(merge([bx(1.6, 0.16, 0.12, 0, 0.42, 0), bx(0.16, 0.8, 0.12, -0.72, 0, 0), bx(1.1, 0.12, 0.12, -0.25, -0.42, 0)]), loopMat, [0, 0, 0], loop);
  mesh(new T.PlaneGeometry(1.2, 0.225), texMat(loopTex), [-0.12, 0.42, 0.065], loop);
  // forgreningen: en rombe med "hvis regner?" og to udgange
  const ifTex = K.canvasTexture(400, 400, (g, w, h) => {
    g.fillStyle = "#e9f2ff"; g.beginPath(); g.moveTo(w / 2, 10); g.lineTo(w - 10, h / 2); g.lineTo(w / 2, h - 10); g.lineTo(10, h / 2); g.closePath(); g.fill();
    g.fillStyle = "#0e2a3a"; g.font = '700 60px "Familjen Grotesk", sans-serif'; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("hvis", w / 2, h / 2 - 34); g.fillText("regner?", w / 2, h / 2 + 30);
  });
  const branch = group([0, 0, 0], S1);
  const branchShape = new T.Shape([new T.Vector2(0, 0.3), new T.Vector2(0.3, 0), new T.Vector2(0, -0.3), new T.Vector2(-0.3, 0)]);
  const brG = new T.ExtrudeGeometry(branchShape, { depth: 0.08, bevelEnabled: false }); brG.translate(0, 0, -0.04);
  const brMat = std("#3b6fb0");
  mesh(brG, brMat, [0, 0, 0], branch);
  mesh(new T.PlaneGeometry(0.56, 0.56), texMat(ifTex), [0, 0, 0.045], branch);
  const brLbl = [label("ja", [0.48, 0.06, 0.02], branch, 0.1), label("nej", [-0.48, 0.06, 0.02], branch, 0.1)];
  // brikkernes to positioner: spredt på bordet og samlet på tavlen
  const parts1 = [
    { e: crates[0], a: [-0.95, 0.87, 0.35, 0, 22, 0], b: [-0.65, 2.42, -0.15, 0, 0, 0] },
    { e: crates[1], a: [-0.35, 0.87, 0.5, 0, -14, 0], b: [0, 2.42, -0.15, 0, 0, 0] },
    { e: crates[2], a: [0.2, 0.87, 0.3, 0, 9, 0], b: [0.65, 2.42, -0.15, 0, 0, 0] },
    { e: loop, a: [0.85, 0.98, 0.42, -80, -10, 0], b: [0.05, 1.66, -0.22, 0, 0, 0] },
    { e: branch, a: [0.95, 0.92, 0.2, -82, 25, 0], b: [0.2, 1.6, -0.17, 0, 0, 0] },
  ];
  // en lille kørselsprik, der går rundt i løkken, når programmet er samlet
  const run1 = mesh(new T.SphereGeometry(0.05, 10, 6), basic("#eafffb"), [0, 0, 0], S1);
  signAt("b2-1", "0 3.3 -0.35", 2.0);
  ctx.station("b2-1", S1);

  /* ================= B2.2 · Det skærmløse hjørne ================= */
  const S2 = ST["b2-2"].g;
  S2.setAttribute("rotation", "0 0 0"); S2.object3D.rotation.set(0, 0, 0);   // hjørnet følger rummets akser
  const TS = 0.8, GC = 4, GR = 5;                 // flisestørrelse, kolonner, rækker
  const gx = i => -1.4 + i * TS, gz = j => -2.1 + j * TS;   // flisecentre i S2-koordinater
  const tapeTex = K.canvasTexture(512, 640, (g, w, h) => {
    g.fillStyle = "#1a2236"; g.fillRect(0, 0, w, h);
    g.strokeStyle = "#d8dde8"; g.lineWidth = 7; g.setLineDash([]);
    for (let i = 0; i <= GC; i++) { g.beginPath(); g.moveTo(8 + i * 124, 8); g.lineTo(8 + i * 124, h - 8); g.stroke(); }
    for (let j = 0; j <= GR; j++) { g.beginPath(); g.moveTo(8, 8 + j * 124.8); g.lineTo(w - 8, 8 + j * 124.8); g.stroke(); }
  });
  const tg = new T.PlaneGeometry(GC * TS, GR * TS); tg.rotateX(-Math.PI / 2);
  mesh(tg, std("#ffffff", { map: tapeTex, roughness: 0.95 }), [gx(0) + (GC - 1) * TS / 2, 0.006, gz(0) + (GR - 1) * TS / 2], S2);
  // målfeltet: en stjerne på gulvet
  const starShape = new T.Shape(); for (let i = 0; i < 10; i++) { const r = i % 2 ? 0.11 : 0.26, a = i / 10 * Math.PI * 2 - Math.PI / 2; i ? starShape.lineTo(Math.cos(a) * r, Math.sin(a) * r) : starShape.moveTo(Math.cos(a) * r, Math.sin(a) * r); }
  const starG = new T.ShapeGeometry(starShape); starG.rotateX(-Math.PI / 2);
  const goalMat = basic(B);
  mesh(starG, goalMat, [gx(1), 0.012, gz(0)], S2);
  // klasselokale uden skærme: tavle med kridt, to borde med stole
  const chalk = K.canvasTexture(1024, 512, (g, w, h) => {
    g.fillStyle = "#1f3a33"; g.fillRect(0, 0, w, h);
    g.strokeStyle = "rgba(240,245,235,0.85)"; g.fillStyle = "rgba(240,245,235,0.85)"; g.lineWidth = 6; g.lineCap = "round";
    g.font = '600 64px "Familjen Grotesk", sans-serif'; g.fillText("Programmér din makker", 60, 100);
    // kridtpile: frem, drej højre, drej venstre
    const arrow = (x, y, rot) => { g.save(); g.translate(x, y); g.rotate(rot); g.beginPath(); g.moveTo(0, 50); g.lineTo(0, -40); g.moveTo(-22, -18); g.lineTo(0, -42); g.lineTo(22, -18); g.stroke(); g.restore(); };
    arrow(130, 260, 0); g.fillText("frem", 80, 380);
    g.beginPath(); g.arc(390, 270, 46, Math.PI, 0); g.stroke(); g.beginPath(); g.moveTo(420, 250); g.lineTo(436, 276); g.lineTo(460, 256); g.stroke(); g.fillText("højre", 320, 380);
    g.beginPath(); g.arc(640, 270, 46, Math.PI, 0); g.stroke(); g.beginPath(); g.moveTo(574, 256); g.lineTo(594, 276); g.lineTo(612, 250); g.stroke(); g.fillText("venstre", 540, 380);
    g.font = '600 52px "Familjen Grotesk", sans-serif'; g.fillText("Præcis?", 820, 270);
    g.fillRect(40, 440, 160, 10);
  });
  mesh(new T.PlaneGeometry(2.6, 1.3), std("#ffffff", { map: chalk }), [gx(1.5), 1.75, -2.56], S2);
  mesh(merge([bx(2.75, 0.08, 0.1, gx(1.5), 2.43, -2.58), bx(2.75, 0.08, 0.16, gx(1.5), 1.07, -2.55), bx(0.08, 1.4, 0.1, gx(1.5) - 1.34, 1.75, -2.58), bx(0.08, 1.4, 0.1, gx(1.5) + 1.34, 1.75, -2.58)]), std("#6b5440"), [0, 0, 0], S2);
  const desks = [];
  for (const [x, z] of [[2.3, -1.6], [2.3, -0.2]]) {
    desks.push(bx(0.9, 0.04, 0.55, x, 0.72, z), bx(0.04, 0.72, 0.04, x - 0.4, 0.36, z - 0.22), bx(0.04, 0.72, 0.04, x + 0.4, 0.36, z - 0.22), bx(0.04, 0.72, 0.04, x - 0.4, 0.36, z + 0.22), bx(0.04, 0.72, 0.04, x + 0.4, 0.36, z + 0.22));
    desks.push(bx(0.4, 0.04, 0.4, x, 0.44, z + 0.5), bx(0.4, 0.4, 0.04, x, 0.66, z + 0.7), bx(0.04, 0.44, 0.04, x - 0.17, 0.22, z + 0.33), bx(0.04, 0.44, 0.04, x + 0.17, 0.22, z + 0.33), bx(0.04, 0.44, 0.04, x - 0.17, 0.22, z + 0.67), bx(0.04, 0.44, 0.04, x + 0.17, 0.22, z + 0.67));
  }
  mesh(merge(desks), std("#7a6550"), [0, 0, 0], S2);
  mesh(merge([bx(0.3, 0.02, 0.22, 2.2, 0.75, -1.6), bx(0.3, 0.02, 0.22, 2.4, 0.75, -0.2)]), std("#e6e1d3"), [0, 0, 0], S2);
  // instruktionskortene på gulvet foran feltet (vippet op, så de kan læses)
  const CARDS = [["↑", "1 frem"], ["↑", "1 frem"], ["↷", "drej højre"], ["↑", "1 frem"], ["?", "drej"], ["↑", "2 frem"]];
  const cardTex = ([ic, t], unclear) => K.canvasTexture(256, 340, (g, w, h) => {
    g.fillStyle = "#f3f1ea"; K.roundRect(g, 6, 6, w - 12, h - 12, 22); g.fill();
    g.strokeStyle = unclear ? "#9aa2b8" : "#2b3a55"; g.lineWidth = 6; if (unclear) g.setLineDash([16, 10]); g.stroke(); g.setLineDash([]);
    g.fillStyle = "#1a2a44"; g.textAlign = "center"; g.textBaseline = "middle";
    g.font = '700 150px "Familjen Grotesk", sans-serif'; g.fillText(ic, w / 2, 140);
    g.font = '700 50px "Familjen Grotesk", sans-serif'; g.fillText(t, w / 2, 270);
  });
  // kortene ligger i en række foran feltet; rækkens gruppe er stationen (ringen lægges foran kortene)
  const cardRow = group([gx(1.5), 0, gz(GR - 1) + 0.95], S2);
  const cards = CARDS.map((c, k) => {
    const e = group([(k - 2.5) * 0.55, 0.02, 0], cardRow, [-62, 0, 0]);
    const m = texMat(cardTex(c, c[0] === "?"));
    mesh(new T.PlaneGeometry(0.44, 0.58), m, [0, 0.29, 0], e);
    const hl = basic(B, { transparent: true, opacity: 0 });
    mesh(new T.PlaneGeometry(0.5, 0.64), hl, [0, 0.29, -0.005], e);
    return { e, hl };
  });
  // figuren, der udfører kortene
  const fig2 = group([gx(0), 0, gz(4)], S2);
  const fig2Mat = std("#e8ecf6", { emissive: new T.Color("#9fb6d8"), emissiveIntensity: 0.15 });
  mesh(figureGeo(1.5), fig2Mat, [0, 0, 0], fig2);
  const qMark = label("?", [0, 1.3, 0], fig2, 0.3, { edge: RED, ink: "#ffffff" });
  // den tiltænkte rute (vises, når figuren er gået forkert)
  const ghostPts = [[gx(1), gz(2)], [gx(1), gz(0)]];
  const ghostG = []; for (let i = 0; i < 7; i++) ghostG.push(bx(0.09, 0.012, 0.13, gx(1), 0.016, gz(2) - 0.1 - i * 0.22));
  const ghostMat = basic(B, { transparent: true, opacity: 0 });
  mesh(merge(ghostG), ghostMat, [0, 0, 0], S2);
  const endG = new T.PlaneGeometry(TS * 0.9, TS * 0.9); endG.rotateX(-Math.PI / 2);
  const endMat = basic(RED, { transparent: true, opacity: 0, depthWrite: false });
  mesh(endG, endMat, [gx(1), 0.014, gz(4)], S2);
  // programmet: hvert kort giver en handling (pos i, j og retning d: 0 = −z, 1 = +x, 2 = +z, 3 = −x)
  const DIRS = [[0, -1], [1, 0], [0, 1], [-1, 0]];
  const plan = [];   // tilstande efter hvert kort
  { let i = 0, j = 4, d = 0; plan.push({ i, j, d });
    const act = [["f", 1], ["f", 1], ["r"], ["f", 1], ["?"], ["f", 2]];
    for (const [a, n] of act) {
      if (a === "f") { i += DIRS[d][0] * n; j += DIRS[d][1] * n; }
      else if (a === "r") d = (d + 1) % 4;
      else d = (d + 1) % 4;   // den uklare "drej": figuren gætter på højre, men der var ment venstre
      plan.push({ i, j, d });
    } }
  signAt("b2-2", `${gx(1.5)} 2.85 -2.45`, 2.0);
  // stationens ring lægges foran kortrækken, så den ikke dækker kortene
  const st2 = group([0, 0, 1.05], cardRow);
  ctx.station("b2-2", st2);

  /* ================= B2.3 · Blokke og tekst side om side ================= */
  const S3 = ST["b2-3"].g;
  const PROG = [
    { blk: "når programmet starter", txt: "# når programmet starter", ind: 0, col: "#2a8f88", hat: true },
    { blk: "sæt point til 0", txt: "point = 0", ind: 0, col: "#3b6fb0" },
    { blk: "gentag 10 gange", txt: "for i in range(10):", ind: 0, col: "#3d5a80", c: true },
    { blk: "hvis regner", txt: "    if regner():", ind: 1, col: "#3d5a80", c: true },
    { blk: "skift point med 1", txt: "        point = point + 1", ind: 2, col: "#3b6fb0" },
    { blk: "sig point", txt: "print(point)", ind: 0, col: "#5b7fd6" },
  ];
  // venstre: blokke som flade 3D-klodser (samlet pr. farve) med al tekst på ét lærred foran
  const BW = 2.3, BH = 1.9, bTop = 2.75, rowH = 0.27;
  const bx3 = -1.45;   // venstre panels centrum (x)
  mesh(new T.BoxGeometry(BW + 0.2, BH + 0.2, 0.04), std("#111a2e"), [bx3, bTop - BH / 2 + 0.05, 0.02], S3);
  const byCol = {};
  const blkRect = PROG.map((p, r) => {
    const x = bx3 - BW / 2 + 0.15 + p.ind * 0.22, y = bTop - 0.12 - r * rowH, w = p.c ? 1.55 - p.ind * 0.22 : 1.45 - p.ind * 0.22 + (p.hat ? 0.25 : 0);
    (byCol[p.col] = byCol[p.col] || []).push(bx(w, rowH - 0.04, 0.07, x + w / 2, y, 0.08));
    if (p.hat) byCol[p.col].push(bx(0.5, 0.06, 0.07, x + 0.3, y + rowH / 2 - 0.0, 0.08));
    return { x, y, w };
  });
  // C-blokkenes "arme" (venstre side og bund) omkring de indre blokke
  byCol["#3d5a80"].push(bx(0.12, rowH * 3, 0.07, blkRect[2].x + 0.06, blkRect[3].y - rowH / 2 + 0.02, 0.08), bx(0.9, 0.1, 0.07, blkRect[2].x + 0.45, blkRect[4].y - rowH / 2 - 0.04, 0.08));
  byCol["#3d5a80"].push(bx(0.12, rowH * 1.4, 0.07, blkRect[3].x + 0.06, blkRect[4].y + 0.03, 0.08), bx(0.7, 0.08, 0.07, blkRect[3].x + 0.35, blkRect[4].y - rowH / 2 + 0.0, 0.08));
  Object.entries(byCol).forEach(([c, gs]) => mesh(merge(gs), std(c, { emissive: new T.Color(c), emissiveIntensity: 0.25 }), [0, 0, 0], S3));
  // forskyd "sig point" ned under løkkens bund
  const blkTex = K.canvasTexture(1024, 860, (g, w, h) => {
    g.textBaseline = "middle"; g.fillStyle = "#ffffff"; g.font = '700 46px "Familjen Grotesk", sans-serif';
    PROG.forEach((p, r) => { const px = (blkRect[r].x - (bx3 - BW / 2)) / BW * w + 22, py = (bTop + 0.05 - blkRect[r].y) / BH * h; g.fillText(p.blk, px, py); });
  });
  mesh(new T.PlaneGeometry(BW, BH), texMat(blkTex), [bx3, bTop + 0.05 - BH / 2, 0.122], S3);
  // højre: samme program som tekst
  const cc3 = liveCanvas(1024, 860);
  function drawCode3(hi) {
    if (cc3.key === hi) return; cc3.key = hi;
    const g = cc3.g, w = cc3.w, h = cc3.h;
    g.fillStyle = "#0a1120"; g.fillRect(0, 0, w, h);
    g.textBaseline = "middle";
    PROG.forEach((p, r) => {
      const y = (bTop + 0.05 - blkRect[r].y) / BH * h;
      if (r === hi) { g.fillStyle = "rgba(79,209,197,0.22)"; g.fillRect(0, y - 46, w, 92); g.fillStyle = B; g.fillRect(0, y - 46, 10, 92); }
      g.fillStyle = "#4a5578"; g.font = '500 40px "JetBrains Mono", monospace'; g.fillText(String(r + 1), 30, y);
      g.font = '600 42px "JetBrains Mono", monospace';
      // enkel farvelægning: nøgleord turkis, kommentar grå, resten lys
      const t = p.txt; let x = 100;
      if (t.trim().startsWith("#")) { g.fillStyle = "#6b7a9c"; g.fillText(t, x, y); return; }
      t.split(/(\bfor\b|\bin\b|\bif\b|\brange\b|\bprint\b|[=+():])/).forEach(tok => {
        if (!tok) return;
        g.fillStyle = /^(for|in|if)$/.test(tok) ? "#4fd1c5" : /^(range|print)$/.test(tok) ? "#9cc3ff" : /^[=+():]$/.test(tok) ? "#a9b0d6" : /^\d+$/.test(tok.trim()) ? "#ffd27a" : "#eef1ff";
        g.fillText(tok, x, y); x += g.measureText(tok).width;
      });
    });
    cc3.tex.needsUpdate = true;
  }
  drawCode3(-1);
  const tx3 = 1.45;
  mesh(new T.BoxGeometry(BW + 0.2, BH + 0.2, 0.04), std("#111a2e"), [tx3, bTop - BH / 2 + 0.05, 0.02], S3);
  mesh(new T.PlaneGeometry(BW, BH), basic("#ffffff", { map: cc3.tex }), [tx3, bTop + 0.05 - BH / 2, 0.045], S3);
  // markeringen på blokkene, der følger samme linje som teksten
  const hlMat = basic("#eafffb", { transparent: true, opacity: 0.0, depthWrite: false });
  const hl3 = mesh(merge([bx(1, 0.02, 0.02, 0, 0.5, 0), bx(1, 0.02, 0.02, 0, -0.5, 0), bx(0.02, 1, 0.02, -0.5, 0, 0), bx(0.02, 1, 0.02, 0.5, 0, 0)]), hlMat, [0, 0, 0.13], S3);
  // en bro af lys mellem de to markeringer
  const bridgeMat = basic(B, { transparent: true, opacity: 0, depthWrite: false });
  const bridge3 = mesh(bx(1, 0.012, 0.012, 0.5, 0, 0), bridgeMat, [0, 0, 0.13], S3);
  label("Blokke", [bx3, 0.62, 0.06], S3, 0.16);
  label("Tekst", [tx3, 0.62, 0.06], S3, 0.16);
  mesh(merge([bx(0.18, 0.035, 0.03, 0, 0.04, 0), bx(0.18, 0.035, 0.03, 0, -0.04, 0)]), basic("#a9b0d6"), [0, 1.85, 0.06], S3);   // lighedstegn
  signAt("b2-3", "0 3.45 0.1", 2.3);
  ctx.station("b2-3", S3);

  /* ================= B2.4 · Fejlfinding ================= */
  const S4 = ST["b2-4"].g;
  mesh(merge([bx(3.1, 0.06, 1.0, 0, 0.84, 0), bx(0.06, 0.84, 0.06, -1.45, 0.42, 0.42), bx(0.06, 0.84, 0.06, 1.45, 0.42, 0.42), bx(0.06, 0.84, 0.06, -1.45, 0.42, -0.42), bx(0.06, 0.84, 0.06, 1.45, 0.42, -0.42)]), std("#252d48"), [0, 0, 0], S4);
  const PROGS = [
    { lines: ["start()", "frem(2)", "drje(højre)", "frem(1)"], kind: "syntaks", turn: 1 },
    { lines: ["start()", "frem(2)", "drej(venstre)", "frem(1)"], kind: "logisk", turn: -1 },
  ];
  const boardTex4 = K.canvasTexture(500, 300, (g, w, h) => {
    g.fillStyle = "#e9edf5"; g.fillRect(0, 0, w, h);
    g.strokeStyle = "#8d97b0"; g.lineWidth = 4; for (let i = 0; i <= 5; i++) { g.beginPath(); g.moveTo(i * 100, 0); g.lineTo(i * 100, h); g.stroke(); } for (let j = 0; j <= 3; j++) { g.beginPath(); g.moveTo(0, j * 100); g.lineTo(w, j * 100); g.stroke(); }
  });
  const CS = 0.22;     // cellestørrelse på de små brætter
  const P4 = PROGS.map((pr, k) => {
    const x0 = k ? 0.78 : -0.78;
    // skærm på fod
    mesh(merge([bx(1.32, 0.94, 0.06, x0, 1.72, -0.35), bx(0.08, 0.36, 0.06, x0, 1.07, -0.38), bx(0.4, 0.03, 0.25, x0, 0.885, -0.36)]), std("#151c30"), [0, 0, 0], S4);
    const cv = liveCanvas(640, 440);
    mesh(new T.PlaneGeometry(1.24, 0.852), basic("#ffffff", { map: cv.tex }), [x0, 1.72, -0.318], S4);
    // brættet foran skærmen med figur og mål
    const bg = group([x0, 0.875, 0.12], S4);
    const bp = new T.PlaneGeometry(5 * CS, 3 * CS); bp.rotateX(-Math.PI / 2);
    mesh(bp, std("#ffffff", { map: boardTex4 }), [0, 0, 0], bg);
    const sg = starG.clone(); sg.scale(0.4, 1, 0.4);
    const cell = (i, j) => [(i - 2) * CS, (j - 1) * CS];
    mesh(sg, basic(B), [cell(2, 2)[0], 0.004, cell(2, 2)[1]], bg);
    const f = group([0, 0, 0], bg);
    const fm = std("#3d5a80", { emissive: new T.Color("#9fb6d8"), emissiveIntensity: 0.15 });
    mesh(figureGeo(0.42), fm, [0, 0, 0], f);
    // forkert slutfelt markeres rødt (logisk fejl)
    const wrongMat = basic(RED, { transparent: true, opacity: 0 });
    const wp = new T.PlaneGeometry(CS * 0.9, CS * 0.9); wp.rotateX(-Math.PI / 2);
    mesh(wp, wrongMat, [cell(2, 0)[0], 0.003, cell(2, 0)[1]], bg);
    const tag = label(pr.kind === "syntaks" ? "Syntaksfejl" : "Logisk fejl", [x0, 2.36, -0.32], S4, 0.17, { edge: RED });
    return { ...pr, cv, f, fm, cell, wrongMat, tag, x0 };
  });
  function drawCode4(p, line, state) {
    const key = `${line}:${state}`; if (p.cv.key === key) return; p.cv.key = key;
    const g = p.cv.g, w = p.cv.w, h = p.cv.h;
    g.fillStyle = "#0a1120"; g.fillRect(0, 0, w, h);
    g.fillStyle = "#121b30"; g.fillRect(0, 0, w, 64);
    g.fillStyle = "#a9b0d6"; g.font = '600 32px "Source Sans 3", sans-serif'; g.textBaseline = "middle";
    g.fillText(p.kind === "syntaks" ? "Program A" : "Program B", 24, 33);
    // status i titellinjen
    const st = state === "error" ? ["Stoppet", RED] : state === "done" ? ["Færdig", B] : state === "run" ? ["Kører …", "#cfe9ff"] : ["", "#fff"];
    g.textAlign = "right"; g.fillStyle = st[1]; g.font = '700 32px "Source Sans 3", sans-serif'; g.fillText(st[0], w - 24, 33); g.textAlign = "left";
    p.lines.forEach((t, r) => {
      const y = 112 + r * 76;
      if (r === line) { const bad = state === "error"; g.fillStyle = bad ? "rgba(255,90,79,0.25)" : "rgba(79,209,197,0.2)"; g.fillRect(0, y - 34, w, 68); g.fillStyle = bad ? RED : B; g.fillRect(0, y - 34, 8, 68); }
      g.fillStyle = "#4a5578"; g.font = '500 34px "JetBrains Mono", monospace'; g.fillText(String(r + 1), 22, y);
      g.fillStyle = "#eef1ff"; g.font = '600 40px "JetBrains Mono", monospace'; g.fillText(t, 74, y);
      if (state === "error" && r === line) {   // bølget rød streg under den forkert stavede kommando
        const tw = g.measureText(t.split("(")[0]).width; g.strokeStyle = RED; g.lineWidth = 4; g.beginPath();
        for (let x = 0; x <= tw; x += 8) g.lineTo(74 + x, y + 26 + ((x / 8) % 2 ? 5 : -2)); g.stroke();
      }
    });
    if (state === "error") { g.fillStyle = RED; g.font = '700 34px "Source Sans 3", sans-serif'; g.fillText("Ukendt kommando i linje 3", 24, h - 34); }
    if (state === "done" && p.kind === "logisk") { g.fillStyle = "#ffb3ab"; g.font = '700 34px "Source Sans 3", sans-serif'; g.fillText("Kørte uden fejl – men nåede ikke målet", 24, h - 34); }
    p.cv.tex.needsUpdate = true;
  }
  P4.forEach(p => drawCode4(p, -1, "idle"));
  signAt("b2-4", "0 2.85 -0.35", 1.9);
  ctx.station("b2-4", S4);

  /* ================= B2.5 · Generativ kunstig intelligens som værktøj ================= */
  const S5 = ST["b2-5"].g;
  // talebobblen: en udfyldt boble med en hale, der peger ned mod en elevfigur
  const bub = new T.Shape(); { const w = 1.0, h = 0.42, r = 0.16;
    bub.moveTo(-w + r, -h); bub.lineTo(-0.35, -h); bub.lineTo(-0.55, -h - 0.25); bub.lineTo(-0.15, -h); bub.lineTo(w - r, -h); bub.quadraticCurveTo(w, -h, w, -h + r); bub.lineTo(w, h - r); bub.quadraticCurveTo(w, h, w - r, h); bub.lineTo(-w + r, h); bub.quadraticCurveTo(-w, h, -w, h - r); bub.lineTo(-w, -h + r); bub.quadraticCurveTo(-w, -h, -w + r, -h); }
  const bubG = new T.ExtrudeGeometry(bub, { depth: 0.06, bevelEnabled: false, curveSegments: 4 });
  const bubble = group([-0.85, 2.15, 0.0], S5);
  mesh(bubG, std("#eef3ff"), [0, 0, -0.03], bubble);
  const bubTex = K.canvasTexture(1024, 420, (g, w, h) => {
    g.fillStyle = "#13203a"; g.font = '600 62px "Source Sans 3", sans-serif'; g.textAlign = "center"; g.textBaseline = "middle";
    K.wrap(g, "Lav et program, der tæller, hvor mange dage det har regnet.", w - 100).forEach((l, i, a) => g.fillText(l, w / 2, h / 2 + (i - (a.length - 1) / 2) * 76));
  });
  mesh(new T.PlaneGeometry(1.9, 0.78), texMat(bubTex), [0, 0, 0.035], bubble);
  // eleven, der spørger
  const student = mesh(figureGeo(1.45), std("#c9d6ea"), [-1.55, 0, -0.1], S5, [0, 30, 0]);
  // "modellen": en neutral, lysende form (ingen logoer) mellem boblen og koden
  const hub = group([0.25, 1.75, 0.1], S5);
  const hubMat = std("#bff7f1", { emissive: new T.Color(B), emissiveIntensity: 0.5, transparent: true, opacity: 0.9 });
  mesh(new T.IcosahedronGeometry(0.17, 0), hubMat, [0, 0, 0], hub);
  // kodepanelet med linjer, der kan klikkes på
  const AI = [
    { t: "dage = 0", q: "Hvorfor starte på 0?" },
    { t: "for dag in målinger:", q: "Hvor kommer målingerne fra?" },
    { t: "    if dag.regn > 0.2:", q: "Hvorfor netop 0,2 mm?" },
    { t: "        dage += 1", q: "Hvorfor dage og ikke timer?" },
    { t: "print(dage)", q: "Hvem skal bruge tallet?" },
  ];
  const PX = 1.15, PY = 1.75, LH = 0.24, PW = 1.75;
  mesh(new T.BoxGeometry(PW + 0.16, 1.62, 0.05), std("#111a2e"), [PX, PY, 0.0], S5);
  const lines5 = AI.map((a, i) => {
    const y = PY + 0.52 - i * LH;
    const tex = K.canvasTexture(1024, 136, (g, w, h) => {
      g.fillStyle = "#0a1120"; g.fillRect(0, 0, w, h);
      g.fillStyle = "#4a5578"; g.font = '500 54px "JetBrains Mono", monospace'; g.textBaseline = "middle"; g.fillText(String(i + 1), 24, h / 2);
      g.fillStyle = "#eef1ff"; g.font = '600 58px "JetBrains Mono", monospace'; g.fillText(a.t, 100, h / 2);
    });
    const m = basic("#ffffff", { map: tex, transparent: true });
    const e = mesh(new T.PlaneGeometry(PW, PW * 136 / 1024), m, [PX, y, 0.03], S5);
    // spørgsmålstegnet ved linjen
    const q = label("?", [PX + PW / 2 + 0.14, y, 0.05], S5, 0.17, { ink: "#ffffff" });
    ctx.onClick(e, () => { picked = i; pickedAt = now; });
    ctx.onClick(q, () => { picked = i; pickedAt = now; });
    return { e, m, q, y };
  });
  // boblen "hvorfor sådan?" ved den valgte linje
  const why = liveCanvas(820, 210);
  function drawWhy(i) {
    if (why.key === i) return; why.key = i;
    const g = why.g, w = why.w, h = why.h; g.clearRect(0, 0, w, h);
    g.fillStyle = "#eef3ff"; K.roundRect(g, 6, 6, w - 12, h - 12, 26); g.fill(); g.strokeStyle = B; g.lineWidth = 6; g.stroke();
    g.fillStyle = "#3a8f88"; g.font = '700 46px "Familjen Grotesk", sans-serif'; g.textBaseline = "middle"; g.fillText("Hvorfor sådan?", 34, 62);
    g.fillStyle = "#13203a"; g.font = '600 50px "Source Sans 3", sans-serif'; g.fillText(i >= 0 ? AI[i].q : "", 34, 146);
    why.tex.needsUpdate = true;
  }
  const whyE = mesh(new T.PlaneGeometry(1.25, 0.32), texMat(why.tex), [PX + 0.3, 0, 0.12], S5);
  const lineHl = mesh(new T.PlaneGeometry(PW + 0.06, LH - 0.02), basic(B, { transparent: true, opacity: 0.25, depthWrite: false }), [PX, 0, 0.025], S5);
  let picked = -1, pickedAt = 0, now = 0;
  signAt("b2-5", `0.2 3.15 0`, 2.3);
  ctx.station("b2-5", S5);

  /* ---------- views ---------- */
  ctx.view("b2-0", { position: [0, 0, 4.6], lookAt: [0, 0, -3] });
  stationIds.forEach(id => { const L = ST[id].look || ST[id].p; ctx.view(id, { position: [ST[id].view[0], 0, ST[id].view[1]], lookAt: [L[0], 0, L[1]] }); });

  /* ---------- tilstand og animation ---------- */
  let mode = null, t0 = 0, fresh = true;
  const lerp3 = (a, b, f) => a.map((v, i) => v + (b[i] - v) * f);

  return {
    onStep(id) { mode = id; fresh = true; picked = -1; },
    tick(t) {
      now = t;
      if (fresh) { t0 = t; fresh = false; }
      // testkrog: window.__roomS låser animationstiden (bruges kun af skærmbilledværktøjet)
      const s = typeof window.__roomS === "number" ? window.__roomS : (t - t0) / 1000;

      /* flowdiagrammet kører altid; i b2-0 er det tydeligst */
      const fOn = mode === "b2-0" ? 1 : 0.55;
      flowMat.opacity = 0.55 + 0.45 * fOn;
      const fc = (t / 1000) % 12, yes = Math.floor(t / 12000) % 2 === 0;
      const route = fc < 6 ? (yes ? routeYes : routeYes.slice(0, 3).concat([[1010, 660], [1470, 660], [1860, 660], [1860, 440]])) : routeNo;
      const pt = polyAt(route, fc < 6 ? fc / 6 : (fc - 6) / 6);
      const [lx, ly] = cv2loc(pt);
      token.object3D.position.set(lx, ly, 0.06);
      drawFlow(nearNode(pt));

      /* stationernes lamper: i b2-0 tænder de én efter én; ellers kun den aktive */
      stationIds.forEach((id, i) => {
        const on = mode === "b2-0" ? ease((s - 0.6 - i * 0.55) / 0.4) : (id === mode ? 1 : 0);
        ST[id].mat.emissiveIntensity = 0.12 + 1.4 * on;
      });

      /* B2.1: brikkerne samles til et program, og en prik kører rundt i løkken */
      const a1 = mode === "b2-1";
      parts1.forEach((p, i) => {
        const f = a1 ? ease((s - 0.4 - i * 0.45) / 0.7) : 0;
        const v = lerp3(p.a, p.b, f);
        p.e.object3D.position.set(v[0], v[1] + Math.sin(f * Math.PI) * 0.25, v[2]);
        p.e.object3D.rotation.set(v[3] * D2R, v[4] * D2R, v[5] * D2R);
      });
      const r1 = a1 && s > 3.2; run1.object3D.visible = r1;
      if (r1) {   // rundt i løkkens klamme: ned langs venstre side, hen over bunden og tilbage
        const u = ((s - 3.2) / 1.6) % 1, L = parts1[3].b;
        const pts = [[-0.72, 0.42], [-0.72, -0.42], [0.25, -0.42], [0.25, 0.0], [-0.1, 0.0], [-0.72, 0.42]];
        const q = polyAt(pts, u); run1.object3D.position.set(L[0] + q[0], L[1] + q[1], L[2] + 0.1);
        brMat.emissive = brMat.emissive || new T.Color(); brMat.emissive.set(B); brMat.emissiveIntensity = Math.abs(u - 0.62) < 0.08 ? 0.9 : 0.1;
      } else { brMat.emissiveIntensity = 0; }
      brLbl.forEach(l => l.object3D.visible = a1 && s > 2.7);

      /* B2.2: figuren følger kortene og går forkert ved den uklare instruks */
      const a2 = mode === "b2-2";
      const c2 = a2 ? s % 13 : 0;
      const k2 = a2 ? Math.min(6, Math.floor((c2 - 0.6) / 1.3) + 1) : 0;     // antal kort, der er udført eller i gang
      const cur = a2 && c2 > 0.6 ? Math.min(5, Math.floor((c2 - 0.6) / 1.3)) : -1;
      const fr = a2 && c2 > 0.6 ? clamp01(((c2 - 0.6) % 1.3) / 1.0) : 0;
      cards.forEach((cd, k) => { cd.hl.opacity = k === cur && c2 < 8.4 ? 0.9 : 0; cd.e.object3D.position.y = 0.02 + (k === cur && c2 < 8.4 ? 0.06 : 0); });
      let st0 = plan[0], st1 = plan[0], f2 = 0;
      if (cur >= 0) { st0 = plan[cur]; st1 = plan[cur + 1]; f2 = cur === 4 ? ease(clamp01((fr - 0.45) / 0.55)) : ease(fr); }
      if (c2 >= 8.4) { st0 = st1 = plan[6]; f2 = 1; }
      const ip = st0.i + (st1.i - st0.i) * f2, jp = st0.j + (st1.j - st0.j) * f2;
      let ang0 = -st0.d * 90, ang1 = -st1.d * 90; if (ang1 - ang0 > 180) ang1 -= 360; if (ang0 - ang1 > 180) ang1 += 360;
      fig2.object3D.position.set(gx(ip), Math.abs(Math.sin(f2 * Math.PI * 2)) * 0.04 * (st0.i !== st1.i || st0.j !== st1.j ? 1 : 0), gz(jp));
      fig2.object3D.rotation.y = (ang0 + (ang1 - ang0) * f2) * D2R + (cur === 4 && fr < 0.45 ? Math.sin(t * 0.02) * 0.25 : 0);
      const wrong = a2 && (cur === 4 || c2 >= 7.3);
      qMark.object3D.visible = wrong;
      qMark.object3D.rotation.y = -fig2.object3D.rotation.y;
      fig2Mat.emissive.set(a2 && c2 >= 8.4 ? RED : "#9fb6d8"); fig2Mat.emissiveIntensity = a2 && c2 >= 8.4 ? 0.4 : 0.15;
      ghostMat.opacity = a2 && c2 >= 8.6 ? 0.85 * ((Math.floor(t / 350) % 2) ? 1 : 0.4) : 0;
      endMat.opacity = a2 && c2 >= 8.4 ? 0.55 : 0;
      goalMat.color.set(a2 && c2 >= 8.6 ? "#eafffb" : B);

      /* B2.3: samme linje markeres i blokkene og i teksten */
      const a3 = mode === "b2-3";
      const r3 = a3 ? Math.floor(s / 1.1) % (PROG.length + 1) : -1;
      const hi = r3 < PROG.length ? r3 : -1;
      drawCode3(hi);
      hlMat.opacity = hi >= 0 ? 0.9 : 0; bridgeMat.opacity = hi >= 0 ? 0.6 : 0;
      if (hi >= 0) {
        const R = blkRect[hi];
        const w = PROG[hi].c ? 1.55 - PROG[hi].ind * 0.22 : 1.45 - PROG[hi].ind * 0.22 + (PROG[hi].hat ? 0.25 : 0);
        hl3.object3D.position.set(R.x + w / 2, R.y, 0.13); hl3.object3D.scale.set(w + 0.06, rowH + 0.02, 1);
        const x1 = R.x + w + 0.03, x2 = tx3 - BW / 2;
        bridge3.object3D.position.set(x1, R.y, 0.13); bridge3.object3D.scale.set(Math.max(0.01, x2 - x1), 1, 1);
      }

      /* B2.4: to programmer kører samtidig */
      const a4 = mode === "b2-4";
      const c4 = a4 ? s % 9 : 0;
      P4.forEach(p => {
        // linje og tilstand ud fra tiden
        let line = -1, state = "idle";
        if (a4) {
          if (c4 < 0.5) { line = -1; state = "run"; }
          else if (c4 < 1.3) { line = 0; state = "run"; }
          else if (c4 < 2.7) { line = 1; state = "run"; }
          else if (p.kind === "syntaks") { line = 2; state = "error"; }
          else if (c4 < 3.5) { line = 2; state = "run"; }
          else if (c4 < 4.4) { line = 3; state = "run"; }
          else { line = -1; state = "done"; }
        }
        drawCode4(p, line, state);
        // figurens bevægelse: frem 2 (østpå), drej, frem 1
        const m2 = a4 ? ease((c4 - 1.4) / 1.2) : 0;
        const tn = a4 && p.kind === "logisk" ? ease((c4 - 2.8) / 0.5) : 0;
        const m1 = a4 && p.kind === "logisk" ? ease((c4 - 3.6) / 0.7) : 0;
        const ci = 0 + 2 * m2, cj = 1 + p.turn * m1;
        const [x, z] = p.cell(ci, cj);
        p.f.object3D.position.set(x, 0, z);
        p.f.object3D.rotation.y = (-90 + p.turn * -90 * tn) * D2R;
        const err = a4 && state === "error";
        p.fm.emissive.set(err ? RED : "#9fb6d8"); p.fm.emissiveIntensity = err ? 0.6 + 0.4 * Math.sin(t * 0.012) : 0.15;
        p.wrongMat.opacity = a4 && p.kind === "logisk" && state === "done" ? 0.75 : 0;
        p.tag.object3D.visible = !a4 || state === "error" || state === "done";
      });

      /* B2.5: talebobblen bliver til kode, og hver linje får et spørgsmålstegn */
      const a5 = mode === "b2-5";
      const sb = a5 ? ease((s - 2.2) / 0.9) : 0;    // boblen suges ind i modellen
      bubble.object3D.position.set(-0.85 + 1.1 * sb, 2.15 - 0.4 * sb, 0.0);
      bubble.object3D.scale.setScalar(Math.max(0.001, 1 - 0.95 * sb));
      bubble.object3D.visible = !a5 || s < 3.1;
      hub.object3D.rotation.set(t * 0.0007, t * 0.001, 0);
      const busy = a5 && s > 2.6 && s < 5.2;
      hubMat.emissiveIntensity = busy ? 1.2 + 0.6 * Math.sin(t * 0.02) : 0.45;
      hub.object3D.scale.setScalar(busy ? 1.25 : 1);
      lines5.forEach((L, i) => {
        const ap = a5 ? ease((s - 3.3 - i * 0.35) / 0.3) : 1;
        L.m.opacity = 0.15 + 0.85 * ap;
        L.e.object3D.position.x = PX + (1 - ap) * -0.4;
        const qa = a5 ? ease((s - 5.4 - i * 0.25) / 0.25) : 0;
        L.q.object3D.visible = qa > 0.02; L.q.object3D.scale.setScalar(0.4 + 0.6 * qa);
      });
      // uden klik vises et "hvorfor sådan?" ad gangen; et klik på en linje vælger den
      let sel = -1;
      if (a5 && s > 6.8) sel = picked >= 0 && t - pickedAt < 8000 ? picked : [2, 0, 3, 1, 4][Math.floor((s - 6.8) / 2.6) % 5];
      drawWhy(sel);
      whyE.object3D.visible = sel >= 0; lineHl.object3D.visible = sel >= 0;
      if (sel >= 0) { whyE.object3D.position.set(PX + 0.35, lines5[sel].y - 0.27, 0.12); lineHl.object3D.position.set(PX, lines5[sel].y, 0.025); }
    },
  };
}
