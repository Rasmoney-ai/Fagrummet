/* Hal C · Gaden — Undersøgelse og stillingtagen.
   En stiliseret gade i skumring: busstoppested, kiosk, et vindue ind til en stue, skærme overalt
   og en server i det fjerne. Tre døre til delrummene, én tilbage til Forhallen, og målpladen ved udgangen.
   c0-1: gaden vågner, og lyslinjer forbinder telefonen med personen, gaden og serveren.
   c0-2: målpladen lyser op, og en pil går fra "undersøge" til "tage stilling". */

export default function build(ctx) {
  const { THREE, K, kit, C, root } = ctx;
  const D = Math.PI / 180;
  const ROSE = C.c;

  /* ---------- Hjælpere: samlet statisk geometri med vertex-farver (én draw call pr. materiale) ---------- */
  function batch() {
    const parts = [], ranges = [];
    function add(geo, color, p = [0, 0, 0], r = [0, 0, 0], s = 1) {
      let g = geo.index ? geo.toNonIndexed() : geo;
      for (const k of Object.keys(g.attributes)) if (k !== "position" && k !== "normal") g.deleteAttribute(k);
      const sv = Array.isArray(s) ? s : [s, s, s];
      g.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(...p), new THREE.Quaternion().setFromEuler(new THREE.Euler(r[0] * D, r[1] * D, r[2] * D)), new THREE.Vector3(...sv)));
      const c = new THREE.Color(color), n = g.attributes.position.count, a = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) { a[i * 3] = c.r; a[i * 3 + 1] = c.g; a[i * 3 + 2] = c.b; }
      g.setAttribute("color", new THREE.BufferAttribute(a, 3));
      const start = parts.reduce((s2, x) => s2 + x.attributes.position.count, 0);
      parts.push(g); ranges.push([start, n]);
      return ranges.length - 1;
    }
    return {
      add,
      box: (w, h, d, c, p, r, s) => add(new THREE.BoxGeometry(w, h, d), c, p, r, s),
      cyl: (rt, rb, h, c, p, r, seg = 10) => add(new THREE.CylinderGeometry(rt, rb, h, seg), c, p, r),
      sph: (rad, c, p, seg = 10) => add(new THREE.SphereGeometry(rad, seg, Math.max(4, Math.round(seg * 0.6))), c, p),
      ranges,
      build(material) {
        const g = THREE.BufferGeometryUtils.mergeGeometries(parts, false);
        parts.forEach(x => x.dispose()); g.computeBoundingSphere();
        return new THREE.Mesh(g, material);
      },
    };
  }
  const litMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.8, metalness: 0.05, flatShading: true });
  const glowMat = new THREE.MeshBasicMaterial({ vertexColors: true });
  const addObj = (obj, parent = root, pos = "0 0 0") => { const e = kit.grp(parent, pos); e.setObject3D("mesh", obj); obj.traverse(o => { o.el = e; }); return e; };
  const basic = (o = {}) => new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, ...o });
  const quad = (w, h, mat) => new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
  const FONT = (wgt, px) => `${wgt} ${px}px "Familjen Grotesk", "Segoe UI", system-ui, sans-serif`;
  const BODY = (wgt, px) => `${wgt} ${px}px "Source Sans 3", "Segoe UI", system-ui, sans-serif`;
  const lerp = (a, b, k) => a + (b - a) * k;
  const ease = x => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));
  const clamp01 = x => Math.max(0, Math.min(1, x));
  function setSignOpacity(el, o) { const m = el.getObject3D("mesh"); if (m) m.material.opacity = o; }

  ctx.env({ background: "#141432", fog: "type: exponential; color: #241d44; density: 0.028" });

  /* ---------- Himmel i skumring ---------- */
  const skyTex = K.canvasTexture(64, 512, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, 0, h);
    gr.addColorStop(0, "#0d1030"); gr.addColorStop(0.32, "#1f1d4d"); gr.addColorStop(0.47, "#5a2f63");
    gr.addColorStop(0.53, "#b4566f"); gr.addColorStop(0.58, "#3b2650"); gr.addColorStop(1, "#151330");
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
  });
  const sky = new THREE.Mesh(new THREE.SphereGeometry(48, 24, 14), new THREE.MeshBasicMaterial({ map: skyTex, side: THREE.BackSide, fog: false, depthWrite: false }));
  addObj(sky);
  // stjerner (ét Points-objekt)
  {
    const n = 140, pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, el = (12 + Math.random() * 60) * D, r = 44;
      pos[i * 3] = Math.cos(a) * Math.cos(el) * r; pos[i * 3 + 1] = Math.sin(el) * r; pos[i * 3 + 2] = Math.sin(a) * Math.cos(el) * r;
    }
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    addObj(new THREE.Points(g, new THREE.PointsMaterial({ color: "#c9d1ff", size: 0.12, fog: false, transparent: true, opacity: 0.7 })));
  }

  /* ---------- Statisk gade ---------- */
  const S = batch();     // belyst
  const G = batch();     // selvlysende (uden lys)
  // fortov nær (brugeren står her), kantsten, vej (sænket), fortov fjernt
  S.box(24, 0.3, 10.6, "#3a3d52", [0, -0.15, 6.3]);
  S.box(24, 0.18, 0.22, "#6d7088", [0, -0.06, 1.05]);
  S.box(24, 0.3, 4.4, "#1f2133", [0, -0.3, -1.2]);
  S.box(24, 0.18, 0.22, "#6d7088", [0, -0.06, -3.35]);
  S.box(24, 0.3, 2.4, "#363a4f", [0, -0.15, -4.6]);
  // fliser: tynde fuger på det nære fortov
  for (let x = -11; x <= 11; x += 1.5) S.box(0.025, 0.01, 10.4, "#2c2f42", [x, 0.003, 6.3]);
  for (let z = 1.9; z < 11.4; z += 1.5) S.box(24, 0.01, 0.025, "#2c2f42", [0, 0.003, z]);
  // vejstriber og fodgængerovergang ud for døren til "Bag skærmen"
  for (let x = -11; x < 11; x += 2.2) if (Math.abs(x - 0.4) > 1.8) S.box(1.1, 0.01, 0.1, "#9a9cae", [x, -0.145, -1.2]);
  for (let i = -3; i <= 3; i++) S.box(0.34, 0.01, 3.8, "#b9bccb", [0.4 + i * 0.62, -0.145, -1.2]);

  // facader langs z = -6.6
  const FZ = -5.8;
  const bld = [
    { x0: -11, x1: -6.8, h: 6.6, c: "#272a40" },
    { x0: -6.8, x1: -1.6, h: 5.3, c: "#3b2c3c" },   // hus med stuevindue og dør til Stuen
    { x0: -1.6, x1: 2.4, h: 5.3, c: "#2e3446" },    // værksted: Bag skærmen
    { x0: 2.4, x1: 7.4, h: 6.9, c: "#33354a" },     // forsamlingshus
    { x0: 7.4, x1: 11, h: 5.6, c: "#262a3d" },
  ];
  for (const b of bld) {
    const w = b.x1 - b.x0, cx = (b.x0 + b.x1) / 2;
    S.box(w, b.h, 1.2, b.c, [cx, b.h / 2, FZ - 0.6]);
    S.box(w + 0.1, 0.18, 1.35, "#1a1c2b", [cx, b.h + 0.09, FZ - 0.6]);     // tagkant
    S.box(w, 0.12, 0.08, "#4a4d66", [cx, 2.95, FZ + 0.03]);                 // gesims over stueetagen
  }
  // forsamlingshusets søjler og trappe
  for (const x of [3.0, 6.8]) S.box(0.36, 2.9, 0.36, "#4b4d66", [x, 1.45, FZ + 0.2]);
  S.box(3.2, 0.12, 0.6, "#4a4c63", [4.9, 0.06, FZ + 0.32]);
  // værkstedets rulleport-ramme
  S.box(2.6, 0.14, 0.14, "#5a6078", [0.4, 2.85, FZ + 0.08]);

  // vinduer på øverste etager: hvert vindue er et område i det selvlysende batch, så de kan tændes enkeltvis
  const windows = [];
  const WARM = ["#ffcf8a", "#ffd9a0", "#f7b977"], SCREEN = ["#86b4ff", "#a6c6ff", "#c3a3ff"];
  for (const b of bld) {
    for (let y = 3.6; y < b.h - 0.6; y += 1.3) {
      for (let x = b.x0 + 0.75; x < b.x1 - 0.5; x += 1.15) {
        const kind = Math.random();
        const lit = kind < 0.42 ? WARM[(x * 7 + y) % 3 | 0] : kind < 0.8 ? SCREEN[(x * 3 + y) % 3 | 0] : "#1a1d2e";
        S.box(0.84, 1.0, 0.06, "#1d1f30", [x, y, FZ + 0.01]);
        const id = G.box(0.7, 0.86, 0.04, "#000000", [x, y, FZ + 0.05]);
        windows.push({ id, lit: new THREE.Color(lit), delay: Math.random(), screen: kind >= 0.42 && kind < 0.8 });
      }
    }
  }
  // gadens bagside: lave huse bag brugeren, så gaden er lukket
  for (const [x0, x1, h, c] of [[-12, -6.5, 5.2, "#25283b"], [-6.5, -1, 4.0, "#2d2a3d"], [-1, 4.5, 5.8, "#272b3e"], [4.5, 12, 4.6, "#2a2c40"]]) {
    S.box(x1 - x0, h, 1.2, c, [(x0 + x1) / 2, h / 2, 12.2]);
    for (let y = 1.6; y < h - 0.5; y += 1.4) for (let x = x0 + 0.8; x < x1 - 0.5; x += 1.3)
      (Math.random() < 0.45 ? G : S).box(0.7, 0.85, 0.05, Math.random() < 0.5 ? "#ffcf8a" : Math.random() < 0.6 ? "#8fb2f0" : "#1d1f30", [x, y, 11.58]);
  }
  for (const sx of [-1, 1]) {
    S.box(1.0, 5.4, 18, "#24273a", [sx * 12.4, 2.7, 3.2]);
    for (let z = -4; z < 11.5; z += 1.4) for (let y = 1.8; y < 5; y += 1.4)
      (Math.random() < 0.4 ? G : S).box(0.05, 0.85, 0.7, Math.random() < 0.5 ? "#ffcf8a" : Math.random() < 0.6 ? "#8fb2f0" : "#1d1f30", [sx * 11.88, y, z]);
  }
  // vinduet ind til stuen (stueetagen i huset), med karm og sålbænk
  const SW = { x: -5.0, y: 1.55, w: 2.0, h: 1.4 };
  S.box(SW.w + 0.2, 0.1, 0.2, "#5d4b55", [SW.x, SW.y - SW.h / 2 - 0.05, FZ + 0.1]);
  S.box(SW.w + 0.2, 0.08, 0.1, "#5d4b55", [SW.x, SW.y + SW.h / 2 + 0.04, FZ + 0.05]);
  for (const dx of [-SW.w / 2 - 0.05, 0, SW.w / 2 + 0.05]) S.box(0.07, SW.h, 0.1, "#5d4b55", [SW.x + dx, SW.y, FZ + 0.06]);

  // gadelygter
  const lamps = [[-6.2, 1.25], [9.0, 1.25], [-9.6, -3.65], [9.4, -3.65]];
  for (const [x, z] of lamps) {
    const dir = z > 0 ? -1 : 1;
    S.cyl(0.06, 0.08, 4.2, "#4a4e63", [x, 2.1, z], [0, 0, 0], 8);
    S.box(0.08, 0.08, 0.9, "#4a4e63", [x, 4.15, z + dir * 0.42]);
    S.box(0.36, 0.1, 0.22, "#3a3d50", [x, 4.1, z + dir * 0.86]);
    G.box(0.3, 0.04, 0.16, "#ffe2b0", [x, 4.04, z + dir * 0.86]);
  }

  /* busstoppested (venstre, nær side) */
  const BS = { x: -2.6, z: 1.9 };
  S.box(3.0, 0.08, 1.3, "#2b2f42", [BS.x, 2.45, BS.z + 0.2]);                      // tag
  for (const dx of [-1.42, 1.42]) S.box(0.07, 2.45, 0.07, "#585d74", [BS.x + dx, 1.22, BS.z + 0.75]);
  for (const dx of [-1.42, 1.42]) S.box(0.07, 2.45, 0.07, "#585d74", [BS.x + dx, 1.22, BS.z - 0.35]);
  S.box(1.6, 0.06, 0.38, "#6b5a63", [BS.x + 0.5, 0.48, BS.z + 0.55]);              // bænk
  S.box(0.06, 0.45, 0.06, "#585d74", [BS.x - 0.2, 0.24, BS.z + 0.55]);
  S.box(0.06, 0.45, 0.06, "#585d74", [BS.x + 1.2, 0.24, BS.z + 0.55]);
  // stoppestedsskilt: stang med rundt skilt (neutralt bussymbol tegnes på tekstur)
  S.cyl(0.035, 0.035, 2.9, "#6d7088", [BS.x - 1.85, 1.45, BS.z - 0.25], [0, 0, 0], 8);
  // køreplansskærm på stolpen
  S.box(0.52, 0.32, 0.06, "#1a1c2a", [BS.x + 1.42, 1.85, BS.z - 0.35]);

  /* kiosk (højre, nær side) */
  const KS = { x: 5.6, z: 2.3, ry: -32 };
  const kiosk = new THREE.Group(); kiosk.position.set(KS.x, 0, KS.z); kiosk.rotation.y = KS.ry * D;
  const KSb = batch(), KSg = batch();
  KSb.box(2.4, 2.5, 1.7, "#4a2a36", [0, 1.25, 0]);
  KSb.box(2.6, 0.12, 1.9, "#2a1b24", [0, 2.56, 0]);
  KSb.box(2.2, 0.08, 0.55, "#5e4048", [0, 1.02, 1.06]);                        // disk
  KSb.box(2.2, 1.0, 0.06, "#2a1b24", [0, 0.5, 0.86]);
  for (let i = 0; i < 7; i++) KSb.box(0.36, 0.05, 0.8, i % 2 ? "#f0e6ea" : ROSE, [-1.08 + i * 0.36, 2.28, 1.2], [-24, 0, 0]);   // markise
  for (let i = 0; i < 6; i++) KSb.box(0.22, 0.3, 0.03, ["#c9d1ff", "#ffcf8a", "#8fd694", "#e8a0b8", "#86b4ff", "#ffe08a"][i], [-1.0 + i * 0.24, 1.25, 1.24], [-15, 0, 0]);  // blade i stativ
  KSg.box(2.0, 0.95, 0.04, "#ffcf9a", [0, 1.6, 0.86]);                         // oplyst åbning
  KSg.box(0.12, 0.06, 0.18, "#9fe3a0", [0.75, 1.1, 1.12]);                     // betalingsterminal
  kiosk.add(KSb.build(litMat), KSg.build(glowMat));
  addObj(kiosk);
  const kioskSign = quad(1.7, 0.36, basic({ map: K.canvasTexture(512, 108, (g, w, h) => {
    g.fillStyle = "#1a0f16"; K.roundRect(g, 2, 2, w - 4, h - 4, 18); g.fill();
    g.shadowColor = ROSE; g.shadowBlur = 18; g.fillStyle = "#ffd3e0"; g.font = FONT(700, 66); g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("KIOSK", w / 2, h / 2 + 4);
  }) }));
  kioskSign.position.set(0, 2.82, 0.9); kiosk.add(kioskSign);
  // reklameskærm på kioskens side (skifter farver)
  const kioskScreen = quad(1.1, 1.4, basic({ map: K.canvasTexture(256, 320, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, "#ff9ab8"); gr.addColorStop(1, "#7f6bff");
    g.fillStyle = gr; g.fillRect(0, 0, w, h); g.fillStyle = "rgba(255,255,255,0.9)"; g.beginPath(); g.arc(w * 0.5, h * 0.42, 62, 0, 7); g.fill();
    g.fillStyle = "#2a1b34"; K.roundRect(g, 40, h - 78, w - 80, 36, 18); g.fill();
  }) }));
  kioskScreen.position.set(-1.215, 1.35, 0.1); kioskScreen.rotation.y = -90 * D; kiosk.add(kioskScreen);

  /* datacenter i det fjerne: en lav, bred hal med køleaggregater på taget og en kabelmast, der fører ned mod gaden */
  const SV = { x: 0.6, z: -11 };
  // datacentret rager op bag værkstedet: høj, bred hal med køleaggregater og blinkende rack-fronter øverst
  S.box(7.0, 8.6, 3.6, "#1b1e2e", [SV.x, 4.3, SV.z - 0.6]);
  S.box(7.2, 0.15, 3.8, "#2b3046", [SV.x, 8.65, SV.z - 0.6]);
  for (let i = 0; i < 4; i++) { S.box(1.2, 0.7, 1.4, "#2f3550", [SV.x - 2.7 + i * 1.8, 9.05, SV.z - 0.6]); S.cyl(0.42, 0.42, 0.06, "#4a5272", [SV.x - 2.7 + i * 1.8, 9.43, SV.z - 0.6], [0, 0, 0], 12); }
  for (let y = 4.6; y < 8.4; y += 0.5) S.box(6.4, 0.04, 0.04, "#2b3046", [SV.x, y, SV.z + 1.22]);
  // kabelmast på taget af værkstedet (Bag skærmen), med kabler hen til datacentret
  S.box(0.12, 3.0, 0.12, "#3b4058", [SV.x - 0.2, 5.7, -7.0]);
  S.box(0.9, 0.08, 0.08, "#3b4058", [SV.x - 0.2, 7.1, -7.0]);
  const ledTex = on => K.canvasTexture(128, 512, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    for (let y = 8; y < h; y += 14) for (let x = 10; x < w; x += 16) {
      const r = Math.random(); if (r < (on ? 0.45 : 0.3)) { g.fillStyle = r < 0.06 ? "#ff7aa2" : r < 0.2 ? "#9fe3a0" : "#86b4ff"; g.fillRect(x, y, 7, 4); }
    }
  });
  const ledA = quad(6.4, 3.6, basic({ map: ledTex(true), blending: THREE.AdditiveBlending, fog: false })), ledB = quad(6.4, 3.6, basic({ map: ledTex(false), blending: THREE.AdditiveBlending, fog: false }));
  ledA.position.set(SV.x, 6.5, SV.z + 1.22); ledB.position.set(SV.x, 6.5, SV.z + 1.225);
  const serverG = new THREE.Group(); serverG.add(ledA, ledB); addObj(serverG);
  G.sph(0.12, ROSE, [SV.x - 0.2, 7.25, -7.0], 8);
  { const dl = quad(2.2, 0.42, basic({ map: K.canvasTexture(520, 100, (g, w, h) => { g.fillStyle = "rgba(14,12,26,0.85)"; K.roundRect(g, 3, 3, w - 6, h - 6, 30); g.fill(); g.fillStyle = "#c9d1ff"; g.font = '600 54px "Source Sans 3", sans-serif'; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("datacenter", w / 2, h / 2 + 2); }), fog: false })); dl.position.set(SV.x - 1.6, 8.0, SV.z + 1.3); addObj(dl); }

  const statics = S.build(litMat); addObj(statics);
  const glowMesh = G.build(glowMat); addObj(glowMesh);
  const gcol = glowMesh.geometry.attributes.color;
  // husk vinduernes position i det samlede batch (rækkefølgen er bevaret ved sammenfletning)
  const setRangeColor = (id, c) => { const [s0, n] = G.ranges[id]; for (let i = s0; i < s0 + n; i++) gcol.setXYZ(i, c.r, c.g, c.b); };

  // lyskegler på jorden fra gadelygterne (én samlet geometri med uv, additiv)
  {
    const pools = lamps.map(([x, z]) => { const g = new THREE.PlaneGeometry(3.6, 3.6); g.rotateX(-90 * D); g.translate(x, z > 0 ? 0.01 : 0.01, z + (z > 0 ? -0.86 : 0.86)); return g; });
    const g = THREE.BufferGeometryUtils.mergeGeometries(pools);
    addObj(new THREE.Mesh(g, basic({ map: K.glowTex("#ffd9a8"), blending: THREE.AdditiveBlending, opacity: 0.55 })));
  }
  // to ekstra lyskilder: varmt fra kiosken, koldt skærmlys ved stoppestedet
  addObj(Object.assign(new THREE.PointLight("#ffb98a", 7, 9, 1.6), {}), root, `${KS.x - 0.6} 2.2 ${KS.z + 1.6}`);
  addObj(new THREE.PointLight("#9ab8ff", 5, 7, 1.6), root, `${BS.x} 2.0 ${BS.z + 0.6}`);

  /* ---------- Skærme overalt ---------- */
  // reklametavle på bygningen til venstre
  const billTex = K.canvasTexture(512, 256, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, w, 0); gr.addColorStop(0, "#2a2a7a"); gr.addColorStop(1, "#b04a7a");
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    // opfundet, neutralt motiv: en stor sol over bølger og en kort tekstlinje (ingen kendte symboler)
    g.fillStyle = "rgba(255,226,170,0.95)"; g.beginPath(); g.arc(150, 110, 62, 0, 7); g.fill();
    g.strokeStyle = "rgba(255,255,255,0.85)"; g.lineWidth = 10; for (let k = 0; k < 3; k++) { g.beginPath(); for (let x = 0; x <= w; x += 8) g.lineTo(x, 180 + k * 22 + Math.sin(x / 40 + k) * 8); g.stroke(); }
    g.fillStyle = "#ffffff"; g.font = '700 46px "Familjen Grotesk", sans-serif'; g.fillText("Weekend ved vandet", 250, 100);
  });
  const billboard = quad(3.4, 1.7, basic({ map: billTex })); billboard.position.set(-8.9, 4.9, FZ + 0.08); addObj(billboard);
  // stuevinduet: malet stue med varmt lys, sofa, tv-skær og to silhuetter
  const stueTex = K.canvasTexture(512, 360, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, "#f2b27a"); gr.addColorStop(1, "#9a5a4a"); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.fillStyle = "rgba(255,240,210,0.6)"; g.beginPath(); g.arc(70, 120, 60, 0, 7); g.fill();                  // lampe
    g.fillStyle = "#3a2430"; g.fillRect(64, 120, 10, 200);
    g.fillStyle = "#7fb0ff"; g.fillRect(360, 110, 120, 76); g.fillStyle = "rgba(127,176,255,0.35)"; g.fillRect(330, 90, 180, 130);   // tv
    g.fillStyle = "#5b3644"; K.roundRect(g, 120, 230, 260, 90, 18); g.fill();                                   // sofa
    g.fillStyle = "#2a1824"; for (const [x, s] of [[190, 1], [290, 0.85]]) { g.beginPath(); g.arc(x, 190 + (1 - s) * 40, 26 * s, 0, 7); g.fill(); K.roundRect(g, x - 34 * s, 215 + (1 - s) * 40, 68 * s, 90 * s, 22); g.fill(); }
    g.fillStyle = "#cfe2ff"; g.fillRect(205, 238, 20, 12);                                                      // telefon i hånden
    g.strokeStyle = "rgba(60,30,40,0.5)"; g.lineWidth = 6; g.strokeRect(3, 3, w - 6, h - 6);
  });
  const stueWin = quad(SW.w, SW.h, basic({ map: stueTex, opacity: 1 })); stueWin.position.set(SW.x, SW.y, FZ + 0.03); addObj(stueWin);
  // køreplansskærm og stoppestedsskilt
  const busTex = K.canvasTexture(256, 160, (g, w, h) => {
    g.fillStyle = "#08100c"; g.fillRect(0, 0, w, h); g.fillStyle = "#9fe3a0"; g.font = '500 30px "JetBrains Mono", monospace';
    g.fillText("12  2 min", 18, 52); g.fillText("7A  9 min", 18, 98); g.fillText("40  14 min", 18, 142);
  });
  const busScreen = quad(0.46, 0.28, basic({ map: busTex })); busScreen.position.set(BS.x + 1.42, 1.85, BS.z - 0.315); addObj(busScreen);
  const stopSign = quad(0.6, 0.6, basic({ map: K.canvasTexture(200, 200, (g, w, h) => {
    // neutralt stoppestedsskilt: et lyst felt med et enkelt "stop"-symbol (en prik på en linje), ingen trafikselskabsfarver
    g.fillStyle = "#e9e4d6"; K.roundRect(g, 8, 8, 184, 184, 30); g.fill(); g.strokeStyle = "#4a4e63"; g.lineWidth = 8; g.stroke();
    g.strokeStyle = "#4a4e63"; g.lineWidth = 12; g.beginPath(); g.moveTo(30, 100); g.lineTo(170, 100); g.stroke();
    g.fillStyle = "#4a4e63"; g.beginPath(); g.arc(100, 100, 30, 0, 7); g.fill(); g.fillStyle = "#e9e4d6"; g.beginPath(); g.arc(100, 100, 14, 0, 7); g.fill();
  }), side: THREE.DoubleSide }));
  stopSign.position.set(BS.x - 1.85, 2.75, BS.z - 0.25); stopSign.scale.setScalar(0.7); addObj(stopSign);
  // lysreklame i læskurets ende (giver modlys bag personen)
  const adTex = K.canvasTexture(256, 512, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, "#ffd0e0"); gr.addColorStop(1, "#8f7bff"); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.fillStyle = "rgba(255,255,255,0.75)"; g.beginPath(); g.arc(w / 2, 190, 80, 0, 7); g.fill(); g.fillStyle = "rgba(40,20,60,0.55)"; K.roundRect(g, 40, 360, w - 80, 40, 20); g.fill(); K.roundRect(g, 70, 420, w - 140, 26, 13); g.fill();
  });
  const adPanel = quad(1.0, 2.0, basic({ map: adTex })); adPanel.position.set(BS.x - 1.42, 1.25, BS.z + 0.2); adPanel.rotation.y = 90 * D; addObj(adPanel);
  // glas bag bænken
  const glass = quad(2.8, 2.0, basic({ color: "#9fb7ff", opacity: 0.12, side: THREE.DoubleSide })); glass.position.set(BS.x, 1.25, BS.z - 0.35); addObj(glass);

  /* ---------- Personen ved busstoppestedet ---------- */
  // personen er ikke en mørk silhuet: en varm jakke og et lyst hoved, så det læses som et menneske (ikke et spøgelse)
  const silMat = new THREE.MeshStandardMaterial({ color: "#7a4a5e", roughness: 0.85, flatShading: true, emissive: "#3a2030", emissiveIntensity: 0.4 });
  const skinMat = new THREE.MeshStandardMaterial({ color: "#d9a88a", roughness: 0.8, flatShading: true, emissive: "#4a2a24", emissiveIntensity: 0.35 });
  function capsule(A, B, r) {
    const a = new THREE.Vector3(...A), b = new THREE.Vector3(...B), d = b.clone().sub(a), len = d.length();
    const g = new THREE.CapsuleGeometry(r, Math.max(0.001, len), 3, 8);
    g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()));
    g.translate((A[0] + B[0]) / 2, (A[1] + B[1]) / 2, (A[2] + B[2]) / 2); return g;
  }
  const person = new THREE.Group();
  {
    const parts = [
      capsule([0, 1.02, 0], [0, 1.36, 0.02], 0.17),       // overkrop
      capsule([0.09, 0.08, 0], [0.09, 0.84, 0], 0.075), capsule([-0.09, 0.08, 0], [-0.09, 0.84, 0], 0.075),
      capsule([0.21, 1.42, 0], [0.2, 1.12, 0.08], 0.055), capsule([-0.21, 1.42, 0], [-0.2, 1.12, 0.08], 0.055),
      capsule([0.2, 1.12, 0.08], [0.05, 1.22, 0.3], 0.05), capsule([-0.2, 1.12, 0.08], [-0.05, 1.22, 0.3], 0.05),
      capsule([0, 1.5, 0.0], [0, 1.58, 0.02], 0.05),     // hals
      new THREE.CylinderGeometry(0.17, 0.2, 0.5, 10).translate(0, 0.98, 0),   // jakke
    ].map(g => (g.index ? g.toNonIndexed() : g)).map(g => { for (const k of Object.keys(g.attributes)) if (k !== "position" && k !== "normal") g.deleteAttribute(k); return g; });
    person.add(new THREE.Mesh(THREE.BufferGeometryUtils.mergeGeometries(parts), silMat));
  }
  const head = new THREE.Group(); head.position.set(0, 1.58, 0.02); person.add(head);
  const headM = new THREE.Mesh(new THREE.SphereGeometry(0.115, 12, 8), skinMat); headM.position.set(0, 0.11, 0.02); head.add(headM);
  const phoneScreenMat = new THREE.MeshBasicMaterial({ color: "#cfe2ff" });
  const phone = new THREE.Group(); phone.position.set(0, 1.25, 0.32); phone.rotation.x = -40 * D; person.add(phone);
  phone.add(new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.19, 0.014), new THREE.MeshStandardMaterial({ color: "#111" })));
  const phoneScreen = quad(0.088, 0.172, phoneScreenMat); phoneScreen.position.z = 0.008; phone.add(phoneScreen);
  const phoneHalo = quad(0.5, 0.5, basic({ map: K.glowTex("#cfe2ff"), blending: THREE.AdditiveBlending, opacity: 0 })); phoneHalo.position.z = 0.02; phone.add(phoneHalo);
  const faceGlow = quad(0.6, 0.6, basic({ map: K.glowTex("#bcd4ff"), blending: THREE.AdditiveBlending, opacity: 0 }));
  faceGlow.position.set(0, 1.42, 0.25); person.add(faceGlow);
  const PERSON = { x: BS.x + 2.35, z: BS.z + 1.25 };
  person.position.set(PERSON.x, 0, PERSON.z); person.rotation.y = 25 * D;     // et skridt fri af skuret, halvt vendt mod beskueren
  addObj(person);

  /* ---------- Lyslinjer: telefon → person, gade og server ---------- */
  const phoneWorld = () => { const v = new THREE.Vector3(); phone.getWorldPosition(v); return v; };
  root.object3D.updateMatrixWorld(true);
  const P0 = phoneWorld();
  const headW = new THREE.Vector3(); headM.getWorldPosition(headW);
  const kioskTerm = new THREE.Vector3(0.75, 1.1, 1.12).applyEuler(new THREE.Euler(0, KS.ry * D, 0)).add(new THREE.Vector3(KS.x, 0, KS.z));
  const targets = [
    { to: headW.clone().add(new THREE.Vector3(0, 0.02, 0)), lift: 0.12, t: 0.8, d: 0.4, col: "#ffd3e0" },                          // personen
    { to: new THREE.Vector3(BS.x + 1.42, 1.85, BS.z - 0.3), lift: 0.5, t: 1.1, d: 0.6, col: ROSE },                                     // køreplanen
    { to: kioskTerm, lift: 0.9, t: 1.3, d: 0.8, col: ROSE },                                                                             // betaling i kiosken
    { to: new THREE.Vector3(-8.9, 4.9, FZ + 0.1), lift: 1.6, t: 1.5, d: 0.8, col: ROSE },                                              // reklametavlen
    { to: new THREE.Vector3(SV.x - 0.2, 7.1, -7.0), lift: 1.8, t: 1.7, d: 1.0, col: "#ffb3c9", tail: new THREE.Vector3(SV.x + 1.5, 7.6, SV.z + 1.25) },   // kabelmasten → datacentret
  ];
  const lines = targets.map(tg => {
    const a = P0.clone(), b = tg.to, m = a.clone().lerp(b, 0.5); m.y += tg.lift;
    let curve = new THREE.QuadraticBezierCurve3(a, m, b);
    if (tg.tail) { const p2 = b.clone().lerp(tg.tail, 0.5); p2.y += 0.6; curve = new THREE.CatmullRomCurve3([a, m, b, p2, tg.tail]); }
    const seg = 48, geo = new THREE.TubeGeometry(curve, seg, tg === targets[4] ? 0.022 : 0.012, 5, false);
    const mat = basic({ color: tg.col, opacity: 0.9, blending: THREE.AdditiveBlending, fog: false });
    const mesh = new THREE.Mesh(geo, mat); geo.setDrawRange(0, 0);
    addObj(mesh); return { ...tg, curve, mesh, total: geo.index.count, mat };
  });
  // lyspulser, der løber langs linjerne (ét Points-objekt)
  const NP = lines.length * 3;       // udgående pulser (rosa): telefonen påvirker verden
  const NI = lines.length * 2;       // indgående pulser (kold blå): verden påvirker telefonen og personen
  const pulseGeo = new THREE.BufferGeometry(); pulseGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(NP * 3), 3));
  const pulseMat = new THREE.PointsMaterial({ map: K.glowTex("#ffffff"), color: "#ffd6e4", size: 0.28, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, opacity: 0 });
  addObj(new THREE.Points(pulseGeo, pulseMat));
  const inGeo = new THREE.BufferGeometry(); inGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(NI * 3), 3));
  const inMat = new THREE.PointsMaterial({ map: K.glowTex("#ffffff"), color: "#9fc4ff", size: 0.34, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, opacity: 0 });
  addObj(new THREE.Points(inGeo, inMat));
  const endGlows = lines.slice(1).map(l => { const q = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), basic({ map: K.glowTex(ROSE), blending: THREE.AdditiveBlending, opacity: 0, fog: false })); q.position.copy(l.to); addObj(q); return q; });

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
        const bo = v.back || {}, side = bo.side ?? 0.95, fwd = bo.fwd ?? 1.3, dy = bo.dy ?? 0;
        const px = p[0] + ux * fwd + uz * side, pz = p[2] + uz * fwd - ux * side;
        g.position.set(px, 1.6 + Math.tan(pitch * D) * fwd - 0.8 + dy, pz);
        g.rotation.set(0, Math.atan2(-ux, -uz), 0, "YXZ"); g.rotateX((pitch - 22) * D);
        // pilens retning: vinkel fra blikretningen til døren (positiv = til venstre)
        const dx = doorPos[0] - p[0], dz = doorPos[2] - p[2];
        arrowM.rotation.z = Math.atan2(ux * dz - uz * dx, ux * dx + uz * dz) * -1;
      },
    };
  }

  /* ---------- Skilte og døre ---------- */
  // rummets skilt hænger over gaden mellem to wirer
  const roomSign = ctx.sign(ctx.room.name, { position: "6.6 5.6 -0.8", width: 2.4, sub: ctx.room.sub, rotation: "0 -12 0" });
  kit.link(root, [5.0, 5.4, -0.55], [2.4, 6.9, FZ - 0.1], 0.008, K.flat("#555a74"));
  kit.link(root, [7.4, 5.4, -1.05], [9.0, 4.2, 1.25], 0.008, K.flat("#555a74"));

  // tre døre ind i facaderne; bag hver dør et kig ind i rummet (et oplyst "indre"), og en stor husnummerplade
  const DOORS = [
    { id: "c1", x: -2.9, inner: (g, w, h) => { const gr = g.createRadialGradient(w * 0.3, h * 0.35, 10, w / 2, h / 2, w); gr.addColorStop(0, "#ffd9a6"); gr.addColorStop(1, "#7a4a40"); g.fillStyle = gr; g.fillRect(0, 0, w, h);
        g.fillStyle = "#5b3644"; K.roundRect(g, 30, h * 0.62, w * 0.6, h * 0.18, 16); g.fill(); g.fillStyle = "rgba(255,240,210,0.8)"; g.beginPath(); g.arc(w * 0.78, h * 0.32, 22, 0, 7); g.fill(); g.fillStyle = "#3a2430"; g.fillRect(w * 0.78 - 3, h * 0.32, 6, h * 0.5); } },
    { id: "c2", x: 0.4, inner: (g, w, h) => { g.fillStyle = "#e8e2d6"; g.fillRect(0, 0, w, h); g.fillStyle = "#c79b6c"; g.fillRect(10, h * 0.6, w - 20, 16);
        ["#ff8fb1", "#c9a0ff", "#8fb2ff", "#7fd1a6"].forEach((c, i) => { g.fillStyle = c; g.globalAlpha = 0.85; K.roundRect(g, 26 + i * 26, h * 0.25 - i * 10, 50, 90, 8); g.fill(); }); g.globalAlpha = 1; } },
    { id: "c3", x: 4.9, inner: (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, "#3a2440"); gr.addColorStop(1, "#7a4a5a"); g.fillStyle = gr; g.fillRect(0, 0, w, h);
        g.fillStyle = "#d8b46e"; g.fillRect(w / 2 - 3, h * 0.35, 6, h * 0.35); g.fillRect(w / 2 - 50, h * 0.35, 100, 6); g.beginPath(); g.arc(w / 2 - 50, h * 0.48, 16, 0, Math.PI); g.arc(w / 2 + 50, h * 0.48, 16, 0, Math.PI); g.fill();
        g.fillStyle = "#a0707a"; for (let i = 0; i < 3; i++) g.fillRect(0, h * (0.78 + i * 0.07), w, 8); } },
  ];
  // facadeskilt (som et butiksskilt) med rummets navn i stor skrift; rammens dørskilt under det bærer undertitlen
  const doorLabelTex = (r) => K.canvasTexture(1000, 200, (g, w, h) => {
    g.fillStyle = "rgba(14,12,26,0.94)"; K.roundRect(g, 4, 4, w - 8, h - 8, 34); g.fill(); g.strokeStyle = r.color; g.lineWidth = 8; g.stroke();
    g.shadowColor = r.color; g.shadowBlur = 20; g.textAlign = "center"; g.textBaseline = "middle"; g.fillStyle = "#fff"; g.font = FONT(700, 92);
    let fs = 92; while (g.measureText(r.name).width > w - 80 && fs > 50) { fs -= 4; g.font = FONT(700, fs); } g.fillText(r.name, w / 2, h / 2 + 4);
  });
  const doorPeeks = [];
  DOORS.forEach(d => {
    ctx.door(d.id, { position: `${d.x} 0 ${FZ + 0.14}` });
    const peek = quad(1.5, 2.4, new THREE.MeshBasicMaterial({ map: K.canvasTexture(200, 320, d.inner), fog: false }));
    peek.position.set(d.x, 1.25, FZ + 0.06); addObj(peek); doorPeeks.push(peek);
    // stor plade over døren (læses fra spawn)
    const lab = quad(d.id === "c3" ? 2.9 : 2.4, (d.id === "c3" ? 2.9 : 2.4) * 0.2, basic({ map: doorLabelTex(ctx.rooms[d.id]), fog: false })); lab.position.set(d.x, 4.55, FZ + 0.12); addObj(lab);
  });
  // stuevinduet hører til Stuen: en rosa lysstribe forbinder vinduet med Stuen-døren
  { const B = batch(); B.box(Math.abs(SW.x - (-2.9)) + 0.3, 0.04, 0.04, ROSE, [(SW.x + -2.9) / 2 + 0.1, SW.y + SW.h / 2 + 0.16, FZ + 0.1]); addObj(B.build(glowMat)); }
  const DOOR_UP = [-9.0, 0, 7.4];
  ctx.door(ctx.room.parent, { position: DOOR_UP.join(" "), rotation: "0 60 0" });
  // to ekstra lygtepæle og et lavt hus på forkanten, så man står I gaden
  {
    const B = batch();
    for (const [x, z] of [[-5.0, 10.0], [6.5, 9.8]]) { B.cyl(0.06, 0.08, 4.0, "#4a4e63", [x, 2.0, z], [0, 0, 0], 8); B.box(0.08, 0.08, 0.7, "#4a4e63", [x, 3.98, z - 0.32]); B.box(0.36, 0.1, 0.22, "#3a3d50", [x, 3.92, z - 0.66]); }
    addObj(B.build(litMat));
    const Gl = batch(); for (const [x, z] of [[-5.0, 10.0], [6.5, 9.8]]) Gl.box(0.3, 0.04, 0.16, "#ffe2b0", [x, 3.86, z - 0.66]); addObj(Gl.build(glowMat));
  }

  /* ---------- c0-1: station = personen ved busstoppestedet ---------- */
  const st1 = kit.grp(root, `${PERSON.x} 0 ${PERSON.z}`);
  kit.box(st1, "0 1.0 0", 0.8, 2.0, 0.8, "opacity: 0; transparent: true; depthWrite: false");
  ctx.station("c0-1", st1);
  const s01 = ctx.sign(ctx.step("c0-1").title, { position: `${BS.x - 0.9} 2.35 ${BS.z + 1.3}`, width: 1.4 });
  view("c0-1", { position: [1.9, 0, 7.6], lookAt: [0.9, 2.0, -4], pitch: 9 });

  /* ---------- c0-2: målpladen ved udgangen ---------- */
  const goal = kit.grp(root, "-6.4 0 5.0", { rotation: "0 40 0" });
  const goalG = new THREE.Group();
  {
    const B2 = batch();
    B2.box(0.08, 1.0, 0.08, "#5b6078", [-1.2, 0.5, -0.05]); B2.box(0.08, 1.0, 0.08, "#5b6078", [1.2, 0.5, -0.05]);
    B2.box(2.7, 1.05, 0.08, "#20233a", [0, 1.5, -0.06]);
    B2.box(2.76, 0.05, 0.12, ROSE, [0, 2.04, -0.04]);
    goalG.add(B2.build(litMat));
  }
  const cardTex = (word, sub, fill) => K.canvasTexture(512, 400, (g, w, h) => {
    g.fillStyle = "rgba(11,15,30,0.92)"; K.roundRect(g, 8, 8, w - 16, h - 16, 30); g.fill();
    g.strokeStyle = ROSE; g.lineWidth = 7; g.stroke();
    g.textAlign = "center"; g.textBaseline = "middle";
    g.fillStyle = "#ffffff"; g.font = FONT(700, 66); K.wrap(g, word, w - 60).forEach((l, i, a) => g.fillText(l, w / 2, 110 - (a.length - 1) * 36 + i * 72));
    g.fillStyle = "#c9cfe8"; g.font = BODY(500, 36); const sl = K.wrap(g, sub, w - 64); sl.forEach((l, i) => g.fillText(l, w / 2, 230 - (sl.length - 1) * 21 + i * 42));
    if (fill) { g.strokeStyle = "rgba(232,99,140,0.6)"; g.lineWidth = 4; K.roundRect(g, 60, 300, w - 120, 50, 25); g.stroke(); }
  });
  const cardL = quad(1.04, 0.81, basic({ map: cardTex("undersøge", "digitale fænomener i eget hverdagsliv"), color: "#5a5f7a", depthWrite: true }));
  const cardR = quad(1.04, 0.81, basic({ map: cardTex("tage stilling", "til fænomeners betydning for mennesker eller verden", true), color: "#5a5f7a", depthWrite: true }));
  cardL.position.set(-0.76, 1.5, 0.0); cardR.position.set(0.76, 1.5, 0.0); goalG.add(cardL, cardR);
  // "tage stilling"-kortets måler fyldes op af undersøgelser (gradvis opbygning)
  const meter = quad(0.76, 0.085, new THREE.MeshBasicMaterial({ color: ROSE })); meter.position.set(0.76, 1.5 - 0.81 * (325 - 200) / 400, 0.004); goalG.add(meter);
  // pilen
  const arrowShape = new THREE.Shape(); arrowShape.moveTo(0, -0.03); arrowShape.lineTo(0.3, -0.03); arrowShape.lineTo(0.3, -0.08); arrowShape.lineTo(0.42, 0); arrowShape.lineTo(0.3, 0.08); arrowShape.lineTo(0.3, 0.03); arrowShape.lineTo(0, 0.03); arrowShape.closePath();
  const arrowMat = basic({ color: ROSE, opacity: 0.25 });
  const arrow = new THREE.Mesh(new THREE.ShapeGeometry(arrowShape), arrowMat); arrow.position.set(-0.21, 1.5, 0.02); goalG.add(arrow);
  // undersøgelsesmarkører: små ikoner (telefon, kiosk, tavle, døgnurskive) samler sig og glider langs pilen ind i kortet
  const markTex = [
    (g, w) => { g.fillStyle = "#cfe2ff"; K.roundRect(g, w * 0.32, 10, w * 0.36, w - 20, 10); g.fill(); g.fillStyle = "#1c2236"; g.fillRect(w * 0.38, 22, w * 0.24, w - 52); },
    (g, w) => { g.fillStyle = "#ffcf9a"; g.fillRect(14, w * 0.45, w - 28, w * 0.45); g.fillStyle = ROSE; for (let i = 0; i < 4; i++) g.fillRect(14 + i * (w - 28) / 4, w * 0.25, (w - 28) / 8, w * 0.2); },
    (g, w) => { g.fillStyle = "#c3a3ff"; g.fillRect(10, w * 0.28, w - 20, w * 0.44); g.fillStyle = "#ffe2aa"; g.beginPath(); g.arc(w * 0.35, w * 0.5, 12, 0, 7); g.fill(); },
    (g, w) => { const c = w / 2; g.fillStyle = "#24182a"; g.beginPath(); g.arc(c, c, c - 6, 0, 7); g.fill(); g.strokeStyle = ROSE; g.lineWidth = 6; g.stroke(); ["#ffc56b", "#ff6f9e", "#8fb2ff"].forEach((cl, i) => { g.fillStyle = cl; g.beginPath(); g.arc(c + Math.cos(i * 2) * c * 0.45, c + Math.sin(i * 2) * c * 0.45, 8, 0, 7); g.fill(); }); },
  ].map(fn => K.canvasTexture(96, 96, (g, w) => { g.fillStyle = "rgba(20,24,40,0.9)"; g.beginPath(); g.arc(w / 2, w / 2, w / 2 - 2, 0, 7); g.fill(); g.save(); g.translate(w * 0.15, w * 0.15); g.scale(0.7, 0.7); fn(g, w); g.restore(); }));
  const marks = markTex.map(tx => { const q = quad(0.24, 0.24, basic({ map: tx, opacity: 0, depthTest: false })); q.renderOrder = 6; goalG.add(q); return q; });
  const goalGlow = quad(3.6, 2.0, basic({ map: K.glowTex(ROSE), blending: THREE.AdditiveBlending, opacity: 0 })); goalGlow.position.set(0, 1.5, -0.12); goalG.add(goalGlow);
  goal.setObject3D("mesh", goalG); goalG.traverse(o => { o.el = goal; });
  ctx.station("c0-2", goal);
  const s02 = ctx.sign(ctx.step("c0-2").title, { parent: goal, position: "0 2.45 0", width: 1.8 });
  view("c0-2", { position: [-4.0, 0, 7.6], lookAt: [-6.4, 1.5, 5.0] });
  const back = makeBackHint(DOOR_UP);

  /* ---------- Tilstand og animation ---------- */
  let cur = null, t0 = null, now = 0;
  const dark = new THREE.Color("#141626"), tmp = new THREE.Color();
  const DIM = 0.35;
  return {
    onStep(id) { cur = id; t0 = null; back.place(id === "c0-2" ? null : id); },   // i c0-2 er døren til forhallen selv i billedet
    tick(t) {
      now = t; if (t0 === null) t0 = t;
      const e = (t - t0) / 1000, s = t / 1000;
      const A1 = cur === "c0-1", A2 = cur === "c0-2";
      const wake = A1 ? e : 99;          // gaden vågner kun i c0-1, ellers er den vågen
      for (const w of windows) {
        const k = ease((wake - 0.1 - w.delay * 1.4) / 0.35);
        tmp.copy(dark).lerp(w.lit, k);
        if (w.screen && k > 0.99) tmp.multiplyScalar(0.82 + 0.18 * Math.sin(s * 3 + w.delay * 20));
        if (A2) tmp.multiplyScalar(0.6);                    // i målpladens trin dæmpes gaden
        setRangeColor(w.id, tmp);
      }
      gcol.needsUpdate = true;
      const scr = ease((wake - 0.3) / 0.5) * (A2 ? 0.5 : 1);
      billboard.material.opacity = scr; kioskScreen.material.opacity = scr; busScreen.material.opacity = scr; adPanel.material.opacity = 0.25 + 0.75 * scr;
      stueWin.material.opacity = 0.35 + 0.65 * ease((wake - 0.6) / 0.6);
      billboard.material.color.setHSL(0, 0, 0.8 + 0.2 * Math.sin(s * 1.3));
      ledA.material.opacity = (0.35 + 0.65 * (Math.sin(s * 5.1) > 0 ? 1 : 0.3)) * (A2 ? 0.4 : 1); ledB.material.opacity = (0.35 + 0.65 * (Math.sin(s * 3.7 + 1) > 0 ? 1 : 0.2)) * (A2 ? 0.4 : 1);
      // telefonen og personen
      const ph = ease((wake - 0.5) / 0.3);
      phoneScreenMat.color.setRGB(0.1 + 0.7 * ph, 0.12 + 0.75 * ph, 0.18 + 0.82 * ph);
      faceGlow.material.opacity = 0.55 * ph; phoneHalo.material.opacity = (A1 ? 0.9 : 0.4) * ph;
      head.rotation.x = (8 + 22 * ph) * D + Math.sin(s * 0.8) * 0.02;
      // linjerne vokser frem
      const camQ = new THREE.Quaternion(); root.sceneEl.camera.getWorldQuaternion(camQ);
      const lineAlpha = A1 ? 1 : 0.15;
      lines.forEach((l, i) => {
        const k = A1 ? ease((e - l.t) / l.d) : 1;
        l.mesh.geometry.setDrawRange(0, Math.floor(l.total * k / 3) * 3);
        l.mat.opacity = lineAlpha * (0.65 + 0.25 * Math.sin(s * 2 + i));
        if (i > 0) { endGlows[i - 1].material.opacity = (k >= 1 ? 0.8 : 0) * lineAlpha; endGlows[i - 1].quaternion.copy(camQ); }
      });
      const pa = pulseGeo.attributes.position;
      // ud: fra telefonen mod verden (rosa); ind: fra verden tilbage mod telefonen og personen (blå) — gensidig påvirkning
      lines.forEach((l, i) => { for (let j = 0; j < 3; j++) { const u = ((s * (0.32 + 0.06 * i)) + j / 3 + i * 0.13) % 1; const p = l.curve.getPoint(u); pa.setXYZ(i * 3 + j, p.x, p.y, p.z); } });
      pa.needsUpdate = true; pulseMat.opacity = A1 ? ease((e - 2.0) / 0.5) : 0;
      const ia = inGeo.attributes.position;
      lines.forEach((l, i) => { for (let j = 0; j < 2; j++) { const u = ((s * (0.27 + 0.05 * i)) + j / 2 + i * 0.29 + 0.5) % 1; const p = l.curve.getPoint(1 - u); ia.setXYZ(i * 2 + j, p.x, p.y, p.z); } });
      ia.needsUpdate = true; inMat.opacity = A1 ? ease((e - 3.2) / 0.6) : 0;
      // målpladen: kortene tændes, markørerne samles og glider langs pilen ind i "tage stilling", og måleren fyldes
      const g = A2 ? e : -1;
      const lit = ease((g - 0.2) / 0.5), ar = ease((g - 0.6) / 0.8);
      const fillK = A2 ? Math.min(1, Math.max(0, (g - 1.2) / 4.4)) : 0;
      cardL.material.color.setScalar(A2 ? 0.35 + 0.65 * lit : 0.4); cardR.material.color.setScalar(A2 ? 0.35 + 0.65 * ease(fillK * 1.4) : 0.4);
      arrow.scale.x = A2 ? Math.max(0.02, ar) : 1; arrowMat.opacity = A2 ? 1 : 0.3;
      marks.forEach((q, i) => {   // fire undersøgelser bygger stillingtagen op
        const k = A2 ? ease((g - 1.2 - i * 1.1) / 1.0) : 0;
        q.material.opacity = A2 && g > 1.0 + i * 1.1 ? 1 : 0;
        // de dukker op i "undersøge"-kortets nederste kant, svæver over pilen og lander i "tage stilling"-kortets måler
        q.position.set(lerp(-0.76 + (i - 1.5) * 0.2, 0.5 + i * 0.17, k), lerp(1.24, 1.25, k) + Math.sin(k * Math.PI) * 0.32, 0.06);
        q.scale.setScalar(1 - 0.35 * k);
      });
      meter.scale.x = Math.max(0.001, fillK); meter.position.x = 0.76 - 0.38 * (1 - fillK); meter.visible = A2;
      goalGlow.material.opacity = A2 ? (0.3 + 0.08 * Math.sin(s * 2.5)) * lit : 0;
      setSignOpacity(s01, A1 ? 1 : DIM); setSignOpacity(s02, A2 ? 1 : DIM);
    },
  };
}
