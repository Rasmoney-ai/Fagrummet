/* Byggeklodser til rummene. Alt er procedural geometri (ingen modelfiler), så siden kan køre fra GitHub Pages og offline. */
const THREE = window.THREE;

/* ---------- Tekst og billeder på lærred (håndterer æ, ø og å) ---------- */
export function wrap(ctx, text, maxW) {
  const words = String(text).split(/\s+/), lines = []; let line = "";
  for (const w of words) { const t = line ? line + " " + w : w; if (ctx.measureText(t).width > maxW && line) { lines.push(line); line = w; } else line = t; }
  if (line) lines.push(line); return lines;
}
export function roundRect(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
export function canvasTexture(w, h, draw) {
  const c = document.createElement("canvas"); c.width = w; c.height = h; const ctx = c.getContext("2d"); draw(ctx, w, h);
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4; return tex;
}
/* Sætter en tekstur på en a-plane/a-box m.m. Venter til entiteten er klar, ellers overskriver material-komponenten den. */
export function applyTexture(el, tex) {
  const set = () => { const m = el.getObject3D("mesh"); if (!m) return false; m.material.map = tex; m.material.transparent = true; m.material.needsUpdate = true; return true; };
  if (!el.hasLoaded || !set()) el.addEventListener("loaded", () => set(), { once: true });
}
/* Tekstskilt-tekstur. opts: w, h (px), size (px), bg (true/false), ink (tekstfarve), sub (lille undertekst), weight */
export function labelTex(text, color, opts = {}) {
  const w = opts.w || 1024, h = opts.h || 220, size = opts.size || 78;
  return canvasTexture(w, h, (ctx) => {
    ctx.clearRect(0, 0, w, h);
    if (opts.bg !== false) { ctx.fillStyle = "rgba(11,15,30,0.86)"; roundRect(ctx, 6, 6, w - 12, h - 12, 28); ctx.fill(); ctx.strokeStyle = color; ctx.lineWidth = 6; ctx.stroke(); }
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.font = `${opts.weight || 700} ${size}px "Familjen Grotesk", "Segoe UI", sans-serif`;
    const lines = wrap(ctx, text, w - 70), lh = size * 1.1;
    const subSize = Math.round(size * 0.52), subH = opts.sub ? subSize * 1.5 : 0;
    const y0 = h / 2 - ((lines.length - 1) * lh + subH) / 2;
    ctx.fillStyle = opts.ink || color;
    lines.forEach((l, i) => ctx.fillText(l, w / 2, y0 + i * lh));
    if (opts.sub) { ctx.font = `500 ${subSize}px "Source Sans 3", "Segoe UI", sans-serif`; ctx.fillStyle = "#a9b0d6"; ctx.fillText(opts.sub, w / 2, y0 + (lines.length - 1) * lh + lh * 0.55 + subSize * 0.7); }
  });
}
export function glowTex(c) {
  return canvasTexture(256, 256, (ctx, w, h) => {
    const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    g.addColorStop(0, c + "aa"); g.addColorStop(0.55, c + "33"); g.addColorStop(1, c + "00");
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  });
}

/* ---------- Materialer (A-Frame material-strenge) ---------- */
export const mat = (c, extra = "") => `color: ${c}; roughness: 0.65; metalness: 0.1; flatShading: true; ${extra}`;
export const glow = (c, i = 0.6) => `color: ${c}; emissive: ${c}; emissiveIntensity: ${i}; roughness: 0.4; flatShading: true`;
export const flat = (c, extra = "") => `shader: flat; color: ${c}; ${extra}`;
export const glass = (c = "#bfe7ff", o = 0.3) => `color: ${c}; opacity: ${o}; transparent: true; roughness: 0.1; depthWrite: false`;

/* ---------- Animationer (A-Frame animation-strenge) ---------- */
export const sc = s => `${s} ${s} ${s}`;
export const spin = (dur, to = "0 360 0") => `property: rotation; to: ${to}; loop: true; dur: ${dur}; easing: linear`;
export function bob(pos, amp = 0.06, dur = 2200) {
  const [x, y, z] = String(pos).split(" ").map(Number);
  return `property: position; from: ${x} ${y} ${z}; to: ${x} ${y + amp} ${z}; dir: alternate; loop: true; dur: ${dur}; easing: easeInOutSine`;
}
export const pulse = (dur = 600, delay = 0, lo = 0.6, hi = 1.5) => `property: scale; from: ${sc(lo)}; to: ${sc(hi)}; dir: alternate; loop: true; dur: ${dur}; delay: ${delay}; easing: easeInOutSine`;

/* ---------- Primitiver. p = forælder-entitet, pos = "x y z" ---------- */
export function makeKit(defaultParent) {
  function el(tag, attrs = {}, parent = defaultParent) {
    const e = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
    parent.appendChild(e); return e;
  }
  const grp = (p, pos = "0 0 0", extra = {}) => el("a-entity", { position: pos, ...extra }, p);
  const box = (p, pos, w, h, d, m, extra = {}) => el("a-box", { position: pos, width: w, height: h, depth: d, material: m, ...extra }, p);
  const cyl = (p, pos, r, h, m, extra = {}) => el("a-cylinder", { position: pos, radius: r, height: h, material: m, "segments-radial": 16, ...extra }, p);
  const sph = (p, pos, r, m, extra = {}) => el("a-sphere", { position: pos, radius: r, material: m, "segments-width": 16, "segments-height": 10, ...extra }, p);
  const cone = (p, pos, rb, rt, h, m, extra = {}) => el("a-cone", { position: pos, "radius-bottom": rb, "radius-top": rt, height: h, material: m, "segments-radial": 16, ...extra }, p);
  const plane = (p, pos, w, h, m, extra = {}) => el("a-plane", { position: pos, width: w, height: h, material: m, ...extra }, p);
  const torus = (p, pos, r, t, m, extra = {}) => el("a-torus", { position: pos, radius: r, "radius-tubular": t, material: m, "segments-radial": 8, "segments-tubular": 32, ...extra }, p);
  function link(p, a, b, r, m) { // tynd stang mellem to punkter
    const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), d = B.clone().sub(A), len = d.length();
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
    const e = new THREE.Euler().setFromQuaternion(q, "YXZ"), R = 180 / Math.PI, m2 = A.add(B).multiplyScalar(0.5);
    return el("a-cylinder", { position: `${m2.x} ${m2.y} ${m2.z}`, radius: r, height: len, "segments-radial": 6, "open-ended": true, rotation: `${e.x * R} ${e.y * R} ${e.z * R}`, material: m }, p);
  }
  /* Egen THREE-geometri i en entitet (fx ekstruderede former eller sammenflettede meshes). */
  function mesh(p, geometry, material, pos = "0 0 0", extra = {}) {
    const e = grp(p, pos, extra);
    e.setObject3D("mesh", new THREE.Mesh(geometry, material));
    return e;
  }
  /* Simpelt tekstfelt i rummet (ikke skilt): plan med canvas-tekstur. */
  function textPlane(p, pos, text, color, { width = 1.2, aspect = 220 / 1024, size = 78, bg = false, ink, rotation = "0 0 0", sub } = {}) {
    const pl = plane(p, pos, width, width * aspect, "shader: flat; transparent: true; side: double", { rotation });
    applyTexture(pl, labelTex(text, color, { w: 1024, h: Math.round(1024 * aspect), size, bg, ink, sub }));
    return pl;
  }
  return { el, grp, box, cyl, sph, cone, plane, torus, link, mesh, textPlane };
}
