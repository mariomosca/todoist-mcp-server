/**
 * Inizializzazione e gestione del client Todoist
 */
import { TodoistApi } from "@doist/todoist-api-typescript";
import dotenv from 'dotenv';

// Carica le variabili d'ambiente
dotenv.config();

// Inizializza l'API Todoist con il token
let todoistApi: TodoistApi | null = null;
let storedApiToken: string | null = null;

/**
 * Inizializza il client Todoist
 * @param tokenOverride Token opzionale da usare al posto della variabile d'ambiente
 * @returns Il client Todoist o null se non è possibile inizializzarlo
 */
export function initTodoistClient(tokenOverride?: string): TodoistApi | null {
  const apiToken = tokenOverride || process.env.TODOIST_API_TOKEN;
  if (!apiToken) {
    console.error("TODOIST_API_TOKEN non trovato nelle variabili d'ambiente. La funzionalità Todoist sarà disabilitata.");
    return null;
  }
  storedApiToken = apiToken;
  todoistApi = new TodoistApi(apiToken);
  return todoistApi;
}

/**
 * Ottiene l'istanza del client Todoist
 * @param tokenOverride Token opzionale da usare al posto della variabile d'ambiente
 * @returns Il client Todoist o null se non è inizializzato
 */
export function getTodoistClient(tokenOverride?: string): TodoistApi | null {
  if (!todoistApi && tokenOverride) {
    return initTodoistClient(tokenOverride);
  }
  if (!todoistApi) {
    return initTodoistClient();
  }
  return todoistApi;
}

/**
 * Ottiene il token API memorizzato
 * @returns Il token API o null se non inizializzato
 */
export function getApiToken(): string | null {
  return storedApiToken;
}