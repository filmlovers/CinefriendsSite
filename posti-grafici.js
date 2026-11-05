/*
 * CINEFRIENDS — selezione grafica dei posti e riepilogo disponibilità.
 * Installazione: aggiungere questo script DOPO script.js in index.html.
 * Il CSS viene caricato automaticamente da questo file.
 */
(() => {
  "use strict";

  const SEATS = [
    { id: "floor-1", label: "Terra 1", short: "T1", area: "floor" },
    { id: "floor-2", label: "Terra 2", short: "T2", area: "floor" },
    { id: "floor-3", label: "Terra 3", short: "T3", area: "floor" },
    { id: "sofa-1", label: "Divano 1", short: "D1", area: "sofa" },
    { id: "sofa-2", label: "Divano 2", short: "D2", area: "sofa" },
    { id: "sofa-3", label: "Divano 3", short: "D3", area: "sofa" },
    { id: "sofa-4", label: "Divano 4", short: "D4", area: "sofa" }
  ];
  const SEAT_BY_ID = Object.fromEntries(SEATS.map(seat => [seat.id, seat]));

  // Carica il foglio stile accanto a questo script.
  const currentScript = document.currentScript;
  if (currentScript && currentScript.src) {
    const stylesheet = document.createElement("link");
    stylesheet.rel = "stylesheet";
    stylesheet.href = new URL("posti-grafici.css", currentScript.src).href;
    document.head.appendChild(stylesheet);
  }

  const state = {
    selected: [],
    filmKey: "",
    bookedByFilm: {},
    availabilityLoaded: false,
    availabilityLoading: Boolean((window.POSTI_CONFIG || {}).url),
    map: null,
    selectedNamesInput: null,
    selectedIdsInput: null,
    selectedFilmIdInput: null,
    selectedDurationInput: null,
    pickerStatus: null,
    selectedCount: null,
    weeklyDetails: null
  };

  const legacyKeyFor = film => String(film.legacyKey || `${film.title} — ${film.date}`).trim();
  const keyFor = film => String(film.id || legacyKeyFor(film)).trim();
  const filmAliases = () => films.map(film => ({ id: keyFor(film), legacyKey: legacyKeyFor(film) }));
  const filmLabel = id => SEAT_BY_ID[id] ? SEAT_BY_ID[id].label : id;
  const selectedFilm = () => {
    const select = document.getElementById("film");
    return select && typeof films !== "undefined" ? films[select.selectedIndex] : null;
  };

  function fallbackBookedIds(film) {
    const count = Math.max(0, Math.min(SEATS.length, Number(film && film.booked) || 0));
    // Per le vecchie righe senza posto assegnato, il backend assegna gli slot liberi in ordine.
    return SEATS.slice(0, count).map(seat => seat.id);
  }

  function bookedIdsFor(film) {
    if (!film) return [];
    const key = keyFor(film);
    const ids = state.bookedByFilm[key];
    if (Array.isArray(ids)) return [...new Set(ids.filter(id => SEAT_BY_ID[id]))];
    return fallbackBookedIds(film);
  }

  function renderMapMarkup(film, selectedIds = [], interactive = false) {
    const booked = new Set(bookedIdsFor(film));
    const selected = new Set(selectedIds);
    const makeSeat = seat => {
      const isBooked = booked.has(seat.id);
      const isSelected = selected.has(seat.id);
      const statusClass = isBooked ? "is-booked" : isSelected ? "is-selected" : "is-free";
      const disabled = !interactive || isBooked ? "disabled" : "";
      const pressed = isSelected ? "true" : "false";
      return `<button type="button" class="cf-seat ${seat.area === "sofa" ? "cf-seat-sofa" : "cf-seat-floor"} ${statusClass}" data-seat-id="${seat.id}" aria-pressed="${pressed}" aria-label="${seat.label}: ${isBooked ? "occupato" : isSelected ? "selezionato" : "libero"}" ${disabled}><span>${seat.short}</span></button>`;
    };
    const floor = SEATS.filter(seat => seat.area === "floor").map(makeSeat).join("");
    const sofa = SEATS.filter(seat => seat.area === "sofa").map(makeSeat).join("");
    return `<div class="cf-seatmap" role="group" aria-label="Pianta dei sette posti vista dall'alto">
      <div class="cf-screen-wrap"><div class="cf-screen"><span>▰</span> SCHERMO</div></div>
      <div class="cf-seat-zone">
        <div class="cf-zone-heading"><span>POSTI A TERRA</span><small>3 posti</small></div>
        <div class="cf-seat-row cf-floor-row">${floor}</div>
      </div>
      <div class="cf-sofa-zone">
        <div class="cf-zone-heading"><span>DIVANO</span><small>4 posti</small></div>
        <div class="cf-sofa-back" aria-hidden="true"></div>
        <div class="cf-seat-row cf-sofa-row">${sofa}</div>
        <div class="cf-sofa-base" aria-hidden="true"></div>
      </div>
      <div class="cf-seat-legend" aria-label="Legenda">
        <span><i class="cf-legend-dot cf-legend-free"></i> Libero</span>
        <span><i class="cf-legend-dot cf-legend-selected"></i> Selezionato</span>
        <span><i class="cf-legend-dot cf-legend-booked"></i> Occupato</span>
      </div>
    </div>`;
  }

  function updateHiddenFields() {
    const names = state.selected.map(filmLabel).join(", ");
    const ids = state.selected.join(",");
    if (state.selectedNamesInput) state.selectedNamesInput.value = names;
    if (state.selectedIdsInput) state.selectedIdsInput.value = ids;
    const film = selectedFilm();
    if (state.selectedFilmIdInput) state.selectedFilmIdInput.value = film ? keyFor(film) : "";
    if (state.selectedDurationInput) state.selectedDurationInput.value = film && Number(film.duration) > 0 ? String(Number(film.duration)) : "";
  }

  function renderBookingPicker() {
    const film = selectedFilm();
    if (!film || !state.map) return;
    const key = keyFor(film);
    if (key !== state.filmKey) {
      state.filmKey = key;
      state.selected = [];
    }

    const booked = new Set(bookedIdsFor(film));
    state.selected = state.selected.filter(id => !booked.has(id));
    const people = document.getElementById("people");
    const quantity = Math.max(1, Number(people && people.value) || 1);
    if (state.selected.length > quantity) state.selected = state.selected.slice(0, quantity);

    state.map.innerHTML = renderMapMarkup(film, state.selected, true);
    state.map.querySelectorAll("[data-seat-id]").forEach(button => {
      button.addEventListener("click", () => {
        const id = button.dataset.seatId;
        if (!id || booked.has(id)) return;
        if (state.selected.includes(id)) {
          state.selected = state.selected.filter(value => value !== id);
        } else if (state.selected.length < quantity) {
          state.selected.push(id);
        }
        renderBookingPicker();
      });
    });

    const selectedCount = state.selected.length;
    if (state.selectedCount) state.selectedCount.textContent = `${selectedCount} / ${quantity} selezionati`;
    if (state.pickerStatus) {
      if (selectedCount === quantity) {
        state.pickerStatus.textContent = "Perfetto: hai selezionato tutti i posti richiesti.";
        state.pickerStatus.className = "cf-seat-hint is-valid";
      } else {
        const remaining = quantity - selectedCount;
        state.pickerStatus.textContent = `Seleziona ancora ${remaining} ${remaining === 1 ? "posto" : "posti"}.`;
        state.pickerStatus.className = "cf-seat-hint";
      }
    }
    updateHiddenFields();

    const submit = document.querySelector("#booking-form .submit-button");
    if (submit) submit.disabled = state.availabilityLoading || selectedCount !== quantity;
  }

  function getNextEvent() {
    if (!Array.isArray(films) || !films.length) return null;
    const now = Date.now();
    const upcoming = films.map(film => {
      try {
        const times = typeof filmTimes === "function" ? filmTimes(film) : null;
        if (!times || !times.start) return { film, timestamp: Number.POSITIVE_INFINITY };
        const match = times.start.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/);
        if (!match) return { film, timestamp: Number.POSITIVE_INFINITY };
        const timestamp = Date.UTC(+match[1], +match[2] - 1, +match[3], +match[4], +match[5], +match[6]);
        return { film, timestamp };
      } catch (error) {
        return { film, timestamp: Number.POSITIVE_INFINITY };
      }
    }).filter(item => item.timestamp >= now).sort((a, b) => a.timestamp - b.timestamp);
    return upcoming[0] ? upcoming[0].film : films[0];
  }

  function renderWeeklyAvailability() {
    if (!state.weeklyDetails) return;
    const film = getNextEvent();
    const title = state.weeklyDetails.querySelector(".cf-week-film");
    const summary = state.weeklyDetails.querySelector(".cf-week-summary");
    const map = state.weeklyDetails.querySelector(".cf-week-map");
    const status = state.weeklyDetails.querySelector(".cf-week-status");
    if (!film || !map) return;
    const booked = bookedIdsFor(film);
    const free = Math.max(0, SEATS.length - booked.length);
    if (title) title.textContent = `${film.title} · ${film.date}`;
    if (summary) summary.textContent = `${free} ${free === 1 ? "posto disponibile" : "posti disponibili"} su 7`;
    if (status) status.textContent = state.availabilityLoaded || !(window.POSTI_CONFIG || {}).url
      ? "Disponibilità aggiornata per l'evento in arrivo."
      : "Disponibilità non ancora verificata: riprova tra poco.";
    map.innerHTML = renderMapMarkup(film, [], false);
  }


  function formatDuration(value) {
    const minutes = Math.max(0, Number(value) || 0);
    const hours = Math.floor(minutes / 60);
    const remainder = minutes % 60;
    return hours ? `${hours} h${remainder ? ` ${remainder} min` : ""}` : `${remainder} min`;
  }

  function setupSeatInterface() {
    const form = document.getElementById("booking-form");
    const counter = document.getElementById("seats-counter");
    const people = document.getElementById("people");
    const film = document.getElementById("film");
    if (!form || !counter || !people || !film) return;

    const picker = document.createElement("section");
    picker.className = "cf-seat-picker";
    picker.innerHTML = `<div class="cf-picker-heading"><div><h3>Scegli i tuoi posti</h3><p>Vista dall'alto · schermo in alto</p></div><strong class="cf-seat-selected-count">0 / 1 selezionati</strong></div><div class="cf-booking-seatmap"></div><p class="cf-seat-hint" role="status" aria-live="polite">Seleziona i posti per continuare.</p>`;
    counter.insertAdjacentElement("afterend", picker);

    state.map = picker.querySelector(".cf-booking-seatmap");
    state.selectedCount = picker.querySelector(".cf-seat-selected-count");
    state.pickerStatus = picker.querySelector(".cf-seat-hint");

    state.selectedNamesInput = document.createElement("input");
    state.selectedNamesInput.type = "hidden";
    state.selectedNamesInput.name = "Posti scelti";
    state.selectedNamesInput.id = "cf-selected-seat-names";
    form.appendChild(state.selectedNamesInput);

    state.selectedIdsInput = document.createElement("input");
    state.selectedIdsInput.type = "hidden";
    state.selectedIdsInput.name = "Codici posti";
    state.selectedIdsInput.id = "cf-selected-seat-ids";
    form.appendChild(state.selectedIdsInput);

    state.selectedFilmIdInput = document.createElement("input");
    state.selectedFilmIdInput.type = "hidden";
    state.selectedFilmIdInput.name = "ID proiezione";
    state.selectedFilmIdInput.id = "cf-film-id";
    form.appendChild(state.selectedFilmIdInput);

    state.selectedDurationInput = document.createElement("input");
    state.selectedDurationInput.type = "hidden";
    state.selectedDurationInput.name = "Durata film (minuti)";
    state.selectedDurationInput.id = "cf-film-duration";
    form.appendChild(state.selectedDurationInput);

    film.addEventListener("change", renderBookingPicker);
    people.addEventListener("change", renderBookingPicker);
    renderBookingPicker();
  }

  function setupWeeklyAccordion() {
    const section = document.getElementById("questa-settimana");
    const featureCard = section && section.querySelector(".featured-card");
    if (!featureCard) return;
    const details = document.createElement("details");
    details.className = "cf-week-availability";
    details.innerHTML = `<summary><span class="cf-week-summary">Controllo i posti disponibili…</span><span class="cf-week-toggle" aria-hidden="true">＋</span></summary><div class="cf-week-content"><div class="cf-week-copy"><strong class="cf-week-film"></strong><p class="cf-week-status" aria-live="polite"></p></div><div class="cf-week-map"></div></div>`;
    featureCard.insertAdjacentElement("afterend", details);
    details.addEventListener("toggle", () => {
      details.querySelector(".cf-week-toggle").textContent = details.open ? "−" : "＋";
    });
    state.weeklyDetails = details;
    renderWeeklyAvailability();
  }

  async function refreshSeatAvailability() {
    const url = (window.POSTI_CONFIG || {}).url;
    if (!url) {
      state.availabilityLoaded = false;
      state.bookedByFilm = {};
      renderBookingPicker();
      renderWeeklyAvailability();
      return;
    }
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 8000);
      const query = new URLSearchParams({
        action: "availability",
        t: String(Date.now()),
        filmAliases: JSON.stringify(filmAliases())
      });
      const response = await fetch(url + (url.includes("?") ? "&" : "?") + query.toString(), {
        signal: controller.signal,
        cache: "no-store"
      });
      clearTimeout(timer);
      const data = await response.json();
      if (!response.ok || !data || !data.ok) throw new Error("Risposta disponibilità non valida");

      state.bookedByFilm = {};
      const seatMap = data.bookedSeats || {};
      Object.keys(seatMap).forEach(key => {
        const ids = Array.isArray(seatMap[key]) ? seatMap[key] : [];
        state.bookedByFilm[key] = [...new Set(ids.filter(id => SEAT_BY_ID[id]))];
      });
      state.availabilityLoaded = true;
    } catch (error) {
      console.warn("Mappa posti non aggiornata", error);
      state.availabilityLoaded = false;
    }
    renderBookingPicker();
    renderWeeklyAvailability();
  }

  // Estende il caricamento già usato dal sito, senza duplicarne la logica del contatore.
  const originalLoadAvailability = typeof loadAvailability === "function" ? loadAvailability : null;
  if (originalLoadAvailability) {
    window.loadAvailability = async function (...args) {
      state.availabilityLoading = Boolean((window.POSTI_CONFIG || {}).url);
      renderBookingPicker();
      try {
        return await originalLoadAvailability.apply(this, args);
      } finally {
        await refreshSeatAvailability();
        state.availabilityLoading = false;
        renderBookingPicker();
      }
    };
  }

  async function reserveSeatsWithSelection(form, film) {
    const url = (window.POSTI_CONFIG || {}).url;
    if (!url) return { status: "unreachable" };
    const quantity = Number(form.elements["Numero di posti"].value) || 0;
    if (state.selected.length !== quantity) {
      return { status: "rejected", message: `Seleziona esattamente ${quantity} ${quantity === 1 ? "posto" : "posti"}.` };
    }
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 20000);
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        signal: controller.signal,
        body: JSON.stringify({
          action: "book",
          film: legacyKeyFor(film),
          filmId: keyFor(film),
          name: form.elements["name"].value,
          email: form.elements["email"].value,
          seats: quantity,
          seatIds: [...state.selected],
          attendance: form.elements["Partecipazione"].value,
          notes: form.elements["Note"] ? form.elements["Note"].value : "",
          hp: form.elements["botcheck"] && form.elements["botcheck"].checked ? "1" : ""
        })
      });
      clearTimeout(timer);
      const data = await response.json();
      if (data && data.ok) {
        const key = keyFor(film);
        state.bookedByFilm[key] = [...new Set([...(state.bookedByFilm[key] || []), ...state.selected])];
        // Conserva i nomi dei posti nei campi hidden fino all'invio di Web3Forms ed EmailJS.
        return { status: "ok" };
      }
      const messages = {
        esaurito: data.left > 0
          ? `Nel frattempo sono rimasti solo ${data.left} posti liberi. Aggiorna la selezione.`
          : "Nel frattempo i posti per questa serata sono esauriti.",
        posto_occupato: "Uno o più posti sono stati prenotati da un'altra persona. La mappa è stata aggiornata: scegli di nuovo.",
        doppione: "Con questa email risulta già una prenotazione per questa serata. Se vuoi modificarla, scrivici.",
        dati_non_validi: "Controlla i dati inseriti e la selezione dei posti.",
        occupato: "Il sistema è molto occupato: riprova tra qualche secondo."
      };
      return { status: "rejected", message: messages[data.error] || "Prenotazione non riuscita. Riprova." };
    } catch (error) {
      console.warn("Google Sheets non raggiungibile", error);
      return { status: "unreachable" };
    }
  }
  window.reserveSeats = reserveSeatsWithSelection;

  async function sendConfirmationEmailWithSeats(form) {
    const config = window.CONFERMA_CONFIG || {};
    if (!config.publicKey || !config.serviceId || !config.templateId) return false;
    try {
      const film = films[document.getElementById("film").selectedIndex] || films[0];
      const times = filmTimes(film);
      const place = film.venue + ", " + film.address;
      const details = "Prenotazione Cinefriends: " + film.title + ". Ti aspettiamo!";
      let google = "", ics = "";
      if (times) {
        ics = new URL("calendario.html?" + new URLSearchParams({
          t: film.title, s: times.start, e: times.end, l: place, d: details
        }), window.location.href).href;
        google = ics + "&g=1";
      }
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 10000);
      const response = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          service_id: config.serviceId,
          template_id: config.templateId,
          user_id: config.publicKey,
          template_params: {
            to_email: form.elements["email"].value,
            to_name: form.elements["name"].value,
            film: film.title,
            film_id: keyFor(film),
            date: film.date,
            time: film.time,
            venue: film.venue,
            address: film.address,
            seats: form.elements["Numero di posti"].value,
            seat_selection: form.elements["Posti scelti"].value,
            attendance: form.elements["Partecipazione"].value,
            duration: Number(film.duration) > 0 ? formatDuration(film.duration) : "Non specificata",
            google_calendar_url: google,
            ics_page_url: ics
          }
        })
      });
      clearTimeout(timer);
      return response.ok;
    } catch (error) {
      console.warn("Email di conferma non inviata", error);
      return false;
    }
  }
  window.sendConfirmationEmail = sendConfirmationEmailWithSeats;

  // Sostituisce il gestore del form per rendere obbligatoria la scelta grafica e,
  // quando Google Sheets è configurato, non confermare mai se il database non risponde.
  window.setupBookingForm = function () {
    const form = document.getElementById("booking-form");
    const status = document.getElementById("form-status");
    if (!form) return;
    const config = window.BOOKING_CONFIG || {};
    const button = form.querySelector(".submit-button");

    const show = (message, type) => {
      status.textContent = message;
      status.className = "form-status form-status-" + type;
      status.hidden = false;
    };
    const mailtoLink = () => {
      if (!config.fallbackEmail) return "";
      const lines = [];
      new FormData(form).forEach((value, name) => {
        if (["access_key", "subject", "from_name", "botcheck", "Codici posti"].includes(name) || !value) return;
        lines.push(name + ": " + value);
      });
      return "mailto:" + encodeURIComponent(config.fallbackEmail).replace("%40", "@") +
        "?subject=" + encodeURIComponent("Nuova prenotazione Cinefriends") +
        "&body=" + encodeURIComponent(lines.join("\n"));
    };
    const fail = message => {
      const link = mailtoLink();
      status.innerHTML = "";
      status.append(document.createTextNode(message + (link ? " " : "")));
      if (link) {
        const anchor = document.createElement("a");
        anchor.href = link;
        anchor.textContent = "Invia la prenotazione via email ↗";
        status.append(anchor);
      }
      status.className = "form-status form-status-error";
      status.hidden = false;
    };

    form.addEventListener("submit", async event => {
      event.preventDefault();
      status.hidden = true;
      const chosen = films[document.getElementById("film").selectedIndex];
      const requiredSeats = Number(form.elements["Numero di posti"].value) || 0;
      if (state.selected.length !== requiredSeats) {
        fail(`Devi selezionare esattamente ${requiredSeats} ${requiredSeats === 1 ? "posto" : "posti"} nella piantina.`);
        state.map && state.map.scrollIntoView({ behavior: "smooth", block: "center" });
        return;
      }
      updateHiddenFields();
      if (chosen && requiredSeats > seatsLeft(chosen)) {
        fail("Non ci sono abbastanza posti disponibili per questa serata.");
        return;
      }
      const sheetsOn = !!(window.POSTI_CONFIG || {}).url;
      if (!sheetsOn && !config.accessKey) {
        fail("Le prenotazioni online non sono ancora attive.");
        return;
      }
      if (config.accessKey) form.elements["access_key"].value = config.accessKey;
      const originalLabel = button.innerHTML;
      button.disabled = true;
      button.textContent = "Invio in corso…";
      const restore = () => {
        button.disabled = false;
        button.innerHTML = originalLabel;
        renderBookingPicker();
      };

      try {
        let reserved = false;
        if (sheetsOn) {
          const result = await reserveSeatsWithSelection(form, chosen);
          if (result.status === "ok") {
            reserved = true;
          } else if (result.status === "rejected") {
            fail(result.message);
            restore();
            await window.loadAvailability();
            return;
          } else {
            fail("Non è stato possibile verificare e salvare i posti su Google Sheets. La prenotazione non è stata inviata: riprova tra poco.");
            restore();
            return;
          }
        }

        let notified = false;
        let apiMessage = "";
        if (config.accessKey) {
          try {
            const response = await fetch(form.action, {
              method: "POST",
              headers: { Accept: "application/json" },
              body: new FormData(form)
            });
            const data = await response.json().catch(() => ({}));
            notified = response.ok && !!data.success;
            apiMessage = data.message || "";
          } catch (error) {
            console.warn("Web3Forms non raggiungibile", error);
          }
        }
        if (!reserved && !notified) {
          fail("Non siamo riusciti a inviare la prenotazione" + (apiMessage ? " (" + apiMessage + ")" : "") + ". Riprova tra poco.");
          restore();
          return;
        }

        const confirmationSent = await sendConfirmationEmailWithSeats(form);
        try { sessionStorage.setItem("cf_conferma", confirmationSent ? "1" : ""); } catch (error) {}
        window.location.href = "grazie.html";
      } catch (error) {
        console.error("Errore durante la prenotazione", error);
        fail("Connessione non riuscita: riprova tra poco.");
        restore();
      }
    });
  };

  document.addEventListener("DOMContentLoaded", () => {
    setupSeatInterface();
    setupWeeklyAccordion();
    renderBookingPicker();
    renderWeeklyAvailability();
  });
})();
