#!/usr/bin/env node
/* Laver speakerlyd til Fagrummet 2 med ElevenLabs (Multilingual v2).
 *
 *   node v2/scripts/lav-lyd.js                 laver alle trin, der mangler eller er ændret, med samme stemme som version 1
 *   node v2/scripts/lav-lyd.js <voice_id>      ... med en bestemt stemme
 *   node v2/scripts/lav-lyd.js --kun f1,a1-2   kun de nævnte trin
 *   node v2/scripts/lav-lyd.js --proeve        laver kun f1 (til at lytte på stemme og udtale)
 *   node v2/scripts/lav-lyd.js --tael          viser antal tegn, uden at kalde API'et
 *
 * Teksten, der læses op, er "<titel>. <tekst>" fra v2/manus.json, ligesom browserstemmen i siden.
 * Filer: v2/audio/<trin-id>.mp3. v2/audio/index.json lister de færdige trin (siden bruger den liste),
 * og v2/audio/hashes.json husker, hvilken tekst og stemme hver fil blev lavet med, så kun ændrede trin laves om.
 *
 * API-nøglen læses fra miljøvariablen ELEVENLABS_API_KEY eller fra .env i roden af repoet (samme som version 1).
 * Uden voice_id bruges stemmen fra version 1 (xj6X4BCUsv9oxohm1E8o). */
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const V2 = path.join(__dirname, "..");
const ROD = path.join(V2, "..");
const AUDIO = path.join(V2, "audio");
const MANUS = JSON.parse(fs.readFileSync(path.join(V2, "manus.json"), "utf8"));
const tale = s => `${s.title}. ${s.text}`;

const args = process.argv.slice(2);
const flag = f => args.includes(f);
const kunIdx = args.indexOf("--kun");
const kun = kunIdx > -1 ? args[kunIdx + 1].split(",").map(s => s.trim()) : null;
// Stemmen fra version 1 (står også i worker/wrangler.toml). Kan overskrives med et voice_id som argument.
const V1_STEMME = "xj6X4BCUsv9oxohm1E8o";
let voiceId = args.find((a, i) => !a.startsWith("--") && args[i - 1] !== "--kun") || process.env.ELEVENLABS_VOICE_ID || V1_STEMME;

let valgte = flag("--proeve") ? MANUS.filter(s => s.id === "f1") : kun ? MANUS.filter(s => kun.includes(s.id)) : MANUS;
if (flag("--tael")) {
  const n = valgte.reduce((a, s) => a + tale(s).length, 0);
  console.log(`${valgte.length} trin, ${n} tegn i alt.`); process.exit(0);
}

const envFil = path.join(ROD, ".env");
if (!process.env.ELEVENLABS_API_KEY && fs.existsSync(envFil)) process.loadEnvFile(envFil);
const KEY = process.env.ELEVENLABS_API_KEY;
if (!KEY) { console.error("Mangler ELEVENLABS_API_KEY (miljøvariabel eller .env i repoets rod)."); process.exit(1); }
const API = "https://api.elevenlabs.io/v1";
const MODEL = "eleven_multilingual_v2";

async function stemmeFraV1() {
  // Find den stemme, der læste version 1's første trin ("Velkommen. Teknologiforståelse bliver ...")
  const r = await fetch(`${API}/history?page_size=1000`, { headers: { "xi-api-key": KEY } });
  if (!r.ok) throw new Error(`GET /history: ${r.status} ${await r.text()}`);
  const { history } = await r.json();
  const hit = (history || []).find(h => /^Velkommen\. Teknologiforståelse bliver/.test(h.text || "")) || (history || []).find(h => h.model_id === MODEL);
  if (!hit) throw new Error("Kunne ikke finde version 1's stemme i historikken. Angiv et voice_id: node v2/scripts/lav-lyd.js <voice_id>");
  console.log(`Bruger stemmen fra version 1: ${hit.voice_name || ""} (${hit.voice_id})`);
  return hit.voice_id;
}

let medSprogkode = true;
async function tts(tekst, fil) {
  const body = { text: tekst, model_id: MODEL };
  if (medSprogkode) body.language_code = "da";
  for (let forsoeg = 1; ; forsoeg++) {
    const r = await fetch(`${API}/text-to-speech/${voiceId}?output_format=mp3_44100_128`, {
      method: "POST", headers: { "xi-api-key": KEY, "Content-Type": "application/json", Accept: "audio/mpeg" }, body: JSON.stringify(body),
    });
    if (r.ok) { fs.writeFileSync(fil, Buffer.from(await r.arrayBuffer())); return; }
    const fejl = await r.text();
    if (medSprogkode && r.status >= 400 && r.status < 500 && /language/i.test(fejl)) { console.warn("API'et afviste language_code; fortsætter uden."); medSprogkode = false; delete body.language_code; continue; }
    if ((r.status === 429 || r.status >= 500) && forsoeg < 4) { const vent = 4000 * forsoeg; console.warn(`${r.status}, prøver igen om ${vent / 1000} s`); await new Promise(x => setTimeout(x, vent)); continue; }
    throw new Error(`TTS ${path.basename(fil)}: ${r.status} ${fejl}`);
  }
}

async function main() {
  fs.mkdirSync(AUDIO, { recursive: true });
  if (!voiceId) voiceId = await stemmeFraV1();
  const hashFil = path.join(AUDIO, "hashes.json"), idxFil = path.join(AUDIO, "index.json");
  const hashes = fs.existsSync(hashFil) ? JSON.parse(fs.readFileSync(hashFil, "utf8")) : {};
  const gem = () => {
    fs.writeFileSync(hashFil, JSON.stringify(hashes, null, 1));
    // index.json = trin, hvis fil findes og passer til den nuværende tekst
    const ok = MANUS.filter(s => fs.existsSync(path.join(AUDIO, `${s.id}.mp3`)) && hashes[s.id] && hashes[s.id].tekst === hash(tale(s))).map(s => s.id);
    fs.writeFileSync(idxFil, JSON.stringify(ok));
  };
  const hash = t => crypto.createHash("sha1").update(t).digest("hex").slice(0, 12);
  let tegn = 0, lavet = 0;
  for (const s of valgte) {
    const t = tale(s), h = hash(t), fil = path.join(AUDIO, `${s.id}.mp3`);
    if (!kun && !flag("--proeve") && fs.existsSync(fil) && hashes[s.id] && hashes[s.id].tekst === h && hashes[s.id].voice === voiceId) continue;
    await tts(t, fil);
    hashes[s.id] = { tekst: h, voice: voiceId }; tegn += t.length; lavet++;
    console.log(`Gemt audio/${s.id}.mp3 (${t.length} tegn)`);
    gem();
  }
  gem();
  console.log(`Færdig: ${lavet} filer, ${tegn} tegn brugt.`);
}
main().catch(e => { console.error(e.message); process.exit(1); });
