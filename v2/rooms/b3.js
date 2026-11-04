/* B3 · Tegnestuen — Modellering.
   Et lyst tegnestue-rum øverst i tårnet. Et stort skråt vindue i gulvhøjde viser ned i skolens kantine,
   hvor elever står i kø (én springer over). På bordet foran vinduet står en forenklet model af køen,
   bygget af ens klodser. Diagramvæggen tegner et rutediagram og et tilstandsdiagram trin for trin.
   Ved datagørelsesbordet forenkles et nuanceret billede af to venner til et flueben. Ved makkervæggen
   parrer to modeller de samme elevfigurer forskelligt. Ingen landkort, kortapps eller ruter på kort. */
export default function build(ctx) {
  const { THREE: T, K, kit } = ctx;
  const B = ctx.room.color;
  const root = ctx.root;
  const D2R = Math.PI / 180;
  const INK = "#1d2b45", PAPER = "#f6f3ea", WARN = "#e86a4f";

  /* ---------- hjælpere ---------- */
  const std = (c, o = {}) => new T.MeshStandardMaterial({ color: c, roughness: 0.8, metalness: 0.05, flatShading: true, ...o });
  const basic = (c, o = {}) => new T.MeshBasicMaterial({ color: c, ...o });
  const merge = gs => T.BufferGeometryUtils.mergeGeometries(gs.map(g => g.index ? g.toNonIndexed() : g));
  const mesh = (geo, mat, pos = [0, 0, 0], parent = root, rot = [0, 0, 0]) => kit.mesh(parent, geo, mat, pos.join(" "), { rotation: rot.join(" ") });
  const group = (pos = [0, 0, 0], parent = root, rot = [0, 0, 0]) => kit.grp(parent, pos.join(" "), { rotation: rot.join(" ") });
  const bx = (w, h, d, x = 0, y = 0, z = 0) => { const g = new T.BoxGeometry(w, h, d); g.translate(x, y, z); return g; };
  const ease = x => x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x);
  const clamp01 = x => Math.max(0, Math.min(1, x));
  const texMat = tex => basic("#ffffff", { map: tex, transparent: true, depthWrite: false, side: T.DoubleSide });
  function liveCanvas(w, h) {
    const c = document.createElement("canvas"); c.width = w; c.height = h;
    const tex = new T.CanvasTexture(c); tex.colorSpace = T.SRGBColorSpace; tex.anisotropy = 4;
    return { g: c.getContext("2d"), tex, w, h, key: null };
  }
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
  // elevfigur (krop + hoved) som geometri; s = skala
  function personGeo(s = 1) {
    const body = new T.CylinderGeometry(0.11 * s, 0.16 * s, 0.62 * s, 8); body.translate(0, 0.31 * s, 0);
    const head = new T.SphereGeometry(0.12 * s, 10, 7); head.translate(0, 0.76 * s, 0);
    return merge([body, head]);
  }
  const PERSON = personGeo(1);

  /* ---------- lyset rum ---------- */
  ctx.env({ background: "#8fb3d1", fog: "type: exponential; color: #b9cde0; density: 0.012" });
  const X0 = -7, X1 = 7, Z0 = -6.5, Z1 = 6.5, HC = 4.4;
  const WX = 3.4, WY0 = 0.0, WY1 = 3.7;      // vinduet i bagvæggen: x −3,4 … 3,4, y 0,25 … 3,7
  const floorTex = K.canvasTexture(512, 512, (g, w, h) => {
    g.fillStyle = "#b9b2a2"; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? "#b3ac9b" : "#bfb8a8"; g.fillRect(0, i * 64, w, 64); g.fillStyle = "rgba(60,50,40,0.18)"; g.fillRect(0, i * 64, w, 2); for (let k = 0; k < 3; k++) g.fillRect(((i * 173 + k * 211) % w), i * 64, 2, 64); }
  });
  floorTex.wrapS = floorTex.wrapT = T.RepeatWrapping; floorTex.repeat.set(4, 4);
  const fl = new T.PlaneGeometry(X1 - X0, Z1 - Z0); fl.rotateX(-Math.PI / 2);
  mesh(fl, std("#ffffff", { map: floorTex }));
  // vægge i lys kalk; bagvæggen har det store vindue
  const walls = [bx(0.2, HC, Z1 - Z0, X0, HC / 2, 0), bx(0.2, HC, Z1 - Z0, X1, HC / 2, 0), bx(X1 - X0, HC, 0.2, 0, HC / 2, Z1)];
  walls.push(bx(X1 - WX, HC, 0.2, (X0 - WX) / 2, HC / 2, Z0), bx(X1 - WX, HC, 0.2, (X1 + WX) / 2, HC / 2, Z0), bx(2 * WX, HC - WY1, 0.2, 0, (HC + WY1) / 2, Z0));
  mesh(merge(walls), std("#e7e2d6"));
  const trim = [bx(X1 - X0, 0.14, 0.04, 0, 0.07, Z1 - 0.11), bx(0.04, 0.14, Z1 - Z0, X0 + 0.11, 0.07, 0), bx(0.04, 0.14, Z1 - Z0, X1 - 0.11, 0.07, 0)];
  mesh(merge(trim), std("#9a9282"));
  const ce = new T.PlaneGeometry(X1 - X0, Z1 - Z0); ce.rotateX(Math.PI / 2);
  mesh(ce, std("#f0ece2"), [0, HC, 0]);
  // ovenlysvinduer i loftet (lysende felter)
  mesh(merge([-3.5, 0, 3.5].map(x => { const p = new T.PlaneGeometry(1.6, 2.4); p.rotateX(Math.PI / 2); p.translate(x, HC - 0.01, 1.5); return p; })), basic("#fdfbf3"));
  // vinduesramme med sprosser og en bred vindueskarm
  const fr = [bx(2 * WX + 0.2, 0.12, 0.24, 0, WY1, Z0 + 0.02), bx(0.12, WY1 - WY0, 0.24, -WX, (WY0 + WY1) / 2, Z0 + 0.02), bx(0.12, WY1 - WY0, 0.24, WX, (WY0 + WY1) / 2, Z0 + 0.02)];
  for (const x of [-WX / 3, WX / 3]) fr.push(bx(0.06, WY1 - WY0, 0.12, x * 1, (WY0 + WY1) / 2, Z0 + 0.02));
  fr.push(bx(2 * WX, 0.1, 0.3, 0, 0.05, Z0 + 0.05));   // bundprofil foran den gulvdybe rude (intet gelænder, så køen ikke skæres over)
  mesh(merge(fr), std("#3d4a63", { metalness: 0.4 }));
  mesh(new T.PlaneGeometry(2 * WX, WY1 - WY0), basic("#dff0ff", { transparent: true, opacity: 0.08, depthWrite: false }), [0, (WY0 + WY1) / 2, Z0 + 0.03]);

  /* ---------- kantinen nedenunder, set gennem vinduet ---------- */
  const CY = -0.45;   // kantinegulvets højde (tegnestuen ligger højere)
  const kTex = K.canvasTexture(256, 256, (g, w, h) => { g.fillStyle = "#cfc6b2"; g.fillRect(0, 0, w, h); g.fillStyle = "#c2b9a4"; for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) if ((i + j) % 2) g.fillRect(i * 32, j * 32, 32, 32); });
  kTex.wrapS = kTex.wrapT = T.RepeatWrapping; kTex.repeat.set(8, 5);
  const kfl = new T.PlaneGeometry(24, 15); kfl.rotateX(-Math.PI / 2);
  mesh(kfl, std("#ffffff", { map: kTex }), [0, CY, -13.5]);
  // kantinens bagvæg med høje vinduer, sidevægge og tårnets ydervæg under tegnestuen
  const kwTex = K.canvasTexture(1024, 256, (g, w, h) => {
    g.fillStyle = "#e3d8c0"; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 8; i++) { g.fillStyle = "#a8c6e0"; g.fillRect(40 + i * 124, 40, 80, 150); g.fillStyle = "#e3d8c0"; g.fillRect(78 + i * 124, 40, 4, 150); }
  });
  mesh(new T.PlaneGeometry(24, 5.5), std("#ffffff", { map: kwTex }), [0, CY + 2.75, -18.5]);
  mesh(merge([bx(0.2, 5.5, 12, -12, CY + 2.75, -12.5), bx(0.2, 5.5, 12, 12, CY + 2.75, -12.5), bx(24, -CY, 0.2, 0, CY / 2, -6.6)]), std("#d9cfb8"));
  // disk med mad, madtavle, nogle borde
  const DX = -0.6;
  mesh(merge([bx(1.0, 0.95, 3.4, DX - 0.6, CY + 0.475, -9.8), bx(1.1, 0.06, 3.5, DX - 0.6, CY + 0.98, -9.8)]), std("#6f82a6"));
  mesh(merge([0, 1, 2].map(i => bx(0.6, 0.1, 0.6, DX - 0.6, CY + 1.06, -10.9 + i * 1.1))), std("#e7c26b"));
  const menuTex = K.canvasTexture(512, 160, (g, w, h) => { g.fillStyle = "#26334d"; g.fillRect(0, 0, w, h); g.fillStyle = "#f6f3ea"; g.font = '700 70px "Familjen Grotesk", sans-serif'; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("Kantine", w / 2, h / 2 + 4); });
  mesh(new T.PlaneGeometry(2.0, 0.62), basic("#ffffff", { map: menuTex }), [DX - 0.6, CY + 3.0, -18.4]);
  const tables = [];
  for (const [x, z] of [[-6.5, -10], [-3.8, -14], [-6.5, -15.5], [3.5, -14.5], [6.5, -14.5]]) tables.push(bx(2.0, 0.06, 0.9, x, CY + 0.75, z), bx(0.08, 0.75, 0.08, x - 0.8, CY + 0.375, z), bx(0.08, 0.75, 0.08, x + 0.8, CY + 0.375, z), bx(1.8, 0.04, 0.3, x, CY + 0.45, z - 0.65), bx(1.8, 0.04, 0.3, x, CY + 0.45, z + 0.65));
  mesh(merge(tables), std("#a07a52"));
  kit.el("a-entity", { light: `type: point; color: #fff2d8; intensity: 0.8; distance: 14; decay: 1.0`, position: `1 ${CY + 4.0} -11` });

  // køen: 9 elever står på række mod disken (langs x); én bagerst springer frem og stiller sig næsten forrest
  const QN = 9, QZ = -9.0, QX = i => DX + 0.55 + i * 0.47;
  const qColors = ["#5b7fd6", "#d68b5b", "#5bb38a", "#b05bd6", "#d6c25b", "#3fa7a0", "#d65b7f", "#c97a6b", "#9aa6ba"];
  const QS = 1.45;   // elevernes skala (personGeo er ca. 0,9 m)
  const queue = qColors.map((c, i) => {
    const m = std(c, { emissive: new T.Color(WARN), emissiveIntensity: 0 });
    const jit = ((i * 37) % 5 - 2) * 0.07;
    const e = mesh(PERSON, m, [QX(i), CY, QZ + jit], root, [0, -90, 0]);
    e.object3D.scale.setScalar(QS * (0.92 + ((i * 53) % 7) * 0.025));
    return { e, m, base: [QX(i), QZ + jit] };
  });
  const JUMP = QN - 1;   // den bagerste springer over
  const jumpRingMat = basic(WARN, { transparent: true, opacity: 0 });
  const jumpRing = mesh(new T.TorusGeometry(0.42, 0.06, 6, 24), jumpRingMat, [0, CY + 0.05, 0], root, [-90, 0, 0]);
  // en glorie om den, der springer over
  const jumpHalo = new T.Sprite(new T.SpriteMaterial({ map: K.glowTex(WARN), transparent: true, depthWrite: false, opacity: 0 }));
  jumpHalo.scale.set(2.2, 3.0, 1); jumpRing.object3D.parent.add(jumpHalo);

  /* ---------- modelbordet: køen som ens klodser ---------- */
  const MT = group([-1.95, 0, -3.9]); MT.setAttribute("scale", "0.82 0.82 0.82");
  mesh(merge([bx(3.4, 0.06, 1.0, 0, 0.86, 0), bx(0.07, 0.86, 0.07, -1.6, 0.43, 0.42), bx(0.07, 0.86, 0.07, 1.6, 0.43, 0.42), bx(0.07, 0.86, 0.07, -1.6, 0.43, -0.42), bx(0.07, 0.86, 0.07, 1.6, 0.43, -0.42)]), std("#8a6a4a"), [0, 0, 0], MT);
  MT.setAttribute("rotation", "0 0 0");
  mesh(bx(3.1, 0.01, 0.7, 0, 0.895, 0), std(PAPER), [0, 0, 0], MT);
  // disken som en lang klods og 9 ens klodser i en ret linje, samme retning som køen
  mesh(bx(0.22, 0.2, 0.5, -1.42, 0.99, 0), std("#6f82a6"), [0, 0, 0], MT);
  const blkMat = std("#f2f4f8");
  const blockParts = []; for (let i = 0; i < QN; i++) blockParts.push(bx(0.2, 0.2, 0.2, -1.15 + i * 0.3, 1.0, 0));
  mesh(merge(blockParts), blkMat, [0, 0, 0], MT);
  // pile mellem klodserne: alle står og venter på den foran
  const arrows = []; for (let i = 0; i < QN - 1; i++) { const a = new T.ConeGeometry(0.035, 0.08, 3); a.rotateZ(Math.PI / 2); a.translate(-1.0 + i * 0.3, 1.0, 0); arrows.push(a); }
  mesh(merge(arrows), basic("#7f8aa3"), [0, 0, 0], MT);
  // en rød, stiplet "plads", der mangler i modellen: der er ingen måde at springe over på
  const gapMat = basic(WARN, { transparent: true, opacity: 0 });
  const gapParts = []; for (let k = 0; k < 4; k++) { gapParts.push(bx(0.06, 0.012, 0.012, -0.95 + k * 0.08, 1.11, 0.12)); }
  const gapG = merge([bx(0.22, 0.012, 0.012, 0, 0.11, 0.11), bx(0.22, 0.012, 0.012, 0, -0.11, 0.11), bx(0.012, 0.22, 0.012, -0.11, 0, 0.11), bx(0.012, 0.22, 0.012, 0.11, 0, 0.11)]);
  const gap = mesh(gapG, gapMat, [1.25, 1.0, 0.32], MT);
  // (den tomme stiplede plads står uden for klodsrækken: modellen har ingen plads til den, der springer over)
  label("Model af køen", [-0.6, 1.32, 0.0], MT, 0.14);
  // ét samlet skilt for det, modellen mangler; det står over den, der springer over
  const miss = label("Ikke med i modellen: at springe over", [0.3, 1.62, 0.34], MT, 0.13, { edge: WARN });
  const missQ = label("Springer over", [0, CY + 2.4, 0], root, 0.5, { edge: WARN });
  ctx.sign(ctx.step("b3-0").title, { parent: MT, position: "-0.3 2.75 -0.3", width: 2.0 });
  ctx.station("b3-0", MT);

  /* ---------- diagramvæggen (venstre væg): rutediagram og tilstandsdiagram ---------- */
  const DW = group([X0 + 0.12, 0, -0.2], root, [0, 90, 0]);
  mesh(bx(5.2, 2.5, 0.04, 0, 1.75, 0), std("#fbfaf6"), [0, 0, 0], DW);
  mesh(merge([bx(5.3, 0.06, 0.08, 0, 3.02, 0.02), bx(5.3, 0.06, 0.08, 0, 0.48, 0.02), bx(0.06, 2.6, 0.08, -2.62, 1.75, 0.02), bx(0.06, 2.6, 0.08, 2.62, 1.75, 0.02)]), std("#b8b0a0"), [0, 0, 0], DW);
  const dc = liveCanvas(2048, 960);
  // rutediagram (venstre halvdel): Start → Står i kø → Er det min tur? → (ja) Tag mad → Slut ; (nej) tilbage
  const FL = [
    { t: "Start", x: 500, y: 130, k: "pill" },
    { t: "Stil dig i køen", x: 500, y: 300, k: "box" },
    { t: "Min tur?", x: 500, y: 485, k: "dia" },
    { t: "Tag mad", x: 500, y: 670, k: "box" },
    { t: "Slut", x: 500, y: 840, k: "pill" },
  ];
  // tilstandsdiagram (højre halvdel): Venter → I køen → Ved disken → Spiser, med hændelser på pilene
  const SD = [
    { t: "Venter", x: 1260, y: 300 },
    { t: "I køen", x: 1810, y: 300 },
    { t: "Ved disken", x: 1810, y: 700 },
    { t: "Spiser", x: 1260, y: 700 },
  ];
  const SE = [[0, 1, "klokken ringer"], [1, 2, "tur"], [2, 3, "har mad"], [3, 0, "færdig"]];
  function drawDiagrams(nf, ns, missing) {
    const key = `${nf}:${ns}:${missing}`; if (dc.key === key) return; dc.key = key;
    const g = dc.g, w = dc.w, h = dc.h;
    g.clearRect(0, 0, w, h); g.fillStyle = "#fbfaf6"; g.fillRect(0, 0, w, h);
    g.fillStyle = "#8a93a8"; g.font = '700 46px "Familjen Grotesk", sans-serif'; g.textAlign = "left"; g.textBaseline = "middle";
    g.fillText("Rutediagram", 40, 50); g.fillText("Tilstandsdiagram", 1090, 50);
    g.strokeStyle = "#d8d3c6"; g.lineWidth = 4; g.beginPath(); g.moveTo(1030, 30); g.lineTo(1030, h - 30); g.stroke();
    g.lineCap = "round"; g.lineJoin = "round";
    const arrowHead = (x, y, ang) => { g.beginPath(); g.moveTo(x, y); g.lineTo(x - 26 * Math.cos(ang - 0.45), y - 26 * Math.sin(ang - 0.45)); g.lineTo(x - 26 * Math.cos(ang + 0.45), y - 26 * Math.sin(ang + 0.45)); g.closePath(); g.fill(); };
    // rutediagrammet tegnes trin for trin (nf = antal elementer)
    g.textAlign = "center";
    FL.forEach((n, i) => {
      if (i >= nf) return;
      g.strokeStyle = INK; g.fillStyle = i === nf - 1 ? "rgba(79,209,197,0.25)" : "#ffffff"; g.lineWidth = 7;
      if (n.k === "dia") { g.beginPath(); g.moveTo(n.x, n.y - 85); g.lineTo(n.x + 170, n.y); g.lineTo(n.x, n.y + 85); g.lineTo(n.x - 170, n.y); g.closePath(); g.fill(); g.stroke(); }
      else { K.roundRect(g, n.x - 190, n.y - 50, 380, 100, n.k === "pill" ? 50 : 12); g.fill(); g.stroke(); }
      g.fillStyle = INK; g.font = '700 50px "Familjen Grotesk", sans-serif'; g.fillText(n.t, n.x, n.y + 2);
      if (i > 0) {   // pil fra forrige
        const p = FL[i - 1], y0 = p.y + (p.k === "dia" ? 85 : 50), y1 = n.y - (n.k === "dia" ? 85 : 50);
        g.strokeStyle = INK; g.fillStyle = INK; g.lineWidth = 6; g.beginPath(); g.moveTo(n.x, y0); g.lineTo(n.x, y1 - 6); g.stroke(); arrowHead(n.x, y1, Math.PI / 2);
        if (n.k === "box" && p.k === "dia") { g.font = '600 40px "Source Sans 3", sans-serif'; g.textAlign = "left"; g.fillText("ja", n.x + 18, (y0 + y1) / 2); g.textAlign = "center"; }
      }
    });
    if (nf >= 4) {   // "nej"-løkken tilbage til køen
      g.strokeStyle = INK; g.fillStyle = INK; g.lineWidth = 6; g.beginPath(); g.moveTo(670, 485); g.lineTo(850, 485); g.lineTo(850, 300); g.lineTo(702, 300); g.stroke(); arrowHead(692, 300, Math.PI);
      g.font = '600 40px "Source Sans 3", sans-serif'; g.fillText("nej", 760, 455);
    }
    // det modellen mangler: en stiplet, rød pil "springer over" fra "Stil dig i køen" uden om "Min tur?" direkte til "Tag mad"
    if (missing) {
      g.strokeStyle = WARN; g.fillStyle = WARN; g.lineWidth = 7; g.setLineDash([22, 16]);
      g.beginPath(); g.moveTo(310, 300); g.lineTo(190, 300); g.lineTo(190, 670); g.lineTo(300, 670); g.stroke(); g.setLineDash([]); arrowHead(310, 670, 0);
      g.save(); g.translate(150, 485); g.rotate(-Math.PI / 2); g.font = '700 40px "Familjen Grotesk", sans-serif'; g.fillText("springer over?", 0, 0); g.restore();
    }
    // tilstandsdiagrammet: tilstande som cirkler, overgange som buede pile med hændelsen skrevet på
    SD.forEach((n, i) => {
      if (i >= ns) return;
      g.strokeStyle = INK; g.fillStyle = i === ns - 1 ? "rgba(79,209,197,0.25)" : "#ffffff"; g.lineWidth = 7;
      g.beginPath(); g.ellipse(n.x, n.y, 165, 90, 0, 0, 7); g.fill(); g.stroke();
      g.fillStyle = INK; g.font = '700 50px "Familjen Grotesk", sans-serif'; g.fillText(n.t, n.x, n.y + 2);
    });
    SE.forEach(([a, b, ev], i) => {
      if (Math.max(a, b) >= ns || (b === 0 && ns < 5)) return;
      const A = SD[a], Bn = SD[b];
      const dx = Bn.x - A.x, dy = Bn.y - A.y, L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L;
      const sx = A.x + ux * (dy ? 90 : 165), sy = A.y + uy * (dy ? 90 : 165), ex = Bn.x - ux * (dy ? 100 : 175), ey = Bn.y - uy * (dy ? 100 : 175);
      g.strokeStyle = INK; g.fillStyle = INK; g.lineWidth = 6; g.beginPath(); g.moveTo(sx, sy); g.lineTo(ex, ey); g.stroke(); arrowHead(ex + ux * 8, ey + uy * 8, Math.atan2(uy, ux));
      g.font = '600 40px "Source Sans 3", sans-serif'; g.fillStyle = "#3a8f88";
      g.textAlign = dy ? (a === 1 ? "left" : "right") : "center";
      const mx = (sx + ex) / 2 + (dy ? (a === 1 ? 24 : -24) : 0), my = (sy + ey) / 2 + (dy ? 0 : (a === 0 ? -58 : 50));
      g.fillText(ev, mx, my); g.textAlign = "center";
    });
    if (missing) {   // en tilstand, modellen ikke har: ingen pil fører ind i den
      g.strokeStyle = WARN; g.lineWidth = 7; g.setLineDash([18, 12]); g.beginPath(); g.ellipse(1535, 500, 185, 72, 0, 0, 7); g.stroke(); g.setLineDash([]);
      g.fillStyle = WARN; g.font = '700 40px "Familjen Grotesk", sans-serif'; g.textAlign = "center"; g.fillText("Sprunget over?", 1535, 502);
    }
    dc.tex.needsUpdate = true;
  }
  drawDiagrams(0, 0, false);
  mesh(new T.PlaneGeometry(5.0, 5.0 * 960 / 2048), basic("#ffffff", { map: dc.tex }), [0, 1.78, 0.03], DW);
  // en tusch, der følger med tegningen
  const pen = group([0, 1.8, 0.12], DW);
  mesh(merge([new T.CylinderGeometry(0.025, 0.025, 0.24, 8).translate(0, 0.12, 0), new T.ConeGeometry(0.025, 0.05, 8).rotateX(Math.PI).translate(0, -0.025, 0)]), std("#2a8f88"), [0, 0, 0], pen, [0, 0, 25]);
  ctx.sign(ctx.step("b3-1").title, { parent: DW, position: "0 3.45 0.06", width: 2.4 });
  ctx.station("b3-1", DW);

  /* ---------- datagørelse (højre side): to venner forenkles til et flueben ---------- */
  const DG = group([4.2, 0, -1.2], root, [0, -60, 0]);
  // et staffeli med lærred
  mesh(merge([bx(0.05, 2.05, 0.05, -0.75, 1.025, -0.1), bx(0.05, 2.05, 0.05, 0.75, 1.025, -0.1), bx(0.05, 2.0, 0.05, 0, 1.0, -0.55), bx(1.7, 0.06, 0.12, 0, 0.72, 0.0)]), std("#8a6a4a"), [0, 0, 0], DG);
  const fc = liveCanvas(1024, 768);
  // fem stadier: 0 nuanceret scene, 1 farver forsvinder, 2 kun silhuetter og forbindelser, 3 to prikker og en streg, 4 et flueben
  function drawFriends(stage, f) {
    const key = `${stage}:${f.toFixed(2)}`; if (fc.key === key) return; fc.key = key;
    const g = fc.g, w = fc.w, h = fc.h;
    g.globalAlpha = 1; g.fillStyle = PAPER; g.fillRect(0, 0, w, h);
    const A = [330, 470], Bp = [690, 470];
    const lerp = (a, b, t) => a + (b - a) * t;
    // stadie 0–1: en nuanceret scene: himmel, bænk, to figurer, der deler en sandwich, griner, en hund, minder i tankebobler
    // det fjernede bliver som et svagt aftryk, så tabet kan ses
    const sc = stage === 0 ? 1 : stage === 1 ? 1 - f * 0.88 : 0.12;
    if (sc > 0) {
      g.globalAlpha = sc;
      const sky = g.createLinearGradient(0, 0, 0, h); sky.addColorStop(0, "#9dd2f0"); sky.addColorStop(1, "#f6e3b8"); g.fillStyle = sky; g.fillRect(0, 0, w, h * 0.7);
      g.fillStyle = "#86b86a"; g.fillRect(0, h * 0.7, w, h * 0.3);
      g.fillStyle = "#f4d35e"; g.beginPath(); g.arc(860, 120, 60, 0, 7); g.fill();
      g.fillStyle = "#8a5a3a"; g.fillRect(200, 560, 620, 30); g.fillRect(220, 590, 20, 80); g.fillRect(780, 590, 20, 80);
      // tankebobler med fælles minder
      g.fillStyle = "rgba(255,255,255,0.9)"; g.beginPath(); g.ellipse(510, 150, 190, 85, 0, 0, 7); g.fill();
      g.fillStyle = "#5b7fd6"; g.fillRect(400, 120, 50, 50); g.fillStyle = "#e86a4f"; g.beginPath(); g.arc(510, 145, 28, 0, 7); g.fill(); g.fillStyle = "#5bb38a"; g.beginPath(); g.moveTo(580, 175); g.lineTo(610, 115); g.lineTo(640, 175); g.fill();
      g.beginPath(); g.fillStyle = "rgba(255,255,255,0.9)"; g.arc(470, 265, 18, 0, 7); g.fill(); g.beginPath(); g.arc(495, 300, 11, 0, 7); g.fill();
      // hund
      g.fillStyle = "#b98a5a"; g.beginPath(); g.ellipse(880, 600, 55, 30, 0, 0, 7); g.fill(); g.beginPath(); g.arc(930, 570, 24, 0, 7); g.fill();
    }
    // figurerne: fra detaljerede personer til silhuetter til prikker
    const det = stage <= 1 ? 1 : 0;   // fra figurer direkte til to prikker (ingen mellemsilhuet)
    const col = stage === 0 ? 1 : stage === 1 ? 1 - f : 0;
    const shrink = stage <= 1 ? 0 : stage === 2 ? f : 1;
    g.globalAlpha = 1;
    [A, Bp].forEach(([x, y], i) => {
      const r = lerp(70, 26, shrink);
      if (stage < 4 || f < 0.5) {
        g.globalAlpha = stage === 4 ? 1 - f * 2 : 1;
        const skin = i ? "#c98d6b" : "#f0c9a5", shirt = i ? "#d68b5b" : "#5b7fd6";
        const mix = (c1, c2, t) => { const a = parseInt(c1.slice(1), 16), b = parseInt(c2.slice(1), 16); const ch = s => Math.round(((a >> s) & 255) * t + ((b >> s) & 255) * (1 - t)); return `rgb(${ch(16)},${ch(8)},${ch(0)})`; };
        // krop
        if (det > 0.01) { g.fillStyle = mix(shirt, INK, col); g.globalAlpha *= 1; K.roundRect(g, x - 70 * det, y, 140 * det, 150 * det, 40 * det); g.fill(); }
        g.fillStyle = mix(skin, INK, col); g.beginPath(); g.arc(x, y - (det > 0 ? 40 : 0) * (1 - shrink), r, 0, 7); g.fill();
        // ansigt og smil (nuance)
        if (col > 0.05) { g.globalAlpha *= col; g.fillStyle = "#2a2a2a"; g.beginPath(); g.arc(x - 22, y - 50, 7, 0, 7); g.arc(x + 22, y - 50, 7, 0, 7); g.fill(); g.strokeStyle = "#2a2a2a"; g.lineWidth = 5; g.beginPath(); g.arc(x, y - 30, 26, 0.2, Math.PI - 0.2); g.stroke(); }
        g.globalAlpha = 1;
      }
    });
    // forbindelsen: fra delt sandwich og arme om skuldrene til en streg
    if (stage === 0 || stage === 1) { g.globalAlpha = 1 - (stage === 1 ? f * 0.6 : 0); g.fillStyle = "#e7c26b"; g.fillRect(470, 500, 80, 40); g.strokeStyle = stage === 0 ? "#5b7fd6" : INK; g.lineWidth = 18; g.beginPath(); g.moveTo(380, 520); g.quadraticCurveTo(500, 470, 620, 520); g.stroke(); }
    if (stage >= 2 && (stage < 4 || f < 0.5)) { g.globalAlpha = stage === 4 ? 1 - f * 2 : 1; g.strokeStyle = INK; g.lineWidth = lerp(18, 8, stage >= 3 ? f : 0); g.beginPath(); g.moveTo(A[0] + 30, A[1] - 30 * (1 - shrink) * 0); g.lineTo(Bp[0] - 30, Bp[1]); g.stroke(); }
    // stadie 4: et stort flueben og "ven = sand"
    if (stage === 4) {
      const p = clamp01((f - 0.3) / 0.6);
      g.globalAlpha = 1; g.strokeStyle = "#2a8f88"; g.lineWidth = 46; g.lineCap = "round"; g.lineJoin = "round";
      g.beginPath(); const pts = [[360, 420], [470, 540], [690, 260]]; g.moveTo(...pts[0]);
      if (p < 0.4) g.lineTo(lerp(pts[0][0], pts[1][0], p / 0.4), lerp(pts[0][1], pts[1][1], p / 0.4)); else { g.lineTo(...pts[1]); g.lineTo(lerp(pts[1][0], pts[2][0], (p - 0.4) / 0.6), lerp(pts[1][1], pts[2][1], (p - 0.4) / 0.6)); }
      g.stroke();
      // datafeltet i programmet: kun to muligheder
      const fa = clamp01((f - 0.6) / 0.3); g.globalAlpha = fa;
      g.fillStyle = "#ffffff"; K.roundRect(g, 220, 610, 584, 120, 18); g.fill(); g.strokeStyle = INK; g.lineWidth = 5; g.stroke();
      g.fillStyle = INK; g.font = '700 54px "Familjen Grotesk", sans-serif'; g.textAlign = "left"; g.textBaseline = "middle"; g.fillText("Ven:", 250, 670);
      const box = (x, on, t) => { g.strokeStyle = INK; g.lineWidth = 5; g.strokeRect(x, 642, 56, 56); if (on) { g.strokeStyle = "#2a8f88"; g.lineWidth = 9; g.beginPath(); g.moveTo(x + 10, 670); g.lineTo(x + 24, 686); g.lineTo(x + 48, 652); g.stroke(); } g.fillStyle = INK; g.font = '600 46px "Source Sans 3", sans-serif'; g.fillText(t, x + 70, 672); };
      box(380, true, "ja"); box(560, false, "nej");
    }
    // stadie-tekst nederst til venstre: hvad der bliver fjernet
    const names = ["Et venskab", "Uden stemning", "To punkter", "En kant", "Ja eller nej"];
    g.globalAlpha = 1; g.fillStyle = "rgba(246,243,234,0.85)"; g.fillRect(0, 0, w, 84); g.fillStyle = INK; g.font = '700 54px "Familjen Grotesk", sans-serif'; g.textAlign = "left"; g.textBaseline = "middle"; g.fillText(`${stage + 1}/5  ${names[stage]}`, 34, 44);
    fc.tex.needsUpdate = true;
  }
  drawFriends(0, 0);
  mesh(new T.BoxGeometry(1.62, 1.22, 0.04), std("#f0ece2"), [0, 1.42, 0.0], DG, [-6, 0, 0]);
  mesh(new T.PlaneGeometry(1.56, 1.17), basic("#ffffff", { map: fc.tex }), [0, 1.42, 0.022], DG, [-6, 0, 0]);
  // trappetrin under lærredet: fem små plader, hvor den aktuelle lyser (forenkling i trin)
  const stepMats = [0, 1, 2, 3, 4].map(() => std("#cfc8b8", { emissive: new T.Color(B), emissiveIntensity: 0 }));
  stepMats.forEach((m, i) => mesh(bx(0.26, 0.06 + i * 0.0, 0.12, -0.56 + i * 0.28, 0.64 + (4 - i) * 0.025, 0.08), m, [0, 0, 0], DG));
  ctx.sign(ctx.step("b3-2").title, { parent: DG, position: "0 2.45 0", width: 2.1 });
  ctx.station("b3-2", DG);

  /* ---------- modeller mod verden (bagerst til højre): to diagrammer parrer de samme elever ---------- */
  const MV = group([3.6, 0, 4.8], root, [0, 180 + 35, 0]);
  // seks elevprofiler (opdigtede): navn, fagligt niveau 1–3, venner, og noget modellerne ikke kender
  const PEOPLE = [
    { n: "Asta", lvl: 3, col: "#5b7fd6" }, { n: "Bo", lvl: 1, col: "#d68b5b" }, { n: "Cem", lvl: 2, col: "#5bb38a" },
    { n: "Dina", lvl: 3, col: "#b05bd6" }, { n: "Eik", lvl: 1, col: "#d6c25b" }, { n: "Fie", lvl: 2, col: "#d65b7f" },
  ];
  // model A (fagligt niveau): høj + lav;  model B (venskaber): bedste venner sammen
  // ingen af de tre par går igen i begge modeller
  const PAIR_A = [[0, 4], [3, 1], [2, 5]];
  const PAIR_B = [[0, 3], [4, 5], [2, 1]];   // Asta+Dina, Eik+Fie, Cem+Bo
  const MISS_A = "Asta og Eik er uvenner";      // rammer par 0 i model A
  const MISS_B = "To fagligt stærke sammen";   // rammer par 0 i model B
  const MISS_PAIR = [0, 0];
  const boardW = 2.0, boardH = 1.6;
  const boards = [-1.15, 1.15].map((x, k) => {
    const g = group([x, 0, 0], MV);
    mesh(merge([bx(boardW + 0.1, boardH + 0.1, 0.05, 0, 1.75, 0), bx(0.05, 1.0, 0.05, -0.8, 0.5, 0), bx(0.05, 1.0, 0.05, 0.8, 0.5, 0)]), std("#fbfaf6"), [0, 0, 0], g);
    const cv = liveCanvas(1024, 820);
    mesh(new T.PlaneGeometry(boardW, boardH), basic("#ffffff", { map: cv.tex }), [0, 1.75, 0.03], g);
    return { g, cv, k };
  });
  // to små gulvplader med figurerne, der fysisk parres (samme 6 elever ved begge modeller)
  const pegs = boards.map((b, k) => PEOPLE.map((p, i) => {
    const e = mesh(personGeo(0.5), std(p.col), [0, 0, 0], b.g);
    return e;
  }));
  function drawModel(b, k, f, showMiss) {
    const key = `${f.toFixed(2)}:${showMiss}`; if (b.cv.key === key) return; b.cv.key = key;
    const g = b.cv.g, w = b.cv.w, h = b.cv.h;
    g.fillStyle = "#fbfaf6"; g.fillRect(0, 0, w, h);
    g.fillStyle = INK; g.font = '700 54px "Familjen Grotesk", sans-serif'; g.textAlign = "center"; g.textBaseline = "middle";
    g.fillText(k ? "Model B: venskaber" : "Model A: fagligt niveau", w / 2, 56);
    g.fillStyle = "#6b7590"; g.font = '600 38px "Source Sans 3", sans-serif';
    g.fillText(k ? "Par bedste venner sammen" : "Bland fagligt niveau i hvert par", w / 2, 112);
    // tabel/diagram: elever som cirkler i en kolonne til venstre, makkerkanter tegnes
    // model B ordner eleverne, så vennerne står ved siden af hinanden (ingen krydsende streger)
    const orderB = [0, 3, 4, 5, 2, 1];
    const pos = PEOPLE.map((p, i) => { const r = k ? orderB.indexOf(i) : i; return [220 + (r % 2) * 260, 230 + Math.floor(r / 2) * 170]; });
    // kriteriet vises som streger ved siden af navnet: niveau-søjler (A) eller vennehjerter → neutral prik-række (B)
    PEOPLE.forEach((p, i) => {
      const [x, y] = pos[i];
      g.fillStyle = p.col; g.beginPath(); g.arc(x, y, 46, 0, 7); g.fill();
      g.fillStyle = "#ffffff"; g.font = '700 34px "Familjen Grotesk", sans-serif'; g.fillText(p.n, x, y + 2);
      if (!k) { for (let l = 0; l < 3; l++) { g.fillStyle = l < p.lvl ? INK : "#d8d3c6"; g.fillRect(x + 56 + l * 18, y + 20 - l * 14, 12, 14 + l * 14); } }
    });
    // model B's kriterium: venskaber som stiplede, lige streger mellem vennerne
    if (k) { g.strokeStyle = "#8a93a8"; g.lineWidth = 6; g.setLineDash([12, 10]);
      for (const [a, c] of [[0, 3], [4, 5], [2, 1]]) { const [x1, y1] = pos[a], [x2, y2] = pos[c], L = Math.hypot(x2 - x1, y2 - y1), ux = (x2 - x1) / L, uy = (y2 - y1) / L; g.beginPath(); g.moveTo(x1 + ux * 50, y1 + uy * 50); g.lineTo(x2 - ux * 50, y2 - uy * 50); g.stroke(); }
      g.setLineDash([]); }
    // makkerkanter til højre: par vises som forbundne kort i "par"-kolonnen
    const pairs = k ? PAIR_B : PAIR_A;
    pairs.forEach(([a, c], j) => {
      const yy = 260 + j * 170, xa = 720, xc = 900, ff = clamp01(f * 3 - j);
      g.globalAlpha = 0.25 + 0.75 * ff;
      const bad = showMiss && j === MISS_PAIR[k];
      if (bad) { g.fillStyle = "rgba(232,106,79,0.18)"; K.roundRect(g, 660, yy - 62, 300, 124, 24); g.fill(); g.strokeStyle = WARN; g.lineWidth = 6; g.stroke(); }
      g.strokeStyle = bad ? WARN : B; g.lineWidth = 10; g.beginPath(); g.moveTo(xa, yy); g.lineTo(xa + (xc - xa) * ff, yy); g.stroke();
      [[a, xa], [c, xc]].forEach(([i, x]) => { g.fillStyle = PEOPLE[i].col; g.beginPath(); g.arc(x, yy, 40, 0, 7); g.fill(); g.fillStyle = "#fff"; g.font = '700 30px "Familjen Grotesk", sans-serif'; g.fillText(PEOPLE[i].n, x, yy + 2); });
      g.globalAlpha = 1;
    });
    g.fillStyle = "#8a93a8"; g.font = '700 36px "Familjen Grotesk", sans-serif'; g.fillText("Makkerpar", 810, 170);
    g.strokeStyle = "#d8d3c6"; g.lineWidth = 3; g.beginPath(); g.moveTo(610, 160); g.lineTo(610, 760); g.stroke();
    if (showMiss) {
      g.fillStyle = "rgba(232,106,79,0.14)"; g.fillRect(0, h - 110, w, 110);
      g.fillStyle = WARN; g.font = '700 34px "Familjen Grotesk", sans-serif'; g.fillText("Tog ikke højde for: " + (k ? MISS_B : MISS_A), w / 2, h - 55);
    }
    b.cv.tex.needsUpdate = true;
  }
  boards.forEach((b, k) => drawModel(b, k, 0, false));
  ctx.sign(ctx.step("b3-3").title, { parent: MV, position: "0 3.2 0", width: 2.0 });
  label("Samme elever – forskellige par", [0, 2.72, 0.05], MV, 0.13);
  const st3 = group([0, 0, 1.0], MV);
  ctx.station("b3-3", st3);

  /* ---------- tegnestuens vægge: svage skitser og et tegnebord, så rummet føles som et arbejdssted ---------- */
  {
    const sketch = (draw) => K.canvasTexture(512, 384, (g, w, h) => { g.fillStyle = "#f6f3ea"; g.fillRect(0, 0, w, h); g.strokeStyle = "rgba(29,43,69,0.45)"; g.lineWidth = 5; draw(g, w, h); });
    const sheets = [
      sketch((g) => { for (let i = 0; i < 4; i++) { g.strokeRect(60 + i * 110, 150, 80, 60); if (i) { g.beginPath(); g.moveTo(i * 110 + 30, 180); g.lineTo(i * 110 + 60, 180); g.stroke(); } } }),
      sketch((g) => { [[130, 120], [380, 120], [255, 290]].forEach(([x, y]) => { g.beginPath(); g.ellipse(x, y, 70, 40, 0, 0, 7); g.stroke(); }); g.beginPath(); g.moveTo(200, 120); g.lineTo(310, 120); g.moveTo(350, 155); g.lineTo(290, 255); g.stroke(); }),
      sketch((g) => { g.beginPath(); for (let x = 40; x < 470; x += 60) { g.moveTo(x, 330); g.lineTo(x, 330 - 40 - ((x * 7) % 200)); } g.stroke(); }),
    ];
    const sm = sheets.map(t => basic("#ffffff", { map: t, transparent: true, opacity: 0.85 }));
    [[X1 - 0.12, 2.3, 1.6, -90, 0], [X1 - 0.12, 2.2, 3.4, -90, 1], [X1 - 0.12, 2.4, -3.6, -90, 2], [-3.0, 2.6, Z1 - 0.12, 180, 0], [-1.2, 2.4, Z1 - 0.12, 180, 2]]
      .forEach(([x, y, z, ry, k]) => mesh(new T.PlaneGeometry(0.9, 0.68), sm[k], [x, y, z], root, [0, ry, 0]));
    // tegnebord med skrå plade, lineal og blyanter
    const tb = group([-4.3, 0, 4.3], root, [0, 140, 0]);
    mesh(merge([bx(1.4, 0.05, 0.9, 0, 0.95, 0).rotateX(0.25), bx(0.06, 0.9, 0.06, -0.6, 0.45, 0.35), bx(0.06, 0.9, 0.06, 0.6, 0.45, 0.35), bx(0.06, 1.05, 0.06, -0.6, 0.52, -0.35), bx(0.06, 1.05, 0.06, 0.6, 0.52, -0.35)]), std("#8a6a4a"), [0, 0, 0], tb);
    mesh(bx(1.2, 0.01, 0.7, 0, 0.99, 0).rotateX(0.25), basic("#ffffff", { map: sheets[0] }), [0, 0, 0], tb);
    // varmt arbejdslys over modelbordet
    kit.el("a-entity", { light: "type: point; color: #ffe2b8; intensity: 0.45; distance: 5; decay: 1.6", position: "-1.9 2.6 -3.6" });
  }

  /* ---------- lys, skilt og dør ---------- */
  kit.el("a-entity", { light: `type: point; color: #fff8ea; intensity: 0.7; distance: 14; decay: 1.0`, position: "0 3.8 1" });
  ctx.sign(ctx.room.name, { position: `5.0 2.7 ${Z0 + 0.13}`, width: 2.3, sub: ctx.room.sub });
  ctx.door(ctx.room.parent, { position: `-5.4 0 ${Z0 + 0.15}`, rotation: "0 0 0" });

  /* ---------- views ---------- */
  ctx.view("b3-0", { position: [-0.4, 0, -0.5], lookAt: [0.2, 0, -6.0] });
  ctx.view("b3-1", { position: [-3.9, 0, -0.2], lookAt: [X0, 0, -0.2] });
  ctx.view("b3-2", { position: [2.15, 0, 0.0], lookAt: [4.2, 0, -1.2] });
  ctx.view("b3-3", { position: [1.75, 0, 1.95], lookAt: [3.6, 0, 4.8] });

  /* ---------- tilstand og animation ---------- */
  let mode = null, t0 = 0, fresh = true;
  function dim(el, a) {
    el.object3D.traverse(o => { if (!o.material) return; const ms = Array.isArray(o.material) ? o.material : [o.material];
      ms.forEach(m => { if (m.userData.baseOp === undefined) { m.userData.baseOp = m.opacity; m.userData.baseTr = m.transparent; }
        m.transparent = a < 1 ? true : m.userData.baseTr; m.opacity = m.userData.baseOp * a; m.needsUpdate = true; }); });
  }
  const stationEls = { "b3-0": [MT], "b3-1": [DW], "b3-2": [DG], "b3-3": [MV] };
  // stikord i speaken (sekunder i trinnet). Slås op hver frame: tidskoderne hentes asynkront, når trinnet starter,
  // så et tidligt opslag kan være et skøn, der senere bliver erstattet af den rigtige tid.
  const Q = (id, ph, n = 1) => ctx.cue(id, ph, n);
  return {
    onStep(id) { mode = id; fresh = true;
      Object.entries(stationEls).forEach(([k, els]) => els.forEach(e => dim(e, k === id ? 1 : 0.4))); },
    tick(t) {
      if (fresh) { t0 = t; fresh = false; }
      // testkrog: window.__roomS låser animationstiden (bruges kun af skærmbilledværktøjet)
      const s = typeof window.__roomS === "number" ? window.__roomS : ctx.time();   // fortællingens tid (følger speaken)

      /* køen: i b3-0 forlader den bagerste sin plads og stiller sig næsten forrest; den lyser op */
      const a0 = mode === "b3-0";
      // springet sker ved "køen under vinduet"; det, modellen mangler, vises ved "ikke taget med"
      const c0 = a0 ? s - (Q("b3-0", "køen under vinduet") - 0.3 - 1.2) : 0;
      const missOn = a0 && s > Q("b3-0", "ikke taget med") - 0.3;
      const jump = a0 ? ease((c0 - 1.2) / 2.4) : 0;
      queue.forEach((q, i) => {
        let [x, z] = q.base, ry = -90;
        const sway = Math.sin(t * 0.0018 + i * 1.7) * 0.02;
        if (i === JUMP) {   // bue ud til siden og ind foran nr. 2
          const tx = (QX(0) + QX(1)) / 2, tz = QZ;
          x = x + (tx - x) * jump; z = z + 0.9 * Math.sin(jump * Math.PI) + (tz + 0.28 - z) * jump;   // ender skråt foran nr. 2
          ry = jump > 0 && jump < 1 ? -90 - 25 * Math.cos(jump * Math.PI) : -90;
        } else if (i >= 1 && a0) x += 0.36 * ease((c0 - 2.6) / 0.8);   // de andre rykker et halvt skridt bagud for at give plads
        q.e.object3D.position.set(x + sway, CY, z);
        q.e.object3D.rotation.y = ry * D2R;
        q.m.emissiveIntensity = i === JUMP && a0 && c0 > 1.2 ? 0.9 + 0.4 * Math.sin(t * 0.01) : 0;
        if (i === JUMP) q.m.color.set(a0 && c0 > 1.2 ? "#ffd0c4" : qColors[i]);
      });
      const jq = queue[JUMP].e.object3D.position;
      jumpRing.object3D.position.set(jq.x, CY + 0.05, jq.z);
      jumpRingMat.opacity = a0 && c0 > 1.2 ? 0.9 : 0;
      jumpHalo.material.opacity = a0 && c0 > 1.2 ? 0.9 : 0; jumpHalo.position.set(jq.x, CY + 0.8, jq.z);
      missQ.object3D.visible = a0 && c0 > 3.6; missQ.object3D.position.set(jq.x, CY + 1.95, jq.z);
      miss.object3D.visible = missOn;
      gapMat.opacity = missOn ? 0.9 : 0;

      /* diagrammerne tegnes trin for trin */
      const a1 = mode === "b3-1";
      // rutediagrammet tegnes fra "et rutediagram", tilstandsdiagrammet fra "et tilstandsdiagram", det manglende ved "noget mangler"
      const r0 = Q("b3-1", "et rutediagram") - 0.3, s0 = Q("b3-1", "et tilstandsdiagram") - 0.3, m0 = Q("b3-1", "noget mangler") - 0.3;
      const nf = a1 ? Math.max(0, Math.min(5, Math.floor((s - r0) / 0.7) + 1)) : 5;
      const ns = a1 ? Math.max(0, Math.min(5, Math.floor((s - s0) / 0.9) + 1)) : 5;
      const missing = a1 && s > m0;
      drawDiagrams(nf, ns, missing);
      // tuschen følger det, der lige tegnes
      pen.object3D.visible = a1 && s > r0 && (s < s0 + 4.5 || (s > m0 && s < m0 + 0.8));
      if (a1) {
        let px, py;
        if (s < s0) { const n = FL[Math.max(0, Math.min(4, nf - 1))]; px = n.x; py = n.y; }
        else if (s < m0) { const n = SD[Math.max(0, Math.min(3, ns - 1))]; px = n.x; py = n.y; }
        else { px = 160; py = 280; }
        pen.object3D.position.set((px / 2048 - 0.5) * 5.0 + 0.15, 1.78 + (0.5 - py / 960) * 5.0 * 960 / 2048 + 0.1 + Math.sin(t * 0.02) * 0.02, 0.12);
      }

      /* datagørelse: fem stadier, ét ad gangen */
      const a2 = mode === "b3-2";
      // forenklingen følger speaken: "forenklinger", "repræsenteres som data", "bare ja eller nej", "ven eller ikke ven"
      const st = [Q("b3-2", "forenklinger"), Q("b3-2", "repræsenteres som data"), Q("b3-2", "bare ja eller nej"), Q("b3-2", "ven eller ikke ven")].map(x => x - 0.3);
      const stage = a2 ? st.filter(x => s >= x).length : 0;
      const f2 = a2 && stage ? (stage === 4 ? clamp01((s - st[3]) / 1.6) : ease(clamp01((s - st[stage - 1]) / 0.9))) : 0;
      drawFriends(stage, stage === 0 ? 0 : f2);
      stepMats.forEach((m, i) => { m.emissiveIntensity = a2 && i === stage ? 1.2 : 0; m.color.set(a2 && i <= stage ? "#7fe0d6" : "#9a9282"); });

      /* modeller mod verden: de samme seks figurer parres forskelligt på hver side */
      const a3 = mode === "b3-3";
      // model A parrer ved "fagligt niveau", model B ved "venskaber"; manglerne dukker op ved "bliver det tydeligt"
      const pfk = [a3 ? ease((s - Q("b3-3", "fagligt niveau") + 0.3) / 1.2) : 1, a3 ? ease((s - Q("b3-3", "venskaber") + 0.3) / 1.2) : 1];
      const showMiss = a3 && s > Q("b3-3", "bliver det tydeligt") - 0.3;
      boards.forEach((b, k) => {
        const pf = pfk[k];
        drawModel(b, k, pf, showMiss);
        const pairs = k ? PAIR_B : PAIR_A;
        // figurerne står først i en række, går så sammen i par foran tavlen
        PEOPLE.forEach((p, i) => {
          const row = [-0.7 + i * 0.28, 0.45];
          let j = pairs.findIndex(pr => pr.includes(i)), side = pairs[j][0] === i ? -1 : 1;
          const pair = [-0.66 + j * 0.66 + side * 0.12, 0.42];
          const x = row[0] + (pair[0] - row[0]) * pf, z = row[1] + (pair[1] - row[1]) * pf;
          pegs[k][i].object3D.position.set(x, 0, z);
          // det par, modellen ikke tog højde for, vender sig fra hinanden
          const bad = showMiss && j === MISS_PAIR[k];
          // vipper væk fra hinanden og trækker sig et lille skridt ud, så det ses i et stillbillede
          pegs[k][i].object3D.rotation.z = bad ? -side * 0.3 : 0;
          if (bad) pegs[k][i].object3D.position.x += side * 0.08;
        });
      });
    },
  };
}
