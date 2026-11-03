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

  const RW = 8.2, WALL_H = 4.6;              // salens radius og væghøjde
  const CORE_Y = 2.05, CORE_R = 0.74;        // kernens centrum og størrelse

  ctx.env({ background: "#070a16" });

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
  const GATE_PHI = { "hal-a": 180 + 28, "hal-b": 180, "hal-c": 180 - 28 };
  const UP_PHI = 248;                                   // trappen op til Udsigten
  const busy = [...Object.values(GATE_PHI), UP_PHI];
  const pil = [];
  for (let i = 0; i < 28; i++) {
    const phi = i * 360 / 28 + 6.4;
    if (busy.some(b => Math.abs(((phi - b + 540) % 360) - 180) < 13)) continue;
    const [x, z] = polar(phi, RW - 0.12);
    pil.push([0.32, WALL_H, 0.24, x, WALL_H / 2, z, phi * D2R]);
  }
  add(new THREE.Mesh(mergeBoxes(pil), std("#20264a", { roughness: 0.8 })));
  // gesims og en svag lysliste ved gulvet
  const corn = new THREE.Mesh(keep(new THREE.TorusGeometry(RW - 0.1, 0.12, 4, 72)), std("#272e58"));
  corn.rotation.x = Math.PI / 2; corn.position.y = WALL_H; add(corn);
  const coveMat = basic(C.core, { transparent: true, opacity: 0.35 });
  const cove = new THREE.Mesh(keep(new THREE.TorusGeometry(RW - 0.3, 0.025, 3, 96)), coveMat);
  cove.rotation.x = Math.PI / 2; cove.position.y = WALL_H - 0.18; add(cove);
  // kuppel med ribber (tegnet på tekstur)
  const domeTex = tex(1024, 512, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, "#0f1330"); gr.addColorStop(1, "#1a2044");
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.strokeStyle = "rgba(201,209,255,0.13)"; g.lineWidth = 3;
    for (let i = 0; i < 24; i++) { const x = i * w / 24; g.beginPath(); g.moveTo(x, h * 0.06); g.lineTo(x, h); g.stroke(); }
    g.strokeStyle = "rgba(201,209,255,0.10)"; [0.35, 0.62, 0.86].forEach(v => { g.beginPath(); g.moveTo(0, v * h); g.lineTo(w, v * h); g.stroke(); });
  });
  const dome = new THREE.Mesh(keep(new THREE.SphereGeometry(RW, 48, 12, 0, Math.PI * 2, 0, Math.PI / 2)), std("#8a90b4", { map: domeTex, side: THREE.BackSide, roughness: 1, flatShading: false }));
  dome.scale.y = 0.36; dome.position.y = WALL_H; add(dome);
  const ocMat = basic(C.core, { transparent: true, opacity: 0.8 });
  const oculus = new THREE.Mesh(keep(new THREE.TorusGeometry(1.3, 0.05, 4, 48)), ocMat);
  oculus.rotation.x = Math.PI / 2; oculus.position.y = WALL_H + RW * 0.36 - 0.12; add(oculus);
  const ocDisc = new THREE.Mesh(keep(new THREE.CircleGeometry(1.28, 40)), additive(keep(K.glowTex(C.core)), "#ffffff", 0.9));
  ocDisc.rotation.x = Math.PI / 2; ocDisc.position.y = oculus.position.y + 0.02; add(ocDisc);

  /* ---------- Podiet under kernen ---------- */
  const dais = new THREE.Mesh(keep(new THREE.CylinderGeometry(1.5, 1.62, 0.12, 48)), std("#232a50", { roughness: 0.5 }));
  dais.position.y = 0.06; add(dais);
  const daisRingMat = basic(C.core, { transparent: true, opacity: 0.6 });
  const daisRing = new THREE.Mesh(keep(new THREE.TorusGeometry(1.5, 0.018, 3, 72)), daisRingMat);
  daisRing.rotation.x = Math.PI / 2; daisRing.position.y = 0.125; add(daisRing);
  const poolTex = keep(K.glowTex(C.core));
  const poolMat = additive(poolTex, "#ffffff", 0.7);
  const pool = new THREE.Mesh(keep(new THREE.PlaneGeometry(3.4, 3.4)), poolMat);
  pool.rotation.x = -Math.PI / 2; pool.position.y = 0.13; add(pool);

  /* ---------- Kernen: icosaeder bygget af 20 tykke facetter ---------- */
  const coreRig = holder(`0 ${CORE_Y} 0`).object3D;          // står stille (facetternes reference)
  const coreSpin = new THREE.Group(); coreRig.add(coreSpin);   // roterer langsomt
  const coreMat = std(C.core, { roughness: 0.32, metalness: 0.25, emissive: new THREE.Color(C.core), emissiveIntensity: 0.12 });
  const icoGeo = new THREE.IcosahedronGeometry(CORE_R, 0);
  const pos = icoGeo.attributes.position;
  const faces = [];
  const Z = new THREE.Vector3(0, 0, 1);
  for (let f = 0; f < pos.count / 3; f++) {
    const v = [0, 1, 2].map(i => new THREE.Vector3().fromBufferAttribute(pos, f * 3 + i));
    const c = v[0].clone().add(v[1]).add(v[2]).multiplyScalar(1 / 3);
    const n = c.clone().normalize();
    const q = new THREE.Quaternion().setFromUnitVectors(Z, n), qi = q.clone().invert();
    // trekant i facettens eget koordinatsystem (normal = +z), lidt indskrumpet så fugerne ses
    const loc = v.map(p => p.clone().sub(c).multiplyScalar(0.94).applyQuaternion(qi));
    const shape = new THREE.Shape(loc.map(p => new THREE.Vector2(p.x, p.y)));
    const g = new THREE.ExtrudeGeometry(shape, { depth: 0.08, bevelEnabled: false }); g.translate(0, 0, -0.08);
    faces.push({ c, n, q, g });
  }
  icoGeo.dispose();
  // de fire facetter, der åbner sig i F4: dem, der peger mod terningens diagonaler (spredt rundt om kernen)
  const diag = [[1, 1, 1], [-1, 1, -1], [1, -1, -1], [-1, -1, 1]].map(d => new THREE.Vector3(...d).normalize());
  const openIdx = diag.map(d => faces.reduce((best, f, i) => f.n.dot(d) > faces[best].n.dot(d) ? i : best, 0));
  const staticGeo = BGU.mergeGeometries(faces.filter((f, i) => !openIdx.includes(i)).map(f => { const g = f.g.clone(); g.applyQuaternion(f.q); g.translate(f.c.x, f.c.y, f.c.z); return g; }));
  keep(staticGeo); coreSpin.add(new THREE.Mesh(staticGeo, coreMat));
  // indre lys, som ses gennem hullerne, når facetterne åbner sig
  const innerMat = basic("#ffffff", { color: new THREE.Color(C.core).lerp(new THREE.Color("#ffffff"), 0.5) });
  coreSpin.add(new THREE.Mesh(keep(new THREE.IcosahedronGeometry(CORE_R * 0.66, 1)), innerMat));
  // lysende kanter på kernen
  { const eg = keep(new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(CORE_R * 0.995, 0)));
    coreSpin.add(new THREE.LineSegments(eg, basic("#eef1ff", { transparent: true, opacity: 0.55 }))); }
  const facetMat = std(C.core, { roughness: 0.3, metalness: 0.25, emissive: new THREE.Color(C.core), emissiveIntensity: 0.2 });
  const facets = openIdx.map(i => { const f = faces[i]; keep(f.g); const m = new THREE.Mesh(f.g, facetMat); coreRig.add(m); return { ...f, m }; });
  faces.forEach((f, i) => { if (!openIdx.includes(i)) f.g.dispose(); });
  // glorie omkring kernen (sprite følger altid blikket)
  const haloMat = keep(new THREE.SpriteMaterial({ map: keep(K.glowTex(C.core)), color: "#ffffff", transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.4 }));
  const halo = new THREE.Sprite(haloMat); halo.scale.set(3.6, 3.6, 1); coreRig.add(halo);
  // kernens lys (1 af 2 tilladte ekstra lyskilder)
  const coreLight = new THREE.PointLight(C.core, 6, 11, 1.6); coreLight.position.set(0, CORE_Y, 0); add(coreLight);

  /* ---------- Stationer: lave stelæer lidt til siden for blikket, så kernen er fri ---------- */
  // phi: retning fra kernen til brugeren; vr: brugerens afstand; side: stelens side (+1 = højre); out: kigger udad (F6)
  const ST = {
    f1: { phi: 0, vr: 4.9, side: 1 },
    f2: { phi: -40, vr: 4.7, side: 1 },
    f3: { phi: 40, vr: 4.9, side: 1, off: 1.45 },
    f4: { phi: -92, vr: 4.9, side: 1, off: 1.45 },
    f5: { phi: 100, vr: 4.8, side: -1, off: 1.45 },
    f6: { phi: 180, vr: 0.9, side: 1, out: true, dist: 1.5, off: 1.0 },
  };
  const steleGeo = (() => {
    const parts = [[0.42, 0.05, 0.3, 0, 0.025, 0], [0.16, 1.0, 0.1, 0, 0.55, -0.02], [0.3, 0.04, 0.16, 0, 0.06, 0]];
    return mergeBoxes(parts);
  })();
  const steleMat = std("#262d55", { roughness: 0.45, metalness: 0.35 });
  const capGeo = keep(new THREE.BoxGeometry(0.43, 0.012, 0.31)); capGeo.translate(0, 0.056, 0);
  const capMat = basic(C.core, { transparent: true, opacity: 0.75 });
  const viewPos = {};
  const backGeo = keep(new THREE.BoxGeometry(0.95, 0.215, 0.02)); backGeo.translate(0, 0, -0.008);
  const neckGeo = null;
  for (const s of ctx.steps) {
    const cfg = ST[s.id]; if (!cfg) continue;
    const [vx, vz] = polar(cfg.phi, cfg.vr);
    const fwd = cfg.out ? polar(cfg.phi, 1) : polar(cfg.phi + 180, 1);          // blikretning
    const rgt = [-fwd[1], fwd[0]];                                              // højre for blikket
    const dist = cfg.dist ?? 1.9, off = cfg.off ?? 1.3;
    const x = vx + fwd[0] * dist + rgt[0] * off * cfg.side, z = vz + fwd[1] * dist + rgt[1] * off * cfg.side;
    const face = Math.atan2(vx - x, vz - z) / D2R;                              // stelen vender mod brugeren
    const g = kit.grp(root, `${x} 0 ${z}`, { rotation: `0 ${face} 0` });
    const hm = new THREE.Group(); hm.add(new THREE.Mesh(steleGeo, steleMat), new THREE.Mesh(capGeo, capMat)); g.object3D.add(hm);
    const sg = kit.grp(g, "0 1.2 0.02", { rotation: "-18 0 0" });
    ctx.sign(s.title, { parent: sg, position: "0 0 0.006", width: 0.92, color: C.core, size: 74 });
    sg.object3D.add(new THREE.Mesh(backGeo, steleMat));      // bagplade, så skiltet ikke ses spejlvendt bagfra
    ctx.station(s.id, g);
    const look = cfg.out ? [polar(cfg.phi, 8)[0], 1.6, polar(cfg.phi, 8)[1]] : [0, CORE_Y, 0];
    ctx.view(s.id, { position: [vx, 0, vz], lookAt: look });
    viewPos[s.id] = [vx, vz];
  }
  // rummets navn hænger over kernen og drejer sig altid mod den besøgende
  const roomSign = ctx.sign(ctx.room.name, { sub: ctx.room.sub, position: `0 ${WALL_H - 0.35} 0`, width: 2.4, color: C.core });
  const camPos = new THREE.Vector3();

  /* ---------- F2: "med" og "om" på hver side af kernen ---------- */
  function wordTex(word, sub) {
    return tex(1024, 512, (g, w, h) => {
      const bg = g.createRadialGradient(w / 2, h * 0.5, 10, w / 2, h * 0.5, w * 0.5);
      bg.addColorStop(0, "rgba(7,10,22,0.85)"); bg.addColorStop(0.6, "rgba(7,10,22,0.6)"); bg.addColorStop(1, "rgba(7,10,22,0)");
      g.fillStyle = bg; g.fillRect(0, 0, w, h);
      g.textAlign = "center"; g.textBaseline = "middle";
      g.font = '700 250px "Familjen Grotesk", "Segoe UI", sans-serif';
      g.shadowColor = "rgba(5,7,18,0.95)"; g.shadowBlur = 50; g.fillStyle = "#05070f"; g.fillText(word, w / 2, h * 0.4); g.fillText(word, w / 2, h * 0.4);
      g.shadowColor = C.core; g.shadowBlur = 28; g.fillStyle = "#f4f6ff"; g.fillText(word, w / 2, h * 0.4);
      g.shadowBlur = 0; g.fillText(word, w / 2, h * 0.4);
      g.font = '600 60px "Source Sans 3", "Segoe UI", sans-serif';
      g.shadowColor = "rgba(5,7,18,1)"; g.shadowBlur = 18; g.fillStyle = C.core; g.fillText(sub, w / 2, h * 0.83); g.shadowBlur = 0; g.fillText(sub, w / 2, h * 0.83);
    });
  }
  const f2 = ST.f2, right = phi => [Math.cos(phi * D2R), -Math.sin(phi * D2R)];
  const words = [["med", "udtrykke sig med teknologierne", -1], ["om", "udtrykke sig om teknologierne", 1]].map(([w, sub, side]) => {
    const m = new THREE.Mesh(keep(new THREE.PlaneGeometry(1.7, 0.85)), label(wordTex(w, sub)));
    const [rx, rz] = right(f2.phi), [fx, fz] = polar(f2.phi, 0.7);
    m.position.set(rx * side * 1.75 + fx, CORE_Y + 0.05, rz * side * 1.75 + fz); m.rotation.y = f2.phi * D2R; m.renderOrder = 20; add(m);
    return { m, side };
  });
  // en tynd bue fra hvert ord ind til kernen
  const wordLinks = words.map(({ m }) => {
    const a = m.position.clone(), b = new THREE.Vector3(0, CORE_Y, 0);
    const dir = b.clone().sub(a); a.add(dir.clone().multiplyScalar(0.36)); b.sub(dir.clone().multiplyScalar(0.36));
    const l = new THREE.Mesh(keep(new THREE.CylinderGeometry(0.008, 0.008, a.distanceTo(b), 4, 1, true)), basic(C.core, { transparent: true, opacity: 0 }));
    l.position.copy(a).add(b).multiplyScalar(0.5); l.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize()); add(l);
    return l;
  });

  /* ---------- F3: fem rødder vokser op ad kernen og fletter sig ---------- */
  const ROOTS = [
    ["naturvidenskab", "#d9e4ff"], ["samfundsvidenskab", "#c7d6c0"], ["humanvidenskab", "#e3d6c2"],
    ["tekniske håndværksfag", "#bcd2e6"], ["æstetiske håndværksfag", "#dccbe6"],
  ];
  const roots = ROOTS.map(([name, col], i) => {
    // roden starter på gulvet foran F3-stationen, kryber ind til podiet, snor sig op i en fælles stamme
    // (fem tråde, der fletter sig om hinanden) og breder sig til sidst ud som fingre om kernens underside
    const a0 = (ST.f3.phi + (i - 2) * 38) * D2R, braid = i * Math.PI * 2 / 5;
    const pts = [];
    const N = 70, TRUNK_TOP = CORE_Y - CORE_R * 0.78;
    for (let k = 0; k <= N; k++) {
      const t = k / N; let y, r, ang;
      if (t < 0.32) {          // langs gulvet ind mod podiet
        const u = t / 0.32, e = u * u * (3 - 2 * u);
        y = 0.04 + 0.1 * e; r = 2.55 - 2.38 * e; ang = a0 + (braid - a0 + Math.PI * 2 * Math.round((a0 - braid) / (Math.PI * 2))) * e * 0;
        ang = a0 * (1 - e) + (a0 + Math.sin(i * 2.1) * 0.3) * e;
      } else if (t < 0.7) {    // stammen: trådene fletter sig
        const u = (t - 0.32) / 0.38;
        y = 0.14 + u * (TRUNK_TOP - 0.14); r = 0.17 - 0.07 * Math.sin(u * Math.PI);
        ang = a0 + Math.sin(i * 2.1) * 0.3 + u * Math.PI * 2.4;
      } else {                 // fingre om kernen
        const u = (t - 0.7) / 0.3;
        const lat = -Math.PI / 2 + 0.68 + u * 1.25;                       // breddegrad på kernen
        y = CORE_Y + Math.sin(lat) * (CORE_R + 0.05); r = Math.cos(lat) * (CORE_R + 0.05);
        ang = a0 + Math.sin(i * 2.1) * 0.3 + Math.PI * 2.4 + u * 0.5;
      }
      pts.push(new THREE.Vector3(Math.sin(ang) * r, y, Math.cos(ang) * r));
    }
    const curve = new THREE.CatmullRomCurve3(pts);
    const geo = keep(new THREE.TubeGeometry(curve, 140, 0.034, 6, false));
    // tyndere mod spidsen: skaler ringene langs kurven
    { const p = geo.attributes.position, segs = 141, rad = 7; const c = new THREE.Vector3(), v = new THREE.Vector3();
      for (let s2 = 0; s2 < segs; s2++) { const tt = s2 / (segs - 1); curve.getPointAt(tt, c); const f = 1.25 - 0.85 * tt;
        for (let j = 0; j < rad; j++) { const idx = s2 * rad + j; v.fromBufferAttribute(p, idx).sub(c).multiplyScalar(f).add(c); p.setXYZ(idx, v.x, v.y, v.z); } }
      p.needsUpdate = true; geo.computeVertexNormals(); }
    const mat = std(col, { roughness: 0.4, emissive: new THREE.Color(col), emissiveIntensity: 0.3, flatShading: false });
    const mesh = new THREE.Mesh(geo, mat); add(mesh);
    // navn ved rodens fod, stående, vendt mod F3-stationen
    const [bx, bz] = [Math.sin(a0) * 2.6, Math.cos(a0) * 2.6];
    const lbl = new THREE.Mesh(keep(new THREE.PlaneGeometry(0.9, 0.193)), label(keep(K.labelTex(name, col, { w: 1024, h: 220, size: 70, bg: true, weight: 700 }))));
    lbl.position.set(bx, 0.36, bz); lbl.renderOrder = 15;
    const [vx, vz] = polar(ST.f3.phi, ST.f3.vr); lbl.rotation.y = Math.atan2(vx - bx, vz - bz);
    add(lbl);
    return { mesh, geo, mat, lbl, count: geo.index.count };
  });
  // hvor rødderne begynder: små lysende knaster i gulvet
  const rootBaseMat = basic(C.core, { transparent: true, opacity: 0 });
  { const gs = roots.map((r, i) => { const a0 = (ST.f3.phi + (i - 2) * 38) * D2R; const g = new THREE.CylinderGeometry(0.07, 0.09, 0.03, 10); g.translate(Math.sin(a0) * 2.55, 0.015, Math.cos(a0) * 2.55); return g; });
    add(new THREE.Mesh(keep(BGU.mergeGeometries(gs)), rootBaseMat)); gs.forEach(g => g.dispose()); }

  /* ---------- F4: fire facetter åbner sig ---------- */
  const f4 = ST.f4;
  const FACET_TXT = ["kultur", "historie", "intentioner", "materielt grundlag"];
  const facetTargets = [[-1, 1], [1, 1], [-1, -1], [1, -1]].map(([sx, sy]) => {
    const [rx, rz] = right(f4.phi), [fx, fz] = polar(f4.phi, 0.75);
    return new THREE.Vector3(rx * sx * 1.45 + fx, sy * 0.78 + 0.1, rz * sx * 1.45 + fz);   // i coreRig (centrum = kernen)
  });
  const facetQ = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, f4.phi * D2R, 0));
  // tildel facetter til mål, så de flytter sig kortest muligt
  const order = []; { const left = [0, 1, 2, 3]; facetTargets.forEach((tg, ti) => { let bi = 0, bd = 1e9; left.forEach((fi, k) => { const d = facets[fi].c.distanceTo(tg); if (d < bd) { bd = d; bi = k; } }); order[ti] = left.splice(bi, 1)[0]; }); }
  facets.forEach((f, i) => {
    const ti = order.indexOf(i); f.target = facetTargets[ti]; f.label = FACET_TXT[ti];
    // drej facetten i sit eget plan, så en spids peger op, når den står ude
    const p0 = new THREE.Vector3().fromBufferAttribute(f.g.attributes.position, 0);
    const pts = []; const P = f.g.attributes.position; for (let j = 0; j < P.count; j++) { const v = new THREE.Vector3().fromBufferAttribute(P, j); if (Math.abs(v.z) < 1e-4) pts.push(v); }
    let best = pts[0]; pts.forEach(v => { if (v.length() > best.length() - 1e-4 && v.y > best.y) best = v; });
    const a = Math.atan2(best.y, best.x);
    f.tq = facetQ.clone().multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.PI / 2 - a));
  });
  // facetten drejes, så den står "på spidsen" eller "på kanten" ens for alle: vi måler dens egen top
  const facetLabels = facets.map(f => {
    const m = new THREE.Mesh(keep(new THREE.PlaneGeometry(1.2, 0.258)), label(keep(K.labelTex(f.label, C.core, { w: 1024, h: 220, size: f.label.length > 12 ? 72 : 84, bg: true }))));
    const [fx, fz] = polar(f4.phi, 0.12);
    m.position.set(f.target.x + fx, CORE_Y + f.target.y - 0.5, f.target.z + fz);
    m.rotation.y = f4.phi * D2R; m.renderOrder = 15; add(m); return m;
  });

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
  const ICONS = ["skabe", "omskabe", "nytænke"].map((label, i) => {
    const mat = keep(new THREE.SpriteMaterial({ map: tex(512, 512, g => drawIcon(g, i, label)), transparent: true, depthWrite: false, opacity: 0 }));
    const s = new THREE.Sprite(mat); s.renderOrder = 18; coreRig.add(s); return { s, mat, ph: i * Math.PI * 2 / 3 };
  });
  const orbitMat = basic(C.core, { transparent: true, opacity: 0 });
  const orbit = new THREE.Mesh(keep(new THREE.TorusGeometry(1.75, 0.008, 3, 96)), orbitMat);
  // banen hælder: forrest (mod F5-stationen) går den under kernen, bagerst hen over den
  const ORBIT_FACE = ST.f5.phi * D2R;
  const orbitTilt = new THREE.Group(); orbitTilt.rotation.y = ORBIT_FACE; orbitTilt.add(orbit); coreRig.add(orbitTilt);

  /* ---------- De tre porte (lukkede indtil F6) og trappen op til Udsigten ---------- */
  const gates = {};
  for (const [to, phi] of Object.entries(GATE_PHI)) {
    const col = { "hal-a": C.a, "hal-b": C.b, "hal-c": C.c }[to];
    const [x, z] = polar(phi, RW - 0.25), ry = (phi + 180) * D2R;
    const g = holder(`${x} 0 ${z}`).object3D; g.rotation.y = ry;
    // portbue: to piller og en halvcirkel
    const archMat = std("#2a3160", { emissive: new THREE.Color(col), emissiveIntensity: 0.06, roughness: 0.5, metalness: 0.3 });
    const pillars = mergeBoxes([[0.36, 3.0, 0.5, -1.27, 1.5, 0.05], [0.36, 3.0, 0.5, 1.27, 1.5, 0.05], [0.5, 0.14, 0.62, -1.27, 0.07, 0.05], [0.5, 0.14, 0.62, 1.27, 0.07, 0.05]]);
    const arcGeo = new THREE.TorusGeometry(1.27, 0.18, 4, 24, Math.PI); arcGeo.translate(0, 3.0, 0.05);
    const archGeo = keep(BGU.mergeGeometries([pillars, arcGeo]));
    arcGeo.dispose();
    g.add(new THREE.Mesh(archGeo, archMat));
    // farvet lysstribe langs buens inderkant
    const seamMat = basic(col, { transparent: true, opacity: 0.25 });
    const seamGeo = keep(new THREE.TorusGeometry(1.08, 0.022, 3, 32, Math.PI)); const seam = new THREE.Mesh(seamGeo, seamMat); seam.position.set(0, 3.0, 0.31); g.add(seam);
    const seamSide = mergeBoxes([[0.04, 3.0, 0.04, -1.08, 1.5, 0.31], [0.04, 3.0, 0.04, 1.08, 1.5, 0.31]]);
    g.add(new THREE.Mesh(seamSide, seamMat));
    // dybden bag porten: en gradient i områdets farve, som tændes i F6
    const backTex = tex(256, 512, (c, w, h) => {
      const gr = c.createLinearGradient(0, h, 0, 0); gr.addColorStop(0, col); gr.addColorStop(0.45, col + "88"); gr.addColorStop(1, "#05070f");
      c.fillStyle = gr; c.beginPath(); c.moveTo(0, h); c.lineTo(0, h * 0.42); c.arc(w / 2, h * 0.42, w / 2, Math.PI, 0); c.lineTo(w, h); c.closePath(); c.fill();
    });
    const backMat = keep(new THREE.MeshBasicMaterial({ map: backTex, transparent: true, color: "#333333" }));
    const back = new THREE.Mesh(keep(new THREE.PlaneGeometry(2.18, 4.2)), backMat); back.position.set(0, 2.1, -0.18); g.add(back);
    // to portfløje, der svinger op mod salen
    const leafMat = std("#1b2146", { roughness: 0.35, metalness: 0.5 });
    const leafGeo = mergeBoxes([[1.04, 2.86, 0.07, 0, 1.43, 0], [0.9, 0.05, 0.09, 0, 0.5, 0], [0.9, 0.05, 0.09, 0, 2.4, 0]]);
    const inlayMat = basic(col, { transparent: true, opacity: 0.35 });
    const inlayGeo = mergeBoxes([[0.035, 2.6, 0.085, 0, 1.43, 0]]);
    const leaves = [-1, 1].map(s => {
      const hinge = new THREE.Group(); hinge.position.set(s * 1.06, 0, 0.22); g.add(hinge);
      const leaf = new THREE.Mesh(leafGeo, leafMat); leaf.position.x = -s * 0.53; hinge.add(leaf);
      const inl = new THREE.Mesh(inlayGeo, inlayMat); inl.position.x = -s * 1.035; hinge.add(inl);
      return { hinge, s };
    });
    // lysbane i gulvet fra podiet ud til porten
    const len = RW - 0.25 - 1.75;
    const laneMat = basic(col, { transparent: true, opacity: 0.12 });
    const laneGeo = keep(new THREE.PlaneGeometry(0.06, len)); laneGeo.rotateX(-Math.PI / 2);
    const lane = new THREE.Mesh(laneGeo, laneMat);
    const [lx, lz] = polar(phi, 1.75 + len / 2); lane.position.set(lx, 0.012, lz); lane.rotation.y = phi * D2R; add(lane);
    const laneGlowTex = tex(64, 8, (c, w, h) => { const gr = c.createLinearGradient(0, 0, w, 0); gr.addColorStop(0, col + "00"); gr.addColorStop(0.5, col + "ff"); gr.addColorStop(1, col + "00"); c.fillStyle = gr; c.fillRect(0, 0, w, h); });
    const laneGlowMat = additive(laneGlowTex, "#ffffff", 0);
    const laneGlowGeo = keep(new THREE.PlaneGeometry(0.9, len)); laneGlowGeo.rotateX(-Math.PI / 2);
    const laneGlow = new THREE.Mesh(laneGlowGeo, laneGlowMat); laneGlow.position.set(lx, 0.015, lz); laneGlow.rotation.y = phi * D2R; add(laneGlow);
    // lyspøl foran porten
    const gpMat = additive(keep(K.glowTex(col)), "#ffffff", 0);
    const gp = new THREE.Mesh(keep(new THREE.PlaneGeometry(3.6, 2.6)), gpMat); gp.rotation.x = -Math.PI / 2; gp.position.set(0, 0.02, 0.9); g.add(gp);
    // selve døren (rammen tegner den og står for skiftet)
    ctx.door(to, { position: `${x} 0 ${z}`, rotation: `0 ${phi + 180} 0` });
    gates[to] = { leaves, archMat, seamMat, backMat, inlayMat, laneMat, laneGlowMat, gpMat, open: 0, glow: 0 };
  }
  // trappe og repos op til Udsigten
  {
    const phi = UP_PHI, ry = (phi + 180) * D2R, LAND = 0.9;
    const g = holder().object3D;
    const parts = [];
    const [lx, lz] = polar(phi, RW - 0.75); parts.push([2.4, LAND, 1.3, lx, LAND / 2, lz, ry]);
    for (let i = 0; i < 5; i++) { const h = (i + 1) * LAND / 6, [sx, sz] = polar(phi, RW - 1.55 - i * 0.32); parts.push([1.9, h, 0.32, sx, h / 2, sz, ry]); }
    g.add(new THREE.Mesh(mergeBoxes(parts), std("#262d55", { roughness: 0.6 })));
    // lysliste på hvert trin
    const nose = []; for (let i = 0; i < 5; i++) { const h = (i + 1) * LAND / 6, [sx, sz] = polar(phi, RW - 1.55 - i * 0.32 + 0.155); nose.push([1.8, 0.02, 0.03, sx, h + 0.005, sz, ry]); }
    const [nx, nz] = polar(phi, RW - 1.4); nose.push([2.3, 0.02, 0.03, nx, LAND + 0.005, nz, ry]);
    g.add(new THREE.Mesh(mergeBoxes(nose), basic(C.core, { transparent: true, opacity: 0.55 })));
    const [dx, dz] = polar(phi, RW - 0.4);
    ctx.door("udsigt", { position: `${dx} ${LAND} ${dz}`, rotation: `0 ${phi + 180} 0` });
  }

  /* ---------- Tilstand pr. trin ---------- */
  let step = null, stepAt = 0;
  const S = { coreGlow: 0.2, halo: 0.35, light: 5, words: 0, roots: 0, rootDim: 1, rootGrow: 0, facets: 0, icons: 0, iconBig: 0 };
  const T = { ...S };
  const now = () => performance.now();
  function onStep(id) {
    step = id; stepAt = now();
    const n = +id.slice(1);
    T.coreGlow = n === 1 ? 0.9 : 0.4;
    T.halo = n === 1 ? 0.75 : n === 6 ? 0.3 : 0.45;
    T.light = n === 1 ? 9 : n === 6 ? 4 : 6;
    T.words = n === 2 ? 1 : 0;
    T.roots = n >= 3 ? 1 : 0;
    T.rootDim = n === 3 ? 1 : 0.15;
    T.facets = n === 4 ? 1 : 0;
    T.icons = n >= 5 ? 1 : 0;
    T.iconBig = n === 5 ? 1 : 0;
    // rødderne vokser frem i F3; i senere trin står de færdige
    S.rootGrow = n === 3 ? 0 : (n > 3 ? 1 : 0);
    // portene: lukkede indtil F6, åbner én ad gangen
    for (const gt of Object.values(gates)) { gt.open = 0; gt.glow = 0; }
  }

  let yaw = 0;
  const tmpQ = new THREE.Quaternion(), tmpV = new THREE.Vector3(), spinQ = new THREE.Quaternion();
  function tick(t, dt) {
    if (!step) return;
    dt = Math.min(dt, 60);
    const el = now() - stepAt;
    for (const k of Object.keys(T)) if (k !== "rootGrow") S[k] = approach(S[k], T[k], dt, 3.5);
    // kernen
    yaw += dt * 0.00018 * (1 - 0.7 * S.facets);
    coreSpin.rotation.set(0.35, yaw, 0.12);
    const bob = Math.sin(t * 0.0011) * 0.04;
    coreRig.position.y = CORE_Y + bob;
    coreMat.emissiveIntensity = 0.08 + S.coreGlow * 0.5;
    haloMat.opacity = S.halo;
    halo.scale.setScalar(2.6 + S.halo * 1.8);
    coreLight.intensity = S.light;
    innerMat.color.setScalar(0.25 + 0.75 * Math.max(S.facets, S.coreGlow * 0.6));
    innerMat.color.lerp(new THREE.Color(C.core), 0.2);
    poolMat.opacity = 0.35 + S.coreGlow * 0.5;
    // F2: ordene
    rootBaseMat.opacity = S.roots * (0.25 + 0.6 * S.rootDim);
    // rumskiltet drejer sig mod den besøgende
    ctx.root.sceneEl.camera.getWorldPosition(camPos);
    roomSign.object3D.rotation.y = Math.atan2(camPos.x, camPos.z);
    words.forEach(({ m }) => { m.material.opacity = S.words; m.visible = S.words > 0.01; });
    wordLinks.forEach(l => { l.material.opacity = S.words * 0.5; l.visible = S.words > 0.01; });
    // F3: rødderne
    if (step === "f3") S.rootGrow = ease(el / 2300);
    roots.forEach((r, i) => {
      const g = clamp01(S.rootGrow * 1.15 - i * 0.03);
      const cnt = Math.floor(r.count * g / 3) * 3;
      r.geo.setDrawRange(0, cnt);
      r.mesh.visible = S.roots > 0.01 && cnt > 0;
      r.mat.emissiveIntensity = 0.12 + 0.4 * S.rootDim;
      r.mat.color.set(ROOTS[i][1]).multiplyScalar(0.2 + 0.8 * S.rootDim);
      r.mat.emissiveIntensity = 0.04 + 0.48 * S.rootDim * S.rootDim;
      r.lbl.material.opacity = (step === "f3" ? ease((el - 400) / 900) : 0) * S.roots;
      r.lbl.visible = r.lbl.material.opacity > 0.01;
    });
    // F4: facetterne flyver ud til deres pladser og får tekst
    spinQ.setFromEuler(coreSpin.rotation);
    const k = ease(S.facets);
    facets.forEach((f, i) => {
      const kk = ease(clamp01(S.facets * 1.3 - i * 0.08));
      tmpV.copy(f.c).applyQuaternion(spinQ);
      f.m.position.copy(tmpV).lerp(f.target, kk);
      tmpQ.copy(spinQ).multiply(f.q); f.m.quaternion.copy(tmpQ).slerp(f.tq, kk);
      f.m.scale.setScalar(1 + kk * 0.45);
      facetLabels[i].material.opacity = ease((S.facets - 0.55) / 0.45); facetLabels[i].visible = facetLabels[i].material.opacity > 0.01;
    });
    facetMat.emissiveIntensity = 0.15 + k * 0.55;
    // F5/F6: erkendeformernes tegn kredser
    const big = ease(S.iconBig);
    const R = 1.15 + 0.75 * big, size = 0.36 + 0.66 * big, lift = (1 - big) * 1.05;
    ICONS.forEach(({ s, mat, ph }) => {
      const a = ph + t * 0.00024;
      // banen hælder, så det tegn, der er bag kernen, går hen over den
      s.position.set(Math.sin(a) * R, -Math.cos(a - ORBIT_FACE) * 0.75 * big + lift, Math.cos(a) * R);
      s.scale.set(size, size, 1); mat.opacity = S.icons; s.visible = S.icons > 0.01;
    });
    orbit.scale.setScalar(R / 1.75); orbitTilt.position.y = lift; orbit.rotation.x = Math.PI / 2 + Math.atan2(0.75 * big, R); orbitMat.opacity = S.icons * (0.12 + 0.4 * big); orbit.visible = S.icons > 0.01;
    // F6: portene åbner sig én ad gangen
    const keys = ["hal-a", "hal-b", "hal-c"];
    keys.forEach((key, i) => {
      const gt = gates[key];
      const tgt = step === "f6" ? ease((el - 300 - i * 700) / 700) : 0;
      gt.open = step === "f6" ? tgt : approach(gt.open, 0, dt, 5);
      const o = gt.open;
      gt.leaves.forEach(({ hinge, s }) => { hinge.rotation.y = s * -o * 1.75; });
      gt.archMat.emissiveIntensity = 0.06 + o * 0.55;
      gt.seamMat.opacity = 0.22 + o * 0.78;
      gt.inlayMat.opacity = 0.3 + o * 0.6;
      gt.backMat.color.setScalar(0.18 + o * 0.82);
      gt.laneMat.opacity = 0.1 + o * 0.85;
      gt.laneGlowMat.opacity = o * 0.55;
      gt.gpMat.opacity = o * 0.7;
    });
    // stationernes pulte: den aktive står tydeligst
  }

  function dispose() { disposables.forEach(d => d && d.dispose && d.dispose()); }
  return { onStep, tick, dispose };
}
