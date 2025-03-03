#!/usr/bin/env node

/**
 * Todoist MCP Server
 * 
 * Un server MCP che consente l'interazione con il servizio Todoist.
 * Il server espone risorse e strumenti per gestire progetti e attività.
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { ListPromptsRequestSchema, GetPromptRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { setupHandlers } from './handlers/mcpHandlers.js';
import { getTodoistClient } from './utils/todoistClient.js';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Sistema di logging personalizzato che non interferisce con stdio
 */
export const logger = {
  // Definiamo il path del file di log
  logFile: path.join(process.cwd(), 'todoist-mcp-server.log'),
  
  // Funzione helper per scrivere su file
  _writeToFile(message: string) {
    try {
      fs.appendFileSync(this.logFile, message + '\n');
    } catch (error) {
      // Non possiamo usare console.* qui per evitare ricorsione
    }
  },
  
  info(message: string, ...args: any[]) {
    const formattedMessage = `[INFO] ${new Date().toISOString()} - ${message} ${args.length ? JSON.stringify(args) : ''}`;
    this._writeToFile(formattedMessage);
  },
  
  warn(message: string, ...args: any[]) {
    const formattedMessage = `[WARN] ${new Date().toISOString()} - ${message} ${args.length ? JSON.stringify(args) : ''}`;
    this._writeToFile(formattedMessage);
  },
  
  error(message: string, ...args: any[]) {
    const formattedMessage = `[ERROR] ${new Date().toISOString()} - ${message} ${args.length ? JSON.stringify(args) : ''}`;
    this._writeToFile(formattedMessage);
  }
};

/**
 * Crea e configura un server MCP per Todoist
 */
const server = new Server(
  {
    name: "todoist-server",
    version: "0.1.0",
    description: "Server MCP per Todoist. Usa le RISORSE per leggere progetti e attività (todoist://...), e i TOOLS per creare/modificare/eliminare."
  },
  {
    capabilities: {
      resources: {
        list: true,
        read: true,
        write: false,
        delete: false,
        description: "Usa le risorse per leggere progetti e attività. Esempi: todoist://today/tasks, todoist://project/{id}, todoist://task/{id}"
      },
      tools: {
        description: "Usa i tools solo per operazioni di modifica come creare, completare o eliminare progetti e attività"
      },
      prompts: {},
    },
  }
);

logger.info("Initializing server...");

// Verifica se è stato fornito un token come argomento
const args = process.argv.slice(2);
let apiToken: string | undefined;

// Cerca un argomento --token o -t
for (let i = 0; i < args.length; i++) {
  if ((args[i] === '--token' || args[i] === '-t') && i + 1 < args.length) {
    apiToken = args[i + 1];
    break;
  }
}

// Inizializza il client Todoist
const todoistClient = getTodoistClient(apiToken);
if (!todoistClient) {
  logger.warn("Il client Todoist non è inizializzato. Imposta TODOIST_API_TOKEN nel file .env o usa --token quando avvii il server");
}

// Configura gli handler per progetti e attività
setupHandlers(server);

// Handler per le liste di prompt (sono inclusi per possibili estensioni future)
server.setRequestHandler(ListPromptsRequestSchema, async () => {
  return {
    prompts: [
      {
        name: "todoist_overview",
        description: "Genera un riepilogo dello stato di Todoist",
      }
    ]
  };
});

// Handler per i prompt (sono inclusi per possibili estensioni future)
server.setRequestHandler(GetPromptRequestSchema, async (request) => {
  if (request.params.name !== "todoist_overview") {
    throw new Error("Prompt sconosciuto");
  }

  return {
    messages: [
      {
        role: "user",
        content: {
          type: "text",
          text: "Genera un riepilogo dello stato attuale di Todoist, inclusi progetti e attività."
        }
      }
    ]
  };
});

// Avvia il server
const transport = new StdioServerTransport();
server.connect(transport).catch((error) => {
  logger.error("Errore durante l'avvio del server:", error);
  process.exit(1);
});

logger.info("Server started and connected successfully");
