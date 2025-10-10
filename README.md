> 🦊 **Aggiornamento:** L’estensione è stata pubblicata su Firefox Add-ons ed è attualmente in attesa di revisione.

# ChatGPT → Markdown (Side Panel)

Estensione Firefox (Manifest V2) che esporta conversazioni ChatGPT in formato Markdown con un semplice clic.

## Caratteristiche

- ✨ **Side Panel In-Page**: tendina laterale che si sovrappone alla pagina ChatGPT
- 📋 **Copia Rapida**: copia il Markdown negli appunti con un clic
- 🔄 **Aggiornamento Live**: rigenera il contenuto quando necessario
- 🎯 **Markdown Completo**: supporto per code blocks, tabelle GFM, formattazione inline
- 🔒 **Privacy First**: tutto funziona in locale, nessuna chiamata esterna

## Installazione

### Caricamento Temporaneo (Sviluppo)

1. Apri Firefox e vai su `about:debugging`
2. Clicca su "Questo Firefox" nella barra laterale
3. Clicca su "Carica componente aggiuntivo temporaneo..."
4. Naviga alla cartella del progetto e seleziona il file `manifest.json`
5. L'estensione è ora attiva!

### Test

1. Vai su [chat.openai.com](https://chat.openai.com)
2. Apri una conversazione esistente o avviane una nuova
3. Clicca sull'icona dell'estensione nella toolbar
4. Vedrai apparire la tendina laterale con il Markdown della conversazione
5. Usa i pulsanti per aggiornare, copiare o chiudere

## Struttura del Progetto
chatgpt-markdown-sidepanel/
├── manifest.json          # Configurazione estensione
├── background.js          # Service worker per gestire eventi
├── content.js             # UI e logica della tendina
├── utils/
│   ├── markdown.js        # Helper formattazione Markdown
│   └── extractors.js      # Estrazione contenuto ChatGPT
└── icons/                 # Icone dell'estensione
├── icon-48.png
└── icon-96.png

## Funzionalità Supportate

### Formattazione Testo
- **Grassetto**: `**testo**`
- **Corsivo**: `*testo*`
- **Grassetto+Corsivo**: `***testo***`
- **Barrato**: `~~testo~~`
- **Codice inline**: `` `codice` ``
- **Link**: `[testo](url)`
- **Immagini**: `![alt](src)`

### Strutture Complesse
- **Intestazioni**: `#` fino a `######`
- **Liste non ordinate**: `- item`
- **Liste ordinate**: `1. item`
- **Task list**: `- [x]` / `- [ ]`
- **Blockquote**: `> testo`
- **Tabelle GFM**: supporto completo
- **Blocchi di codice**: con syntax highlighting
- **Linee orizzontali**: `---`

### Elementi Avanzati
- **Math inline/display**: `$formula$` / `$$formula$$`
- **Details/Summary**: mantiene HTML nativo
- **HTML inline**: `<u>`, `<sup>`, `<sub>`, `<kbd>`

## Adattamento ai Cambi DOM

Se ChatGPT aggiorna la sua interfaccia e l'estensione smette di funzionare, modifica i selettori in `utils/extractors.js`:
```javascript
// Cerca questa sezione in extractors.js
const messageSelectors = [
  '[data-message-author-role]',      // Selettore principale
  '[data-testid^="conversation-turn"]', // Fallback 1
  '.group.w-full',                    // Fallback 2
  'article[class*="message"]'         // Fallback 3
];
