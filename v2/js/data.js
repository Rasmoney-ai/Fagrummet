/* Rum, farver og rute. Manus (tekster) ligger i manus.json, som er trukket ud af dokumentet "Fagrummet 2 — manus og rumplan". */

export const C = {
  core: "#c9d1ff",   // kernen / forhallen / udsigten (lavendel)
  a: "#f2a541",      // Digital kreativitet og design (ravgul)
  b: "#4fd1c5",      // Programmering og modellering (turkis)
  c: "#e8638c",      // Undersøgelse og stillingtagen (rosa)
  ink: "#eef1ff", muted: "#a9b0d6", night: "#0b0f1e", panel: "#141a30", line: "#2a3358",
};

// spawn = [x, z, yaw i grader]; man står der og kigger mod -z ved yaw 0.
export const ROOMS = {
  "forhal": { name: "Forhallen", sub: "Formål og karakter", area: "core", parent: null, children: ["hal-a", "hal-b", "hal-c", "udsigt"], spawn: [0, 5, 0] },
  "hal-a":  { name: "Atelieret", sub: "Digital kreativitet og design", area: "a", parent: "forhal", children: ["a1", "a2"], spawn: [0, 5, 0] },
  "a1":     { name: "Værkstedet", sub: "Kreative processer", area: "a", parent: "hal-a", children: [], spawn: [0, 5, 0] },
  "a2":     { name: "Metodelaboratoriet", sub: "Kreative metoder", area: "a", parent: "hal-a", children: [], spawn: [0, 5, 0] },
  "hal-b":  { name: "Tårnets fod", sub: "Programmering og modellering", area: "b", parent: "forhal", children: ["b1", "b2", "b3"], spawn: [0, 5, 0] },
  "b1":     { name: "Kabelrummet", sub: "Materielt grundlag", area: "b", parent: "hal-b", children: [], spawn: [0, 5, 0] },
  "b2":     { name: "Maskinrummet", sub: "Programmering og computerforståelse", area: "b", parent: "hal-b", children: [], spawn: [0, 5, 0] },
  "b3":     { name: "Tegnestuen", sub: "Modellering", area: "b", parent: "hal-b", children: [], spawn: [0, 5, 0] },
  "hal-c":  { name: "Gaden", sub: "Undersøgelse og stillingtagen", area: "c", parent: "forhal", children: ["c1", "c2", "c3"], spawn: [0, 5, 0] },
  "c1":     { name: "Stuen", sub: "Menneskers brug og brugskontekst", area: "c", parent: "hal-c", children: [], spawn: [0, 5, 0] },
  "c2":     { name: "Bag skærmen", sub: "Teknologiens rolle og intention", area: "c", parent: "hal-c", children: [], spawn: [0, 5, 0] },
  "c3":     { name: "Forsamlingssalen", sub: "Stillingtagen", area: "c", parent: "hal-c", children: [], spawn: [0, 5, 0] },
  "udsigt": { name: "Udsigten", sub: "Sammenhæng og det åbne", area: "core", parent: "forhal", children: [], spawn: [0, 5, 0] },
};
for (const [id, r] of Object.entries(ROOMS)) { r.id = id; r.color = C[r.area]; }

export const AREA_NAME = { core: "Kernen", a: "Digital kreativitet og design", b: "Programmering og modellering", c: "Undersøgelse og stillingtagen" };

/* Den anbefalede rute: forhallen, så hvert område (hallens intro, delrummene, hallens mål på vej ud), til sidst udsigten. */
export function buildRoute(steps) {
  const byRoom = r => steps.filter(s => s.room === r);
  const route = [...byRoom("forhal")];
  for (const hal of ["hal-a", "hal-b", "hal-c"]) {
    const h = byRoom(hal);
    route.push(...h.filter(s => !s.exit));
    for (const ch of ROOMS[hal].children) route.push(...byRoom(ch));
    route.push(...h.filter(s => s.exit));
  }
  route.push(...byRoom("udsigt"));
  return route;
}
