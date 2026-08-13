"use strict";

/* ============================================================
   THE VIBE ENGINE — pure functions, zero DOM. Testable in node.
   ============================================================ */

/* temperature bands (C) → main vibe quote */
const TEMP_BANDS = [
  { max: -10,   vibe: "Ice planet origin story. Bring a parka and your will to live", heat: "freezing" },
  { max: 0,     vibe: "Your face has left the chat. The wind is taking personal notes", heat: "cold" },
  { max: 8,     vibe: "Wear a big sweater and pretend you're in an indie movie", heat: "chilly" },
  { max: 15,    vibe: "Jacket weather, but make it existential. A scarf is a personality", heat: "crisp" },
  { max: 22,    vibe: "Chef's kiss weather. The universe apologizes for everything else", heat: "mild" },
  { max: 28,    vibe: "Slightly warm but still polite. The sun is being civil, for now", heat: "warm" },
  { max: 33,    vibe: "The sun has personal beef with you. It's winning", heat: "hot" },
  { max: 38,    vibe: "Stay inside because the air feels like soup", heat: "scorching" },
  { max: 999,   vibe: "The devil is doing his laundry. Pray for a breeze", heat: "soup" }
];

const WIND_BANDS = [
  { max: 4.9,   line: "The air is holding its breath" },
  { max: 19,    line: "The wind is doing that thing where it's not helping" },
  { max: 34,    line: "The wind has opinions and it's sharing them" },
  { max: 54,    line: "The wind has filed a complaint against the trees" },
  { max: 999,   line: "The wind is on a journey of self-discovery. You are collateral" }
];

const HUM_BANDS = [
  { max: 29,   line: "The air is a dry cracker. Moisturize, coward" },
  { max: 59,   line: "Humidity is minding its own business" },
  { max: 84,   line: "The air has joined a union and refuses to move" },
  { max: 999,  line: "You're not sweating. The air is just water in a trench coat" }
];

const PRECIP_BANDS = [
  { max: 0,    line: "The sky is sober" },
  { max: 1.9,  line: "The sky is crying politely" },
  { max: 9.9,  line: "The sky is going through it" },
  { max: 999,  line: "The sky has no filter today" }
];

/* WMO weather codes → condition category */
function condFor(code) {
  if (code === 0) return "clear";
  if (code <= 2) return "partly";
  if (code === 3) return "overcast";
  if (code === 45 || code === 48) return "fog";
  if (code >= 51 && code <= 57) return "drizzle";
  if (code >= 61 && code <= 67) return "rain";
  if (code >= 71 && code <= 77) return "snow";
  if (code >= 80 && code <= 82) return "showers";
  if (code >= 85 && code <= 86) return "snow";
  if (code >= 95) return "thunder";
  return "partly";
}

const SKY_LINES = {
  clear:   { day: "The sky is showing off", night: "The sky is showing off. In the dark. Show-off" },
  partly:  { day: "The sky can't decide. Valid", night: "The sky can't decide. The stars are judging it" },
  overcast: "The sky is wearing gray sweatpants",
  fog:     "The world has been put on mute",
  drizzle: "The sky is crying politely",
  rain:    "The sky is going through it",
  snow:    "The world is getting a soft reboot",
  showers: "The sky has no filter today",
  thunder: "The sky is throwing a tantrum and honestly it has every right"
};

const TAGGED = {
  clear:   "WHERE THE SKY SHOWS OFF",
  partly:  "WHERE THE SKY CAN'T DECIDE",
  overcast: "WHERE GRAY SWEATPANTS ARE FASHION",
  fog:     "WHERE THE WORLD IS ON MUTE",
  drizzle: "WHERE UMBRELLAS ARE LIES",
  rain:    "WHERE UMBRELLAS ARE LIES",
  showers: "WHERE UMBRELLAS ARE LIES",
  snow:    "WHERE THE WORLD SOFT-REBOOTS",
  thunder: "WHERE THE SKY THROWS TANTRUMS"
};

/* poster palettes + motifs, keyed by condition; heat extremes override */
const PALETTES = {
  clear:   { bg1: "#f2a65a", bg2: "#f7d794", ink: "#2b2118", accent: "#b5431f", motif: "sun" },
  partly:  { bg1: "#7fb3d5", bg2: "#cde3f0", ink: "#22333b", accent: "#e09f3e", motif: "suncloud" },
  overcast: { bg1: "#8d99ae", bg2: "#b8c0cc", ink: "#2b2d42", accent: "#5c6b73", motif: "cloud" },
  fog:     { bg1: "#d9d9d2", bg2: "#f2f0e9", ink: "#3a3a38", accent: "#8a8a80", motif: "fog" },
  drizzle: { bg1: "#5c7a99", bg2: "#9db8d9", ink: "#eef3f8", accent: "#2b3a55", motif: "rain" },
  rain:    { bg1: "#3d5a80", bg2: "#7ba3c9", ink: "#eef3f8", accent: "#1f2d44", motif: "rain" },
  showers: { bg1: "#4a6fa5", bg2: "#8db1d6", ink: "#eef3f8", accent: "#2b3a55", motif: "rain" },
  snow:    { bg1: "#a8c6d8", bg2: "#e3eef5", ink: "#33414d", accent: "#5d8aa8", motif: "snow" },
  thunder: { bg1: "#2b2d42", bg2: "#4a4e69", ink: "#f4f1de", accent: "#e07a5f", motif: "bolt" },
  hot:     { bg1: "#c96f4a", bg2: "#e8a87c", ink: "#2f1b12", accent: "#9c3d1e", motif: "sun" },
  freezing:{ bg1: "#8fb4cc", bg2: "#d4e4f0", ink: "#22303c", accent: "#5d8aa8", motif: "snow" }
};

function bandFor(value, bands) {
  for (const b of bands) if (value <= b.max) return b;
  return bands[bands.length - 1];
}

/* heat bands → coarse clusters for the headline matrix */
const HEAT_CLUSTERS = {
  freezing: "cold", cold: "cold", chilly: "cold",
  crisp: "crisp", mild: "mild", warm: "warm",
  hot: "hot", scorching: "hot", soup: "hot"
};

/* headline matrix: condition × heat-cluster → headline variants.
   Two people in the same city can get different (equally true) headlines. */
const HEADLINE_MATRIX = {
  "cold:clear": ["Freezing clear sky. Beautiful and actively hostile", "The sky is gorgeous and the wind is a traitor"],
  "cold:partly": ["Cold and the sky is hedging its bets. Bring everything", "Frozen clouds. The sky is rationing its sunshine"],
  "cold:overcast": ["Cold gray. The sky is a blanket that forgot to be warm"],
  "cold:fog": ["Cold fog. The world is a secret now", "Frozen fog. Everything is a silhouette and none of it is friendly"],
  "cold:drizzle": ["Cold drizzle. The sky is being passive-aggressive"],
  "cold:rain": ["Cold rain. The sky is crying and you can't even warm it up"],
  "cold:showers": ["Cold showers from above. The sky is a gym teacher"],
  "cold:snow": ["Snow! The world is rebooting and it's beautiful and freezing", "Fresh snow and a frozen nose. Peak winter cinema"],
  "cold:thunder": ["Cold thunder. The sky is angry and shivering about it"],

  "crisp:clear": ["Crisp and clear. The sky is showing off its best work", "Golden-hour weather. The sun is doing its portfolio review"],
  "crisp:partly": ["Crisp with clouds. Autumnal energy, statistically speaking"],
  "crisp:overcast": ["Crisp gray. Sweater weather, arguably, definitely"],
  "crisp:fog": ["Crisp fog. Mysterious and slightly damp", "Morning fog, coffee weather. The sky is being atmospheric on purpose"],
  "crisp:drizzle": ["Crisp drizzle. The sky is testing the water, literally"],
  "crisp:rain": ["Crisp rain. The sky is going through it, gently"],
  "crisp:showers": ["Crisp showers. Brief drama, acceptable"],
  "crisp:snow": ["Crisp snow flurries. The sky is sprinkling powdered sugar"],
  "crisp:thunder": ["Crisp thunder. Drama with good production value"],

  "mild:clear": ["Mild and clear. The universe apologizes for everything else", "Perfect weather. Suspiciously perfect. The universe is buttering you up"],
  "mild:partly": ["Mild with clouds. The sky can't decide and it doesn't matter, it's perfect anyway"],
  "mild:overcast": ["Mild gray. Cozy, like the sky is wearing your hoodie"],
  "mild:fog": ["Mild fog. The world is on mute but in a nice way"],
  "mild:drizzle": ["Mild drizzle. The sky is crying politely"],
  "mild:rain": ["Mild rain. The sky is going through it, but classy about it"],
  "mild:showers": ["Mild showers. The sky has opinions but they're reasonable"],
  "mild:snow": ["Mild snow. Unusual. The sky is trying something new"],
  "mild:thunder": ["Mild thunder. The sky is throwing a tantrum with good posture"],

  "warm:clear": ["Warm and clear. The sun is being suspiciously polite", "Golden hour all afternoon. The sun is showing off and honestly? Fair"],
  "warm:partly": ["Warm with clouds. Half sun, half shade, fully pleasant, suspicious", "The sky is playing peekaboo with the sun. It's winning"],
  "warm:overcast": ["Warm and gray. The sky is wearing a sweater in the heat. Bold"],
  "warm:fog": ["Warm fog. The air has joined a spa retreat"],
  "warm:drizzle": ["Warm drizzle. The sky is sweating on you"],
  "warm:rain": ["Warm rain. The sky is going through it and taking you with it"],
  "warm:showers": ["Warm showers. The sky has no filter today and it's steamy"],
  "warm:snow": ["Warm snow?? The sky is glitching"],
  "warm:thunder": ["Warm thunder. The sky is dramatic and humid about it"],

  "hot:clear": ["Hot and clear. The sun has personal beef with you and it's winning", "The air is soup with a garnish of sunburn", "The sun is taking this personally now"],
  "hot:partly": ["Hot with clouds. The clouds are trying to help. They are failing"],
  "hot:overcast": ["Hot and gray. The sky is a greenhouse and you're the plant"],
  "hot:fog": ["Hot fog. The air is soup and it's also invisible. Rude"],
  "hot:drizzle": ["Hot drizzle. Steamy. The sky is a sauna ceiling"],
  "hot:rain": ["Hot rain. The sky is crying and the tears are warm. Unforgivable"],
  "hot:showers": ["Hot showers from the sky. The sky is a broken boiler"],
  "hot:snow": ["Hot snow?? The sky has lost the plot"],
  "hot:thunder": ["Hot thunder. The sky is throwing a tantrum in a sauna"]
};

function pickOne(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

/* weather: { temp, feels, humidity, wind, code, precip, is_day } */
function vibeFor(w) {
  const t = bandFor(w.temp, TEMP_BANDS);
  const wind = bandFor(w.wind, WIND_BANDS);
  const hum = bandFor(w.humidity, HUM_BANDS);
  const prec = bandFor(w.precip, PRECIP_BANDS);
  const cond = condFor(w.code);

  const palette = PALETTES[t.heat === "hot" || t.heat === "scorching" || t.heat === "soup" ? "hot"
                 : t.heat === "freezing" || t.heat === "cold" ? "freezing" : cond];

  const skyLine = typeof SKY_LINES[cond] === "string" ? SKY_LINES[cond]
                : SKY_LINES[cond][w.is_day ? "day" : "night"];

  const tagline = (t.heat === "hot" || t.heat === "scorching" || t.heat === "soup") ? "WHERE THE AIR IS SOUP"
                : (t.heat === "freezing" || t.heat === "cold" || t.heat === "chilly") ? "WHERE SWEATERS ARE MANDATORY"
                : TAGGED[cond];

  /* headline: matrix combo with a random variant, falling back to the temp-band line */
  const variants = HEADLINE_MATRIX[HEAT_CLUSTERS[t.heat] + ":" + cond];
  const headline = variants ? pickOne(variants) : t.vibe;

  return {
    palette: palette,
    cond: cond,
    heat: t.heat,
    quote: t.vibe,
    headline: headline,
    tagline: tagline,
    sky: skyLine,
    wind: wind.line,
    humidity: hum.line,
    precip: prec.line,
    nerds: "Actual: " + w.temp + "\u00b0C · Feels like: " + w.feels + "\u00b0C · For the nerds"
  };
}

/* city chips: the 5 most populous metro areas on Earth (UN estimates) */
const QUICK_CITIES = [
  { name: "Tokyo",      lat: 35.68, lon: 139.69 },
  { name: "Delhi",      lat: 28.61, lon: 77.21 },
  { name: "Shanghai",   lat: 31.23, lon: 121.47 },
  { name: "Dhaka",      lat: 23.81, lon: 90.41 },
  { name: "São Paulo",  lat: -23.55, lon: -46.63 }
];

if (typeof module !== "undefined") module.exports = { vibeFor, bandFor, condFor, QUICK_CITIES, HEADLINE_MATRIX, HEAT_CLUSTERS };
