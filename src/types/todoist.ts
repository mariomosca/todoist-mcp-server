/**
 * Tipi per l'API Todoist
 */

/**
 * Interfaccia per un progetto Todoist
 */
export interface TodoistProject {
  id: string;
  name: string;
  color?: string;
  // Altre proprietà che potrebbero essere presenti
  [key: string]: any;
}

/**
 * Interfaccia per un'attività Todoist
 */
export interface TodoistTask {
  id: string;
  content: string;
  projectId?: string;
  priority?: number;
  due?: {
    date: string;
    string: string;
    isRecurring: boolean;
  };
  labels?: string[];
  // Altre proprietà che potrebbero essere presenti
  [key: string]: any;
}

/**
 * Parametri per la creazione di un progetto
 */
export interface CreateProjectParams {
  name: string;
  color?: string;
  parentId?: string;
  // Altri parametri supportati
  [key: string]: any;
}

/**
 * Parametri per la creazione di un'attività
 */
export interface CreateTaskParams {
  content: string;
  projectId?: string;
  priority?: number;
  dueString?: string;
  dueDate?: string;
  labels?: string[];
  // Altri parametri supportati
  [key: string]: any;
}

/**
 * Parametri per l'aggiornamento di un'attività
 */
export interface UpdateTaskParams {
  content?: string;
  description?: string;
  labels?: string[];
  priority?: number;
  dueString?: string;
  dueLang?: string | null;
  assigneeId?: string | null;
  deadlineDate?: string | null;
  deadlineLang?: string | null;
  dueDate?: string;
  dueDatetime?: string;
  duration?: number;
  durationUnit?: string;
  // Altri parametri supportati
  [key: string]: any;
}

/**
 * Parametri per lo spostamento di attività
 */
export interface MoveTaskParams {
  projectId?: string;
  sectionId?: string;
  parentId?: string;
}

/**
 * Parametri per il recupero delle attività completate
 */
export interface GetCompletedTasksParams {
  since?: string;  // ISO 8601 date string (es. "2026-02-06T00:00:00Z")
  until?: string;  // ISO 8601 date string (es. "2026-02-06T23:59:59Z")
  projectId?: string;
  limit?: number;
}

/**
 * Interfaccia per un'attività completata Todoist
 */
export interface TodoistCompletedTask {
  id: string;
  content: string;
  completedAt: string;
  projectId?: string;
  priority?: number;
  due?: {
    date: string;
    string: string;
    isRecurring: boolean;
  };
  labels?: string[];
  // Altre proprietà che potrebbero essere presenti
  [key: string]: any;
} 