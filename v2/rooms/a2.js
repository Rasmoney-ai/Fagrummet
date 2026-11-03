/* Delrum A2 · Metodelaboratoriet — Kreative metoder.
   Et laboratorium om natten: fliser, hvide kakler, runde loftslamper. Midt i rummet står en spiraltrappe,
   der viser iteration. Til venstre et skråbord med et indramningsark og bagved en væg med benspændskort.
   Til højre en terning, der skifter tilstand, og en urtepotte med en fugtsensor.
   Trin: a2-0 (de fire stationer lyser op hver for sig), a2-1 indramning, a2-2 afprøvninger (spiralen),
   a2-3 metoder til kreativitet (et kort trækkes, prototypen ændrer sig), a2-4 digitale benspænd (terningen). */

export default function build(ctx) {
  const { THREE, kit, K } = ctx;
  const A = ctx.room.color;
  const T = vaerktoej(ctx);
  const { Batch } = T;
  const D = Math.PI / 180;

  ctx.env({ background: "#070a14", fog: "type: linear; color: #070a14; near: 12; far: 26" });

  /* ---------- Rummet ---------- */
  const X = 6.5, Z0 = -7.5, Z1 = 6.5, H = 4.6;
  const gulvTex = T.canvas(512, 512, (g, w, h) => {
    const r = T.rng(12);
    const n = 8, s = w / n;
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { const v = 44 + r() * 10; g.fillStyle = `rgb(${v - 6},${v},${v + 12})`; g.fillRect(i * s, j * s, s, s); }
    g.strokeStyle = "rgba(10,12,20,0.9)"; g.lineWidth = 3;
    for (let i = 0; i <= n; i++) { g.beginPath(); g.moveTo(i * s, 0); g.lineTo(i * s, h); g.stroke(); g.beginPath(); g.moveTo(0, i * s); g.lineTo(w, i * s); g.stroke(); }
  });
  gulvTex.wrapS = gulvTex.wrapT = THREE.RepeatWrapping; gulvTex.repeat.set(X * 2 / 4, (Z1 - Z0) / 4);
  const gulvGeo = T.hold(new THREE.PlaneGeometry(X * 2, Z1 - Z0)); gulvGeo.rotateX(-Math.PI / 2);
  T.mesh(ctx.root, gulvGeo, T.hold(new THREE.MeshStandardMaterial({ map: gulvTex, roughness: 0.7, metalness: 0.05 })), `0 0 ${(Z0 + Z1) / 2}`);
  // vægge: hvide kakler nederst, mørk blågrå maling øverst, en tynd ravgul stribe imellem
  const vaegTex = T.canvas(512, 512, (g, w, h) => {
    const r = T.rng(5);
    g.fillStyle = "#262b40"; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 400; i++) { g.fillStyle = `rgba(255,255,255,${r() * 0.03})`; g.fillRect(r() * w, r() * h * 0.6, 6, 6); }
    // nederst mørke, lodrette træpaneler (lab'et er et værksted for metoder, ikke et hospital)
    const ty = h * 0.62, pw = 64;
    for (let x = 0; x < w; x += pw) { const v = 58 + r() * 10; g.fillStyle = `rgb(${v + 14},${v + 2},${v - 8})`; g.fillRect(x + 2, ty, pw - 4, h - ty);
      g.fillStyle = "rgba(0,0,0,0.25)"; g.fillRect(x + pw - 6, ty, 4, h - ty); for (let k = 0; k < 6; k++) { g.fillStyle = "rgba(20,10,4,0.18)"; g.fillRect(x + 6 + r() * (pw - 16), ty + 4, 1.5, h - ty - 8); } }
    g.fillStyle = "#3a3f55"; g.fillRect(0, ty - 10, w, 10);
    g.fillStyle = A; g.fillRect(0, ty - 14, w, 4);
  });
  vaegTex.wrapS = THREE.RepeatWrapping;
  const vaegge = [[-X, Z0, X, Z0], [X, Z0, X, Z1], [X, Z1, -X, Z1], [-X, Z1, -X, Z0]];
  T.mesh(ctx.root, T.vaegGeo(vaegge, H, 4, H * 0.95), T.hold(new THREE.MeshStandardMaterial({ map: vaegTex, roughness: 0.6 })));

  const S = new Batch(), L = new Batch(), LYS = new Batch();
  // loft og runde loftslamper
  S.box("#121522", [0, H + 0.05, (Z0 + Z1) / 2], [X * 2, 0.1, Z1 - Z0]);
  for (let z = Z0 + 2; z < Z1; z += 4) S.box("#1c2033", [0, H - 0.12, z], [X * 2, 0.24, 0.16]);
  for (const [x, z] of [[-3.5, 3.5], [3.5, 3.5], [-3.5, -4.5], [3.5, -4.5]]) {
    S.cyl("#2b2f40", [x, H - 0.05, z], 0.42, 0.08, null, 20);
    L.cyl("#d6e0ff", [x, H - 0.1, z], 0.36, 0.02, null, 20);
  }
  // en lang laboratoriebænk langs bagvæggen med glas og kolber (silhuetter i lavt lys)
  S.box("#2b2f40", [-2.5, 0.45, Z0 + 0.4], [5, 0.9, 0.7]);
  S.box("#d6d9e4", [-2.5, 0.92, Z0 + 0.4], [5.04, 0.04, 0.74]);
  const r = T.rng(19);
  for (let x = -4.7; x < -0.4; x += 0.28 + r() * 0.25) {
    const h = 0.12 + r() * 0.25, rad = 0.04 + r() * 0.05;
    if (r() < 0.5) S.cyl("#7f9fb8", [x, 0.94 + h / 2, Z0 + 0.35 + r() * 0.2], rad, h, null, 10);
    else { S.cyl("#7f9fb8", [x, 0.94 + h * 0.3, Z0 + 0.4], rad * 1.5, h * 0.6, null, 10, 0.4); S.cyl("#7f9fb8", [x, 0.94 + h * 0.8, Z0 + 0.4], rad * 0.45, h * 0.4, null, 8); }
  }

  /* ---------- Stationerne: fælles lysopsætning ---------- */
  const poolTex = T.glow(A);
  const stationLys = {}, stationSkilt = {};
  const skilt = (id, tekst, o) => { const e = ctx.sign(tekst, o); (stationSkilt[id] = stationSkilt[id] || []).push(e); return e; };
  function lampe(id, x, z, y = H - 0.05) { // hængende rund lampe med lyskegle og lysplet på gulvet
    S.box("#11131c", [x, (y + H) / 2, z], [0.012, H - y + 0.01, 0.012]);
    const B = new Batch(); B.cone([0, 0, 0], 0.3, 1.25, y - 0.1, "#2e1d07");
    const kegleM = T.additive({ opacity: 0.2 });
    T.mesh(ctx.root, B.merge(), kegleM, `${x} ${y} ${z}`);
    const pg = T.hold(new THREE.PlaneGeometry(2.8, 2.8)); pg.rotateX(-Math.PI / 2);
    const poolM = T.hold(new THREE.MeshBasicMaterial({ map: poolTex, transparent: true, opacity: 0.2, depthWrite: false, blending: THREE.AdditiveBlending }));
    T.mesh(ctx.root, pg, poolM, `${x} 0.012 ${z}`);
    stationLys[id] = { kegleM, poolM };
  }

  /* ---------- a2-2 · Spiraltrappen ---------- */
  const SP = { x: 0, z: -2.6 }, SR = 1.15, OMLØB = 3, Y0 = 0.22, Y1 = 2.9;
  const spiral = kit.grp(ctx.root, `${SP.x} 0 ${SP.z}`);
  const helix = u => { const a = u * OMLØB * Math.PI * 2; return [Math.sin(a) * SR, Y0 + (Y1 - Y0) * u, Math.cos(a) * SR, a]; };
  const SB = new Batch();
  SB.cyl("#2b2f40", [0, (Y1 + 0.4) / 2, 0], 0.11, Y1 + 0.4, null, 12);
  SB.cyl("#3a3f55", [0, 0.04, 0], 0.5, 0.08, null, 20);
  const TRIN = 42;
  const varm = new THREE.Color(A), kold = new THREE.Color("#3a4266");
  for (let i = 0; i < TRIN; i++) {
    const u = (i + 0.5) / TRIN, [x, y, z, a] = helix(u);
    const c = kold.clone().lerp(varm, Math.pow(u, 1.3)).getHexString();
    SB.box("#" + c, [x * 0.6, y - 0.04, z * 0.6], [0.2, 0.05, 1.0], [0, a / D, 0]);
  }
  // gelænder: et rør langs ydersiden
  // gelænderet sidder lige på trinenes yderkant (ved stolperne), så trappe og gelænder læses som ét løb
  const pts = []; for (let i = 0; i <= 90; i++) { const [x, y, z] = helix(i / 90); pts.push(new THREE.Vector3(x * 1.02, y + 0.3, z * 1.02)); }
  SB.add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 160, 0.014, 5, false), "#5a628f");
  for (let i = 0; i <= 36; i++) { const [x, y, z] = helix(i / 36); SB.box("#4a5070", [x * 1.02, y + 0.13, z * 1.02], [0.012, 0.34, 0.012]); }
  // tre små hylder ud for hvert omløb, hvor prototypens versioner står
  const hylder = [1, 2, 3].map(k => { const [, y] = helix(k / OMLØB); return y; });
  hylder.forEach(y => { SB.box("#3a3f55", [0, y - 0.03, SR + 0.42], [0.52, 0.04, 0.36]); SB.box("#3a3f55", [0, y - 0.15, SR + 0.3], [0.04, 0.24, 0.04], [30, 0, 0]); });
  T.mesh(spiral, SB.merge(), T.lit());
  // kuglen og dens glød
  const kugle = kit.grp(spiral);
  T.mesh(kugle, T.hold(new THREE.SphereGeometry(0.14, 18, 12)), T.hold(new THREE.MeshBasicMaterial({ color: "#ffd28a" })));
  T.mesh(kugle, T.hold(new THREE.PlaneGeometry(1.2, 1.2)), T.hold(new THREE.MeshBasicMaterial({ map: T.glow(A), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })));
  // et lysende spor bag kuglen (trinene tegnes frem med drawRange)
  const SPB = new Batch({ uv: true });
  for (let i = 0; i < 180; i++) { const [x, y, z] = helix(i / 180); SPB.add(T.geo.sph(5, 3), null, [x * 0.6, y + 0.0, z * 0.6], null, [0.03, 0.03, 0.03]); }
  const sporGeo = SPB.merge(); const sporN = sporGeo.attributes.position.count;
  const sporM = T.hold(new THREE.MeshBasicMaterial({ color: A, transparent: true, opacity: 0.85 }));
  T.mesh(spiral, sporGeo, sporM);
  // prototypens tre versioner (en ledig/optaget-indikator, der bliver bedre for hver runde)
  const versioner = [v1, v2, v3].map((f, k) => {
    const g = kit.grp(spiral, `0 ${hylder[k]} ${SR + 0.42}`, { scale: "1.5 1.5 1.5" });
    const b = new Batch(); f(b);
    const m = T.lit({ emissive: new THREE.Color(A), emissiveIntensity: 0, transparent: true, opacity: 1 });
    T.mesh(g, b.merge(), m);
    const nr = kit.textPlane(g, "0.25 0.06 0.02", `v${k + 1}`, A, { width: 0.16, aspect: 0.6, size: 300, bg: true, ink: "#eef1ff" });
    return { g, m, nr };
  });
  // intentionskortet på et lille stativ ved siden af trappen
  const INT = [
    { v: 1, nu: "Bip højt, når værkstedet er fuldt", før: null },
    { v: 2, nu: "Vis, hvor mange der er derinde", før: "Bip højt, når værkstedet er fuldt" },
    { v: 3, nu: "Hjælp de yngste med at vælge, hvornår de kommer", før: "Vis, hvor mange der er derinde" },
  ];
  const kortTex = INT.map(it => T.canvas(640, 420, (g, w, h) => {
    g.fillStyle = "#f3eee2"; K.roundRect(g, 0, 0, w, h, 26); g.fill();
    g.fillStyle = A; K.roundRect(g, 0, 0, w, 74, 26); g.fill(); g.fillRect(0, 40, w, 34);
    g.fillStyle = "#1a1206"; g.font = '700 38px "Familjen Grotesk", sans-serif'; g.textBaseline = "middle";
    g.fillText("INTENTION", 34, 40); g.textAlign = "right"; g.fillText(`version ${it.v}`, w - 34, 40); g.textAlign = "left";
    let y = 130;
    if (it.før) {
      g.fillStyle = "#7a7568"; g.font = '600 36px "Source Sans 3", sans-serif';
      const ls = K.wrap(g, it.før, w - 80); ls.forEach((l, i) => { g.fillText(l, 40, y + i * 44); const lw = g.measureText(l).width; g.fillStyle = "#c0392b"; g.fillRect(36, y + i * 44 - 3, lw + 8, 6); g.fillStyle = "#7a7568"; });
      y += ls.length * 44 + 26;
    }
    g.fillStyle = "#1f2a4a"; g.font = 'italic 700 48px "Source Sans 3", sans-serif';
    K.wrap(g, it.nu, w - 80).forEach((l, i) => g.fillText(l, 40, y + 10 + i * 54));
  }));
  const kortStativ = kit.grp(ctx.root, `${SP.x + 1.6} 0 ${SP.z + 2.3}`, { rotation: "0 -18 0", scale: "1.3 1.3 1.3" });
  const KS = new Batch(); KS.cyl("#2b2f40", [0, 0.02, 0], 0.22, 0.04, null, 16); KS.cyl("#6b7299", [0, 0.6, -0.08], 0.015, 1.2, null, 6); KS.box("#2b2f40", [0, 1.18, -0.02], [0.92, 0.03, 0.06]);
  T.mesh(kortStativ, KS.merge(), T.lit());
  const kortM = T.hold(new THREE.MeshBasicMaterial({ map: kortTex[0], color: "#ccc" }));
  const kortE = T.mesh(kortStativ, T.hold(new THREE.PlaneGeometry(0.88, 0.58)), kortM, "0 1.5 -0.02", { rotation: "-10 0 0" });
  lampe("a2-2", SP.x, SP.z + 0.3);
  ctx.station("a2-2", spiral);
  skilt("a2-2", ctx.step("a2-2").title, { position: `${SP.x - 1.7} 2.35 ${SP.z + 0.9}`, rotation: "0 18 0", width: 1.6, size: 72 });
  ctx.view("a2-2", { position: [0.55, 0, 2.3], lookAt: [0.5, 1.75, SP.z], pitch: 3 });

  /* ---------- a2-1 · Indramning: et ark med fire felter på et skråbord ---------- */
  const IR = { x: -3.7, z: 0.6, yaw: 40 };
  const indr = kit.grp(ctx.root, `${IR.x} 0 ${IR.z}`, { rotation: `0 ${IR.yaw} 0` });
  const IB = new Batch();
  for (const sx of [-0.62, 0.62]) { IB.box("#3a3f55", [sx, 0.45, -0.18], [0.05, 0.9, 0.05]); IB.box("#3a3f55", [sx, 0.38, 0.22], [0.05, 0.76, 0.05]); IB.box("#3a3f55", [sx, 0.12, 0.02], [0.05, 0.05, 0.45]); }
  IB.push([0, 0.86, 0.02], [28, 0, 0]);
  IB.box("#b08a5c", [0, 0, 0], [1.4, 0.04, 0.96]);
  IB.box("#8c6a44", [0, 0.03, 0.48], [1.4, 0.04, 0.03]);   // lille liste, så arket ikke glider ned
  IB.pop();
  // en kop med blyanter og en lineal ved siden af
  IB.cyl("#4d5b7a", [0.85, 0.03, 0.25], 0.09, 0.0001, null, 3);
  T.mesh(indr, IB.merge(), T.lit());
  const FELT = [["kontekst", "hvor skal det virke?"], ["intention", "hvad vil vi opnå?"], ["ressourcer", "hvad har vi?"], ["tilgang", "hvordan gør vi?"]];
  const AW = 1.2, AH = 0.84, CW = 1200, CH = 840;
  const FX = [[40, 150], [610, 150], [40, 490], [610, 490]], FW = 550, FH = 310;
  const arkTex = T.canvas(CW, CH, (g, w, h) => {
    g.fillStyle = "#f6f3ea"; g.fillRect(0, 0, w, h);
    g.fillStyle = "#1f2a4a"; g.font = '700 54px "Familjen Grotesk", sans-serif'; g.textBaseline = "middle";
    g.fillText("Indramning", 44, 76);
    g.fillStyle = "#8a8578"; g.font = '500 30px "Source Sans 3", sans-serif'; g.fillText("udfyldes ved start · ses igen undervejs", 360, 80);
    FELT.forEach(([t, q], i) => {
      const [x, y] = FX[i];
      g.strokeStyle = "#3a4a7a"; g.lineWidth = 4; K.roundRect(g, x, y, FW, FH, 18); g.stroke();
      g.fillStyle = A; K.roundRect(g, x, y, FW, 64, 18); g.fill(); g.fillRect(x, y + 34, FW, 30);
      g.fillStyle = "#1a1206"; g.font = '700 40px "Familjen Grotesk", sans-serif'; g.fillText(t, x + 24, y + 34);
      g.fillStyle = "#8a8578"; g.font = 'italic 500 30px "Source Sans 3", sans-serif'; g.fillText(q, x + 24, y + 104);
      g.strokeStyle = "rgba(58,74,122,0.18)"; g.lineWidth = 2;
      for (let k = 0; k < 4; k++) { g.beginPath(); g.moveTo(x + 24, y + 150 + k * 40); g.lineTo(x + FW - 24, y + 150 + k * 40); g.stroke(); }
    });
  });
  // arket ligger på pladen; overlays med "håndskrift" fades ind felt for felt
  const ark = kit.grp(indr, "0 0.885 0.01", { rotation: "28 0 0" });
  const arkM = T.hold(new THREE.MeshStandardMaterial({ map: arkTex, roughness: 0.9 }));
  T.mesh(ark, T.hold(new THREE.PlaneGeometry(AW, AH)), arkM, "0 0.003 0", { rotation: "-90 0 0" });
  const SKRIFT = [
    ["skolens værksted", "de yngste i frikvarteret"],
    ["vise, om der er plads", "uden at de skal spørge"],
    ["micro:bit, lysdioder, pap", "to uger, fire hænder"],
    ["interview → skitse → prøve", "afprøv hos 2. klasse"],
  ];
  const skrift = SKRIFT.map((linjer, i) => {
    const tex = T.canvas(FW, FH - 120, (g, w, h) => {
      g.fillStyle = "#2a4a9a"; g.font = 'italic 600 40px "Source Sans 3", sans-serif'; g.textBaseline = "alphabetic";
      linjer.forEach((l, k) => g.fillText(l, 26, 46 + k * 80));
    });
    const m = T.hold(new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0, depthWrite: false }));
    const [x, y] = FX[i];
    const px = (x + FW / 2 - CW / 2) / CW * AW, pz = (y + 120 + (FH - 120) / 2 - CH / 2) / CH * AH;
    T.mesh(ark, T.hold(new THREE.PlaneGeometry(FW / CW * AW, (FH - 120) / CH * AH)), m, `${px} 0.006 ${pz}`, { rotation: "-90 0 0" });
    return { m, px, pz };
  });
  // når alle fire felter er udfyldt, vender eleverne tilbage: intentionen streges over og skrives om
  const ret = skrift[1];
  const stregM = T.hold(new THREE.MeshBasicMaterial({ color: "#c0392b", transparent: true, opacity: 0, depthWrite: false }));
  const SB2 = new Batch({ uv: true }); SB2.plane([-0.03, 0.035, 0], [0.42, 0.007]); SB2.plane([-0.02, -0.03, 0], [0.42, 0.007]);
  T.mesh(ark, SB2.merge(), stregM, `${ret.px} 0.009 ${ret.pz - 0.02}`, { rotation: "-90 0 0" });
  const nyTex = T.canvas(FW, 90, (g, w, h) => { g.fillStyle = "#c0392b"; g.font = 'italic 700 34px "Source Sans 3", sans-serif'; g.fillText("vise, hvornår der bliver plads", 26, 58); });
  const nyM = T.hold(new THREE.MeshBasicMaterial({ map: nyTex, transparent: true, opacity: 0, depthWrite: false }));
  T.mesh(ark, T.hold(new THREE.PlaneGeometry(FW / CW * AW, 90 / CH * AH)), nyM, `${ret.px} 0.01 ${ret.pz + 0.085}`, { rotation: "-90 0 0" });
  // en ravgul ramme om det felt, der arbejdes på (et markeringsrektangel, ikke en billedramme)
  const markM = T.hold(new THREE.MeshBasicMaterial({ color: A, transparent: true, opacity: 0, depthWrite: false }));
  const mw = FW / CW * AW + 0.02, mh = FH / CH * AH + 0.02, tk = 0.008;
  const MB = new Batch({ uv: true }); MB.plane([0, mh / 2, 0], [mw, tk]); MB.plane([0, -mh / 2, 0], [mw, tk]); MB.plane([-mw / 2, 0, 0], [tk, mh]); MB.plane([mw / 2, 0, 0], [tk, mh]);
  const mark = T.mesh(ark, MB.merge(), markM, "0 0.008 0", { rotation: "-90 0 0" });
  // blyanten
  const blyant = kit.grp(ark, "0 0.03 0");
  const BB = new Batch(); BB.cyl("#e8b23c", [0, 0.09, 0], 0.012, 0.18, null, 6); BB.cyl("#e8cfa0", [0, -0.012, 0], 0.012, 0.025, null, 6, 0.0001); BB.cyl("#d14b3c", [0, 0.185, 0], 0.012, 0.015, null, 6);
  const blyInner = kit.grp(blyant, "0 0 0", { rotation: "25 0 -25" });
  T.mesh(blyInner, BB.merge(), T.lit());
  lampe("a2-1", IR.x, IR.z);
  ctx.station("a2-1", indr);
  skilt("a2-1", ctx.step("a2-1").title, { parent: indr, position: "0 1.5 -0.3", width: 1.45, size: 72 });
  ctx.view("a2-1", { position: [IR.x + Math.sin(IR.yaw * D) * 1.85, 0, IR.z + Math.cos(IR.yaw * D) * 1.85], lookAt: [IR.x, 0.98, IR.z] });

  /* ---------- a2-3 · Benspændsvæggen og prototypen ---------- */
  const BV = { x: -X + 0.04, z: -3.6 };
  const væg = kit.grp(ctx.root, `${BV.x} 0 ${BV.z}`, { rotation: "0 90 0" });
  const REGLER = ["uden skærm", "til en bedstemor", "kun med lyd", "må bæres på kroppen", "maks. én knap", "skal virke i mørke", "lavet af genbrug", "til 30 personer", "uden tekst", "skal kunne gå i stykker", "reagerer på vejret", "til en hund"];
  const VALGT = [0, 1];   // de kort, der trækkes
  const kortW = 0.56, kortH = 0.36;
  const VB = new Batch();
  VB.box("#2b2238", [0, 2.0, -0.02], [3.6, 2.0, 0.04]);
  // hver regel har sit eget hul i væggen (en mørk lomme), så man ser, hvor kortet er trukket fra
  for (let i = 0; i < 12; i++) { VB.box("#3a3f55", [-1.32 + (i % 4) * 0.88, 2.62 - Math.floor(i / 4) * 0.56 + kortH / 2 + 0.03, 0.005], [0.03, 0.03, 0.03]); VB.box("#120e18", [-1.32 + (i % 4) * 0.88, 2.62 - Math.floor(i / 4) * 0.56, 0.0], [kortW + 0.04, kortH + 0.04, 0.012]); }
  T.mesh(væg, VB.merge(), T.lit());
  skilt("a2-3", ctx.step("a2-3").title, { parent: væg, position: "0 3.4 0.03", width: 1.9, size: 76 });
  const regelTex = REGLER.map((t, i) => T.canvas(460, 300, (g, w, h) => {
    g.fillStyle = "#f3eee2"; K.roundRect(g, 0, 0, w, h, 22); g.fill();
    g.strokeStyle = A; g.lineWidth = 8; K.roundRect(g, 10, 10, w - 20, h - 20, 16); g.stroke();
    g.fillStyle = "#8a8578"; g.font = '600 26px "JetBrains Mono", monospace'; g.textBaseline = "middle"; g.fillText("REGEL", 34, 46);
    g.fillStyle = "#1f2a4a"; g.font = '800 60px "Familjen Grotesk", sans-serif'; g.textAlign = "center";
    const ls = K.wrap(g, t, w - 50); ls.forEach((l, k) => g.fillText(l, w / 2, 165 + (k - (ls.length - 1) / 2) * 64));
  }));
  const kortGeo = T.hold(new THREE.PlaneGeometry(kortW, kortH));
  const kort = REGLER.map((t, i) => {
    const hjem = [-1.32 + (i % 4) * 0.88, 2.62 - Math.floor(i / 4) * 0.56, 0.025];
    const m = T.hold(new THREE.MeshStandardMaterial({ map: regelTex[i], roughness: 0.8 }));
    const e = T.mesh(væg, kortGeo, m, hjem.join(" "));
    return { e, m, hjem };
  });
  // prototypen på en sokkel foran væggen: en lille "ledig/optaget"-boks med skærm og to knapper
  const PR = { x: -4.3, z: -2.6 };
  const sokkel = kit.grp(ctx.root, `${PR.x} 0 ${PR.z}`, { rotation: "0 60 0" });
  const PS = 1.6;   // prototypen vises i 1,6 gange størrelse
  const PB = new Batch(); PB.cyl("#2b2f40", [0, 0.5, 0], 0.32, 1.0, null, 20); PB.cyl("#3a3f55", [0, 1.01, 0], 0.36, 0.03, null, 20);
  T.mesh(sokkel, PB.merge(), T.lit());
  const proto = kit.grp(sokkel, "0 1.03 0", { scale: `${PS} ${PS} ${PS}` });
  const base = kit.grp(proto), udenSkærm = kit.grp(proto), bedste = kit.grp(proto);
  let ledigM = null;
  { // basisversion: boks med skærm og to små knapper
    const b = new Batch(); b.box("#c79a68", [0, 0.12, 0], [0.32, 0.24, 0.16]); b.box("#14161e", [0, 0.15, 0.081], [0.22, 0.12, 0.004]); for (const x of [-0.06, 0.06]) b.cyl("#6b7299", [x, 0.05, 0.085], 0.015, 0.012, [90, 0, 0], 8);
    T.mesh(base, b.merge(), T.lit());
    const sk = T.canvas(220, 120, (g, w, h) => { g.fillStyle = "#14161e"; g.fillRect(0, 0, w, h); g.fillStyle = "#3aff7a"; g.font = '700 46px "JetBrains Mono", monospace'; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("LEDIG", w / 2, h / 2); });
    T.mesh(base, T.hold(new THREE.PlaneGeometry(0.2, 0.11)), ledigM = T.hold(new THREE.MeshBasicMaterial({ map: sk })), "0 0.15 0.084");
  }
  { // uden skærm: samme boks, men en lysring og en lille summer i stedet
    const b = new Batch(); b.box("#c79a68", [0, 0.12, 0], [0.32, 0.24, 0.16]); b.cyl("#22232c", [0.1, 0.06, 0.082], 0.03, 0.01, [90, 0, 0], 12);
    T.mesh(udenSkærm, b.merge(), T.lit());
    T.mesh(udenSkærm, T.hold(new THREE.TorusGeometry(0.07, 0.014, 6, 28)), T.hold(new THREE.MeshBasicMaterial({ color: "#3aff7a" })), "-0.04 0.14 0.082");
    T.mesh(udenSkærm, T.hold(new THREE.PlaneGeometry(0.4, 0.4)), T.hold(new THREE.MeshBasicMaterial({ map: T.glow("#3aff7a"), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })), "-0.04 0.14 0.09");
  }
  { // til en bedstemor: samme boks, men lav og bred som en dørklokke på bordet, uden skærm og småknapper:
    // én stor, flad knap ovenpå og en tydelig lysstribe foran, der lyser grønt, når der er plads
    const b = new Batch();
    b.box("#d9c7a8", [0, 0.07, 0], [0.4, 0.14, 0.26]);
    b.box("#bfae90", [0, 0.005, 0], [0.42, 0.01, 0.28]);
    b.cyl("#3a76c4", [0, 0.155, 0], 0.09, 0.03, null, 20);
    b.cyl("#5a92dc", [0, 0.172, 0], 0.075, 0.006, null, 20);
    T.mesh(bedste, b.merge(), T.lit());
    T.mesh(bedste, T.hold(new THREE.PlaneGeometry(0.3, 0.05)), T.hold(new THREE.MeshBasicMaterial({ color: "#3aff7a" })), "0 0.08 0.131");
    T.mesh(bedste, T.hold(new THREE.PlaneGeometry(0.6, 0.3)), T.hold(new THREE.MeshBasicMaterial({ map: T.glow("#3aff7a"), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })), "0 0.08 0.14");
  }
  // "før": basisversionen står som et dæmpet spøgelse ved siden af, så man ser, hvad benspændet ændrer
  const før = kit.grp(sokkel, "-0.78 1.03 0.0", { scale: "1.1 1.1 1.1" });
  {
    const b = new Batch(); b.box("#c79a68", [0, 0.12, 0], [0.32, 0.24, 0.16]); b.box("#14161e", [0, 0.15, 0.081], [0.22, 0.12, 0.004]); for (const x of [-0.06, 0.06]) b.cyl("#6b7299", [x, 0.05, 0.085], 0.015, 0.012, [90, 0, 0], 8);
    T.mesh(før, b.merge(), T.lit({ color: "#8a8a99" }));
    const fsk = T.canvas(220, 120, (g, w, h) => { g.fillStyle = "#14161e"; g.fillRect(0, 0, w, h); g.fillStyle = "#3a8a5a"; g.font = '700 46px "JetBrains Mono", monospace'; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("LEDIG", w / 2, h / 2); });
    T.mesh(før, T.hold(new THREE.PlaneGeometry(0.2, 0.11)), T.hold(new THREE.MeshBasicMaterial({ map: fsk, color: "#888" })), "0 0.15 0.084");
    kit.textPlane(før, "0 0.36 0", "før", "#a9b0d6", { width: 0.26, aspect: 0.4, size: 170, bg: true, ink: "#d6dbf5" });
  }
  { const PB2 = new Batch(); PB2.cyl("#2b2f40", [0, 0.5, 0], 0.2, 1.0, null, 16); PB2.cyl("#3a3f55", [0, 1.01, 0], 0.24, 0.03, null, 16); T.mesh(sokkel, PB2.merge(), T.lit(), "-0.78 0 0.0"); }
  // målkortet: fast ved siden af prototypen. Benspændet giver det nye; målet sørger for, at det stadig giver mening
  const målTex = T.canvas(460, 300, (g, w, h) => {
    g.fillStyle = "#1f2a4a"; K.roundRect(g, 0, 0, w, h, 22); g.fill();
    g.strokeStyle = "#c9d1ff"; g.lineWidth = 6; K.roundRect(g, 10, 10, w - 20, h - 20, 16); g.stroke();
    g.fillStyle = "#a9b0d6"; g.font = '600 26px "JetBrains Mono", monospace'; g.textBaseline = "middle"; g.fillText("MÅL", 34, 46);
    g.fillStyle = "#eef1ff"; g.font = '700 46px "Familjen Grotesk", sans-serif'; g.textAlign = "center";
    ["vis, om værkstedet", "er ledigt"].forEach((l, k) => g.fillText(l, w / 2, 140 + k * 56));
  });
  const målKort = T.mesh(sokkel, kortGeo, T.hold(new THREE.MeshBasicMaterial({ map: målTex })), "0.82 1.25 0.1", { scale: "1.4 1.4 1.4", rotation: "0 -15 0" });
  { const MB2 = new Batch(); MB2.cyl("#6b7299", [0.82, 0.5, 0.1], 0.012, 1.0, null, 6); MB2.cyl("#2b2f40", [0.82, 0.02, 0.1], 0.14, 0.04, null, 14); T.mesh(sokkel, MB2.merge(), T.lit()); }
  // et "pust" af partikler, når prototypen skifter form
  const pustM = T.hold(new THREE.MeshBasicMaterial({ map: T.glow(A), transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
  const pust = T.mesh(proto, T.hold(new THREE.PlaneGeometry(0.9, 0.9)), pustM, "0 0.18 0.12");
  lampe("a2-3", -4.5, -2.9);
  ctx.station("a2-3", sokkel);
  ctx.view("a2-3", { position: [-2.3, 0, -1.05], lookAt: [-5.0, 1.6, -3.55] });

  /* ---------- a2-4 · Terningen og urtepotten ---------- */
  const TR = { x: 3.8, z: -0.8, yaw: -38 };
  const tst = kit.grp(ctx.root, `${TR.x} 0 ${TR.z}`, { rotation: `0 ${TR.yaw} 0` });
  const TB = new Batch();
  TB.box("#2b2f40", [-0.25, 0.42, 0], [0.5, 0.84, 0.5]); TB.box("#3a3f55", [-0.25, 0.855, 0], [0.56, 0.03, 0.56]);
  TB.box("#2b2f40", [0.45, 0.33, 0], [0.5, 0.66, 0.44]); TB.box("#3a3f55", [0.45, 0.675, 0], [0.54, 0.03, 0.48]);
  // tre små indikatorlamper foran på terningens sokkel
  T.mesh(tst, TB.merge(), T.lit());
  const TILST = [
    { navn: "tørstig", farve: "#ff7a1a", fugt: 0.08 },
    { navn: "tilfreds", farve: "#2fd46a", fugt: 0.5 },
    { navn: "druknet", farve: "#2f7dff", fugt: 0.95 },
  ];
  const ansigt = TILST.map((t, i) => T.canvas(256, 256, (g, w, h) => {
    g.fillStyle = "#14161e"; g.strokeStyle = "#14161e"; g.lineWidth = 12; g.lineCap = "round";
    if (i === 0) { // tørstig: tunge, hængende øjenlåg og en tør, åben mund
      for (const x of [86, 170]) { g.beginPath(); g.arc(x, 108, 18, 0, Math.PI); g.fill(); g.lineWidth = 9; g.beginPath(); g.moveTo(x - 26, 100); g.lineTo(x + 22, 106); g.stroke(); }
      g.lineWidth = 10; g.beginPath(); g.ellipse(128, 184, 26, 16, 0, 0, Math.PI * 2); g.stroke();
      g.lineWidth = 6; g.beginPath(); g.moveTo(112, 184); g.lineTo(122, 188); g.lineTo(132, 181); g.lineTo(144, 186); g.stroke();
    } else if (i === 1) { // tilfreds: runde øjne, smil
      for (const x of [86, 170]) { g.beginPath(); g.arc(x, 100, 18, 0, 7); g.fill(); g.fillStyle = "#fff"; g.beginPath(); g.arc(x + 6, 94, 6, 0, 7); g.fill(); g.fillStyle = "#14161e"; }
      g.beginPath(); g.arc(128, 140, 46, Math.PI * 0.18, Math.PI * 0.82); g.stroke();
    } else { // druknet: store øjne, bølget mund, vanddråber
      for (const x of [86, 170]) { g.beginPath(); g.arc(x, 98, 24, 0, 7); g.lineWidth = 9; g.stroke(); g.beginPath(); g.arc(x, 102, 9, 0, 7); g.fill(); }
      g.lineWidth = 10; g.beginPath(); for (let x = 76; x <= 180; x += 4) { const y = 180 + Math.sin((x - 76) / 13) * 9; x === 76 ? g.moveTo(x, y) : g.lineTo(x, y); } g.stroke();
      g.fillStyle = "#cfe6ff"; for (const [x, y] of [[214, 40], [36, 60]]) { g.beginPath(); g.moveTo(x, y - 18); g.quadraticCurveTo(x + 14, y + 4, x, y + 12); g.quadraticCurveTo(x - 14, y + 4, x, y - 18); g.fill(); }
    }
  }));
  const terning = kit.grp(tst, "-0.25 1.17 0");
  const tInner = kit.grp(terning);
  // selvlysende og ubelyst, så spotlyset ikke vasker farven ud (orange skal se orange ud)
  const tMat = T.hold(new THREE.MeshBasicMaterial({ color: TILST[1].farve }));
  const tKrop = T.mesh(tInner, T.hold(roundedBox(0.5, 0.06)), tMat);
  const ansigtM = T.hold(new THREE.MeshBasicMaterial({ map: ansigt[1], transparent: true, depthWrite: false }));
  T.mesh(tInner, T.hold(new THREE.PlaneGeometry(0.42, 0.42)), ansigtM, "0 0 0.252");
  const tHalo = T.hold(new THREE.MeshBasicMaterial({ map: T.glow(TILST[1].farve), transparent: true, opacity: 0.5, depthWrite: false, blending: THREE.AdditiveBlending }));
  T.mesh(terning, T.hold(new THREE.PlaneGeometry(1.4, 1.4)), tHalo, "0 0 -0.3");
  const tNavne = TILST.map(t => { const tp = kit.textPlane(tst, "-0.25 1.58 0", t.navn, t.farve, { width: 0.5, aspect: 0.24, size: 120, bg: true, ink: "#eef1ff" }); tp.object3D.visible = false; return tp; });
  const lamper = TILST.map((t, i) => { const m = T.hold(new THREE.MeshBasicMaterial({ color: "#2a3358" })); T.mesh(tst, T.hold(new THREE.CircleGeometry(0.03, 14)), m, `${-0.37 + i * 0.12} 0.72 0.252`); return m; });
  const hint = kit.textPlane(tst, "-0.25 0.5 0.252", "peg på terningen", "#d6dbf5", { width: 0.48, aspect: 0.16, size: 92, bg: false, ink: "#d6dbf5" });
  // urtepotten med fugtsensor
  const potte = kit.grp(tst, "0.45 0.69 0");
  const PO = new Batch();
  PO.cyl("#b5653a", [0, 0.012, 0], 0.17, 0.024, null, 18);           // underskål
  PO.cyl("#c06a3c", [0, 0.13, 0], 0.13, 0.22, null, 16, 1.3);       // potte (bredest foroven)
  PO.cyl("#a85a33", [0, 0.245, 0], 0.175, 0.03, null, 16);
  PO.cyl("#3a2a1c", [0, 0.236, 0], 0.155, 0.01, null, 16);
  // sensoren: en gaffel stukket ned i jorden og en lille boks
  PO.box("#1d4f8a", [0.08, 0.31, 0.02], [0.05, 0.1, 0.012]); PO.box("#c9cdd8", [0.07, 0.24, 0.02], [0.006, 0.08, 0.006]); PO.box("#c9cdd8", [0.09, 0.24, 0.02], [0.006, 0.08, 0.006]);
  T.mesh(potte, PO.merge(), T.lit());
  const vandM = T.hold(new THREE.MeshBasicMaterial({ color: "#5aa2ff", transparent: true, opacity: 0.8 }));
  const vand = T.mesh(potte, T.hold(new THREE.CylinderGeometry(0.16, 0.16, 0.012, 18)), vandM, "0 0.026 0");
  // planten: stængel og blade, der hænger, står op eller ligger i vand
  const plante = kit.grp(potte, "0 0.24 0");
  const stængel = kit.grp(plante);
  T.mesh(stængel, T.hold(new THREE.CylinderGeometry(0.008, 0.01, 0.3, 5).translate(0, 0.15, 0)), T.hold(new THREE.MeshStandardMaterial({ color: "#4f8f4a", flatShading: true })));
  const bladM = T.hold(new THREE.MeshStandardMaterial({ color: "#5fb85a", flatShading: true, side: THREE.DoubleSide }));
  const bladGeo = T.hold(new THREE.SphereGeometry(0.05, 8, 5).scale(1, 0.18, 2.0).translate(0, 0, 0.09));
  const blade = [[0.1, 0], [0.16, 120], [0.22, 240], [0.27, 60], [0.3, 180]].map(([y, rot]) => {
    const led = kit.grp(stængel, `0 ${y} 0`, { rotation: `0 ${rot} 0` });
    const ind = kit.grp(led);
    T.mesh(ind, bladGeo, bladM);
    return ind;
  });
  const dråber = [0, 1, 2].map(i => T.mesh(potte, T.hold(new THREE.SphereGeometry(0.018, 6, 4)), vandM, `${-0.1 + i * 0.1} 0.5 0.05`));
  // fugtmåler: en lille søjle ved siden af potten
  const målerM = T.hold(new THREE.MeshBasicMaterial({ color: "#4fc27a" }));
  const måler = T.mesh(potte, T.hold(new THREE.PlaneGeometry(0.04, 0.3).translate(0, 0.15, 0)), målerM, "0.24 0.0 0.0");
  const MR = new Batch({ uv: true }); for (const [x, y, w, h] of [[-0.024, 0.15, 0.006, 0.31], [0.024, 0.15, 0.006, 0.31], [0, -0.002, 0.054, 0.006], [0, 0.302, 0.054, 0.006]]) MR.plane([x, y, 0], [w, h]);
  T.mesh(potte, MR.merge(), T.hold(new THREE.MeshBasicMaterial({ color: "#a9b0d6" })), "0.24 0 0.002");
  kit.textPlane(potte, "0.24 -0.04 0.01", "fugt", "#a9b0d6", { width: 0.16, aspect: 0.3, size: 150, bg: false, ink: "#a9b0d6" });
  // kablet fra fugtsensoren til terningen: input fra omgivelserne styrer tilstanden. En lysende puls løber langs det.
  const kabelKurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.53, 0.98, 0.02), new THREE.Vector3(0.56, 1.02, 0.16), new THREE.Vector3(0.2, 0.98, 0.26), new THREE.Vector3(-0.05, 0.9, 0.27), new THREE.Vector3(-0.25, 0.92, 0.26),
  ]);
  T.mesh(tst, T.hold(new THREE.TubeGeometry(kabelKurve, 40, 0.008, 5, false)), T.hold(new THREE.MeshStandardMaterial({ color: "#22263a" })));
  const kabelGeo = T.hold(new THREE.TubeGeometry(kabelKurve, 40, 0.0105, 5, false));
  const kabelN = kabelGeo.index.count, kabelN0 = 0;
  kabelGeo.setIndex(kabelGeo.index);   // drawRange bruges til at tegne pulsen frem
  const kabelM = T.hold(new THREE.MeshBasicMaterial({ color: "#2a3358" }));
  T.mesh(tst, kabelGeo, kabelM);
  let tilstand = 1, sidstKlik = -1e9, autoFra = 0, pustT = -1e9;
  ctx.onClick(tKrop, () => { tilstand = (tilstand + 1) % 3; sidstKlik = tNu; pop = 1; });
  let pop = 0;
  lampe("a2-4", TR.x - 0.1, TR.z);
  ctx.station("a2-4", tst);
  skilt("a2-4", ctx.step("a2-4").title, { parent: tst, position: "0.1 2.15 -0.35", width: 1.6, size: 72 });
  ctx.view("a2-4", { position: [TR.x + Math.sin(TR.yaw * D) * 1.8, 0, TR.z + Math.cos(TR.yaw * D) * 1.8], lookAt: [TR.x + 0.05, 1.05, TR.z] });

  /* ---------- Dør, skilte, lys ---------- */
  ctx.door(ctx.room.parent, { position: `3.6 0 ${Z0 + 0.15}` });
  T.mesh(ctx.root, T.hold(new THREE.PlaneGeometry(1.6, 2.5)), T.hold(new THREE.MeshBasicMaterial({ color: "#04050b" })), `3.6 1.25 ${Z0 + 0.06}`);
  // rumskiltet står frit på bagvæggen, uden for spiralens og intentionskortets sigtelinje fra indgangen
  ctx.sign(ctx.room.name, { sub: ctx.room.sub, position: `3.6 4.05 ${Z0 + 0.08}`, width: 4.0 });
  const erk = T.erkendeformer(ctx.root, `-1.9 3.85 ${Z0 + 0.1}`, "0 0 0", 1.0);
  const lysA = kit.el("a-entity", { position: `${SP.x} 3.8 ${SP.z + 1.2}`, light: "type: point; color: #ffcf96; intensity: 1.2; distance: 11; decay: 1.1" });
  const lysB = kit.el("a-entity", { position: "0 2.6 0", light: "type: point; color: #ffcf96; intensity: 0; distance: 4.5; decay: 1.3" });

  T.mesh(ctx.root, S.merge(), T.lit());
  T.mesh(ctx.root, L.merge(), T.basic());

  ctx.view("a2-0", { position: [0, 0, 4.9], lookAt: [0, 1.5, -2.2], pitch: 4 });

  /* ---------- Trin og animation ---------- */
  const STATIONER = ["a2-1", "a2-2", "a2-3", "a2-4"];
  const LYSPOS = { "a2-1": [IR.x + 0.4, 2.4, IR.z + 0.6], "a2-2": [SP.x, 3.4, SP.z + 1.6], "a2-3": [-4.2, 2.6, -2.0], "a2-4": [TR.x - 0.6, 2.3, TR.z + 0.7] };
  let aktiv = null, t0 = 0, tNu = 0, sidsteVer = -1, sidsteKort = -1;
  return {
    onStep(id) { aktiv = id; t0 = null; autoFra = tNu; },
    tick(t, dt) {
      tNu = t; if (t0 === null) t0 = t;   // forløbet starter ved første frame efter trinskiftet
      const s = (t - t0) / 1000;
      erk.tick(dt, aktiv === "a2-0" ? 1 : 0.3);
      // a2-0: de fire stationer lyser op hver for sig (på skift). Ellers lyser kun den aktive.
      const intro = aktiv === "a2-0";
      const tur = intro ? Math.floor(s / 1.6) % 4 : -1, blødt = intro ? Math.sin(Math.PI * Math.min(1, (s % 1.6) / 1.6)) : 1;
      STATIONER.forEach((id, i) => {
        const v = intro ? (i === tur ? blødt : 0.03) : id === aktiv ? 1 : 0.04;
        // lyskeglen er kun stemning; ved terningen næsten ingen, så den ikke farver terningen
        stationLys[id].kegleM.opacity = (0.02 + 0.12 * v) * (id === "a2-4" ? 0.25 : 1); stationLys[id].poolM.opacity = 0.02 + 0.6 * v;
        stationSkilt[id] && stationSkilt[id].forEach(e => { const m = e.getObject3D("mesh"); if (m) m.material.opacity = 0.3 + 0.7 * Math.max(v, intro ? 0.15 : 0); });
      });
      // ved a2-0 lyser terningen kun på sin tur; LEDIG-skærmen ligeså
      const tændt4 = intro ? (tur === 3 ? blødt : 0) : aktiv === "a2-4" ? 1 : 0;
      const tændt3 = intro ? (tur === 2 ? blødt : 0) : aktiv === "a2-3" ? 1 : 0;
      ledigM.color.setScalar(0.15 + 0.85 * tændt3);
      const lp = intro ? LYSPOS[STATIONER[tur]] : LYSPOS[aktiv];
      if (lp) { lysB.object3D.position.set(...lp); T.lys(lysB, intro ? 1.6 * blødt : 1.6); } else T.lys(lysB, 0);

      /* spiralen */
      const spOn = aktiv === "a2-2";
      const CYK = 12.5;
      const ps = spOn ? s % CYK : 0;
      const u = spOn ? Math.min(1, ps / 10.5) : 0.0;   // 10,5 s op, så 2 s med alt tændt
      const [kx, ky, kz] = helix(u);
      kugle.object3D.position.set(kx * 0.6, ky + 0.12, kz * 0.6);
      kugle.object3D.visible = spOn || intro;
      kugle.object3D.scale.setScalar(spOn && u >= 1 ? 1 + 0.15 * Math.sin(s * 5) : 1);
      sporGeo.setDrawRange(0, Math.floor(u * sporN / 3) * 3);
      sporM.opacity = spOn ? (ps > 11 ? 1 - (ps - 11) / 1.5 : 0.9) : 0;
      const ver = spOn ? Math.min(2, Math.floor(u * OMLØB + 0.02) - (u >= 1 ? 1 : 0)) : 2;
      const nåetN = spOn ? Math.floor(u * OMLØB + 0.001) : 3;   // hvor mange omløb er gennemført
      versioner.forEach((vv, k) => {
        const nået = k < Math.max(1, nåetN) || !spOn;
        const nyt = spOn && k === nåetN - 1 ? Math.max(0, 1 - (ps - (k + 1) / OMLØB * 10.5) / 1.2) : 0;
        vv.m.opacity = nået ? 1 : 0.18;
        vv.m.emissiveIntensity = nået ? 0.12 + 0.6 * nyt : 0;
        vv.g.object3D.scale.setScalar(1.5 * (1 + 0.25 * nyt));
      });
      const kortV = spOn ? Math.max(0, Math.min(2, nåetN === 0 ? 0 : nåetN - 1)) : 2;
      if (kortV !== sidsteVer) { kortM.map = kortTex[kortV]; kortM.needsUpdate = true; sidsteVer = kortV; }
      kortM.color.setScalar(spOn ? 1 : intro && tur === 1 ? 0.5 + 0.5 * blødt : 0.38);
      // kortet "vipper" kort, når det skrives om
      const skift = spOn && nåetN >= 1 ? Math.max(0, 1 - (ps - Math.min(nåetN, 3) / OMLØB * 10.5) / 0.6) : 0;
      // når kortet skrives om, løftes det lidt og lyser op (det drejer ikke, så det aldrig skæres af)
      kortE.object3D.position.y = 1.5 + Math.sin(skift * Math.PI) * 0.06;
      kortE.object3D.scale.setScalar(1 + Math.sin(skift * Math.PI) * 0.08);

      /* indramningsarket */
      const irOn = aktiv === "a2-1";
      arkM.color.setScalar(irOn ? 1 : intro && tur === 0 ? 0.45 + 0.55 * blødt : 0.4);
      // 0–9 felterne udfyldes · 9,5–11 tilbage til intentionen, den streges over og skrives om · holdes til 15
      const ip = irOn ? s % 15 : 99;
      skrift.forEach((f, i) => { f.m.opacity = irOn ? clamp((ip - 0.6 - i * 2.2) / 1.2) : 1; });
      const retK = irOn ? clamp((ip - 9.8) / 0.6) : 1, nyK = irOn ? clamp((ip - 10.4) / 0.8) : 1;
      stregM.opacity = retK; nyM.opacity = nyK;
      const felt = irOn ? (ip < 9.2 ? Math.min(3, Math.floor((ip - 0.3) / 2.2)) : 1) : -1;
      if (felt >= 0) {
        const f = skrift[Math.max(0, felt)];
        mark.object3D.position.set(f.px, 0.008, f.pz - 0.06);
        markM.opacity = ip < 9.2 ? 0.9 : 0.6 + 0.4 * Math.sin(ip * 5);   // til sidst: tilbage til intentionen
        const skriv = ip < 9.2 ? (ip - 0.6 - felt * 2.2) / 1.2 : ip < 11.2 ? (ip - 9.8) / 1.4 : 1;
        blyant.object3D.position.set(f.px - 0.18 + 0.36 * clamp(skriv) , 0.03 + 0.01 * Math.abs(Math.sin(ip * 18)), f.pz - 0.02 + 0.03 * Math.sin(ip * 9));
        blyant.object3D.visible = true;
      } else { markM.opacity = 0; blyant.object3D.position.set(0.5, 0.03, 0.2); }

      /* benspændsvæggen */
      const bsOn = aktiv === "a2-3";
      const bp = bsOn ? s % 14 : -1;
      // 0–1 ingen kort, 1–2.2 kort A trækkes, 2.2–6.2 holdes (prototypen ændrer sig), 6.2–7 tilbage, 7–8.2 kort B, … 13.2–14 tilbage
      let kortIdx = -1, ud = 0;
      if (bsOn) {
        const fase = bp < 7 ? 0 : 1, lp2 = bp < 7 ? bp : bp - 7;
        ud = lp2 < 1 ? 0 : lp2 < 2.2 ? ease((lp2 - 1) / 1.2) : lp2 < 6.2 ? 1 : 1 - ease((lp2 - 6.2) / 0.8);
        kortIdx = VALGT[fase];
      }
      kort.forEach((k, i) => {
        const o = k.e.object3D;
        if (i === kortIdx) {
          // kortet glider ud af væggen og hen foran beskueren, ved siden af prototypen
          const mål = [-0.05, 2.15, 2.4];
          o.position.set(k.hjem[0] + (mål[0] - k.hjem[0]) * ud, k.hjem[1] + (mål[1] - k.hjem[1]) * ud + Math.sin(ud * Math.PI) * 0.25, k.hjem[2] + (mål[2] - k.hjem[2]) * ud);
          o.rotation.set(0, -ud * 50 * D, Math.sin(ud * Math.PI) * 0.25);
          o.scale.setScalar(1 + ud * 0.6);
          k.m.emissive && k.m.emissive.set(A); k.m.emissiveIntensity = 0.15 * ud;
        } else { o.position.set(...k.hjem); o.rotation.set(0, 0, 0); o.scale.setScalar(1); k.m.emissiveIntensity = 0; }
        k.m.color.setScalar(bsOn ? (i !== kortIdx ? 0.75 : 1) : 0.5);
      });
      const form = bsOn && ud > 0.85 ? (kortIdx === 0 ? 1 : 2) : 0;
      [base, udenSkærm, bedste].forEach((e, i) => { e.object3D.visible = i === form; });
      const formSkift = bsOn ? (form !== sidsteKort ? 1 : 0) : 0;
      if (formSkift) { sidsteKort = form; pustT = tNu; }
      const pk = (tNu - pustT) / 600;
      pustM.opacity = bsOn && pk < 1 ? (1 - pk) * 0.9 : 0;
      pust.object3D.scale.setScalar(0.5 + pk);
      proto.object3D.rotation.y = bsOn ? Math.sin(s * 0.6) * 0.35 : 0;
      proto.object3D.scale.setScalar(PS * (bsOn && pk < 1 ? 1 + 0.12 * Math.sin(Math.min(1, pk) * Math.PI) : 1));

      /* terningen og potten */
      const tOn = aktiv === "a2-4";
      if (tOn && tNu - sidstKlik > 7000 && tNu - autoFra > 2600) { tilstand = (tilstand + 1) % 3; autoFra = tNu; pop = 1; }   // kører selv, til nogen peger
      if (!tOn) tilstand = 1;
      const st = TILST[tilstand];
      // uden for trinnet står terningen næsten slukket og grå; i a2-0 lyser den kort på sin tur
      const tFarve = new THREE.Color(st.farve).lerp(new THREE.Color("#3a4060"), tOn ? 0 : 1 - tændt4 * 0.8);
      tMat.color.lerp(tFarve, Math.min(1, (dt || 16) / 120));   // tidsbaseret, så skiftet er lige hurtigt ved lav fps
      tHalo.color.set(st.farve); tHalo.opacity = tOn ? 0.75 : 0;
      kabelM.color.set(tOn ? st.farve : "#2a3358");
      kabelGeo.setDrawRange(0, tOn ? Math.floor(((s * 0.6) % 1) * kabelN / 3) * 3 + kabelN0 : kabelN0);
      if (ansigtM.map !== ansigt[tilstand]) { ansigtM.map = ansigt[tilstand]; ansigtM.needsUpdate = true; }
      tNavne.forEach((n, i) => { n.object3D.visible = tOn && i === tilstand; });
      lamper.forEach((m, i) => m.color.set(i === tilstand ? TILST[i].farve : "#2a3358"));
      hint.object3D.visible = tOn;
      pop = Math.max(0, pop - dt / 350);
      const ts = s;
      const ti = tInner.object3D;
      if (tilstand === 0) { ti.rotation.set(0.12 + Math.sin(ts * 1.2) * 0.04, 0, -0.1); ti.position.y = -0.02; }
      else if (tilstand === 1) { ti.rotation.set(0, Math.sin(ts * 1.4) * 0.12, 0); ti.position.y = 0.02 * Math.sin(ts * 2.5); }
      else { ti.rotation.set(Math.sin(ts * 9) * 0.03, 0, Math.sin(ts * 11) * 0.05); ti.position.y = 0; }
      ti.scale.setScalar(1 + pop * 0.15);
      // potten følger tilstanden
      const blad = [80, -15, 60][tilstand];   // grader: slapt hængende, opret, liggende
      const kL = Math.min(1, (dt || 16) / 200);   // tidsbaseret blødgøring (uafhængig af billedfrekvens)
      blade.forEach((b, i) => { const cur = b.object3D.rotation.x, mål = blad * D * (0.8 + 0.2 * (i % 2)); b.object3D.rotation.x = cur + (mål - cur) * kL; });
      bladM.color.lerp(new THREE.Color(["#a8873a", "#5fb85a", "#3f6a55"][tilstand]), kL);
      stængel.object3D.rotation.z += (([0.75, 0, 0.18][tilstand]) - stængel.object3D.rotation.z) * kL;
      const vs = [0.0001, 0.45, 1.0][tilstand]; vand.object3D.scale.x += (vs - vand.object3D.scale.x) * kL; vand.object3D.scale.z = vand.object3D.scale.x; vand.object3D.position.y = 0.026 + (tilstand === 2 ? 0.008 : 0);
      dråber.forEach((d, i) => { const f = ((ts * 0.8 + i / 3) % 1); d.object3D.visible = tilstand === 2; d.object3D.position.y = 0.62 - f * 0.4; });
      const fg = måler.object3D.scale; fg.y += (st.fugt - fg.y) * kL; målerM.color.set(st.farve);
      T.syncVis();
    },
    dispose() { T.dispose(); },
  };


  /* prototypens versioner på spiralens hylder (lokale koordinater, bunden i y = 0) */
  function v1(b) { // første forsøg: rå papkasse med én lysdiode
    b.box("#b8875a", [0, 0.08, 0], [0.18, 0.16, 0.13], [0, 0, 4]);
    b.cyl("#ff4a3a", [0, 0.12, 0.068], 0.02, 0.02, [90, 0, 0], 8);
    b.box("#d8cba0", [0.05, 0.16, 0], [0.04, 0.005, 0.14]);
  }
  function v2(b) { // anden version: en række lysdioder, der viser hvor fyldt der er
    b.box("#c79a68", [0, 0.08, 0], [0.26, 0.16, 0.12]);
    for (let i = 0; i < 5; i++) b.cyl(i < 3 ? "#3aff7a" : "#3a3f55", [-0.09 + i * 0.045, 0.1, 0.062], 0.014, 0.012, [90, 0, 0], 8);
    b.box("#2f6fd1", [0, 0.17, -0.03], [0.08, 0.02, 0.05]);
  }
  function v3(b) { // tredje version: venlig, rund form med en urskive for frikvarterets tider
    b.cyl("#e0c9a6", [0, 0.1, 0], 0.13, 0.2, null, 18);
    b.sph("#e0c9a6", [0, 0.2, 0], 0.13, [1, 0.45, 1], [18, 6]);
    b.cyl("#1f2a4a", [0, 0.11, 0.125], 0.07, 0.01, [90, 0, 0], 18);
    for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 - 0.4; b.box(i < 2 ? "#3aff7a" : "#ff8a3a", [Math.sin(a) * 0.045, 0.11 + Math.cos(a) * 0.045, 0.132], [0.025, 0.025, 0.004], [0, 0, -a / D]); }
  }
  function roundedBox(s, r) { // terning med afrundede kanter (lavt segmenttal)
    const g = new THREE.BoxGeometry(s, s, s, 3, 3, 3);
    const p = g.attributes.position, v = new THREE.Vector3(), h = s / 2 - r;
    for (let i = 0; i < p.count; i++) {
      v.fromBufferAttribute(p, i);
      const c = new THREE.Vector3(Math.max(-h, Math.min(h, v.x)), Math.max(-h, Math.min(h, v.y)), Math.max(-h, Math.min(h, v.z)));
      const d = v.clone().sub(c); if (d.lengthSq() > 0) d.setLength(r); v.copy(c.add(d)); p.setXYZ(i, v.x, v.y, v.z);
    }
    g.computeVertexNormals(); return g;
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
