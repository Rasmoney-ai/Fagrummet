# Opgave: synkronisér animationerne med speaken

Lydfilerne er lavet (ElevenLabs) og ligger i `v2/audio/<trin>.mp3` med tidspunkt for hvert ord i `v2/audio/<trin>.json` (`{words:[{w, s, e}]}`, sekunder). Hele turen varer 24,5 min. Rammen har to nye funktioner (se SPEC.md):

- `ctx.time()`: sekunder siden det aktuelle trin startede. Følger lydfilen, når den spiller; ellers uret fra trinstart.
- `ctx.cue(stepId, "frase", nth?)`: sekundet hvor frasen siges i trinnet, slået op i tidskoderne (uden lyd: et skøn). Matcher på ord uden tegnsætning og store bogstaver.

**Opgave:** gå dine rum igennem og find de animationer, der fremhæver noget, speaken siger (en port der åbner, et lag der lyser op, et mærke der dukker op, et forløb i trin). Lige nu kører de på faste tider fra trinstart, som er gættet. Lad dem i stedet starte, når det relevante ord siges: i `tick`, sammenlign `ctx.time()` med `ctx.cue(id, "...")`. Slå de rigtige tider op i json-filerne for at vælge gode stikord. Eksempel: i f6 siges "Programmering" ved 10,0 s og ikke ved ca. 5,6 s, som var gættet.

Regler:
1. Rækkefølge og pointe først: en fremhævning skal ramme lige når ordet siges (eller op til 0,3 s før), ikke bagefter.
2. Tid der går fremad uden stikord (loops, idle-bevægelse) må blive som den er.
3. Sluttilstanden skal være nået senest ved trinnets sidste ord (`words.at(-1).e`) og blive stående.
4. Uden lyd skal alt stadig virke (cue giver et skøn, og time() er uret) – du skal ikke lave en særvej.
5. Hvis man hopper til et trin midt i, skal scenen ikke vise en halv tilstand, der aldrig bliver færdig.
6. Brug kun fraser, der står ordret i trinnets title/text i manus.json; `ctx.cue` advarer i konsollen, hvis en frase ikke findes – det må ikke ske.

Test: `node tools/shot.mjs <rum> <trin> --wait <ms>` virker som før. Testen kører uden lyd, så `ctx.time()` er uret fra trinstart, mens `ctx.cue` bruger de rigtige tidskoder – det svarer til, hvad man oplever med lyd. Tag billeder lige før og lige efter et stikord for at se, at det rammer. Ingen konsoladvarsler om manglende stikord. Kort slutrapport: hvilke animationer du har koblet til hvilke stikord.
