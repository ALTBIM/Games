export const MAX_DAY = 60;

export const roleDefs = [
  { id: "BIM", name: "BIM-koordinator", note: "+1 tillit ved BCF/ICE valg." },
  { id: "ARK", name: "ARK", note: "+1 fremdrift ved endring, -1 tillit ved ignorering." },
  { id: "RIB", name: "RIB", note: "Lukker 1 ekstra clash ved teknisk korrigering." },
  { id: "RIV", name: "RIV", note: "Reduserer kaos med 1 ved koordinering." },
  { id: "RIE", name: "RIE", note: "BOB AI er 1 MNOK billigere." },
  { id: "ENT", name: "Entreprenoer", note: "+1 fremdrift ved dagsslutt, +1 kaos hvis clashes > 20." }
];

export const events = [
  {
    title: "RIV flytter ventilasjon 300mm ned",
    body: "Treffer himling og bjelke.",
    team: "RIV + RIB",
    options: [
      { label: "Godkjenn raskt", effect: s => { s.progress += 4; s.clashes += 4; s.chaos += 5; s.delayed.push({ inDays: 2, budget: -8, trust: -5, text: "Byggeplass maatte bygge om ventilasjon." }); } },
      { label: "Send BCF til RIB", effect: s => { s.bcf += 2; s.clashes = Math.max(0, s.clashes - 2); s.progress += 1; s.budget -= 2; s.trust += 2; } },
      { label: "Ignorer", effect: s => { s.progress += 2; s.chaos += 8; s.delayed.push({ inDays: 1, budget: -12, trust: -8, clashes: +5, text: "Krise: kanal kolliderte med baerestaal." }); } }
    ]
  },
  {
    title: "ARK endret planlosning",
    body: "Nye clashes i etasje over.",
    team: "ARK + alle fag",
    options: [
      { label: "Rekoordiner etasjen", effect: s => { s.clashes += 3; s.progress -= 2; s.budget -= 6; s.trust += 5; s.bcf += 4; } },
      { label: "Lapp lokalt", effect: s => { s.clashes += 8; s.progress += 2; s.budget -= 3; s.chaos += 4; } },
      { label: "Skyld pa IFC-eksport", effect: s => { s.trust -= 6; s.chaos += 7; s.delayed.push({ inDays: 2, budget: -9, clashes: +6, text: "Byggherre oppdaget feil i romprogrammet." }); } }
    ]
  },
  {
    title: "Manglende brannklassifisering",
    body: "Property set er tom.",
    team: "ARK + BIM",
    options: [
      { label: "Manuell tagging", effect: s => { s.budget -= 5; s.progress += 1; s.trust += 5; s.chaos = Math.max(0, s.chaos - 2); } },
      { label: "La entreprenoer gjette", effect: s => { s.progress += 2; s.trust -= 10; s.chaos += 8; s.delayed.push({ inDays: 1, budget: -7, clashes: +4, text: "Feil brannprodukt bestilt til sjakt." }); } },
      { label: "Kjor BOB AI", effect: s => { s.aiCost += 4; s.budget -= 3; s.trust += 3; s.clashes = Math.max(0, s.clashes - 2); } }
    ]
  },
  {
    title: "Feil hoyde pa dekke",
    body: "RIE kabelbro mister plass.",
    team: "RIB + RIE",
    options: [
      { label: "Stopp og korriger", effect: s => { s.progress -= 3; s.budget -= 5; s.trust += 4; s.clashes = Math.max(0, s.clashes - 4); } },
      { label: "Skjult avvik", effect: s => { s.progress += 4; s.chaos += 7; s.delayed.push({ inDays: 2, budget: -14, trust: -9, text: "Kabelbro maatte bygges om." }); } },
      { label: "Send BCF til RIB/RIE", effect: s => { s.bcf += 3; s.budget -= 2; s.clashes = Math.max(0, s.clashes - 3); s.progress += 1; } }
    ]
  }
];

export const achDefs = [
  { key: "architectRevenge", label: "Arkitektens hevn", check: s => s.maxClashSpike >= 18 },
  { key: "plumberNightmare", label: "Roerleggerens mareritt", check: s => s.pipeHits >= 50 },
  { key: "pdfHell", label: "PDF-helvete", check: s => s.ifcMissingDays >= 3 },
  { key: "bcfSpam", label: "BCF-spam", check: s => s.bcf >= 200 }
];
