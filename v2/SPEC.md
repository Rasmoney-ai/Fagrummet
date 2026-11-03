# Fagrummet 2 — specifikation for rum-moduler

Fagrummet 2 er en WebXR-rundvisning (A-Frame 1.6, ligger i `vendor/`) i det nye valgfag teknologiforståelse, bygget på andet udkast til fagplanen (juni 2026). Den skal virke på en Meta Quest-browser og på en almindelig skærm.

- `manus.md`: hele manus med scenografi pr. rum og en "Scene:"-linje pr. trin. **Læs dine rums afsnit grundigt.** Teksterne er givet; du ændrer dem ikke.
- `manus.json`: de 54 trin (`id`, `room`, `title`, `text`, `scene`, `exit`).
- `js/data.js`: rum, farver, forælder/børn, spawn. `js/core.js`: rammen (rør den ikke). `js/kit.js`: byggeklodser.
- `rooms/<rum-id>.js`: ét modul pr. rum. **Det er dem, du skriver.**

## Modulets form

```js
export default function build(ctx) {
  // byg rummet under ctx.root
  return {
    onStep(stepId) { /* sæt scenen til trinnet (se "Scene:"-linjen i manus) */ },
    tick(t, dt) { /* valgfri: animation pr. frame (ms) */ },
    dispose() { /* valgfri: ryd op (timere osv.); entiteterne fjernes af rammen */ },
  };
}
```

`onStep` kaldes kun med trin fra dit eget rum, også første gang rummet vises. Den skal kunne kaldes i vilkårlig rækkefølge (man kan springe mellem trin), så sæt hele scenens tilstand ud fra trin-id'et. Gem ikke tilstand, der forudsætter, at man kom fra trinnet før.

## ctx

| Navn | Hvad |
| --- | --- |
| `ctx.root` | `<a-entity>`, som alt i rummet skal ligge under |
| `ctx.room` | `{id, name, sub, area, color, parent, children, spawn}` |
| `ctx.steps`, `ctx.step(id)` | rummets trin / ét trin fra `manus.json` |
| `ctx.C` | farver: `core #c9d1ff`, `a #f2a541`, `b #4fd1c5`, `c #e8638c`, `ink`, `muted`, `night`, `panel`, `line` |
| `ctx.K` | alt fra `kit.js`: `mat`, `glow`, `flat`, `glass`, `spin`, `bob`, `pulse`, `sc`, `canvasTexture`, `applyTexture`, `labelTex`, `glowTex`, `wrap`, `roundRect` |
| `ctx.kit` | primitiver med `ctx.root` som standardforælder: `el`, `grp`, `box`, `cyl`, `sph`, `cone`, `plane`, `torus`, `link`, `mesh` (egen THREE-geometri), `textPlane` |
| `ctx.sign(text, {position, rotation, width, color, sub, bg, size, parent})` | overskriftsskilt (canvas-tekstur, æøå virker). `sub` = lille undertekst |
| `ctx.door(toRoomId, {position, rotation, label, glow, quiet})` | dør/portal til et andet rum med skilt. Rammen tegner den i målrummets farve og står for skiftet. `glow` (0–1) styrer rammens lys; `quiet: true` fjerner pulsen og gør portalen svag. Returnerer gruppen; `.portal` er portalfladen |
| `ctx.station(stepId, entity)` | gør `entity` til trinnets station: klik vælger trinnet, og rammen lægger en lysende ring på gulvet under den, når trinnet er aktivt |
| `ctx.view(stepId, {position:[x,y,z], lookAt:[x,y,z], pitch})` | hvor brugeren stilles og kigger hen i trinnet (y ignoreres for position; øjenhøjde er 1,6 m). Uden view bliver brugeren stående. `pitch`: grader op/ned (negativ = ned), eller `true` = sigt mod lookAt's højde. Uden pitch kigger man vandret. Pitch virker kun på skærm; i VR styrer hovedet selv |
| `ctx.rooms` | alle rum (`name`, `sub`, `color`, `area`) til skilte o.l.; kun til læsning |
| `ctx.visited`, `ctx.cameFrom` | Set med rum-id'er besøgt i sessionen (inkl. det nuværende) og id på rummet, man kom fra (`null` ved start) |
| `ctx.onClick(entity, fn)` | gør en entitet klikbar. Klikket stopper her og bobler ikke op til en omgivende station |
| `ctx.goStep(id)`, `ctx.goRoom(id)` | skift trin i rummet / gå til et andet rum (bruges sjældent; døre og stationer klarer det) |
| `ctx.env({background, fog})` | baggrundsfarve og evt. tåge (A-Frame fog-streng) for rummet |
| `ctx.THREE`, `ctx.AFRAME` | biblioteker |

## Regler for rummene

1. **Rummet**: gulv i y = 0. Brugeren starter i `[0, 0, 5]` og kigger mod −z. Indhold holdes inden for ca. 10 m fra origo. Lav et egentligt rum (gulv, vægge eller afgrænsning, loft eller himmel), så det føles som et sted, ikke en scene i tomrum.
2. **Døre**: hvert rum har en dør til sin forælder (`ctx.door(ctx.room.parent, …)`) og en dør til hvert barn i `ctx.room.children`. Forhallen har døre til de tre haller og til Udsigten. Dørene skal kunne ses fra spawn eller være tydeligt skiltede.
3. **Overskrifter som tekst**: rummets navn (og `sub`) på et skilt, når man kommer ind. Hver stations titel (trinnets `title`) på et skilt ved stationen. Ingen brødtekst i rummet; brødteksten vises af rammen.
4. **Stationer**: alle trin i rummet har en station via `ctx.station` og et `ctx.view`, så brugeren flyttes hen foran stationen. Intro-trinnet (fx `a1-0`) har typisk et overbliksview. Exit-trin (`exit: true`, fx `a0-2`: målene) har målpladen som station.
5. **Scener**: hvert trins "Scene:"-linje skal realiseres i `onStep` med geometri og animation, der viser begrebet. Det, der ikke hører til trinnet, dæmpes eller står stille, så det aktive er tydeligt.
6. **Ordbilleder (vigtigt)**: billeder skal vise begrebet, ikke ordet. Undgå disse fælder:

| Ord | Fælde | Vis i stedet |
| --- | --- | --- |
| Kortlægning | landkort, kortapp, pin på et kort | døgnurskive, liste, sorteringsbakker |
| Indramning | billedramme | et ark med fire felter |
| Afmaskere | masker, maskerade | lag der foldes ud, et låg der løftes |
| Modellering, model | modetøj, catwalk, modelfly | diagram, forenklet klodsmodel |
| Benspænd | ben, snublen | et kort med en regel |
| Digital dobbeltgænger | tvillinger, kloning | silhuet bygget op af data |
| Materielt grundlag | byggegrund, betonfundament | elektronik, kabler, datacenter |
| Fænomen | spøgelser, det overnaturlige | mennesker og teknik i samme situation |
| Kerne | æblekerne, atomkerne | neutral, lysende form |
| Stillingtagen | job, kropsstilling | vægt, samtalekreds |

   Brug heller ikke kendte logoer, varemærker eller app-ikoner (ingen rigtige apps, sociale medier eller mærker). Opfind neutrale symboler.
7. **Farver**: rummets områdefarve (`ctx.room.color`) er accent. Erkendeformerne har kernens lavendel (`C.core`), aldrig en områdefarve. Mørk "værksted om natten"-stemning som i version 1, men hvert rum med sin egen karakter og lyssætning.
8. **Ydelse (Quest)**: højst ca. 120.000 trekanter og 150 draw calls pr. rum. Brug lave segmenttal, genbrug materialer, og saml statisk geometri med `BufferGeometryUtils.mergeGeometries` (via `THREE`) eller `ctx.kit.mesh`, når der er mange ens dele. Højst 2 ekstra lyskilder pr. rum (rammen har hemisfære- og retningslys). Ingen skygger. Ingen eksterne filer (modeller, billeder, lyde): alt er procedural geometri og canvas-teksturer.
9. **Kode**: ES-modul, ingen afhængigheder ud over `ctx`. Danske kommentarer. Ingen `localStorage`. Ingen netværkskald.

## Test

Kør en webserver i `v2/` (`python3 -m http.server 8765`, kører måske allerede) og:

```
node tools/shot.mjs <rum-id>            # skærmbillede af hvert trin i rummet → tools/shots/<rum>/<trin>.png
node tools/shot.mjs <rum-id> b2-3       # kun ét trin
node tools/shot.mjs <rum-id> --wait 12000   # vent længere pr. trin (lange forløb)
```

Det skriver også fejl og trekanter/draw calls pr. trin. **Kig på billederne** (Read-værktøjet viser dem), og ret, indtil hvert trin ser rigtigt ud: stationen er i billedet, skiltene kan læses, intet overlapper eller står uden for rummet, og scenen viser trinnets pointe. Tjek også, at dørene fører de rigtige steder hen (labels). Konsolfejl om Google Fonts kan ignoreres.
