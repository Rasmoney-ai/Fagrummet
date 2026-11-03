/* B1 · Kabelrummet — Materielt grundlag.
   Et elektronikværksted med kabler i loftet. Kablerne samler sig i en bakke og fører ud gennem vinduet
   til et lille datacenter nede bag bygningen (systemisk samspil). I rummet står en stor gennemskåret
   mikrocontroller, en sensorvæg (bevægelse → tal → lys og lyd) og et målebord, hvor en måling bliver til
   tal, tallet til bits, og bitsene glider ind i en lagerenhed. Ingen rigtige produkter eller logoer. */
export default function build(ctx) {
  const { THREE: T, K, kit } = ctx;
  const B = ctx.room.color;
  const root = ctx.root;
  const D2R = Math.PI / 180;

  /* ---------- hjælpere ---------- */
  const std = (c, o = {}) => new T.MeshStandardMaterial({ color: c, roughness: 0.75, metalness: 0.1, flatShading: true, ...o });
  const basic = (c, o = {}) => new T.MeshBasicMaterial({ color: c, ...o });
  const merge = gs => T.BufferGeometryUtils.mergeGeometries(gs.map(g => g.index ? g.toNonIndexed() : g));
  const mesh = (geo, mat, pos = [0, 0, 0], parent = root, rot = [0, 0, 0]) =>
    kit.mesh(parent, geo, mat, pos.join(" "), { rotation: rot.join(" ") });
  const group = (pos = [0, 0, 0], parent = root, rot = [0, 0, 0]) => kit.grp(parent, pos.join(" "), { rotation: rot.join(" ") });
  const bx = (w, h, d, x = 0, y = 0, z = 0) => { const g = new T.BoxGeometry(w, h, d); g.translate(x, y, z); return g; };
  const ease = x => x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x);
  const clamp01 = x => Math.max(0, Math.min(1, x));
  const face = (from, to) => Math.atan2(to[0] - from[0], to[1] - from[1]) / D2R;
  // lille etiket: lærredet tilpasses teksten, så bogstaverne fylder etiketten (h = højde i meter)
  function label(text, pos, parent, h = 0.13) {
    const c = document.createElement("canvas").getContext("2d"); c.font = '700 64px "Familjen Grotesk", sans-serif';
    const pw = Math.ceil(c.measureText(text).width) + 56, ph = 96;
    const tex = K.canvasTexture(pw, ph, (g, w, hh) => {
      g.fillStyle = "rgba(9,16,30,0.9)"; K.roundRect(g, 3, 3, w - 6, hh - 6, 18); g.fill(); g.strokeStyle = B; g.lineWidth = 4; g.stroke();
      g.fillStyle = "#eef1ff"; g.font = '700 64px "Familjen Grotesk", sans-serif'; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(text, w / 2, hh / 2 + 3);
    });
    return mesh(new T.PlaneGeometry(h * pw / ph, h), basic("#ffffff", { map: tex, transparent: true, depthWrite: false }), pos, parent);
  }

  ctx.env({ background: "#060914", fog: "type: exponential; color: #060914; density: 0.018" });

  /* ---------- rummet ---------- */
  const W = 6.5, HC = 4.2;               // halv bredde/dybde, loftshøjde
  const WIN = { x0: -3.7, x1: 1.7, y0: 0.45, y1: 3.35 };   // vinduet i bagvæggen
  // gulv: mørk beton med fliser
  const floorTex = K.canvasTexture(512, 512, (g, w, h) => {
    g.fillStyle = "#151b2b"; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 1400; i++) { g.fillStyle = `rgba(${150 + Math.random() * 60},${160 + Math.random() * 60},200,${Math.random() * 0.05})`; g.fillRect(Math.random() * w, Math.random() * h, 2, 2); }
    g.strokeStyle = "rgba(0,0,0,0.5)"; g.lineWidth = 3; g.strokeRect(0, 0, w, h);
  });
  floorTex.wrapS = floorTex.wrapT = T.RepeatWrapping; floorTex.repeat.set(6.5, 6.5);
  const fl = new T.PlaneGeometry(2 * W, 2 * W); fl.rotateX(-Math.PI / 2);
  mesh(fl, std("#ffffff", { map: floorTex, roughness: 0.95 }));
  // vægge (bagvæggen har et hul til vinduet) og loft
  const wallMat = std("#1a2238");
  const walls = [
    bx(0.2, HC, 2 * W, -W, HC / 2, 0), bx(0.2, HC, 2 * W, W, HC / 2, 0), bx(2 * W, HC, 0.2, 0, HC / 2, W),
    bx(WIN.x0 + W, HC, 0.2, (-W + WIN.x0) / 2, HC / 2, -W), bx(W - WIN.x1, HC, 0.2, (WIN.x1 + W) / 2, HC / 2, -W),
    bx(WIN.x1 - WIN.x0, WIN.y0, 0.2, (WIN.x0 + WIN.x1) / 2, WIN.y0 / 2, -W), bx(WIN.x1 - WIN.x0, HC - WIN.y1, 0.2, (WIN.x0 + WIN.x1) / 2, (HC + WIN.y1) / 2, -W),
  ];
  // lodrette paneler og en sokkel giver væggene rytme
  for (let i = -5; i <= 5; i += 2.5) { walls.push(bx(0.08, HC, 0.1, -W + 0.12, HC / 2, i), bx(0.08, HC, 0.1, W - 0.12, HC / 2, i)); }
  walls.push(bx(2 * W, 0.25, 0.06, 0, 0.125, W - 0.12), bx(0.06, 0.25, 2 * W, -W + 0.12, 0.125, 0), bx(0.06, 0.25, 2 * W, W - 0.12, 0.125, 0));
  mesh(merge(walls), wallMat);
  const ce = new T.PlaneGeometry(2 * W, 2 * W); ce.rotateX(Math.PI / 2);
  mesh(ce, std("#10162a"), [0, HC, 0]);
  // loftsbjælker
  mesh(merge([-4, -1.5, 1, 3.5].map(z => bx(2 * W, 0.22, 0.18, 0, HC - 0.11, z))), std("#161e33"));
  // vinduesramme med sprosser
  const fr = [bx(WIN.x1 - WIN.x0 + 0.16, 0.08, 0.26, (WIN.x0 + WIN.x1) / 2, WIN.y0, -W), bx(WIN.x1 - WIN.x0 + 0.16, 0.08, 0.26, (WIN.x0 + WIN.x1) / 2, WIN.y1, -W),
    bx(0.08, WIN.y1 - WIN.y0, 0.26, WIN.x0, (WIN.y0 + WIN.y1) / 2, -W), bx(0.08, WIN.y1 - WIN.y0, 0.26, WIN.x1, (WIN.y0 + WIN.y1) / 2, -W)];
  for (const x of [-1.9, -0.1]) fr.push(bx(0.05, WIN.y1 - WIN.y0, 0.1, x, (WIN.y0 + WIN.y1) / 2, -W));
  fr.push(bx(WIN.x1 - WIN.x0, 0.05, 0.1, (WIN.x0 + WIN.x1) / 2, 2.75, -W));
  mesh(merge(fr), std("#2b3a5c", { metalness: 0.4 }));
  const glassG = new T.PlaneGeometry(WIN.x1 - WIN.x0, WIN.y1 - WIN.y0);
  mesh(glassG, basic("#8fd9ff", { transparent: true, opacity: 0.05, depthWrite: false }), [(WIN.x0 + WIN.x1) / 2, (WIN.y0 + WIN.y1) / 2, -W + 0.02]);

  /* ---------- udsigten: nat, terræn langt nede og et lille datacenter ---------- */
  const OUT_Y = -2.0;                     // terrænet udenfor ligger lavere (rummet ligger oppe i tårnet)
  const skyTex = K.canvasTexture(1024, 512, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, "#04060f"); gr.addColorStop(0.62, "#0b1a2e"); gr.addColorStop(0.8, "#14324a"); gr.addColorStop(1, "#0b1424");
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 160; i++) { g.fillStyle = `rgba(220,235,255,${0.2 + Math.random() * 0.6})`; g.fillRect(Math.random() * w, Math.random() * h * 0.55, 1.6, 1.6); }
    // fjern bysilhuet
    g.fillStyle = "#081120"; let x = 0; while (x < w) { const bw = 20 + Math.random() * 50, bh = 20 + Math.random() * 70; g.fillRect(x, h * 0.8 - bh, bw, bh + h * 0.2); for (let j = 0; j < 4; j++) { g.fillStyle = "rgba(255,210,140,0.35)"; g.fillRect(x + Math.random() * bw, h * 0.8 - Math.random() * bh, 2, 2); g.fillStyle = "#081120"; } x += bw + 4; }
  });
  mesh(new T.PlaneGeometry(40, 16), basic("#ffffff", { map: skyTex, fog: false }), [-1, OUT_Y + 6, -26]);
  const og = new T.PlaneGeometry(40, 20); og.rotateX(-Math.PI / 2);
  mesh(og, std("#0b1220"), [-1, OUT_Y, -16]);
  // datacentret: en lav hal med rækker af lysende rack-striber, køleenheder på taget og en mast
  const DC = [-0.6, OUT_Y - 0.5, -16.0];
  const dc = group(DC); dc.setAttribute("scale", "1.45 1.45 1.45");
  mesh(merge([bx(6, 2.2, 3.2, 0, 1.1, 0), bx(1.6, 1.4, 1.2, -3.9, 0.7, 0.6), bx(2.6, 1.6, 2.4, -2.0, 0.8, -3.0)]), std("#1c2642"), [0, 0, 0], dc);
  const rackTex = K.canvasTexture(512, 128, (g, w, h) => {
    g.fillStyle = "#0c1222"; g.fillRect(0, 0, w, h);
    for (let c = 0; c < 16; c++) for (let r = 0; r < 6; r++) { g.fillStyle = Math.random() < 0.6 ? "#4fd1c5" : (Math.random() < 0.5 ? "#2a6f6a" : "#c9d1ff"); g.fillRect(14 + c * 31, 16 + r * 18, 16, 5); }
  });
  rackTex.wrapS = T.RepeatWrapping;
  const rackMat = basic("#ffffff", { map: rackTex });
  mesh(new T.PlaneGeometry(5.4, 1.3), rackMat, [0, 1.15, 1.61], dc);
  const fanG = [];
  for (let i = 0; i < 4; i++) { const c = new T.CylinderGeometry(0.42, 0.42, 0.3, 12); c.translate(-2.1 + i * 1.4, 2.35, -0.3); fanG.push(c); }
  mesh(merge(fanG), std("#2a3557"), [0, 0, 0], dc);
  const fanBlades = [];
  for (let i = 0; i < 4; i++) { const f = group([-2.1 + i * 1.4, 2.52, -0.3], dc); mesh(merge([bx(0.7, 0.02, 0.1), bx(0.1, 0.02, 0.7)]), std("#7c8bb0"), [0, 0, 0], f); fanBlades.push(f); }
  // mast med blinkende lys
  mesh(merge([bx(0.12, 5.5, 0.12, 4.2, 2.75, -0.6), bx(0.9, 0.06, 0.06, 4.2, 4.8, -0.6), bx(0.6, 0.06, 0.06, 4.2, 4.2, -0.6)]), std("#2a3557"), [0, 0, 0], dc);
  const beaconMat = basic("#ff5a5a");
  mesh(new T.SphereGeometry(0.1, 8, 6), beaconMat, [4.2, 5.55, -0.6], dc);
  // et skilt på bygningen (ikke et logo)
  label("Datacenter", [0, 1.98, 1.63], dc, 0.3);

  /* ---------- kabler: fra stationerne op i loftsbakken og ud gennem vinduet ---------- */
  // bakken i loftet
  const TRAY_X = -0.4, TRAY_Y = 3.85;
  const tray = [bx(0.5, 0.04, 9.4, TRAY_X, TRAY_Y - 0.12, -1.6), bx(0.04, 0.14, 9.4, TRAY_X - 0.25, TRAY_Y - 0.06, -1.6), bx(0.04, 0.14, 9.4, TRAY_X + 0.25, TRAY_Y - 0.06, -1.6)];
  for (let z = 2.8; z > -6.3; z -= 1.2) tray.push(bx(0.04, 0.4, 0.04, TRAY_X - 0.25, TRAY_Y + 0.12, z), bx(0.04, 0.4, 0.04, TRAY_X + 0.25, TRAY_Y + 0.12, z));
  mesh(merge(tray), std("#3a4766", { metalness: 0.5 }));
  // lystekstur, der glider langs kablerne
  const flowTex = K.canvasTexture(256, 16, (g, w, h) => {
    g.fillStyle = "#1b3b44"; g.fillRect(0, 0, w, h);
    const gr = g.createLinearGradient(0, 0, w, 0); gr.addColorStop(0, "rgba(255,255,255,0)"); gr.addColorStop(0.72, "rgba(170,255,246,0.9)"); gr.addColorStop(0.8, "#ffffff"); gr.addColorStop(0.86, "rgba(79,209,197,0)");
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
  });
  flowTex.wrapS = flowTex.wrapT = T.RepeatWrapping;
  // fælles stykke fra bakkens ende ud gennem vinduets øverste hjørne og ned til datacentret
  const outPath = (dx) => [[TRAY_X + dx, TRAY_Y, -5.6], [TRAY_X + dx, 3.4, -6.3], [TRAY_X + dx + 0.1, 3.0, -7.0], [-0.6 + dx * 2, 1.6, -10.0], [-0.9 + dx * 3, 0.5, -13.5], [-0.6 + dx * 4, OUT_Y + 1.85, -13.7]];
  const cables = [];
  function cable(id, pts, color, r = 0.032) {
    const curve = new T.CatmullRomCurve3(pts.map(p => new T.Vector3(...p)), false, "centripetal");
    const len = curve.getLength();
    const tex = flowTex.clone(); tex.needsUpdate = true; tex.repeat.set(len / 1.3, 1);
    const m = basic(color, { map: tex });
    mesh(new T.TubeGeometry(curve, Math.max(40, Math.round(len * 7)), r, 5, false), m);
    cables.push({ id, m, tex, base: new T.Color(color) });
  }
  // fra mikrocontrolleren, sensorvæggen, målebordet og arbejdsbænken
  cable("b1-1", [[-3.75, 0.6, -0.35], [-3.8, 3.2, -0.4], [-2.8, TRAY_Y, -0.3], [TRAY_X - 0.12, TRAY_Y, 0.2], [TRAY_X - 0.12, TRAY_Y, -2], ...outPath(-0.12)], "#ffffff");
  cable("b1-2", [[6.3, 2.85, 1.25], [6.0, TRAY_Y, 1.25], [2, TRAY_Y, 0.3], [TRAY_X + 0.12, TRAY_Y, -0.9], [TRAY_X + 0.12, TRAY_Y, -2.5], ...outPath(0.12)], "#ffffff");
  cable("b1-3", [[4.15, 1.75, -5.0], [4.2, 3.5, -5.6], [2.5, TRAY_Y, -5.4], [TRAY_X + 0.04, TRAY_Y, -4.9], ...outPath(0.04)], "#ffffff");
  cable("bench", [[-3.6, 1.0, -6.2], [-3.6, 3.5, -6.25], [-2.4, TRAY_Y, -5.8], [TRAY_X - 0.04, TRAY_Y, -5.3], ...outPath(-0.04)], "#ffffff");
  // strømkabel (ravgult i mørket ville tilhøre et andet område, så det er hvidt-blåt) fra datacentret til masten
  
  /* ---------- arbejdsbænk under vinduet (ramme, ikke station) ---------- */
  {
    const p = [bx(3.4, 0.08, 0.9, -4.0 + 1.7 - 1.7, 0.92, -5.9)];
    p.push(bx(0.08, 0.9, 0.8, -5.6, 0.45, -5.9), bx(0.08, 0.9, 0.8, -2.4, 0.45, -5.9), bx(3.2, 0.05, 0.7, -4.0, 0.25, -5.9));
    mesh(merge(p), std("#2a2f45"));
    const d = [bx(0.5, 0.18, 0.32, -5.0, 1.05, -5.8), bx(0.06, 0.4, 0.06, -4.7, 1.16, -5.8), bx(0.6, 0.02, 0.4, -3.6, 0.97, -5.75), bx(0.4, 0.02, 0.3, -3.0, 0.97, -6.0)];
    const spool = new T.CylinderGeometry(0.12, 0.12, 0.1, 10); spool.rotateX(Math.PI / 2); spool.translate(-2.75, 1.08, -5.7); d.push(spool);
    mesh(merge(d), std("#3b4769"));
    mesh(merge([bx(0.58, 0.022, 0.38, -3.6, 0.99, -5.75), bx(0.38, 0.022, 0.28, -3.0, 0.99, -6.0)]), std("#13544d"));
  }

  /* ---------- lys ---------- */
  kit.el("a-entity", { light: `type: point; color: #bfe9ff; intensity: 0.75; distance: 12; decay: 1.2`, position: "0 3.4 0" });
  kit.el("a-entity", { light: `type: point; color: ${B}; intensity: 0.6; distance: 9; decay: 1.4`, position: "-1 2.5 -5" });

  /* ---------- skilte ---------- */
  ctx.sign(ctx.room.name, { position: `-5.05 2.75 ${-W + 0.13}`, width: 2.4, sub: ctx.room.sub });
  ctx.sign(ctx.step("b1-0").title, { position: `-2.45 3.73 ${-W + 0.13}`, width: 1.7 });
  ctx.door(ctx.room.parent, { position: `${W - 0.15} 0 3.7`, rotation: "0 -90 0" });
  // vinduet er b1-0's station (et usynligt klikfelt dækker hele ruden)
  const winHit = mesh(new T.PlaneGeometry(WIN.x1 - WIN.x0, WIN.y1 - WIN.y0), basic("#000", { transparent: true, opacity: 0, depthWrite: false }), [(WIN.x0 + WIN.x1) / 2, (WIN.y0 + WIN.y1) / 2, -W + 0.4]);
  ctx.station("b1-0", winHit);

  /* ================= B1.1 · den gennemskårne mikrocontroller ================= */
  const MC = group([-3.0, 0, 0.35], root, [0, face([-3.0, 0.35], [-0.6, 3.2]), 0]);
  // sokkel
  mesh(merge([bx(1.9, 0.85, 1.9, 0, 0.425, 0.3), bx(2.05, 0.06, 2.05, 0, 0.88, 0.3)]), std("#1c2440"), [0, 0, 0], MC);
  const board = group([0, 1.25, -0.1], MC, [28, 0, 0]);
  const pcbTex = K.canvasTexture(1024, 680, (g, w, h) => {
    g.fillStyle = "#0e3d3a"; g.fillRect(0, 0, w, h);
    g.strokeStyle = "rgba(120,240,225,0.35)"; g.lineWidth = 5;
    for (let i = 0; i < 26; i++) { const y = 60 + i * 22; g.beginPath(); g.moveTo(40, y); g.lineTo(240 + (i % 5) * 30, y); g.lineTo(300 + (i % 5) * 30, y + 40); g.lineTo(w - 60, y + 40); g.stroke(); }
    g.fillStyle = "rgba(230,190,90,0.9)"; for (let i = 0; i < 30; i++) { g.beginPath(); g.arc(70 + Math.random() * (w - 140), 60 + Math.random() * (h - 160), 6, 0, 7); g.fill(); }
    g.fillStyle = "#0b302e"; g.fillRect(0, h - 70, w, 70);
  });
  mesh(new T.BoxGeometry(1.8, 0.05, 1.2), [std("#0b2f2d"), std("#0b2f2d"), std("#ffffff", { map: pcbTex }), std("#0b2f2d"), std("#0b2f2d"), std("#0b2f2d")], [0, 0, 0], board);
  // processor: pakke med ben; låget løftes og viser en lysende chip (die)
  const cpuPins = [];
  for (let i = 0; i < 8; i++) for (const s of [-1, 1]) { cpuPins.push(bx(0.025, 0.02, 0.07, -0.33 + 0.18 * 0 + (-0.155 + i * 0.044), 0.035, -0.08 + s * 0.24)); cpuPins.push(bx(0.07, 0.02, 0.025, -0.33 + s * 0.24, 0.035, -0.08 - 0.155 + i * 0.044)); }
  mesh(merge(cpuPins), std("#c7cbd6", { metalness: 0.7, roughness: 0.3 }), [0, 0, 0], board);
  mesh(new T.BoxGeometry(0.42, 0.05, 0.42), std("#14171f"), [-0.33, 0.05, -0.08], board);
  const dieTex = K.canvasTexture(256, 256, (g, w, h) => {
    g.fillStyle = "#0d2a2a"; g.fillRect(0, 0, w, h);
    for (let x = 0; x < 8; x++) for (let y = 0; y < 8; y++) { g.fillStyle = (x + y) % 3 ? "rgba(79,209,197,0.85)" : "rgba(201,209,255,0.75)"; g.fillRect(14 + x * 29, 14 + y * 29, 22, 22); }
  });
  const dieMat = basic("#ffffff", { map: dieTex });
  const die = mesh(new T.BoxGeometry(0.24, 0.012, 0.24), dieMat, [-0.33, 0.081, -0.08], board);
  const cpuLid = mesh(new T.BoxGeometry(0.42, 0.04, 0.42), std("#1b1f2a"), [-0.33, 0.095, -0.08], board);
  // hukommelse: to chips, der løftes og viser celler
  const memTex = K.canvasTexture(256, 128, (g, w, h) => {
    g.fillStyle = "#121a2c"; g.fillRect(0, 0, w, h); g.font = '600 26px "JetBrains Mono", monospace'; g.textAlign = "center"; g.textBaseline = "middle";
    for (let x = 0; x < 8; x++) for (let y = 0; y < 3; y++) { const b = (x * 7 + y * 3) % 5 < 2 ? 1 : 0; g.fillStyle = b ? "#4fd1c5" : "rgba(79,209,197,0.28)"; g.fillText(String(b), 18 + x * 31, 24 + y * 40); }
  });
  const mems = [0, 1].map(i => {
    const z = -0.25 + i * 0.3;
    mesh(new T.BoxGeometry(0.4, 0.012, 0.2), basic("#ffffff", { map: memTex }), [0.42, 0.032, z], board);
    const lid = mesh(merge([bx(0.4, 0.05, 0.2), ...Array.from({ length: 6 }, (_, k) => bx(0.025, 0.02, 0.05, -0.15 + k * 0.06, -0.01, 0.12)), ...Array.from({ length: 6 }, (_, k) => bx(0.025, 0.02, 0.05, -0.15 + k * 0.06, -0.01, -0.12))]), std("#1a1e29"), [0.42, 0.05, z], board);
    return lid;
  });
  // en lille 5×5 lysmatrix og en knap — en generisk mikrocontroller, ikke et bestemt produkt
  const ledG = [];
  for (let x = 0; x < 5; x++) for (let y = 0; y < 5; y++) if ((x + y) % 2 === 0 || x === 2) ledG.push(bx(0.04, 0.02, 0.04, 0.1 + x * 0.07 - 0.0, 0.035, 0.18 + y * 0.065 - 0.13));
  const ledMat = std("#ffd9d0", { emissive: new T.Color("#ff8f6b"), emissiveIntensity: 0.4 });
  mesh(merge(ledG), ledMat, [-0.45, 0, 0.0], board);
  // ben: kantforbinder i forkanten med store huller og mange små fingre
  const padG = [];
  for (let i = 0; i < 26; i++) padG.push(bx(0.035, 0.012, 0.09, -0.78 + i * 0.0624, 0.031, 0.54));
  const bigPads = [-0.6, -0.15, 0.3, 0.72];
  bigPads.forEach(x => { const r = new T.TorusGeometry(0.055, 0.018, 4, 12); r.rotateX(Math.PI / 2); r.translate(x, 0.031, 0.47); padG.push(r); });
  const pinMat = std("#d9b45a", { metalness: 0.8, roughness: 0.3, emissive: new T.Color("#d9b45a"), emissiveIntensity: 0.05 });
  mesh(merge(padG), pinMat, [0, 0, 0], board);
  // husets låg: dækker printet og løftes/vippes bagover, når mikrocontrolleren åbner sig
  const lidPivot = group([0, 0.03, -0.62], board);
  const lid = mesh(merge([bx(1.86, 0.03, 1.26, 0, 0.11, 0.63), bx(1.86, 0.1, 0.03, 0, 0.06, 1.245), bx(0.03, 0.1, 1.26, -0.915, 0.06, 0.63), bx(0.03, 0.1, 1.26, 0.915, 0.06, 0.63)]),
    std("#2c3a5c", { transparent: true, opacity: 0.55, metalness: 0.3, depthWrite: false }), [0, 0, 0], lidPivot);
  // tre udgange: lampe, motor og lydgiver, forbundet til de store ben
  const outs = group([0, 0.91, 0.95], MC);
  
  const lampMat = std("#fff1c2", { emissive: new T.Color("#ffd27a"), emissiveIntensity: 0.1 });
  mesh(new T.SphereGeometry(0.1, 12, 8), lampMat, [-0.62, 0.17, 0], outs);
  mesh(merge([new T.CylinderGeometry(0.07, 0.08, 0.08, 10).translate(-0.62, 0.04, 0), new T.CylinderGeometry(0.11, 0.11, 0.14, 12).translate(0.05, 0.07, 0), new T.CylinderGeometry(0.04, 0.12, 0.12, 12).rotateX(Math.PI / 2).translate(0.66, 0.12, 0)]), std("#3a4566"), [0, 0, 0], outs);
  const prop = group([0.05, 0.16, 0], outs);
  mesh(merge([bx(0.3, 0.012, 0.05), bx(0.05, 0.012, 0.3)]), std("#8fa0c8"), [0, 0, 0], prop);
  const sndRings = [0, 1, 2].map(i => { const tr = new T.TorusGeometry(0.12, 0.008, 4, 20); return { m: basic(B, { transparent: true, opacity: 0, depthWrite: false }), e: null, tr }; });
  sndRings.forEach(r => { r.e = mesh(r.tr, r.m, [0.66, 0.12, 0.1], outs); });
  // ledninger fra benene til udgangene (lysende, når mikrocontrolleren er åben)
  const wireMat = basic("#2a5a57");
  const wires = [];
  [[bigPads[0], -0.62], [bigPads[1], 0.05], [bigPads[2], 0.66]].forEach(([px, ox]) => {
    // benets plads i MC-koordinater: boardets forkant vippet −28°
    // benets plads i MC-koordinater: printets forkant, vippet 28° mod beskueren
    const ca = Math.cos(28 * D2R), sa = Math.sin(28 * D2R), ly = 0.031, lz = 0.47;
    const p0 = [px, 1.25 + ly * ca - lz * sa, -0.1 + ly * sa + lz * ca];
    const curve = new T.CatmullRomCurve3([new T.Vector3(...p0), new T.Vector3(px, p0[1] - 0.05, p0[2] + 0.15), new T.Vector3(ox, 0.98, 0.85), new T.Vector3(ox, 0.95, 0.95)]);
    wires.push(new T.TubeGeometry(curve, 16, 0.012, 4));
  });
  mesh(merge(wires), wireMat, [0, 0, 0], MC);
  // etiketter, der dukker op, når den åbner sig
  const mcLabels = [
    { e: label("Processor", [-0.45, 1.9, -0.15], MC, 0.15) },
    { e: label("Hukommelse", [0.6, 1.85, -0.2], MC, 0.15) },
    { e: label("Ben", [1.12, 1.06, 0.42], MC, 0.15) },
  ];
  ctx.sign(ctx.step("b1-1").title, { parent: MC, position: "0 2.45 -0.35", width: 1.8 });
  ctx.station("b1-1", MC);

  /* ================= B1.2 · sensorvæggen ================= */
  // gruppens lokale x løber langs væggen (verdens +z), lokale +z peger ind i rummet (verdens −x)
  const SW = group([W - 0.12, 0, -0.6], root, [0, -90, 0]);
  const pegTex = K.canvasTexture(512, 340, (g, w, h) => {
    g.fillStyle = "#141c31"; g.fillRect(0, 0, w, h);
    g.fillStyle = "rgba(0,0,0,0.45)"; for (let x = 12; x < w; x += 22) for (let y = 12; y < h; y += 22) { g.beginPath(); g.arc(x, y, 3, 0, 7); g.fill(); }
  });
  mesh(new T.BoxGeometry(3.9, 2.5, 0.06), [std("#141c31"), std("#141c31"), std("#141c31"), std("#141c31"), std("#ffffff", { map: pegTex }), std("#141c31")], [0, 1.65, 0.03], SW);
  mesh(merge([bx(3.98, 0.04, 0.08, 0, 2.92, 0.06), bx(3.98, 0.04, 0.08, 0, 0.38, 0.06), bx(0.04, 2.58, 0.08, -1.97, 1.65, 0.06), bx(0.04, 2.58, 0.08, 1.97, 1.65, 0.06)]), basic(B), [0, 0, 0], SW);
  // input: et lille sensormodul med en kuppel (bevægelsessensor)
  mesh(merge([bx(0.5, 0.36, 0.04, -1.3, 1.55, 0.09)]), std("#0e3d3a"), [0, 0, 0], SW);
  const domeMat = std("#e8ecf6", { transparent: true, opacity: 0.85, roughness: 0.2, emissive: new T.Color(B), emissiveIntensity: 0.05 });
  const domeG = new T.SphereGeometry(0.12, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2); domeG.rotateX(Math.PI / 2);
  mesh(domeG, domeMat, [-1.3, 1.55, 0.11], SW);
  // sensorens synsfelt: en svag kegle ud i rummet
  const fovG = new T.ConeGeometry(0.42, 0.75, 16, 1, true); fovG.rotateX(-Math.PI / 2); fovG.translate(0, 0, 0.375);
  const fovMat = basic(B, { transparent: true, opacity: 0.03, depthWrite: false, side: T.DoubleSide });
  mesh(fovG, fovMat, [-1.3, 1.55, 0.12], SW);
  // en stiliseret hånd, der vifter foran sensoren
  const hand = group([-1.3, 1.35, 0.72], SW);
  const handG = [bx(0.2, 0.24, 0.06, 0, 0.12, 0)];
  [[-0.075, 0.14], [-0.025, 0.17], [0.025, 0.165], [0.075, 0.13]].forEach(([x, l]) => handG.push(bx(0.042, l, 0.05, x, 0.24 + l / 2, 0)));
  const th = bx(0.045, 0.13, 0.05, 0, 0.065, 0); th.rotateZ(0.8); th.translate(-0.13, 0.08, 0); handG.push(th);
  handG.push(bx(0.13, 0.22, 0.07, 0, -0.1, 0));
  mesh(merge(handG), std("#e3c2a8", { roughness: 0.9 }), [0, 0, 0], hand);
  // pile mellem delene
  const chev = [];
  for (const x of [-0.72, 0.62]) for (let k = 0; k < 3; k++) { const s = new T.ConeGeometry(0.06, 0.1, 3); s.rotateZ(-Math.PI / 2); s.translate(x + k * 0.1, 1.55, 0.1); chev.push(s); }
  const chevMat = basic(B, { transparent: true, opacity: 0.4 });
  mesh(merge(chev), chevMat, [0, 0, 0], SW);
  // tal: en smal skærm, hvor målingerne ruller forbi
  const numCanvas = document.createElement("canvas"); numCanvas.width = 256; numCanvas.height = 512;
  const numTex = new T.CanvasTexture(numCanvas); numTex.colorSpace = T.SRGBColorSpace;
  mesh(new T.BoxGeometry(0.66, 1.3, 0.05), std("#0b1222"), [0, 1.65, 0.08], SW);
  mesh(new T.PlaneGeometry(0.6, 1.2), basic("#ffffff", { map: numTex }), [0, 1.65, 0.106], SW);
  const LBLUE = new T.Color("#3d7bff"), LWHITE = new T.Color("#f2f4ff"), LRED = new T.Color("#ff3b2f"), lampCol = new T.Color();
  const nums = [];   // seneste værdier (øverst er nyest)
  function drawNums(active) {
    const g = numCanvas.getContext("2d"), w = 256, h = 512;
    g.fillStyle = "#07101e"; g.fillRect(0, 0, w, h);
    g.textAlign = "center"; g.textBaseline = "middle";
    nums.slice(0, 9).forEach((v, i) => {
      if (i === 0) { g.fillStyle = active ? "#eafffb" : "#5a7f86"; g.font = '700 84px "JetBrains Mono", monospace'; g.fillText(String(v), w / 2, 70); }
      else { g.fillStyle = `rgba(79,209,197,${(active ? 0.75 : 0.35) * (1 - i / 9)})`; g.font = '500 44px "JetBrains Mono", monospace'; g.fillText(String(v), w / 2, 120 + i * 44); }
    });
    g.fillStyle = "rgba(79,209,197,0.5)"; g.fillRect(24, 122, w - 48, 3);
    numTex.needsUpdate = true;
  }
  for (let i = 0; i < 9; i++) nums.push(12 + ((i * 7) % 9));
  drawNums(false);
  // output: en lampe (blå → rød) og en lydgiver med lydringe
  const outLampMat = std("#9fc4ff", { emissive: new T.Color("#3d7bff"), emissiveIntensity: 0.15 });
  mesh(new T.SphereGeometry(0.16, 14, 10), outLampMat, [1.3, 2.15, 0.2], SW);
  mesh(merge([new T.TorusGeometry(0.2, 0.025, 6, 20).translate(1.3, 2.15, 0.12), new T.CylinderGeometry(0.22, 0.26, 0.06, 16).rotateX(Math.PI / 2).translate(1.3, 1.05, 0.09)]), std("#2a3557"), [0, 0, 0], SW);
  const spkG = new T.CylinderGeometry(0.06, 0.19, 0.12, 16, 1, true); spkG.rotateX(Math.PI / 2);
  mesh(spkG, std("#3a4566", { side: T.DoubleSide }), [1.3, 1.05, 0.16], SW);
  const swRings = [0, 1, 2].map(() => { const m = basic(B, { transparent: true, opacity: 0, depthWrite: false }); return { m, e: mesh(new T.TorusGeometry(0.2, 0.01, 4, 24), m, [1.3, 1.05, 0.24], SW) }; });
  // små begrebsetiketter
  label("Input", [-1.3, 2.55, 0.1], SW, 0.17);
  label("Tal", [0, 2.55, 0.1], SW, 0.17);
  label("Output", [1.3, 2.55, 0.1], SW, 0.17);
  ctx.sign(ctx.step("b1-2").title, { parent: SW, position: "-0.3 3.4 0.12", width: 2.1 });
  ctx.station("b1-2", SW);

  /* ================= B1.3 · måling → tal → bits → lager ================= */
  const ST = group([2.6, 0, -4.7], root, [0, 0, 0]);
  mesh(merge([bx(3.4, 0.06, 0.9, 0, 0.86, 0), bx(0.07, 0.86, 0.07, -1.6, 0.43, 0.38), bx(0.07, 0.86, 0.07, 1.6, 0.43, 0.38), bx(0.07, 0.86, 0.07, -1.6, 0.43, -0.38), bx(0.07, 0.86, 0.07, 1.6, 0.43, -0.38)]), std("#252c45"), [0, 0, 0], ST);
  // måleren: en lille plade med en føler, der stikker op
  mesh(merge([bx(0.34, 0.03, 0.26, -1.35, 0.905, 0), bx(0.025, 0.42, 0.025, -1.35, 1.12, 0), bx(0.06, 0.05, 0.06, -1.35, 0.94, 0)]), std("#0e3d3a"), [0, 0, 0], ST);
  const probeMat = std("#e8fbff", { emissive: new T.Color(B), emissiveIntensity: 0.2 });
  mesh(new T.SphereGeometry(0.04, 10, 6), probeMat, [-1.35, 1.35, 0], ST);
  // en pulserende ring om føleren (målingen)
  const pulseMat = basic(B, { transparent: true, opacity: 0, depthWrite: false });
  const pulse = mesh(new T.TorusGeometry(0.08, 0.008, 4, 20), pulseMat, [-1.35, 1.35, 0], ST);
  // talpanel: viser målingen som tal
  const valCanvas = document.createElement("canvas"); valCanvas.width = 512; valCanvas.height = 256;
  const valTex = new T.CanvasTexture(valCanvas); valTex.colorSpace = T.SRGBColorSpace;
  const valMat = basic("#ffffff", { map: valTex, transparent: true });
  mesh(new T.BoxGeometry(0.86, 0.46, 0.04), std("#0b1222"), [-0.55, 1.42, -0.05], ST);
  mesh(new T.PlaneGeometry(0.8, 0.4), valMat, [-0.55, 1.42, -0.028], ST);
  function drawVal(v, bits, a) {
    const g = valCanvas.getContext("2d"), w = 512, h = 256;
    g.fillStyle = "#07101e"; g.fillRect(0, 0, w, h);
    g.textAlign = "center"; g.textBaseline = "middle";
    g.globalAlpha = a; g.fillStyle = "#eafffb"; g.font = '700 120px "JetBrains Mono", monospace'; g.fillText(v, w / 2, 100);
    g.fillStyle = "rgba(79,209,197,0.9)"; g.font = '500 46px "JetBrains Mono", monospace'; g.fillText(bits, w / 2, 205);
    g.globalAlpha = 1; valTex.needsUpdate = true;
  }
  // bit-brikker: to instanced meshes (nul og et), der glider fra talpanelet ind i lagerenheden
  const bitTex = d => K.canvasTexture(128, 128, (g, w, h) => { g.fillStyle = d ? "#4fd1c5" : "#163c44"; K.roundRect(g, 4, 4, w - 8, h - 8, 16); g.fill(); g.fillStyle = d ? "#06201f" : "#9ff3ea"; g.font = '700 92px "JetBrains Mono", monospace'; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(String(d), w / 2, h / 2 + 4); });
  const NB = 8;
  const bitMesh = [0, 1].map(d => { const m = new T.InstancedMesh(new T.BoxGeometry(0.13, 0.13, 0.02), basic("#ffffff", { map: bitTex(d) }), NB * 2); m.frustumCulled = false; group([0, 0, 0], ST).setObject3D("mesh", m); return m; });
  // skinnen, bitsene glider på
  mesh(merge([bx(1.6, 0.012, 0.05, 0.55, 1.3, -0.02)]), basic(B, { transparent: true, opacity: 0.35 }), [0, 0, 0], ST);
  // lagerenheden: et stort, generisk hukommelseskort med skrå hjørne og kontakter
  const cardShape = new T.Shape(); cardShape.moveTo(-0.3, -0.4); cardShape.lineTo(0.3, -0.4); cardShape.lineTo(0.3, 0.4); cardShape.lineTo(-0.15, 0.4); cardShape.lineTo(-0.3, 0.25); cardShape.lineTo(-0.3, -0.4);
  const cardG = new T.ExtrudeGeometry(cardShape, { depth: 0.12, bevelEnabled: false }); cardG.translate(0, 0, -0.06);
  const card = group([1.55, 1.32, -0.02], ST, [0, -18, 0]);
  mesh(cardG, std("#202a46", { metalness: 0.3 }), [0, 0, 0], card);
  mesh(merge(Array.from({ length: 7 }, (_, i) => bx(0.05, 0.12, 0.005, -0.18 + i * 0.06, 0.28, 0.063))), std("#d9b45a", { metalness: 0.8 }), [0, 0, 0], card);
  // "fil" i kortet: en bjælke, der vokser for hver gemt måling
  mesh(bx(0.44, 0.34, 0.004, 0, -0.12, 0.062), basic("#0b1222"), [0, 0, 0], card);
  const fillMat = basic(B);
  const fill = mesh(bx(0.4, 0.3, 0.004, 0, 0.15, 0), fillMat, [0, -0.27, 0.066], card);
  const cardLedMat = basic("#2a5a57");
  mesh(new T.SphereGeometry(0.025, 8, 6), cardLedMat, [0.2, 0.3, 0.07], card);
  // slids på kortets venstre kant, hvor bitsene forsvinder ind
  mesh(bx(0.02, 0.16, 0.13, -0.3, 0, 0), basic("#02040a"), [0, 0, 0], card);
  label("Måling", [-1.35, 1.62, 0], ST, 0.13);
  label("Tal", [-0.55, 1.78, 0], ST, 0.13);
  label("Bits", [0.55, 1.6, 0], ST, 0.13);
  label("Lager", [1.55, 1.88, 0], ST, 0.13);
  ctx.sign(ctx.step("b1-3").title, { parent: ST, position: "0 2.5 -0.1", width: 2.1 });
  ctx.station("b1-3", ST);

  /* ---------- views ---------- */
  ctx.view("b1-0", { position: [-1.0, 0, -2.6], lookAt: [-1.0, 0, -6.5] });
  ctx.view("b1-1", { position: [-1.35, 0, 2.55], lookAt: [-3.0, 0, 0.3] });
  ctx.view("b1-2", { position: [3.0, 0, -0.6], lookAt: [6.4, 0, -0.6] });
  ctx.view("b1-3", { position: [2.6, 0, -2.2], lookAt: [2.6, 0, -4.7] });

  /* ---------- tilstand og animation ---------- */
  let mode = null, t0 = 0, fresh = true, lastNum = 0, lastBlink = -1;
  const dummy = new T.Object3D();
  const toBits = n => n.toString(2).padStart(8, "0");
  const measures = [214, 216, 215, 218];

  return {
    onStep(id) { mode = id; fresh = true; },
    tick(t, dt) {
      if (fresh) { t0 = t; fresh = false; lastNum = 0; }
      const s = (t - t0) / 1000;
      const k = Math.min(dt || 16, 50) / 1000;

      /* kabler: i b1-0 flyder lyset i alle kabler; ellers kun i den aktive stations kabel */
      cables.forEach(c => {
        const on = mode === "b1-0" ? ease(s / 0.8) : (c.id === mode ? 1 : 0);
        c.tex.offset.x -= k * (0.25 + 0.7 * on);
        c.m.color.setRGB(0.22 + 0.78 * on, 0.25 + 0.75 * on, 0.3 + 0.7 * on);
      });
      // datacentret blinker roligt, mere når der er trafik
      const dcOn = mode === "b1-0" ? 1 : 0.35;
      rackMat.color.setScalar(0.45 + 0.55 * dcOn);
      rackTex.offset.x = Math.floor(t / 300) * 0.0625 * dcOn;
      beaconMat.color.setScalar((Math.sin(t * 0.004) > 0.6) ? 1 : 0.25);
      fanBlades.forEach((f, i) => f.object3D.rotation.y = t * 0.004 + i);

      /* mikrocontrolleren åbner sig i b1-1 */
      const open = mode === "b1-1" ? ease((s - 0.3) / 1.2) : 0;
      const expl = mode === "b1-1" ? ease((s - 1.2) / 1.0) : 0;
      lidPivot.object3D.rotation.x = -open * 1.85;
      lidPivot.object3D.position.y = 0.03 + open * 0.08;
      cpuLid.object3D.position.y = 0.095 + expl * 0.32;
      cpuLid.object3D.rotation.z = expl * 0.25;
      mems.forEach((m, i) => { m.object3D.position.y = 0.05 + expl * (0.24 + i * 0.06); });
      dieMat.color.setScalar(0.5 + 0.5 * expl);
      pinMat.emissiveIntensity = 0.05 + 0.9 * expl;
      wireMat.color.set(expl > 0.5 ? B : "#2a5a57");
      mcLabels.forEach((l, i) => { const a = mode === "b1-1" ? ease((s - 1.8 - i * 0.35) / 0.4) : 0; l.e.object3D.visible = a > 0.02; l.e.object3D.scale.setScalar(0.6 + 0.4 * a); });
      // udgangene svarer, når benene er tændt
      const run = mode === "b1-1" && s > 2.2;
      prop.object3D.rotation.y += run ? k * 14 : 0;
      lampMat.emissiveIntensity = run ? 0.6 + 0.5 * (Math.sin(t * 0.006) > 0 ? 1 : 0) : 0.1;
      ledMat.emissiveIntensity = run ? 0.4 + 0.6 * ((Math.floor(t / 400) % 2)) : 0.3;
      sndRings.forEach((r, i) => { const p = ((t / 900) + i / 3) % 1; r.e.object3D.position.z = 0.1 + p * 0.3; r.e.object3D.scale.setScalar(0.6 + p * 1.2); r.m.opacity = run ? 0.7 * (1 - p) : 0; });

      /* sensorvæggen i b1-2: hånden vifter, tallene ruller, lampe og lyd svarer */
      const sw = mode === "b1-2";
      const wave = sw ? Math.sin(s * 5.2) : 0;
      hand.object3D.rotation.z = wave * 0.45;
      hand.object3D.position.x = -1.3 + wave * 0.18;
      hand.object3D.position.z = sw ? 0.62 : 0.85;
      const motion = sw ? Math.abs(Math.cos(s * 5.2)) : 0;     // hvor hurtigt hånden bevæger sig
      fovMat.opacity = sw ? 0.03 + 0.07 * motion : 0.02;
      domeMat.emissiveIntensity = sw ? 0.2 + 0.8 * motion : 0.05;
      chevMat.opacity = sw ? 0.3 + 0.6 * ((Math.floor(t / 180) % 3) / 2) : 0.18;
      if (sw && t - lastNum > 130) {
        lastNum = t;
        nums.unshift(Math.round(motion * 900 + 40 + Math.random() * 40));
        nums.length = 12; drawNums(true);
      } else if (!sw && lastNum !== -1 && mode) { lastNum = -1; drawNums(false); }
      const v = sw ? clamp01((nums[0] - 40) / 900) : 0;
      // lampen går fra blå (rolig) til rød (meget bevægelse) via hvid, så den aldrig bliver lilla
      lampCol.copy(v < 0.5 ? LBLUE : LWHITE).lerp(v < 0.5 ? LWHITE : LRED, v < 0.5 ? v * 2 : v * 2 - 1);
      outLampMat.emissive.copy(lampCol); outLampMat.color.copy(lampCol);
      outLampMat.emissiveIntensity = sw ? 0.5 + 0.7 * v : 0.12;
      swRings.forEach((r, i) => { const p = ((t / (900 - 400 * v)) + i / 3) % 1; r.e.object3D.position.z = 0.22 + p * 0.45; r.e.object3D.scale.setScalar(0.7 + p * 1.4); r.m.opacity = sw ? (0.25 + 0.6 * v) * (1 - p) : 0; });

      /* målebordet i b1-3: måling → tal → bits → lager, i en løkke på 7 sekunder */
      const ms = mode === "b1-3";
      const cyc = ms ? Math.floor(s / 7) : 0, c = ms ? s % 7 : 0;
      const val = measures[cyc % measures.length], bits = toBits(val);
      pulse.object3D.scale.setScalar(1 + 2.5 * ((c % 1.2) / 1.2));
      pulseMat.opacity = ms && c < 2.4 ? 0.8 * (1 - (c % 1.2) / 1.2) : 0;
      probeMat.emissiveIntensity = ms && c < 2.4 ? 0.9 : 0.2;
      const numA = ms ? 0.3 + 0.7 * ease((c - 0.8) / 0.4) : 1;
      const bitShown = ms ? Math.max(0, Math.min(8, Math.floor((c - 1.6) / 0.15))) : 0;
      const valKey = ms ? `${cyc}:${bitShown}:${numA.toFixed(2)}` : "idle";
      if (valKey !== drawVal.key) { drawVal.key = valKey; drawVal(ms ? (val / 10).toFixed(1).replace(".", ",") + "°" : "21,4°", ms ? bits.slice(0, bitShown).padEnd(8, "·") : "········", ms ? numA : 0.35); }
      // bitsene forlader talpanelet én ad gangen og glider ind i kortets slids
      const counts = [0, 0];
      // hele strimlen skubbes ud af talpanelet, holder en pause og glider så ind i kortets slids
      const RX = c < 3.4 ? -0.05 + 1.2 * ease((c - 2.6) / 0.8) : c < 4.2 ? 1.15 : 1.15 + 1.3 * ease((c - 4.2) / 1.8);
      for (let i = 0; i < NB; i++) {
        const d = +bits[i];
        const x = RX - (NB - 1 - i) * 0.145;
        const vis = ms && c > 2.6 && x > -0.04 && x < 1.22;
        dummy.position.set(x, 1.3 + 0.07, -0.02);
        dummy.scale.setScalar(vis ? 1 : 0.0001);
        dummy.updateMatrix(); bitMesh[d].setMatrixAt(counts[d]++, dummy.matrix);
      }
      dummy.scale.setScalar(0.0001); dummy.updateMatrix();
      bitMesh.forEach((m, d) => { for (let i = counts[d]; i < NB * 2; i++) m.setMatrixAt(i, dummy.matrix); m.instanceMatrix.needsUpdate = true; });
      // kortet: lampen blinker, mens der skrives, og "filen" vokser for hver måling
      const writing = ms && c > 3.0 && c < 5.8;
      cardLedMat.color.set(writing && (Math.floor(t / 120) % 2) ? "#9ff3ea" : "#2a5a57");
      const filled = ms ? Math.min(1, 0.15 + 0.2 * cyc + 0.2 * clamp01((c - 3) / 2.8)) : 0.35;
      fill.object3D.scale.set(1, Math.max(0.01, filled), 1);
      fillMat.color.set(ms ? B : "#2a6f6a");
    },
  };
}
