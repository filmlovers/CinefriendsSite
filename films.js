// MODIFICA SOLO QUESTO FILE PER AGGIORNARE FILM, DURATE (IN MINUTI), DATE, ORARI E LUOGHI.
// Ogni film deve avere duration: <numero di minuti>. Tutte le schermate e le email leggono questo valore.
// Il primo elemento è il film in evidenza sulla homepage.
const films = [
  {
    title: "Fight Club",
    duration: 139, // minuti
    posterTitle: "FIGHT<br>CLUB",
    poster: "assets/locandine/fight_club.jpg",
    genre: "Azione · 1999",
    description: "Fight Club è un celebre film del 1999 diretto da David Fincher e tratto dal romanzo omonimo di Chuck Palahniuk del 1996. È considerato un cult del cinema contemporaneo e un thriller psicologico d'impatto.",
    date: "Lunedì 2 Novembre",
    time: "Ore 21:00",
    venue: "Sala Simo",
    address: "Via delle Robinie 15, Roma",
    color: "terracotta"
  },
  {
    title: "Pulp Fiction",
    duration: 154, // minuti
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
    title: "Il Favoloso Mondo di Amélie",
    duration: 122, // minuti
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
    title: "Nuovo Cinema Paradiso",
    duration: 155, // minuti
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
    title: "The Truman Show",
    duration: 103, // minuti
    posterTitle: "THE TRUMAN<br>SHOW",
    poster: "assets/locandine/truman_show.jpg",
    genre: "Fantascienza · 1998",
    description: "E se il mondo che conosci fosse soltanto un enorme palcoscenico? Una commedia brillante che apre molte domande.",
    date: "Lunedì 30 Novembre",
    time: "Ore 21:00",
    venue: "Sala Simo",
    address: "Via delle Robinie 15, Roma",
    color: "blue"
  }
];
