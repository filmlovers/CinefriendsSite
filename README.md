CINEFREINDS — SITO WEB STATICO

CONTENUTO
- index.html: homepage, film della settimana, programmazione e modulo prenotazioni.
- styles.css: grafica responsive per computer e smartphone.
- films.js: elenco dei film e dati da aggiornare ogni settimana.
- script.js: visualizzazione automatica di film e programmazione.
- grazie.html: pagina mostrata dopo l'invio del modulo.

1. PERSONALIZZARE I FILM
Apri films.js con un editor di testo. Modifica i film, le date, l'orario, la sala e l'indirizzo.
Il primo film nell'elenco è quello mostrato in homepage. Aggiungi o rimuovi oggetti seguendo la stessa struttura.
I poster sono grafiche tipografiche originali, non locandine ufficiali. Puoi sostituirli con immagini autorizzate.

2. ATTIVARE LE PRENOTAZIONI (WEB3FORMS, GRATUITO)
Il modulo usa Web3Forms (piano gratuito: 250 invii al mese; verifica i limiti aggiornati su web3forms.com/pricing).
- Vai su https://web3forms.com, inserisci l'email che riceverà le prenotazioni e copia la "Access Key" che ti arriva.
- Apri prenotazioni-config.js e incolla la chiave in accessKey. La chiave serve solo a inviare i moduli e può stare nel sito pubblico.
- (Facoltativo) In fallbackEmail inserisci un indirizzo: se l'invio fallisce, si apre l'app di posta con la prenotazione già scritta. L'indirizzo sarà visibile a chiunque legga il codice della pagina.
- Pubblica il sito e invia una prenotazione di prova. Finché accessKey è vuoto il modulo mostra un avviso e non invia nulla.
- Più destinatari: nel piano gratuito la chiave ha una sola email. Per avvisare due persone usa una regola di inoltro automatico nella casella che riceve le prenotazioni.
Nota privacy: il modulo raccoglie nome, email e numero di posti. Inserisci sul sito un'informativa privacy adeguata al tuo caso e raccogli solo i dati necessari. Il testo di consenso incluso è un promemoria essenziale, non sostituisce un'informativa GDPR completa.

3. PUBBLICARE GRATIS CON GITHUB PAGES
- Crea un account gratuito su GitHub.
- Crea un nuovo repository pubblico, ad esempio "cineforum".
- Carica tutti i file mantenendo la struttura.
- Vai in Settings > Pages.
- In "Build and deployment" scegli "Deploy from a branch", branch "main" e cartella "/ (root)", poi salva.
- Dopo qualche minuto GitHub mostrerà l'indirizzo pubblico del sito nella sezione Pages.

ALTERNATIVA
Puoi caricare la cartella su Netlify Drop per una pubblicazione rapida; verifica le condizioni del piano gratuito e configura il dominio se necessario.

NOTE
Il sito è statico: non serve acquistare un dominio o un hosting per iniziare. Per le prenotazioni serve inserire la chiave Web3Forms in prenotazioni-config.js come descritto sopra.


4. ATTIVARE LA SEZIONE PROPOSTE (COMMENTI CON GISCUS)
Giscus salva i commenti nelle "Discussions" di un repository GitHub pubblico. I visitatori accedono (o si registrano) con GitHub.
- Usa il repository pubblico del sito. In Settings > General > Features attiva "Discussions".
- Nella tab Discussions crea una categoria "Proposte" di tipo "Announcements" (solo i maintainer creano discussioni, tutti commentano).
- Installa l'app Giscus: https://github.com/apps/giscus (concedi l'accesso al repository).
- Vai su https://giscus.app, inserisci il repository, scegli la categoria "Proposte" e la modalità "Titolo della pagina/Specifica".
- Copia i valori data-repo, data-repo-id e data-category-id nel file giscus-config.js (campi repo, repoId, categoryId).
- Pubblica: i commenti compaiono nella sezione Proposte. Finché il file è vuoto, il sito mostra un avviso.
Nota: il sito non può avere un proprio modulo di registrazione GitHub. La sezione spiega come creare l'account (https://github.com/signup) e il riquadro dei commenti mostra il pulsante "Sign in with GitHub".

5. IMMAGINE HOMEPAGE
L'illustrazione in homepage è assets/hero-cinefriends.svg. Per usare una foto, salvala in assets/ e cambia il percorso nel tag <img class="hero-img"> di index.html.

6. EMAIL DI CONFERMA CON PROMEMORIA PER IL CALENDARIO (EMAILJS, FACOLTATIVA)
Dopo una prenotazione riuscita, chi ha prenotato riceve un'email con i pulsanti "Google Calendar" e "Apple / Outlook (.ics)".
EmailJS ha un piano gratuito (circa 200 richieste al mese: verifica i limiti aggiornati su emailjs.com/pricing).
- Crea un account su https://www.emailjs.com e collega la tua casella in "Email Services" (es. Gmail): annota il Service ID.
- In "Email Templates" crea un template e segui le istruzioni in cima al file email-conferma-template.html: annota il Template ID.
- Da Account > General copia la Public Key.
- Incolla i tre valori in conferma-config.js (publicKey, serviceId, templateId) e pubblica.
- Consigliato: nelle impostazioni di sicurezza di EmailJS limita l'uso della chiave al dominio del tuo sito.
Se conferma-config.js è vuoto, l'email non viene inviata e le prenotazioni funzionano comunque.
Date: l'orario del calendario si legge da "date" e "time" in films.js (es. "Lunedì 9 Novembre", "Ore 21:00"). Se vuoi essere preciso, aggiungi al film start: "2026-11-09T21:00" (e duration: 150 per la durata in minuti).
Il file calendario.html genera il promemoria (.ics) con avvisi il giorno prima e due ore prima.

7. POSTI IN AUTOMATICO CON GOOGLE SHEETS (FACOLTATIVO)
Ogni prenotazione viene scritta in un foglio Google e il contatore dei posti si aggiorna da solo. Il controllo dei posti avviene sul foglio, quindi non si può superare la capienza nemmeno con richieste simultanee. Ogni richiesta conta subito, senza conferma manuale.
- Crea un foglio Google (sheets.new). Il foglio "Prenotazioni" con le colonne si crea da solo alla prima richiesta.
- Nel foglio: Estensioni > Apps Script. Cancella il codice di esempio, incolla il contenuto di google-sheets/Code.gs e salva.
- In alto: Distribuisci > Nuova distribuzione. Tipo: "Applicazione web". Esegui come: "Me". Chi ha accesso: "Chiunque". Clicca Distribuisci.
- Autorizza l'accesso con il tuo account Google (se compare "app non verificata": Avanzate > Vai a ... > Consenti).
- Copia l'indirizzo "Applicazione web" (finisce con /exec) e incollalo in posti-config.js nel campo url.
- Prova: apri nel browser l'indirizzo seguito da ?action=availability. Deve comparire un testo che inizia con {"ok":true.
- Pubblica il sito. Se un giorno modifichi Code.gs: Distribuisci > Gestisci distribuzioni > matita > Versione: "Nuova versione" > Distribuisci.
Gestione:
- Annullare una prenotazione: cancella la riga oppure scrivi 0 nella colonna "Posti". I posti tornano subito disponibili.
- Capienza: in Code.gs, CAPIENZA (default 7). Per una serata diversa crea un foglio "Capienze": colonna A = testo esatto della colonna "Film" (es. "Pulp Fiction — Lunedì 9 Novembre"), colonna B = posti totali.
- Il foglio contiene nomi ed email: non condividerlo con nessuno. Il sito legge solo il numero di posti occupati per film.
- Quando il foglio è attivo, seats e booked in films.js non servono più (restano come riserva se il foglio non risponde).
- Le email di avviso (Web3Forms) e di conferma (EmailJS) continuano a funzionare come prima.
