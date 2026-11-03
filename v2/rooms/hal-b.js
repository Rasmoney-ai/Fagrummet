/* Hal B · Tårnets fod — Programmering og modellering.
   En høj, cylindrisk hal. Midt i hallen står tårnets kerne: tre gennemsigtige etager (de tre konstruktive lag)
   og en søjle af små lysende datapakker, der stiger op gennem dem. Bagest står tre elevatorportaler, hvis
   skakte går op til netop deres lag. Ved udgangen til forhallen hænger målpladen. */
export default function build(ctx) {
  const { THREE: T, K, kit } = ctx;
  const B = ctx.room.color;                      // områdefarven (turkis)
  const root = ctx.root;
  const D2R = Math.PI / 180;

  /* ---------- små hjælpere ---------- */
  const std = (c, o = {}) => new T.MeshStandardMaterial({ color: c, roughness: 0.75, metalness: 0.1, flatShading: true, ...o });
  const basic = (c, o = {}) => new T.MeshBasicMaterial({ color: c, ...o });
  const merge = gs => T.BufferGeometryUtils.mergeGeometries(gs.map(g => g.index ? g.toNonIndexed() : g));
  function mesh(geo, mat, pos = [0, 0, 0], parent = root, rotY = 0) {
    const e = kit.mesh(parent, geo, mat, pos.join(" "), { rotation: `0 ${rotY / D2R} 0` });
    return e;
  }
  function group(pos = [0, 0, 0], parent = root, rotY = 0) {
    return kit.grp(parent, pos.join(" "), { rotation: `0 ${rotY / D2R} 0` });
  }
  const ease = x => x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x);
  const clamp01 = x => Math.max(0, Math.min(1, x));
  // vinkel fra et punkt mod et andet (til at dreje skilte mod beskueren)
  const face = (from, to) => Math.atan2(to[0] - from[0], to[1] - from[1]);

  ctx.env({ background: "#060a16", fog: "type: exponential; color: #060a16; density: 0.02" });

  /* ---------- mål og placering ---------- */
  const CZ = -1.5;                 // hallens og tårnets centrum (x = 0)
  const R = 7.6;                   // hallens radius
  const H = 10.5;                  // væggens højde
  const FLOORS = [3.6, 4.75, 5.9]; // etagernes højder (lag 1, 2, 3)
  const FR = 2.3;                  // etagernes radius
  const EYE = [0, 5.4];            // typisk beskuerplads (x, z) til at dreje skilte
  // lagenes navne hentes fra delrummenes intro-trin, så de følger manus
  const LAYERS = [
    { n: "Lag 1", name: ctx.step("b1-0").title, what: "Data måles og gemmes" },
    { n: "Lag 2", name: ctx.step("b2-0").title, what: "Data behandles af algoritmer" },
    { n: "Lag 3", name: ctx.step("b3-0").title, what: "Det besluttes, hvad der er data" },
  ];
  // placering på hallens væg ud fra en vinkel (0° = bagvæggen, + = mod højre set fra indgangen)
  const onWall = (deg, r = R - 0.45) => { const a = deg * D2R; return { x: Math.sin(a) * r, z: CZ - Math.cos(a) * r, ry: -a }; };

  /* ---------- selve hallen ---------- */
  // Gulv: mørkt med koncentriske ringe og radiale linjer, der peger ind mod tårnet
  const floorTex = K.canvasTexture(1024, 1024, (g, w, h) => {
    g.fillStyle = "#0a1220"; g.fillRect(0, 0, w, h);
    g.translate(w / 2, h / 2);
    for (let i = 1; i <= 9; i++) { g.strokeStyle = i % 3 === 0 ? "rgba(79,209,197,0.2)" : "rgba(120,150,200,0.07)"; g.lineWidth = i % 3 === 0 ? 3 : 2; g.beginPath(); g.arc(0, 0, i * 56, 0, 7); g.stroke(); }
    for (let a = 0; a < 48; a++) { const r0 = a % 4 === 0 ? 120 : 290; g.strokeStyle = a % 4 === 0 ? "rgba(79,209,197,0.12)" : "rgba(120,150,200,0.05)"; g.lineWidth = 2; g.beginPath(); g.moveTo(Math.cos(a / 48 * 6.283) * r0, Math.sin(a / 48 * 6.283) * r0); g.lineTo(Math.cos(a / 48 * 6.283) * 505, Math.sin(a / 48 * 6.283) * 505); g.stroke(); }
  });
  const floorGeo = new T.CircleGeometry(R, 48); floorGeo.rotateX(-Math.PI / 2);
  mesh(floorGeo, std("#ffffff", { map: floorTex, roughness: 0.9 }), [0, 0, CZ]);

  // Væg: indvendig cylinder med lodrette ribber og en lav sokkel (samlet til én geometri)
  mesh(new T.CylinderGeometry(R, R, H, 48, 1, true), std("#101930", { side: T.BackSide }), [0, H / 2, CZ]);
  const ribs = [];
  for (let i = 0; i < 36; i++) {
    const a = i / 36 * Math.PI * 2, g = new T.BoxGeometry(0.14, H, 0.2);
    g.translate(0, H / 2, -(R - 0.1)); g.rotateY(a); ribs.push(g);
  }
  const plinth = new T.CylinderGeometry(R - 0.05, R - 0.05, 0.35, 48, 1, true); plinth.scale(-1, 1, 1); plinth.translate(0, 0.175, 0); ribs.push(plinth);
  mesh(merge(ribs), std("#18233f"), [0, 0, CZ]);
  // Loft: en flad ring med et lysende øje (oculus) lige over datasøjlen
  const ceilGeo = new T.RingGeometry(1.0, R, 48, 1); ceilGeo.rotateX(Math.PI / 2);
  mesh(ceilGeo, std("#0c1426", { side: T.DoubleSide }), [0, H, CZ]);
  const ocGeo = new T.CircleGeometry(1.0, 32); ocGeo.rotateX(Math.PI / 2);
  mesh(ocGeo, basic("#b9fff7", { side: T.DoubleSide }), [0, H, CZ]);
  // et lille punktlys i bunden af søjlen giver hallen en blågrøn glød nedefra
  kit.el("a-entity", { light: `type: point; color: ${B}; intensity: 0.9; distance: 12; decay: 1.3`, position: `0 1.4 ${CZ}` });

  /* ---------- tårnets kerne: søjle, etager og datapakker ---------- */
  const tower = group([0, 0, CZ]);
  mesh(new T.CylinderGeometry(0.85, 1.0, 0.22, 24), std("#18233f"), [0, 0.11, 0], tower);
  const baseRing = new T.TorusGeometry(0.9, 0.03, 6, 40); baseRing.rotateX(Math.PI / 2);
  mesh(baseRing, basic(B), [0, 0.23, 0], tower);
  // glasrøret, som datapakkerne stiger op i
  mesh(new T.CylinderGeometry(0.34, 0.34, H - 0.25, 20, 1, true),
    std("#9ff3ea", { transparent: true, opacity: 0.1, depthWrite: false, side: T.DoubleSide, roughness: 0.1 }), [0, (H - 0.25) / 2 + 0.22, 0], tower);
  // fire tynde bærestænger holder etagerne
  const posts = [];
  for (let i = 0; i < 4; i++) { const a = (i + 0.5) * Math.PI / 2, g = new T.CylinderGeometry(0.035, 0.035, FLOORS[2] - 0.2, 6); g.translate(Math.cos(a) * (FR - 0.15), (FLOORS[2] - 0.2) / 2 + 0.2, Math.sin(a) * (FR - 0.15)); posts.push(g); }
  mesh(merge(posts), std("#22314f"), [0, 0, 0], tower);

  // etagerne: glasskive, lysende kant, kantbånd, et lysbånd på hallens væg og et navneskilt
  const F = FLOORS.map((y, k) => {
    const discMat = std(B, { transparent: true, opacity: 0.08, depthWrite: false, side: T.DoubleSide, roughness: 0.15 });
    const rimMat = std(B, { emissive: new T.Color(B), emissiveIntensity: 0.3 });
    const bandMat = basic(B, { transparent: true, opacity: 0.1, depthWrite: false, side: T.DoubleSide });
    const wallMat = basic(B, { transparent: true, opacity: 0.08, depthWrite: false });
    const disc = new T.RingGeometry(0.4, FR, 40, 1); disc.rotateX(-Math.PI / 2);
    mesh(disc, discMat, [0, y, 0], tower);
    const rims = [new T.TorusGeometry(FR, 0.035, 6, 48), new T.TorusGeometry(0.4, 0.025, 6, 20)];
    rims.forEach(r => r.rotateX(Math.PI / 2));
    mesh(merge(rims), rimMat, [0, y, 0], tower);
    mesh(new T.CylinderGeometry(FR, FR, 0.16, 48, 1, true), bandMat, [0, y - 0.08, 0], tower);
    const wall = new T.TorusGeometry(R - 0.22, 0.02, 3, 72); wall.rotateX(Math.PI / 2);
    mesh(wall, wallMat, [0, y, 0], tower);
    // lagets navn hænger under etagens forkant til venstre og drejer mod beskueren
    const lp = [-1.55, y - 0.34, FR * 0.72];
    const lblMat = basic("#ffffff", { map: K.labelTex(LAYERS[k].name, B, { w: 1024, h: 220, size: k === 1 ? 60 : 72, sub: LAYERS[k].n, ink: "#eef1ff" }), transparent: true, side: T.DoubleSide, depthWrite: false });
    mesh(new T.PlaneGeometry(1.75, 1.75 * 220 / 1024), lblMat, lp, tower, face([lp[0], lp[2] + CZ], EYE));
    // hvad der sker med data på netop dette lag (vises i b0-2), til højre for tårnet
    const cp = [1.55, y - 0.34, FR * 0.72];
    const capMat = basic("#ffffff", { map: K.labelTex(LAYERS[k].what, B, { w: 1024, h: 170, size: 64, ink: "#dffffb" }), transparent: true, side: T.DoubleSide, depthWrite: false, opacity: 0 });
    mesh(new T.PlaneGeometry(1.75, 1.75 * 170 / 1024), capMat, cp, tower, face([cp[0], cp[2] + CZ], EYE));
    return { y, discMat, rimMat, bandMat, wallMat, lblMat, capMat, g: 0 };
  });
  // små motiver på hver etage, så lagene har hver sin karakter: printplader, flowdiagram, klodsmodel
  (function motifs() {
    const parts = [];
    const put = (g, x, y, z, ry = 0) => { g.rotateY(ry); g.translate(x, y, z); parts.push(g); };
    for (const [x, z, r] of [[-1.3, -0.7, 0.3], [1.15, -1.0, -0.4], [1.2, 0.9, 0.5]]) {
      put(new T.BoxGeometry(0.62, 0.03, 0.42), x, FLOORS[0] + 0.03, z, r);
      put(new T.BoxGeometry(0.16, 0.06, 0.16), x, FLOORS[0] + 0.07, z, r);
    }
    const n2 = [[-1.4, -0.4], [-0.8, -1.4], [0.6, -1.55], [1.5, -0.4]];
    n2.forEach(([x, z], i) => {
      put(new T.BoxGeometry(0.28, 0.14, 0.18), x, FLOORS[1] + 0.08, z);
      if (i) { const [px, pz] = n2[i - 1]; const b = new T.BoxGeometry(0.03, 0.03, Math.hypot(x - px, z - pz)); b.rotateY(Math.atan2(x - px, z - pz)); b.translate((x + px) / 2, FLOORS[1] + 0.06, (z + pz) / 2); parts.push(b); }
    });
    for (let i = 0; i < 6; i++) put(new T.BoxGeometry(0.16, 0.16, 0.16), -1.1 + i * 0.32, FLOORS[2] + 0.09, -1.3 + i * 0.1);
    mesh(merge(parts), std("#2a8f88", { emissive: new T.Color(B), emissiveIntensity: 0.25 }), [0, 0, 0], tower);
  })();

  // datapakkerne: én instanced mesh (ét draw call)
  const NP = 70, PH = H - 0.6;
  const packMat = basic("#8ff5ea", { transparent: true, opacity: 1 });
  const packs = new T.InstancedMesh(new T.BoxGeometry(0.085, 0.085, 0.085), packMat, NP);
  packs.frustumCulled = false;
  group([0, 0, 0], tower).setObject3D("mesh", packs);
  const dummy = new T.Object3D();
  // den fremhævede pakke (b0-2): hvid kerne, glorie og et lysspor under sig
  const hiGrp = group([0, 0.4, 0], tower);
  mesh(new T.BoxGeometry(0.2, 0.2, 0.2), basic("#f4fffd"), [0, 0, 0], hiGrp);
  const halo = new T.Sprite(new T.SpriteMaterial({ map: K.glowTex("#7ffff0"), transparent: true, depthWrite: false, blending: T.AdditiveBlending }));
  halo.scale.set(1.3, 1.3, 1); hiGrp.object3D.add(halo);
  const trailGeo = new T.CylinderGeometry(0.025, 0.025, 1, 6, 1, true); trailGeo.translate(0, -0.5, 0);
  const trail = mesh(trailGeo, basic("#7ffff0", { transparent: true, opacity: 0.5, depthWrite: false }), [0, 0, 0], hiGrp);

  /* ---------- døre: elevatorportaler til lagene og døren tilbage ---------- */
  const lifts = [["b1", -46, 0], ["b2", -15, 1], ["b3", 16, 2]];
  const shaftMat = std(B, { emissive: new T.Color(B), emissiveIntensity: 0.6 });
  const shaftGlass = std("#7fe9df", { transparent: true, opacity: 0.1, depthWrite: false, side: T.DoubleSide });
  const bridgeMat = std("#7fe9df", { transparent: true, opacity: 0.14, depthWrite: false, side: T.DoubleSide });
  const shaftParts = [], glassParts = [], bridgeParts = [];
  for (const [id, deg, k] of lifts) {
    const w = onWall(deg);
    ctx.door(id, { position: `${w.x} 0 ${w.z}`, rotation: `0 ${w.ry / D2R} 0` });
    // elevatorskakt: lysende skinner fra over døren op til lagets højde, glasvæg og en repos
    const y = FLOORS[k], y0 = 3.45, local = [];
    for (const sx of [-0.95, 0.95]) { const g = new T.BoxGeometry(0.06, y + 0.5 - y0, 0.06); g.translate(sx, (y + 0.5 + y0) / 2, 0.05); local.push(g); }
    const top = new T.BoxGeometry(1.96, 0.06, 0.06); top.translate(0, y + 0.5, 0.05); local.push(top);
    const landing = new T.BoxGeometry(1.96, 0.06, 0.9); landing.translate(0, y, 0.45); local.push(landing);
    const xf = new T.Matrix4().makeRotationY(w.ry).setPosition(w.x, 0, w.z);
    local.forEach(g => { g.applyMatrix4(xf); shaftParts.push(g); });
    const gl = new T.PlaneGeometry(1.9, y + 0.5 - y0); gl.translate(0, (y + 0.5 + y0) / 2, 0.02); gl.applyMatrix4(xf); glassParts.push(gl);
    // gangbro i glas fra reposen ind til etagen
    const a = deg * D2R, r0 = R - 0.45 - 0.9, len = r0 - FR;
    const bg = new T.BoxGeometry(0.9, 0.04, len); bg.translate(0, y - 0.02, -(FR + len / 2)); bg.rotateY(-a); bg.translate(0, 0, CZ);
    bridgeParts.push(bg);
  }
  mesh(merge(shaftParts), shaftMat);
  mesh(merge(glassParts), shaftGlass);
  mesh(merge(bridgeParts), bridgeMat);
  const exitW = onWall(100);
  ctx.door(ctx.room.parent, { position: `${exitW.x} 0 ${exitW.z}`, rotation: `0 ${exitW.ry / D2R} 0` });

  /* ---------- rummets skilt ---------- */
  // lavt foran tårnets sokkel, så det ikke dækker dørene bagved
  ctx.sign(ctx.room.name, { position: `0 0.8 ${CZ + 1.3}`, rotation: "-14 0 0", width: 2.2, sub: ctx.room.sub });

  /* ---------- stationer: to lave pulte foran tårnet ---------- */
  function console_(x, z, iconDraw) {
    const ry = face([x, z], EYE);
    const g = group([x, 0, z], root, ry);
    const body = new T.BoxGeometry(0.9, 0.82, 0.5); body.translate(0, 0.41, 0);
    const top = new T.BoxGeometry(1.0, 0.05, 0.62); top.rotateX(0.35); top.translate(0, 0.86, 0.02);
    mesh(merge([body, top]), std("#16213b"), [0, 0, 0], g);
    kit.mesh(g, new T.PlaneGeometry(0.82, 0.48), basic("#ffffff", { map: K.canvasTexture(512, 300, iconDraw), transparent: true }), "0 0.905 0.035", { rotation: "-70 0 0" });
    const edge = new T.BoxGeometry(0.92, 0.03, 0.03); edge.translate(0, 0.8, 0.26);
    mesh(edge, basic(B), [0, 0, 0], g);
    return g;
  }
  const iconBg = (g, w, h) => { g.fillStyle = "#0b1626"; K.roundRect(g, 4, 4, w - 8, h - 8, 22); g.fill(); g.strokeStyle = B; g.lineWidth = 5; g.stroke(); };
  const st1 = console_(-1.7, 1.75, (g, w, h) => {      // tre etager, nedefra og op
    iconBg(g, w, h);
    for (let i = 0; i < 3; i++) { g.globalAlpha = 0.45 + i * 0.27; g.fillStyle = B; g.beginPath(); g.ellipse(w / 2, h - 70 - i * 72, 170, 26, 0, 0, 7); g.fill(); }
    g.globalAlpha = 1;
  });
  const st2 = console_(1.7, 1.75, (g, w, h) => {       // en lyspakke der følges opad
    iconBg(g, w, h);
    g.fillStyle = "rgba(79,209,197,0.35)"; for (let i = 0; i < 9; i++) g.fillRect(w / 2 - 12 + (i % 2 ? 34 : -34), 40 + i * 26, 22, 22);
    g.fillStyle = "#f4fffd"; g.fillRect(w / 2 - 26, 110, 52, 52);
    g.strokeStyle = "#f4fffd"; g.lineWidth = 6; g.beginPath(); g.moveTo(w / 2, 250); g.lineTo(w / 2, 175); g.stroke();
    g.beginPath(); g.moveTo(w / 2 - 22, 190); g.lineTo(w / 2, 168); g.lineTo(w / 2 + 22, 190); g.stroke();
  });
  ctx.sign(ctx.step("b0-1").title, { parent: st1, position: "0 1.32 0", width: 1.45 });
  ctx.sign(ctx.step("b0-2").title, { parent: st2, position: "0 1.32 0", width: 1.45 });
  ctx.station("b0-1", st1);
  ctx.station("b0-2", st2);

  /* ---------- målpladen (b0-3), hænger ved udgangen ---------- */
  const PL = [4.4, 1.65, -0.9];
  const plRy = face([PL[0], PL[2]], [2.4, 3.6]);
  const plate = group(PL, root, plRy);
  const plateSign = ctx.sign(ctx.step("b0-3").title, { parent: plate, position: "0 1.05 0", width: 1.9 });
  // ophæng fra loftet
  mesh(merge([-1.2, 1.2].map(x => { const g = new T.CylinderGeometry(0.012, 0.012, 7, 4); g.translate(x, 4.6, -0.02); return g; })), std("#3a4a6c"), [0, 0, 0], plate);
  function goalTex(n, title, note, w3) {
    return K.canvasTexture(768, 512, (g, w, h) => {
      g.fillStyle = "rgba(9,20,32,0.95)"; K.roundRect(g, 6, 6, w - 12, h - 12, 26); g.fill();
      g.strokeStyle = B; g.lineWidth = 6; g.stroke();
      g.textAlign = "left"; g.textBaseline = "alphabetic";
      g.fillStyle = B; g.font = '700 56px "Familjen Grotesk", sans-serif'; g.fillText(n, 50, 106);
      g.fillStyle = "#eef1ff"; g.font = '700 60px "Familjen Grotesk", sans-serif';
      K.wrap(g, title, w - 230).forEach((l, i) => g.fillText(l, 50, 205 + i * 68));
      g.fillStyle = "#a9b0d6"; g.font = '500 40px "Source Sans 3", sans-serif'; g.fillText(note, 50, h - 52);
      // tre små etager til højre: lysstyrken viser, hvilke lag målet ligger tættest på
      for (let i = 0; i < 3; i++) { g.globalAlpha = 0.14 + 0.86 * w3[i]; g.fillStyle = B; g.beginPath(); g.ellipse(w - 110, h - 100 - i * 62, 62, 14, 0, 0, 7); g.fill(); }
      g.globalAlpha = 1;
    });
  }
  const halves = [
    { tex: goalTex("Mål 1", "Programmering som sprog og værktøj", "Tættest på programmeringen", [0.45, 1, 0.12]), side: -1, floors: [[0, 0.5], [1, 1]] },
    { tex: goalTex("Mål 2", "Modellers perspektiver og bias", "Tættest på modelleringen", [0.12, 0.25, 1]), side: 1, floors: [[2, 1]] },
  ].map(hv => {
    const g = group([hv.side * 0.76, 0, 0], plate);
    const m = basic("#ffffff", { map: hv.tex, transparent: true, side: T.DoubleSide, depthWrite: false });
    mesh(new T.PlaneGeometry(1.5, 1.0), m, [0, 0, 0.026], g);
    mesh(new T.BoxGeometry(1.52, 1.02, 0.05), std("#0b1424"), [0, 0, 0], g);
    const frame = basic(B, { transparent: true, opacity: 0 });
    mesh(new T.BoxGeometry(1.6, 1.1, 0.02), frame, [0, 0, -0.03], g);
    return { ...hv, g, m, frame };
  });
  ctx.station("b0-3", plate);
  // lysstråler fra halvdelene ind til deres etager (én pr. forbindelse)
  const beamGeo = new T.CylinderGeometry(0.018, 0.018, 1, 6, 1, true); beamGeo.rotateX(Math.PI / 2); beamGeo.translate(0, 0, 0.5);
  const beams = [[0, 0], [0, 1], [1, 2]].map(([h, k]) => ({ h, k, mat: basic(B, { transparent: true, opacity: 0, depthWrite: false, blending: T.AdditiveBlending }) }));
  beams.forEach(b => { b.e = mesh(beamGeo, b.mat); b.e.object3D.visible = false; });
  // hvor halvdelene ender: ud for de etager, de hører til
  const halfY = [1.55, 2.2];

  /* ---------- views ---------- */
  ctx.view("b0-1", { position: [0, 0, 5.6], lookAt: [0, 0, CZ] });
  ctx.view("b0-2", { position: [0.9, 0, 5.6], lookAt: [0.5, 0, CZ] });
  ctx.view("b0-3", { position: [1.9, 0, 5.3], lookAt: [2.5, 0, -1.2] });

  /* ---------- tilstand og animation ---------- */
  let mode = null, t0 = 0, fresh = true;
  const vA = new T.Vector3(), vB = new T.Vector3();

  function setFloor(k, g) {
    const f = F[k]; f.g = g;
    f.rimMat.emissiveIntensity = 0.15 + 1.6 * g;
    f.discMat.opacity = 0.05 + 0.22 * g;
    f.bandMat.opacity = 0.04 + 0.45 * g;
    f.wallMat.opacity = 0.04 + 0.5 * g;
    f.lblMat.opacity = 0.35 + 0.65 * g;
  }

  return {
    onStep(id) { mode = id; fresh = true; },
    tick(t) {
      if (fresh) { t0 = t; fresh = false; }
      // testkrog: window.__roomS låser animationstiden (bruges kun af skærmbilledværktøjet)
      const s = typeof window.__roomS === "number" ? window.__roomS : (t - t0) / 1000;

      // datapakkerne stiger altid i en langsom spiral; i b0-2 dæmpes de, så den fremhævede pakke står frem
      packMat.opacity = mode === "b0-2" ? 0.25 : 0.95;
      for (let i = 0; i < NP; i++) {
        const y = 0.3 + ((i / NP) * PH + t * 0.0004) % PH;
        const a = i * 2.399 + y * 0.9;
        dummy.position.set(Math.cos(a) * 0.17, y, Math.sin(a) * 0.17);
        dummy.rotation.set(t * 0.001 + i, t * 0.0013 + i, 0);
        dummy.updateMatrix(); packs.setMatrixAt(i, dummy.matrix);
      }
      packs.instanceMatrix.needsUpdate = true;

      // etagerne
      hiGrp.object3D.visible = mode === "b0-2";
      F.forEach(f => f.capMat.opacity = 0);
      if (mode === "b0-1") {
        // nedefra og op, én efter én; efter en pause slukker de og det gentages roligt
        const c = s % 9;
        FLOORS.forEach((_, k) => { const on = ease((c - 0.4 - k * 0.9) / 0.6); const off = 1 - ease((c - 7.6) / 0.8); setFloor(k, 0.08 + 0.92 * on * off); });
      } else if (mode === "b0-2") {
        // én pakke følges hele vejen op; etagen blusser op, når den passerer, og lagets tekst bliver stående
        // pakken stiger og holder en lille pause ved hvert lag
        const c = s % 11;
        const keys = [[0, 0.5], [1.6, FLOORS[0]], [2.9, FLOORS[0]], [3.9, FLOORS[1]], [5.2, FLOORS[1]], [6.2, FLOORS[2]], [8.4, FLOORS[2]], [9.6, H - 0.3], [11, H - 0.3]];
        let yy = 0.5;
        for (let i = 1; i < keys.length; i++) if (c <= keys[i][0]) { const [ta, ya] = keys[i - 1], [tb, yb] = keys[i]; yy = ya + (yb - ya) * ease((c - ta) / (tb - ta)); break; }
        hiGrp.object3D.position.set(0, yy, 0);
        hiGrp.object3D.rotation.y = t * 0.002;
        trail.object3D.scale.set(1, Math.max(0.01, Math.min(1.8, yy - 0.3)), 1);
        halo.scale.setScalar(1.1 + 0.15 * Math.sin(t * 0.008));
        FLOORS.forEach((fy, k) => {
          const d = Math.abs(yy - fy); setFloor(k, Math.max(0.12 + 0.88 * clamp01(1 - d / 0.55), yy > fy ? 0.35 : 0.12));
          F[k].capMat.opacity = c > 9.6 ? clamp01((10.4 - c) / 0.8) : clamp01((yy - fy + 0.3) / 0.3);
        });
      } else if (mode === "b0-3") {
        FLOORS.forEach((_, k) => setFloor(k, 0.1));
      } else {
        FLOORS.forEach((_, k) => setFloor(k, 0.3));
      }

      // målpladen: deler sig, og halvdelene glider ud for de etager, de hører til, og lyser dem op
      const on = mode === "b0-3";
      const split = on ? ease((s - 0.3) / 0.6) : 0;
      const rise = on ? ease((s - 0.9) / 1.0) : 0;
      const lit = on ? ease((s - 1.7) / 0.5) : 0;
      plateSign.object3D.position.y = 1.05 + 0.65 * rise;
      halves.forEach((hv, i) => {
        hv.g.object3D.position.set(hv.side * (0.76 + 0.22 * split), (halfY[i] - PL[1]) * rise, 0);
        hv.g.object3D.rotation.y = -hv.side * 0.12 * split;
        hv.frame.opacity = 0.9 * lit;
        hv.floors.forEach(([k, w]) => setFloor(k, Math.max(F[k].g, 0.1 + 0.9 * w * lit)));
      });
      root.object3D.updateMatrixWorld(true);
      beams.forEach(b => {
        const e = b.e.object3D; e.visible = lit > 0.01; if (!e.visible) return;
        b.mat.opacity = 0.85 * lit * (b.h === 0 && b.k === 0 ? 0.5 : 1);
        halves[b.h].g.object3D.getWorldPosition(vA);
        vA.y += b.k === 0 ? -0.25 : b.k === 1 ? 0.25 : 0;
        // strålen starter ved halvdelens kant ind mod tårnet, så den ikke krydser teksten
        { const dx = -vA.x, dz = CZ - vA.z, l = Math.hypot(dx, dz); vA.x += dx / l * 0.8; vA.z += dz / l * 0.8 - 0.05; }
        // punkt på etagens kant, der vender mod pladen
        const ang = Math.atan2(vA.x, vA.z - CZ);
        vB.set(Math.sin(ang) * FR, FLOORS[b.k], CZ + Math.cos(ang) * FR);
        root.object3D.worldToLocal(vA); root.object3D.worldToLocal(vB);
        e.position.copy(vA); e.lookAt(vB.clone().applyMatrix4(root.object3D.matrixWorld)); e.scale.set(1, 1, vA.distanceTo(vB));
      });
    },
  };
}
