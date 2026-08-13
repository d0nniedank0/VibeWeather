"use strict";

/* ============================================================
   UI LAYER
   ============================================================ */

(function () {
  if (typeof document === "undefined") return; /* node-safe */

  const MOTIFS = {
    sun: '<svg viewBox="0 0 120 120" fill="none"><circle cx="60" cy="60" r="26" fill="#ffd166"/><g stroke="#ffd166" stroke-width="7" stroke-linecap="round">' +
         '<line x1="60" y1="8" x2="60" y2="22"/><line x1="60" y1="98" x2="60" y2="112"/><line x1="8" y1="60" x2="22" y2="60"/><line x1="98" y1="60" x2="112" y2="60"/>' +
         '<line x1="23" y1="23" x2="33" y2="33"/><line x1="87" y1="87" x2="97" y2="97"/><line x1="23" y1="97" x2="33" y2="87"/><line x1="87" y1="33" x2="97" y2="23"/></g></svg>',
    moon: '<svg viewBox="0 0 120 120" fill="none"><path d="M78 18a44 44 0 1 0 24 62 36 36 0 0 1-24-62z" fill="#ffd166"/><g fill="#ffd166"><circle cx="24" cy="26" r="2.5"/><circle cx="96" cy="40" r="2"/><circle cx="88" cy="92" r="2.5"/><circle cx="40" cy="102" r="2"/></g></svg>',
    suncloud: '<svg viewBox="0 0 120 120" fill="none"><circle cx="40" cy="42" r="20" fill="#ffd166"/><g stroke="#ffd166" stroke-width="5" stroke-linecap="round"><line x1="40" y1="10" x2="40" y2="18"/><line x1="15" y1="35" x2="21" y2="39"/><line x1="59" y1="35" x2="65" y2="39"/></g><path d="M30 84h56a14 14 0 0 0 0-28 20 20 0 0 0-38-6 16 16 0 0 0-18 6 13 13 0 0 0 0 28z" fill="#ffffff" opacity="0.92"/></svg>',
    cloud: '<svg viewBox="0 0 120 120" fill="none"><path d="M30 86h60a16 16 0 0 0 0-32 22 22 0 0 0-42-7 18 18 0 0 0-18 7 15 15 0 0 0 0 32z" fill="#ffffff" opacity="0.92"/></svg>',
    fog: '<svg viewBox="0 0 120 120" fill="none"><g stroke="#ffffff" stroke-width="10" stroke-linecap="round" opacity="0.9"><line x1="16" y1="40" x2="104" y2="40"/><line x1="30" y1="60" x2="90" y2="60"/><line x1="16" y1="80" x2="104" y2="80"/></g></svg>',
    rain: '<svg viewBox="0 0 120 120" fill="none"><path d="M30 62h56a14 14 0 0 0 0-28 20 20 0 0 0-38-6 16 16 0 0 0-18 6 12 12 0 0 0 0 28z" fill="#ffffff" opacity="0.9"/><g stroke="#a8c8e8" stroke-width="5" stroke-linecap="round"><line x1="36" y1="76" x2="28" y2="94"/><line x1="56" y1="76" x2="48" y2="94"/><line x1="76" y1="76" x2="68" y2="94"/><line x1="96" y1="76" x2="88" y2="94"/></g></svg>',
    snow: '<svg viewBox="0 0 120 120" fill="none"><path d="M30 56h56a14 14 0 0 0 0-28 20 20 0 0 0-38-6 16 16 0 0 0-18 6 12 12 0 0 0 0 28z" fill="#ffffff" opacity="0.9"/><g fill="#e8f3fa"><circle cx="34" cy="72" r="4"/><circle cx="60" cy="84" r="4"/><circle cx="86" cy="72" r="4"/><circle cx="47" cy="92" r="3"/><circle cx="73" cy="92" r="3"/></g></svg>',
    bolt: '<svg viewBox="0 0 120 120" fill="none"><path d="M30 60h18l-8 44 36-56H56l8-36z" fill="#ffd166"/></svg>'
  };

  const $ = id => document.getElementById(id);
  const inputEl = $("cityInput"), goBtn = $("goBtn"), locateBtn = $("locateBtn");
  const cityNameEl = $("cityName"), taglineEl = $("tagline"), quoteEl = $("quote");
  const motifEl = $("motif"), creditsEl = $("credits"), statusEl = $("status");
  const skyLineEl = $("skyLine"), windLineEl = $("windLine"), humLineEl = $("humLine"), precipLineEl = $("precipLine");
  const nerdsEl = $("nerds"), asofEl = $("asof"), copyBtn = $("copyBtn"), chipsEl = $("chips");

  let current = null; /* last vibe payload, for copy */

  /* quick city chips */
  QUICK_CITIES.forEach(function (c) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "chip";
    b.textContent = c.name;
    b.addEventListener("click", function () { fetchWeather(c.lat, c.lon, c.name.toUpperCase()); });
    chipsEl.appendChild(b);
  });

  function setStatus(msg, isErr) {
    if (msg) { statusEl.hidden = false; statusEl.textContent = msg; statusEl.className = "status" + (isErr ? " err" : ""); }
    else statusEl.hidden = true;
  }

  function applyPalette(p, cond, isNight) {
    const root = document.documentElement.style;
    root.setProperty("--bg1", p.bg1);
    root.setProperty("--bg2", p.bg2);
    root.setProperty("--ink", p.ink);
    root.setProperty("--accent", p.accent);
    /* browser chrome follows the sky */
    const tc = document.querySelector('meta[name="theme-color"]');
    if (tc) tc.setAttribute("content", p.bg1);
    const motif = (p.motif === "sun" && isNight && cond === "clear") ? "moon" : p.motif;
    motifEl.innerHTML = MOTIFS[motif] || MOTIFS.sun;
  }

  async function fetchWeather(lat, lon, label) {
    setStatus("Contacting the sky\u2026");
    const url = "https://api.open-meteo.com/v1/forecast?latitude=" + lat + "&longitude=" + lon +
      "&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m&timezone=auto";
    try {
      const r = await fetch(url);
      if (!r.ok) throw new Error("HTTP " + r.status);
      const d = await r.json();
      const c = d.current;
      const w = {
        temp: c.temperature_2m, feels: c.apparent_temperature, humidity: c.relative_humidity_2m,
        wind: c.wind_speed_10m, code: c.weather_code, precip: c.precipitation, is_day: c.is_day === 1
      };
      const v = vibeFor(w);
      current = { city: label, vibe: v, w: w, time: c.time };
      render(current);
      try { localStorage.setItem("vw-last", JSON.stringify({ lat: lat, lon: lon, label: label })); } catch (e) {}
      setStatus(null);
    } catch (err) {
      setStatus("The sky is unreachable. Check your connection and try again.", true);
    }
  }

  function render(item) {
    const v = item.vibe;
    cityNameEl.textContent = item.city;
    taglineEl.textContent = v.tagline;
    quoteEl.innerHTML = "It\u2019s \u201c<span class=\"marks\">" + v.headline + "</span>\u201d outside";
    skyLineEl.textContent = v.sky;
    windLineEl.textContent = v.wind;
    humLineEl.textContent = v.humidity;
    precipLineEl.textContent = "Precip: " + item.w.precip + " mm \u2014 " + v.precip;
    nerdsEl.textContent = v.nerds;
    creditsEl.hidden = false;
    applyPalette(v.palette, v.cond, !item.w.is_day);
    const t = item.time || "";
    asofEl.textContent = "AS OF " + (t.length >= 16 ? t.slice(11, 16) : "\u2014") + " LOCAL";
  }

  async function searchCity(name) {
    const q = name.trim();
    if (!q) return;
    setStatus("Locating \u201c" + q + "\u201d\u2026");
    try {
      const r = await fetch("https://geocoding-api.open-meteo.com/v1/search?name=" + encodeURIComponent(q) + "&count=1&language=en");
      if (!r.ok) throw new Error("HTTP " + r.status);
      const d = await r.json();
      if (!d.results || d.results.length === 0) { setStatus("No such place. The sky has never heard of \u201c" + q + "\u201d.", true); return; }
      const hit = d.results[0];
      await fetchWeather(hit.latitude, hit.longitude, hit.name.toUpperCase());
    } catch (err) {
      setStatus("The sky is unreachable. Check your connection and try again.", true);
    }
  }

  function locate() {
    if (!navigator.geolocation) { setStatus("Your browser is hiding your location. Search a city instead.", true); return; }
    setStatus("Asking the sky where you are\u2026");
    navigator.geolocation.getCurrentPosition(
      function (pos) {
        const lat = pos.coords.latitude, lon = pos.coords.longitude;
        /* best-effort reverse geocode for a nice label; fall back to coordinates */
        fetch("https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=" + lat + "&longitude=" + lon + "&localityLanguage=en")
          .then(function (r) { return r.json(); })
          .then(function (d) {
            const city = (d.city || d.locality || d.principalSubdivision || "").toUpperCase();
            fetchWeather(lat, lon, city || "YOUR LOCATION");
          })
          .catch(function () { fetchWeather(lat, lon, "YOUR LOCATION"); });
      },
      function () { setStatus("Location denied. The sky respects your privacy, but now it can\u2019t brag about you.", true); },
      { timeout: 8000 }
    );
  }

  goBtn.addEventListener("click", function () { searchCity(inputEl.value); });
  inputEl.addEventListener("keydown", function (e) { if (e.key === "Enter") searchCity(inputEl.value); });
  locateBtn.addEventListener("click", locate);

  copyBtn.addEventListener("click", function () {
    if (!current) return;
    const v = current.vibe;
    const text = "VIBE REPORT \u2014 " + current.city + "\n====================\n" +
      "It\u2019s \u201c" + v.headline + "\u201d outside (" + current.city + ")\n" +
      "Tagline: " + v.tagline + "\n" +
      "Sky: " + v.sky + "\nWind: " + v.wind + "\nHumidity: " + v.humidity + "\n" +
      "Precip: " + current.w.precip + " mm \u2014 " + v.precip + "\n\n" +
      v.nerds + "\n\n\u2014 generated by vibeweather (no degrees. only vibes.)";
    try {
      navigator.clipboard.writeText(text).then(function () {
        copyBtn.textContent = "Copied \u2713";
        setTimeout(function () { copyBtn.textContent = "Copy Vibe"; }, 1500);
      });
    } catch (e) {}
  });

  /* boot: saved city first, else try geolocation */
  let booted = false;
  try {
    const saved = JSON.parse(localStorage.getItem("vw-last") || "null");
    if (saved && saved.lat) { fetchWeather(saved.lat, saved.lon, saved.label); booted = true; }
  } catch (e) {}
  if (!booted) locate();
})();
