#!/usr/bin/env node
/* Laver speakerlyd til Fagrummet med ElevenLabs.
 *
 *   node scripts/lav-lyd.js stemmer                  viser stemmerne på kontoen
 *   node scripts/lav-lyd.js proeve <voice_id> ...    laver trin 1 med hver stemme i proever/
 *   node scripts/lav-lyd.js alle <voice_id> [nr ...] laver alle 24 trin (eller kun de nævnte numre) i audio/
 *
 * API-nøglen læses fra miljøvariablen ELEVENLABS_API_KEY eller fra .env i roden af repoet.
 */
const fs = require("fs");
const path = require("path");

const ROD = path.join(__dirname, "..");
const envFil = path.join(ROD, ".env");
if (!process.env.ELEVENLABS_API_KEY && fs.existsSync(envFil)) process.loadEnvFile(envFil);
const KEY = process.env.ELEVENLABS_API_KEY;
if (!KEY) { console.error("Mangler ELEVENLABS_API_KEY (miljøvariabel eller .env)."); process.exit(1); }

const API = "https://api.elevenlabs.io/v1";
const TEKSTER = JSON.parse(fs.readFileSync(path.join(ROD, "speakertekster.json"), "utf8"));

async function stemmer() {
  const r = await fetch(`${API}/voices`, { headers: { "xi-api-key": KEY } });
  if (!r.ok) throw new Error(`GET /voices: ${r.status} ${await r.text()}`);
  const { voices } = await r.json();
  for (const v of voices) {
    const l = v.labels || {};
    const sprog = (v.verified_languages || []).map(x => x.language).filter(Boolean);
    console.log([v.voice_id, v.name, v.category, l.gender, l.age, l.accent, l.use_case || l["use case"], l.description,
      sprog.length ? "sprog: " + [...new Set(sprog)].join(",") : ""].filter(Boolean).join(" | "));
  }
}

let medSprogkode = true;
async function tts(voiceId, tekst, fil) {
  const body = { text: tekst, model_id: "eleven_multilingual_v2" };
  if (medSprogkode) body.language_code = "da";
  const r = await fetch(`${API}/text-to-speech/${voiceId}?output_format=mp3_44100_128`, {
    method: "POST",
    headers: { "xi-api-key": KEY, "Content-Type": "application/json", Accept: "audio/mpeg" },
    body: JSON.stringify(body),
  });
  if (!r.ok) {
    const fejl = await r.text();
    // Multilingual v2 genkender selv sproget, så language_code kan undværes, hvis API'et afviser den.
    if (medSprogkode && r.status >= 400 && r.status < 500 && /language/i.test(fejl)) {
      console.warn("API'et afviste language_code; prøver igen uden.");
      medSprogkode = false;
      return tts(voiceId, tekst, fil);
    }
    throw new Error(`TTS ${path.basename(fil)}: ${r.status} ${fejl}`);
  }
  fs.mkdirSync(path.dirname(fil), { recursive: true });
  fs.writeFileSync(fil, Buffer.from(await r.arrayBuffer()));
  console.log(`Gemt ${path.relative(ROD, fil)} (${tekst.length} tegn)`);
}

async function main() {
  const [cmd, ...args] = process.argv.slice(2);
  if (cmd === "stemmer") return stemmer();
  if (cmd === "proeve") {
    if (!args.length) throw new Error("Angiv mindst ét voice_id.");
    for (const id of args) await tts(id, TEKSTER[0].tekst, path.join(ROD, "proever", `${id}.mp3`));
    return;
  }
  if (cmd === "alle") {
    const [id, ...numre] = args;
    if (!id) throw new Error("Angiv et voice_id.");
    const valgte = numre.length ? TEKSTER.filter(t => numre.map(Number).includes(t.nr)) : TEKSTER;
    for (const t of valgte) await tts(id, t.tekst, path.join(ROD, t.fil));
    return;
  }
  console.log("Brug: node scripts/lav-lyd.js stemmer | proeve <voice_id> ... | alle <voice_id> [nr ...]");
}

main().catch(e => { console.error(e.message); process.exit(1); });
