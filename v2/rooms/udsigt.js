/* Rum S · Udsigten — sammenhæng og det åbne.
   En åben tagterrasse i skumring. Under den står forhallens runde tromle, og omkring den ligger de tre fløje som
   arkitekturmodeller med lys i vinduerne: Atelieret (ravgul), Tårnet (turkis) og Gaden (rosa). Lysbuer forbinder dem,
   og over pladsen svæver kernen i mindre størrelse. Trin: s1–s4. Se manus.md, "Rum S · Udsigten". */

export default function build(ctx) {
  const { THREE, C, K, kit, root } = ctx;
  const BGU = THREE.BufferGeometryUtils;
  const D2R = Math.PI / 180;
  const disposables = [];
  const keep = x => { disposables.push(x); return x; };

  /* ---------- Hjælpere ---------- */
  let seed = 11;
  const rnd = () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const clamp01 = x => Math.max(0, Math.min(1, x));
  const ease = x => { x = clamp01(x); return x * x * (3 - 2 * x); };
  const approach = (cur, to, dt, rate = 4) => cur + (to - cur) * (1 - Math.exp(-rate * dt / 1000));
  const r3 = v => Math.round(v * 1000) / 1000;      // rammen skriver tal ind i strenge; undgå "1e-16"
  function add(obj, parent = root) { const h = kit.grp(parent, "0 0 0"); h.object3D.add(obj); return obj; }
  const std = (color, o = {}) => keep(new THREE.MeshStandardMaterial({ color, roughness: 0.75, metalness: 0.1, flatShading: true, ...o }));
  const basic = (color, o = {}) => keep(new THREE.MeshBasicMaterial({ color, toneMapped: false, ...o }));
  const additive = (map, opacity = 1, color = "#ffffff") => keep(new THREE.MeshBasicMaterial({ map, color, transparent: true, opacity, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }));
  const tex = (w, h, draw) => keep(K.canvasTexture(w, h, draw));
  const labelMat = (map, o = {}) => keep(new THREE.MeshBasicMaterial({ map, transparent: true, depthWrite: false, toneMapped: false, opacity: 0, ...o }));
  function boxAt(w, h, d, x, y, z, ry = 0) { const g = new THREE.BoxGeometry(w, h, d); if (ry) g.rotateY(ry); g.translate(x, y, z); return g; }
  function merged(list) {  // blander indekserede og ikke-indekserede geometrier sikkert
    const anyNon = list.some(g => !g.index);
    const ready = list.map(g => anyNon && g.index ? g.toNonIndexed() : g);
    const m = BGU.mergeGeometries(ready); new Set([...list, ...ready]).forEach(g => g.dispose()); return keep(m);
  }
  // et prisme (tag): trekantet tværsnit i x/y, ekstruderet langs z
  function prism(w, h, d, slant = 0) {
    const s = new THREE.Shape([new THREE.Vector2(-w / 2, 0), new THREE.Vector2(w / 2, 0), new THREE.Vector2(-w / 2 + w * slant, h)]);
    const g = new THREE.ExtrudeGeometry(s, { depth: d, bevelEnabled: false }); g.translate(0, 0, -d / 2); g.deleteAttribute("uv"); g.setAttribute("uv", new THREE.Float32BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2)); return g;
  }

  // Kameraet står altid vandret (rammen styrer kun retningen), så modellerne ligger i den nederste halvdel af
  // billedet, og kernen svæver i øjenhøjde over pladsen.
  const G = -3.0;                                 // pladsens niveau under terrassen
  const PLAT = new THREE.Vector3(0, 0, 1.6), PR = 4.2;   // terrassens centrum og radius
  const CORE = new THREE.Vector3(-0.4, 2.0, -5.6);  // den lille kerne svæver foran terrassen, over pladsen
  const PLAZA = new THREE.Vector3(0, G, -9.0);    // pladsens midte

  ctx.env({ background: "#0a0d1f" });

  /* ---------- Himmel i skumring med en fjern by i horisonten ---------- */
  const skyTex = tex(2048, 1024, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, 0, h);
    gr.addColorStop(0.0, "#060816"); gr.addColorStop(0.28, "#121a3f"); gr.addColorStop(0.42, "#2c2a5c");
    gr.addColorStop(0.48, "#6b4a78"); gr.addColorStop(0.505, "#c47a6e"); gr.addColorStop(0.52, "#3a2c4c"); gr.addColorStop(0.6, "#0d1024"); gr.addColorStop(1, "#05060e");
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    // skyline: tre lag silhuetter med enkelte lysende vinduer
    const hz = h * 0.505;
    [["#1b1835", 0.05, 0.4], ["#141229", 0.035, 0.7], ["#0e0d1e", 0.022, 1]].forEach(([col, maxH, wl]) => {
      let x = 0; g.fillStyle = col;
      const blds = [];
      while (x < w) { const bw = 10 + rnd() * 40, bh = h * (0.004 + rnd() * rnd() * maxH); blds.push([x, bw, bh]); g.fillRect(x, hz - bh, bw + 1, bh + h * 0.03); x += bw; }
      g.fillStyle = `rgba(255,214,160,${0.5 * wl})`;
      blds.forEach(([bx, bw, bh]) => { for (let i = 0; i < bh * bw / 120; i++) if (rnd() < 0.3) g.fillRect(bx + 2 + rnd() * (bw - 5), hz - bh + 3 + rnd() * (bh - 4), 2, 2); });
      g.fillStyle = col;
    });
  });
  const sky = new THREE.Mesh(keep(new THREE.SphereGeometry(40, 48, 20)), keep(new THREE.MeshBasicMaterial({ map: skyTex, side: THREE.BackSide, toneMapped: false, depthWrite: false, fog: false })));
  sky.position.y = 1.0; sky.renderOrder = -10; add(sky);
  // stjerner (bliver tydeligere, når det bliver mørkt i S4)
  const starGeo = keep(new THREE.BufferGeometry());
  { const P = []; for (let i = 0; i < 520; i++) { const u = rnd(), v = 0.12 + rnd() * 0.88, a = u * Math.PI * 2, el = Math.asin(v) * 0.95;
      P.push(Math.cos(a) * Math.cos(el) * 36, Math.sin(el) * 36 + 1, Math.sin(a) * Math.cos(el) * 36); }
    starGeo.setAttribute("position", new THREE.Float32BufferAttribute(P, 3)); }
  const starMat = keep(new THREE.PointsMaterial({ color: "#dfe4ff", size: 1.6, sizeAttenuation: false, transparent: true, opacity: 0.35, depthWrite: false, toneMapped: false }));
  add(new THREE.Points(starGeo, starMat));

  /* ---------- Pladsen under terrassen ---------- */
  const groundTex = tex(1024, 1024, (g, w, h) => {
    g.fillStyle = "#0d1126"; g.fillRect(0, 0, w, h);
    const s = w / 20, cx = w / 2, cy = h / 2;                     // 20 m bred plads
    g.strokeStyle = "rgba(150,160,230,0.07)"; g.lineWidth = 1.5;
    for (let i = 0; i <= 32; i++) { g.beginPath(); g.moveTo(i * s / 2, 0); g.lineTo(i * s / 2, h); g.stroke(); g.beginPath(); g.moveTo(0, i * s / 2); g.lineTo(w, i * s / 2); g.stroke(); }
    // ringe omkring kernens plads (centrum = pladsens centrum)
    g.strokeStyle = "rgba(201,209,255,0.22)"; g.lineWidth = 3; g.setLineDash([10, 12]);
    g.beginPath(); g.arc(cx, cy, 1.2 * s, 0, 7); g.stroke(); g.setLineDash([]);
    g.strokeStyle = "rgba(201,209,255,0.12)"; g.beginPath(); g.arc(cx, cy, 2.0 * s, 0, 7); g.stroke();
    const vg = g.createRadialGradient(cx, cy, w * 0.25, cx, cy, w * 0.5); vg.addColorStop(0, "rgba(11,13,31,0)"); vg.addColorStop(1, "rgba(11,13,31,1)");
    g.fillStyle = vg; g.fillRect(0, 0, w, h);
  });
  const groundMat = std("#ffffff", { map: groundTex, roughness: 1, flatShading: false });
  const ground = new THREE.Mesh(keep(new THREE.CircleGeometry(10, 48)), groundMat);
  ground.rotation.x = -Math.PI / 2; ground.position.set(PLAZA.x, G, PLAZA.z); add(ground);
  // resten af byens tage ud til horisonten: en stor mørk flade, så pladsens kant ikke ses
  const farMat = basic("#0b0d1f", { fog: false });
  const far = new THREE.Mesh(keep(new THREE.RingGeometry(9.9, 38, 48, 1)), farMat); far.rotation.x = -Math.PI / 2; far.position.set(PLAZA.x, G - 0.02, PLAZA.z); add(far);
  const plazaGlowMat = additive(keep(K.glowTex(C.core)), 0.5);
  const plazaGlow = new THREE.Mesh(keep(new THREE.PlaneGeometry(3.2, 3.2)), plazaGlowMat);
  plazaGlow.rotation.x = -Math.PI / 2; plazaGlow.position.set(CORE.x, G + 0.01, CORE.z); add(plazaGlow);

  /* ---------- Facader med lys i vinduerne ---------- */
  // map = mur med mørke ruder, emissiveMap = kun ruderne (lyset). Ét sæt pr. fløj.
  function facade(cols, rows, { wide = false, warm = "#ffe2b0" } = {}) {
    const W = 256, H = 256;
    const drawWin = (g, lit) => {
      const mx = 26, my = 30, gw = (W - mx * 2) / cols, gh = (H - my * 2) / rows;
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
        const on = lit ? rnd() < 0.78 : true;
        if (!on) continue;
        g.fillStyle = lit ? warm : "#0b0e1c";
        const ww = wide ? gw * 0.86 : gw * 0.52, wh = gh * 0.5;
        g.fillRect(mx + c * gw + (gw - ww) / 2, my + r * gh + (gh - wh) / 2, ww, wh);
      }
    };
    const map = tex(W, H, g => { g.fillStyle = "#ffffff"; g.fillRect(0, 0, W, H); g.fillStyle = "rgba(0,0,0,0.08)"; g.fillRect(0, H - 14, W, 14); drawWin(g, false); });
    const em = tex(W, H, g => { g.fillStyle = "#000"; g.fillRect(0, 0, W, H); drawWin(g, true); });
    return { map, em };
  }

  // Tårnets facade: rack-skuffer med lysdioder (materielt grundlag: elektronik, ikke en bygning med kontorer)
  function rackFacade() {
    const W = 256, H = 256;
    const draw = (g, lit) => {
      for (let r = 0; r < 9; r++) {
        const y = 14 + r * 26;
        if (!lit) { g.fillStyle = "#1c2140"; g.fillRect(18, y, W - 36, 20); g.fillStyle = "#0b0e1c"; g.fillRect(24, y + 4, 60, 12); }
        g.fillStyle = lit ? "#d6fff8" : "#0b0e1c";
        for (let k = 0; k < 8; k++) if (!lit || rnd() < 0.6) g.fillRect(100 + k * 16, y + 7, 6, 6);
      }
    };
    return { map: tex(W, H, g => { g.fillStyle = "#ffffff"; g.fillRect(0, 0, W, H); draw(g, false); }), em: tex(W, H, g => { g.fillStyle = "#000"; g.fillRect(0, 0, W, H); draw(g, true); }) };
  }

  /* ---------- De tre fløje som modeller ---------- */
  // hver fløj: krop (med vinduer), tag, modelsokkel, kantlinjer i områdets farve
  const WINGS = [];
  function makeWing(key, color, pos, ry, bodies, roofs, fac, roofH) {
    const grp = new THREE.Group(); grp.position.copy(pos); grp.rotation.y = ry; add(grp);
    const body = merged(bodies), roof = merged(roofs);
    const bodyMat = std("#2d3358", { map: fac.map, emissiveMap: fac.em, emissive: new THREE.Color("#ffd9a6"), emissiveIntensity: 0.35, roughness: 0.8 });
    const roofMat = std("#262c4e", { roughness: 0.6, metalness: 0.2 });
    grp.add(new THREE.Mesh(body, bodyMat), new THREE.Mesh(roof, roofMat));
    // kantlinjer, så det læses som en arkitekturmodel
    const eg = keep(new THREE.EdgesGeometry(BGU.mergeGeometries([body, roof].map(g => g.index ? g.toNonIndexed() : g.clone()).map(g => { g.deleteAttribute("uv"); g.deleteAttribute("normal"); return g; })), 25));
    const edgeMat = basic(color, { transparent: true, opacity: 0.3 });
    grp.add(new THREE.LineSegments(eg, edgeMat));
    // modelsokkel i områdets farve
    body.computeBoundingBox(); const bb = body.boundingBox;
    const plinthMat = std(color, { emissive: new THREE.Color(color), emissiveIntensity: 0.1, roughness: 0.5 });
    const plinth = new THREE.Mesh(keep(new THREE.BoxGeometry(bb.max.x - bb.min.x + 0.5, 0.1, bb.max.z - bb.min.z + 0.5)), plinthMat);
    plinth.position.set((bb.max.x + bb.min.x) / 2, 0.05, (bb.max.z + bb.min.z) / 2); grp.add(plinth);
    // lyspøl på pladsen
    const poolMat = additive(keep(K.glowTex(color)), 0.0);
    const pool = new THREE.Mesh(keep(new THREE.PlaneGeometry(5, 5)), poolMat); pool.rotation.x = -Math.PI / 2; pool.position.set(plinth.position.x, 0.02, plinth.position.z); grp.add(pool);
    const top = new THREE.Vector3(plinth.position.x, roofH, plinth.position.z).applyAxisAngle(new THREE.Vector3(0, 1, 0), ry).add(pos);
    const w = { key, color, grp, bodyMat, edgeMat, plinthMat, poolMat, top, lit: 0 };
    WINGS.push(w); return w;
  }
  // Atelieret: en bred værkstedshal med savtakket tag og ovenlys
  {
    const L = 3.0, D = 1.9, H = 1.05;
    const bodies = [boxAt(L, H, D, 0, 0.1 + H / 2, 0)];
    const roofs = [];
    for (let i = 0; i < 4; i++) { const p = prism(L / 4, 0.55, D + 0.04, 0); p.translate(-L / 2 + L / 8 + i * L / 4, 0.1 + H, 0); roofs.push(p); }
    // ovenlysruder på savtakkenes stejle side (lysende flader)
    for (let i = 0; i < 4; i++) bodies.push(boxAt(0.04, 0.46, D - 0.2, -L / 2 + i * L / 4 + 0.03, 0.1 + H + 0.25, 0));
    makeWing("a", C.a, new THREE.Vector3(-5.0, G, -9.2), 30 * D2R, bodies, roofs, facade(6, 2, { wide: true, warm: "#ffd49a" }), 0.1 + H + 0.6);
  }
  // Tårnet: tre etager med tilbagetrækninger og en mast
  {
    const bodies = [boxAt(1.7, 1.25, 1.7, 0, 0.1 + 0.625, 0), boxAt(1.42, 1.2, 1.42, 0, 1.35 + 0.6, 0), boxAt(1.14, 1.1, 1.14, 0, 2.55 + 0.55, 0)];
    const roofs = [boxAt(1.8, 0.06, 1.8, 0, 1.35, 0), boxAt(1.52, 0.06, 1.52, 0, 2.55, 0), boxAt(1.24, 0.08, 1.24, 0, 3.69, 0),
      boxAt(0.05, 0.9, 0.05, 0.25, 4.15, 0.2), boxAt(0.36, 0.22, 0.36, -0.2, 3.84, -0.15)];
    // ikke et kontorhøjhus: facaden er rack-skuffer med små lysdioder, og kabler løber ned ad siden
    const w = makeWing("b", C.b, new THREE.Vector3(1.2, G, -10.6), -8 * D2R, bodies, roofs, rackFacade(), 3.9);
    const cables = [];
    for (let k = 0; k < 3; k++) {
      const x0 = 0.87, z0 = -0.5 + k * 0.42;
      const c = new THREE.CatmullRomCurve3([new THREE.Vector3(0.6, 3.55, z0 * 0.7), new THREE.Vector3(x0 + 0.06, 3.2, z0), new THREE.Vector3(x0 + 0.1, 1.6, z0 + 0.05), new THREE.Vector3(x0 + 0.35, 0.2, z0 + 0.2), new THREE.Vector3(x0 + 0.9 + k * 0.15, 0.1, z0 + 0.4)]);
      cables.push(new THREE.TubeGeometry(c, 24, 0.028, 4, false));
    }
    w.cableMat = std("#151a33", { emissive: new THREE.Color(C.b), emissiveIntensity: 0.2, roughness: 0.4 });
    w.grp.add(new THREE.Mesh(merged(cables), w.cableMat));
  }
  // Gaden: to rækker små huse om en gade med lygtepæle
  const lampPos = [];
  {
    const bodies = [], roofs = [];
    const hs = [0.75, 1.05, 0.85, 1.2, 0.7], ws = [0.6, 0.5, 0.65, 0.55, 0.6];
    [-1, 1].forEach(side => {
      let x = -1.45;
      hs.forEach((hh, i) => {
        const h = side > 0 ? hs[(i + 2) % 5] : hh, w = ws[i], d = 0.62;
        const z = side * 0.62;
        bodies.push(boxAt(w - 0.03, h, d, x + w / 2, 0.1 + h / 2, z));
        const p = prism(d, 0.32, w - 0.03, 0.5); p.rotateY(Math.PI / 2); p.translate(x + w / 2, 0.1 + h, z); roofs.push(p);
        x += w;
      });
    });
    for (let i = 0; i < 4; i++) { const x = -1.3 + i * 0.9; roofs.push(boxAt(0.025, 0.42, 0.025, x, 0.31, 0)); lampPos.push(new THREE.Vector3(x, 0.54, 0)); }
    roofs.push(boxAt(3.2, 0.012, 0.5, 0.05, 0.106, 0));     // gaden selv
    const w = makeWing("c", C.c, new THREE.Vector3(5.6, G, -8.4), -34 * D2R, bodies, roofs, facade(2, 2, { warm: "#ffd0c2" }), 1.65);
    // lygternes lys: små lysende kugler (én samlet mesh)
    const lg = merged(lampPos.map(p => { const g = new THREE.SphereGeometry(0.05, 8, 6); g.translate(p.x, p.y, p.z); return g; }));
    w.lampMat = basic("#ffe0d0"); w.grp.add(new THREE.Mesh(lg, w.lampMat));
  }
  const WING = Object.fromEntries(WINGS.map(w => [w.key, w]));

  let drumMat;
  /* ---------- Forhallens tromle bærer terrassen ---------- */
  {
    const fac = facade(16, 2, { warm: "#dfe3ff" });
    fac.map.wrapS = fac.em.wrapS = THREE.RepeatWrapping; fac.map.repeat.set(3, 1); fac.em.repeat.set(3, 1);
    const drum = new THREE.Mesh(keep(new THREE.CylinderGeometry(PR - 0.35, PR - 0.35, -0.3 - G, 40, 1, true)),
      drumMat = std("#252b50", { map: fac.map, emissiveMap: fac.em, emissive: new THREE.Color(C.core), emissiveIntensity: 0.3 }));
    drum.position.set(PLAT.x, (G - 0.3) / 2, PLAT.z); add(drum);
  }

  /* ---------- Terrassen ---------- */
  const deckTex = tex(1024, 1024, (g, w, h) => {
    g.fillStyle = "#2a2f4c"; g.fillRect(0, 0, w, h);
    const n = 30;
    for (let i = 0; i < n; i++) {        // planker
      const y = i * h / n; g.fillStyle = i % 2 ? "#2d3352" : "#282d4a"; g.fillRect(0, y, w, h / n - 3);
      let x = rnd() * 200; g.fillStyle = "#1b1f36"; while (x < w) { g.fillRect(x, y, 3, h / n); x += 260 + rnd() * 240; }
    }
    g.fillStyle = "rgba(0,0,0,0.25)"; g.fillRect(0, 0, w, h);
  });
  const deckMat = std("#ffffff", { map: deckTex, roughness: 0.9, flatShading: false });
  const darkMats = [];
  const deck = new THREE.Mesh(keep(new THREE.CylinderGeometry(PR, PR - 0.15, 0.3, 64)), [deckMat, std("#1e2340"), deckMat]);
  // CylinderGeometry har grupper: side, top, bund
  deck.material = [std("#1e2340", { roughness: 0.6 }), deckMat, std("#14182e")];
  deck.position.set(PLAT.x, -0.15, PLAT.z); add(deck);
  // rækværk: lav brystning, glas og en lysende håndliste
  const parMat = std("#343b62", { roughness: 0.5, metalness: 0.4 }); darkMats.push([parMat, "#343b62"]);
  const parapet = new THREE.Mesh(keep(new THREE.TorusGeometry(PR - 0.06, 0.07, 4, 72)), parMat);
  parapet.rotation.x = Math.PI / 2; parapet.position.set(PLAT.x, 0.07, PLAT.z); add(parapet);
  const glass = new THREE.Mesh(keep(new THREE.CylinderGeometry(PR - 0.06, PR - 0.06, 0.85, 72, 1, true)),
    keep(new THREE.MeshBasicMaterial({ color: "#9fb0ff", transparent: true, opacity: 0.07, side: THREE.DoubleSide, depthWrite: false })));
  glass.position.set(PLAT.x, 0.55, PLAT.z); add(glass);
  const railMat = basic(C.core, { transparent: true, opacity: 0.85 });
  const rail = new THREE.Mesh(keep(new THREE.TorusGeometry(PR - 0.06, 0.022, 4, 96)), railMat);
  rail.rotation.x = Math.PI / 2; rail.position.set(PLAT.x, 0.98, PLAT.z); add(rail);
  { const posts = []; for (let i = 0; i < 36; i++) { const a = i / 36 * Math.PI * 2; posts.push(boxAt(0.03, 0.92, 0.03, PLAT.x + Math.sin(a) * (PR - 0.06), 0.5, PLAT.z + Math.cos(a) * (PR - 0.06))); }
    const pm = std("#3b4370", { metalness: 0.5, roughness: 0.4 }); darkMats.push([pm, "#3b4370"]); add(new THREE.Mesh(merged(posts), pm)); }
  // lysliste i dækket langs kanten
  const edgeGlowMat = basic(C.core, { transparent: true, opacity: 0.35 });
  const edgeGlow = new THREE.Mesh(keep(new THREE.TorusGeometry(PR - 0.3, 0.012, 3, 96)), edgeGlowMat);
  edgeGlow.rotation.x = Math.PI / 2; edgeGlow.position.set(PLAT.x, 0.006, PLAT.z); add(edgeGlow);

  let exitGlowMat, exitFloorMat, roomSign, DOOR_POS;
  // trappehus med døren tilbage til forhallen
  {
    // trappehuset står forrest til venstre på terrassen, med døren vendt ind mod terrassens midte
    const DOOR_PSI = -62, dr = PR - 0.5;
    const kx = PLAT.x + Math.sin(DOOR_PSI * D2R) * dr, kz = PLAT.z - Math.cos(DOOR_PSI * D2R) * dr;
    const kr = Math.atan2(PLAT.x - kx, PLAT.z - kz) / D2R;
    const kg = kit.grp(root, `${kx} 0 ${kz}`, { rotation: `0 ${kr} 0` });
    const shell = merged([boxAt(0.25, 2.9, 1.5, -1.05, 1.45, -0.55), boxAt(0.25, 2.9, 1.5, 1.05, 1.45, -0.55), boxAt(2.35, 0.25, 1.75, 0, 2.95, -0.55), boxAt(2.35, 2.9, 0.2, 0, 1.45, -1.3)]);
    const shellMat = std("#2a3058", { roughness: 0.6 }); darkMats.push([shellMat, "#2a3058"]);
    kg.object3D.add(new THREE.Mesh(shell, shellMat));
    // lyset fra trappen ned til forhallen: en lavendel glød i døråbningen, som står tilbage, når platformen er mørk
    exitGlowMat = additive(keep(K.glowTex(C.core)), 0.35);
    const eg = new THREE.Mesh(keep(new THREE.PlaneGeometry(2.6, 3.2)), exitGlowMat); eg.position.set(0, 1.3, -0.9); kg.object3D.add(eg);
    exitFloorMat = additive(keep(K.glowTex(C.core)), 0.3);
    const ef = new THREE.Mesh(keep(new THREE.PlaneGeometry(2.4, 2.4)), exitFloorMat); ef.rotation.x = -Math.PI / 2; ef.position.set(0, 0.01, 0.6); kg.object3D.add(ef);
    DOOR_POS = new THREE.Vector3(kx, 1.3, kz);
    ctx.door(ctx.room.parent, { position: `${r3(kx)} 0 ${r3(kz)}`, rotation: `0 ${kr} 0`, width: 1.5, height: 2.4 });
    // rummets navn hænger ude over pladsen, bag tårnet
    roomSign = ctx.sign(ctx.room.name, { sub: ctx.room.sub, position: "-3.2 6.0 -14", width: 3.4, color: C.core });
  }

  /* ---------- Kernen i lille størrelse ---------- */
  const coreRig = new THREE.Group(); coreRig.position.copy(CORE); add(coreRig);
  const coreSpin = new THREE.Group(); coreRig.add(coreSpin);
  const coreMat = std(C.core, { roughness: 0.3, metalness: 0.25, emissive: new THREE.Color(C.core), emissiveIntensity: 0.35 });
  coreSpin.add(new THREE.Mesh(keep(new THREE.IcosahedronGeometry(0.42, 0)), coreMat));
  const coreEdgeMat = basic("#eef1ff", { transparent: true, opacity: 0.6 });
  coreSpin.add(new THREE.LineSegments(keep(new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(0.423, 0))), coreEdgeMat));
  const haloMat = keep(new THREE.SpriteMaterial({ map: keep(K.glowTex(C.core)), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.55, toneMapped: false }));
  const halo = new THREE.Sprite(haloMat); halo.scale.set(1.9, 1.9, 1); coreRig.add(halo);
  const coreLight = new THREE.PointLight(C.core, 3, 7, 1.5); coreLight.position.copy(CORE); add(coreLight);
  // en tynd lysstreng fra kernen ned til pladsen
  const tetherMat = basic(C.core, { transparent: true, opacity: 0.25 });
  const tether = new THREE.Mesh(keep(new THREE.CylinderGeometry(0.006, 0.006, CORE.y - G, 4, 1, true)), tetherMat);
  tether.position.set(CORE.x, (CORE.y + G) / 2, CORE.z); add(tether);

  /* ---------- Tre lysbuer mellem fløjene ---------- */
  const arcs = [["c", "b"], ["b", "a"], ["a", "c"]].map(([p, q]) => {
    const A = WING[p].top.clone(), B = WING[q].top.clone();
    const M = A.clone().add(B).multiplyScalar(0.5); M.y = Math.max(A.y, B.y) + 0.9; M.lerp(new THREE.Vector3(CORE.x, M.y, CORE.z), 0.25);
    const curve = new THREE.QuadraticBezierCurve3(A, M, B);
    const geo = keep(new THREE.TubeGeometry(curve, 48, 0.022, 4, false));
    const ca = new THREE.Color(WING[p].color), cb = new THREE.Color(WING[q].color), col = [];
    const segs = 49, rad = 5;
    for (let s = 0; s < segs; s++) { const c = ca.clone().lerp(cb, s / (segs - 1)); for (let j = 0; j < rad; j++) col.push(c.r, c.g, c.b); }
    geo.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
    const mat = keep(new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.5, toneMapped: false }));
    add(new THREE.Mesh(geo, mat));
    return { mat };
  });

  /* ---------- Stationer og views: brugeren står ved rækværket; stationen er en lille plade på håndlisten ---------- */
  // psi: retning fra terrassens centrum (0 = lige ud mod pladsen, + = mod højre); look: hvor blikket går hen
  const VIEWS = {
    s1: { psi: 0, look: [0.2, 0, -10], pitch: -9 },
    s2: { psi: -10, look: [CORE.x, CORE.y, CORE.z], pitch: 3 },
    s3: { psi: 10, look: [0.2, 0, -10], pitch: -9 },
    s4: { psi: 180, ur: 2.2, look: [-0.55, 1.35, -4.0], pitch: 2 },
  };
  const plaqueGeo = keep(new THREE.BoxGeometry(0.66, 0.17, 0.03));
  const plaqueMat = std("#2a3160", { roughness: 0.45, metalness: 0.4 });
  const viewAt = {}, plaques = {};
  const dotGeo = keep(new THREE.SphereGeometry(0.016, 8, 6)); dotGeo.translate(0, 0.025, 0);
  const dotMat = basic(C.core, { transparent: true, opacity: 0.7 });
  for (const s of ctx.steps) {
    const v = VIEWS[s.id]; if (!v) continue;
    const d = [Math.sin(v.psi * D2R), -Math.cos(v.psi * D2R)];
    const rr = PR - 0.06, ur = v.ur ?? PR - 1.05;
    const ux = PLAT.x + d[0] * ur, uz = PLAT.z + d[1] * ur;
    // pladen ligger på håndlisten, præcis hvor blikket krydser den
    let lx = v.look[0] - ux, lz = v.look[2] - uz; const ll = Math.hypot(lx, lz); lx /= ll; lz /= ll;
    const ox = ux - PLAT.x, oz = uz - PLAT.z, b = ox * lx + oz * lz, c = ox * ox + oz * oz - rr * rr;
    const tt = -b + Math.sqrt(b * b - c);
    const x = ux + lx * tt, z = uz + lz * tt;
    const face = Math.atan2(ux - x, uz - z) / D2R;
    const g = kit.grp(root, `${r3(x)} 1.0 ${r3(z)}`, { rotation: `0 ${r3(face)} 0` });
    const tilt = kit.grp(g, "0 0.03 0", { rotation: "-90 0 0" });
    tilt.object3D.add(new THREE.Mesh(plaqueGeo, plaqueMat));
    const sign = ctx.sign(s.title, { parent: tilt, position: "0 0 0.017", width: 0.64, color: C.core, size: 74 });
    const dot = new THREE.Mesh(dotGeo, dotMat); g.object3D.add(dot);      // lille lysprik: her ligger en station
    ctx.station(s.id, g);
    ctx.view(s.id, { position: [r3(ux), 0, r3(uz)], lookAt: v.look.map(r3), pitch: v.pitch });
    viewAt[s.id] = new THREE.Vector3(ux, 1.6, uz);
    plaques[s.id] = { tilt: tilt.object3D, sign, dot, k: 0 };
  }
  const VIEWS_POS = id => viewAt[id];

  /* ---------- S1: vinklerne skrevet over tagene ---------- */
  const ANGLE = {
    a: ["Teknologi som noget, vi skaber", "Digital kreativitet og design"],
    b: ["Teknologi som materielt grundlag", "Programmering og modellering"],
    c: ["Teknologi som fænomen", "Undersøgelse og stillingtagen"],
  };
  const s1View = VIEWS_POS("s1");
  for (const w of WINGS) {
    const p = w.top.clone(); p.y += w.key === "b" ? 0.75 : 0.95;
    if (w.key === "b") p.y = w.top.y + 1.0;
    const sw = 2.1 * p.distanceTo(s1View) / 8.5;
    const m = new THREE.Mesh(keep(new THREE.PlaneGeometry(sw, sw * 300 / 1024)),
      labelMat(keep(K.labelTex(ANGLE[w.key][0], w.color, { w: 1024, h: 300, size: 80, sub: ANGLE[w.key][1], ink: "#eef1ff" }))));
    m.position.copy(p); m.lookAt(s1View.x, p.y, s1View.z); m.renderOrder = 20; add(m);
    // en tynd lodlinje fra skiltet ned til taget
    const lineMat = basic(w.color, { transparent: true, opacity: 0 });
    const len = p.y - 0.16 - w.top.y, line = new THREE.Mesh(keep(new THREE.CylinderGeometry(0.008, 0.008, len, 4, 1, true)), lineMat);
    line.position.set(p.x, w.top.y + len / 2, p.z); add(line);
    w.angleSign = m; w.angleLine = lineMat;
  }

  /* ---------- S2: fem målplader samler sig om kernen ---------- */
  const GOALS = [   // samme ord som speaken
    ["a", "Arbejder iterativt med at skabe og argumenterer for deres valg"],
    ["b", "Bruger programmering som sprog og værktøj"],
    ["b", "Undersøger modellers perspektiver og bias"],
    ["c", "Undersøger digitale fænomener i deres hverdag"],
    ["c", "Tager gradvist stilling til fænomenernes betydning"],
  ];
  const RING_C = CORE.clone().add(new THREE.Vector3(0, 0.35, 0));
  const s2Look = VIEWS_POS("s2");
  const ringQ = new THREE.Quaternion(); { const o = new THREE.Object3D(); o.position.copy(CORE); o.lookAt(s2Look); ringQ.copy(o.quaternion); }
  const SLOT_A = [90, 162, 18, 234, 306];   // A øverst, B til venstre, C til højre (grader, mod uret fra +x)
  const ORDER = [0, 1, 3, 2, 4];             // målenes plads i kredsen: a, b1, c1, b2, c2
  const plates = GOALS.map(([k, txt], i) => {
    const w = WING[k], col = w.color;
    const t = tex(1024, 420, (g, W, H) => {
      g.fillStyle = "rgba(12,16,34,0.95)"; K.roundRect(g, 8, 8, W - 16, H - 16, 36); g.fill();
      g.strokeStyle = col; g.lineWidth = 8; g.stroke();
      g.fillStyle = col; g.fillRect(44, 50, 80, 10);
      g.font = '600 46px "JetBrains Mono", monospace'; g.textBaseline = "middle"; g.textAlign = "left"; g.fillText(`MÅL ${i + 1}`, 144, 56);
      g.fillStyle = "#eef1ff"; g.font = '700 68px "Familjen Grotesk", "Segoe UI", sans-serif';
      const ls = K.wrap(g, txt, W - 100); ls.forEach((l, j) => g.fillText(l, 48, 250 + (j - (ls.length - 1) / 2) * 78));
    });
    const m = new THREE.Mesh(keep(new THREE.PlaneGeometry(1.5, 0.615)), labelMat(t, { side: THREE.DoubleSide }));
    m.renderOrder = 21; add(m);
    const a = SLOT_A[ORDER.indexOf(i)] * D2R;
    const slot = new THREE.Vector3(Math.cos(a) * 2.05, Math.sin(a) * 1.0, 0).applyQuaternion(ringQ).add(RING_C);
    const from = w.top.clone().add(new THREE.Vector3((i % 2 ? 0.3 : -0.3), 0, 0));
    const mid = from.clone().lerp(slot, 0.5); mid.y = Math.max(from.y, slot.y) + 0.8;
    // en svag lysstreng fra pladen ned til den fløj, den steg op fra
    const sg = keep(new THREE.BufferGeometry()); sg.setAttribute("position", new THREE.Float32BufferAttribute([0, 0, 0, 0, 0, 0], 3));
    const strMat = keep(new THREE.LineBasicMaterial({ color: col, transparent: true, opacity: 0, toneMapped: false }));
    const str = new THREE.Line(sg, strMat); add(str);
    return { m, curve: new THREE.QuadraticBezierCurve3(from, mid, slot), delay: 600 + [0, 2, 3, 5, 6][i] * 900, col, from, str, strMat };
  });
  const ringMat = basic(C.core, { transparent: true, opacity: 0 });
  const ring = new THREE.Mesh(keep(new THREE.TorusGeometry(1, 0.008, 3, 72)), ringMat);
  ring.position.copy(RING_C); ring.quaternion.copy(ringQ); ring.scale.set(2.05, 1.0, 1); add(ring);

  /* ---------- Erkendeformernes tegn (kredser om kernen; i S3 lægger de sig langs stien) ---------- */
  function drawIcon(g, kind, label, lit) {
    const cx = 256, L = C.core, INK = "#eef1ff";
    g.clearRect(0, 0, 512, 512);
    if (lit) { const gg = g.createRadialGradient(cx, cx, 180, cx, cx, 256); gg.addColorStop(0, "rgba(201,209,255,0.5)"); gg.addColorStop(1, "rgba(201,209,255,0)"); g.fillStyle = gg; g.fillRect(0, 0, 512, 512); }
    g.fillStyle = "rgba(13,17,38,0.95)"; g.beginPath(); g.arc(cx, cx, 226, 0, 7); g.fill();
    g.strokeStyle = L; g.lineWidth = 9; g.beginPath(); g.arc(cx, cx, 222, 0, 7); g.stroke();
    g.lineCap = "round"; g.lineJoin = "round";
    function capsule(x1, y1, x2, y2, r) { const a = Math.atan2(y2 - y1, x2 - x1); g.moveTo(x1 + r * Math.cos(a + Math.PI / 2), y1 + r * Math.sin(a + Math.PI / 2)); g.arc(x2, y2, r, a + Math.PI / 2, a - Math.PI / 2, true); g.arc(x1, y1, r, a - Math.PI / 2, a + Math.PI / 2, true); g.closePath(); }
    function handShape(side) {
      g.beginPath(); g.moveTo(-46, -8); g.lineTo(46, -8); g.quadraticCurveTo(52, 60, 30, 84); g.lineTo(-30, 84); g.quadraticCurveTo(-52, 60, -46, -8); g.closePath();
      [[-34, 50], [-11, 62], [12, 58], [34, 44]].forEach(([x, l]) => capsule(x, 0, x, -l, 11.5));
      capsule(side * 40, 52, side * 78, 8, 12);
    }
    function hand(x, y, rot, s, side = -1) {
      g.save(); g.translate(x, y); g.rotate(rot); g.scale(s, s);
      g.fillStyle = L; g.strokeStyle = L; g.lineWidth = 8; handShape(side); g.stroke(); g.fill();
      g.strokeStyle = "#0d1126"; g.lineWidth = 5; [-22.5, 0.5, 23].forEach(x => { g.beginPath(); g.moveTo(x, -2); g.lineTo(x, -40); g.stroke(); });
      g.restore();
    }
    function block(x, y, s, fill) { g.fillStyle = fill; g.strokeStyle = INK; g.lineWidth = 10; g.beginPath(); g.rect(x - s / 2, y - s / 2, s, s); g.fill(); g.stroke(); }
    if (kind === 0) {
      block(206, 318, 78, "#2b3366"); block(286, 318, 78, "#2b3366"); block(246, 240, 78, "#3a4590");
      g.strokeStyle = L; g.lineWidth = 6; g.setLineDash([2, 14]); g.beginPath(); g.moveTo(246, 150); g.lineTo(246, 190); g.stroke(); g.setLineDash([]);
      hand(318, 146, Math.PI * 0.78, 0.9);
    } else if (kind === 1) {
      g.save(); g.translate(256, 196); g.transform(1, 0, -0.35, 0.55, 0, 0);
      g.fillStyle = "#3a4590"; g.strokeStyle = INK; g.lineWidth = 11; g.beginPath(); g.rect(-70, -55, 140, 110); g.fill(); g.stroke(); g.restore();
      g.strokeStyle = L; g.lineWidth = 12;
      g.beginPath(); g.arc(256, 196, 120, Math.PI * 1.08, Math.PI * 1.62); g.stroke();
      g.beginPath(); g.arc(256, 196, 120, Math.PI * 0.08, Math.PI * 0.62); g.stroke();
      const head = a => { const x = 256 + 120 * Math.cos(a), y = 196 + 120 * Math.sin(a), t = a + Math.PI / 2;
        g.fillStyle = L; g.beginPath(); g.moveTo(x + 26 * Math.cos(t), y + 26 * Math.sin(t)); g.lineTo(x + 17 * Math.cos(t + 2.2), y + 17 * Math.sin(t + 2.2)); g.lineTo(x + 17 * Math.cos(t - 2.2), y + 17 * Math.sin(t - 2.2)); g.closePath(); g.fill(); };
      head(Math.PI * 1.62); head(Math.PI * 0.62);
      hand(256, 300, 0, 0.82);
    } else {
      g.strokeStyle = L; g.lineWidth = 11; g.setLineDash([22, 18]);
      const c = [256, 232], s = 92, dx = s * 0.87, dy = s * 0.5;
      const P = { t: [c[0], c[1] - s], tr: [c[0] + dx, c[1] - dy], br: [c[0] + dx, c[1] + dy], b: [c[0], c[1] + s], bl: [c[0] - dx, c[1] + dy], tl: [c[0] - dx, c[1] - dy], m: c };
      [["t", "tr"], ["tr", "br"], ["br", "b"], ["b", "bl"], ["bl", "tl"], ["tl", "t"], ["m", "tl"], ["m", "tr"], ["m", "b"]].forEach(([a, b]) => { g.beginPath(); g.moveTo(...P[a]); g.lineTo(...P[b]); g.stroke(); });
      g.setLineDash([]);
    }
    g.fillStyle = L; g.textAlign = "center"; g.textBaseline = "middle"; g.font = '700 50px "Familjen Grotesk", "Segoe UI", sans-serif';
    g.fillText(label, cx, 418);
  }
  const ICONS = ["skabe", "omskabe", "nytænke"].map((label, i) => {
    const mat = keep(new THREE.SpriteMaterial({ map: tex(512, 512, g => drawIcon(g, i, label, false)), transparent: true, depthWrite: false, toneMapped: false }));
    const s = new THREE.Sprite(mat); s.renderOrder = 19; add(s);
    return { s, mat, ph: i * Math.PI * 2 / 3, pos: new THREE.Vector3(), lit: 0 };
  });

  /* ---------- S3: et forløb på tværs — en lysende sti Gaden → Tårnet → Atelieret ---------- */
  const PATH_STEPS = [["c", "1 · kortlægge brugen af feedet"], ["b", "2 · modellere og bygge en anbefalingsalgoritme"], ["a", "3 · designe et alternativ"]];
  const tw = WING.b, ta = WING.a, tc = WING.c;
  const pathPts = (() => {
    const P = [];
    const cStart = new THREE.Vector3(-1.4, 0.2, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), tc.grp.rotation.y).add(tc.grp.position);
    const cEnd = new THREE.Vector3(1.5, 0.2, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), tc.grp.rotation.y).add(tc.grp.position);
    P.push(cEnd, cStart.clone().lerp(cEnd, 0.5), cStart);                          // ned ad gaden
    P.push(tc.grp.position.clone().lerp(tw.grp.position, 0.5).setY(G + 0.5));     // over pladsen mod tårnet
    const tb = tw.grp.position;                                                   // op omkring tårnet i en spiral
    for (let k = 0; k <= 10; k++) { const a = -0.3 + k / 10 * Math.PI * 1.6, r = 1.2; P.push(new THREE.Vector3(tb.x + Math.cos(a) * r, G + 0.5 + k * 0.33, tb.z + Math.sin(a) * r)); }
    P.push(new THREE.Vector3(tb.x - 0.6, G + 4.4, tb.z + 0.4));                   // ud fra toppen
    P.push(tw.grp.position.clone().lerp(ta.grp.position, 0.5).setY(G + 3.6));     // bue over mod atelieret
    const aTop = ta.top.clone(); P.push(aTop.clone().add(new THREE.Vector3(0.3, 0.7, -0.2)));
    P.push(ta.grp.position.clone().add(new THREE.Vector3(0, 0.75, 0)));            // ind i atelieret
    return P;
  })();
  const pathCurve = new THREE.CatmullRomCurve3(pathPts, false, "centripetal");
  const pathGeo = keep(new THREE.TubeGeometry(pathCurve, 220, 0.045, 6, false));
  { const segs = 221, rad = 7, col = []; const cc = new THREE.Color(C.c), cb = new THREE.Color(C.b), ca = new THREE.Color(C.a), wht = new THREE.Color("#ffffff");
    for (let s = 0; s < segs; s++) { const t = s / (segs - 1); const c = t < 0.4 ? cc.clone().lerp(cb, ease((t - 0.12) / 0.28)) : cb.clone().lerp(ca, ease((t - 0.7) / 0.22)); c.lerp(wht, 0.25);
      for (let j = 0; j < rad; j++) col.push(c.r, c.g, c.b); }
    pathGeo.setAttribute("color", new THREE.Float32BufferAttribute(col, 3)); }
  const pathMat = keep(new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: false }));
  const pathMesh = new THREE.Mesh(pathGeo, pathMat); add(pathMesh);
  const pathCount = pathGeo.index.count;
  const headMat = keep(new THREE.SpriteMaterial({ map: keep(K.glowTex("#ffffff")), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }));
  const head = new THREE.Sprite(headMat); head.scale.set(0.9, 0.9, 1); add(head);
  // hvor stien passerer erkendeformernes tegn: på strækningerne MELLEM fløjene (tegnene hører ikke til et område)
  const ICON_T = [0.2, 0.62, 0.84];
  const iconPathPos = ICON_T.map(t => { const p = pathCurve.getPointAt(t); return p.add(new THREE.Vector3(0, 0.55, 0.25)); });
  // trinmærker ved hver fløj
  const s3View = VIEWS_POS("s3");
  const pathLabels = PATH_STEPS.map(([k, txt], i) => {
    const w = WING[k];
    // mærket står mellem fløjen og pladsens midte, så alle tre er inden for billedet; bredden følger afstanden
    const mid = new THREE.Vector3(0.6, 0, -8.6);
    const p = w.grp.position.clone().lerp(mid, k === "b" ? 0.15 : 0.45); p.y = k === "b" ? w.top.y + 0.35 : w.top.y + 0.55;
    const lw = 2.5 * p.distanceTo(s3View) / 8.5;
    const m = new THREE.Mesh(keep(new THREE.PlaneGeometry(lw, lw * 220 / 1024)), labelMat(keep(K.labelTex(txt, w.color, { w: 1024, h: 220, size: txt.length > 30 ? 56 : 66, ink: "#eef1ff" }))));
    m.position.copy(p); m.lookAt(s3View.x, p.y, s3View.z); m.renderOrder = 20; add(m);
    return { m, t: [0.04, 0.5, 0.93][i] };
  });

  /* ---------- S4: det åbne felt ---------- */
  const s4View = VIEWS_POS("s4");
  // et stiplet felt: en tidslinje, hvor det meste endnu ikke er skrevet. Kun overskrifter, ingen brødtekst.
  const MILE = [["Undervisning og evaluering", "pladsholder"], ["Afprøvning", "efterår 2026"], ["Ikrafttræden", "2027/28"], ["Prøve", "året efter"]];
  const dashTex = tex(1600, 900, (g, W, H) => {
    g.clearRect(0, 0, W, H);
    g.fillStyle = "rgba(9,12,28,0.55)"; K.roundRect(g, 14, 14, W - 28, H - 28, 50); g.fill();
    g.strokeStyle = C.core; g.lineWidth = 9; g.setLineDash([40, 28]); g.lineCap = "round";
    K.roundRect(g, 14, 14, W - 28, H - 28, 50); g.stroke();
    g.fillStyle = C.core; g.font = '700 70px "Familjen Grotesk", "Segoe UI", sans-serif'; g.textAlign = "left"; g.textBaseline = "middle";
    g.fillText("Endnu ikke på plads", 80, 110);
    const y = 470, x0 = 150, x1 = W - 150;
    g.setLineDash([22, 22]); g.lineWidth = 8; g.globalAlpha = 0.8; g.beginPath(); g.moveTo(x0 - 40, y); g.lineTo(x1 + 40, y); g.stroke(); g.globalAlpha = 1; g.setLineDash([]);
    MILE.forEach(([a, b], i) => {
      const x = x0 + i * (x1 - x0) / 3;
      g.strokeStyle = C.core; g.lineWidth = 7; g.setLineDash(i === 0 ? [10, 10] : []);
      g.fillStyle = i === 0 ? "rgba(9,12,28,1)" : C.core; g.beginPath(); g.arc(x, y, 24, 0, 7); g.fill(); g.stroke(); g.setLineDash([]);
      g.textAlign = "center"; g.fillStyle = "#eef1ff"; g.font = '700 54px "Familjen Grotesk", "Segoe UI", sans-serif';
      K.wrap(g, a, 330).forEach((l, j, arr) => g.fillText(l, x, y - 90 - (arr.length - 1 - j) * 60));
      g.fillStyle = C.core; g.font = '500 48px "Source Sans 3", "Segoe UI", sans-serif'; g.fillText(b, x, y + 80);
    });
    // et tomt, stiplet felt nederst: her skrives det, der kommer
    g.strokeStyle = C.core; g.globalAlpha = 0.6; g.lineWidth = 6; g.setLineDash([18, 18]);
    K.roundRect(g, 120, 650, W - 240, 160, 26); g.stroke(); g.globalAlpha = 1; g.setLineDash([]);
  });
  const FW = 2.9;
  const field = new THREE.Mesh(keep(new THREE.PlaneGeometry(FW, FW * 900 / 1600)), labelMat(dashTex, { side: THREE.DoubleSide }));
  field.position.copy(CORE).add(new THREE.Vector3(1.95, -0.05, 1.2)); field.lookAt(s4View); field.renderOrder = 20; add(field);

  // S4: tegnene i en bue over kernen, vendt mod S4-blikket
  const satPos = (() => {
    const o = new THREE.Object3D(); o.position.copy(CORE); o.lookAt(VIEWS_POS("s4")); o.updateMatrixWorld();
    return [[-0.95, 0.15], [0, 0.85], [0.95, 0.15]].map(([x, y]) => new THREE.Vector3(x, y, 0.15).applyMatrix4(o.matrixWorld));
  })();

  /* ---------- Tilstand pr. trin ---------- */
  let step = null, stepAt = 0;
  const now = () => performance.now();
  const S = { core: 1, arcs: 0.5, dark: 0, plates: 0, path: 0, field: 0, sat: 0, hideIcons: 0 };
  const T = { ...S };
  function onStep(id) {
    step = id; stepAt = now();
    T.core = id === "s4" ? 0.12 : 1;
    T.dark = id === "s4" ? 1 : 0;
    T.plates = id === "s2" ? 1 : 0;
    T.path = id === "s3" ? 1 : 0;
    T.field = id === "s4" ? 1 : 0;
    T.sat = id === "s4" ? 1 : 0;              // S4: tegnene samler sig som tydelige satellitter om kernen (som i forhallen)
    T.hideIcons = id === "s1" ? 1 : 0;        // S1 handler om fløjene; tegnene ville kun være støj
    T.arcs = id === "s1" ? 0.35 : id === "s3" ? 0.15 : 0.5;
  }

  const WING_AT = { a: 1300, b: 4300, c: 7300 };      // S1: fløjene lyser op én efter én
  const tmp = new THREE.Vector3();
  function tick(t, dt) {
    if (!step) return;
    dt = Math.min(dt, 250);
    const el = now() - stepAt;
    for (const k of Object.keys(T)) S[k] = approach(S[k], T[k], dt, k === "dark" || k === "core" ? 0.45 : 3.5);
    const dark = ease(S.dark);

    // himmel, stjerner og terrasse bliver mørkere i S4
    // S4: platformen bliver rigtig mørk; kun kernen, feltet, tegnene og udgangen lyser til sidst
    sky.material.color.setScalar(1 - 0.9 * dark);
    starMat.opacity = 0.35 + 0.6 * dark;
    deckMat.color.setScalar(1 - 0.88 * dark);
    groundMat.color.setScalar(1 - 0.92 * dark);
    farMat.color.set("#0b0d1f").multiplyScalar(1 - 0.6 * dark);
    railMat.opacity = 0.85 * (1 - 0.85 * dark); edgeGlowMat.opacity = 0.35 * (1 - 0.9 * dark);
    darkMats.forEach(([m, c]) => m.color.set(c).multiplyScalar(1 - 0.85 * dark));
    drumMat.emissiveIntensity = 0.3 * (1 - 0.9 * dark); drumMat.color.set("#252b50").multiplyScalar(1 - 0.8 * dark);

    // stationspladerne: den aktive rejser sig fra håndlisten, de andre ligger fladt
    for (const [id, pq] of Object.entries(plaques)) {
      pq.k = approach(pq.k, id === step ? 1 : 0, dt, 5);
      const e = ease(pq.k);
      pq.tilt.rotation.x = (-90 + 30 * e) * D2R; pq.tilt.position.y = 0.03 + 0.03 * e;
      pq.tilt.scale.setScalar(Math.max(0.001, e)); pq.tilt.visible = e > 0.02; pq.dot.visible = e < 0.5;
    }
    // fløjene
    for (const w of WINGS) {
      let lit;
      if (step === "s1") lit = ease((el - WING_AT[w.key]) / 900);
      else if (step === "s3") lit = 0.35;
      else if (step === "s2") lit = 0.4;
      else lit = 0.3;
      w.lit = step === "s1" ? lit : approach(w.lit, lit, dt, 3);
      const L = w.lit * (1 - dark);
      w.bodyMat.emissiveIntensity = (0.3 + 1.0 * L) * (1 - 0.95 * dark);
      w.bodyMat.color.set("#2d3358").multiplyScalar(1 - 0.8 * dark);
      w.edgeMat.opacity = (0.18 + 0.8 * L) * (1 - 0.85 * dark);
      w.plinthMat.emissiveIntensity = (0.06 + 0.7 * L) * (1 - dark); w.plinthMat.color.set(w.color).multiplyScalar(1 - 0.85 * dark);
      if (w.cableMat) w.cableMat.emissiveIntensity = (0.2 + 0.6 * L) * (1 - dark);
      w.poolMat.opacity = 0.75 * L;
      if (w.lampMat) w.lampMat.color.set("#ffe0d0").multiplyScalar(0.3 + 0.7 * (1 - dark));
      const sv = step === "s1" ? ease((el - WING_AT[w.key] - 200) / 700) : approach(w.angleSign.material.opacity, 0, dt, 6);
      w.angleSign.material.opacity = sv; w.angleSign.visible = sv > 0.01;
      w.angleLine.opacity = sv * 0.7;
    }
    // lysbuerne: tændes, når alle tre fløje er nævnt i S1 (samme samspil)
    const arcBoost = step === "s1" ? ease((el - 9000) / 1500) : 0;
    arcs.forEach(a => { a.mat.opacity = (S.arcs + 0.6 * arcBoost) * (1 - dark); });

    // kernen
    coreSpin.rotation.set(0.4, t * 0.00025, 0.15);
    coreRig.position.y = CORE.y + Math.sin(t * 0.0012) * 0.035;
    const cg = S.core;
    coreMat.emissiveIntensity = 0.05 + 0.45 * cg; coreMat.color.set(C.core).multiplyScalar(0.3 + 0.7 * cg);
    coreEdgeMat.opacity = 0.1 + 0.55 * cg;
    haloMat.opacity = 0.08 + 0.5 * cg; coreLight.intensity = 3 * cg;
    plazaGlowMat.opacity = 0.5 * cg; tetherMat.opacity = 0.25 * cg;

    // S2: målpladerne
    plates.forEach(p => {
      const k = step === "s2" ? ease((el - p.delay) / 1400) : 0;
      p.vis = step === "s2" ? k : approach(p.vis || 0, 0, dt, 6);      // egen tilstand, så udfadningen ikke modvirkes
      p.m.visible = p.vis > 0.01; p.m.material.opacity = Math.min(1, p.vis * 1.4);
      if (step === "s2") { p.curve.getPoint(k, tmp); p.m.position.copy(tmp); p.m.quaternion.copy(ringQ); p.m.scale.setScalar(0.35 + 0.65 * k); }
      const pa = p.str.geometry.attributes.position; pa.setXYZ(0, p.from.x, p.from.y, p.from.z); pa.setXYZ(1, p.m.position.x, p.m.position.y - 0.3 * p.m.scale.y, p.m.position.z); pa.needsUpdate = true;
      p.strMat.opacity = p.vis * 0.55; p.str.visible = p.vis > 0.01;
    });
    ringMat.opacity = (step === "s2" ? ease((el - 3200) / 1000) : 0) * 0.45; ring.visible = ringMat.opacity > 0.01;

    // S3: stien vokser frem
    const pk = step === "s3" ? ease((el - 300) / 7000) : 0;
    const cnt = Math.floor(pathCount * pk / 3) * 3;
    pathGeo.setDrawRange(0, cnt); pathMesh.visible = cnt > 0;
    head.visible = step === "s3" && pk > 0.001 && pk < 0.999;
    if (head.visible) { pathCurve.getPointAt(Math.min(pk, 1), tmp); head.position.copy(tmp); headMat.opacity = 0.9; }
    pathLabels.forEach(l => { const o = step === "s3" ? ease((pk - l.t + 0.08) / 0.1) : 0; l.m.material.opacity = o; l.m.visible = o > 0.01; });

    // erkendeformernes tegn
    const onPath = ease(S.path), sat = ease(S.sat), hideI = ease(S.hideIcons);
    ICONS.forEach((ic, i) => {
      const a = ic.ph + t * 0.0003;
      const orbit = tmp.set(Math.sin(a) * 0.75, 0.12 * Math.sin(a * 2 + ic.ph), Math.cos(a) * 0.75).add(coreRig.position);
      ic.pos.copy(orbit).lerp(iconPathPos[i], onPath).lerp(satPos[i], sat);
      ic.s.position.copy(ic.pos);
      const litNow = step === "s3" && pk >= ICON_T[i] ? 1 : 0;
      ic.lit = approach(ic.lit, litNow, dt, 6);
      const base = 0.26 + 0.12 * onPath;
      const pulse = ic.lit > 0.5 ? 1 + 0.08 * Math.sin(t * 0.006 + i) : 1;
      const sz = (base + 0.5 * onPath * (0.5 + 0.5 * ic.lit) + 0.35 * ic.lit) * pulse;
      const ssz = sz * (1 - sat) + 0.62 * sat;
      ic.s.scale.set(ssz, ssz, 1);
      ic.mat.opacity = (0.75 + 0.25 * ic.lit) * (onPath > 0.05 ? (0.45 + 0.55 * ic.lit) : 1) * (1 - hideI);
      ic.mat.color.setScalar(0.65 + 0.35 * Math.max(ic.lit, 1 - onPath, sat)); ic.s.visible = ic.mat.opacity > 0.01;
    });

    // S4: det stiplede felt; stregerne "løber"
    const fv = ease((S.field - 0.05) / 0.95);
    field.material.opacity = fv * (0.9 + 0.1 * Math.sin(t * 0.003)); field.visible = fv > 0.01;
    // udgangen: gløden står tilbage, når platformen bliver mørk
    exitGlowMat.opacity = 0.3 + 0.5 * dark; exitFloorMat.opacity = 0.25 + 0.5 * dark;
    const rsm = roomSign.getObject3D("mesh"); if (rsm) { const o = step === "s2" || step === "s4" ? 0 : 1; rsm.material.opacity = approach(rsm.material.opacity, o, dt, 4); roomSign.object3D.visible = rsm.material.opacity > 0.02; }
  }

  function dispose() { disposables.forEach(d => d && d.dispose && d.dispose()); }
  return { onStep, tick, dispose };
}
