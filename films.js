// MODIFICA SOLO QUESTO FILE PER AGGIORNARE FILM, DURATE (IN MINUTI), DATE, ORARI E LUOGHI.
// id: identificativo stabile della PROIEZIONE. Non cambiarlo se modifichi titolo o data.
// Per una nuova proiezione assegna sempre un id nuovo e univoco.
// legacyKey: riferimento facoltativo alle vecchie righe Google Sheets create prima degli ID.
// Se cambi titolo/data a una proiezione già presente nel vecchio foglio, NON modificare legacyKey.
// duration: numero di minuti (es. 103, senza virgolette).
// Il primo elemento è il film in evidenza sulla homepage.

//TEMPLATE

/*{
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
    venue: "Sala Smio",
    address: "Via delle Robinie 15, Roma",
    color: "terracotta"
  }

    {
    id: "cf-proj-005",
    legacyKey: "Eternal Sunshine of the Spotless Mind — Lunedì 7 Dicembre",
    title: "Eternal Sunshine of the Spotless Mind",
    duration: 108,
    posterTitle: "ETHERNAL<br>SUNSHINE<br>OF THE SPOTLESS MIND",
    poster: "assets/locandine/eternal_sunshine.webp",
    genre: "Romantico/Sci-fi · 2004",
    description: "Clemetine, stanca del rapporto con Joel, si fa asportare dalla mente la parte relativa alla loro storia. Quando lui lo scopre, fa lo stesso, ma durante il procedimento cambia idea.",
    date: "Lunedì 7 Dicembre",
    time: "Ore 21:00",
    venue: "Sala Smio",
    address: "Via delle Robinie 15, Roma",
    color: "blue"
  }
*/

const films = [
  {
    id: "cf-proj-001",
    legacyKey: "The Truman Show — Lunedì 16 Novembre",
    title: "The Truman Show",
    duration: 103,
    posterTitle: "THE TRUMAN<br>SHOW",
    poster: "assets/locandine/truman_show.jpg",
    genre: "Fantascienza · 1998",
    description: "E se il mondo che conosci fosse soltanto un enorme palcoscenico? Una commedia brillante che apre molte domande.",
    date: "Lunedì 16 Novembre",
    time: "Ore 21:00",
    venue: "Sala Lò",
    address: "Viale Val Padana 126, Roma",
    color: "plum"
  },
  {
    id: "cf-proj-002",
    legacyKey: "The Prestige — Lunedì 23 Novembre",
    title: "The Prestige",
    duration: 130,
    posterTitle: "THE<br>PRESTIGE",
    poster: "assets/locandine/prestige.webp",
    genre: "Thriller/Sci-fi · 2006",
    description: "Nella Londra dell'età vittoriana, due maghi-illusionisti, Robert Angier e Alfred Borden, un tempo amici e colleghi, si sfidano ogni sera a distanza mettendo in scena spettacoli al limite del possibile.",
    date: "Lunedì 23 Novembre",
    time: "Ore 21:00",
    venue: "Sala Smio",
    address: "Via delle Robinie 15, Roma",
    color: "olive"
  },
  {
    id: "cf-proj-003",
    legacyKey: "Snowpiercer— Lunedì 30 Novembre",
    title: "Snowpiercer",
    duration: 126,
    posterTitle: "SNOWPIERCER<br>",
    poster: "assets/locandine/snowpiercer.webp",
    genre: "Azione/Sci-fi · 2013",
    description: "Durante una nuova era glaciale causata da un esperimento fallito, un gruppo di sopravvissuti viaggia su di un treno speciale che non si ferma mai. Le differenze fra i passeggeri, però, portano presto alla rivolta.",
    date: "Lunedì 30 Novembre",
    time: "Ore 21:00",
    venue: "Sala Simo",
    address: "Via delle Robinie 15, Roma",
    color: "plum"
  },
  {
    id: "cf-proj-004",
    legacyKey: "The Wolf of Wall Street — Mercoledì 9 Dicembre",
    title: "The Wolf of Wall Street",
    duration: 179,
    posterTitle: "THE WOLF<br>OF WALL STREET",
    poster: "assets/locandine/wolf_of_wall_street.webp",
    genre: "Commedia/Thriller · 2013",
    description: "Nella New York degli anni Ottanta, eccessi e corruzione segnano la curva discendente della brillante carriera di Jordan Belfort, un ambizioso broker in grado di guadagnare migliaia di dollari al minuto e di spenderne altrettanti in droga e futilità.",
    date: "Mercoledì 9 Dicembre",
    time: "Ore 21:00",
    venue: "Sala Lò",
    address: "Viale Val Padana 126, Roma",
    color: "terracotta"
  },
  {
    id: "cf-proj-005",
    legacyKey: "Uncut Gems — Lunedì 14 Dicembre",
    title: "Uncut Gems",
    duration: 135,
    posterTitle: "THE WOLF<br>OF WALL STREET",
    poster: "assets/locandine/uncut_gems.webp",
    genre: "Commedia/Thriller · 2013",
    description: "Il carismatico gioielliere Howard Ratner fa una scommessa che potrebbe procurargli una grossa fortuna. L'uomo deve riuscire a conciliare gli affari, la famiglia e i suoi avversari in un gioco di equilibri precari che potrebbe costargli caro.",
    date: "Lunedì 14 Dicembre",
    time: "Ore 21:00",
    venue: "Sala Smio",
    address: "Via delle Robinie 15, Roma",
    color: "olive"
  },
  {
    id: "cf-proj-006",
    legacyKey: "The Holdovers — Lunedì 21 Dicembre",
    title: "The Holdovers",
    duration: 133,
    posterTitle: "THE<br>HOLDOVERS",
    poster: "assets/locandine/holdovers.webp",
    genre: "Commedia/Thriller · 2013",
    description: "Un insegnante scontroso è costretto a trascorrere le vacanze di Natale con un gruppo di alunni, sviluppando un'insolita relazione con un piantagrane intelligente e con il capo cuoco di una scuola del New England.",
    date: "Lunedì 21 Dicembre",
    time: "Ore 21:00",
    venue: "Sala Smio",
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
