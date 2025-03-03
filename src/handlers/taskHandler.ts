/**
 * Handler per le operazioni sulle attività Todoist
 */
import { getTodoistClient } from '../utils/todoistClient.js';
import { TodoistTask, CreateTaskParams } from '../types/todoist.js';
import { logger } from '../index.js';

/**
 * Recupera tutte le attività dell'utente
 * @returns Array di attività o null in caso di errore
 */
export async function getTasks(): Promise<TodoistTask[] | null> {
  const todoistApi = getTodoistClient();
  if (!todoistApi) {
    logger.error("Todoist API non inizializzata. Controlla il token API.");
    return null;
  }

  try {
    const response = await todoistApi.getTasks();
    // L'API Todoist potrebbe restituire un oggetto con 'results' o direttamente un array
    const tasks = Array.isArray(response) ? response : 
                 response && 'results' in response ? (response.results as any) : [];
    
    logger.info(`Attività recuperate con successo: ${tasks.length} attività`);
    return tasks as TodoistTask[];
  } catch (error) {
    logger.error("Errore nel recupero delle attività Todoist:", error);
    return null;
  }
}

/**
 * Recupera tutte le attività di un progetto specifico
 * @param projectId ID del progetto
 * @returns Array di attività del progetto o null in caso di errore
 */
export async function getTasksByProject(projectId: string): Promise<TodoistTask[] | null> {
  const todoistApi = getTodoistClient();
  if (!todoistApi) {
    logger.error("Todoist API non inizializzata. Controlla il token API.");
    return null;
  }

  try {
    const response = await todoistApi.getTasks({ projectId });
    // L'API Todoist potrebbe restituire un oggetto con 'results' o direttamente un array
    const tasks = Array.isArray(response) ? response : 
                 response && 'results' in response ? (response.results as any) : [];
    
    logger.info(`Attività del progetto ${projectId} recuperate con successo: ${tasks.length} attività`);
    return tasks as TodoistTask[];
  } catch (error) {
    logger.error(`Errore nel recupero delle attività del progetto ${projectId}:`, error);
    return null;
  }
}

/**
 * Recupera un'attività specifica tramite ID
 * @param taskId ID dell'attività da recuperare
 * @returns L'attività richiesta o null in caso di errore
 */
export async function getTask(taskId: string): Promise<TodoistTask | null> {
  const todoistApi = getTodoistClient();
  if (!todoistApi) {
    logger.error("Todoist API non inizializzata. Controlla il token API.");
    return null;
  }

  try {
    const task = await todoistApi.getTask(taskId);
    return task as unknown as TodoistTask;
  } catch (error) {
    logger.error(`Errore nel recupero dell'attività Todoist ${taskId}:`, error);
    return null;
  }
}

/**
 * Crea una nuova attività
 * @param params Parametri per la creazione dell'attività
 * @returns L'attività creata o null in caso di errore
 */
export async function createTask(params: CreateTaskParams): Promise<TodoistTask | null> {
  const todoistApi = getTodoistClient();
  if (!todoistApi) {
    logger.error("Todoist API non inizializzata. Controlla il token API.");
    return null;
  }

  try {
    // Creiamo un oggetto con i parametri formattati per l'API Todoist
    const apiParams: any = {
      content: params.content
    };
    
    // Aggiungiamo i parametri opzionali solo se sono definiti
    if (params.projectId) apiParams.projectId = params.projectId;
    if (params.priority) apiParams.priority = params.priority;
    if (params.dueString) apiParams.dueString = params.dueString;
    if (params.labels && params.labels.length > 0) apiParams.labels = params.labels;

    const task = await todoistApi.addTask(apiParams);
    return task as unknown as TodoistTask;
  } catch (error) {
    logger.error("Errore nella creazione dell'attività Todoist:", error);
    return null;
  }
}

/**
 * Completa un'attività
 * @param taskId ID dell'attività da completare
 * @returns true se il completamento è avvenuto con successo, false altrimenti
 */
export async function completeTask(taskId: string): Promise<boolean> {
  const todoistApi = getTodoistClient();
  if (!todoistApi) {
    logger.error("Todoist API non inizializzata. Controlla il token API.");
    return false;
  }

  try {
    await todoistApi.closeTask(taskId);
    return true;
  } catch (error) {
    logger.error(`Errore nel completamento dell'attività Todoist ${taskId}:`, error);
    return false;
  }
}

/**
 * Elimina un'attività
 * @param taskId ID dell'attività da eliminare
 * @returns true se l'eliminazione è avvenuta con successo, false altrimenti
 */
export async function deleteTask(taskId: string): Promise<boolean> {
  const todoistApi = getTodoistClient();
  if (!todoistApi) {
    logger.error("Todoist API non inizializzata. Controlla il token API.");
    return false;
  }

  try {
    await todoistApi.deleteTask(taskId);
    return true;
  } catch (error) {
    logger.error(`Errore nell'eliminazione dell'attività Todoist ${taskId}:`, error);
    return false;
  }
}

/**
 * Recupera le attività in scadenza oggi
 * @returns Array di attività in scadenza oggi o null in caso di errore
 */
export async function getTodayTasks(): Promise<TodoistTask[] | null> {
  const todoistApi = getTodoistClient();
  if (!todoistApi) {
    logger.error("Todoist API non inizializzata. Controlla il token API.");
    return null;
  }

  try {
    // Filtro per le attività di oggi
    const filter = "today|overdue";
    const response = await todoistApi.getTasks({ filter });
    
    // L'API Todoist potrebbe restituire un oggetto con 'results' o direttamente un array
    const tasks = Array.isArray(response) ? response : 
                 response && 'results' in response ? (response.results as any) : [];
    
    logger.info(`Attività di oggi recuperate con successo: ${tasks.length} attività`);
    return tasks as TodoistTask[];
  } catch (error) {
    logger.error("Errore nel recupero delle attività di oggi:", error);
    return null;
  }
} 