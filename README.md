# todoist-server MCP Server

Un server MCP per interagire con il servizio Todoist

Questo server MCP basato su TypeScript consente l'interazione con Todoist attraverso il Model Context Protocol, permettendo a Claude e ad altri LLM di accedere e manipolare i tuoi progetti e attività di Todoist.

## Funzionalità

### Risorse
- Elenco e accesso a tutti i progetti Todoist tramite URI `todoist://project/{id}`
- Elenco e accesso a tutte le attività Todoist tramite URI `todoist://task/{id}`
- Visualizzazione delle attività di un progetto tramite URI `todoist://project/{id}/tasks`

### Strumenti
- `create_todoist_project` - Crea un nuovo progetto su Todoist
  - Richiede nome del progetto
  - Supporta colore opzionale

- `create_todoist_task` - Crea una nuova attività su Todoist
  - Richiede contenuto dell'attività
  - Opzionalmente specifica progetto, scadenza e priorità

- `complete_todoist_task` - Completa un'attività esistente

- `delete_todoist_project` - Elimina un progetto esistente

- `delete_todoist_task` - Elimina un'attività esistente

## Struttura del Progetto

Il progetto è organizzato in una struttura modulare:

```
src/
├── handlers/
│   ├── mcpHandlers.ts   - Handler per il protocollo MCP
│   ├── projectHandler.ts - Funzioni per gestire i progetti Todoist
│   └── taskHandler.ts   - Funzioni per gestire le attività Todoist
├── types/
│   └── todoist.ts       - Definizioni dei tipi per Todoist
├── utils/
│   └── todoistClient.ts - Inizializzazione del client Todoist
└── index.ts             - Punto di ingresso dell'applicazione
```

## Configurazione

### Token API Todoist
Per utilizzare le funzionalità di Todoist, devi configurare il tuo token API:

1. Ottieni il tuo token API da https://todoist.com/app/settings/integrations
2. Crea un file `.env` nella directory principale del progetto con il tuo token:
```
TODOIST_API_TOKEN=your_todoist_api_token_here
```

## Sviluppo

Installa le dipendenze:
```bash
npm install
```

Compila il server:
```bash
npm run build
```

Per lo sviluppo con ricompilazione automatica:
```bash
npm run watch
```

## Installazione

Per utilizzare con Claude Desktop, aggiungi la configurazione del server:

Su MacOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
Su Windows: `%APPDATA%/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "todoist-server": {
      "command": "/path/to/todoist-server/build/index.js"
    }
  }
}
```

### Debug

Poiché i server MCP comunicano tramite stdio, il debug può essere difficile. Consigliamo di utilizzare [MCP Inspector](https://github.com/modelcontextprotocol/inspector), disponibile come script:

```bash
npm run inspector
```

L'Inspector fornirà un URL per accedere agli strumenti di debug nel tuo browser.

## Esempi di utilizzo

Una volta configurato il server, potrai:
1. Visualizzare tutti i tuoi progetti Todoist
2. Creare nuovi progetti
3. Visualizzare i dettagli dei progetti esistenti
4. Visualizzare le attività di un progetto
5. Creare nuove attività
6. Completare o eliminare attività esistenti

## Estensioni future

- Supporto per etichette (labels)
- Supporto per sezioni nei progetti
- Ricerche avanzate di attività
- Prompt per analisi e statistiche sulle attività
