// EMAIL DI CONFERMA (EMAILJS) — facoltativa.
// Dopo una prenotazione riuscita, chi ha prenotato riceve un'email con i link per aggiungere la serata al calendario.
// Compila i tre campi seguendo la guida nel README (punto 6). Se restano vuoti, l'email non viene inviata
// e il resto del sito funziona normalmente.
window.CONFERMA_CONFIG = {
  publicKey: "D4otYMm8a2Z7brOsl",   // EmailJS > Account > General > Public Key
  serviceId: "service_rontof4",   // EmailJS > Email Services > Service ID (es. "service_xxxxxxx")
  templateId: "template_hlp203s"   // EmailJS > Email Templates > Template ID (es. "template_xxxxxxx")
};
