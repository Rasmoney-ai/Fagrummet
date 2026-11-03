/* Delrum A1 · Værkstedet — Kreative processer.
   Et værksted om natten: betongulv, hulplader med værktøj, lysstofrør. Fire arbejdsborde står i en halvcirkel
   langs en skala på gulvet med to poler: til venstre design (udfylde et behov, løse et problem), til højre de
   åbne tilgange (udforske, eksperimentere, provokere). Døren tilbage til Atelieret sidder mellem de to grupper.
   Trin: a1-0 (skalaen og de to grupper), a1-1 designprocesser, a1-2 innovation og entreprenørskab,
   a1-3 materielle betingelser (klikbar komponentkasse), a1-4 æstetisk/kritisk produkt (lampe og telefon). */

export default function build(ctx) {
  const { THREE, kit, K } = ctx;
  const A = ctx.room.color;
  const T = vaerktoej(ctx);
  const { Batch } = T;
  const D = Math.PI / 180;

  ctx.env({ background: "#070912", fog: "type: linear; color: #070912; near: 12; far: 26" });

  /* ---------- Rummet ---------- */
  const X = 7, Z0 = -7.2, Z1 = 5.6, H = 4.4;
  // betongulv med fuger og pletter
  const gulvTex = T.canvas(1024, 1024, (g, w, h) => {
    const r = T.rng(4);
    g.fillStyle = "#3d3f4a"; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 2600; i++) { const v = 50 + r() * 30; g.fillStyle = `rgba(${v},${v},${v + 8},0.35)`; g.fillRect(r() * w, r() * h, 1 + r() * 3, 1 + r() * 3); }
    for (let i = 0; i < 14; i++) { const gr = g.createRadialGradient(0, 0, 0, 0, 0, 60 + r() * 120); gr.addColorStop(0, "rgba(20,20,28,0.22)"); gr.addColorStop(1, "rgba(20,20,28,0)"); g.save(); g.translate(r() * w, r() * h); g.fillStyle = gr; g.fillRect(-200, -200, 400, 400); g.restore(); }
    g.fillStyle = "rgba(15,15,22,0.8)"; g.fillRect(0, 0, w, 3); g.fillRect(0, 0, 3, h);
  });
  gulvTex.wrapS = gulvTex.wrapT = THREE.RepeatWrapping; gulvTex.repeat.set(X * 2 / 3, (Z1 - Z0) / 3);
  const gulvGeo = T.hold(new THREE.PlaneGeometry(X * 2, Z1 - Z0)); gulvGeo.rotateX(-Math.PI / 2);
  T.mesh(ctx.root, gulvGeo, T.hold(new THREE.MeshStandardMaterial({ map: gulvTex, roughness: 0.95 })), `0 0 ${(Z0 + Z1) / 2}`);

  // vægge: hulplade øverst med værktøjssilhuetter, mørke skabe nederst (tegnet i samme tekstur)
  const vaegTex = T.canvas(1024, 512, (g, w, h) => {
    const r = T.rng(8);
    g.fillStyle = "#4a3f36"; g.fillRect(0, 0, w, h);
    g.fillStyle = "rgba(15,10,8,0.85)";
    for (let y = 10; y < h; y += 22) for (let x = 10; x < w; x += 22) { g.beginPath(); g.arc(x, y, 3.2, 0, 7); g.fill(); }
    // værktøj: hammer, skruetrækkere, tang, sav, saks, linealer, ledningsruller
    const tools = [
      (x, y) => { g.fillStyle = "#8a6238"; g.fillRect(x - 6, y, 12, 120); g.fillStyle = "#7d8496"; g.fillRect(x - 30, y - 8, 60, 22); },
      (x, y) => { g.fillStyle = ["#d14b3c", "#e8b23c", "#3a76c4"][Math.floor(r() * 3)]; K.roundRect(g, x - 9, y, 18, 60, 6); g.fill(); g.fillStyle = "#b9bfcc"; g.fillRect(x - 2, y + 60, 4, 70); },
      (x, y) => { g.strokeStyle = "#b9bfcc"; g.lineWidth = 8; g.beginPath(); g.moveTo(x - 6, y); g.lineTo(x + 18, y + 60); g.moveTo(x + 6, y); g.lineTo(x - 18, y + 60); g.stroke(); g.strokeStyle = "#d14b3c"; g.lineWidth = 12; g.beginPath(); g.moveTo(x + 14, y + 50); g.lineTo(x + 26, y + 110); g.moveTo(x - 14, y + 50); g.lineTo(x - 26, y + 110); g.stroke(); },
      (x, y) => { g.fillStyle = "#b9bfcc"; g.beginPath(); g.moveTo(x - 14, y + 40); g.lineTo(x + 14, y + 40); g.lineTo(x + 6, y + 190); g.lineTo(x - 14, y + 190); g.fill(); g.fillStyle = "#6b4f36"; K.roundRect(g, x - 22, y, 44, 44, 10); g.fill(); },
      (x, y) => { g.strokeStyle = "#e8b23c"; g.lineWidth = 9; g.beginPath(); g.arc(x, y + 50, 26, 0, 7); g.stroke(); g.strokeStyle = "#2a2a33"; g.lineWidth = 6; for (let k = 0; k < 3; k++) { g.beginPath(); g.arc(x, y + 50, 16 - k * 5, 0, 7); g.stroke(); } },
      (x, y) => { g.fillStyle = "#c9b98a"; g.fillRect(x - 7, y, 14, 160); g.fillStyle = "#3a3a44"; for (let k = 0; k < 16; k++) g.fillRect(x - 7, y + k * 10, k % 2 ? 5 : 9, 1.5); },
    ];
    for (let x = 60; x < w; x += 70 + r() * 40) tools[Math.floor(r() * tools.length)](x, 40 + r() * 70);
    // skabe nederst
    g.fillStyle = "#23202a"; g.fillRect(0, h * 0.66, w, h * 0.34);
    for (let x = 0; x < w; x += 128) { g.fillStyle = "#2c2833"; g.fillRect(x + 4, h * 0.66 + 6, 120, h * 0.34 - 12); g.fillStyle = "#6b7299"; g.fillRect(x + 54, h * 0.66 + 26, 20, 5); }
    g.fillStyle = "#151219"; g.fillRect(0, h * 0.655, w, 8);
  });
  vaegTex.wrapS = THREE.RepeatWrapping;
  const vaegge = [[-X, Z0, X, Z0], [X, Z0, X, Z1], [X, Z1, -X, Z1], [-X, Z1, -X, Z0]];
  T.mesh(ctx.root, T.vaegGeo(vaegge, H, 4, H), T.hold(new THREE.MeshStandardMaterial({ map: vaegTex, color: "#b9b2c4", roughness: 0.9 })));

  const S = new Batch();     // belyst statisk geometri
  const L = new Batch();     // selvlysende (rør, pærer)
  const LYS = new Batch();   // additivt lys
  // loft: mørke plader og bjælker, lysstofrør i to rækker
  S.box("#151826", [0, H + 0.05, (Z0 + Z1) / 2], [X * 2, 0.1, Z1 - Z0]);
  for (let z = Z0 + 1.5; z < Z1; z += 3) S.box("#22263a", [0, H - 0.15, z], [X * 2, 0.3, 0.2]);
  for (const x of [-4.5, 4.5]) for (let z = -5.2; z <= 4.4; z += 3.2) {
    S.box("#2b2f40", [x, H - 0.42, z], [0.22, 0.06, 1.5]);
    L.box("#cfd8ff", [x, H - 0.47, z], [0.12, 0.04, 1.4]);
    for (const dz of [-0.6, 0.6]) S.box("#11131c", [x, H - 0.2, z + dz], [0.01, 0.4, 0.01]);
  }

  /* ---------- Skalaen på gulvet: to buer, én for hver slags proces ---------- */
  const CEN = [0, -1.6];      // halvcirklens centrum
  const RB = 2.6;            // skalaens radius
  const RS = 3.95;            // bordenes radius
  function bue(a0, a1, r0, r1, n) { // bånd langs en cirkelbue, uv.x følger buen
    const pos = [], uv = [], idx = [];
    for (let i = 0; i <= n; i++) {
      const a = (a0 + (a1 - a0) * i / n) * D;
      for (const [r, v] of [[r0, 0], [r1, 1]]) { pos.push(CEN[0] + Math.cos(a) * r, 0.014, CEN[1] - Math.sin(a) * r); uv.push(i / n, v); }
      if (i < n) { const k = i * 2; idx.push(k, k + 2, k + 1, k + 1, k + 2, k + 3); }
    }
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
    return T.hold(g);
  }
  // venstre bue (design): stram, lige linje med jævne streger. Højre bue (åbne tilgange): løs, prikket og snoet.
  const designTex = T.canvas(1024, 64, (g, w, h) => {
    g.fillStyle = A; g.fillRect(0, 22, w, 20);
    for (let x = 0; x <= w; x += 64) g.fillRect(x, 4, 8, 56);
  });
  const aabenTex = T.canvas(1024, 64, (g, w, h) => {
    g.fillStyle = A; g.strokeStyle = A; g.lineWidth = 11; g.lineCap = "round";
    g.beginPath(); for (let x = 0; x <= w; x += 4) { const y = 32 + Math.sin(x / 28) * 16 * Math.min(1, x / 200); x ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke();
    for (let x = 30; x < w; x += 46) { g.beginPath(); g.arc(x, 32 + Math.cos(x / 9) * 22, 6, 0, 7); g.fill(); }
  });
  const buer = [
    { geo: bue(196, 92, RB - 0.17, RB + 0.17, 48), tex: designTex },
    { geo: bue(88, -16, RB - 0.17, RB + 0.17, 48), tex: aabenTex },
  ].map(b => {
    const m = T.hold(new THREE.MeshBasicMaterial({ map: b.tex, transparent: true, opacity: 0.5, depthWrite: false }));
    T.mesh(ctx.root, b.geo, m); return m;
  });
  // en svag mørk underlægning, så buerne står tydeligt på betonen
  T.mesh(ctx.root, bue(200, -20, RB - 0.32, RB + 0.32, 64), T.hold(new THREE.MeshBasicMaterial({ color: "#000000", transparent: true, opacity: 0.5, depthWrite: false })));

  // to bannere hænger over hver sin gruppe: design til venstre, de åbne tilgange til højre
  const polTekst = [["Design", "udfylde et behov · løse et problem"], ["Åbne tilgange", "udforske · eksperimentere · provokere"]];
  const polSkilte = [145, 35].map((ang, i) => {
    const a = ang * D, x = CEN[0] + Math.cos(a) * (RS + 0.35), z = CEN[1] - Math.sin(a) * (RS + 0.35);
    const yaw = Math.atan2(CEN[0] - x, CEN[1] - z) / D;
    const g = kit.grp(ctx.root, `${x} 0 ${z}`, { rotation: `0 ${yaw} 0` });
    for (const sx of [-0.95, 0.95]) S.box("#11131c", [x + Math.cos(yaw * D) * sx, (H + 3.8) / 2, z - Math.sin(yaw * D) * sx], [0.012, H - 3.8, 0.012]);
    return ctx.sign(polTekst[i][0], { parent: g, sub: polTekst[i][1], position: "0 3.45 0", width: 2.3, size: 82 });
  });
  /* ---------- Stationerne ---------- */
  const STATION = [
    { id: "a1-1", ang: 166 }, { id: "a1-2", ang: 123 }, { id: "a1-3", ang: 57 }, { id: "a1-4", ang: 14 },
  ];
  const stationer = {};
  // små lysende markeringer på skalaen ud for hver station
  STATION.forEach(st => { const a = st.ang * D; L.cyl(A, [CEN[0] + Math.cos(a) * RB, 0.02, CEN[1] - Math.sin(a) * RB], 0.11, 0.02, null, 16); });
  const poolTex = T.glow(A);
  STATION.forEach(st => {
    const a = st.ang * D;
    const x = CEN[0] + Math.cos(a) * RS, z = CEN[1] - Math.sin(a) * RS;
    const dx = CEN[0] - x, dz = CEN[1] - z, len = Math.hypot(dx, dz);
    const yaw = Math.atan2(dx / len, dz / len) / D;
    const g = kit.grp(ctx.root, `${x} 0 ${z}`, { rotation: `0 ${yaw} 0` });
    // arbejdsbord: tyk bøgeplade, stålben, skuffe og stikdåse
    const B = new Batch();
    B.box("#b08a5c", [0, 0.9, 0], [1.7, 0.06, 0.85]);
    B.box("#8c6a44", [0, 0.86, 0], [1.66, 0.03, 0.81]);
    for (const lx of [-0.78, 0.78]) for (const lz of [-0.34, 0.34]) B.box("#3a3f55", [lx, 0.43, lz], [0.06, 0.86, 0.06]);
    for (const lx of [-0.78, 0.78]) B.box("#3a3f55", [lx, 0.12, 0], [0.05, 0.05, 0.7]);
    B.box("#3a3f55", [0, 0.12, 0], [1.56, 0.05, 0.05]);
    B.box("#2b2f40", [0.45, 0.78, 0.25], [0.55, 0.14, 0.4]);
    B.box("#6b7299", [0.45, 0.78, 0.452], [0.12, 0.02, 0.01]);
    B.box("#e8e4da", [-0.7, 0.95, -0.36], [0.22, 0.05, 0.07]);
    // lampen over bordet
    B.box("#11131c", [0, 3.55, 0], [0.012, 1.7, 0.012]);
    B.add(T.geo.cyl(14, 0.25), "#2b2420", [0, 2.72, 0], null, [0.5, 0.24, 0.5]);
    T.mesh(g, B.merge(), T.lit());
    const pære = T.mesh(g, T.hold(new THREE.CircleGeometry(0.22, 14).rotateX(Math.PI / 2)), T.hold(new THREE.MeshBasicMaterial({ color: "#ffd9a0" })), "0 2.595 0");
    const LK = new Batch(); LK.cone([0, 2.59, 0], 0.22, 1.0, 1.66, "#2e1d07");
    const kegleMat = T.additive({ opacity: 0.25 });
    T.mesh(g, LK.merge(), kegleMat);
    const pg = T.hold(new THREE.PlaneGeometry(2.4, 1.8)); pg.rotateX(-Math.PI / 2);
    const poolMat = T.hold(new THREE.MeshBasicMaterial({ map: poolTex, transparent: true, opacity: 0.2, depthWrite: false, blending: THREE.AdditiveBlending }));
    T.mesh(g, pg, poolMat, "0 0.935 0");
    ctx.station(st.id, g);
    ctx.sign(ctx.step(st.id).title, { parent: g, position: "0 2.08 -0.5", width: 1.6, size: 72 });
    // view: halvanden meter foran bordet, mod centrum
    const vx = x + dx / len * 1.55, vz = z + dz / len * 1.55;
    ctx.view(st.id, { position: [vx, 0, vz], lookAt: [x, 1.15, z] });
    stationer[st.id] = { g, pære, kegleMat, poolMat, x, z };
  });

  /* a1-1 · brugerkort → skitse → prototype */
  const d1 = designStation(stationer["a1-1"].g);
  /* a1-2 · dør ud mod en lille by */
  const d2 = innovationStation(stationer["a1-2"].g);
  /* a1-3 · komponentkassen */
  const d3 = tinkerStation(stationer["a1-3"].g);
  /* a1-4 · lampen og telefonen */
  const d4 = lampeStation(stationer["a1-4"].g);

  /* ---------- Baggrund: reoler med kasser, en søjleboremaskine og et skraldespand ---------- */
  const r = T.rng(31);
  const binF = ["#3a76c4", "#d14b3c", "#e8b23c", "#3aa35a", "#6b7299"];
  for (const side of [-1, 1]) {
    const x = side * (X - 0.35);
    for (const z0 of [2.6, 5.4]) {
      for (const y of [0.05, 0.6, 1.15, 1.7]) S.box("#2e2a33", [x, y, z0], [0.6, 0.04, 2.4]);
      for (const dz of [-1.18, 1.18]) S.box("#1f1c24", [x, 0.95, z0 + dz], [0.6, 1.9, 0.05]);
      for (const y of [0.07, 0.62, 1.17]) for (let k = 0; k < 5; k++) {
        const c = binF[Math.floor(r() * binF.length)];
        S.box(c, [x - side * 0.02, y + 0.14, z0 - 0.92 + k * 0.46], [0.5, 0.26, 0.4]);
        S.box("#e8e4da", [x - side * 0.27, y + 0.18, z0 - 0.92 + k * 0.46], [0.01, 0.06, 0.14]);
      }
    }
  }
  // søjleboremaskine i bageste venstre hjørne og en materialevogn i højre
  S.push([-6.3, 0, -6.6], [0, 30, 0]);
  S.box("#2b2f40", [0, 0.03, 0], [0.6, 0.06, 0.45]); S.cyl("#4d5b7a", [0, 0.8, -0.12], 0.05, 1.6, null, 8);
  S.box("#3a76c4", [0, 1.45, 0], [0.3, 0.32, 0.5]); S.box("#4d5b7a", [0, 0.75, 0.05], [0.4, 0.04, 0.35]); S.cyl("#b9bfcc", [0, 1.22, 0.12], 0.02, 0.16, null, 6);
  S.pop();
  S.push([6.2, 0, -6.6], [0, -25, 0]);
  for (const y of [0.25, 0.7]) S.box("#3a3f55", [0, y, 0], [1.0, 0.04, 0.6]);
  for (const lx of [-0.47, 0.47]) for (const lz of [-0.27, 0.27]) S.box("#2b2f40", [lx, 0.45, lz], [0.04, 0.9, 0.04]);
  for (let k = 0; k < 6; k++) S.box(k % 2 ? "#b8875a" : "#c79a68", [-0.3 + k * 0.1, 0.92, 0], [0.04, 0.4, 0.55], [0, 0, (k - 3) * 3]);
  S.box("#a87b52", [0.1, 0.4, 0], [0.7, 0.26, 0.4]);
  S.pop();

  T.mesh(ctx.root, S.merge(), T.lit());
  T.mesh(ctx.root, L.merge(), T.basic());

  /* ---------- Lys, dør, skilte ---------- */
  const lysRum = kit.el("a-entity", { position: "0 3.4 -1.2", light: "type: point; color: #ffcf96; intensity: 1.3; distance: 12; decay: 1.1" });
  ctx.door(ctx.room.parent, { position: `0 0 ${Z0 + 0.15}` });
  T.mesh(ctx.root, T.hold(new THREE.PlaneGeometry(1.6, 2.5)), T.hold(new THREE.MeshBasicMaterial({ color: "#04050b" })), `0 1.25 ${Z0 + 0.06}`);
  ctx.sign(ctx.room.name, { sub: ctx.room.sub, position: `0 3.75 ${Z0 + 0.08}`, width: 3.2 });
  const erk = T.erkendeformer(ctx.root, `2.6 3.75 ${Z0 + 0.1}`);

  ctx.view("a1-0", { position: [0, 0, 2.6], lookAt: [0, 0.55, -3.6] });

  /* ---------- Trin og animation ---------- */
  let aktiv = null, t0 = 0, tNu = 0;
  const lerp = (a, b, k) => a + (b - a) * k;
  return {
    onStep(id) { aktiv = id; t0 = tNu; d3.nulstil(); },
    tick(t, dt) {
      tNu = t; const s = (t - t0) / 1000;
      erk.tick(dt);
      // a1-0: de to grupper lyser skiftevis; ellers lyser kun den aktive stations lampe
      const intro = aktiv === "a1-0";
      const fase = intro ? Math.floor(s / 2.6) % 2 : -1;
      const blødt = intro ? Math.min(1, (s % 2.6) / 0.5) : 1;
      buer.forEach((m, i) => { m.opacity = intro ? (i === fase ? lerp(0.5, 1, blødt) : 0.4) : 0.55; });
      polSkilte.forEach((p, i) => { const mm = p.getObject3D("mesh"); if (mm) mm.material.opacity = intro ? (i === fase ? 1 : 0.7) : 0.9; });
      STATION.forEach((st, i) => {
        const o = stationer[st.id];
        const gruppe = i < 2 ? 0 : 1;
        const tændt = intro ? (gruppe === fase ? blødt : 0.15) : st.id === aktiv ? (aktiv === "a1-4" ? 0.3 : 1) : 0.12;
        o.kegleMat.opacity = 0.05 + 0.3 * tændt; o.poolMat.opacity = 0.05 + 0.5 * tændt;
        o.pære.getObject3D("mesh").material.color.setScalar(0.35 + 0.65 * tændt).multiply(new THREE.Color("#ffd9a0"));
      });
      d1.tick(aktiv === "a1-1" ? s : -1, dt);
      d2.tick(aktiv === "a1-2" ? s : -1, dt);
      d3.tick(aktiv === "a1-3" ? s : -1, dt);
      d4.tick(aktiv === "a1-4" ? s : -1, dt, lysRum);
      T.syncVis();
    },
    dispose() { T.dispose(); },
  };

  /* ================= Stationsmodellerne (lokale koordinater: bordplade y = 0.93, forside mod +z) ================= */

  function designStation(g) {
    const Y = 0.93;
    // tre små staffelier med brugerkort, skitse og prototype
    const kort = T.canvas(300, 420, (c, w, h) => {
      c.fillStyle = "#f3eee2"; K.roundRect(c, 0, 0, w, h, 18); c.fill();
      c.fillStyle = A; c.fillRect(0, 0, w, 64);
      c.fillStyle = "#1a1206"; c.font = '700 34px "Familjen Grotesk", sans-serif'; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText("BRUGER", w / 2, 34);
      c.fillStyle = "#c9b9a0"; c.beginPath(); c.arc(w / 2, 150, 56, 0, 7); c.fill();
      c.fillStyle = "#6b4f36"; c.beginPath(); c.arc(w / 2, 136, 30, 0, 7); c.fill();
      c.fillStyle = "#3a76c4"; c.beginPath(); c.ellipse(w / 2, 210, 48, 28, 0, Math.PI, 0); c.fill();
      c.fillStyle = "#d8d0c0"; for (let i = 0; i < 3; i++) { K.roundRect(c, 40, 248 + i * 28, i === 2 ? 140 : 220, 12, 6); c.fill(); }
      // talebobbel med et spørgsmålstegn
      c.fillStyle = "#ffffff"; c.strokeStyle = "#3a4a7a"; c.lineWidth = 4; K.roundRect(c, 150, 330, 120, 66, 20); c.fill(); c.stroke();
      c.fillStyle = "#3a4a7a"; c.font = '700 44px "Familjen Grotesk", sans-serif'; c.fillText("?", 210, 364);
    });
    const skitse = T.canvas(420, 300, (c, w, h) => {
      c.fillStyle = "#f6f3ea"; c.fillRect(0, 0, w, h);
      c.strokeStyle = "rgba(90,120,180,0.25)"; c.lineWidth = 1; for (let y = 20; y < h; y += 20) { c.beginPath(); c.moveTo(0, y); c.lineTo(w, y); c.stroke(); }
      c.strokeStyle = "#2c3456"; c.lineWidth = 4; c.lineCap = "round"; c.lineJoin = "round";
      c.beginPath(); c.moveTo(120, 230); c.lineTo(120, 90); c.lineTo(250, 70); c.lineTo(250, 220); c.closePath(); c.stroke();
      c.beginPath(); c.arc(185, 115, 22, 0, 7); c.stroke(); c.beginPath(); c.arc(185, 175, 22, 0, 7); c.stroke();
      c.fillStyle = "#3aa35a"; c.beginPath(); c.arc(185, 115, 14, 0, 7); c.fill();
      c.fillStyle = "#d14b3c"; c.beginPath(); c.arc(185, 175, 14, 0, 7); c.fill();
      c.beginPath(); c.moveTo(270, 110); c.quadraticCurveTo(320, 80, 350, 120); c.stroke(); c.beginPath(); c.moveTo(340, 106); c.lineTo(352, 122); c.lineTo(334, 126); c.stroke();
      c.beginPath(); c.moveTo(60, 60); c.lineTo(100, 60); c.moveTo(56, 80); c.lineTo(92, 80); c.stroke();
      c.font = 'italic 600 26px "Source Sans 3", sans-serif'; c.fillStyle = "#2c3456"; c.fillText("ledig / optaget", 270, 210);
    });
    const B = new Batch();
    const STF = [[-0.52, 0.31, 0.43], [0.0, 0.43, 0.31]];
    for (const [x, w] of [[-0.52, 0.34], [0.0, 0.46]]) { // staffelier
      B.box("#5a4330", [x, Y + 0.02, 0.05], [w, 0.03, 0.12]);
      B.box("#5a4330", [x, Y + 0.2, -0.04], [0.03, 0.4, 0.03], [-12, 0, 0]);
    }
    T.mesh(g, B.merge(), T.lit());
    const kortE = T.mesh(g, T.hold(new THREE.PlaneGeometry(0.3, 0.42)), T.hold(new THREE.MeshStandardMaterial({ map: kort, roughness: 0.8 })), `-0.52 ${Y + 0.25} 0.04`, { rotation: "-12 0 0" });
    const skitseE = T.mesh(g, T.hold(new THREE.PlaneGeometry(0.44, 0.31)), T.hold(new THREE.MeshStandardMaterial({ map: skitse, roughness: 0.8 })), `0 ${Y + 0.2} 0.04`, { rotation: "-12 0 0" });
    // prototypen: papkasse med to "lys" (grøn/rød) og en lille dør-sensor
    const P = new Batch();
    P.box("#b8875a", [0, 0.13, 0], [0.2, 0.26, 0.14]);
    P.box("#9d744b", [0, 0.27, 0], [0.22, 0.02, 0.16]);
    for (const y of [0.18, 0.09]) P.cyl("#2b2b33", [0, y, 0.071], 0.04, 0.01, [90, 0, 0], 14);
    P.box("#2f6fd1", [0.12, 0.05, 0.04], [0.04, 0.06, 0.04]);
    P.cyl("#555a6e", [-0.07, 0.33, 0], 0.005, 0.1, [0, 0, 10], 5);
    const protoE = kit.grp(g, `0.55 ${Y} 0.05`);
    T.mesh(protoE, P.merge(), T.lit());
    const grøn = T.hold(new THREE.MeshBasicMaterial({ color: "#3aff7a" })), rød = T.hold(new THREE.MeshBasicMaterial({ color: "#ff4a3a" }));
    const cg = T.hold(new THREE.CircleGeometry(0.03, 14));
    const lG = T.mesh(protoE, cg, grøn, "0 0.18 0.077"), lR = T.mesh(protoE, cg, rød, "0 0.09 0.077");
    const haloG = T.mesh(protoE, T.hold(new THREE.PlaneGeometry(0.22, 0.22)), T.hold(new THREE.MeshBasicMaterial({ map: T.glow("#3aff7a"), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })), "0 0.18 0.08");
    const haloR = T.mesh(protoE, T.hold(new THREE.PlaneGeometry(0.22, 0.22)), T.hold(new THREE.MeshBasicMaterial({ map: T.glow("#ff4a3a"), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })), "0 0.09 0.08");
    // pile imellem (flade chevroner på bordet)
    const pilGeo = T.hold(pil());
    const pile = [-0.26, 0.29].map(x => {
      const m = T.hold(new THREE.MeshBasicMaterial({ color: A, transparent: true, opacity: 0.3 }));
      T.mesh(g, pilGeo, m, `${x} ${Y + 0.004} 0.2`, { rotation: "-90 0 0" }); return m;
    });
    // en lille bruger (de yngste elever) ved prototypen
    const F = new Batch();
    F.cyl("#3a76c4", [0, 0.07, 0], 0.035, 0.14, null, 10, 0.75); F.sph("#c9a27e", [0, 0.17, 0], 0.035); F.sph("#3b2a1c", [0, 0.185, -0.006], 0.036, [1, 0.7, 1]);
    const figur = kit.grp(g, `0.78 ${Y} 0.22`, { rotation: "0 -40 0" });
    T.mesh(figur, F.merge(), T.lit());
    const elementer = [kortE, skitseE, protoE];
    return {
      tick(s) {
        // rækkefølgen bygges op: kort → pil → skitse → pil → prototype → brugeren prøver den
        const p = s < 0 ? 99 : s % 8;
        elementer.forEach((e, i) => { const k = s < 0 ? 1 : clamp((p - i * 0.9) / 0.35); const sk = 0.15 + 0.85 * ease(k); e.object3D.scale.setScalar(sk); });
        pile.forEach((m, i) => { m.opacity = s < 0 ? 0.35 : clamp((p - 0.45 - i * 0.9) / 0.3) * 0.95 + 0.05; });
        const fk = s < 0 ? 1 : clamp((p - 2.3) / 0.4); figur.object3D.scale.setScalar(Math.max(0.001, ease(fk)));
        // prototypen viser "ledig" (grøn) og "optaget" (rød) skiftevis
        const ledig = s < 0 ? true : Math.floor(p / 1.2) % 2 === 0 || p < 2.3;
        grøn.color.set(ledig ? "#3aff7a" : "#1b3a26"); rød.color.set(ledig ? "#3a1b1b" : "#ff4a3a");
        haloG.visible = ledig; haloR.visible = !ledig;
      },
    };
  }

  function innovationStation(g) {
    const Y = 0.93;
    // Forrest står skolen som en lille bygning med en stor dør i gavlen. Døren svinger op, og en lysende sti
    // løber ud til en lille by bag den: en forening, en butik og en institution.
    const B = new Batch();
    // byens grundplade, græs og veje
    B.box("#26342f", [0, Y + 0.012, -0.08], [1.56, 0.024, 0.74]);
    B.box("#4b4f5e", [0, Y + 0.026, 0.02], [1.44, 0.004, 0.08]);
    B.box("#4b4f5e", [0, Y + 0.026, 0.17], [0.09, 0.004, 0.22]);
    // en fritstående dørkarm forrest i midten: skolens dør ud mod byen
    const SX = 0, SZ = 0.3, DW = 0.24, DH = 0.4;
    B.box("#2b2f40", [SX, Y + 0.008, SZ], [DW + 0.14, 0.016, 0.1]);
    for (const sx of [-1, 1]) B.box("#e8e4da", [SX + sx * (DW / 2 + 0.02), Y + DH / 2 + 0.01, SZ], [0.04, DH, 0.05]);
    B.box("#e8e4da", [SX, Y + DH + 0.03, SZ], [DW + 0.08, 0.04, 0.05]);
    // forening: klubhus med græsbane og vimpel
    B.box("#c9b38a", [-0.5, Y + 0.085, -0.26], [0.26, 0.13, 0.18]);
    B.add(T.geo.cyl(3), "#3a7a4a", [-0.5, Y + 0.185, -0.26], [0, 0, 90], [0.1, 0.27, 0.22]);
    B.box("#4f8f4a", [-0.56, Y + 0.027, -0.04], [0.32, 0.004, 0.0]);
    B.cyl("#b9bfcc", [-0.32, Y + 0.17, -0.3], 0.004, 0.3, null, 5);
    B.add(T.geo.cyl(3), A, [-0.29, Y + 0.29, -0.3], [0, 0, -90], [0.04, 0.06, 0.004]);
    // butik: facade med stribet markise
    B.box("#d6d0c4", [0.0, Y + 0.1, -0.33], [0.3, 0.17, 0.16]);
    for (let i = 0; i < 6; i++) B.box(i % 2 ? "#e8e4da" : "#d14b3c", [-0.125 + i * 0.05, Y + 0.165, -0.23], [0.05, 0.008, 0.07], [25, 0, 0]);
    B.box("#3a3f55", [0, Y + 0.195, -0.33], [0.32, 0.02, 0.18]);
    // institution: bygning med søjler og gavl
    B.box("#b9b2c4", [0.5, Y + 0.13, -0.3], [0.36, 0.21, 0.2]);
    B.add(T.geo.cyl(3), "#8a8296", [0.5, Y + 0.27, -0.2], [0, 0, 90], [0.08, 0.38, 0.04]);
    for (let i = 0; i < 5; i++) B.cyl("#e8e4da", [0.36 + i * 0.07, Y + 0.125, -0.18], 0.011, 0.2, null, 6);
    B.box("#8a8296", [0.5, Y + 0.025, -0.17], [0.4, 0.03, 0.06]);
    // træer
    for (const [x, z] of [[-0.24, -0.4], [0.25, -0.42], [-0.7, -0.4], [0.72, -0.1], [-0.72, 0.1], [0.62, 0.12]]) { B.cyl("#5a3e2a", [x, Y + 0.05, z], 0.008, 0.06, null, 5); B.add(T.geo.sph(7, 5), "#3e7a4a", [x, Y + 0.1, z], null, [0.07, 0.08, 0.07]); }
    T.mesh(g, B.merge(), T.lit());
    // vinduer der tændes i bygningerne, ét sæt pr. bygning
    const vinduer = [
      [[-0.56, 0.09, -0.169], [-0.44, 0.09, -0.169]],
      [[-0.07, 0.09, -0.249], [0.07, 0.09, -0.249]],
    ].map(list => {
      const m = T.hold(new THREE.MeshBasicMaterial({ color: "#3a3226" }));
      const VB = new Batch({ uv: true }); list.forEach(([x, y, z]) => VB.plane([x, Y + y, z], [0.06, 0.05]));
      T.mesh(g, VB.merge(), m); return m;
    });
    const instM = T.hold(new THREE.MeshBasicMaterial({ color: "#3a3226" }));
    T.mesh(g, T.hold(new THREE.PlaneGeometry(0.3, 0.14)), instM, `0.5 ${Y + 0.13} -0.199`);
    vinduer.push(instM);
    // små navneskilte, der dukker op over bygningerne
    const tags = ["forening", "butik", "institution"].map((n, i) =>
      kit.textPlane(g, `${[-0.5, 0, 0.5][i]} ${Y + 0.45} -0.28`, n, A, { width: 0.44, aspect: 0.25, size: 120, bg: true, ink: "#eef1ff" }));
    // døren i skolens gavl, hængslet i venstre side, svinger ud mod byen
    const hængsel = kit.grp(g, `${SX - DW / 2} ${Y + 0.016} ${SZ}`);
    const DB = new Batch();
    DB.box("#3a76c4", [DW / 2, DH / 2, 0], [DW - 0.006, DH - 0.006, 0.02]);
    DB.box("#2f5f9e", [DW / 2, DH * 0.7, 0.012], [DW * 0.66, DH * 0.32, 0.004]);
    DB.box("#2f5f9e", [DW / 2, DH * 0.28, 0.012], [DW * 0.66, DH * 0.32, 0.004]);
    for (const zz of [0.016, -0.016]) DB.sph("#e8b23c", [DW * 0.84, DH * 0.48, zz], 0.012);
    T.mesh(hængsel, DB.merge(), T.lit());
    // lys der vælder ud af døren
    const udsyn = T.hold(new THREE.MeshBasicMaterial({ map: T.glow("#ffd9a0"), transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
    const ug = T.hold(new THREE.PlaneGeometry(0.5, 0.5)); ug.rotateX(-Math.PI / 2);
    T.mesh(g, ug, udsyn, `0 ${Y + 0.03} ${SZ - 0.18}`);
    // stier af lysende prikker fra døren ud til de tre bygninger
    const stiM = T.hold(new THREE.MeshBasicMaterial({ color: A, transparent: true, opacity: 0 }));
    const SB = new Batch({ uv: true });
    const fra = [SX, SZ - 0.04], mål = [[-0.5, -0.15], [0, -0.23], [0.5, -0.17]];
    mål.forEach(([mx, mz]) => { for (let k = 1; k <= 7; k++) { const t = k / 8; SB.add(T.geo.sph(6, 4), null, [fra[0] + (mx - fra[0]) * t, Y + 0.035, fra[1] + (mz - fra[1]) * t], null, [0.02, 0.012, 0.02]); } });
    const stiGeo = SB.merge(); T.mesh(g, stiGeo, stiM);
    const stiN = stiGeo.attributes.position.count;
    return {
      tick(s) {
        const p = s < 0 ? -1 : s % 10;
        const åben = s < 0 ? 0 : p < 0.5 ? 0 : p < 1.5 ? ease((p - 0.5) / 1.0) : p < 8.8 ? 1 : 1 - ease((p - 8.8) / 1.0);
        hængsel.object3D.rotation.y = -åben * 72 * D;
        udsyn.opacity = 0.95 * åben;
        stiM.opacity = åben > 0.02 ? 0.65 + 0.35 * Math.sin(s * 5) : 0;
        stiGeo.setDrawRange(0, Math.floor(clamp((p - 1.2) / 1.2) * stiN / 3) * 3);
        vinduer.forEach((m, i) => { const k = s < 0 ? 0 : clamp((p - 2.0 - i * 0.6) / 0.3) * åben; m.color.setRGB(0.23 + 0.77 * k, 0.2 + 0.65 * k, 0.15 + 0.4 * k); });
        tags.forEach((tg, i) => { const k = s < 0 ? 0 : clamp((p - 2.0 - i * 0.6) / 0.3) * åben; tg.object3D.visible = k > 0.05; tg.object3D.scale.setScalar(0.6 + 0.4 * k); });
      },
    };
  }

  function tinkerStation(g) {
    const Y = 0.93;
    // sortimentskasse i træ med seks rum og låget slået op
    const B = new Batch();
    const BW = 1.2, BD = 0.5, VH = 0.06;
    B.box("#a77b4f", [0, Y + 0.01, 0], [BW, 0.02, BD]);
    for (const z of [-BD / 2, BD / 2]) B.box("#8a6238", [0, Y + VH / 2, z], [BW, VH, 0.02]);
    for (const x of [-BW / 2, -BW / 6, BW / 6, BW / 2]) B.box("#8a6238", [x, Y + VH / 2, 0], [0.02, VH, BD]);
    B.box("#8a6238", [0, Y + VH / 2 - 0.01, -0.02], [BW, VH - 0.02, 0.015]);
    B.box("#a77b4f", [0, Y + 0.25, -BD / 2 - 0.06], [BW, 0.46, 0.02], [-18, 0, 0]);
    // indersiden af låget: en lille tegning af kredsløb (pyntetekstur)
    T.mesh(g, B.merge(), T.lit());
    const lågTex = T.canvas(512, 200, (c, w, h) => {
      c.fillStyle = "#c79a68"; c.fillRect(0, 0, w, h);
      c.strokeStyle = "#5a3e2a"; c.lineWidth = 4; c.lineCap = "round";
      c.beginPath(); c.moveTo(40, 150); c.lineTo(40, 50); c.lineTo(200, 50); c.moveTo(260, 50); c.lineTo(470, 50); c.lineTo(470, 150); c.lineTo(300, 150); c.moveTo(220, 150); c.lineTo(40, 150); c.stroke();
      c.strokeRect(200, 36, 60, 28); c.beginPath(); c.arc(260, 150, 26, 0, 7); c.stroke(); c.beginPath(); c.moveTo(243, 133); c.lineTo(277, 167); c.moveTo(277, 133); c.lineTo(243, 167); c.stroke();
      c.font = '600 28px "JetBrains Mono", monospace'; c.fillStyle = "#5a3e2a"; c.fillText("hvad kan den?", 120, 112);
    });
    T.mesh(g, T.hold(new THREE.PlaneGeometry(BW - 0.08, 0.4)), T.hold(new THREE.MeshStandardMaterial({ map: lågTex, roughness: 0.9 })), `0 ${Y + 0.25} ${-BD / 2 - 0.045}`, { rotation: "-18 0 0" });

    const DEMO = [0, Y + 0.34, 0.1];   // hvor den valgte komponent løftes hen
    const lb = T.lit();
    const add = (m) => T.hold(m);
    const glowM = c => add(new THREE.MeshBasicMaterial({ map: T.glow(c), transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
    const fladM = (c, o = 0) => add(new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: o, side: THREE.DoubleSide, depthWrite: false }));
    // hver komponent: model + egen lille animation (som børn af komponenten, så de følger med, når den løftes)
    const fakt = [
      { navn: "LED", pos: [-0.4, 0.11], tilt: 10, sk: 2.4,
        byg(b) { b.cyl("#ff5a3a", [0, 0.06, 0], 0.035, 0.05, null, 12); b.sph("#ff5a3a", [0, 0.085, 0], 0.035, [1, 1, 1], [12, 6]); b.cyl("#e8e4da", [0, 0.032, 0], 0.04, 0.008, null, 12); for (const x of [-0.012, 0.012]) b.cyl("#b9bfcc", [x, 0.0, 0], 0.003, 0.06, null, 4); },
        fx(p) { const m = glowM("#ff6a3a"); T.mesh(p, add(new THREE.PlaneGeometry(0.32, 0.32)), m, "0 0.075 0.05"); const kerne = fladM("#ffd0b0"); T.mesh(p, add(new THREE.SphereGeometry(0.02, 8, 6)), kerne, "0 0.08 0.03");
          return (t, on) => { const v = on ? 0.35 + 0.65 * Math.abs(Math.sin(t * 3.2)) : 0; m.opacity = v; kerne.opacity = v; }; } },
      { navn: "servomotor", pos: [0, 0.11], tilt: 30, sk: 2.2,
        byg(b) { b.box("#2f6fd1", [0, 0.035, 0], [0.12, 0.07, 0.06]); b.box("#2f6fd1", [0, 0.05, 0], [0.16, 0.01, 0.06]); b.cyl("#e8e4da", [0.03, 0.075, 0], 0.012, 0.012, null, 10); b.box("#d14b3c", [-0.04, 0.03, 0.031], [0.02, 0.012, 0.002]); },
        fx(p) { const arm = ctx.kit.grp(p, "0.03 0.085 0"); const m = fladM("#f3eee2"); T.mesh(arm, add(new THREE.BoxGeometry(0.11, 0.008, 0.022).translate(0.045, 0, 0)), m);
          // en lille skala bag armen, der viser udslaget
          const sk = fladM(A); const SG = add(new THREE.RingGeometry(0.1, 0.106, 24, 1, -0.1 * Math.PI, 1.2 * Math.PI)); SG.rotateX(-Math.PI / 2); T.mesh(p, SG, sk, "0.03 0.081 0");
          return (t, on) => { m.opacity = on ? 1 : 0; sk.opacity = on ? 0.7 : 0; arm.object3D.rotation.y = Math.sin(t * 2.2) * 1.0 + 0.5; }; } },
      { navn: "summer", pos: [0.4, 0.11], tilt: 35, sk: 2.2,
        byg(b) { b.cyl("#22232c", [0, 0.025, 0], 0.045, 0.05, null, 14); b.cyl("#3a3f55", [0, 0.052, 0], 0.012, 0.005, null, 8); for (const x of [-0.015, 0.015]) b.cyl("#b9bfcc", [x, -0.01, 0], 0.003, 0.03, null, 4); },
        fx(p) { const RG = add(new THREE.RingGeometry(0.05, 0.058, 28)); RG.rotateX(-Math.PI / 2);
          const ringe = [0, 1, 2].map(() => { const m = fladM(A); return { m, e: T.mesh(p, RG, m, "0 0.056 0") }; });
          return (t, on) => ringe.forEach((r, k) => { const f = (t * 1.4 + k / 3) % 1; r.e.object3D.scale.setScalar(1 + f * 2.4); r.e.object3D.position.y = 0.056 + f * 0.04; r.m.opacity = on ? (1 - f) * 0.95 : 0; }); } },
      { navn: "afstandssensor", pos: [-0.4, -0.11], tilt: 20, sk: 2.0,
        byg(b) { b.box("#1d4f8a", [0, 0.008, 0], [0.16, 0.012, 0.07]); for (const x of [-0.04, 0.04]) { b.cyl("#c9cdd8", [x, 0.033, 0], 0.022, 0.035, null, 12); b.cyl("#2a2a33", [x, 0.051, 0], 0.016, 0.002, null, 10); } },
        fx(p) { const hånd = ctx.kit.grp(p, "0 0.2 0"); const hm = add(new THREE.MeshStandardMaterial({ color: "#c9a27e", flatShading: true, transparent: true, opacity: 0 }));
          const HB = new Batch({ uv: true }); HB.add(T.geo.box(), null, [0, 0, 0], null, [0.11, 0.02, 0.09]); for (let k = 0; k < 4; k++) HB.add(T.geo.box(), null, [-0.04 + k * 0.027, 0, 0.065], null, [0.018, 0.016, 0.05]); HB.add(T.geo.box(), null, [0.07, 0, 0.0], [0, 30, 0], [0.04, 0.016, 0.02]);
          T.mesh(hånd, HB.merge(), hm);
          const RG = add(new THREE.RingGeometry(0.02, 0.027, 20)); RG.rotateX(-Math.PI / 2);
          const bølger = [0, 1, 2, 3].map(() => { const m = fladM("#7fd0ff"); return { m, e: T.mesh(p, RG, m, "-0.04 0.06 0") }; });
          const tal = fladM(A);
          const bar = T.mesh(p, add(new THREE.PlaneGeometry(0.018, 0.2).translate(0, 0.1, 0)), tal, "0.12 0.02 0");
          return (t, on) => { const hy = 0.1 + 0.07 * (0.5 + 0.5 * Math.sin(t * 1.3)); hånd.object3D.position.y = hy; hm.opacity = on ? 1 : 0;
            bølger.forEach((b, k) => { const f = (t * 1.2 + k / 4) % 1; b.e.object3D.position.set(k % 2 ? 0.04 : -0.04, 0.055 + f * (hy - 0.07), 0); b.e.object3D.scale.setScalar(1 + f * 1.4); b.m.opacity = on ? (1 - f) * 0.9 : 0; });
            tal.opacity = on ? 0.9 : 0; bar.object3D.scale.y = (hy - 0.1) / 0.2; }; } },
      { navn: "ledende tråd", pos: [0, -0.11], tilt: 55, sk: 1.5,
        byg(b) { b.box("#b0413e", [0, 0.006, 0], [0.24, 0.012, 0.16]); b.cyl("#c9cdd8", [-0.12, 0.02, 0.06], 0.022, 0.03, null, 12); b.cyl("#fff1c9", [0.1, 0.018, -0.05], 0.012, 0.012, null, 8); },
        fx(p) { const pts = []; for (let k = 0; k <= 22; k++) { const u = k / 22; pts.push([-0.1 + u * 0.2, 0.013, 0.05 - u * 0.1 + Math.sin(u * Math.PI * 3) * 0.035]); }
          const TB = new Batch({ uv: true }); pts.forEach(q => TB.add(T.geo.box(), null, q, [0, 0, 0], [0.008, 0.002, 0.008]));
          const grå = TB.merge(); T.mesh(p, grå, fladM("#d6d9e4", 0.0));
          const lys = add(grå.clone()); const lm = fladM("#ffd27a"); T.mesh(p, lys, lm, "0 0.001 0");
          const N = lys.attributes.position.count; const lm2 = glowM("#ffe08a"); T.mesh(p, add(new THREE.PlaneGeometry(0.12, 0.12).rotateX(-Math.PI / 2)), lm2, "0.1 0.022 -0.05");
          const gm = grå; const gråM = p.lastElementChild.previousElementSibling;
          return (t, on) => { const f = Math.min(1, (t % 2.6) / 1.8); lys.setDrawRange(0, Math.floor(f * N / 36) * 36); lm.opacity = on ? 1 : 0; lm2.opacity = on && f >= 1 ? 1 : 0;
            const mm = gråM.getObject3D("mesh"); if (mm) mm.material.opacity = on ? 0.9 : 0; }; } },
      { navn: "lyssensor", pos: [0.4, -0.11], tilt: 20, sk: 2.0,
        byg(b) { b.box("#2a5c43", [0, 0.008, 0], [0.12, 0.012, 0.08]); b.cyl("#d6b85a", [0, 0.025, 0], 0.022, 0.014, null, 12); b.box("#8a5a2a", [0, 0.033, 0], [0.03, 0.002, 0.004]); },
        fx(p) { const sm = glowM("#ffe08a"); T.mesh(p, add(new THREE.PlaneGeometry(0.2, 0.2)), sm, "-0.09 0.13 0.02"); const kerne = fladM("#fff3c0"); T.mesh(p, add(new THREE.CircleGeometry(0.022, 14)), kerne, "-0.09 0.13 0.03");
          const tal = fladM(A); const bar = T.mesh(p, add(new THREE.PlaneGeometry(0.024, 0.13).translate(0, 0.065, 0)), tal, "0.09 0.03 0");
          const ramme = fladM("#6b7299"); const RB2 = new Batch({ uv: true }); for (const [x, y, w, h] of [[-0.016, 0.068, 0.004, 0.14], [0.016, 0.068, 0.004, 0.14], [0, 0.0, 0.036, 0.004], [0, 0.138, 0.036, 0.004]]) RB2.plane([x, y, 0], [w, h]); T.mesh(p, RB2.merge(), ramme, "0.09 0.03 0.001");
          return (t, on) => { const v = 0.5 + 0.5 * Math.sin(t * 1.8); sm.opacity = on ? v : 0; kerne.opacity = on ? 0.3 + 0.7 * v : 0; tal.opacity = on ? 1 : 0; ramme.opacity = on ? 1 : 0; bar.object3D.scale.y = 0.08 + 0.92 * v; }; } },
    ];
    const komp = fakt.map((f, i) => {
      const e = kit.grp(g, `${f.pos[0]} ${Y + 0.022} ${f.pos[1]}`);
      const inner = kit.grp(e);
      const b = new Batch(); f.byg(b);
      T.mesh(inner, b.merge(), lb);
      const anim = f.fx(inner);
      // klikflade: usynlig, men stor nok til at være let at ramme
      const hit = kit.box(e, "0 0.05 0", 0.34, 0.14, 0.2, "shader: flat; visible: false");
      // klikket bobler op til stationen, som selv skifter til trinnet
      ctx.onClick(hit, () => { valgt = i; tValgt = tNu; });
      const home = [f.pos[0], Y + 0.022, f.pos[1]];
      return { e, inner, anim, home, tilt: f.tilt, sk: f.sk };
    });
    const navn = fakt.map(f => { const tp = kit.textPlane(g, `0 ${Y + 0.72} 0.1`, f.navn, A, { width: 0.62, aspect: 0.22, size: 110, bg: true, ink: "#eef1ff" }); tp.object3D.visible = false; return tp; });
    // et lille hint: "klik på en komponent"
    const hint = kit.textPlane(g, `0 ${Y + 0.03} ${BD / 2 + 0.09}`, "klik på en komponent", "#a9b0d6", { width: 0.6, aspect: 0.14, size: 90, bg: false, ink: "#d6dbf5", rotation: "-70 0 0" });
    let valgt = -1, tValgt = 0;
    return {
      nulstil() { if (tNu - tValgt > 300) valgt = -1; },   // et klik, der selv skiftede trin, bevares
      tick(s) {
        hint.object3D.visible = s >= 0;
        // hvilken komponent vises? Den klikkede i 7 s, ellers kører de på skift
        let i = -1, ls = 0;
        if (s >= 0) {
          if (valgt >= 0 && (tNu - tValgt) / 1000 < 7) { i = valgt; ls = (tNu - tValgt) / 1000; }
          else { i = Math.floor(s / 3.4) % fakt.length; ls = s % 3.4; }
        }
        komp.forEach((k, j) => {
          const op = j === i ? ease(clamp(ls / 0.45)) : 0;
          const o = k.inner.object3D;
          o.position.set((DEMO[0] - k.home[0]) * op, (DEMO[1] - k.home[1]) * op, (DEMO[2] - k.home[2]) * op);
          o.rotation.set(op * k.tilt * D, 0, 0);
          o.scale.setScalar(1 + op * (k.sk - 1));
          k.anim(ls, op > 0.95);
        });
        navn.forEach((n, j) => { n.object3D.visible = j === i; });
      },
    };
  }

  function lampeStation(g0) {
    const Y = 0.93;
    // modellen bygges i 1,35 gange størrelse omkring bordpladens midte
    const g = kit.grp(g0, `0 ${Y - Y * 1.25} 0`, { scale: "1.25 1.25 1.25" });
    const B = new Batch();
    // lampe: tung fod, slank stang, opal kuppel; en lille sensor i foden
    B.cyl("#2b2f40", [-0.32, Y + 0.02, -0.02], 0.14, 0.04, null, 18);
    B.cyl("#b9bfcc", [-0.32, Y + 0.25, -0.02], 0.012, 0.44, null, 6);
    B.cyl("#1b1d29", [-0.32, Y + 0.47, -0.02], 0.03, 0.03, null, 10);
    B.sph("#7fd0ff", [-0.22, Y + 0.035, 0.1], 0.012);
    // telefonholder og telefon
    B.box("#3a3f55", [0.32, Y + 0.012, 0.0], [0.14, 0.024, 0.12]);
    B.box("#3a3f55", [0.32, Y + 0.08, -0.04], [0.14, 0.13, 0.015], [-18, 0, 0]);
    B.box("#14161e", [0.32, Y + 0.15, 0.0], [0.11, 0.22, 0.012], [-18, 0, 0]);
    T.mesh(g, B.merge(), T.lit());
    const kuppelM = T.hold(new THREE.MeshBasicMaterial({ color: "#fff1d0" }));
    T.mesh(g, T.hold(new THREE.SphereGeometry(0.13, 18, 12)), kuppelM, `-0.32 ${Y + 0.58} -0.02`);
    const haloM = T.hold(new THREE.MeshBasicMaterial({ map: T.glow("#ffc56a"), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    T.mesh(g, T.hold(new THREE.PlaneGeometry(1.3, 1.3)), haloM, `-0.32 ${Y + 0.58} 0.0`);
    const bordM = T.hold(new THREE.MeshBasicMaterial({ map: T.glow("#ffc56a"), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    const bg = T.hold(new THREE.PlaneGeometry(1.6, 1.0)); bg.rotateX(-Math.PI / 2);
    T.mesh(g, bg, bordM, `-0.25 ${Y + 0.006} 0`);
    // telefonens skærm: neutralt mønster af felter (ingen rigtige apps)
    const skærmTex = T.canvas(128, 256, (c, w, h) => {
      const gr = c.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, "#5ab8ff"); gr.addColorStop(1, "#8a5aff"); c.fillStyle = gr; c.fillRect(0, 0, w, h);
      c.fillStyle = "rgba(255,255,255,0.85)"; for (let r = 0; r < 4; r++) for (let k = 0; k < 3; k++) { K.roundRect(c, 14 + k * 36, 40 + r * 44, 28, 28, 8); c.fill(); }
      c.fillStyle = "rgba(255,255,255,0.5)"; K.roundRect(c, 30, 226, 68, 8, 4); c.fill();
    });
    const skærmM = T.hold(new THREE.MeshBasicMaterial({ map: skærmTex, color: "#222" }));
    T.mesh(g, T.hold(new THREE.PlaneGeometry(0.095, 0.2)), skærmM, `0.32 ${Y + 0.152} 0.0075`, { rotation: "-18 0 0" });
    const telHaloM = T.hold(new THREE.MeshBasicMaterial({ map: T.glow("#7a9cff"), transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
    T.mesh(g, T.hold(new THREE.PlaneGeometry(0.9, 0.9)), telHaloM, `0.32 ${Y + 0.15} 0.02`, { rotation: "-18 0 0" });
    // skærmtid flyder fra telefonen til lampens sensor som små lysprikker
    const prikM = T.hold(new THREE.MeshBasicMaterial({ color: "#9fb6ff", transparent: true, opacity: 0 }));
    const prikker = [0, 1, 2, 3, 4].map(() => T.mesh(g, T.hold(new THREE.SphereGeometry(0.012, 6, 4)), prikM));
    const lampeLys = kit.el("a-entity", { position: `-0.32 ${Y + 0.6} 0.1`, light: "type: point; color: #ffc27a; intensity: 0; distance: 3.2; decay: 1.5" }, g);
    return {
      tick(s, dt, rumLys) {
        // over 8 sekunder: lampen dæmpes, telefonen lyser stærkere. Så starter cyklussen forfra.
        const aktivN = s >= 0;
        const p = aktivN ? (s % 9.5) : 0;
        const k = aktivN ? (p < 8 ? ease(p / 8) : 1 - ease((p - 8) / 1.5)) : 0.0;
        const lampe = aktivN ? 1 - 0.92 * k : 0.55, tel = aktivN ? 0.15 + 0.85 * k : 0.25;
        kuppelM.color.setRGB(0.25 + 0.75 * lampe, 0.22 + 0.72 * lampe, 0.18 + 0.6 * lampe);
        haloM.opacity = 0.9 * lampe; bordM.opacity = 0.7 * lampe;
        skærmM.color.setScalar(0.2 + 0.8 * tel);
        telHaloM.opacity = aktivN ? 0.95 * tel : 0;
        T.lys(lampeLys, aktivN ? 2.4 * lampe : 0);
        T.lys(rumLys, aktivN ? 0.55 : 1.3);
        prikM.opacity = aktivN && p < 8 ? 0.9 : 0;
        prikker.forEach((e, i) => { const f = ((s * 0.6 + i / 5) % 1); e.object3D.position.set(0.32 + (-0.1 - 0.32) * f, Y + 0.12 + Math.sin(f * Math.PI) * 0.12 - 0.08 * f, 0.08 + 0.02 * f); });
      },
    };
  }

  function pil() { // flad chevron-pil (peger mod +x)
    const s = new THREE.Shape();
    s.moveTo(-0.05, 0.04); s.lineTo(0.0, 0.04); s.lineTo(0.05, 0); s.lineTo(0.0, -0.04); s.lineTo(-0.05, -0.04); s.lineTo(-0.0, 0); s.closePath();
    return new THREE.ShapeGeometry(s);
  }
}

const clamp = v => Math.max(0, Math.min(1, v));
const ease = v => { v = clamp(v); return v < 0.5 ? 4 * v * v * v : 1 - Math.pow(-2 * v + 2, 3) / 2; };


/* ======================================================================
   Fælles værktøj for rummet: samlede meshes (få draw calls), materialer, teksturer og oprydning.
   ====================================================================== */
function vaerktoej(ctx) {
  const { THREE, K } = ctx;
  const D = Math.PI / 180;
  const affald = [];
  const hold = x => { affald.push(x); return x; };
  const cache = {};
  const geo = {
    box: () => cache.box || (cache.box = new THREE.BoxGeometry(1, 1, 1)),
    cyl: (seg = 12, top = 1) => { const k = `c${seg}_${top}`; return cache[k] || (cache[k] = new THREE.CylinderGeometry(0.5 * top, 0.5, 1, seg)); },
    sph: (w = 12, h = 8) => { const k = `s${w}_${h}`; return cache[k] || (cache[k] = new THREE.SphereGeometry(0.5, w, h)); },
    torus: (r, t, rs = 6, ts = 14, arc = Math.PI * 2) => { const k = `t${r}_${t}_${rs}_${ts}_${arc}`; return cache[k] || (cache[k] = new THREE.TorusGeometry(r, t, rs, ts, arc)); },
    plane: () => cache.plane || (cache.plane = new THREE.PlaneGeometry(1, 1)),
  };
  const e = new THREE.Euler(), q = new THREE.Quaternion();
  function mtx(p = [0, 0, 0], r = [0, 0, 0], s = [1, 1, 1]) {
    r = r || [0, 0, 0]; s = s || [1, 1, 1];
    e.set(r[0] * D, r[1] * D, r[2] * D, "YXZ"); q.setFromEuler(e);
    return new THREE.Matrix4().compose(new THREE.Vector3(...p), q, new THREE.Vector3(...s));
  }
  /* Batch: saml mange dele til ét mesh. Med {uv:true} beholdes uv (til teksturer), ellers får delene vertexfarver. */
  class Batch {
    constructor(o = {}) { this.uv = !!o.uv; this.parts = []; this.stack = [new THREE.Matrix4()]; }
    push(p, r, s) { this.stack.push(this.stack[this.stack.length - 1].clone().multiply(mtx(p, r, s))); return this; }
    pop() { this.stack.pop(); return this; }
    add(g0, color, p, r, s) {
      const g = g0.index ? g0.toNonIndexed() : g0.clone();
      for (const k of Object.keys(g.attributes)) if (k !== "position" && k !== "normal" && !(this.uv && k === "uv")) g.deleteAttribute(k);
      g.applyMatrix4(this.stack[this.stack.length - 1].clone().multiply(mtx(p, r, s)));
      if (!this.uv) this.farv(g, color);
      this.parts.push(g); return this;
    }
    farv(g, color, color2) { // ensfarvet, eller lodret overgang fra color (top) til color2 (bund)
      const n = g.attributes.position.count, a = new Float32Array(n * 3), c = new THREE.Color(color);
      let c2 = null, y0 = 0, y1 = 1;
      if (color2) { c2 = new THREE.Color(color2); g.computeBoundingBox(); y0 = g.boundingBox.min.y; y1 = g.boundingBox.max.y; }
      const tmp = new THREE.Color();
      for (let i = 0; i < n; i++) {
        let cc = c;
        if (c2) { const k = (g.attributes.position.getY(i) - y0) / Math.max(1e-6, y1 - y0); cc = tmp.copy(c2).lerp(c, k); }
        a[i * 3] = cc.r; a[i * 3 + 1] = cc.g; a[i * 3 + 2] = cc.b;
      }
      g.setAttribute("color", new THREE.BufferAttribute(a, 3));
    }
    box(c, p, s, r) { return this.add(geo.box(), c, p, r, s); }
    cyl(c, p, rad, h, r, seg = 12, top = 1) { return this.add(geo.cyl(seg, top), c, p, r, [rad * 2, h, rad * 2]); }
    sph(c, p, rad, s = [1, 1, 1], seg = [10, 7]) { return this.add(geo.sph(seg[0], seg[1]), c, p, null, [rad * 2 * s[0], rad * 2 * s[1], rad * 2 * s[2]]); }
    plane(p, s, r) { return this.add(geo.plane(), null, p, r, [s[0], s[1], 1]); }
    /* skrå lysflade fra a (top) til b (bund), bredde w, med farveovergang */
    slant(a, b, w, top, bund) {
      const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), len = A.distanceTo(B);
      const g = new THREE.PlaneGeometry(w, len).toNonIndexed(); g.deleteAttribute("uv");
      const tilt = Math.atan2(A.z - B.z, A.y - B.y);
      g.applyMatrix4(new THREE.Matrix4().makeRotationX(tilt));
      g.applyMatrix4(new THREE.Matrix4().makeTranslation((A.x + B.x) / 2, (A.y + B.y) / 2, (A.z + B.z) / 2));
      g.applyMatrix4(this.stack[this.stack.length - 1]);
      this.farv(g, top, bund); this.parts.push(g); return this;
    }
    /* lyskegle (åben, lys i toppen og falmende mod bunden) */
    cone(p, rTop, rBot, h, farve) {
      const g = new THREE.CylinderGeometry(rTop, rBot, h, 18, 1, true).toNonIndexed(); g.deleteAttribute("uv");
      g.applyMatrix4(new THREE.Matrix4().makeTranslation(p[0], p[1] - h / 2, p[2]));
      g.applyMatrix4(this.stack[this.stack.length - 1]);
      this.farv(g, farve, "#000000"); this.parts.push(g); return this;
    }
    merge() {
      if (!this.parts.length) return hold(new THREE.BufferGeometry());
      const m = THREE.BufferGeometryUtils.mergeGeometries(this.parts, false);
      this.parts.forEach(g => g.dispose()); this.parts = [];
      m.computeBoundingSphere(); return hold(m);
    }
  }
  /* vægge som én geometri med uv i meter (tile = meter pr. tekstur) */
  function vaegGeo(list, h, tile, tileH = tile) {
    const parts = list.map(([x1, z1, x2, z2]) => {
      const len = Math.hypot(x2 - x1, z2 - z1);
      const g = new THREE.PlaneGeometry(len, h);
      const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * len / tile, uv.getY(i) * h / tileH);
      const nx = -(z2 - z1) / len, nz = (x2 - x1) / len;
      g.applyMatrix4(new THREE.Matrix4().makeRotationY(Math.atan2(nx, nz)));
      g.applyMatrix4(new THREE.Matrix4().makeTranslation((x1 + x2) / 2, h / 2, (z1 + z2) / 2));
      return g;
    });
    const m = THREE.BufferGeometryUtils.mergeGeometries(parts, false); parts.forEach(g => g.dispose()); return hold(m);
  }
  const lit = (o = {}) => hold(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.82, metalness: 0.05, flatShading: true, ...o }));
  const basic = (o = {}) => hold(new THREE.MeshBasicMaterial({ vertexColors: true, ...o }));
  const additive = (o = {}) => hold(new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, ...o }));
  const canvas = (w, h, draw) => hold(K.canvasTexture(w, h, draw));
  const glowCache = {};
  const glow = c => glowCache[c] || (glowCache[c] = hold(K.glowTex(c)));
  /* meshes med gennemsigtigt materiale skjules automatisk, når opacity er 0 (så de ikke koster draw calls) */
  const fadere = [];
  const mesh = (parent, g, m, pos = "0 0 0", extra = {}) => {
    const e = ctx.kit.mesh(parent, g, m, pos, extra);
    if (m && m.transparent) fadere.push([e.getObject3D("mesh"), m]);
    return e;
  };
  function syncVis() { for (const [o, m] of fadere) o.visible = m.opacity > 0.004; }
  function rng(seed) { let s = seed >>> 0 || 1; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
  const rr = (g, x, y, w, h, r) => K.roundRect(g, x, y, w, h, r);

  /* Erkendeformernes tre små lavendelfarvede tegn, der kredser langsomt (en hånd der bygger,
     en hånd der vender noget om, og et stiplet omrids af noget, der endnu ikke findes). */
  function erkendeformer(parent, pos, rot = "0 0 0", sk = 1) {
    const L = ctx.C.core;
    const tegn = [
      g => { // hånd der bygger: klodser + hånd ovenfra
        g.fillStyle = L; g.globalAlpha = 0.35; g.fillRect(70, 170, 56, 44); g.fillRect(130, 170, 56, 44); g.globalAlpha = 1;
        g.strokeRect(100, 118, 56, 44);
        g.beginPath(); g.moveTo(84, 40); g.lineTo(84, 92); g.quadraticCurveTo(84, 108, 104, 108); g.lineTo(170, 108); g.quadraticCurveTo(190, 108, 190, 88); g.lineTo(190, 52); g.stroke();
        g.beginPath(); g.moveTo(108, 92); g.lineTo(108, 40); g.moveTo(132, 92); g.lineTo(132, 34); g.moveTo(156, 92); g.lineTo(156, 40); g.stroke();
      },
      g => { // vende om: klods og pil i halvcirkel
        g.strokeRect(96, 104, 64, 64);
        g.beginPath(); g.arc(128, 136, 78, Math.PI * 1.05, Math.PI * 1.95); g.stroke();
        g.beginPath(); g.moveTo(196, 102); g.lineTo(206, 132); g.lineTo(178, 124); g.stroke();
        g.beginPath(); g.arc(128, 136, 78, Math.PI * 0.1, Math.PI * 0.6); g.stroke();
      },
      g => { // stiplet omrids
        g.setLineDash([16, 14]); K.roundRect(g, 56, 56, 144, 144, 26); g.stroke(); g.setLineDash([]);
        g.globalAlpha = 0.5; g.beginPath(); g.arc(128, 128, 10, 0, 7); g.fill(); g.globalAlpha = 1;
      },
    ];
    // samlet på én lille mørk, rund plade med etiket, så de læses som ét tegn og ikke som løse symboler
    const grp = ctx.kit.grp(parent, pos, { rotation: rot, scale: `${sk} ${sk} ${sk}` });
    const pladeTex = canvas(256, 300, g => {
      g.fillStyle = "rgba(14,18,36,0.9)"; g.beginPath(); g.arc(128, 128, 124, 0, 7); g.fill();
      g.strokeStyle = L; g.globalAlpha = 0.5; g.lineWidth = 3; g.beginPath(); g.arc(128, 128, 120, 0, 7); g.stroke(); g.globalAlpha = 1;
      g.fillStyle = L; g.font = '600 24px "JetBrains Mono", monospace'; g.textAlign = "center"; g.fillText("ERKENDEFORMER", 128, 290);
    });
    mesh(grp, geo.plane(), hold(new THREE.MeshBasicMaterial({ map: pladeTex, transparent: true, depthWrite: false })), "0 -0.06 -0.005", { scale: "1.0 1.17 1" });
    const items = tegn.map((f, i) => {
      const tex = canvas(256, 256, g => { g.strokeStyle = L; g.fillStyle = L; g.lineWidth = 12; g.lineCap = "round"; g.lineJoin = "round"; f(g); });
      const m = hold(new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0.95, depthWrite: false }));
      return mesh(grp, geo.plane(), m, "0 0 0", { scale: "0.3 0.3 0.3" });
    });
    let a = 0;
    return { tick(dt) { a += (dt || 16) * 0.00025; items.forEach((it, i) => { const v = a + i * 2.094; it.object3D.position.set(Math.cos(v) * 0.27, Math.sin(v) * 0.27, 0); }); } };
  }
  /* sæt et lys' styrke direkte (billigere end setAttribute hver frame) */
  function lys(el, v) { const l = el.getObject3D("light"); if (l) l.intensity = v; }
  function dispose() { affald.forEach(x => x && x.dispose && x.dispose()); Object.values(cache).forEach(g => g.dispose()); }
  return { THREE, Batch, geo, hold, lit, basic, additive, canvas, glow, mesh, rng, rr, vaegGeo, erkendeformer, lys, syncVis, dispose };
}
