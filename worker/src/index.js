/* Fagrummet: Claude svarer på spørgsmål om fagplanen for teknologiforståelse.
 * Siden sender {question, step, history, lang, code}; workeren svarer {answer}.
 * API-nøglen ligger kun her som hemmelighed og når aldrig browseren. */
import Anthropic from "@anthropic-ai/sdk";
import FAGPLAN from "./fagplan.txt";
import SPEAK from "../../speakertekster.json";

const MAX_QUESTION = 1000;   // tegn
const MAX_HISTORY = 6;       // tidligere spørgsmål/svar, der sendes med

const TOUR = SPEAK.map(s => `Trin ${s.nr}: ${s.tekst}`).join("\n");

// Fast systemprompt: ændres den ikke, kan den caches mellem spørgsmål.
const SYSTEM = `Du er en vidende og venlig sparringspartner for en lærer, der vil sætte sig godt ind i det nye valgfag teknologiforståelse. Læreren går en VR-rundvisning igennem og stiller spørgsmål undervejs med stemmen.

Dit svar bliver læst højt af en browserstemme. Skriv derfor almindelig talt prosa: ingen overskrifter, punktopstillinger, fed skrift, emojis eller links. Svar kort, typisk 2-5 sætninger, medmindre læreren beder om mere. Begynd straks på selve svaret.

Fagplanen herunder er dit faste grundlag for, hvad faget er. Brug derudover gerne hele din viden og dømmekraft: giv konkrete eksempler på forløb og aktiviteter, forklar begreber, foreslå materialer og værktøjer, perspektiver til forskning, didaktik og samfundsdebat, og tænk med på lærerens idéer. Gør det tydeligt, hvad der står i fagplanen, og hvad der er dit eget bud, fx med "fagplanen siger ..." og "et eksempel kunne være ...". Spørgsmålet kan være transskriberet fra tale og indeholde fejl; gæt det mest sandsynlige.

<fagplan titel="Andet udkast: Fagplan for teknologiforståelse (valgfag), juni 2026">
${FAGPLAN}
</fagplan>

<rundvisning beskrivelse="De 24 trin i VR-rundvisningen, som læreren hører undervejs">
${TOUR}
</rundvisning>`;

function cors(origin, env) {
  const allowed = (env.ALLOWED_ORIGINS || "").split(",").map(s => s.trim());
  return {
    "Access-Control-Allow-Origin": allowed.includes(origin) ? origin : allowed[0],
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Code",
    "Vary": "Origin",
  };
}
const json = (body, status, headers) =>
  new Response(JSON.stringify(body), { status, headers: { ...headers, "Content-Type": "application/json; charset=utf-8" } });

const MAX_AUDIO = 4 * 1024 * 1024;   // bytes, ca. et minuts optagelse

// Tale til tekst: siden sender den optagne lyd, Whisper på Workers AI svarer med teksten.
async function transcribe(request, env, headers) {
  if (!env.ACCESS_CODE || request.headers.get("X-Code") !== env.ACCESS_CODE) return json({ error: "Forkert adgangskode." }, 401, headers);
  const bytes = new Uint8Array(await request.arrayBuffer());
  if (!bytes.length) return json({ error: "Ingen lyd modtaget." }, 400, headers);
  if (bytes.length > MAX_AUDIO) return json({ error: "Optagelsen er for lang." }, 413, headers);
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  try {
    const result = await env.AI.run("@cf/openai/whisper-large-v3-turbo", {
      audio: btoa(binary), language: "da",
      initial_prompt: "Spørgsmål om faget teknologiforståelse, fagplanen, programmering, modellering og digitale fænomener.",
    });
    return json({ text: (result.text || "").trim() }, 200, headers);
  } catch (error) {
    return json({ error: "Kunne ikke forstå lyden." }, 502, headers);
  }
}

const MAX_TTS = 2500;   // tegn pr. oplæsning

// ElevenLabs: tekst -> mp3. previous gør tonefaldet sammenhængende, når et svar læses op i bidder.
async function ttsFetch(env, text, previous = "") {
  return fetch(`https://api.elevenlabs.io/v1/text-to-speech/${env.ELEVENLABS_VOICE_ID}?output_format=mp3_44100_64`, {
    method: "POST",
    headers: { "xi-api-key": env.ELEVENLABS_API_KEY, "Content-Type": "application/json", Accept: "audio/mpeg" },
    body: JSON.stringify({ text, model_id: "eleven_flash_v2_5", language_code: "da", ...(previous ? { previous_text: previous.slice(-1000) } : {}) }),
  });
}
function toBase64(buffer) {
  const bytes = new Uint8Array(buffer); let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(binary);
}

// Oplæsning af en hel tekst (bruges, hvis siden ikke kan modtage svaret i bidder).
async function speech(request, env, headers) {
  let body;
  try { body = await request.json(); } catch { return json({ error: "Ugyldig forespørgsel." }, 400, headers); }
  if (!env.ACCESS_CODE || body.code !== env.ACCESS_CODE) return json({ error: "Forkert adgangskode." }, 401, headers);
  if (!env.ELEVENLABS_API_KEY || !env.ELEVENLABS_VOICE_ID) return json({ error: "Oplæsning er ikke sat op." }, 501, headers);
  const text = String(body.text || "").trim().slice(0, MAX_TTS);
  if (!text) return json({ error: "Ingen tekst." }, 400, headers);
  const r = await ttsFetch(env, text);
  if (!r.ok) return json({ error: `Oplæsningen fejlede (${r.status}).` }, 502, headers);
  return new Response(r.body, { headers: { ...headers, "Content-Type": "audio/mpeg" } });
}

function buildRequest(body) {
  const question = String(body.question || "").trim().slice(0, MAX_QUESTION);
  const step = SPEAK[Number(body.step)];
  const messages = [];
  for (const turn of (Array.isArray(body.history) ? body.history : []).slice(-MAX_HISTORY)) {
    if (!turn || !turn.q || !turn.a) continue;
    messages.push({ role: "user", content: String(turn.q).slice(0, MAX_QUESTION) });
    messages.push({ role: "assistant", content: String(turn.a).slice(0, 4000) });
  }
  const context = step ? `Læreren står ved trin ${step.nr} i rundvisningen: "${step.tekst.split(". ")[0]}".` : "";
  messages.push({ role: "user", content: `${context} Svar på dansk.

Spørgsmål: ${question}`.trim() });
  return {
    question,
    params: {
      model: "claude-opus-5-5",
      max_tokens: 2000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { effort: "low" },
      system: [{ type: "text", text: SYSTEM, cache_control: { type: "ephemeral" } }],
      messages,
    },
  };
}
function claudeError(error) {
  if (error instanceof Anthropic.AuthenticationError) return "API-nøglen virker ikke.";
  if (error instanceof Anthropic.RateLimitError) return "For mange spørgsmål lige nu. Prøv igen om lidt.";
  if (error instanceof Anthropic.APIError) return `Claude svarede med fejl ${error.status}.`;
  return "Kunne ikke nå Claude.";
}
const REFUSAL = "Det kan jeg desværre ikke svare på.";

// Hvor langt et stykke tekst skal være, før det sendes til oplæsning. Første bid er kort, så lyden starter hurtigt.
function cutPoint(text, first) {
  const min = first ? 30 : 140, re = /[.!?:;](\s|$)/g; let m, cut = -1;
  while ((m = re.exec(text))) { if (m.index + 1 >= min) { cut = m.index + 1; break; } }
  if (cut < 0 && text.length > 320) { const c = text.lastIndexOf(", "); if (c > min) cut = c + 1; }
  return cut;
}

// Svar i bidder: Claudes tekst streames, hver sætning eller to læses op med det samme,
// og siden får lyden som linjer af JSON (ndjson) i den rigtige rækkefølge.
function answerStream(body, env, headers, ctx) {
  const { params } = buildRequest(body);
  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter(), enc = new TextEncoder();
  const send = obj => writer.write(enc.encode(JSON.stringify(obj) + "\n"));
  const canSpeak = !!(env.ELEVENLABS_API_KEY && env.ELEVENLABS_VOICE_ID);

  const work = (async () => {
    let full = "", pending = "", spoken = "", order = Promise.resolve();
    const speakChunk = text => {
      const previous = spoken; spoken += (spoken ? " " : "") + text;
      const audio = canSpeak ? ttsFetch(env, text, previous).then(r => r.ok ? r.arrayBuffer() : null).catch(() => null) : Promise.resolve(null);
      order = order.then(async () => { const buf = await audio; await send({ type: "chunk", text, audio: buf ? toBase64(buf) : null }); });
    };
    try {
      const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
      const stream = client.beta.messages.stream(params);
      for await (const event of stream) {
        if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
          full += event.delta.text; pending += event.delta.text;
          let cut;
          while ((cut = cutPoint(pending, !spoken)) > 0) { speakChunk(pending.slice(0, cut).trim()); pending = pending.slice(cut); }
        }
      }
      const final = await stream.finalMessage();
      if (final.stop_reason === "refusal" && !full.trim()) { full = REFUSAL; pending = REFUSAL; }
      if (pending.trim()) speakChunk(pending.trim());
      await order;
      await send({ type: "done", answer: full.trim() });
    } catch (error) {
      await order.catch(() => {});
      await send({ type: "error", error: claudeError(error) });
    } finally {
      await writer.close();
    }
  })();
  ctx.waitUntil(work);
  return new Response(readable, { headers: { ...headers, "Content-Type": "application/x-ndjson; charset=utf-8", "Cache-Control": "no-store" } });
}

export default {
  async fetch(request, env, ctx) {
    const origin = request.headers.get("Origin") || "";
    const headers = cors(origin, env);
    if (request.method === "OPTIONS") return new Response(null, { headers });
    if (request.method !== "POST") return json({ error: "Brug POST." }, 405, headers);
    const path = new URL(request.url).pathname;
    if (path === "/stt") return transcribe(request, env, headers);
    if (path === "/tts") return speech(request, env, headers);

    let body;
    try { body = await request.json(); } catch { return json({ error: "Ugyldig forespørgsel." }, 400, headers); }
    if (!env.ACCESS_CODE || body.code !== env.ACCESS_CODE) return json({ error: "Forkert adgangskode." }, 401, headers);
    if (!String(body.question || "").trim()) return json({ error: "Tomt spørgsmål." }, 400, headers);
    if (path === "/stream") return answerStream(body, env, headers, ctx);

    try {
      const response = await new Anthropic({ apiKey: env.ANTHROPIC_API_KEY }).beta.messages.create(buildRequest(body).params);
      if (response.stop_reason === "refusal") return json({ answer: REFUSAL }, 200, headers);
      const answer = response.content.filter(b => b.type === "text").map(b => b.text).join(" ").trim();
      return json({ answer }, 200, headers);
    } catch (error) {
      return json({ error: claudeError(error) }, 502, headers);
    }
  },
};
