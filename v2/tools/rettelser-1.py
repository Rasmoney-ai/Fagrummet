# Rettelser efter den faglige gennemgang (runde 1). Kør: python3 tools/rettelser-1.py
# Skriver manus.json om og gemmer listen over (gammel, ny) i tools/rettelser-1.json til dokumentet.
import json, re, sys
P = [
 ("f1", "Teknologiforståelse bliver et toårigt praktisk-musisk valgfag i 7.-8. eller 8.-9. klasse fra skoleåret 2027/28.",
        "Teknologiforståelse bliver et nyt praktisk-musisk valgfag, der løber over to år, i syvende og ottende eller i ottende og niende klasse. Fagplanen træder i kraft i skoleåret, der begynder i sommeren 2027."),
 ("f2", "Fagplanen siger, at faget skal fremme elevernes praktiske kundskaber og give dem forudsætninger for at agere myndigt og engageret over for de digitale teknologier, de møder i verden.",
        "Fagplanen siger, at faget skal fremme elevernes praktiske kundskaber. Det skal give dem forudsætninger for at agere myndigt og engageret over for de digitale teknologier, de møder i verden."),
 ("f2", "Målet er deltagelse i og medansvar for et frit og demokratisk samfund med digitale teknologier.",
        "Faget forbereder dermed eleverne til deltagelse i og medansvar for et frit og demokratisk samfund med digitale teknologier."),
 ("f3", "fra natur-, samfunds- og humanvidenskaberne", "fra naturvidenskab, samfundsvidenskab og humanvidenskab"),
 ("f3", "Det betyder, at en elev kan lodde en sensor, diskutere privatliv og skitsere et design i samme forløb",
        "Et eksempel kunne være, at en elev lodder en sensor, diskuterer privatliv og skitserer et design i samme forløb"),
 ("f4", "og de muligheder kan bruges kreativt.", "og de muligheder kan bruges kreativt og konstruktivt."),
 ("f4", "Det er de fire facetter, du ser åbne sig i kernen.", "Det er de fire facetter, du ser åbne sig i kernen, og tilsammen skaber de både muligheder og udfordringer."),
 ("f6", "der indlejrer og forstærker menneskelige perspektiver", "der former, indlejrer og forstærker menneskelige perspektiver"),
 ("a0-1", "Mikkel Hjorth fra fagudvalget peger på en vigtig konsekvens for læreren: man skal kunne afgive kontrol over, hvad eleverne ender med at lave. Området har to dele. Til venstre ligger processerne, og til højre ligger metoderne.",
          "Mikkel Hjorth, der sidder i fagudvalget, peger på, at læreren derfor må kunne give slip på kontrollen med, hvad eleverne ender med at lave. Området har to dele med hver sin dør: Værkstedet for processerne og Metodelaboratoriet for metoderne."),
 ("a0-2", "Læg mærke til, at målet ikke handler om et færdigt produkt. Det handler om arbejdet frem mod produktet, og om at eleven kan begrunde sine valg.",
          "Læg mærke til, at målet lægger vægt på arbejdet frem mod produktet, og på at eleven kan begrunde sine valg."),
 ("a1-0", "Fagplanen beskriver et spænd. I den ene ende står design, hvor eleverne skaber noget for at udfylde et behov eller løse et problem. I den anden ende står mere åbne tilgange, hvor de udforsker, eksperimenterer eller provokerer. Begge ender giver to ting: eleverne lærer selv at skabe artefakter eller påvirke fænomener, og de får øje for de designvalg, andre har truffet i de teknologier, de bruger hver dag.",
          "Fagplanen nævner to slags processer. Den ene er design, hvor eleverne skaber noget for at udfylde et behov eller løse et problem. Den anden er mere åbne tilgange, hvor de udforsker, eksperimenterer eller provokerer. Begge giver to ting. Eleverne lærer selv at skabe artefakter eller påvirke fænomener. Og de får øje for de designvalg, andre har truffet i eksisterende teknologier."),
 ("a1-1", "Det centrale er, at nogen andre end eleven selv har brug for løsningen.", "Det centrale er, at artefaktet skal udfylde et virkeligt behov, og at eleverne tager udgangspunkt i dem, der skal bruge det."),
 ("a1-1", "om der er plads i makerspacet", "om der er plads i skolens værksted"),
 ("a1-2", "til en lokal forening og præsenterer den for foreningen.", "til en lokal forening eller virksomhed og præsenterer den for dem."),
 ("a1-3", "Hjorth kalder det tinkering: man finder ud af, hvad materialet kan, ved at lege med det. Hvad sker der, når ledende tråd bliver syet ind i stof? Hvor langt kan en sensor mærke?",
          "Man finder ud af, hvad materialet kan, ved at lege og eksperimentere med det. Et eksempel kunne være at undersøge, hvad der sker, når ledende tråd bliver syet ind i stof, eller hvor langt en sensor kan mærke."),
 ("a1-4", "Det er den åbne ende af spændet, hvor digital kunst og kritisk eller spekulativt design hører hjemme. Produktet skal ikke løse et problem. Det skal få beskueren til at tænke.",
          "Det ligger tæt på de mere åbne tilgange, hvor for eksempel digital kunst og kritisk eller spekulativt design hører hjemme. Produktet behøver ikke løse et problem, men det skal vise noget om teknologien og få beskueren til at tænke."),
 ("a2-0", "indramning, afprøvning, kreativitetsmetoder og digitale benspænd", "indramning, afprøvninger, metoder til kreativitet og digitale benspænd"),
 ("a2-1", "Eleverne afklarer, hvilken kontekst artefaktet skal virke i, hvilke intentioner og grundantagelser de arbejder ud fra, hvilke ressourcer de har, og hvordan de vil gribe processen an.",
          "Eleverne afklarer, hvilken kontekst artefaktet skal virke i, og hvilke intentioner og grundantagelser de arbejder ud fra. De afklarer også, hvilke ressourcer de har, og hvordan de vil gribe processen an."),
 ("a2-2", "hvor erfaringer fra den forrige iteration bestemmer næste skridt.", "hvor erfaringer fra den forrige iteration informerer næste skridt og kan føre til justeringer."),
 ("a2-2", "En gruppe kan fx opdage, at brugerne ville noget helt andet end det, gruppen troede.", "Et eksempel kunne være, at en gruppe opdager, at brugerne ville noget helt andet end det, gruppen troede."),
 ("a2-3", "fx spekulation og kreative benspænd, der åbner for nye løsninger og udtryk. Spekulation er at spørge \"hvad nu hvis?\" og forestille sig en anden fremtid.",
          "for eksempel spekulation og kreative benspænd, der åbner for nye og alternative løsninger og udtryk. Spekulation er at spørge: hvad nu hvis, og så forestille sig en anden fremtid."),
 ("a2-3", "Hjorth bruger Amabiles definition af kreativitet:", "Mikkel Hjorth bruger forskeren Teresa Amabiles definition af kreativitet:"),
 ("a2-4", "Fagplanen nævner især", "Fagplanen nævner blandt andet"),
 ("a2-4", "Klik på terningen og se den skifte tilstand.", "Peg på terningen, og se den skifte tilstand."),
 ("b0-1", "Lagene bygger videre på hinanden, men de skal ikke læres i en bestemt rækkefølge. De spiller sammen i det praktiske arbejde. Hjorth minder om, at det tager tid for både lærere og elever at blive trygge ved programmerbar elektronik.",
          "Fagplanen siger, at lagene bygger videre på hinanden og fungerer i samspil i det praktiske arbejde. Mikkel Hjorth peger på, at det tager tid at blive fortrolig med programmerbar elektronik."),
 ("b0-2", "I kælderen bliver data målt og gemt. I maskinrummet bliver data behandlet af algoritmer. I tegnestuen bliver det besluttet, hvad der overhovedet skal være data.",
          "På det nederste lag bliver data målt og gemt. I midten bliver de behandlet af algoritmer. Øverst bliver det besluttet, hvad der overhovedet skal være data."),
 ("b0-3", "Det første er, at eleverne bruger programmering som sprog og værktøj til at skabe digitale artefakter, og at de bruger programmeringsbegreber, når de afprøver løsninger og diskuterer fejl og tilpasninger.",
          "Det første er, at eleverne bruger programmering som sprog og værktøj til at skabe digitale artefakter. De bruger programmeringsbegreber, når de afprøver løsninger og diskuterer fejl og tilpasninger."),
 ("b0-3", "Det første mål hører til de to nederste lag. Det andet hører til det øverste.", "Det første mål ligger tættest på programmeringen, og det andet ligger tættest på modelleringen."),
 ("b1-0", "Fagplanen siger, at eleverne især arbejder med den elektronik, der ligger bag digitale teknologier, og at de selv prøver at indsamle, opbevare og behandle data om verden. \"Systemisk\" betyder",
          "Fagplanen siger, at eleverne især arbejder med den elektronik, der ligger bag digitale teknologier. De prøver også selv at indsamle, opbevare og behandle data om verden. Systemisk betyder"),
 ("b1-1", "Det kan være en lille mikrocontroller som en micro:bit eller en ESP32, som eleverne programmerer og ser reagere.", "Et eksempel kunne være en lille mikrocontroller, som eleverne programmerer og ser reagere."),
 ("b1-1", "Udforskningen kommer før opskriften.", "Fagplanen lægger vægt på at afprøve og udforske."),
 ("b1-2", "fx lys, varme eller bevægelse", "for eksempel lys, varme eller bevægelse"),
 ("b1-3", "på et kort i enheden", "på et hukommelseskort i enheden"),
 ("b2-0", "der bestemmer, hvordan teknologien virker", "der betinger, hvordan teknologien virker"),
 ("b2-0", "Laget har fem punkter, og de har lige stor vægt.", "Laget har fem punkter."),
 ("b2-1", "altså \"gør det her ti gange\" og \"hvis det regner, så …\".", "altså at gøre noget ti gange, eller at gøre noget, hvis det regner."),
 ("b2-2", "Man kan programmere uden computer: en elev skriver en præcis instruks, og en anden udfører den ord for ord.",
          "Man kan programmere uden computer. Et eksempel kunne være, at en elev skriver en præcis instruks, og en anden udfører den ord for ord."),
 ("b2-3", "Fagplanen vælger ikke sproget. Det gør læreren. Det kan være blokke eller tekst.", "Fagplanen siger ikke, hvilket sprog det skal være. Det kan være blokke eller tekst."),
 ("b2-4", "En syntaksfejl er en forkert stavet kommando, som maskinen nægter at køre.", "En syntaksfejl er en fejl i den måde, koden er skrevet på, for eksempel en forkert stavet kommando, så maskinen ikke kan køre den."),
 ("b2-5", "beder en chatbot om et program", "beder en chatbot, som skolen har godkendt, om et program"),
 ("b3-0", "Sammenlign køen udenfor med modellen på bordet.", "Sammenlign køen under vinduet med modellen på bordet."),
 ("b3-1", "modelleringsværktøjer og -tilgange", "modelleringsværktøjer og modelleringstilgange"),
 ("b3-2", "I programmet er det ofte en sand eller falsk-værdi: ven eller ikke ven.", "I programmet er det ofte bare ja eller nej: ven eller ikke ven."),
 ("b3-3", "Et eksempel kunne være, at to grupper hver modellerer \"en god makker til gruppearbejde\" til en app.", "Et eksempel kunne være, at to grupper hver laver en model af en god makker til gruppearbejde i en app."),
 ("b3-3", "prøvet af på klassens egne erfaringer", "prøvet af på opdigtede elevprofiler"),
 ("c0-1", "fx at få anbefalet videoer", "for eksempel at få anbefalet videoer"),
 ("c0-1", "Eleverne tager primært udgangspunkt i deres eget hverdagsliv, også fænomener med kunstig intelligens. De møder også fænomener uden for deres egen erfaringshorisont.",
          "Eleverne arbejder primært med fænomener fra deres eget hverdagsliv, også fænomener, hvor kunstig intelligens indgår. De møder også fænomener uden for deres egen erfaringshorisont, som har betydning for andre mennesker eller verden."),
 ("c1-1", "noterer hver gang, en teknologi er med", "noterer, hver gang en digital teknologi er med"),
 ("c1-1", "hvor meget af hverdagen der går gennem en skærm", "hvor meget af hverdagen der går gennem digitale teknologier"),
 ("c2-0", "Hjorth henviser til en analyse af teknologiers interaktion, anvendelse, formål, begrundelse og konsekvens som en måde at strukturere undersøgelsen på.",
          "Mikkel Hjorth foreslår at strukturere undersøgelsen ved at spørge til teknologiens interaktion, anvendelse, formål, begrundelse og konsekvens."),
 ("c2-2", "Et eksempel kunne være at oprette to nye profiler med forskellig adfærd og sammenligne, hvad de får vist efter en uge.",
          "Et eksempel kunne være, at to grupper bruger den samme videotjeneste på hver sin nye skolekonto med forskellig adfærd og sammenligner, hvad de får vist efter en uge."),
 ("c2-3", "En digital dobbeltgænger er den model af dig, som en tjeneste bygger ud fra dine data og bruger til at forudsige, hvad du vil gøre.",
          "En digital dobbeltgænger kan være den model af dig, som en tjeneste bygger ud fra dine data. Tjenesten bruger den til at forudsige, hvad du vil gøre."),
 ("c2-4", "Et eksempel kunne være at sammenligne et feed, der sorteres efter tid, med et, der sorteres af en algoritme, eller en tjeneste, der lever af reklamer, med en, der ikke gør.",
          "Et eksempel kunne være at sammenligne et feed, der sorteres efter tid, med et, der sorteres af en algoritme. Eller at sammenligne en tjeneste, der lever af reklamer, med en, der ikke gør."),
 ("c3-1", "Debatterne skifter, men lige nu kunne det fx være aldersgrænser på sociale medier, kunstig intelligens i skolen eller mobilfri skoletid. Eleverne skal kunne se, hvordan deres egne undersøgelser kan bruges som argumenter i debatten, og de skal kunne gengive positioner, de ikke selv deler.",
          "Debatterne skifter. Et eksempel kunne være debatten om aldersgrænser på sociale medier eller om kunstig intelligens i skolen. Eleverne kan bruge deres egne undersøgelser som argumenter og øve sig i at forstå positioner, de ikke selv deler."),
 ("c3-2", "fx håbet i 1990'erne om", "for eksempel håbet i halvfemserne om"),
 ("c3-2", "Det giver afstand til nutiden og passer til erkendeformen om at forestille sig alternativer.", "Det giver afstand til nutiden og hjælper eleverne til at forestille sig alternativer."),
 ("c3-3", "Et eksempel kunne være en filosofisk samtale, hvor eleverne tager udgangspunkt i et fænomen, de selv har undersøgt, og bruger det til at teste deres egne principper.",
          "Et eksempel kunne være en filosofisk samtale om et fænomen, eleverne selv har undersøgt. De bruger det til at teste deres egne principper."),
 ("s1", "I Atelieret er teknologien noget, mennesker skaber. I Tårnet er den et materielt grundlag, der indlejrer perspektiver. På Gaden er den et fænomen, hvor mennesker og teknik spiller sammen.",
        "I Atelieret, digital kreativitet og design, er teknologien noget, mennesker skaber. I Tårnet, programmering og modellering, er den et materielt grundlag, der indlejrer perspektiver. På Gaden, undersøgelse og stillingtagen, er den et fænomen, hvor mennesker og teknik spiller sammen."),
 ("s3", "at skabe, at omskabe og at forestille sig noget andet", "at skabe, at omskabe eller modvirke og at forestille sig alternativer"),
 ("s4", "træder i kraft i skoleåret 2027/28. Prøven i valgfaget bliver udviklet af en arbejdsgruppe og ventes holdt første gang i 2028/29.",
        "træder i kraft i skoleåret, der begynder i 2027. Prøven i valgfaget bliver udviklet af en arbejdsgruppe, og ifølge fagudvalget ventes den holdt første gang året efter."),
]
TITLES = [("b2-5", "Generativ AI som programmeringsværktøj", "Generativ kunstig intelligens som værktøj")]

M = json.load(open("manus.json"))
by = {s["id"]: s for s in M}
missing = []
for sid, old, new in P:
    t = by[sid]["text"]
    if t.count(old) != 1: missing.append((sid, old[:60])); continue
    by[sid]["text"] = t.replace(old, new)
for sid, old, new in TITLES:
    if by[sid]["title"] != old: missing.append((sid, "TITEL " + old)); continue
    by[sid]["title"] = new
if missing:
    print("IKKE FUNDET:"); [print(" ", m) for m in missing]; sys.exit(1)
left = [(s["id"], m.group(0)) for s in M for m in re.finditer(r".{0,25}\bfx\b.{0,25}", s["text"], re.I)]
print("fx tilbage:", left)
json.dump(M, open("manus.json", "w"), ensure_ascii=False, indent=1)
json.dump([[o, n] for _, o, n in P] + [[o, n] for _, o, n in TITLES], open("tools/rettelser-1.json", "w"), ensure_ascii=False)
print(len(P), "rettelser +", len(TITLES), "titel. Tegn nu:", sum(len(s["title"]) + 2 + len(s["text"]) for s in M))
