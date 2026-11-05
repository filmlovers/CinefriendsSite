document.addEventListener("DOMContentLoaded", () => {
  const first = films[0];
  document.getElementById("featured-title").textContent = first.title;
  document.getElementById("featured-poster-title").innerHTML = first.posterTitle;
  document.getElementById("featured-genre").textContent = first.genre.toUpperCase();
  document.getElementById("featured-description").textContent = first.description;
  document.getElementById("featured-date").textContent = first.date;
  document.getElementById("featured-time").textContent = first.time;
  document.getElementById("featured-venue").textContent = first.venue;
  document.getElementById("featured-address").textContent = first.address;
  const featuredPoster = document.getElementById("featured-poster");
  featuredPoster.classList.add("poster-" + first.color);
  if (first.poster) {
    const img = new Image();
    img.className = "poster-img";
    img.alt = "Locandina di " + first.title;
    img.onload = () => {
      featuredPoster.prepend(img);
      featuredPoster.classList.add("poster-has-image");
    };
    img.src = first.poster; // se l'immagine non si carica resta la locandina tipografica
  }

  const list = document.getElementById("schedule-list");
  const select = document.getElementById("film");
  films.forEach((film, i) => {
    const option = document.createElement("option");
    option.value = `${film.title} — ${film.date}`;
    const left = seatsLeft(film);
    option.textContent = `${film.title} · ${film.date}` + (left === 0 ? " — ESAURITO" : "");
    option.disabled = left === 0;
    select.appendChild(option);
    const row = document.createElement("article");
    row.className = "schedule-item";
    row.innerHTML = `<span class="schedule-number">${String(i + 1).padStart(2, "0")}</span>
      <div class="schedule-thumb poster-${film.color}">${film.poster ? `<img src="${film.poster}" alt="Locandina di ${film.title}" loading="lazy" onerror="this.remove()">` : ""}</div>
      <div class="schedule-date">${film.date}<small>${film.time}</small></div>
      <div class="schedule-film"><h3>${film.title}</h3><span>${film.genre}</span></div>
      <div class="schedule-place">${film.venue}<small>${film.address}</small></div>
      <a class="schedule-book" href="#prenota" aria-label="Prenota ${film.title}">↗</a>`;
    list.appendChild(row);
  });
  setupSeatsCounter();
  loadAvailability();
  loadGiscus();
  setupBookingForm();
  document.getElementById("year").textContent = new Date().getFullYear();
  const toggle = document.querySelector(".menu-toggle");
  const nav = document.querySelector(".nav");
  toggle.addEventListener("click", () => {
    const open = nav.classList.toggle("nav-open");
    toggle.setAttribute("aria-expanded", String(open));
  });
  nav.querySelectorAll("a").forEach(a => a.addEventListener("click", () => nav.classList.remove("nav-open")));
});

// Sezione "Proposte": carica Giscus solo se giscus-config.js è stato compilato.
function loadGiscus() {
  const cfg = window.GISCUS_CONFIG || {};
  const container = document.getElementById("giscus-container");
  const fallback = document.getElementById("giscus-fallback");
  if (!container) return;
  if (!cfg.repo || !cfg.repoId || !cfg.categoryId) {
    if (fallback) fallback.hidden = false;
    console.info("Giscus non configurato: compila giscus-config.js (vedi README).");
    return;
  }
  const s = document.createElement("script");
  s.src = "https://giscus.app/client.js";
  s.async = true;
  s.crossOrigin = "anonymous";
  const attrs = {
    repo: cfg.repo, "repo-id": cfg.repoId,
    category: cfg.category || "Proposte", "category-id": cfg.categoryId,
    mapping: "specific", term: cfg.term || "Proposte Cinefriends",
    strict: "0", "reactions-enabled": "1", "emit-metadata": "0",
    "input-position": "top", theme: cfg.theme || "light", lang: "it", loading: "lazy"
  };
  Object.entries(attrs).forEach(([k, v]) => s.setAttribute("data-" + k, v));
  container.appendChild(s);
}


// Prenotazioni: invio con Web3Forms (https://web3forms.com)
function setupBookingForm() {
  const form = document.getElementById("booking-form");
  const status = document.getElementById("form-status");
  if (!form) return;
  const cfg = window.BOOKING_CONFIG || {};
  const button = form.querySelector(".submit-button");

  const show = (html, type) => {
    status.innerHTML = html;
    status.className = "form-status form-status-" + type;
    status.hidden = false;
  };
  const mailtoLink = () => {
    if (!cfg.fallbackEmail) return "";
    const lines = [];
    new FormData(form).forEach((v, k) => {
      if (["access_key", "subject", "from_name", "botcheck"].includes(k) || !v) return;
      lines.push(k + ": " + v);
    });
    return "mailto:" + encodeURIComponent(cfg.fallbackEmail).replace("%40", "@") +
      "?subject=" + encodeURIComponent("Nuova prenotazione Cinefriends") +
      "&body=" + encodeURIComponent(lines.join("\n"));
  };
  const fail = (msg) => {
    const link = mailtoLink();
    show(msg + (link ? ` <a href="${link}">Invia la prenotazione via email ↗</a>` : ""), "error");
  };

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    status.hidden = true;
    const chosen = films[document.getElementById("film").selectedIndex];
    if (chosen && +form.elements["Numero di posti"].value > seatsLeft(chosen)) {
      fail("Non ci sono abbastanza posti disponibili per questa serata.");
      return;
    }
    const sheetsOn = !!(window.POSTI_CONFIG || {}).url;
    if (!sheetsOn && !cfg.accessKey) {
      fail("Le prenotazioni online non sono ancora attive.");
      console.info("Compila prenotazioni-config.js (Web3Forms) o posti-config.js (Google Sheets): vedi README.");
      return;
    }
    if (cfg.accessKey) form.elements["access_key"].value = cfg.accessKey;
    const label = button.innerHTML;
    button.disabled = true;
    button.textContent = "Invio in corso…";
    const restore = () => { button.disabled = false; button.innerHTML = label; };
    try {
      // 1) Registrazione sul foglio Google: qui si controllano i posti in modo definitivo
      let reserved = false;
      if (sheetsOn) {
        const r = await reserveSeats(form, chosen);
        if (r.status === "ok") reserved = true;
        else if (r.status === "rejected") {
          fail(r.message);
          restore();
          await loadAvailability(); // aggiorna il contatore con i posti reali
          return;
        }
        // "unreachable": il foglio non risponde, si prosegue con Web3Forms per non perdere la richiesta
      }
      // 2) Avviso all'organizzatore via email (Web3Forms)
      let notified = false, apiMessage = "";
      if (cfg.accessKey) {
        try {
          const res = await fetch(form.action, {
            method: "POST",
            headers: { Accept: "application/json" },
            body: new FormData(form)
          });
          const data = await res.json().catch(() => ({}));
          notified = res.ok && !!data.success;
          apiMessage = data.message || "";
        } catch (err) { /* gestito sotto */ }
      }
      if (!reserved && !notified) {
        fail("Non siamo riusciti a inviare la prenotazione" + (apiMessage ? " (" + apiMessage + ")" : "") + ". Riprova tra poco.");
        restore();
        return;
      }
      // Prenotazione registrata: la conferma via email è un extra e non blocca mai il flusso.
      const sent = await sendConfirmationEmail(form);
      try { sessionStorage.setItem("cf_conferma", sent ? "1" : ""); } catch (e) {}
      window.location.href = "grazie.html";
    } catch (err) {
      fail("Connessione non riuscita: riprova tra poco.");
      restore();
    }
  });
}


// ---------- Email di conferma con link per il calendario (EmailJS) ----------
const MESI = { gennaio: 1, febbraio: 2, marzo: 3, aprile: 4, maggio: 5, giugno: 6, luglio: 7, agosto: 8, settembre: 9, ottobre: 10, novembre: 11, dicembre: 12 };

// Orario di Roma -> data UTC (gestisce da solo ora solare/legale)
function romeToUtc(y, m, d, h, mi) {
  const guess = Date.UTC(y, m - 1, d, h, mi);
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: "Europe/Rome", hourCycle: "h23",
    year: "numeric", month: "numeric", day: "numeric", hour: "numeric", minute: "numeric" }).formatToParts(new Date(guess));
  const p = Object.fromEntries(parts.map(x => [x.type, +x.value]));
  const asRome = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute);
  return new Date(guess - (asRome - guess));
}

// Ricava inizio/fine dal film. Se in films.js c'è  start: "2026-11-09T21:00"  usa quello,
// altrimenti legge il testo di "date" (es. "Lunedì 9 Novembre") e "time" (es. "Ore 21:00").
// Facoltativo: duration (minuti, default 150).
function filmTimes(film) {
  let y, m, d, h = 21, mi = 0;
  if (film.start) {
    const t = film.start.match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/);
    if (!t) return null;
    [y, m, d, h, mi] = t.slice(1).map(Number);
  } else {
    const dm = (film.date || "").toLowerCase().match(/(\d{1,2})\s+([a-zà-ù]+)/);
    if (!dm || !MESI[dm[2]]) return null;
    d = +dm[1]; m = MESI[dm[2]];
    const tm = (film.time || "").match(/(\d{1,2})[:.](\d{2})/);
    if (tm) { h = +tm[1]; mi = +tm[2]; }
    const now = new Date();
    y = now.getFullYear();
    // se la data di quest'anno è passata da più di 60 giorni, si intende l'anno prossimo
    if (romeToUtc(y, m, d, h, mi) < new Date(now - 60 * 864e5)) y += 1;
  }
  const start = romeToUtc(y, m, d, h, mi);
  const end = new Date(start.getTime() + (film.duration || 150) * 60000);
  const f = x => x.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  return { start: f(start), end: f(end) };
}

async function sendConfirmationEmail(form) {
  const cfg = window.CONFERMA_CONFIG || {};
  if (!cfg.publicKey || !cfg.serviceId || !cfg.templateId) return false;
  try {
    const film = films[document.getElementById("film").selectedIndex] || films[0];
    const times = filmTimes(film);
    const place = film.venue + ", " + film.address;
    const details = "Prenotazione Cinefriends: " + film.title + ". Ti aspettiamo!";
    let google = "", ics = "";
    if (times) {
      google = "https://calendar.google.com/calendar/render?action=TEMPLATE" +
        "&text=" + encodeURIComponent("Cinefriends: " + film.title) +
        "&dates=" + times.start + "/" + times.end +
        "&details=" + encodeURIComponent(details) +
        "&location=" + encodeURIComponent(place);
      ics = new URL("calendario.html?" + new URLSearchParams({
        t: film.title, s: times.start, e: times.end, l: place, d: details
      }), window.location.href).href;
    }
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 10000);
    const res = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: ctrl.signal,
      body: JSON.stringify({
        service_id: cfg.serviceId, template_id: cfg.templateId, user_id: cfg.publicKey,
        template_params: {
          to_email: form.elements["email"].value,
          to_name: form.elements["name"].value,
          film: film.title, date: film.date, time: film.time,
          venue: film.venue, address: film.address,
          seats: form.elements["Numero di posti"].value,
          attendance: form.elements["Partecipazione"].value,
          google_calendar_url: google, ics_page_url: ics
        }
      })
    });
    clearTimeout(timer);
    return res.ok;
  } catch (err) {
    console.warn("Email di conferma non inviata", err);
    return false;
  }
}

// ---------- Contatore posti disponibili ----------
// In films.js, per ogni film: seats = posti totali (default 7), booked = posti già confermati (default 0).
const DEFAULT_SEATS = 7;
function seatsTotal(film) { return Number.isFinite(film.seats) ? film.seats : DEFAULT_SEATS; }
function seatsLeft(film) { return Math.max(0, seatsTotal(film) - (Number(film.booked) || 0)); }

function setupSeatsCounter() {
  const select = document.getElementById("film");
  const people = document.getElementById("people");
  const box = document.getElementById("seats-counter");
  const button = document.querySelector("#booking-form .submit-button");
  if (!select || !people || !box) return;

  // si parte dal primo film con posti liberi
  const firstFree = films.findIndex(f => seatsLeft(f) > 0);
  if (firstFree > 0) select.selectedIndex = firstFree;

  const render = () => {
    const film = films[select.selectedIndex];
    if (!film) return;
    if (seatsLoading) {
      box.className = "seats-counter";
      box.innerHTML = "<p>Controllo i posti disponibili…</p>";
      if (button) button.disabled = true;
      return;
    }
    const total = seatsTotal(film), left = seatsLeft(film), taken = total - left;

    // numero di posti prenotabili: da 1 al massimo disponibile
    const previous = +people.value || 1;
    people.innerHTML = "";
    if (left === 0) {
      people.innerHTML = '<option value="">Esaurito</option>';
    } else {
      for (let n = 1; n <= left; n++) people.add(new Option(n + (n === 1 ? " posto" : " posti"), n));
      people.value = String(Math.min(previous, left));
    }
    people.disabled = left === 0;
    if (button) button.disabled = left === 0;

    const wanted = left === 0 ? 0 : +people.value;
    const dots = Array.from({ length: total }, (_, i) =>
      `<span class="seat-dot ${i < taken ? "seat-taken" : (i < taken + wanted ? "seat-wanted" : "seat-free")}"></span>`).join("");
    let msg;
    if (left === 0) msg = "<strong>Posti esauriti</strong> per questa serata. Scegli un altro film.";
    else if (left <= 2) msg = `<strong>Ultimi posti!</strong> Ne restano ${left} su ${total}.`;
    else msg = `<strong>${left} posti disponibili</strong> su ${total}.`;
    box.className = "seats-counter" + (left === 0 ? " seats-out" : left <= 2 ? " seats-low" : "");
    box.innerHTML = `<div class="seat-dots" aria-hidden="true">${dots}</div><p>${msg}</p>`;
  };
  select.addEventListener("change", render);
  people.addEventListener("change", render);
  seatsRender = render;
  render();
}

// ---------- Posti automatici da Google Sheets ----------
let seatsRender = null;     // funzione di aggiornamento del contatore (impostata da setupSeatsCounter)
let seatsLoading = false;
const filmKey = f => `${f.title} — ${f.date}`; // identico al valore dell'opzione nel modulo

function updateFilmOptions() {
  const select = document.getElementById("film");
  if (!select) return;
  Array.from(select.options).forEach((opt, i) => {
    const f = films[i];
    if (!f) return;
    const left = seatsLeft(f);
    opt.textContent = `${f.title} · ${f.date}` + (left === 0 ? " — ESAURITO" : "");
    opt.disabled = left === 0;
  });
  // se il film scelto è ora esaurito, passa al primo con posti liberi
  if (select.selectedOptions[0] && select.selectedOptions[0].disabled) {
    const free = films.findIndex(f => seatsLeft(f) > 0);
    if (free >= 0) select.selectedIndex = free;
  }
}

async function loadAvailability() {
  const url = (window.POSTI_CONFIG || {}).url;
  if (!url) return;
  seatsLoading = true;
  if (seatsRender) seatsRender();
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 8000);
    const res = await fetch(url + (url.includes("?") ? "&" : "?") + "action=availability&t=" + Date.now(), { signal: ctrl.signal });
    clearTimeout(timer);
    const d = await res.json();
    if (d && d.ok) {
      films.forEach(f => {
        const k = filmKey(f);
        f.booked = Number((d.booked || {})[k]) || 0;
        const cap = (d.capacities || {})[k];
        if (Number.isFinite(cap)) f.seats = cap;
        else if (Number.isFinite(d.capacity)) f.seats = d.capacity;
      });
    }
  } catch (err) {
    console.warn("Posti da Google Sheets non disponibili: uso i valori di films.js", err);
  }
  seatsLoading = false;
  updateFilmOptions();
  if (seatsRender) seatsRender();
}

async function reserveSeats(form, film) {
  const url = (window.POSTI_CONFIG || {}).url;
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 20000);
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" }, // evita la richiesta preliminare CORS
      signal: ctrl.signal,
      body: JSON.stringify({
        action: "book",
        film: filmKey(film),
        name: form.elements["name"].value,
        email: form.elements["email"].value,
        seats: form.elements["Numero di posti"].value,
        attendance: form.elements["Partecipazione"].value,
        notes: form.elements["Note"] ? form.elements["Note"].value : "",
        hp: form.elements["botcheck"] && form.elements["botcheck"].checked ? "1" : ""
      })
    });
    clearTimeout(timer);
    const d = await res.json();
    if (d.ok) return { status: "ok" };
    const messages = {
      esaurito: d.left > 0
        ? `Nel frattempo sono rimasti solo ${d.left} posti per questa serata. Riduci il numero di posti.`
        : "Nel frattempo i posti per questa serata sono esauriti. Scegli un altro film.",
      doppione: "Con questa email risulta già una prenotazione per questa serata. Se vuoi modificarla, scrivici.",
      dati_non_validi: "Controlla i dati inseriti (nome, email e numero di posti).",
      occupato: "Il sistema è molto occupato: riprova tra qualche secondo."
    };
    return { status: "rejected", message: messages[d.error] || "Prenotazione non riuscita. Riprova." };
  } catch (err) {
    console.warn("Foglio Google non raggiungibile", err);
    return { status: "unreachable" };
  }
}
