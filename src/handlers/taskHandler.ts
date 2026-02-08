/**
 * Handler per le operazioni sulle attività Todoist
 */
import { getTodoistClient, getApiToken } from '../utils/todoistClient.js';
import { TodoistTask, TodoistCompletedTask, CreateTaskParams, UpdateTaskParams, MoveTaskParams, GetCompletedTasksParams } from '../types/todoist.js';
import { logger } from '../index.js';
import axios from 'axios';

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

/**
 * Aggiorna un'attività esistente
 * @param taskId ID dell'attività da aggiornare
 * @param params Parametri per l'aggiornamento
 * @returns L'attività aggiornata o null in caso di errore
 */
export async function updateTask(taskId: string, params: UpdateTaskParams): Promise<TodoistTask | null> {
  const todoistApi = getTodoistClient();
  if (!todoistApi) {
    logger.error("Todoist API non inizializzata. Controlla il token API.");
    return null;
  }

  try {
    // Rimuoviamo i parametri undefined per evitare problemi
    const updateParams: any = {};
    Object.keys(params).forEach(key => {
      if (params[key as keyof UpdateTaskParams] !== undefined) {
        updateParams[key] = params[key as keyof UpdateTaskParams];
      }
    });

    const updatedTask = await todoistApi.updateTask(taskId, updateParams);
    logger.info(`Attività ${taskId} aggiornata con successo`);
    return updatedTask as unknown as TodoistTask;
  } catch (error) {
    logger.error(`Errore nell'aggiornamento dell'attività Todoist ${taskId}:`, error);
    return null;
  }
}

/**
 * Sposta un'attività in un progetto, sezione o come sotto-attività
 * @param taskId ID dell'attività da spostare
 * @param params Parametri per lo spostamento (projectId, sectionId, o parentId)
 * @returns L'attività spostata o null in caso di errore
 */
export async function moveTask(taskId: string, params: MoveTaskParams): Promise<TodoistTask | null> {
  const todoistApi = getTodoistClient();
  if (!todoistApi) {
    logger.error("Todoist API non inizializzata. Controlla il token API.");
    return null;
  }

  try {
    // L'API moveTasks richiede un array di ID, quindi passiamo un array con un solo elemento
    const moveParams: any = {};
    if (params.projectId) moveParams.projectId = params.projectId;
    if (params.sectionId) moveParams.sectionId = params.sectionId;
    if (params.parentId) moveParams.parentId = params.parentId;

    const movedTasks = await todoistApi.moveTasks([taskId], moveParams);
    const movedTask = movedTasks[0];

    if (movedTask) {
      logger.info(`Attività ${taskId} spostata con successo`);
    }

    return movedTask as unknown as TodoistTask;
  } catch (error) {
    logger.error(`Errore nello spostamento dell'attività Todoist ${taskId}:`, error);
    return null;
  }
}

/**
 * Riapre un'attività completata
 * @param taskId ID dell'attività da riaprire
 * @returns true se la riapertura è avvenuta con successo, false altrimenti
 */
export async function reopenTask(taskId: string): Promise<boolean> {
  const todoistApi = getTodoistClient();
  if (!todoistApi) {
    logger.error("Todoist API non inizializzata. Controlla il token API.");
    return false;
  }

  try {
    await todoistApi.reopenTask(taskId);
    logger.info(`Attività ${taskId} riaperta con successo`);
    return true;
  } catch (error) {
    logger.error(`Errore nella riapertura dell'attività Todoist ${taskId}:`, error);
    return false;
  }
}

/**
 * Recupera le attività completate in un intervallo di date
 * @param params Parametri per il filtro (since, until, projectId, limit)
 * @returns Array di attività completate o null in caso di errore
 */
export async function getCompletedTasks(params?: GetCompletedTasksParams): Promise<TodoistCompletedTask[] | null> {
  const todoistApi = getTodoistClient();
  if (!todoistApi) {
    logger.error("Todoist API non inizializzata. Controlla il token API.");
    return null;
  }

  try {
    // Otteniamo il token API per fare la chiamata diretta alla Sync API
    const token = getApiToken();
    if (!token) {
      logger.error("Token API non trovato. Assicurati che il client sia inizializzato con --token");
      return null;
    }

    // Costruiamo l'URL della Sync API per i task completati
    const url = 'https://api.todoist.com/sync/v9/completed/get_all';

    // Costruiamo i parametri per l'API
    const apiParams: any = {};
    if (params?.since) {
      apiParams.since = params.since;
    } else {
      // Se non specificato, usiamo l'inizio di oggi come default
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
      apiParams.since = startOfDay.toISOString();
    }
    if (params?.until) {
      apiParams.until = params.until;
    }
    if (params?.projectId) {
      apiParams.project_id = params.projectId;
    }
    if (params?.limit) {
      apiParams.limit = params.limit;
    }

    // Facciamo la chiamata direttamente alla Sync API
    const response = await axios.get(url, {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      params: apiParams
    });

    // La risposta ha una struttura: { items: [], projects: [] }
    const items = response.data?.items || [];

    // Trasformiamo i dati da snake_case a camelCase per compatibilità con l'interfaccia
    const tasks: TodoistCompletedTask[] = items.map((item: any) => ({
      id: item.id || item.task_id,
      content: item.content,
      completedAt: item.completed_at,
      projectId: item.project_id || item.v2_project_id,
      priority: item.priority,
      taskId: item.task_id,
      userId: item.user_id,
      v2TaskId: item.v2_task_id,
      v2ProjectId: item.v2_project_id,
      v2SectionId: item.v2_section_id,
      sectionId: item.section_id,
      noteCount: item.note_count,
      notes: item.notes,
      // Manteniamo anche i campi originali per retrocompatibilità
      ...item
    }));

    logger.info(`Attività completate recuperate con successo: ${tasks.length} attività`);
    return tasks;
  } catch (error: any) {
    // Log dettagliato per errori axios
    if (error.response) {
      // Il server ha risposto con uno status code fuori dal range 2xx
      logger.error("Errore nel recupero delle attività completate Todoist - Response error:", {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
        headers: error.response.headers
      });
    } else if (error.request) {
      // La richiesta è stata fatta ma non c'è stata risposta
      logger.error("Errore nel recupero delle attività completate Todoist - No response:", {
        request: error.request
      });
    } else {
      // Errore nella configurazione della richiesta
      logger.error("Errore nel recupero delle attività completate Todoist - Request setup:", {
        message: error.message,
        error: error
      });
    }
    return null;
  }
}

/**
 * Recupera le attività completate oggi
 * @returns Array di attività completate oggi o null in caso di errore
 */
export async function getTodayCompletedTasks(): Promise<TodoistCompletedTask[] | null> {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

  return getCompletedTasks({
    since: startOfDay.toISOString(),
    until: endOfDay.toISOString()
  });
}

/**
 * Recupera le attività completate questa settimana
 * @returns Array di attività completate questa settimana o null in caso di errore
 */
export async function getWeekCompletedTasks(): Promise<TodoistCompletedTask[] | null> {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 = domenica, 1 = lunedì, etc.
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - dayOfWeek);
  startOfWeek.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  return getCompletedTasks({
    since: startOfWeek.toISOString(),
    until: endOfWeek.toISOString()
  });
} 