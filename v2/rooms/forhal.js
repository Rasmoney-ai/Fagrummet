/* Rum 0 · Forhallen — fagets formål og karakter.
   En lav, rund sal med kuppelloft. I midten svæver kernen (en lavendelfarvet polyeder), som åbner facetter,
   får rødder og omkredses af erkendeformernes tegn. Tre høje porte (A, B, C) står lukkede, indtil F6.
   Trin: f1–f6. Se manus.md, "Rum 0 · Forhallen". */

export default function build(ctx) {
  const { THREE, C, K, kit, root } = ctx;
  const BGU = THREE.BufferGeometryUtils;
  const D2R = Math.PI / 180;
  const disposables = [];
  const keep = x => { disposables.push(x); return x; };

  /* ---------- Hjælpere ---------- */
  // fast tilfældighed, så rummet ser ens ud hver gang
  let seed = 7;
  const rnd = () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const clamp01 = x => Math.max(0, Math.min(1, x));
  const ease = x => { x = clamp01(x); return x * x * (3 - 2 * x); };
  const approach = (cur, to, dt, rate = 4) => cur + (to - cur) * (1 - Math.exp(-rate * dt / 1000));
  // et rå THREE-objekt i en entitet under rummet
  function holder(pos = "0 0 0", parent = root) { return kit.grp(parent, pos); }
  function add(obj, parent = root) { const h = holder("0 0 0", parent); h.object3D.add(obj); return obj; }
  const std = (color, o = {}) => keep(new THREE.MeshStandardMaterial({ color, roughness: 0.7, metalness: 0.1, flatShading: true, ...o }));
  const basic = (color, o = {}) => keep(new THREE.MeshBasicMaterial({ color, toneMapped: false, ...o }));
  const additive = (map, color = "#ffffff", opacity = 1) => keep(new THREE.MeshBasicMaterial({ map, color, transparent: true, opacity, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }));
  const label = (map, o = {}) => keep(new THREE.MeshBasicMaterial({ map, transparent: true, depthWrite: false, toneMapped: false, opacity: 0, side: THREE.DoubleSide, ...o }));
  const tex = (w, h, draw) => keep(K.canvasTexture(w, h, draw));
  // placering i "trinnets ramme": phi = vinkel fra +z mod +x; r = afstand fra kernens akse
  const polar = (phi, r) => [r * Math.sin(phi * D2R), r * Math.cos(phi * D2R)];
  function mergeBoxes(list) { // list: [w,h,d,x,y,z,rotY?]
    const gs = list.map(([w, h, d, x, y, z, ry = 0]) => { const g = new THREE.BoxGeometry(w, h, d); if (ry) g.rotateY(ry); g.translate(x, y, z); return g; });
    const m = BGU.mergeGeometries(gs); gs.forEach(g => g.dispose()); return keep(m);
  }

  const RW = 8.2, WALL_H = 5.2;              // salens radius og væghøjde
  const CORE_Y = 2.95, CORE_R = 0.64;        // kernen svæver over øjenhøjde, så alle tre porte ses under den
  const r3 = v => Math.round(v * 1000) / 1000;
  const EYE = 1.6;

  ctx.env({ background: "#070a16" });

  /* ---------- Grundplan ----------
     Set fra indgangen (spawn, kigger mod -z): Atelieret til venstre, Tårnets fod i midten, Gaden til højre,
     og længst til højre trappen op til Udsigten (til sidst). phi = vinkel fra +z mod +x. */
  const GATE_PHI = { "hal-a": 207, "hal-b": 180, "hal-c": 153 };
  const UP_PHI = 124;
  // stationerne: phi = hvor brugeren står (set fra kernen), vr = afstand. Pladerne står i en ring om podiet.
  // Brugeren står på portsiden og ser tilbage mod den rolige væg, så ord og figurer har en rolig baggrund.
  const ST = {
    f1: { phi: 0, vr: 5.4, pitch: 6 },
    f2: { phi: 222, vr: 4.6, pitch: 12 },
    f3: { phi: 138, vr: 4.7, pitch: 6 },
    f4: { phi: 232, vr: 4.5, pitch: 13 },
    f5: { phi: 95, vr: 4.6, pitch: 14 },
    f6: { phi: 180, vr: 1.75, pitch: 6, out: true, plq: 180, plqR: 3.6 },
  };
  const PLQ_R = 2.15;

  /* ---------- Gulv: mørk terrazzo med et svagt kredsløbsmønster ---------- */
  const floorTex = tex(2048, 2048, (g, w, h) => {
    const s = w / (RW * 2), cx = w / 2, cy = h / 2;           // px pr. meter
    g.fillStyle = "#11152a"; g.fillRect(0, 0, w, h);
    // terrazzo: små sten
    const stones = ["#1c2241", "#232a4d", "#2e3560", "#0b0e1d", "#3d4372", "#262a3f"];
    for (let i = 0; i < 16000; i++) {
      g.fillStyle = stones[(rnd() * stones.length) | 0]; g.globalAlpha = 0.5 + rnd() * 0.5;
      const r = 0.6 + rnd() * rnd() * 4.2; g.beginPath(); g.ellipse(rnd() * w, rnd() * h, r, r * (0.6 + rnd() * 0.4), rnd() * 3, 0, 7); g.fill();
    }
    g.globalAlpha = 1;
    // kredsløbsbaner: radiale baner med knæk og lodder, plus to koncentriske ringe
    g.strokeStyle = "rgba(150,162,235,0.20)"; g.fillStyle = "rgba(150,162,235,0.28)"; g.lineCap = "round"; g.lineJoin = "round";
    const ring = (rm, dash) => { g.setLineDash(dash); g.lineWidth = 3; g.beginPath(); g.arc(cx, cy, rm * s, 0, 7); g.stroke(); g.setLineDash([]); };
    ring(2.05, []); ring(2.2, [18, 14]); ring(4.15, [4, 22]); ring(RW - 0.45, []);
    for (let i = 0; i < 40; i++) {
      const a0 = (i / 40) * Math.PI * 2 + (rnd() - 0.5) * 0.05, r0 = 2.2, r1 = 3.2 + rnd() * 1.6, r2 = r1 + 0.6 + rnd() * 1.8;
      const jog = (rnd() < 0.5 ? -1 : 1) * (0.05 + rnd() * 0.08);
      const P = (a, r) => [cx + Math.cos(a) * r * s, cy + Math.sin(a) * r * s];
      g.lineWidth = 2.2; g.beginPath(); g.moveTo(...P(a0, r0)); g.lineTo(...P(a0, r1)); g.lineTo(...P(a0 + jog, r1 + 0.35)); g.lineTo(...P(a0 + jog, Math.min(r2, RW - 0.6))); g.stroke();
      g.beginPath(); g.arc(...P(a0 + jog, Math.min(r2, RW - 0.6)), 5, 0, 7); g.fill();
      if (rnd() < 0.4) { g.beginPath(); g.arc(...P(a0, r1), 3.5, 0, 7); g.fill(); }
    }
  });
  const floor = new THREE.Mesh(keep(new THREE.CircleGeometry(RW, 72)), std("#ffffff", { map: floorTex, roughness: 0.55, flatShading: false }));
  floor.rotation.x = -Math.PI / 2; add(floor);


  /* ---------- Væg, pilastre, gesims, kuppel og oculus ---------- */
  const wall = new THREE.Mesh(keep(new THREE.CylinderGeometry(RW, RW, WALL_H, 64, 1, true)), std("#141933", { side: THREE.BackSide, roughness: 0.95 }));
  wall.position.y = WALL_H / 2; add(wall);
  const busy = [...Object.values(GATE_PHI), UP_PHI];
  const pil = [];
  for (let i = 0; i < 28; i++) {
    const phi = i * 360 / 28 + 6.4;
    if (busy.some(b => Math.abs(((phi - b + 540) % 360) - 180) < 12)) continue;
    const [x, z] = polar(phi, RW - 0.12);
    pil.push([0.32, WALL_H, 0.24, x, WALL_H / 2, z, phi * D2R]);
  }
  add(new THREE.Mesh(mergeBoxes(pil), std("#20264a", { roughness: 0.8 })));
  const corn = new THREE.Mesh(keep(new THREE.TorusGeometry(RW - 0.1, 0.12, 4, 72)), std("#272e58"));
  corn.rotation.x = Math.PI / 2; corn.position.y = WALL_H; add(corn);
  const coveMat = basic(C.core, { transparent: true, opacity: 0.3 });
  const cove = new THREE.Mesh(keep(new THREE.TorusGeometry(RW - 0.3, 0.025, 3, 96)), coveMat);
  cove.rotation.x = Math.PI / 2; cove.position.y = WALL_H - 0.18; add(cove);
  const domeTex = tex(1024, 512, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, "#0f1330"); gr.addColorStop(1, "#1a2044");
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.strokeStyle = "rgba(201,209,255,0.13)"; g.lineWidth = 3;
    for (let i = 0; i < 24; i++) { const x = i * w / 24; g.beginPath(); g.moveTo(x, h * 0.06); g.lineTo(x, h); g.stroke(); }
    g.strokeStyle = "rgba(201,209,255,0.10)"; [0.35, 0.62, 0.86].forEach(v => { g.beginPath(); g.moveTo(0, v * h); g.lineTo(w, v * h); g.stroke(); });
  });
  const dome = new THREE.Mesh(keep(new THREE.SphereGeometry(RW, 48, 12, 0, Math.PI * 2, 0, Math.PI / 2)), std("#8a90b4", { map: domeTex, side: THREE.BackSide, roughness: 1, flatShading: false }));
  dome.scale.y = 0.34; dome.position.y = WALL_H; add(dome);
  const ocMat = basic(C.core, { transparent: true, opacity: 0.8 });
  const oculus = new THREE.Mesh(keep(new THREE.TorusGeometry(1.3, 0.05, 4, 48)), ocMat);
  oculus.rotation.x = Math.PI / 2; oculus.position.y = WALL_H + RW * 0.34 - 0.12; add(oculus);
  const ocDisc = new THREE.Mesh(keep(new THREE.CircleGeometry(1.28, 40)), additive(keep(K.glowTex(C.core)), "#ffffff", 0.9));
  ocDisc.rotation.x = Math.PI / 2; ocDisc.position.y = oculus.position.y + 0.02; add(ocDisc);

  /* ---------- Podiet under kernen ---------- */
  const dais = new THREE.Mesh(keep(new THREE.CylinderGeometry(1.5, 1.62, 0.12, 48)), std("#232a50", { roughness: 0.5 }));
  dais.position.y = 0.06; add(dais);
  const daisRing = new THREE.Mesh(keep(new THREE.TorusGeometry(1.5, 0.018, 3, 72)), basic(C.core, { transparent: true, opacity: 0.6 }));
  daisRing.rotation.x = Math.PI / 2; daisRing.position.y = 0.125; add(daisRing);
  const poolMat = additive(keep(K.glowTex(C.core)), "#ffffff", 0.7);
  const pool = new THREE.Mesh(keep(new THREE.PlaneGeometry(3.4, 3.4)), poolMat);
  pool.rotation.x = -Math.PI / 2; pool.position.y = 0.13; add(pool);

  /* ---------- Kernen: icosaeder af 20 facetter. Fire af dem er klapper, der folder sig ud i F4 ---------- */
  const coreRig = holder(`0 ${CORE_Y} 0`).object3D;
  const coreSpin = new THREE.Group(); coreRig.add(coreSpin);
  const coreMat = std(C.core, { roughness: 0.32, metalness: 0.25, emissive: new THREE.Color(C.core), emissiveIntensity: 0.12 });
  const ico = new THREE.IcosahedronGeometry(CORE_R, 0);
  const IP = ico.attributes.position;
  const faces = [];
  for (let f = 0; f < IP.count / 3; f++) {
    const v = [0, 1, 2].map(i => new THREE.Vector3().fromBufferAttribute(IP, f * 3 + i));
    const c = v[0].clone().add(v[1]).add(v[2]).multiplyScalar(1 / 3);
    faces.push({ v, c, n: c.clone().normalize() });
  }
  ico.dispose();
  // hjørnet, som klapperne folder sig ud omkring, og de fem facetter, der mødes i det
  const V0 = faces[0].v[0].clone();
  const near = (a, b) => a.distanceTo(b) < 1e-4;
  const around = faces.map((f, i) => i).filter(i => faces[i].v.some(p => near(p, V0)));
  // en facet (trekant) i sit eget koordinatsystem med normal +z, lidt indskrumpet så fugerne ses
  const Z = new THREE.Vector3(0, 0, 1);
  function faceGeo(f) {
    const q = new THREE.Quaternion().setFromUnitVectors(Z, f.n), qi = q.clone().invert();
    const loc = f.v.map(p => p.clone().sub(f.c).multiplyScalar(0.94).applyQuaternion(qi));
    const g = new THREE.ExtrudeGeometry(new THREE.Shape(loc.map(p => new THREE.Vector2(p.x, p.y))), { depth: 0.07, bevelEnabled: false });
    g.translate(0, 0, -0.07); g.applyQuaternion(q); g.translate(f.c.x, f.c.y, f.c.z); return g;
  }
  // F4-blikket: fra kernen mod brugerens øjne
  const [f4x, f4z] = polar(ST.f4.phi, ST.f4.vr);
  const toEye = new THREE.Vector3(f4x, EYE - CORE_Y, f4z).normalize();
  // Q4: kernens stilling i F4 — hjørnet V0 peger mod brugeren, og den femte (ubrugte) facet peger nedad
  const Q4 = (() => {
    const q1 = new THREE.Quaternion().setFromUnitVectors(V0.clone().normalize(), toEye);
    const camR = new THREE.Vector3().crossVectors(toEye, new THREE.Vector3(0, 1, 0)).normalize().negate();
    const camU = new THREE.Vector3().crossVectors(camR, toEye).negate().normalize();
    const ang = i => { const c = faces[i].c.clone().applyQuaternion(q1); return Math.atan2(c.dot(camU), c.dot(camR)); };
    const down = around.reduce((b, i) => (Math.abs(ang(i) + Math.PI / 2) < Math.abs(ang(b) + Math.PI / 2) ? i : b), around[0]);
    const twist = -Math.PI / 2 - ang(down);
    return { q: new THREE.Quaternion().setFromAxisAngle(toEye, twist).multiply(q1), down, camR, camU };
  })();
  const petalIdx = around.filter(i => i !== Q4.down);
  const staticGeo = keep(BGU.mergeGeometries(faces.map((f, i) => petalIdx.includes(i) ? null : faceGeo(f)).filter(Boolean)));
  coreSpin.add(new THREE.Mesh(staticGeo, coreMat));
  // indre lys, som ses gennem hullet, når klapperne åbner sig
  const innerMat = basic(C.core);
  coreSpin.add(new THREE.Mesh(keep(new THREE.IcosahedronGeometry(CORE_R * 0.7, 1)), innerMat));
  { const eg = new THREE.IcosahedronGeometry(CORE_R * 0.995, 0); const e2 = keep(new THREE.EdgesGeometry(eg)); eg.dispose();
    coreSpin.add(new THREE.LineSegments(e2, basic("#eef1ff", { transparent: true, opacity: 0.5 }))); }
  const haloMat = keep(new THREE.SpriteMaterial({ map: keep(K.glowTex(C.core)), color: "#ffffff", transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.4 }));
  const halo = new THREE.Sprite(haloMat); halo.scale.set(3.2, 3.2, 1); coreRig.add(halo);
  const coreLight = new THREE.PointLight(C.core, 6, 12, 1.5); coreLight.position.set(0, CORE_Y, 0); add(coreLight);

  /* ---------- F4: klapperne med neutrale figurer ---------- */
  // Hver klap er hængslet i facettens yderkant og vipper 180° ud, så dens inderside (med figuren) vender udad.
  const FACET = [   // rækkefølge efter placering i blikket: øverst til venstre, øverst til højre, nederst til venstre, nederst til højre
    { word: "kultur", draw: "people" }, { word: "historie", draw: "timeline" },
    { word: "intentioner", draw: "aim" }, { word: "materielt grundlag", draw: "chip" },
  ];
  const petalMat = std(C.core, { roughness: 0.3, metalness: 0.25, emissive: new THREE.Color(C.core), emissiveIntensity: 0.18 });
  const PETAL_S = 2.05, PETAL_T = Math.PI;
  const petals = petalIdx.map(i => {
    const f = faces[i];
    const others = f.v.filter(p => !near(p, V0));
    const A = others[0], B = others[1], M = A.clone().add(B).multiplyScalar(0.5);
    const ex = B.clone().sub(A).normalize(), ez = f.n.clone(), ey = new THREE.Vector3().crossVectors(ez, ex);
    const basis = new THREE.Matrix4().makeBasis(ex, ey, ez);
    const pivot = new THREE.Group(); pivot.position.copy(M); pivot.quaternion.setFromRotationMatrix(basis); coreSpin.add(pivot);
    const flap = new THREE.Group(); pivot.add(flap);
    const toLocal = p => p.clone().sub(M).applyMatrix4(basis.clone().transpose());
    const la = toLocal(A).multiplyScalar(0.97), lb = toLocal(B).multiplyScalar(0.97), lv = toLocal(V0);
    const lc = la.clone().add(lb).add(lv).multiplyScalar(1 / 3);
    const shrink = p => p.clone().sub(lc).multiplyScalar(0.94).add(lc);
    const tri = [la, lb, lv].map(shrink);
    const shell = new THREE.ExtrudeGeometry(new THREE.Shape(tri.map(p => new THREE.Vector2(p.x, p.y))), { depth: 0.07, bevelEnabled: false });
    shell.translate(0, 0, -0.07); keep(shell);
    flap.add(new THREE.Mesh(shell, petalMat));
    // indersidens figurflade (ses fra -z, dvs. udefra når klappen er vippet)
    const fg = keep(new THREE.BufferGeometry());
    const P = tri.map(p => [p.x, p.y, -0.075]).flat();
    fg.setAttribute("position", new THREE.Float32BufferAttribute(P, 3));
    fg.setIndex([0, 2, 1]);
    fg.computeVertexNormals();
    const figMat = keep(new THREE.MeshBasicMaterial({ color: "#ffffff", toneMapped: false, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide }));
    const fig = new THREE.Mesh(fg, figMat); fig.renderOrder = 12; flap.add(fig);
    return { i, f, pivot, flap, sign: Math.sign(lv.y) || 1, fg, fig, figMat, tri };
  });
  // beregn klappernes endelige stilling én gang: billedvinkel (til rækkefølgen) og figurens UV, så figuren står lodret i blikket
  {
    const saved = coreSpin.quaternion.clone();
    coreRig.position.set(0, CORE_Y, 0);        // entiteten har ikke nødvendigvis sat sin position endnu
    coreSpin.quaternion.copy(Q4.q);
    petals.forEach(p => { p.flap.rotation.x = p.sign * PETAL_T; p.flap.scale.set(PETAL_S, PETAL_S, 1); });
    coreRig.updateMatrixWorld(true);
    const { camR, camU } = Q4;
    const rel = new THREE.Vector3();
    petals.forEach(p => {
      const W = p.tri.map(t => p.fig.localToWorld(new THREE.Vector3(t.x, t.y, -0.075)));
      const ctr = W[0].clone().add(W[1]).add(W[2]).multiplyScalar(1 / 3);
      p.world = W; p.ctr = ctr;
      rel.copy(ctr).sub(coreRig.getWorldPosition(new THREE.Vector3()));
      p.ang = Math.atan2(rel.dot(camU), rel.dot(camR));
      p.dir2 = new THREE.Vector2(rel.dot(camR), rel.dot(camU)).normalize();
      const xs = W.map(w => w.dot(camR)), ys = W.map(w => w.dot(camU));
      const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys), sz = Math.max(x1 - x0, y1 - y0);
      const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
      const uv = W.map(w => [(w.dot(camR) - cx) / sz + 0.5, (w.dot(camU) - cy) / sz + 0.5]);
      p.fg.setAttribute("uv", new THREE.Float32BufferAttribute(uv.flat(), 2));
      // trekantens indskrevne cirkel i UV-rum (hvor figuren tegnes)
      const U = uv.map(([u, v]) => new THREE.Vector2(u, v));
      const a = U[1].distanceTo(U[2]), b = U[0].distanceTo(U[2]), c = U[0].distanceTo(U[1]), per = a + b + c;
      p.inc = new THREE.Vector2((a * U[0].x + b * U[1].x + c * U[2].x) / per, (a * U[0].y + b * U[1].y + c * U[2].y) / per);
      const s2 = per / 2; p.inr = Math.sqrt((s2 - a) * (s2 - b) * (s2 - c) / s2);
    });
    coreSpin.quaternion.copy(saved);
    petals.forEach(p => { p.flap.rotation.x = 0; p.flap.scale.set(1, 1, 1); });
  }
  // sorter: øverst til venstre, øverst til højre, nederst til venstre, nederst til højre
  const top = petals.slice().sort((a, b) => b.dir2.y - a.dir2.y);
  const ordered = [...top.slice(0, 2).sort((a, b) => a.dir2.x - b.dir2.x), ...top.slice(2).sort((a, b) => a.dir2.x - b.dir2.x)];
  function drawFigure(g, kind, cx, cy, r) {
    const L = "#141a3a", A2 = "#2b3a8f";
    g.save(); g.translate(cx, cy); g.scale(r / 100, r / 100);
    g.lineCap = "round"; g.lineJoin = "round"; g.strokeStyle = L; g.fillStyle = L;
    if (kind === "people") {            // tre mennesker side om side
      [[-46, 10, 0.85], [0, -4, 1], [46, 10, 0.85]].forEach(([x, y, s]) => {
        g.beginPath(); g.arc(x, y - 34 * s, 15 * s, 0, 7); g.fill();
        g.beginPath(); g.moveTo(x - 22 * s, y + 46 * s); g.quadraticCurveTo(x - 22 * s, y - 14 * s, x, y - 14 * s); g.quadraticCurveTo(x + 22 * s, y - 14 * s, x + 22 * s, y + 46 * s); g.closePath(); g.fill();
      });
    } else if (kind === "timeline") {   // en tidslinje med fire punkter og en pil
      g.lineWidth = 9; g.beginPath(); g.moveTo(-72, 18); g.lineTo(64, 18); g.stroke();
      g.beginPath(); g.moveTo(80, 18); g.lineTo(58, 4); g.lineTo(58, 32); g.closePath(); g.fill();
      [-60, -24, 12].forEach((x, i) => { g.beginPath(); g.arc(x, 18, 10, 0, 7); g.fill(); g.lineWidth = 6; g.beginPath(); g.moveTo(x, 4); g.lineTo(x, -18 - i * 14); g.stroke(); g.fillRect(x - 12, -34 - i * 14, 24, 16); });
      g.fillStyle = A2; g.beginPath(); g.arc(48, 18, 12, 0, 7); g.fill();
    } else if (kind === "aim") {        // en pil, der peger mod et mål
      g.lineWidth = 8; [48, 30, 12].forEach(rr => { g.beginPath(); g.arc(30, -8, rr, 0, 7); g.stroke(); });
      g.lineWidth = 9; g.beginPath(); g.moveTo(-74, 46); g.lineTo(18, 0); g.stroke();
      g.beginPath(); g.moveTo(26, -4); g.lineTo(2, -4); g.lineTo(14, 18); g.closePath(); g.fill();
    } else {                            // en chip med ben og ledningsbaner
      g.fillRect(-36, -36, 72, 72);
      g.lineWidth = 7; for (let k = -2; k <= 2; k++) { const o = k * 13; [[o, -36, o, -52], [o, 36, o, 52], [-36, o, -52, o], [36, o, 52, o]].forEach(([a, b, c, d]) => { g.beginPath(); g.moveTo(a, b); g.lineTo(c, d); g.stroke(); }); }
      g.lineWidth = 5; [[-52, -26, -80, -26, -80, -60], [52, 26, 82, 26, 82, 58], [26, 52, 26, 82]].forEach(pts => { g.beginPath(); g.moveTo(pts[0], pts[1]); for (let k = 2; k < pts.length; k += 2) g.lineTo(pts[k], pts[k + 1]); g.stroke(); g.beginPath(); g.arc(pts[pts.length - 2], pts[pts.length - 1], 7, 0, 7); g.fill(); });
      g.fillStyle = A2; g.fillRect(-20, -20, 40, 40);
    }
    g.restore();
  }
  const facetLabels = ordered.map((p, k) => {
    const F = FACET[k];
    const t = tex(512, 512, g => {
      g.fillStyle = "#dfe4ff"; g.fillRect(0, 0, 512, 512);
      // UV (0,0) er nederst til venstre; canvas har y nedad
      drawFigure(g, F.draw, p.inc.x * 512, (1 - p.inc.y) * 512, p.inr * 512 * 0.98);
    });
    p.figMat.map = t; p.figMat.needsUpdate = true;
    // ordet ved siden af klappen, ude fra kernen i billedet
    const m = new THREE.Mesh(keep(new THREE.PlaneGeometry(1.25, 0.268)),
      label(keep(K.labelTex(F.word, C.core, { w: 1024, h: 220, size: F.word.length > 12 ? 74 : 86, bg: true }))));
    const out = Q4.camR.clone().multiplyScalar(p.dir2.x).add(Q4.camU.clone().multiplyScalar(p.dir2.y * 0.6));
    m.position.copy(p.ctr).add(out.multiplyScalar(0.95)).add(new THREE.Vector3(0, p.dir2.y > 0 ? 0.15 : -0.2, 0));
    m.lookAt(f4x, EYE, f4z); m.renderOrder = 15; add(m);
    return m;
  });

  /* ---------- Stationer: titlerne sidder på podiets kant (kernens sokkel), hver vendt mod sit trins plads.
     Kun den aktive rejser sig og lyser; de andre ligger fladt og dæmpet i podiets kant. Ingen stænger. ---------- */
  const plqBack = keep(new THREE.BoxGeometry(0.98, 0.23, 0.03)); plqBack.translate(0, 0, -0.016);
  const plqMat = std("#262d55", { roughness: 0.45, metalness: 0.35 });
  const plaques = {};
  for (const s of ctx.steps) {
    const cfg = ST[s.id]; if (!cfg) continue;
    const pphi = cfg.plq ?? cfg.phi;
    const [x, z] = polar(pphi, cfg.plqR ?? 1.66);
    const [ux, uz] = polar(cfg.phi, cfg.vr), face = Math.atan2(ux - x, uz - z) / D2R;   // pladen vender mod brugeren
    const g = kit.grp(root, `${r3(x)} 0.13 ${r3(z)}`, { rotation: `0 ${r3(face)} 0` });
    const head = kit.grp(g, "0 0 0");
    head.object3D.add(new THREE.Mesh(plqBack, plqMat));
    const sign = ctx.sign(s.title, { parent: head, position: "0 0 0.002", width: 0.96, color: C.core, size: 74 });
    ctx.station(s.id, g);
    const [vx, vz] = polar(cfg.phi, cfg.vr);
    const look = cfg.out ? [0, 1.8, -8] : [0, CORE_Y, 0];
    ctx.view(s.id, { position: [r3(vx), 0, r3(vz)], lookAt: look, pitch: cfg.pitch });
    plaques[s.id] = { head: head.object3D, sign, k: 0 };
  }
  // rummets navn hænger over kernen og drejer sig mod den besøgende
  const roomSign = ctx.sign(ctx.room.name, { sub: ctx.room.sub, position: `0 ${CORE_Y + 1.35} 0`, width: 2.3, color: C.core });
  const camPos = new THREE.Vector3();

  /* ---------- F2: "med" og "om" på hver side af kernen ---------- */
  function wordTex(word, sub) {
    return tex(1024, 512, (g, w, h) => {
      const bg = g.createRadialGradient(w / 2, h * 0.5, 10, w / 2, h * 0.5, w * 0.5);
      bg.addColorStop(0, "rgba(7,10,22,0.8)"); bg.addColorStop(0.6, "rgba(7,10,22,0.5)"); bg.addColorStop(1, "rgba(7,10,22,0)");
      g.fillStyle = bg; g.fillRect(0, 0, w, h);
      g.textAlign = "center"; g.textBaseline = "middle";
      g.font = '700 250px "Familjen Grotesk", "Segoe UI", sans-serif';
      g.shadowColor = C.core; g.shadowBlur = 28; g.fillStyle = "#f4f6ff"; g.fillText(word, w / 2, h * 0.4);
      g.shadowBlur = 0; g.fillText(word, w / 2, h * 0.4);
      g.font = '600 60px "Source Sans 3", "Segoe UI", sans-serif';
      g.shadowColor = "rgba(5,7,18,1)"; g.shadowBlur = 18; g.fillStyle = C.core; g.fillText(sub, w / 2, h * 0.83); g.shadowBlur = 0; g.fillText(sub, w / 2, h * 0.83);
    });
  }
  const right = phi => [Math.cos(phi * D2R), -Math.sin(phi * D2R)];
  const [f2x, f2z] = polar(ST.f2.phi, ST.f2.vr);
  const words = [["med", "udtrykke sig med teknologierne", -1], ["om", "udtrykke sig om teknologierne", 1]].map(([w, sub, side]) => {
    const m = new THREE.Mesh(keep(new THREE.PlaneGeometry(1.5, 0.75)), label(wordTex(w, sub), { side: THREE.FrontSide }));
    const [rx, rz] = right(ST.f2.phi), [fx, fz] = polar(ST.f2.phi, 0.55);
    m.position.set(rx * side * 1.45 + fx, CORE_Y - 0.05, rz * side * 1.45 + fz); m.lookAt(f2x, EYE + 0.6, f2z); m.renderOrder = 20; add(m);
    return m;
  });
  const wordLinks = words.map(m => {     // en tynd streg fra hvert ord ind til kernen
    const a = m.position.clone(), b = new THREE.Vector3(0, CORE_Y, 0), d = b.clone().sub(a);
    const a2 = a.clone().add(d.clone().multiplyScalar(0.42)), b2 = b.clone().sub(d.clone().multiplyScalar(0.36));
    const l = new THREE.Mesh(keep(new THREE.CylinderGeometry(0.008, 0.008, a2.distanceTo(b2), 4, 1, true)), basic(C.core, { transparent: true, opacity: 0 }));
    l.position.copy(a2).add(b2).multiplyScalar(0.5); l.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b2.clone().sub(a2).normalize()); add(l);
    return l;
  });

  /* ---------- F3: fem rødder vokser op ad kernen og fletter sig ---------- */
  const ROOTS = [
    ["naturvidenskab", "#d9e4ff", -78], ["samfundsvidenskab", "#c7d6c0", -38], ["humanvidenskab", "#e3d6c2", 180],
    ["tekniske håndværksfag", "#bcd2e6", 38], ["æstetiske håndværksfag", "#dccbe6", 78],
  ];
  const [f3x, f3z] = polar(ST.f3.phi, ST.f3.vr);
  const roots = ROOTS.map(([name, col, off], i) => {
    // fra gulvet ind til podiet, op i en flettet stamme og ud som fingre om kernens underside
    const a0 = (ST.f3.phi + off) * D2R, a1 = a0 + Math.sin(i * 2.1) * 0.3;
    const pts = [], N = 80, TRUNK_TOP = CORE_Y - CORE_R * 0.8;
    for (let k = 0; k <= N; k++) {
      const t = k / N; let y, r, ang;
      if (t < 0.28) { const u = t / 0.28, e = u * u * (3 - 2 * u); y = 0.04 + 0.1 * e; r = 2.55 - 2.38 * e; ang = a0 * (1 - e) + a1 * e; }
      else if (t < 0.74) { const u = (t - 0.28) / 0.46; y = 0.14 + u * (TRUNK_TOP - 0.14); r = 0.15 - 0.06 * Math.sin(u * Math.PI); ang = a1 + u * Math.PI * 3; }
      else { const u = (t - 0.74) / 0.26, lat = -Math.PI / 2 + 0.62 + u * 1.2; y = CORE_Y + Math.sin(lat) * (CORE_R + 0.05); r = Math.cos(lat) * (CORE_R + 0.05); ang = a1 + Math.PI * 3 + u * 0.5; }
      pts.push(new THREE.Vector3(Math.sin(ang) * r, y, Math.cos(ang) * r));
    }
    const curve = new THREE.CatmullRomCurve3(pts);
    const geo = keep(new THREE.TubeGeometry(curve, 150, 0.032, 6, false));
    { const p = geo.attributes.position, segs = 151, rad = 7, c = new THREE.Vector3(), v = new THREE.Vector3();
      for (let s2 = 0; s2 < segs; s2++) { const tt = s2 / (segs - 1); curve.getPointAt(tt, c); const f = 1.25 - 0.8 * tt;
        for (let j = 0; j < rad; j++) { const idx = s2 * rad + j; v.fromBufferAttribute(p, idx).sub(c).multiplyScalar(f).add(c); p.setXYZ(idx, v.x, v.y, v.z); } }
      p.needsUpdate = true; geo.computeVertexNormals(); }
    const mat = std(col, { roughness: 0.4, emissive: new THREE.Color(col), emissiveIntensity: 0.3, flatShading: false, transparent: true });
    const mesh = new THREE.Mesh(geo, mat); add(mesh);
    // navn over rodens fod i ca. 1 m højde, vendt mod F3-stationen, med en tynd lodlinje ned
    // navnet står i en ordnet række i F3-blikket, med en tynd streg ned til rodens fod
    const foot = new THREE.Vector3(Math.sin(a0) * 2.55, 0.03, Math.cos(a0) * 2.55);
    const lbl = new THREE.Mesh(keep(new THREE.PlaneGeometry(1.6, 0.344)), label(keep(K.labelTex(name, col, { w: 1024, h: 220, size: 72, bg: true }))));
    lbl.renderOrder = 15; add(lbl);
    const stemMat = basic(col, { transparent: true, opacity: 0 });
    const stem = new THREE.Mesh(keep(new THREE.CylinderGeometry(0.005, 0.005, 1, 3, 1, true)), stemMat); add(stem);
    return { mesh, geo, mat, lbl, stem, stemMat, foot, col, count: geo.index.count };
  });
  { // rækken: sorteres efter fodens placering i blikket, så stregerne ikke krydser
    const fwd = new THREE.Vector3(-f3x, 0, -f3z).normalize(), rt = new THREE.Vector3(-fwd.z, 0, fwd.x);
    const eye = new THREE.Vector3(f3x, 0, f3z);
    const byX = roots.slice().sort((a, b) => a.foot.clone().sub(eye).dot(rt) / a.foot.clone().sub(eye).dot(fwd) - b.foot.clone().sub(eye).dot(rt) / b.foot.clone().sub(eye).dot(fwd));
    // en bue bag kernen, i øjenhøjde og over: langt fra kameraet og fri af stationen
    const XS = [-2.5, -1.45, 0, 1.45, 2.5], YS = [1.25, 1.8, 2.05, 1.8, 1.25];
    byX.forEach((r, k) => {
      const p = eye.clone().add(fwd.clone().multiplyScalar(k === 2 ? 5.6 : 5.0)).add(rt.clone().multiplyScalar(XS[k])); p.y = YS[k];
      if (k === 2) p.y = 1.15;                      // midterste: bag stammen, under kernen
      r.lbl.position.copy(p); r.lbl.lookAt(f3x, EYE, f3z);
      const a = p.clone().add(new THREE.Vector3(0, -0.11, 0)), b = r.foot, d = b.clone().sub(a);
      r.stem.position.copy(a).add(b).multiplyScalar(0.5); r.stem.scale.y = d.length();
      r.stem.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
    });
  }
  const rootBaseMat = basic(C.core, { transparent: true, opacity: 0 });
  { const gs = ROOTS.map(([, , off]) => { const a0 = (ST.f3.phi + off) * D2R; const g = new THREE.CylinderGeometry(0.07, 0.09, 0.03, 10); g.translate(Math.sin(a0) * 2.55, 0.015, Math.cos(a0) * 2.55); return g; });
    add(new THREE.Mesh(keep(BGU.mergeGeometries(gs)), rootBaseMat)); gs.forEach(g => g.dispose()); }

  /* ---------- F5: erkendeformernes tre tegn ---------- */
  function drawIcon(g, kind, label) {
    const cx = 256, L = C.core, INK = "#eef1ff";
    g.clearRect(0, 0, 512, 512);
    g.fillStyle = "rgba(13,17,38,0.94)"; g.beginPath(); g.arc(cx, cx, 236, 0, 7); g.fill();
    g.strokeStyle = L; g.lineWidth = 9; g.beginPath(); g.arc(cx, cx, 232, 0, 7); g.stroke();
    g.lineCap = "round"; g.lineJoin = "round";
    function capsule(x1, y1, x2, y2, r) { const a = Math.atan2(y2 - y1, x2 - x1); g.moveTo(x1 + r * Math.cos(a + Math.PI / 2), y1 + r * Math.sin(a + Math.PI / 2)); g.arc(x2, y2, r, a + Math.PI / 2, a - Math.PI / 2, true); g.arc(x1, y1, r, a - Math.PI / 2, a + Math.PI / 2, true); g.closePath(); }
    function handShape(side) {
      g.beginPath(); g.moveTo(-46, -8); g.lineTo(46, -8); g.quadraticCurveTo(52, 60, 30, 84); g.lineTo(-30, 84); g.quadraticCurveTo(-52, 60, -46, -8); g.closePath();
      [[-34, 50], [-11, 62], [12, 58], [34, 44]].forEach(([x, l]) => capsule(x, 0, x, -l, 11.5));
      capsule(side * 40, 52, side * 78, 8, 12);
    }
    function hand(x, y, rot, s, side = -1) {   // massiv silhuet af en hånd med mørke spalter mellem fingrene
      g.save(); g.translate(x, y); g.rotate(rot); g.scale(s, s);
      g.fillStyle = L; g.strokeStyle = L; g.lineWidth = 8; handShape(side); g.stroke(); g.fill();
      g.strokeStyle = "#0d1126"; g.lineWidth = 5; [-22.5, 0.5, 23].forEach(x => { g.beginPath(); g.moveTo(x, -2); g.lineTo(x, -40); g.stroke(); });
      g.restore();
    }
    function block(x, y, s, fill) { g.fillStyle = fill; g.strokeStyle = INK; g.lineWidth = 10; g.beginPath(); g.rect(x - s / 2, y - s / 2, s, s); g.fill(); g.stroke(); }
    if (kind === 0) {          // en hånd, der bygger: sætter den øverste klods på
      block(206, 318, 78, "#2b3366"); block(286, 318, 78, "#2b3366"); block(246, 240, 78, "#3a4590");
      g.strokeStyle = L; g.lineWidth = 6; g.setLineDash([2, 14]); g.beginPath(); g.moveTo(246, 150); g.lineTo(246, 190); g.stroke(); g.setLineDash([]);
      hand(318, 146, Math.PI * 0.78, 0.9);
    } else if (kind === 1) {   // en hånd, der vender noget om
      g.save(); g.translate(256, 196); g.transform(1, 0, -0.35, 0.55, 0, 0);
      g.fillStyle = "#3a4590"; g.strokeStyle = INK; g.lineWidth = 11; g.beginPath(); g.rect(-70, -55, 140, 110); g.fill(); g.stroke(); g.restore();
      g.strokeStyle = L; g.lineWidth = 12;
      g.beginPath(); g.arc(256, 196, 120, Math.PI * 1.08, Math.PI * 1.62); g.stroke();
      g.beginPath(); g.arc(256, 196, 120, Math.PI * 0.08, Math.PI * 0.62); g.stroke();
      const head = a => { const x = 256 + 120 * Math.cos(a), y = 196 + 120 * Math.sin(a), t = a + Math.PI / 2;
        g.fillStyle = L; g.beginPath(); g.moveTo(x + 26 * Math.cos(t), y + 26 * Math.sin(t)); g.lineTo(x + 17 * Math.cos(t + 2.2), y + 17 * Math.sin(t + 2.2)); g.lineTo(x + 17 * Math.cos(t - 2.2), y + 17 * Math.sin(t - 2.2)); g.closePath(); g.fill(); };
      head(Math.PI * 1.62); head(Math.PI * 0.62);
      hand(256, 300, 0, 0.82);
    } else {                   // et stiplet omrids af noget, der ikke findes endnu
      g.strokeStyle = L; g.lineWidth = 11; g.setLineDash([22, 18]);
      const c = [256, 232], s = 92, dx = s * 0.87, dy = s * 0.5;
      const P = { t: [c[0], c[1] - s], tr: [c[0] + dx, c[1] - dy], br: [c[0] + dx, c[1] + dy], b: [c[0], c[1] + s], bl: [c[0] - dx, c[1] + dy], tl: [c[0] - dx, c[1] - dy], m: c };
      [["t", "tr"], ["tr", "br"], ["br", "b"], ["b", "bl"], ["bl", "tl"], ["tl", "t"], ["m", "tl"], ["m", "tr"], ["m", "b"]].forEach(([a, b]) => { g.beginPath(); g.moveTo(...P[a]); g.lineTo(...P[b]); g.stroke(); });
      g.setLineDash([]);
    }
    g.fillStyle = L; g.textAlign = "center"; g.textBaseline = "middle"; g.font = '700 50px "Familjen Grotesk", "Segoe UI", sans-serif';
    g.fillText(label, cx, 418);
  }
  const ICONS = ["skabe", "omskabe", "nytænke"].map((lab, i) => {
    const mat = keep(new THREE.SpriteMaterial({ map: tex(512, 512, g => drawIcon(g, i, lab)), transparent: true, depthWrite: false, opacity: 0 }));
    const s = new THREE.Sprite(mat); s.renderOrder = 18; coreRig.add(s); return { s, mat, ph: i * Math.PI * 2 / 3 };
  });
  // F5: tegnene står stille i en bue om kernen, vendt mod F5-stationen
  const [f5x, f5z] = polar(ST.f5.phi, ST.f5.vr);
  const f5R = new THREE.Vector3(...[right(ST.f5.phi)[0], 0, right(ST.f5.phi)[1]]);
  const f5F = new THREE.Vector3(f5x, 0, f5z).normalize();
  const ARC = [[-1.5, -0.05], [0, 0.98], [1.5, -0.05]].map(([sx, sy]) => f5R.clone().multiplyScalar(sx).add(new THREE.Vector3(0, sy, 0)).add(f5F.clone().multiplyScalar(0.55)));
  const orbitMat = basic(C.core, { transparent: true, opacity: 0 });
  const orbit = new THREE.Mesh(keep(new THREE.TorusGeometry(1, 0.007, 3, 96)), orbitMat);
  orbit.rotation.x = Math.PI / 2; coreRig.add(orbit);

  /* ---------- De tre porte: på klem og svagt farvede fra start; F6 er det store lysøjeblik ---------- */
  const AREA_OF = { "hal-a": "a", "hal-b": "b", "hal-c": "c" };
  const returned = !!ctx.cameFrom;                       // man kommer tilbage hjem: portene står allerede åbne
  const seen = to => [to, ...(ctx.rooms[to].children || [])].some(r => ctx.visited.has(r));
  // glimt af rummet bag porten (silhuetter mod områdets farve)
  function glimpse(c, w, h, key, col) {
    const gr = c.createLinearGradient(0, h, 0, 0); gr.addColorStop(0, col); gr.addColorStop(0.55, col + "77"); gr.addColorStop(1, "#05070f");
    c.fillStyle = gr; c.fillRect(0, 0, w, h);
    c.fillStyle = "rgba(6,8,20,0.82)"; c.strokeStyle = "rgba(6,8,20,0.82)"; c.lineCap = "round";
    const fl = h * 0.86;                                   // gulvlinje
    c.fillRect(0, fl, w, h - fl);
    if (key === "hal-a") {                                 // et arbejdsbord med lampe, klodser og et ark
      c.fillRect(w * 0.12, fl - h * 0.2, w * 0.76, h * 0.03); c.fillRect(w * 0.16, fl - h * 0.17, w * 0.04, h * 0.17); c.fillRect(w * 0.8, fl - h * 0.17, w * 0.04, h * 0.17);
      c.lineWidth = w * 0.025; c.beginPath(); c.moveTo(w * 0.72, fl - h * 0.2); c.lineTo(w * 0.62, fl - h * 0.36); c.lineTo(w * 0.5, fl - h * 0.32); c.stroke();
      c.beginPath(); c.moveTo(w * 0.44, fl - h * 0.27); c.lineTo(w * 0.56, fl - h * 0.27); c.lineTo(w * 0.5, fl - h * 0.33); c.closePath(); c.fill();
      [[0.22, 0.06], [0.3, 0.06], [0.26, 0.12]].forEach(([x, y]) => c.fillRect(w * x, fl - h * 0.2 - h * y, w * 0.07, h * 0.055));
      c.save(); c.translate(w * 0.62, fl - h * 0.215); c.rotate(-0.12); c.fillRect(-w * 0.1, -h * 0.01, w * 0.2, h * 0.012); c.restore();
    } else if (key === "hal-b") {                          // et rack med kabler og en vindeltrappe op
      c.fillRect(w * 0.18, fl - h * 0.5, w * 0.24, h * 0.5);
      c.fillStyle = col; for (let k = 0; k < 7; k++) c.fillRect(w * 0.22, fl - h * 0.46 + k * h * 0.06, w * 0.03, h * 0.012);
      c.fillStyle = "rgba(6,8,20,0.82)";
      c.lineWidth = w * 0.012; for (let k = 0; k < 3; k++) { c.beginPath(); c.moveTo(w * 0.42, fl - h * (0.4 - k * 0.1)); c.bezierCurveTo(w * 0.55, fl - h * (0.38 - k * 0.1), w * 0.52, fl - h * 0.02, w * 0.66, fl); c.stroke(); }
      for (let k = 0; k < 9; k++) c.fillRect(w * (0.6 + (k % 2) * 0.1), fl - h * (0.08 + k * 0.06), w * 0.2, h * 0.012);
      c.fillRect(w * 0.69, fl - h * 0.62, w * 0.02, h * 0.62);
    } else {                                               // en gade: husfacader, en lygte og to mennesker med telefoner
      [[0.04, 0.42], [0.24, 0.55], [0.5, 0.38], [0.72, 0.5]].forEach(([x, hh]) => c.fillRect(w * x, fl - h * hh, w * 0.2, h * hh));
      c.fillStyle = col; [[0.08, 0.34], [0.14, 0.34], [0.28, 0.46], [0.36, 0.46], [0.28, 0.36], [0.76, 0.42], [0.84, 0.32]].forEach(([x, y]) => c.fillRect(w * x, fl - h * y, w * 0.035, h * 0.03));
      c.fillStyle = "rgba(6,8,20,0.92)";
      [[0.4, 1], [0.6, 0.9]].forEach(([x, s]) => { c.beginPath(); c.arc(w * x, fl - h * 0.17 * s, w * 0.035 * s, 0, 7); c.fill(); c.fillRect(w * (x - 0.04 * s), fl - h * 0.14 * s, w * 0.08 * s, h * 0.14 * s); });
    }
  }
  function badgeTex(col) {                                 // diskret mærke: et flueben i en cirkel og "besøgt"
    return tex(512, 128, g => {
      g.fillStyle = "rgba(11,15,30,0.85)"; K.roundRect(g, 4, 4, 504, 120, 60); g.fill(); g.strokeStyle = col; g.lineWidth = 5; g.stroke();
      g.strokeStyle = col; g.lineWidth = 9; g.lineCap = "round"; g.lineJoin = "round";
      g.beginPath(); g.moveTo(62, 66); g.lineTo(82, 86); g.lineTo(118, 44); g.stroke();
      g.fillStyle = "#eef1ff"; g.font = '600 60px "Source Sans 3", "Segoe UI", sans-serif'; g.textBaseline = "middle"; g.fillText("besøgt", 152, 68);
    });
  }
  const gates = {};
  for (const [to, phi] of Object.entries(GATE_PHI)) {
    const col = C[AREA_OF[to]];
    const [x, z] = polar(phi, RW - 0.25), ry = (phi + 180) * D2R;
    const g = holder(`${r3(x)} 0 ${r3(z)}`).object3D; g.rotation.y = ry;
    const archMat = std("#2a3160", { emissive: new THREE.Color(col), emissiveIntensity: 0.12, roughness: 0.5, metalness: 0.3 });
    const pillars = mergeBoxes([[0.36, 3.0, 0.5, -1.27, 1.5, 0.05], [0.36, 3.0, 0.5, 1.27, 1.5, 0.05], [0.5, 0.14, 0.62, -1.27, 0.07, 0.05], [0.5, 0.14, 0.62, 1.27, 0.07, 0.05]]);
    const arcGeo = new THREE.TorusGeometry(1.27, 0.18, 4, 24, Math.PI); arcGeo.translate(0, 3.0, 0.05);
    g.add(new THREE.Mesh(keep(BGU.mergeGeometries([pillars, arcGeo])), archMat)); arcGeo.dispose();
    const seamMat = basic(col, { transparent: true, opacity: 0.4 });
    const seam = new THREE.Mesh(keep(new THREE.TorusGeometry(1.08, 0.022, 3, 32, Math.PI)), seamMat); seam.position.set(0, 3.0, 0.31); g.add(seam);
    g.add(new THREE.Mesh(mergeBoxes([[0.04, 3.0, 0.04, -1.08, 1.5, 0.31], [0.04, 3.0, 0.04, 1.08, 1.5, 0.31]]), seamMat));
    // rummet bagved: en buet nische med et glimt af området
    const backTex = tex(256, 512, (c, w, h) => { c.save(); c.beginPath(); c.moveTo(0, h); c.lineTo(0, h * 0.3); c.arc(w / 2, h * 0.3, w / 2, Math.PI, 0); c.lineTo(w, h); c.closePath(); c.clip(); glimpse(c, w, h, to, col); c.restore(); });
    const backMat = keep(new THREE.MeshBasicMaterial({ map: backTex, transparent: true, color: "#555555", toneMapped: false }));
    const back = new THREE.Mesh(keep(new THREE.PlaneGeometry(2.18, 4.36)), backMat); back.position.set(0, 2.18, -0.18); g.add(back);
    // to portfløje
    const leafMat = std("#1b2146", { roughness: 0.35, metalness: 0.5 });
    const leafGeo = mergeBoxes([[1.04, 2.86, 0.07, 0, 1.43, 0], [0.9, 0.05, 0.09, 0, 0.5, 0], [0.9, 0.05, 0.09, 0, 2.4, 0]]);
    const inlayMat = basic(col, { transparent: true, opacity: 0.45 });
    const inlayGeo = mergeBoxes([[0.035, 2.6, 0.085, 0, 1.43, 0]]);
    const leaves = [-1, 1].map(s => {
      const hinge = new THREE.Group(); hinge.position.set(s * 1.06, 0, 0.22); g.add(hinge);
      const leaf = new THREE.Mesh(leafGeo, leafMat); leaf.position.x = -s * 0.53; hinge.add(leaf);
      const inl = new THREE.Mesh(inlayGeo, inlayMat); inl.position.x = -s * 1.035; hinge.add(inl);
      return { hinge, s };
    });
    // lysbane fra podiet ud til porten
    const len = RW - 0.25 - 1.75, [lx, lz] = polar(phi, 1.75 + len / 2);
    const laneMat = basic(col, { transparent: true, opacity: 0.2 });
    const laneGeo = keep(new THREE.PlaneGeometry(0.05, len)); laneGeo.rotateX(-Math.PI / 2);
    const lane = new THREE.Mesh(laneGeo, laneMat); lane.position.set(lx, 0.012, lz); lane.rotation.y = phi * D2R; add(lane);
    const laneGlowTex = tex(64, 8, (c, w, h) => { const gr = c.createLinearGradient(0, 0, w, 0); gr.addColorStop(0, col + "00"); gr.addColorStop(0.5, col + "ff"); gr.addColorStop(1, col + "00"); c.fillStyle = gr; c.fillRect(0, 0, w, h); });
    const laneGlowMat = additive(laneGlowTex, "#ffffff", 0);
    const lgGeo = keep(new THREE.PlaneGeometry(0.9, len)); lgGeo.rotateX(-Math.PI / 2);
    const laneGlow = new THREE.Mesh(lgGeo, laneGlowMat); laneGlow.position.set(lx, 0.015, lz); laneGlow.rotation.y = phi * D2R; add(laneGlow);
    const gpMat = additive(keep(K.glowTex(col)), "#ffffff", 0);
    const gp = new THREE.Mesh(keep(new THREE.PlaneGeometry(3.6, 2.6)), gpMat); gp.rotation.x = -Math.PI / 2; gp.position.set(0, 0.02, 0.9); g.add(gp);
    // områdets navn (det, fortælleren siger) stort over buen; rammens dørskilt med rummets navn står under
    const areaSign = ctx.sign(ctx.rooms[to].sub, { position: `${r3(x * 0.985)} 4.72 ${r3(z * 0.985)}`, rotation: `0 ${r3(phi + 180)} 0`, width: 3.0, color: col, size: 88 });
    if (seen(to)) {
      const b = new THREE.Mesh(keep(new THREE.PlaneGeometry(0.72, 0.18)), label(badgeTex(col), { opacity: 0.95 }));
      b.position.set(0, 0.42, 0.42); b.renderOrder = 16; g.add(b);
    }
    ctx.door(to, { position: `${r3(x)} 0 ${r3(z)}`, rotation: `0 ${r3(phi + 180)} 0` });
    gates[to] = { leaves, archMat, seamMat, backMat, inlayMat, laneMat, laneGlowMat, gpMat, areaSign, open: returned ? 1 : 0.16 };
  }

  /* ---------- Trappen op til Udsigten: tydeligt markeret som "til sidst" ---------- */
  {
    const phi = UP_PHI, ry = (phi + 180) * D2R, LAND = 0.9;
    const g = holder().object3D;
    const parts = [];
    const [lx, lz] = polar(phi, RW - 0.75); parts.push([2.4, LAND, 1.3, lx, LAND / 2, lz, ry]);
    for (let i = 0; i < 5; i++) { const h = (i + 1) * LAND / 6, [sx, sz] = polar(phi, RW - 1.55 - i * 0.32); parts.push([1.9, h, 0.32, sx, h / 2, sz, ry]); }
    g.add(new THREE.Mesh(mergeBoxes(parts), std("#262d55", { roughness: 0.6 })));
    const nose = []; for (let i = 0; i < 5; i++) { const h = (i + 1) * LAND / 6, [sx, sz] = polar(phi, RW - 1.55 - i * 0.32 + 0.155); nose.push([1.8, 0.02, 0.03, sx, h + 0.005, sz, ry]); }
    const [nx, nz] = polar(phi, RW - 1.4); nose.push([2.3, 0.02, 0.03, nx, LAND + 0.005, nz, ry]);
    g.add(new THREE.Mesh(mergeBoxes(nose), basic(C.core, { transparent: true, opacity: 0.55 })));
    const [dx, dz] = polar(phi, RW - 0.4);
    // bag døren: en udsigt mod skumringen (i stedet for en tom flade)
    const skyTex = tex(256, 512, (c, w, h) => {
      const gr = c.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, "#0c1030"); gr.addColorStop(0.55, "#3a2f66"); gr.addColorStop(0.68, "#b0707a"); gr.addColorStop(0.7, "#1b1835"); gr.addColorStop(1, "#0b0d1f");
      c.fillStyle = gr; c.fillRect(0, 0, w, h);
      c.fillStyle = "#141228"; let xx = 0; while (xx < w) { const bw = 10 + rnd() * 26, bh = 8 + rnd() * 40; c.fillRect(xx, h * 0.7 - bh, bw, bh); xx += bw; }
      c.fillStyle = "rgba(255,214,160,0.7)"; for (let i = 0; i < 26; i++) c.fillRect(rnd() * w, h * 0.7 - 4 - rnd() * 34, 2, 2);
      c.fillStyle = "#eef1ff"; for (let i = 0; i < 40; i++) c.fillRect(rnd() * w, rnd() * h * 0.5, 1.5, 1.5);
    });
    const sky = new THREE.Mesh(keep(new THREE.PlaneGeometry(1.6, 2.5)), keep(new THREE.MeshBasicMaterial({ map: skyTex, toneMapped: false })));
    const [bx, bz] = polar(phi, RW - 0.32); sky.position.set(bx, LAND + 1.25, bz); sky.rotation.y = ry; add(sky);
    ctx.door("udsigt", { position: `${r3(dx)} ${LAND} ${r3(dz)}`, rotation: `0 ${r3(phi + 180)} 0`, glow: 0.08, quiet: true });
    const [sx, sz] = polar(phi, RW - 0.45);
    ctx.sign("Til sidst", { position: `${r3(sx)} ${LAND + 3.6} ${r3(sz)}`, rotation: `0 ${r3(phi + 180)} 0`, width: 1.5, color: C.core, size: 80, sub: "når du har set de tre områder" });
    if (ctx.visited.has("udsigt")) {
      const b = new THREE.Mesh(keep(new THREE.PlaneGeometry(0.72, 0.18)), label(badgeTex(C.core), { opacity: 0.95 }));
      const [qx, qz] = polar(phi, RW - 1.2); b.position.set(qx, LAND + 0.32, qz); b.rotation.y = ry; b.renderOrder = 16; add(b);
    }
    // lavendel lysbane fra podiet til trappen
    const len = RW - 1.55 - 1.75 - 1.3, [lx2, lz2] = polar(phi, 1.75 + len / 2);
    const laneGeo = keep(new THREE.PlaneGeometry(0.04, len)); laneGeo.rotateX(-Math.PI / 2);
    const lane = new THREE.Mesh(laneGeo, basic(C.core, { transparent: true, opacity: 0.3 })); lane.position.set(lx2, 0.012, lz2); lane.rotation.y = phi * D2R; add(lane);
  }

  /* ---------- Tilstand pr. trin ---------- */
  let step = null, stepAt = 0;
  const S = { coreGlow: 0.4, halo: 0.4, light: 6, words: 0, roots: 0, rootDim: 1, rootGrow: 0, facets: 0, icons: 0, iconBig: 0, roomSign: 1 };
  const T = { ...S };
  const now = () => performance.now();
  function onStep(id) {
    step = id; stepAt = now();
    const n = +id.slice(1);
    T.coreGlow = n === 1 ? 1 : n === 6 ? 0.3 : 0.45;
    T.halo = n === 1 ? 0.7 : n === 6 ? 0.25 : 0.4;
    T.light = n === 1 ? 9 : n === 6 ? 3 : 6;
    T.words = n === 2 ? 1 : 0;
    T.roots = n >= 3 ? 1 : 0;
    T.rootDim = n === 3 ? 1 : 0;
    T.facets = n === 4 ? 1 : 0;
    T.icons = n >= 5 ? 1 : 0;
    T.iconBig = n === 5 ? 1 : 0;
    T.roomSign = n === 4 || n === 5 ? 0 : 1;
    S.rootGrow = n === 3 ? 0 : (n > 3 ? 1 : 0);
  }

  const qSpin = new THREE.Quaternion(), eul = new THREE.Euler();
  let yaw = 0;
  const signMat = el => { const m = el.getObject3D("mesh"); return m && m.material; };
  function tick(t, dt) {
    if (!step) return;
    dt = Math.min(dt, 250);
    const el = now() - stepAt;
    for (const k of Object.keys(T)) if (k !== "rootGrow") S[k] = approach(S[k], T[k], dt, 3.5);
    // kernen: drejer langsomt; i F4 stiller den sig med det åbne hjørne mod brugeren
    const k4 = ease(S.facets);
    yaw += dt * 0.00018 * (1 - k4);
    qSpin.setFromEuler(eul.set(0.35, yaw, 0.12));
    coreSpin.quaternion.copy(qSpin).slerp(Q4.q, k4);
    coreRig.position.y = CORE_Y + Math.sin(t * 0.0011) * 0.04 * (1 - k4);
    coreMat.emissiveIntensity = 0.08 + S.coreGlow * 0.5;
    haloMat.opacity = S.halo * (1 - 0.6 * k4); halo.scale.setScalar(2.4 + S.halo * 1.6);
    coreLight.intensity = S.light;
    innerMat.color.set(C.core).multiplyScalar(0.35 + 0.65 * Math.max(k4, S.coreGlow * 0.7));
    poolMat.opacity = 0.3 + S.coreGlow * 0.5;
    // rumskiltet drejer sig mod den besøgende
    ctx.root.sceneEl.camera.getWorldPosition(camPos);
    roomSign.object3D.rotation.y = Math.atan2(camPos.x, camPos.z);
    const rsm = signMat(roomSign); if (rsm) { rsm.opacity = S.roomSign; roomSign.object3D.visible = S.roomSign > 0.02; }
    // stationspladerne: kun den aktive står fremme; de andre ligger lavt og fladt
    for (const [id, p] of Object.entries(plaques)) {
      p.k = approach(p.k, id === step ? 1 : 0, dt, 5); const e = ease(p.k);
      p.head.position.y = 0.06 + 0.2 * e; p.head.rotation.x = (-90 + 55 * e) * D2R;
      const m = signMat(p.sign); if (m) m.opacity = 0.1 + 0.9 * e;
    }
    // F2: ordene
    words.forEach(m => { m.material.opacity = S.words; m.visible = S.words > 0.01; });
    wordLinks.forEach(l => { l.material.opacity = S.words * 0.55; l.visible = S.words > 0.01; });
    // F3: rødderne; bagefter trækkes de ind til stammen og dæmpes kraftigt
    if (step === "f3") S.rootGrow = ease(el / 2300);
    rootBaseMat.opacity = S.roots * 0.7 * S.rootDim;
    roots.forEach((r, i) => {
      const gr = clamp01(S.rootGrow * 1.15 - i * 0.03);
      const end = Math.floor(r.count * gr / 3) * 3;
      const start = Math.floor(r.count * 0.27 * (1 - S.rootDim) / 3) * 3;
      r.geo.setDrawRange(start, Math.max(0, end - start));
      r.mesh.visible = S.roots > 0.01 && end > start;
      r.mat.color.set(r.col).multiplyScalar(0.3 + 0.7 * S.rootDim);
      r.mat.emissiveIntensity = 0.06 + 0.42 * S.rootDim;
      r.mat.opacity = 0.35 + 0.65 * S.rootDim;
      const lo = (step === "f3" ? ease((el - 600) / 900) : 0);
      r.lbl.material.opacity = lo; r.lbl.visible = lo > 0.01; r.stemMat.opacity = lo * 0.5;
    });
    // F4: klapperne folder sig ud, én ad gangen, og viser deres figur
    ordered.forEach((p, i) => {
      const kk = ease(clamp01(S.facets * 1.5 - i * 0.12));
      p.flap.rotation.x = p.sign * PETAL_T * kk;
      const sc = 1 + (PETAL_S - 1) * ease((kk - 0.4) / 0.6);
      p.flap.scale.set(sc, sc, 1);
      p.figMat.opacity = ease((kk - 0.55) / 0.45); p.fig.visible = p.figMat.opacity > 0.01;
      const lo = ease((S.facets - 0.7) / 0.3);
      facetLabels[i].material.opacity = lo; facetLabels[i].visible = lo > 0.01;
    });
    petalMat.emissiveIntensity = 0.15 + k4 * 0.25;
    // F5: tegnene står i en bue; ellers kredser de småt om kernen
    const big = ease(S.iconBig);
    ICONS.forEach(({ s, mat, ph }, i) => {
      const a = ph + t * 0.00024;
      const ox = Math.sin(a) * 1.05, oz = Math.cos(a) * 1.05, oy = 0.05 * Math.sin(a * 2);
      s.position.set(ox + (ARC[i].x - ox) * big, oy + (ARC[i].y - oy) * big, oz + (ARC[i].z - oz) * big);
      const size = 0.34 + 0.58 * big; s.scale.set(size, size, 1);
      mat.opacity = S.icons; s.visible = S.icons > 0.01;
    });
    orbit.scale.setScalar(1.05); orbitMat.opacity = S.icons * 0.22 * (1 - big); orbit.visible = orbitMat.opacity > 0.01;
    // portene: på klem fra start; i F6 åbner de én ad gangen, når de nævnes; hjemvendt står de åbne
    const GATE_AT = [1600, 5600, 10400];
    ["hal-a", "hal-b", "hal-c"].forEach((key, i) => {
      const gt = gates[key];
      const full = returned ? 1 : (step === "f6" ? 0.16 + 0.84 * ease((el - GATE_AT[i]) / 900) : 0.16);
      gt.open = approach(gt.open, full, dt, step === "f6" ? 9 : 4);
      const o = gt.open, lit = step === "f6" ? ease((el - GATE_AT[i]) / 900) : 0;   // F6: det store lysøjeblik
      const glow = Math.max(0.25 * o, lit);
      gt.leaves.forEach(({ hinge, s }) => { hinge.rotation.y = s * -o * 1.75; });
      gt.archMat.emissiveIntensity = 0.12 + glow * 0.5;
      gt.seamMat.opacity = 0.35 + glow * 0.65;
      gt.inlayMat.opacity = 0.4 + glow * 0.5;
      gt.backMat.color.setScalar(0.33 + 0.25 * o + 0.42 * lit);
      gt.laneMat.opacity = 0.18 + 0.2 * o + 0.55 * lit;
      gt.laneGlowMat.opacity = lit * 0.55;
      gt.gpMat.opacity = 0.12 * o + lit * 0.6;
      const am = signMat(gt.areaSign); if (am) am.opacity = 0.75 + 0.25 * Math.max(lit, returned ? 1 : 0);
    });
  }

  function dispose() { disposables.forEach(d => d && d.dispose && d.dispose()); }
  return { onStep, tick, dispose };
}
