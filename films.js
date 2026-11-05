// MODIFICA SOLO QUESTO FILE PER AGGIORNARE FILM, DURATE (IN MINUTI), DATE, ORARI E LUOGHI.
// id: identificativo stabile della PROIEZIONE. Non cambiarlo se modifichi titolo o data.
// Per una nuova proiezione assegna sempre un id nuovo e univoco.
// legacyKey: riferimento facoltativo alle vecchie righe Google Sheets create prima degli ID.
// Se cambi titolo/data a una proiezione già presente nel vecchio foglio, NON modificare legacyKey.
// duration: numero di minuti (es. 103, senza virgolette).
// Il primo elemento è il film in evidenza sulla homepage.
const films = [
  {
    id: "cf-proj-001",
    legacyKey: "Pulp Fiction — Lunedì 9 Novembre",
    title: "Pulp Fiction",
    duration: 154,
    posterTitle: "PULP<br>FICTION",
    poster: "assets/locandine/pulp_fiction.jpg",
    genre: "Giallo/Thriller · 1994",
    description: "Si incrociano le strade di personaggi legati al crimine. Un pugile che mente a un capo banda, due sicari che discutono massaggi ai piedi e panini, una coppia che rapina una caffetteria e altri danno vita a un dramma criminale comico quanto brutale.",
    date: "Lunedì 9 Novembre",
    time: "Ore 21:00",
    venue: "Sala Simo",
    address: "Via delle Robinie 15, Roma",
    color: "terracotta"
  },
  {
    id: "cf-proj-002",
    legacyKey: "Il Favoloso Mondo di Amélie — Lunedì 16 Novembre",
    title: "Il Favoloso Mondo di Amélie",
    duration: 122,
    posterTitle: "IL FAVOLOSO<br>MONDO DI AMÉLIE",
    poster: "assets/locandine/amelie.jpg",
    genre: "Commedia · 2001",
    description: "Una giovane donna decide di cambiare in segreto la vita delle persone che incontra, riscoprendo intanto la propria.",
    date: "Lunedì 16 Novembre",
    time: "Ore 21:00",
    venue: "Sala Simo",
    address: "Via delle Robinie 15, Roma",
    color: "plum"
  },
  {
    id: "cf-proj-003",
    legacyKey: "Nuovo Cinema Paradiso — Lunedì 23 Novembre",
    title: "Nuovo Cinema Paradiso",
    duration: 155,
    posterTitle: "NUOVO CINEMA<br>PARADISO",
    poster: "assets/locandine/cinema_paradiso.jpg",
    genre: "Drammatico · 1988",
    description: "Un omaggio alla magia del grande schermo, all'amicizia e ai ricordi che ci accompagnano per tutta la vita.",
    date: "Lunedì 23 Novembre",
    time: "Ore 21:00",
    venue: "Sala Simo",
    address: "Via delle Robinie 15, Roma",
    color: "olive"
  },
  {
    id: "cf-proj-004",
    legacyKey: "The Truman Show — Lunedì 30 Novembre",
    title: "The Truman Show",
    duration: 103,
    posterTitle: "THE TRUMAN<br>SHOW",
    poster: "assets/locandine/truman_show.jpg",
    genre: "Fantascienza · 1998",
    description: "E se il mondo che conosci fosse soltanto un enorme palcoscenico? Una commedia brillante che apre molte domande.",
    date: "Lunedì 30 Novembre",
    time: "Ore 21:00",
    venue: "Sala Simo",
    address: "Via delle Robinie 15, Roma",
    color: "blue"
  },
  {
    id: "cf-proj-005",
    legacyKey: "Eternal Sunshine of the Spotless Mind — Lunedì 7 Dicembre",
    title: "Eternal Sunshine of the Spotless Mind",
    duration: 108,
    posterTitle: "THE ETHERNAL<br>SUNSHINE <br> OF THE <br> SPOTLESS MIND",
    poster: "assets/locandine/eternal_sunshine.webp",
    genre: "Romantico/Sci-fi · 2004",
    description: "Clemetine, stanca del rapporto con Joel, si fa asportare dalla mente la parte relativa alla loro storia. Quando lui lo scopre, fa lo stesso, ma durante il procedimento cambia idea.",
    date: "Lunedì 7 Dicembre",
    time: "Ore 21:00",
    venue: "Sala Simo",
    address: "Via delle Robinie 15, Roma",
    color: "blue"
  }
];

// Controlli rapidi in console: gli ID devono esserci ed essere tutti diversi.
(() => {
  const ids = films.map(film => String(film.id || '').trim());
  const missing = films.filter(film => !String(film.id || '').trim());
  const duplicates = ids.filter((id, index) => id && ids.indexOf(id) !== index);
  if (missing.length || duplicates.length) {
    console.error('Cinefriends: ogni proiezione deve avere un id univoco.', { missing, duplicates });
  }
})();
