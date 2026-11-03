/* C3 · Forsamlingssalen — Stillingtagen.
   En rund sal med bænke i trin (amfi) om en vægt i midten. Bag scenen tre nicher langs væggen:
   debatten (opdigtede, neutrale overskrifter og citatbobler i mange retninger), arkivet (gamle fremtidsbilleder)
   og samtalekredsen (stole i rundkreds om ét svævende spørgsmål). En dør fører tilbage til Gaden.
   c3-0: skålene fyldes skiftevis med egne undersøgelser og principielle diskussioner; vægten tipper og finder balancen,
         en tråd forbinder de to skåle i en lysende knude (stillingtagen), og først da lyser pilen mod handling.
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
      S.box(w - 0.04, 0.08, 0.5, "#6e4a48", [Math.sin(a) * (rr + 0.1), hh + 0.2, -Math.cos(a) * (rr + 0.1)], [0, -a / D, 0]);   // sæde
      S.box(w - 0.04, 0.06, 0.4, "#553a3c", [Math.sin(a) * (rr + 0.1), hh + 0.05, -Math.cos(a) * (rr + 0.1)], [0, -a / D, 0]);
    }
  }
  // lampetter rundt på væggen
  const LAMPS = [];
  for (let i = 0; i < 12; i++) {
    const a = (i + 0.5) / 12 * Math.PI * 2; if (inNiche(a) || Math.abs(a - Math.PI) < 0.3) continue;
    S.box(0.05, 0.3, 0.06, "#2a1f28", [Math.sin(a) * (R - 0.08), 2.75, -Math.cos(a) * (R - 0.08)], [0, -a / D, 0]);         // armatur
    S.cyl(0.1, 0.06, 0.08, "#2a1f28", [Math.sin(a) * (R - 0.2), 2.88, -Math.cos(a) * (R - 0.2)], [0, 0, 0], 10);
    G.cyl(0.09, 0.12, 0.2, "#ffd9a8", [Math.sin(a) * (R - 0.2), 3.02, -Math.cos(a) * (R - 0.2)], [0, 0, 0], 10);          // skærm
    LAMPS.push([Math.sin(a) * (R - 0.35), 3.0, -Math.cos(a) * (R - 0.35)]);
  }

  /* tre nicher i nordvæggen: −35°, 0°, +35° */
  const NICHES = [
    { id: "c3-1", a: NICHE_A[0], col: "#ffb3c9" },
    { id: "c3-2", a: NICHE_A[1], col: "#ffd9a0" },
    { id: "c3-3", a: NICHE_A[2], col: "#ffd2a8" },
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
  // lampernes glød (én samlet, additiv flade pr. lampe)
  { const gs = LAMPS.map(([x, y, z]) => new THREE.PlaneGeometry(1.1, 1.1).lookAt(new THREE.Vector3(-x, 0, -z)).translate(x, y, z)); addObj(new THREE.Mesh(THREE.BufferGeometryUtils.mergeGeometries(gs), basic({ map: K.glowTex("#ffd2a0"), blending: THREE.AdditiveBlending, opacity: 0.55 }))); }
  { const dome = new THREE.Mesh(new THREE.ConeGeometry(R + 0.45, 2.2, 48, 1, true), new THREE.MeshBasicMaterial({ map: K.canvasTexture(64, 256, (c, w, h) => { const gr = c.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, "#1a1428"); gr.addColorStop(1, "#4a3446"); c.fillStyle = gr; c.fillRect(0, 0, w, h); }), side: THREE.BackSide })); dome.position.y = H + 0.15 + 1.1; addObj(dome); }
  addObj(new THREE.PointLight("#ffd2b0", 7, 12, 1.4), root, "0 4.2 1.0");
  const nicheLight = new THREE.PointLight("#ffd9e6", 0, 5, 1.6); addObj(nicheLight);

  /* ---------- Skilt med rummets navn og dør tilbage til Gaden (i syd ved indgangen) ---------- */
  ctx.door(ctx.room.parent, { position: `0 0 ${R - 0.3}`, rotation: "0 180 0" });
  ctx.sign(ctx.room.name, { position: `0 4.0 ${R - 0.35}`, rotation: "0 180 0", width: 2.8, sub: ctx.room.sub });

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

  // hjælper: position i salen ud fra vinkel (fra nord, med uret) og radius
  const polar = (a, r, y = 0) => [Math.sin(a) * r, y, -Math.cos(a) * r];
  const yawDeg = a => -a / D;    // drejning, så noget vender ind mod midten
  const back = makeBackHint([0, 0, R - 0.3]);

  /* ---------- c3-0: vægten, der FORBINDER egne undersøgelser og principielle diskussioner ----------
     Skålene fyldes skiftevis: en klods (egen undersøgelse) i venstre, en boble (principiel diskussion) i højre.
     Vægten tipper hver gang og kommer i balance, når begge er fyldt. Så tegnes en tråd mellem skålene, der mødes
     i en lysende knude over vægten (en stillingtagen), og først da lyser pilen mod handling. */
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
  // indholdet: 4 klodser (undersøgelser) og 4 bobler (diskussioner); vises én ad gangen
  const NLOAD = 4;
  const cubes = new THREE.InstancedMesh(new THREE.BoxGeometry(0.12, 0.12, 0.12), new THREE.MeshStandardMaterial({ color: "#ff8fb1", roughness: 0.5, flatShading: true }), NLOAD);
  const cubeAt = i => new THREE.Vector3((i % 2 - 0.5) * 0.16, -0.66 + Math.floor(i / 2) * 0.125, (i % 2) * 0.04 - 0.02);
  pans[0].hang.add(cubes);
  const bubG = THREE.BufferGeometryUtils.mergeGeometries([new THREE.SphereGeometry(0.1, 10, 6).scale(1.2, 0.85, 0.6), new THREE.ConeGeometry(0.035, 0.08, 6).rotateZ(2.5).translate(-0.08, -0.08, 0)].map(g => g.toNonIndexed()));
  const bubs = new THREE.InstancedMesh(bubG, new THREE.MeshStandardMaterial({ color: "#f3eef6", roughness: 0.5, flatShading: true }), NLOAD);
  const bubAt = i => new THREE.Vector3((i % 2 - 0.5) * 0.2, -0.64 + Math.floor(i / 2) * 0.15, (i % 2) * 0.05);
  pans[1].hang.add(bubs);
  const M4 = new THREE.Matrix4(), Q0 = new THREE.Quaternion(), V1 = new THREE.Vector3(1, 1, 1), V0 = new THREE.Vector3(1e-4, 1e-4, 1e-4);
  // mærkerne på skålene: hænger på ydersiden, uden for pilens bane, og vender mod overbliksviewet (mod syd)
  const panLabel = (txt) => K.canvasTexture(600, 130, (g, w, h) => { g.fillStyle = "rgba(20,14,26,0.9)"; K.roundRect(g, 3, 3, w - 6, h - 6, 44); g.fill(); g.strokeStyle = C.c; g.lineWidth = 5; g.stroke(); g.fillStyle = "#fff"; g.font = BODY(600, 50); g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(txt, w / 2, h / 2 + 2); });
  const panLabels = [["egne undersøgelser", 0], ["principielle diskussioner", 1]].map(([t, i]) => {
    const q = quad(1.2, 0.26, basic({ map: panLabel(t), depthTest: false })); q.renderOrder = 12; pans[i].hang.add(q); q.position.set((i ? 1 : -1) * 0.35, -1.12, 0.05); return q;
  });
  // tråden, der forbinder de to skåle via en knude over vægten
  const linkCurve = new THREE.QuadraticBezierCurve3(new THREE.Vector3(-1.15, 1.35, 0), new THREE.Vector3(0, 3.3, 0), new THREE.Vector3(1.15, 1.35, 0));
  const linkGeo = new THREE.TubeGeometry(linkCurve, 40, 0.018, 6, false);
  const linkMat = basic({ color: "#ffd3e0", opacity: 0.95, blending: THREE.AdditiveBlending });
  const link = new THREE.Mesh(linkGeo, linkMat); addObj(link); const LINK_N = linkGeo.index.count;
  const knot = new THREE.Mesh(new THREE.IcosahedronGeometry(0.13, 1), new THREE.MeshBasicMaterial({ color: "#ffe6ee" })); knot.position.set(0, 2.45, 0); addObj(knot);
  const knotGlow = quad(1.3, 1.3, basic({ map: K.glowTex(C.c), blending: THREE.AdditiveBlending, opacity: 0 })); knotGlow.position.copy(knot.position); addObj(knotGlow);
  // pilen på gulvet: fra vægten ud mod beskueren og udgangen (mod Gaden og videre mod Atelieret)
  const arrowPts = [new THREE.Vector3(0, 0.08, 0.75), new THREE.Vector3(0.0, 0.08, 2.0), new THREE.Vector3(0, 0.08, 3.3)];
  const arrowCurve = new THREE.CatmullRomCurve3(arrowPts);
  const arrowGeo = (() => {
    const N = 60, pos = [], idx = [];
    for (let i = 0; i <= N; i++) { const t = i / N, p = arrowCurve.getPoint(t), tg = arrowCurve.getTangent(t), nx = -tg.z, nz = tg.x, w = 0.22; pos.push(p.x + nx * w, p.y, p.z + nz * w, p.x - nx * w, p.y, p.z - nz * w); if (i < N) { const k = i * 2; idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); } }
    const p = arrowCurve.getPoint(1), tg = arrowCurve.getTangent(1), nx = -tg.z, nz = tg.x, b = pos.length / 3;
    pos.push(p.x + nx * 0.5, p.y, p.z + nz * 0.5, p.x - nx * 0.5, p.y, p.z - nz * 0.5, p.x + tg.x * 0.8, p.y, p.z + tg.z * 0.8); idx.push(b, b + 1, b + 2);
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); return g;
  })();
  const arrowMat = basic({ color: C.c, opacity: 0.9, side: THREE.DoubleSide });
  const arrow = new THREE.Mesh(arrowGeo, arrowMat); addObj(arrow);
  const arrowGlow = quad(1.4, 3.2, basic({ map: K.glowTex(C.c), blending: THREE.AdditiveBlending, opacity: 0 })); arrowGlow.rotation.x = -90 * D; arrowGlow.position.set(0, 0.075, 2.1); addObj(arrowGlow);
  const ARROW_TRIS = arrowGeo.index.count;
  // ved pilespidsen, lavt foran beskueren: ravgult felt "videre mod Atelieret: nye handlinger og eksperimenter"
  const onTex = K.canvasTexture(1000, 260, (g, w, h) => {
    g.fillStyle = "rgba(20,14,26,0.92)"; K.roundRect(g, 4, 4, w - 8, h - 8, 50); g.fill(); g.strokeStyle = C.a; g.lineWidth = 8; g.stroke();
    g.fillStyle = C.a; g.beginPath(); g.moveTo(60, 100); g.lineTo(140, 100); g.lineTo(140, 66); g.lineTo(200, 130); g.lineTo(140, 194); g.lineTo(140, 160); g.lineTo(60, 160); g.closePath(); g.fill();
    g.textBaseline = "middle"; g.fillStyle = "#fff"; g.font = FONT(700, 66); g.fillText(`videre mod ${ctx.rooms["hal-a"].name}`, 240, 96);
    g.fillStyle = "#f6d9b4"; g.font = BODY(600, 50); g.fillText("nye handlinger og eksperimenter", 240, 176);
  });
  const onward = quad(1.5, 0.39, basic({ map: onTex, opacity: 0 })); onward.renderOrder = 5;
  onward.position.set(0, 0.62, 3.75); onward.rotation.set(-35 * D, 0, 0); addObj(onward);
  const st0 = kit.grp(root, "0 0 0");
  kit.box(st0, "0 1.2 0", 2.6, 2.4, 0.8, "opacity: 0; transparent: true; depthWrite: false");
  ctx.station("c3-0", st0);
  const s30 = ctx.sign(ctx.step("c3-0").title, { position: "0 3.85 0", width: 1.7 });
  view("c3-0", { position: [0, 0, 6.6], lookAt: [0, 1.5, -4], pitch: -6 });

  /* ---------- nichernes stationer ---------- */
  const N1 = NICHES[0], N2 = NICHES[1], N3 = NICHES[2];
  NICHES.forEach(n => {
    const sp = polar(n.a, R - 0.9);
    const st = kit.grp(root, `${sp[0]} 0 ${sp[2]}`);
    kit.box(st, "0 1.4 0", 2.6, 2.8, 0.4, "opacity: 0; transparent: true; depthWrite: false", { rotation: `0 ${yawDeg(n.a)} 0` });
    ctx.station(n.id, st);
    const sg = polar(n.a, R - 0.45, NH + 0.5);
    n.sign = ctx.sign(ctx.step(n.id).title, { position: sg.join(" "), rotation: `0 ${yawDeg(n.a)} 0`, width: 2.3, size: 64 });
    const vp = polar(n.a, R - 2.75), la = polar(n.a, R + 0.6, 1.7);
    view(n.id, { position: vp, lookAt: la, pitch: 6 });
  });

  /* c3-1 debatten: to sider, overskrifter øverst, elevernes egen boble i midten med tråde ud til begge sider */
  const HEADS = [
    "Skal der være aldersgrænse på sociale medier?",
    "Lærere: AI i skolen kræver nye fælles regler",
    "Forsker: Forbud alene løser ikke problemet",
  ];
  const newsTex = (t, i) => K.canvasTexture(640, 360, (g, w, h) => {
    g.fillStyle = "#f4efe4"; g.fillRect(0, 0, w, h); g.fillStyle = "#2a2530"; g.fillRect(0, 0, w, 14);
    g.font = FONT(700, 58); g.fillStyle = "#1e1a24"; K.wrap(g, t, w - 60).slice(0, 3).forEach((l, k) => g.fillText(l, 30, 88 + k * 64));
    g.fillStyle = "#b9b2a4"; for (let k = 0; k < 4; k++) g.fillRect(30 + (k % 2) * 300, 300 + Math.floor(k / 2) * 26, 270, 11);
  });
  const heads = HEADS.map((t, i) => {
    const q = quad(0.84, 0.47, basic({ map: newsTex(t, i), side: THREE.DoubleSide, depthWrite: true }));
    q.position.set(-0.95 + i * 0.95, 2.5 + (i % 2) * 0.08, -ND / 2 + 0.12); q.rotation.z = [-4, 2, -3][i] * D; N1.content.add(q); return q;
  });
  // to positioner til hver side; side −1 = "beskyt / begræns", side +1 = "lær / brug"
  const SIDES = [
    { t: "Beskyt børnene: sæt grænser", x: -1.0, col: "#ffc9d8" },
    { t: "Platformene må tage ansvar", x: -1.0, col: "#ffc9d8" },
    { t: "Unge skal lære at navigere selv", x: 1.0, col: "#cfe0ff" },
    { t: "AI kan hjælpe dem, der har svært ved at skrive", x: 1.0, col: "#cfe0ff" },
  ];
  const quoteTex = (t, side, col, mine) => K.canvasTexture(640, 250, (g, w, h) => {
    g.fillStyle = col; K.roundRect(g, 6, 6, w - 12, h - 62, 44); g.fill();
    g.beginPath(); const tx = side < 0 ? w - 120 : side > 0 ? 120 : w / 2; g.moveTo(tx - 28, h - 58); g.lineTo(tx - side * 30, h - 6); g.lineTo(tx + 28, h - 58); g.fill();
    g.strokeStyle = mine ? C.c : "rgba(40,30,50,0.35)"; g.lineWidth = mine ? 8 : 4; K.roundRect(g, 6, 6, w - 12, h - 62, 44); g.stroke();
    g.fillStyle = "#2a2230"; g.font = (mine ? FONT(700, 52) : BODY(600, 50)); g.textAlign = "center"; g.textBaseline = "middle";
    const ls = K.wrap(g, t, w - 50).slice(0, 2); ls.forEach((l, k) => g.fillText(l, w / 2, (h - 56) / 2 - (ls.length - 1) * 30 + k * 60));
  });
  const quotes = SIDES.map((q0, i) => {
    const side = Math.sign(q0.x);
    const q = quad(0.95, 0.371, basic({ map: quoteTex(q0.t, side, q0.col, false), side: THREE.DoubleSide })); N1.content.add(q);
    q.userData.base = [q0.x * 1.02, i % 2 ? 1.1 : 1.8, 0.45 + (i % 2) * 0.15];
    q.userData.rot = [0, -side * 22, side * 3];
    return q;
  });
  const mine = quad(1.25, 0.488, basic({ map: quoteTex("Hvad viser vores egen undersøgelse?", 0, "#ffe2ec", true), side: THREE.DoubleSide })); N1.content.add(mine);
  mine.position.set(0, 1.45, 1.05);
  // tråde fra elevernes boble ud til begge sider
  const threads = SIDES.map(() => { const l = new THREE.Mesh(new THREE.BufferGeometry(), basic({ color: "#ff4f86", opacity: 0, depthTest: false })); l.renderOrder = 8; N1.content.add(l); return l; });
  function setThread(l, a, b) {
    const c = new THREE.QuadraticBezierCurve3(a, a.clone().lerp(b, 0.5).add(new THREE.Vector3(0, 0.15, 0.1)), b);
    l.geometry.dispose(); l.geometry = new THREE.TubeGeometry(c, 16, 0.014, 5, false);
  }
  // elevernes argument: en lille døgnurskive ved siden af boblen
  const argTex = K.canvasTexture(256, 256, (g, w) => { const c = w / 2; g.fillStyle = "#24182a"; g.beginPath(); g.arc(c, c, c - 4, 0, 7); g.fill(); g.strokeStyle = C.c; g.lineWidth = 10; g.stroke(); const cols = ["#ffc56b", "#ff6f9e", "#8fb2ff"]; for (let i = 0; i < 16; i++) { const a = (6 + i) / 24 * Math.PI * 2 - Math.PI / 2, r = c * [0.38, 0.55, 0.72][i % 3]; g.fillStyle = cols[i % 3]; g.beginPath(); g.arc(c + Math.cos(a) * r, c + Math.sin(a) * r, 11, 0, 7); g.fill(); } });
  const argDisc = quad(0.3, 0.3, basic({ map: argTex, side: THREE.DoubleSide })); N1.content.add(argDisc);
  argDisc.position.set(0, 1.05, 1.0);
  // et lavt podie under boblen
  { const B = batch(); B.cyl(0.32, 0.36, 0.8, "#4a3644", [0, 0.4, 1.0], [0, 0, 0], 16); N1.content.add(B.build(litMat)); }

  /* c3-2 arkivet: fire store plakater i øjenhøjde på en tidslinje, der ender i et tomt, lysende "nu"-felt */
  const OLD = [
    { y: "ca. 1450", t: "trykpressen: viden til alle?", draw: g => { g.fillStyle = "#5b4636"; g.fillRect(70, 120, 30, 180); g.fillRect(220, 120, 30, 180); g.fillRect(60, 100, 200, 30); g.fillRect(90, 210, 140, 24); g.lineWidth = 10; g.strokeStyle = "#5b4636"; g.beginPath(); g.moveTo(160, 130); g.lineTo(160, 210); g.stroke(); g.fillRect(40, 300, 240, 16); } },
    { y: "ca. 1800", t: "vævestolen: maskiner tager arbejdet?", draw: g => { g.strokeStyle = "#5b4636"; g.lineWidth = 8; g.strokeRect(60, 110, 200, 190); g.lineWidth = 2; for (let i = 0; i < 12; i++) { g.beginPath(); g.moveTo(80 + i * 15, 120); g.lineTo(80 + i * 15, 290); g.stroke(); } g.lineWidth = 8; g.beginPath(); g.moveTo(50, 200); g.lineTo(270, 200); g.stroke(); } },
    { y: "1960'erne", t: "den flyvende bil i år 2000", draw: g => {
      // retro bil med hjul, finner og små vinger, der letter fra en vej
      g.strokeStyle = "#5b4636"; g.lineWidth = 4; g.setLineDash([12, 10]); g.beginPath(); g.moveTo(20, 320); g.lineTo(300, 320); g.stroke(); g.setLineDash([]);
      g.save(); g.translate(160, 220); g.rotate(-0.12);
      g.fillStyle = "#5b4636"; K.roundRect(g, -115, -10, 230, 52, 22); g.fill(); K.roundRect(g, -60, -50, 120, 50, 24); g.fill();
      g.fillStyle = "#e9dcc3"; K.roundRect(g, -48, -40, 42, 32, 8); g.fill(); K.roundRect(g, 6, -40, 42, 32, 8); g.fill();
      g.fillStyle = "#3e3024"; g.beginPath(); g.arc(-70, 44, 20, 0, 7); g.arc(70, 44, 20, 0, 7); g.fill(); g.fillStyle = "#e9dcc3"; g.beginPath(); g.arc(-70, 44, 7, 0, 7); g.arc(70, 44, 7, 0, 7); g.fill();
      g.fillStyle = "#5b4636"; g.beginPath(); g.moveTo(-30, 10); g.lineTo(-150, -20); g.lineTo(-30, 30); g.fill(); g.beginPath(); g.moveTo(100, 0); g.lineTo(130, -40); g.lineTo(118, 10); g.fill();
      g.restore();
      g.strokeStyle = "#5b4636"; g.lineWidth = 3; for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo(40 - i * 8, 270 + i * 12); g.lineTo(0 - i * 8, 280 + i * 12); g.stroke(); }
    } },
    { y: "1990'erne", t: "internettet gør alle lige?", draw: g => { g.strokeStyle = "#5b4636"; g.lineWidth = 6; g.beginPath(); g.arc(160, 200, 90, 0, 7); g.stroke(); g.beginPath(); g.ellipse(160, 200, 40, 90, 0, 0, 7); g.stroke(); g.beginPath(); g.moveTo(70, 200); g.lineTo(250, 200); g.stroke(); g.beginPath(); g.moveTo(85, 155); g.lineTo(235, 155); g.moveTo(85, 245); g.lineTo(235, 245); g.stroke(); for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; g.fillStyle = "#5b4636"; g.beginPath(); g.arc(160 + Math.cos(a) * 125, 200 + Math.sin(a) * 125, 10, 0, 7); g.fill(); } } },
  ];
  const oldTex = o => K.canvasTexture(320, 460, (g, w, h) => {
    g.fillStyle = "#e9dcc3"; g.fillRect(0, 0, w, h); g.fillStyle = "rgba(120,90,60,0.12)"; for (let i = 0; i < 40; i++) g.fillRect(Math.random() * w, Math.random() * h, 3, 3);
    g.fillStyle = "#5b4636"; g.font = FONT(700, 44); g.textAlign = "center"; g.fillText(o.y, w / 2, 70); g.textAlign = "left";
    o.draw(g); g.fillStyle = "#3e3024"; g.font = BODY(700, 34); g.textAlign = "center"; K.wrap(g, o.t, w - 40).forEach((l, k) => g.fillText(l, w / 2, 386 + k * 38));
  });
  const nowTex = K.canvasTexture(320, 460, (g, w, h) => {
    g.fillStyle = "rgba(255,217,160,0.12)"; g.fillRect(0, 0, w, h); g.setLineDash([18, 12]); g.strokeStyle = "#ffd9a0"; g.lineWidth = 8; g.strokeRect(10, 10, w - 20, h - 20); g.setLineDash([]);
    g.fillStyle = "#ffd9a0"; g.font = FONT(700, 54); g.textAlign = "center"; g.fillText("nu", w / 2, 80);
    g.fillStyle = "#fff4e0"; g.font = BODY(600, 36); ["Hvad håber vi", "på i dag?"].forEach((l, k) => g.fillText(l, w / 2, 230 + k * 46));
  });
  const PW = 0.6, PH = 0.86;
  const archive = OLD.map(o => { const q = quad(PW, PH, basic({ map: oldTex(o), side: THREE.DoubleSide, depthWrite: true })); N2.content.add(q); return q; });
  const nowCard = quad(PW, PH, basic({ map: nowTex, side: THREE.DoubleSide })); N2.content.add(nowCard);
  const SLOT = i => [-1.26 + i * 0.63, 1.75, 0.3];
  nowCard.position.set(...SLOT(4)); nowCard.position.x = SLOT(4)[0] - 0.02;
  const timeline = new THREE.Mesh(new THREE.BoxGeometry(2.9, 0.025, 0.025), new THREE.MeshBasicMaterial({ color: "#d9b27a" })); timeline.position.set(0, 1.25, 0.3); timeline.scale.x = 1.0; N2.content.add(timeline);
  // pilen på tidslinjen peger mod "nu"
  { const ah = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.1, 8), new THREE.MeshBasicMaterial({ color: "#d9b27a" })); ah.rotation.z = -90 * D; ah.position.set(1.48, 1.25, 0.3); N2.content.add(ah); }
  // to lave arkivkasser, hvorfra plakaterne trækkes op
  {
    const B = batch();
    for (const sx of [-1, 1]) { B.box(0.7, 0.55, 0.45, "#6b5a4a", [sx * 0.85, 0.275, -0.6]); B.box(0.64, 0.04, 0.42, "#7d6a58", [sx * 0.85, 0.57, -0.6]); B.box(0.16, 0.03, 0.03, "#d6c3a6", [sx * 0.85, 0.35, -0.36]); }
    N2.content.add(B.build(litMat));
  }

  /* c3-3 samtalekredsen: varme stole og lyse figurer om et lavt bord med et fænomen fra gaden; spørgsmålet svæver over kredsen */
  const ring = new THREE.Group(); ring.position.set(0, 0, 0.25); N3.content.add(ring);
  const CH = 7, CR = 1.0;
  const seatA = i => i / CH * Math.PI * 2;      // stol 0 står bagerst (mod nichens bagvæg); stolene ved beskueren er tomme
  {
    const B = batch();
    for (let i = 0; i < CH; i++) {
      const a = seatA(i) + Math.PI, x = Math.sin(a) * CR, z = Math.cos(a) * CR, ry = a / D + 180;
      const off = (dx, dz) => [x + Math.sin(a) * dz + Math.cos(a) * dx, z + Math.cos(a) * dz - Math.sin(a) * dx];
      const [sx, sz] = off(0, 0); B.box(0.42, 0.05, 0.42, "#d2a06e", [sx, 0.45, sz], [0, ry, 0]);
      const [bx, bz] = off(0, 0.2); B.box(0.42, 0.45, 0.04, "#c08c5c", [bx, 0.7, bz], [0, ry, 0]);
      for (const [dx, dz] of [[-0.18, -0.18], [0.18, -0.18], [-0.18, 0.18], [0.18, 0.18]]) { const [lx, lz] = off(dx, dz); B.box(0.03, 0.45, 0.03, "#8e6b4b", [lx, 0.225, lz]); }
    }
    B.cyl(CR + 0.55, CR + 0.55, 0.012, "#8a6a7a", [0, 0.006, 0], [0, 0, 0], 32);
    B.cyl(0.32, 0.32, 0.04, "#d8b88a", [0, 0.42, 0], [0, 0, 0], 20); B.cyl(0.05, 0.08, 0.4, "#8e6b4b", [0, 0.2, 0], [0, 0, 0], 8);   // lavt bord
    ring.add(B.build(litMat));
  }
  // figurerne: lyse, varme, med en antydning af tøjfarve; de sidder på stolene bag bordet (de forreste to stole er tomme: en invitation)
  {
    const cols = ["#e0b49a", "#c9a0b4", "#a8b8d0", "#d8c08e"];
    [6, 0, 1, 2].forEach((i, k) => {
      const parts = [];
      const a = seatA(i) + Math.PI, x = Math.sin(a) * CR, z = Math.cos(a) * CR, ix = -Math.sin(a), iz = -Math.cos(a);
      parts.push(capsule([x - ix * 0.05, 0.62, z - iz * 0.05], [x - ix * 0.02, 0.98, z - iz * 0.02], 0.14));
      parts.push(new THREE.SphereGeometry(0.1, 10, 6).translate(x + ix * 0.02, 1.17, z + iz * 0.02));
      parts.push(capsule([x, 0.5, z], [x + ix * 0.32, 0.5, z + iz * 0.32], 0.07));
      parts.push(capsule([x + ix * 0.32, 0.5, z + iz * 0.32], [x + ix * 0.36, 0.06, z + iz * 0.36], 0.06));
      parts.push(capsule([x - ix * 0.02 + iz * 0.17, 0.95, z - iz * 0.02 - ix * 0.17], [x + ix * 0.2 + iz * 0.1, 0.72, z + iz * 0.2 - ix * 0.1], 0.045));
      parts.push(capsule([x - ix * 0.02 - iz * 0.17, 0.95, z - iz * 0.02 + ix * 0.17], [x + ix * 0.2 - iz * 0.1, 0.72, z + iz * 0.2 + ix * 0.1], 0.045));
      ring.add(new THREE.Mesh(mergeClean(parts), new THREE.MeshStandardMaterial({ color: cols[k], roughness: 0.8, flatShading: true, emissive: cols[k], emissiveIntensity: 0.18 })));
    });
  }
  // fænomenet på bordet: døgnurskiven fra Stuen
  const tableDisc = quad(0.42, 0.42, basic({ map: argTex, depthWrite: true })); tableDisc.rotation.x = -90 * D; tableDisc.position.set(0, 0.445, 0); ring.add(tableDisc);
  const ASKS = ["Hvem har ansvaret, når en algoritme tager fejl?", "Må en maskine afgøre, hvem der får et job?", "Er en digital dobbeltgænger en del af mig?"];
  const askTex = ASKS.map(t => K.canvasTexture(900, 300, (g, w, h) => {
    g.clearRect(0, 0, w, h); g.fillStyle = "rgba(36,24,40,0.92)"; K.roundRect(g, 6, 6, w - 12, h - 12, 50); g.fill(); g.strokeStyle = "#ffd9a0"; g.lineWidth = 6; g.stroke();
    g.fillStyle = "#fff"; g.font = FONT(700, 64); g.textAlign = "center"; g.textBaseline = "middle"; const ls = K.wrap(g, t, w - 90); ls.forEach((l, k) => g.fillText(l, w / 2, h / 2 - (ls.length - 1) * 37 + k * 74));
  }));
  const askQ = quad(2.0, 0.667, basic({ map: askTex[0], side: THREE.DoubleSide })); askQ.position.set(0, 2.45, 0.25); N3.content.add(askQ);
  const qOrb = new THREE.Mesh(new THREE.SphereGeometry(0.13, 16, 10), new THREE.MeshBasicMaterial({ color: "#fff0d8" })); qOrb.position.set(0, 1.85, 0.25); N3.content.add(qOrb);
  const qGlow = quad(1.2, 1.2, basic({ map: K.glowTex("#ffd9a0"), blending: THREE.AdditiveBlending, opacity: 0.6 })); qGlow.position.copy(qOrb.position); N3.content.add(qGlow);
  const qMark = quad(0.26, 0.26, basic({ map: K.canvasTexture(128, 128, (g, w) => { g.fillStyle = "#3a2a20"; g.font = FONT(700, 110); g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("?", w / 2, w / 2 + 6); }), side: THREE.DoubleSide })); qMark.position.set(0, 1.85, 0.39); N3.content.add(qMark);
  // en varm lysplet fra kredsens midte
  const ringGlow = quad(2.8, 2.8, basic({ map: K.glowTex("#ffcf9a"), blending: THREE.AdditiveBlending, opacity: 0 })); ringGlow.rotation.x = -90 * D; ringGlow.position.set(0, 0.03, 0.25); N3.content.add(ringGlow);

  /* ---------- Tilstand og animation ---------- */
  let cur = null, t0 = null, ang = 0, vel = 0;
  const tmpV = new THREE.Vector3();
  const DIM = 0.35;     // dæmpning af skilte og lys uden for det aktive trin
  return {
    onStep(id) { cur = id; t0 = null; ang = cur === "c3-0" ? 0 : 0; vel = 0; back.place(id); },
    tick(t, dt) {
      if (t0 === null) t0 = t;
      const e = (t - t0) / 1000, s = t / 1000, h = Math.min(0.05, (dt || 16) / 1000);
      const A0 = cur === "c3-0";
      /* vægten: skålene fyldes skiftevis; vægten tipper mod den tunge side og finder balancen, når begge er fyldt */
      const LOAD_T = i => 1.0 + i * 1.2;            // klods i: 0,8 1,55 2,3 … ; boble i: +0,375
      let nc = NLOAD, nb = NLOAD;
      if (A0) { nc = 0; nb = 0; for (let i = 0; i < NLOAD; i++) { if (e > LOAD_T(i)) nc++; if (e > LOAD_T(i) + 0.6) nb++; } }
      const target = 13 * D * (nc - nb);
      // dæmpet fjeder mod målet
      const acc = -18 * (ang - target) - 3.2 * vel; vel += acc * h; ang += vel * h;
      beam.rotation.z = ang;
      pans.forEach(p => { p.hang.rotation.z = -ang; });
      for (let i = 0; i < NLOAD; i++) {
        const kc = A0 ? ease((e - LOAD_T(i)) / 0.3) : 1, kb = A0 ? ease((e - LOAD_T(i) - 0.6) / 0.3) : 1;
        const pc = cubeAt(i), pb = bubAt(i);
        M4.compose(pc.clone().setY(pc.y + (1 - kc) * 0.5), Q0, kc > 0 ? V1.clone().multiplyScalar(kc) : V0); cubes.setMatrixAt(i, M4);
        M4.compose(pb.clone().setY(pb.y + (1 - kb) * 0.5), Q0, kb > 0 ? V1.clone().multiplyScalar(kb) : V0); bubs.setMatrixAt(i, M4);
      }
      cubes.instanceMatrix.needsUpdate = true; bubs.instanceMatrix.needsUpdate = true;
      const balanced = A0 ? e - (LOAD_T(NLOAD - 1) + 0.6 + 1.4) : 99;     // sekunder siden balancen
      const kl = A0 ? ease(balanced / 1.0) : 1;
      link.geometry.setDrawRange(0, Math.floor(LINK_N * kl / 6) * 6); link.visible = kl > 0;
      linkMat.opacity = (A0 ? 0.95 : 0.35);
      const kk = A0 ? ease((balanced - 0.9) / 0.5) : 1;
      knot.scale.setScalar(Math.max(0.01, kk) * (1 + 0.08 * Math.sin(s * 4))); knot.visible = kk > 0.01;
      knotGlow.material.opacity = (A0 ? 0.85 : 0.25) * kk;
      knotGlow.quaternion.copy(root.sceneEl.camera.getWorldQuaternion(new THREE.Quaternion()));
      // pilen mod handling: først når der er en stillingtagen
      const ak = A0 ? ease((balanced - 1.3) / 1.4) : 0;
      arrow.geometry.setDrawRange(0, ak >= 1 ? ARROW_TRIS : Math.floor((ARROW_TRIS - 3) * ak / 6) * 6);
      arrow.visible = ak > 0;
      arrowMat.opacity = 0.7 + 0.25 * Math.sin(s * 3); arrowGlow.material.opacity = 0.6 * ak;
      onward.material.opacity = A0 ? ease((balanced - 2.6) / 0.6) : 0;
      panLabels.forEach(q => { q.material.opacity = A0 ? 1 : DIM; });
      setSignOpacity(s30, A0 ? 1 : DIM);

      /* nicherne: kun den aktive åbnes og lyser; i overblikket står alle tre let oplyst og lukket */
      let anyOn = false;
      NICHES.forEach(n => {
        const on = cur === n.id;
        const k = on ? ease((e - 0.2) / 1.0) : 0;
        n.lid.position.y = NH / 2 + k * (NH + 0.05); n.lid.visible = k < 0.99;
        n.glow.material.opacity = on ? 0.75 * k : 0;
        n.rim.material.color.set(n.col).multiplyScalar(on ? 1 : A0 ? 0.75 : 0.25);
        setSignOpacity(n.sign, on ? 1 : A0 ? 0.8 : DIM);
        if (on) { anyOn = true; n.g.updateMatrixWorld(true); tmpV.set(0, 2.2, -ND / 2 + 0.8).applyMatrix4(n.g.matrixWorld); nicheLight.position.copy(tmpV); nicheLight.color.set(n.col); nicheLight.intensity = 8 * k; }
      });
      if (!anyOn) nicheLight.intensity = 0;

      /* debatten */
      const A1 = cur === "c3-1";
      heads.forEach((q, i) => { q.material.opacity = A1 ? ease((e - 0.8 - i * 0.25) / 0.5) : 0.6; });
      quotes.forEach((q, i) => {
        const k = A1 ? ease((e - 1.6 - i * 0.6) / 0.5) : 0;
        const [bx, by, bz] = q.userData.base, [rx, ry, rz] = q.userData.rot;
        q.position.set(bx + Math.sin(s * 0.7 + i) * 0.02, by + Math.sin(s * 0.9 + i * 2) * 0.03 - (1 - k) * 0.15, bz);
        q.rotation.set(rx * D, ry * D, rz * D); q.material.opacity = k; q.scale.setScalar(0.75 + 0.25 * k);
      });
      const km = A1 ? ease((e - 4.4) / 0.6) : 0;
      mine.material.opacity = km; mine.scale.setScalar(0.8 + 0.2 * km); mine.position.y = 1.45 + Math.sin(s) * 0.02;
      argDisc.material.opacity = A1 ? ease((e - 5.0) / 0.5) : 0; argDisc.rotation.z = s * 0.4;
      threads.forEach((l, i) => {
        const k = A1 ? ease((e - 5.4 - i * 0.25) / 0.5) : 0;
        if (k > 0) { const a = mine.position.clone().add(new THREE.Vector3(Math.sign(SIDES[i].x) * 0.5, 0, 0)); const b = quotes[i].position.clone().add(new THREE.Vector3(-Math.sign(SIDES[i].x) * 0.42, 0, 0)); setThread(l, a, a.clone().lerp(b, k)); }
        l.material.opacity = 0.85 * k; l.visible = k > 0;
      });

      /* arkivet: plakaterne trækkes op af kasserne og hænges på tidslinjen; til sidst lyser "nu"-feltet */
      const A2 = cur === "c3-2";
      archive.forEach((q, i) => {
        const k = A2 ? ease((e - 0.9 - i * 0.6) / 0.8) : 1;
        const [tx, ty, tz] = SLOT(i), fx = (i % 2 ? 0.85 : -0.85), fy = 0.5, fz = -0.6;
        q.position.set(lerp(fx, tx, k), lerp(fy, ty, k) + Math.sin(k * Math.PI) * 0.3, lerp(fz, tz, k));
        q.rotation.set(0, 0, (1 - k) * (i % 2 ? -20 : 20) * D + ((i * 37) % 5 - 2) * D * k);
        q.material.opacity = A2 ? Math.min(1, k * 3) : 0.8;
      });
      nowCard.material.opacity = A2 ? ease((e - 4.0) / 0.8) * (0.75 + 0.25 * Math.sin(s * 2.5)) : 0.3;

      /* samtalekredsen */
      const A3 = cur === "c3-3";
      const qi = A3 ? Math.floor(Math.max(0, e - 0.5) / 4.5) % ASKS.length : 0;
      if (askQ.material.map !== askTex[qi]) { askQ.material.map = askTex[qi]; askQ.material.needsUpdate = true; }
      const ph = A3 ? ((Math.max(0, e - 0.5)) % 4.5) / 4.5 : 0.5;
      askQ.material.opacity = A3 ? Math.min(ease(ph / 0.12), ease((1 - ph) / 0.12)) : 0.5;
      askQ.position.y = 2.45 + Math.sin(s * 1.1) * 0.04;
      qOrb.position.y = 1.85 + Math.sin(s * 1.4) * 0.05; qMark.position.y = qOrb.position.y; qGlow.position.y = qOrb.position.y;
      qGlow.material.opacity = (A3 ? 0.7 : 0.3) + 0.12 * Math.sin(s * 3);
      ringGlow.material.opacity = A3 ? 0.55 * ease(e / 1.2) : 0;
    },
  };
}
