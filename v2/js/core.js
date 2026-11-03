/* Fagrummet 2 — rammen: rum-indlæsning, rute, navigation, døre, stationer, skilte, fortælling og VR-panel.
   Rummene ligger i rooms/<id>.js og bygges via ctx (se SPEC.md). */
import { C, ROOMS, AREA_NAME, buildRoute } from "./data.js";
import * as K from "./kit.js";

const THREE = window.THREE, AFRAME = window.AFRAME;
const $ = id => document.getElementById(id);
const params = new URLSearchParams(location.search);
const scene = $("scene"), rig = $("rig"), cam = $("cam"), roomsRoot = $("rooms");
const APP_VERSION = "v2.0-udkast";

let STEPS = [], ROUTE = [], BYID = {}, AUDIO = new Set();
let cur = null;            // aktuelt trin-id
let curRoom = null;        // aktuelt rum-id
let api = null;            // det aktuelle rums {onStep, tick, dispose}
let rctx = null;           // det aktuelle rums ctx-intern tilstand
let ttsOn = true, daVoice = null, player = null, busy = false;
const VISITED = new Set();   // rum besøgt i denne session
let cameFrom = null;         // rummet man kom fra

/* ---------- Fade (virker også i VR: en kugle om kameraet) ---------- */
const fader = $("fader");
function fade(to, dur = 280) {
  return new Promise(res => {
    fader.setAttribute("visible", true);
    fader.setAttribute("animation__f", `property: components.material.material.opacity; to: ${to}; dur: ${dur}; easing: linear`);
    setTimeout(() => { if (to === 0) fader.setAttribute("visible", false); res(); }, dur + 30);
  });
}

/* ---------- Rig: placering og blik ---------- */
const R2D = 180 / Math.PI;
function yawTo(from, to) { return Math.atan2(-(to[0] - from[0]), -(to[2] - from[2])) * R2D; }
function resetHead(pitch = 0) {
  const lc = cam.components["look-controls"];
  if (lc && !scene.is("vr-mode")) { lc.pitchObject.rotation.x = pitch / R2D; lc.yawObject.rotation.y = 0; }
}
function placeRig(x, z, yaw, animate, pitch = 0) {
  rig.removeAttribute("animation__p"); rig.removeAttribute("animation__r");
  if (!animate) { rig.object3D.position.set(x, 0, z); rig.object3D.rotation.set(0, yaw / R2D, 0); resetHead(pitch); return; }
  rig.setAttribute("animation__p", `property: position; to: ${(+x).toFixed(3)} 0 ${(+z).toFixed(3)}; dur: 1400; easing: easeInOutCubic`);
  const ry = rig.object3D.rotation.y * R2D; let to = yaw; while (to - ry > 180) to -= 360; while (to - ry < -180) to += 360;
  rig.setAttribute("animation__r", `property: rotation; to: 0 ${(+to).toFixed(2)} 0; dur: 1400; easing: easeInOutCubic`);
  resetHead(pitch);
}

/* ---------- Fortælling ---------- */
function pickVoice() {
  const vs = speechSynthesis.getVoices(); const da = vs.filter(v => /^da/i.test(v.lang));
  daVoice = da.find(v => /natural|online|neural/i.test(v.name)) || da[0] || null;
  $("voiceNote").textContent = AUDIO.size ? "Indspillet stemme." : daVoice ? `Stemme: ${daVoice.name}` : vs.length ? "Ingen dansk stemme i browseren. Edge har naturlige danske stemmer." : "";
}
if ("speechSynthesis" in window) { pickVoice(); speechSynthesis.onvoiceschanged = pickVoice; }
function stopSpeech() { if (player) { player.pause(); player = null; } if ("speechSynthesis" in window) speechSynthesis.cancel(); }
function speak(s, force = false) {
  stopSpeech(); if (!s || (!ttsOn && !force)) return;
  if (AUDIO.has(s.id)) { player = new Audio(`audio/${s.id}.mp3`); player.play().catch(() => {}); return; }
  if (!("speechSynthesis" in window)) return;
  const u = new SpeechSynthesisUtterance(`${s.title}. ${s.text}`); u.lang = "da-DK"; if (daVoice) u.voice = daVoice; u.rate = 1.0;
  speechSynthesis.speak(u);
}
function setTts(on) { ttsOn = on; $("tts").setAttribute("aria-pressed", on); $("tts").textContent = on ? "Lyd til" : "Lyd fra"; if (!on) stopSpeech(); drawVrButtons(); }

/* ---------- Skilte, døre og stationer (stilles til rådighed for rummene via ctx) ---------- */
function makeSign(kit, text, { position = "0 2.6 0", rotation = "0 0 0", width = 1.8, color, sub, bg = true, size = 78, parent } = {}) {
  const aspect = sub ? 300 / 1024 : 220 / 1024;
  const pl = kit.plane(parent, position, width, width * aspect, "shader: flat; transparent: true; side: double", { rotation });
  K.applyTexture(pl, K.labelTex(text, color, { w: 1024, h: Math.round(1024 * aspect), size, bg, sub, ink: "#eef1ff" }));
  return pl;
}
function makeDoor(kit, root, to, { position = "0 0 -4", rotation = "0 0 0", label, width = 1.6, height = 2.5, glow, quiet = false } = {}) {
  const r = ROOMS[to]; const col = r.color;
  // Kernens lavendel er næsten hvid; den lyser derfor svagere som standard. glow (0-1) og quiet (ingen puls, svag portal) kan sættes af rummet.
  const gi = glow ?? (r.area === "core" ? 0.12 : 0.35);
  const g = kit.grp(root, position, { rotation });
  const up = to === ROOMS[curRoom].parent;
  kit.box(g, `${-width / 2 - 0.08} ${height / 2} 0`, 0.16, height, 0.22, K.glow(col, gi));
  kit.box(g, `${width / 2 + 0.08} ${height / 2} 0`, 0.16, height, 0.22, K.glow(col, gi));
  kit.box(g, `0 ${height + 0.08} 0`, width + 0.32, 0.16, 0.22, K.glow(col, gi));
  const portal = kit.plane(g, `0 ${height / 2} 0`, width, height, `shader: flat; color: ${col}; opacity: ${quiet ? 0.08 : 0.22}; transparent: true; side: double; depthWrite: false`, { class: "klik" });
  if (!quiet) portal.setAttribute("animation__o", "property: components.material.material.opacity; from: 0.14; to: 0.32; dir: alternate; loop: true; dur: 1600; easing: easeInOutSine");
  g.portal = portal;   // rummet kan selv dæmpe/fremhæve portalen
  const name = label || (up ? `Tilbage: ${r.name}` : r.name);
  makeSign(kit, name, { parent: g, position: `0 ${height + 0.55} 0`, width: 1.9, color: col, sub: up ? null : (r.sub !== r.name ? r.sub : null) });
  portal.addEventListener("click", () => goRoom(to));
  if (rctx) rctx.doors.push({ to, portal });
  return g;
}
const RING_TEX = {};
function makeBeacon(kit, color) {
  RING_TEX[color] = RING_TEX[color] || K.glowTex(color);
  const b = kit.grp(roomsRoot, "0 0 0", { visible: false });
  const ring = kit.torus(b, "0 0.03 0", 0.75, 0.025, K.flat(color), { rotation: "-90 0 0" });
  ring.setAttribute("animation", "property: scale; from: 1 1 1; to: 1.12 1.12 1.12; dir: alternate; loop: true; dur: 900; easing: easeInOutSine");
  const pool = kit.plane(b, "0 0.02 0", 2.2, 2.2, "shader: flat; transparent: true; depthWrite: false", { rotation: "-90 0 0" });
  K.applyTexture(pool, RING_TEX[color]);
  return b;
}

/* ---------- Rum ---------- */
async function loadRoom(id, stepId, { instant = false } = {}) {
  if (busy) return; busy = true;
  stopSpeech();
  if (!instant) await fade(1);
  if (api && api.dispose) { try { api.dispose(); } catch (e) { console.warn(e); } }
  while (roomsRoot.firstChild) roomsRoot.removeChild(roomsRoot.firstChild);
  api = null; cur = null;
  scene.setAttribute("background", `color: ${C.night}`); scene.removeAttribute("fog");
  cameFrom = curRoom; curRoom = id; VISITED.add(id); const room = ROOMS[id];
  const root = document.createElement("a-entity"); root.id = `room-${id}`; roomsRoot.appendChild(root);
  const kit = K.makeKit(root);
  rctx = { stations: {}, views: {}, doors: [], beacon: makeBeacon(kit, room.color) };
  const ctx = {
    THREE, AFRAME, root, room, C, K, kit, el: kit.el,
    rooms: ROOMS,   // opslag af andre rum (navn, sub, farve) — kun til læsning
    visited: new Set(VISITED), cameFrom,   // besøgte rum (inkl. dette) og rummet man kom fra (null ved start)
    steps: STEPS.filter(s => s.room === id), step: sid => BYID[sid],
    sign: (text, o = {}) => makeSign(kit, text, { color: room.color, parent: root, ...o }),
    door: (to, o = {}) => makeDoor(kit, root, to, o),
    station(sid, entity) {
      rctx.stations[sid] = entity; entity.classList.add("klik");
      entity.addEventListener("click", ev => { ev.stopPropagation && ev.stopPropagation(); if (cur !== sid) setStep(sid); });
      return entity;
    },
    view(sid, { position, lookAt, pitch }) { rctx.views[sid] = { position, lookAt, pitch }; },
    onClick(entity, fn) { entity.classList.add("klik"); entity.addEventListener("click", ev => { ev.stopPropagation(); fn(ev); }); return entity; },
    env({ background, fog } = {}) { if (background) scene.setAttribute("background", `color: ${background}`); if (fog) scene.setAttribute("fog", fog); },
    goStep: sid => setStep(sid), goRoom,
  };
  try {
    const mod = await import(`../rooms/${id}.js?v=${APP_VERSION}`);
    api = (await mod.default(ctx)) || {};
  } catch (e) {
    console.error(`Rummet ${id} kunne ikke bygges`, e);
    makeSign(kit, `${room.name} er ikke bygget endnu`, { parent: root, color: room.color, position: "0 1.8 -3" });
    if (room.parent) makeDoor(kit, root, room.parent, { position: "0 0 -5" });
    api = {};
  }
  const [x, z, yaw] = room.spawn; placeRig(x, z, yaw, false);
  renderRoomNav();
  busy = false;
  const first = stepId || (ctx.steps.find(s => !s.exit) || ctx.steps[0] || {}).id;
  if (first) setStep(first, { fromLoad: true });
  else updateUi();
  if (!instant) await fade(0);
}
function goRoom(to) {
  if (busy || to === curRoom) return;
  // Går man "op" til forælderen, lander man på forælderens sidste trin (fx områdets mål på vej ud).
  const up = to === ROOMS[curRoom]?.parent;
  const rs = STEPS.filter(s => s.room === to);
  const target = up ? (rs.filter(s => s.exit).pop() || rs[rs.length - 1]) : (rs.find(s => !s.exit) || rs[0]);
  loadRoom(to, target && target.id);
}

/* ---------- Trin ---------- */
function setStep(id, { fromLoad = false } = {}) {
  const s = BYID[id]; if (!s) return;
  if (s.room !== curRoom) { loadRoom(s.room, id); return; }
  cur = id;
  // beacon under den aktuelle station
  const st = rctx.stations[id], b = rctx.beacon;
  if (st && st.object3D) { const v = new THREE.Vector3(); st.object3D.getWorldPosition(v); b.object3D.position.set(v.x, 0, v.z); b.setAttribute("visible", true); }
  else b.setAttribute("visible", false);
  // blik/placering for trinnet
  const vw = rctx.views[id];
  if (vw) {
    const p = vw.position, px = p[0], pz = p[2] ?? p[1], la = vw.lookAt;
    const yaw = la ? yawTo([px, 0, pz], la) : rig.object3D.rotation.y * R2D;
    // pitch: tal i grader, eller true = beregn ud fra lookAt's højde (øjenhøjde 1,6 m). Uden pitch kigger man vandret.
    let pitch = 0;
    if (typeof vw.pitch === "number") pitch = vw.pitch;
    else if (vw.pitch === true && la && la.length === 3) pitch = Math.atan2(la[1] - 1.6, Math.hypot(la[0] - px, la[2] - pz)) * R2D;
    placeRig(px, pz, yaw, !fromLoad, pitch);
  }
  if (api && api.onStep) { try { api.onStep(id); } catch (e) { console.warn(e); } }
  updateUi(); speak(s);
}
function routeIndex() { return ROUTE.findIndex(s => s.id === cur); }
function next() { const i = routeIndex(); const n = ROUTE[(i + 1) % ROUTE.length]; setStep(n.id); }
function prev() { const i = routeIndex(); if (i > 0) setStep(ROUTE[i - 1].id); }

/* ---------- Skærm-UI ---------- */
function updateUi() {
  const room = ROOMS[curRoom], s = BYID[cur];
  $("chip").textContent = room.area === "core" ? room.name : `${AREA_NAME[room.area]} · ${room.name}`;
  $("chip").style.color = room.color;
  const rs = STEPS.filter(x => x.room === curRoom);
  $("count").textContent = s ? `${rs.indexOf(s) + 1} / ${rs.length} · rute ${routeIndex() + 1} / ${ROUTE.length}` : "";
  $("title").textContent = s ? s.title : room.name;
  $("bodyText").textContent = s ? s.text : "";
  $("prev").disabled = routeIndex() <= 0;
  $("next").textContent = routeIndex() === ROUTE.length - 1 ? "Forfra" : "Næste";
  $("up").hidden = !room.parent; if (room.parent) $("up").textContent = `Tilbage til ${ROOMS[room.parent].name}`;
  document.querySelectorAll("#roomnav button").forEach(b => b.classList.toggle("on", b.dataset.room === curRoom));
  drawVrPanel();
}
function renderRoomNav() {
  const nav = $("roomnav"); if (nav.childElementCount) return;
  const add = (id, cls = "") => { const r = ROOMS[id]; const b = document.createElement("button"); b.type = "button"; b.dataset.room = id;
    b.textContent = r.name; b.className = cls; b.style.setProperty("--c", r.color); b.onclick = () => { if (id !== curRoom) goRoom2(id); }; nav.appendChild(b); };
  add("forhal");
  for (const h of ["hal-a", "hal-b", "hal-c"]) { add(h, "hal"); ROOMS[h].children.forEach(c => add(c, "sub")); }
  add("udsigt");
}
function goRoom2(id) { const rs = STEPS.filter(s => s.room === id); const t = rs.find(s => !s.exit) || rs[0]; loadRoom(id, t && t.id); }

/* ---------- VR-panel (følger med riggen) ---------- */
function drawVrPanel() {
  const room = ROOMS[curRoom], s = BYID[cur];
  const rs = STEPS.filter(x => x.room === curRoom);
  K.applyTexture($("vrPanel"), K.canvasTexture(1500, 420, (ctx, w, h) => {
    ctx.fillStyle = "rgba(20,26,48,0.94)"; K.roundRect(ctx, 8, 8, w - 16, h - 16, 40); ctx.fill();
    ctx.strokeStyle = room.color; ctx.lineWidth = 6; ctx.stroke();
    ctx.textBaseline = "middle"; ctx.textAlign = "left";
    ctx.fillStyle = room.color; ctx.font = '600 44px "Source Sans 3", sans-serif';
    ctx.fillText(room.area === "core" ? room.name : `${AREA_NAME[room.area]} · ${room.name}`, 60, 80);
    ctx.fillStyle = "#eef1ff"; ctx.font = '700 72px "Familjen Grotesk", sans-serif';
    K.wrap(ctx, s ? s.title : room.name, w - 120).slice(0, 2).forEach((l, i) => ctx.fillText(l, 60, 175 + i * 80));
    // trin i rummet som prikker
    rs.forEach((x, i) => { ctx.globalAlpha = x.id === cur ? 1 : 0.35; ctx.fillStyle = room.color; ctx.beginPath(); ctx.arc(70 + i * 44, 350, x.id === cur ? 15 : 10, 0, 7); ctx.fill(); });
    ctx.globalAlpha = 1; ctx.textAlign = "right"; ctx.fillStyle = "#6b7299"; ctx.font = '500 32px "JetBrains Mono", monospace';
    ctx.fillText(`${routeIndex() + 1} / ${ROUTE.length}`, w - 60, 350);
  }));
}
function drawVrButtons() {
  const labels = { prev: "Forrige", next: "Næste", replay: "Hør igen", up: "Tilbage" };
  document.querySelectorAll(".vrbtn").forEach(b => { const a = b.dataset.action;
    K.applyTexture(b, K.labelTex(a === "replay" && !ttsOn ? "Læs op" : labels[a], "#eef1ff", { w: 400, h: 200, size: 62 })); });
}

/* ---------- Bevægelse i VR med thumbsticks: venstre = gå, højre = drej 30° ---------- */
AFRAME.registerComponent("stick-move", {
  init() {
    this.move = { x: 0, y: 0 }; this.turned = false;
    this.el.addEventListener("thumbstickmoved", e => {
      if (this.el.id === "handL") { this.move.x = e.detail.x; this.move.y = e.detail.y; return; }
      const x = e.detail.x;
      if (Math.abs(x) > 0.7 && !this.turned) { this.turned = true; rig.object3D.rotation.y -= Math.sign(x) * Math.PI / 6; }
      if (Math.abs(x) < 0.3) this.turned = false;
    });
  },
  tick(t, dt) {
    if (this.el.id !== "handL") return; const { x, y } = this.move; if (Math.abs(x) < 0.15 && Math.abs(y) < 0.15) return;
    const dir = new THREE.Vector3(); cam.object3D.getWorldDirection(dir); dir.y = 0; dir.normalize().multiplyScalar(-1);
    const right = new THREE.Vector3(-dir.z, 0, dir.x); const sp = 1.6 * dt / 1000;
    rig.object3D.position.addScaledVector(dir, -y * sp).addScaledVector(right, x * sp);
  },
});
/* Rummets tick */
AFRAME.registerComponent("room-ticker", { tick(t, dt) { if (api && api.tick) { try { api.tick(t, dt); } catch (e) { api.tick = null; console.error("Rummets tick fejlede og er slået fra:", e); } } } });

/* ---------- Start ---------- */
function begin(sound) {
  $("start").hidden = true; setTts(sound);
  const room = params.get("room"), step = params.get("step");
  if (step && BYID[step]) loadRoom(BYID[step].room, step, { instant: true });
  else if (room && ROOMS[room]) goRoom2(room);
  else loadRoom("forhal", ROUTE[0].id, { instant: true });
}
async function init() {
  STEPS = await (await fetch(`manus.json?v=${APP_VERSION}`)).json();
  STEPS.forEach(s => BYID[s.id] = s); ROUTE = buildRoute(STEPS);
  try { const r = await fetch("audio/index.json", { cache: "no-store" }); if (r.ok) (await r.json()).forEach(id => AUDIO.add(id)); } catch (e) {}
  if ("speechSynthesis" in window) pickVoice();
  $("ver").textContent = APP_VERSION;
  $("prev").onclick = prev; $("next").onclick = next;
  $("replay").onclick = () => speak(BYID[cur], true);
  $("tts").onclick = () => setTts(!ttsOn);
  $("up").onclick = () => { const p = ROOMS[curRoom].parent; if (p) goRoom(p); };
  document.addEventListener("keydown", e => { if (!$("start").hidden) return; if (e.key === "ArrowRight") next(); if (e.key === "ArrowLeft") prev(); });
  document.querySelectorAll(".vrbtn").forEach(b => b.addEventListener("click", () => {
    const a = b.dataset.action; if (a === "prev") prev(); else if (a === "next") next(); else if (a === "replay") speak(BYID[cur], true); else { const p = ROOMS[curRoom].parent; if (p) goRoom(p); }
  }));
  drawVrButtons();
  scene.addEventListener("enter-vr", () => { $("vrPanelWrap").setAttribute("visible", true); $("card").hidden = true; });
  scene.addEventListener("exit-vr", () => { $("vrPanelWrap").setAttribute("visible", false); $("card").hidden = params.get("ui") === "0"; });
  $("go").onclick = () => begin(true); $("goSilent").onclick = () => begin(false);
  $("goVR").onclick = () => { begin(true); scene.enterVR(); };
  if (navigator.xr && navigator.xr.isSessionSupported) navigator.xr.isSessionSupported("immersive-vr").then(ok => { $("goVR").hidden = !ok; }).catch(() => {});
  if (params.get("ui") === "0") { $("card").hidden = true; $("hint").hidden = true; }
  if (params.get("autostart")) begin(params.get("silent") ? false : true);
  // Til test: trekanter og draw calls for det aktuelle rum
  window.__fagrum = {
    stats() { const i = scene.renderer.info; return { room: curRoom, step: cur, triangles: i.render.triangles, calls: i.render.calls, geometries: i.memory.geometries, textures: i.memory.textures }; },
    setStep, goRoom: goRoom2, ready: () => !busy && !!curRoom,
    doors: () => rctx ? rctx.doors.map(d => d.to) : [],
    clickDoor: to => { const d = rctx && rctx.doors.find(x => x.to === to); if (d) d.portal.emit("click"); return !!d; },
    next, current: () => ({ room: curRoom, step: cur }),
  };
}
const ready = () => (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(init);
if (scene.hasLoaded) ready(); else scene.addEventListener("loaded", ready);
