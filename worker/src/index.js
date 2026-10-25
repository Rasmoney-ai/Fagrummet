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

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const headers = cors(origin, env);
    if (request.method === "OPTIONS") return new Response(null, { headers });
    if (request.method !== "POST") return json({ error: "Brug POST." }, 405, headers);
    if (new URL(request.url).pathname === "/stt") return transcribe(request, env, headers);

    let body;
    try { body = await request.json(); } catch { return json({ error: "Ugyldig forespørgsel." }, 400, headers); }
    if (!env.ACCESS_CODE || body.code !== env.ACCESS_CODE) return json({ error: "Forkert adgangskode." }, 401, headers);

    const question = String(body.question || "").trim().slice(0, MAX_QUESTION);
    if (!question) return json({ error: "Tomt spørgsmål." }, 400, headers);
    const step = SPEAK[Number(body.step)] ;
    const english = body.lang === "en";

    const messages = [];
    for (const turn of (Array.isArray(body.history) ? body.history : []).slice(-MAX_HISTORY)) {
      if (!turn || !turn.q || !turn.a) continue;
      messages.push({ role: "user", content: String(turn.q).slice(0, MAX_QUESTION) });
      messages.push({ role: "assistant", content: String(turn.a).slice(0, 4000) });
    }
    const context = step ? `Læreren står ved trin ${step.nr} i rundvisningen: "${step.tekst.split(". ")[0]}".` : "";
    const language = english ? "Answer in English, because the reading voice is English." : "Svar på dansk.";
    messages.push({ role: "user", content: `${context} ${language}\n\nSpørgsmål: ${question}`.trim() });

    const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
    try {
      const response = await client.beta.messages.create({
        model: "claude-opus-5-5",
        max_tokens: 2000,
        betas: ["server-side-fallback-2026-07-01"],
        fallbacks: "default",
        output_config: { effort: "low" },
        system: [{ type: "text", text: SYSTEM, cache_control: { type: "ephemeral" } }],
        messages,
      });
      if (response.stop_reason === "refusal") {
        return json({ answer: english ? "Sorry, I can't answer that one." : "Det kan jeg desværre ikke svare på." }, 200, headers);
      }
      const answer = response.content.filter(b => b.type === "text").map(b => b.text).join(" ").trim();
      return json({ answer, usage: response.usage }, 200, headers);
    } catch (error) {
      if (error instanceof Anthropic.AuthenticationError) return json({ error: "API-nøglen virker ikke." }, 502, headers);
      if (error instanceof Anthropic.RateLimitError) return json({ error: "For mange spørgsmål lige nu. Prøv igen om lidt." }, 429, headers);
      if (error instanceof Anthropic.APIError) return json({ error: `Claude svarede med fejl ${error.status}.` }, 502, headers);
      return json({ error: "Kunne ikke nå Claude." }, 502, headers);
    }
  },
};
