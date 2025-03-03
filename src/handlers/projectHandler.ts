/**
 * Handler per le operazioni sui progetti Todoist
 */
import { getTodoistClient } from '../utils/todoistClient.js';
import { TodoistProject, CreateProjectParams } from '../types/todoist.js';
import { logger } from '../index.js';

/**
 * Recupera tutti i progetti dell'utente
 * @returns Array di progetti o null in caso di errore
 */
export async function getProjects(): Promise<TodoistProject[] | null> {
  const todoistApi = getTodoistClient();
  if (!todoistApi) {
    logger.error("Todoist API non inizializzata. Controlla il token API.");
    return null;
  }

  try {
    const response = await todoistApi.getProjects();
    // L'API Todoist potrebbe restituire un oggetto con 'results' o direttamente un array
    const projects = Array.isArray(response) ? response : 
                    response && 'results' in response ? (response.results as any) : [];
    
    logger.info(`Progetti recuperati con successo: ${projects.length} progetti`);
    return projects as TodoistProject[];
  } catch (error) {
    logger.error("Errore nel recupero dei progetti Todoist:", error);
    return null;
  }
}

/**
 * Recupera un progetto specifico tramite ID
 * @param projectId ID del progetto da recuperare
 * @returns Il progetto richiesto o null in caso di errore
 */
export async function getProject(projectId: string): Promise<TodoistProject | null> {
  const todoistApi = getTodoistClient();
  if (!todoistApi) {
    logger.error("Todoist API non inizializzata. Controlla il token API.");
    return null;
  }

  try {
    const project = await todoistApi.getProject(projectId);
    return project as unknown as TodoistProject;
  } catch (error) {
    logger.error(`Errore nel recupero del progetto Todoist ${projectId}:`, error);
    return null;
  }
}

/**
 * Crea un nuovo progetto
 * @param params Parametri per la creazione del progetto
 * @returns Il progetto creato o null in caso di errore
 */
export async function createProject(params: CreateProjectParams): Promise<TodoistProject | null> {
  const todoistApi = getTodoistClient();
  if (!todoistApi) {
    logger.error("Todoist API non inizializzata. Controlla il token API.");
    return null;
  }

  try {
    const project = await todoistApi.addProject(params);
    return project as unknown as TodoistProject;
  } catch (error) {
    logger.error("Errore nella creazione del progetto Todoist:", error);
    return null;
  }
}

/**
 * Elimina un progetto
 * @param projectId ID del progetto da eliminare
 * @returns true se l'eliminazione è avvenuta con successo, false altrimenti
 */
export async function deleteProject(projectId: string): Promise<boolean> {
  const todoistApi = getTodoistClient();
  if (!todoistApi) {
    logger.error("Todoist API non inizializzata. Controlla il token API.");
    return false;
  }

  try {
    await todoistApi.deleteProject(projectId);
    return true;
  } catch (error) {
    logger.error(`Errore nell'eliminazione del progetto Todoist ${projectId}:`, error);
    return false;
  }
} 