# ChatGPT → Markdown (Side Panel)

> ℹ️ **Versione 1.1** – Questa release introduce un'ulteriore robustezza contro i cambiamenti del DOM di ChatGPT, così l'export rimane affidabile anche dopo gli aggiornamenti dell'interfaccia.

> 🦊 **Stato pubblicazione:** l'estensione è stata inviata su Firefox Add-ons ed è attualmente in revisione.

Estensione Firefox (Manifest V2) pensata per esportare una conversazione di ChatGPT in Markdown con un singolo clic, direttamente dall'interfaccia ufficiale di ChatGPT/ChatGPT.com. Il risultato viene mostrato in una tendina laterale in-page da cui è possibile copiare, aggiornare o chiudere il pannello senza ricaricare la pagina.

## ✨ Caratteristiche principali
- **Side panel contestuale** – Il pannello viene iniettato nella pagina corrente e può essere aperto/chiuso con l'icona dell'estensione.
- **Aggiornamento on-demand** – Rigenera il Markdown della conversazione ogni volta che apri il pannello o premi "Aggiorna".
- **Copia negli appunti** – Copia l'intero contenuto Markdown con feedback visivo sullo stato dell'operazione.
- **Parsing robusto** – I selettori di fallback assicurano la compatibilità con i cambi DOM di ChatGPT.
- **Serializzazione configurabile** – Supporto per diversi "flavour" Markdown (Base, GFM, Obsidian) con gestione di tabelle, code fence e blocchi matematici.
- **Privacy by design** – Nessuna chiamata esterna: l'intero export avviene localmente nel browser.

## 🚀 Installazione
### Caricamento temporaneo (sviluppo/test)
1. Apri Firefox e visita `about:debugging`.
2. Seleziona **Questo Firefox** nella sidebar.
3. Clicca su **Carica componente aggiuntivo temporaneo…**.
4. Seleziona il file `manifest.json` contenuto nella cartella del progetto.
5. Vai su [chat.openai.com](https://chat.openai.com) o [chatgpt.com](https://chatgpt.com) e premi l'icona dell'estensione per aprire il pannello.

> ℹ️ Fino all'approvazione sullo store, questo è il metodo consigliato per provare l'estensione.

## 🧭 Utilizzo
1. Apri una conversazione ChatGPT.
2. Premi l'icona di **ChatGPT → Markdown** nella toolbar di Firefox.
3. La tendina laterale appare sulla destra con il contenuto formattato in Markdown.
4. Usa i pulsanti **Aggiorna**, **Copia** o **Chiudi** in base alle necessità.
5. Cliccando fuori dal pannello questo si chiuderà automaticamente.

## 🧱 Struttura del progetto
```
chatgpt-md-sidepanel/
├── manifest.json            # Configurazione dell'estensione
├── background.js            # Gestione click sull'icona e messaggistica
├── content.js               # Creazione UI, toggle del pannello e interazioni utente
├── utils/
│   ├── exporter.js          # Coordinamento export + lettura preferenze flavour
│   ├── extractors.js        # Selettori resilienti e detection ruolo messaggio
│   ├── markdown.js          # (legacy) helper vari
│   └── markdownFlavours.js  # Serializzazione Markdown con più flavour
└── icons/
    ├── icon-48.png
    └── icon-96.png
```

## 🧩 Flavour Markdown disponibili
Il modulo `utils/markdownFlavours.js` espone una mappa `flavours` con tre profili predefiniti:
- `base`: Markdown minimale con normalizzazione degli spazi (default).
- `gfm`: GitHub Flavoured Markdown con supporto per tabelle e formule `$…$`.
- `obsidian`: pensato per Obsidian, evita la compressione delle nuove righe.

La preferenza viene letta da `browser.storage.sync` (chiave `markdownFlavour`). È possibile modificarla manualmente dalla console del browser:
```js
await browser.storage.sync.set({ markdownFlavour: 'gfm' });
```
Il prossimo export userà automaticamente il nuovo flavour.

## 🛠️ Debug e sviluppo
- **Log**: background e content script utilizzano `console.log`/`console.error`; controlla il pannello di debug del componente aggiuntivo per i messaggi.
- **Hot reload rudimentale**: se il content script non risponde al click, il background forza il `tab.reload()` come fallback.
- **Script modulari**: `content.js` carica `utils/exporter.js` dinamicamente tramite `import()` per ridurre l'impatto iniziale.

## 🔧 Adattarsi ai cambi DOM di ChatGPT
Se l'estensione smette di leggere correttamente i messaggi dopo un aggiornamento dell'interfaccia ChatGPT:
1. Aggiorna l'array `messageSelectors` in `utils/extractors.js` con i nuovi selettori individuati.
2. Assicurati che `getMarkdownContainer` punti ancora al nodo che contiene il markup della risposta.
3. Verifica l'estrazione con `window.__exportConversation()` dalla console del sito.

## 🔒 Permessi richiesti
- `activeTab` per interagire con la pagina corrente.
- `clipboardWrite` per copiare negli appunti.
- `storage` per ricordare il flavour Markdown preferito.
- Accesso alle origin `https://chat.openai.com/*` e `https://chatgpt.com/*` dove viene eseguito il content script.

## ❓ FAQ veloci
- **Posso usare l'estensione su Chromium?** Attualmente il progetto è ottimizzato per Firefox (Manifest V2). Per Chromium servirebbe il porting a Manifest V3.
- **È previsto un packaging automatico?** Al momento no: l'installazione temporanea è sufficiente per i test durante la revisione.
- **Dove segnalare bug/migliorie?** Apri un'issue o contattami dal [blog personale](https://5m1.ovh).

---
Realizzata con ❤️ per semplificare l'archiviazione delle chat più importanti.
