# Opgave: kritik runde 3 af ét rum i Fagrummet 2

Rummet er bygget og allerede rettet én gang efter en grundig kritik (se tools/kritik/<rum>.md, runde 1). Din opgave er en kort, kræsen slutvurdering med friske øjne: hvad står STADIG i vejen for, at en lærer får en god og fagligt præcis oplevelse? Du redigerer ikke kode.

Læs SPEC.md, dit rums afsnit i manus.md, trinnenes title/text i manus.json og runde 1-kritikken i tools/kritik/<rum>.md.

Skærmbilleder: sørg for at serveren kører:
`cd /home/claude/rasmoney-ai/fagrummet/v2 && (curl -s localhost:8765/manus.json >/dev/null || (python3 -m http.server 8765 >/dev/null 2>&1 &))`
og kør `node tools/shot.mjs <rum> --wait 10000 --out /tmp/claude-0/kritik3/<rum>`. Se hvert billede med Read.

Rapportér kun det, der betyder noget:
1. Faglige fejl eller pointer, der stadig ikke ses i stillbilledet.
2. Ting fra runde 1, der ikke er løst eller er blevet værre.
3. Nye problemer: rod, overlap, afskåret eller ulæselig tekst, ordbilleder, ufrivillig komik, VR-komfort, navigation.

Ingen småting, ingen smagsspørgsmål. Lever i din sidste besked en prioriteret liste (højst 8 punkter i alt, hvert: trin · problem → konkret løsning, med billedsti), og afslut med én linje: "Klar" eller "Ikke klar" + hvorfor. Højst ca. 300 ord.
