/* Hal A · Atelieret — Digital kreativitet og design.
   Et højt atelier om natten med savtagstag og ovenlys. To lange arbejdsborde med halvfærdige prototyper i pap,
   træ og elektronik. For enden af bordene står en pult med ét fælles oplæg; fra det løber tynde lysbuer ud til
   otte meget forskellige prototyper (ét oplæg, mange uforudsigelige resultater). Hvert bord fører med en lysstribe
   til sin dør: Værkstedet (processerne) og Metodelaboratoriet (metoderne). Ved udgangen hænger målpladen.
   Trin: a0-1 (prototyperne lyser op én efter én), a0-2 (målpladen: fire nøgleord på en løkke). */

export default function build(ctx) {
  const { THREE, kit, C } = ctx;
  const A = ctx.room.color;
  const T = vaerktoej(ctx);
  const { Batch } = T;

  ctx.env({ background: "#080b17", fog: "type: linear; color: #080b17; near: 13; far: 30" });

  /* ---------- Gulv: mørke plankegulve ---------- */
  const gulvTex = T.canvas(1024, 1024, (g, w, h) => {
    const r = T.rng(7);
    const rows = 8, rh = h / rows;
    for (let i = 0; i < rows; i++) {
      let x = -r() * 300;
      while (x < w) {
        const len = 260 + r() * 360, tone = 38 + r() * 16;
        g.fillStyle = `rgb(${tone + 14},${tone * 0.72 + 6},${tone * 0.5})`;
        g.fillRect(x, i * rh, len, rh);
        // årer
        g.strokeStyle = "rgba(20,12,6,0.25)"; g.lineWidth = 1;
        for (let k = 0; k < 5; k++) { const y = i * rh + 8 + r() * (rh - 16); g.beginPath(); g.moveTo(x, y); g.bezierCurveTo(x + len * 0.3, y + 4, x + len * 0.6, y - 4, x + len, y); g.stroke(); }
        g.fillStyle = "rgba(8,5,3,0.85)"; g.fillRect(x, i * rh, 3, rh);
        x += len;
      }
      g.fillStyle = "rgba(8,5,3,0.9)"; g.fillRect(0, i * rh, w, 3);
    }
  });
  gulvTex.wrapS = gulvTex.wrapT = THREE.RepeatWrapping; gulvTex.repeat.set(3.5, 3.75);
  const gulvGeo = T.hold(new THREE.PlaneGeometry(14, 15)); gulvGeo.rotateX(-Math.PI / 2);
  T.mesh(ctx.root, gulvGeo, T.hold(new THREE.MeshStandardMaterial({ map: gulvTex, roughness: 0.9, metalness: 0 })), "0 0 1");

  /* ---------- Vægge: hvidkalkede mursten, afskåret hjørne ved de to døre ---------- */
  const murTex = T.canvas(512, 512, (g, w, h) => {
    const r = T.rng(3);
    g.fillStyle = "#5d5d6b"; g.fillRect(0, 0, w, h);
    const rows = 16, bh = h / rows, bw = 64;
    for (let i = 0; i < rows; i++) for (let x = (i % 2) * -bw / 2; x < w; x += bw) {
      const t = 118 + r() * 26; g.fillStyle = `rgb(${t},${t - 2},${t + 10})`;
      g.fillRect(x + 2, i * bh + 2, bw - 4, bh - 4);
      if (r() < 0.25) { g.fillStyle = "rgba(60,40,40,0.18)"; g.fillRect(x + 2, i * bh + 2, bw - 4, bh - 4); }
    }
  });
  murTex.wrapS = murTex.wrapT = THREE.RepeatWrapping;
  const H = 7.4;
  const vaegge = [[-4, -6.5, 4, -6.5], [-7, -3.5, -4, -6.5], [4, -6.5, 7, -3.5], [-7, 8.5, -7, -3.5], [7, -3.5, 7, 8.5], [7, 8.5, -7, 8.5]];
  T.mesh(ctx.root, T.vaegGeo(vaegge, H, 2.4), T.hold(new THREE.MeshStandardMaterial({ map: murTex, color: "#9a98aa", roughness: 0.95 })));

  /* ---------- Statisk geometri samlet i få meshes ---------- */
  const S = new Batch();         // belyst
  const L = new Batch();         // selvlysende (pærer, LED'er)
  const LYS = new Batch();       // additivt lys: måneskinsstråler
  const KEGLE = new Batch();     // additivt lys: pendlernes lyskegler (dæmpes i trinnene)

  // panel nederst på væggene (mørkt træ) og fodliste
  for (const [x1, z1, x2, z2] of vaegge) {
    const dx = x2 - x1, dz = z2 - z1, len = Math.hypot(dx, dz), ang = Math.atan2(dx, dz) * 180 / Math.PI + 90;
    const nx = -dz / len, nz = dx / len;  // indad (vægge er tegnet med uret set ovenfra)
    S.box("#2a2230", [(x1 + x2) / 2 + nx * 0.03, 0.55, (z1 + z2) / 2 + nz * 0.03], [len, 1.1, 0.06], [0, ang, 0]);
    S.box("#3b2f3c", [(x1 + x2) / 2 + nx * 0.06, 1.11, (z1 + z2) / 2 + nz * 0.06], [len, 0.05, 0.1], [0, ang, 0]);
  }

  // savtagstag: lodrette glasflader mod +z og skrå tagflader
  const TAGF = "#1a1d2e";
  S.box(TAGF, [0, 6.05, -5.75], [14, 0.1, 1.6]);
  const tagZ = [-5, 0, 5];
  for (const zA of tagZ) {
    S.box(TAGF, [0, 6.7, zA + 2.5], [14, 0.12, 5.2], [15.6, 0, 0]);
    S.box("#262a3d", [0, 5.95, zA], [14, 0.24, 0.24]);                       // stålbjælke under glasset
    S.box("#262a3d", [0, 7.36, zA - 0.02], [14, 0.1, 0.12]);
    for (let x = -6; x <= 6; x += 3) S.box("#22263a", [x, 6.65, zA + 2.5], [0.12, 0.12, 5.1], [15.6, 0, 0]); // spær
  }
  // ovenlysets glas: nattehimmel med sprosser (ét mesh)
  const himmelTex = T.canvas(1024, 128, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, "#1b2a5c"); gr.addColorStop(1, "#33467e");
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    const r = T.rng(11);
    for (let i = 0; i < 70; i++) { g.fillStyle = `rgba(230,236,255,${0.3 + r() * 0.6})`; g.fillRect(r() * w, r() * h * 0.8, 1.5, 1.5); }
    g.fillStyle = "#121524";
    for (let x = 0; x <= w; x += w / 10) g.fillRect(x - 4, 0, 8, h);
    g.fillRect(0, h / 2 - 3, w, 6); g.fillRect(0, 0, w, 6); g.fillRect(0, h - 6, w, 6);
  });
  const GL = new Batch({ uv: true });
  GL.plane([0, 6.7, -5 + 0.07], [11, 1.4]); GL.plane([0, 6.7, 0.07], [14, 1.4]); GL.plane([0, 6.7, 5.07], [14, 1.4]);
  T.mesh(ctx.root, GL.merge(), T.hold(new THREE.MeshBasicMaterial({ map: himmelTex, fog: false })));

  // måneskinsstråler fra ovenlyset (bløde, skrå lysflader)
  for (const zA of [-5, 0]) for (let x = -5.2; x <= 5.2; x += 2.6) {
    if (zA === -5 && Math.abs(x) > 4.5) continue;
    LYS.slant([x, 6.0, zA + 0.1], [x, 0, zA + 4.2], 1.2, "#121932", "#000000");
  }
  // lyse pletter på gulvet hvor strålerne rammer
  const pletTex = T.glow("#5d76c4");
  const P = new Batch({ uv: true });
  for (const zA of tagZ) for (let x = -5.2; x <= 5.2; x += 2.6) { if (zA === -5 && Math.abs(x) > 4.5) continue; if (zA === 5) continue; P.plane([x, 0.012, zA + 4.2], [2.2, 1.2], [-90, 0, 0]); }
  T.mesh(ctx.root, P.merge(), T.hold(new THREE.MeshBasicMaterial({ map: pletTex, transparent: true, opacity: 0.35, depthWrite: false, blending: THREE.AdditiveBlending })));

  // reoler langs sidevæggene med kasser, pap og ruller
  const rr = T.rng(21);
  for (const side of [-1, 1]) {
    const x = side * 6.75;
    for (const z0 of [0.5, 4.6]) {
      for (const y of [0.05, 0.75, 1.45, 2.15]) S.box("#3a2c22", [x, y, z0], [0.5, 0.04, 2.6]);
      for (const dz of [-1.28, 1.28]) S.box("#241c18", [x, 1.1, z0 + dz], [0.5, 2.2, 0.05]);
      for (const y of [0.07, 0.77, 1.47]) {
        let z = z0 - 1.2;
        while (z < z0 + 1.1) {
          const w = 0.2 + rr() * 0.35, hh = 0.15 + rr() * 0.4;
          const farve = ["#a87b52", "#8a6544", "#c79a68", "#4d5b7a", "#6f3d3a", "#cfc6b4"][Math.floor(rr() * 6)];
          if (rr() < 0.8) S.box(farve, [x, y + hh / 2 + 0.02, z + w / 2], [0.4, hh, w * 0.9]);
          z += w + 0.04;
        }
      }
    }
  }
  // papplader lænet op ad sidevæggen i hjørnet ved udgangen
  for (let i = 0; i < 4; i++) S.box(i % 2 ? "#b48659" : "#9d744b", [-6.92 + i * 0.05, 0.75, 7.6 - i * 0.12], [0.02, 1.5, 0.8], [0, 0, 8 + i * 2]);

  /* ---------- Station a0-1: de to lange arbejdsborde med prototyper ---------- */
  const BORD_Z = -0.8;
  const bord = kit.grp(ctx.root, `0 0 ${BORD_Z}`);
  const BB = new Batch();
  for (const bx of [-2.5, 2.5]) {
    BB.box("#8e6c47", [bx, 0.9, 0], [1.25, 0.07, 6.9]);
    BB.box("#6b5035", [bx, 0.86, 0], [1.21, 0.03, 6.86]);
    for (const lz of [-3.1, 0, 3.1]) {
      for (const lx of [-0.5, 0.5]) BB.box("#2b2f40", [bx + lx, 0.43, lz], [0.06, 0.86, 0.06]);
      BB.box("#2b2f40", [bx, 0.2, lz], [1.0, 0.05, 0.05]);
    }
    BB.box("#5a4330", [bx, 0.22, 0], [1.1, 0.03, 6.6]);  // hylde under bordet
    // ting på hylden
    const r2 = T.rng(bx > 0 ? 5 : 9);
    for (let z = -3; z < 3; z += 0.55 + r2() * 0.3) BB.box(r2() < 0.5 ? "#a77c50" : "#7e5b3c", [bx + (r2() - 0.5) * 0.4, 0.24 + 0.13, z], [0.4, 0.26, 0.4]);
    // småting på bordpladen: skæremåtter, papir, blyanter, tape
    const tx = bx > 0 ? -0.25 : 0.25;
    for (const z of [-1.7, 1.7]) BB.box("#28513f", [bx + tx * 0.3, 0.94, z], [0.6, 0.008, 0.45], [0, 8, 0]);
    for (const [dz, rot] of [[-3.0, 12], [-0.1, -7], [3.1, 20]]) BB.box("#d8d2c4", [bx - tx, 0.937, dz], [0.3, 0.004, 0.21], [0, rot, 0]);
    for (const [dz, c] of [[-1.3, "#e8b23c"], [-1.25, "#3a76c4"], [2.2, "#d14b3c"]]) BB.cyl(c, [bx - tx * 1.2, 0.945, dz], 0.008, 0.17, [0, 30, 90], 6);
    BB.add(T.geo.torus(0.045, 0.018), "#d9cfa5", [bx - tx * 1.4, 0.955, -2.2], [90, 0, 0]);
    BB.cyl("#c25a33", [bx + tx * 1.6, 0.98, 0.25], 0.05, 0.08, null, 10); // spole med ledning
    BB.cyl("#2a2a33", [bx + tx * 1.6, 0.98, 0.25], 0.02, 0.1, null, 6);
  }
  // pendellamper over bordene
  for (const bx of [-2.5, 2.5]) for (const lz of [-2.4, 0, 2.4]) {
    S.box("#11131c", [bx, 4.8, lz + BORD_Z], [0.015, 2.4, 0.015]);
    S.add(T.geo.cyl(14, 0.25), "#2b2420", [bx, 3.58, lz + BORD_Z], null, [0.5, 0.24, 0.5]);
    L.cyl("#d9b888", [bx, 3.46, lz + BORD_Z], 0.22, 0.01, null, 14);
    KEGLE.cone([bx, 3.45, lz + BORD_Z], 0.22, 0.9, 2.3, "#2a1a07");
  }
  T.mesh(bord, BB.merge(), T.lit());

  // de otte prototyper
  // rækkefølgen er bølgens rækkefølge: ned ad venstre bord og op ad højre
  const PROTOS = [
    { x: -2.5, z: 2.75, f: protoRobot }, { x: -2.5, z: 1.55, f: protoKuglebane }, { x: -2.5, z: 0.35, f: protoBreadboard }, { x: -2.5, z: -0.85, f: protoHus },
    { x: 2.5, z: -0.85, f: protoLampe }, { x: 2.5, z: 0.35, f: protoBil }, { x: 2.5, z: 1.55, f: protoTekstil }, { x: 2.5, z: 2.75, f: protoLydmaskine },
  ];
  const PSK = 1.7;   // prototyperne vises i 1,7 gange størrelse
  const poolTex = T.glow(A);
  const protos = PROTOS.map((p, i) => {
    const g = kit.grp(bord, `${p.x} 0.935 ${p.z}`, { rotation: `0 ${p.x < 0 ? 90 : -90} 0`, scale: `${PSK} ${PSK} ${PSK}` });
    const b = new Batch(); p.f(b);
    const m = T.lit({ emissive: new THREE.Color(A), emissiveIntensity: 0 });
    const body = T.mesh(g, b.merge(), m);
    const poolMat = T.hold(new THREE.MeshBasicMaterial({ map: poolTex, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
    const pg = T.hold(new THREE.PlaneGeometry(0.8, 0.8)); pg.rotateX(-Math.PI / 2);
    T.mesh(g, pg, poolMat, "0 0.006 0");
    return { body, m, poolMat, i, p };
  });

  /* pulten for enden af bordene: ét fælles oplæg til hele klassen (stationen for a0-1) */
  const PULT_Z = 3.45;
  const pult = kit.grp(ctx.root, `0 0 ${PULT_Z}`);
  const PB = new Batch();
  PB.box("#2b2f40", [0, 0.02, 0], [0.6, 0.04, 0.45]);
  PB.box("#3a2f2a", [0, 0.5, 0], [0.12, 0.96, 0.12]);
  PB.box("#8e6c47", [0, 1.02, 0], [0.7, 0.04, 0.5], [-25, 0, 0]);
  T.mesh(pult, PB.merge(), T.lit());
  const oplægTex = T.canvas(512, 360, (g, w, h) => {
    g.fillStyle = "#f3eee2"; T.rr(g, 0, 0, w, h, 20); g.fill();
    g.fillStyle = A; T.rr(g, 0, 0, w, 70, 20); g.fill(); g.fillRect(0, 40, w, 30);
    g.fillStyle = "#1a1206"; g.font = '700 38px "Familjen Grotesk", sans-serif'; g.textBaseline = "middle"; g.fillText("OPLÆG", 30, 38);
    g.fillStyle = "#1f2a4a"; g.font = '600 40px "Source Sans 3", sans-serif';
    ["Skab noget digitalt,", "der betyder noget", "for dig eller andre."].forEach((l, i) => g.fillText(l, 30, 128 + i * 56));
    g.fillStyle = "#8a8578"; g.font = 'italic 500 28px "Source Sans 3", sans-serif'; g.fillText("én opgave · mange svar", 30, 320);
  });
  const oplægM = T.hold(new THREE.MeshBasicMaterial({ map: oplægTex, color: "#bbb" }));
  T.mesh(pult, T.hold(new THREE.PlaneGeometry(0.6, 0.42)), oplægM, "0 1.045 0.0", { rotation: "-115 0 0" });
  const oplægGlød = T.hold(new THREE.MeshBasicMaterial({ map: poolTex, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
  T.mesh(pult, T.hold(new THREE.PlaneGeometry(1.3, 1.0)), oplægGlød, "0 1.04 -0.01", { rotation: "-115 0 0" });
  // lysbuer fra oplægget ud til hver prototype (tegnes frem, når prototypen lyser)
  const buer = protos.map(pr => {
    const a = new THREE.Vector3(0, 1.08, PULT_Z - 0.05);
    const b = new THREE.Vector3(pr.p.x * 0.93, 0.935 + 0.45, pr.p.z + BORD_Z);
    const mid = a.clone().lerp(b, 0.5); mid.y += 0.9;
    const geo = T.hold(new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(a, mid, b), 28, 0.008, 4, false));
    const m = T.hold(new THREE.MeshBasicMaterial({ color: A, transparent: true, opacity: 0, depthWrite: false }));
    T.mesh(ctx.root, geo, m);
    return { geo, m, n: geo.index ? geo.index.count : geo.attributes.position.count };
  });
  ctx.station("a0-1", pult);
  ctx.sign(ctx.step("a0-1").title, { parent: pult, position: "0 1.38 -0.2", width: 1.3, size: 74 });

  /* ---------- Målpladen ved udgangen (station a0-2) ---------- */
  // stationen står på gulvet foran væggen; pladen hænger på væggen bag den
  const PL = { x: 2.1, y: 2.3, z: 8.42 };
  const pladeSt = kit.grp(ctx.root, `${PL.x} 0 7.3`, { rotation: "0 180 0" });
  const plade = kit.grp(pladeSt, `0 ${PL.y} ${-(PL.z - 7.3)}`);
  const PW = 3.3, PH = 2.16, CW = 1040, CH = 680;
  // fire nøgleord på en løkke (arbejdet går rundt), og en pil ud til et produkt, der stadig er stiplet/ufærdigt
  const LCX = 400, LCY = 420, LRX = 250, LRY = 150;
  const ORD = [
    { t: "iterativt", a: -90 }, { t: "intentioner", a: 0 }, { t: "metoder", a: 90 }, { t: "argumentation", a: 180 },
  ].map(o => ({ ...o, x: LCX + Math.cos(o.a * Math.PI / 180) * LRX, y: LCY + Math.sin(o.a * Math.PI / 180) * LRY, w: o.t.length * 23 + 50 }));
  const CHIP_H = 70;
  const tegnChip = (g, o, lys) => {
    g.fillStyle = lys ? A : "#222a48"; T.rr(g, o.x - o.w / 2, o.y - CHIP_H / 2, o.w, CHIP_H, 35); g.fill();
    if (!lys) { g.strokeStyle = "#3a4472"; g.lineWidth = 3; g.stroke(); }
    g.fillStyle = lys ? "#1a1206" : "#8a92bb"; g.font = '700 40px "Familjen Grotesk", sans-serif'; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(o.t, o.x, o.y + 2); g.textAlign = "left";
  };
  const pladeTex = T.canvas(CW, CH, (g, w, h) => {
    g.fillStyle = "#151a2e"; T.rr(g, 0, 0, w, h, 26); g.fill();
    g.strokeStyle = A; g.globalAlpha = 0.55; g.lineWidth = 4; T.rr(g, 14, 14, w - 28, h - 28, 18); g.stroke(); g.globalAlpha = 1;
    g.fillStyle = A; g.font = '600 40px "JetBrains Mono", monospace'; g.textBaseline = "middle";
    g.fillText("OMRÅDETS MÅL", 60, 80);
    g.fillStyle = "#c3c8e6"; g.font = '500 36px "Source Sans 3", sans-serif';
    g.fillText(ctx.room.sub, 60, 128);
    // løkken med pilespidser i urets retning
    g.strokeStyle = "#5a628f"; g.lineWidth = 6; g.beginPath(); g.ellipse(LCX, LCY, LRX, LRY, 0, 0, Math.PI * 2); g.stroke();
    g.fillStyle = "#5a628f";
    for (const a of [-45, 45, 135, 225]) {
      const r = a * Math.PI / 180, x = LCX + Math.cos(r) * LRX, y = LCY + Math.sin(r) * LRY;
      const tx = -Math.sin(r) * LRX, ty = Math.cos(r) * LRY, tl = Math.hypot(tx, ty), ux = tx / tl, uy = ty / tl;
      g.beginPath(); g.moveTo(x + ux * 16, y + uy * 16); g.lineTo(x - ux * 10 - uy * 12, y - uy * 10 + ux * 12); g.lineTo(x - ux * 10 + uy * 12, y - uy * 10 - ux * 12); g.fill();
    }
    // pil fra løkken ud mod produktet
    g.strokeStyle = "#5a628f"; g.setLineDash([14, 12]); g.beginPath(); g.moveTo(LCX + LRX + 110, LCY); g.lineTo(820, LCY); g.stroke(); g.setLineDash([]);
    g.beginPath(); g.moveTo(838, LCY); g.lineTo(816, LCY - 14); g.lineTo(816, LCY + 14); g.fill();
    // det ufærdige produkt: stiplet omrids af en kasse
    g.strokeStyle = "#8a92bb"; g.lineWidth = 5; g.setLineDash([12, 10]); T.rr(g, 858, LCY - 70, 130, 140, 16); g.stroke(); g.setLineDash([]);
    g.fillStyle = "#8a92bb"; g.font = 'italic 500 26px "Source Sans 3", sans-serif'; g.textAlign = "center"; g.fillText("produktet", 923, LCY + 102); g.textAlign = "left";
    ORD.forEach(o => tegnChip(g, o, false));
  });
  const pladeB = new Batch();
  pladeB.box("#2a2230", [0, 0, -0.02], [PW + 0.08, PH + 0.08, 0.05]);
  for (const sx of [-1, 1]) pladeB.box("#454a5e", [sx * 1.1, (6.0 - PL.y) / 2 + PH / 4, 0], [0.012, 6.0 - PL.y - PH / 2, 0.012]);
  T.mesh(plade, pladeB.merge(), T.lit());
  const haloMat = T.hold(new THREE.MeshBasicMaterial({ map: T.glow(A), transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
  T.mesh(plade, T.hold(new THREE.PlaneGeometry(4.6, 3.4)), haloMat, "0 0 -0.08");
  const pladeMat = T.hold(new THREE.MeshBasicMaterial({ map: pladeTex, transparent: true, color: "#777" }));
  T.mesh(plade, T.hold(new THREE.PlaneGeometry(PW, PH)), pladeMat, "0 0 0.012");
  const ordFelter = ORD.map((o, i) => {
    const pad = 24, tw = o.w + pad * 2, th = CHIP_H + pad * 2;
    const tex = T.canvas(tw, th, (g, w, h) => { g.shadowColor = A; g.shadowBlur = 20; tegnChip(g, { ...o, x: w / 2, y: h / 2 }, true); });
    const m = T.hold(new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0, depthWrite: false }));
    const cx = (o.x - CW / 2) / CW * PW, cy = (CH / 2 - o.y) / CH * PH;
    const e = T.mesh(plade, T.hold(new THREE.PlaneGeometry(tw / CW * PW, th / CH * PH)), m, `${cx} ${cy} ${0.02 + i * 0.001}`);
    return { m, e };
  });
  // en lysprik, der løber rundt på løkken, når ordene er tændt
  const prikM = T.hold(new THREE.MeshBasicMaterial({ map: T.glow("#ffe0a8"), transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
  const prik = T.mesh(plade, T.hold(new THREE.PlaneGeometry(0.22, 0.22)), prikM, "0 0 0.03");
  // opslagstavle med skitser og post-its ved siden af målpladen (ét plan)
  const tavleTex = T.canvas(512, 384, (g, w, h) => {
    const r = T.rng(17);
    g.fillStyle = "#6b4f36"; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 900; i++) { g.fillStyle = `rgba(${r() < 0.5 ? "40,25,15" : "150,110,70"},0.25)`; g.fillRect(r() * w, r() * h, 2, 2); }
    g.strokeStyle = "#2d1f14"; g.lineWidth = 10; g.strokeRect(5, 5, w - 10, h - 10);
    const ark = [[30, 30, 150, 110, -4], [200, 24, 130, 160, 3], [350, 40, 130, 100, -2], [40, 170, 140, 170, 2], [210, 210, 120, 120, -5], [360, 170, 120, 90, 4]];
    ark.forEach(([x, y, aw, ah, rot], i) => {
      g.save(); g.translate(x + aw / 2, y + ah / 2); g.rotate(rot * Math.PI / 180);
      g.fillStyle = i === 4 || i === 5 ? (i === 4 ? "#f2c94c" : "#f29e6b") : "#e8e2d2"; g.fillRect(-aw / 2, -ah / 2, aw, ah);
      g.strokeStyle = "#3a4a7a"; g.lineWidth = 3;
      if (i === 0) { g.strokeRect(-50, -30, 60, 45); g.beginPath(); g.arc(35, -5, 18, 0, 7); g.stroke(); g.beginPath(); g.moveTo(-60, 35); g.lineTo(60, 35); g.stroke(); }
      if (i === 1) { for (let k = 0; k < 6; k++) { g.beginPath(); g.moveTo(-50, -60 + k * 22); g.lineTo(40 - (k % 3) * 20, -60 + k * 22); g.stroke(); } }
      if (i === 2) { g.beginPath(); g.moveTo(-50, 30); g.bezierCurveTo(-20, -40, 20, 40, 50, -30); g.stroke(); }
      if (i === 3) { g.strokeRect(-40, -60, 80, 50); g.beginPath(); g.moveTo(0, -10); g.lineTo(0, 30); g.lineTo(-30, 60); g.moveTo(0, 30); g.lineTo(30, 60); g.stroke(); }
      if (i >= 4) { g.strokeStyle = "#5a3a1a"; for (let k = 0; k < 3; k++) { g.beginPath(); g.moveTo(-40, -25 + k * 22); g.lineTo(35, -25 + k * 22); g.stroke(); } }
      g.fillStyle = "#c0392b"; g.beginPath(); g.arc(0, -ah / 2 + 10, 6, 0, 7); g.fill();
      g.restore();
    });
  });
  const tavleM = T.hold(new THREE.MeshStandardMaterial({ map: tavleTex, roughness: 0.9 }));
  T.mesh(ctx.root, T.hold(new THREE.PlaneGeometry(1.8, 1.35)), tavleM, "5.55 2.05 8.44", { rotation: "0 180 0" });
  ctx.station("a0-2", pladeSt);
  ctx.sign(ctx.step("a0-2").title, { position: `${PL.x} ${PL.y + PH / 2 + 0.42} ${PL.z - 0.05}`, rotation: "0 180 0", width: 2.1 });

  /* ---------- Lys, døre og skilte ---------- */
  const lysBord = kit.el("a-entity", { position: `0 3.1 ${BORD_Z}`, light: "type: point; color: #ffb35c; intensity: 2.2; distance: 11; decay: 1.2" });
  const lysPlade = kit.el("a-entity", { position: `${PL.x} 3.0 ${PL.z - 1.8}`, light: "type: point; color: #ffc27a; intensity: 0; distance: 7; decay: 1.2" });

  T.mesh(ctx.root, S.merge(), T.lit());
  T.mesh(ctx.root, L.merge(), T.basic());
  T.mesh(ctx.root, LYS.merge(), T.additive({ opacity: 0.6 }));
  const kegleMat = T.additive({ opacity: 0.3 });
  T.mesh(ctx.root, KEGLE.merge(), kegleMat);

  // døre: venstre til processerne, højre til metoderne, udgangen bag én
  const dorL = [-5.5 + 0.22 * 0.707, -5 + 0.22 * 0.707], dorR = [5.5 - 0.22 * 0.707, -5 + 0.22 * 0.707];
  const dørA1 = ctx.door("a1", { position: `${dorL[0]} 0 ${dorL[1]}`, rotation: "0 45 0" });
  const dørA2 = ctx.door("a2", { position: `${dorR[0]} 0 ${dorR[1]}`, rotation: "0 -45 0" });
  // dørenes egne skilte (rammens, med navn og undertitel) gøres større og drejes mod spawn, så de kan læses derfra
  for (const [dør, d] of [[dørA1, dorL], [dørA2, dorR]]) {
    const skilt = dør.sign || dør.lastElementChild;   // rammen giver dørens navneskilt som .sign
    const yaw = Math.atan2(0 - d[0], 5 - d[1]) * 180 / Math.PI - (d === dorL ? 45 : -45);
    skilt.setAttribute("scale", "1.45 1.45 1.45"); skilt.setAttribute("rotation", `0 ${yaw} 0`);
    skilt.object3D.position.y += 0.35;
  }
  ctx.door(ctx.room.parent, { position: "-5.0 0 8.28", rotation: "0 180 0" });
  // mørk døråbning bag portalerne og en lysplet på gulvet foran dem
  const DO = new Batch({ uv: true });
  DO.plane([dorL[0] - 0.05, 1.25, dorL[1] - 0.05], [1.6, 2.5], [0, 45, 0]);
  DO.plane([dorR[0] + 0.05, 1.25, dorR[1] - 0.05], [1.6, 2.5], [0, -45, 0]);
  DO.plane([-5.0, 1.25, 8.36], [1.6, 2.5], [0, 180, 0]);
  T.mesh(ctx.root, DO.merge(), T.hold(new THREE.MeshBasicMaterial({ color: "#04050b" })));
  // et symbol på gulvet foran hver dør: Værkstedet = kort → skitse → kasse, Metodelaboratoriet = spiral
  const symbol = tegn => T.canvas(256, 256, (g, w, h) => {
    const gr = g.createRadialGradient(128, 128, 30, 128, 128, 128); gr.addColorStop(0, "rgba(242,165,65,0.35)"); gr.addColorStop(1, "rgba(242,165,65,0)");
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.strokeStyle = A; g.lineWidth = 7; g.lineCap = "round"; g.lineJoin = "round";
    g.beginPath(); g.arc(128, 128, 96, 0, 7); g.stroke(); tegn(g);
  });
  const symA1 = symbol(g => { g.strokeRect(52, 104, 34, 46); g.strokeRect(112, 100, 40, 52); g.beginPath(); g.moveTo(120, 140); g.lineTo(144, 112); g.stroke(); g.fillStyle = A; g.fillRect(176, 108, 34, 40);
    g.beginPath(); g.moveTo(92, 127); g.lineTo(106, 127); g.moveTo(158, 127); g.lineTo(170, 127); g.stroke(); });
  const symA2 = symbol(g => { g.beginPath(); for (let a = 0; a < Math.PI * 5.2; a += 0.08) { const r = 8 + a * 4.6; const x = 128 + Math.cos(a) * r, y = 128 + Math.sin(a) * r; a ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke(); });
  const symM = [symA1, symA2].map(tx => T.hold(new THREE.MeshBasicMaterial({ map: tx, transparent: true, opacity: 0.75, depthWrite: false })));
  const symGeo = T.hold(new THREE.PlaneGeometry(1.3, 1.3)); symGeo.rotateX(-Math.PI / 2);
  T.mesh(ctx.root, symGeo, symM[0], `${dorL[0] + 0.85} 0.016 ${dorL[1] + 0.85}`, { rotation: "0 45 0" });
  T.mesh(ctx.root, symGeo, symM[1], `${dorR[0] - 0.85} 0.016 ${dorR[1] + 0.85}`, { rotation: "0 -45 0" });
  // lysstriber på gulvet fra hvert bords bagende til dets dør (bordet hører til døren)
  const striber = [[-2.5, dorL[0] + 0.85, dorL[1] + 0.85], [2.5, dorR[0] - 0.85, dorR[1] + 0.85]].map(([bx, dx, dz]) => {
    const fra = new THREE.Vector3(bx, 0.014, BORD_Z - 3.5), til = new THREE.Vector3(dx, 0.014, dz);
    const len = fra.distanceTo(til), g = new THREE.PlaneGeometry(0.09, len);
    g.rotateX(-Math.PI / 2); g.rotateY(Math.atan2(til.x - fra.x, til.z - fra.z));
    g.translate((fra.x + til.x) / 2, 0.014, (fra.z + til.z) / 2);
    const m = T.hold(new THREE.MeshBasicMaterial({ color: A, transparent: true, opacity: 0.25, depthWrite: false }));
    T.mesh(ctx.root, T.hold(g), m); return m;
  });

  ctx.sign(ctx.room.name, { sub: ctx.room.sub, position: "0 4.7 -6.42", width: 4.2 });
  const erk = T.erkendeformer(ctx.root, "-3.7 4.7 -6.38", "0 0 0", 1.8);

  /* ---------- Views ---------- */
  ctx.view("a0-1", { position: [0, 0, 6.6], lookAt: [0, 1.35, -2.5] });
  ctx.view("a0-2", { position: [1.75, 0, 4.4], lookAt: [1.85, 2.2, 8.5], pitch: 9 });

  /* ---------- Trin og animation ---------- */
  let aktiv = null, t0 = null;
  // stikord fra speaken (sekunder i trinnet). Tidskoderne hentes asynkront, når et trin starter,
  // så stikordene slås op igen i hver frame (billigt) i stedet for én gang ved opbygningen.
  const mkQ = () => { const Q = {
    bølge: ctx.cue("a0-1", "skabe digitale artefakter"),
    dørA1: ctx.cue("a0-1", "Værkstedet for processerne"), dørA2: ctx.cue("a0-1", "Metodelaboratoriet for metoderne"),
    plade: ctx.cue("a0-2", "Området har ét mål"),
    ord: [ctx.cue("a0-2", "iterativt"), ctx.cue("a0-2", "intentioner"), ctx.cue("a0-2", "kreative metoder"), ctx.cue("a0-2", "argumentation")],
  };
    Q.ord[2] += 0.45;   // fremhæv ved selve ordet "metoder"
    return Q; };
  let Q = mkQ();
  const lerp = (a, b, k) => a + (b - a) * k;
  return {
    onStep(id) { aktiv = id; t0 = null; },
    tick(t, dt) {
      Q = mkQ();
      if (t0 === null) t0 = t;
      const s = (t - t0) / 1000, nt = ctx.time();   // nt: fortællingens tid
      erk.tick(dt, aktiv === "a0-1" ? 1 : 0.4);
      // a0-1: prototyperne lyser op én efter én i en bølge rundt om bordene
      const N = protos.length, trin = 0.6, periode = N * trin + 2.2;
      protos.forEach(p => {
        let v = 0;
        const s = nt - Q.bølge;   // bølgen starter, når speaken siger "skabe digitale artefakter"
        if (aktiv === "a0-1" && s >= -0.2) {
          // hver prototype blusser op på sin tur og bliver ved med at gløde svagt, til runden starter forfra
          const lok = ((s - p.i * trin) % periode + periode) % periode, slut = (N - p.i) * trin + 0.8;
          if (s - p.i * trin >= 0) v = lok < 0.5 ? lok / 0.5 : lok < slut ? 0.3 + 0.7 * Math.exp(-(lok - 0.5) * 3) : Math.max(0, 0.3 * (1 - (lok - slut) / 0.6));
        }
        p.m.emissiveIntensity = 0.75 * v;
        p.poolMat.opacity = 0.9 * v;
        const sk = 1 + 0.08 * v; p.body.object3D.scale.set(sk, sk, sk);
        // buen fra oplægget tegnes frem, når prototypen tændes, og bliver stående svagt
        const bu = buer[p.i], lok = aktiv === "a0-1" && s >= -0.2 ? s - p.i * trin : -1;
        const fr = aktiv === "a0-1" ? Math.min(1, Math.max(0, (((lok % periode) + periode) % periode) / 0.45)) : 0;
        bu.geo.setDrawRange(0, Math.floor(fr * bu.n / 3) * 3);
        bu.m.opacity = aktiv === "a0-1" && lok >= 0 ? 0.25 + 0.65 * v : 0;
      });
      const intro = aktiv === "a0-1";
      oplægM.color.setScalar(intro ? 1 : 0.6);
      oplægGlød.opacity = intro ? 0.35 + 0.15 * Math.sin(s * 2) : 0;
      kegleMat.opacity = intro ? 0.12 : 0.22;
      // dørene fremhæves, når de nævnes: lysstribe og symbol blusser op og bliver stående tydelige
      [Q.dørA1, Q.dørA2].forEach((c, i) => {
        const d = intro ? nt - c + 0.2 : -1, k = d < 0 ? 0 : Math.min(1, d / 0.3), puls = d > 0 && d < 1.2 ? Math.sin(d / 1.2 * Math.PI) : 0;
        striber[i].opacity = 0.25 + 0.5 * k + 0.25 * puls; symM[i].opacity = 0.6 + 0.4 * k;
      });
      // a0-2: pladen tændes, og nøgleordene fremhæves ét ad gangen
      const on = aktiv === "a0-2";
      const k = on ? Math.min(Math.max(0, nt - Q.plade + 0.3) / 0.8, 1) : 0;   // pladen tændes ved "Området har ét mål"
      const c = lerp(0.42, 1, k); pladeMat.color.setRGB(c, c, c);
      haloMat.opacity = on ? 0.55 * k + 0.08 * Math.sin(s * 2.2) * k : 0;
      T.lys(lysPlade, on ? 1.6 * k : 0);
      T.lys(lysBord, on ? 0.7 : intro ? 1.5 : 2.0);
      tavleM.color.setScalar(on ? 0.35 : 1);
      prikM.opacity = on && nt > Q.ord[3] + 0.4 ? 0.9 : 0;   // løkken løber, når alle fire ord er nævnt
      { const a = s * 1.1 - Math.PI / 2; prik.object3D.position.set(Math.cos(a) * LRX / CW * PW + (LCX - CW / 2) / CW * PW, (CH / 2 - LCY - Math.sin(a) * LRY) / CH * PH, 0.03); }
      ordFelter.forEach((o, i) => {
        const ki = on ? Math.max(0, Math.min((nt - Q.ord[i] + 0.3) / 0.3, 1)) : 0;   // tændt, når ordet siges
        o.m.opacity = ki;
        const pop = 1 + 0.2 * Math.sin(Math.PI * ki); o.e.object3D.scale.set(pop, pop, 1);
      });
      T.syncVis();
    },
    dispose() { T.dispose(); },
  };

  /* ---------- Prototyperne (lokale koordinater, forsiden mod +z, bordpladen i y = 0) ---------- */
  function protoRobot(b) { // pap-robot med tapede samlinger
    b.box("#b8875a", [0, 0.17, 0], [0.26, 0.3, 0.2]);
    b.box("#d8cba0", [0, 0.2, 0.101], [0.27, 0.04, 0.005]);
    b.box("#c49565", [0, 0.42, 0], [0.22, 0.18, 0.18]);
    for (const x of [-0.05, 0.05]) { b.cyl("#fff1c9", [x, 0.43, 0.092], 0.028, 0.02, [90, 0, 0], 10); b.cyl("#1b1d29", [x, 0.43, 0.1], 0.012, 0.01, [90, 0, 0], 8); }
    b.box("#5a3b25", [0, 0.37, 0.091], [0.08, 0.015, 0.005]);
    b.cyl("#555a6e", [0, 0.56, 0], 0.006, 0.1, null, 5); b.sph("#e8563c", [0, 0.62, 0], 0.022);
    for (const x of [-0.16, 0.16]) b.box("#a87a4f", [x, 0.2, 0.02], [0.05, 0.2, 0.05], [20, 0, x > 0 ? -15 : 15]);
    b.box("#2c5c43", [0, 0.1, 0.103], [0.1, 0.07, 0.005]);
  }
  function protoKuglebane(b) { // kuglebane i træ
    b.box("#a77b4f", [0, 0.015, 0], [0.48, 0.03, 0.3]);
    for (const x of [-0.2, 0.2]) b.box("#8a6238", [x, 0.3, -0.08], [0.035, 0.56, 0.035]);
    [[0.48, 10], [0.34, -10], [0.2, 10]].forEach(([y, r]) => { b.box("#c79a68", [0, y, -0.03], [0.42, 0.02, 0.08], [0, 0, r]); b.box("#8a6238", [0, y + 0.02, 0.01], [0.42, 0.025, 0.01], [0, 0, r]); });
    b.sph("#5aa2ff", [-0.15, 0.52, -0.03], 0.026);
    b.sph("#e8563c", [0.12, 0.23, -0.03], 0.026);
    b.box("#d8d2c4", [0.14, 0.032, 0.09], [0.12, 0.004, 0.09], [0, 15, 0]);
  }
  function protoBreadboard(b) { // breadboard med mikrocontroller, LED'er og ledninger
    b.box("#e8e4da", [0, 0.018, 0], [0.38, 0.035, 0.15]);
    for (let i = 0; i < 9; i++) b.box("#bdb7a8", [-0.16 + i * 0.04, 0.036, 0], [0.025, 0.002, 0.11]);
    b.box("#1d4f8a", [-0.02, 0.05, -0.15], [0.16, 0.016, 0.1]);
    b.box("#14161e", [-0.02, 0.062, -0.15], [0.05, 0.01, 0.05]);
    [["#ff4a3a", -0.1], ["#ffcf3a", -0.03], ["#3aff7a", 0.04]].forEach(([c, x]) => { b.cyl(c, [x, 0.06, 0.03], 0.012, 0.04, null, 8); b.sph(c, [x, 0.08, 0.03], 0.012); });
    [["#d14b3c", -0.12], ["#2f6fd1", -0.06], ["#f2c94c", 0.0], ["#3aa35a", 0.06]].forEach(([c, x], i) => b.add(T.geo.torus(0.06 + i * 0.01, 0.004, 4, 10, Math.PI), c, [x, 0.04, -0.06], [0, 90, 0]));
    b.box("#22232c", [0.14, 0.04, -0.14], [0.1, 0.06, 0.07]);
    b.box("#2f6fd1", [0.12, 0.06, 0.12], [0.07, 0.05, 0.04]);
    b.box("#f2f2f2", [0.12, 0.09, 0.12], [0.08, 0.005, 0.012]);
  }
  function protoHus(b) { // pap-hus med servostyret dør
    b.box("#b8875a", [0, 0.11, 0], [0.3, 0.22, 0.24]);
    b.add(T.geo.cyl(3), "#9d744b", [0, 0.27, 0], [0, 0, 90], [0.2, 0.32, 0.34]);
    b.box("#ffd98a", [-0.07, 0.13, 0.121], [0.07, 0.07, 0.004]);
    b.box("#3b2a1c", [0.07, 0.08, 0.121], [0.07, 0.14, 0.004]);
    b.box("#2f6fd1", [0.17, 0.06, 0.05], [0.04, 0.05, 0.06]);
    b.box("#e8e4da", [0.17, 0.1, 0.07], [0.012, 0.06, 0.005]);
  }
  function protoLampe(b) { // lampe af træliste og pap
    b.cyl("#8a6238", [0, 0.02, 0], 0.1, 0.04, null, 14);
    b.box("#c79a68", [0, 0.2, 0], [0.025, 0.34, 0.025], [0, 0, -12]);
    b.box("#c79a68", [0.08, 0.4, 0.0], [0.025, 0.22, 0.025], [0, 0, 55]);
    b.add(T.geo.cyl(12, 0.45), "#b8875a", [0.17, 0.42, 0], [0, 0, -120], [0.16, 0.12, 0.16]);
    b.sph("#ffe9b8", [0.19, 0.4, 0], 0.03);
    b.cyl("#22232c", [-0.08, 0.025, 0.06], 0.012, 0.03, null, 6);
  }
  function protoBil(b) { // robotbil med afstandssensor
    b.box("#c79a68", [0, 0.06, 0], [0.24, 0.025, 0.3]);
    for (const x of [-0.14, 0.14]) for (const z of [-0.09, 0.09]) b.cyl("#1b1d29", [x, 0.045, z], 0.045, 0.03, [0, 0, 90], 12);
    b.box("#1d4f8a", [0, 0.085, -0.02], [0.14, 0.015, 0.1]);
    b.box("#22232c", [0, 0.1, -0.11], [0.12, 0.03, 0.06]);
    b.box("#2f6fd1", [0, 0.1, 0.14], [0.1, 0.03, 0.02]);
    for (const x of [-0.025, 0.025]) b.cyl("#c9cdd8", [x, 0.1, 0.16], 0.016, 0.02, [90, 0, 0], 10);
  }
  function protoTekstil(b) { // filt med ledende tråd og LED'er
    b.box("#5a4330", [0, 0.015, -0.02], [0.3, 0.03, 0.12]);
    b.box("#b0413e", [0, 0.17, 0], [0.32, 0.26, 0.012], [-14, 0, 0]);
    b.push([0, 0.17, 0.008], [-14, 0, 0]);
    [[-0.1, 0.08, 0.2, 0], [0.0, 0.08, 0.012, 0], [0.1, -0.02, 0.012, 0.2], [-0.02, -0.08, 0.2, 0]].forEach(([x, y, w, h]) => b.box("#d6d9e4", [x, y, 0], [w || 0.012, h || 0.012, 0.004]));
    for (const [x, y] of [[-0.1, 0.08], [0.1, 0.08], [0.1, -0.08], [-0.1, -0.08]]) b.sph("#fff1c9", [x, y, 0.006], 0.014);
    b.cyl("#c9cdd8", [0, -0.02, 0.006], 0.03, 0.01, [90, 0, 0], 12);
    b.pop();
  }
  function protoLydmaskine(b) { // lydmaskine i pap med højttaler og drejeknapper
    b.box("#a87a50", [0, 0.1, 0], [0.32, 0.2, 0.2]);
    b.cyl("#1b1d29", [-0.07, 0.1, 0.1], 0.065, 0.01, [90, 0, 0], 14);
    b.add(T.geo.cyl(14, 0.35), "#33364a", [-0.07, 0.1, 0.11], [-90, 0, 0], [0.12, 0.03, 0.12]);
    for (const [x, c] of [[0.06, "#f2c94c"], [0.11, "#d14b3c"]]) b.cyl(c, [x, 0.15, 0.105], 0.018, 0.02, [90, 0, 0], 8);
    b.box("#e8e4da", [0.085, 0.06, 0.101], [0.08, 0.03, 0.004]);
    b.cyl("#555a6e", [0.12, 0.25, -0.05], 0.005, 0.12, [0, 0, -20], 5);
  }
}

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
      g.fillStyle = "rgba(42,48,92,0.92)"; g.beginPath(); g.arc(128, 128, 124, 0, 7); g.fill();
      g.strokeStyle = L; g.globalAlpha = 0.9; g.lineWidth = 5; g.beginPath(); g.arc(128, 128, 119, 0, 7); g.stroke(); g.globalAlpha = 1;
      g.fillStyle = L; g.font = '600 24px "JetBrains Mono", monospace'; g.textAlign = "center"; g.fillText("ERKENDEFORMER", 128, 290);
    });
    const pladeM = hold(new THREE.MeshBasicMaterial({ map: pladeTex, transparent: true, depthWrite: false }));
    mesh(grp, geo.plane(), pladeM, "0 -0.06 -0.005", { scale: "1.0 1.17 1" });
    const mats = [pladeM];
    const items = tegn.map((f, i) => {
      const tex = canvas(256, 256, g => { g.strokeStyle = L; g.fillStyle = L; g.lineWidth = 12; g.lineCap = "round"; g.lineJoin = "round"; f(g); });
      const m = hold(new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0.95, depthWrite: false })); mats.push(m);
      return mesh(grp, geo.plane(), m, "0 0 0", { scale: "0.3 0.3 0.3" });
    });
    let a = 0;
    // alpha < 1 dæmper tegnet i trin, hvor det ikke er i fokus
    return { tick(dt, alpha = 1) { mats.forEach((m, i) => { m.opacity = (i ? 0.95 : 1) * alpha; }); a += (dt || 16) * 0.00025; items.forEach((it, i) => { const v = a + i * 2.094; it.object3D.position.set(Math.cos(v) * 0.27, Math.sin(v) * 0.27, 0); }); } };
  }
  /* sæt et lys' styrke direkte (billigere end setAttribute hver frame) */
  function lys(el, v) { const l = el.getObject3D("light"); if (l) l.intensity = v; }
  function dispose() { affald.forEach(x => x && x.dispose && x.dispose()); Object.values(cache).forEach(g => g.dispose()); }
  return { THREE, Batch, geo, hold, lit, basic, additive, canvas, glow, mesh, rng, rr, vaegGeo, erkendeformer, lys, syncVis, dispose };
}
